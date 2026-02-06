# Order → OrderProduct → Insurance Flow Analysis

**Data**: January 28, 2026  
**Status**: Research & Discovery Phase Complete  
**Purpose**: Understand current Order/OrderProduct implementation to design Insurance integration

---

## 📊 RESPOSTAS ÀS 6 PERGUNTAS CRÍTICAS

### **1️⃣ CreateOrderDto: Vem com OrderProducts dentro?**

**✅ RESPOSTA: SIM**

```typescript
// CreateOrderDto CONTÉM products array
export class CreateOrderDto {
  accountGuid?: string;
  affiliateGuid?: string;
  organizationGuid: string;
  
  // ← ISTO EXISTE
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderProductDto)
  products: CreateOrderProductDto[]; // ← Array de items
  
  // ... outros campos (subtotal, total, coupon, status, etc.)
}

// Cada item no array:
export class CreateOrderProductDto {
  productId: string;              // 'osot-prod-0000048'
  productName: string;            // 'Professional Liability...'
  quantity: number;
  selectedPrice: number;
  productTaxRate: number;
  taxAmount: number;
  itemSubtotal: number;
  itemTotal: number;
}
```

**Implicação**: Order.create() recebe TODOS os items já validados no DTO.

---

### **2️⃣ Sequência de Criação**

**✅ RESPOSTA: OPÇÃO C - PADRÃO ORQUESTRADO**

```
Arquitetura ATUAL (e-commerce pattern com Redis):

┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Usuário seleciona produtos                        │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
    GET /shop              POST /cart/items
        │                         │
   OrderDraftService        OrderProductOrchestrator
   (cria DRAFT order)    (addToCart → Redux staging)
        │                         │
        ├─ getOrCreateDraft()     ├─ Valida com BusinessRules
        │  └─ Retorna orderGuid   ├─ Lookup Product
        │                          ├─ Cria snapshot
        │                          ├─ Calcula (subtotal, tax, total)
        │                          └─ Armazena em REDIS (não Dataverse!)
        │                             └─ TTL: 2 horas
        │
        └──────────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ Checkout (user finaliza)    │
        │ POST /orders/:id/checkout   │
        └────────────┬────────────────┘
                     │
    OrderProductOrchestrator.checkout()
                     │
        ├─ 1️⃣ GET items from REDIS
        ├─ 2️⃣ FINAL VALIDATION (calculations)
        ├─ 3️⃣ PERSIST TO DATAVERSE (batch create)
        │   └─ orderProductRepository.create(item)
        ├─ 4️⃣ PUBLISH EVENT (checkoutCompleted)
        ├─ 5️⃣ CLEAN REDIS (success)
        └─ 6️⃣ RETURN OrderProductResponseDto[]
```

**Diagrama Temporal**:

```
Timeline:
─────────────────────────────────────────────────────────────

T0: User opens shop
    └─ OrderDraftService.getOrCreateDraft()
       └─ Creates Order with status=DRAFT, subtotal=0, total=0
       └─ OrderProducts: empty

T1-T10: User browses & adds items
    └─ POST /cart/items repeatedly
       └─ OrderProductOrchestrator.addToCart()
          ├─ Items stored in REDIS (not Dataverse!)
          └─ Events: productAdded

T11: User reviews cart
    └─ GET /cart
       └─ OrderProductOrchestrator.getCartItems()
          └─ Read from REDIS

T12: User checkout
    └─ POST /orders/{orderGuid}/checkout
       └─ OrderProductOrchestrator.checkout()
          ├─ Get ALL items from REDIS
          ├─ Validate calculations
          ├─ BATCH INSERT to Dataverse (Promise.all)
          ├─ CLEAR REDIS
          └─ Publish checkoutCompleted event
             └─ OrderProductEventsService.publishCheckoutCompleted()

T13: Order finalized
    └─ Items now in Dataverse as OrderProduct records
    └─ Ready for Insurance creation (if category=INSURANCE)
```

**Key Insight**: Order é criado VAZIO (DRAFT). OrderProducts são adicionados em etapas via Redis, depois persistidos em BATCH no checkout.

---

### **3️⃣ Como OrderCreatedEvent Inclui OrderProducts[]?**

**⚠️ RESPOSTA: ATUALMENTE **NÃO** INCLUI**

```typescript
// OrderCreatedEvent HOJE (in order.events.ts):
export interface OrderCreatedEvent {
  orderId: string;
  orderNumber: string;
  organizationGuid: string;
  accountGuid?: string;
  affiliateGuid?: string;
  osot_total: number;
  osot_order_status: OrderStatus;
  osot_payment_status: PaymentStatus;
  createdAt: Date;
  // ❌ orderProducts: OrderProductInternal[]; // NÃO EXISTE
}

// Publicado assim (in private-order.controller.ts):
this.eventsService.publishOrderCreated({
  orderId: created.id ?? '',
  orderNumber: created.orderNumber ?? '',
  organizationGuid: created.organizationGuid ?? organizationId,
  accountGuid: created.accountGuid,
  affiliateGuid: created.affiliateGuid,
  osot_total: created.total ?? 0,
  osot_order_status: createDto.orderStatus ?? OrderStatus.DRAFT,
  osot_payment_status: createDto.paymentStatus ?? PaymentStatus.UNPAID,
  createdAt: new Date(),
  // ← Sem orderProducts
});
```

**PROBLEMA IDENTIFICADO**:
- OrderCreatedEvent é disparado do `private-order.controller.ts` (CREATE Order endpoint)
- Naquele ponto, OrderProducts ainda estão em REDIS, não em Dataverse
- Insurance creation precisa dos OrderProducts para filtrar items com category=INSURANCE

**SOLUÇÃO NECESSÁRIA**:
- OrderCreatedEvent deve ser disparado do `OrderProductOrchestrator.checkout()`
- Naquele ponto, todos os items já foram validados e estão prontos para Dataverse
- OU: Adicionar callback/listener que aguarda checkout completion

---

### **4️⃣ Como Detectar Insurance Items em OrderProducts**

**✅ RESPOSTA: CAMPO `osot_product_category` COM VALUE = `ProductCategory.INSURANCE` (1)**

```typescript
// OrderProduct fields (order-product-dataverse.interface.ts):
export interface OrderProductDataverse {
  osot_product_id?: string;           // 'osot-prod-0000048'
  osot_product_name?: string;         // 'Professional Liability - $5,000...'
  osot_insurance_type?: string;       // SNAPSHOT: 'professional', 'extended', etc.
  osot_insurance_limit?: number;      // SNAPSHOT: 50000.00
  // ... outros campos
}

// MAS NÃO TEM osot_product_category!
// Vem do Product, precisa ser capturado durante snapshot
```

**PROBLEMA IDENTIFICADO**:
- OrderProduct não armazena `osot_product_category` como snapshot
- Precisa ser adicionado ao CreateOrderProductDto e OrderProductInternal
- Depois mapeado para OrderProductDataverse

**SOLUÇÃO**:
```typescript
// CreateOrderProductDto deveria ter:
export class CreateOrderProductDto {
  // ... existing
  productId: string;
  productName: string;
  
  // NEW: Snapshot da categoria do produto
  productCategory?: ProductCategory; // ENUM value (0-10)
  osot_product_category?: number; // Dataverse choice value
  
  // Já tem (insurance snapshots):
  osot_insurance_type?: string;
  osot_insurance_limit?: number;
}

// Filter logic fica simples:
const insuranceItems = orderProducts.filter(
  op => op.osot_product_category === ProductCategory.INSURANCE // (1)
);
```

---

### **5️⃣ Quando Order é Deletada (soft-delete)**

**✅ RESPOSTA: DATAVERSE CASCADE CONFIG (não explícito no código)**

OrderProduct-Order relacionamento:

```typescript
// order-product-internal.interface.ts:
export interface OrderProductInternal {
  orderGuid: string; // ← Parent order reference
  // ... outros campos
}

// order-product-dataverse.interface.ts:
export interface OrderProductDataverse {
  _osot_order_value?: string; // ← Lookup GUID (read-only)
  // Para write, usa: osot_Order@odata.bind
}
```

**Em Dataverse (CSV config)**:
- `osot_Order` é lookup para `osot_table_order`
- Cascade delete provavelmente configurado: "Delete Order → Restrict Delete OrderProducts"

**Para Insurance**:
- Se Order.delete() → OrderProducts permanecem (soft-delete, status=Inactive)
- Insurance criados a partir desses OrderProducts também permanecem
- Fazer Insurance.delete() (status=CANCELLED) separadamente

---

### **6️⃣ OrderProduct tem `osot_insurance_type` e `osot_insurance_limit`?**

**✅ RESPOSTA: SIM - SÃO SNAPSHOTS DO PRODUCT**

```typescript
// order-product-dataverse.interface.ts:
export interface OrderProductDataverse {
  /**
   * Insurance type display value at purchase time
   * Stored as text snapshot (not a choice/enum in order-product)
   */
  osot_insurance_type?: string; // 'professional', 'extended', 'liability'

  /**
   * Insurance limit amount at purchase time (currency)
   * Snapshot of product insurance limit frozen at order creation
   */
  osot_insurance_limit?: number; // 50000.00, 100000.00, etc.

  /**
   * Additional info/notes captured from product at purchase time
   */
  osot_product_additional_info?: string;
}

// Fluxo:
Product.osot_insurance_type → CreateOrderProductDto.osot_insurance_type
                            → OrderProductInternal.osot_insurance_type
                            → OrderProductDataverse.osot_insurance_type

// SNAPSHOT CONGELADO no momento da compra
```

---

## 🏗️ ARQUITETURA ATUAL - Diagrama Completo

```
┌────────────────────────────────────────────────────────────┐
│ ORDEM (Order Entity)                                       │
│ ├─ osot_table_orderid: GUID                               │
│ ├─ osot_orderid: Auto-number (ORD-XXXXX)                 │
│ ├─ osot_status: DRAFT | FINALIZED | CANCELLED            │
│ ├─ osot_payment_status: UNPAID | PAID | REFUNDED         │
│ ├─ osot_subtotal: Calculated (sum of items)              │
│ ├─ osot_total: Calculated (with tax)                     │
│ ├─ osot_account_id?: GUID (person buyer)                 │
│ ├─ osot_affiliate_id?: GUID (company buyer)              │
│ └─ osot_organization_id: GUID (multi-tenant)             │
└────────────────────────────────────────────────────────────┘
              │
              │ 1:N Relationship
              │ (lookup: osot_Order@odata.bind)
              │
              ▼
┌────────────────────────────────────────────────────────────┐
│ ORDEM PRODUTO (OrderProduct Entity)                        │
│ ├─ osot_table_order_productid: GUID                       │
│ ├─ osot_orderproductid: Auto-number                       │
│ ├─ _osot_order_value: Parent Order GUID                   │
│ │                                                          │
│ │ SNAPSHOT FIELDS (immutable at creation):               │
│ ├─ osot_product_id: 'osot-prod-XXXXX'                    │
│ ├─ osot_product_name: 'Professional Liability...'        │
│ ├─ osot_insurance_type: 'professional' (snapshot)        │
│ ├─ osot_insurance_limit: 50000.00 (snapshot)             │
│ ├─ osot_product_category: 0-10 (INSURANCE=1) [MISSING]   │
│ │                                                          │
│ │ QUANTITY & PRICING:                                    │
│ ├─ osot_quantity: 1                                      │
│ ├─ osot_selectedprice: 79.00                             │
│ ├─ osot_producttax: 13                                   │
│ │                                                          │
│ │ CALCULATED (immutable snapshot):                       │
│ ├─ osot_itemsubtotal: price × quantity                   │
│ ├─ osot_taxamount: subtotal × (tax / 100)               │
│ └─ osot_itemtotal: subtotal + tax                        │
└────────────────────────────────────────────────────────────┘
```

---

## 🚨 PROBLEMAS IDENTIFICADOS PARA INSURANCE

| # | Problema | Impacto | Solução |
|---|----------|--------|---------|
| **P1** | OrderCreatedEvent não inclui orderProducts[] | 🔴 CRÍTICO | Disparar event do checkout() ou adicionar callback |
| **P2** | OrderProduct não snapshota osot_product_category | 🔴 CRÍTICO | Adicionar campo ao DTO + mapper + Dataverse |
| **P3** | Insurance.osot_membership_year falta | 🔴 CRÍTICO | Adicionar ao DTO + interfaces + Dataverse |
| **P4** | Fluxo de checkout é assíncrono (Redis) | 🟡 IMPORTANTE | Listeners precisam aguardar checkout completion |
| **P5** | Professional type eligibility precisa de query | 🟡 IMPORTANTE | InsuranceLookupService.findActiveByType() |

---

## ✅ CONCLUSÃO - O QUE FAZER

### **Sequência Final Corrigida:**

```
FASE 0: Estrutural
├─ 0️⃣ Adicionar osot_membership_year a Insurance DTOs
├─ 1️⃣ Expandir OrderCreatedEvent com orderProducts[]
└─ 2️⃣ Adicionar osot_product_category snapshot a OrderProduct

FASE 1: Validators & Business Rules
├─ 3️⃣ Insurance validator: is-professional-insurance-required.validator.ts
├─ 4️⃣ Order validator: is-professional-required-for-insurance.validator.ts
└─ 5️⃣ Add business rule methods em insurance-business-rules.service.ts

FASE 2: Orchestrators
├─ 6️⃣ order-insurance.orchestrator.service.ts (validar professional rule)
├─ 7️⃣ Integrar em OrderProductOrchestrator.checkout()
└─ 8️⃣ insurance-snapshot.orchestrator.service.ts

FASE 3: Event-Driven
├─ 9️⃣ insurance.listeners.ts (escuta checkoutCompleted)
├─ 🔟 Disparar evento do checkout(), não do create()
└─ 1️⃣1️⃣ Setup EventEmitter nos modules

FASE 4: Scheduling
└─ 1️⃣2️⃣ insurance-expiration.scheduler.ts (annual cleanup)
```

---

## 🎯 FLUXO FINAL (COM INSURANCE)

```
POST /orders/{draftOrderGuid}/checkout
  │
  └─ OrderProductOrchestrator.checkout()
     │
     ├─ 1️⃣ GET items from REDIS
     │  ├─ Filter insurance items (osot_product_category = 1)
     │  │
     │  ├─ VALIDAR PROFESSIONAL RULE
     │  │  └─ OrderInsuranceOrchestrator.validateAndNormalizeInsuranceItems()
     │  │     └─ Se não tem Professional → REMOVE ALL insurance items
     │  │
     │  └─ Continue com items filtrados
     │
     ├─ 2️⃣ FINAL VALIDATION (calculations)
     │
     ├─ 3️⃣ PERSIST TO DATAVERSE (batch)
     │  └─ OrderProductRepository.create() para cada item
     │
     ├─ 4️⃣ PUBLISH checkoutCompleted EVENT
     │  └─ OrderProductEventsService.publishCheckoutCompleted({
     │       orderId,
     │       totalItems,
     │       subtotal,
     │       taxAmount,
     │       total,
     │       orderProducts: items ← NEW: INCLUDE ITEMS
     │     })
     │
     ├─ 5️⃣ CLEAN REDIS
     │
     └─ 6️⃣ RETURN response
        │
        ▼
     InsuranceEventListeners.onCheckoutCompleted()
     │
     ├─ Filter items where osot_product_category = INSURANCE
     │
     ├─ Para CADA insurance item:
     │  │
     │  └─ InsuranceSnapshotOrchestratorService.createFromOrderProduct()
     │     │
     │     ├─ validateActiveMembershipExists()
     │     ├─ validateInsuranceTypeEligibility() [professional rule]
     │     ├─ validateNoActiveInsuranceOfType() [duplicate check + year]
     │     ├─ Gather snapshot (Account, Address, MembershipSettings)
     │     └─ InsuranceCrudService.create() → DRAFT status
     │
     └─ Emit insuranceBatchCreated event
```

---

## 📝 PRÓXIMOS PASSOS

1. **Você**: Adicionar `osot_membership_year` field em Dataverse (Insurance table)
2. **Você**: Adicionar `osot_product_category` field em Dataverse (OrderProduct table)
3. **Você**: Atualizar Table_Insurance.csv e Table_Order_Product.csv
4. **Eu**: Implementar Fase 0 (DTOs + interfaces + event expansion)
5. **Eu**: Implementar Fase 1 (validators + business rules)
6. **Eu**: Implementar Fase 2 (orchestrators)
7. **Eu**: Implementar Fase 3 (listeners)
8. **Eu**: Implementar Fase 4 (scheduler)

Topa? Alguma dúvida sobre o fluxo?

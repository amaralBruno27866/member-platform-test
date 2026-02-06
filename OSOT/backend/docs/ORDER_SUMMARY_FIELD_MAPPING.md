# ORDER SUMMARY - CAMPO A CAMPO (Data Mapping Table)

## SEÇÃO 1: ORDER HEADER

| Campo | Fonte | Tipo | Exemplo | Notas |
|-------|-------|------|---------|-------|
| **orderId** | 🟡 Redis | String | `osot_ord_0004321` | Chave: `ORDER_REFERENCE(sessionId)` |
| **date** | 🟢 Calculado | ISO Date | `2026-02-03` | `new Date().toISOString().split('T')[0]` |
| **sessionId** | 🔀 Parâmetro | UUID | `12345-abscu-78de4-a45e` | Passado direto do `initiateMembership()` |

---

## SEÇÃO 2: USER DETAIL

| Campo | Fonte | Tipo | Exemplo | Notas |
|-------|-------|------|---------|-------|
| **name** | 🔵 Account | String | `Bruno Amaral` | `osot_first_name + " " + osot_last_name` |
| **email** | 🔵 Account | Email | `b.alencar.amaral@gmail.com` | `Account.osot_email` |
| **phone** | 🔵 Account | Phone | `437-313-0319` | `Account.osot_phone_number` |
| **address** | 🔵 Address | String | `19 Kew Gdns, Richmond Hill - ON, L4B-1R6` | Primeiro endereço: `${address1}, ${city} - ${province}, ${postal}` |

**Queries necessárias:**
- `Account.findById(userGuid)`
- `Address.findByAccountId(userGuid)` → [0]

---

## SEÇÃO 3: ORGANIZATION DETAIL

| Campo | Fonte | Tipo | Exemplo | Notas |
|-------|-------|------|---------|-------|
| **name** | 🔵 Organization | String | `Ontario Society of Occupational Therapists` | `Organization.osot_name` |
| **address** | 🔵 Organization | String | `110 Sheppard Ave E Suite 810, North York, ON M2N 6Y8` | `${addr1}, ${city}, ${province} ${postal}` |

**Queries necessárias:**
- `Organization.findById(organizationId)` ← Desencriptar de `JWT.organizationId`

---

## SEÇÃO 4: MEMBERSHIP DETAIL

| Campo | Fonte | Tipo | Exemplo | Notas |
|-------|-------|------|---------|-------|
| **category** | 🔵 MembershipCategory | String | `OT - Practicing` | `MembershipCategory.osot_name` |
| **period** | 🟢 Formatado | String | `From February 03, 2026 until October 14, 2026` | `From ${today.toLocaleDateString()} until ${expiresDate.toLocaleDateString()}` |
| **status** | 🟢 Lógica | Enum | `New member` | "New member" \| "Renewal" \| "Upgrade" \| "Reinstatement" |
| **certificate** | 🔵 Account | String | `osot-0003519` | `Account.osot_certificate` |

**Queries necessárias:**
- `MembershipCategory.findById(categoryGuid)` ← Onde conseguir categoryGuid?
- `MembershipSettings.findByMembershipYear(membershipYear)` → `osot_expires_date`
- `Account.findById(userGuid)` → `osot_certificate`

**⚠️ TODO**: Qual é a source de `categoryGuid` no DTO?

---

## SEÇÃO 5: LISTA DE PRODUTOS

### Cada produto tem:

| Campo | Fonte | Tipo | Exemplo | Notas |
|-------|-------|------|---------|-------|
| **id** | 🔵 OrderProduct | String | `prod-line-12345` | `OrderProduct.osot_table_order_productid` |
| **productId** | 🔵 OrderProduct | UUID | `f47ac10b-58cc-4372...` | `OrderProduct._osot_product_id_value` (lookup GUID) |
| **name** | 🔵 OrderProduct | String | `2025 2026 Membership` | `OrderProduct.osot_product_name` |
| **description** | 🔵 Product | String | `2025 Membership Fees - Expires Oct 1st 2026` | `Product.osot_description` (lookup via productId) |
| **price** | 🔵 OrderProduct | Number | `200.25` | `OrderProduct.osot_selectedprice` |
| **tax** | 🔵 OrderProduct | Number | `16.02` | `OrderProduct.osot_taxamount` |
| **total** | 🔵 OrderProduct | Number | `216.27` | `OrderProduct.osot_itemtotal` (price + tax) |
| **category** | 🔵 OrderProduct | String | `MEMBERSHIP` | `OrderProduct.osot_product_category` (MEMBERSHIP\|INSURANCE\|DONATION) |
| **validFrom** | 🟢 Calculado | ISO Date | `2026-02-03` | TODAY (ou TODAY + grace_period se INSURANCE) |
| **validUntil** | 🔵 MembershipSettings | ISO Date | `2026-10-14` | `MembershipSettings.osot_expires_date` |
| **coverage** | 🔵 Product | String | `$6,000,000` | `Product.osot_insurance_limit` (apenas INSURANCE) |
| **isTaxDeductible** | 🔵 Product | Boolean | `false` | `Product.osot_tax_deductible` (apenas DONATION) |

**Queries necessárias:**
- `OrderProduct.findByOrderId(orderId)` ← Todos os produtos
- Para cada produto:
  - `Product.findById(product._osot_product_id_value)` ← description, insurance_limit, tax_deductible

---

## SEÇÃO 6: FINANCIAL SUMMARY

| Campo | Fonte | Tipo | Exemplo | Notas |
|-------|-------|------|---------|-------|
| **subtotal** | 🟢 SUM | Number | `557.50` | `SUM(OrderProduct.osot_itemsubtotal)` |
| **tax** | 🟢 SUM | Number | `59.21` | `SUM(OrderProduct.osot_taxamount)` |
| **discount** | 🟡 Redis/Order | Number | `0.0` | `Order.osot_discount_amount` ou Redis coupon |
| **total** | 🟢 Calculado | Number | `616.71` | `subtotal + tax - discount` |
| **paymentMethod** | 🔵 Order | String | `credit_card` | `Order.osot_payment_method` |
| **processor** | 🟡 Config | String | `PayPal` | `process.env.PAYMENT_PROCESSOR` |

**Queries necessárias:**
- `Order.findById(orderId)` → `osot_payment_method`, `osot_discount_amount`
- `OrderProduct.findByOrderId(orderId)` → SUM dos totais

---

## RESUMO DE QUERIES DATAVERSE

```
┌─ PARALLEL QUERIES (sem dependências)
├─ Account.findById(userGuid)
│  → osot_first_name, osot_last_name, osot_email, osot_phone_number, osot_certificate
├─ Address.findByAccountId(userGuid) → [0]
│  → osot_address_1, osot_address_2, osot_city, osot_province, osot_postal_code
├─ Organization.findById(organizationId)
│  → osot_name, osot_address_1, osot_address_2, osot_city, osot_province, osot_postal_code
├─ MembershipCategory.findById(categoryGuid)
│  → osot_name
├─ MembershipSettings.findByMembershipYear(membershipYear)
│  → osot_expires_date
├─ Order.findById(orderId)
│  → osot_payment_method, osot_discount_amount
└─ OrderProduct.findByOrderId(orderId)
   → osot_table_order_productid, _osot_product_id_value, osot_product_name,
     osot_selectedprice, osot_taxamount, osot_itemtotal, osot_product_category

└─ DEPENDENT QUERIES (precisa de OrderProduct)
   └─ Para cada OrderProduct:
      └─ Product.findById(_osot_product_id_value)
         → osot_description, osot_insurance_limit, osot_tax_deductible
```

---

## REDUX QUERIES

| Chave | Fonte | Exemplo |
|-------|-------|---------|
| ORDER_REFERENCE(sessionId) | 🟡 Redis | Retorna: `orderId` |

---

## PERGUNTAS PENDENTES (⚠️ TODO)

1. **Onde vem `categoryGuid`?**
   - Do `CompleteMembershipRegistrationDto.category`?
   - Ou já foi salvo em Redis durante Step 3?

2. **Como calcular `status` (New member / Renewal)?**
   - Lógica: Se Account já tem membership ativo nesta org? Então "Renewal" : "New member"
   - Precisa query: `Membership.findActiveByAccountAndOrg(userGuid, organizationId)`

3. **Grace period para insurance?**
   - Padrão é 7 dias?
   - Configurável no Product ou global?

4. **Denormalizar Product data em OrderProduct?**
   - Atualmente precisa N+1 query para cada produto
   - Sugestão: Pré-preencher `osot_product_description`, `osot_insurance_limit`, etc em `addXxxToOrder()`

---

## EXEMPLO DE DADOS COMPLETOS

```json
{
  "orderHeader": {
    "orderId": "osot_ord_0004321",
    "date": "2026-02-03",
    "sessionId": "12345-abscu-78de4-a45e-88f70-0100q1"
  },
  "userDetail": {
    "name": "Bruno Amaral",
    "email": "b.alencar.amaral@gmail.com",
    "phone": "437-313-0319",
    "address": "19 Kew Gdns, Richmond Hill - ON, L4B-1R6"
  },
  "organizationDetail": {
    "name": "Ontario Society of Occupational Therapists",
    "address": "110 Sheppard Ave E Suite 810, North York, ON M2N 6Y8"
  },
  "membershipDetail": {
    "category": "OT - Practicing",
    "period": "From February 03, 2026 until October 14, 2026",
    "status": "New member",
    "certificate": "osot-0003519"
  },
  "products": [
    {
      "id": "2354",
      "productId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "2025 2026 Membership",
      "description": "2025 Membership Fees - Expires on October 1st 2026",
      "price": 200.25,
      "tax": 16.02,
      "total": 216.27,
      "category": "MEMBERSHIP",
      "validFrom": "2026-02-03",
      "validUntil": "2026-10-14"
    },
    {
      "id": "1758",
      "productId": "a12bc34d-5678-9012-3456-789abcdef012",
      "name": "Professional Liability - $6,000 million",
      "description": "A liability limit of at least $5 million per incident.",
      "price": 59.25,
      "tax": 7.70,
      "total": 66.95,
      "category": "INSURANCE",
      "validFrom": "2026-02-10",
      "validUntil": "2026-10-14",
      "coverage": "$6,000,000"
    },
    {
      "id": "1002",
      "productId": "d5678901-2345-6789-0123-456789abcdef",
      "name": "Donation $25",
      "description": "Support OSOT research and professional development initiatives",
      "price": 25.00,
      "tax": 0.0,
      "total": 25.00,
      "category": "DONATION",
      "isTaxDeductible": true
    }
  ],
  "financialSummary": {
    "subtotal": 557.50,
    "tax": 59.21,
    "discount": 0.0,
    "total": 616.71,
    "paymentMethod": "credit_card",
    "processor": "PayPal"
  }
}
```

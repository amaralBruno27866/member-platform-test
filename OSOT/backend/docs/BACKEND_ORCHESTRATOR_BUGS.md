# 🐛 Product Orchestrator - Bugs Found

**Data:** January 19, 2026  
**Encontrado por:** Frontend Team  
**Status:** ⚠️ CRÍTICO - Bloqueia criação de produtos via orchestrator

---

## 📋 Resumo Executivo

Durante testes de integração do Product Orchestrator, identificamos **3 bugs críticos** no validador do backend que impedem a criação de produtos:

1. Nome de campo GL Code incorreto
2. Nomes de campos de preço completamente errados
3. Validador referenciando campos obsoletos

**Impacto:** O frontend está enviando dados **100% corretos**, mas o backend rejeita com validação falsa.

---

## 🔴 Bug #1: Campo GL Code Incorreto

### Localização
`backend/src/classes/orchestrator/product-orchestrator/constants/product-orchestrator.constants.ts` (linha 49)

### Código Atual (❌ ERRADO)
```typescript
REQUIRED_PRODUCT_FIELDS: [
  'osot_product_code',
  'osot_product_name',
  'osot_product_description',
  'osot_product_category',
  'osot_product_status',
  'osot_gl_code',  // ❌ FALTA 'product_' NO MEIO
],
```

### Código Correto (✅)
```typescript
REQUIRED_PRODUCT_FIELDS: [
  'osot_product_code',
  'osot_product_name',
  'osot_product_description',
  'osot_product_category',
  'osot_product_status',
  'osot_product_gl_code',  // ✅ CORRETO
],
```

### Impacto
- Validador procura por campo `glCode` que não existe no DTO
- Mapeamento de `osot_gl_code` → `glCode` (deveria ser `productGlCode`)
- **Erro retornado:** `"Missing required field: glCode"`

### DTO Real
```typescript
// CreateProductDto usa:
productGlCode: ProductGLCode;  // ✅ Correto
```

---

## 🔴 Bug #2: Campos de Preço Completamente Errados

### Localização
`backend/src/classes/orchestrator/product-orchestrator/constants/product-orchestrator.constants.ts` (linhas 52-57)

### Código Atual (❌ ERRADO)
```typescript
REQUIRED_PRICE_FIELDS: [
  'osot_price_ontario',     // ❌ NÃO EXISTE
  'osot_price_quebec',      // ❌ NÃO EXISTE
  'osot_price_student',     // ❌ NÃO EXISTE
  'osot_price_ota',         // ❌ NÃO EXISTE
],
```

### Código Correto (✅)
```typescript
REQUIRED_PRICE_FIELDS: [
  'osot_general_price',
  'osot_ot_stu_price',
  'osot_ot_ng_price',
  'osot_ot_pr_price',
  'osot_ot_np_price',
  'osot_ot_ret_price',
  'osot_ot_life_price',
  'osot_ota_stu_price',
  'osot_ota_ng_price',
  'osot_ota_np_price',
  'osot_ota_ret_price',
  'osot_ota_pr_price',
  'osot_ota_life_price',
  'osot_assoc_price',
  'osot_aff_prim_price',
  'osot_aff_prem_price',
],
```

### Impacto
- Validador procura por campos que **nunca existiram** no DTO atual
- Todos os 4 campos estão **obsoletos**
- Causa falha de validação mesmo com preços válidos
- **Erro retornado:** `"At least one price field must be specified and greater than 0"`

### DTO Real (16 campos de preço)
```typescript
// CreateProductDto usa estes campos:
generalPrice?: number;        // Preço geral
otStuPrice?: number;          // OT Student
otNgPrice?: number;           // OT New Graduate
otPrPrice?: number;           // OT Practitioner
otNpPrice?: number;           // OT Non-Practitioner
otRetPrice?: number;          // OT Retired
otLifePrice?: number;         // OT Lifetime
otaStuPrice?: number;         // OTA Student
otaNgPrice?: number;          // OTA New Graduate
otaNpPrice?: number;          // OTA Non-Practitioner
otaRetPrice?: number;         // OTA Retired
otaPrPrice?: number;          // OTA Practitioner
otaLifePrice?: number;        // OTA Lifetime
assocPrice?: number;          // Associate
affPrimPrice?: number;        // Affiliate Primary
affPremPrice?: number;        // Affiliate Premium
```

---

## 🔴 Bug #3: Validador com Campos Obsoletos

### Localização
`backend/src/classes/orchestrator/product-orchestrator/validators/product-target-consistency.validators.ts` (linhas 67-90)

### Código Atual (❌ ERRADO)
```typescript
const priceFields = [
  'priceOntario',    // ❌ OBSOLETO
  'priceQuebec',     // ❌ OBSOLETO
  'priceStudent',    // ❌ OBSOLETO
  'priceOta',        // ❌ OBSOLETO
] as const;

for (const field of priceFields) {
  const value = productDto[field as keyof CreateProductDto];
  // ... validação de valores
}
```

### Código Correto (✅)
```typescript
const priceFields = [
  'generalPrice',
  'otStuPrice',
  'otNgPrice',
  'otPrPrice',
  'otNpPrice',
  'otRetPrice',
  'otLifePrice',
  'otaStuPrice',
  'otaNgPrice',
  'otaNpPrice',
  'otaRetPrice',
  'otaPrPrice',
  'otaLifePrice',
  'assocPrice',
  'affPrimPrice',
  'affPremPrice',
] as const;

for (const field of priceFields) {
  const value = productDto[field as keyof CreateProductDto];
  if (value !== undefined && value !== null && typeof value === 'number') {
    if (
      value < PRODUCT_ORCHESTRATOR_RULES.MIN_PRICE ||
      value > PRODUCT_ORCHESTRATOR_RULES.MAX_PRICE
    ) {
      errors.push(
        `Price ${field} must be between ${PRODUCT_ORCHESTRATOR_RULES.MIN_PRICE} and ${PRODUCT_ORCHESTRATOR_RULES.MAX_PRICE}`,
      );
    }
  }
}
```

### Impacto
- Validação passa por campos que não existem
- Nenhuma validação real de preços ocorre
- Permite valores inválidos ou ausentes

---

## 🧪 Teste Realizado

### Dados Enviados (Frontend)
```json
{
  "productName": "Test Product",
  "productCode": "osot-prd-000001",
  "productDescription": "Test description",
  "productCategory": 1,
  "productStatus": 1,
  "productGlCode": 4100,
  "generalPrice": 99.99,
  "productYear": "2026"
}
```

### Resposta do Backend (❌)
```json
{
  "message": "Product validation failed",
  "errors": [
    "Missing required field: glCode",
    "Invalid product code format. Expected: osot-prd-XXXXXX",
    "At least one price field must be specified and greater than 0"
  ]
}
```

**Análise:**
- ✅ `productGlCode` está presente → mas validador procura `glCode`
- ✅ `productCode` está `osot-prd-000001` → erro de regex?
- ✅ `generalPrice` está `99.99` → validador não encontra campo

---

## 📊 Comparação: Frontend vs Backend Expectations

| Campo | Frontend Envia | Backend Espera (ERRADO) | Backend Deveria Esperar (CORRETO) |
|-------|----------------|------------------------|----------------------------------|
| GL Code | `productGlCode: 4100` | `osot_gl_code` | `osot_product_gl_code` |
| Price | `generalPrice: 99.99` | `osot_price_ontario` | `osot_general_price` |
| Price | `otStuPrice: 50` | `osot_price_student` | `osot_ot_stu_price` |
| Price | `otNgPrice: 75` | `osot_price_quebec` | `osot_ot_ng_price` |
| Price | `otaPrPrice: 60` | `osot_price_ota` | `osot_ota_pr_price` |

---

## 🔧 Solução Recomendada

1. **Atualizar constants:** Corrigir nomes de campos para match com DTO atual
2. **Atualizar validador:** Usar lista de campos corrigida da constants
3. **Testar:** Garantir que validação passa para dados válidos

---

## 📝 Notas

- Frontend já foi testado e está enviando dados corretos
- Orchestrator é crítico para o workflow de criação de produtos
- Esses bugs bloqueiam completamente a criação via API privada
- Sugerimos marcar como **HOTFIX** - impacta produção

---

## 👤 Contato

Qualquer dúvida sobre os dados enviados ou validações esperadas, favor consultar:
- `src/types/product.ts` - Interface CreateProductDto (frontend)
- `backend/src/classes/others/product/dtos/create-product.dto.ts` - DTO do backend

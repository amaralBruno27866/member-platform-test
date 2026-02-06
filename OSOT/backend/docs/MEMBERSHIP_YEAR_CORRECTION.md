# CORREÇÃO CRÍTICA: Membership Year Logic

## 📋 Problema Identificado

**Data de Descoberta:** Novembro 25, 2025  
**Severidade:** 🔴 CRÍTICA  
**Impacto:** Todos os módulos de membership (category, preferences, employment, practices)

### Descrição do Problema

O sistema estava usando `new Date().getFullYear()` para determinar o ano ativo de membership, o que causava discrepância entre:

- **Ano calendário atual:** 2025 (Novembro 2025)
- **Ano de membership ativo:** 2026 (conforme settings na tabela)

**Resultado:** Novos registros de membership foram criados com `osot_membership_year: "2025"` quando deveriam ter sido criados com `osot_membership_year: "2026"`.

### Dados Reais da Tabela Membership-Settings

```json
{
  "osot_membership_year": "2026",
  "osot_membership_category": 4,
  "osot_membership_year_status": 1, // ACTIVE
  "osot_expires_date": "2025-12-31T00:00:00Z"
}
```

Todas as 42 configurações na tabela têm `osot_membership_year: "2026"` e `osot_membership_year_status: 1` (ACTIVE).

---

## ✅ Solução Implementada

### 1. MembershipSettingsUtilsService

**Novo método:** `getCurrentActiveMembershipYear()`

```typescript
async getCurrentActiveMembershipYear(): Promise<string | null> {
  const activeSettings = await this.repository.findByStatus(AccountStatus.ACTIVE);
  
  if (!activeSettings || activeSettings.length === 0) {
    return null;
  }
  
  // Retorna o ano da primeira setting ACTIVE (todas devem ter o mesmo ano)
  return activeSettings[0].osot_membership_year; // "2026"
}
```

**Antes:**
```typescript
const currentYear = new Date().getFullYear().toString(); // ❌ "2025" (errado!)
```

**Depois:**
```typescript
const currentYear = await this.getCurrentActiveMembershipYear(); // ✅ "2026" (correto!)
```

---

### 2. MembershipCategoryMembershipYearService

**Método corrigido:** `getCurrentMembershipYear()`

```typescript
async getCurrentMembershipYear(): Promise<string> {
  const activeSettings = await this.membershipSettingsRepository.findByStatus(AccountStatus.ACTIVE);
  
  if (!activeSettings || activeSettings.length === 0) {
    throw new Error('No active membership settings found. Cannot determine membership year.');
  }
  
  // Retorna o ano das settings ACTIVE, não do calendário
  return activeSettings[0].osot_membership_year; // "2026"
}
```

**Antes:** Retornava `new Date().getFullYear().toString()` → "2025"  
**Depois:** Busca diretamente das settings ACTIVE → "2026"

---

### 3. Constants - Avisos Críticos Adicionados

#### membership-employment.constants.ts
```typescript
// ⚠️ WARNING: DO NOT USE THIS FOR ACTUAL MEMBERSHIP YEAR!
// This is only a fallback/placeholder value.
// The actual membership year MUST come from MembershipSettingsUtilsService.getCurrentActiveMembershipYear()
// Example: In November 2025, the ACTIVE membership year might be 2026, NOT the calendar year!
CURRENT_MEMBERSHIP_YEAR: new Date().getFullYear().toString(), // ⚠️ DO NOT USE - Use MembershipSettingsUtilsService instead!
```

#### membership-preference.constants.ts
```typescript
// ⚠️ WARNING: DO NOT USE THIS FOR ACTUAL MEMBERSHIP YEAR!
// This is only a fallback/placeholder value.
// The actual membership year MUST come from MembershipSettingsUtilsService.getCurrentActiveMembershipYear()
// Example: In November 2025, the ACTIVE membership year might be 2026, NOT the calendar year!
CURRENT_MEMBERSHIP_YEAR: new Date().getFullYear().toString(), // ⚠️ DO NOT USE - Use MembershipSettingsUtilsService instead!
```

---

## 📚 Regra de Negócio Corrigida

### ❌ ANTES (Errado)
- Ano de membership = Ano calendário do sistema (`new Date().getFullYear()`)
- Novembro 2025 → osot_membership_year = "2025"

### ✅ DEPOIS (Correto)
- Ano de membership = Ano das settings com status ACTIVE
- Novembro 2025 → osot_membership_year = "2026" (conforme settings)

---

## 🔍 Exemplo Real

**Data Atual:** Novembro 25, 2025  
**Calendário do Sistema:** `new Date().getFullYear()` = 2025  
**Settings na Tabela:** 42 registros com `osot_membership_year: "2026"` e `osot_membership_year_status: ACTIVE`

### Comportamento Correto

```typescript
// Controller recebe request para criar novo registro de employment
POST /membership/employment/me

// 1. Buscar ano ativo das settings
const membershipYear = await membershipSettingsUtilsService.getCurrentActiveMembershipYear();
// Retorna: "2026" ✅

// 2. Enriquecer DTO
dto.osot_membership_year = membershipYear; // "2026"

// 3. Criar registro no Dataverse
await crudService.create(dto);
// Resultado: osot_membership_year = "2026" ✅
```

---

## 🎯 Módulos Afetados e Corrigidos

| Módulo | Arquivo Corrigido | Método/Constante |
|--------|------------------|------------------|
| **membership-settings** | utils/membership-settings.utils.ts | `getCurrentActiveMembershipYear()` (NOVO) |
| **membership-settings** | utils/membership-settings.utils.ts | `getCurrentActiveMembershipExpiresDate()` |
| **membership-category** | utils/membership-category-membership-year.util.ts | `getCurrentMembershipYear()` |
| **membership-category** | utils/membership-category-membership-year.util.ts | `getCurrentMembershipYear()` (standalone) |
| **membership-employment** | constants/membership-employment.constants.ts | `CURRENT_MEMBERSHIP_YEAR` (aviso adicionado) |
| **membership-preferences** | constants/membership-preference.constants.ts | `CURRENT_MEMBERSHIP_YEAR` (aviso adicionado) |

---

## 🚀 Próximos Passos

### Controllers (Pendente)

Quando implementar os controllers, certifique-se de usar:

```typescript
// ✅ CORRETO
const membershipYear = await this.membershipSettingsUtilsService.getCurrentActiveMembershipYear();
dto.osot_membership_year = membershipYear;

// ❌ ERRADO - NUNCA USE ISSO
dto.osot_membership_year = new Date().getFullYear().toString();
```

### Business Rules Services (Pendente)

Para validar anos:

```typescript
// ✅ CORRETO - Valida se ano existe nas settings ACTIVE
await this.membershipSettingsLookupService.validateMembershipYear(year, opId);

// ❌ ERRADO - Comparar com calendário do sistema
if (year !== new Date().getFullYear().toString()) { ... }
```

---

## 📖 Documentação de Referência

- **Architecture:** Sistema de membership segue padrão de "ano eleito" (e.g., 2025/2026 → 2026)
- **Source of Truth:** Tabela `osot_table_membership_setting` com status ACTIVE
- **Integration:** MembershipSettingsUtilsService é a única fonte confiável para determinar ano ativo

---

## ⚠️ IMPORTANTE

**NUNCA use `new Date().getFullYear()` para determinar o ano de membership ativo!**

O ano ativo é uma configuração de negócio gerenciada na tabela `osot_table_membership_setting`, não uma função do calendário do sistema.

**Sempre use:**
- `MembershipSettingsUtilsService.getCurrentActiveMembershipYear()`
- `MembershipCategoryMembershipYearService.getCurrentMembershipYear()`

---

**Correção implementada por:** GitHub Copilot  
**Data:** 25 de Novembro de 2025  
**Status:** ✅ Compilação sem erros

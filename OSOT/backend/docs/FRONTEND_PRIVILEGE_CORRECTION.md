# 🚨 URGENTE: Correção Crítica - Sistema de Privilégios

**Data:** 16 de Janeiro de 2026  
**Para:** Time Frontend  
**De:** Time Backend  
**Prioridade:** CRÍTICA

---

## ❌ Problemas Identificados na Correção Aplicada

Analisamos a correção que vocês implementaram e identificamos **dois erros críticos** que estão **invertendo completamente** a lógica de acesso:

---

## Erro #1: Account Group de STAFF está INCORRETO

### ❌ O que vocês implementaram:
```typescript
account_group = 4  // ERRADO!
```

### ✅ O correto:
```typescript
account_group = 7  // STAFF é 7, não 4!
```

### Enum completo de AccountGroup:
```typescript
export enum AccountGroup {
  MEMBER = 1,
  STUDENT = 2,
  RESIDENT = 3,
  RETIRED = 5,
  CANDIDATE = 6,
  STAFF = 7,     // ← Correto: é 7, não 4!
}
```

**Fonte oficial:** Backend enum em `src/common/enums/account-group.enum.ts`

---

## Erro #2: Escala de Privilégios está INVERTIDA

### ❌ O que vocês entenderam:
```
1 = Owner (maior privilégio)
2 = Admin/OTA (intermediário)
3 = Main (menor privilégio)

Interpretação: "menor número = maior privilégio"
```

### ✅ A escala CORRETA:
```typescript
export enum Privilege {
  OWNER = 1,  // MENOR privilégio - acesso apenas aos próprios dados
  ADMIN = 2,  // Privilégio INTERMEDIÁRIO - acesso organization-wide
  MAIN = 3,   // MAIOR privilégio - full CRUD + DELETE
}
```

**Regra:** `MAIOR número = MAIOR privilégio` (escala crescente: 1 < 2 < 3)

**NÃO é como patentes militares!** É uma escala numérica simples onde:
- 3 > 2 > 1
- MAIN > ADMIN > OWNER

**Fonte oficial:** Backend enum em `src/common/enums/privilege.enum.ts`

---

## 🔧 Correção da Lógica de Comparação

### ❌ Lógica atual (INVERTIDA):
```typescript
// ERRADO - Isso nega acesso aos usuários com MAIOR privilégio!
if (userPrivilege > minPrivilege) {
  return <Navigate to="/unauthorized" />;  // NEGA acesso
}
```

**Resultado dessa lógica ERRADA:**
| Cenário | Resultado | Correto? |
|---------|-----------|----------|
| User privilege=3 (MAIN) > minPrivilege=2 | ❌ **NEGADO** | Deveria ser ✅ PERMITIDO |
| User privilege=2 (ADMIN) > minPrivilege=2 | ❌ **NEGADO** | Deveria ser ✅ PERMITIDO |
| User privilege=1 (OWNER) > minPrivilege=2 | ✅ **PERMITIDO** | Deveria ser ❌ NEGADO |

**Isso dá mais acesso ao OWNER (menor privilégio) do que ao MAIN (maior privilégio)!**

### ✅ Lógica CORRETA:
```typescript
// CORRETO - Nega acesso se privilégio for MENOR que o mínimo
if (userPrivilege < minPrivilege) {
  return <Navigate to="/unauthorized" />;  // NEGA acesso
}

// Ou de forma mais explícita:
const hasRequiredPrivilege = userPrivilege >= minPrivilege;
if (!hasRequiredPrivilege) {
  return <Navigate to="/unauthorized" />;
}
```

**Resultado da lógica CORRETA:**
| Cenário | Resultado | Correto? |
|---------|-----------|----------|
| User privilege=3 (MAIN) >= minPrivilege=2 | ✅ **PERMITIDO** | ✅ Sim |
| User privilege=2 (ADMIN) >= minPrivilege=2 | ✅ **PERMITIDO** | ✅ Sim |
| User privilege=1 (OWNER) >= minPrivilege=2 | ❌ **NEGADO** | ✅ Sim |

---

## 💻 Código Completo Correto

### ProtectedRoute Component:

```typescript
interface ProtectedRouteProps {
  requireStaff?: boolean;
  minPrivilege?: number; // 1=OWNER, 2=ADMIN, 3=MAIN (escala crescente)
  children: React.ReactNode;
}

function ProtectedRoute({ 
  requireStaff, 
  minPrivilege, 
  children 
}: ProtectedRouteProps) {
  const { profile, isLoading, error } = useProfile();
  
  // Step 1: Wait for profile to load
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Step 2: Check authentication
  if (!profile || error) {
    return <Navigate to="/login" replace />;
  }
  
  // Step 3: Check STAFF requirement (account_group = 7)
  if (requireStaff) {
    if (profile.osot_account_group !== 7) {
      console.warn('Access denied: User is not STAFF', {
        accountGroup: profile.osot_account_group,
        required: 7
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // Step 4: Check privilege requirement
  // Remember: Higher number = Higher privilege (3 > 2 > 1)
  if (minPrivilege !== undefined) {
    if (profile.osot_privilege < minPrivilege) {
      console.warn('Access denied: Insufficient privilege', {
        userPrivilege: profile.osot_privilege,
        requiredPrivilege: minPrivilege,
        privilegeNames: {
          1: 'OWNER',
          2: 'ADMIN',
          3: 'MAIN'
        }
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // All checks passed
  return <>{children}</>;
}
```

### Route Configuration:

```typescript
import { Routes, Route } from 'react-router-dom';

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* User routes - All authenticated users */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Admin routes - STAFF with privilege >= 2 (ADMIN or MAIN) */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute 
            requireStaff={true}    // Only account_group = 7
            minPrivilege={2}       // Privilege >= 2 (ADMIN or MAIN)
          >
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

---

## 📊 Matriz de Acesso Esperada

Com `requireStaff={true}` e `minPrivilege={2}` na rota `/admin`:

| Tipo de Usuário | account_group | privilege | Acesso /admin | Motivo |
|-----------------|---------------|-----------|---------------|---------|
| **STAFF MAIN** | 7 | 3 | ✅ **PERMITIDO** | É STAFF (7) E privilege 3 >= 2 |
| **STAFF ADMIN** | 7 | 2 | ✅ **PERMITIDO** | É STAFF (7) E privilege 2 >= 2 |
| **STAFF OWNER** | 7 | 1 | ❌ NEGADO | É STAFF mas privilege 1 < 2 |
| Member MAIN | 1 | 3 | ❌ NEGADO | Não é STAFF (group = 1 ≠ 7) |
| Student MAIN | 2 | 3 | ❌ NEGADO | Não é STAFF (group = 2 ≠ 7) |
| Member ADMIN | 1 | 2 | ❌ NEGADO | Não é STAFF (group = 1 ≠ 7) |

**Situação atual quebrada:** Usuários STAFF MAIN (privilege=3) estão sendo NEGADOS por causa da comparação invertida!

---

## ✅ Checklist de Correção URGENTE

Por favor, apliquem as seguintes correções:

### 1. Corrigir Account Group de STAFF
- [ ] Trocar todas as referências `account_group === 4` para `account_group === 7`
- [ ] Criar/atualizar enum com `STAFF = 7`
- [ ] Verificar se não há outros lugares checando group=4 incorretamente

### 2. Corrigir Comparação de Privilégio
- [ ] Trocar `userPrivilege > minPrivilege` para `userPrivilege < minPrivilege` na verificação de NEGAÇÃO
- [ ] OU usar `userPrivilege >= minPrivilege` na verificação de PERMISSÃO
- [ ] Adicionar comentários explicando: "Higher number = Higher privilege (3 > 2 > 1)"

### 3. Criar Constantes (Opcional mas Recomendado)
```typescript
// src/constants/privileges.ts
export const Privilege = {
  OWNER: 1,  // Lowest privilege
  ADMIN: 2,  // Mid privilege
  MAIN: 3,   // Highest privilege
} as const;

export const AccountGroup = {
  MEMBER: 1,
  STUDENT: 2,
  RESIDENT: 3,
  RETIRED: 5,
  CANDIDATE: 6,
  STAFF: 7,   // Administrative staff
} as const;
```

### 4. Testar Todos os Cenários
Testem com usuários reais ou mock data:

- [ ] **STAFF MAIN (group=7, privilege=3)** → ✅ Deve acessar /admin
- [ ] **STAFF ADMIN (group=7, privilege=2)** → ✅ Deve acessar /admin
- [ ] **STAFF OWNER (group=7, privilege=1)** → ❌ NÃO deve acessar /admin
- [ ] **Member MAIN (group=1, privilege=3)** → ❌ NÃO deve acessar /admin
- [ ] **Member ADMIN (group=1, privilege=2)** → ❌ NÃO deve acessar /admin

### 5. Validar JWT
Decodifiquem o JWT de um usuário STAFF e verifiquem:

```json
{
  "userId": "osot-0000123",
  "userGuid": "abc-123-def",
  "email": "staff@osot.ca",
  "osot_account_group": 7,     // ← Deve ser 7 (não 4!)
  "osot_privilege": 3,          // ← Para STAFF MAIN
  "role": "main"
}
```

Use https://jwt.io para decodificar e verificar.

---

## 📖 Documentação de Referência

Anexamos o documento completo `PRIVILEGE_CLARIFICATION_URGENT.md` que contém:

- ✅ Enums oficiais do backend (Privilege e AccountGroup)
- ✅ Explicação detalhada da escala de privilégios
- ✅ Diferença entre GROUP (quem você é) vs PRIVILEGE (o que pode fazer)
- ✅ Exemplos de código correto vs incorreto
- ✅ Matriz completa de permissões
- ✅ Casos de uso e cenários de teste

---

## 🎯 Resposta às Perguntas Originais

### 1. "Podem confirmar a escala de privilégios no backend?"

**✅ CONFIRMADO oficialmente:**

```
1 = OWNER  (MENOR privilégio - own data only)
2 = ADMIN  (intermediário - organization-wide)
3 = MAIN   (MAIOR privilégio - full CRUD + DELETE)

MAIOR número = MAIOR privilégio
```

**A interpretação de vocês estava INVERTIDA.**

### 2. "E que account_group=4 indica STAFF?"

**❌ INCORRETO. O correto é:**

```
account_group = 7  (STAFF é 7, não 4!)
```

### 3. "Isso está correto ou deveríamos ajustar minPrivilege={3}?"

**✅ CORRETO manter `minPrivilege={2}` com a comparação corrigida:**

```typescript
// Com minPrivilege={2} (CORRETO):
// - Permite STAFF ADMIN (privilege=2) ✅
// - Permite STAFF MAIN (privilege=3) ✅
// - Bloqueia STAFF OWNER (privilege=1) ✅

// Se mudarem para minPrivilege={3}:
// - Bloqueia STAFF ADMIN (privilege=2) ❌ ERRADO!
// - Permite apenas STAFF MAIN (privilege=3) ✅
```

**Mantenham `minPrivilege={2}` mas CORRIJAM a comparação!**

---

## ⚠️ Resumo do Problema

**A "correção" aplicada:**
1. ✅ Corrigiu o problema de carregar profile antes de verificar (isso estava certo)
2. ❌ Usou account_group=4 quando deveria ser account_group=7 (ERRO #1)
3. ❌ Inverteu a comparação de privilégios por entender a escala ao contrário (ERRO #2)

**Resultado:** Agora está negando acesso aos administradores com MAIOR privilégio (MAIN=3) e potencialmente permitindo acesso a não-STAFF.

---

## 🆘 Precisa de Ajuda?

Se tiverem dúvidas ou precisarem de mais exemplos:

1. **Validem o JWT** de um usuário STAFF no https://jwt.io
2. **Verifiquem os valores** no payload: `osot_account_group` e `osot_privilege`
3. **Adicionem console.logs** temporários no ProtectedRoute para ver os valores reais
4. **Contactem o backend** se os valores no JWT não estiverem corretos

---

## 📝 Próximos Passos

1. ✅ Apliquem as correções listadas no checklist
2. ✅ Testem com os 5 cenários da matriz
3. ✅ Validem o JWT de um usuário STAFF
4. ✅ Nos informem quando as correções estiverem aplicadas
5. ✅ Façam deploy em staging para validação final

---

**Pedimos desculpas por qualquer confusão causada por documentações anteriores inconsistentes. O backend está correto, mas a documentação em alguns lugares estava invertida. Já corrigimos todas as documentações.**

**As informações neste documento são OFICIAIS e VALIDADAS contra o código backend.**

Qualquer dúvida, estamos à disposição para esclarecimentos.

---

**Atenciosamente,**  
**Time Backend - OSOT Platform**

---

**Última Atualização:** 16 de Janeiro de 2026  
**Status:** AGUARDANDO CORREÇÃO FRONTEND  
**Criticidade:** 🔴 CRÍTICA - Bloqueando acesso administrativo

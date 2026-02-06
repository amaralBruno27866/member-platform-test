# Respostas do Backend - Email Verification Implementation

**Data:** 01/12/2025  
**De:** Backend Team  
**Para:** Frontend Team  
**Assunto:** Respostas completas sobre endpoints de verificação de email

---

## 🔴 RESPOSTAS CRÍTICAS - Bloqueadores

### 1. ✅ Confirmação de Endpoints

#### ✅ Verificação de Email (Usuário Regular)
```
POST /api/public/orchestrator/verify-email
```
- ✅ **Endpoint CORRETO**
- ✅ **Implementado e funcionando**
- ⚠️ **IMPORTANTE**: O endpoint está em `/public/orchestrator/`, não em `/user-account/account/`

#### ❌ Confirmação de Registro (Usuário Regular)
```
❌ POST /api/user-account/account/confirm-email - NÃO EXISTE
```
- ⚠️ **CORREÇÃO**: Usar o mesmo endpoint de verificação acima
- O processo é: `verify-email` → aguarda aprovação admin → admin aprova
- **Não existe step separado de "confirmação de registro"**

#### ✅ Verificação de Email (Afiliado)
```
POST /api/public/affiliates/verify-email
```
- ✅ **Endpoint CORRETO**
- ✅ **Implementado e funcionando**

#### ⚠️ Aprovação de Conta (Admin)
```
POST /api/public/orchestrator/admin/approve/{approvalToken}
```
- ✅ **Implementado e funcionando**
- ⚠️ **IMPORTANTE**: Endpoint usa apenas o token de APROVAÇÃO
- ⚠️ **NÃO PRECISA DE BODY** - apenas o token na URL
- ⚠️ **Não tem endpoint separado para rejeição** (por enquanto)

#### ✅ Aprovação/Rejeição de Afiliado (Admin)
```
POST /api/public/affiliates/approve/{token}
```
- ✅ **Endpoint CORRETO**
- ✅ **Implementado e funcionando**
- ✅ **Aceita tanto aprovação quanto rejeição** via body `action`

---

### 2. 📄 Estrutura de Request Body

#### ✅ Para `/public/orchestrator/verify-email`:
```typescript
{
  "sessionId": "string",      // ← Nome correto: "sessionId"
  "verificationToken": "string" // ← Nome correto: "verificationToken"
}
```
**✅ Estrutura está CORRETA no documento**

**Exemplo real:**
```json
{
  "sessionId": "reg_1a2b3c4d_5e6f7g8h",
  "verificationToken": "verify_abc123xyz789"
}
```

---

#### ✅ Para `/public/affiliates/verify-email`:
```typescript
{
  "sessionId": "string",      // ← Nome correto: "sessionId"
  "verificationToken": "string" // ← Nome correto: "verificationToken"
}
```
**✅ Estrutura IDÊNTICA ao endpoint de usuário regular**

**Validação adicional:**
- `sessionId` deve seguir padrão: `aff_{timestamp}_{random}` (ex: `aff_1729000000000_a1b2c3d4e5f6`)
- `verificationToken` deve ser hex de 64 caracteres (ex: `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`)

---

#### ⚠️ Para `/public/orchestrator/admin/approve/{approvalToken}`:
```typescript
// ❌ NÃO PRECISA DE BODY
// Apenas use o token na URL
```
**⚠️ IMPORTANTE:**
- O endpoint de aprovação do **orchestrator** não aceita body
- Apenas passa o `approvalToken` na URL
- Sempre aprova (não tem opção de rejeitar por esse endpoint)
- **Nota**: Existe endpoint de rejeição separado que ainda precisa de documentação

**Exemplo de chamada:**
```typescript
// Apenas POST sem body
POST /api/public/orchestrator/admin/approve/approve_761f0e97ec80427e038deb1979a28
// Sem body necessário
```

---

#### ✅ Para `/public/affiliates/approve/{token}`:
```typescript
{
  "action": "approve" | "reject",  // ← Valores EXATOS: "approve" ou "reject"
  "reason": "string"               // ← OPCIONAL (mas recomendado)
}
```
**✅ Estrutura está CORRETA**

**Detalhes importantes:**
- Campo `action` aceita apenas `"approve"` ou `"reject"` (lowercase, exatamente assim)
- Campo `reason` é **opcional** para ambos (mas recomendamos sempre preencher)
- `reason` tem limite de 500 caracteres

**Exemplo real:**
```json
{
  "action": "approve",
  "reason": "Organization verified and meets all requirements"
}
```

---

### 3. 📄 Estrutura de Response (Exemplos REAIS)

#### ✅ Success Response - `/public/orchestrator/verify-email`
```typescript
{
  "success": true,
  "sessionId": "reg_1a2b3c4d5e6f7g8h9i0j",
  "status": "email_verified",
  "message": "Email verified successfully. Your registration is now pending admin approval.",
  "nextSteps": [
    "Wait for admin approval",
    "Check your email for updates"
  ]
}
```

**Campos do response:**
- `success` - boolean (sempre `true` em sucesso)
- `sessionId` - string (ID da sessão)
- `status` - string (novo status: `"email_verified"`)
- `message` - string (mensagem descritiva)
- `nextSteps` - string[] (próximos passos)

---

#### ✅ Success Response - `/public/affiliates/verify-email`
```typescript
{
  "success": true,
  "message": "Email verified successfully. Awaiting admin approval.",
  "sessionId": "aff_1729000000000_a1b2c3d4e5f6",
  "status": "email_verified"
}
```

**Similar ao orchestrator, mas estrutura pode variar ligeiramente**

---

#### ✅ Success Response - `/public/orchestrator/admin/approve/{token}`
```typescript
{
  "success": true,
  "message": "Registration approved successfully. Entity creation initiated.",
  "sessionId": "reg_1a2b3c4d5e6f7g8h9i0j"
}
```

**Campos do response:**
- `success` - boolean
- `message` - string (confirmação da aprovação)
- `sessionId` - string (ID da sessão aprovada)

---

#### ✅ Success Response - `/public/affiliates/approve/{token}` (Approval)
```typescript
{
  "success": true,
  "message": "Affiliate registration approved successfully",
  "affiliateId": "12345678-1234-1234-1234-123456789abc",
  "status": "approved"
}
```

---

#### ✅ Success Response - `/public/affiliates/approve/{token}` (Rejection)
```typescript
{
  "success": true,
  "message": "Affiliate registration rejected",
  "status": "rejected",
  "reason": "Does not meet organization requirements"
}
```

---

#### ❌ Error Response - **FORMATO PADRONIZADO**
```typescript
{
  "code": 2001,               // ← Código numérico do erro
  "message": "Invalid or expired token"  // ← Mensagem user-friendly
}
```

**⚠️ IMPORTANTE:**
- **Todos os erros seguem o formato:** `{ "code": number, "message": string }`
- **NÃO tem campo `success: false`** nos erros
- O campo `code` é sempre numérico
- O campo `message` é sempre uma string user-friendly

**Exemplos de errors:**

```typescript
// Token inválido ou expirado
{
  "code": 2001,
  "message": "Invalid or expired verification token"
}

// Session não encontrada
{
  "code": 2002,
  "message": "Registration session not found"
}

// Email já verificado
{
  "code": 1001,
  "message": "Email has already been verified"
}

// Sem permissão (não é admin)
{
  "code": 3001,
  "message": "Insufficient permissions to perform this action"
}
```

---

### 4. 🔢 Códigos de Erro Completos

#### ✅ Códigos Confirmados

| Código | Categoria | Descrição | Quando Acontece |
|--------|-----------|-----------|-----------------|
| `1001` | Account | Email já verificado | Usuário tenta verificar email que já foi verificado |
| `1003` | Account | Credenciais inválidas | Login com senha errada (não aplicável a verificação) |
| `1004` | Account | Conta já processada | Admin tenta aprovar/rejeitar conta que já foi processada |
| `2001` | Validation | Token inválido ou expirado | Token de verificação/aprovação inválido ou expirou (24h) |
| `2002` | Validation | Session não encontrada | SessionId não existe ou expirou no Redis |
| `2003` | Validation | Dados de requisição inválidos | Body da request tem formato/valores inválidos |
| `3001` | Permission | Sem permissão | Usuário não tem privilégio admin (futuramente) |
| `4001` | External | Erro no Dataverse | Falha ao comunicar com Microsoft Dataverse |
| `5001` | Application | Erro interno do servidor | Erro inesperado no backend |

#### 📋 Lista Completa de Códigos de Erro (26 códigos)

**Account Errors (1000-1999):**
- `1001` - Email já verificado
- `1002` - Email já existe
- `1003` - Credenciais inválidas
- `1004` - Conta já processada
- `1005` - Conta inativa
- `1006` - Conta bloqueada
- `1007` - Conta não encontrada

**Validation Errors (2000-2999):**
- `2001` - Token inválido ou expirado
- `2002` - Session não encontrada
- `2003` - Dados de requisição inválidos
- `2004` - Campo obrigatório ausente
- `2005` - Formato de email inválido
- `2006` - Senha muito fraca
- `2007` - Dados duplicados

**Permission Errors (3000-3999):**
- `3001` - Sem permissão
- `3002` - Acesso negado
- `3003` - Token de autenticação inválido
- `3004` - Sessão expirada

**External Service Errors (4000-4999):**
- `4001` - Erro no Dataverse
- `4002` - Erro no serviço de email
- `4003` - Erro no Redis
- `4004` - Timeout de serviço externo

**Application Errors (5000-5999):**
- `5001` - Erro interno do servidor
- `5002` - Configuração inválida
- `5003` - Recurso não encontrado
- `5004` - Operação não permitida
- `5005` - Rate limit excedido

#### ✅ Respostas às Perguntas

1. **Esses códigos estão sendo retornados?** ✅ SIM
2. **Há outros códigos não listados?** ✅ SIM - ver tabela completa acima (26 códigos total)
3. **Nome do campo de erro?** ✅ `code` (numérico) e `message` (string)

**Documentação completa:** Ver `ERROR_HANDLING_FRONTEND_GUIDE.md`

---

## 🟡 RESPOSTAS IMPORTANTES - Admin Pages

### 5. 🔐 Verificação de Privilégios Admin

#### ⚠️ Situação Atual: **Verificação NÃO está implementada ainda**

**Opção recomendada para implementar:**

#### ✅ **Opção A: Campo no JWT (RECOMENDADO)**

O JWT payload já contém campo `role`:

```typescript
interface JWTPayload {
  sub: string;        // User ID (GUID do Dataverse)
  email: string;      // Email do usuário
  role: string;       // ← Privilégio do usuário
  iat: number;        // Issued at
  exp: number;        // Expiration
}
```

**Valores possíveis de `role`:**
- `"owner"` - Privilege 1 (Super Admin)
- `"admin"` - Privilege 2 (Admin)
- `"main"` - Privilege 3 (Usuário normal)

**Como verificar se é admin:**

```typescript
import { jwtDecode } from 'jwt-decode';

function isAdmin(token: string): boolean {
  const decoded = jwtDecode<JWTPayload>(token);
  return decoded.role === 'admin' || decoded.role === 'owner';
}
```

**⚠️ IMPORTANTE:**
- **Por enquanto, os endpoints de aprovação são PÚBLICOS** (`/public/`)
- Futuramente serão protegidos com `@UseGuards(JwtAuthGuard)`
- Vocês podem implementar a verificação no frontend como camada extra de segurança
- O backend vai adicionar proteção nos endpoints em breve

---

#### ❌ **Opção B: Endpoint dedicado - NÃO EXISTE**

**Não existe endpoint `/api/auth/me` por enquanto.**

**Recomendação:**
- Use o JWT decodificado (Opção A)
- Se precisarem de endpoint `/me`, podemos criar

---

### 6. 📊 Informações do Registro (Para Admin Pages)

#### ❌ **Endpoint de detalhes NÃO existe ainda**

**Situação:**
- **Não existe** endpoint para buscar detalhes do registro usando o token
- As informações estão **no email** que o admin recebe
- O email já contém todos os dados necessários

**⚠️ Recomendação:**

**Para MVP/Fase 1:**
- ✅ **Criem as páginas SEM essas informações por enquanto**
- Mostrem apenas:
  ```
  ┌────────────────────────────────────┐
  │  Aprovar Registro                  │
  │                                    │
  │  Tem certeza que deseja aprovar   │
  │  este registro?                   │
  │                                    │
  │  [✅ Confirmar Aprovação]          │
  │  [❌ Cancelar]                     │
  └────────────────────────────────────┘
  ```

**Para Fase 2 (futuro):**
- Backend pode criar endpoint:
  ```
  GET /api/admin/registration/{token}/details
  ```
- Retornaria dados do Redis usando o token como chave

**Decisão:** Vocês podem começar sem as informações. Priorizem funcionalidade.

---

## 🟢 RESPOSTAS OPCIONAIS - Nice to have

### 7. ⏱️ Rate Limiting

**Respostas:**

1. **Os endpoints têm rate limiting?**
   - ✅ SIM - Endpoints de autenticação têm rate limiting
   - ❌ Endpoints de verificação de email **ainda não** têm rate limiting
   - ⚠️ Será adicionado em breve

2. **Quantas tentativas são permitidas?**
   - Login: 5 tentativas por IP a cada 15 minutos
   - Verificação de email: Sem limite por enquanto
   - Token é de uso único (após usar, é invalidado)

3. **Timeout recomendado para chamadas?**
   - ✅ **10 segundos** (padrão recomendado)
   - Chamadas normalmente respondem em < 500ms
   - Use timeout de 10s para segurança

**Código de erro quando rate limit exceder:**
```typescript
{
  "code": 5005,
  "message": "Too many requests. Please try again later."
}
```

---

### 8. ⏰ Expiração de Tokens

**Respostas:**

1. **Quanto tempo os tokens de verificação são válidos?**
   - ✅ **24 horas** (1440 minutos)
   - Após 24h, retorna código `2001` (Token inválido ou expirado)

2. **Quanto tempo os tokens de aprovação admin são válidos?**
   - ✅ **7 dias** (168 horas)
   - Sessão Redis expira após 7 dias
   - Após expirar, retorna código `2002` (Session não encontrada)

3. **Qual código de erro quando token expira?**
   - Token de verificação expirado: `2001` - "Invalid or expired verification token"
   - Session expirada no Redis: `2002` - "Registration session not found"

**Tabela resumo:**

| Token Type | Validade | Erro ao Expirar | Código |
|------------|----------|-----------------|--------|
| Verification Token | 24 horas | Token inválido ou expirado | `2001` |
| Approval Token | 7 dias (session Redis) | Session não encontrada | `2002` |
| JWT Token | 7 dias | Token de autenticação inválido | `3003` |

---

## 📝 Resumo Final - Checklist

### ✅ O que está PRONTO e FUNCIONAL:

- ✅ POST `/public/orchestrator/verify-email` (usuário regular)
- ✅ POST `/public/affiliates/verify-email` (afiliado)
- ✅ POST `/public/orchestrator/admin/approve/{token}` (aprovação admin - SEM BODY)
- ✅ POST `/public/affiliates/approve/{token}` (aprovação/rejeição afiliado - COM BODY)
- ✅ Error handling completo (26 códigos de erro)
- ✅ JWT com campo `role` para verificar admin
- ✅ Documentação de todos os responses

### ⚠️ O que está PARCIALMENTE PRONTO:

- ⚠️ Endpoints de admin são públicos (sem proteção JWT ainda)
- ⚠️ Não tem endpoint de detalhes do registro
- ⚠️ Não tem rate limiting nos endpoints de verificação
- ⚠️ Endpoint de rejeição do orchestrator não documentado

### ❌ O que NÃO EXISTE:

- ❌ POST `/user-account/account/confirm-email` (use `verify-email` do orchestrator)
- ❌ GET `/admin/registration/{token}/details` (endpoint de detalhes)
- ❌ GET `/auth/me` (endpoint de user info)

### 🎯 Recomendações para Frontend:

**Fase 1 - Implementar AGORA (2 dias):**
1. ✅ Página de verificação de email (usuário) → `/verify-email`
2. ✅ Página de verificação de email (afiliado) → `/verify-affiliate-email`
3. ✅ Página de aprovação admin (simples, sem detalhes) → `/admin/approve-account`
4. ✅ Página de rejeição admin (simples) → `/admin/reject-account`
5. ✅ Página de aprovação afiliado → `/admin/approve-affiliate`
6. ✅ Página de rejeição afiliado → `/admin/reject-affiliate`

**Fase 2 - Melhorias FUTURAS:**
1. Backend adiciona proteção JWT nos endpoints admin
2. Backend cria endpoint de detalhes do registro
3. Frontend mostra informações completas na página de aprovação
4. Backend adiciona rate limiting
5. Frontend implementa retry logic com backoff

---

## 🚀 Endpoints Corrigidos - Lista Final

### Para Usuários (Públicos):

```typescript
// Verificação de email - Usuário Regular
POST /api/public/orchestrator/verify-email
Body: { sessionId: string, verificationToken: string }
Response: { success: boolean, sessionId: string, status: string, message: string, nextSteps: string[] }

// Verificação de email - Afiliado
POST /api/public/affiliates/verify-email
Body: { sessionId: string, verificationToken: string }
Response: { success: boolean, message: string, sessionId: string, status: string }
```

### Para Admins (Públicos - futuramente protegidos):

```typescript
// Aprovação de conta - Orchestrator
POST /api/public/orchestrator/admin/approve/{approvalToken}
Body: (nenhum)
Response: { success: boolean, message: string, sessionId: string }

// Aprovação/Rejeição de afiliado
POST /api/public/affiliates/approve/{token}
Body: { action: "approve" | "reject", reason?: string }
Response: { success: boolean, message: string, affiliateId?: string, status: string }
```

---

## 📞 Formato de Resposta Resumido

### ✅ Endpoints Corretos:

| Endpoint | Método | Body | Status |
|----------|--------|------|--------|
| `/public/orchestrator/verify-email` | POST | `{sessionId, verificationToken}` | ✅ PRONTO |
| `/public/affiliates/verify-email` | POST | `{sessionId, verificationToken}` | ✅ PRONTO |
| `/public/orchestrator/admin/approve/{token}` | POST | (nenhum) | ✅ PRONTO |
| `/public/affiliates/approve/{token}` | POST | `{action, reason?}` | ✅ PRONTO |

### ❌ Endpoints que NÃO EXISTEM:

- ❌ `/user-account/account/verify-email` → Usar `/public/orchestrator/verify-email`
- ❌ `/user-account/account/confirm-email` → Usar `/public/orchestrator/verify-email`
- ❌ `/user-account/account/approve/{token}` → Usar `/public/orchestrator/admin/approve/{token}`

---

### ✅ Request Body Correto:

#### verify-email (ambos endpoints):
```json
{
  "sessionId": "reg_1a2b3c4d5e6f7g8h9i0j",
  "verificationToken": "verify_abc123xyz789"
}
```

#### approve afiliado:
```json
{
  "action": "approve",
  "reason": "Organization meets all requirements"
}
```

#### approve conta (orchestrator):
```json
// SEM BODY - apenas token na URL
```

---

### ✅ Response Examples:

#### Success (verify-email):
```json
{
  "success": true,
  "sessionId": "reg_1a2b3c4d5e6f7g8h9i0j",
  "status": "email_verified",
  "message": "Email verified successfully. Your registration is now pending admin approval.",
  "nextSteps": ["Wait for admin approval", "Check your email for updates"]
}
```

#### Error (qualquer endpoint):
```json
{
  "code": 2001,
  "message": "Invalid or expired verification token"
}
```

---

### ✅ Códigos de Erro Principais:

- `1001` - Email já verificado
- `1004` - Conta já processada
- `2001` - Token inválido ou expirado ⭐ **MAIS COMUM**
- `2002` - Session não encontrada ⭐ **MAIS COMUM**
- `2003` - Dados de requisição inválidos
- `3001` - Sem permissão (admin)
- `4001` - Erro no Dataverse
- `5001` - Erro interno do servidor

---

### ✅ Verificação Admin:

Use JWT - campo `role`:
```typescript
const token = localStorage.getItem('authToken');
const decoded = jwtDecode<{ role: string }>(token);
const isAdmin = decoded.role === 'admin' || decoded.role === 'owner';
```

---

### ✅ Detalhes do Registro:

❌ **Endpoint não existe ainda**
✅ **Podem criar páginas sem essas informações** (apenas confirmação simples)

---

## 🎬 Próximos Passos

### Frontend (AGORA):
1. ✅ Implementar 6 páginas com endpoints corretos
2. ✅ Usar error codes para mensagens (consultar `ERROR_HANDLING_FRONTEND_GUIDE.md`)
3. ✅ Verificar admin via JWT (`role` field)
4. ✅ Timeout de 10 segundos nas chamadas
5. ✅ Testar com tokens reais (backend fornece)

### Backend (EM BREVE):
1. ⏳ Adicionar proteção JWT nos endpoints admin
2. ⏳ Criar endpoint de detalhes do registro
3. ⏳ Adicionar rate limiting
4. ⏳ Documentar endpoint de rejeição do orchestrator
5. ⏳ Atualizar templates de email com botões

---

## 📎 Anexos e Referências

- **Documentação de Erro:** `ERROR_HANDLING_FRONTEND_GUIDE.md`
- **Guia de Integração:** `FRONTEND_INTEGRATION_GUIDE.md`
- **Swagger (Testes):** `http://localhost:3000/api`

---

**Podem começar o desenvolvimento! 🚀**

Se tiverem dúvidas durante a implementação, perguntem que esclarecemos.

---

**Contato:** Backend Team  
**Data:** 01/12/2025  
**Revisão:** v1.0

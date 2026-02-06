# Perguntas para o Backend - Email Verification Implementation

**Data:** 01/12/2025  
**De:** Frontend Team  
**Para:** Backend Team  
**Assunto:** Confirmações necessárias para implementar páginas de verificação de email

---

## 📋 Contexto

Estamos prontos para implementar as 7 páginas solicitadas no documento `FRONTEND_EMAIL_VERIFICATION_REQUIREMENTS.md`. Temos toda a infraestrutura necessária (error handling, axios, componentes UI, etc.).

**Tempo estimado de desenvolvimento:** 2 dias (11-13 horas)

Antes de iniciar, precisamos de confirmações sobre alguns detalhes técnicos.

---

## 🔴 CRÍTICO - Bloqueadores (Precisamos urgentemente)

### 1. Confirmação de Endpoints

Por favor, confirmem se os endpoints abaixo estão **corretos** e **disponíveis**:

#### Verificação de Email (Usuário Regular)
```
POST /api/user-account/account/verify-email
```
- ✅ Endpoint está correto?
- ✅ Está implementado e funcionando?

#### Confirmação de Registro (Usuário Regular)
```
POST /api/user-account/account/confirm-email
```
- ✅ Endpoint está correto?
- ✅ Está implementado e funcionando?

#### Verificação de Email (Afiliado)
```
POST /api/user-account/affiliate/verify-email
```
- ✅ Endpoint está correto?
- ✅ Está implementado e funcionando?

#### Aprovação/Rejeição de Conta (Admin)
```
POST /api/user-account/account/approve/{token}
```
- ✅ Endpoint está correto?
- ✅ Está implementado e funcionando?

#### Aprovação/Rejeição de Afiliado (Admin)
```
POST /api/user-account/affiliate/approve/{token}
```
- ✅ Endpoint está correto?
- ✅ Está implementado e funcionando?

---

### 2. Estrutura de Request Body

Por favor, confirmem a estrutura **exata** do body para cada endpoint:

#### Para `/verify-email` e `/confirm-email`:
```typescript
{
  "sessionId": "string",
  "verificationToken": "string"
}
```
- ✅ Está correto?
- ✅ Nomes dos campos estão corretos? (`sessionId` ou `session`? `verificationToken` ou `token`?)

#### Para `/approve/{token}`:
```typescript
{
  "action": "approve" | "reject",
  "reason": "string" // opcional para approve, obrigatório para reject
}
```
- ✅ Está correto?
- ✅ Os valores de `action` são exatamente `"approve"` e `"reject"`?
- ✅ O campo `reason` é mesmo opcional para aprovação?

---

### 3. Estrutura de Response

**Por favor, forneçam exemplos REAIS de response** para cada endpoint:

#### Exemplo: Success Response
```typescript
// Exemplo para POST /api/user-account/account/verify-email
{
  "success": true,
  "message": "Email verified successfully",
  "sessionId": "abc123",
  // Há mais campos no response?
}
```

#### Exemplo: Error Response
```typescript
{
  "success": false,
  "message": "Invalid token",
  "code": 2001,
  // Há mais campos no response?
}
```

**❓ Pergunta:** Podem fornecer exemplos de response (sucesso E erro) para **cada um dos 5 endpoints**?

---

### 4. Códigos de Erro

O documento menciona estes códigos de erro:

| Código | Descrição |
|--------|-----------|
| `1001` | Email já verificado |
| `1004` | Conta já processada (aprovada/rejeitada) |
| `2001` | Token inválido ou expirado |
| `2002` | Session não encontrada |
| `3001` | Sem permissão (não é admin) |

**❓ Perguntas:**
1. Esses códigos estão corretos e sendo retornados pela API?
2. Há **outros códigos de erro** que não estão listados?
3. O campo com o código de erro no response se chama `code`, `errorCode`, ou outro nome?

---

## 🟡 IMPORTANTE - Pode bloquear páginas de Admin

### 5. Verificação de Privilégios Admin

As páginas de aprovação/rejeição precisam verificar se o usuário é admin.

**Como devemos fazer isso?**

#### Opção A: Campo no JWT
```typescript
// O JWT decodificado já contém um campo de role?
interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'affiliate'; // ← Este campo existe?
  // ou
  isAdmin: boolean; // ← Ou este?
}
```

#### Opção B: Endpoint dedicado
```typescript
// Existe um endpoint para verificar?
GET /api/auth/me
Response: {
  userId: string;
  email: string;
  isAdmin: boolean;
  role: string;
}
```

#### Opção C: Outra forma?

**❓ Pergunta:** Qual método devemos usar para verificar se o usuário é admin?

---

### 6. Informações do Registro (Para Admin Pages)

Para as páginas de aprovação/rejeição admin, seria útil mostrar informações do registro:

**Exemplo:**
```
┌────────────────────────────────────┐
│  Aprovar Registro                  │
│                                    │
│  Nome: João Silva                 │
│  Email: joao@example.com          │
│  Tipo: Occupational Therapist     │
│  Data: 01/12/2025                 │
│                                    │
│  [Aprovar] [Rejeitar]             │
└────────────────────────────────────┘
```

**❓ Perguntas:**
1. Existe um endpoint para buscar essas informações usando o token?
   ```typescript
   GET /api/admin/registration/{token}/details
   Response: {
     userName: string;
     userEmail: string;
     accountType: string;
     registrationDate: string;
     // ...outros dados
   }
   ```

2. Se não existe, **podemos criar as páginas sem essas informações por enquanto?** (mostramos apenas o formulário de aprovação/rejeição)

---

## 🟢 OPCIONAL - Nice to have

### 7. Rate Limiting

**❓ Perguntas:**
1. Os endpoints de verificação têm rate limiting?
2. Quantas tentativas de verificação são permitidas?
3. Qual o timeout recomendado para as chamadas?

### 8. Expiração de Tokens

**❓ Perguntas:**
1. Quanto tempo os tokens de verificação são válidos?
2. Quanto tempo os tokens de aprovação admin são válidos?
3. Quando um token expira, qual código de erro é retornado?

---

## 📝 Resumo do que Precisamos

### Para começar o desenvolvimento, precisamos:

#### 🔴 **URGENTE (Bloqueador):**
- [ ] ✅ Confirmação dos 5 endpoints (estão corretos?)
- [ ] 📄 Estrutura exata de request body para cada endpoint
- [ ] 📄 Exemplos de response (sucesso e erro) para cada endpoint
- [ ] 🔢 Lista completa de códigos de erro possíveis

#### 🟡 **IMPORTANTE (Para admin pages):**
- [ ] 🔐 Como verificar se usuário é admin
- [ ] 📊 Como obter informações do registro (ou se podemos fazer sem)

#### 🟢 **OPCIONAL:**
- [ ] ⏱️ Informações sobre rate limiting
- [ ] ⏰ Informações sobre expiração de tokens

---

## 🚀 Próximos Passos

### Após recebermos as respostas:

1. **Fase 1 (3 horas):** Criar componentes base + services
2. **Fase 2 (2 horas):** Implementar 3 páginas de verificação
3. **Fase 3 (3 horas):** Implementar 4 páginas de admin
4. **Fase 4 (3 horas):** Testes integrados
5. **Fase 5:** Vocês atualizam os templates de email com botões

**Total:** 2 dias de desenvolvimento

---

## 📞 Como Responder

Por favor, respondam neste formato para facilitar:

```markdown
### 1. Endpoints
✅ POST /api/user-account/account/verify-email - CORRETO
✅ POST /api/user-account/account/confirm-email - CORRETO
❌ POST /api/user-account/affiliate/verify-email - USAR: /api/user-account/affiliate/email-verification
etc...

### 2. Request Body - verify-email
{
  "sessionId": "string",
  "token": "string"  // ← Usar "token", não "verificationToken"
}

### 3. Response Examples
#### Success (verify-email):
{
  "success": true,
  "message": "Email verified",
  "data": {
    "sessionId": "abc123",
    "status": "verified"
  }
}

#### Error (verify-email):
{
  "success": false,
  "code": 2001,
  "message": "Invalid or expired token"
}

### 4. Códigos de Erro
- 1001: Email já verificado ✅
- 2001: Token inválido ✅
- 2002: Session não encontrada ✅
- 2003: [ADICIONAR SE HOUVER OUTROS]

### 5. Verificação Admin
Usar JWT - campo `role` no payload:
{
  "userId": "123",
  "email": "admin@osot.com",
  "role": "admin" // ← Verificar se role === 'admin'
}

### 6. Endpoint de Detalhes do Registro
❌ Não existe ainda
✅ Podem criar as páginas sem isso por enquanto
```

---

**Aguardamos retorno para iniciar o desenvolvimento! 🚀**

---

## 📎 Anexos

- **Documento original:** `FRONTEND_EMAIL_VERIFICATION_REQUIREMENTS.md`
- **Nossa análise completa:** `ANALISE_EMAIL_VERIFICATION_REQUIREMENTS.md`
- **Documentação de error handling:** `ERROR_HANDLING_FRONTEND_GUIDE.md`

---

**Contato:** Frontend Team  
**Data:** 01/12/2025

# Backend: Correção dos Campos de Erro de Conta Duplicada

**Data:** 14 de Janeiro de 2026  
**Prioridade:** Média  
**Tipo:** Bug Fix - Error Handling

---

## 📋 Problema Atual

O backend está enviando corretamente os dados de erro para contas duplicadas internamente, mas o **filtro de exceções HTTP está descartando campos importantes** antes de enviar a resposta ao frontend.

### O que está acontecendo:

1. **Backend gera exceção com todos os campos:**
```json
{
  "statusCode": 409,
  "error": "Duplicate Account",
  "message": "An account with the same name and date of birth already exists.",
  "suggestion": "If this is your account (b.a*************@yahoo.com), please try logging in...",
  "maskedEmail": "b.a*************@yahoo.com",
  "timestamp": "2026-01-14T20:37:37.312Z"
}
```

2. **Filtro de exceção transforma para:**
```json
{
  "code": 0,
  "message": "An account with the same name and date of birth already exists."
}
```

3. **Frontend recebe apenas** `code` e `message`, **perdendo** `maskedEmail` e `suggestion`.

---

## 🎯 Solução Necessária

Modificar os filtros de exceção HTTP para **preservar campos extras** quando a exceção contém dados estruturados.

### Arquivos a serem modificados:

#### 1. `src/common/errors/http-exception.filter.ts`

**Código atual (linhas ~34-45):**
```typescript
if (exception instanceof HttpException) {
  const status = exception.getStatus();
  const body = exception.getResponse();
  this.logger.error({ status, body });
  const message =
    typeof body === 'string'
      ? body
      : (body as { message?: string }).message || 'Erro HTTP';

  return res.status(status).json({
    code: 0,
    message,
  });
}
```

**Código corrigido:**
```typescript
if (exception instanceof HttpException) {
  const status = exception.getStatus();
  const body = exception.getResponse();
  this.logger.error({ status, body });
  
  // If body is an object, preserve all fields (not just message)
  if (typeof body === 'object' && body !== null) {
    // For structured error responses (like duplicate account errors with maskedEmail, suggestion, etc.)
    // Return the full body with code: 0 added
    return res.status(status).json({
      code: 0,
      ...body,
    });
  }
  
  // If body is a string, use simple format
  const message = typeof body === 'string' ? body : 'Erro HTTP';
  return res.status(status).json({
    code: 0,
    message,
  });
}
```

#### 2. `src/common/filters/global-http-exception.filter.ts`

**Adicionar antes da resposta final (após linha ~73):**
```typescript
// If the exception response has extra fields (like maskedEmail, suggestion), preserve them
let extraFields = {};
if (exception instanceof HttpException) {
  const res = exception.getResponse();
  if (typeof res === 'object' && res !== null) {
    // Extract all fields except message and error (which we handle separately)
    const { message: _, error: __, ...rest } = res as Record<string, unknown>;
    extraFields = rest;
  }
}

response.status(status).json({
  statusCode: status,
  timestamp: new Date().toISOString(),
  path: request.url,
  message,
  error,
  ...extraFields, // ← Adicionar campos extras aqui
});
```

---

## ✅ Resultado Esperado

Após as correções, a resposta HTTP 409 deve incluir todos os campos:

```json
{
  "code": 0,
  "statusCode": 409,
  "error": "Duplicate Account",
  "message": "An account with the same name and date of birth already exists.",
  "suggestion": "If this is your account (b.a*************@yahoo.com), please try logging in. If you forgot your password, use the password recovery option. If you believe this is an error or need assistance, please contact support.",
  "maskedEmail": "b.a*************@yahoo.com",
  "timestamp": "2026-01-14T20:37:37.312Z"
}
```

---

## 🧪 Como Testar

1. Reiniciar o servidor backend após as modificações
2. Tentar registrar um usuário com nome e data de nascimento já existentes
3. Verificar no console do frontend que `error.response.data` contém:
   - ✅ `maskedEmail` com email mascarado
   - ✅ `suggestion` com texto de sugestão
   - ✅ `statusCode: 409`
   - ✅ `error: "Duplicate Account"`
4. Verificar na interface que o email mascarado é exibido ao invés de "unknown@email.com"

---

## 📝 Observações

- O **frontend já está preparado** para receber e exibir esses campos
- A mudança é **retrocompatível** - não quebra respostas de erro existentes
- Aplicável a **qualquer HttpException com campos extras**, não apenas erros de duplicação
- Logs do backend mostram que os dados corretos estão sendo gerados, apenas o filtro está descartando

---

## 📎 Referências

- Logs do backend confirmando geração correta dos dados: ✅
- Frontend aguardando campos: `RegisterProfessionalPage.tsx` linha 375
- Página de exibição: `RegistrationDuplicateErrorContent.tsx` linha 15-16
- Issue relacionada: Duplicate account error page showing "unknown@email.com"

---

## 🔗 Contato

Se tiverem dúvidas sobre a implementação no frontend ou necessitarem de mais detalhes, estou disponível.

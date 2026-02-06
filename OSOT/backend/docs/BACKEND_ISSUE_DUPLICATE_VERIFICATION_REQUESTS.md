# Relatório: Requisições Duplicadas em Verificação de Email

## Problema Identificado

O endpoint `POST /api/public/orchestrator/verify-email` está recebendo **requisições duplicadas simultâneas** e retornando erro 409 (Conflict) na segunda requisição, causando confusão na UI do usuário.

## Evidência no Log do Servidor

**Timestamp: 10:44:20 AM**

```log
[MIDDLEWARE DEBUG] Received body: {"sessionId":"reg_minbkd8d_d15f13f7","verificationToken":"verify_a1adfdf4ee5aca3ebb071dbe04f046c446a309636fc7599c9a1512692b1ecd64"}
[Nest] 20284  - 12/01/2025, 10:44:20 AM     LOG [AccountOrchestratorPublicController] Processing email verification for session: reg_minbkd8d_d15f13f7

[MIDDLEWARE DEBUG] Received body: {"sessionId":"reg_minbkd8d_d15f13f7","verificationToken":"verify_a1adfdf4ee5aca3ebb071dbe04f046c446a309636fc7599c9a1512692b1ecd64"}
[Nest] 20284  - 12/01/2025, 10:44:20 AM     LOG [AccountOrchestratorPublicController] Processing email verification for session: reg_minbkd8d_d15f13f7
[Nest] 20284  - 12/01/2025, 10:44:20 AM     LOG [OrchestratorEmailWorkflowService] [2e11b2c1b0442d29] Processing email verification for session: reg_minbkd8d_d15f13f7
[Nest] 20284  - 12/01/2025, 10:44:20 AM   ERROR [OrchestratorEmailWorkflowService] [2e11b2c1b0442d29] Failed to verify email: Cannot verify email from state: email_verified. Expected: email_verification_pending
[Nest] 20284  - 12/01/2025, 10:44:20 AM   ERROR [AccountOrchestratorService] Failed to verify email for session reg_minbkd8d_d15f13f7: Cannot verify email from state: email_verified. Expected: email_verification_pending
[Nest] 20284  - 12/01/2025, 10:44:20 AM   ERROR [AccountOrchestratorPublicController] Email verification failed: Cannot verify email from state: email_verified. Expected: email_verification_pending
[Nest] 20284  - 12/01/2025, 10:44:20 AM   ERROR [HttpExceptionFilter] Object(2) {
  status: 409,
  body: {
    message: 'Cannot verify email from state: email_verified. Expected: email_verification_pending',
    error: 'Conflict',
    statusCode: 409
  }
}
```

## Análise

1. **Primeira requisição (10:44:20):** Inicia processamento e altera estado para `email_verified`
2. **Segunda requisição (10:44:20 - mesmo millisegundo):** Chega enquanto a primeira ainda está processando
3. **Segunda requisição falha:** Estado já foi alterado para `email_verified`, retorna erro 409
4. **Resultado:** Frontend recebe erro 409, mostra mensagem de erro ao usuário temporariamente

## Causa

React StrictMode em desenvolvimento executa effects duas vezes para detectar side effects, causando requisições duplicadas. Isso também pode ocorrer em produção devido a:
- Usuário clicando duas vezes no botão de email
- Problemas de rede causando retry automático
- Navegadores fazendo prefetch

## Impacto na UX

- Usuário vê mensagem de erro temporária antes do sucesso
- Confusão e desconforto ("fiz algo errado?")
- Experiência inconsistente

## Solução Recomendada (Backend)

**Implementar idempotência no endpoint de verificação de email:**

### Localização
`src/classes/orchestrator/account-orchestrator/services/orchestrator-email-workflow.service.ts`

### Método
`verifyEmail(sessionId: string, verificationToken: string)`

### Implementação Sugerida

**Antes (atual):**
```typescript
async verifyEmail(sessionId: string, verificationToken: string) {
  // ...validações...
  
  if (sessionData.status !== 'email_verification_pending') {
    throw new ConflictException(
      `Cannot verify email from state: ${sessionData.status}. Expected: email_verification_pending`
    );
  }
  
  // ...processa verificação...
}
```

**Depois (idempotente):**
```typescript
async verifyEmail(sessionId: string, verificationToken: string) {
  // ...validações...
  
  // ✅ Se já está verificado com o mesmo token, retornar sucesso (idempotente)
  if (sessionData.status === 'email_verified') {
    // Validar se é o mesmo token (segurança)
    if (sessionData.verificationToken === verificationToken) {
      this.logger.log(`Email already verified for session: ${sessionId}. Returning success (idempotent).`);
      return {
        success: true,
        message: 'Email verified successfully',
        sessionId: sessionId,
        status: 'email_verified'
      };
    } else {
      // Token diferente = tentativa de fraude
      throw new ConflictException('Email already verified with different token');
    }
  }
  
  // Estado inválido para verificação
  if (sessionData.status !== 'email_verification_pending') {
    throw new ConflictException(
      `Cannot verify email from state: ${sessionData.status}. Expected: email_verification_pending`
    );
  }
  
  // ...processa verificação normalmente...
}
```

### Benefícios

1. **Idempotência:** Múltiplas chamadas com mesmo token retornam mesmo resultado
2. **Melhor UX:** Nunca mostra erro ao usuário em requisições duplicadas legítimas
3. **Segurança mantida:** Tokens diferentes ainda retornam erro
4. **Padrão REST:** Endpoints idempotentes são best practice
5. **Resiliência:** Protege contra retries de rede, clicks duplos, etc.

## Alternativas

### Opção 2: Rate Limiting por SessionId
```typescript
// Rejeitar requisições duplicadas dentro de janela de tempo
if (this.recentVerifications.has(sessionId)) {
  throw new TooManyRequestsException('Verification already in progress');
}
this.recentVerifications.set(sessionId, Date.now());
setTimeout(() => this.recentVerifications.delete(sessionId), 5000);
```

**Desvantagens:** Pode rejeitar retries legítimas após falha de rede.

### Opção 3: Debouncing no Backend
Usar Redis para lock distribuído durante processamento.

**Desvantagens:** Mais complexo, requer infraestrutura adicional.

## Recomendação Final

**Implementar Opção 1 (Idempotência)** - É a solução mais simples, segura e alinhada com padrões REST. Resolve o problema atual e previne futuros casos de requisições duplicadas legítimas.

## Mesma Lógica Aplica-se a:

- `POST /api/public/affiliates/verify-email`
- `POST /api/public/orchestrator/admin/approve/:approvalToken`
- `POST /api/public/orchestrator/admin/reject/:rejectionToken`
- `POST /api/public/affiliates/approve/:approvalToken`

Todos esses endpoints deveriam ser idempotentes para garantir melhor experiência do usuário.

---

**Documento criado por:** Frontend Team  
**Data:** December 1, 2025  
**Prioridade:** Medium (UX Issue)  
**Tipo:** Enhancement Request

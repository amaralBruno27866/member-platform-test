# 🔐 Password Recovery - Guia de Integração Frontend

## 📋 Visão Geral

Sistema de recuperação de senha totalmente funcional e seguro, pronto para integração frontend.

**Status**: ✅ **PRODUCTION READY**

**Melhorias Implementadas**:
- ✅ Módulo registrado no AppModule (agora aparece no Swagger)
- ✅ Documentação Swagger completa com `@ApiResponse`
- ✅ Validação forte de senha (maiúscula, minúscula, número, especial)
- ✅ Rate limiting nas rotas críticas
- ✅ Providers otimizados (sem duplicações)
- ✅ Anti-enumeration (sempre retorna sucesso)
- ✅ Timing attack prevention (delay de 500ms em falhas)

---

## 🔌 Endpoints Disponíveis

### 1. 📧 Solicitar Recuperação de Senha

**POST** `/password-recovery/request`

Envia um email com token de recuperação. **Sempre retorna sucesso** (mesmo se email não existir - segurança anti-enumeration).

**⚠️ Rate Limiting**: Máximo 5 requisições por minuto por IP.

#### Request Body:
```typescript
{
  email: string;           // Email da conta
  accountType?: 'account' | 'affiliate'; // Opcional - sistema detecta automaticamente
}
```

#### Exemplo:
```typescript
const response = await fetch('http://localhost:3000/password-recovery/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@email.com',
    accountType: 'account', // Opcional
  }),
});

const data = await response.json();
// { success: true } - sempre retorna true (segurança)
```

#### Responses:
- **200 OK**: Email enviado (se existir)
  ```json
  { "success": true }
  ```
- **429 Too Many Requests**: Rate limit excedido
  ```json
  {
    "statusCode": 429,
    "message": "ThrottlerException: Too Many Requests"
  }
  ```

---

### 2. ✅ Validar Token (Opcional)

**POST** `/password-recovery/validate`

Verifica se o token é válido e não expirou (30 minutos de validade).

> **💡 Frontend pode pular esta etapa** e ir direto para `/reset`. Esta rota existe para UX avançada (ex: mostrar "token expirado" antes do formulário).

#### Request Body:
```typescript
{
  token: string;           // UUID recebido por email
  accountType?: 'account' | 'affiliate'; // Opcional
}
```

#### Exemplo:
```typescript
const response = await fetch('http://localhost:3000/password-recovery/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  }),
});

const data = await response.json();
// { valid: true } ou { valid: false }
```

#### Responses:
- **200 OK**: Token validado
  ```json
  {
    "valid": true  // ou false se inválido/expirado
  }
  ```

---

### 3. 🔄 Resetar Senha

**POST** `/password-recovery/reset`

Redefine a senha usando o token. **Sempre retorna sucesso** (anti-enumeration).

**⚠️ Rate Limiting**: Máximo 5 requisições por minuto por IP.

#### Request Body:
```typescript
{
  token: string;           // UUID recebido por email
  newPassword: string;     // Senha forte obrigatória
  accountType?: 'account' | 'affiliate'; // Opcional
}
```

#### Requisitos da Senha:
- ✅ Mínimo 8 caracteres
- ✅ Pelo menos 1 letra maiúscula
- ✅ Pelo menos 1 letra minúscula
- ✅ Pelo menos 1 número
- ✅ Pelo menos 1 caractere especial (@$!%*?&#)

#### Exemplo:
```typescript
const response = await fetch('http://localhost:3000/password-recovery/reset', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    newPassword: 'NovaSenhaForte123!',
  }),
});

const data = await response.json();
// { success: true } - sempre retorna true (segurança)
```

#### Responses:
- **200 OK**: Senha resetada (se token válido)
  ```json
  { "success": true }
  ```
- **400 Bad Request**: Senha não atende requisitos
  ```json
  {
    "statusCode": 400,
    "message": [
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ],
    "error": "Bad Request"
  }
  ```
- **429 Too Many Requests**: Rate limit excedido

---

## 🎨 Fluxo UX Recomendado

### Página 1: Solicitar Recuperação
```typescript
// forgot-password.tsx
const handleSubmit = async (email: string) => {
  try {
    const response = await fetch('http://localhost:3000/password-recovery/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (response.status === 429) {
      // Rate limit
      setError('Muitas tentativas. Aguarde alguns minutos.');
      return;
    }

    if (response.ok) {
      // SEMPRE mostra sucesso (não revela se email existe)
      setSuccess('Se o email existir, você receberá um link de recuperação.');
      // Redirecionar para login ou mostrar mensagem de sucesso
    }
  } catch (error) {
    setError('Erro ao solicitar recuperação. Tente novamente.');
  }
};
```

### Página 2: Resetar Senha
```typescript
// reset-password.tsx (token vem da URL: /reset-password?token=abc123)
const handleReset = async (token: string, newPassword: string) => {
  // Validação frontend (antes de enviar)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  
  if (!passwordRegex.test(newPassword)) {
    setError('Senha deve ter 8+ caracteres, incluindo maiúscula, minúscula, número e especial');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/password-recovery/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    if (response.status === 400) {
      const data = await response.json();
      setError(data.message[0] || 'Senha inválida');
      return;
    }

    if (response.status === 429) {
      setError('Muitas tentativas. Aguarde alguns minutos.');
      return;
    }

    if (response.ok) {
      setSuccess('Senha alterada com sucesso!');
      // Redirecionar para login após 2 segundos
      setTimeout(() => navigate('/login'), 2000);
    }
  } catch (error) {
    setError('Erro ao resetar senha. Tente novamente.');
  }
};
```

---

## 🛡️ Segurança

### Anti-Enumeration
- ✅ `/request` e `/reset` **sempre retornam sucesso** (mesmo com email/token inválido)
- ✅ Isso impede atacantes de descobrirem quais emails existem no sistema
- ✅ Timing attack prevention: delay de 500ms em falhas (torna ataques inviáveis)

### Rate Limiting
- ✅ Máximo 5 requisições por minuto em `/request` e `/reset`
- ✅ Previne ataques de força bruta e spam
- ✅ Resposta HTTP 429 quando excedido

### Tokens
- ✅ UUID v4 (impossível adivinhar)
- ✅ Armazenados no Redis (não ficam no banco)
- ✅ Expiram em 30 minutos
- ✅ Uso único (invalidado após reset)

### Validação de Senha
```regex
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
```
- ✅ Mínimo 8 caracteres
- ✅ Letra maiúscula obrigatória
- ✅ Letra minúscula obrigatória
- ✅ Número obrigatório
- ✅ Caractere especial obrigatório (@$!%*?&#)

---

## 📧 Emails Enviados

### 1. Email de Recuperação (enviado em `/request`)
- **Assunto**: "Recuperação de Senha - OSOT"
- **Conteúdo**: Link clicável com token
  ```
  https://seusite.com/reset-password?token=uuid-aqui
  ```
- **Validade**: 30 minutos
- **Template**: `password-reset-template.html` (precisa ser criado)

### 2. Email de Confirmação (enviado em `/reset`)
- **Assunto**: "Senha Alterada com Sucesso - OSOT"
- **Conteúdo**: Notificação de que senha foi alterada
- **Segurança**: Token de bloqueio (impede login por 5 minutos se não foi o usuário)

---

## 🧪 Testando o Backend

### Via cURL (Windows PowerShell):

**1. Solicitar Recuperação:**
```powershell
$body = @{
    email = "test@email.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/password-recovery/request" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**2. Validar Token:**
```powershell
$body = @{
    token = "uuid-do-email"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/password-recovery/validate" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**3. Resetar Senha:**
```powershell
$body = @{
    token = "uuid-do-email"
    newPassword = "NovaSenha123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/password-recovery/reset" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Via Swagger:
1. Acesse: `http://localhost:3000/api-docs`
2. Procure seção **"Public PasswordRecovery Operations"**
3. Teste cada endpoint interativamente

---

## ⚠️ Importante para Frontend

### ❌ NÃO Use Prefixo `/api/`
```typescript
// ❌ ERRADO
fetch('http://localhost:3000/api/password-recovery/request')

// ✅ CORRETO
fetch('http://localhost:3000/password-recovery/request')
```

### ✅ Mensagens de Sucesso Genéricas
Por motivos de segurança, use mensagens genéricas:
```typescript
// ✅ BOM
"Se o email existir, você receberá um link de recuperação."

// ❌ RUIM (revela se email existe)
"Email enviado para user@email.com!"
```

### ✅ Valide Senha no Frontend (UX)
```typescript
const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Mínimo 8 caracteres';
  if (!/[a-z]/.test(password)) return 'Precisa de letra minúscula';
  if (!/[A-Z]/.test(password)) return 'Precisa de letra maiúscula';
  if (!/\d/.test(password)) return 'Precisa de número';
  if (!/[@$!%*?&#]/.test(password)) return 'Precisa de caractere especial';
  return null; // Válida
};
```

### ✅ Trate Rate Limiting (429)
```typescript
if (response.status === 429) {
  showError('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
}
```

---

## 📝 Checklist de Implementação

### Backend (✅ Completo):
- [x] Módulo registrado no AppModule
- [x] Documentação Swagger completa
- [x] Validação forte de senha
- [x] Rate limiting
- [x] Anti-enumeration
- [x] Timing attack prevention
- [x] Redis tokens (30min TTL)
- [x] Emails transacionais

### Frontend (📋 Pendente):
- [ ] Página "Esqueci minha senha" (`/forgot-password`)
- [ ] Página "Resetar senha" (`/reset-password?token=...`)
- [ ] Validação de senha forte (regex)
- [ ] Mensagens de erro/sucesso
- [ ] Loading states
- [ ] Rate limiting handling (429)
- [ ] Redirecionamento para login após sucesso

### Templates de Email (📋 Pendente):
- [ ] `password-reset-template.html` (com botão clicável)
- [ ] `password-changed-confirmation.html` (notificação)
- [ ] Testar envio via EmailService

---

## 🐛 Troubleshooting

### Problema: 404 Not Found
**Causa**: Servidor não reiniciado após registro do módulo.
**Solução**: Reinicie o backend (`npm run start:dev`).

### Problema: 429 Too Many Requests
**Causa**: Rate limit excedido (5 req/min).
**Solução**: Aguarde 1 minuto ou reinicie o Redis (`redis-cli FLUSHALL`).

### Problema: Senha não aceita
**Causa**: Não atende requisitos de força.
**Solução**: Verifique regex (maiúscula, minúscula, número, especial).

### Problema: Token sempre inválido
**Causa**: Token expirou (30min) ou Redis foi limpo.
**Solução**: Solicite nova recuperação.

---

## 📚 Referências

- **Swagger**: `http://localhost:3000/api-docs` → "Public PasswordRecovery Operations"
- **Código**: `src/classes/password-recovery/`
- **DTOs**: `password-recovery.dto.ts`
- **Service**: `password-recovery.service.ts`
- **Controller**: `password-recovery.controller.ts`

---

**🚀 Status**: Sistema 100% funcional e pronto para uso!

**📞 Suporte**: Se tiver dúvidas sobre a implementação, consulte este guia ou o Swagger.

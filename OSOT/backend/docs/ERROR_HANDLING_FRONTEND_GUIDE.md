# 🚨 Error Handling - Frontend Integration Guide

**Version**: 1.0.0  
**Last Updated**: December 1, 2025  
**Status**: ✅ Sistema de erros implementado e funcional

---

## 📋 Sumário Executivo

O backend **já está retornando erros padronizados** para o frontend consumir. Todos os endpoints retornam erros no formato:

```json
{
  "code": 1003,
  "message": "Invalid credentials."
}
```

**O frontend precisa implementar:**
1. ✅ Capturar erros HTTP (400, 401, 404, 409, 500, etc.)
2. ✅ Ler o campo `code` e `message` do response body
3. ✅ Exibir mensagens de erro ao usuário
4. ✅ Traduzir mensagens (opcional)

---

## 🎯 Como Funciona (Backend)

### **1. Estrutura de Resposta de Erro**

Todos os erros retornam HTTP status code + JSON body:

```typescript
// HTTP Status: 401, 400, 404, 409, 500, etc.
// Body:
{
  "code": number,      // Código do erro (único por tipo)
  "message": string    // Mensagem em inglês (user-friendly)
}
```

### **2. Códigos de Erro Disponíveis**

O backend possui **26 códigos de erro** categorizados:

#### **Erros de Conta (1000-1999)**
- `1001` - Account not found
- `1002` - Account duplicate
- `1003` - **Invalid credentials** ⭐ (Login falhou)
- `1004` - Email already in use
- `1005` - Phone already in use
- `1006` - Account locked
- `1007` - Session expired
- `1008` - Insufficient privilege
- `1009` - Invalid account status
- `1010` - Registration expired

#### **Erros de Validação (2000-2999)**
- `2001` - Invalid input
- `2002` - Invalid email format
- `2003` - Invalid phone format
- `2004` - Invalid postal code
- `2005` - Invalid password strength
- `2006` - Invalid name format
- `2007` - Invalid search query

#### **Erros de Permissão (3000-3999)**
- `3001` - Permission denied
- `3002` - Conflict (recurso já existe)
- `3003` - Validation error
- `3004` - Business rule violation

#### **Erros de Serviços Externos (4000-4999)**
- `4001` - External service error
- `4002` - Dataverse service error
- `4003` - Redis service error
- `4004` - Email service error

#### **Erros de Aplicação (5000-5999)**
- `5001` - Not found
- `5002` - Internal error
- `5003` - Forbidden

#### **Erros de Educação (5100-5199)**
- `5101` - Education data not found
- `5102` - Invalid education category
- `5103` - Education data incomplete

---

## 💻 Como Consumir (Frontend)

### **Exemplo 1: Login com Credenciais Inválidas**

**Request:**
```typescript
POST /auth/login
Content-Type: application/json

{
  "osot_email": "user@example.com",
  "osot_password": "wrongpassword"
}
```

**Response:**
```typescript
// HTTP Status: 401 Unauthorized
{
  "code": 1003,
  "message": "Invalid credentials."
}
```

---

### **Implementação React/TypeScript**

#### **Opção 1: Fetch API Simples**

```typescript
async function login(email: string, password: string) {
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        osot_email: email,
        osot_password: password,
      }),
    });

    // ❌ Erro HTTP (401, 400, etc.)
    if (!response.ok) {
      const errorData = await response.json();
      
      // Exibir mensagem de erro ao usuário
      alert(errorData.message); // "Invalid credentials."
      
      // Ou usar toast/notification
      showError(errorData.message);
      
      // Ou tratar erro específico por código
      if (errorData.code === 1003) {
        showError('Email ou senha incorretos. Tente novamente.');
      }
      
      throw new Error(errorData.message);
    }

    // ✅ Login bem-sucedido
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data;
    
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

---

#### **Opção 2: Axios com Interceptor**

```typescript
import axios from 'axios';

// Criar instância do Axios
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratar erros globalmente
api.interceptors.response.use(
  (response) => response, // Sucesso
  (error) => {
    if (error.response) {
      const { code, message } = error.response.data;
      
      // Exibir erro ao usuário
      console.error(`Error ${code}: ${message}`);
      
      // Tratamento específico por código
      switch (code) {
        case 1003:
          showNotification('Email ou senha incorretos', 'error');
          break;
        case 1006:
          showNotification('Conta bloqueada. Contate o suporte.', 'error');
          break;
        case 1007:
          showNotification('Sessão expirada. Faça login novamente.', 'warning');
          // Redirecionar para login
          window.location.href = '/login';
          break;
        default:
          showNotification(message, 'error');
      }
    }
    
    return Promise.reject(error);
  }
);

// Usar a API
async function login(email: string, password: string) {
  try {
    const { data } = await api.post('/auth/login', {
      osot_email: email,
      osot_password: password,
    });
    
    localStorage.setItem('access_token', data.access_token);
    return data;
  } catch (error) {
    // Erro já foi tratado pelo interceptor
    throw error;
  }
}
```

---

#### **Opção 3: React Hook com Estado de Erro**

```typescript
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Limpar erro anterior
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          osot_email: email,
          osot_password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // ⭐ Definir mensagem de erro para exibir no UI
        setError(errorData.message);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      
      // Redirecionar para dashboard
      window.location.href = '/dashboard';
      
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      
      {/* ⭐ EXIBIR ERRO AO USUÁRIO */}
      {error && (
        <div className="error-message" style={{ color: 'red' }}>
          ⚠️ {error}
        </div>
      )}
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Login'}
      </button>
    </form>
  );
}
```

---

#### **Opção 4: React Query com Error Handling**

```typescript
import { useMutation } from '@tanstack/react-query';

function useLogin() {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          osot_email: credentials.email,
          osot_password: credentials.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error; // Lançar erro com code e message
      }

      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      window.location.href = '/dashboard';
    },
    onError: (error: any) => {
      // error.code e error.message estão disponíveis
      console.error('Login failed:', error.message);
    },
  });
}

// Uso no componente
function LoginForm() {
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... inputs ... */}
      
      {/* ⭐ EXIBIR ERRO */}
      {login.isError && (
        <div className="error">
          {login.error.message}
        </div>
      )}
      
      <button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Entrando...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## 🌐 Tradução de Mensagens (Opcional)

Se quiserem mensagens em português, criar um mapa de tradução:

```typescript
// errorMessages.ts
const ERROR_MESSAGES_PT_BR: Record<number, string> = {
  // Erros de conta
  1001: 'Conta não encontrada',
  1002: 'Conta duplicada',
  1003: 'Email ou senha incorretos',
  1004: 'Este email já está em uso',
  1005: 'Este telefone já está em uso',
  1006: 'Conta bloqueada. Contate o suporte',
  1007: 'Sessão expirada. Faça login novamente',
  1008: 'Privilégios insuficientes',
  1009: 'Status de conta inválido',
  1010: 'Registro expirado',
  
  // Erros de validação
  2001: 'Dados inválidos',
  2002: 'Formato de email inválido',
  2003: 'Formato de telefone inválido',
  2004: 'Código postal inválido',
  2005: 'Senha muito fraca',
  2006: 'Nome com caracteres inválidos',
  2007: 'Consulta de busca inválida',
  
  // Erros de permissão
  3001: 'Permissão negada',
  3002: 'Conflito: recurso já existe',
  3003: 'Erro de validação',
  3004: 'Violação de regra de negócio',
  
  // Erros de serviços
  4001: 'Erro em serviço externo',
  4002: 'Erro no Dataverse',
  4003: 'Erro no cache',
  4004: 'Erro ao enviar email',
  
  // Erros de aplicação
  5001: 'Recurso não encontrado',
  5002: 'Erro interno do sistema',
  5003: 'Acesso proibido',
  
  // Erros de educação
  5101: 'Dados educacionais não encontrados',
  5102: 'Categoria educacional inválida',
  5103: 'Dados educacionais incompletos',
  
  // Fallback
  0: 'Erro inesperado',
};

// Função helper
export function getErrorMessage(code: number): string {
  return ERROR_MESSAGES_PT_BR[code] || ERROR_MESSAGES_PT_BR[0];
}

// Uso
const errorData = await response.json();
const message = getErrorMessage(errorData.code);
showError(message); // "Email ou senha incorretos"
```

---

## 📊 Mapeamento de HTTP Status para Error Codes

| HTTP Status | Código | Significado | Exemplo |
|-------------|--------|-------------|---------|
| 400 | Vários | Bad Request | Dados inválidos, validação falhou |
| 401 | 1003 | Unauthorized | Credenciais inválidas |
| 403 | 3001, 5003 | Forbidden | Sem permissão |
| 404 | 1001, 5001 | Not Found | Recurso não encontrado |
| 409 | 1002, 3002 | Conflict | Recurso já existe |
| 500 | 5002 | Internal Error | Erro interno do servidor |

---

## 🎨 Exemplos de UI para Erros

### **Toast Notification (React Toastify)**

```typescript
import { toast } from 'react-toastify';

// Em caso de erro
if (!response.ok) {
  const error = await response.json();
  toast.error(error.message, {
    position: 'top-right',
    autoClose: 5000,
  });
}
```

### **Alert Bootstrap**

```typescript
{error && (
  <div className="alert alert-danger" role="alert">
    <strong>Erro!</strong> {error}
  </div>
)}
```

### **Material-UI Snackbar**

```typescript
import { Snackbar, Alert } from '@mui/material';

<Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
  <Alert severity="error" onClose={() => setError(null)}>
    {error}
  </Alert>
</Snackbar>
```

---

## ✅ Checklist para Frontend

- [ ] Implementar captura de erros HTTP (400, 401, 404, etc.)
- [ ] Ler campos `code` e `message` do response body
- [ ] Exibir mensagens de erro ao usuário (alert, toast, etc.)
- [ ] Implementar tratamento específico para erros críticos (1003, 1006, 1007)
- [ ] (Opcional) Criar mapa de tradução PT-BR
- [ ] Testar todos os cenários de erro (login falho, sessão expirada, etc.)
- [ ] Adicionar logs de erro para debugging

---

## 🧪 Testando Erros

### **Teste 1: Login com credenciais inválidas**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"osot_email":"test@test.com","osot_password":"wrong"}'

# Esperado:
# Status: 401
# Body: {"code":1003,"message":"Invalid credentials."}
```

### **Teste 2: Email duplicado no registro**
```bash
# Criar conta com email já existente
# Esperado: {"code":1004,"message":"This email is already in use."}
```

### **Teste 3: Token expirado**
```bash
curl -X GET http://localhost:3000/private/accounts/me \
  -H "Authorization: Bearer token-expirado"

# Esperado: {"code":1007,"message":"Session expired. Please log in again."}
```

---

## 📞 Resumo para o Frontend

**Sim, o sistema de erros JÁ ESTÁ IMPLEMENTADO no backend!** ✅

O que o frontend precisa fazer:

1. ✅ **Capturar erros HTTP** - Verificar `response.ok` ou usar `try/catch`
2. ✅ **Ler `error.code` e `error.message`** do JSON de resposta
3. ✅ **Exibir mensagens ao usuário** - Toast, alert, snackbar, etc.
4. ✅ **Traduzir (opcional)** - Criar mapa de códigos → mensagens em PT-BR

**Não precisa fazer nada no backend** - está pronto para consumo! 🚀

---

## 🔗 Referências

- **Error Codes**: `src/common/errors/error-codes.ts`
- **Error Messages**: `src/common/errors/error-messages.ts`
- **HTTP Filter**: `src/common/errors/http-exception.filter.ts`
- **Auth Controller**: `src/auth/auth.controller.ts`

---

**Autor**: OSOT Backend Team  
**Data**: December 1, 2025  
**Versão**: 1.0.0

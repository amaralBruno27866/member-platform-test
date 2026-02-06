# 🐛 Correção: Remover Prefixo `/api/` das URLs

**Data**: 1 de Dezembro de 2025  
**Prioridade**: 🔴 Alta (Bloqueando todas as requisições)  
**Time Afetado**: Frontend Development Team  
**Impacto**: Todas as rotas retornando 404

---

## 📋 Problema Identificado

O frontend está adicionando o prefixo `/api/` antes de todas as rotas, mas **o backend não usa esse prefixo**.

### ❌ URLs Erradas (Atuais)

```
POST /api/auth/login                  → 404 Not Found
GET  /api/private/accounts/me         → 404 Not Found
GET  /api/public/enums/all            → 404 Not Found
GET  /api/private/identities/me       → 404 Not Found
GET  /api/private/contacts/me         → 404 Not Found
```

### ✅ URLs Corretas (Como devem ser)

```
POST /auth/login                      → ✅ 200 OK
GET  /private/accounts/me             → ✅ 200 OK
GET  /public/enums/all                → ✅ 200 OK
GET  /private/identities/me           → ✅ 200 OK
GET  /private/contacts/me             → ✅ 200 OK
```

---

## 🔍 Evidência do Erro

### **Log do Backend**

```
[MIDDLEWARE DEBUG] Received body: {"osot_email":"b.alencar.amaral@gmail.com","osot_password":"Beag!e27866"}
[Nest] ERROR [HttpExceptionFilter] {
  status: 404,
  body: {
    message: 'Cannot POST /api/auth/login',  ← /api/ não existe no backend
    error: 'Not Found',
    statusCode: 404
  }
}
```

### **Análise**

- ✅ **Backend recebeu a requisição**: Corpo (body) foi logado corretamente
- ✅ **Credenciais corretas**: Email e senha estão sendo enviados
- ❌ **Rota errada**: Frontend chamou `/api/auth/login` em vez de `/auth/login`
- ❌ **404 Not Found**: Rota não existe no backend

---

## 🔧 Solução

### **Opção 1: Corrigir baseURL do Axios (Recomendado)**

Localizar o arquivo de configuração do Axios (geralmente `api.ts`, `axios.ts`, `axiosConfig.ts` ou similar).

#### **Antes (Incorreto)**

```typescript
// ❌ ERRADO - Tem /api no final
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Resultado: axios.post('/auth/login') → http://localhost:3000/api/auth/login ❌
```

#### **Depois (Correto)**

```typescript
// ✅ CORRETO - Sem /api
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
});

// Resultado: axios.post('/auth/login') → http://localhost:3000/auth/login ✅
```

---

### **Opção 2: Corrigir Proxy do Vite (Se estiver usando)**

Localizar `vite.config.ts` e ajustar o proxy.

#### **Antes (Incorreto)**

```typescript
// ❌ ERRADO - Proxy com /api
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});

// Problema: Todas as rotas precisam começar com /api/
```

#### **Depois (Correto)**

```typescript
// ✅ CORRETO - Proxy direto sem /api
export default defineConfig({
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/private': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/public': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});

// Agora: /auth/login → http://localhost:3000/auth/login ✅
```

---

### **Opção 3: Buscar e Substituir em Todo o Projeto**

Se as URLs estiverem hardcoded em vários arquivos:

#### **Buscar por:**

```
/api/auth/
/api/private/
/api/public/
```

#### **Substituir por:**

```
/auth/
/private/
/public/
```

---

## 📊 Tabela de Rotas Corretas

| Funcionalidade | URL Correta | URL Errada |
|----------------|-------------|------------|
| **Autenticação** |
| Login | `/auth/login` | ~~/api/auth/login~~ |
| Logout | `/auth/logout` | ~~/api/auth/logout~~ |
| **Rotas Privadas** |
| Minha Conta | `/private/accounts/me` | ~~/api/private/accounts/me~~ |
| Minha Identidade | `/private/identities/me` | ~~/api/private/identities/me~~ |
| Meu Contato | `/private/contacts/me` | ~~/api/private/contacts/me~~ |
| Meu Endereço | `/private/addresses/me` | ~~/api/private/addresses/me~~ |
| Meu Management | `/private/managements/me` | ~~/api/private/managements/me~~ |
| Meu Employment | `/private/membership-employments/me` | ~~/api/private/membership-employments/me~~ |
| Minhas Practices | `/private/membership-practices/me` | ~~/api/private/membership-practices/me~~ |
| Minhas Preferences | `/private/membership-preferences/me` | ~~/api/private/membership-preferences/me~~ |
| **Rotas Públicas** |
| Todos os Enums | `/public/enums/all` | ~~/api/public/enums/all~~ |
| Províncias | `/public/enums/provinces` | ~~/api/public/enums/provinces~~ |
| Gêneros | `/public/enums/genders` | ~~/api/public/enums/genders~~ |
| Criar Conta | `/public/accounts` | ~~/api/public/accounts~~ |
| Criar Identidade | `/public/identities` | ~~/api/public/identities~~ |

---

## ✅ Checklist de Implementação

### **1. Identificar Configuração**

- [ ] Localizar arquivo de configuração do Axios (`api.ts`, `axios.ts`, etc.)
- [ ] Verificar se há `vite.config.ts` com proxy configurado
- [ ] Buscar por hardcoded URLs com `/api/`

### **2. Aplicar Correções**

- [ ] Remover `/api` da `baseURL` do Axios
- [ ] Ou ajustar proxy do Vite para rotas diretas
- [ ] Ou fazer busca/substituição em todo o projeto

### **3. Testar Rotas**

- [ ] Login (`/auth/login`) funciona
- [ ] Enums (`/public/enums/all`) carrega
- [ ] Account (`/private/accounts/me`) retorna dados
- [ ] Não há mais erros 404 no console
- [ ] Backend loga requisições com URLs corretas

---

## 🎯 Exemplo Completo de Configuração

### **Arquivo: src/services/api.ts**

```typescript
import axios from 'axios';

// ✅ CORRETO: baseURL sem /api
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000', // Sem /api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar JWT
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### **Uso nos Services**

```typescript
// src/services/authService.ts
import api from './api';

export const login = async (email: string, password: string) => {
  // ✅ CORRETO: /auth/login (sem /api)
  const response = await api.post('/auth/login', {
    osot_email: email,
    osot_password: password,
  });
  return response.data;
};

// src/services/accountService.ts
export const getMyAccount = async () => {
  // ✅ CORRETO: /private/accounts/me (sem /api)
  const response = await api.get('/private/accounts/me');
  return response.data;
};

// src/services/enumService.ts
export const getAllEnums = async () => {
  // ✅ CORRETO: /public/enums/all (sem /api)
  const response = await api.get('/public/enums/all');
  return response.data;
};
```

---

## 🐛 Como Verificar se Está Correto

### **1. Network Tab do Navegador**

Abrir DevTools → Network → Fazer login:

```
✅ Deve aparecer: POST http://localhost:3000/auth/login
❌ Se aparecer:   POST http://localhost:3000/api/auth/login
```

### **2. Console do Backend**

Após fazer login, deve aparecer:

```
✅ CORRETO:
[JwtStrategy] JWT validated for user: b.alencar.amaral@gmail.com
[AccountPrivateController] Getting account record for user

❌ ERRADO (se ainda tiver /api):
[HttpExceptionFilter] Cannot POST /api/auth/login
```

### **3. Console do Frontend**

```
✅ Não deve ter erros 404
✅ Requisições devem retornar 200 OK
✅ Login deve funcionar
✅ Dados devem carregar
```

---

## 📚 Documentação de Referência

- `FRONTEND_INTEGRATION_GUIDE.md` - Todas as rotas do backend
- `PRIVATE_ROUTES_CONSUMPTION_GUIDE.md` - Como consumir rotas privadas
- `BACKEND_CORS_RESOLUTION_RESPONSE.md` - Resposta sobre CORS

---

## ⏱️ Estimativa de Tempo

| Tarefa | Tempo Estimado |
|--------|----------------|
| Localizar arquivo de config | 5 minutos |
| Aplicar correção | 5 minutos |
| Testar todas as rotas | 10 minutos |
| **Total** | **20 minutos** |

---

## 🎉 Resultado Esperado

Após a correção:

```
✅ Login funciona sem erros 404
✅ Todas as rotas públicas acessíveis
✅ Todas as rotas privadas acessíveis
✅ Enums carregam corretamente
✅ Dados de usuário carregam
✅ Sem erros no console
✅ Backend loga requisições corretamente
```

---

**Resumo**: Remover `/api/` de todas as configurações de URL. O backend não usa esse prefixo.

**Arquivo de configuração mais provável**: `src/services/api.ts` ou `src/config/axios.ts`

**Mudança necessária**: `baseURL: 'http://localhost:3000/api'` → `baseURL: 'http://localhost:3000'`

---

_Documento gerado pelo Backend Development Team_  
_Data: 1 de Dezembro de 2025_

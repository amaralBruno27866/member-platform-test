# 🔒 Guia de Consumo de Rotas Privadas - OSOT Dataverse API

**Versão**: 1.0.0  
**Data de Atualização**: 1 de Dezembro de 2025  
**API Base URL**: `http://localhost:3000` (Desenvolvimento) | `https://api.osot.com` (Produção)

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação JWT](#autenticação-jwt)
3. [Configuração do Cliente HTTP](#configuração-do-cliente-http)
4. [Rotas Privadas Disponíveis](#rotas-privadas-disponíveis)
5. [Padrões de Uso](#padrões-de-uso)
6. [Exemplos de Implementação](#exemplos-de-implementação)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Boas Práticas](#boas-práticas)
9. [Segurança](#segurança)

---

## 🎯 Visão Geral

Todas as rotas privadas da API requerem **autenticação JWT** (JSON Web Token) e seguem um padrão consistente de implementação.

### **Características das Rotas Privadas**

✅ **Autenticação Obrigatória**: Todas as rotas exigem `Authorization: Bearer {token}`  
✅ **Context do Usuário**: Token JWT contém informações do usuário (`userId`, `email`, `role`, `privilege`)  
✅ **Validação Automática**: Guard JWT valida token em cada requisição  
✅ **Blacklist Check**: Tokens em blacklist (logout global) são rejeitados  
✅ **Controle de Acesso**: Permissões baseadas em privilégios (OWNER, ADMIN, MAIN)  

---

## 🔐 Autenticação JWT

### **1. Obter Token de Autenticação**

**Endpoint**: `POST /auth/login`

```typescript
const loginResponse = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    osot_email: 'user@example.com',
    osot_password: 'SecurePass123!',
  }),
});

const { access_token, user } = await loginResponse.json();

// Exemplo de resposta:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "osot_user_guid_account": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "osot_email": "user@example.com",
    "osot_first_name": "John",
    "osot_last_name": "Doe",
    "userType": "account"
  }
}
```

### **2. Estrutura do JWT Payload**

O token JWT contém as seguintes informações:

```typescript
interface JwtPayload {
  sub: string;           // User ID (GUID)
  email: string;         // Email do usuário
  role: string;          // Role: 'owner', 'admin', 'main'
  privilege?: number;    // Nível de privilégio (1=MAIN, 2=ADMIN, 3=OWNER)
  userType?: string;     // Tipo: 'account' ou 'affiliate'
  iat: number;           // Issued at (timestamp)
  exp: number;           // Expiration (timestamp)
}
```

**Extraído automaticamente pelo backend via `@User()` decorator**:

```typescript
// No backend, o controller recebe:
@User('userId') userId: string        // → sub do JWT
@User('email') email: string          // → email do JWT
@User('role') role: string            // → role do JWT
@User('privilege') privilege: number  // → privilege do JWT
@User() user: Record<string, unknown> // → Payload completo
```

### **3. Armazenar Token no Frontend**

```typescript
// Opção 1: LocalStorage (mais comum)
localStorage.setItem('access_token', access_token);

// Opção 2: SessionStorage (expira ao fechar navegador)
sessionStorage.setItem('access_token', access_token);

// Opção 3: Cookie HTTP-Only (mais seguro, requer configuração no backend)
// Set-Cookie: access_token=xyz; HttpOnly; Secure; SameSite=Strict
```

**⚠️ Importante**: Tokens no `localStorage` são vulneráveis a XSS. Para produção, considere cookies HTTP-Only.

### **4. Usar Token nas Requisições**

**Todas as rotas privadas exigem o header `Authorization`**:

```typescript
const response = await fetch('http://localhost:3000/private/accounts/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json',
  },
});
```

### **5. Validação do Token (Backend)**

O backend valida automaticamente cada requisição:

1. **JwtAuthGuard** extrai o token do header `Authorization`
2. **JwtStrategy** valida assinatura e expiração
3. **RedisService** verifica se token está em blacklist
4. Se válido, anexa dados do usuário ao request (`@User()`)
5. Se inválido, retorna `401 Unauthorized`

---

## ⚙️ Configuração do Cliente HTTP

### **Opção 1: Fetch API com Wrapper**

```typescript
// src/services/api.service.ts
class ApiService {
  private baseUrl = 'http://localhost:3000';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('access_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    // Verificar se token expirou
    if (response.status === 401) {
      this.clearToken();
      // Redirecionar para login
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();
```

**Uso:**

```typescript
// Login e armazenar token
const { access_token } = await api.post('/auth/login', {
  osot_email: 'user@example.com',
  osot_password: 'password123',
});
api.setToken(access_token);

// Fazer requisições privadas
const account = await api.get('/private/accounts/me');
const updated = await api.patch('/private/accounts/me', {
  osot_email: 'newemail@example.com',
});
```

---

### **Opção 2: Axios com Interceptor**

```typescript
// src/services/axios.service.ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Adiciona token automaticamente
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

// Response Interceptor - Trata erros 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

**Uso:**

```typescript
import axios from './services/axios.service';

// Login
const { data } = await axios.post('/auth/login', {
  osot_email: 'user@example.com',
  osot_password: 'password123',
});
localStorage.setItem('access_token', data.access_token);

// Requisições privadas (token adicionado automaticamente)
const account = await axios.get('/private/accounts/me');
const updated = await axios.patch('/private/accounts/me', {
  osot_email: 'newemail@example.com',
});
```

---

### **Opção 3: React Query + Axios**

```typescript
// src/hooks/useAuth.ts
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: any | null;
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('access_token'),
  user: null,
  setToken: (token) => {
    localStorage.setItem('access_token', token);
    set({ token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('access_token');
    set({ token: null, user: null });
  },
}));

// src/hooks/usePrivateApi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../services/axios.service';

export const usePrivateAccount = () => {
  const queryClient = useQueryClient();

  // GET /private/accounts/me
  const { data: account, isLoading } = useQuery({
    queryKey: ['account', 'me'],
    queryFn: async () => {
      const { data } = await axios.get('/private/accounts/me');
      return data;
    },
  });

  // PATCH /private/accounts/me
  const updateAccount = useMutation({
    mutationFn: async (updates: any) => {
      const { data } = await axios.patch('/private/accounts/me', updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'me'] });
    },
  });

  return { account, isLoading, updateAccount };
};
```

**Uso em Componente:**

```typescript
import { usePrivateAccount } from '../hooks/usePrivateApi';

const AccountPage = () => {
  const { account, isLoading, updateAccount } = usePrivateAccount();

  const handleUpdate = () => {
    updateAccount.mutate({
      osot_email: 'newemail@example.com',
    });
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>{account.osot_email}</h1>
      <button onClick={handleUpdate}>Atualizar Email</button>
    </div>
  );
};
```

---

## 📡 Rotas Privadas Disponíveis

### **Padrão das Rotas Privadas**

Todas as rotas privadas seguem este padrão:

| Rota | Método | Descrição | Permissão |
|------|--------|-----------|-----------|
| `/private/{resource}/me` | GET | Obter meu próprio recurso | Todos |
| `/private/{resource}/me` | PATCH | Atualizar meu próprio recurso | Todos |
| `/private/{resource}/me` | POST | Criar meu próprio recurso | Todos |
| `/private/{resource}` | GET | Listar todos os recursos | Admin/Main |
| `/private/{resource}/:id` | GET | Obter recurso específico | Admin/Main |
| `/private/{resource}/:id` | PATCH | Atualizar recurso específico | Admin/Main |
| `/private/{resource}/:id` | DELETE | Deletar recurso específico | Main |

---

### **1. Account (Conta de Usuário)**

**Base Path**: `/private/accounts`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/private/accounts/me` | Obter minha conta | Owner+ |
| PATCH | `/private/accounts/me` | Atualizar minha conta | Owner+ |
| GET | `/private/accounts` | Listar todas as contas | Admin+ |
| GET | `/private/accounts/:id` | Obter conta específica | Admin+ |
| PATCH | `/private/accounts/:id` | Atualizar conta específica | Admin+ |

**Exemplo - Obter Minha Conta:**

```typescript
const response = await fetch('http://localhost:3000/private/accounts/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const account = await response.json();
// {
//   "osot_user_guid_account": "a1b2...",
//   "osot_email": "user@example.com",
//   "osot_type_account": "Individual",
//   "osot_privilege": 3, // 1=MAIN, 2=ADMIN, 3=OWNER
//   ...
// }
```

**Exemplo - Atualizar Minha Conta:**

```typescript
const response = await fetch('http://localhost:3000/private/accounts/me', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    osot_email: 'newemail@example.com',
  }),
});
```

---

### **2. Identity (Identidade)**

**Base Path**: `/private/identities`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/private/identities/me` | Obter minha identidade | Owner+ |
| PATCH | `/private/identities/me` | Atualizar minha identidade | Owner+ |
| GET | `/private/identities` | Listar todas as identidades | Admin+ |
| GET | `/private/identities/:id` | Obter identidade específica | Admin+ |

**Exemplo:**

```typescript
const identity = await api.get('/private/identities/me');
// {
//   "osot_user_guid_identity": "...",
//   "osot_first_name": "John",
//   "osot_last_name": "Doe",
//   "osot_preferred_name": "Johnny",
//   "osot_pronouns": "He/Him",
//   "osot_gender": "Male",
//   "osot_birth_date": "1990-05-15",
//   ...
// }

await api.patch('/private/identities/me', {
  osot_preferred_name: 'Johnny',
  osot_pronouns: 'They/Them',
});
```

---

### **3. Contact (Contato)**

**Base Path**: `/private/contacts`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/private/contacts/me` | Obter meu contato | Owner+ |
| PATCH | `/private/contacts/me` | Atualizar meu contato | Owner+ |
| GET | `/private/contacts` | Listar todos os contatos | Admin+ |
| GET | `/private/contacts/:id` | Obter contato específico | Admin+ |

**Exemplo:**

```typescript
const contact = await api.get('/private/contacts/me');
// {
//   "osot_user_guid_contact": "...",
//   "osot_telephone_home": "+1-416-555-1234",
//   "osot_telephone_cell": "+1-416-555-5678",
//   "osot_primary_email": "user@example.com",
//   "osot_secondary_email": "backup@example.com",
//   ...
// }

await api.patch('/private/contacts/me', {
  osot_telephone_cell: '+1-416-555-9999',
});
```

---

### **4. Address (Endereço)**

**Base Path**: `/private/addresses`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/private/addresses/me` | Obter meu endereço | Owner+ |
| PATCH | `/private/addresses/me` | Atualizar meu endereço | Owner+ |
| GET | `/private/addresses` | Listar todos os endereços | Admin+ |
| GET | `/private/addresses/:id` | Obter endereço específico | Admin+ |

**Exemplo:**

```typescript
const address = await api.get('/private/addresses/me');
// {
//   "osot_user_guid_address": "...",
//   "osot_street_address_1": "123 Main Street",
//   "osot_city": "Toronto",
//   "osot_province": "Ontario",
//   "osot_postal_code": "M5H 2N2",
//   "osot_country": "Canada",
//   ...
// }

await api.patch('/private/addresses/me', {
  osot_street_address_1: '456 New Street',
  osot_postal_code: 'M4B 1B3',
});
```

---

### **5. Management (Gestão)**

**Base Path**: `/private/managements`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| POST | `/private/managements/me` | Criar meu management | Owner+ |
| GET | `/private/managements/me` | Obter meu management | Owner+ |
| PATCH | `/private/managements/me` | Atualizar meu management | Owner+ |
| GET | `/private/managements` | Listar todos os managements | Admin+ |
| GET | `/private/managements/:id` | Obter management específico | Admin+ |

**Exemplo:**

```typescript
// Criar management
const management = await api.post('/private/managements/me', {
  osot_job_title: 'Clinical Director',
  osot_organization_name: 'ABC Clinic',
  osot_organization_email: 'contact@abcclinic.com',
});

// Obter management
const myManagement = await api.get('/private/managements/me');

// Atualizar management
await api.patch('/private/managements/me', {
  osot_job_title: 'Senior Clinical Director',
});
```

---

### **6. OT Education (Educação OT)**

**Base Path**: `/private/ot-educations`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/private/ot-educations/me` | Obter minha educação OT | Owner+ |
| PATCH | `/private/ot-educations/me` | Atualizar minha educação OT | Owner+ |
| GET | `/private/ot-educations` | Listar todas as educações OT | Admin+ |
| GET | `/private/ot-educations/:id` | Obter educação OT específica | Admin+ |
| PATCH | `/private/ot-educations/business/:businessId` | Atualizar por Business ID | Admin+ |

**Exemplo:**

```typescript
const otEducation = await api.get('/private/ot-educations/me');
// {
//   "osot_user_guid_ot_education": "...",
//   "osot_university": "University of Toronto",
//   "osot_degree": "Master of Science in Occupational Therapy",
//   "osot_entry_practice_year": "2015",
//   "osot_coto_status": "Active Member",
//   ...
// }

await api.patch('/private/ot-educations/me', {
  osot_coto_status: 'Inactive Member',
});
```

---

### **7. OTA Education (Educação OTA)**

**Base Path**: `/private/ota-educations`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/private/ota-educations/me` | Obter minha educação OTA | Owner+ |
| PATCH | `/private/ota-educations/me` | Atualizar minha educação OTA | Owner+ |
| GET | `/private/ota-educations` | Listar todas as educações OTA | Admin+ |
| GET | `/private/ota-educations/:id` | Obter educação OTA específica | Admin+ |
| PATCH | `/private/ota-educations/business/:businessId` | Atualizar por Business ID | Admin+ |

---

### **8. Affiliate (Afiliado)**

**Base Path**: `/private/affiliates`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/private/affiliates/me` | Obter meu affiliate | Owner+ |
| PATCH | `/private/affiliates/me` | Atualizar meu affiliate | Owner+ |
| GET | `/private/affiliates` | Listar todos os affiliates | Admin+ |
| GET | `/private/affiliates/:businessId` | Obter affiliate por Business ID | Admin+ |
| PATCH | `/private/affiliates/:businessId` | Atualizar affiliate específico | Admin+ |

**Exemplo:**

```typescript
const affiliate = await api.get('/private/affiliates/me');
// {
//   "osot_user_guid_affiliate": "...",
//   "osot_organization_name": "XYZ Therapy Services",
//   "osot_organization_email": "info@xyztherapy.com",
//   "osot_affiliate_area": "Toronto",
//   ...
// }
```

---

### **9. Membership Category (Categoria de Membro)**

**Base Path**: `/private/membership-categories`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| POST | `/private/membership-categories/me` | Criar minha categoria | Owner+ |
| GET | `/private/membership-categories/me` | Obter minha categoria | Owner+ |
| PATCH | `/private/membership-categories/me` | Atualizar minha categoria | Owner+ |
| GET | `/private/membership-categories` | Listar todas as categorias | Admin+ |
| GET | `/private/membership-categories/:id` | Obter categoria específica | Admin+ |

**Exemplo:**

```typescript
// Criar categoria
const category = await api.post('/private/membership-categories/me', {
  osot_membership_category: 'Full Member',
  osot_membership_year: '2025',
});

// Obter categoria
const myCategory = await api.get('/private/membership-categories/me');

// Atualizar categoria
await api.patch('/private/membership-categories/me', {
  osot_membership_category: 'Associate Member',
});
```

---

### **10. Membership Employment (Emprego de Membro)**

**Base Path**: `/private/membership-employments`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| POST | `/private/membership-employments/me` | Criar meu employment | Owner+ |
| GET | `/private/membership-employments/me` | Obter meu employment | Owner+ |
| PATCH | `/private/membership-employments/me` | Atualizar meu employment | Owner+ |
| GET | `/private/membership-employments` | Listar todos os employments | Admin+ |
| GET | `/private/membership-employments/:id` | Obter employment específico | Admin+ |
| PATCH | `/private/membership-employments/:id` | Atualizar employment específico | Admin+ |

**Exemplo:**

```typescript
// Criar employment
const employment = await api.post('/private/membership-employments/me', {
  osot_employment_status: 'Employee (Salaried)',
  osot_work_hours: ['Exactly 35 hours', 'More than 37 hours'],
  osot_role_descriptor: 'Direct/Indirect Care Provider',
  osot_practice_years: 'Between 6 and 10 years',
  osot_position_funding: ['Provincial Government (Health)'],
  osot_employment_benefits: ['Extended Health/Dental Care', 'Pension'],
  osot_earnings_employment: 'Between $41 to $50',
  osot_union_name: 'OPSEU',
  osot_another_employment: false,
});

// Obter employment
const myEmployment = await api.get('/private/membership-employments/me');

// Atualizar employment
await api.patch('/private/membership-employments/me', {
  osot_employment_status: 'Self-Employed',
  osot_practice_years: 'More than 10 years',
});
```

---

### **11. Membership Practices (Práticas de Membro)**

**Base Path**: `/private/membership-practices`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| POST | `/private/membership-practices/me` | Criar minhas practices | Owner+ |
| GET | `/private/membership-practices/me` | Obter minhas practices | Owner+ |
| PATCH | `/private/membership-practices/me` | Atualizar minhas practices | Owner+ |
| GET | `/private/membership-practices` | Listar todas as practices | Admin+ |
| GET | `/private/membership-practices/:id` | Obter practices específicas | Admin+ |
| PATCH | `/private/membership-practices/:id` | Atualizar practices específicas | Admin+ |

**Exemplo:**

```typescript
// Criar practices
const practices = await api.post('/private/membership-practices/me', {
  osot_practice_area: ['Mental Health', 'Pediatrics'],
  osot_practice_service: ['Assessment', 'Treatment', 'Consultation'],
  osot_practice_setting: ['Hospital', 'Community Health Center'],
  osot_clients_age: ['Children (0-12)', 'Adults (18-64)'],
});

// Obter practices
const myPractices = await api.get('/private/membership-practices/me');

// Atualizar practices
await api.patch('/private/membership-practices/me', {
  osot_practice_area: ['Mental Health', 'Geriatrics'],
});
```

---

### **12. Membership Preferences (Preferências de Membro)**

**Base Path**: `/private/membership-preferences`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| POST | `/private/membership-preferences/me` | Criar minhas preferences | Owner+ |
| GET | `/private/membership-preferences/me` | Obter minhas preferences | Owner+ |
| PATCH | `/private/membership-preferences/me` | Atualizar minhas preferences | Owner+ |

**Exemplo:**

```typescript
// Criar preferences
const preferences = await api.post('/private/membership-preferences/me', {
  osot_practice_promotion: 'Yes',
  osot_psychotherapy_supervision: 'No',
  osot_search_tool: ['Google', 'OSOT Website'],
  osot_third_party: 'Yes',
});

// Obter preferences
const myPreferences = await api.get('/private/membership-preferences/me');

// Atualizar preferences
await api.patch('/private/membership-preferences/me', {
  osot_practice_promotion: 'No',
  osot_third_party: 'No',
});
```

---

### **13. Membership Settings (Configurações de Membro)**

**Base Path**: `/private/membership-settings`

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| POST | `/private/membership-settings` | Criar settings (Admin) | Main |
| GET | `/private/membership-settings/me` | Obter meus settings | Owner+ |
| PATCH | `/private/membership-settings/me` | Atualizar meus settings | Owner+ |
| GET | `/private/membership-settings` | Listar todos os settings | Admin+ |
| GET | `/private/membership-settings/:id` | Obter settings específicos | Admin+ |

---

## 🎯 Padrões de Uso

### **1. Rotas `/me` (Self-Management)**

Todas as rotas `/me` permitem que usuários gerenciem seus próprios dados:

```typescript
// Padrão: GET /private/{resource}/me
const myData = await api.get('/private/accounts/me');
const myIdentity = await api.get('/private/identities/me');
const myContact = await api.get('/private/contacts/me');

// Padrão: PATCH /private/{resource}/me
await api.patch('/private/accounts/me', updates);
await api.patch('/private/identities/me', updates);
await api.patch('/private/contacts/me', updates);

// Padrão: POST /private/{resource}/me (recursos que podem ser criados)
await api.post('/private/membership-categories/me', data);
await api.post('/private/membership-employments/me', data);
```

**Características**:
- ✅ Disponível para todos os usuários autenticados (privilege: OWNER+)
- ✅ Automaticamente vinculado ao `userId` do JWT
- ✅ Não requer ID no parâmetro (extraído do token)
- ✅ Sempre retorna apenas dados do próprio usuário

---

### **2. Rotas Admin (List/Specific)**

Rotas para administradores gerenciarem todos os recursos:

```typescript
// Listar todos os recursos (Admin/Main)
const allAccounts = await api.get('/private/accounts');
const allContacts = await api.get('/private/contacts?page=1&limit=50');

// Obter recurso específico por ID (Admin/Main)
const account = await api.get('/private/accounts/:id');
const contact = await api.get('/private/contacts/:id');

// Atualizar recurso específico (Admin/Main)
await api.patch('/private/accounts/:id', updates);
await api.patch('/private/contacts/:id', updates);
```

**Características**:
- ⚠️ Requer privilege: `ADMIN` (2) ou `MAIN` (1)
- ⚠️ Retorna `403 Forbidden` se usuário não tem privilégio
- ✅ Permite gerenciar recursos de outros usuários
- ✅ Suporta paginação (`?page=1&limit=50`)

---

### **3. Controle de Privilégios**

O backend verifica automaticamente privilégios usando o `@User()` decorator:

```typescript
// Backend (NestJS)
private getUserPrivilege(user: Record<string, unknown>): Privilege {
  const privilege = (user?.privilege as number) || (user?.osot_privilege as number);
  return typeof privilege === 'number' 
    ? (privilege as Privilege) 
    : Privilege.OWNER; // Default: menor privilégio
}

// Enum de privilégios
enum Privilege {
  MAIN = 1,   // Acesso total (superadmin)
  ADMIN = 2,  // Acesso administrativo
  OWNER = 3,  // Acesso apenas aos próprios dados
}
```

**Verificação no Frontend:**

```typescript
interface UserPrivilege {
  MAIN: 1,
  ADMIN: 2,
  OWNER: 3,
}

const userPrivilege = 3; // Extraído do JWT ou do /private/accounts/me

// Verificar se usuário é admin
const isAdmin = userPrivilege <= UserPrivilege.ADMIN;

// Exibir UI condicionalmente
{isAdmin && (
  <button onClick={() => api.get('/private/accounts')}>
    Ver Todas as Contas
  </button>
)}
```

---

## 💻 Exemplos de Implementação

### **Exemplo 1: Hook React para Account**

```typescript
// src/hooks/useAccount.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.service';

export const useAccount = () => {
  const queryClient = useQueryClient();

  // GET /private/accounts/me
  const {
    data: account,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['account', 'me'],
    queryFn: () => api.get('/private/accounts/me'),
  });

  // PATCH /private/accounts/me
  const updateAccount = useMutation({
    mutationFn: (updates: any) => api.patch('/private/accounts/me', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'me'] });
    },
  });

  return {
    account,
    isLoading,
    error,
    updateAccount,
  };
};

// Uso no componente
const AccountSettings = () => {
  const { account, isLoading, updateAccount } = useAccount();

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>{account.osot_email}</h1>
      <button
        onClick={() =>
          updateAccount.mutate({
            osot_email: 'newemail@example.com',
          })
        }
      >
        Atualizar Email
      </button>
    </div>
  );
};
```

---

### **Exemplo 2: Hook React para Membership Employment**

```typescript
// src/hooks/useMembershipEmployment.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.service';

export const useMembershipEmployment = () => {
  const queryClient = useQueryClient();

  // GET /private/membership-employments/me
  const { data: employment, isLoading } = useQuery({
    queryKey: ['membership-employment', 'me'],
    queryFn: () => api.get('/private/membership-employments/me'),
  });

  // POST /private/membership-employments/me
  const createEmployment = useMutation({
    mutationFn: (data: any) =>
      api.post('/private/membership-employments/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-employment', 'me'] });
    },
  });

  // PATCH /private/membership-employments/me
  const updateEmployment = useMutation({
    mutationFn: (updates: any) =>
      api.patch('/private/membership-employments/me', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-employment', 'me'] });
    },
  });

  return {
    employment,
    isLoading,
    createEmployment,
    updateEmployment,
  };
};

// Uso no componente
const EmploymentForm = () => {
  const { employment, createEmployment, updateEmployment } = useMembershipEmployment();

  const handleSubmit = (formData: any) => {
    if (employment) {
      updateEmployment.mutate(formData);
    } else {
      createEmployment.mutate(formData);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit({
        osot_employment_status: 'Employee (Salaried)',
        osot_work_hours: ['Exactly 35 hours'],
        osot_role_descriptor: 'Direct/Indirect Care Provider',
      });
    }}>
      {/* Form fields */}
      <button type="submit">
        {employment ? 'Atualizar' : 'Criar'} Employment
      </button>
    </form>
  );
};
```

---

### **Exemplo 3: Componente de Perfil Completo**

```typescript
// src/components/UserProfile.tsx
import { useAccount } from '../hooks/useAccount';
import { useIdentity } from '../hooks/useIdentity';
import { useContact } from '../hooks/useContact';
import { useAddress } from '../hooks/useAddress';

const UserProfile = () => {
  const { account } = useAccount();
  const { identity } = useIdentity();
  const { contact } = useContact();
  const { address } = useAddress();

  return (
    <div className="profile">
      <h1>Meu Perfil</h1>

      <section>
        <h2>Informações da Conta</h2>
        <p>Email: {account?.osot_email}</p>
        <p>Tipo: {account?.osot_type_account}</p>
      </section>

      <section>
        <h2>Identidade</h2>
        <p>Nome: {identity?.osot_first_name} {identity?.osot_last_name}</p>
        <p>Nome Preferido: {identity?.osot_preferred_name}</p>
        <p>Pronomes: {identity?.osot_pronouns}</p>
      </section>

      <section>
        <h2>Contato</h2>
        <p>Telefone: {contact?.osot_telephone_cell}</p>
        <p>Email: {contact?.osot_primary_email}</p>
      </section>

      <section>
        <h2>Endereço</h2>
        <p>{address?.osot_street_address_1}</p>
        <p>{address?.osot_city}, {address?.osot_province}</p>
        <p>{address?.osot_postal_code}</p>
      </section>
    </div>
  );
};
```

---

### **Exemplo 4: Admin Dashboard (Lista de Usuários)**

```typescript
// src/components/AdminDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.service';
import { useAuthStore } from '../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuthStore();

  // Verificar se usuário é admin
  const isAdmin = user?.privilege && user.privilege <= 2;

  // GET /private/accounts (Admin only)
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts', 'all'],
    queryFn: () => api.get('/private/accounts'),
    enabled: isAdmin, // Só executa se for admin
  });

  if (!isAdmin) {
    return <div>Acesso negado. Você não tem privilégios de admin.</div>;
  }

  if (isLoading) return <div>Carregando contas...</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Nome</th>
            <th>Privilégio</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account: any) => (
            <tr key={account.osot_user_guid_account}>
              <td>{account.osot_user_guid_account}</td>
              <td>{account.osot_email}</td>
              <td>
                {account.osot_first_name} {account.osot_last_name}
              </td>
              <td>{account.osot_privilege}</td>
              <td>
                <button
                  onClick={() =>
                    api.get(`/private/accounts/${account.osot_user_guid_account}`)
                  }
                >
                  Ver Detalhes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## ⚠️ Tratamento de Erros

### **Erros Comuns em Rotas Privadas**

| Status | Código | Mensagem | Causa | Solução |
|--------|--------|----------|-------|---------|
| 401 | 1007 | Session expired | Token expirado | Re-login ou refresh token |
| 401 | 1008 | JWT token is blacklisted | Logout global | Re-login |
| 401 | - | Unauthorized | Token inválido/ausente | Verificar token no header |
| 403 | 3001 | Permission denied | Sem privilégio | Verificar privilege do usuário |
| 404 | 5001 | Not found | Recurso não existe | Verificar ID do recurso |
| 409 | 3002 | Conflict | Violação de constraint | Verificar dados duplicados |

### **Tratamento no Frontend**

```typescript
// src/services/api.service.ts
private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    });

    // Token expirado ou inválido
    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    // Sem permissão
    if (response.status === 403) {
      throw new Error('Você não tem permissão para acessar este recurso.');
    }

    // Recurso não encontrado
    if (response.status === 404) {
      throw new Error('Recurso não encontrado.');
    }

    // Conflito (dados duplicados)
    if (response.status === 409) {
      const error = await response.json();
      throw new Error(error.message || 'Conflito ao processar requisição.');
    }

    // Erro genérico
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro na requisição.');
    }

    return response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}
```

### **Tratamento com Toast Notifications**

```typescript
// src/hooks/useApiWithToast.ts
import { toast } from 'react-toastify';
import { api } from '../services/api.service';

export const useApiWithToast = () => {
  const get = async (endpoint: string) => {
    try {
      return await api.get(endpoint);
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const post = async (endpoint: string, data: any) => {
    try {
      const result = await api.post(endpoint, data);
      toast.success('Criado com sucesso!');
      return result;
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const patch = async (endpoint: string, data: any) => {
    try {
      const result = await api.patch(endpoint, data);
      toast.success('Atualizado com sucesso!');
      return result;
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  return { get, post, patch };
};

// Uso
const MyComponent = () => {
  const api = useApiWithToast();

  const handleUpdate = async () => {
    await api.patch('/private/accounts/me', {
      osot_email: 'newemail@example.com',
    });
    // Toast de sucesso exibido automaticamente
  };
};
```

---

## ✅ Boas Práticas

### **1. Gerenciamento de Token**

```typescript
// ✅ BOM: Verificar expiração do token
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    return Date.now() >= expiresAt;
  } catch {
    return true;
  }
};

// ✅ BOM: Refresh automático antes de expirar
useEffect(() => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  const checkAndRefresh = () => {
    if (isTokenExpired(token)) {
      // Redirecionar para login ou fazer refresh
      logout();
    }
  };

  const interval = setInterval(checkAndRefresh, 60000); // Verificar a cada 1 min
  return () => clearInterval(interval);
}, []);

// ❌ RUIM: Não verificar expiração
const token = localStorage.getItem('access_token');
// Usar token sem verificar se expirou
```

### **2. Caching de Dados**

```typescript
// ✅ BOM: Cache com React Query
const { data: account } = useQuery({
  queryKey: ['account', 'me'],
  queryFn: () => api.get('/private/accounts/me'),
  staleTime: 5 * 60 * 1000, // 5 minutos
  cacheTime: 10 * 60 * 1000, // 10 minutos
});

// ❌ RUIM: Fetch em cada render
useEffect(() => {
  api.get('/private/accounts/me').then(setAccount);
}, []); // Re-fetch desnecessário
```

### **3. Loading States**

```typescript
// ✅ BOM: Loading state por recurso
const { isLoading: accountLoading } = useAccount();
const { isLoading: identityLoading } = useIdentity();

if (accountLoading || identityLoading) {
  return <Spinner />;
}

// ❌ RUIM: Loading global sem granularidade
const [isLoading, setIsLoading] = useState(false);
```

### **4. Error Boundaries**

```typescript
// ✅ BOM: Error boundary para rotas privadas
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  fallback={<div>Erro ao carregar dados. Tente novamente.</div>}
  onError={(error) => console.error('Private route error:', error)}
>
  <UserProfile />
</ErrorBoundary>
```

### **5. Validação de Privilégios no Frontend**

```typescript
// ✅ BOM: UI condicional baseada em privilégios
const { user } = useAuthStore();
const isAdmin = user?.privilege && user.privilege <= 2;

{isAdmin ? (
  <AdminDashboard />
) : (
  <UserDashboard />
)}

// ❌ RUIM: Assumir que backend vai bloquear tudo
// Sempre validar no frontend também para melhor UX
```

---

## 🔒 Segurança

### **1. Armazenamento de Token**

**Opções de Armazenamento:**

| Método | Segurança | Persistência | Uso |
|--------|-----------|--------------|-----|
| **LocalStorage** | ⚠️ Vulnerável a XSS | ✅ Persiste após fechar | Desenvolvimento |
| **SessionStorage** | ⚠️ Vulnerável a XSS | ❌ Expira ao fechar | Temporário |
| **HttpOnly Cookie** | ✅ Seguro contra XSS | ✅ Persiste | Produção (recomendado) |
| **Memory (State)** | ✅ Mais seguro | ❌ Perde ao recarregar | Single-page session |

**Recomendação para Produção:**

```typescript
// Backend configura cookie HTTP-Only
res.cookie('access_token', token, {
  httpOnly: true,    // Não acessível via JavaScript
  secure: true,      // Apenas HTTPS
  sameSite: 'strict', // Proteção CSRF
  maxAge: 3600000,   // 1 hora
});

// Frontend não precisa armazenar manualmente
// Cookie enviado automaticamente pelo navegador
```

### **2. Proteção contra XSS**

```typescript
// ✅ BOM: Sanitizar inputs antes de renderizar
import DOMPurify from 'dompurify';

const safeHtml = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />;

// ❌ RUIM: Renderizar input do usuário diretamente
<div dangerouslySetInnerHTML={{ __html: userInput }} />; // XSS!
```

### **3. HTTPS em Produção**

```typescript
// ✅ BOM: Sempre usar HTTPS em produção
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.osot.com'
  : 'http://localhost:3000';

// ❌ RUIM: HTTP em produção
const API_BASE_URL = 'http://api.osot.com'; // Inseguro!
```

### **4. Validação de Token no Frontend**

```typescript
// ✅ BOM: Verificar estrutura do token antes de usar
const isValidToken = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    return payload.sub && payload.email && payload.exp;
  } catch {
    return false;
  }
};

const token = localStorage.getItem('access_token');
if (token && !isValidToken(token)) {
  localStorage.removeItem('access_token');
}
```

### **5. Rate Limiting no Frontend**

```typescript
// ✅ BOM: Debounce em requisições frequentes
import { debounce } from 'lodash';

const debouncedUpdate = debounce(
  (data) => api.patch('/private/accounts/me', data),
  1000
);

// ❌ RUIM: Múltiplas requisições sem controle
onChange={(e) => api.patch('/private/accounts/me', { value: e.target.value })}
```

---

## 📞 Suporte

- **Documentação da API**: http://localhost:3000/api-docs
- **OpenAPI Schema**: http://localhost:3000/openapi.json
- **Guia de Erros**: `ERROR_HANDLING_FRONTEND_GUIDE.md`
- **Guia de Integração Geral**: `FRONTEND_INTEGRATION_GUIDE.md`

---

## 🔄 Histórico de Versões

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0.0 | 2025-12-01 | Documentação inicial de rotas privadas |

---

**Desenvolvimento Seguro! 🔒**

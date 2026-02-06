# 🐛 BUG REPORT - Redirecionamento Indevido para Login em Rotas Protegidas

**Data:** 14 de Janeiro de 2026  
**Severidade:** 🔴 **CRÍTICA** - Bloqueia navegação do usuário  
**Componente:** Frontend (React Router + Auth Guards)  
**Status Backend:** ✅ Funcional e corrigido

---

## 📋 Resumo Executivo

Após login bem-sucedido, o usuário consegue acessar o dashboard mas **é redirecionado para `/auth/login`** ao tentar navegar para rotas protegidas como:
- `/user/profile`
- `/user/address`
- `/user/contact`
- `/user/identity`
- `/user/education`

**Comportamento anômalo:** O redirecionamento acontece **SEM fazer request HTTP** (Network tab vazia), indicando que o problema está no frontend (guards/routing), não no backend.

---

## 🔍 Análise do Problema

### 1. Sintomas Observados

#### ✅ **O que funciona:**
- Login completo (`POST /auth/login`)
- Token JWT salvo em `sessionStorage`
- Dashboard carrega (`GET /api/accounts/me` - status 200)
- Membership errors são esperados (404 - usuário não registrou)

#### ❌ **O que NÃO funciona:**
- Navegação para rotas `/user/*` (exceto dashboard)
- Nenhum request HTTP é feito antes do redirect
- Network tab permanece vazia
- Console mostra apenas warnings do React Router

---

### 2. Evidências no Console do Navegador

```javascript
// ✅ Login bem-sucedido
🔐 Login payload: Object
🔐 Login Response: Object
✅ Redirecting to USER dashboard (privilege = 1)
🚀 Final redirect path: /user/dashboard

// ✅ ProtectedRoute autoriza acesso
🔒 ProtectedRoute checking auth... Object
🔑 User privilege from session: 1
✅ Privilege check passed: 1 >= 1 - authorized

// ❌ Ao tentar navegar para Address/Profile/Contact:
// (NENHUM LOG ADICIONAL - redirect acontece silenciosamente)

// ⚠️ React Router warnings (problema estrutural):
Matched leaf route at location "/auth/login" does not have an element or Component. 
This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.
```

---

### 3. Problemas Identificados no Código

#### 🔴 **Problema 1: Estrutura de Rotas Incorreta**

**Arquivo:** `frontend/src/lib/router.tsx` (linhas ~28-57)

**Código atual:**
```tsx
{
  path: '/auth',
  element: <AuthPagesLayout />,
  children: [
    {
      path: 'login',
      index: true,  // ❌ SEM element definido
    },
    {
      path: 'forgot-password',  // ❌ SEM element definido
    },
    {
      path: 'register',
      children: [
        {
          index: true,  // ❌ SEM element definido
        },
        {
          path: 'professional',  // ❌ SEM element definido
        },
        {
          path: 'affiliate',  // ❌ SEM element definido
        },
      ]
    }
  ]
}
```

**Problema:** React Router v6 exige que rotas `children` tenham `element` ou usem `<Outlet />`. Como `AuthPagesLayout` **não usa `<Outlet />`** (renderiza baseado na URL), as rotas estão malformadas.

**Solução:**
```tsx
// Opção A: Adicionar element: null
{
  path: 'login',
  element: null,  // ✅ Explicitamente nulo
}

// Opção B: Remover children e usar rotas diretas
{
  path: '/auth/login',
  element: <AuthPagesLayout />,
},
{
  path: '/auth/forgot-password',
  element: <AuthPagesLayout />,
},
```

---

#### 🟡 **Problema 2: Possível Race Condition no ProtectedRoute**

**Arquivo:** `frontend/src/components/auth/ProtectedRoute.tsx` (linhas ~70-85)

**Código suspeito:**
```tsx
// Wait for profile to load for STAFF-specific checks
if (isLoading) {
  console.log('⏳ Profile loading...');
  return; // Keep loading state
}

if (error || !profile) {
  // FALLBACK: If profile fetch fails but user has valid session
  console.warn('⚠️ Failed to fetch user profile, using fallback', { error, hasProfile: !!profile });
  
  if (!requireStaff && !requireAdminPrivileges) {
    console.log('✅ Fallback: No STAFF requirements - authorized');
    setAuthorized(true);  // ✅ Deveria funcionar aqui
    return;
  }
  
  console.log('❌ Fallback: STAFF requirements but no profile - denied');
  setAuthorized(false);  // ❌ Pode estar executando erroneamente?
  return;
}
```

**Hipótese:** Se `useUserProfile` retornar `error` temporariamente (mesmo com token válido), o fallback pode estar negando acesso incorretamente.

---

#### 🟡 **Problema 3: Interceptor Axios Muito Agressivo**

**Arquivo:** `frontend/src/lib/api.ts` (linhas ~40-55)

**Código atual:**
```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      // Clear session data
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('userType');
      sessionStorage.removeItem('role');
      
      // Redirect
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';  // ⚠️ Redirect forçado
      }
    }
    
    return Promise.reject(error);
  }
);
```

**Problema:** Se algum request retornar 401 (mesmo que não deveria), o interceptor **imediatamente** limpa a sessão e redireciona, sem dar chance de fallback.

---

## 🛠️ Plano de Debug (Para o Time Frontend)

### **Passo 1: Adicionar Logs Detalhados no Interceptor**

**Arquivo:** `frontend/src/lib/api.ts`

```typescript
api.interceptors.response.use(
  (response) => {
    // 🟢 DEBUG: Log successful requests
    console.log('✅ [API] Success:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
    });
    return response;
  },
  (error) => {
    // 🔴 DEBUG: Log EVERY error before any action
    console.log('🚨 [API INTERCEPTOR] Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      hasToken: !!sessionStorage.getItem('access_token'),
      tokenValue: sessionStorage.getItem('access_token')?.substring(0, 20) + '...',
    });

    if (error.response?.status === 401) {
      console.log('🔴 [401 DETECTED] URL:', error.config?.url);
      console.log('🔴 [401 DETECTED] Will redirect in 1 second...');
      
      // Delay para ver o log antes do redirect
      setTimeout(() => {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userType');
        sessionStorage.removeItem('role');
        
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
      }, 1000);
      
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);
```

---

### **Passo 2: Adicionar Logs no ProtectedRoute**

**Arquivo:** `frontend/src/components/auth/ProtectedRoute.tsx`

```tsx
useEffect(() => {
  async function checkAuth() {
    const currentPath = window.location.pathname;
    const hasToken = !!sessionStorage.getItem('access_token');
    
    console.log('🔒 [ProtectedRoute] Auth Check Started:', {
      path: currentPath,
      requireStaff,
      requireAdminPrivileges,
      minPrivilege,
      isLoading,
      hasProfile: !!profile,
      hasError: !!error,
      hasToken,
      tokenPreview: hasToken ? sessionStorage.getItem('access_token')?.substring(0, 20) + '...' : 'NONE',
    });

    const isAuthenticated = authService.isAuthenticated();
    
    if (!isAuthenticated) {
      console.log('❌ [ProtectedRoute] Not authenticated - will redirect');
      setAuthorized(false);
      return;
    }

    console.log('✅ [ProtectedRoute] Is authenticated');

    // ... resto do código com logs adicionais em cada branch
    
    if (error || !profile) {
      console.warn('⚠️ [ProtectedRoute] Profile fetch issue:', {
        hasError: !!error,
        errorMessage: error?.message,
        hasProfile: !!profile,
        requireStaff,
        requireAdminPrivileges,
        willAuthorize: !requireStaff && !requireAdminPrivileges,
      });
      
      if (!requireStaff && !requireAdminPrivileges) {
        console.log('✅ [ProtectedRoute] Fallback authorized (no STAFF required)');
        setAuthorized(true);
        return;
      }
      
      console.log('❌ [ProtectedRoute] Fallback denied (STAFF required but no profile)');
      setAuthorized(false);
      return;
    }

    console.log('✅ [ProtectedRoute] All checks passed - authorized');
    setAuthorized(true);
  }

  checkAuth();
}, [requireStaff, requireAdminPrivileges, minPrivilege, profile, isLoading, error]);

// Adicionar log no render final
console.log('🎨 [ProtectedRoute] Rendering decision:', {
  authorized,
  isLoading,
  willRedirect: authorized === false,
  path: window.location.pathname,
});
```

---

### **Passo 3: Adicionar Logs no useUserProfile Hook**

**Arquivo:** `frontend/src/hooks/useUserProfile.ts`

```typescript
export function useUserProfile(): UseQueryResult<UserProfile | null, Error> {
  return useQuery<UserProfile | null>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      console.log('📞 [useUserProfile] Fetching profile...');
      
      try {
        const profile = await authService.fetchUserProfile();
        console.log('✅ [useUserProfile] Profile fetched:', {
          first_name: profile.osot_first_name,
          email: profile.osot_email,
          account_group: profile.osot_account_group,
          privilege: profile.osot_privilege,
        });
        return profile;
      } catch (error) {
        console.error('❌ [useUserProfile] Fetch failed:', error);
        
        const basicUser = authService.getCurrentUser();
        if (basicUser) {
          console.log('⚠️ [useUserProfile] Using fallback from sessionStorage');
          return {
            osot_first_name: basicUser.osot_first_name || 'User',
            osot_last_name: basicUser.osot_last_name || '',
            osot_email: basicUser.osot_email || basicUser.email || 'user@email.com',
            osot_account_group: 0,
            osot_privilege: authService.getUserPrivilege() || 1,
          } as UserProfile;
        }
        
        console.error('❌ [useUserProfile] No fallback available');
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    enabled: authService.isAuthenticated(),
  });
}
```

---

### **Passo 4: Verificar Estado do SessionStorage**

Adicionar no console do navegador **IMEDIATAMENTE ANTES** de clicar em "Address":

```javascript
// Copiar e colar no console do DevTools:
console.log('🔍 SessionStorage State:', {
  access_token: sessionStorage.getItem('access_token')?.substring(0, 30) + '...',
  user: JSON.parse(sessionStorage.getItem('user') || 'null'),
  userType: sessionStorage.getItem('userType'),
  role: sessionStorage.getItem('role'),
  privilege: sessionStorage.getItem('privilege'),
  organizationSlug: sessionStorage.getItem('organizationSlug'),
});
```

---

## 📊 Informações Esperadas do Debug

Após aplicar os logs acima, ao reproduzir o problema (Login → Dashboard → Clicar em Address), me enviem:

### 1. **Console Logs Completos**
- Todos os logs desde o clique até o redirect
- Ordem cronológica dos logs (qual aparece primeiro?)

### 2. **Network Tab**
- Algum request HTTP é feito?
- Se sim, qual URL e qual status code?
- Headers do request (especialmente `Authorization`)

### 3. **SessionStorage State**
- Output do script acima (estado ANTES do clique)

### 4. **Timing**
- O redirect é instantâneo ou tem delay?
- Algum log aparece entre o clique e o redirect?

---

## 🔧 Soluções Provisórias (Para Teste)

### **Teste 1: Desabilitar Redirect no Interceptor**

Comentar temporariamente o redirect para ver se o problema é o 401:

```typescript
// frontend/src/lib/api.ts
if (error.response?.status === 401) {
  console.error('❌ 401 Unauthorized - DEBUG MODE: NOT redirecting');
  // window.location.href = '/auth/login';  // ⛔ COMENTADO PARA DEBUG
}
```

**Se isso resolver:** O problema é que algum request está retornando 401 indevidamente.

**Se continuar redirecionando:** O problema está no `ProtectedRoute` ou nas rotas.

---

### **Teste 2: Forçar Authorized no ProtectedRoute**

```tsx
// frontend/src/components/auth/ProtectedRoute.tsx
useEffect(() => {
  async function checkAuth() {
    console.log('🔒 [DEBUG MODE] Forcing authorized = true');
    setAuthorized(true);  // ⛔ FORÇAR para debug
    return;
    
    // ... resto do código comentado temporariamente
  }
  checkAuth();
}, []);
```

**Se isso resolver:** O problema está na lógica de autorização do `ProtectedRoute`.

**Se continuar redirecionando:** O problema está na configuração das rotas.

---

## ✅ Confirmação do Backend

**Status:** ✅ **Totalmente funcional**

### Mudanças Aplicadas no Backend:

**Arquivo:** `src/utils/dataverse-app.helper.ts`

```typescript
export function getAppForOperation(
  operation: 'create' | 'read' | 'write' | 'delete',
  userRole?: string,
): DataverseApp {
  switch (operation) {
    case 'read':
      // SEMPRE usa 'main' para operações de leitura
      // Correção aplicada: apps 'owner' e 'admin' não têm permissão de leitura em tabelas
      return 'main';
    // ... outros cases
  }
}
```

**Efeito:** TODAS as entidades (Account, Address, Contact, Identity, Education, Membership, etc.) agora usam o app `'main'` com permissões completas para leitura.

**Testes realizados:**
- ✅ Login funciona (retorna token JWT válido)
- ✅ Dashboard carrega (GET `/api/accounts/me` - status 200)
- ✅ Account data encontrada (Business ID: osot-0000232)
- ✅ Organization context correto (GUID decriptado)

**Logs do backend (sem erros):**
```
[Nest] 27376  - 01/14/2026, 11:38:07 AM     LOG [AccountApiController] User profile retrieved successfully
📊 [findByBusinessId] Found 1 records for osot-0000232
✅ Privilege check passed: 1 >= 1 - authorized
```

---

## 🎯 Próximos Passos

1. **Aplicar os logs de debug** nos 3 arquivos mencionados
2. **Reproduzir o problema:** Login → Dashboard → Clicar em "Address"
3. **Coletar evidências:**
   - Screenshots do console completo
   - Network tab (mesmo que vazio)
   - Estado do sessionStorage
4. **Enviar para análise** com todas as evidências

---

## 📝 Notas Adicionais

### Diferença entre Dashboard e outras rotas:

| Rota | Funciona? | Diferença |
|------|-----------|-----------|
| `/user/dashboard` | ✅ Sim | Carrega imediatamente após login |
| `/user/address` | ❌ Não | Navegação após dashboard já carregado |
| `/user/profile` | ❌ Não | Mesma situação |

**Hipótese:** Algo no ciclo de vida do componente/router está invalidando a sessão durante navegação entre rotas protegidas.

---

## 🆘 Contato

**Backend Developer:** Bruno Amaral  
**Status Backend:** ✅ Funcional e testado  
**Data do Report:** 14/01/2026  

**Se precisarem de testes adicionais no backend ou logs específicos, estou disponível.**

---

**IMPORTANTE:** Este bug é **BLOQUEANTE CRÍTICO** - usuários não conseguem usar a aplicação além do dashboard.

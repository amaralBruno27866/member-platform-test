# Frontend: Implementação de Redirecionamento por Privilege

**Data:** 13 de Janeiro de 2026  
**Para:** Equipe Frontend  
**De:** Backend Team

---

## 🎯 Objetivo

Implementar lógica de redirecionamento após login baseado no **privilege** do usuário:
- **MAIN (3) e ADMIN (2)** → Interface Admin (`/admin/dashboard`)
- **OWNER (1)** → Interface User (`/user/dashboard`)

---

## 📦 O que o Backend Retorna no Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "osot_email": "usuario@example.com",
  "osot_password": "senha123",
  "organizationSlug": "osot"
}
```

**Response (Success 200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "osot-account-0000001",
    "userGuid": "abc-def-123-456",
    "email": "usuario@example.com",
    "role": "main",
    "privilege": 3,           // ✅ USAR ISSO PARA REDIRECIONAR
    "userType": "account",
    "organizationId": "encrypted_guid_here",
    "organizationSlug": "osot",
    "organizationName": "OSOT"
  }
}
```

---

## 🔑 Privilege Levels

| Valor | Nome | Descrição | Interface |
|-------|------|-----------|-----------|
| `3` | MAIN | Super Admin - Acesso total | Admin |
| `2` | ADMIN | Admin Organizacional | Admin |
| `1` | OWNER | Usuário padrão | User |

---

## 💻 Implementação

### 1. Criar Utility para Decodificar JWT (Opcional)

```typescript
// src/utils/jwt.ts
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  userId: string;
  email: string;
  privilege: number;
  role: string;
  organizationSlug: string;
  // ... outros campos
}

export function decodeJwt(token: string): JwtPayload {
  return jwtDecode<JwtPayload>(token);
}

export function getUserPrivilege(token: string): number {
  const decoded = decodeJwt(token);
  return decoded.privilege;
}
```

### 2. Lógica de Redirecionamento no Login

```typescript
// src/pages/Login.tsx (ou equivalente)
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    try {
      // 1. Fazer login
      const response = await api.post('/api/auth/login', {
        osot_email: credentials.email,
        osot_password: credentials.password,
        organizationSlug: getOrganizationSlug(), // função que extrai do URL
      });

      const { access_token, user } = response.data;

      // 2. Salvar token
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      // 3. Redirecionar baseado em privilege
      if (user.privilege === 3 || user.privilege === 2) {
        // MAIN ou ADMIN → Interface Admin
        navigate('/admin/dashboard');
      } else {
        // OWNER → Interface User
        navigate('/user/dashboard');
      }

    } catch (error) {
      console.error('Login falhou:', error);
      // Mostrar mensagem de erro
    }
  };

  return (
    // ... seu formulário de login
  );
}
```

### 3. Proteger Rotas Admin

```typescript
// src/components/PrivateRoute.tsx
import { Navigate } from 'react-router-dom';
import { getUserPrivilege } from '../utils/jwt';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredPrivilege?: number;
}

function PrivateRoute({ children, requiredPrivilege }: PrivateRouteProps) {
  const token = localStorage.getItem('authToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPrivilege) {
    const userPrivilege = getUserPrivilege(token);
    
    if (userPrivilege < requiredPrivilege) {
      // Usuário não tem privilégio suficiente
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}

export default PrivateRoute;
```

### 4. Configurar Rotas

```typescript
// src/App.tsx (ou routes.tsx)
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas de Usuário - Privilege >= 1 */}
        <Route 
          path="/user/*" 
          element={
            <PrivateRoute requiredPrivilege={1}>
              <UserLayout />
            </PrivateRoute>
          } 
        />

        {/* Rotas Admin - Privilege >= 2 */}
        <Route 
          path="/admin/*" 
          element={
            <PrivateRoute requiredPrivilege={2}>
              <AdminLayout />
            </PrivateRoute>
          } 
        />

        {/* Unauthorized */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 5. Renderização Condicional (Exemplo)

```typescript
// src/components/Sidebar.tsx
import { getUserPrivilege } from '../utils/jwt';

function Sidebar() {
  const token = localStorage.getItem('authToken');
  const privilege = token ? getUserPrivilege(token) : 0;

  return (
    <nav>
      <ul>
        <li><Link to="/user/dashboard">Dashboard</Link></li>
        <li><Link to="/user/profile">Perfil</Link></li>
        
        {/* Mostrar apenas para ADMIN e MAIN */}
        {privilege >= 2 && (
          <>
            <li><Link to="/admin/users">Gerenciar Usuários</Link></li>
            <li><Link to="/admin/reports">Relatórios</Link></li>
          </>
        )}
        
        {/* Mostrar apenas para MAIN */}
        {privilege === 3 && (
          <li><Link to="/admin/organizations">Organizações</Link></li>
        )}
      </ul>
    </nav>
  );
}
```

---

## 🔒 Segurança: Avisos Importantes

1. **Validação no Backend:** A validação de privilege no frontend é APENAS UX. O backend sempre valida novamente em cada request.

2. **Token no Header:** Sempre enviar token nos requests:
   ```typescript
   api.get('/api/private/accounts', {
     headers: {
       Authorization: `Bearer ${token}`
     }
   });
   ```

3. **Refresh de Token:** Se o token expirar, redirecionar para login:
   ```typescript
   api.interceptors.response.use(
     response => response,
     error => {
       if (error.response?.status === 401) {
         localStorage.removeItem('authToken');
         window.location.href = '/login';
       }
       return Promise.reject(error);
     }
   );
   ```

---

## 📝 Checklist de Implementação

- [ ] **Função `getOrganizationSlug()`** criada (extrai subdomain do URL)
- [ ] **Login retorna `access_token` e `user`** com privilege
- [ ] **Token salvo no localStorage** após login
- [ ] **Redirecionamento baseado em privilege:**
  - [ ] Privilege 2 ou 3 → `/admin/dashboard`
  - [ ] Privilege 1 → `/user/dashboard`
- [ ] **Rotas protegidas** com `PrivateRoute` component
- [ ] **Renderização condicional** de botões/menus baseado em privilege
- [ ] **Interceptor de API** configurado para adicionar token no header
- [ ] **Tratamento de 401** (token expirado) com redirect para login

---

## 🧪 Como Testar

### Teste 1: Login como MAIN
```
Email: b.alencar.amaral@gmail.com
Password: [sua senha]
Resultado esperado: Redirecionar para /admin/dashboard
```

### Teste 2: Login como OWNER
```
Email: [email de usuário comum]
Password: [senha]
Resultado esperado: Redirecionar para /user/dashboard
```

### Teste 3: OWNER tentando acessar /admin
```
Resultado esperado: Redirecionar para /unauthorized
```

---

## ❓ Dúvidas Frequentes

**Q: O backend já retorna o privilege?**  
✅ Sim, no campo `user.privilege` da resposta do login.

**Q: Preciso fazer request adicional para saber o privilege?**  
❌ Não, já vem no login. Você pode decodificar o JWT também se precisar.

**Q: E se o usuário mudar a URL manualmente para /admin?**  
✅ O `PrivateRoute` bloqueia se privilege < 2. E o backend valida novamente cada request.

**Q: Como obter o privilege de um token JWT?**  
Use a função `getUserPrivilege(token)` que decodifica o JWT.

---

## 📞 Suporte

Se tiverem dúvidas, o backend já está funcionando. Podem testar:
- Endpoint: `POST http://192.168.10.53:3000/api/auth/login`
- User MAIN: `b.alencar.amaral@gmail.com`

Bom trabalho! 🚀

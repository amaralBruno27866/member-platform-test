# Frontend: Página de Erro para Duplicação de Conta

## 📋 Contexto

O backend agora detecta e bloqueia registros duplicados **antes** de criar contas no Dataverse. Quando um usuário tenta se registrar com:
- **Email já existente**, OU
- **Nome completo + data de nascimento já existentes**

O backend retorna um erro HTTP **409 Conflict** com informações estruturadas para exibir ao usuário.

## 🎯 Objetivo

Criar uma página de erro amigável e profissional que:
1. Informe claramente que a conta já existe
2. Mostre o email **parcialmente mascarado** (por privacidade)
3. Sugira ações: Login, Recuperação de senha, ou Contato com suporte
4. Use design similar à página de sucesso já existente
5. Proporcione boa UX mesmo em cenários de erro

---

## 🔧 O Que o Backend Retorna

### Endpoint
```
POST /public/orchestrator/registration/initiate
```

### Resposta de Erro (HTTP 409 Conflict)

#### Exemplo 1: Email Duplicado
```json
{
  "statusCode": 409,
  "error": "Duplicate Account",
  "message": "An account with this email address already exists.",
  "suggestion": "If this is your account (b.a**************@gmail.com), please try logging in. If you forgot your password, use the password recovery option. If you believe this is an error, please contact support.",
  "maskedEmail": "b.a**************@gmail.com",
  "timestamp": "2026-01-14T19:17:06.576Z"
}
```

**Nota:** O domínio completo (gmail.com) é exibido para ajudar o usuário a identificar o provedor de email.

#### Exemplo 2: Pessoa Duplicada (Nome + Data de Nascimento)
```json
{
  "statusCode": 409,
  "error": "Duplicate Account",
  "message": "An account with the same name and date of birth already exists.",
  "suggestion": "If this is your account (joh*****@example.com), please try logging in. If you forgot your password, use the password recovery option. If you believe this is an error or need assistance, please contact support.",
  "maskedEmail": "joh*****@example.com",
  "timestamp": "2026-01-14T19:17:06.576Z"
}
```

**Nota:** O email mostrado é da conta existente no banco, não do formulário submetido. O domínio completo é exibido.

### Estrutura da Resposta de Erro
```typescript
interface DuplicateAccountError {
  statusCode: 409;
  error: 'Duplicate Account';
  message: string;          // Mensagem principal (email ou pessoa)
  suggestion: string;        // Sugestões de ação para o usuário
  maskedEmail: string;       // Email mascarado (e.g., "joh*****@exa****.com")
  timestamp: string;         // ISO 8601 timestamp
}
```

---

## 🎨 Design da Página de Erro

### Referência: Página de Sucesso Atual
Use a **mesma estrutura visual** da página de sucesso de registro (`RegistrationSuccess.tsx` ou similar), mas adaptada para erro.

### Elementos Visuais

#### 1. Ícone/Ilustração
- ❌ Ícone de erro (círculo vermelho com "X" ou "⚠️")
- 🔒 Ou ícone de cadeado (indicando segurança/proteção de dados)
- Use cores: Vermelho (#DC2626) ou Âmbar (#F59E0B) - **não muito agressivo**

#### 2. Título Principal
```
"Conta Já Registrada"
ou
"Esta conta já existe"
```

#### 3. Subtítulo/Descrição
Mostrar o `message` do backend:
- "An account with this email address already exists."
- "An account with the same name and date of birth already exists."

Traduzir para português:
- "Uma conta com este endereço de email já existe."
- "Uma conta com o mesmo nome e data de nascimento já existe."

#### 4. Seção de Email Mascarado
Destacar o email mascarado em um card ou box:
```
┌─────────────────────────────────────────┐
│  Email cadastrado:                       │
│  b.a**************@gma**.com            │
└─────────────────────────────────────────┘
```

Estilo:
- Background cinza claro (`bg-gray-100`)
- Texto em monospace para o email mascarado
- Borda sutil

#### 5. Sugestões de Ação (Botões)

**Botão Primário (CTA Principal):**
```
[🔐 Fazer Login]
```
- Redireciona para `/login` com email pré-preenchido (se possível extrair do mascarado)
- Cor: Azul primário da marca

**Botão Secundário:**
```
[🔑 Esqueci Minha Senha]
```
- Redireciona para `/recuperar-senha` ou `/forgot-password`
- Cor: Cinza ou outline

**Link/Texto Secundário:**
```
Não reconhece esta conta? [Contate o suporte →]
```
- Link para página de contato ou email de suporte
- Cor: Cinza, menor destaque

#### 6. Informação Adicional (Opcional)
Card de ajuda:
```
💡 Por que estou vendo isto?
Para proteger sua privacidade e evitar contas duplicadas,
nosso sistema detectou que já existe uma conta cadastrada
com suas informações.
```

---

## 💻 Exemplo de Implementação (React)

### 1. Criar Componente `DuplicateAccountError.tsx`

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface DuplicateAccountErrorProps {
  message: string;
  suggestion: string;
  maskedEmail: string;
}

export const DuplicateAccountError: React.FC<DuplicateAccountErrorProps> = ({
  message,
  suggestion,
  maskedEmail,
}) => {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handlePasswordRecovery = () => {
    navigate('/recuperar-senha');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Ícone de Erro */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Conta Já Registrada
        </h1>

        {/* Mensagem Principal */}
        <p className="text-center text-gray-600 mb-6">
          {translateMessage(message)}
        </p>

        {/* Email Mascarado */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Email cadastrado:</p>
          <p className="text-lg font-mono text-gray-900 break-all">
            {maskedEmail}
          </p>
        </div>

        {/* Sugestões */}
        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-600 text-center">
            O que você pode fazer:
          </p>

          {/* Botão Primário - Login */}
          <button
            onClick={handleLoginRedirect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Fazer Login
          </button>

          {/* Botão Secundário - Recuperar Senha */}
          <button
            onClick={handlePasswordRecovery}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg border-2 border-gray-300 transition duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Esqueci Minha Senha
          </button>
        </div>

        {/* Link para Suporte */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Não reconhece esta conta?{' '}
            <a
              href="mailto:support@osot.ca"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contate o suporte →
            </a>
          </p>
        </div>

        {/* Info Adicional */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex gap-3 text-sm text-gray-600">
            <span className="text-xl">💡</span>
            <div>
              <p className="font-medium mb-1">Por que estou vendo isto?</p>
              <p className="text-xs leading-relaxed">
                Para proteger sua privacidade e evitar contas duplicadas,
                nosso sistema detectou que já existe uma conta cadastrada
                com suas informações.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Função auxiliar para traduzir mensagens
function translateMessage(message: string): string {
  const translations: Record<string, string> = {
    'An account with this email address already exists.':
      'Uma conta com este endereço de email já existe.',
    'An account with the same name and date of birth already exists.':
      'Uma conta com o mesmo nome e data de nascimento já existe.',
  };

  return translations[message] || message;
}
```

---

### 2. Integrar no Fluxo de Registro

#### No componente de registro (`RegistrationForm.tsx` ou similar):

```tsx
import { useState } from 'react';
import { DuplicateAccountError } from './DuplicateAccountError';

export const RegistrationForm = () => {
  const [duplicateError, setDuplicateError] = useState<{
    message: string;
    suggestion: string;
    maskedEmail: string;
  } | null>(null);

  const handleSubmit = async (data: RegistrationData) => {
    try {
      const response = await fetch('/public/orchestrator/registration/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.status === 409) {
        // Erro de duplicação
        const errorData = await response.json();
        setDuplicateError({
          message: errorData.message,
          suggestion: errorData.suggestion,
          maskedEmail: errorData.maskedEmail,
        });
        return;
      }

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const result = await response.json();
      // Redirecionar para página de sucesso
      navigate('/registro/sucesso');
    } catch (error) {
      console.error('Registration error:', error);
      // Tratar outros erros
    }
  };

  // Se há erro de duplicação, mostrar página de erro
  if (duplicateError) {
    return (
      <DuplicateAccountError
        message={duplicateError.message}
        suggestion={duplicateError.suggestion}
        maskedEmail={duplicateError.maskedEmail}
      />
    );
  }

  // Caso contrário, mostrar formulário normal
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos do formulário */}
    </form>
  );
};
```

---

### 3. Alternativa: Rota Dedicada

Se preferir usar uma rota separada:

```tsx
// App.tsx ou Router
<Route 
  path="/registro/conta-duplicada" 
  element={<DuplicateAccountErrorPage />} 
/>

// No formulário, redirecionar com state:
if (response.status === 409) {
  const errorData = await response.json();
  navigate('/registro/conta-duplicada', {
    state: {
      message: errorData.message,
      suggestion: errorData.suggestion,
      maskedEmail: errorData.maskedEmail,
    },
  });
}

// Na página:
import { useLocation } from 'react-router-dom';

export const DuplicateAccountErrorPage = () => {
  const location = useLocation();
  const { message, suggestion, maskedEmail } = location.state || {};

  if (!message) {
    // Redirecionar para home se acessado diretamente
    return <Navigate to="/" />;
  }

  return (
    <DuplicateAccountError
      message={message}
      suggestion={suggestion}
      maskedEmail={maskedEmail}
    />
  );
};
```

---

## 🧪 Testes Recomendados

### Cenários de Teste

1. **Email Duplicado**
   - Registrar usuário com `test@example.com`
   - Tentar registrar novamente com `test@example.com`
   - ✅ Verificar: Erro 409, página de erro exibida, email mascarado correto

2. **Pessoa Duplicada (Nome + DOB)**
   - Registrar "John Doe" com DOB "1985-12-12"
   - Tentar registrar novamente com mesmo nome e DOB (email diferente)
   - ✅ Verificar: Erro 409, mensagem sobre nome/DOB, email mascarado

3. **Navegação**
   - Clicar em "Fazer Login" → Redireciona para `/login`
   - Clicar em "Esqueci Minha Senha" → Redireciona para recuperação
   - Clicar em "Contate o suporte" → Abre email ou página de contato

4. **Responsividade**
   - Testar em mobile (320px - 768px)
   - Testar em tablet (768px - 1024px)
   - Testar em desktop (1024px+)

---

## 📱 Mockup Visual

```
┌─────────────────────────────────────────────┐
│                                             │
│           ⚠️  (ícone âmbar)                 │
│                                             │
│         Conta Já Registrada                 │
│                                             │
│   Uma conta com este endereço de email     │
│   já existe no sistema.                    │
│                                             │
│  ┌────────────────────────────────────┐   │
│  │ Email cadastrado:                  │   │
│  │ b.a**************@gma**.com       │   │
│  └────────────────────────────────────┘   │
│                                             │
│       O que você pode fazer:               │
│                                             │
│  ┌────────────────────────────────────┐   │
│  │  🔐 Fazer Login                    │   │
│  └────────────────────────────────────┘   │
│                                             │
│  ┌────────────────────────────────────┐   │
│  │  🔑 Esqueci Minha Senha            │   │
│  └────────────────────────────────────┘   │
│                                             │
│   Não reconhece esta conta?                │
│   Contate o suporte →                      │
│                                             │
│  ─────────────────────────────────────     │
│                                             │
│  💡 Por que estou vendo isto?              │
│     Para proteger sua privacidade...       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🎯 Checklist de Implementação

- [ ] Criar componente `DuplicateAccountError.tsx`
- [ ] Adicionar tratamento de erro 409 no formulário de registro
- [ ] Implementar tradução de mensagens (EN → PT-BR)
- [ ] Adicionar navegação para login e recuperação de senha
- [ ] Estilizar com Tailwind CSS (ou CSS modules)
- [ ] Testar responsividade (mobile, tablet, desktop)
- [ ] Testar cenário de email duplicado
- [ ] Testar cenário de pessoa duplicada (nome + DOB)
- [ ] Testar todos os botões e links
- [ ] Validar acessibilidade (contraste, foco, screen readers)
- [ ] Adicionar analytics/tracking (opcional)

---

## 🔗 Links Úteis

- Email de suporte: `support@osot.ca` (ajustar conforme necessário)
- Página de login: `/login`
- Recuperação de senha: `/recuperar-senha` ou `/forgot-password`

---

## 📞 Dúvidas?

Se precisar de ajustes no backend (mensagens, estrutura do erro, etc.), entre em contato com o time de backend.

**Endpoint de teste:** `POST /public/orchestrator/registration/initiate`

**Logs no backend:** Procurar por:
- `❌ [PERSON CHECK] Person is DUPLICATE`
- `❌ [EMAIL CHECK] Email is DUPLICATE`
- `📊 [ANTI-DUPLICATION] Total errors: 1`

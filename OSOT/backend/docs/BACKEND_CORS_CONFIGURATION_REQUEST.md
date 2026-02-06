# 🔧 Backend CORS Configuration Request

**Data da Requisição**: 1 de Dezembro de 2025  
**Prioridade**: 🔴 Alta (Bloqueando desenvolvimento frontend)  
**Time Solicitante**: Frontend Development Team  
**Versão da API**: 1.0.0

---

## 📋 Resumo Executivo

O frontend em desenvolvimento em `http://localhost:5173` (Vite) está sendo **bloqueado por erro de CORS** ao tentar consumir as rotas privadas da API em `http://localhost:3000`.

**Status Atual**: ❌ Bloqueado  
**Impacto**: Frontend não consegue consumir nenhuma rota privada da API  
**Solução Necessária**: Configurar CORS no backend NestJS

---

## 🐛 Erro Atual

### **Console do Backend (NestJS)**

```
[Nest] 26796  - 12/01/2025, 12:04:58 PM   ERROR [HttpExceptionFilter] Object(2) {
  status: 404,
  body: {
    message: 'Cannot OPTIONS /private/accounts/me',
    error: 'Not Found',
    statusCode: 404
  }
}
```

### **Console do Frontend (Browser)**

```
Access to XMLHttpRequest at 'http://localhost:3000/private/accounts/me' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### **Network Request**

```
Request URL: http://localhost:3000/private/accounts/me
Request Method: OPTIONS (Preflight)
Status Code: 404 Not Found

Request Headers:
  Origin: http://localhost:5173
  Access-Control-Request-Method: GET
  Access-Control-Request-Headers: authorization, content-type

Response Headers:
  ❌ Missing: Access-Control-Allow-Origin
  ❌ Missing: Access-Control-Allow-Methods
  ❌ Missing: Access-Control-Allow-Headers
```

---

## 🎯 O Que Está Acontecendo?

### **1. Preflight Request (OPTIONS)**

Quando o frontend faz uma requisição com:
- Headers customizados (`Authorization: Bearer token`)
- Método diferente de GET/POST simples
- Cross-origin (porta diferente)

O navegador **automaticamente** envia uma requisição `OPTIONS` (preflight) para verificar se o servidor permite essa operação.

### **2. Backend Não Responde ao OPTIONS**

O backend NestJS **não está configurado para aceitar** requisições de origem diferente (`http://localhost:5173`), resultando em:

- ❌ Preflight `OPTIONS` retorna `404 Not Found`
- ❌ Headers CORS não são enviados na resposta
- ❌ Navegador bloqueia a requisição real (`GET /private/accounts/me`)

---

## ✅ Solução Necessária

### **Configurar CORS no Backend (NestJS)**

**Arquivo**: `src/main.ts` (ou onde o app é inicializado)

### **Opção 1: Configuração Completa (Recomendada)**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Habilitar CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',      // Frontend dev (Vite)
      'http://127.0.0.1:5173',      // Localhost alternativo
      'http://192.168.56.1:5173',   // Rede local (se necessário)
      'http://192.168.10.56:5173',  // Rede local (se necessário)
      // Adicionar domínio de produção quando disponível:
      // 'https://app.osot.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true, // Permite cookies e headers de autenticação
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Authorization'], // Headers que o frontend pode ler
    maxAge: 3600, // Cache do preflight por 1 hora
  });

  await app.listen(3000);
  console.log('✅ CORS enabled for frontend origins');
}
bootstrap();
```

### **Opção 2: Configuração Permissiva (Apenas Desenvolvimento)**

⚠️ **Usar apenas em ambiente de desenvolvimento**

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ⚠️ Permite qualquer origem (apenas DEV)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
```

### **Opção 3: Configuração por Ambiente**

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isDevelopment = process.env.NODE_ENV === 'development';

  app.enableCors({
    origin: isDevelopment 
      ? true // Permite qualquer origem em DEV
      : [
          'https://app.osot.com',
          'https://www.osot.com',
        ], // Apenas domínios específicos em PROD
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3000);
}
bootstrap();
```

---

## 🔍 Como Verificar se CORS Está Funcionando

### **1. Testar Preflight Request (OPTIONS)**

```bash
curl -X OPTIONS http://localhost:3000/private/accounts/me \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization, content-type" \
  -v
```

**Resposta Esperada**:

```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: http://localhost:5173
< Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
< Access-Control-Allow-Headers: Content-Type,Authorization
< Access-Control-Allow-Credentials: true
```

### **2. Testar Requisição Real (GET)**

```bash
curl -X GET http://localhost:3000/private/accounts/me \
  -H "Origin: http://localhost:5173" \
  -H "Authorization: Bearer {TOKEN}" \
  -v
```

**Resposta Esperada**:

```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: http://localhost:5173
< Access-Control-Allow-Credentials: true
< Content-Type: application/json

{ "success": true, "data": { ... } }
```

---

## 📊 Impacto no Frontend

### **Rotas Bloqueadas por CORS**

Todas as rotas privadas estão bloqueadas:

| Rota | Método | Status | Prioridade |
|------|--------|--------|------------|
| `/private/accounts/me` | GET | ❌ Bloqueada | 🔴 Alta |
| `/private/identities/me` | GET | ❌ Bloqueada | 🔴 Alta |
| `/private/contacts/me` | GET | ❌ Bloqueada | 🔴 Alta |
| `/private/addresses/me` | GET | ❌ Bloqueada | 🔴 Alta |
| `/private/*/me` | PATCH | ❌ Bloqueada | 🔴 Alta |
| `/auth/login` | POST | ✅ Funcionando | ✅ OK |

### **Funcionalidades Afetadas**

- ❌ **Dashboard**: Não consegue carregar dados do usuário
- ❌ **Profile Pages**: Todas as páginas de perfil bloqueadas
- ❌ **Account Page**: Não carrega informações da conta
- ❌ **Identity/Contact/Address**: Todos bloqueados
- ✅ **Login**: Funcionando (rota pública)

---

## 🚀 Próximos Passos

### **1. Backend Team**

- [ ] Adicionar configuração CORS no `main.ts`
- [ ] Testar preflight requests (`OPTIONS`)
- [ ] Verificar headers na resposta
- [ ] Confirmar que rotas privadas respondem corretamente
- [ ] Notificar frontend quando correção estiver implementada

### **2. Frontend Team (Após correção)**

- [ ] Remover workarounds temporários (se houver)
- [ ] Testar integração com todas as rotas privadas
- [ ] Validar autenticação JWT funciona corretamente
- [ ] Documentar fluxo completo de consumo da API

---

## 📚 Documentação de Referência

### **NestJS CORS Documentation**

- [Official CORS Guide](https://docs.nestjs.com/security/cors)
- [enableCors() API Reference](https://docs.nestjs.com/faq/global-prefix#enable-cors)

### **MDN Web Docs**

- [CORS - Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Preflight Request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)

### **OSOT Project Docs**

- `FRONTEND_INTEGRATION_GUIDE.md` - Guia de integração frontend
- `PRIVATE_ROUTES_CONSUMPTION_GUIDE.md` - Documentação de rotas privadas
- `ERROR_HANDLING_FRONTEND_GUIDE.md` - Tratamento de erros no frontend

---

## 🔐 Considerações de Segurança

### **Desenvolvimento**

```typescript
// ✅ BOM: Permitir apenas origens específicas
origin: ['http://localhost:5173', 'http://127.0.0.1:5173']

// ⚠️ ACEITÁVEL: Permitir qualquer origem em DEV
origin: true

// ❌ RUIM: Permitir qualquer origem em PROD
origin: '*' // Nunca em produção!
```

### **Produção**

```typescript
// ✅ BOM: Lista específica de domínios permitidos
origin: [
  'https://app.osot.com',
  'https://www.osot.com',
  'https://admin.osot.com',
]

// ✅ BOM: Validação dinâmica
origin: (origin, callback) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
}
```

### **Credentials**

```typescript
// ✅ SEMPRE habilitar se usar cookies ou JWT no header Authorization
credentials: true

// ❌ Não combinar com origin: '*' (vai dar erro)
origin: '*',
credentials: true, // ❌ Não funciona junto!
```

---

## ⏱️ Timeline Esperado

| Ação | Responsável | Tempo Estimado |
|------|-------------|----------------|
| Implementar CORS | Backend Team | 15-30 minutos |
| Testar configuração | Backend Team | 15 minutos |
| Validar no frontend | Frontend Team | 30 minutos |
| **Total** | - | **1-2 horas** |

---

## 💬 Contato

**Frontend Team**  
Para dúvidas ou esclarecimentos sobre esta requisição:

- 📧 Email: frontend-team@osot.com
- 💬 Slack: #frontend-development
- 📋 Issue Tracker: [Link para issue, se aplicável]

---

## ✅ Checklist de Implementação

### **Backend Team - Antes de Implementar**

- [ ] Ler documentação oficial do NestJS sobre CORS
- [ ] Entender diferença entre preflight (OPTIONS) e requisição real
- [ ] Confirmar que `enableCors()` será chamado antes de `app.listen()`

### **Backend Team - Durante Implementação**

- [ ] Adicionar `app.enableCors()` no `main.ts`
- [ ] Configurar origens permitidas (`origin`)
- [ ] Configurar métodos permitidos (`methods`)
- [ ] Configurar headers permitidos (`allowedHeaders`)
- [ ] Habilitar `credentials: true`
- [ ] Testar localmente com curl ou Postman

### **Backend Team - Após Implementação**

- [ ] Commit e push das alterações
- [ ] Documentar no README se necessário
- [ ] Notificar frontend team
- [ ] Confirmar que todos os testes passam

### **Frontend Team - Validação**

- [ ] Testar login ainda funciona
- [ ] Testar rota `/private/accounts/me`
- [ ] Testar todas as rotas privadas documentadas
- [ ] Validar que JWT é enviado corretamente no header
- [ ] Confirmar que não há mais erros CORS no console

---

## 🎯 Resultado Esperado

Após implementação da configuração CORS:

```
✅ Preflight OPTIONS requests respondidos com status 200
✅ Headers CORS presentes em todas as respostas
✅ Frontend consegue consumir rotas privadas
✅ JWT token enviado e aceito pelo backend
✅ Sem erros CORS no console do navegador
✅ Todas as páginas de perfil carregando dados corretamente
```

---

**Obrigado pela atenção e suporte! 🚀**

_Este documento foi gerado pelo Frontend Development Team para facilitar a comunicação e resolução rápida do problema de CORS._

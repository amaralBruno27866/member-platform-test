# Mapa de Fluxo de Dados — Integração com Dataverse

Este documento descreve, em alto detalhe, o fluxo de dados dentro do projeto `osot-dataverse-api` (pasta `src/`). O objetivo é mapear como os dados entram no sistema, são validados, transformados, orquestrados, persistidos no Dataverse, e como o Redis e o JWT participam desse processo.

Data: 2025-09-18

---

## Sumário

- Visão geral do fluxo
- Pontos de entrada HTTP (controllers)
- Autenticação/Autorização (JWT, blacklist)
- Processos de registro (sync vs orchestrated)
- Orquestrador de registro (registration-orchestrator)
- Persistência no Dataverse (`DataverseService`)
- Cache/temporários (Redis)
- Diagrama textual simplificado de fluxos
- Arquivos-chave por responsabilidade
- Observabilidade e pontos de instrumentação
- Riscos e recomendações imediatas

---

## Visão geral do fluxo

1. O cliente realiza requisições HTTP aos controllers expostos (ex.: `/auth`, `/registration`, `/table-account`).
2. Controllers validam payloads via DTOs e delegam para serviços (domain services e registration services).
3. Serviços aplicam regras de negócio (utilitários em `src/util`) e podem:
   - Salvar temporariamente no Redis (TTL curto) para reprocessamento ou fluxo assíncrono.
   - Fazer chamadas diretas ao Dataverse por `DataverseService.request(...)`.
   - Em flows maiores, delegar a orquestrador (`RegistrationOrchestratorService`) que executa múltiplos passos e persiste várias entidades no Dataverse.
4. `DataverseService` obtém token via client_credentials do Azure AD e faz chamadas HTTP ao Dataverse (sem cache de token atualmente).
5. Redis é usado para: sessões de registro, TTL temporário de payloads, rate-limiting, blacklist de JWTs e caches de lookups.

---

## Pontos de entrada HTTP (controllers) (lista parcial)

- `src/auth/auth.controller.ts` — login/refresh/etc.
- `src/registration-process/*/*.controller.ts` — account-registration, contact-registration, identity-registration, address-registration, account-affiliate, ot/ota-education, registration-orchestrator
- `src/classes/*/*/table-*.controller.ts` — controllers CRUD para tabelas Dataverse (table-account, table-contact, table-identity, ...)
- `src/user-profile/user-profile.controller.ts`
- `src/classes/password-recovery/password-recovery.controller.ts`
- `src/account-security/security-alert.controller.ts`

Esses controllers são a fonte inicial das requisições que chegam ao sistema.

---

## Autenticação e autorização (JWT)

- Fluxo de emissão: `AuthService` (em `src/auth/auth.service.ts`) usa `JwtService` para criar JWTs após validação de credenciais.
- Verificação: `JwtStrategy` e `JwtAuthGuard` validam tokens nas rotas protegidas; `JwtAuthGuard` consulta `RedisService` para checar blacklist (`blacklist:<token>`).
- Uso adicional: Orquestrador e orquestradores auxiliares geram JWTs de aprovação para admins via `JwtService.sign(payload, { expiresIn: '24h' })`.

Arquivos:

- `src/auth/auth.service.ts`
- `src/auth/jwt.strategy.ts`
- `src/auth/jwt-auth.guard.ts`
- `src/registration-process/*` (onde são gerados tokens de aprovação)

---

## Processos de registro: padrões observados

Há dois padrões co-existentes:

1. Persistência síncrona por serviço
   - Serviço valida -> salva no Redis (debug/temp) -> chama `DataverseService.request('POST', <table>, payload, credentials)` -> retorna ao cliente.
   - Ex.: `AccountRegistrationService.register` atualmente segue este fluxo.

2. Persistência orquestrada (assíncrona/flow multi-entity)
   - Controller insere sessão inicial no Redis e aciona Orquestrador (ou é chamado por Orquestrador).
   - Orquestrador executa steps sequenciais (Identity -> Contact -> Address -> Account -> AccountManagement etc.), cada step chama métodos `createXInDataverse` que usam `DataverseService`.
   - Orquestrador gera tokens de aprovação, envia emails e limpa a sessão no Redis ao final.
   - Arquivo principal: `src/registration-process/registration-orchestrator.service.ts`.

Observação: a coexistência desses padrões causa inconsistência operacional; recomendo padronização (preferir orquestrador para fluxos multi-entity).

---

## Orquestrador de registro (`RegistrationOrchestratorService`)

Funções principais:

- Gerenciar sessões de registro no Redis (`registration:{sessionId}`)
- Executar etapas de persistência no Dataverse chamando:
  - `createIdentityInDataverse` -> POST `osot_table_identities`
  - `createContactInDataverse` -> POST `osot_table_contacts`
  - `createAddressInDataverse` -> POST `osot_table_addresses`
  - `createOtEducationInDataverse` / `createOtaEducationInDataverse`
  - `createAccountManagementInDataverse`
- Gerar tokens JWT para aprovação/rejeição e enviar por email
- Limpeza e rollback parcial em falhas

Principais interações:

- `RedisService`: leitura e escrita de sessão
- `DataverseService`: persistência (métodos request)
- `EmailService`: envio de mensagens
- `JwtService`: criação/verificação de tokens de aprovação

---

## Persistência no Dataverse (`DataverseService`)

- Local: `src/integrations/dataverse.service.ts`
- Tarefas:
  - Montar URL: `${DYNAMICS_URL}/api/data/v9.2/${endpoint}`
  - Obter token OAuth2 (client_credentials) via `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`
  - Adicionar headers OData e Authorization
  - Retry básico para 5xx

Estado atual importante:

- Não há cache de token — cada chamada pode requisitar token.
- Há uso amplo de `dataverseService.getCredentialsByApp(app)` para escolher credenciais (main/owner/admin/login).
- Muitas chamadas montam OData `$filter` strings manualmente (risco de injeção/erro).

---

## Cache / Temporários (Redis)

- `src/redis/redis.service.ts` fornece wrapper com `get`, `set`, `del`, `setTempCode`, `getTempCode`.
- Usos:
  - Sessions: `registration:{sessionId}` — orquestrador e orquestradores auxiliares
  - Temp registration payloads: `account-registration:<email>`, `identity-registration:<ts>` etc. (TTL ~600s)
  - Rate limit keys para `rate-limit.guard` (auth)
  - JWT blacklist keys: `blacklist:<token>`
  - Cache de membership settings e outros lookups (ex.: `table-membership-settings.services.ts`)

Recomendação: usar Redis também para cache de access tokens do Dataverse por appContext.

---

## Diagrama textual simplificado (fluxos primários)

1. Registro síncrono (ex.: account registration)
   Client -> POST /account-registration
   -> account-registration.controller -> AccountRegistrationService
   -> validate DTO -> checkAccountDuplicates (DataverseService GET)
   -> prepare payload -> redis.set(account-registration:<email>)
   -> dataverseService.request(POST osot_table_accounts) -> return

2. Registro orquestrado
   Client -> POST /registration/orchestrator
   -> registration-orchestrator.controller -> RegistrationOrchestratorService
   -> redis.set(registration:{sessionId}, session)
   -> createIdentityInDataverse -> dataverseService.request(POST osot_table_identities)
   -> createContactInDataverse -> dataverseService.request(POST osot_table_contacts)
   -> createAddressInDataverse -> dataverseService.request(POST osot_table_addresses)
   -> createAccountManagementInDataverse -> dataverseService.request(POST osot_table_account_managements)
   -> email notifications (EmailService)
   -> redis.del(registration:{sessionId})

3. Login and protected routes
   Client -> POST /auth/login -> AuthService -> JwtService.sign -> return token
   Client -> GET /table-account/me (Authorization: Bearer <token>)
   -> JwtAuthGuard -> JwtStrategy (verify) -> check Redis blacklist
   -> controller -> service -> dataverseService.request(GET)

---

## Arquivos-chave por responsabilidade (recap)

- Controllers: `src/auth/*`, `src/registration-process/*/*.controller.ts`, `src/classes/*/*/table-*.controller.ts`
- Services/Domain: `src/registration-process/*/*.services.ts`, `src/classes/*/*/*.services.ts`
- Orquestrador: `src/registration-process/registration-orchestrator.service.ts`
- Dataverse integration: `src/integrations/dataverse.service.ts`, `src/integrations/dataverse.module.ts`
- Redis: `src/redis/redis.service.ts`
- Utils: `src/util/business-rule.util.ts`, `src/util/dataverse-app.helper.ts`
- Auth: `src/auth/auth.service.ts`, `src/auth/jwt.strategy.ts`, `src/auth/jwt-auth.guard.ts`, `src/auth/rate-limit.guard.ts`
- Email: `src/emails/*`

---

## Observabilidade e pontos de instrumentação

- Adicionar `correlation-id` para seguimento entre controller -> orquestrador -> Dataverse calls -> email
- Logar eventos de token refresh e throttling no `DataverseService`
- Mapear erros Dataverse p/ HTTP errors (404/409/400) e registrar requestId e response truncated
- Adicionar métricas (counters/histogram) para:
  - número de tokens solicitados por app
  - latência do Dataverse por endpoint
  - quantidade de retries e de 429s

---

## Riscos e recomendações imediatas

- Alta prioridade:
  1. Implementar cache de token Redis por appContext no `DataverseService` (reduz token churn)
  2. Tratar 401 e 429 no `DataverseService.request` (invalidate token & retry once / respect Retry-After)
  3. Criar `FilterBuilder` para construir `$filter` seguros e migrar os pontos mais críticos

- Médio prazo: 4. Criar `DataverseRepository` e migrar services principais (account-registration, orchestrator) como PoC 5. Padronizar persistência (escolher orquestrador vs sync)

- Longo prazo: 6. Integrar tracing distribuído (OpenTelemetry) e um mock Dataverse para integration tests

---

## Próximos passos sugeridos (ações concretas que posso executar)

- Implementar token cache Redis (opção A): crio PR pequeno que injeta `RedisService` no `DataverseService`, adiciona cache+lock, adiciona testes unitários.
- Ou: criar `DataverseRepository` (opção B) e migrar 2 serviços como PoC.
- Ou: fazer A + B juntos (opção C).

---

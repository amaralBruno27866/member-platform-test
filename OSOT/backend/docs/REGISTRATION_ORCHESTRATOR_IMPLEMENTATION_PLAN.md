## Plano de Implementação — Account Registration Orchestrator

## Resumo

Este documento descreve um plano incremental e auditável para alinhar o `RegistrationOrchestratorService` ao flowchart "Account Registration - Orchestrator" (fluxo de registro), integrar notificações administrativas, criar tabelas necessárias no Dataverse e garantir testes/validação.

## Objetivo

- Implementar envio de emails de aprovação administrativa (opção A: links com token) de forma segura e configurável.
- Garantir persistência robusta no Dataverse para todo fluxo (criação das tabelas faltantes e gravação de logs/auditoria quando necessário).
- Entregar mudanças em pequenas fases para revisão e aprendizado incremental.

## Assunções iniciais

- O orquestrador já salva sessões em Redis e envia emails de confirmação ao usuário.
- Existirão variáveis de ambiente para controlar notificações a administradores e base URL do admin.
- Tokens serão JWTs com expirations e serão tratados como single-use via marcador na sessão (Redis) e/ou tabela de auditoria.

## Variáveis de Ambiente (recomendadas)

- `REGISTRATION_NOTIFY_ADMINS` (true|false) — ativa envio de notificação aos admins.
- `REGISTRATION_ADMIN_EMAILS` — lista separada por vírgula de e-mails de administradores.
- `ADMIN_BASE_URL` — URL base absoluta a ser usada para montar `approveUrl`/`rejectUrl`.
- `REGISTRATION_ADMIN_TOKEN_EXPIRY` — tempo de expiração do token admin (ex.: `24h`).
- `REGISTRATION_ADMIN_TOKEN_ONE_TIME` — (true|false) marcar tokens admin como single‑use.

## Fases e tarefas (incrementais)

Fase 0 — Preparação (sem código alterado)

- [ ] Ler/validar flowchart (feito)
- [ ] Revisar templates de email (`src/emails/templates`) — adicionar fallback/plaintext e avisos de segurança (tokens, triple-stash) (já aplicado parcialmente)
- [ ] Definir lista de administradores e `ADMIN_BASE_URL` em ambiente de teste

Fase 1 — Notificação administrativa (baixa invasão) — envia e-mail com links
Objetivo: enviar `admin-approval.html` a admins quando uma sessão é criada. Geração de tokens e URLs seguros.

- [ ] Implementar envio de email admin em `processCompleteRegistration` logo após salvar sessão
  - [ ] Gerar `approveToken` e `rejectToken` JWTs contendo `{ sessionId }` com `expiresIn = REGISTRATION_ADMIN_TOKEN_EXPIRY`
  - [ ] Montar `approveUrl` e `rejectUrl` com `ADMIN_BASE_URL` se presente; usar `encodeURIComponent(token)`
  - [ ] Renderizar `admin-approval` template com: `userName`, `userEmail`, `registrationDate`, `approveToken`, `rejectToken`, `approveUrl`, `rejectUrl`
  - [ ] Enviar email para `REGISTRATION_ADMIN_EMAILS` (JOIN com vírgula) — se envio falhar, logar e continuar (não abortar fluxo)
  - [ ] Testes: gerar sessão de teste e verificar que EmailService.send é chamado (verificar conteúdo do HTML gerado)

Checklist Fase 1 (sub-steps de implementação de código)

- [ ] Criar patch pequeno em `registration-orchestrator.service.ts` com a lógica acima
- [ ] Atualizar `.env.example`/documentação com as variáveis de ambiente
- [ ] Executar `npm run build` e `npm run lint` e corrigir problemas mínimos
- [ ] Validar via teste manual (registro de teste + leitura do email gerado)

Fase 2 — Auditoria e single‑use (médio risco)
Objetivo: garantir rastreabilidade e que tokens admin sejam single‑use e auditados.

- [ ] Criar tabela Dataverse `admin_approvals` (audit)
  - colunas mínimas sugeridas:
    - `admin_approvalid` (GUID, chave primária)
    - `sessionId` (string)
    - `action` (string: 'approve' | 'reject' | 'sent')
    - `token` (string) — token JWT (opcional: armazenar hash em vez do token completo)
    - `adminEmail` (string)
    - `createdAt` (datetime)
    - `note` (string) — motivo ou comentário
  - Propósito: auditoria, reprocessamento e marcação de token usado se necessário

- [ ] Ao enviar email admin, inserir registro `action = 'sent'` em `admin_approvals` para cada token
- [ ] Ao processar `approveRegistrationAdmin`/`rejectRegistrationAdmin`, marcar `action = 'approve'|'reject'` e gravar adminEmail + timestamp
- [ ] Se `REGISTRATION_ADMIN_TOKEN_ONE_TIME=true`, marcar token como usado no Redis session (ou criar campo `adminTokens` dentro da sessão contendo estado) e no `admin_approvals`

Checklist Fase 2 (DB + código)

- [ ] Especificar e aprovar esquema `admin_approvals` com time/data e dono pelo time de Dataverse
- [ ] Implementar chamadas a DataverseService para criar/atualizar `admin_approvals` nos pontos relevantes
- [ ] Testes: criar sessão, enviar email, confirmar que registro em `admin_approvals` foi criado; simular aprovação, confirmar atualização

Fase 3 — Segurança e UX (mais seguro; opcional)
Objetivo: transformar link GET em fluxo que leva ao Admin UI (recomendado para produção)

- [ ] Implementar pequena página no Admin UI (ou rota protegida) que recebe `token` em query e exibe confirmação antes de executar POST
- [ ] Alterar template `admin-approval.html` para apontar `approveUrl`/`rejectUrl` para a página do Admin UI (em vez do endpoint direto)
- [ ] Implementar CSRF/Protections na UI e/ou exigir autenticação administrativa antes de aceitar POST

Fase 4 — Testes, build e deploy

- [ ] Escrever testes unitários para: geração de tokens, renderização de template, envio de email (mock EmailService), validação de token
- [ ] Fazer build completo: `npm run build` e `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
- [ ] Rodar lint: `npm run lint` e corrigir avisos relevantes
- [ ] Validar em staging (testar envio e aprovação de sessão real)
- [ ] Deploy controlado para produção com feature flag (`REGISTRATION_NOTIFY_ADMINS=false` por padrão em prod até confirmar)

## Detalhes técnicos e snippets úteis

1. Exemplo de montagem segura de URLs (JS/TS):

```ts
const approveUrl = adminBase
  ? `${adminBase}/registration/orchestrator/admin-approval/approve?token=${encodeURIComponent(approveToken)}`
  : `/registration/orchestrator/admin-approval/approve?token=${encodeURIComponent(approveToken)}`;
```

2. Recomendações de tratamento de token

- Tokens admin: guardar `sessionId` no payload; não incluir informação sensível no token.
- Para maior segurança, considere armazenar apenas `hash(token)` na tabela `admin_approvals` e comparar hashes ao validar.

3. Notas sobre templates

- `admin-approval.html` já foi atualizado para incluir fallback em texto puro e `target="_blank" rel="noopener noreferrer"` nos botões.
- `success.html` contém `{{{educationSummary}}}` (triple-stash). Confirme que `educationSummary` é sanitizado antes do render.

4. Rollback e segurança

- Se envio de email a admins falhar, não abortar criação da sessão; logar e alertar (métrica/monitor).
- Por segurança, tokens devem expirar rapidamente em produção (ex.: 24h ou menos) e serem one-time.

## Lista de entregáveis por fase (resumido)

- Fase 1: patch em `registration-orchestrator.service.ts` + `.env.example` atualizado + verificação manual de email. (Pequeno, seguro)
- Fase 2: criação da tabela `admin_approvals` no Dataverse + patch para gravar auditoria + enforce single-use.
- Fase 3: (opcional) ajustar email links para apontar ao Admin UI; implementar UI e proteção.
- Fase 4: testes automatizados, build, deploy em staging e rollout controlado.

## Como validar localmente (comandos)

Executar build e checagens:

```pwsh
npm run build
./node_modules/.bin/tsc -p tsconfig.json --noEmit
npm run lint
```

Smoke test manual

- Registrar um usuário de teste (chamar `POST /registration/orchestrator/complete` com dados de teste)
- Verificar que Redis contém a sessão (key `registration:{sessionId}`)
- Verificar logs e/ou captura de email (dependendo do EmailService) para conteúdo do `admin-approval`

## Observações finais e riscos

- Expor endpoints GET que modificam estado é uma conveniência, porém um risco: preferir UI + POST para produção quando possível.
- Armazenar tokens JWT completos em texto no Dataverse pode ser um risco de segurança; preferir armazenar um hash/ticket para verificação.
- Testes e revisão manual são importantes antes de habilitar `REGISTRATION_NOTIFY_ADMINS` em produção.

## Próximo passo sugerido (mínimo, seguro)

Se você concorda, aplico a Fase 1 agora (patch pequeno enviando `admin-approval` na criação de sessão). Depois validamos juntos os detalhes no ambiente de teste. Se preferir, faço apenas o PR e você revisa antes de aplicar.

--
Documento gerado automaticamente a partir do flowchart anexado e da análise do repositório.

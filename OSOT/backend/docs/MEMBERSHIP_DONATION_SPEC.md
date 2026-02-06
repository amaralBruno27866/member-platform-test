# Especificação: Entidade de Doação (Donation) e Integração no Membership Orchestrator

Data: 21/01/2026  
Status: Proposta aprovada (implementar amanhã)

---

## Objetivo
Registrar doações opcionais feitas pelo usuário durante (ou após) o fluxo de membership, garantindo auditoria, relatórios, recibos e isolamento multi-tenant. Doações não bloqueiam a ativação do membership.

---

## Escopo e Regras
- Opcional: usuário pode doar no fluxo de membership, sem bloquear ativação.
- Auditoria: registrar doações como entidade própria em Dataverse.
- Fiscal/Recibos: emitir/armazenar identificadores para recibo e reconciliação.
- Multi-tenant: sempre vincular `Account` e `Organization`.
- Pagamento: pode compor o mesmo pagamento (line item) ou ser cobrado separadamente.
- Conformidade: consentimentos e anonimização suportados.

---

## Modelo de Dados (Dataverse)
Tabela: `osot_table_donation`

Campos (negócio):
- `osot_donation_id` (Autonumber) — identificador humano
- `osot_amount` (Money, obrigatório, > 0)
- `osot_currency` (Text, default `CAD`)
- `osot_status` (Optionset): `pledged|pending|paid|refunded|cancelled`
- `osot_is_anonymous` (Boolean: 0/1)
- `osot_consent_marketing` (Boolean: 0/1)
- `osot_consent_receipt` (Boolean: 0/1)
- `osot_message` (Text opcional)
- `osot_payment_provider` (Text: `stripe|adyen|...`)
- `osot_payment_intent_id` (Text)
- `osot_receipt_number` (Text)

Relacionamentos (Lookup):
- `osot_Account` → `osot_table_account` (obrigatório)
- `osot_Organization` → `osot_table_organization` (obrigatório)
- (Opcional) `osot_MembershipSessionRef` (Text) — ID da sessão do orchestrator para rastreio

Campos de sistema (não mapear no create):
- `osot_table_donationid`, `createdon`, `modifiedon`, `ownerid`

---

## Constantes e OData
- `DONATION_FIELDS`: nomes dos campos
- `DONATION_ODATA`:
  - `SELECT_FIELDS`: campos de leitura (inclui `_osot_account_value`, `_osot_organization_value`)
  - `BINDINGS`: `osot_Account@odata.bind`, `osot_Organization@odata.bind`

---

## Interfaces e DTOs
- `DonationInternal`:
  - `accountGuid`, `organizationGuid`
  - `amount` (number), `currency` (string)
  - `status` (enum), `isAnonymous` (boolean)
  - `consentMarketing` (boolean), `consentReceipt` (boolean)
  - `message?`, `paymentProvider?`, `paymentIntentId?`, `receiptNumber?`
- `DonationDataverse`:
  - mapeia campos Dataverse e lookups `_osot_*_value`
- DTOs (class-validator):
  - `CreateDonationDto` (valida >0, `CAD`, consentimentos)
  - `DonationResponseDto` (esconde PII se `isAnonymous`)

---

## Mappers (padrões do projeto)
- DTO → Internal → Dataverse
- Binds: `osot_Account@odata.bind = /osot_table_accounts({accountGuid})`
- Boolean: (DTO boolean) ↔ (Dataverse 0/1)
- Money/Text: normalização simples
- System fields: nunca enviar no create/update
- Resposta: ocultar dados pessoais se `isAnonymous = true`

---

## Serviços e Repositório
- `DonationCrudService` (create/read/update; delete opcional)
- `DonationLookupService` (minhas doações, por período, por status)
- `DonationRepository` (DataverseService + patterns de credenciais)
- Regras de negócio (simples):
  - `amount > 0`
  - `currency in [CAD]`
  - `status = paid` exige `paymentProvider` e `paymentIntentId`
  - `isAnonymous = true` → suprimir `firstName/lastName` nas respostas públicas

---

## Endpoints (proposta)
- `POST /donations` (autenticado; cria pledge `pending|pledged` antes do pagamento ou `paid` após confirmação)
- `GET /donations/my` (lista doações do usuário)
- `GET /donations/:id` (owner/admin)
- Interno (webhook/provider): `POST /payments/donations/confirm` (opcional) → atualiza `status=paid` + recibo

RBAC: `owner` só suas doações; `admin/main` filtros por organização.

---

## Integração no Membership Orchestrator
Posicionamento no fluxo:
- Após `preferences` (com `category/employment/practices` resolvidos) e antes de criar a `payment intent`.

Chaves Redis (sugestão):
- `membership-orchestrator:donation:${sessionId}` (dados de doação selecionada)

Fluxo (modo combinado em um único pagamento):
1) Frontend escolhe valor de doação (opcional) → armazenar em Redis
2) Ao criar a `payment intent`, incluir "line item: donation"
3) Ao receber `payment_completed`, criar `Donation` em Dataverse com `status=paid`
4) Emitir evento `membership-orchestrator.donation.created`
5) Não bloquear `osot_active_member` se doação falhar (opcional: retry assíncrono)

Fluxo alternativo (cobrança separada):
- Criar `Donation` como `pledged/pending` e processar pagamento dedicado; confirmar via webhook → atualizar `paid`

---

## Eventos e Logging
Eventos:
- `membership-orchestrator.donation.selected` (quando usuário opta por doar)
- `membership-orchestrator.donation.created` (após confirmação de pagamento)

Logging (Nest Logger + operationId):
- Não incluir PII; truncar GUID em logs; registrar `amount`, `status`, `sessionId`.

---

## Cache e Invalidação
- Chaves de cache (se necessário): `account:donations:{accountGuid}`
- Invalidação: após `create/update`, invalidar lista do usuário
- TTL sugerida: 300s (não crítico)

---

## Erros e Códigos
Usar `createAppError`:
- `VALIDATION_ERROR` (valor inválido, currency)
- `BUSINESS_RULE_VIOLATION` (paid sem payment refs)
- `NOT_FOUND` (consulta)
- `PERMISSION_DENIED` (acesso)
- `DATAVERSE_SERVICE_ERROR`, `REDIS_SERVICE_ERROR`

---

## Testes (100% cobertura)
- Unit: mappers, validações, serviço CRUD (mocks de repo)
- Integração: criação `paid` vs `pledged`, anonimato em resposta
- Orchestrator: seleção → pagamento → criação Donation; falha de doação não bloqueia membership

---

## Checklist de Implementação (Amanhã)
1) Criar pasta `src/classes/membership/membership-donation/` com arquitetura padrão
2) Definir `constants`, `interfaces`, `dtos`, `mappers`
3) Implementar `repository`, `crud.service`, `lookup.service`
4) Expor controller e rotas
5) Integrar no orchestrator (armazenar seleção; criar após `payment_completed`)
6) Eventos + logging
7) Invalidação de cache (se aplicável)
8) Testes unitários/integrados (100% cobertura)

---

## Observações de Compliance
- Recibo fiscal pode exigir numeração específica (`osot_receipt_number`)
- `isAnonymous` afeta somente exibição pública; manter referência a `Account` sempre para auditoria
- RGPD/consentimentos: armazenar flags e respeitar na comunicação

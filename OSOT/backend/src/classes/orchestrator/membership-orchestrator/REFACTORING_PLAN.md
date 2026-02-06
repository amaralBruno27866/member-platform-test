# Membership Orchestrator Refactoring Plan

## Status: 🚀 In Progress

Refatoração em andamento para dividir a lógica monolítica do orchestrator em serviços especializados por step.

## Estrutura de Arquivos

```
services/
├── membership-orchestrator.service.ts         [COORDENADOR PRINCIPAL]
│
├── step_1_2-eligibility-validator.service.ts  [Steps 1-2: Validação de Elegibilidade]
├── step_3-session-manager.service.ts          [Step 3: Gestão de Sessão Redis]
├── step_4-data-stager.service.ts              [Step 4: Staging de Dados]
├── step_4_5_to_7-order-orchestrator.service.ts[Steps 4.5-7: Order + Insurance + Donation]
├── step_8_5-payment-handler.service.ts        [Step 8.5: Payment Mock]
└── step_10-entity-creator.service.ts          [Step 10: Criação de Entities]
```

## Fluxo de Execução

```
User Request
    ↓
[Orchestrator] initiateMembership()
    ↓
[Step 1-2] Validate eligibility + determine user group
    ↓
[Step 3] Create Redis session with metadata
    ↓
[Step 4] Stage membership data in Redis
    ↓
[Step 4.5-7] Create Order DRAFT + add membership/insurance/donation
    ↓
[Step 8.5] Mark payment as completed (mock)
    ↓
User Reviews Order → Confirms Payment
    ↓
[Orchestrator] completeMembership()
    ↓
[Step 1-2] Validate session ownership
    ↓
[Step 10] Create all entities sequentially
    ↓
Activate Account + Emit Events
    ↓
✅ Membership Completed
```

## Ordem de Correção

| # | Arquivo | Status | Prioridade | Notas |
|---|---------|--------|-----------|-------|
| 1 | step_1_2-eligibility-validator | ❌ TODO | 🔴 ALTA | Base para todo o workflow |
| 2 | step_3-session-manager | ❌ TODO | 🔴 ALTA | Depende de Step 1-2 |
| 3 | step_4-data-stager | ❌ TODO | 🟡 MEDIA | Depende de Step 3 |
| 4 | step_4_5_to_7-order-orchestrator | ❌ TODO | 🟡 MEDIA | Mais complexo |
| 5 | step_8_5-payment-handler | ❌ TODO | 🟢 BAIXA | Simples |
| 6 | step_10-entity-creator | ❌ TODO | 🔴 ALTA | Depende de Steps anteriores |
| 7 | membership-orchestrator.service | ❌ TODO | 🔴 ALTA | Orquestra tudo |

## Checklist de Correções

### Step 1-2: Eligibility Validator
- [ ] Corrigir imports (usar caminhos @/)
- [ ] Implementar validateEligibility()
- [ ] Implementar determineUserGroupAndCategory()
- [ ] Adicionar validações de negócio
- [ ] Testar com mock data

### Step 3: Session Manager
- [ ] Corrigir imports
- [ ] Implementar createSession()
- [ ] Implementar getSession()
- [ ] Implementar validateSessionOwnership()
- [ ] Testar integração com Redis

### Step 4: Data Staging
- [ ] Corrigir imports
- [ ] Implementar stage* methods
- [ ] Implementar retrieval methods
- [ ] Testar com dados reais

### Step 4.5-7: Order Orchestrator
- [ ] Corrigir imports
- [ ] Dividir em 3 métodos claros:
  - addMembershipToOrder()
  - processInsuranceSelections()
  - processDonationSelection()
- [ ] Implementar validações

### Step 8.5: Payment Handler
- [ ] Corrigir imports
- [ ] Implementar markPaymentCompletedMock()
- [ ] Simples e independente

### Step 10: Entity Creator
- [ ] Corrigir imports
- [ ] Implementar createAllEntities()
- [ ] Ordem correta: Category → Employment → Practices → Preferences → Settings
- [ ] Progress tracking em Redis

### Orchestrator Principal
- [ ] Injetar todos os 6 step services
- [ ] Implementar initiateMembership()
- [ ] Implementar completeMembership()
- [ ] Orquestração simples: chamar steps na ordem correta

## Erros Conhecidos a Corrigir

- ❌ Imports usando caminhos relativos antigos (`../../../../`)
- ❌ Class names não correspondem aos exports
- ❌ Interfaces faltando ou incorretas
- ❌ Repository methods não existentes
- ❌ Lógica incompleta ou placeholder

## Próximos Passos

1. **Começar com Step 1-2** (eligibility-validator)
   - Base para todo o resto
   - Sem dependências externas complexas
   
2. **Depois Step 3** (session-manager)
   - Depende de Step 1-2 completado
   
3. **Depois Step 4** (data-stager)
   - Independente, simples Redis ops
   
4. **Depois Step 4.5-7** (order-orchestrator)
   - Mais complexo, múltiplas integrações
   
5. **Depois Step 8.5** (payment-handler)
   - Simples, último passo antes de completar
   
6. **Depois Step 10** (entity-creator)
   - Orquestra criação sequencial de entities
   
7. **Finalmente orchestrator principal**
   - Conecta todos os steps

---

**Filosofia**: Um passo de cada vez, com testes, antes de passar para o próximo.

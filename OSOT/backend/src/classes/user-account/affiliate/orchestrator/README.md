# Affiliate Orchestrator Integration Specifications

Esta pasta contém **especificações e contratos** para a futura implementação do AffiliateOrchestrator, não o orchestrator em si.

## 📁 Estrutura

```
orchestrator/
├── dto/                     # Contratos de dados para workflows
│   ├── registration-session.dto.ts    # Estrutura de sessões Redis
│   ├── workflow-results.dto.ts        # Tipos de resposta padronizados
│   └── index.ts                       # Exports centralizados
├── interfaces/              # Contratos de serviços
│   └── orchestrator-contracts.interface.ts  # Interface AffiliateOrchestrator
├── services/                # Serviços de demonstração
│   └── affiliate-session.service.ts   # Padrões de gestão de sessão
└── README.md               # Este arquivo
```

## 🎯 Propósito

### ⚠️ **IMPORTANTE: Estes NÃO são os orchestrators reais!**

Estes arquivos servem como:

1. **📋 Especificações Técnicas** - Definem exatamente como o orchestrator deve ser implementado
2. **🔗 Contratos de Interface** - Garantem compatibilidade entre Affiliate module e orchestrator
3. **📚 Documentação Executável** - Exemplos práticos de uso dos serviços do Affiliate module
4. **🛠️ Guias de Implementação** - Padrões e melhores práticas para desenvolvimento

## 🚀 Como Usar

### Para Implementar o Orchestrator Real:

1. **Use os Contratos**: Implemente a interface `AffiliateOrchestrator` definida em `interfaces/`
2. **Siga os DTOs**: Use as estruturas de dados definidas em `dto/`
3. **Consulte o Demo Service**: Veja padrões de sessão em `services/affiliate-session.service.ts`
4. **Leia as Especificações**: Controller comments em `../controllers/affiliate-*.controller.ts`

### Para Consumir Affiliate Services:

- ✅ **AffiliateBusinessRuleService** - Validações e regras de negócio
- ✅ **AffiliateCrudService** - Operações CRUD (create, read, update, delete)
- ✅ **AffiliateLookupService** - Operações de busca e descoberta

## 🔄 Workflow de Registro Suportado

1. **Stage Registration** → Criar sessão Redis com dados validados
2. **Email Verification** → Validar token e notificar admins
3. **Admin Approval** → Processar aprovação/rejeição
4. **Account Persistence** → Criar conta no Dataverse
5. **Status Tracking** → Monitorar progresso completo

## 📊 Funcionalidades Principais

### 🔐 Validação e Segurança

- **Email Uniqueness**: Verificação de emails únicos usando `AffiliateBusinessRuleService.validateEmailUniqueness()`
- **Password Hashing**: Hash seguro usando `AffiliateBusinessRuleService.hashAffiliatePassword()`
- **Business Rules**: Validação completa usando `AffiliateBusinessRuleService.validateAffiliateCreation()`

### 📧 Gestão de Email

- **Verification Emails**: Envio de emails de verificação com tokens
- **Admin Notifications**: Notificação de admins para aprovação
- **Welcome Emails**: Emails de boas-vindas após criação da conta
- **Resend Logic**: Sistema de reenvio com limite de tentativas

### 🗄️ Gestão de Sessão

- **Redis Storage**: Armazenamento temporário de dados de registro
- **Session TTL**: Expiração automática de sessões (24 horas padrão)
- **Status Tracking**: Acompanhamento de progresso do workflow
- **Cleanup**: Limpeza automática de sessões expiradas

### 👥 Controle de Acesso

- **Admin Approval**: Processo de aprovação por administradores
- **Privilege Validation**: Verificação de níveis de privilégio (OWNER > ADMIN > MAIN)
- **Field Filtering**: Filtragem de campos baseada em privilégios

## 🏗️ Arquitetura de Integração

```
┌─────────────────────────────────────────────────────────────┐
│                    Orchestrator Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │     Redis       │  │     Email       │  │    Event     │ │
│  │   Sessions      │  │   Service       │  │   System     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Business Rule  │  │      CRUD       │  │   Lookup     │ │
│  │    Service      │  │    Service      │  │   Service    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   DataverseService Layer                    │
└─────────────────────────────────────────────────────────────┘
```

## 📖 Exemplos de Implementação

### Stage Registration

```typescript
const result = await orchestrator.stageRegistration({
  organizationName: 'Healthcare Corp',
  email: 'contact@healthcare.com',
  password: 'SecurePass123!',
  area: 1, // Healthcare area
  city: 'Toronto',
  province: 'Ontario',
  country: 'Canada',
});
```

### Email Verification

```typescript
const verified = await orchestrator.verifyEmail(sessionId, verificationToken);
```

### Admin Approval

```typescript
const approved = await orchestrator.processAdminApproval(
  sessionId,
  'admin-user-id',
  true, // approved
  undefined, // no rejection reason
);
```

### Account Creation

```typescript
const affiliate = await orchestrator.createAffiliateAccount(sessionId);
```

## 🔧 Configuração Recomendada

```typescript
interface AffiliateOrchestratorConfig {
  redis: {
    sessionKeyPrefix: 'affiliate_session:';
    sessionTtlHours: 24;
  };
  email: {
    verificationTemplateId: 'affiliate-verification';
    welcomeTemplateId: 'affiliate-welcome';
    adminNotificationTemplateId: 'affiliate-approval-needed';
    maxResendAttempts: 3;
  };
  workflow: {
    requireAdminApproval: true;
    autoCreateOnApproval: true;
    cleanupCompletedSessions: true;
  };
}
```

## 📝 Status de Registro

### Estados Possíveis

- **PENDING**: Registro iniciado
- **STAGED**: Dados armazenados no Redis
- **EMAIL_VERIFIED**: Email verificado
- **ADMIN_APPROVED**: Aprovado por admin
- **ADMIN_REJECTED**: Rejeitado por admin
- **ACCOUNT_CREATED**: Conta criada no Dataverse
- **WORKFLOW_COMPLETED**: Processo finalizado
- **CANCELLED**: Cancelado pelo usuário
- **EXPIRED**: Sessão expirada

### Progresso Tracking

- ✅ **staged**: Dados staged no Redis
- ✅ **emailVerified**: Email verificado
- ✅ **adminApproval**: Aprovação admin
- ✅ **accountCreated**: Conta criada
- ✅ **workflowCompleted**: Workflow finalizado

## 🚀 Próximos Passos

1. **Implementar Redis Service**: Configurar Redis para gestão de sessões
2. **Integrar Email Service**: Configurar envio de emails
3. **Implementar Event System**: Sistema de eventos para tracking
4. **Criar Admin Interface**: Interface para aprovação de registros
5. **Implementar Monitoring**: Logs e métricas de performance

## 📖 Documentação Completa

Veja `../docs/ORCHESTRATOR_INTEGRATION_GUIDE.md` para guia detalhado de integração.

---

**🏗️ Quando estiver pronto para implementar o orchestrator real, estes contratos garantem que tudo funcionará perfeitamente com o Affiliate module!**

# Address Orchestrator Integration Specifications

Esta pasta contém **especificações e contratos** para a futura implementação do AddressOrchestrator, não o orchestrator em si.

## 📁 Estrutura

```
orchestrator/
├── dto/                     # Contratos de dados para workflows
│   ├── address-session.dto.ts         # Estrutura de sessões Redis para endereços
│   ├── address-workflow-results.dto.ts # Tipos de resposta padronizados
│   └── index.ts                       # Exports centralizados
├── interfaces/              # Contratos de serviços
│   └── address-orchestrator-contracts.interface.ts  # Interface AddressOrchestrator
├── services/                # Serviços de demonstração
│   └── address-session.service.ts     # Padrões de gestão de sessão
└── README.md               # Este arquivo
```

## 🎯 Propósito

### ⚠️ **IMPORTANTE: Estes NÃO são os orchestrators reais!**

Estes arquivos servem como:

1. **📋 Especificações Técnicas** - Definem exatamente como o orchestrator deve ser implementado
2. **🔗 Contratos de Interface** - Garantem compatibilidade entre Address module e orchestrator
3. **📚 Documentação Executável** - Exemplos práticos de uso dos serviços do Address module
4. **🛠️ Guias de Implementação** - Padrões e melhores práticas para desenvolvimento

## 🚀 Como Usar

### Para Implementar o Orchestrator Real:

1. **Use os Contratos**: Implemente a interface `AddressOrchestrator` definida em `interfaces/`
2. **Siga os DTOs**: Use as estruturas de dados definidas em `dto/`
3. **Consulte o Demo Service**: Veja padrões de sessão em `services/address-session.service.ts`
4. **Leia as Especificações**: Controller comments em `../controllers/address-public.controller.ts`

### Para Consumir Address Services:

- ✅ **AddressCrudService** - Operações CRUD (create, read, update, delete)
- ✅ **AddressLookupService** - Buscas geográficas e por código postal
- ✅ **AddressBusinessRulesService** - Validações e padronização
- ✅ **AddressEventsService** - Eventos de lifecycle
- ✅ **AddressMappers** - Transformações de dados

## 🔄 Workflow de Registro Suportado

1. **Stage Address** → Criar sessão Redis com dados de endereço validados
2. **Validate Address** → Validação de formato e códigos postais
3. **Geocode Address** → Validação geográfica e obtenção de coordenadas
4. **Link to Account** → Associação com conta existente
5. **Persist Address** → Criação definitiva no Dataverse
6. **Complete Workflow** → Finalização com eventos de auditoria

## 📊 Estados do Workflow

### Status da Sessão:

- `PENDING` → Aguardando validação inicial
- `STAGED` → Dados armazenados em sessão Redis
- `VALIDATED` → Formato de endereço validado
- `GEOCODED` → Validação geográfica completa
- `ACCOUNT_LINKED` → Vinculado à conta
- `ADDRESS_CREATED` → Endereço criado no Dataverse
- `CREATION_FAILED` → Falha na criação
- `WORKFLOW_COMPLETED` → Workflow finalizado

### Progresso Rastreado:

- ✅ **staged** → Dados na sessão Redis
- ✅ **validated** → Validação de formato completa
- ✅ **geocoded** → Validação geográfica completa
- ✅ **accountLinked** → Vinculação com conta
- ✅ **persisted** → Persistido no Dataverse

## 🗂️ Estrutura de Sessão Redis

```typescript
{
  sessionId: string,
  status: AddressRegistrationStatus,
  addressData: {
    userBusinessId: string,
    address1: string,
    address2?: string,
    city: string,
    province: string,
    postalCode: string,
    country: string,
    addressType: AddressType,
    // ... outros campos
  },
  progress: {
    staged: boolean,
    validated: boolean,
    geocoded: boolean,
    accountLinked: boolean,
    persisted: boolean
  },
  validation: {
    postalCodeValid: boolean,
    provinceValid: boolean,
    standardized: boolean,
    geocoded?: boolean
  },
  createdAt: string,
  updatedAt: string,
  expiresAt: string
}
```

## 🔧 Padrões de Validação

### Validação de Código Postal:

- **Canadá**: `K1A 0A6` (formato específico por província)
- **Validação por Província**: Códigos postais compatíveis com província selecionada

### Validação Geográfica:

- **Província/Cidade**: Combinações válidas
- **Padronização**: Formatação consistente de endereços
- **Geocodificação**: Obtenção de coordenadas quando possível

## 🔗 Integração com Outros Módulos

### Account Module:

- Vinculação de endereços a contas existentes
- Validação de `userBusinessId`
- Verificação de permissões de usuário

### Contact Module:

- Endereços podem ser associados a contatos
- Compartilhamento de validações geográficas

## 📋 Especificações de Implementação

### Chaves Redis Recomendadas:

```typescript
address_session: {
  sessionId;
} // Sessão principal
user_address_sessions: {
  businessId;
} // Sessões por usuário
address_validation: {
  hash;
} // Cache de validação
address_geocoding: {
  hash;
} // Cache de geocodificação
```

### TTL Recomendado:

- **Sessões de Registro**: 24 horas
- **Cache de Validação**: 7 dias
- **Cache de Geocodificação**: 30 dias

### Eventos Emitidos:

- `address.registration.staged`
- `address.validation.completed`
- `address.geocoding.completed`
- `address.account.linked`
- `address.created`
- `address.session.expired`

## � Próximos Passos

1. **Implementar AddressOrchestrator** usando as interfaces definidas
2. **Integrar RedisService** para persistência de sessões
3. **Configurar EmailService** para notificações (se necessário)
4. **Implementar Geocoding Service** para validação geográfica
5. **Criar EventEmitter** para auditoria completa
6. **Testes de Integração** com Address module services

## 📖 Documentação Adicional

- Veja `../controllers/PUBLIC_PRIVATE_ARCHITECTURE.md` para detalhes da API
- Consulte `../services/README.md` para documentação dos serviços
- Revise `../dtos/README.md` para estruturas de dados

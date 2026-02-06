# Domain Architecture Guide

Este documento descreve a estrutura organizacional dos domínios no projeto e explica o propósito de cada pasta dentro de uma classe/domínio.

## Visão Geral

O projeto segue uma arquitetura orientada a domínios, onde cada entidade de negócio (ex: `user-account`, `membership`) é organizada em uma estrutura padronizada com pastas específicas para diferentes responsabilidades.

## Estrutura de Domínio

Cada domínio segue a seguinte estrutura de pastas:

```
src/classes/user-account/account/
├── constants/
├── controllers/
├── docs/
├── dtos/
├── events/
├── interfaces/
├── mappers/
├── modules/
├── repositories/
├── schedulers/
├── services/
├── tests/
└── validators/
```

## Descrição das Pastas

### 📁 constants

**Propósito**: Armazena valores fixos, chaves, nomes de campo, defaults e enum helpers específicos do domínio.

**Exemplo**: `account.constants.ts`

```typescript
export const ACCOUNT_PREFIX = 'osot';
export const DEFAULT_PAGE_SIZE = 25;
export const ACCOUNT_FIELDS = {
  ID: 'osot_table_accountid',
  EMAIL: 'osot_email',
  FIRST_NAME: 'osot_first_name',
};
```

### 📁 controllers

**Propósito**: Define endpoints HTTP (controllers NestJS). Controllers devem ser finos e delegar toda lógica para services.

**Exemplo**: `account.controller.ts`

```typescript
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CreateAccountDto } from '../dtos/create-account.dto';
import { TableAccountService } from '../services/table-account.service';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: TableAccountService) {}

  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.accountService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountService.findById(id);
  }
}
```

### 📁 docs

**Propósito**: Documentação específica do domínio, incluindo:

- README com exemplos de uso
- Diagramas de fluxo
- Contratos de API
- Exemplos de payload
- Snippets OpenAPI

**Exemplo**: `README.md`

````markdown
# Account Domain

## Endpoints

- POST /accounts - Criar conta
- GET /accounts/:id - Buscar conta por ID

## Exemplos de Uso

\```bash
curl -X POST /accounts \
 -H "Content-Type: application/json" \
 -d '{"osot_first_name": "João", "osot_email": "joao@email.com"}'
\```
````

### 📁 dtos

**Propósito**: Classes DTO com validações (`class-validator`) e transformações (`class-transformer`). Organizados por propósito:

- `basic/` - Campos básicos compartilhados
- `create/` - Payload de criação
- `update/` - Payload de atualização
- `response/` - Formato de resposta (sem campos sensíveis)
- `query/` - Parâmetros de busca e filtros

**Importante**: DTOs de resposta nunca devem incluir campos sensíveis como senhas.

### 📁 events

**Propósito**: Classes e interfaces para eventos de domínio, handlers e publishers (padrão Event Sourcing).

**Exemplo**: `user-registered.event.ts`

```typescript
export class UserRegisteredEvent {
  constructor(
    public readonly accountId: string,
    public readonly email: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
```

### 📁 interfaces

**Propósito**: Tipos e shapes TypeScript que definem a estrutura das entidades. DTOs podem implementar essas interfaces para garantir consistência.

**Exemplo**: `account.interface.ts`

```typescript
export interface Account {
  osot_table_accountid?: string;
  osot_first_name: string;
  osot_last_name: string;
  osot_email: string;
  osot_account_group: number;
  createdon?: string;
  modifiedon?: string;
}
```

### 📁 mappers

**Propósito**: Funções que transformam dados entre diferentes camadas:

- DTO → Payload Dataverse
- Resposta Dataverse → Interface
- Interface → DTO de resposta

Centraliza transformações de campos e renomeações.

**Exemplo**: `account.mapper.ts`

```typescript
import { CreateAccountDto } from '../dtos/create-account.dto';
import { Account } from '../interfaces/account.interface';

export function toDataversePayload(dto: CreateAccountDto): any {
  return {
    osot_firstname: dto.osot_first_name,
    osot_lastname: dto.osot_last_name,
    osot_email: dto.osot_email,
    osot_accountgroup: dto.osot_account_group,
  };
}

export function fromDataverseResponse(response: any): Account {
  return {
    osot_table_accountid: response.osot_table_accountid,
    osot_first_name: response.osot_firstname,
    osot_last_name: response.osot_lastname,
    osot_email: response.osot_email,
    osot_account_group: response.osot_accountgroup,
    createdon: response.createdon,
    modifiedon: response.modifiedon,
  };
}
```

### 📁 modules

**Propósito**: Módulos NestJS que registram controllers, providers, imports e exports do domínio. Services devem ser exportados para uso por orchestrators.

**Exemplo**: `account.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AccountController } from '../controllers/account.controller';
import { TableAccountService } from '../services/table-account.service';
import { DataverseAccountRepository } from '../repositories/dataverse-account.repository';
import { DataverseModule } from '../../../../integrations/dataverse/dataverse.module';

@Module({
  imports: [DataverseModule],
  controllers: [AccountController],
  providers: [TableAccountService, DataverseAccountRepository],
  exports: [TableAccountService], // Disponível para orchestrators
})
export class AccountModule {}
```

### 📁 repositories

**Propósito**: Camada de persistência que encapsula comunicação com Dataverse. Facilita testes com mocks e isola lógica de persistência.

**Exemplo**: `dataverse-account.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse/dataverse.service';

@Injectable()
export class DataverseAccountRepository {
  constructor(private readonly dataverseService: DataverseService) {}

  async create(entity: any): Promise<any> {
    return this.dataverseService.create('osot_table_account', entity);
  }

  async findByEmail(email: string): Promise<any> {
    const filter = `osot_email eq '${email}'`;
    return this.dataverseService.query('osot_table_account', { filter });
  }

  async update(id: string, entity: any): Promise<any> {
    return this.dataverseService.update('osot_table_account', id, entity);
  }
}
```

### 📁 schedulers

**Propósito**: Tarefas agendadas (cron jobs), lembretes e jobs periódicos usando NestJS Schedule.

**Exemplo**: `account-reminder.scheduler.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TableAccountService } from '../services/table-account.service';

@Injectable()
export class AccountReminderScheduler {
  constructor(private readonly accountService: TableAccountService) {}

  @Cron('0 9 * * 1') // Toda segunda às 9h
  async sendWeeklyReminders() {
    // Lógica para enviar lembretes
  }
}
```

### 📁 services

**Propósito**: Lógica de domínio central. Coordena repositories, mappers, events e side-effects. É o ponto principal de orquestração do domínio.

**Exemplo**: `table-account.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { DataverseAccountRepository } from '../repositories/dataverse-account.repository';
import {
  toDataversePayload,
  fromDataverseResponse,
} from '../mappers/account.mapper';
import { CreateAccountDto } from '../dtos/create-account.dto';
import { Account } from '../interfaces/account.interface';

@Injectable()
export class TableAccountService {
  constructor(private readonly repository: DataverseAccountRepository) {}

  async create(dto: CreateAccountDto): Promise<Account> {
    // 1. Hash password if needed
    if (dto.osot_password) {
      dto.osot_password = await this.hashPassword(dto.osot_password);
    }

    // 2. Transform to Dataverse format
    const payload = toDataversePayload(dto);

    // 3. Persist
    const response = await this.repository.create(payload);

    // 4. Transform response back to domain format
    return fromDataverseResponse(response);
  }

  async findByEmail(email: string): Promise<Account | null> {
    const response = await this.repository.findByEmail(email);
    return response ? fromDataverseResponse(response) : null;
  }

  private async hashPassword(password: string): Promise<string> {
    // Implementação do hash
    return password; // Placeholder
  }
}
```

### 📁 tests

**Propósito**: Testes unitários e de integração específicos do domínio. Estrutura sugerida:

- `unit/` - Testes unitários (services, mappers, validators)
- `integration/` - Testes de integração (controllers, repositories)

**Exemplo**: `services/table-account.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TableAccountService } from '../services/table-account.service';
import { DataverseAccountRepository } from '../repositories/dataverse-account.repository';

describe('TableAccountService', () => {
  let service: TableAccountService;
  let repository: jest.Mocked<DataverseAccountRepository>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableAccountService,
        { provide: DataverseAccountRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<TableAccountService>(TableAccountService);
    repository = module.get(DataverseAccountRepository);
  });

  it('should create an account', async () => {
    const dto = { osot_first_name: 'João', osot_email: 'joao@email.com' };
    const expectedResponse = { osot_table_accountid: '123', ...dto };

    repository.create.mockResolvedValue(expectedResponse);

    const result = await service.create(dto as any);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining(dto),
    );
    expect(result).toEqual(expect.objectContaining(dto));
  });
});
```

### 📁 validators

**Propósito**: Validadores customizados para class-validator ou Pipes do NestJS. Reutilizáveis entre diferentes DTOs.

**Exemplo**: `phone.validator.ts`

```typescript
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'phoneNumber', async: false })
export class PhoneNumberValidator implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (!value) return true; // Optional field

    // Canadian phone number validation
    const phoneRegex =
      /^(\+?1[-.\s]?)?\(?([2-9][0-9]{2})\)?[-.\s]?([2-9][0-9]{2})[-.\s]?([0-9]{4})$/;
    return phoneRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Phone number must be a valid Canadian number';
  }
}
```

## Boas Práticas

### Controllers

- Mantenha controllers finos - apenas validação de entrada e delegação para services
- Use DTOs apropriados para entrada e resposta
- Implemente tratamento de erros consistente

### Services

- Concentre toda lógica de negócio nos services
- Coordene entre repositories, mappers e outros services
- Implemente tratamento de side-effects (eventos, emails, logs)

### Repositories

- Encapsule toda comunicação com Dataverse
- Use interfaces para facilitar testes com mocks
- Mantenha métodos focados e específicos

### DTOs e Mappers

- Use DTOs diferentes para entrada e saída
- Nunca exponha campos sensíveis em DTOs de resposta
- Centralize transformações nos mappers

### Módulos

- Exporte apenas services que serão usados por outros domínios
- Importe apenas o necessário
- Mantenha dependências claras e explícitas

### Testes

- Teste services com repositories mockados
- Teste controllers com integração real quando necessário
- Mantenha cobertura alta nas regras de negócio

## Fluxo de Dados Típico

```
Controller → Service → Repository → Dataverse
    ↓           ↓          ↓
  DTO      Mapper    OData Query
    ↓           ↓          ↓
Response ← Interface ← JSON Response
```

## Estrutura de Arquivos de Exemplo

```
src/classes/user-account/account/
├── constants/
│   └── account.constants.ts
├── controllers/
│   └── account.controller.ts
├── docs/
│   └── README.md
├── dtos/
│   ├── account-basic.dto.ts
│   ├── create-account.dto.ts
│   ├── update-account.dto.ts
│   ├── account-response.dto.ts
│   └── list-accounts.query.dto.ts
├── interfaces/
│   └── account.interface.ts
├── mappers/
│   └── account.mapper.ts
├── modules/
│   └── account.module.ts
├── repositories/
│   └── dataverse-account.repository.ts
├── services/
│   └── table-account.service.ts
├── tests/
│   ├── unit/
│   │   └── table-account.service.spec.ts
│   └── integration/
│       └── account.controller.spec.ts
└── validators/
    └── phone.validator.ts
```

## Conclusão

Esta estrutura promove:

- **Separação de responsabilidades** - Cada pasta tem um propósito específico
- **Testabilidade** - Facilita criação de mocks e testes unitários
- **Manutenibilidade** - Código organizado e fácil de encontrar
- **Reutilização** - Components podem ser reutilizados entre domínios
- **Escalabilidade** - Estrutura consistente facilita adição de novos domínios

Siga esta estrutura para manter consistência across all domains no projeto.

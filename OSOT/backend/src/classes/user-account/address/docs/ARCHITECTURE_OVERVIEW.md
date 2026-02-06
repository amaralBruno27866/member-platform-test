# Address Module Architecture Overview

## Introduction

The Address Module implements a comprehensive modern architecture with clean separation of concerns, designed for high maintainability, testability, and orchestrator integration. This module provides complete address management capabilities while supporting both public (registration) and private (authenticated user) workflows.

## Core Architecture Principles

### 1. Repository Pattern

- **Clean Data Access**: Abstract data layer with `AddressRepository` interface
- **Testability**: Easy mocking and unit testing capabilities
- **Flexibility**: Pluggable implementations (currently Dataverse-based)
- **Error Handling**: Centralized data access error management

### 2. Event-Driven Architecture

- **Lifecycle Events**: Complete address creation, update, deletion events
- **Integration Support**: Events for external system coordination
- **Workflow Tracking**: Progress and status change notifications
- **Audit Trail**: Comprehensive operation history

### 3. Service Layer Architecture

- **CRUD Services**: Core data operations with business logic
- **Business Rule Services**: Validation, normalization, and compliance
- **Utility Services**: Postal code validation, formatting, sanitization
- **Orchestration Services**: Workflow coordination and session management

### 4. Type-Safe Data Flow

- **DTO Validation**: Class-validator decorators for all inputs
- **Mapper Layer**: Clean data transformations with type safety
- **Interface Contracts**: Well-defined service boundaries
- **Error Typing**: Structured error responses

## Module Structure

```
address/
├── controllers/              # Public/Private API endpoints
│   ├── address-public.controller.ts    # Registration workflows
│   ├── address-private.controller.ts   # Authenticated operations
│   └── PUBLIC_PRIVATE_ARCHITECTURE.md
├── services/                 # Business logic layer
│   ├── address-crud.service.ts           # Core CRUD operations
│   ├── address-business-rule.service.ts  # Validation & normalization
│   └── README.md
├── orchestrator/             # Workflow coordination (NEW)
│   ├── interfaces/           # Orchestrator contracts
│   ├── dto/                  # Session and workflow DTOs
│   ├── services/             # Demo orchestrator implementation
│   └── README.md
├── repositories/             # Data access layer
│   └── address.repository.ts
├── dtos/                     # Data transfer objects
│   ├── create-address.dto.ts
│   ├── update-address.dto.ts
│   └── address-response.dto.ts
├── events/                   # Event management
│   └── address.events.ts
├── mappers/                  # Data transformation
│   └── address.mapper.ts
├── utils/                    # Address-specific utilities
│   ├── postal-code-validator.util.ts  # Comprehensive postal code validation (CA, US, EU)
│   ├── address-normalizer.util.ts     # Address data normalization
│   ├── address-formatter.util.ts      # Address formatting
│   └── geographic-lookup.util.ts      # Geographic data lookup
└── docs/                     # Documentation
    ├── ARCHITECTURE_OVERVIEW.md         # This document
    └── ORCHESTRATOR_INTEGRATION_GUIDE.md # Orchestrator integration
```

## Controller Architecture

### Public/Private Separation

The Address module implements a **dual-controller pattern** for clear workflow separation:

#### Public Controller (`address-public.controller.ts`)

- **Purpose**: Registration and unauthenticated workflows
- **Target**: Account registration orchestrator integration
- **Authentication**: None required (public endpoints)
- **Workflow**: Staging → Validation → Persistence via orchestrator
- **Session Management**: Redis-based temporary storage
- **Use Cases**:
  - Address staging during registration
  - Validation workflow coordination
  - Status tracking and monitoring

#### Private Controller (`address-private.controller.ts`)

- **Purpose**: Authenticated user address management
- **Target**: Logged-in users managing their addresses
- **Authentication**: JWT required on all endpoints
- **Workflow**: Direct CRUD operations
- **Data Persistence**: Immediate Dataverse operations
- **Use Cases**:
  - View user addresses
  - Add/edit/delete addresses
  - Set primary address
  - Address validation

### API Design Patterns

#### Public Endpoints (Orchestrator Integration)

```typescript
POST /api/address/stage          # Stage address for validation
PUT  /api/address/validate/{id}  # Validate staged address
POST /api/address/persist/{id}   # Persist validated address
GET  /api/address/status/{id}    # Check workflow status
```

#### Private Endpoints (User Operations)

```typescript
GET    /api/address/private           # List user addresses
POST   /api/address/private           # Create new address
GET    /api/address/private/{id}      # Get specific address
PUT    /api/address/private/{id}      # Update address
DELETE /api/address/private/{id}      # Delete address
PUT    /api/address/private/{id}/primary # Set as primary
```

## Service Architecture

### Core Services

#### AddressCrudService

- **Responsibility**: Core CRUD operations with business logic
- **Dependencies**: AddressRepository, AddressBusinessRuleService, Events
- **Key Features**:
  - Repository pattern implementation
  - Business rule integration
  - Event emission for lifecycle changes
  - Error handling and validation
  - Type-safe data operations

#### AddressBusinessRuleService

- **Responsibility**: Validation, normalization, and business rules
- **Key Features**:
  - Address type uniqueness validation
  - Postal code format validation
  - Country-specific address rules
  - Data normalization (capitalization, formatting)
  - Duplicate detection logic

#### PostalCodeValidator (Utility)

- **Responsibility**: Country-specific postal code validation
- **Features**:
  - Canada postal code validation (K1A 0A6 format)
  - US ZIP code support
  - Geographic validation
  - Format normalization

### Integration Services

#### AddressEventsService

- **Responsibility**: Event lifecycle management
- **Events**:
  - `address.created` - New address created
  - `address.updated` - Address modified
  - `address.deleted` - Address removed
  - `address.staged` - Address staged for validation
  - `address.validated` - Validation completed
  - `address.persisted` - Address persisted to system

#### RedisService Integration

- **Session Management**: Temporary address storage during workflows
- **Key Patterns**: `address:session:{sessionId}`
- **TTL Management**: Configurable expiration times
- **Data Serialization**: JSON with Date handling

## Data Flow Architecture

### Registration Workflow (Public)

```
1. Client → POST /api/address/stage
2. PublicController → AddressOrchestrator.stageAddress()
3. AddressOrchestrator → RedisService (session storage)
4. AddressOrchestrator → BusinessRuleService (initial validation)
5. Return: { sessionId, status, nextStep, expiresAt }

6. Client → PUT /api/address/validate/{sessionId}
7. AddressOrchestrator → BusinessRuleService (full validation)
8. AddressOrchestrator → PostalCodeValidator
9. RedisService ← Updated session with validation results
10. Return: { validationResults, normalizedData, nextStep }

11. Client → POST /api/address/persist/{sessionId}
12. AddressOrchestrator → AddressCrudService.create()
13. AddressCrudService → AddressRepository.create()
14. AddressEventsService ← address.created event
15. RedisService ← Session marked complete
16. Return: { addressId, status, isPrimary }
```

### User Management Workflow (Private)

```
1. Client → GET /api/address/private (JWT required)
2. PrivateController → AddressCrudService.findByAccountGuid()
3. AddressCrudService → AddressRepository.findByAccountGuid()
4. AddressMapper → Transform to AddressResponseDto
5. Return: AddressResponseDto[]

1. Client → POST /api/address/private (JWT required)
2. PrivateController → AddressCrudService.create()
3. AddressCrudService → BusinessRuleService (validation)
4. AddressCrudService → AddressRepository.create()
5. AddressEventsService ← address.created event
6. Return: AddressResponseDto
```

## Error Handling Strategy

### Validation Errors

- **DTO Validation**: Class-validator decorators with detailed messages
- **Business Rule Errors**: Structured error responses with field-level details
- **Format Errors**: Clear indication of expected format patterns

### Data Access Errors

- **Repository Layer**: Centralized error handling and logging
- **Service Layer**: Business-friendly error transformation
- **Controller Layer**: HTTP status code mapping and response formatting

### Orchestrator Errors

- **Session Errors**: Expired or invalid session handling
- **Workflow Errors**: Step validation and recovery mechanisms
- **Integration Errors**: Service dependency failure handling

## Performance Considerations

### Caching Strategy

- **Redis Sessions**: Temporary data with appropriate TTL
- **Validation Rules**: Cached business rule configurations
- **Postal Code Patterns**: In-memory pattern caching

### Database Optimization

- **Repository Pattern**: Query optimization at data access layer
- **Selective Loading**: Only load required fields for operations
- **Batch Operations**: Support for bulk address operations

### Memory Management

- **Session Cleanup**: Automatic cleanup of expired sessions
- **Event Handling**: Asynchronous event processing
- **Mapper Efficiency**: Minimal object creation in transformations

## Security Architecture

### Authentication & Authorization

- **Public Endpoints**: No authentication required (registration flow)
- **Private Endpoints**: JWT validation required
- **Data Isolation**: User addresses isolated by account GUID

### Data Protection

- **Input Sanitization**: All address inputs sanitized
- **SQL Injection**: Repository pattern prevents direct SQL access
- **Data Validation**: Multi-layer validation (DTO, Business Rules, Database)

### Session Security

- **Redis Sessions**: Temporary storage with automatic expiration
- **Session IDs**: Cryptographically secure session identifiers
- **Data Encryption**: Sensitive data encrypted in Redis storage

## Testing Strategy

### Unit Testing

- **Service Layer**: Comprehensive business logic testing
- **Repository Layer**: Mock implementations for data access
- **Utility Functions**: Complete coverage of validation and formatting
- **Mapper Functions**: Input/output transformation testing

### Integration Testing

- **Controller Endpoints**: End-to-end API testing
- **Service Integration**: Cross-service interaction testing
- **Database Operations**: Repository implementation testing
- **Event Flow**: Event emission and handling verification

### Orchestrator Testing

- **Workflow Coordination**: Complete workflow testing
- **Session Management**: Redis integration testing
- **Error Recovery**: Failure scenario and retry testing
- **Performance**: Session cleanup and memory usage testing

## Future Enhancements

### Orchestrator Maturity

- **Production Implementation**: Replace demo service with production orchestrator
- **Advanced Workflows**: Multi-step validation with external services
- **Batch Processing**: Bulk address operations with progress tracking
- **Monitoring**: Comprehensive workflow monitoring and alerting

### Feature Extensions

- **Geographic Services**: Address geocoding and mapping
- **International Support**: Extended country-specific validation
- **Address Suggestions**: Auto-completion and correction services
- **Audit Trail**: Complete address change history

### Performance Optimization

- **Advanced Caching**: Multi-layer caching strategy
- **Database Sharding**: Large-scale data distribution
- **Event Streaming**: High-throughput event processing
- **API Rate Limiting**: Protection against abuse

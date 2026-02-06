# OTA Education Module

## Purpose

Contains the NestJS module that bundles all OTA Education functionality into a cohesive, reusable unit. The `OtaEducationModule` implements a comprehensive dual-controller architecture with enterprise-grade service integration and follows OSOT's established patterns for modular design.

## Module Architecture

### OtaEducationModule

**Purpose**: Provides complete OTA Education functionality with dual-controller architecture.

**Key Components**:

#### Controllers

- `OtaEducationPublicController` - Unauthenticated validation and lookup operations
- `OtaEducationPrivateController` - Authenticated CRUD operations with role-based access control

#### Services

- `OtaEducationCrudService` - Full lifecycle management with business rule validation
- `OtaEducationLookupService` - Specialized query operations with repository integration
- `OtaEducationBusinessRuleService` - Advanced validation engine with membership integration

#### Data Access

- `OtaEducationRepositoryService` - Repository pattern implementation for clean data access
- `OtaEducationEventsService` - Event-driven architecture for audit trails and notifications

#### External Dependencies

- `DataverseModule` - Integration with Microsoft Dataverse for data persistence

## Module Configuration

```typescript
@Module({
  imports: [DataverseModule],
  controllers: [OtaEducationPublicController, OtaEducationPrivateController],
  providers: [
    // Core Services
    OtaEducationCrudService,
    OtaEducationLookupService,
    OtaEducationBusinessRuleService,

    // Data Access
    OtaEducationRepositoryService,

    // Events
    OtaEducationEventsService,
  ],
  exports: [
    // Export services for use in other modules
    OtaEducationCrudService,
    OtaEducationLookupService,
    OtaEducationBusinessRuleService,
    OtaEducationRepositoryService,
    OtaEducationEventsService,
  ],
})
export class OtaEducationModule {}
```

## Service Integration

### Core Service Layer

The module integrates five core services:

1. **OtaEducationCrudService**: Handles create, read, update, delete operations with full business rule validation
2. **OtaEducationLookupService**: Provides specialized query capabilities for data retrieval and analytics
3. **OtaEducationBusinessRuleService**: Enforces complex business logic and cross-domain validation
4. **OtaEducationRepositoryService**: Implements repository pattern for clean data access abstraction
5. **OtaEducationEventsService**: Manages event-driven architecture for audit trails and notifications

### Service Dependencies

Each service is properly injected through NestJS dependency injection:

- Services automatically resolve dependencies between each other
- Repository service provides data access layer abstraction
- Business rule service validates operations across all CRUD methods
- Events service provides audit trail and notification capabilities
- Lookup service offers specialized query operations

## Public API Features

### Validation Endpoints

- **College-Country Alignment**: Validates educational institution geographical consistency
- **User Business ID Checking**: Ensures unique business identifier validation

### Lookup Operations

- **Statistical Analytics**: Provides educational data insights and reporting
- **Reference Data**: Offers educational reference information lookup

## Private API Features

### CRUD Operations

- **Complete Lifecycle Management**: Full create, read, update, delete operations
- **Role-Based Access Control**: Owner, admin, and main user privilege enforcement
- **Business Rule Integration**: Automatic validation on all data operations

### Administrative Features

- **Advanced Statistics**: Comprehensive educational analytics and reporting
- **Bulk Operations**: Efficient handling of multiple records
- **Audit Trail Integration**: Complete operation logging and tracking

## Architecture Improvements

### Version 1.0.0 Features

This module includes the latest architectural improvements:

1. **Enhanced Public Controller**:
   - New college-country validation endpoint
   - User business ID uniqueness checking
   - Improved error handling and response formatting

2. **Standardized Private Controller**:
   - Complete alignment with OT Education patterns
   - Organized endpoint structure (CRUD, Administrative, Validation, Lookup)
   - Comprehensive role-based access control
   - Enhanced Swagger documentation

3. **Modular Service Design**:
   - Clean separation of concerns
   - Repository pattern implementation
   - Event-driven architecture integration
   - Comprehensive dependency injection

## Integration Guidelines

### Using in Other Modules

```typescript
@Module({
  imports: [OtaEducationModule],
  // ... other module configuration
})
export class YourModule {
  constructor(
    private readonly otaEducationCrud: OtaEducationCrudService,
    private readonly otaEducationLookup: OtaEducationLookupService,
  ) {}
}
```

### Service Injection

```typescript
@Injectable()
export class YourService {
  constructor(
    private readonly otaEducationCrud: OtaEducationCrudService,
    private readonly otaEducationBusinessRule: OtaEducationBusinessRuleService,
  ) {}
}
```

## Development Notes

- Module follows OSOT established patterns for consistency
- All services are exported for external module integration
- Comprehensive error handling across all layers
- Full Swagger documentation for API discovery
- Event-driven architecture for scalability and audit compliance
- Repository pattern ensures clean data access abstraction

## Versioning

- **Current Version**: 1.0.0
- **Compatible with**: OT Education Module patterns
- **Framework**: NestJS with TypeScript
- **Dependencies**: DataverseModule for external data integration

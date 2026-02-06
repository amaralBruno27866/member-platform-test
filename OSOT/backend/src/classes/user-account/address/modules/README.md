# Address Modules

## Purpose

Contains NestJS modules that bundle controllers, services, and providers for the address domain. The AddressModule defines the public API (exports) and dependency graph for comprehensive address management functionality with modern architecture patterns.

## Implementation

### AddressModule

The main module that provides complete address management functionality:

**CONTROLLERS:**

- `AddressPublicController`: Address validation and geographic lookup services (no authentication)
- `AddressPrivateController`: Authenticated address management with role-based access control

**SERVICES:**

- `AddressCrudService`: CRUD operations with permission system and field filtering
- `AddressLookupService`: Geographic search, postal code validation, and business queries
- `AddressBusinessRulesService`: Address validation, standardization, and business rules
- `AddressEventsService`: Event-driven architecture for address lifecycle management

**REPOSITORIES:**

- `DataverseAddressRepository`: Clean abstraction for Dataverse address data access
- `ADDRESS_REPOSITORY`: Injection token for repository pattern implementation

**EXTERNAL DEPENDENCIES:**

- `DataverseService`: Integration with Microsoft Dataverse for data persistence

## Architecture Patterns

- **Repository Pattern**: Clean separation between business logic and data access
- **Event-Driven**: Lifecycle events for integration and auditing
- **Permission System**: Role-based access control (owner/admin/main) with field filtering
- **Dependency Injection**: Proper IoC container usage with provider tokens
- **Data Transformation**: Consistent mapping between layers
- **Business Rules**: Address validation, postal code formatting, and geographic standardization

## Key Features

- Geographic validation and postal code standardization
- Address type management (primary, secondary, billing, shipping)
- Integration with Contact and Account modules
- Advanced search by postal code, region, and account association
- Role-based field filtering for security and privacy
- Address standardization and normalization
- Public/private controller architecture for different use cases

## Module Exports

The AddressModule exports core services for use in other modules:

```typescript
exports: [
  AddressCrudService, // CRUD operations with permissions
  AddressLookupService, // Search and geographic queries
  AddressBusinessRulesService, // Validation and standardization
  AddressEventsService, // Event sourcing and audit
  ADDRESS_REPOSITORY, // Repository injection token
];
```

## Usage

Import this module in other modules that need address management functionality:

```typescript
@Module({
  imports: [AddressModule],
  // ... other module configuration
})
export class SomeModule {}
```

## Integration Notes

- **No circular dependencies**: Designed to avoid circular imports with clean dependency graph
- **Cohesive functionality**: All address-related features bundled together
- **External integrations**: Ready for orchestrator pattern integration
- **Scalable design**: Service layer separation for maintainability and testing

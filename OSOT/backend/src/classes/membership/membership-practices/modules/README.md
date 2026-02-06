# Membership Practices - Module Layer

This directory contains the NestJS module configuration for the membership practices feature, encapsulating all dependencies, providers, controllers, and exports.

## Module File

### `membership-practices.module.ts`

- **Purpose**: NestJS module configuration for membership practices
- **Pattern**: Modular architecture with dependency injection
- **Integration**: Connects controllers, services, repositories, and external modules
- **Exports**: Provides services and repository for external module consumption

## Module Architecture

### Dependencies (Imports)

```typescript
imports: [
  DataverseModule, // Core Dataverse integration
  MembershipCategoryModule, // Membership year service
  MembershipSettingsModule, // Year validation and active status check
  MembershipEmploymentModule, // UserGuidResolverUtil (shared utility)
];
```

#### DataverseModule

- Provides `DataverseService` for Dataverse API operations
- Used by repository layer for CRUD operations
- Handles authentication, request formatting, and error handling

#### MembershipCategoryModule

- Provides `MembershipCategoryMembershipYearService` for active year determination
- Required for automatic year assignment in practices creation workflow
- Uses vote-counting algorithm for resilient year selection

#### MembershipSettingsModule

- Provides `MembershipSettingsLookupService` for year validation
- Used by Business Rules Service to validate year exists and is ACTIVE
- Required dependency for create/update operations

#### MembershipEmploymentModule

- Provides `UserGuidResolverUtil` for account GUID resolution
- Shared utility reused from employment module
- Resolves account business IDs to Dataverse GUIDs for OData binding

### Providers (Internal Services)

```typescript
providers: [
  // Business Logic Services
  MembershipPracticesBusinessRulesService, // Clients age required and conditional validation
  MembershipPracticesCrudService, // Create, Update, Delete operations
  MembershipPracticesLookupService, // Read, Query operations

  // Repository Pattern
  {
    provide: MEMBERSHIP_PRACTICES_REPOSITORY,
    useClass: DataverseMembershipPracticesRepository,
  },

  // Supporting Services
  MembershipPracticesEventsService, // Event emission
  MembershipPracticesMapper, // Data transformation
];
```

### Controllers

```typescript
controllers: [
  MembershipPracticesPrivateController, // Private API endpoints only
];
```

**Note**: No public controller - all practices data requires authentication.

### Exports (External Consumption)

```typescript
exports: [
  // Repository Interface
  MEMBERSHIP_PRACTICES_REPOSITORY,

  // Core Services
  MembershipPracticesBusinessRulesService,
  MembershipPracticesCrudService,
  MembershipPracticesLookupService,

  // Event Service
  MembershipPracticesEventsService,

  // Mapper
  MembershipPracticesMapper,
];
```

## Dependency Graph

```
MembershipPracticesModule
├── Imports
│   ├── DataverseModule
│   │   └── DataverseService
│   ├── MembershipCategoryModule
│   │   └── MembershipCategoryMembershipYearService
│   ├── MembershipSettingsModule
│   │   └── MembershipSettingsLookupService
│   └── MembershipEmploymentModule
│       └── UserGuidResolverUtil
├── Providers
│   ├── MembershipPracticesBusinessRulesService
│   ├── MembershipPracticesCrudService
│   ├── MembershipPracticesLookupService
│   ├── DataverseMembershipPracticesRepository
│   ├── MembershipPracticesEventsService
│   └── MembershipPracticesMapper
└── Controllers
    └── MembershipPracticesPrivateController
```

## Service Layer Integration

### Business Rules Service

- **Purpose**: Clients age required validation, conditional "\_Other" fields, year validation
- **Dependencies**:
  - MembershipSettingsLookupService (for year validation)
  - Repository (for uniqueness checks)
  - CrudService (delegates operations)
- **Methods**:
  - `createWithValidation()` - Creates with full validation
  - `updateWithValidation()` - Updates with conditional field checks
  - `validateUpdateDto()` - Pre-validates update DTOs (used by controller)
  - `validateMembershipYear()` - Ensures year exists and is ACTIVE
  - `validateConditionalOtherFields()` - Validates 2 conditional fields
  - `ensureUserYearUniqueness()` - Prevents duplicate practices per year
  - `validateClientsAgeRequired()` - Ensures clients_age has minimum 1 value

### CRUD Service

- **Purpose**: Create, update, and delete operations
- **Dependencies**:
  - Repository (via injection token)
  - EventsService (for event emission)
- **Methods**:
  - `create()` - Creates practices with privilege validation and clients_age check
  - `update()` - Updates existing practices with privilege check and optional clients_age validation
  - `delete()` - Hard delete (Admin/Main only - DISABLED)

### Lookup Service

- **Purpose**: Query and read operations with filtering
- **Dependencies**: Repository (via injection token)
- **Methods**:
  - `findByPracticeId()` - By practice business ID
  - `findById()` - By internal GUID (alias)
  - `findByUserAndYear()` - User-specific lookup
  - `list()` - Paginated list with filters
  - `getByYear()` - Year-based filtering
  - `getByAccount()` - Account-specific practices
  - `getByClientsAge()` - Filter by client age groups
  - `existsByUserAndYear()` - Uniqueness check
  - `count()` - Count with filters

## Repository Pattern

### Interface Injection

```typescript
{
  provide: MEMBERSHIP_PRACTICES_REPOSITORY,
  useClass: DataverseMembershipPracticesRepository,
}
```

This pattern enables:

- **Testability**: Easy mocking in unit tests
- **Flexibility**: Can swap implementations without changing consumers
- **Decoupling**: Services depend on interface, not concrete class

### Usage in Services

```typescript
constructor(
  @Inject(MEMBERSHIP_PRACTICES_REPOSITORY)
  private readonly repository: DataverseMembershipPracticesRepository,
) {}
```

## Controller Integration

### MembershipPracticesPrivateController

**Dependencies Injected**:

```typescript
constructor(
  private readonly businessRulesService: MembershipPracticesBusinessRulesService,
  private readonly crudService: MembershipPracticesCrudService,
  private readonly lookupService: MembershipPracticesLookupService,
  private readonly membershipYearService: MembershipCategoryMembershipYearService,
  private readonly userGuidResolver: UserGuidResolverUtil,
  @Inject(MEMBERSHIP_PRACTICES_REPOSITORY)
  private readonly repository: DataverseMembershipPracticesRepository,
) {}
```

**Note**: External services (`MembershipCategoryMembershipYearService` and `UserGuidResolverUtil`) are injected from external modules.

## Event-Driven Architecture

### Event Emission Flow

1. **CRUD Operation**: Create/Update/Delete via CRUD service
2. **Event Emission**: `MembershipPracticesEventsService.publishPracticesCreated()` etc.
3. **Event Logging**: Structured logging with operation metadata
4. **External Handlers**: Other modules can subscribe to events (future enhancement)

### Available Events

- `MembershipPracticesCreatedEvent` - On practices creation
- `MembershipPracticesUpdatedEvent` - On practices update
- `MembershipPracticesDeletedEvent` - On hard delete
- `MembershipPracticesClientsAgeRequiredEvent` - On clients age validation failure (business required)
- `MembershipPracticesUserYearDuplicateEvent` - On uniqueness violation attempt

## Business Rules Integration

### Clients Age Required Validation (Business Required)

```typescript
// Enforced by BusinessRulesService - minimum 1 value required
await this.businessRulesService.createWithValidation(dto, ...);

// Validates:
// - osot_clients_age array exists
// - Array has at least 1 value
// - Throws descriptive error if validation fails
```

**Key Difference from Employment**: Practices has only this one business required array field (employment has no business required arrays).

### Conditional "\_Other" Fields

Business Rules Service validates 2 conditional field pairs:

1. `osot_practice_settings` + `osot_practice_settings_other` (when array contains OTHER enum value 28)
2. `osot_practice_services` + `osot_practice_services_other` (when array contains OTHER enum value 59)

**Comparison**: Employment has 7 conditional pairs, practices has only 2.

### Account Reference (Optional)

```typescript
// Unlike employment (which requires Account OR Affiliate via XOR),
// practices has OPTIONAL account reference
'osot_Table_Account@odata.bind': `/osot_table_accounts(${userGuid})`

// Account reference:
// - Extracted from JWT token if provided
// - Not required for practices creation
// - No XOR validation (no affiliate option)
```

### Year Validation

```typescript
// BusinessRulesService validates via MembershipSettingsLookupService
await this.validateMembershipYear(membershipYear);

// Checks:
// - Year exists in membership-settings
// - Year has ACTIVE status
// - Throws descriptive error if validation fails
```

## Comparison: Practices vs Employment Modules

### Key Differences

| Aspect                    | Employment Module                    | Practices Module                             |
| ------------------------- | ------------------------------------ | -------------------------------------------- |
| **Business Required**     | None                                 | Clients age (min 1 value)                    |
| **User Type**             | Account OR Affiliate (XOR)           | Account only (optional)                      |
| **Conditional "\_Other"** | 7 fields                             | 2 fields                                     |
| **External Utils**        | None (provides UserGuidResolverUtil) | Imports UserGuidResolverUtil from Employment |
| **Multi-Select Fields**   | 7 enums                              | 4 enums                                      |
| **Delete Routes**         | DISABLED                             | DISABLED                                     |
| **Imports**               | Account + Affiliate modules          | Employment module (for util)                 |

### Similarities

- Same module architecture pattern
- Same service layer structure (3 services)
- Same repository pattern implementation
- Same event-driven architecture
- Same year validation logic
- Same one-per-year enforcement
- Same privilege-based access control

## Shared Dependencies

### UserGuidResolverUtil (from Employment)

Practices module imports `MembershipEmploymentModule` to access `UserGuidResolverUtil`:

```typescript
// Shared utility for account GUID resolution
const userGuid = await this.userGuidResolver.resolveUserGuid(userId, 'account');
```

This demonstrates **cross-module utility sharing** in the membership subsystem.

## Related Documentation

- [Controllers README](../controllers/README.md) - API endpoints and routes
- [Services README](../services/README.md) - Service layer architecture
- [Repository README](../repositories/README.md) - Data access patterns
- [Events README](../events/README.md) - Event emission and audit trails
- [Validators README](../validators/README.md) - Validation rules and conditional logic
- [NestJS Modules Documentation](https://docs.nestjs.com/modules) - Official NestJS guide

---

**Last Updated**: November 27, 2025  
**Module Version**: 1.0.0  
**Status**: ✅ Fully Implemented

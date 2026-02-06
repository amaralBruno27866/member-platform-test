# Membership Employment - Module Layer

This directory contains the NestJS module configuration for the membership employment feature, encapsulating all dependencies, providers, controllers, and exports.

## Module File

### `membership-employment.module.ts`

- **Purpose**: NestJS module configuration for membership employment
- **Pattern**: Modular architecture with dependency injection
- **Integration**: Connects controllers, services, repositories, and external modules
- **Exports**: Provides services and repository for external module consumption

## Module Architecture

### Dependencies (Imports)

```typescript
imports: [
  DataverseModule,            // Core Dataverse integration
  MembershipCategoryModule,   // Membership year service
  MembershipSettingsModule,   // Year validation and active status check
]
```

#### DataverseModule
- Provides `DataverseService` for Dataverse API operations
- Used by repository layer for CRUD operations
- Handles authentication, request formatting, and error handling

#### MembershipCategoryModule
- Provides `MembershipCategoryMembershipYearService` for active year determination
- Required for automatic year assignment in employment creation workflow
- Uses vote-counting algorithm for resilient year selection

#### MembershipSettingsModule
- Provides `MembershipSettingsLookupService` for year validation
- Used by Business Rules Service to validate year exists and is ACTIVE
- Required dependency for create/update operations

### Providers (Internal Services)

```typescript
providers: [
  // Business Logic Services
  MembershipEmploymentBusinessRulesService,  // XOR and conditional validation
  MembershipEmploymentCrudService,           // Create, Update, Delete operations
  MembershipEmploymentLookupService,         // Read, Query operations
  
  // Repository Pattern
  {
    provide: MEMBERSHIP_EMPLOYMENT_REPOSITORY,
    useClass: DataverseMembershipEmploymentRepository,
  },
  
  // Supporting Services
  MembershipEmploymentEventsService,         // Event emission
  MembershipEmploymentMapper,                // Data transformation
]
```

### Controllers

```typescript
controllers: [
  MembershipEmploymentPrivateController,  // Private API endpoints only
]
```

**Note**: No public controller - all employment data requires authentication.

### Exports (External Consumption)

```typescript
exports: [
  // Repository Interface
  MEMBERSHIP_EMPLOYMENT_REPOSITORY,
  
  // Core Services
  MembershipEmploymentBusinessRulesService,
  MembershipEmploymentCrudService,
  MembershipEmploymentLookupService,
  
  // Event Service
  MembershipEmploymentEventsService,
  
  // Mapper
  MembershipEmploymentMapper,
]
```

## Dependency Graph

```
MembershipEmploymentModule
├── Imports
│   ├── DataverseModule
│   │   └── DataverseService
│   ├── MembershipCategoryModule
│   │   └── MembershipCategoryMembershipYearService
│   └── MembershipSettingsModule
│       └── MembershipSettingsLookupService
├── Providers
│   ├── MembershipEmploymentBusinessRulesService
│   ├── MembershipEmploymentCrudService
│   ├── MembershipEmploymentLookupService
│   ├── DataverseMembershipEmploymentRepository
│   ├── MembershipEmploymentEventsService
│   └── MembershipEmploymentMapper
└── Controllers
    └── MembershipEmploymentPrivateController
```

## Service Layer Integration

### Business Rules Service
- **Purpose**: XOR validation, conditional "_Other" fields, year validation
- **Dependencies**: 
  - MembershipSettingsLookupService (for year validation)
  - Repository (for uniqueness checks)
  - CrudService (delegates operations)
- **Methods**: 
  - `createWithValidation()` - Creates with full validation
  - `updateWithValidation()` - Updates with conditional field checks
  - `validateMembershipYear()` - Ensures year exists and is ACTIVE
  - `validateConditionalOtherFields()` - Validates 7 conditional fields
  - `ensureUserYearUniqueness()` - Prevents duplicate employment per year

### CRUD Service
- **Purpose**: Create, update, and delete operations
- **Dependencies**: 
  - Repository (via injection token)
  - EventsService (for event emission)
- **Methods**:
  - `create()` - Creates employment with privilege validation
  - `update()` - Updates existing employment with privilege check
  - `delete()` - Hard delete (Admin/Main only)

### Lookup Service
- **Purpose**: Query and read operations with filtering
- **Dependencies**: Repository (via injection token)
- **Methods**:
  - `findByEmploymentId()` - By internal GUID
  - `findById()` - By internal GUID (alias)
  - `findByUserAndYear()` - User-specific lookup
  - `list()` - Paginated list with filters
  - `getByYear()` - Year-based filtering
  - `getByAccount()` - Account-specific employments
  - `getByAffiliate()` - Affiliate-specific employments
  - `getByEmploymentStatus()` - Status-based filtering
  - `existsByUserAndYear()` - Uniqueness check
  - `count()` - Count with filters

## Repository Pattern

### Interface Injection

```typescript
{
  provide: MEMBERSHIP_EMPLOYMENT_REPOSITORY,
  useClass: DataverseMembershipEmploymentRepository,
}
```

This pattern enables:
- **Testability**: Easy mocking in unit tests
- **Flexibility**: Can swap implementations without changing consumers
- **Decoupling**: Services depend on interface, not concrete class

### Usage in Services

```typescript
constructor(
  @Inject(MEMBERSHIP_EMPLOYMENT_REPOSITORY)
  private readonly repository: DataverseMembershipEmploymentRepository,
) {}
```

## Controller Integration

### MembershipEmploymentPrivateController

**Dependencies Injected**:
```typescript
constructor(
  private readonly businessRulesService: MembershipEmploymentBusinessRulesService,
  private readonly crudService: MembershipEmploymentCrudService,
  private readonly lookupService: MembershipEmploymentLookupService,
  private readonly membershipYearService: MembershipCategoryMembershipYearService,
  @Inject(MEMBERSHIP_EMPLOYMENT_REPOSITORY)
  private readonly repository: DataverseMembershipEmploymentRepository,
) {}
```

**Note**: External service (`MembershipCategoryMembershipYearService`) is injected from `MembershipCategoryModule`.

## Event-Driven Architecture

### Event Emission Flow

1. **CRUD Operation**: Create/Update/Delete via CRUD service
2. **Event Emission**: `MembershipEmploymentEventsService.publishEmploymentCreated()` etc.
3. **Event Logging**: Structured logging with operation metadata
4. **External Handlers**: Other modules can subscribe to events (future enhancement)

### Available Events

- `MembershipEmploymentCreatedEvent` - On employment creation
- `MembershipEmploymentUpdatedEvent` - On employment update
- `MembershipEmploymentDeletedEvent` - On hard delete
- `MembershipEmploymentAccountAffiliateConflictEvent` - On XOR violation attempt
- `MembershipEmploymentUserYearDuplicateEvent` - On uniqueness violation attempt

## Business Rules Integration

### XOR Validation (Account OR Affiliate)

```typescript
// Enforced automatically via JWT userType in controller
const userType = this.getUserType(user); // 'account' or 'affiliate'

// BusinessRulesService validates no dual assignment
await this.businessRulesService.createWithValidation(dto, ...);
```

### Conditional "_Other" Fields

Business Rules Service validates 7 conditional field pairs:
1. `osot_employment_status` + `osot_employment_status_other`
2. `osot_role_descriptor` + `osot_role_descriptor_other`
3. `osot_practice_years` + `osot_practice_years_other`
4. `osot_work_hours` + `osot_work_hours_other`
5. `osot_hourly_earnings` + `osot_hourly_earnings_other`
6. `osot_funding` + `osot_funding_other`
7. `osot_benefits` + `osot_benefits_other`

### Year Validation

```typescript
// BusinessRulesService validates via MembershipSettingsLookupService
await this.validateMembershipYear(membershipYear);

// Checks:
// - Year exists in membership-settings
// - Year has ACTIVE status
// - Throws descriptive error if validation fails
```

## Related Documentation

- [Controllers README](../controllers/README.md) - API endpoints and routes
- [Services README](../services/README.md) - Service layer architecture
- [Repository README](../repositories/README.md) - Data access patterns
- [Events README](../events/README.md) - Event emission and audit trails
- [Validators README](../validators/README.md) - Validation rules and conditional logic
- [NestJS Modules Documentation](https://docs.nestjs.com/modules) - Official NestJS guide

---

**Last Updated**: November 26, 2025  
**Module Version**: 1.0.0  
**Status**: ✅ Fully Implemented

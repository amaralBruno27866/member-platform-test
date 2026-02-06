# Membership Preferences - Module Layer

This directory contains the NestJS module configuration for the membership preferences feature, encapsulating all dependencies, providers, controllers, and exports.

## Module File

### `membership-preference.module.ts`

- **Purpose**: NestJS module configuration for membership preferences
- **Pattern**: Modular architecture with dependency injection
- **Integration**: Connects controllers, services, repositories, and external modules
- **Exports**: Provides services and repository for external module consumption

## Module Architecture

### Dependencies (Imports)

```typescript
imports: [
  DataverseModule,           // Core Dataverse integration
  MembershipCategoryModule,  // Category lookup and membership year services
]
```

#### DataverseModule
- Provides `DataverseService` for Dataverse API operations
- Used by repository layer for CRUD operations
- Handles authentication, request formatting, and error handling

#### MembershipCategoryModule
- Provides `MembershipCategoryLookupService` for category lookup
- Provides `MembershipCategoryMembershipYearService` for active year determination
- Required for business rules validation and preference creation workflow

### Providers (Internal Services)

```typescript
providers: [
  // Business Logic Services
  MembershipPreferenceBusinessRulesService,  // Category-based validation
  MembershipPreferenceCrudService,           // Create, Update operations
  MembershipPreferenceLookupService,         // Read, Query operations
  
  // Repository Pattern
  {
    provide: MEMBERSHIP_PREFERENCE_REPOSITORY,
    useClass: DataverseMembershipPreferenceRepository,
  },
  
  // Supporting Services
  MembershipPreferenceEventsService,         // Event emission
  MembershipPreferenceMapper,                // Data transformation
]
```

### Controllers

```typescript
controllers: [
  MembershipPreferencePrivateController,  // Private API endpoints only
]
```

**Note**: No public controller - all preference data requires authentication.

### Exports (External Consumption)

```typescript
exports: [
  // Repository Interface
  MEMBERSHIP_PREFERENCE_REPOSITORY,
  
  // Core Services
  MembershipPreferenceBusinessRulesService,
  MembershipPreferenceCrudService,
  MembershipPreferenceLookupService,
  
  // Event Service
  MembershipPreferenceEventsService,
  
  // Mapper
  MembershipPreferenceMapper,
]
```

## Dependency Graph

```
MembershipPreferenceModule
├── Imports
│   ├── DataverseModule
│   │   └── DataverseService
│   └── MembershipCategoryModule
│       ├── MembershipCategoryLookupService
│       └── MembershipCategoryMembershipYearService
│           └── MembershipSettingsModule (transitively)
│               └── MembershipSettingsRepository
├── Providers
│   ├── MembershipPreferenceBusinessRulesService
│   ├── MembershipPreferenceCrudService
│   ├── MembershipPreferenceLookupService
│   ├── DataverseMembershipPreferenceRepository
│   ├── MembershipPreferenceEventsService
│   └── MembershipPreferenceMapper
└── Controllers
    └── MembershipPreferencePrivateController
```

## Service Layer Integration

### Business Rules Service
- **Purpose**: Category-based field availability validation
- **Dependencies**: None (standalone validation logic)
- **Methods**: 
  - `validateCreateDto()` - Validates creation requests
  - `validateUpdateDto()` - Validates update requests
  - `canHavePracticePromotion()` - Category eligibility check
  - `canHaveShadowing()` - OT-only enforcement
  - `canHavePsychotherapySupervision()` - Limited category check
  - `getAllowedSearchTools()` - 5-tier matrix validation

### CRUD Service
- **Purpose**: Create and update operations with business rules
- **Dependencies**: 
  - Repository (via injection token)
  - BusinessRulesService (for validation)
  - EventsService (for event emission)
- **Methods**:
  - `create()` - Creates preference with uniqueness check
  - `update()` - Updates existing preference with validation

### Lookup Service
- **Purpose**: Query and read operations with filtering
- **Dependencies**: Repository (via injection token)
- **Methods**:
  - `findByPreferenceId()` - By business ID
  - `findById()` - By internal GUID
  - `findByUserAndYear()` - User-specific lookup
  - `list()` - Paginated list with filters
  - `getByYear()` - Year-based filtering
  - `getByCategory()` - Category-based filtering

## Repository Pattern

### Interface Injection

```typescript
{
  provide: MEMBERSHIP_PREFERENCE_REPOSITORY,
  useClass: DataverseMembershipPreferenceRepository,
}
```

This pattern enables:
- **Testability**: Easy mocking in unit tests
- **Flexibility**: Can swap implementations without changing consumers
- **Decoupling**: Services depend on interface, not concrete class

### Usage in Services

```typescript
constructor(
  @Inject(MEMBERSHIP_PREFERENCE_REPOSITORY)
  private readonly repository: DataverseMembershipPreferenceRepository,
) {}
```

## Controller Integration

### MembershipPreferencePrivateController

**Dependencies Injected**:
```typescript
constructor(
  private readonly businessRulesService: MembershipPreferenceBusinessRulesService,
  private readonly crudService: MembershipPreferenceCrudService,
  private readonly lookupService: MembershipPreferenceLookupService,
  private readonly membershipCategoryLookupService: MembershipCategoryLookupService,
  private readonly membershipYearService: MembershipCategoryMembershipYearService,
) {}
```

**Note**: External services (`MembershipCategoryLookupService`, `MembershipCategoryMembershipYearService`) are injected from `MembershipCategoryModule`.

## Event-Driven Architecture

### Event Emission Flow

1. **CRUD Operation**: Create/Update via CRUD service
2. **Event Emission**: `MembershipPreferenceEventsService.emitCreated()` or `.emitUpdated()`
3. **Event Logging**: Structured logging with operation metadata
4. **External Handlers**: Other modules can subscribe to events (future enhancement)

### Available Events

- `MembershipPreferenceCreatedEvent` - On preference creation
- `MembershipPreferenceUpdatedEvent` - On preference update
- `MembershipPreferenceDeletedEvent` - On soft delete (future)
- `MembershipPreferenceAutoRenewalChangedEvent` - On auto-renewal toggle
- `MembershipPreferenceUserYearDuplicateEvent` - On uniqueness violation attempt

## Module Configuration in App

### Registration in Root Module

```typescript
// app.module.ts
import { MembershipPreferenceModule } from './classes/membership/membership-preferences';

@Module({
  imports: [
    // ... other modules
    MembershipPreferenceModule,
  ],
})
export class AppModule {}
```

### Route Registration

Routes are automatically registered via `MembershipPreferencePrivateController`:
- `POST /private/membership-preferences/me`
- `GET /private/membership-preferences/me`
- `PATCH /private/membership-preferences/me`
- `GET /private/membership-preferences`
- `GET /private/membership-preferences/:id`
- `PATCH /private/membership-preferences/:id`

## Testing Configuration

### Module Testing Setup

```typescript
// membership-preference.module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipPreferenceModule } from './membership-preference.module';

describe('MembershipPreferenceModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [MembershipPreferenceModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide MembershipPreferenceCrudService', () => {
    const service = module.get(MembershipPreferenceCrudService);
    expect(service).toBeDefined();
  });
});
```

### Controller Testing with Module

```typescript
// Integration test setup
const module = await Test.createTestingModule({
  imports: [MembershipPreferenceModule],
})
  .overrideProvider(MEMBERSHIP_PREFERENCE_REPOSITORY)
  .useValue(mockRepository)
  .compile();

const controller = module.get(MembershipPreferencePrivateController);
```

## Environment Configuration

### Required Environment Variables

None directly - inherits from:
- `DataverseModule`: Dataverse connection settings
- `MembershipCategoryModule`: Any category-specific config

### Optional Configuration

- Rate limiting settings (via guards)
- Logging levels (via NestJS logger)
- Cache settings (if implemented in repository)

## Performance Considerations

### Lazy Loading

Module uses standard NestJS dependency injection - services are instantiated on module initialization.

### Caching Strategy

- Repository can implement caching (not yet implemented)
- Lookup service can cache frequently accessed data
- Category lookup results can be cached (delegated to MembershipCategoryModule)

### Database Connection Pooling

Managed by `DataverseModule` - no special configuration needed.

## Security Considerations

### Authentication

- All routes require JWT authentication via `@UseGuards(AuthGuard('jwt'))`
- Module does not handle authentication directly
- Delegates to NestJS authentication module

### Authorization

- Privilege-based access control in controller
- Business rules service validates category-based permissions
- No role-based access control at module level

## Migration and Deployment

### Module Updates

When updating the module:
1. Update service interfaces
2. Update repository implementation
3. Update controller endpoints
4. Run tests
5. Update documentation
6. Deploy with backward compatibility

### Breaking Changes

If making breaking changes:
1. Version the API (e.g., `/v2/private/membership-preferences`)
2. Maintain old routes for deprecation period
3. Document migration path
4. Notify consuming modules

## Related Documentation

- [Controllers README](../controllers/README.md) - API endpoints and routes
- [Services README](../services/README.md) - Service layer architecture
- [Repository README](../repositories/README.md) - Data access patterns
- [NestJS Modules Documentation](https://docs.nestjs.com/modules) - Official NestJS guide

---

**Last Updated**: November 24, 2025  
**Module Version**: 1.0.0  
**Status**: ✅ Fully Implemented (0 TypeScript Errors)

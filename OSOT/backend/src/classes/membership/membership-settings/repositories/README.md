# Membership Settings - Repositories Layer

This directory contains the repository implementation for the membership settings module, providing a clean abstraction layer between the application and Dataverse API.

## Architecture Overview

The repositories layer follows a **clean repository pattern** with centralized data access operations:

1. **Interface Implementation** - Concrete implementation of MembershipSettingsRepository interface
2. **Dataverse Integration** - Direct integration with DataverseService for all operations
3. **Data Transformation** - Uses MembershipSettingsMapper for all data conversions
4. **Error Handling** - Structured error handling with proper logging and user messages

## Repository Files

### `membership-settings.repository.ts`

- **Purpose**: Complete data access implementation for membership settings
- **Usage**: All database operations and data persistence
- **Features**: CRUD operations, business queries, filtering, pagination
- **Type Safety**: Full enum integration and error handling

## Design Philosophy

### Simplicity First

- Clean repository implementation without over-engineering
- Essential data access operations only
- Clear separation between business logic and data access

### Address Module Pattern

- Follows exact same structure and patterns as Address repository
- Proven architecture for reliability and maintainability
- Consistent error handling and response patterns

### Type Safety

- Full enum integration with safe parsing
- Proper error handling for all operations
- Generic query patterns for extensibility

## Integration Points

### With DataverseService

```typescript
// All database operations via DataverseService
const response = await this.dataverseService.request(
  'POST',
  MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME,
  payload,
);
```

### With MembershipSettingsMapper

```typescript
// Data transformation in both directions
const internal = this.mapDataverseToInternal(dataverseResponse);
const payload = this.mapInternalToDataverse(internalData);
```

### With Constants Layer

```typescript
// OData queries using field constants
const oDataQuery = `$filter=${MEMBERSHIP_SETTINGS_ODATA.YEAR} eq ${year}`;
```

## Key Features

### CRUD Operations

- **`create()`** - Create new membership settings with validation
- **`findById()`** - Find by GUID (primary key)
- **`findBySettingsId()`** - Find by business ID (Settings ID)
- **`update()` / `updateById()`** - Update operations with field validation
- **`delete()` / `deleteById()`** - Soft delete (sets status to INACTIVE)

### Business Query Methods

- **`findByGroupAndYear()`** - Find by business uniqueness constraint
- **`findByYear()`** - All settings for specific membership year
- **`findByGroup()`** - All settings for specific group (Individual/Business)
- **`findByStatus()`** - Filter by membership year status
- **`findActive()`** - Only active membership settings
- **`findEndingInRange()`** - Find settings ending in date range

### Advanced Operations

- **`list()`** - Paginated list with filtering and sorting
- **`count()`** - Count records with optional filtering
- **`existsByGroupAndYear()`** - Uniqueness validation support

### Data Transformation

- **`mapFromDataverse()`** - Public method for Dataverse → Internal
- **`mapToDataverse()`** - Public method for Internal → Dataverse
- **Private helpers** for internal transformations

## Business Rules Integration

### Uniqueness Constraints

- Group-Year combination must be unique
- Business ID (Settings ID) must be unique
- Proper validation during create and update operations

### Soft Delete Pattern

- Delete operations set status to INACTIVE instead of physical deletion
- Maintains data integrity and audit trail
- Consistent with OSOT business requirements

### Data Integrity

- All enum fields validated during conversion
- Required fields validated before database operations
- Proper error handling for constraint violations

## Query Patterns

### Filtering Operations

```typescript
// Year-based filtering
await repository.findByYear('2025');

// Group-based filtering
await repository.findByGroup(MembershipGroup.INDIVIDUAL);

// Status-based filtering
await repository.findByStatus(AccountStatus.ACTIVE);

// Year ending range filtering
await repository.findEndingInRange('2025-01-01', '2025-12-31');
```

### Complex Queries

```typescript
// Paginated list with multiple filters
const result = await repository.list({
  membershipYear: '2025',
  membershipGroup: MembershipGroup.INDIVIDUAL,
  membershipYearStatus: AccountStatus.ACTIVE,
  searchTerm: 'osot-set',
  page: 1,
  pageSize: 20,
  sortBy: 'createdon',
  sortOrder: 'DESC',
});
```

### Existence Validation

```typescript
// Check uniqueness for business rules
const exists = await repository.existsByGroupAndYear(
  MembershipGroup.INDIVIDUAL,
  '2025',
  excludeSettingsId, // Optional: exclude from uniqueness check
);
```

## Error Handling

### Structured Error Messages

- Uses ErrorCodes and ErrorMessages from common modules
- Consistent error format across all operations
- Proper logging for debugging and monitoring

### Operation-Specific Handling

- **404 Errors**: Return null for not found scenarios
- **Validation Errors**: Clear messages about constraint violations
- **Dataverse Errors**: Wrapped with context-appropriate messages

### Example Error Handling

```typescript
try {
  const settings = await repository.findById(id);
  return settings;
} catch (error) {
  // Structured error with public message
  throw new Error(
    `${ErrorMessages[ErrorCodes.NOT_FOUND].publicMessage}: ${error.message}`,
  );
}
```

## Performance Considerations

### Query Optimization

- Uses OData queries for server-side filtering
- Pagination support to limit result sets
- Proper indexing considerations for common queries

### Data Transfer

- Minimal data transfer with selective field queries
- Efficient count operations without data retrieval
- Optimized sorting and filtering patterns

## Usage Examples

### Service Layer Integration

```typescript
@Injectable()
export class MembershipSettingsService {
  constructor(
    @Inject(MEMBERSHIP_SETTINGS_REPOSITORY)
    private readonly repository: MembershipSettingsRepository,
  ) {}

  async create(
    dto: CreateMembershipSettingsDto,
  ): Promise<MembershipSettingsInternal> {
    const internal = MembershipSettingsMapper.mapCreateDtoToInternal(dto);
    return this.repository.create(internal);
  }
}
```

### Direct Repository Usage

```typescript
// Find active settings for current year
const activeSettings = await repository.findByYear('2025');
const onlyActive = activeSettings.filter(
  (s) => s.osot_membership_year_status === AccountStatus.ACTIVE,
);

// Or use specific method
const activeSettings2 = await repository.findActive();
```

## Quality Standards

### Code Quality

- ESLint compliant code formatting
- Comprehensive TypeScript type coverage
- Clear documentation for all repository methods

### Business Alignment

- All queries use CSV field names exactly
- Business rules reflected in repository operations
- No deviation from source documentation

### Maintainability

- Simple, focused repository implementation
- Clear separation of concerns
- Easy to extend and modify

## Next Steps

After completing the repository layer, the following layers will be implemented:

1. **Services Layer** - Business logic implementation using this repository
2. **Controller Layer** - HTTP API endpoints with repository integration
3. **Events Layer** - Domain events triggered by repository operations
4. **Modules Layer** - Dependency injection setup for repository

Each layer will build upon this repository foundation to ensure consistent data access patterns throughout the application.

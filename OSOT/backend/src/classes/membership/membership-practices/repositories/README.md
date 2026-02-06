# Membership Practices Repository

This directory contains the repository implementation for the membership practices entity, providing data access abstraction over Microsoft Dataverse.

## Files Overview

### 1. `membership-practices.repository.ts`

Repository implementation using DataverseService.

**Total Methods**: 14 public methods

## Repository Pattern

The repository provides a clean abstraction between the application and Dataverse API:

- **Services** call repository methods (high-level business operations)
- **Repository** calls DataverseService (low-level HTTP operations)
- **Dataverse API** stores/retrieves data

## CRUD Operations

### Create

**Method**: `create(practiceData)`

- Maps Internal → Dataverse payload
- POST to Dataverse
- Preserves optional Account lookup GUID
- Returns created Internal representation

### Read

**Methods**:

- `findById(id)`: Find by GUID (primary key)
- `findByPracticeId(practiceId)`: Find by business ID (osot-pra-0000001)
- `findByYear(year)`: Find all practices for a membership year
- `findByAccountId(accountId)`: Find all practices for an account (optional lookup)
- `findByUserAndYear(userId, year)`: Find user's practice for specific year (uniqueness check)
- `findAll(options)`: List with pagination (skip, top, orderBy)

### Update

**Methods**:

- `update(practiceId, updateData)`: Update by business ID
- `updateById(id, updateData)`: Update by GUID

**Important**: `membership_year` is excluded from PATCH payloads (immutable)

### Delete

**Methods**:

- `delete(practiceId)`: Hard delete by business ID
- `deleteById(id)`: Hard delete by GUID

**Note**: No soft delete - records are permanently removed

## Query Operations

### Uniqueness Validation

**Method**: `existsByUserAndYear(userId, year)`

- Checks if user already has practice for year
- Returns boolean
- Business rule: one record per user per year

### Multi-Select Filters

**Method**: `findByClientsAge(clientsAge)`

- Searches multi-select field using `contains()` operator
- Example: Find all practices serving "Adult" clients

### Counting

**Method**: `count()`

- Returns total practice records count
- Uses OData `$count=true`

## Data Transformations

### Mapper Integration

All methods use `MembershipPracticesMapper` for transformations:

- `mapDataverseToInternal()`: Dataverse → Internal
- `mapInternalToDataverse()`: Internal → Dataverse

### OData Operations

**Select Fields**: Uses `MEMBERSHIP_PRACTICES_ODATA.SELECT_FIELDS` for all queries

**Filters**: Builds OData $filter strings

```typescript
// Year filter
$filter=osot_membership_year eq '2026'

// Account filter (lookup)
$filter=_osot_table_account_value eq {guid}

// Multi-select filter
$filter=contains(osot_clients_age, '1')
```

**Ordering**: Default `createdon desc`

**Pagination**: `$skip` and `$top` parameters

## Error Handling

All methods use try-catch with consistent error messages:

```typescript
throw new Error(
  `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${error.message}`,
);
```

**404 Handling**: `findById()` returns `null` instead of throwing

## Business Rules Enforced

1. **One record per user per year**: `existsByUserAndYear()` validates uniqueness
2. **Membership year immutable**: Excluded from update payloads
3. **Optional Account lookup**: No required lookups (unlike employment's XOR)
4. **Hard delete only**: No soft delete support

## App Credentials

Uses `getAppForOperation()` helper for operation-specific credentials:

- `create`: main app
- `read`: main app
- `write`: main app
- `delete`: main app

## Best Practices

1. **Always use business ID for user-facing operations**: `findByPracticeId()`, `update()`, `delete()`
2. **Use GUID for internal operations**: `findById()`, `updateById()`, `deleteById()`
3. **Validate uniqueness before create**: Call `existsByUserAndYear()` first
4. **Handle optional lookups**: Check if `osot_table_account` exists before querying
5. **Use pagination for lists**: Always provide `skip` and `top` options

## Related Files

- **Interface**: `../interfaces/membership-practices-repository.interface.ts`
- **Mapper**: `../mappers/membership-practices.mapper.ts`
- **Constants**: `../constants/membership-practices.constants.ts`
- **Dataverse Integration**: `../../../../integrations/dataverse.service.ts`

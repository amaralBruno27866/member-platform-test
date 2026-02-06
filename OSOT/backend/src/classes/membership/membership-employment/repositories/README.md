# Membership Employment Repositories

## Overview

The **Membership Employment Repository** provides data access layer for employment records, abstracting Dataverse API operations with clean, type-safe methods.

## Key Features

### 🔄 Complete CRUD Operations
- **Create**: Insert new employment records with OData bind lookups
- **Read**: Query by ID, user, year, employment status
- **Update**: Partial updates by business ID or GUID
- **Delete**: Hard delete by business ID or GUID

### 🎯 Business-Specific Queries
- **findByUserAndYear**: Get employment for user in specific year (one-per-year enforcement)
- **existsByUserAndYear**: Validate uniqueness before creation
- **findByEmploymentStatus**: Filter by employment status enum
- **findByYear**: All employment records for membership year

### 📊 Advanced Filtering
- Pagination support (skip, top, orderBy)
- Multiple lookup field queries (account, affiliate)
- Count aggregation
- Year-based filtering

### 🔗 Integration Points
- Uses `DataverseService` for all API operations
- Uses `MembershipEmploymentMapper` for data transformation
- Implements `MembershipEmploymentRepository` interface
- Structured error handling with ErrorCodes/ErrorMessages

## Available Methods

### Core CRUD (6 methods)

#### create(employmentData)
```typescript
async create(
  employmentData: Partial<MembershipEmploymentInternal>
): Promise<MembershipEmploymentInternal>
```
Creates new employment record with OData bind conversion.

#### findByEmploymentId(employmentId)
```typescript
async findByEmploymentId(
  employmentId: string
): Promise<MembershipEmploymentInternal | null>
```
Finds by business ID (osot-emp-NNNNNNN).

#### findById(id)
```typescript
async findById(
  id: string
): Promise<MembershipEmploymentInternal | null>
```
Finds by GUID (osot_table_membership_employmentid).

#### update(employmentId, updateData)
```typescript
async update(
  employmentId: string,
  updateData: Partial<MembershipEmploymentInternal>
): Promise<MembershipEmploymentInternal>
```
Updates by business ID.

#### updateById(id, updateData)
```typescript
async updateById(
  id: string,
  updateData: Partial<MembershipEmploymentInternal>
): Promise<MembershipEmploymentInternal>
```
Updates by GUID.

#### delete(employmentId)
```typescript
async delete(employmentId: string): Promise<void>
```
Hard deletes by business ID.

#### deleteById(id)
```typescript
async deleteById(id: string): Promise<void>
```
Hard deletes by GUID.

### Query Methods (7 methods)

#### findByYear(year)
```typescript
async findByYear(year: string): Promise<MembershipEmploymentInternal[]>
```
All employment records for membership year.

#### findByAccountId(accountId)
```typescript
async findByAccountId(accountId: string): Promise<MembershipEmploymentInternal[]>
```
All employment records for account (GUID).

#### findByAffiliateId(affiliateId)
```typescript
async findByAffiliateId(affiliateId: string): Promise<MembershipEmploymentInternal[]>
```
All employment records for affiliate (GUID).

#### findByUserAndYear(userId, year, userType)
```typescript
async findByUserAndYear(
  userId: string,
  year: string,
  userType: 'account' | 'affiliate'
): Promise<MembershipEmploymentInternal | null>
```
**Business Rule Enforcement**: One employment per user per year.
- Converts business ID to GUID internally
- Returns single record or null

#### existsByUserAndYear(userId, year, userType)
```typescript
async existsByUserAndYear(
  userId: string,
  year: string,
  userType: 'account' | 'affiliate'
): Promise<boolean>
```
Validates uniqueness constraint before creation.

#### findByEmploymentStatus(status)
```typescript
async findByEmploymentStatus(status: number): Promise<MembershipEmploymentInternal[]>
```
Filter by employment status enum value.

#### findAll(options)
```typescript
async findAll(options?: {
  skip?: number;
  top?: number;
  orderBy?: string;
}): Promise<MembershipEmploymentInternal[]>
```
Paginated list with custom ordering.

#### count()
```typescript
async count(): Promise<number>
```
Total employment records count.

## Usage Examples

### Creating Employment Record

```typescript
import { DataverseMembershipEmploymentRepository } from './repositories';
import { Privilege, AccessModifier } from '../../../../common/enums';

const repository = new DataverseMembershipEmploymentRepository(dataverseService);

const employmentData: Partial<MembershipEmploymentInternal> = {
  osot_membership_year: '2025',
  osot_table_account: 'account-guid-123',
  osot_employment_status: EmploymentStatus.FULL_TIME,
  osot_work_hours: [WorkHours.THIRTY_TO_FORTY],
  osot_role_descriptor: RoleDescription.CLINICAL,
  osot_practice_years: PracticeYears.SIX_TO_TEN,
  osot_position_funding: [Funding.PUBLIC],
  osot_employment_benefits: [Benefits.HEALTH_INSURANCE],
  osot_earnings_employment: HourlyEarnings.FIFTY_TO_SEVENTY_FIVE,
  osot_earnings_self_direct: HourlyEarnings.LESS_THAN_FIFTY,
  osot_earnings_self_indirect: HourlyEarnings.LESS_THAN_FIFTY,
  osot_union_name: 'OPSEU',
  osot_privilege: Privilege.USER,
  osot_access_modifiers: AccessModifier.PRIVATE,
};

const created = await repository.create(employmentData);
// Returns full record with Dataverse-generated fields
```

### Finding Employment by User and Year

```typescript
// Check if employment already exists (validation)
const exists = await repository.existsByUserAndYear(
  'osot-acc-0001234',
  '2025',
  'account'
);

if (!exists) {
  // Find existing employment
  const employment = await repository.findByUserAndYear(
    'osot-acc-0001234',
    '2025',
    'account'
  );
  
  if (employment) {
    console.log(`Found employment: ${employment.osot_employment_id}`);
  }
}
```

### Updating Employment Record

```typescript
// Update by business ID
const updated = await repository.update('osot-emp-0000001', {
  osot_employment_status: EmploymentStatus.PART_TIME,
  osot_work_hours: [WorkHours.LESS_THAN_TWENTY],
  osot_union_name: 'CUPE',
});

// Or update by GUID
const updatedById = await repository.updateById('guid-123-456', {
  osot_employment_status: EmploymentStatus.SELF_EMPLOYED,
});
```

### Querying Employment Records

```typescript
// Get all employment for 2025
const employments2025 = await repository.findByYear('2025');

// Get all full-time employees
const fullTime = await repository.findByEmploymentStatus(
  EmploymentStatus.FULL_TIME
);

// Paginated list
const page1 = await repository.findAll({
  skip: 0,
  top: 20,
  orderBy: 'createdon desc',
});

// Total count
const total = await repository.count();
```

### Deleting Employment Record

```typescript
// Delete by business ID
await repository.delete('osot-emp-0000001');

// Or delete by GUID
await repository.deleteById('guid-123-456');
```

## Business Rules Enforced

### One Employment Per User Per Year
The `findByUserAndYear()` and `existsByUserAndYear()` methods enforce the business rule that each user can only have one employment record per membership year.

```typescript
// Service layer validation
const exists = await repository.existsByUserAndYear(userId, year, userType);
if (exists) {
  throw new ConflictException(
    `Employment record already exists for ${userType} ${userId} in year ${year}`
  );
}
```

### Account XOR Affiliate
Employment records must have either an account OR affiliate reference, never both:
- Validated at DTO level
- Enforced at repository query level
- Lookup fields preserved during create operations

### Membership Year Immutability
Membership year cannot be changed after creation:
- Not included in update payloads
- Validated by `MembershipYearImmutableValidator`

## Error Handling

All repository methods use structured error handling:

```typescript
try {
  const employment = await repository.findById(id);
} catch (error) {
  // Error format: "Generic error message: detailed error"
  // Uses ErrorCodes.GENERIC and ErrorMessages
  throw new Error(`${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${error.message}`);
}
```

### Common Error Scenarios
- **404 Not Found**: Returns `null` instead of throwing (for find operations)
- **400 Bad Request**: Invalid OData query or payload
- **401 Unauthorized**: Missing or invalid credentials
- **409 Conflict**: Uniqueness constraint violation

## Data Transformation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer Request                       │
│         (MembershipEmploymentInternal with lookups)              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Repository.create()                          │
│  1. mapInternalToDataverse() - Convert to Dataverse format      │
│  2. Convert lookups to OData binds                              │
│  3. Convert multi-select arrays to comma-separated strings      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DataverseService.request()                    │
│         POST /osot_table_membership_employments                  │
│  Payload: OData binds + comma-separated multi-selects           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Dataverse Response                          │
│  - Auto-generated GUID (osot_table_membership_employmentid)     │
│  - Auto-generated Business ID (osot_employment_id)              │
│  - Timestamps (createdon, modifiedon)                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Repository.create()                          │
│  1. mapDataverseToInternal() - Convert to Internal format       │
│  2. Parse enums from numbers                                    │
│  3. Convert comma-separated strings to arrays                   │
│  4. Preserve lookup GUIDs from original request                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer Response                      │
│         (MembershipEmploymentInternal with all fields)           │
└─────────────────────────────────────────────────────────────────┘
```

## OData Query Patterns

### Filter by Business ID
```typescript
$filter=osot_employment_id eq 'osot-emp-0000001'
```

### Filter by User and Year (GUID-based)
```typescript
// Account
$filter=_osot_table_account_value eq {accountGuid} and osot_membership_year eq '2025'

// Affiliate
$filter=_osot_table_account_affiliate_value eq {affiliateGuid} and osot_membership_year eq '2025'
```

### Filter by Employment Status
```typescript
$filter=osot_employment_status eq 1
```

### Pagination with Ordering
```typescript
$skip=0&$top=20&$orderby=createdon desc
```

### Count with Filter
```typescript
$filter=osot_membership_year eq '2025'&$count=true&$top=1
```

## Dependency Injection

```typescript
import { MEMBERSHIP_EMPLOYMENT_REPOSITORY } from './repositories';

@Module({
  providers: [
    {
      provide: MEMBERSHIP_EMPLOYMENT_REPOSITORY,
      useClass: DataverseMembershipEmploymentRepository,
    },
  ],
  exports: [MEMBERSHIP_EMPLOYMENT_REPOSITORY],
})
export class MembershipEmploymentModule {}
```

## Testing Recommendations

### Unit Tests
- ✅ Mock DataverseService for all methods
- ✅ Test OData query construction
- ✅ Test error handling scenarios (404, 400, 401)
- ✅ Test data transformation (mappers)
- ✅ Test pagination options

### Integration Tests
- ✅ Test full CRUD cycle with real Dataverse
- ✅ Test uniqueness constraint (existsByUserAndYear)
- ✅ Test multi-select field conversion
- ✅ Test lookup GUID preservation
- ✅ Test business ID to GUID conversion

## Performance Considerations

- **Batch Operations**: Currently not supported (one-by-one CRUD)
- **Caching**: No caching layer (direct Dataverse queries)
- **Query Optimization**: Uses $select to limit returned fields
- **Pagination**: Default 50 items per page (configurable)

## Future Enhancements

- [ ] Add batch create/update operations
- [ ] Add caching layer for frequently-accessed records
- [ ] Add soft delete support (if required)
- [ ] Add advanced filtering (multiple criteria)
- [ ] Add full-text search capabilities
- [ ] Add transaction support for multi-step operations
- AccountRepository.search(query): Promise<AccountEntity[]>

Guidelines

- Keep repository methods small and focused.
- Translate exceptions into domain-friendly errors where appropriate.

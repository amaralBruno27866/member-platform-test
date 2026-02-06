# Membership Preferences Repository

## Overview

The `DataverseMembershipPreferenceRepository` provides a clean abstraction layer between the application and Microsoft Dataverse for managing membership preference records. It implements the `MembershipPreferenceRepository` interface and follows the established repository pattern used across the OSOT application.

## Architecture

```
Service Layer
     ↓
Repository Interface (Contract)
     ↓
Repository Implementation (This file)
     ↓
DataverseService (HTTP/OData)
     ↓
Microsoft Dataverse
```

## Key Features

- ✅ **Complete CRUD Operations** - Create, Read, Update, Delete
- ✅ **User-Year Uniqueness Validation** - Enforces one preference per user per year
- ✅ **Flexible Querying** - By year, category, account, affiliate
- ✅ **Pagination Support** - Efficient list operations with filtering
- ✅ **XOR Account/Affiliate** - Handles both account and affiliate lookups
- ✅ **Hard Delete** - Unlike settings, preferences use hard delete (no status field)
- ✅ **Structured Error Handling** - ErrorCodes/ErrorMessages pattern
- ✅ **Mapper Integration** - Automatic data transformation

## Critical Business Rules

### 1. User-Year Uniqueness

**Rule**: One preference record per user (account OR affiliate) per membership year.

```typescript
// Before creating a new preference
const exists = await repository.existsByUserAndYear(
  accountId,
  '2025',
  false, // false = account, true = affiliate
);
if (exists) {
  throw new Error('User already has preference for this year');
}
```

### 2. XOR Account/Affiliate

**Rule**: Preference must have EITHER `tableAccount` OR `tableAccountAffiliate`, never both or neither.

```typescript
// Valid: Account preference
{ tableAccount: 'abc-123', tableAccountAffiliate: null }

// Valid: Affiliate preference
{ tableAccount: null, tableAccountAffiliate: 'def-456' }

// Invalid: Both (enforced at service layer)
{ tableAccount: 'abc-123', tableAccountAffiliate: 'def-456' }

// Invalid: Neither (enforced at service layer)
{ tableAccount: null, tableAccountAffiliate: null }
```

### 3. Lookup Required

**Rule**: At least one lookup field must be populated (category, account, or affiliate).

## Methods Overview

### CRUD Operations

#### `create(preferenceData)`
Creates a new membership preference record.

```typescript
const newPreference = await repository.create({
  membershipYear: '2025',
  tableMembershipCategory: 'category-guid',
  tableAccount: 'account-guid',
  autoRenewal: true,
  thirdParties: ThirdParties.OPT_IN,
  practicePromotion: PracticePromotion.OPT_IN,
  membersSearchTools: MembersSearchTools.OPT_IN,
  shadowing: false,
  psychotherapySupervision: PsychotherapySupervision.OPT_OUT,
  privilege: Privilege.ALLOW,
  accessModifier: AccessModifier.PUBLIC,
});
```

**Returns**: Created preference with system-generated fields (ID, timestamps)

**Throws**: Error if creation fails or validation errors occur

---

#### `findById(id)`
Retrieves a preference by its GUID.

```typescript
const preference = await repository.findById('preference-guid');
if (!preference) {
  console.log('Preference not found');
}
```

**Returns**: `MembershipPreferenceInternal | null`

**Note**: Returns `null` for 404 errors (not found)

---

#### `update(id, updateData)`
Updates an existing preference.

```typescript
const updated = await repository.update('preference-guid', {
  autoRenewal: false,
  thirdParties: ThirdParties.OPT_OUT,
  practicePromotion: PracticePromotion.OPT_OUT,
});
```

**Returns**: Updated preference

**Throws**: Error if preference not found or update fails

---

#### `delete(id)`
Permanently deletes a preference (hard delete).

```typescript
const deleted = await repository.delete('preference-guid');
console.log(deleted ? 'Deleted' : 'Not found');
```

**Returns**: `boolean` - `true` if deleted, `false` if not found

**Note**: Unlike membership-settings which uses soft delete (status update), preferences use hard DELETE

---

### Query Operations

#### `findByYear(year)`
Finds all preferences for a specific membership year.

```typescript
const preferences2025 = await repository.findByYear('2025');
// Returns: MembershipPreferenceInternal[]
```

**Use Case**: Annual preference reports, year-end processing

---

#### `findByCategory(categoryId)`
Finds all preferences for a specific membership category.

```typescript
const fullMemberPrefs = await repository.findByCategory('category-guid');
// Returns: MembershipPreferenceInternal[]
```

**Use Case**: Category-based analysis, membership segmentation

---

#### `findByAccount(accountId)`
Finds all preferences for a specific account.

```typescript
const accountPrefs = await repository.findByAccount('account-guid');
// Returns: MembershipPreferenceInternal[]
```

**Use Case**: User preference history, account management

---

#### `findByAffiliate(affiliateId)`
Finds all preferences for a specific affiliate.

```typescript
const affiliatePrefs = await repository.findByAffiliate('affiliate-guid');
// Returns: MembershipPreferenceInternal[]
```

**Use Case**: Affiliate preference tracking, organizational reporting

---

#### `findByUserAndYear(userId, year, isAffiliate)`
Finds the specific preference for a user in a given year.

```typescript
// Account preference
const accountPref = await repository.findByUserAndYear(
  'account-guid',
  '2025',
  false, // false = account
);

// Affiliate preference
const affiliatePref = await repository.findByUserAndYear(
  'affiliate-guid',
  '2025',
  true, // true = affiliate
);
```

**Returns**: `MembershipPreferenceInternal | null`

**Critical**: Used for uniqueness validation before create/update

---

#### `findAll(options)`
Paginated list with extensive filtering options.

```typescript
const result = await repository.findAll({
  membershipYear: '2025',
  membershipCategoryId: 'category-guid',
  autoRenewal: true,
  thirdParties: ThirdParties.OPT_IN,
  privilege: Privilege.ALLOW,
  accessModifier: AccessModifier.PUBLIC,
  searchTerm: 'PREF-2025',
  sortBy: 'osot_created_on',
  sortOrder: 'DESC',
  page: 1,
  pageSize: 50,
  createdFrom: '2025-01-01',
  createdTo: '2025-12-31',
});

console.log(result.data); // MembershipPreferenceInternal[]
console.log(result.total); // Total count
console.log(result.totalPages); // Total pages
```

**Returns**: Paginated result object

```typescript
{
  data: MembershipPreferenceInternal[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

**Supported Filters**:
- `membershipYear`: Membership year (string)
- `membershipCategoryId`: Category GUID
- `accountId`: Account GUID
- `affiliateId`: Affiliate GUID
- `autoRenewal`: Boolean
- `thirdParties`: ThirdParties enum (0-2)
- `practicePromotion`: PracticePromotion enum (0-2)
- `searchTools`: MembersSearchTools enum (0-2)
- `shadowing`: Boolean
- `psychotherapySupervision`: PsychotherapySupervision enum (0-2)
- `privilege`: Privilege enum (ALLOW/DENY)
- `accessModifier`: AccessModifier enum (PUBLIC/PRIVATE)
- `searchTerm`: Searches in preference ID
- `sortBy`: Field to sort by (default: `osot_created_on`)
- `sortOrder`: `ASC` | `DESC` (default: `DESC`)
- `page`: Page number (default: 1)
- `pageSize`: Records per page (default: 50)
- `createdFrom`: Creation date range start
- `createdTo`: Creation date range end

---

#### `count(filters)`
Counts preferences matching filters.

```typescript
const totalCount = await repository.count();

const filteredCount = await repository.count({
  membershipYear: '2025',
  autoRenewal: true,
});
```

**Returns**: `number` - Total count of matching records

**Use Case**: Pagination metadata, analytics dashboards

---

### Validation Operations

#### `existsByUserAndYear(userId, year, isAffiliate, excludePreferenceId?)`
Checks if user-year combination exists.

```typescript
// Check if account already has preference for 2025
const exists = await repository.existsByUserAndYear(
  'account-guid',
  '2025',
  false, // false = account
);

// Check during update (exclude current preference)
const isDuplicate = await repository.existsByUserAndYear(
  'account-guid',
  '2025',
  false,
  'current-preference-guid', // Exclude this GUID
);
```

**Returns**: `boolean` - `true` if combination exists

**Critical**: Used to enforce user-year uniqueness rule

---

#### `existsById(id)`
Simple existence check by GUID.

```typescript
const exists = await repository.existsById('preference-guid');
```

**Returns**: `boolean`

**Use Case**: Quick validation before operations

---

#### `validateUniqueUserYear(userId, year, isAffiliate, excludePreferenceId?)`
Validates that user-year combination is unique.

```typescript
// Before create
const isValid = await repository.validateUniqueUserYear(
  'account-guid',
  '2025',
  false,
);
if (!isValid) {
  throw new Error('Duplicate preference detected');
}

// Before update (exclude current)
const isValidUpdate = await repository.validateUniqueUserYear(
  'account-guid',
  '2025',
  false,
  'current-preference-guid',
);
```

**Returns**: `boolean` - `true` if combination is unique (valid)

**Note**: This is a semantic wrapper around `existsByUserAndYear` with inverted logic for clarity

---

## OData Query Patterns

### Basic Query
```typescript
// Single record by ID
GET osot_table_membership_preferences(guid)?$select=osot_membership_preferences_id,osot_membership_year,...
```

### Filtered Query
```typescript
// All preferences for 2025
GET osot_table_membership_preferences?$filter=osot_membership_year eq '2025'&$orderby=osot_created_on desc&$select=...
```

### Paginated Query
```typescript
// Page 2, 50 records per page
GET osot_table_membership_preferences?$skip=50&$top=50&$count=true&$orderby=osot_created_on desc
```

### Complex Filter
```typescript
// Auto-renewal enabled for specific category in 2025
GET osot_table_membership_preferences?$filter=osot_membership_year eq '2025' and osot_table_membership_category eq {guid} and osot_auto_renewal eq true
```

### Count Query
```typescript
// Total count with filters
GET osot_table_membership_preferences?$filter=osot_membership_year eq '2025'&$count=true&$top=0
```

## Error Handling

All methods use try-catch blocks with structured error handling:

```typescript
try {
  // Operation
} catch (error) {
  throw new Error(
    `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
      error instanceof Error ? error.message : 'Unknown error'
    }`,
  );
}
```

### Error Types

1. **Not Found (404)**: Returns `null` instead of throwing
2. **Validation Errors**: Throws with ErrorCodes/ErrorMessages
3. **Network/Dataverse Errors**: Propagates with context

## Usage Examples

### Example 1: Create New Preference with Validation

```typescript
@Injectable()
export class MembershipPreferenceService {
  constructor(
    @Inject(MEMBERSHIP_PREFERENCE_REPOSITORY)
    private readonly repository: MembershipPreferenceRepository,
  ) {}

  async createPreference(
    accountId: string,
    createDto: CreateMembershipPreferenceDto,
  ): Promise<MembershipPreferenceResponseDto> {
    // 1. Validate uniqueness
    const isUnique = await this.repository.validateUniqueUserYear(
      accountId,
      createDto.membershipYear,
      false, // account
    );

    if (!isUnique) {
      throw new Error('User already has preference for this year');
    }

    // 2. Create preference
    const internal: Partial<MembershipPreferenceInternal> = {
      membershipYear: createDto.membershipYear,
      tableAccount: accountId,
      tableMembershipCategory: createDto.membershipCategoryId,
      autoRenewal: createDto.autoRenewal,
      // ... other fields
    };

    const created = await this.repository.create(internal);

    // 3. Map to response
    return this.mapToResponseDto(created);
  }
}
```

### Example 2: Update with Uniqueness Check

```typescript
async updatePreference(
  preferenceId: string,
  updateDto: UpdateMembershipPreferenceDto,
): Promise<MembershipPreferenceResponseDto> {
  // 1. Get existing preference
  const existing = await this.repository.findById(preferenceId);
  if (!existing) {
    throw new Error('Preference not found');
  }

  // 2. If changing year, validate uniqueness
  if (updateDto.membershipYear && updateDto.membershipYear !== existing.membershipYear) {
    const userId = existing.tableAccount || existing.tableAccountAffiliate;
    const isAffiliate = !existing.tableAccount;

    const isUnique = await this.repository.validateUniqueUserYear(
      userId,
      updateDto.membershipYear,
      isAffiliate,
      preferenceId, // Exclude current preference
    );

    if (!isUnique) {
      throw new Error('User already has preference for this year');
    }
  }

  // 3. Update
  const updated = await this.repository.update(preferenceId, {
    membershipYear: updateDto.membershipYear,
    autoRenewal: updateDto.autoRenewal,
    // ... other fields
  });

  return this.mapToResponseDto(updated);
}
```

### Example 3: List with Filtering

```typescript
async listPreferences(
  query: ListMembershipPreferencesQueryDto,
): Promise<{
  data: MembershipPreferenceResponseDto[];
  pagination: PaginationMetadata;
}> {
  const result = await this.repository.findAll({
    membershipYear: query.membershipYear,
    membershipCategoryId: query.categoryId,
    autoRenewal: query.autoRenewal,
    page: query.page || 1,
    pageSize: query.pageSize || 50,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return {
    data: result.data.map(this.mapToResponseDto),
    pagination: {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    },
  };
}
```

### Example 4: User Preference Lookup

```typescript
async getUserPreferenceForYear(
  userId: string,
  year: string,
  isAffiliate: boolean = false,
): Promise<MembershipPreferenceResponseDto | null> {
  const preference = await this.repository.findByUserAndYear(
    userId,
    year,
    isAffiliate,
  );

  return preference ? this.mapToResponseDto(preference) : null;
}
```

## Key Differences from Membership Settings Repository

| Feature | Membership Settings | Membership Preferences |
|---------|-------------------|----------------------|
| **Delete Strategy** | Soft delete (status = INACTIVE) | Hard delete (DELETE) |
| **Status Field** | Has `status` field | No `status` field |
| **Uniqueness** | Category + Year | User (Account/Affiliate) + Year |
| **XOR Validation** | None | Account XOR Affiliate |
| **User Lookup** | N/A | `findByUserAndYear` with `isAffiliate` flag |
| **Required Lookups** | Category only | Category OR Account OR Affiliate |

## Mapper Integration

The repository uses `MembershipPreferenceMapper` for all data transformations:

```typescript
// Create/Update: Internal → Dataverse
private mapInternalToDataverse(
  internal: Partial<MembershipPreferenceInternal>,
  isUpdate = false,
): Partial<MembershipPreferenceDataverse> {
  return MembershipPreferenceMapper.mapInternalToDataverse(
    internal as MembershipPreferenceInternal,
    isUpdate,
  );
}

// Read: Dataverse → Internal
private mapDataverseToInternal(
  dataverse: MembershipPreferenceDataverse,
): MembershipPreferenceInternal {
  return MembershipPreferenceMapper.mapDataverseToInternal(dataverse);
}
```

**Why separate methods?**
- Consistency with established pattern
- Easier to add repository-specific transformation logic
- Clear separation of concerns

## Best Practices

1. **Always validate uniqueness** before creating preferences
2. **Use `isAffiliate` flag** correctly for account vs affiliate lookups
3. **Include `excludePreferenceId`** when validating during updates
4. **Handle null returns** from `findById` and `findByUserAndYear`
5. **Use pagination** for large result sets (`findAll`)
6. **Apply filters** to reduce data transfer
7. **Log errors** with structured ErrorCodes/ErrorMessages
8. **Remember hard delete** - no recovery after deletion

## Related Files

- **Interface**: `interfaces/membership-preference-repository.interface.ts`
- **Mapper**: `mappers/membership-preference.mapper.ts`
- **Constants**: `constants/membership-preference.constants.ts`
- **DTOs**: `dtos/*.dto.ts`
- **Dataverse Service**: `integrations/dataverse.service.ts`

## Testing Considerations

When testing this repository:

1. **Mock DataverseService** - Avoid real API calls
2. **Test uniqueness validation** - Critical business rule
3. **Test XOR scenarios** - Account vs Affiliate lookups
4. **Test pagination** - Edge cases (empty, single page, multiple pages)
5. **Test error handling** - Network failures, 404s, validation errors
6. **Test hard delete** - Verify record removal
7. **Test filter combinations** - Ensure OData query construction is correct

---

**Last Updated**: 2025-01-XX  
**Repository Size**: ~656 lines  
**Methods**: 14 (CRUD: 4, Queries: 6, Validations: 3, List: 1)
- AccountRepository.search(query): Promise<AccountEntity[]>

Guidelines

- Keep repository methods small and focused.
- Translate exceptions into domain-friendly errors where appropriate.

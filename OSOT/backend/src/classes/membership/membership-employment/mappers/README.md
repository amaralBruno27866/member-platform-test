# Membership Employment Mappers

## Overview

The **Membership Employment Mapper** provides comprehensive data transformation capabilities for employment records between different representations:
- **DTOs** (API layer) ↔ **Internal interfaces** (business logic)
- **Dataverse responses** ↔ **Internal interfaces**
- **Multi-select arrays** ↔ **Comma-separated strings** (Dataverse format)
- **Lookup GUIDs** ↔ **OData bind strings**

## Key Features

### 🔄 Bi-directional Transformations
- **CreateDto → Internal**: Maps user input to internal representation with system field enrichment
- **UpdateDto → Internal**: Partial updates with only provided fields
- **Internal → ResponseDto**: Returns user-relevant fields (15 total)
- **Dataverse → Internal**: Handles Dataverse responses with enum parsing and multi-select conversion
- **Internal → Dataverse**: Generates Dataverse payloads with OData binds and comma-separated multi-selects

### 🎯 Type-Safe Enum Conversions
Handles **9 enums** (7 local + 2 global):
- **Local**: Benefits, EmploymentStatus, Funding, HourlyEarnings, PracticeYears, RoleDescription, WorkHours
- **Global**: Privilege, AccessModifier

### 📊 Multi-Select Field Support
Converts between array and comma-separated string formats:
- **WorkHours**: `[1, 2, 3]` ↔ `"1,2,3"`
- **Funding**: `[1, 2, 3]` ↔ `"1,2,3"`
- **Benefits**: `[1, 2, 3]` ↔ `"1,2,3"`

### 🔗 OData Bind Handling
Converts lookup GUIDs to/from OData bind format:
- **Account**: `guid` ↔ `/osot_table_accounts(guid)`
- **Affiliate**: `guid` ↔ `/osot_table_account_affiliates(guid)`

### ✅ Validation & Sanitization
- **validateEmploymentData**: Validates required fields and business rules
- **sanitizeEmploymentData**: Removes sensitive data for logging

## Usage Examples

### 1. Creating Employment (Controller → Service)

```typescript
import { MembershipEmploymentMapper, EnrichedCreateMembershipEmploymentDto } from './mappers';
import { Privilege, AccessModifier } from '../../../../common/enums';

// Controller enriches DTO with system fields
const enrichedDto: EnrichedCreateMembershipEmploymentDto = {
  ...createDto, // User input
  osot_membership_year: 2025, // From membership-settings
  'osot_Table_Account@odata.bind': '/osot_table_accounts(abc-123)',
  osot_privilege: Privilege.USER,
  osot_access_modifiers: AccessModifier.PRIVATE,
};

// Map to internal representation
const internal = MembershipEmploymentMapper.mapCreateDtoToInternal(enrichedDto);

// Result:
// {
//   osot_membership_year: 2025,
//   osot_table_account: 'abc-123', // Extracted from OData bind
//   osot_employment_status: 1,
//   osot_work_hours: [1, 2], // Array format
//   osot_role_descriptor: 1,
//   osot_practice_years: 2,
//   osot_position_funding: [1, 3], // Array format
//   osot_employment_benefits: [2], // Array format
//   osot_earnings_employment: 3,
//   osot_earnings_self_direct: 1,
//   osot_earnings_self_indirect: 1,
//   osot_union_name: 'OPSEU',
//   osot_privilege: 0,
//   osot_access_modifiers: 1
// }
```

### 2. Updating Employment (API → Service)

```typescript
import { MembershipEmploymentMapper } from './mappers';

const updateDto = {
  osot_employment_status: EmploymentStatus.FULL_TIME,
  osot_work_hours: [WorkHours.THIRTY_TO_FORTY, WorkHours.MORE_THAN_FORTY],
  osot_union_name: 'CUPE',
};

// Map to partial internal (only provided fields)
const partial = MembershipEmploymentMapper.mapUpdateDtoToInternal(updateDto);

// Result (only updated fields):
// {
//   osot_employment_status: 1,
//   osot_work_hours: [2, 3],
//   osot_union_name: 'CUPE'
// }
```

### 3. Returning Employment Data (Service → API)

```typescript
import { MembershipEmploymentMapper } from './mappers';

const internal: MembershipEmploymentInternal = {
  osot_employment_identifier: 'osot-emp-0000001',
  osot_membership_year: 2025,
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
  osot_another_employment: false,
  // ... system fields
};

// Map to response DTO (only user-relevant fields)
const response = MembershipEmploymentMapper.mapInternalToResponseDto(internal);

// Result (15 fields):
// {
//   osot_membership_year: 2025,
//   osot_employment_status: 1,
//   osot_work_hours: [2],
//   osot_role_descriptor: 1,
//   osot_practice_years: 2,
//   osot_position_funding: [1],
//   osot_employment_benefits: [1],
//   osot_earnings_employment: 2,
//   osot_earnings_self_direct: 1,
//   osot_earnings_self_indirect: 1,
//   osot_union_name: 'OPSEU',
//   osot_another_employment: false
// }
```

### 4. Receiving from Dataverse (Repository → Service)

```typescript
import { MembershipEmploymentMapper } from './mappers';

// Dataverse response with comma-separated multi-selects
const dataverseResponse = {
  osot_table_membership_employmentid: 'guid-123',
  osot_employment_identifier: 'osot-emp-0000001',
  osot_membership_year: 2025,
  osot_table_account: 'account-guid-456',
  osot_employment_status: 1,
  osot_work_hours: '1,2,3', // Comma-separated string
  osot_role_descriptor: 1,
  osot_practice_years: 2,
  osot_position_funding: '1,3', // Comma-separated string
  osot_employment_benefits: '2,4', // Comma-separated string
  osot_earnings_employment: 3,
  osot_earnings_self_direct: 1,
  osot_earnings_self_indirect: 1,
  osot_union_name: 'OPSEU',
  osot_privilege: 0,
  osot_access_modifier: 1,
  createdon: '2025-01-01T00:00:00Z',
  modifiedon: '2025-01-15T12:30:00Z',
};

// Map to internal with array conversion
const internal = MembershipEmploymentMapper.mapDataverseToInternal(dataverseResponse);

// Result (multi-selects converted to arrays):
// {
//   osot_table_membership_employmentid: 'guid-123',
//   osot_employment_identifier: 'osot-emp-0000001',
//   osot_membership_year: 2025,
//   osot_table_account: 'account-guid-456',
//   osot_employment_status: 1,
//   osot_work_hours: [1, 2, 3], // Array
//   osot_role_descriptor: 1,
//   osot_practice_years: 2,
//   osot_position_funding: [1, 3], // Array
//   osot_employment_benefits: [2, 4], // Array
//   osot_earnings_employment: 3,
//   osot_earnings_self_direct: 1,
//   osot_earnings_self_indirect: 1,
//   osot_union_name: 'OPSEU',
//   osot_privilege: 0,
//   osot_access_modifiers: 1,
//   createdon: '2025-01-01T00:00:00Z',
//   modifiedon: '2025-01-15T12:30:00Z'
// }
```

### 5. Sending to Dataverse (Service → Repository)

```typescript
import { MembershipEmploymentMapper } from './mappers';

const internal: MembershipEmploymentInternal = {
  osot_membership_year: 2025,
  osot_table_account: 'account-guid-456',
  osot_employment_status: EmploymentStatus.FULL_TIME,
  osot_work_hours: [WorkHours.LESS_THAN_TWENTY, WorkHours.TWENTY_TO_THIRTY],
  osot_role_descriptor: RoleDescription.CLINICAL,
  osot_practice_years: PracticeYears.SIX_TO_TEN,
  osot_position_funding: [Funding.PUBLIC, Funding.PRIVATE],
  osot_employment_benefits: [Benefits.HEALTH_INSURANCE, Benefits.PENSION],
  osot_earnings_employment: HourlyEarnings.FIFTY_TO_SEVENTY_FIVE,
  osot_earnings_self_direct: HourlyEarnings.LESS_THAN_FIFTY,
  osot_earnings_self_indirect: HourlyEarnings.LESS_THAN_FIFTY,
  osot_union_name: 'OPSEU',
  osot_privilege: Privilege.USER,
  osot_access_modifiers: AccessModifier.PRIVATE,
};

// Map to Dataverse payload (CREATE)
const payload = MembershipEmploymentMapper.mapInternalToDataverse(internal, false);

// Result:
// {
//   osot_membership_year: 2025,
//   'osot_Table_Account@odata.bind': '/osot_table_accounts(account-guid-456)',
//   osot_employment_status: 1,
//   osot_work_hours: '1,2', // Comma-separated string
//   osot_role_descriptor: 1,
//   osot_practice_years: 2,
//   osot_position_funding: '1,2', // Comma-separated string
//   osot_employment_benefits: '1,4', // Comma-separated string
//   osot_earnings_employment: 2,
//   osot_earnings_self_direct: 1,
//   osot_earnings_self_indirect: 1,
//   osot_union_name: 'OPSEU',
//   osot_privilege: 0,
//   osot_access_modifiers: 1
// }

// Map to Dataverse payload (UPDATE)
const updatePayload = MembershipEmploymentMapper.mapInternalToDataverse(internal, true);
// Same as above but includes osot_employment_identifier for identification
```

### 6. Validation

```typescript
import { MembershipEmploymentMapper } from './mappers';

const incomplete = {
  osot_membership_year: 2025,
  osot_table_account: 'account-guid',
  // Missing required fields
};

const errors = MembershipEmploymentMapper.validateEmploymentData(incomplete);

// Result:
// [
//   'Employment status is required',
//   'Work hours are required',
//   'Role descriptor is required',
//   'Practice years are required',
//   'Position funding is required',
//   'Employment benefits are required',
//   'Earnings from employment is required',
//   'Earnings from self-employment (direct) is required',
//   'Earnings from self-employment (indirect) is required',
//   'Union name is required'
// ]
```

### 7. Sanitization (for Logging)

```typescript
import { MembershipEmploymentMapper } from './mappers';

const employment: MembershipEmploymentInternal = {
  osot_employment_identifier: 'osot-emp-0000001',
  osot_membership_year: 2025,
  osot_table_account: 'account-guid-456', // Sensitive
  osot_employment_status: EmploymentStatus.FULL_TIME,
  osot_work_hours: [WorkHours.THIRTY_TO_FORTY],
  osot_role_descriptor: RoleDescription.CLINICAL,
  osot_practice_years: PracticeYears.SIX_TO_TEN,
  osot_position_funding: [Funding.PUBLIC],
  osot_employment_benefits: [Benefits.HEALTH_INSURANCE],
  osot_earnings_employment: HourlyEarnings.FIFTY_TO_SEVENTY_FIVE, // Sensitive
  osot_earnings_self_direct: HourlyEarnings.LESS_THAN_FIFTY, // Sensitive
  osot_earnings_self_indirect: HourlyEarnings.LESS_THAN_FIFTY, // Sensitive
  osot_union_name: 'OPSEU',
  osot_role_descriptor_other: 'Custom role', // Potentially PII
  // ... system fields
};

// Sanitize for logging
const sanitized = MembershipEmploymentMapper.sanitizeEmploymentData(employment);

// Result (sensitive fields removed):
// {
//   osot_employment_identifier: 'osot-emp-0000001',
//   osot_membership_year: 2025,
//   osot_employment_status: 1,
//   osot_work_hours: [2],
//   osot_role_descriptor: 1,
//   osot_practice_years: 2,
//   osot_position_funding: [1],
//   osot_employment_benefits: [1],
//   osot_union_name: 'OPSEU',
//   osot_another_employment: false,
//   createdon: '2025-01-01T00:00:00Z',
//   modifiedon: '2025-01-15T12:30:00Z'
// }
// Excluded: earnings data, lookup GUIDs, conditional "_Other" fields
```

## Field Mapping Reference

### User-Facing Fields (ResponseDto)
15 fields returned to API consumers:
1. `osot_membership_year` - System-defined from membership-settings
2. `osot_employment_status` - Single choice enum
3. `osot_work_hours` - Multi-select array
4. `osot_role_descriptor` - Single choice enum
5. `osot_practice_years` - Single choice enum
6. `osot_position_funding` - Multi-select array
7. `osot_employment_benefits` - Multi-select array
8. `osot_earnings_employment` - Single choice enum
9. `osot_earnings_self_direct` - Single choice enum
10. `osot_earnings_self_indirect` - Single choice enum
11. `osot_union_name` - String
12. `osot_role_descriptor_other` - Optional string (when RoleDescription.OTHER)
13. `osot_position_funding_other` - Optional string (when Funding.OTHER in array)
14. `osot_employment_benefits_other` - Optional string (when Benefits.OTHER in array)
15. `osot_another_employment` - Optional boolean

### System Fields (Internal Only)
Not exposed to API consumers:
- `osot_table_membership_employmentid` - Primary key GUID
- `osot_employment_identifier` - Business ID (osot-emp-NNNNNNN)
- `osot_table_account` - Account lookup GUID
- `osot_table_account_affiliate` - Affiliate lookup GUID
- `osot_privilege` - System permissions
- `osot_access_modifiers` - Access control
- `createdon` - Creation timestamp
- `modifiedon` - Last update timestamp

### Lookup Field Transformations

| Internal Field | Dataverse Bind Format | Table Name |
|----------------|----------------------|------------|
| `osot_table_account` | `osot_Table_Account@odata.bind` | `osot_table_accounts` |
| `osot_table_account_affiliate` | `osot_Table_Account_Affiliate@odata.bind` | `osot_table_account_affiliates` |

### Multi-Select Field Transformations

| Internal Field (Array) | Dataverse Field (String) | Enum Type |
|------------------------|-------------------------|-----------|
| `osot_work_hours` | `osot_work_hours` | `WorkHours[]` |
| `osot_position_funding` | `osot_position_funding` | `Funding[]` |
| `osot_employment_benefits` | `osot_employment_benefits` | `Benefits[]` |

Example: `[1, 2, 3]` ↔ `"1,2,3"`

## Business Rules Enforced

### Required Fields Validation
- `osot_membership_year` - Must be integer
- User reference - Account XOR Affiliate (exactly one required)
- `osot_employment_status` - Required single choice
- `osot_work_hours` - Required non-empty array
- `osot_role_descriptor` - Required single choice
- `osot_practice_years` - Required single choice
- `osot_position_funding` - Required non-empty array
- `osot_employment_benefits` - Required non-empty array
- `osot_earnings_employment` - Required single choice
- `osot_earnings_self_direct` - Required single choice
- `osot_earnings_self_indirect` - Required single choice
- `osot_union_name` - Required string

### Conditional "_Other" Fields
- `osot_role_descriptor_other` - Required when `osot_role_descriptor === RoleDescription.OTHER`
- `osot_position_funding_other` - Required when `Funding.OTHER` in `osot_position_funding` array
- `osot_employment_benefits_other` - Required when `Benefits.OTHER` in `osot_employment_benefits` array

### XOR Rules
- Account vs Affiliate: Exactly one must be provided, never both

## Integration Points

### Controller Layer
```typescript
// Controller enriches CreateDto with system fields
const enriched: EnrichedCreateMembershipEmploymentDto = {
  ...createDto,
  osot_membership_year: membershipYear, // From membership-settings
  'osot_Table_Account@odata.bind': accountBind,
  osot_privilege: Privilege.USER,
  osot_access_modifiers: AccessModifier.PRIVATE,
};

const internal = MembershipEmploymentMapper.mapCreateDtoToInternal(enriched);
```

### Service Layer
```typescript
// Service validates and processes
const errors = MembershipEmploymentMapper.validateEmploymentData(internal);
if (errors.length > 0) {
  throw new BadRequestException(errors);
}

// Service calls repository
const created = await this.repository.create(internal);

// Service returns response
return MembershipEmploymentMapper.mapInternalToResponseDto(created);
```

### Repository Layer
```typescript
// Repository converts to Dataverse format
const payload = MembershipEmploymentMapper.mapInternalToDataverse(internal, false);

// Send to Dataverse
const response = await this.dataverseService.create(tableName, payload);

// Convert back to internal
return MembershipEmploymentMapper.mapDataverseToInternal(response);
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer (Controller)                   │
│  CreateDto / UpdateDto → EnrichedCreateDto → Internal            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Business Logic (Service)                     │
│  Internal ← Validation → Repository ← Dataverse Integration     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Access (Repository)                      │
│  Internal → Dataverse Payload → Dataverse API                   │
│  Dataverse Response → Internal                                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Response (Controller)                      │
│  Internal → ResponseDto → JSON API Response                      │
└─────────────────────────────────────────────────────────────────┘
```

## Key Differences from Membership Preferences

### 1. Multi-Select Fields
**Employment** has 3 multi-select fields requiring array ↔ string conversion:
- `osot_work_hours: WorkHours[]`
- `osot_position_funding: Funding[]`
- `osot_employment_benefits: Benefits[]`

**Preferences** has 4 multi-select fields with same pattern.

### 2. Membership Year Type
**Employment**: `osot_membership_year: number` (integer year)
**Preferences**: `osot_membership_year: string` (4-digit string)

### 3. Conditional Fields
**Employment**: 3 conditional "_Other" fields
**Preferences**: No conditional fields

### 4. Required vs Optional
**Employment**: All 10 main employment fields are required
**Preferences**: Most preference fields are optional (only auto_renewal required)

### 5. Enum Count
**Employment**: 9 enums total (7 local + 2 global)
**Preferences**: 6 enums total (4 local + 2 global)

## Testing Recommendations

### Unit Tests
- ✅ Test all enum parsing functions with valid/invalid values
- ✅ Test multi-select array ↔ string conversions
- ✅ Test OData bind extraction and generation
- ✅ Test DTO → Internal mappings (simple and enriched)
- ✅ Test Internal → ResponseDto field filtering
- ✅ Test Dataverse ↔ Internal bi-directional conversion
- ✅ Test validation with all required fields missing
- ✅ Test validation with conditional "_Other" rules
- ✅ Test sanitization removes sensitive data

### Integration Tests
- ✅ Test full create flow: CreateDto → Internal → Dataverse → Response
- ✅ Test full update flow: UpdateDto → Internal → Dataverse → Response
- ✅ Test XOR validation (Account vs Affiliate)
- ✅ Test multi-select field handling in real Dataverse scenarios

## Error Handling

All mapper methods handle:
- **Null/undefined** values gracefully
- **Invalid enum** values (return undefined or filter out)
- **Type mismatches** (string vs number conversion)
- **Malformed data** (validation errors returned as string arrays)

Validation errors are **non-throwing** - they return string arrays for service layer to handle.

## Performance Considerations

- **Lazy parsing**: Enum conversions only happen when fields are present
- **Array filtering**: Invalid values removed during parsing
- **No deep cloning**: Direct field assignments for efficiency
- **Conditional logic**: Only processes fields that exist in source data

## Future Enhancements

- [ ] Add support for bulk transformations (array of entities)
- [ ] Add caching for frequently-used enum conversions
- [ ] Add detailed error context (field path, expected vs actual)
- [ ] Add transformation metrics/logging
- [ ] Add schema version compatibility checking

Examples

- mapDbRowToAccount(row) -> AccountResponseDto
- mapCreateDtoToEntity(createDto) -> AccountEntity

Guidelines

- Keep mappers pure and side-effect free.
- Centralize complex transformations to keep services small.

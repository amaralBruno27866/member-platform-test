# Membership Practices Constants

## Purpose

This folder contains all constant values used across the membership-practices domain. These constants ensure consistency, maintainability, and provide a single source of truth for validation rules, field mappings, and business logic.

## File Structure

### `membership-practices.constants.ts`

Comprehensive constants file organized into logical sections:

#### 1. **Validation Rules**

- `MEMBERSHIP_YEAR_LENGTH`: Year format validation (4-digit YYYY pattern)
- `PRACTICE_ID_PATTERN`: Autonumber format validation (`osot-pra-0000001`)
- `TEXT_FIELD_LENGTH`: Text field character limits (0-255)

#### 2. **Enum Validation**

- `MEMBERSHIP_PRACTICES_ENUMS`: Valid values for all Choice fields
  - `VALID_CLIENTS_AGES`: ClientsAge[] (business required multi-select)
  - `VALID_PRACTICE_AREAS`: PracticeArea[] (optional multi-select)
  - `VALID_PRACTICE_SETTINGS`: PracticeSettings[] (optional multi-select)
  - `VALID_PRACTICE_SERVICES`: PracticeServices[] (optional multi-select)
  - `VALID_PRIVILEGES`: Privilege[] (from global enums)
  - `VALID_ACCESS_MODIFIERS`: AccessModifier[] (from global enums)

#### 3. **Dataverse Field Mappings**

- `MEMBERSHIP_PRACTICES_FIELDS`: Logical field names from CSV
  - System fields: `PRACTICE_ID`, `TABLE_ID`, `CREATED_ON`, `MODIFIED_ON`, `OWNER_ID`
  - Lookup fields: `TABLE_ACCOUNT`, `ACCOUNT_BIND`, `ACCOUNT_VALUE`
  - Business fields: All practice-related fields from CSV
  - Access control: `PRIVILEGE`, `ACCESS_MODIFIERS`

#### 4. **Table Information**

- `MEMBERSHIP_PRACTICES_TABLE`: Table naming conventions
  - `DISPLAY_NAME`: "Table_Membership_Practice" (singular)
  - `PLURAL_NAME`: "Table_Membership_Practices" (for routes)
  - `SCHEMA_NAME`: "osot_Table_Membership_Practice"
  - `LOGICAL_NAME`: "osot_table_membership_practices"

#### 5. **OData Configurations**

- `MEMBERSHIP_PRACTICES_ODATA`: Query configurations
  - `TABLE_NAME`: Logical table name for Dataverse
  - `BUSINESS_ID_FIELD`: Practice ID field
  - `PRIMARY_KEY_FIELD`: GUID field
  - `SELECT_FIELDS`: Complete field list for $select queries

#### 6. **Error Codes**

- `MEMBERSHIP_PRACTICES_ERROR_CODES`: Domain-specific error mappings
  - Validation errors: Invalid year, missing lookups, duplicate records
  - Business rule errors: Required fields, conditional validations
  - System errors: Dataverse errors, permission denied

#### 7. **Default Values**

- `MEMBERSHIP_PRACTICES_DEFAULTS`: CSV-based defaults
  - `PRIVILEGE`: Privilege.OWNER
  - `ACCESS_MODIFIERS`: AccessModifier.PRIVATE
  - `PRECEPTOR_DECLARATION`: false
  - ⚠️ Warning about membership year (system-defined, not calendar year)

#### 8. **Business Rules**

- `MEMBERSHIP_PRACTICES_BUSINESS_RULES`: Validation logic
  - Year validation: MIN_YEAR (2020), MAX_YEAR (current + 5)
  - Lookup validation: Optional account lookup
  - Conditional fields: "Other" field requirements
  - Required arrays: `CLIENTS_AGE` must have at least one value
  - **CRITICAL**: `membership_year` is system-defined from membership-settings
  - Uniqueness: One record per user per year

#### 9. **Route Configurations**

- `MEMBERSHIP_PRACTICES_ROUTES`: API endpoint paths
  - `BASE_PATH`: "membership-practices"
  - `PUBLIC_PATH`: "public/membership-practices"
  - `PRIVATE_PATH`: "private/membership-practices"
  - Endpoint patterns: BY_ID, BY_BUSINESS_ID, BY_YEAR, MY_PRACTICES

#### 10. **Permissions**

- `MEMBERSHIP_PRACTICES_PERMISSIONS`: Access control
  - `CAN_CREATE`: [MAIN, ADMIN, OWNER]
  - `CAN_READ`: [MAIN, ADMIN, OWNER]
  - `CAN_UPDATE`: [MAIN, ADMIN, OWNER]
  - `CAN_DELETE`: [MAIN, ADMIN]
  - Users can only access their own records (enforced in controllers)

#### 11. **Query Configurations**

- `MEMBERSHIP_PRACTICES_QUERY`: Pagination and filtering
  - Default page size: 25
  - Max page size: 100
  - Default sort: membership_year DESC
  - Searchable fields: practice_id, membership_year

## Key Features

### Multi-Select Field Handling

All 4 custom enums are multi-select arrays:

- `osot_clients_age`: ClientsAge[] (business required)
- `osot_practice_area`: PracticeArea[] (optional)
- `osot_practice_settings`: PracticeSettings[] (optional, has "\_Other" field)
- `osot_practice_services`: PracticeServices[] (optional, has "\_Other" field)

### Conditional "Other" Fields

When PracticeSettings.OTHER or PracticeServices.OTHER is selected:

- `osot_practice_settings_other` becomes required (255 chars max)
- `osot_practice_services_other` becomes required (255 chars max)

### System-Defined Membership Year

⚠️ **CRITICAL**: `membership_year` is NOT user-editable:

- System queries membership-settings to get active year
- User cannot manually set or edit this field
- CREATE blocked if user has no active membership-settings
- In November 2025, active year might be 2026 (not calendar year)

### Data Synchronization

All enum values synchronized with Dataverse global choices:

- `Choices_Populations` → ClientsAge
- `Choices_Practice_Area` → PracticeArea
- `Choices_Practice_Settings` → PracticeSettings
- `Choices_Practice_Services` → PracticeServices
- `Choices_Privilege` → Privilege (global)
- `Choices_Access_Modifiers` → AccessModifier (global)

## Usage Examples

### Validation

```typescript
import {
  MEMBERSHIP_YEAR_LENGTH,
  PRACTICE_ID_PATTERN,
  MEMBERSHIP_PRACTICES_ENUMS,
} from '../constants/membership-practices.constants';

// Validate membership year format
if (!MEMBERSHIP_YEAR_LENGTH.PATTERN.test(year)) {
  throw new Error('Invalid year format');
}

// Validate practice ID
if (!PRACTICE_ID_PATTERN.test(practiceId)) {
  throw new Error('Invalid practice ID format');
}

// Validate enum value
if (!MEMBERSHIP_PRACTICES_ENUMS.VALID_CLIENTS_AGES.includes(age)) {
  throw new Error('Invalid client age value');
}
```

### Field Mapping

```typescript
import { MEMBERSHIP_PRACTICES_FIELDS } from '../constants/membership-practices.constants';

const dataverseEntity = {
  [MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_ID]: 'osot-pra-0000001',
  [MEMBERSHIP_PRACTICES_FIELDS.MEMBERSHIP_YEAR]: '2026',
  [MEMBERSHIP_PRACTICES_FIELDS.CLIENTS_AGE]: '1,4,5', // Comma-separated
};
```

### OData Query

```typescript
import { MEMBERSHIP_PRACTICES_ODATA } from '../constants/membership-practices.constants';

const query = `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}?$select=${MEMBERSHIP_PRACTICES_ODATA.SELECT_FIELDS}`;
```

### Error Handling

```typescript
import { MEMBERSHIP_PRACTICES_ERROR_CODES } from '../constants/membership-practices.constants';

throw new CustomException(
  MEMBERSHIP_PRACTICES_ERROR_CODES.CLIENTS_AGE_REQUIRED,
  'Clients age is a required field',
);
```

### Business Rules

```typescript
import {
  MEMBERSHIP_PRACTICES_BUSINESS_RULES,
  MEMBERSHIP_PRACTICES_DEFAULTS,
} from '../constants/membership-practices.constants';

// Check uniqueness constraint
const fields = MEMBERSHIP_PRACTICES_BUSINESS_RULES.UNIQUE_CONSTRAINT_FIELDS;
// ['userGuid', 'membershipYear']

// Apply defaults
const newPractice = {
  ...data,
  privilege: MEMBERSHIP_PRACTICES_DEFAULTS.PRIVILEGE,
  access_modifiers: MEMBERSHIP_PRACTICES_DEFAULTS.ACCESS_MODIFIERS,
};
```

## Best Practices

1. **Always import constants** - Never use magic numbers or hardcoded strings
2. **Use typed constants** - Leverage TypeScript's type inference for safety
3. **Follow CSV specifications** - All mappings based on Table Membership Practices.csv
4. **Respect business rules** - Enforce validation rules from BUSINESS_RULES
5. **Handle multi-select arrays** - Remember all 4 custom enums are arrays
6. **Validate "Other" fields** - Check conditional requirements for settings/services
7. **Never set membership_year manually** - Always fetch from membership-settings service

## Related Files

- **Source**: `Table Membership Practices.csv` (field definitions)
- **Enums**: `../enums/*.enum.ts` (all choice field enums)
- **Interfaces**: `../interfaces/*.interface.ts` (type definitions)
- **Global Enums**: `common/enums` (Privilege, AccessModifier)
- **Error Codes**: `common/errors/error-codes` (centralized error enum)

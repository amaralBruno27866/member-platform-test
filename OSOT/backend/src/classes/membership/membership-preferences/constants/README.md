# Membership Preferences Constants

## Overview

This module contains all constant values, field mappings, and validation rules for the Membership Preferences entity based on `Table Membership Preferences.csv`.

## Key Features

### 1. Validation Rules
- **Membership Year**: 4-digit year format (YYYY)
- **Preference ID**: Pattern `osot-pref-0000001` (7-digit autonumber)
- **Business Rules**: User-year uniqueness, lookup validation

### 2. Enum Validations
All Choice fields from CSV are validated against their respective enums:
- `ThirdParties` - Third party service preferences
- `PracticePromotion` - Practice promotion preferences  
- `SearchTools` - Member search tool preferences
- `PsychotherapySupervision` - Supervision preferences
- `Privilege` - Access privilege level (global enum)
- `AccessModifier` - Access modifier level (global enum)

### 3. Field Mappings

#### System Fields
- `PREFERENCE_ID` - Business identifier (autonumber)
- `TABLE_ID` - Primary key GUID
- `CREATED_ON` - Creation timestamp
- `MODIFIED_ON` - Last modification timestamp
- `OWNER_ID` - Record owner

#### Lookup Fields (Relationships)
- `TABLE_MEMBERSHIP_CATEGORY` - Link to membership category
- `TABLE_ACCOUNT` - Link to account
- `TABLE_ACCOUNT_AFFILIATE` - Link to affiliate account

#### Business Fields
- `MEMBERSHIP_YEAR` - 4-character text field (Business required)
- `THIRD_PARTIES` - Choice field
- `PRACTICE_PROMOTION` - Choice field
- `MEMBERS_SEARCH_TOOLS` - Choice field
- `SHADOWING` - Boolean (default: No)
- `PSYCHOTHERAPY_SUPERVISION` - Choice field
- `AUTO_RENEWAL` - Boolean (Business required, default: No)

#### Access Control Fields
- `PRIVILEGE` - Choice field (default: Owner)
- `ACCESS_MODIFIERS` - Choice field (default: Private)

### 4. Default Values
```typescript
PRIVILEGE: Privilege.OWNER
ACCESS_MODIFIERS: AccessModifier.PRIVATE
SHADOWING: false
AUTO_RENEWAL: false
CURRENT_MEMBERSHIP_YEAR: current year as string
```

### 5. Business Rules
- **Year Range**: 2020 to current year + 5 years
- **Lookup Requirement**: At least one lookup field must be populated
- **Uniqueness**: One preference per user per year
- **Year Format**: Must be 4-digit year (YYYY)

### 6. OData Configuration
Complete field mappings for Dataverse queries including:
- All 17 fields from CSV
- Proper SELECT clause with GUID
- Lookup field bindings
- Sort/filter configurations

### 7. Permission Configuration
Role-based access control:
- **MAIN**: Full access (create, read, write, delete)
- **ADMIN**: Administrative access (read, write, delete)
- **OWNER**: User self-service (create, read, write own data)
- JWT authentication required on all private routes
- User context extraction from JWT payload

## Usage

```typescript
import {
  MEMBERSHIP_PREFERENCES_FIELDS,
  MEMBERSHIP_PREFERENCES_ODATA,
  MEMBERSHIP_PREFERENCES_DEFAULTS,
  MEMBERSHIP_PREFERENCES_BUSINESS_RULES,
  MEMBERSHIP_PREFERENCES_ERROR_CODES,
} from './constants';

// Use in validators
if (!MEMBERSHIP_YEAR_LENGTH.PATTERN.test(year)) {
  throw new Error(MEMBERSHIP_PREFERENCES_ERROR_CODES.INVALID_MEMBERSHIP_YEAR);
}

// Use in OData queries
const selectClause = MEMBERSHIP_PREFERENCES_ODATA.SELECT_FIELDS;
const tableName = MEMBERSHIP_PREFERENCES_ODATA.TABLE_NAME;
```

## Integration Points
- **Error Handling**: Uses `ErrorCodes` from common module
- **Global Enums**: `Privilege`, `AccessModifier` from common/enums
- **Local Enums**: Four preference-specific enums from module
- **Dataverse**: Direct mapping to Dataverse logical names from CSV

## Architecture Notes
- Follows same pattern as `membership-settings`
- Simpler than `membership-category` (no XOR validation)
- All constants are strongly typed and immutable (`as const`)
- Full JSDoc documentation for IntelliSense support

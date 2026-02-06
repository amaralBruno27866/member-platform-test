# Membership Employment Constants

## Overview

This module contains all constant values, field mappings, and validation rules for the Membership Employment entity based on `Table Membership Employment.csv`.

## Key Features

### 1. Validation Rules
- **Membership Year**: 4-digit year format (YYYY)
- **Employment ID**: Pattern `osot-emp-0000001` (7-digit autonumber)
- **Text Fields**: 255 characters max for "Other" fields and Union Name
- **Business Rules**: User-year uniqueness, lookup validation, conditional "Other" field requirements

### 2. Enum Validations
All Choice fields from CSV are validated against their respective enums:
- `EmploymentStatus` - Employment type classification
- `WorkHours` - Work hours per week (multiple choice)
- `RoleDescription` - Job role descriptor
- `PracticeYears` - Years of practice experience
- `Funding` - Position funding sources (multiple choice)
- `Benefits` - Employment benefits (multiple choice)
- `HourlyEarnings` - Hourly earnings ranges (used in 3 fields)
- `Privilege` - Access privilege level (global enum)
- `AccessModifier` - Access modifier level (global enum)

### 3. Field Mappings

#### System Fields
- `EMPLOYMENT_ID` - Business identifier (autonumber)
- `TABLE_ID` - Primary key GUID
- `CREATED_ON` - Creation timestamp
- `MODIFIED_ON` - Last modification timestamp
- `OWNER_ID` - Record owner

#### Lookup Fields (Relationships)
- `TABLE_ACCOUNT` - Link to account (mutually exclusive with affiliate)
- `TABLE_ACCOUNT_AFFILIATE` - Link to affiliate account (mutually exclusive with account)

#### Business Fields (Required)
- `MEMBERSHIP_YEAR` - 4-character text field (Business required)
- `EMPLOYMENT_STATUS` - Choice field (Business required)
- `WORK_HOURS` - Choice field, multiple selection (Business required)
- `ROLE_DESCRIPTOR` - Choice field (Business required)
- `PRACTICE_YEARS` - Choice field (Business required)
- `POSITION_FUNDING` - Choice field, multiple selection (Business required)
- `EMPLOYMENT_BENEFITS` - Choice field, multiple selection (Business required)
- `EARNINGS_EMPLOYMENT` - Choice field (Business required)
- `EARNINGS_SELF_DIRECT` - Choice field (Business required)
- `EARNINGS_SELF_INDIRECT` - Choice field (Business required)
- `UNION_NAME` - Text field, 255 chars (Business required)

#### Conditional Fields (Optional)
- `ROLE_DESCRIPTOR_OTHER` - Required when ROLE_DESCRIPTOR = OTHER
- `POSITION_FUNDING_OTHER` - Required when POSITION_FUNDING contains OTHER
- `EMPLOYMENT_BENEFITS_OTHER` - Required when EMPLOYMENT_BENEFITS contains OTHER
- `ANOTHER_EMPLOYMENT` - Boolean (default: No)

#### Access Control Fields
- `PRIVILEGE` - Choice field (default: Owner)
- `ACCESS_MODIFIERS` - Choice field (default: Private)

### 4. Default Values
```typescript
PRIVILEGE: Privilege.OWNER
ACCESS_MODIFIERS: AccessModifier.PRIVATE
ANOTHER_EMPLOYMENT: false
CURRENT_MEMBERSHIP_YEAR: current year as string
```

### 5. Business Rules
- **Year Range**: 2020 to current year + 5 years
- **Lookup Requirement**: At least one lookup field must be populated (account OR affiliate)
- **Exclusive User Reference**: Account and Affiliate are mutually exclusive (XOR)
- **Conditional "Other" Fields**: 
  - When `RoleDescription.OTHER` is selected, `ROLE_DESCRIPTOR_OTHER` is required
  - When `Funding.OTHER` is in array, `POSITION_FUNDING_OTHER` is required
  - When `Benefits.OTHER` is in array, `EMPLOYMENT_BENEFITS_OTHER` is required
- **Year Format**: Must be 4-digit year (YYYY)
- **Uniqueness**: One employment record per user per year (multiple years allowed)

#### **CRITICAL: Membership Year Management**
⚠️ **The `membership_year` field is SYSTEM-DEFINED, not user-provided:**

1. **Source**: System queries `membership-settings` entity to get active year for the user
2. **User Cannot Set**: Users cannot manually provide or edit `membership_year`
3. **Prerequisite**: User MUST have an active `membership-settings` record
4. **Creation Blocked**: If no active `membership-settings` exists, employment creation fails
5. **Immutable**: Once set, `membership_year` cannot be changed via UPDATE
6. **Uniqueness**: User can have ONE employment record per year, but multiple years total
   - ✅ Valid: User has employment for 2025, 2026, 2027
   - ❌ Invalid: User has two employment records for 2025

**Error Scenarios**:
- `MISSING_ACTIVE_MEMBERSHIP_SETTINGS` - No active settings found for user
- `DUPLICATE_EMPLOYMENT_FOR_YEAR` - User already has employment for that year
- `MEMBERSHIP_YEAR_NOT_USER_EDITABLE` - User attempted to set/edit membership_year

### 6. OData Configuration
Complete field mappings for Dataverse queries including:
- All 24 fields from CSV
- Proper SELECT clause with GUID
- Lookup field bindings (@odata.bind)
- Lookup value fields (_value)
- Sort/filter configurations

### 7. Permission Configuration
Role-based access control:
- **MAIN**: Full access (create, read, write, delete)
- **ADMIN**: Administrative access (read, write, delete)
- **OWNER**: User self-service (create, read, write own data)
- JWT authentication required on all private routes
- User context extraction from JWT payload
- Users can only access their own employment records

## Usage

```typescript
import {
  MEMBERSHIP_EMPLOYMENT_FIELDS,
  MEMBERSHIP_EMPLOYMENT_ODATA,
  MEMBERSHIP_EMPLOYMENT_DEFAULTS,
  MEMBERSHIP_EMPLOYMENT_BUSINESS_RULES,
  MEMBERSHIP_EMPLOYMENT_ERROR_CODES,
} from './constants';

// Use in validators
if (!MEMBERSHIP_YEAR_LENGTH.PATTERN.test(year)) {
  throw new Error(MEMBERSHIP_EMPLOYMENT_ERROR_CODES.INVALID_MEMBERSHIP_YEAR);
}

// Use in conditional validation
if (roleDescriptor === RoleDescription.OTHER && !roleDescriptorOther) {
  throw new Error(MEMBERSHIP_EMPLOYMENT_ERROR_CODES.INVALID_ROLE_DESCRIPTOR_OTHER);
}

// Check membership year management rules
if (!MEMBERSHIP_EMPLOYMENT_BUSINESS_RULES.REQUIRE_ACTIVE_MEMBERSHIP_SETTINGS) {
  throw new Error(MEMBERSHIP_EMPLOYMENT_ERROR_CODES.MISSING_ACTIVE_MEMBERSHIP_SETTINGS);
}

// Verify membership year is not user-editable
if (MEMBERSHIP_EMPLOYMENT_BUSINESS_RULES.MEMBERSHIP_YEAR_IS_USER_EDITABLE) {
  throw new Error(MEMBERSHIP_EMPLOYMENT_ERROR_CODES.MEMBERSHIP_YEAR_NOT_USER_EDITABLE);
}

// Use in OData queries
const selectClause = MEMBERSHIP_EMPLOYMENT_ODATA.SELECT_FIELDS;
const tableName = MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME;
```

## Integration Points
- **Error Handling**: Uses `ErrorCodes` from common module
- **Global Enums**: `Privilege`, `AccessModifier` from common/enums
- **Local Enums**: Seven employment-specific enums from module
- **Dataverse**: Direct mapping to Dataverse logical names from CSV
- **External Dependency**: `membership-settings` module for active year resolution

## Architecture Notes
- Follows same pattern as `membership-preferences`
- Supports multiple choice fields (WorkHours, Funding, Benefits)
- Conditional validation for "Other" fields
- XOR validation for Account vs Affiliate lookup
- All constants are strongly typed and immutable (`as const`)
- Full JSDoc documentation for IntelliSense support

## Special Considerations
- **Multiple Choice Fields**: WorkHours, Funding, and Benefits allow multiple selections
- **Conditional Requirements**: Three "_Other" fields become required based on enum selection
- **Multiple Earnings Fields**: Three separate earnings fields using the same HourlyEarnings enum
- **Survey Nature**: This entity serves primarily as employment survey data collection
- **System-Managed Year**: `membership_year` is automatically set from `membership-settings`, never user-provided
- **Module Dependency**: Requires `MembershipSettingsModule` for year resolution
- **Pre-Create Validation**: Must verify active membership-settings exists before allowing employment creation
- **Year-Based Uniqueness**: Enforced at business logic level (one record per user per year)

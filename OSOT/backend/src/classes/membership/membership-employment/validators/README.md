# Membership Employment Validators

This directory contains all custom validators for the membership employment entity, implementing business rules and conditional field validations.

## Files Overview

### 1. `membership-employment.validators.ts`
Main validator file containing all custom validation logic.

**Validators Implemented**: 19 total

## Validator Categories

### System Field Validators

#### 1. `EmploymentIdValidator`
**Purpose**: Validates business identifier format  
**Pattern**: `osot-emp-0000001` (7 digits)  
**Field**: `osot_employment_identifier`  
**Required**: Optional (auto-generated)

```typescript
@Validate(EmploymentIdValidator)
osot_employment_identifier?: string;
```

#### 2. `MembershipYearEmploymentValidator`
**Purpose**: Validates membership year range  
**Type**: Integer (2000-2100)  
**Field**: `osot_membership_year`  
**Required**: Yes (system-defined)  
**Note**: SYSTEM-DEFINED from membership-settings, not user-provided

```typescript
@Validate(MembershipYearEmploymentValidator)
osot_membership_year: number;
```

#### 3. `MembershipYearImmutableValidator`
**Purpose**: Prevents membership year changes after creation  
**Usage**: UPDATE operations only  
**Field**: `osot_membership_year`  
**Business Rule**: Immutable after creation

```typescript
// Used in service layer to prevent updates
@Validate(MembershipYearImmutableValidator)
```

### User Reference Validators

#### 4. `ExclusiveUserReferenceEmploymentValidator`
**Purpose**: Enforces Account XOR Affiliate (mutually exclusive)  
**Fields**: `osot_Table_Account@odata.bind`, `osot_Table_Account_Affiliate@odata.bind`  
**Business Rule**: User can be Account OR Affiliate, never both

```typescript
@Validate(ExclusiveUserReferenceEmploymentValidator)
'osot_Table_Account@odata.bind'?: string;
```

#### 5. `UserLookupRequiredValidator`
**Purpose**: Ensures at least one user reference exists  
**Fields**: Account or Affiliate  
**Business Rule**: One user reference required

```typescript
@Validate(UserLookupRequiredValidator)
'osot_Table_Account@odata.bind'?: string;
```

### Conditional "Other" Field Validators

These validators enforce business rules for conditional text fields that become required when specific enum values are selected.

#### 6. `RoleDescriptorOtherValidator`
**Purpose**: Validates conditional "other" field  
**Trigger**: When `osot_role_descriptor = RoleDescription.OTHER`  
**Required Field**: `osot_role_descriptor_other` (string, max 255 chars)

```typescript
@Validate(RoleDescriptorOtherValidator)
osot_role_descriptor_other?: string;
```

**Business Rule**:
- If `osot_role_descriptor === RoleDescription.OTHER` → `osot_role_descriptor_other` is REQUIRED
- If `osot_role_descriptor !== RoleDescription.OTHER` → `osot_role_descriptor_other` is optional/ignored

#### 7. `PositionFundingOtherValidator`
**Purpose**: Validates conditional "other" field for funding  
**Trigger**: When `osot_position_funding` array contains `Funding.OTHER`  
**Required Field**: `osot_position_funding_other` (string, max 255 chars)

```typescript
@Validate(PositionFundingOtherValidator)
osot_position_funding_other?: string;
```

**Business Rule**:
- If `osot_position_funding.includes(Funding.OTHER)` → `osot_position_funding_other` is REQUIRED
- Otherwise optional/ignored

#### 8. `EmploymentBenefitsOtherValidator`
**Purpose**: Validates conditional "other" field for benefits  
**Trigger**: When `osot_employment_benefits` array contains `Benefits.OTHER`  
**Required Field**: `osot_employment_benefits_other` (string, max 255 chars)

```typescript
@Validate(EmploymentBenefitsOtherValidator)
osot_employment_benefits_other?: string;
```

**Business Rule**:
- If `osot_employment_benefits.includes(Benefits.OTHER)` → `osot_employment_benefits_other` is REQUIRED
- Otherwise optional/ignored

### Multi-Select Field Validators

#### 9. `WorkHoursValidator`
**Purpose**: Validates work hours multi-select array  
**Field**: `osot_work_hours` (WorkHours[])  
**Validations**:
- Must be non-empty array
- No duplicate values
- All values from WorkHours enum

```typescript
@Validate(WorkHoursValidator)
osot_work_hours: WorkHours[];
```

#### 10. `PositionFundingValidator`
**Purpose**: Validates funding sources multi-select array  
**Field**: `osot_position_funding` (Funding[])  
**Validations**:
- Must be non-empty array
- No duplicate values
- All values from Funding enum

```typescript
@Validate(PositionFundingValidator)
osot_position_funding: Funding[];
```

#### 11. `EmploymentBenefitsValidator`
**Purpose**: Validates benefits multi-select array  
**Field**: `osot_employment_benefits` (Benefits[])  
**Validations**:
- Must be non-empty array
- No duplicate values
- All values from Benefits enum

```typescript
@Validate(EmploymentBenefitsValidator)
osot_employment_benefits: Benefits[];
```

### Single Choice Field Validators

#### 12. `EmploymentStatusValidator`
**Purpose**: Validates employment status enum  
**Field**: `osot_employment_status` (EmploymentStatus)  
**Required**: Yes

```typescript
@Validate(EmploymentStatusValidator)
osot_employment_status: EmploymentStatus;
```

#### 13. `RoleDescriptorValidator`
**Purpose**: Validates role descriptor enum  
**Field**: `osot_role_descriptor` (RoleDescription)  
**Required**: Yes

```typescript
@Validate(RoleDescriptorValidator)
osot_role_descriptor: RoleDescription;
```

#### 14. `PracticeYearsValidator`
**Purpose**: Validates practice years enum  
**Field**: `osot_practice_years` (PracticeYears)  
**Required**: Yes

```typescript
@Validate(PracticeYearsValidator)
osot_practice_years: PracticeYears;
```

#### 15. `HourlyEarningsValidator`
**Purpose**: Validates hourly earnings enum  
**Fields**: 
- `osot_earnings_employment`
- `osot_earnings_self_direct`
- `osot_earnings_self_indirect`  
**Required**: Yes (all 3 fields)

```typescript
@Validate(HourlyEarningsValidator)
osot_earnings_employment: HourlyEarnings;
```

### System Permission Validators

#### 16. `PrivilegeEmploymentValidator`
**Purpose**: Validates privilege level  
**Field**: `osot_privilege` (Privilege enum: OWNER, ADMIN, MAIN)  
**Required**: Optional (system-managed)

```typescript
@Validate(PrivilegeEmploymentValidator)
osot_privilege?: Privilege;
```

#### 17. `AccessModifiersEmploymentValidator`
**Purpose**: Validates access modifier  
**Field**: `osot_access_modifiers` (AccessModifier enum)  
**Required**: Optional (system-managed)

```typescript
@Validate(AccessModifiersEmploymentValidator)
osot_access_modifiers?: AccessModifier;
```

### Business Rule Validators

#### 18. `UserYearUniqueEmploymentValidator`
**Purpose**: Enforces one employment record per user per year  
**Type**: Async validator (requires database check)  
**Business Rule**: Uniqueness constraint on (user_id, membership_year)  
**Implementation**: Service layer with repository access

```typescript
@Validate(UserYearUniqueEmploymentValidator)
// Used in service layer during CREATE/UPDATE
```

## Usage Examples

### Example 1: Conditional "Other" Field Validation

```typescript
import { RoleDescriptorOtherValidator } from '../validators';

class CreateMembershipEmploymentDto {
  @IsEnum(RoleDescription)
  osot_role_descriptor: RoleDescription;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Validate(RoleDescriptorOtherValidator)
  osot_role_descriptor_other?: string;
}

// Valid cases:
{ osot_role_descriptor: RoleDescription.DIRECT_INDIRECT_CARE_PROVIDER } // OK
{ osot_role_descriptor: RoleDescription.OTHER, osot_role_descriptor_other: 'Clinical Supervisor' } // OK

// Invalid cases:
{ osot_role_descriptor: RoleDescription.OTHER } // FAIL - missing osot_role_descriptor_other
{ osot_role_descriptor: RoleDescription.OTHER, osot_role_descriptor_other: '' } // FAIL - empty string
```

### Example 2: Multi-Select Array Validation

```typescript
import { WorkHoursValidator } from '../validators';

class CreateMembershipEmploymentDto {
  @IsArray()
  @IsEnum(WorkHours, { each: true })
  @Validate(WorkHoursValidator)
  osot_work_hours: WorkHours[];
}

// Valid cases:
{ osot_work_hours: [WorkHours.EXACTLY_35] } // OK
{ osot_work_hours: [WorkHours.EXACTLY_35, WorkHours.MORE_THAN_37] } // OK

// Invalid cases:
{ osot_work_hours: [] } // FAIL - empty array
{ osot_work_hours: [WorkHours.EXACTLY_35, WorkHours.EXACTLY_35] } // FAIL - duplicates
{ osot_work_hours: [999] } // FAIL - invalid enum value
```

### Example 3: User Reference XOR Validation

```typescript
import { ExclusiveUserReferenceEmploymentValidator } from '../validators';

class MembershipEmploymentBasicDto {
  @IsOptional()
  @IsString()
  @Validate(ExclusiveUserReferenceEmploymentValidator)
  'osot_Table_Account@odata.bind'?: string;

  @IsOptional()
  @IsString()
  'osot_Table_Account_Affiliate@odata.bind'?: string;
}

// Valid cases:
{ 'osot_Table_Account@odata.bind': 'accounts(guid)' } // OK - only account
{ 'osot_Table_Account_Affiliate@odata.bind': 'affiliates(guid)' } // OK - only affiliate
{ } // OK - neither (will fail UserLookupRequired though)

// Invalid cases:
{ 
  'osot_Table_Account@odata.bind': 'accounts(guid)',
  'osot_Table_Account_Affiliate@odata.bind': 'affiliates(guid)'
} // FAIL - both specified (XOR violation)
```

## Validation Flow

### CREATE Operation
1. **DTO Validation** (class-validator):
   - All required fields present
   - Enum values valid
   - String lengths within limits
   - Multi-select arrays non-empty and no duplicates

2. **Custom Validators**:
   - Conditional "_Other" fields validated
   - User reference XOR validated
   - Multi-select field structure validated

3. **Service Layer**:
   - User has active membership-settings
   - No existing employment record for user+year (uniqueness)
   - Membership year resolved from membership-settings

### UPDATE Operation
1. **DTO Validation**:
   - Optional fields validated if present
   - Enum values valid
   - String lengths within limits

2. **Custom Validators**:
   - Conditional "_Other" fields validated
   - Membership year immutability enforced

3. **Service Layer**:
   - Entity exists
   - User authorized to update
   - Membership year not changed

## Integration Points

### Dependencies
```typescript
// From constants
import {
  MEMBERSHIP_EMPLOYMENT_FIELDS,
  EMPLOYMENT_ID_PATTERN,
  MEMBERSHIP_EMPLOYMENT_ENUMS,
  MEMBERSHIP_EMPLOYMENT_BUSINESS_RULES,
} from '../constants/membership-employment.constants';

// From enums
import { Benefits, EmploymentStatus, Funding, HourlyEarnings, 
         PracticeYears, RoleDescription, WorkHours } from '../enums';

// From global enums
import { Privilege, AccessModifier } from '../../../../common/enums';
```

### Constants Used
- `EMPLOYMENT_ID_PATTERN`: Regex for osot-emp-0000001 format
- `MEMBERSHIP_EMPLOYMENT_ENUMS`: All valid enum arrays
- `MEMBERSHIP_EMPLOYMENT_BUSINESS_RULES`: Min/max years, uniqueness rules

## Error Messages

All validators provide clear, actionable error messages:

```typescript
// Conditional field
"Role descriptor other is required when role descriptor is set to OTHER"

// Multi-select
"Work hours must be a non-empty array of valid options with no duplicates"

// User reference
"Cannot specify both Account and Affiliate - only one user reference is allowed"

// Immutability
"Membership year cannot be changed after creation - it is immutable"

// Uniqueness
"An employment record already exists for this user and year combination"
```

## Next Steps

1. **Apply validators to DTOs**: Add `@Validate()` decorators to DTO fields
2. **Service layer integration**: Implement async validators with repository access
3. **Error handling**: Map validation errors to user-friendly API responses
4. **Testing**: Create unit tests for all validators with edge cases

## Related Documentation
- **Constants**: See `constants/README.md` for all validation rules and patterns
- **DTOs**: See `dtos/README.md` for DTO field definitions
- **Enums**: See `enums/` for all enum definitions

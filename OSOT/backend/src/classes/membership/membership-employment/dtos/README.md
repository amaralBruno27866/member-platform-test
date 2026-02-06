# Membership Employment DTOs

This directory contains all Data Transfer Objects (DTOs) for the membership employment entity, providing validation and typing for API operations.

## Files Overview

### 1. `membership-employment-create.dto.ts`
**Purpose**: Validates POST requests for creating new employment records.

**Fields**: 14 user-provided fields
- Employment status (single choice)
- Work hours (multi-select array)
- Role descriptor + conditional "other" field
- Practice years (single choice)
- Position funding (multi-select array) + conditional "other" field
- Employment benefits (multi-select array) + conditional "other" field
- 3 Earnings fields (employment, self-direct, self-indirect)
- Union name (string)
- Another employment (boolean, optional)

**Excluded Fields**:
- `osot_membership_year`: SYSTEM-DEFINED from membership-settings (not user-provided)
- `osot_Table_Account@odata.bind`: Extracted from JWT context
- `osot_Table_Account_Affiliate@odata.bind`: Extracted from JWT context
- `osot_privilege`: System-managed permission field
- `osot_access_modifiers`: System-managed access control

**Usage**:
```typescript
POST /private/membership-employments/me
Body: CreateMembershipEmploymentDto
```

### 2. `membership-employment-update.dto.ts`
**Purpose**: Validates PATCH requests for updating existing employment records.

**Fields**: Same 14 fields as CreateDTO, but ALL are optional (partial update)

**Immutable Fields** (enforced at service layer):
- `osot_membership_year`: Cannot be changed after creation
- User references (Account/Affiliate): Cannot be changed after creation

**Usage**:
```typescript
PATCH /private/membership-employments/me
Body: UpdateMembershipEmploymentDto (partial)
```

### 3. `membership-employment-response.dto.ts`
**Purpose**: Defines the structure of GET response data.

**Fields**: 15 total fields
- All 14 user-provided fields (same as CreateDTO)
- `osot_membership_year`: System-defined field (READ-ONLY)

**Data Transformations**:
- Multi-select fields converted from Dataverse strings ("1,2,3") to TypeScript arrays ([1,2,3])
- User references resolved from JWT context
- System timestamps available at service layer but not exposed in this DTO

**Usage**:
```typescript
GET /private/membership-employments/me
Response: ResponseMembershipEmploymentDto
```

### 4. `membership-employment-basic.dto.ts`
**Purpose**: Complete DTO with all fields including system-generated ones.

**Fields**: 24 total fields
- All 15 fields from ResponseDTO
- `osot_employment_id`: UUID primary key
- `osot_employment_identifier`: Business identifier (osot-emp-NNNNNNN)
- `osot_table_name`: Table name constant
- `osot_Table_Account@odata.bind`: Account lookup reference
- `osot_Table_Account_Affiliate@odata.bind`: Affiliate lookup reference
- `osot_privilege`: Permission level
- `osot_access_modifiers`: Access control
- `createdon`: Creation timestamp
- `modifiedon`: Last modification timestamp

**Usage Context**:
- Extended by UpdateDTO for PATCH operations
- Internal service layer processing
- Mapping between Dataverse and Internal representations
- Full entity state management

### 5. `list-membership-employments.query.dto.ts`
**Purpose**: Validates query parameters for list/filter operations.

**Query Capabilities**:
- **Filter by**:
  - Membership year (integer)
  - User (account ID or affiliate ID)
  - Employment status (single choice)
  - Work hours (single value from multi-select)
  - Role descriptor (single choice)
  - Practice years (single choice)
  - Funding source (single value from multi-select)
  - Benefits (single value from multi-select)
  - Earnings (employment, self-direct, self-indirect)
  - Union name (partial match)
  - Another employment (boolean)
  - Privilege and access modifier
  - Employment identifier or UUID
  
- **Sort by**:
  - Creation date (`createdon`)
  - Modification date (`modifiedon`)
  - Membership year (`osot_membership_year`)
  - Employment status (`osot_employment_status`)
  - Sort order: `asc` or `desc`
  
- **Pagination**:
  - Page number (starts at 1, default: 1)
  - Page size (min: 1, max: 100, default: 50)

**Usage**:
```typescript
GET /private/membership-employments?membershipYear=2025&employmentStatus=1&page=1&pageSize=50
Query: ListMembershipEmploymentsQueryDto
```

## Validation Patterns

### Multi-Select Fields
Multi-select fields (WorkHours[], Funding[], Benefits[]) use:
```typescript
@IsArray({ message: 'Field must be an array' })
@IsEnum(EnumType, { each: true, message: 'Each value must be valid' })
field: EnumType[];
```

### Conditional "Other" Fields
Fields like `osot_role_descriptor_other`, `osot_position_funding_other`, and `osot_employment_benefits_other` are optional in DTOs but have business logic validation:
- When `osot_role_descriptor = RoleDescription.OTHER`, then `osot_role_descriptor_other` is REQUIRED
- When `osot_position_funding` includes `Funding.OTHER`, then `osot_position_funding_other` is REQUIRED
- When `osot_employment_benefits` includes `Benefits.OTHER`, then `osot_employment_benefits_other` is REQUIRED

**Note**: These conditional validations will be implemented in custom validators in the `validators/` directory.

### String Length Constraints
All "_other" fields and `osot_union_name` have:
```typescript
@MaxLength(255, { message: 'Field must not exceed 255 characters' })
```

## Business Rules

### Membership Year Management
- **CREATE**: `osot_membership_year` is NOT included in CreateDTO
  - System resolves year from active `membership-settings` record
  - User must have active membership-settings to create employment record
  
- **UPDATE**: `osot_membership_year` is IMMUTABLE
  - Cannot be changed after creation
  - Service layer enforces this constraint
  
- **READ**: `osot_membership_year` is included in ResponseDTO (read-only)

### User Reference Management
- **Account vs Affiliate**: Mutually exclusive (XOR)
  - Regular users link to `osot_Table_Account`
  - Affiliated users link to `osot_Table_Account_Affiliate`
  - References extracted from JWT context, not user-provided
  
- **Uniqueness Constraint**: One employment record per user per year
  - Enforced at service layer using `existsByUserAndYear()`
  - Prevents duplicate employment records for same year

### Access Control
- `osot_privilege` and `osot_access_modifiers` are system-managed
- Not exposed in Create/Update DTOs
- Available in BasicDTO for internal service operations

## Integration Points

### Dependencies
All DTOs import from:
```typescript
// Global enums (from common/enums)
import { Privilege, AccessModifier } from '../../../../common/enums';

// Local enums (from ../enums)
import { EmploymentStatus } from '../enums/employment-status.enum';
import { WorkHours } from '../enums/work-hours.enum';
import { RoleDescription } from '../enums/role-descriptor.enum';
import { PracticeYears } from '../enums/practice-years.enum';
import { Funding } from '../enums/funding.enum';
import { Benefits } from '../enums/benefits.enum';
import { HourlyEarnings } from '../enums/hourly-earnings.enum';
```

### Swagger/OpenAPI Integration
All DTOs use `@ApiProperty()` decorators for:
- Automatic Swagger schema generation
- Example values for documentation
- Field descriptions and constraints
- Enum value listings

### Validation Integration
All DTOs use class-validator decorators:
- `@IsNotEmpty()`: Required fields
- `@IsOptional()`: Optional fields
- `@IsEnum()`: Enum validation
- `@IsArray()`: Array validation
- `@IsString()`: String type validation
- `@IsBoolean()`: Boolean type validation
- `@IsInt()`: Integer type validation
- `@MaxLength()`: String length constraints

## Usage Examples

### Creating Employment Record
```typescript
const createDto: CreateMembershipEmploymentDto = {
  osot_employment_status: EmploymentStatus.EMPLOYEE_SALARIED,
  osot_work_hours: [WorkHours.EXACTLY_35, WorkHours.MORE_THAN_37],
  osot_role_descriptor: RoleDescription.DIRECT_INDIRECT_CARE_PROVIDER,
  osot_practice_years: PracticeYears.BETWEEN_6_AND_10_YEARS,
  osot_position_funding: [Funding.PROVINCIAL_GOVERMENT_HEALTH],
  osot_employment_benefits: [Benefits.EXTENDED_HEALTH_DENTAL_CARE, Benefits.PENSION],
  osot_earnings_employment: HourlyEarnings.BETWEEN_41_TO_50,
  osot_earnings_self_direct: HourlyEarnings.BETWEEN_51_TO_60,
  osot_earnings_self_indirect: HourlyEarnings.BETWEEN_31_TO_40,
  osot_union_name: 'Ontario Public Service Employees Union',
};

// System auto-populates:
// - osot_membership_year (from membership-settings)
// - osot_Table_Account@odata.bind (from JWT)
// - osot_privilege (system default)
// - osot_access_modifiers (system default)
```

### Updating Employment Record (Partial)
```typescript
const updateDto: UpdateMembershipEmploymentDto = {
  osot_work_hours: [WorkHours.MORE_THAN_37], // Update only work hours
  // All other fields remain unchanged
};
```

### Querying Employment Records
```typescript
const queryDto: ListMembershipEmploymentsQueryDto = {
  membershipYear: 2025,
  employmentStatus: EmploymentStatus.EMPLOYEE_SALARIED,
  practiceYears: PracticeYears.BETWEEN_6_AND_10_YEARS,
  page: 1,
  pageSize: 50,
  sortBy: 'createdon',
  sortOrder: 'desc',
};
```

## Next Steps

1. **Validators**: Create custom validators in `validators/` directory for:
   - Conditional "_Other" field validation
   - Account/Affiliate XOR validation
   - Membership year immutability validation

2. **Mappers**: Implement mappers in `mappers/` directory for:
   - Dataverse ↔ Internal representation
   - Multi-select string ↔ array conversion
   - OData bind pattern generation

3. **Services**: Implement service layer in `services/` directory for:
   - CRUD operations
   - Business rule enforcement (one record per user/year)
   - Membership year resolution from membership-settings

## Related Documentation
- **Constants**: See `constants/README.md` for all field mappings and business rules
- **Interfaces**: See `interfaces/README.md` for type definitions and contracts
- **Enums**: See `enums/README.md` (to be created) for all enum definitions
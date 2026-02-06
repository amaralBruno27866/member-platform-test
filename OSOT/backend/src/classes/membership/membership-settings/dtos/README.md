# Membership Settings DTOs

## Overview

This directory contains the complete DTO (Data Transfer Object) layer for the Membership Settings module, providing input validation, API documentation, and type safety for all membership settings operations. Built following the **address module template** with validators fully integrated.

## Architecture Philosophy

Following the **address module pattern**, this DTOs layer provides:

- **CSV-based field mapping**: All DTOs use exact logical names from Table Membership Setting.csv
- **Validator integration**: Comprehensive validation using custom validators from validators layer
- **Inheritance hierarchy**: Clean inheritance pattern (Basic → Create/Update/Response)
- **API documentation**: Complete Swagger/OpenAPI documentation with examples

## DTOs Structure

### Core DTOs Hierarchy

- **MembershipSettingsBasicDto**: Base DTO with all fields and validation
- **CreateMembershipSettingsDto**: Extends Basic for creation operations
- **UpdateMembershipSettingsDto**: Extends Basic with required Settings ID
- **MembershipSettingsResponseDto**: Complete response structure with all fields
- **ListMembershipSettingsQueryDto**: Query parameters for listing/filtering

## CSV Field Alignment

All DTOs use **exact logical names** from Table Membership Setting.csv:

### Multi-Tenant Relationship Fields

| DTO Field      | Type | Requirement | Description                                                         |
| -------------- | ---- | ----------- | ------------------------------------------------------------------- |
| organizationGuid | UUID | REQUIRED    | Organization that owns the settings - injected from JWT on create   |

### Required Business Fields

| CSV Logical Name            | DTO Field                   | Validation                    | Description                       |
| --------------------------- | --------------------------- | ----------------------------- | --------------------------------- |
| osot_membership_year        | osot_membership_year        | MembershipYearValidator       | Text field (4 chars)              |
| osot_membership_year_status | osot_membership_year_status | MembershipYearStatusValidator | Choice from AccountStatus enum    |
| osot_membership_group       | osot_membership_group       | MembershipGroupValidator      | Choice from MembershipGroup enum  |
| osot_year_starts            | osot_year_starts            | YearPeriodValidator           | Date validation (period start)    |
| osot_year_ends              | osot_year_ends              | YearPeriodValidator           | Date validation (period end)      |

### Optional Fields

| CSV Logical Name      | DTO Field             | Default Value            | Description                    |
| --------------------- | --------------------- | ------------------------ | ------------------------------ |
| osot_settingsid       | osot_settingsid       | Auto-generated           | Business ID (osot-set-0000001) |
| osot_privilege        | osot_privilege        | Privilege.MAIN           | Access control                 |
| osot_access_modifiers | osot_access_modifiers | AccessModifier.PROTECTED | Permission modifiers           |

### System Fields

| CSV Logical Name                 | DTO Field                        | Management             | Description       |
| -------------------------------- | -------------------------------- | ---------------------- | ----------------- |
| osot_table_membership_settingsid | osot_table_membership_settingsid | System-generated UUID  | Primary key       |
| createdon                        | createdon                        | System timestamp       | Creation date     |
| modifiedon                       | modifiedon                       | System timestamp       | Modification date |
| ownerid                          | ownerid                          | Authentication context | Record owner      |

## Validation Integration

### Comprehensive Validator Usage

Each DTO integrates validators from the validators layer:

```typescript
@Validate(MembershipYearValidator)
@IsEnum(MembershipYear)
osot_membership_year: MembershipYear;

@Validate(MembershipFeeValidator)
@IsNumber()
osot_membership_fee: number;

@Validate(FeePeriodValidator)
@IsDateString()
osot_membership_fee_start: string;
```

### Business Rules Enforced

- **Fee period validation**: Start date before end date, valid range
- **Currency validation**: Precision, range, minimum amounts
- **Enum validation**: Type-safe choices for all enum fields
- **Format validation**: Settings ID pattern, date formats
- **Uniqueness**: Category-year combination (service layer)

## Usage Patterns

### Multi-Tenant Organization GUID Handling

The `organizationGuid` field is critical for multi-tenant isolation and is handled differently across DTOs:

#### CreateMembershipSettingsDto
- **organizationGuid**: NOT included in request
- **Reason**: Automatically populated from authenticated user's JWT context
- **Flow**: Client sends only business fields → Service extracts organizationGuid from JWT → Record created with organization isolation

```typescript
// Client sends (WITHOUT organizationGuid):
{
  osot_membership_year: '2025',
  osot_membership_group: 1,
  osot_year_starts: '2025-01-01',
  osot_year_ends: '2025-12-31',
}

// Service receives, adds from JWT:
{
  organizationGuid: 'org-uuid-from-jwt',  // Injected by service
  osot_membership_year: '2025',
  // ... other fields
}
```

#### UpdateMembershipSettingsDto
- **organizationGuid**: INHERITED from BasicDto but IMMUTABLE
- **Reason**: Cannot be changed after creation (multi-tenant integrity)
- **Flow**: Client includes organizationGuid → Service validates it matches existing record → If different, returns 403 Forbidden

```typescript
// Client sends (WITH organizationGuid, must match):
{
  organizationGuid: 'org-uuid-from-jwt',
  osot_settingsid: 'osot-set-0000001',
  osot_membership_year: '2025',
  // ... other fields to update
}

// Service validates and preserves organizationGuid
```

#### MembershipSettingsResponseDto
- **organizationGuid**: INCLUDED in response
- **Reason**: Admin/UI needs to know which organization owns the settings
- **Flow**: All responses include organizationGuid for traceability and verification

```typescript
// API response:
{
  organizationGuid: 'org-uuid-from-jwt',
  osot_settingsid: 'osot-set-0000001',
  osot_membership_year: '2025',
  // ... other fields
}
```

#### ListMembershipSettingsQueryDto
- **organizationGuid**: OPTIONAL filter parameter
- **Reason**: Admin may filter by organization (but normally auto-filtered from JWT)
- **Flow**: Usually populated from JWT context; explicit parameter for admin override scenarios

```typescript
// Query example (normally implicit from JWT):
GET /membership-settings?organizationGuid=org-uuid&membershipYear=2025
```

### Creation Flow

```typescript
// 1. Use CreateMembershipSettingsDto for input
const createDto = new CreateMembershipSettingsDto();
createDto.osot_membership_year = '2025';
createDto.osot_membership_group = MembershipGroup.INDIVIDUAL;
createDto.osot_year_starts = '2025-01-01';
createDto.osot_year_ends = '2025-12-31';
// ... other required fields

// 2. System generates: osot_settingsid, UUIDs, timestamps
// 3. Returns MembershipSettingsResponseDto
```

### Update Flow

```typescript
// 1. Use UpdateMembershipSettingsDto for input
const updateDto = new UpdateMembershipSettingsDto();
updateDto.osot_settingsid = 'osot-set-0000001'; // Required
updateDto.osot_year_ends = '2025-12-31'; // Updated value
// ... other fields to update

// 2. System preserves: createdon, primary key
// 3. System updates: modifiedon timestamp
```

### Query Flow

```typescript
// 1. Use ListMembershipSettingsQueryDto for filtering
const queryDto = new ListMembershipSettingsQueryDto();
queryDto.membershipYear = '2025';
queryDto.membershipGroup = MembershipGroup.INDIVIDUAL;
queryDto.page = 1;
queryDto.pageSize = 25;

// 2. Returns array of MembershipSettingsResponseDto
```

## API Documentation

All DTOs include comprehensive Swagger/OpenAPI documentation:

- **Field descriptions**: Clear explanation of each field
- **Examples**: Realistic example values
- **Enum documentation**: Available choices for enum fields
- **Validation messages**: User-friendly error descriptions
- **Required/optional**: Clear field requirement indicators

## Integration Points

### Constants Layer

- Uses field limits and validation constants
- References default values for optional fields
- Applies business rules from constants

### Validators Layer

- Integrates all custom validators
- Provides comprehensive validation coverage
- Maintains business rule consistency

### Enums Layer

- Type-safe enum validation for all Choice fields
- Maintains synchronization with Dataverse choices
- Provides display name mapping capabilities

## Next Steps

With DTOs complete, the next implementation steps are:

1. **Interfaces layer**: Define repository and service contracts using DTO types
2. **Services layer**: Implement business rules and data access using DTOs
3. **Controller layer**: API endpoints with automatic DTO validation

## Files

- `membership-settings-basic.dto.ts` - Base DTO with all fields and validation
- `membership-settings-create.dto.ts` - Creation operations DTO
- `membership-settings-update.dto.ts` - Update operations DTO
- `membership-settings-response.dto.ts` - API response DTO
- `list-membership-settings.query.dto.ts` - Query parameters DTO

# Membership Settings Validators

## Overview

This directory contains comprehensive validators for the Membership Settings module, providing field-level validation, business rule enforcement, and enum-based constraints following the **class-validator** framework pattern established in the address module.

## Architecture Philosophy

Following the **address module template**, this validators layer provides:

- **Multi-tenant validation**: Organization GUID validation for data isolation (CRITICAL)
- **CSV-based field validation**: All validators based on Table Membership Setting.csv constraints
- **Enum validation**: Type-safe validation for all Choice fields using centralized enums
- **Business rule enforcement**: Complex validation rules for year periods and group-year uniqueness
- **class-validator integration**: Standard ValidatorConstraint decorators for DTO usage

## Validators Structure

### Multi-Tenant Validators

- **OrganizationGuidValidator**: Organization GUID UUID v4 validation (REQUIRED for every record)

### Core Field Validators

- **SettingsIdValidator**: Business ID format validation (osot-set-0000001)
- **MembershipYearValidator**: Year text field validation (2019-2050)
- **MembershipGroupValidator**: MembershipGroup enum validation (Individual, Business)
- **MembershipYearStatusValidator**: AccountStatus enum validation

### Business Rule Validators

- **YearPeriodValidator**: Year start/end date relationship validation
- **GroupYearUniqueValidator**: Business uniqueness constraint with organization scope (service layer)

### Access Control Validators

- **PrivilegeValidator**: Privilege enum validation (optional field)
- **AccessModifiersValidator**: AccessModifier enum validation (optional field)

## CSV Field Alignment

All validators implement constraints from **Table Membership Setting.csv**:

| CSV Field                   | Validator                     | Constraint Type                    | Required   |
| --------------------------- | ----------------------------- | ---------------------------------- | ---------- |
| osot_table_organization     | OrganizationGuidValidator     | UUID v4 format                     | **REQUIRED** |
| osot_settingsid             | SettingsIdValidator           | Format pattern                     | Optional\* |
| osot_membership_year        | MembershipYearValidator       | Year range (2019-2050)             | Required   |
| osot_membership_group       | MembershipGroupValidator      | MembershipGroup enum               | Required   |
| osot_membership_year_status | MembershipYearStatusValidator | AccountStatus enum                 | Required   |
| osot_year_starts            | YearPeriodValidator           | Business rule validation           | Required   |
| osot_year_ends              | YearPeriodValidator           | Business rule validation           | Required   |
| osot_privilege              | PrivilegeValidator            | Privilege enum                     | Optional   |
| osot_access_modifiers       | AccessModifiersValidator      | AccessModifier enum                | Optional   |

\*Optional for creation (auto-generated), required for updates

## Business Rules Implemented

### Multi-Tenant Organization Isolation (CRITICAL)

- **organizationGuid is REQUIRED** on every membership settings record
- UUID v4 format validation ensures valid organization references
- Prevents data leakage between organizations
- All queries and operations must be scoped to organizationGuid
- Organization cannot be changed after creation (immutable)

### Year Period Validation

- Start date must be before end date
- Period length between 1 and 365 days
- Valid date format enforcement

### Group Validation

- Must be either Individual (1) or Business (2)
- Enum-based validation for type safety

### Uniqueness Constraints

- **Group-Year-Organization combination must be unique** (enforced at service layer)
  - Before: Group-Year only
  - Now: Group-Year-Organization (org-scoped uniqueness)
- Business ID format: osot-set-0000001 (7 digits)

### Date Constraints

- Year end date must be after year start date
- ISO date format validation

## Usage with DTOs

These validators are designed for integration with class-validator decorators in DTOs:

```typescript
// Multi-tenant organization relationship (REQUIRED)
@Validate(OrganizationGuidValidator)
@IsNotEmpty()
organizationGuid: string;

// Business fields with validators
@Validate(MembershipYearValidator)
@IsNotEmpty()
osot_membership_year: string;

@Validate(MembershipGroupValidator)
@IsNumber()
osot_membership_group: MembershipGroup;

@Validate(YearPeriodValidator)
osot_year_starts: string;
```

## Integration Points

### Constants Layer

- Uses `MEMBERSHIP_SETTINGS_ENUMS` for enum validation arrays
- Uses `MEMBERSHIP_BUSINESS_RULES` for business validation (including org-scoped uniqueness)
- Uses `MEMBERSHIP_YEAR_RANGE` for year validation

### Enums Layer

- **MembershipGroup**: Individual (1) or Business (2) validation
- **AccountStatus**: Active, Inactive, Pending status validation
- **Privilege**: Access control validation
- **AccessModifier**: Permission modifier validation
- Note: `osot_membership_year` is now a text field (4 chars), not an enum

### Error Handling

- Standard `defaultMessage()` methods for user-friendly error messages
- Consistent error formatting across all validators
- Business context in error messages
- Multi-tenant context in OrganizationGuidValidator error

## Multi-Tenant Validation Strategy

### At DTO Level

The `OrganizationGuidValidator` ensures:
1. organizationGuid is present and not empty (REQUIRED)
2. organizationGuid is valid UUID v4 format
3. Clear error message about multi-tenant isolation importance

### At Service Level

The service layer MUST additionally validate:
1. **Creation**: organizationGuid comes from authenticated user's JWT context
2. **Update**: organizationGuid from DTO matches existing record (immutable check)
3. **Uniqueness**: Organization-scoped group-year uniqueness via GroupYearUniqueValidator
4. **Authorization**: User's organization matches record's organization

Example service validation:
```typescript
// Create operation
const organizationGuid = decryptOrganizationId(req.user.organizationId);
const internal = mapCreateDtoToInternal(dto, organizationGuid);

// Update operation
const existing = await repository.findById(id);
if (dto.organizationGuid !== existing.organizationGuid) {
  throw new ForbiddenException('Cannot modify organization (immutable)');
}

// Uniqueness check (organization-scoped)
const duplicate = await repository.findByOrgGroupYear(
  organizationGuid,
  dto.osot_membership_group,
  dto.osot_membership_year
);
if (duplicate && duplicate.id !== id) {
  throw new ValidationException('Duplicate org-group-year combination');
}
```

## Next Steps

With validators complete, the next implementation steps are:

1. **DTOs layer**: Integrate validators with class-validator decorators
2. **Interfaces layer**: Define data contracts using validated types
3. **Services layer**: Implement business rules and repository patterns
4. **Controller layer**: API endpoints with automatic validation

## Files

- `membership-settings.validators.ts` - Main validators file with all field and business rule validation

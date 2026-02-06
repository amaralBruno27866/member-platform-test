# Membership Settings Constants

## Overview

This directory contains the foundational constants layer for the Membership Settings module, establishing field mappings, validation rules, and configuration values based on the official **Table Membership Setting.csv** specification.

## Architecture Philosophy

Following the **address module template**, this constants layer provides:

- **CSV-based field mappings**: All fields mapped from logical names in the official CSV documentation
- **Essential modules integration**: Uses centralized ErrorCodes and enums for consistency
- **Business validation rules**: Simple, focused validation based on Dataverse constraints
- **Clean structure**: Avoids over-engineering with only necessary constants

## Constants Structure

### Core Field Mappings

- **MEMBERSHIP_SETTINGS_FIELDS**: Direct mapping from CSV logical names to Dataverse fields
- **MEMBERSHIP_SETTINGS_TABLE**: Table naming conventions for different contexts (UI, routes, OData)
- **MEMBERSHIP_SETTINGS_ODATA**: Extended OData configurations with complete field mappings for queries

### Validation Rules

- **MEMBERSHIP_YEAR_RANGE**: Business rules for supported membership years
- **SETTINGS_ID_PATTERN**: Format validation for business ID field
- **MEMBERSHIP_BUSINESS_RULES**: Comprehensive business validation constants for year periods

### Business Configuration

- **MEMBERSHIP_SETTINGS_DEFAULTS**: Default values specified in CSV documentation with enum integration
- **MEMBERSHIP_SETTINGS_ROUTES**: Complete API endpoint configurations and patterns
- **MEMBERSHIP_SETTINGS_QUERY**: Query configurations for pagination, sorting, and filtering

### Error Handling

- **MEMBERSHIP_SETTINGS_ERROR_CODES**: Maps to centralized ErrorCodes enum for consistency

## CSV Field Alignment

All constants are derived from **Table Membership Setting.csv**:

| CSV Field                   | Constant               | Enum Used        | Purpose                      |
| --------------------------- | ---------------------- | ---------------- | ---------------------------- |
| osot_settingsid             | SETTINGS_ID            | -                | Business identifier          |
| osot_membership_year        | MEMBERSHIP_YEAR        | -                | Membership year (text field) |
| osot_membership_group       | MEMBERSHIP_GROUP       | MembershipGroup  | Group type (Individual/Business) |
| osot_membership_year_status | MEMBERSHIP_YEAR_STATUS | AccountStatus    | Status choice                |
| osot_year_starts            | YEAR_STARTS            | -                | Year period start date       |
| osot_year_ends              | YEAR_ENDS              | -                | Year period end date         |
| osot_privilege              | PRIVILEGE              | Privilege        | Access control               |
| osot_access_modifiers       | ACCESS_MODIFIERS       | AccessModifier   | Permission modifiers         |

## Essential Modules Integration

This layer integrates with established patterns:

- **ErrorCodes**: From `common/errors/error-codes`
- **Enums**: From `common/enums` with complete Choice field mapping:
  - `MembershipGroup`: For osot_membership_group (Choices_Membership_Group)
  - `AccountStatus`: For osot_membership_year_status (Choices_Status)
  - `Privilege`: For osot_privilege (Choices_Privilege)
  - `AccessModifier`: For osot_access_modifiers (Choices_Access_Modifiers)
  - Note: `osot_membership_year` is now a text field (4 chars), not a Choice
- **Validation**: Consistent with framework patterns

## New Features Added

### Extended OData Support

- **MEMBERSHIP_SETTINGS_ODATA**: Now includes complete field mappings for all database operations
- **Repository Integration**: Direct field references for complex queries and filtering
- **Type Safety**: All OData queries use constants instead of string literals

### Enhanced Business Rules

- **MEMBERSHIP_BUSINESS_RULES**: Year period validation, uniqueness constraints, date formatting
- **Group-Year Uniqueness**: One setting per group/year combination
- **Date Validation**: Proper ISO format and period validation rules (start < end)

### API Route Configuration

- **MEMBERSHIP_SETTINGS_ROUTES**: Complete route patterns for all endpoint types
- **RESTful Patterns**: Standard REST conventions with business-specific extensions
- **Public/Private Access**: Separate route configurations for different access levels

### Query and Pagination

- **MEMBERSHIP_SETTINGS_QUERY**: Default pagination settings and sorting configurations
- **Search Support**: Configurable searchable fields for filtering operations
- **Performance Optimization**: Reasonable defaults for page sizes and sorting

## Next Steps

With the enhanced constants layer complete, including extended OData support, business rules, and route configurations, the next implementation steps following the address module pattern are:

1. **Validators layer**: ✅ Comprehensive validation with business rules integration
2. **DTOs layer**: ✅ Inheritance hierarchy (Basic → Create → Response) with validation
3. **Interfaces layer**: ✅ Data contracts with type safety
4. **Mappers layer**: ✅ Data transformation with normalization
5. **Repository layer**: ✅ Complete Dataverse integration using OData constants
6. **Services layer**: 🔄 Business logic implementation (next step)
7. **Controller layer**: API endpoints with route configurations
8. **Events layer**: Domain events and notifications
9. **Modules layer**: NestJS dependency injection setup

## Files

- `membership-settings.constants.ts` - Main constants file with all mappings and configurations

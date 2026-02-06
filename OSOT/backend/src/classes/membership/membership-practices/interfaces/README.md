# Membership Practices Interfaces

## Overview

This folder contains TypeScript interfaces that define the data structures for the Membership Practices entity across different layers of the application.

## Interface Files

### 1. `membership-practices-internal.interface.ts`

**Purpose**: Complete internal representation with all fields including sensitive data.

**Usage**: Server-side business logic, service layer operations, internal transformations.

**Key Features**:

- All 17 fields from CSV (system, lookups, business, access control)
- Includes sensitive fields (GUIDs, owner info)
- Type-safe with enums (4 local + 2 global)
- **Never expose directly to public APIs**
- **CRITICAL**: `osot_membership_year` is SYSTEM-DEFINED from `membership-settings`
- **CRITICAL**: `osot_clients_age` is business required array (must have at least one value)

**Fields**:

- System: `osot_table_membership_practiceid`, `osot_practice_id`, `createdon`, `modifiedon`, `ownerid`
- Lookups: `osot_table_account` (optional)
- Business (Required): `osot_membership_year` (system-defined), `osot_clients_age` (array)
- Business (Optional): `osot_preceptor_declaration`, `osot_practice_area`, `osot_practice_settings`, `osot_practice_settings_other`, `osot_practice_services`, `osot_practice_services_other`
- Access: `osot_privilege`, `osot_access_modifiers`

**Multiple Choice Fields (All Arrays)**:

- `osot_clients_age: ClientsAge[]` (business required - minimum 1 value)
- `osot_practice_area: PracticeArea[]` (optional)
- `osot_practice_settings: PracticeSettings[]` (optional)
- `osot_practice_services: PracticeServices[]` (optional)

**Conditional "Other" Fields**:

- When `osot_practice_settings` contains `PracticeSettings.OTHER` → `osot_practice_settings_other` required (255 chars)
- When `osot_practice_services` contains `PracticeServices.OTHER` → `osot_practice_services_other` required (255 chars)

### 2. `membership-practices-dataverse.interface.ts`

**Purpose**: Raw Dataverse entity structure mapping.

**Usage**: Direct Dataverse operations, repository layer, OData response parsing.

**Key Features**:

- Exact match to Dataverse table schema
- Raw data types (GUIDs as strings, choices as numbers, booleans)
- **All 4 multi-select fields as comma-separated strings**: `"1,2,3"`
- Used for type safety in repository operations
- Matches `osot_table_membership_practice` logical name

### 3. `membership-practices-repository.interface.ts`

**Purpose**: Repository contract defining all data access operations.

**Usage**: Implemented by repository class, referenced by services.

**Methods** (14 total):

- Create & Read: `create`, `findByPracticeId`, `findById`, `findByYear`, `findByAccountId`, `findByUserAndYear`
- Update & Delete: `update`, `updateById`, `delete`, `deleteById`
- Query & Count: `findAll`, `count`, `existsByUserAndYear`

## Best Practices

1. **Use Internal for Business Logic** - All services work with `MembershipPracticesInternal`
2. **Use Dataverse for Repository** - Repository handles conversion between formats
3. **Validate Business Rules** - Check required arrays, uniqueness, conditional fields
4. **Handle Multi-Select Arrays** - All 4 custom enums are arrays in Internal interface
5. **Never Expose Internal** - Use Response DTOs for public APIs

## Related Files

- **Constants**: `../constants/membership-practices.constants.ts`
- **Enums**: `../enums/*.enum.ts`
- **Mappers**: `../mappers/membership-practices.mapper.ts`
- **CSV Spec**: `../Table Membership Practices.csv`

# Membership Employment Interfaces

## Overview

This folder contains TypeScript interfaces that define the data structures for the Membership Employment entity across different layers of the application.

## Interface Files

### 1. `membership-employment-internal.interface.ts`
**Purpose**: Complete internal representation with all fields including sensitive data.

**Usage**: Server-side business logic, service layer operations, internal transformations.

**Key Features**:
- All 24 fields from CSV (system, lookups, business, access control)
- Includes sensitive fields (GUIDs, owner info)
- Type-safe with enums (7 local + 2 global)
- **Never expose directly to public APIs**
- **CRITICAL**: `osot_membership_year` is SYSTEM-DEFINED from `membership-settings`

**Fields**:
- System: `osot_table_membership_employmentid`, `osot_employment_id`, `createdon`, `modifiedon`, `ownerid`
- Lookups: `osot_table_account`, `osot_table_account_affiliate` (XOR relationship)
- Business (Required): `osot_membership_year` (system-defined), `osot_employment_status`, `osot_work_hours`, `osot_role_descriptor`, `osot_practice_years`, `osot_position_funding`, `osot_employment_benefits`, `osot_earnings_employment`, `osot_earnings_self_direct`, `osot_earnings_self_indirect`, `osot_union_name`
- Business (Conditional): `osot_role_descriptor_other`, `osot_position_funding_other`, `osot_employment_benefits_other`, `osot_another_employment`
- Access: `osot_privilege`, `osot_access_modifiers`

**Multiple Choice Fields (Arrays)**:
- `osot_work_hours: WorkHours[]`
- `osot_position_funding: Funding[]`
- `osot_employment_benefits: Benefits[]`

### 2. `membership-employment-dataverse.interface.ts`
**Purpose**: Raw Dataverse entity structure mapping.

**Usage**: Direct Dataverse operations, repository layer, OData response parsing.

**Key Features**:
- Exact match to Dataverse table schema
- Raw data types (GUIDs as strings, choices as numbers, booleans)
- **Multiple choice fields as comma-separated strings**: `"1,2,3"`
- Used for type safety in repository operations
- Matches `osot_table_membership_employment` logical name

### 3. `membership-employment-repository.interface.ts`
**Purpose**: Repository contract defining all data access operations.

**Usage**: Implemented by repository class, referenced by services.

**Methods** (14 total): 
- CRUD operations
- Specialized queries (by year, account, affiliate)
- **Business rule validation**: `findByUserAndYear`, `existsByUserAndYear`
- Pagination support
- Count operations

**Critical Methods**:
- `findByUserAndYear()` - Enforces one record per user per year
- `existsByUserAndYear()` - Validates duplicate prevention
- `create()` - Requires `membership_year` pre-resolved from `membership-settings`
- `update()` - Blocks `membership_year` modification

## Type Safety

All interfaces use TypeScript enums for type safety:

**Global Enums**: `Privilege`, `AccessModifier`  
**Local Enums**: `EmploymentStatus`, `WorkHours`, `RoleDescription`, `PracticeYears`, `Funding`, `Benefits`, `HourlyEarnings`

## Best Practices

1. ✅ **Never expose Internal interface to public APIs** - Always use Response DTOs
2. ✅ **Use Repository interface for dependency injection** - Enables testing
3. ✅ **Leverage TypeScript enums** - Provides compile-time type safety
4. ✅ **Optional fields use `?`** - Matches CSV specification
5. ✅ **Lookup fields store GUIDs** - Follow Dataverse relationship patterns
6. ✅ **Multiple choice = arrays in Internal, strings in Dataverse** - Mapper handles conversion
7. ⚠️ **NEVER let users set `membership_year`** - System-defined from `membership-settings`

## Critical Business Rules

### Membership Year Management
- 🔒 **System-Defined**: Resolved from `membership-settings`, not user input
- 🚫 **Immutable**: Cannot be changed after creation
- ✅ **Prerequisite**: User must have active `membership-settings`
- 🔑 **Uniqueness**: One employment record per user per year

### Conditional Fields
- When `osot_role_descriptor = RoleDescription.OTHER` → `osot_role_descriptor_other` required
- When `osot_position_funding` contains `Funding.OTHER` → `osot_position_funding_other` required
- When `osot_employment_benefits` contains `Benefits.OTHER` → `osot_employment_benefits_other` required

### XOR Relationship
- User must have **EITHER** `osot_table_account` **OR** `osot_table_account_affiliate`
- Never both, never neither

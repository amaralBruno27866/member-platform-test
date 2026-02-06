# Membership Preferences Interfaces

## Overview

This folder contains TypeScript interfaces that define the data structures for the Membership Preferences entity across different layers of the application.

## Interface Files

### 1. `membership-preference-internal.interface.ts`
**Purpose**: Complete internal representation with all fields including sensitive data.

**Usage**: Server-side business logic, service layer operations, internal transformations.

**Key Features**:
- All 17 fields from CSV (system, lookups, business, access control)
- Includes sensitive fields (GUIDs, owner info)
- Type-safe with enums (4 local + 2 global)
- **Never expose directly to public APIs**

**Fields**:
- System: `osot_table_membership_prefereceid`, `osot_preference_id`, `createdon`, `modifiedon`, `ownerid`
- Lookups: `osot_table_membership_category`, `osot_table_account`, `osot_table_account_affiliate`
- Business: `osot_membership_year`, `osot_third_parties`, `osot_practice_promotion`, `osot_members_search_tools`, `osot_shadowing`, `osot_psychotherapy_supervision`, `osot_auto_renewal`
- Access: `osot_privilege`, `osot_access_modifiers`

### 2. `membership-preference-dataverse.interface.ts`
**Purpose**: Raw Dataverse entity structure mapping.

**Usage**: Direct Dataverse operations, repository layer, OData response parsing.

**Key Features**:
- Exact match to Dataverse table schema
- Raw data types (GUIDs as strings, choices as enums, booleans)
- Used for type safety in repository operations
- Matches `osot_table_membership_preference` logical name

### 3. `membership-preference-repository.interface.ts`
**Purpose**: Repository contract defining all data access operations.

**Usage**: Implemented by repository class, referenced by services.

**Methods** (14 total): CRUD operations, specialized queries (by year, category, account, affiliate), business rule validation, pagination support, data transformation methods.

## Type Safety

All interfaces use TypeScript enums for type safety:

**Global Enums**: `Privilege`, `AccessModifier`  
**Local Enums**: `ThirdParties`, `PracticePromotion`, `SearchTools`, `PsychotherapySupervision`

## Best Practices

1. ✅ **Never expose Internal interface to public APIs** - Always use Response DTOs
2. ✅ **Use Repository interface for dependency injection** - Enables testing
3. ✅ **Leverage TypeScript enums** - Provides compile-time type safety
4. ✅ **Optional fields use `?`** - Matches CSV specification
5. ✅ **Lookup fields store GUIDs** - Follow Dataverse relationship patterns

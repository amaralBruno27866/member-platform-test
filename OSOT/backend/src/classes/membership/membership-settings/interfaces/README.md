# Membership Settings - Interfaces Layer

This directory contains TypeScript interfaces for the membership settings module, providing type-safe contracts for different layers of the application.

## Architecture Overview

The interfaces layer follows a **clean separation of concerns** pattern with three distinct contracts:

1. **Internal Interface** - Complete business entity for server-side operations
2. **Dataverse Interface** - Raw external data mapping
3. **Repository Interface** - Data access layer contract

## Interface Files

### `membership-settings-internal.interface.ts`

- **Purpose**: Complete internal representation of membership settings
- **Usage**: Services, business logic, internal operations
- **Fields**: All business fields including sensitive data and system metadata
- **Type Safety**: Full enum integration for groups, years, and statuses
- **Multi-tenant**: Includes `organizationGuid` (REQUIRED) - ensures data isolation per organization
- **Key Fields**: 
  - `organizationGuid` - Organization relationship (REQUIRED)
  - `membership_year`, `membership_group` (Individual/Business)
  - `year_starts`, `year_ends`

### `membership-settings-dataverse.interface.ts`

- **Purpose**: Raw Dataverse response mapping
- **Usage**: External API integration, data transformation
- **Fields**: Direct mapping to CSV table specification
- **Type Safety**: Enum types with nullable fields matching external format
- **Multi-tenant**: 
  - Read: `_osot_table_organization_value` (lookup GUID)
  - Write: `'osot_table_organization@odata.bind'` (OData binding path)
  - Both fields support organization relationship mapping

### `membership-settings-repository.interface.ts`

- **Purpose**: Data access layer contract
- **Usage**: Repository implementations, dependency injection
- **Operations**: CRUD, filtering, pagination, business queries
- **Type Safety**: Generic operations with proper return types

## Design Philosophy

### Simplicity First

- Clean interfaces without over-engineering
- Essential operations only
- Clear separation of concerns

### CSV Alignment

- All field mappings follow `Table Membership Setting.csv` specification
- Logical names used consistently
- No invented fields or custom additions

### Type Safety

- Full enum integration across all interfaces
- Proper nullable types for optional fields
- Generic repository patterns for extensibility

## Integration Points

### With Constants Layer

```typescript
import {
  MEMBERSHIP_SETTINGS_FIELDS,
  MEMBERSHIP_SETTINGS_ENUMS,
} from '../constants/membership-settings.constants';
```

### With Common Enums

```typescript
import {
  AccountStatus,
  Privilege,
  AccessModifier,
} from '../../../../common/enums';
import { MembershipGroup } from '../enums/membership-group.enum';
```

### With Validators Layer

- Internal interface provides validation target types
- Repository interface ensures validated data contracts
- Type-safe field validation through enum constraints

## Business Rules Integration

### Field Validation

- All interfaces enforce enum constraints
- Required fields clearly marked with non-null types
- Optional fields properly typed as nullable

### Business Logic Support

- Internal interface includes all business context fields
- Repository interface provides business-specific query methods
- Type safety ensures business rule compliance

### Data Access Patterns

- Repository interface defines standard CRUD operations
- Business-specific finders for common queries
- Pagination and filtering support for list operations

## Usage Examples

### Service Layer Integration

```typescript
@Injectable()
export class MembershipSettingsService {
  constructor(private readonly repository: MembershipSettingsRepository) {}

  async findByGroup(
    group: MembershipGroup,
  ): Promise<MembershipSettingsInternal[]> {
    return this.repository.findByGroup(group);
  }
}
```

### Data Transformation

```typescript
// Dataverse to Internal mapping
const internal: MembershipSettingsInternal =
  repository.mapFromDataverse(dataverseResponse);

// Internal to Dataverse mapping
const dataverse: MembershipSettingsDataverse =
  repository.mapToDataverse(internalData);
```

## Quality Standards

### Code Quality

- ESLint compliant code formatting
- Comprehensive TypeScript type coverage
- Clear documentation for all interface members

### Business Alignment

- Field names match CSV logical names exactly
- Business rules reflected in type constraints
- No deviation from source documentation

### Maintainability

- Simple, focused interfaces
- Clear separation of concerns
- Easy to extend and modify

## Next Steps

After completing the interfaces layer, the following layers will be implemented:

1. **Services Layer** - Business logic implementation using these interfaces
2. **Repository Layer** - Concrete implementation of repository interface
3. **Controller Layer** - HTTP API endpoints with automatic validation

Each layer will build upon these interface contracts to ensure type safety and business rule compliance throughout the application.

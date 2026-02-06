# Membership Settings - Services Layer

This directory contains the business logic services for the membership settings module, providing comprehensive business rule enforcement, privilege-based access control, and data orchestration.

## Architecture Overview

The services layer follows a **clean service pattern** with three specialized services:

1. **Business Rules Service** - Centralized validation and business logic enforcement
2. **CRUD Service** - Create, Update, Delete operations with privilege control
3. **Lookup Service** - Read operations with public and privileged access

## Service Files

### `membership-settings-business-rules.service.ts`

- **Purpose**: Centralized business rule validation and enforcement
- **Usage**: Validates all business rules before CRUD operations
- **Features**: Group-year uniqueness, year period validation, privilege checking
- **Access Control**: Main privilege required for rule modifications (Admin can read/update only)

### `membership-settings-crud.service.ts`

- **Purpose**: Create, Update, Delete operations with strict privilege control
- **Usage**: All data modification operations
- **Features**: Business ID generation, soft delete, audit trails
- **Access Control**: Main privilege required for CUD operations (Admin can read/update only)

### `membership-settings-lookup.service.ts`

- **Purpose**: Read operations with public and privileged access patterns
- **Usage**: Data retrieval for both public display and administrative purposes
- **Features**: Public fee display, administrative lookup, filtering, pagination
- **Access Control**: Public access for active settings, privileged access for all

## Design Philosophy

### Security-First Architecture

- **Privilege-Based Access**: Main (3) privilege required for full CRUD operations
- **Admin Limited Access**: Admin (2) can read and update, but cannot create or delete
- **Public Read Access**: Active membership settings available for fee display
- **Operation Tracking**: Comprehensive audit trails with operation IDs
- **Error Handling**: Structured error responses with security context

### Business Rules Integration

- **Group-Year Uniqueness**: Enforced at business rule level
- **Year Period Validation**: Year starts and year ends date validation
- **Status Management**: Active/Inactive status for public visibility

## Permission System

### Access Levels

#### Admin (Privilege = 2)

- ✅ Read access to all membership settings (active and inactive)
- ✅ Update access to existing membership settings
- ❌ No create access for new membership settings
- ❌ No delete access to membership settings
- ✅ Administrative lookup operations

#### Main (Privilege = 3)

- ✅ Full CRUD access to all membership settings
- ✅ Access to all settings (active and inactive)
- ✅ Business rule modification capabilities
- ✅ Complete administrative lookup operations
- ✅ Create, read, update, and delete permissions

#### Public Access (No Privilege / Other Privileges)

- ✅ Read access to ACTIVE membership settings only
- ✅ Public fee information for membership forms
- ❌ No CRUD operations
- ❌ No access to inactive settings

### Business Rules Specific to Membership Settings

#### Uniqueness Constraints

- **Group-Year Combination**: Only one setting per group/year
- **Business ID Format**: osot-set-XXXXXXX pattern validation
- **Active Status**: Only one active setting per group/year combination

#### Validation Rules

- **Year Period**: Year starts must be before year ends
- **Date Ranges**: Minimum and maximum period days validation

## Integration Points

### With Repository Layer

```typescript
// All services use repository for data access
const settings = await this.repository.findBySettingsId(settingsId);
const result = await this.repository.create(internal);
```

### With Mappers Layer

```typescript
// Data transformation in both directions
const internal = MembershipSettingsMapper.mapCreateDtoToInternal(dto);
const response = MembershipSettingsMapper.mapInternalToResponseDto(settings);
```

### With Constants Layer

```typescript
// Business rules and error codes
import {
  MEMBERSHIP_BUSINESS_RULES,
  MEMBERSHIP_SETTINGS_ERROR_CODES,
} from '../constants';
```

### With Enums Layer

```typescript
// Privilege checking and status validation
import {
  Privilege,
  AccountStatus,
  MembershipGroup,
  MembershipYear,
} from '../../../../common/enums';
```

## Key Features

### Business Rules Service

- **`validateCreate()`** - Complete validation for new settings creation
- **`validateUpdate()`** - Update-specific validation with existing data checks
- **`canModifySettings()`** - Privilege verification for modifications
- **`canReadSettings()`** - Access control for read operations
- **`validateYearPeriod()`** - Year period validation (year_starts < year_ends)

### CRUD Service

- **`create()`** - New settings creation with business ID generation
- **`update()`** - Settings modification with validation
- **`delete()`** - Soft delete (sets status to INACTIVE)
- **Private helpers** - Privilege checking, business ID generation

### Lookup Service

- **`findBySettingsId()`** - Single settings lookup with access control
- **`findByGroupAndYear()`** - Business uniqueness and group lookup
- **`list()`** - Paginated listing with filtering
- **`getActiveSettings()`** - Public membership information display
- **`getByYear()`** - Year-based settings for planning
- **`existsByGroupAndYear()`** - Uniqueness validation support

## Public API Features

### Membership Information Display for UI/UX

```typescript
// Public access to active membership settings
const activeSettings = await lookupService.getActiveSettings();

// Group-specific lookup
const groupSettings = await lookupService.findByGroupAndYear(
  MembershipGroup.INDIVIDUAL,
  MembershipYear.Y_2025,
);
```

### Administrative Operations

```typescript
// Main privilege required for create/delete, Admin can update
const newSettings = await crudService.create(dto, Privilege.MAIN);
const updated = await crudService.update(
  settingsId,
  updateDto,
  Privilege.ADMIN,
);
```

### Business Rule Validation

```typescript
// Validate before operations
const validation = await businessRulesService.validateCreate(
  dto,
  userPrivilege,
);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}
```

## Error Handling

### Structured Error Responses

- **PERMISSION_DENIED**: Insufficient privileges for operation
- **VALIDATION_ERROR**: Business rule violations
- **NOT_FOUND**: Settings not found or access denied
- **INTERNAL_ERROR**: Unexpected system errors

### Operation Tracking

- **Operation IDs**: Unique identifiers for audit trails
- **Security Logging**: Privilege-aware logging with context
- **Error Context**: Detailed error information for debugging

## Usage Examples

### Controller Integration

```typescript
@Injectable()
export class MembershipSettingsController {
  constructor(
    private readonly businessRulesService: MembershipSettingsBusinessRulesService,
    private readonly crudService: MembershipSettingsCrudService,
    private readonly lookupService: MembershipSettingsLookupService,
  ) {}

  // Public endpoint for membership information display
  @Get('active')
  async getActiveSettings() {
    return this.lookupService.getActiveSettings();
  }

  // Admin endpoint for creation
  @Post()
  async create(@Body() dto: CreateMembershipSettingsDto, @User() user) {
    // Validate business rules
    const validation = await this.businessRulesService.validateCreate(
      dto,
      user.privilege,
    );
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors);
    }

    // Create settings
    return this.crudService.create(dto, user.privilege);
  }
}
```

### Service Layer Integration

```typescript
// Business rule validation before operations
const validation = await this.businessRulesService.validateUpdate(
  settingsId,
  updateDto,
  userPrivilege,
  operationId,
);

if (validation.isValid) {
  const result = await this.crudService.update(
    settingsId,
    updateDto,
    userPrivilege,
    operationId,
  );
  return result;
}
```

## Quality Standards

### Code Quality

- ESLint compliant code formatting
- Comprehensive TypeScript type coverage
- Clear documentation for all service methods
- Consistent error handling patterns

### Business Alignment

- All business rules reflect CSV specifications exactly
- Privilege system matches OSOT security requirements
- Public access patterns support UI/UX requirements

### Security Standards

- Privilege validation for all modification operations
- Audit trails for compliance and debugging
- Secure data filtering based on user access level

## Next Steps

After completing the services layer, the following layers will be implemented:

1. **Controller Layer** - HTTP API endpoints using these services
2. **Events Layer** - Domain events triggered by service operations
3. **Modules Layer** - NestJS dependency injection setup

Each layer will build upon these service foundations to ensure consistent business rule enforcement and security throughout the application.

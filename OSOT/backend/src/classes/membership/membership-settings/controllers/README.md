# Membership Settings - Controllers Layer

This directory contains the HTTP API controllers for the membership settings module, providing secure RESTful endpoints with privilege-based access control and comprehensive validation.

## Architecture Overview

The controllers layer follows a **public/private controller pattern** with two specialized controllers:

1. **Public Controller** - Unauthenticated endpoints for active membership settings display
2. **Private Controller** - Authenticated CRUD operations with privilege validation

## Controller Files

### `membership-settings-public.controller.ts`

- **Purpose**: Public API endpoints for active membership settings information
- **Usage**: Frontend membership display, membership registration forms, public queries
- **Features**: No authentication required, active data only, group filtering
- **Access Control**: Public access to active settings only

### `membership-settings-private.controller.ts`

- **Purpose**: Administrative CRUD operations with complete privilege control
- **Usage**: Backend administration, membership settings management, audit operations
- **Features**: JWT authentication, privilege validation, complete CRUD, pagination
- **Access Control**: Main privilege for create/delete, Admin privilege for read/update

## Design Philosophy

### Security-First Architecture

- **Public/Private Separation**: Clear distinction between public access and administrative operations
- **Privilege-Based Access**: Main (3) privilege required for create/delete operations
- **Admin Limited Access**: Admin (2) can read and update, but cannot create or delete
- **JWT Authentication**: Secure token-based authentication for private endpoints
- **Input Validation**: Comprehensive DTO validation with class-validator
- **Operation Tracking**: Audit trails with operation IDs for compliance

### RESTful API Design

- **Standard HTTP Methods**: GET, POST, PATCH, DELETE following REST conventions
- **Query Parameters**: Flexible filtering, pagination, and sorting capabilities
- **Response Consistency**: Standardized response formats with proper HTTP status codes
- **Error Handling**: Structured error responses with descriptive messages

## Permission System

### Access Levels

#### Admin (Privilege = 2)

- ✅ Read access to all membership settings (active and inactive)
- ✅ Update access to existing membership settings
- ❌ No create access for new membership settings
- ❌ No delete access to membership settings
- ✅ Administrative lookup operations with pagination

#### Main (Privilege = 3)

- ✅ Full CRUD access to all membership settings
- ✅ Access to all settings (active and inactive)
- ✅ Create new membership fee configurations
- ✅ Update existing membership settings
- ✅ Delete (soft) membership settings
- ✅ Complete administrative operations

#### Public Access (No Authentication)

- ✅ Read access to ACTIVE membership settings only
- ✅ Group-based filtering for UI/UX
- ✅ Public membership information for membership forms
- ❌ No CRUD operations
- ❌ No access to inactive settings

### API Endpoints by Access Level

#### Public Endpoints

```typescript
GET /public/membership-settings/active
// Returns all active membership settings

GET /public/membership-settings/active/group/:group
// Filters active settings by group (1=Individual, 2=Business)
```

#### Private Endpoints (JWT Required)

```typescript
POST   /private/membership-settings        → Create (Main=3 only)
GET    /private/membership-settings        → List with pagination (Admin=2/Main=3)
GET    /private/membership-settings/:id    → Read specific (Admin=2/Main=3)
PATCH  /private/membership-settings/:id    → Update (Admin=2/Main=3)
DELETE /private/membership-settings/:id    → Delete (Main=3 only)
```

## Query Parameters and Filtering

### Available Query Parameters

```typescript
// Data Filters
group: MembershipGroup; // Filter by membership group (1=Individual, 2=Business)
year: MembershipYear; // Filter by membership year (2024, 2025, etc.)
status: AccountStatus; // Filter by status (ACTIVE, INACTIVE)

// Pagination
page: number; // Page number (default: 1, minimum: 1)
limit: number; // Items per page (default: 10, maximum: 100)

// Sorting
sortBy: string; // Sort field (default: osot_membership_year)
sortOrder: 'asc' | 'desc'; // Sort direction (default: desc)
```

### Query Examples

```bash
# Filter by group and year
GET /private/membership-settings?group=1&year=2025&status=ACTIVE

# Pagination with custom sorting
GET /private/membership-settings?page=2&limit=20&sortBy=osot_membership_year&sortOrder=asc

# Combined filtering
GET /private/membership-settings?group=2&year=2024&page=1&limit=5
```

## Validation and Security

### Input Validation

- **DTO Validation**: All request bodies validated using class-validator decorators
- **Query Parameter Validation**: Type-safe query parameters with proper validation
- **Enum Validation**: Category and year parameters validated against defined enums
- **Range Validation**: Pagination limits and numeric constraints enforced

### Authentication and Authorization

```typescript
// JWT Authentication Guard
@UseGuards(AuthGuard('jwt'))

// Privilege validation
private canAccessAllSettings(userPrivilege?: Privilege): boolean {
  return userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN;
}

// Business rules validation
const validation = this.businessRulesService.validateCreate(
  createDto,
  user.privilege,
  operationId,
);
```

### Error Handling

- **HTTP Status Codes**: Appropriate response codes (200, 201, 400, 403, 404, 500)
- **Structured Errors**: Consistent error response format with descriptive messages
- **Operation Tracking**: Unique operation IDs for audit trails and debugging
- **Security Logging**: Privilege-aware logging with security context

## Integration Points

### With Services Layer

```typescript
// Controller dependencies injection
constructor(
  private readonly businessRulesService: MembershipSettingsBusinessRulesService,
  private readonly crudService: MembershipSettingsCrudService,
  private readonly lookupService: MembershipSettingsLookupService,
) {}

// Service integration pattern
const validation = await this.businessRulesService.validateCreate(dto, user.privilege);
const result = await this.crudService.create(dto, user.privilege, operationId);
```

### With DTOs Layer

```typescript
// Request/Response DTO usage
@Body() createDto: CreateMembershipSettingsDto
@Query() queryDto: ListMembershipSettingsQueryDto
@Param('id') id: string

// Response type specification
Promise<MembershipSettingsResponseDto>
Promise<{ data: MembershipSettingsResponseDto[]; total: number; ... }>
```

### With Constants Layer

```typescript
// Error codes and validation rules
import {
  MEMBERSHIP_SETTINGS_ERROR_CODES,
  MEMBERSHIP_BUSINESS_RULES,
} from '../constants';
```

### With Enums Layer

```typescript
// Privilege and status validation
import {
  Privilege,
  MembershipGroup,
  MembershipYear,
  AccountStatus,
} from '../../../../common/enums';
```

## Key Features

### Public Controller Features

- **`getActiveSettings()`** - Returns all active membership settings for public display
- **`getActiveSettingsByGroup()`** - Group-specific membership lookup for UI forms
- **Public access validation** - Ensures only active settings are returned
- **Group enum validation** - Validates group parameters against defined enums
- **Error handling** - Structured error responses for public endpoints

### Private Controller Features

- **`create()`** - New membership settings creation with privilege validation
- **`list()`** - Paginated listing with filtering and sorting capabilities
- **`findById()`** - Single settings lookup with access control
- **`update()`** - Settings modification with business rule validation
- **`delete()`** - Soft delete operation (sets status to INACTIVE)
- **Privilege checking helpers** - Private methods for access control

## Response Formats

### Single Resource Response

```typescript
{
  "settingsId": "osot-set-0000001",
  "membershipGroup": 1,
  "membershipYear": "2025",
  "yearStarts": "2025-01-01",
  "yearEnds": "2025-12-31",
  "status": "ACTIVE",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-02-20T14:45:00Z"
}
```

### Paginated List Response

```typescript
{
  "data": [
    // Array of MembershipSettingsResponseDto objects
  ],
  "total": 25,           // Total number of records
  "page": 1,             // Current page number
  "pageSize": 10,        // Items per page
  "totalPages": 3        // Total number of pages
}
```

## Usage Examples

### Public API Usage

```typescript
// Frontend integration for membership settings display
const response = await fetch('/public/membership-settings/active');
const activeSettings = await response.json();

// Group-specific membership lookup for forms
const groupResponse = await fetch(
  '/public/membership-settings/active/group/1',
);
const individualSettings = await groupResponse.json();
```

### Private API Usage

```typescript
// Administrative creation (Main privilege required)
@Post()
async create(@Body() dto: CreateMembershipSettingsDto, @User() user) {
  const validation = await this.businessRulesService.validateCreate(
    dto,
    user.privilege,
  );

  if (!validation.isValid) {
    throw new BadRequestException(validation.errors);
  }

  return this.crudService.create(dto, user.privilege);
}

// Administrative update (Admin/Main privilege)
@Patch(':id')
async update(
  @Param('id') id: string,
  @Body() dto: UpdateMembershipSettingsDto,
  @User() user
) {
  return this.crudService.update(id, dto, user.privilege);
}
```

### Controller Integration Pattern

```typescript
// Standard controller pattern with service injection
@Controller('private/membership-settings')
@UseGuards(AuthGuard('jwt'))
export class MembershipSettingsPrivateController {
  constructor(
    private readonly businessRulesService: MembershipSettingsBusinessRulesService,
    private readonly crudService: MembershipSettingsCrudService,
    private readonly lookupService: MembershipSettingsLookupService,
  ) {}

  // Endpoints implementation with proper error handling and validation
}
```

## Quality Standards

### Code Quality

- ESLint compliant code formatting and structure
- Comprehensive TypeScript type coverage for all endpoints
- Clear documentation for all controller methods and decorators
- Consistent error handling patterns across all endpoints

### Security Standards

- JWT authentication for all private endpoints
- Privilege validation for all modification operations
- Input sanitization and validation for all request data
- Audit trails with operation IDs for compliance tracking

### API Standards

- RESTful endpoint design following HTTP conventions
- Consistent response formats across all endpoints
- Proper HTTP status codes for all response scenarios
- Comprehensive OpenAPI/Swagger documentation

## Next Steps

After completing the controllers layer, the following layers will be implemented:

1. **Events Layer** - Domain events triggered by controller operations
2. **Modules Layer** - NestJS dependency injection and module configuration

Each layer will build upon these controller foundations to ensure consistent API behavior and security throughout the application.

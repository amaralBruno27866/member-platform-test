# Membership Employment - Controllers Layer

This directory contains the HTTP API controllers for the membership employment module, providing secure RESTful endpoints with privilege-based access control, business rules validation, and employment data management.

## Architecture Overview

The controllers layer follows a **private-only controller pattern** with a single specialized controller:

1. **Private Controller** - Authenticated endpoints for self-service and administrative operations
2. **No Public Controller** - All employment data requires authentication

## Controller Files

### `membership-employment-private.controller.ts`

- **Purpose**: Authenticated API endpoints for membership employment with self-service and admin operations
- **Usage**: User employment management, annual career data, admin oversight
- **Features**: JWT authentication, self-service routes (/me), admin routes, business rules validation
- **Access Control**: OWNER for self-service, ADMIN/MAIN for administrative operations

## Design Philosophy

### Security-First Architecture

- **JWT Authentication Required**: All routes require valid JWT token with user context
- **Privilege-Based Access**: OWNER for self-service, ADMIN/MAIN for administrative access
- **Self-Service Pattern**: Dedicated `/me` routes for users to manage their own employment
- **Business Rules Integration**: XOR validation, conditional "_Other" fields, year validation
- **One Employment Per Year**: Enforced uniqueness constraint per user per membership year
- **Operation Tracking**: Comprehensive logging with operation IDs for audit trails
- **Hard Delete Only**: Admin/Main can permanently delete employment records

### RESTful API Design

- **Standard HTTP Methods**: GET, POST, PATCH, DELETE following REST conventions
- **Self-Service Endpoints**: `/me` suffix for current user operations
- **Admin Endpoints**: `/:id` parameters for managing any user's employment
- **Query Parameters**: Flexible filtering, pagination, and sorting for admin list operations
- **Response Consistency**: Standardized response formats with proper HTTP status codes
- **Error Handling**: Structured error responses with business rule validation messages

## Permission System

### Access Levels

#### OWNER (Privilege = 1) - Self-Service Only

- ✅ Create own employment for current membership year (POST /me)
- ✅ Read own employment for current membership year (GET /me)
- ✅ Update own employment for current membership year (PATCH /me)
- ❌ No delete access (not even own employment)
- ❌ No access to other users' employment
- ❌ No list/search operations
- ❌ No access to historical data outside current year

#### ADMIN (Privilege = 2) - Administrative Access

- ✅ Read access to all employments (GET /:id, GET /)
- ✅ Update access to all employments (PATCH /:id)
- ✅ Delete access to all employments (DELETE /:id, DELETE /me)
- ✅ List operations with filtering and pagination
- ❌ Cannot create employment for other users

#### MAIN (Privilege = 3) - Full Administrative Access

- ✅ Full read access to all employments
- ✅ Full update access to all employments
- ✅ Full delete access to all employments
- ✅ List operations with complete filtering
- ✅ Can manage employment for any user/year

### API Endpoints by Access Level

#### Self-Service Endpoints (OWNER/ADMIN/MAIN)

```typescript
POST   /private/membership-employment/me
// Create employment for current user for active membership year
// Auto-determines membership year from membership-settings
// Validates XOR: Account OR Affiliate (from JWT)
// Validates conditional "_Other" fields

GET    /private/membership-employment/me
// Get current user's employment for active membership year
// Returns 404 if no employment exists

PATCH  /private/membership-employment/me
// Update current user's employment for active membership year
// Business rules validated (conditional "_Other" fields)

DELETE /private/membership-employment/me
// Delete current user's employment for active membership year
// REQUIRES Admin/Main privilege (OWNER cannot delete)
```

#### Administrative Endpoints (ADMIN/MAIN only)

```typescript
GET    /private/membership-employment
// List all employments with filtering and pagination
// Supports filters: membershipYear, accountId, affiliateId, employmentStatus

GET    /private/membership-employment/:id
// Get specific employment by employment ID (GUID)
// Full access to any user's employment

PATCH  /private/membership-employment/:id
// Update specific employment by employment ID
// Can modify any user's employment

DELETE /private/membership-employment/:id
// Delete specific employment by employment ID (GUID)
// Permanent hard delete - cannot be undone
```

## Business Logic Integration

### Automatic Membership Year Determination

```typescript
// Uses MembershipCategoryMembershipYearService
const membershipYear = await this.membershipYearService.getCurrentMembershipYear();

// Queries membership-settings for active year using vote-counting algorithm
// Returns most common year from ACTIVE settings (resilient to bad data)
```

### XOR Validation (Account OR Affiliate)

```typescript
// Enforced automatically via JWT user context
const userType = this.getUserType(user); // 'account' or 'affiliate'

// System-determined field based on JWT
...(userType === 'account'
  ? { osot_table_account: userId }
  : { osot_table_account_affiliate: userId })

// Business rules service validates no dual assignment
```

### Conditional "_Other" Fields Validation

```typescript
// Validates conditional "_Other" fields through business rules service
await this.businessRulesService.createEmployment(completeDto, privilege, userId, operationId);

// Checks:
// - osot_employment_status_other: Required when osot_employment_status = OTHER
// - osot_role_descriptor_other: Required when osot_role_descriptor = OTHER  
// - osot_practice_years_other: Required when osot_practice_years = OTHER
// - osot_work_hours_other: Required when osot_work_hours = OTHER
// - osot_hourly_earnings_other: Required when osot_hourly_earnings = OTHER
// - osot_funding_other: Required when osot_funding = OTHER
// - osot_benefits_other: Required when osot_benefits = OTHER
```

### Year Validation

```typescript
// Business rules service validates year exists and is ACTIVE
await this.businessRulesService.validateMembershipYear(membershipYear);

// Integration with MembershipSettingsLookupService
// Ensures year is valid before creating employment record
```

### One Employment Per Year Enforcement

```typescript
// Business rules service enforces uniqueness
await this.businessRulesService.createEmployment(createDto, privilege, userId, operationId);

// Checks for existing employment by:
// - osot_table_account (for accounts)
// - osot_table_account_affiliate (for affiliates)
// - osot_membership_year
```

## Query Parameters and Filtering

### Available Query Parameters (List Endpoint)

```typescript
// Data Filters
membershipYear?: string;              // Filter by year ("2026")
accountId?: string;                   // Filter by account GUID
affiliateId?: string;                 // Filter by affiliate GUID
employmentStatus?: EmploymentStatus; // Filter by status

// Employment-Specific Filters
roleDescriptor?: RoleDescriptor;     // Filter by role
practiceYears?: PracticeYears;       // Filter by practice years
workHours?: WorkHours;               // Filter by work hours
hourlyEarnings?: HourlyEarnings;     // Filter by earnings range
funding?: Funding;                   // Filter by funding type
benefits?: Benefits;                 // Filter by benefits type

// Pagination
page?: number;                        // Page number (default: 1)
pageSize?: number;                    // Items per page (default: 50, max: 100)

// Sorting
sortBy?: string;                      // Sort field (default: createdOn desc)
```

### Query Examples

```bash
# Filter by membership year
GET /private/membership-employment?membershipYear=2026

# Pagination with filtering
GET /private/membership-employment?membershipYear=2026&page=2&pageSize=20

# Filter by employment status
GET /private/membership-employment?employmentStatus=EMPLOYEE

# Filter by account
GET /private/membership-employment?accountId=<GUID>

# Combined filters
GET /private/membership-employment?membershipYear=2026&employmentStatus=SELF_EMPLOYED&sortBy=modifiedOn
```

## Validation and Security

### Input Validation

- **DTO Validation**: All request bodies validated using class-validator decorators
- **Enum Validation**: Field values validated against defined enums
- **Business Rules**: XOR validation, conditional "_Other" fields, year validation
- **User-Year Uniqueness**: Enforced at service layer with proper error messages
- **Conditional Fields**: "_Other" fields required when parent enum is OTHER

### Authentication and Authorization

```typescript
// JWT Authentication on all routes
@UseGuards(AuthGuard('jwt'))

// User context extraction
@User() user: Record<string, unknown>

// Privilege validation
private getUserPrivilege(user: Record<string, unknown>): Privilege {
  const privilege = (user?.privilege || user?.osot_privilege) as number;
  return typeof privilege === 'number' ? privilege : Privilege.OWNER;
}

// Permission helpers
if (!canWrite(userRole)) {
  throw createAppError(ErrorCodes.PERMISSION_DENIED, { ... });
}

// Delete requires Admin/Main
if (!canDelete(userRole)) {
  throw createAppError(ErrorCodes.PERMISSION_DENIED, { 
    requiredPermissions: ['ADMIN', 'MAIN'] 
  });
}
```

### Error Handling

- **HTTP Status Codes**: Appropriate response codes (200, 201, 400, 403, 404, 500)
- **Business Rule Violations**: Descriptive error messages for "_Other" field issues
- **XOR Violations**: Clear error when both Account and Affiliate provided
- **Duplicate Prevention**: Clear error message for one-per-year violation
- **Year Validation**: Error when year doesn't exist or isn't ACTIVE
- **Operation Tracking**: Unique operation IDs for debugging and audit trails

## Integration Points

### With Services Layer

```typescript
// Controller dependencies injection
constructor(
  private readonly businessRulesService: MembershipEmploymentBusinessRulesService,
  private readonly crudService: MembershipEmploymentCrudService,
  private readonly lookupService: MembershipEmploymentLookupService,
  private readonly membershipYearService: MembershipCategoryMembershipYearService,
  @Inject(MEMBERSHIP_EMPLOYMENT_REPOSITORY)
  private readonly repository: DataverseMembershipEmploymentRepository,
) {}

// Service integration pattern
const membershipYear = await this.membershipYearService.getCurrentMembershipYear();
const result = await this.businessRulesService.createEmployment(
  completeDto, 
  privilege, 
  userId, 
  operationId
);
```

### With External Modules

```typescript
// Membership Category Integration (Year Service)
import { MembershipCategoryMembershipYearService } from '../../membership-category/utils/membership-category-membership-year.util';

// Membership Settings Integration (via BusinessRulesService)
// Validates year exists and is ACTIVE through MembershipSettingsLookupService
```

### With DTOs Layer

```typescript
// Request/Response DTO usage
@Body() createDto: CreateMembershipEmploymentDto
@Body() updateDto: UpdateMembershipEmploymentDto
@Query() queryDto: ListMembershipEmploymentsQueryDto
@Param('id') id: string

// Response type specification
Promise<MembershipEmploymentResponseDto>
Promise<{ 
  success: boolean; 
  data: MembershipEmploymentResponseDto[]; 
  metadata: { total, page, pageSize, totalPages } 
}>
```

### With Constants Layer

```typescript
// Error codes and validation rules
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege, AccessModifier } from '../../../../common/enums';

// Permission helpers
import { canCreate, canRead, canWrite, canDelete } from '../../../../utils/dataverse-app.helper';
```

## Business Rules Matrix

### Field Validation Rules

The controller enforces conditional "_Other" fields through the business rules service:

#### Employment Status
- **Enum Values**: EMPLOYEE, SELF_EMPLOYED, VOLUNTEER, ACADEMIC, NOT_PRACTICING, OTHER
- **Conditional Field**: osot_employment_status_other (required when value = OTHER)

#### Role Descriptor
- **Enum Values**: PSYCHOTHERAPIST, SUPERVISOR, CLINICAL_SPECIALIST, ADMINISTRATOR, CONSULTANT, EDUCATOR, RESEARCHER, MANAGER, OTHER
- **Conditional Field**: osot_role_descriptor_other (required when value = OTHER)

#### Practice Years
- **Enum Values**: LESS_THAN_1, BETWEEN_1_AND_5, BETWEEN_6_AND_10, BETWEEN_11_AND_15, MORE_THAN_15, OTHER
- **Conditional Field**: osot_practice_years_other (required when value = OTHER)

#### Work Hours
- **Enum Values**: FULL_TIME, PART_TIME, CASUAL, CONTRACT, OTHER
- **Conditional Field**: osot_work_hours_other (required when value = OTHER)

#### Hourly Earnings
- **Enum Values**: LESS_THAN_30, BETWEEN_30_AND_40, BETWEEN_41_AND_50, MORE_THAN_50, OTHER
- **Conditional Field**: osot_hourly_earnings_other (required when value = OTHER)

#### Funding
- **Enum Values**: PUBLIC, PRIVATE, MIXED, SELF_FUNDED, OTHER
- **Conditional Field**: osot_funding_other (required when value = OTHER)

#### Benefits
- **Enum Values**: FULL_BENEFITS, PARTIAL_BENEFITS, NO_BENEFITS, OTHER
- **Conditional Field**: osot_benefits_other (required when value = OTHER)

### XOR Validation

- **Rule**: Account OR Affiliate (never both, never neither)
- **Enforcement**: Automatic via JWT userType
- **Validation**: Business rules service ensures no dual assignment

### User-Year Uniqueness

- **Rule**: One employment per user per membership year
- **Enforcement**: Business rules service checks existing records
- **Error**: Clear message with existing employment ID

### Year Validation

- **Rule**: Year must exist in membership-settings with ACTIVE status
- **Enforcement**: Business rules service validates via MembershipSettingsLookupService
- **Error**: Clear message when year doesn't exist or isn't active

## Annual Workflow

### Employment Creation Workflow

1. **User initiates**: POST /private/membership-employment/me
2. **Year determination**: Queries membership-settings for active year
3. **User extraction**: Gets account/affiliate ID from JWT
4. **DTO enrichment**: Adds year, user reference, privilege, access modifiers
5. **Business validation**: Validates XOR, conditional "_Other" fields, year, uniqueness
6. **Employment creation**: Stores validated employment in Dataverse
7. **Response**: Returns complete employment with metadata

### Year Transition Workflow

- Employments are year-specific (one per user per year)
- New year → Users create new employment for that year
- Historical employments remain immutable
- GET /me always returns current year's employment
- Admin can access historical data via ID or year filter

### Delete Workflow

- DELETE requires Admin/Main privilege (OWNER cannot delete)
- Hard delete operation - permanent and cannot be undone
- Used for data corrections, year changes, duplicate cleanup
- Comprehensive audit logging with deletion reason

## Swagger/OpenAPI Documentation

All endpoints include comprehensive Swagger documentation:

```typescript
@ApiTags('Private Membership Employment Operations')
@ApiBearerAuth('JWT-auth')

@ApiOperation({
  summary: 'Create my employment for current year',
  description: `Full operation documentation...`,
})
@ApiBody({ type: CreateMembershipEmploymentDto })
@ApiResponse({ status: 201, type: MembershipEmploymentResponseDto })
@ApiResponse({ status: 400, description: 'Business rule violation' })
@ApiResponse({ status: 403, description: 'Permission denied' })
@ApiResponse({ status: 409, description: 'Employment already exists' })
```

## Security Considerations

### PII Protection

- User IDs truncated in logs: `${userId.substring(0, 8)}...`
- Sensitive data redacted in error messages
- Operation IDs for secure audit trails
- Organization names and employment details logged with context

### Rate Limiting

- Controller delegates to NestJS guards
- Can be configured at route level
- Protects against brute force attacks

### Input Sanitization

- All DTOs use class-validator
- Enum validation prevents injection
- Conditional field validation prevents incomplete data
- Business rules prevent invalid combinations

## Testing

### Unit Tests

- Controller method testing with mocked services
- Privilege validation logic
- User type extraction
- Error handling scenarios

### Integration Tests

- End-to-end workflow: Create → Read → Update → Delete
- Cross-module integration (membership-settings for year validation)
- Business rule validation with different enum combinations
- Pagination and filtering accuracy
- XOR validation enforcement

### E2E Tests

- Complete user journeys (self-service workflow)
- Admin operations (list, read, update, delete all users)
- Year transition scenarios
- Multi-user concurrent access
- Delete permission enforcement

## Development Notes

### Adding New Employment Fields

1. Update DTOs (create, update, response, basic)
2. Update interfaces (internal, dataverse)
3. Add validators in validators file
4. Update mapper (toDataverse, toInternal parsers)
5. Add business rules if conditional
6. Update controller documentation
7. Add Swagger decorators
8. Update this README

### Modifying Business Rules

1. Update business-rules.service.ts methods
2. Update validators if needed
3. Update controller validation calls if needed
4. Update tests
5. Update API documentation

### Adding New Enum Values

1. Update enum file
2. Add display helper method
3. Update validators
4. If adding OTHER → ensure "_Other" field exists
5. Update business rules service
6. Update tests
7. Update Swagger documentation

## Related Documentation

- [Services README](../services/README.md) - Service layer architecture
- [DTOs README](../dtos/README.md) - DTO structure and validation rules
- [Validators README](../validators/README.md) - Validation rules and conditional logic
- [Mappers README](../mappers/README.md) - Data transformation logic
- [Events README](../events/README.md) - Event emission and audit trails
- [Project Permissions Matrix](../../../../documentation/PROJECT_PERMISSIONS_AND_CRUD_MATRIX.md) - System-wide permissions

---

**Last Updated**: November 26, 2025  
**Controller Version**: 1.0.0  
**Status**: ✅ Fully Implemented

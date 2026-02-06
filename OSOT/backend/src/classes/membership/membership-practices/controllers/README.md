# Membership Practices - Controllers Layer

This directory contains the HTTP API controllers for the membership practices module, providing secure RESTful endpoints with privilege-based access control, business rules validation, and practice demographics management.

## Architecture Overview

The controllers layer follows a **private-only controller pattern** with a single specialized controller:

1. **Private Controller** - Authenticated endpoints for self-service and administrative operations
2. **No Public Controller** - All practices data requires authentication

## Controller Files

### `membership-practices-private.controller.ts`

- **Purpose**: Authenticated API endpoints for membership practices with self-service and admin operations
- **Usage**: User practice demographics management, annual practice data, admin oversight
- **Features**: JWT authentication, self-service routes (/me), admin routes, business rules validation
- **Access Control**: OWNER for self-service, ADMIN/MAIN for administrative operations

## Design Philosophy

### Security-First Architecture

- **JWT Authentication Required**: All routes require valid JWT token with user context
- **Privilege-Based Access**: OWNER for self-service, ADMIN/MAIN for administrative access
- **Self-Service Pattern**: Dedicated `/me` routes for users to manage their own practices
- **Business Rules Integration**: Clients age required validation, conditional "\_Other" fields, year validation
- **One Practice Per Year**: Enforced uniqueness constraint per user per membership year
- **Operation Tracking**: Comprehensive logging with operation IDs for audit trails
- **Hard Delete Only**: Admin/Main can permanently delete practices records (DISABLED pending finalization)

### RESTful API Design

- **Standard HTTP Methods**: GET, POST, PATCH, DELETE following REST conventions
- **Self-Service Endpoints**: `/me` suffix for current user operations
- **Admin Endpoints**: `/:id` parameters for managing any user's practices
- **Query Parameters**: Flexible filtering, pagination, and sorting for admin list operations
- **Response Consistency**: Standardized response formats with proper HTTP status codes
- **Error Handling**: Structured error responses with business rule validation messages

## Permission System

### Access Levels

#### OWNER (Privilege = 1) - Self-Service Only

- ✅ Create own practices for current membership year (POST /me)
- ✅ Read own practices for current membership year (GET /me)
- ✅ Update own practices for current membership year (PATCH /me)
- ❌ No delete access (not even own practices) - DISABLED
- ❌ No access to other users' practices
- ❌ No list/search operations
- ❌ No access to historical data outside current year

#### ADMIN (Privilege = 2) - Administrative Access

- ✅ Read access to all practices (GET /:id, GET /)
- ✅ Update access to all practices (PATCH /:id)
- ✅ Delete access to all practices (DELETE /:id, DELETE /me) - DISABLED
- ✅ List operations with filtering and pagination
- ❌ Cannot create practices for other users

#### MAIN (Privilege = 3) - Full Administrative Access

- ✅ Full read access to all practices
- ✅ Full update access to all practices
- ✅ Full delete access to all practices - DISABLED
- ✅ List operations with complete filtering
- ✅ Can manage practices for any user/year

### API Endpoints by Access Level

#### Self-Service Endpoints (OWNER/ADMIN/MAIN)

```typescript
POST / private / membership - practices / me;
// Create practices for current user for active membership year
// Auto-determines membership year from membership-settings
// Validates clients_age required (business required, minimum 1 value)
// Validates conditional "_Other" fields

GET / private / membership - practices / me;
// Get current user's practices for active membership year
// Returns 404 if no practices exists

PATCH / private / membership - practices / me;
// Update current user's practices for active membership year
// Business rules validated (clients_age, conditional "_Other" fields)

DELETE / private / membership - practices / me;
// Delete current user's practices for active membership year
// REQUIRES Admin/Main privilege (OWNER cannot delete)
// STATUS: TEMPORARILY DISABLED
```

#### Administrative Endpoints (ADMIN/MAIN only)

```typescript
GET    /private/membership-practices
// List all practices with filtering and pagination
// Supports filters: membershipYear, accountId, clientsAge, practiceArea

GET    /private/membership-practices/:id
// Get specific practices by practice ID (business ID, not GUID)
// Full access to any user's practices

PATCH  /private/membership-practices/:id
// Update specific practices by practice ID
// Can modify any user's practices

DELETE /private/membership-practices/:id
// Delete specific practices by practice ID (business ID, not GUID)
// Permanent hard delete - cannot be undone
// STATUS: TEMPORARILY DISABLED
```

## Business Logic Integration

### Automatic Membership Year Determination

```typescript
// Uses MembershipCategoryMembershipYearService
const membershipYear =
  await this.membershipYearService.getCurrentMembershipYear();

// Queries membership-settings for active year using vote-counting algorithm
// Returns most common year from ACTIVE settings (resilient to bad data)
```

### Account Reference (Optional)

```typescript
// Practices only references Account (no Affiliate unlike employment)
// Account ID extracted from JWT token if provided
const userGuid = await this.userGuidResolver.resolveUserGuid(userId, 'account');

// System-determined field based on JWT
'osot_Table_Account@odata.bind': `/osot_table_accounts(${userGuid})`

// Account is OPTIONAL for practices - can exist without account reference
```

### Clients Age Required Validation (Business Required)

```typescript
// Validates clients_age through business rules service
await this.businessRulesService.createWithValidation(
  completeDto,
  privilege,
  userId,
  operationId,
);

// Checks:
// - osot_clients_age: REQUIRED array field with minimum 1 value
// - This is a BUSINESS REQUIRED field (not system required, but enforced by business rules)
// - Cannot create or update practices without at least one clients age value

// Example valid values:
osot_clients_age: [
  ClientsAge.AGE_0_TO_2,
  ClientsAge.AGE_3_TO_5,
  ClientsAge.AGE_6_TO_12,
];
```

### Conditional "\_Other" Fields Validation

```typescript
// Validates conditional "_Other" fields through business rules service
await this.businessRulesService.createWithValidation(
  completeDto,
  privilege,
  userId,
  operationId,
);

// Checks:
// - osot_practice_settings_other: Required when osot_practice_settings contains OTHER (28)
// - osot_practice_services_other: Required when osot_practice_services contains OTHER (59)
```

### Year Validation

```typescript
// Business rules service validates year exists and is ACTIVE
await this.businessRulesService.validateMembershipYear(membershipYear);

// Integration with MembershipSettingsLookupService
// Ensures year is valid before creating practices record
```

### One Practice Per Year Enforcement

```typescript
// Business rules service enforces uniqueness
await this.businessRulesService.createWithValidation(
  createDto,
  privilege,
  userId,
  operationId,
);

// Checks for existing practices by:
// - User ID (from JWT)
// - osot_membership_year
// Note: Does NOT use account reference for uniqueness (practices can exist without account)
```

## Query Parameters and Filtering

### Available Query Parameters (List Endpoint)

```typescript
// Data Filters
membershipYear?: string;              // Filter by year ("2026")
accountId?: string;                   // Filter by account GUID (optional)
clientsAge?: ClientsAge;             // Filter by client age group
practiceArea?: PracticeArea;         // Filter by practice area

// Practices-Specific Filters
practiceSettings?: PracticeSettings; // Filter by practice settings
practiceServices?: PracticeServices; // Filter by practice services
preceptorDeclaration?: boolean;      // Filter by preceptor status

// Pagination
page?: number;                        // Page number (default: 1)
pageSize?: number;                    // Items per page (default: 50, max: 100)

// Sorting
sortBy?: string;                      // Sort field (default: createdOn desc)
```

### Query Examples

```bash
# Filter by membership year
GET /private/membership-practices?membershipYear=2026

# Pagination with filtering
GET /private/membership-practices?membershipYear=2026&page=2&pageSize=20

# Filter by clients age
GET /private/membership-practices?clientsAge=AGE_3_TO_5

# Filter by account
GET /private/membership-practices?accountId=<GUID>

# Combined filters
GET /private/membership-practices?membershipYear=2026&practiceArea=CLINICAL_PRACTICE&sortBy=modifiedOn
```

## Validation and Security

### Input Validation

- **DTO Validation**: All request bodies validated using class-validator decorators
- **Enum Validation**: Field values validated against defined enums
- **Business Rules**: Clients age required validation, conditional "\_Other" fields, year validation
- **User-Year Uniqueness**: Enforced at service layer with proper error messages
- **Conditional Fields**: "\_Other" fields required when parent enum contains OTHER
- **Multi-Select Arrays**: Validated for minimum/maximum values

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

// Delete requires Admin/Main (DISABLED)
// if (!canDelete(userRole)) {
//   throw createAppError(ErrorCodes.PERMISSION_DENIED, {
//     requiredPermissions: ['ADMIN', 'MAIN']
//   });
// }
```

### Error Handling

- **HTTP Status Codes**: Appropriate response codes (200, 201, 400, 403, 404, 500)
- **Business Rule Violations**: Descriptive error messages for "\_Other" field issues
- **Clients Age Required**: Clear error when clients_age array is empty or missing
- **Duplicate Prevention**: Clear error message for one-per-year violation
- **Year Validation**: Error when year doesn't exist or isn't ACTIVE
- **Operation Tracking**: Unique operation IDs for debugging and audit trails

## Integration Points

### With Services Layer

```typescript
// Controller dependencies injection
constructor(
  private readonly businessRulesService: MembershipPracticesBusinessRulesService,
  private readonly crudService: MembershipPracticesCrudService,
  private readonly lookupService: MembershipPracticesLookupService,
  private readonly membershipYearService: MembershipCategoryMembershipYearService,
  private readonly userGuidResolver: UserGuidResolverUtil,
  @Inject(MEMBERSHIP_PRACTICES_REPOSITORY)
  private readonly repository: DataverseMembershipPracticesRepository,
) {}

// Service integration pattern
const membershipYear = await this.membershipYearService.getCurrentMembershipYear();
const result = await this.businessRulesService.createWithValidation(
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

// User GUID Resolution (Employment Module)
import { UserGuidResolverUtil } from '../../membership-employment/utils/user-guid-resolver.util';
```

### With DTOs Layer

```typescript
// Request/Response DTO usage
@Body() createDto: CreateMembershipPracticesDto
@Body() updateDto: UpdateMembershipPracticesDto
@Query() queryDto: ListMembershipPracticesQueryDto
@Param('id') practiceId: string

// Response type specification
Promise<MembershipPracticesBasicDto>
Promise<{
  success: boolean;
  data: MembershipPracticesBasicDto[];
  metadata: { total, page, pageSize, totalPages }
}>
```

### With Constants Layer

```typescript
// Error codes and validation rules
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege, AccessModifier } from '../../../../common/enums';

// Permission helpers
import {
  canCreate,
  canRead,
  canWrite,
} from '../../../../utils/dataverse-app.helper';
```

## Business Rules Matrix

### Field Validation Rules

The controller enforces field-specific business rules through the business rules service:

#### Clients Age (BUSINESS REQUIRED)

- **Enum Values**: AGE_0_TO_2, AGE_3_TO_5, AGE_6_TO_12, AGE_13_TO_17, AGE_18_TO_64, AGE_65_PLUS
- **Validation**: Array must contain at least 1 value
- **Business Logic**: Required for demographics tracking
- **Error**: Clear message when array is empty or undefined

#### Practice Area (Optional Multi-Select)

- **Enum Values**: 42 values including CLINICAL_PRACTICE, SUPERVISION, EDUCATION, etc.
- **Validation**: Array can be empty or contain multiple values
- **No Conditional Field**: No "\_Other" field associated

#### Practice Settings (Optional Multi-Select)

- **Enum Values**: 27 values including PRIVATE_PRACTICE, HOSPITAL, SCHOOL, COMMUNITY_AGENCY, OTHER (28)
- **Conditional Field**: osot_practice_settings_other (required when array contains OTHER)
- **Validation**: "\_Other" field required only when OTHER is in array

#### Practice Services (Optional Multi-Select)

- **Enum Values**: 58 values including INDIVIDUAL_THERAPY, GROUP_THERAPY, ASSESSMENT, CONSULTATION, OTHER (59)
- **Conditional Field**: osot_practice_services_other (required when array contains OTHER)
- **Validation**: "\_Other" field required only when OTHER is in array

#### Preceptor Declaration (Optional Boolean)

- **Type**: Boolean
- **Default**: undefined (not set)
- **Validation**: No specific validation rules

### User-Year Uniqueness

- **Rule**: One practice per user per membership year
- **Enforcement**: Business rules service checks existing records
- **Error**: Clear message with existing practice ID

### Year Validation

- **Rule**: Year must exist in membership-settings with ACTIVE status
- **Enforcement**: Business rules service validates via MembershipSettingsLookupService
- **Error**: Clear message when year doesn't exist or isn't active

## Annual Workflow

### Practices Creation Workflow

1. **User initiates**: POST /private/membership-practices/me
2. **Year determination**: Queries membership-settings for active year
3. **User extraction**: Gets account ID from JWT (optional)
4. **DTO enrichment**: Adds year, account reference (if available), privilege, access modifiers
5. **Business validation**: Validates clients_age required, conditional "\_Other" fields, year, uniqueness
6. **Practices creation**: Stores validated practices in Dataverse
7. **Response**: Returns complete practices with metadata

### Year Transition Workflow

- Practices are year-specific (one per user per year)
- New year → Users create new practices for that year
- Historical practices remain immutable
- GET /me always returns current year's practices
- Admin can access historical data via ID or year filter

### Delete Workflow (DISABLED)

- DELETE requires Admin/Main privilege (OWNER cannot delete)
- Hard delete operation - permanent and cannot be undone
- Used for data corrections, year changes, duplicate cleanup
- Comprehensive audit logging with deletion reason
- **STATUS**: Temporarily disabled pending finalization of deletion permissions

## Swagger/OpenAPI Documentation

All endpoints include comprehensive Swagger documentation:

```typescript
@ApiTags('Private Membership Practices Operations')
@ApiBearerAuth('JWT-auth')

@ApiOperation({
  summary: 'Create my membership practices',
  description: `Full operation documentation...`,
})
@ApiBody({ type: CreateMembershipPracticesDto })
@ApiResponse({ status: 201, type: MembershipPracticesBasicDto })
@ApiResponse({ status: 400, description: 'Business rule violation' })
@ApiResponse({ status: 403, description: 'Permission denied' })
@ApiResponse({ status: 409, description: 'Practices already exists' })
```

## Security Considerations

### PII Protection

- User IDs truncated in logs: `${userId.substring(0, 8)}...`
- Sensitive data redacted in error messages
- Operation IDs for secure audit trails
- Practice demographics logged with appropriate context

### Rate Limiting

- Controller delegates to NestJS guards
- Can be configured at route level
- Protects against brute force attacks

### Input Sanitization

- All DTOs use class-validator
- Enum validation prevents injection
- Array validation prevents empty required fields
- Conditional field validation prevents incomplete data
- Business rules prevent invalid combinations

## Testing

### Unit Tests

- Controller method testing with mocked services
- Privilege validation logic
- User context extraction
- Error handling scenarios
- Clients age required validation

### Integration Tests

- End-to-end workflow: Create → Read → Update → Delete
- Cross-module integration (membership-settings for year validation)
- Business rule validation with different enum combinations
- Pagination and filtering accuracy
- Multi-select array validation

### E2E Tests

- Complete user journeys (self-service workflow)
- Admin operations (list, read, update, delete all users)
- Year transition scenarios
- Multi-user concurrent access
- Delete permission enforcement (when enabled)

## Development Notes

### Adding New Practices Fields

1. Update DTOs (create, update, basic, response)
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
4. If adding OTHER → ensure "\_Other" field exists
5. Update business rules service
6. Update tests
7. Update Swagger documentation

## Comparison: Practices vs Employment

### Key Differences

| Aspect                    | Employment                    | Practices                       |
| ------------------------- | ----------------------------- | ------------------------------- |
| **User Type**             | Account OR Affiliate (XOR)    | Account only (optional)         |
| **Required Arrays**       | None                          | Clients age (business required) |
| **Conditional "\_Other"** | 7 fields                      | 2 fields                        |
| **Multi-Select Fields**   | 7 enums                       | 4 enums                         |
| **Delete Routes**         | DISABLED                      | DISABLED                        |
| **Account Reference**     | Required (XOR with Affiliate) | Optional                        |
| **Business Focus**        | Career demographics           | Practice demographics           |

### Similarities

- Same privilege-based access control
- Same self-service `/me` pattern
- Same admin operations structure
- Same year validation logic
- Same one-per-year enforcement
- Same operation tracking and logging
- Same DELETE disabled status

## Related Documentation

- [Services README](../services/README.md) - Service layer architecture
- [DTOs README](../dtos/README.md) - DTO structure and validation rules
- [Validators README](../validators/README.md) - Validation rules and conditional logic
- [Mappers README](../mappers/README.md) - Data transformation logic
- [Events README](../events/README.md) - Event emission and audit trails
- [Project Permissions Matrix](../../../../documentation/PROJECT_PERMISSIONS_AND_CRUD_MATRIX.md) - System-wide permissions

---

**Last Updated**: November 27, 2025  
**Controller Version**: 1.0.0  
**Status**: ✅ Fully Implemented (DELETE routes disabled)

# Membership Preferences - Controllers Layer

This directory contains the HTTP API controllers for the membership preferences module, providing secure RESTful endpoints with privilege-based access control, business rules validation, and category-based field availability.

## Architecture Overview

The controllers layer follows a **private-only controller pattern** with a single specialized controller:

1. **Private Controller** - Authenticated endpoints for self-service and administrative operations
2. **No Public Controller** - All preference data requires authentication

## Controller Files

### `membership-preference-private.controller.ts`

- **Purpose**: Authenticated API endpoints for membership preferences with self-service and admin operations
- **Usage**: User preference management, annual settings, admin oversight
- **Features**: JWT authentication, self-service routes (/me), admin routes, business rules validation
- **Access Control**: OWNER for self-service, ADMIN/MAIN for administrative operations

## Design Philosophy

### Security-First Architecture

- **JWT Authentication Required**: All routes require valid JWT token with user context
- **Privilege-Based Access**: OWNER for self-service, ADMIN/MAIN for administrative access
- **Self-Service Pattern**: Dedicated `/me` routes for users to manage their own preferences
- **Business Rules Integration**: Category-based field validation before create/update operations
- **One Preference Per Year**: Enforced uniqueness constraint per user per membership year
- **Operation Tracking**: Comprehensive logging with operation IDs for audit trails

### RESTful API Design

- **Standard HTTP Methods**: GET, POST, PATCH following REST conventions
- **Self-Service Endpoints**: `/me` suffix for current user operations
- **Admin Endpoints**: `/:id` parameters for managing any user's preferences
- **Query Parameters**: Flexible filtering, pagination, and sorting for admin list operations
- **Response Consistency**: Standardized response formats with proper HTTP status codes
- **Error Handling**: Structured error responses with business rule validation messages

## Permission System

### Access Levels

#### OWNER (Privilege = 0) - Self-Service Only

- ✅ Create own preference for current membership year (POST /me)
- ✅ Read own preference for current membership year (GET /me)
- ✅ Update own preference for current membership year (PATCH /me)
- ❌ No access to other users' preferences
- ❌ No list/search operations
- ❌ No access to historical data outside current year

#### ADMIN (Privilege = 2) - Administrative Access

- ✅ Read access to all preferences (GET /:id, GET /)
- ✅ Update access to all preferences (PATCH /:id)
- ✅ List operations with filtering and pagination
- ❌ Cannot create preferences for other users
- ❌ No delete access

#### MAIN (Privilege = 3) - Full Administrative Access

- ✅ Full read access to all preferences
- ✅ Full update access to all preferences
- ✅ List operations with complete filtering
- ✅ Can manage preferences for any user/year
- ❌ No delete access (preferences are immutable once created)

### API Endpoints by Access Level

#### Self-Service Endpoints (OWNER/ADMIN/MAIN)

```typescript
POST   /private/membership-preferences/me
// Create preference for current user for active membership year
// Auto-determines membership year from membership-settings
// Validates category from membership-category records

GET    /private/membership-preferences/me
// Get current user's preference for active membership year
// Returns 404 if no preference exists

PATCH  /private/membership-preferences/me
// Update current user's preference for active membership year
// Business rules validated based on user's category
```

#### Administrative Endpoints (ADMIN/MAIN only)

```typescript
GET    /private/membership-preferences
// List all preferences with filtering and pagination
// Supports filters: membershipYear, category, autoRenewal

GET    /private/membership-preferences/:id
// Get specific preference by preference ID
// Full access to any user's preference

PATCH  /private/membership-preferences/:id
// Update specific preference by preference ID
// Can modify any user's preference
```

## Business Logic Integration

### Automatic Membership Year Determination

```typescript
// Uses MembershipCategoryMembershipYearService
const membershipYear = await this.membershipYearService.getCurrentMembershipYear();

// Queries membership-settings for active year
// Fallback logic: current year → most recent active → calendar year
```

### Category Lookup and Validation

```typescript
// Fetches user's category from membership-category records
const category = await this.getUserCategory(userId, userType, membershipYear);

// Uses MembershipCategoryLookupService.findByUserAndYear()
// Fallback to Category.OT_PR (1) if not found
```

### Field Availability Validation

```typescript
// Validates category-based field availability
this.businessRulesService.validateCreateDto(createDto, category);

// Checks:
// - Practice Promotion: Only for OT_LIFE, OT_NG, OT_PR
// - Shadowing: Only for OT categories (not OTAs)
// - Psychotherapy Supervision: Only for OT_LIFE, OT_PR
// - Search Tools: Complex 5-tier matrix by category
```

### One Preference Per Year Enforcement

```typescript
// CRUD service enforces uniqueness
await this.crudService.create(createDto, privilege, userId, operationId);

// Checks for existing preference by:
// - osot_table_account (for accounts)
// - osot_table_account_affiliate (for affiliates)
// - osot_membership_year
```

## Query Parameters and Filtering

### Available Query Parameters (List Endpoint)

```typescript
// Data Filters
membershipYear?: string;              // Filter by year ("2025", "2026")
membershipCategoryId?: string;        // Filter by category GUID
accountId?: string;                   // Filter by account GUID
affiliateId?: string;                 // Filter by affiliate GUID
autoRenewal?: boolean;                // Filter by auto-renewal status

// Preference-Specific Filters
thirdParties?: ThirdParty[];          // Multi-select filter
practicePromotion?: PracticePromotion[]; // Multi-select filter
searchTools?: SearchTool[];           // Multi-select filter
psychotherapySupervision?: PsychotherapySupervision[]; // Multi-select filter

// Pagination
page?: number;                        // Page number (default: 1)
pageSize?: number;                    // Items per page (default: 50, max: 100)

// Sorting
sortBy?: string;                      // Sort field (default: createdOn desc)
```

### Query Examples

```bash
# Filter by membership year
GET /private/membership-preferences?membershipYear=2025

# Pagination with filtering
GET /private/membership-preferences?membershipYear=2025&page=2&pageSize=20

# Filter by category and auto-renewal
GET /private/membership-preferences?membershipCategoryId=<GUID>&autoRenewal=true

# Combined filters
GET /private/membership-preferences?membershipYear=2025&accountId=<GUID>&sortBy=modifiedOn
```

## Validation and Security

### Input Validation

- **DTO Validation**: All request bodies validated using class-validator decorators
- **Multi-Select Fields**: Array validation with duplicate detection
- **Enum Validation**: Field values validated against defined enums
- **Business Rules**: Category-based field availability validation
- **User-Year Uniqueness**: Enforced at service layer with proper error messages

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
```

### Error Handling

- **HTTP Status Codes**: Appropriate response codes (200, 201, 400, 403, 404, 500)
- **Business Rule Violations**: Descriptive error messages for field availability issues
- **Category Not Found**: Graceful fallback with warning logging
- **Duplicate Prevention**: Clear error message for one-per-year violation
- **Operation Tracking**: Unique operation IDs for debugging and audit trails

## Integration Points

### With Services Layer

```typescript
// Controller dependencies injection
constructor(
  private readonly businessRulesService: MembershipPreferenceBusinessRulesService,
  private readonly crudService: MembershipPreferenceCrudService,
  private readonly lookupService: MembershipPreferenceLookupService,
  private readonly membershipCategoryLookupService: MembershipCategoryLookupService,
  private readonly membershipYearService: MembershipCategoryMembershipYearService,
) {}

// Service integration pattern
const membershipYear = await this.membershipYearService.getCurrentMembershipYear();
const category = await this.getUserCategory(userId, userType, membershipYear);
this.businessRulesService.validateCreateDto(createDto, category);
const result = await this.crudService.create(createDto, privilege, userId, operationId);
```

### With External Modules

```typescript
// Membership Category Integration
import { MembershipCategoryLookupService } from '../../membership-category/services/membership-category-lookup.service';
import { MembershipCategoryMembershipYearService } from '../../membership-category/utils/membership-category-membership-year.util';

// Membership Settings Integration (via MembershipYearService)
// Queries active membership year from membership-settings repository
```

### With DTOs Layer

```typescript
// Request/Response DTO usage
@Body() createDto: CreateMembershipPreferenceDto
@Body() updateDto: UpdateMembershipPreferenceDto
@Query() queryDto: ListMembershipPreferencesQueryDto
@Param('id') id: string

// Response type specification
Promise<MembershipPreferenceResponseDto>
Promise<{ 
  success: boolean; 
  data: MembershipPreferenceResponseDto[]; 
  metadata: { total, page, pageSize, totalPages } 
}>
```

### With Constants Layer

```typescript
// Error codes and validation rules
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege, Category } from '../../../../common/enums';

// Permission helpers
import { canCreate, canRead, canWrite } from '../../../../utils/dataverse-app.helper';
```

## Business Rules Matrix

### Field Availability by Category

The controller enforces category-based field availability through the business rules service:

#### Third Parties Communication
- **Available for**: All categories
- **Validation**: Multi-select enum values

#### Practice Promotion
- **Available for**: OT_LIFE, OT_NG, OT_PR
- **Unavailable for**: All OTAs, Associates, Students, Affiliates
- **Validation**: Business rule enforces category eligibility

#### Shadowing
- **Available for**: OT_LIFE, OT_NG, OT_PR (OTs only)
- **Unavailable for**: All OTAs (even practicing)
- **Validation**: Strict OT-only enforcement

#### Psychotherapy Supervision
- **Available for**: OT_LIFE, OT_PR
- **Unavailable for**: All others
- **Validation**: Limited to specific OT categories

#### Search Tools
- **5-Tier Matrix**:
  - **ALL tools**: OT_LIFE, OT_NG, OT_PR, OT_NP
  - **All except Presenter**: OT_RET
  - **Exam Guide, Supervising, Network**: OTA_LIFE, OTA_NG, OTA_PR, OTA_NP
  - **Network only**: ASSOC, OT_STU, OTA_STU
  - **NO tools**: AFF_PREM, AFF_PRIM
- **Validation**: Complex category-based allowed values

## Annual Workflow

### Preference Creation Workflow

1. **User initiates**: POST /private/membership-preferences/me
2. **Year determination**: Queries membership-settings for active year
3. **Category lookup**: Fetches user's category from membership-category
4. **Field validation**: Validates field availability based on category
5. **Uniqueness check**: Ensures one preference per user per year
6. **Preference creation**: Stores validated preference in Dataverse
7. **Response**: Returns complete preference with metadata

### Year Transition Workflow

- Preferences are year-specific (one per user per year)
- New year → Users create new preferences for that year
- Historical preferences remain immutable
- GET /me always returns current year's preference
- Admin can access historical data via ID or year filter

## Swagger/OpenAPI Documentation

All endpoints include comprehensive Swagger documentation:

```typescript
@ApiTags('Private Membership Preferences Operations')
@ApiBearerAuth('JWT-auth')

@ApiOperation({
  summary: 'Create my preference for current year',
  description: `Full operation documentation...`,
})
@ApiBody({ type: CreateMembershipPreferenceDto })
@ApiResponse({ status: 201, type: MembershipPreferenceResponseDto })
@ApiResponse({ status: 400, description: 'Business rule violation' })
@ApiResponse({ status: 403, description: 'Permission denied' })
```

## Security Considerations

### PII Protection

- User IDs truncated in logs: `${userId.substring(0, 8)}...`
- Sensitive data redacted in error messages
- Operation IDs for secure audit trails

### Rate Limiting

- Controller delegates to NestJS guards
- Can be configured at route level
- Protects against brute force attacks

### Input Sanitization

- All DTOs use class-validator
- Enum validation prevents injection
- Multi-select arrays validated for duplicates
- Business rules prevent invalid combinations

### Integration Tests

- End-to-end workflow: Create → Read → Update
- Cross-module integration (membership-category, membership-settings)
- Business rule validation with different categories
- Pagination and filtering accuracy

### E2E Tests

- Complete user journeys (self-service workflow)
- Admin operations (list, read, update all users)
- Year transition scenarios
- Multi-user concurrent access

## Development Notes

### Adding New Preference Fields

1. Update DTOs (create, update, response, basic)
2. Update interfaces (internal, dataverse)
3. Add validators in validators file
4. Update mapper (toDataverse, toInternal parsers)
5. Add business rules in business-rules.service.ts
6. Update controller documentation
7. Add Swagger decorators
8. Update this README

### Modifying Business Rules

1. Update business-rules.service.ts methods
2. Update BUSINESS_RULES_ANALYSIS.md
3. Update controller validation calls if needed
4. Update tests
5. Update API documentation

## Related Documentation

- [Business Rules Analysis](../BUSINESS_RULES_ANALYSIS.md) - Complete field availability matrix
- [DTOs README](../dtos/README.md) - DTO structure and validation rules
- [Services README](../services/README.md) - Service layer architecture
- [Mappers README](../mappers/README.md) - Data transformation logic
- [Project Permissions Matrix](../../../documentation/PROJECT_PERMISSIONS_AND_CRUD_MATRIX.md) - System-wide permissions

---

**Last Updated**: November 24, 2025  
**Controller Version**: 1.0.0  
**Status**: ✅ Fully Implemented (0 TypeScript Errors)

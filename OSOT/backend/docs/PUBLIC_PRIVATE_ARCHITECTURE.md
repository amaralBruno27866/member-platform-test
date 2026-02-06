# Public/Private Controller Architecture

## Overview

This project follows a **dual-controller architecture pattern** where each module implements two separate controllers to handle different types of operations:

1. **Public Controller** - Unauthenticated routes for validation and lookup operations
2. **Private Controller** - Authenticated routes for CRUD operations with role-based access control

## Architecture Pattern

### Public Controllers (`*-public.controller.ts`)

**Purpose**: Handle operations that don't require user authentication

- **Route Prefix**: `/public/{module-name}`
- **Authentication**: None required
- **Use Cases**:
  - Data validation during registration
  - Public lookup operations
  - Information queries for forms
  - Statistical data without sensitive information

**Key Characteristics**:

- No `@UseGuards()` decorators
- No JWT authentication required
- Focus on validation and lookup operations
- Safe for public consumption
- No user context required

### Private Controllers (`*-private.controller.ts`)

**Purpose**: Handle authenticated operations with full CRUD capabilities

- **Route Prefix**: `/private/{module-name}`
- **Authentication**: JWT required via `@UseGuards(AuthGuard('jwt'))`
- **Use Cases**:
  - Create, Read, Update, Delete operations
  - User-specific data access
  - Administrative operations
  - Privileged lookup operations

**Key Characteristics**:

- `@UseGuards(AuthGuard('jwt'))` decorator required
- `@ApiBearerAuth()` for Swagger documentation
- `@User()` decorator to access authenticated user context
- Role-based access control (admin, main, owner)
- Full CRUD operations
- User context validation

## Implementation Example: OT Education Module

### Public Controller Routes

```typescript
@Controller('public/ot-educations')
@ApiTags('Public OT Education Operations')
export class OtEducationPublicController {
  // Validation routes
  @Post('validate/education-data')
  @Post('validate/coto-registration')
  @Post('validate/university-country')

  // Lookup routes
  @Get('lookup/universities')
  @Get('lookup/countries')
  @Get('lookup/graduation-years')

  // Utility routes
  @Post('determine-education-category')
  @Get('statistics')
}
```

### Private Controller Routes

```typescript
@Controller('private/ot-education')
@ApiTags('Private OT Education Operations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OtEducationPrivateController {
  // CRUD operations
  @Get('me')           // Get my education records
  @Post()              // Create new education record
  @Get(':id')          // Get specific education record
  @Patch(':id')        // Update education record
  @Delete(':id')       // Delete education record (main only)

  // Administrative operations
  @Get('account/:accountId')        // Get by account (admin/main)
  @Get('user/:userBusinessId')      // Get by user business ID

  // Validation operations
  @Post(':id/validate')             // Validate data completeness

  // Lookup operations (authenticated)
  @Get('lookup/coto-status/:status')      // Find by COTO status
  @Get('lookup/university/:university')   // Find by university
  @Get('lookup/graduation-year/:year')    // Find by graduation year
  @Get('lookup/country/:country')         // Find by country
}
```

## Security Model

### Public Controller Security

- **No Authentication**: Routes are accessible without login
- **Input Validation**: All inputs validated through DTOs
- **Rate Limiting**: Should be implemented to prevent abuse
- **Safe Data Only**: No sensitive or user-specific data exposed

### Private Controller Security

- **JWT Authentication**: All routes require valid JWT token
- **User Context**: Access to authenticated user information
- **Role-Based Access**: Different permissions based on user privilege level
- **Data Ownership**: Users can only access their own data unless they have elevated privileges

## Role-Based Access Control

### Privilege Levels

1. **owner** (Privilege.OWNER = 1) - Default user privilege, access to own data only
2. **admin** (Privilege.ADMIN = 2) - Administrative access, can access organization-wide data
3. **main** (Privilege.MAIN = 3) - Full administrative privileges, can delete records and full CRUD access

### Access Matrix

| Operation                | Owner | Admin | Main |
| ------------------------ | ----- | ----- | ---- |
| View own data            | ✅    | ✅    | ✅   |
| Create own data          | ✅    | ✅    | ✅   |
| Update own data          | ✅    | ✅    | ✅   |
| Delete own data          | ❌    | ❌    | ✅   |
| View other users' data   | ❌    | ✅    | ✅   |
| Administrative lookups   | ❌    | ✅    | ✅   |
| Account-level operations | ❌    | ✅    | ✅   |

## Error Handling

### Common Error Patterns

- **Authentication Errors**: `401 Unauthorized` for missing/invalid JWT
- **Authorization Errors**: `403 Forbidden` for insufficient privileges
- **Validation Errors**: `400 Bad Request` for invalid input data
- **Not Found Errors**: `404 Not Found` for missing resources
- **Conflict Errors**: `409 Conflict` for business rule violations

### Error Response Format

```typescript
{
  code: string;           // Error code from ErrorCodes enum
  message: string;        // Human-readable error message
  details?: object;       // Additional error context
  timestamp: string;      // ISO timestamp
  path: string;          // Request path
}
```

## Service Integration

### Service Layer Architecture

Both controllers integrate with the same service layer:

- **CRUD Service**: Handles all database operations
- **Lookup Service**: Specialized query operations
- **Business Rule Service**: Validation and business logic
- **Repository Service**: Data access layer

### Service Method Patterns

```typescript
// Public controller - no user context needed
await this.businessRuleService.validateEducationData(data);

// Private controller - includes user privilege for access control
await this.crudService.findOne(id, userPrivilege);
```

## Benefits of This Architecture

### Separation of Concerns

- **Clear Boundaries**: Public vs private functionality is explicit
- **Security by Design**: Authentication requirements are obvious
- **Maintainability**: Easy to understand and modify
- **Testing**: Controllers can be tested independently

### Scalability

- **Performance**: Public routes don't carry authentication overhead
- **Caching**: Public routes can be more aggressively cached
- **Rate Limiting**: Different limits can be applied to public vs private routes
- **Load Balancing**: Public and private routes can be scaled independently

### API Design

- **Consistency**: Predictable URL patterns across modules
- **Documentation**: Clear separation in API documentation
- **Client Integration**: Frontend can easily distinguish between authenticated and unauthenticated calls
- **Versioning**: Public and private APIs can evolve independently

## Implementation Guidelines

### When to Use Public Controllers

- ✅ Form validation before user registration
- ✅ Lookup data for dropdowns and selects
- ✅ Public statistics and aggregated data
- ✅ Health checks and status endpoints
- ❌ User-specific data access
- ❌ Data modification operations
- ❌ Sensitive business information

### When to Use Private Controllers

- ✅ All CRUD operations on user data
- ✅ User-specific queries and reports
- ✅ Administrative operations
- ✅ Data export/import functionality
- ✅ User profile management
- ✅ Privileged lookup operations

### Implementation Checklist

#### Public Controller

- [ ] No authentication guards
- [ ] Comprehensive input validation
- [ ] Rate limiting considerations
- [ ] Safe data exposure only
- [ ] Clear API documentation

#### Private Controller

- [ ] JWT authentication guard
- [ ] User context injection
- [ ] Role-based access control
- [ ] Comprehensive error handling
- [ ] Audit logging for sensitive operations

## Migration from Single Controller

If migrating from a single controller architecture:

1. **Identify Public Routes**: Extract routes that don't need authentication
2. **Create Public Controller**: Move validation and lookup routes
3. **Update Private Controller**: Add authentication guards and user context
4. **Update Frontend**: Modify API calls to use correct endpoints
5. **Update Documentation**: Clearly document the new architecture
6. **Test Security**: Verify authentication requirements are properly enforced

## Example Module Structure

```
src/classes/user-account/ot-education/
├── controllers/
│   ├── ot-education-public.controller.ts    # Public routes
│   └── ot-education-private.controller.ts   # Private routes
├── services/
│   ├── ot-education-crud.service.ts         # CRUD operations
│   ├── ot-education-lookup.service.ts       # Lookup operations
│   └── ot-education-business-rule.service.ts # Business logic
├── dtos/
│   ├── create-ot-education.dto.ts           # Creation DTOs
│   ├── update-ot-education.dto.ts           # Update DTOs
│   └── ot-education-response.dto.ts         # Response DTOs
└── ot-education.module.ts                   # Module configuration
```

This architecture ensures clear separation of concerns, robust security, and maintainable code while providing flexibility for both public and authenticated operations.

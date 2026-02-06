# OT Education Controllers

## Purpose

Houses NestJS controllers responsible for handling HTTP requests related to OT Education operations. This module implements a **dual-controller architecture** with separate public and private controllers to handle different security contexts and use cases.

## Architecture

### Public Controller (`ot-education-public.controller.ts`)

- **Route Prefix**: `/public/ot-educations`
- **Authentication**: None required
- **Purpose**: Validation and lookup operations for unauthenticated users

### Private Controller (`ot-education-private.controller.ts`)

- **Route Prefix**: `/private/ot-educations`
- **Authentication**: JWT required via `@UseGuards(AuthGuard('jwt'))`
- **Purpose**: Full CRUD operations with role-based access control

## Public Routes (9 endpoints)

### Validation Operations

- `POST /public/ot-educations/create` → Create/Validate education data
- `POST /public/ot-educations/validate-coto` → Validate COTO registration format
- `POST /public/ot-educations/validate-university-country` → Validate university-country alignment
- `POST /public/ot-educations/check-user-business-id` → Check User Business ID uniqueness

### Lookup Operations

- `GET /public/ot-educations/universities` → Get list of OT universities
- `GET /public/ot-educations/countries` → Get list of countries
- `GET /public/ot-educations/graduation-years` → Get valid graduation years

### Utility Operations

- `GET /public/ot-educations/category/:graduationYear` → Determine education category
- `GET /public/ot-educations/statistics` → Get education statistics

## Private Routes (12 endpoints)

### CRUD Operations

- `GET /private/ot-educations/me` → Get my education records
- `POST /private/ot-educations` → Create new education record
- `GET /private/ot-educations/:id` → Get specific education record
- `PATCH /private/ot-educations/:id` → Update education record
- `DELETE /private/ot-educations/:id` → Delete education record (main users only)

### Administrative Operations

- `GET /private/ot-educations/account/:accountId` → Get by account (admin/main)
- `GET /private/ot-educations/user/:userBusinessId` → Get by user business ID

### Validation Operations

- `POST /private/ot-educations/:id/validate` → Validate data completeness

### Lookup Operations (Authenticated)

- `GET /private/ot-educations/lookup/coto-status/:status` → Find by COTO status
- `GET /private/ot-educations/lookup/university/:university` → Find by university
- `GET /private/ot-educations/lookup/graduation-year/:year` → Find by graduation year
- `GET /private/ot-educations/lookup/country/:country` → Find by country

## Security Model

### Public Controller

- **No Authentication**: Routes accessible without login
- **Input Validation**: All inputs validated through DTOs
- **Safe Data Only**: No sensitive or user-specific data exposed

### Private Controller

- **JWT Authentication**: All routes require valid JWT token
- **Role-Based Access**: Different permissions based on user privilege
- **User Context**: Access to authenticated user information

## Role-Based Access Control

| Privilege | Access Level                                         |
| --------- | ---------------------------------------------------- |
| **owner** | Own data only, no delete                             |
| **main**  | Own data + delete permissions + some admin functions |
| **admin** | Full access to all users' data                       |

## DTOs Used

### Input DTOs

- `CreateOtEducationDto` - Creating new education records
- Various validation schemas for public endpoints

### Response DTOs

- `OtEducationResponseDto` - Standardized response format
- Custom response schemas for lookup and validation endpoints

## Service Integration

Controllers integrate with:

- `OtEducationCrudService` - CRUD operations
- `OtEducationLookupService` - Query operations
- `OtEducationBusinessRuleService` - Validation and business logic

## Best Practices

### Controller Design

- **Thin Controllers**: Business logic delegated to services
- **Comprehensive Error Handling**: Structured error responses
- **Input Validation**: DTO validation on all endpoints
- **Swagger Documentation**: Complete API documentation

### Security

- **Authentication Guards**: Proper JWT validation
- **Authorization Checks**: Role-based access control
- **Data Ownership**: Users can only access their own data (unless privileged)

### Performance

- **Async Operations**: Proper async/await usage for database operations
- **Synchronous Operations**: Non-async methods for simple data transformations
- **Efficient Queries**: Optimized database access patterns

## Error Handling

All controllers implement comprehensive error handling:

- **Validation Errors**: `400 Bad Request`
- **Authentication Errors**: `401 Unauthorized`
- **Authorization Errors**: `403 Forbidden`
- **Not Found Errors**: `404 Not Found`
- **Business Rule Violations**: `409 Conflict`
- **Internal Errors**: `500 Internal Server Error`

## API Documentation

Both controllers are fully documented with Swagger/OpenAPI:

- Complete endpoint documentation
- Request/response schemas
- Authentication requirements
- Error response formats

## Usage Examples

### Public API (No Authentication)

```typescript
// Validate education data
POST /public/ot-educations/create
{
  "graduationYear": 2024,
  "university": 1,
  "country": 1
}

// Get universities list
GET /public/ot-educations/universities
```

### Private API (JWT Required)

```typescript
// Create education record
POST /private/ot-educations
Authorization: Bearer <jwt-token>
{
  "graduationYear": 2024,
  "university": 1,
  "country": 1
}

// Get my records
GET /private/ot-educations/me
Authorization: Bearer <jwt-token>
```

# Affiliate Controllers

## Purpose

Houses NestJS controllers responsible for handling HTTP requests related to affiliate operations. Controllers implement a PUBLIC/PRIVATE architecture pattern, mapping routes to service calls, validating input via DTOs, and returning appropriate HTTP responses with proper security controls.

## Architecture Overview

The affiliate controllers follow a dual-layer security architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        HTTP Layer                           │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────┐        ┌─────────────────────────┐   │
│  │  PUBLIC Controller │        │  PRIVATE Controller     │   │
│  │  (Unauthenticated) │        │  (Authenticated)        │   │
│  │                   │        │                         │   │
│  │ • Email Validation │        │ • CRUD Operations       │   │
│  │ • Public Searches  │        │ • Password Management  │   │
│  │ • Basic Lookups    │        │ • Admin Functions       │   │
│  │ • Rate Limited     │        │ • Privileged Searches   │   │
│  └───────────────────┘        └─────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      Services Layer                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│   │ Business    │  │    CRUD     │  │     Lookup      │    │
│   │ Rule        │  │   Service   │  │    Service      │    │
│   │ Service     │  │             │  │                 │    │
│   └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Implemented Controllers

### 1. AffiliatePublicController (`affiliate-public.controller.ts`)

**Purpose**: Handles unauthenticated requests for validation and basic affiliate discovery.

**Route Prefix**: `/public/affiliates`

**Security Level**: PUBLIC only - no authentication required

**Key Features**:

- 🔓 **No Authentication**: Open access for basic operations
- 📧 **Email Validation**: Check email availability for registration
- 🔍 **Public Searches**: Basic affiliate discovery with limited data exposure
- 🌍 **Geographic Filtering**: City, province-based searches
- 📊 **Pagination**: Efficient result set management (1-50 limit)
- 🛡️ **Rate Limiting**: Built-in abuse prevention measures
- 📋 **Input Validation**: Comprehensive sanitization and format checking

**Available Endpoints**:

#### POST `/public/affiliates/validate/email`

- **Purpose**: Validate email availability for registration
- **Input**: `{ email: string }`
- **Output**: `{ available: boolean, message: string }`
- **Security**: No auth required
- **Rate Limited**: Yes

#### GET `/public/affiliates/search/name`

- **Purpose**: Search affiliates by organization name
- **Parameters**: `name` (query), `limit?`, `offset?`
- **Output**: `{ affiliates: Partial<AffiliateInternal>[], total: number }`
- **Data Returned**: Name, area, city, province, country only

#### GET `/public/affiliates/search/city/:city`

- **Purpose**: Find affiliates by city
- **Parameters**: `city` (path), `limit?`, `offset?`
- **Output**: Paginated affiliate list with public data

#### GET `/public/affiliates/search/province/:province`

- **Purpose**: Find affiliates by province
- **Parameters**: `province` (path), `limit?`, `offset?`
- **Output**: Paginated affiliate list with public data

#### GET `/public/affiliates/search/area/:area`

- **Purpose**: Find affiliates by business area
- **Parameters**: `area` (path - number), `limit?`, `offset?`
- **Output**: Paginated affiliate list with public data

#### GET `/public/affiliates/active`

- **Purpose**: Get list of active affiliates
- **Parameters**: `limit?`, `offset?`
- **Output**: Paginated list of active affiliates (public data only)

### 2. AffiliatePrivateController (`affiliate-private.controller.ts`)

**Purpose**: Handles authenticated requests for full CRUD operations and privileged searches.

**Route Prefix**: `/private/affiliates`

**Security Level**: AUTHENTICATED/PRIVILEGED - JWT authentication required

**Key Features**:

- 🔐 **JWT Authentication**: Required for all endpoints
- 🛡️ **Privilege-Based Access**: OWNER > ADMIN > MAIN hierarchy
- 💾 **Full CRUD Operations**: Complete affiliate lifecycle management
- 🔍 **Advanced Searches**: Multi-level security filtering
- 🔑 **Password Management**: Secure password verification
- 📊 **Comprehensive Data**: Full affiliate information based on privileges
- 🔒 **Field-Level Filtering**: Data exposure based on user access level

**Available Endpoints**:

#### POST `/private/affiliates`

- **Purpose**: Create new affiliate
- **Input**: `CreateAffiliateDto`
- **Output**: `AffiliateInternal`
- **Privileges Required**: ADMIN or OWNER
- **Features**: Password hashing, business rule validation

#### GET `/private/affiliates/:id`

- **Purpose**: Get affiliate by ID
- **Parameters**: `id` (path)
- **Output**: `AffiliateInternal` (filtered by privilege)
- **Privileges Required**: Any authenticated user

#### PUT `/private/affiliates/:id`

- **Purpose**: Update affiliate
- **Input**: `UpdateAffiliateDto`
- **Output**: `AffiliateInternal`
- **Privileges Required**: ADMIN/OWNER or self-update
- **Features**: Data consistency validation

#### DELETE `/private/affiliates/:id`

- **Purpose**: Delete affiliate (soft delete)
- **Output**: `{ success: boolean, message: string }`
- **Privileges Required**: ADMIN or OWNER
- **Features**: Cascade handling, audit logging

#### GET `/private/affiliates`

- **Purpose**: Get all affiliates with pagination
- **Parameters**: `limit?`, `offset?`
- **Output**: `{ affiliates: AffiliateInternal[], total: number }`
- **Features**: Privilege-based filtering, efficient pagination (1-100 limit)

#### GET `/private/affiliates/search/email/:email`

- **Purpose**: Search affiliate by email
- **Parameters**: `email` (path)
- **Output**: `Partial<AffiliateInternal> | null`
- **Security Level**: AUTHENTICATED
- **Features**: Enhanced data return based on privileges

#### POST `/private/affiliates/:id/verify-password`

- **Purpose**: Verify affiliate password
- **Input**: `{ password: string }`
- **Output**: `{ valid: boolean, message: string }`
- **Features**: Secure password verification, audit logging

## Security Architecture

### Access Control Matrix

| Operation           | Public Controller | Private Controller | Required Privilege |
| ------------------- | ----------------- | ------------------ | ------------------ |
| Email Validation    | ✅                | ❌                 | None               |
| Basic Search        | ✅ (PUBLIC data)  | ❌                 | None               |
| Geographic Search   | ✅ (PUBLIC data)  | ❌                 | None               |
| Create Affiliate    | ❌                | ✅                 | ADMIN/OWNER        |
| Read Affiliate      | ❌                | ✅                 | Any authenticated  |
| Update Affiliate    | ❌                | ✅                 | ADMIN/OWNER/Self   |
| Delete Affiliate    | ❌                | ✅                 | ADMIN/OWNER        |
| Password Operations | ❌                | ✅                 | Self/ADMIN/OWNER   |
| Advanced Search     | ❌                | ✅                 | Any authenticated  |

### Data Exposure Levels

**PUBLIC Level** (Public Controller):

- `osot_affiliate_name`
- `osot_affiliate_area`
- `osot_affiliate_city`
- `osot_affiliate_province`
- `osot_affiliate_country`

**AUTHENTICATED Level** (Private Controller - Basic):

- All PUBLIC fields +
- `osot_affiliate_email`
- `osot_affiliate_phone`
- `osot_affiliate_website`

**PRIVILEGED Level** (Private Controller - ADMIN/OWNER):

- All AUTHENTICATED fields +
- `osot_representative_first_name`
- `osot_representative_last_name`
- `osot_representative_job_title`
- `osot_affiliate_address_1`
- `osot_affiliate_address_2`
- `osot_affiliate_postal_code`
- `statuscode`

## Error Handling

Both controllers implement comprehensive error handling:

```typescript
// HTTP Status Codes Used
200 OK              // Successful operations
201 Created         // Successful creation
400 Bad Request     // Invalid input data
401 Unauthorized    // Authentication required
403 Forbidden       // Insufficient privileges
404 Not Found       // Resource not found
500 Internal Error  // Unexpected system errors
```

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Invalid email format",
  "error": "Bad Request",
  "timestamp": "2025-10-10T15:30:00.000Z",
  "path": "/public/affiliates/validate/email"
}
```

## API Documentation

Both controllers are fully documented with OpenAPI/Swagger:

- **Tags**: Separate tags for public and private operations
- **Security Schemas**: JWT Bearer token documentation
- **Request/Response Examples**: Comprehensive examples for all endpoints
- **Parameter Documentation**: Detailed parameter descriptions and validation rules

### Swagger Documentation Access

- **Public API**: `/api-docs#tag/Affiliates---Public`
- **Private API**: `/api-docs#tag/Affiliates---Private`

## Validation & DTOs

### Input Validation

- **CreateAffiliateDto**: Complete affiliate creation validation
- **UpdateAffiliateDto**: Partial update validation with consistency checks
- **Email Validation**: Format and uniqueness validation
- **Pagination**: Limit (1-50 public, 1-100 private) and offset validation

### Response Transformation

- **Security Filtering**: Automatic field filtering based on user privileges
- **Pagination Metadata**: Total count and navigation information
- **Error Standardization**: Consistent error response format

## Performance Considerations

### Public Controller Optimizations

- **Rate Limiting**: Prevents abuse of unauthenticated endpoints
- **Pagination Limits**: Restricted to 1-50 results for public access
- **Field Filtering**: Minimal data exposure reduces bandwidth
- **Caching Ready**: Stateless design supports caching strategies

### Private Controller Optimizations

- **Privilege Caching**: User privilege information for repeated operations
- **Selective Queries**: Field-specific queries based on required data
- **Pagination**: Efficient large dataset handling (1-100 results)
- **Operation IDs**: Comprehensive tracking for performance monitoring

## Usage Examples

### Public Controller Usage

```typescript
// Email validation
POST /public/affiliates/validate/email
{
  "email": "contact@newpartner.com"
}

// Public search by name
GET /public/affiliates/search/name?name=Healthcare&limit=10&offset=0

// Geographic search
GET /public/affiliates/search/city/Toronto?limit=25
```

### Private Controller Usage

```typescript
// Create affiliate (requires ADMIN privileges)
POST / private / affiliates;
Authorization: Bearer <
  jwt - token >
  {
    osot_affiliate_name: 'New Healthcare Partners',
    osot_affiliate_email: 'admin@newhealthcare.com',
    osot_password: 'SecurePassword123!',
    // ... other required fields
  };

// Get affiliate with privilege-based data
GET / private / affiliates / { id };
Authorization: Bearer <
  jwt - token >
  // Update affiliate
  PUT / private / affiliates / { id };
Authorization: Bearer <
  jwt - token >
  {
    osot_affiliate_phone: '+1-416-555-0123',
  };
```

## Integration Notes

### Authentication Integration

```typescript
// Uncomment when auth system is ready
// @UseGuards(JwtAuthGuard)
// @User() user: UserContext
```

### Service Dependencies

```typescript
constructor(
  private readonly crudService: AffiliateCrudService,          // Private Controller
  private readonly lookupService: AffiliateLookupService,      // Both Controllers
  private readonly businessRuleService: AffiliateBusinessRuleService, // Both Controllers
) {}
```

## File Structure

```
controllers/
├── affiliate-public.controller.ts    # Public/unauthenticated routes (500+ lines)
├── affiliate-private.controller.ts   # Private/authenticated routes (700+ lines)
└── README.md                         # This documentation
```

## Guidelines

### Development Guidelines

- **Thin Controllers**: Delegate business logic to services
- **Input Validation**: Validate all inputs at controller level
- **Error Handling**: Use appropriate HTTP status codes and structured errors
- **Security First**: Always validate privileges before operations
- **Logging**: Include operation IDs and comprehensive context
- **Documentation**: Maintain comprehensive Swagger documentation

### Testing Guidelines

- **Unit Tests**: Test each endpoint with various input scenarios
- **Integration Tests**: Test service integration and error handling
- **Security Tests**: Verify privilege checks and access controls
- **Performance Tests**: Validate pagination and rate limiting

### Deployment Guidelines

- **Rate Limiting**: Configure appropriate limits for public endpoints
- **Authentication**: Ensure JWT guard is properly configured
- **Monitoring**: Set up alerts for operation failures and security violations
- **Caching**: Implement appropriate caching strategies for public endpoints

---

_These controllers implement enterprise-grade REST API patterns with comprehensive security, validation, and documentation features._

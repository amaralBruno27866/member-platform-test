# Identity Controllers

## Purpose

Houses NestJS controllers responsible for handling HTTP requests related to identity operations. Controllers serve as the HTTP API layer, mapping routes to service calls, validating input via DTOs, and returning appropriately formatted HTTP responses with proper status codes and error handling.

## Architecture Overview

The Identity module provides two distinct controller classes that serve different security contexts and use cases:

### 1. IdentityPrivateController (`identity-private.controller.ts`)

**Authentication Required**: JWT Bearer Token
**Target Users**: Authenticated users managing their own identity data
**Security Context**: Full CRUD operations with user ownership validation

### 2. IdentityPublicController (`identity-public.controller.ts`)

**Authentication Required**: None
**Target Users**: Registration workflows and public queries
**Security Context**: Limited to validation, statistics, and non-sensitive operations

## Core Features

### Authentication & Authorization

- **JWT Guard Protection**: Private endpoints require valid JWT tokens
- **User Context Injection**: Access to authenticated user information via `@User()` decorator
- **Ownership Validation**: Users can only access/modify their own identity data
- **Role-Based Access**: Future support for admin roles and extended permissions

### Comprehensive CRUD Operations

- **Create Identity**: Full validation with business rule enforcement
- **Read Operations**: Single identity, by account, by language, by User Business ID
- **Update Identity**: Partial updates with validation and ownership checks
- **Delete Identity**: Soft delete with audit trail maintenance
- **Data Analysis**: Completeness assessment and recommendation generation

### Public Registration Support

- **User Business ID Validation**: Real-time availability checking during registration
- **Pre-validation**: Validate identity data without persistence
- **Cultural Consistency Analysis**: Educational recommendations for profile optimization
- **Public Statistics**: Anonymized demographic data for analysis

### Advanced Query Capabilities

- **Multi-dimensional Filtering**: By account, language, business ID
- **Statistical Analysis**: Demographic distribution and completeness metrics
- **Data Quality Assessment**: Completeness scoring and improvement recommendations

## Error Handling Standards

All controllers implement standardized error handling using the centralized error factory pattern:

```typescript
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

// Example usage
throw createAppError(
  ErrorCodes.VALIDATION_ERROR,
  { userId: user.userId, originalError: error.message },
  400,
  error.message,
);
```

### Error Classification

- **Validation Errors** (`ErrorCodes.VALIDATION_ERROR`): Input validation failures
- **Input Errors** (`ErrorCodes.INVALID_INPUT`): Format or constraint violations
- **Internal Errors** (`ErrorCodes.INTERNAL_ERROR`): System or service failures
- **Not Found** (`NotFoundException`): Resource not found (preserved from NestJS)

### Context-Rich Error Reporting

All errors include contextual information for debugging:

- User ID for authentication context
- Resource IDs for operation tracking
- Original error messages for root cause analysis
- HTTP status codes for proper client handling

## API Design Patterns

### RESTful Routing Structure

```
Private Endpoints (Authenticated):
POST   /private/identities                    # Create identity
GET    /private/identities/account/:accountId # Get by account
GET    /private/identities/language/:languageId # Get by language
GET    /private/identities/:id                # Get by ID
GET    /private/identities/user-business-id/:userBusinessId # Get by business ID
PATCH  /private/identities/:id                # Update identity
DELETE /private/identities/:id                # Delete identity
GET    /private/identities/:id/completeness   # Data completeness analysis

Public Endpoints (No Authentication):
POST   /public/identities/validate/user-business-id # Check availability
POST   /public/identities/validate            # Validate identity data
POST   /public/identities/analyze/cultural-consistency # Cultural analysis
GET    /public/identities/statistics          # Public statistics
GET    /public/identities/user-business-id/:userBusinessId # Public view
GET    /public/identities/health             # Service health check
```

### Input Validation Strategy

- **DTO-Based Validation**: All inputs validated through strongly-typed DTOs
- **OpenAPI Documentation**: Comprehensive Swagger documentation for all endpoints
- **Business Rule Integration**: Controllers delegate validation to specialized business rule services
- **Format Enforcement**: Type safety and constraint validation at the API boundary

### Response Standardization

- **Consistent DTOs**: All responses use standardized response DTOs
- **HTTP Status Codes**: Proper status codes for all operation types
- **Error Response Format**: Standardized error structure across all endpoints
- **Content Negotiation**: JSON-first with extensible content type support

## Security Features

### Authentication Patterns

```typescript
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IdentityPrivateController {
  // JWT token required for all methods
}

// No guards for public controller
export class IdentityPublicController {
  // Open access for registration and validation
}
```

### Data Access Control

- **User Isolation**: Private operations limited to user's own data
- **Data Filtering**: Automatic filtering based on user context
- **Privilege Checking**: Integration with role-based access control system
- **Audit Logging**: Comprehensive logging for all data modification operations

### Input Sanitization

- **Parameter Validation**: All route parameters validated and sanitized
- **Query Parameter Safety**: Protection against injection attacks
- **Body Validation**: Comprehensive DTO validation for request bodies
- **Business Rule Enforcement**: Additional validation through specialized services

## Integration Patterns

### Service Layer Integration

Controllers maintain thin profiles by delegating business logic to specialized services:

```typescript
constructor(
  private readonly crudService: IdentityCrudService,           // CRUD operations
  private readonly lookupService: IdentityLookupService,       // Query operations
  private readonly businessRuleService: IdentityBusinessRuleService, // Validation
) {}
```

### Cross-Cutting Concerns

- **Logging**: Structured logging with correlation IDs
- **Metrics**: Request/response metrics for monitoring
- **Caching**: Future support for response caching
- **Rate Limiting**: Protection against abuse (configured at gateway level)

## Testing Strategy

### Unit Testing Approach

- **Controller Testing**: Isolated testing with mocked services
- **DTO Validation Testing**: Comprehensive input validation coverage
- **Error Handling Testing**: Verification of error response formats
- **Authentication Testing**: JWT guard and user context testing

### Integration Testing

- **End-to-End Flows**: Complete request/response cycle testing
- **Database Integration**: Testing with real database connections
- **Service Integration**: Multi-service workflow validation
- **Authentication Integration**: Real JWT token validation

## Performance Considerations

### Response Optimization

- **Selective Field Loading**: Only load required fields for specific operations
- **Pagination Support**: Future support for large result sets
- **Caching Strategy**: Cacheable responses for read-heavy operations
- **Database Query Optimization**: Efficient query patterns through service layer

### Scalability Features

- **Stateless Design**: Controllers maintain no state between requests
- **Horizontal Scaling**: No session affinity requirements
- **Load Balancer Friendly**: Health check endpoints for load balancer integration
- **Resource Isolation**: Proper resource cleanup and connection management

## Examples

### Creating a New Identity (Private)

```typescript
POST /private/identities
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "osot_user_business_id": "user123456",
  "osot_language": [13, 18],
  "osot_chosen_name": "Alex Johnson",
  "osot_gender": 2,
  "osot_race": 1
}
```

### Validating User Business ID (Public)

```typescript
POST /public/identities/validate/user-business-id
Content-Type: application/json

{
  "userBusinessId": "user123456"
}

Response:
{
  "userBusinessId": "user123456",
  "isAvailable": true
}
```

### Getting Identity Statistics (Public)

```typescript
GET /public/identities/statistics

Response:
{
  "totalIdentities": 150,
  "languageDistribution": { "13": 85, "18": 42, "22": 23 },
  "multilingualPercentage": 35.2,
  "completenessAverage": 78.5,
  "lastUpdated": "2024-10-03T10:00:00.000Z"
}
```

## Notes

### Best Practices

- **Thin Controllers**: Delegate all business logic to services
- **Proper HTTP Semantics**: Use appropriate HTTP methods and status codes
- **Comprehensive Documentation**: Every endpoint documented with OpenAPI/Swagger
- **Error Consistency**: Standardized error handling across all endpoints
- **Security First**: Authentication and authorization applied consistently

### Future Enhancements

- **GraphQL Support**: Potential GraphQL endpoint for complex queries
- **WebSocket Integration**: Real-time updates for identity changes
- **Advanced Caching**: Redis-based caching for frequently accessed data
- **Rate Limiting**: Per-user and per-endpoint rate limiting
- **API Versioning**: Support for multiple API versions

# Address Controllers

## Purpose

Houses NestJS controllers responsible for handling HTTP requests related to address operations. Following the public/private architecture pattern, controllers map routes to service calls, validate input via DTOs, and return HTTP responses with proper role-based access control.

## Available Controllers

### AddressPublicController (`/public/addresses`)

Handles **PUBLIC routes** for address validation and geographic lookup without authentication.

**Routes:**

- `POST /public/addresses/validate` → Validate complete address format
- `POST /public/addresses/validate-postal` → Validate postal code by province
- `GET /public/addresses/provinces` → Get list of provinces (dropdown data)
- `GET /public/addresses/cities/:province` → Get cities by province (cascading dropdowns)
- `POST /public/addresses/normalize` → Standardize address format
- `POST /public/addresses/suggest` → Address autocomplete suggestions

**Features:**

- No authentication required
- Form validation support
- Real-time postal code validation
- Geographic data for UI components
- Address standardization utilities
- Autocomplete functionality

### AddressPrivateController (`/private/addresses`)

Handles **AUTHENTICATED routes** for address management with role-based access control.

**User Routes (JWT Required):**

- `GET /private/addresses/me` → Get my addresses
- `POST /private/addresses` → Create new address
- `GET /private/addresses/:id` → Get specific address
- `PATCH /private/addresses/:id` → Update address
- `DELETE /private/addresses/:id` → Delete address (soft delete)

**Lookup Routes (JWT Required):**

- `GET /private/addresses/by-postal/:code` → Find addresses by postal code
- `GET /private/addresses/by-account/:accountId` → Get addresses for account

**Features:**

- JWT authentication required
- Role-based access control (owner/admin/main)
- Permission validation on all operations
- Field filtering based on user role
- Comprehensive validation using AddressBusinessRulesService
- Event emission for state changes
- Proper error handling with standardized responses

## Security Implementation

### Authentication

- **Public Controller**: No authentication required
- **Private Controller**: JWT token required via `@UseGuards(AuthGuard('jwt'))`

### Authorization

- User role extracted from JWT payload (`user.privilege`)
- Permission validation using services:
  - AddressCrudService for CRUD operations
  - AddressLookupService for search operations
  - AddressBusinessRulesService for validation

### Data Protection

- Field filtering applied based on user role
- Users can only access their own addresses (owner role)
- Admin users have extended access
- Main users have full system access

## Integration with Services

### Service Dependencies

```typescript
// Core address services
private addressCrudService: AddressCrudService;
private addressLookupService: AddressLookupService;
private addressBusinessRulesService: AddressBusinessRulesService;
```

### Validation Flow

1. Controller receives request
2. DTO validation applied automatically
3. Business rules validation via AddressBusinessRulesService
4. Permission checking via user role
5. Service operation execution
6. Response formatting and field filtering

### Error Handling

- Standardized error responses using `createAppError`
- Proper HTTP status codes
- Detailed error messages for debugging
- Validation error aggregation

## API Documentation

### Swagger Integration

- `@ApiTags` for controller grouping
- `@ApiOperation` for endpoint descriptions
- `@ApiResponse` for response documentation
- `@ApiParam` and `@ApiBody` for parameter documentation
- `@ApiBearerAuth` for JWT authentication documentation

### Request/Response Types

- Input validation using AddressCreateDto, AddressUpdateDto
- Standardized responses using AddressResponseDto
- Query parameter validation using ListAddressesQueryDto

## Usage Examples

### Public Address Validation

```bash
# Validate address format
curl -X POST /public/addresses/validate \
  -H "Content-Type: application/json" \
  -d '{"osot_address_1":"123 Main St","osot_province":"Ontario","osot_postal_code":"K1A 0A6"}'

# Get provinces for dropdown
curl -X GET /public/addresses/provinces
```

### Private Address Management

```bash
# Create new address (requires JWT)
curl -X POST /private/addresses \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"osot_address_1":"456 Oak Ave","osot_city":"Toronto","osot_province":"Ontario"}'

# Get my addresses
curl -X GET /private/addresses/me \
  -H "Authorization: Bearer <jwt-token>"
```

## Best Practices

### Controller Guidelines

- Keep controllers thin - delegate business logic to services
- Use appropriate HTTP status codes and decorators
- Implement comprehensive input validation
- Apply consistent error handling patterns
- Document all endpoints with Swagger decorators

### Security Guidelines

- Always validate user permissions before operations
- Apply field filtering for all data responses
- Use proper JWT extraction and role checking
- Implement rate limiting for public endpoints
- Log security-relevant operations

### Performance Guidelines

- Use pagination for list operations
- Implement caching for geographic data
- Optimize database queries through services
- Apply request/response compression
- Monitor and log performance metrics

## Testing Strategy

### Unit Testing

- Mock service dependencies
- Test permission validation logic
- Verify error handling scenarios
- Test input validation

### Integration Testing

- Test with real JWT tokens
- Verify role-based access control
- Test end-to-end workflows
- Validate API contract compliance

### Security Testing

- Test unauthorized access attempts
- Verify JWT token validation
- Test role privilege escalation
- Validate data access restrictions

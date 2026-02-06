# Contact Controllers

## Purpose

Houses NestJS controllers responsible for handling HTTP requests related to contact operations following the **public/private architecture pattern**. Controllers map routes to service calls, validate input via DTOs, implement role-based access control, and return standardized HTTP responses.

## Architecture Pattern

### Public/Private Controller Separation

The Contact module implements a **dual-controller pattern** for clear workflow separation:

#### **ContactPublicController** (`contact-public.controller.ts`)

- **Route Prefix**: `/public/contacts`
- **Authentication**: None required (public endpoints)
- **Purpose**: Registration workflows and utility functions
- **Features**:
  - Contact staging during registration
  - Contact validation without persistence
  - Social media profile validation
  - Business ID uniqueness checks
  - Contact data transformation and normalization

#### **ContactPrivateController** (`contact-private.controller.ts`)

- **Route Prefix**: `/contacts`
- **Authentication**: JWT required on all endpoints (`@UseGuards(JwtAuthGuard)`)
- **Purpose**: Authenticated user contact management
- **Features**:
  - Personal contact CRUD operations
  - Social media profile management
  - Professional networking queries
  - Communication preference management
  - Administrative bulk operations
  - Contact analytics and reporting

## Implemented Endpoints

### Public Endpoints (No Authentication)

| Method | Route                                            | Purpose                        | DTO                 |
| ------ | ------------------------------------------------ | ------------------------------ | ------------------- |
| `POST` | `/public/contacts/stage`                         | Stage contact for registration | `CreateContactDto`  |
| `POST` | `/public/contacts/validate`                      | Validate contact data          | `CreateContactDto`  |
| `POST` | `/public/contacts/persist/:stagingId`            | Persist staged contact         | Account binding     |
| `GET`  | `/public/contacts/check/business-id/:businessId` | Check business ID availability | -                   |
| `POST` | `/public/contacts/validate/social-media`         | Validate social media URLs     | Social media object |
| `GET`  | `/public/contacts/lookup/job-titles`             | Get popular job titles         | Query params        |
| `GET`  | `/public/contacts/health`                        | Public service health check    | -                   |
| `GET`  | `/public/contacts/info`                          | Service capabilities info      | -                   |

### Private Endpoints (JWT Authentication Required)

| Method   | Route                           | Purpose                        | DTO                    |
| -------- | ------------------------------- | ------------------------------ | ---------------------- |
| `GET`    | `/contacts/me`                  | Get my contacts                | `ListContactsQueryDto` |
| `POST`   | `/contacts/me`                  | Create new contact             | `CreateContactDto`     |
| `PUT`    | `/contacts/me/:contactId`       | Update my contact              | `UpdateContactDto`     |
| `DELETE` | `/contacts/me/:contactId`       | Delete my contact              | -                      |
| `POST`   | `/contacts/validate`            | Validate contact data          | `CreateContactDto`     |
| `GET`    | `/contacts/lookup/job-titles`   | Get job title statistics       | -                      |
| `GET`    | `/contacts/lookup/social-media` | Get contacts with social media | Query params           |
| `GET`    | `/contacts/admin/all`           | [ADMIN] Get all contacts       | Query params           |
| `GET`    | `/contacts/admin/analytics`     | [ADMIN] Get contact analytics  | -                      |
| `GET`    | `/contacts/health`              | Contact service health check   | -                      |
| `GET`    | `/contacts/me/summary`          | Get my contact summary         | -                      |

## Integration with Project Standards

### ✅ Error Handling (`#file:errors`)

- **Private Controller**: Uses `createAppError`, `ErrorCodes`, `AppError`
- **Public Controller**: Returns structured response objects with `success: boolean`
- **Standardized Responses**: Consistent error format across all endpoints

### ✅ Authentication & Authorization (`#file:utils`)

- **User Decorator**: Uses `@User('userId')` and `@User()` pattern
- **Permission Validation**: Checks for `userId` and `userBusinessId`
- **Role-Based Access**: Prepared for `canCreate`, `canRead`, `canWrite`, `canDelete` integration

### ✅ URL Sanitization (`#file:utils`)

- **Public Controller**: Uses `SocialMediaUrlFormatter` from contact utils
- **Centralized Logic**: Leverages `url-sanitizer.utils` through formatter layer
- **Platform Support**: Facebook, Instagram, TikTok, LinkedIn validation

### ✅ Business Logic Delegation

- **Thin Controllers**: All business logic delegated to service layer
- **Service Integration**: `ContactCrudService`, `ContactLookupService`, `ContactBusinessRuleService`
- **Event-Driven**: Services handle event emission and workflow coordination

## Response Patterns

### Public Controller Responses

```typescript
// Success response
{
  success: true,
  data: { ... },
  message: "Operation completed successfully"
}

// Error response
{
  success: false,
  data: { errors: [...] },
  message: "Operation failed"
}
```

### Private Controller Responses

```typescript
// Success response
{
  success: true,
  data: { ... },
  meta?: { totalCount, hasMore, limit },
  message: "Operation completed successfully"
}

// Error handling via createAppError exceptions
```

## Validation Strategy

### Input Validation

- **DTO Validation**: Class-validator decorators on all DTOs
- **Business Rule Validation**: Delegated to `ContactBusinessRuleService`
- **Permission Validation**: User context and ownership checks

### Output Filtering

- **Role-Based Fields**: Response data filtered based on user role
- **Security**: Sensitive fields excluded from public responses
- **Consistency**: Standardized response structure across endpoints

## Administrative Features

### Role-Based Access Control

- **Admin Endpoints**: Prefixed with `/admin/` for clarity
- **Permission Checks**: Prepared for role validation implementation
- **System-Wide Operations**: Analytics and bulk operations for administrators

### Health Monitoring

- **Health Checks**: Both public and private health endpoints
- **Service Info**: Capabilities and limitations documentation
- **Operational Status**: Real-time service status reporting

## Development Guidelines

### Controller Best Practices

- **Thin Controllers**: Delegate all business logic to services
- **Consistent Patterns**: Follow established public/private patterns
- **Error Handling**: Use project-standard error management
- **Documentation**: Comprehensive Swagger/OpenAPI documentation

### Security Considerations

- **Authentication**: JWT validation on private endpoints
- **Authorization**: User context validation and ownership checks
- **Input Sanitization**: All inputs validated and sanitized
- **Rate Limiting**: Prepared for implementation via guards

### Testing Strategy

- **Unit Testing**: Controller logic with mocked services
- **Integration Testing**: End-to-end endpoint testing
- **Authentication Testing**: JWT validation and role checking
- **Error Handling Testing**: Comprehensive error scenario coverage

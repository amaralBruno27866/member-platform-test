# Contact API - Public/Private Architecture

## Overview

Contact management follows the public/private controller pattern with role-based access control and registration workflow support:

- **Public Controller**: Contact validation, staging, and business ID checks (no auth required)
- **Private Controller**: Contact CRUD operations and social media management (JWT auth required)

## Public Routes (`/public/contacts`)

### Registration Workflow and Validation

These routes provide utility functions for contact validation, staging, and business operations without requiring authentication:

| Route                                         | Method | Purpose                        | Usage                     |
| --------------------------------------------- | ------ | ------------------------------ | ------------------------- |
| `POST /public/contacts/stage`                 | POST   | Stage contact for registration | Registration workflow     |
| `POST /public/contacts/validate`              | POST   | Validate contact data          | Form validation           |
| `POST /public/contacts/persist/:stagingId`    | POST   | Persist staged contact         | Complete registration     |
| `GET /public/contacts/check/business-id/:id`  | GET    | Check business ID availability | Real-time validation      |
| `POST /public/contacts/validate/social-media` | POST   | Validate social media URLs     | Social profile validation |
| `GET /public/contacts/lookup/job-titles`      | GET    | Get popular job titles         | Autocomplete assistance   |
| `GET /public/contacts/health`                 | GET    | Public service health check    | System monitoring         |
| `GET /public/contacts/info`                   | GET    | Service capabilities info      | API documentation         |

### Public Features

```
1. Contact staging → Temporary storage during registration workflow
2. Business ID validation → Uniqueness checks for user business identifiers
3. Social media validation → URL normalization and platform validation
4. Job title lookup → Popular titles for autocomplete functionality
5. Contact validation → Business rules without data persistence
```

## Private Routes (`/contacts`)

### User Contact Management

| Route                      | Method | Auth | Purpose                |
| -------------------------- | ------ | ---- | ---------------------- |
| `GET /contacts/me`         | GET    | JWT  | Get my contacts        |
| `POST /contacts/me`        | POST   | JWT  | Create new contact     |
| `PUT /contacts/me/:id`     | PUT    | JWT  | Update my contact      |
| `DELETE /contacts/me/:id`  | DELETE | JWT  | Delete my contact      |
| `POST /contacts/validate`  | POST   | JWT  | Validate contact data  |
| `GET /contacts/me/summary` | GET    | JWT  | Get my contact summary |

### Lookup and Analytics Operations

| Route                               | Method | Auth | Purpose                        |
| ----------------------------------- | ------ | ---- | ------------------------------ |
| `GET /contacts/lookup/job-titles`   | GET    | JWT  | Get job title statistics       |
| `GET /contacts/lookup/social-media` | GET    | JWT  | Get contacts with social media |
| `GET /contacts/admin/all`           | GET    | JWT  | [ADMIN] Get all contacts       |
| `GET /contacts/admin/analytics`     | GET    | JWT  | [ADMIN] Get contact analytics  |
| `GET /contacts/health`              | GET    | JWT  | Contact service health check   |

## Role-Based Access Control

### Permission Levels

```typescript
// User roles determine data access and field visibility
export enum UserRole {
  OWNER = 'owner',     // Own contacts only
  ADMIN = 'admin',     // Extended access
  MAIN = 'main'        // Full system access
}

// Field filtering by role
- OWNER: Basic contact fields, social media profiles, communication data
- ADMIN: Extended fields, system metadata, user analytics
- MAIN: All fields including internal identifiers and audit data
```

### Security Features

1. **JWT Authentication**: All private routes require valid JWT
2. **User Context**: User ID and business ID extracted from JWT payload
3. **Ownership Validation**: Users can only access their own contacts
4. **Permission Checks**: CRUD operations validate user permissions
5. **Data Isolation**: Contact data isolated by user business ID

## Service Integration

### Contact Services Usage

```typescript
// Controller delegates to appropriate service layer
private contactCrudService: ContactCrudService;
private contactLookupService: ContactLookupService;
private contactBusinessRuleService: ContactBusinessRuleService;

// Permission-aware operations
const contacts = await this.contactCrudService.list(queryWithAccount);
const validation = await this.contactBusinessRuleService.validateCreateContact(contactData);
const stats = await this.contactLookupService.getJobTitleStats(userBusinessId);
```

### Response Structure

```typescript
// Consistent API responses
interface ContactResponse {
  success: boolean;
  data?: ContactResponseDto | ContactResponseDto[];
  message?: string;
  errors?: ValidationError[];
  meta?: {
    totalCount?: number;
    hasMore?: boolean;
    limit?: number;
  };
}
```

## Registration Workflow Integration

### Contact Staging Process

```typescript
// 1. Stage contact during registration
POST /public/contacts/stage
{
  "osot_user_business_id": "USER001",
  "osot_secondary_email": "user@example.com",
  "osot_home_phone": "+1234567890",
  "osot_facebook": "facebook.com/user",
  // ... other contact fields
}

// Response includes staging ID and validation summary
{
  "success": true,
  "data": {
    "stagingId": "stage_1234567890_abc123",
    "normalizedData": { ... },
    "validationSummary": { ... },
    "expiresAt": "2024-01-01T13:00:00.000Z"
  }
}
```

### Contact Persistence After Account Creation

```typescript
// 2. Persist staged contact after account creation
POST /public/contacts/persist/stage_1234567890_abc123
{
  "accountId": "account-guid-here",
  "finalizeData": { ... }
}

// Automatic OData binding
const contact = await this.contactCrudService.create({
  ...stagedData,
  'osot_Table_Account@odata.bind': `/osot_table_accounts(${accountId})`
});
```

## Social Media Integration

### URL Validation and Normalization

```typescript
// Social media validation using centralized formatter
POST /public/contacts/validate/social-media
{
  "facebook": "facebook.com/user",
  "instagram": "@user",
  "linkedin": "linkedin.com/in/user",
  "tiktok": "@user"
}

// Normalized response using SocialMediaUrlFormatter
{
  "success": true,
  "data": {
    "originalUrls": { ... },
    "normalizedUrls": {
      "facebook": "https://facebook.com/user",
      "instagram": "https://instagram.com/user",
      "linkedin": "https://linkedin.com/in/user",
      "tiktok": "https://tiktok.com/@user"
    },
    "validationSummary": { ... }
  }
}
```

### Supported Platforms

- **Facebook**: Profile validation and URL normalization
- **Instagram**: Handle and URL processing
- **LinkedIn**: Professional profile validation
- **TikTok**: Creator profile management

## Business ID Management

### Uniqueness Validation

```typescript
// Check business ID availability
GET /public/contacts/check/business-id/USER001

// Response includes availability and suggestions
{
  "success": true,
  "data": {
    "businessId": "USER001",
    "isAvailable": false,
    "exists": true,
    "suggestion": "USER001_abc4"
  }
}
```

## Analytics and Reporting

### Contact Statistics

```typescript
// Admin analytics endpoint
GET /contacts/admin/analytics

// Comprehensive contact analytics
{
  "success": true,
  "data": {
    "overview": {
      "totalContacts": 1500,
      "contactsWithSocialMedia": 850,
      "contactsWithEmail": 1200,
      "contactsWithPhone": 900
    },
    "systemHealth": {
      "socialMediaAdoption": 56.7,
      "contactabilityScore": 85.3
    }
  }
}
```

### Personal Contact Summary

```typescript
// User contact summary
GET /contacts/me/summary

// Personal statistics and insights
{
  "success": true,
  "data": {
    "totalContacts": 5,
    "withSocialMedia": 3,
    "withEmail": 4,
    "withPhone": 5,
    "withWebsite": 2,
    "topJobTitles": [...]
  }
}
```

## Error Handling Strategy

### Public Routes Error Handling

```typescript
// Public routes return structured objects
{
  "success": false,
  "data": {
    "errors": ["Business ID already exists"],
    "validationSummary": { ... }
  },
  "message": "Contact validation failed"
}
```

### Private Routes Error Handling

```typescript
// Private routes use centralized error system
throw createAppError(
  ErrorCodes.PERMISSION_DENIED,
  {
    reason: 'missing_user_id',
  },
  401,
);

throw createAppError(
  ErrorCodes.NOT_FOUND,
  {
    resource: 'Contact',
    id: contactId,
  },
  404,
);
```

## Validation Strategy

### Public Routes

- Schema validation using DTOs
- Business rule validation via services
- Social media URL normalization
- No data persistence (staging only)
- Format standardization

### Private Routes

- JWT authentication required
- User context validation
- Ownership verification
- Data persistence with audit trail
- Event emission for state changes

## Benefits of This Architecture

1. **Registration Workflow**: Seamless integration with user registration process
2. **Social Media Focus**: Comprehensive social platform integration
3. **Business ID Management**: Unique identifier system for professional networking
4. **Security First**: Role-based access control throughout
5. **Analytics Ready**: Built-in reporting and statistics
6. **Developer Experience**: Consistent API patterns and responses
7. **Scalable Design**: Service layer separation for maintainability
8. **Real-time Validation**: Instant feedback for form validation

## Integration Patterns

### With Account Module

```typescript
// Contact creation linked to account
POST /contacts/me
{
  "osot_user_business_id": "USER001",
  "osot_secondary_email": "user@example.com",
  // ... contact data
}

// Automatic relationship binding
'osot_Table_Account@odata.bind': `/osot_table_accounts(${userBusinessId})`
```

### With Registration Orchestrator

```typescript
// Contact staging in registration flow
const stagingResult = await fetch('/public/contacts/stage', {
  method: 'POST',
  body: JSON.stringify(contactData),
});

// Contact persistence after account approval
const contact = await fetch(`/public/contacts/persist/${stagingId}`, {
  method: 'POST',
  body: JSON.stringify({ accountId, finalizeData }),
});
```

## Module Registration

```typescript
// In contact.module.ts
@Module({
  controllers: [ContactPublicController, ContactPrivateController],
  providers: [
    ContactCrudService,
    ContactLookupService,
    ContactBusinessRuleService,
    // ... other providers
  ],
})
export class ContactModule {}
```

## Testing Strategy

### Route Testing

- **Public routes**: No authentication headers needed
- **Private routes**: Valid JWT token required with user context
- **Role testing**: Different user privileges for access control
- **Integration testing**: End-to-end contact workflows
- **Social media testing**: URL validation and normalization
- **Registration testing**: Complete staging and persistence flow

## Migration and Deployment

### Next Steps

1. ✅ Implement controllers following this architecture
2. ✅ Add comprehensive input validation
3. ✅ Integrate with centralized error handling
4. ✅ Implement social media URL formatting
5. ⏳ Create integration tests for both controller types
6. ⏳ Document API endpoints with Swagger
7. ⏳ Integrate with registration orchestrator
8. ⏳ Add rate limiting and performance monitoring

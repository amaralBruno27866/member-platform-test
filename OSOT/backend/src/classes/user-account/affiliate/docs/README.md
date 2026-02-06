# Affiliate Module Documentation

## Overview

The Affiliate module provides comprehensive functionality for managing affiliate organization records within the OSOT Dataverse API. This module implements a sophisticated dual-controller architecture with orchestrator-based workflow coordination, following enterprise-grade patterns for scalability, maintainability, and security.

## Architecture

### Core Design Principles

- **Dual-Controller Architecture**: Separate public and private API endpoints
- **Service Layer Pattern**: Modular business logic organization (Business Rules, CRUD, Lookup)
- **Orchestrator Pattern**: Complex workflow coordination with session management (specifications)
- **Validation-First Approach**: Multi-layer validation with business rule enforcement
- **Security-By-Design**: Three-tier access control with privilege-based filtering
- **Event-Driven Architecture**: Comprehensive audit trail and notification system

### Module Structure

```
affiliate/
├── constants/          # Shared configuration and enums
├── controllers/        # API endpoints (Public & Private)
├── docs/              # Documentation and architectural notes
├── dtos/              # Data Transfer Objects
├── events/            # Event handling and audit trail
├── interfaces/        # Type definitions and contracts
├── mappers/           # Data transformation utilities
├── modules/           # NestJS module configuration
├── orchestrator/      # Workflow coordination specifications
├── repositories/      # Data access layer
├── services/          # Business logic layer
├── utils/             # Utility functions and business logic helpers
├── validators/        # Custom validation decorators (21 validators)
└── index.ts          # Centralized exports
```

## Key Features

### 1. Public API Endpoints (Unauthenticated)

- **Organization Registration**: Complete affiliate registration workflow
- **Email-Based Search**: Lookup affiliates by email address
- **Organization Name Search**: Find affiliates by organization name
- **Area-Based Search**: Search by business area categories
- **Geographic Search**: Location-based affiliate discovery
- **Public Listings**: Basic affiliate information without sensitive data

### 2. Private API Endpoints (JWT + Role-Based)

- **Complete CRUD Operations**: Full lifecycle management of affiliate records
- **Privilege-Based Access Control**: OWNER > ADMIN > MAIN user hierarchy enforcement
- **Advanced Search Operations**: Complex filtering with administrative privileges
- **Bulk Operations**: Efficient handling of multiple records
- **Administrative Functions**: System management and maintenance operations
- **Sensitive Data Access**: Full affiliate information including personal details

### 3. Orchestrator Workflow System (Specifications)

- **Session Management**: Redis-based session storage with expiration
- **Multi-Step Registration**: Coordinated validation across service layers
- **Email Verification**: Secure email confirmation workflows
- **Admin Approval Process**: Administrative review and approval workflows
- **Account Creation**: Seamless transition from registration to active account
- **Error Recovery**: Comprehensive error handling and workflow rollback capabilities

## API Documentation

### Public Controller Endpoints

#### Registration and Lookup

```typescript
// Complete Affiliate Registration
POST /api/affiliate/register
{
  "organizationName": "Healthcare Solutions Inc",
  "email": "contact@healthcaresolutions.com",
  "password": "SecurePass123!",
  "area": 1, // Healthcare area
  "city": "Toronto",
  "province": "Ontario",
  "country": "Canada",
  "representativeName": "John Smith",
  "representativeJobTitle": "Business Development Manager",
  "website": "https://healthcaresolutions.com",
  "phone": "+1-416-555-0123"
}

// Email-Based Search
GET /api/affiliate/search/{email}

// Organization Name Search
GET /api/affiliate/search/name/{organizationName}

// Business Area Search
GET /api/affiliate/search/area/{areaId}

// Geographic Search
GET /api/affiliate/search/geo?city={city}&province={province}&country={country}

// Public Listings
GET /api/affiliate/list?page={page}&limit={limit}&sortBy={field}
```

### Private Controller Endpoints

#### Administrative CRUD Operations

```typescript
// Create Affiliate (Admin)
POST /api/private/affiliate
Authorization: Bearer {jwt_token}
{
  "organizationName": "Enterprise Corp",
  "email": "admin@enterprise.com",
  "area": 2,
  "city": "Vancouver",
  "province": "British Columbia",
  "country": "Canada",
  "accessModifier": "PRIVATE",
  "privilege": "MAIN"
}

// Get Affiliate by ID
GET /api/private/affiliate/{affiliateId}
Authorization: Bearer {jwt_token}

// Update Affiliate
PUT /api/private/affiliate/{affiliateId}
Authorization: Bearer {jwt_token}
{
  "organizationName": "Updated Enterprise Corp",
  "website": "https://updated-enterprise.com"
}

// Delete Affiliate
DELETE /api/private/affiliate/{affiliateId}
Authorization: Bearer {jwt_token}

// Advanced Search
GET /api/private/affiliate/search/advanced?filters={complexFilters}
Authorization: Bearer {jwt_token}

// Admin Lookup
GET /api/private/affiliate/lookup/{email}
Authorization: Bearer {jwt_token}

// Bulk Operations
POST /api/private/affiliate/bulk
Authorization: Bearer {jwt_token}
{
  "operation": "create",
  "records": [/* array of affiliate records */]
}
```

## Orchestrator Workflow (Specifications)

### Session-Based Registration Process

The orchestrator specifications define the complete registration workflow:

1. **Stage Registration Data**

   ```typescript
   POST /orchestrator/stage
   {
     "organizationName": "TechCorp Solutions",
     "email": "contact@techcorp.com",
     "password": "SecurePass123!",
     "area": 6, // IT & Software
     "city": "Calgary",
     "province": "Alberta",
     "country": "Canada",
     "options": {
       "expirationHours": 24,
       "requireEmailVerification": true,
       "requireAdminApproval": true
     }
   }
   ```

2. **Email Verification**

   ```typescript
   POST /orchestrator/verify-email/{sessionId}
   {
     "verificationToken": "abc123xyz789"
   }
   ```

3. **Admin Approval Process**

   ```typescript
   POST /orchestrator/admin-approval/{sessionId}
   Authorization: Bearer {admin_jwt_token}
   {
     "approved": true,
     "adminNotes": "Organization verified and approved",
     "processedBy": "admin-user-id"
   }
   ```

4. **Account Creation**

   ```typescript
   POST / orchestrator / create - account / { sessionId };
   // Automatically triggered after approval
   ```

5. **Workflow Completion**
   ```typescript
   POST / orchestrator / complete / { sessionId };
   // Cleanup session and finalize registration
   ```

### Session Status Monitoring

```typescript
// Get Session Status
GET /orchestrator/session/{sessionId}

// List Organization Sessions
GET /orchestrator/sessions?email={email}&status={status}

// Session Progress Tracking
GET /orchestrator/progress/{sessionId}
```

## Business Rules and Validation

### Email Uniqueness Validation

The system ensures email addresses are unique across all affiliate organizations:

- **Real-time Validation**: Immediate feedback during registration
- **Cross-System Check**: Validates against all user account domains
- **Conflict Resolution**: Identifies existing records with duplicate emails
- **Integration Points**: Coordinated with business rule service

### Organization Data Validation

Comprehensive validation of affiliate organization information:

- **Organization Name**: 2-100 characters, required, uniqueness validation
- **Business Area**: Valid area code from predefined categories
- **Contact Information**: Email format, phone validation, website URL validation
- **Representative Data**: First/last name, job title validation

### Geographic Data Validation

Validates location information for accuracy and consistency:

- **Address Validation**: Complete address requirements with geographic consistency
- **Postal Code**: Country-specific format validation (Canada/US)
- **Province/State**: Alignment with selected country
- **City Validation**: Geographic consistency checks

### Password Security Validation

Enterprise-grade password security enforcement:

- **Complexity Requirements**: Minimum 8 characters with mixed case, numbers, symbols
- **Policy Enforcement**: Configurable password policies
- **Secure Hashing**: Argon2 hashing with unique salt generation
- **Password Confirmation**: Matching validation during registration

## Data Models

### Core Affiliate Record

```typescript
interface AffiliateInternal {
  id: string;
  organizationName: string;
  email: string;
  area: number;
  city: string;
  province: string;
  country: string;
  representativeFirstName?: string;
  representativeLastName?: string;
  representativeJobTitle?: string;
  website?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  privilege: Privilege;
  accessModifier: AccessModifier;
  accountStatus: AffiliateAccountStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
}
```

### Session Management (Orchestrator Specifications)

```typescript
interface AffiliateRegistrationSessionDto {
  sessionId: string;
  status: AffiliateRegistrationStatus;
  progress: AffiliateProgressState;
  affiliateData: AffiliateOrganizationData;
  hashedPassword: string;
  verificationToken: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  emailResendAttempts: number;
  adminApprovalData?: AdminApprovalData;
  createdAffiliateId?: string;
}

interface AffiliateProgressState {
  staged: boolean;
  emailVerified: boolean;
  adminApproval: boolean;
  accountCreated: boolean;
  workflowCompleted: boolean;
}
```

## Service Layer Architecture

### Core Services

#### AffiliateBusinessRuleService (530+ lines)

- **Purpose**: Business logic validation and rule enforcement
- **Key Methods**:
  - `validateAffiliateCreation()`: Complete organization validation
  - `validateEmailUniqueness()`: Email uniqueness across system
  - `hashAffiliatePassword()`: Secure password hashing
  - `validatePrivilegeAssignment()`: Privilege hierarchy validation
- **Rule Engine**: Flexible rule configuration and execution
- **Integration**: Coordinates with DataverseService and external validators

#### AffiliateCrudService (700+ lines)

- **Purpose**: Full lifecycle management of affiliate records
- **Key Methods**:
  - `create()`: Create new affiliate with business rule validation
  - `findById()`: Retrieve affiliate by ID with privilege filtering
  - `update()`: Update affiliate with change tracking
  - `delete()`: Soft delete with relationship management
  - `findAll()`: List affiliates with pagination and filtering
- **Security Integration**: Privilege-based access control
- **Audit Trail**: Complete operation logging

#### AffiliateLookupService (1600+ lines)

- **Purpose**: Specialized query operations and search functionality
- **Key Methods**:
  - `findByEmail()`: Email-based affiliate lookup
  - `searchByName()`: Organization name search with fuzzy matching
  - `searchByArea()`: Business area categorical search
  - `searchByGeography()`: Location-based search
  - `getPublicList()`: Public affiliate listings
- **Performance**: Optimized for read-heavy operations
- **Search Features**: Advanced filtering, sorting, pagination

### Supporting Services

#### AffiliateRepositoryService

- **Purpose**: Data access layer abstraction following repository pattern
- **Pattern**: Clean separation between business logic and data access
- **Database**: Dataverse integration with optimized queries
- **Connection Management**: Efficient connection pooling and error recovery

#### AffiliateEventsService

- **Purpose**: Event-driven architecture and comprehensive audit trail
- **Event Types**: AffiliateCreated, AffiliateUpdated, AffiliateDeleted, ValidationFailed
- **Async Processing**: Non-blocking event publication
- **Audit Compliance**: Complete operation logging for regulatory compliance

#### AffiliateSessionService (Orchestrator Specifications)

- **Purpose**: Workflow coordination and session management (demonstration)
- **Session Storage**: Redis-based with configurable expiration
- **State Management**: Complex workflow state transitions
- **Integration Patterns**: Shows how to integrate with affiliate services

## Integration Points

### External Dependencies

- **DataverseModule**: Microsoft Dataverse integration for data persistence
- **RedisService**: Session storage and caching (orchestrator specifications)
- **EmailService**: Email verification and notification workflows
- **Common Enums**: Shared enumeration definitions (Privilege, Country, Province)
- **Error Factory**: Structured error handling and logging
- **Authentication**: JWT-based authentication with role validation

### Internal Dependencies

- **Repository Layer**: Clean data access abstraction
- **Event System**: Audit trail and notification capabilities
- **Validation Layer**: 21 custom validators with business rules
- **Mapper Layer**: 7 data transformation functions between layers

## Security Considerations

### Authentication and Authorization

- **JWT Tokens**: Secure token-based authentication
- **Three-Tier Access Control**: PUBLIC → AUTHENTICATED → PRIVILEGED
- **Privilege Hierarchy**: OWNER > ADMIN > MAIN user roles
- **Field-Level Security**: Sensitive data protection based on user privileges

### Data Protection

- **Access Modifiers**: PRIVATE, PUBLIC, RESTRICTED data visibility
- **Sensitive Data Filtering**: Representative personal information protection
- **Password Security**: Argon2 hashing with unique salt generation
- **Audit Trail**: Complete operation logging with user tracking

### Input Validation

- **Multi-Layer Validation**: Controller, service, and database level validation
- **Business Rule Enforcement**: Comprehensive business logic validation
- **Sanitization**: Input sanitization and XSS protection
- **Rate Limiting**: API endpoint protection against abuse

## Performance Optimization

### Caching Strategy

- **Service-Level Caching**: Frequently accessed data caching
- **Query Optimization**: Efficient database query patterns
- **Connection Pooling**: Optimized Dataverse connection management
- **Lazy Loading**: On-demand data loading for large datasets

### Scalability Features

- **Modular Architecture**: Independent service scaling
- **Asynchronous Processing**: Event-driven non-blocking operations
- **Repository Pattern**: Database abstraction for easy scaling
- **Pagination**: Efficient handling of large result sets

## Development Guidelines

### Code Organization

- **Single Responsibility**: Each service has a focused purpose
- **Dependency Injection**: Proper NestJS dependency management
- **Error Handling**: Structured error propagation and logging
- **Testing**: Comprehensive unit and integration test coverage

### Best Practices

- **Type Safety**: Full TypeScript type coverage with strict mode
- **Documentation**: Inline code documentation with JSDoc
- **Validation**: Input validation at all entry points
- **Logging**: Structured logging with correlation IDs
- **Security**: Security-first development approach

## Migration and Deployment

### Database Schema

- **Entity Definitions**: Complete Dataverse entity mapping
- **Relationship Management**: Foreign key constraints and relationships
- **Index Strategy**: Optimized indexing for search and query performance
- **Migration Scripts**: Versioned database migration management

### Environment Configuration

- **Configuration Management**: Environment-specific settings
- **Secret Management**: Secure credential and API key handling
- **Service Discovery**: Dynamic service registration
- **Health Checks**: Comprehensive service health monitoring

## Troubleshooting

### Common Issues

1. **Email Uniqueness Conflicts**: Check existing records and business rule validation
2. **Privilege Access Denied**: Verify user roles and privilege hierarchy
3. **Validation Failures**: Review business rule configuration and data quality
4. **Performance Issues**: Analyze query patterns and caching effectiveness
5. **Integration Errors**: Verify Dataverse connectivity and authentication

### Monitoring and Observability

- **Application Metrics**: Performance and usage monitoring
- **Error Tracking**: Comprehensive error logging and alerting
- **Audit Logs**: Complete operation audit trail
- **Performance Monitoring**: Response time and throughput tracking

## Version History

- **1.0.0**: Initial implementation with basic CRUD operations
- **1.1.0**: Added dual-controller architecture and advanced validation
- **1.2.0**: Implemented orchestrator specifications and session management
- **Future**: Planned Redis integration and advanced analytics

## API Examples

### Complete Registration Workflow (Using Orchestrator Specifications)

```typescript
// 1. Stage affiliate registration
const stageResponse = await fetch('/orchestrator/stage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organizationName: 'HealthTech Innovations',
    email: 'contact@healthtech.com',
    password: 'SecurePass123!',
    area: 1, // Healthcare
    city: 'Toronto',
    province: 'Ontario',
    country: 'Canada',
    representativeName: 'Sarah Johnson',
    representativeJobTitle: 'CEO',
  }),
});

const { sessionId } = await stageResponse.json();

// 2. Verify email (user receives email with token)
await fetch(`/orchestrator/verify-email/${sessionId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    verificationToken: 'email-verification-token-from-email',
  }),
});

// 3. Admin approval (administrative review)
await fetch(`/orchestrator/admin-approval/${sessionId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer admin-jwt-token',
  },
  body: JSON.stringify({
    approved: true,
    adminNotes: 'Organization verified and approved for membership',
    processedBy: 'admin-user-123',
  }),
});

// 4. Account creation (automatic after approval)
const createResponse = await fetch(
  `/orchestrator/create-account/${sessionId}`,
  {
    method: 'POST',
  },
);
const { createdAffiliateId } = await createResponse.json();

// 5. Complete workflow
await fetch(`/orchestrator/complete/${sessionId}`, {
  method: 'POST',
});
```

### Public Search Examples

```typescript
// Search by email
const emailSearch = await fetch('/api/affiliate/search/contact@healthcare.com');
const affiliate = await emailSearch.json();

// Search by organization name
const nameSearch = await fetch(
  '/api/affiliate/search/name/Healthcare Solutions',
);
const affiliates = await nameSearch.json();

// Geographic search
const geoSearch = await fetch(
  '/api/affiliate/search/geo?city=Toronto&province=Ontario',
);
const localAffiliates = await geoSearch.json();

// Business area search
const areaSearch = await fetch('/api/affiliate/search/area/1'); // Healthcare
const healthcareAffiliates = await areaSearch.json();
```

### Private Administrative Operations

```typescript
// Create affiliate (admin operation)
const createAffiliate = await fetch('/api/private/affiliate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer admin-jwt-token',
  },
  body: JSON.stringify({
    organizationName: 'Enterprise Healthcare',
    email: 'admin@enterprise-health.com',
    area: 1,
    privilege: 'ADMIN',
    accessModifier: 'PRIVATE',
  }),
});

// Advanced search with filters
const advancedSearch = await fetch(
  '/api/private/affiliate/search/advanced?area=1&province=Ontario&privilege=ADMIN',
  {
    headers: { Authorization: 'Bearer privileged-jwt-token' },
  },
);

// Bulk operations
const bulkCreate = await fetch('/api/private/affiliate/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer admin-jwt-token',
  },
  body: JSON.stringify({
    operation: 'create',
    records: [
      { organizationName: 'Bulk Affiliate 1', email: 'bulk1@example.com' },
      { organizationName: 'Bulk Affiliate 2', email: 'bulk2@example.com' },
    ],
  }),
});
```

## Support and Resources

- **Technical Documentation**: Complete API reference and integration guides
- **Architecture Decisions**: Documented architectural choices and trade-offs
- **Performance Guidelines**: Optimization recommendations and best practices
- **Security Protocols**: Security implementation and compliance guidelines
- **Orchestrator Specifications**: Complete workflow coordination documentation

For additional support or questions about the Affiliate module implementation, refer to the project's main documentation and architectural guidelines.

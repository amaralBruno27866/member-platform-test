# OTA Education Module Documentation

## Overview

The OTA Education module provides comprehensive functionality for managing Occupational Therapy Assistant (OTA) education records within the OSOT Dataverse API. This module implements a sophisticated dual-controller architecture with orchestrator-based workflow coordination, following enterprise-grade patterns for scalability, maintainability, and security.

## Architecture

### Core Design Principles

- **Dual-Controller Architecture**: Separate public and private API endpoints
- **Repository Pattern**: Clean separation between business logic and data access
- **Event-Driven Architecture**: Comprehensive audit trail and notification system
- **Orchestrator Pattern**: Complex workflow coordination with session management
- **Service Layer Pattern**: Modular business logic organization
- **Validation-First Approach**: Multi-layer validation with business rule enforcement

### Module Structure

```
ota-education/
├── constants/          # Shared configuration and enums
├── controllers/        # API endpoints (Public & Private)
├── docs/              # Documentation and architectural notes
├── dtos/              # Data Transfer Objects
├── events/            # Event handling and audit trail
├── interfaces/        # Type definitions and contracts
├── mappers/           # Data transformation utilities
├── modules/           # NestJS module configuration
├── orchestrator/      # Workflow coordination and session management
├── repositories/      # Data access layer
├── services/          # Business logic layer
├── utils/             # Utility functions and business logic helpers
├── validators/        # Custom validation decorators
└── index.ts          # Centralized exports
```

## Key Features

### 1. Public API Endpoints (Unauthenticated)

- **College-Country Validation**: Validates geographical alignment between colleges and countries
- **User Business ID Checking**: Ensures uniqueness across the system
- **Reference Data Lookup**: Provides educational reference information
- **Statistical Analytics**: Public educational data insights

### 2. Private API Endpoints (JWT + Role-Based)

- **Complete CRUD Operations**: Full lifecycle management of education records
- **Role-Based Access Control**: Owner, admin, and main user privilege enforcement
- **Advanced Statistics**: Comprehensive educational analytics and reporting
- **Bulk Operations**: Efficient handling of multiple records
- **Administrative Functions**: System management and maintenance operations

### 3. Orchestrator Workflow System

- **Session Management**: Redis-based session storage with expiration
- **Multi-Step Validation**: Coordinated validation across service layers
- **Account Linking**: Secure association between education records and user accounts
- **Category Determination**: Intelligent categorization based on graduation year and membership status
- **Error Recovery**: Comprehensive error handling and workflow rollback capabilities

## API Documentation

### Public Controller Endpoints

#### Validation Endpoints

```typescript
// College-Country Alignment Validation
POST /public/ota-educations/validate-college-country
{
  "college": "College of Health Sciences",
  "country": 1 // Canada
}

// User Business ID Uniqueness Check
GET /public/ota-educations/check-user-business-id/{userBusinessId}
```

#### Lookup Endpoints

```typescript
// Educational Statistics
GET / public / ota - education / statistics;

// Reference Data Lookup
GET / public / ota - education / lookup / { lookupType };
```

### Private Controller Endpoints

#### CRUD Operations

```typescript
// Create Education Record
POST /private/ota-education
{
  "userBusinessId": "user-123",
  "graduationYear": 2024,
  "university": 1,
  "country": 1,
  "degreeType": 2,
  "college": "College of Health Sciences",
  "accessModifier": "PRIVATE"
}

// Get Education Record
GET /private/ota-education/{id}

// Update Education Record
PATCH /private/ota-education/{id}
{
  "college": "Updated College Name"
}

// Delete Education Record
DELETE /private/ota-education/{id}
```

#### Administrative Operations

```typescript
// Advanced Statistics
GET /private/ota-education/admin/statistics

// Bulk Operations
POST /private/ota-education/admin/bulk-create
{
  "records": [/* array of education records */]
}
```

## Orchestrator Workflow

### Session-Based Registration Process

1. **Stage Education Data**

   ```typescript
   POST /orchestrator/stage
   {
     "userBusinessId": "user-123",
     "educationData": { /* education details */ },
     "options": {
       "expirationHours": 24,
       "priority": "normal"
     }
   }
   ```

2. **Validate Education Data**

   ```typescript
   POST / orchestrator / validate / { sessionId };
   ```

3. **Link to Account**

   ```typescript
   POST / orchestrator / link / { sessionId } / { accountId };
   ```

4. **Create Education Record**

   ```typescript
   POST / orchestrator / create / { sessionId };
   ```

5. **Complete Workflow**
   ```typescript
   POST / orchestrator / complete / { sessionId };
   ```

### Session Status Monitoring

```typescript
// Get Session Status
GET /orchestrator/session/{sessionId}

// List User Sessions
GET /orchestrator/sessions?userBusinessId={id}&status={status}
```

## Business Rules and Validation

### College-Country Alignment

The system validates that specified colleges are geographically consistent with selected countries:

- **Validation Logic**: Cross-references college names with country-specific educational institutions
- **Confidence Scoring**: Provides confidence levels (0-100) for alignment validation
- **Suggestion Engine**: Offers alternative college suggestions for misaligned combinations

### User Business ID Uniqueness

Ensures business IDs are unique across the entire system:

- **Real-time Validation**: Immediate feedback during data entry
- **Conflict Resolution**: Identifies existing records with duplicate IDs
- **Integration Points**: Validates against all user account domains

### University-Country Pairing

Validates that university and country combinations are valid:

- **Enum Validation**: Ensures university exists in specified country
- **Educational Standards**: Adheres to international educational recognition standards
- **Historical Data**: Considers historical university name changes and mergers

## Data Models

### Core Education Record

```typescript
interface OtaEducationRecord {
  id: string;
  userBusinessId: string;
  graduationYear: number;
  university: OtUniversity;
  country: Country;
  degreeType: DegreeType;
  college: string;
  accessModifier: AccessModifier;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
}
```

### Session Management

```typescript
interface OtaEducationRegistrationSession {
  sessionId: string;
  userBusinessId: string;
  status: OtaEducationRegistrationStatus;
  createdAt: string;
  lastUpdatedAt: string;
  expiresAt: string;
  educationData: OtaEducationSessionData;
  progress: OtaEducationProgressState;
  validation: OtaEducationValidationMetadata;
  linkedAccountId?: string;
  createdEducationId?: string;
}
```

## Service Layer Architecture

### Core Services

#### OtaEducationCrudService

- **Purpose**: Full lifecycle management of education records
- **Key Methods**: `create()`, `findById()`, `update()`, `delete()`, `findAll()`
- **Integration**: Coordinates with repository, business rules, and events services
- **Error Handling**: Comprehensive error management with structured logging

#### OtaEducationLookupService

- **Purpose**: Specialized query operations and analytics
- **Key Methods**: `getStatistics()`, `findByFilters()`, `getReferenceData()`
- **Performance**: Optimized for read-heavy operations
- **Caching**: Implements intelligent caching for frequently accessed data

#### OtaEducationBusinessRuleService

- **Purpose**: Business logic validation and rule enforcement
- **Key Methods**: `validateEducationRecord()`, `checkCollegeCountryAlignment()`, `validateUserBusinessId()`
- **Rule Engine**: Flexible rule configuration and execution
- **Integration**: Works with external validation services

### Supporting Services

#### OtaEducationRepositoryService

- **Purpose**: Data access layer abstraction
- **Pattern**: Repository pattern implementation
- **Database**: Dataverse integration with optimized queries
- **Connection Management**: Efficient connection pooling and error recovery

#### OtaEducationEventsService

- **Purpose**: Event-driven architecture and audit trail
- **Event Types**: Create, Update, Delete, Validation, Error events
- **Async Processing**: Non-blocking event publication
- **Audit Compliance**: Complete operation logging for compliance requirements

#### OtaEducationSessionService (Orchestrator)

- **Purpose**: Workflow coordination and session management
- **Session Storage**: Redis-based with configurable expiration
- **State Management**: Complex workflow state transitions
- **Error Recovery**: Rollback and retry mechanisms

## Integration Points

### External Dependencies

- **DataverseModule**: Microsoft Dataverse integration for data persistence
- **RedisService**: Session storage and caching (future implementation)
- **Common Enums**: Shared enumeration definitions across modules
- **Error Factory**: Structured error handling and logging
- **Authentication**: JWT-based authentication with role validation

### Internal Dependencies

- **Repository Layer**: Clean data access abstraction
- **Event System**: Audit trail and notification capabilities
- **Validation Layer**: Multi-tier validation with business rules
- **Mapper Layer**: Data transformation between layers

## Security Considerations

### Authentication and Authorization

- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access**: Fine-grained permission control
- **Privilege Levels**: Owner, admin, main user hierarchies
- **Session Security**: Secure session management with expiration

### Data Protection

- **Access Modifiers**: Private, public, and restricted data visibility
- **Field-Level Security**: Sensitive data protection
- **Audit Trail**: Complete operation logging
- **Data Validation**: Multi-layer input sanitization

## Performance Optimization

### Caching Strategy

- **Redis Integration**: Session and reference data caching
- **Query Optimization**: Efficient database query patterns
- **Lazy Loading**: On-demand data loading for large datasets
- **Connection Pooling**: Optimized database connection management

### Scalability Features

- **Modular Architecture**: Independent service scaling
- **Event-Driven Design**: Asynchronous processing capabilities
- **Repository Pattern**: Database abstraction for easy scaling
- **Orchestrator Pattern**: Complex workflow coordination

## Development Guidelines

### Code Organization

- **Single Responsibility**: Each service has a focused purpose
- **Dependency Injection**: Proper NestJS dependency management
- **Error Handling**: Structured error propagation and logging
- **Testing**: Comprehensive unit and integration test coverage

### Best Practices

- **Type Safety**: Full TypeScript type coverage
- **Documentation**: Inline code documentation with JSDoc
- **Validation**: Input validation at all entry points
- **Logging**: Structured logging with correlation IDs

## Migration and Deployment

### Database Schema

- **Entity Definitions**: Complete Dataverse entity mapping
- **Relationship Management**: Foreign key constraints and relationships
- **Index Strategy**: Optimized indexing for query performance
- **Migration Scripts**: Versioned database migration management

### Environment Configuration

- **Configuration Management**: Environment-specific settings
- **Secret Management**: Secure credential handling
- **Service Discovery**: Dynamic service registration
- **Health Checks**: Comprehensive service health monitoring

## Troubleshooting

### Common Issues

1. **Session Expiration**: Check Redis configuration and session timeout settings
2. **Validation Failures**: Review business rule configuration and data quality
3. **Performance Issues**: Analyze query patterns and caching effectiveness
4. **Integration Errors**: Verify external service connectivity and authentication

### Monitoring and Observability

- **Application Metrics**: Performance and usage monitoring
- **Error Tracking**: Comprehensive error logging and alerting
- **Audit Logs**: Complete operation audit trail
- **Performance Monitoring**: Response time and throughput tracking

## Version History

- **1.0.0**: Initial implementation with basic CRUD operations
- **1.1.0**: Added orchestrator workflow system and enhanced validation
- **Future**: Planned Redis integration and advanced analytics

## API Examples

### Complete Registration Workflow

```typescript
// 1. Stage education data
const stageResponse = await fetch('/orchestrator/stage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userBusinessId: 'user-123',
    educationData: {
      graduationYear: 2024,
      university: 1,
      country: 1,
      degreeType: 2,
      college: 'College of Health Sciences',
    },
  }),
});

const { sessionId } = await stageResponse.json();

// 2. Validate education data
await fetch(`/orchestrator/validate/${sessionId}`, { method: 'POST' });

// 3. Link to account
await fetch(`/orchestrator/link/${sessionId}/account-456`, { method: 'POST' });

// 4. Create education record
const createResponse = await fetch(`/orchestrator/create/${sessionId}`, {
  method: 'POST',
});
const { createdEducationId } = await createResponse.json();

// 5. Complete workflow
await fetch(`/orchestrator/complete/${sessionId}`, { method: 'POST' });
```

### Public Validation Example

```typescript
// Validate college-country alignment
const validationResponse = await fetch(
  '/public/ota-educations/validate-college-country',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      college: 'University of Toronto',
      country: 1, // Canada
    }),
  },
);

const validation = await validationResponse.json();
// { isValid: true, confidence: 95, suggestions: [] }
```

## Support and Resources

- **Technical Documentation**: Complete API reference and integration guides
- **Architecture Decisions**: Documented architectural choices and trade-offs
- **Performance Guidelines**: Optimization recommendations and best practices
- **Security Protocols**: Security implementation and compliance guidelines

For additional support or questions about the OTA Education module implementation, refer to the project's main documentation and architectural guidelines.

# OT Education Module

## Overview

The OT Education module provides comprehensive functionality for managing Occupational Therapy education records within the OSOT Dataverse system. This enterprise-grade module implements a complete full-stack solution with advanced features including dual-controller architecture, comprehensive business rule validation, repository pattern, orchestrator workflow management, scheduled tasks, and extensive testing coverage.

## 🏗️ Architecture

### Module Structure

```
ot-education/
├── controllers/                               # API Controllers
│   ├── ot-education-public.controller.ts     # Unauthenticated validation and lookup endpoints
│   ├── ot-education-private.controller.ts    # Authenticated CRUD and administrative endpoints
│   └── README.md                              # Controller documentation
├── services/                                  # Business Logic Layer
│   ├── ot-education-crud.service.ts          # Core CRUD operations
│   ├── ot-education-lookup.service.ts        # Reference data queries
│   ├── ot-education-business-rule.service.ts # Business logic and validation
│   └── README.md                              # Service documentation
├── repositories/                              # Data Access Layer
│   ├── ot-education.repository.ts            # Data access abstraction over Dataverse
│   └── README.md                              # Repository documentation
├── events/                                    # Event Management
│   ├── ot-education.events.ts                # Event handling for audit and notifications
│   └── README.md                              # Event documentation
├── orchestrator/                              # Workflow Management
│   ├── interfaces/                           # Orchestrator contracts and interfaces
│   ├── dto/                                  # Session and workflow DTOs
│   ├── services/                             # Session management services
│   └── README.md                              # Orchestrator documentation
├── validators/                                # Custom Validation Logic
│   ├── ot-education.validators.ts            # COTO, university, and business rule validators
│   └── README.md                              # Validator documentation
├── utils/                                     # Business Logic Utilities
│   ├── ot-education-business-logic.util.ts   # Category determination and business rules
│   └── README.md                              # Utility documentation
├── mappers/                                   # Data Transformation
│   ├── ot-education.mapper.ts                # Entity-DTO mapping logic
│   └── README.md                              # Mapper documentation
├── schedulers/                                # Background Tasks
│   ├── ot-education-cleanup.scheduler.ts     # Data cleanup and maintenance tasks
│   └── README.md                              # Scheduler documentation
├── tests/                                     # Comprehensive Testing
│   ├── unit/                                 # Unit tests for all components
│   ├── integration/                          # Integration tests
│   ├── e2e/                                  # End-to-end tests
│   └── README.md                              # Testing documentation
├── constants/                                 # Domain Constants
│   ├── ot-education.constants.ts             # Validation rules, defaults, cache keys
│   └── README.md                              # Constants documentation
├── interfaces/                                # Type Definitions
│   ├── ot-education-dataverse.interface.ts   # Dataverse entity interfaces
│   ├── ot-education-internal.interface.ts    # Internal business interfaces
│   ├── ot-education-repository.interface.ts  # Repository contracts
│   └── README.md                              # Interface documentation
├── dtos/                                      # Data Transfer Objects
│   ├── ot-education-basic.dto.ts             # Basic education DTOs
│   ├── create-ot-education.dto.ts            # Creation request DTOs
│   ├── update-ot-education.dto.ts            # Update request DTOs
│   ├── ot-education-response.dto.ts          # Response DTOs
│   ├── ot-education-registration.dto.ts      # Registration workflow DTOs
│   ├── list-ot-education.query.dto.ts        # Query and filtering DTOs
│   └── README.md                              # DTO documentation
├── modules/                                   # NestJS Module Configuration
│   ├── ot-education.module.ts                # Main module configuration
│   └── README.md                              # Module documentation
├── docs/                                      # Documentation
│   └── README.md                              # This comprehensive documentation
├── index.ts                                   # Main module exports
└── Table OT Education.csv                     # Data schema reference
```

### 🎯 Key Features

- **🔐 Dual Controller Architecture**: Separate public and private endpoints for optimal security
- **🏛️ Repository Pattern**: Clean data access abstraction over Microsoft Dataverse
- **⚖️ Business Rule Engine**: Comprehensive validation and categorization logic for COTO requirements
- **📡 Event-Driven Architecture**: Audit trails and business event handling
- **🔄 Orchestrator Pattern**: Complex workflow management with Redis session coordination
- **👤 Role-Based Access Control**: JWT authentication with granular privilege checking
- **✅ Multi-Layer Validation**: Comprehensive validation from API to business rules
- **🎭 Custom Validators**: Domain-specific validation decorators for COTO, universities, and business rules
- **📊 Data Mapping**: Sophisticated entity-DTO transformation with business logic
- **⏰ Scheduled Tasks**: Background maintenance and cleanup operations
- **🧪 Comprehensive Testing**: Unit, integration, and end-to-end test coverage

## 🌐 Public API (Unauthenticated)

### 🔍 Validation Endpoints

- `POST /ot-education/public/validate-education-data` - Comprehensive education data validation
- `POST /ot-education/public/validate-coto-registration` - COTO registration validation with format and status checks
- `POST /ot-education/public/validate-university-country` - University-country alignment validation
- `POST /ot-education/public/validate-graduation-year` - Graduation year constraints and timeline validation
- `POST /ot-education/public/validate-user-business-id` - Business ID uniqueness and format validation

### 📋 Lookup Endpoints

- `GET /ot-education/public/universities` - Get available Canadian OT universities
- `GET /ot-education/public/countries` - Get supported countries for education
- `GET /ot-education/public/education-categories` - Get education category options
- `POST /ot-education/public/determine-education-category` - Intelligent category determination based on rules

## 🔒 Private API (Authenticated)

### 📊 CRUD Operations

- `POST /ot-education/private/create` - Create new education record with validation
- `GET /ot-education/private/read/:id` - Get education record by ID with access control
- `PUT /ot-education/private/update/:id` - Update education record with business rule validation
- `DELETE /ot-education/private/delete/:id` - Delete education record with audit trail
- `GET /ot-education/private/list` - List education records with advanced filtering and pagination

### ⚙️ Administrative Functions

- `POST /ot-education/private/admin/bulk-create` - Bulk create education records with validation
- `PUT /ot-education/private/admin/bulk-update` - Bulk update with transaction support
- `DELETE /ot-education/private/admin/bulk-delete` - Bulk delete with safety checks
- `POST /ot-education/private/admin/export` - Export education data in various formats
- `GET /ot-education/private/admin/audit-trail/:id` - Complete audit trail for education record

### 🔍 Enhanced Validation and Lookup (Authenticated)

- `POST /ot-education/private/validate-education-data` - Enhanced validation with user context and privilege checking
- `POST /ot-education/private/determine-education-category` - Category determination with user privilege validation
- `GET /ot-education/private/universities` - Universities with user-specific access control and preferences
- `GET /ot-education/private/countries` - Countries with user preferences and regional restrictions

## ⚖️ Business Rules & Domain Logic

### 🎓 Education Category Determination

The system automatically determines education categories using sophisticated business logic:

- **📅 Graduation Year Analysis**: Pre-2018 vs. Post-2018 regulatory standards
- **🏛️ COTO Registration Status**: Provincial registration validation and compliance
- **🌍 University Location**: Geographic and regulatory alignment validation
- **📜 Education Level**: Degree type, specialization, and accreditation analysis
- **🔗 Membership Integration**: Cross-reference with membership status and expiration
- **⚠️ Edge Case Handling**: Bridging programs, international education, grandfathering

### ✅ Comprehensive Validation Rules

#### Core Business Rules

- **🆔 User Business ID Uniqueness**: Ensures unique identification across the entire system
- **🏛️ COTO Registration Validation**: Format validation, status verification, and provincial alignment
- **🎓 University-Country Alignment**: Validates educational institution geography and accreditation
- **📅 Graduation Year Consistency**: Timeline validation and regulatory period alignment
- **📊 Data Integrity**: Cross-field validation and business constraint enforcement

#### Advanced Validation Features

- **🔄 Conditional Validation**: Rules that adapt based on other field values
- **🌐 Regional Compliance**: Provincial and territorial regulation compliance
- **📋 Custom Validators**: Domain-specific validation decorators (@IsCotoValid, @IsOtUniversity, etc.)
- **⚡ Performance Optimized**: Cached validation rules and efficient rule execution

## 🔄 Orchestrator Workflow

### 📝 Session Management

The orchestrator provides Redis-based session management for complex workflows with enterprise-grade features:

1. **🎬 Stage Education Registration**: Initialize workflow session with validation
2. **✅ Validate Education Data**: Comprehensive multi-layer validation across all business rules
3. **🎯 Determine Education Category**: Intelligent categorization using business logic engine
4. **🔗 Link to Account**: Secure account association with privilege validation
5. **📊 Create Education Record**: Final record creation with complete audit trail
6. **🏁 Complete Workflow**: Orchestrated execution with rollback capabilities

### ⚡ Workflow Operations

- **🔄 Session Lifecycle**: Creation, validation, expiration, and intelligent cleanup
- **📋 Step Coordination**: Sequential workflow step management with dependency tracking
- **🛡️ Error Handling**: Comprehensive error recovery, rollback, and retry mechanisms
- **📡 Event Emission**: Complete audit trail and notification integration
- **⏱️ Performance Monitoring**: Workflow execution timing and performance metrics
- **🔐 Security**: Secure session management with encryption and access control

## 📊 Data Models

### 🎓 Core Education Record

```typescript
interface OtEducationRecord {
  id: string; // Unique education record identifier
  userBusinessId: string; // User's business identifier (unique)
  educationCategory: EducationCategory; // Determined education category
  university: OtUniversity; // Accredited OT university
  country: Country; // Country of education
  graduationYear: GraduationYear; // Year of graduation
  degreeType: DegreeType; // Type of OT degree
  cotoRegistration?: CotoRegistrationInfo; // COTO registration details (optional)
  accessModifier: AccessModifier; // Privacy/access control
  privilege: Privilege; // User privilege level

  // Audit Fields
  createdAt: string; // Record creation timestamp
  updatedAt: string; // Last update timestamp
  createdBy: string; // Creator user ID
  updatedBy: string; // Last updater user ID

  // Validation Metadata
  validationStatus: ValidationStatus; // Current validation state
  businessRulesApplied: string[]; // Applied business rules
  lastValidatedAt: string; // Last validation timestamp
}
```

### 🏛️ COTO Registration Information

```typescript
interface CotoRegistrationInfo {
  registrationNumber: string; // COTO registration number
  status: CotoStatus; // Current COTO status
  province: string; // Registration province
  expirationDate?: string; // Registration expiration
  verificationDate: string; // Last verification date
  isVerified: boolean; // Verification status
}
```

### 🎯 Education Categories

- **🕰️ PRE_2018**: Education completed before 2018 regulatory changes
- **🆕 POST_2018**: Education under current standards and requirements
- **🌍 INTERNATIONAL**: International education requiring additional validation
- **🌉 BRIDGING**: Bridging program graduates with special considerations
- **👴 GRANDFATHERED**: Legacy recognition cases with special status
- **🔄 TRANSITIONAL**: Records in transition between categories

## 🔌 Integration & External Services

### 🗃️ Microsoft Dataverse Integration

- **📊 Entity Mapping**: Direct mapping to Dataverse education entities with advanced field mapping
- **⚡ Query Optimization**: Efficient data retrieval with advanced filtering, pagination, and caching
- **📦 Bulk Operations**: Optimized batch processing for large datasets with transaction support
- **🛡️ Error Handling**: Robust error management for external service calls with retry mechanisms
- **🔄 Sync Management**: Bidirectional synchronization with conflict resolution
- **📈 Performance Monitoring**: Connection pooling, query performance tracking, and optimization

### 📡 Event Integration

- **📋 Audit Events**: Comprehensive audit trail for all CRUD operations and business actions
- **🔔 Business Events**: Workflow and state change notifications with custom event types
- **⚠️ Error Events**: Error tracking, monitoring integration, and alerting systems
- **📊 Metrics Events**: Performance analytics, usage statistics, and business intelligence
- **🔗 External Integration**: Event forwarding to external systems and webhooks
- **🎯 Event Filtering**: Conditional event emission based on business rules and user preferences

### 🌐 External System Integrations

- **🏛️ COTO API Integration**: Real-time COTO registration verification and status checking
- **🎓 University Database Integration**: University accreditation and program verification
- **📧 Notification Services**: Email, SMS, and push notification integration
- **📊 Analytics Platforms**: Business intelligence and reporting system integration

## 🔒 Security & Compliance

### 🔐 Authentication & Authorization

- **🎫 JWT Authentication**: Secure token-based authentication with refresh token support
- **👥 Role-Based Access**: Granular permission control with hierarchical role structure
- **🔍 Privilege Checking**: Operation-level access validation with dynamic permission evaluation
- **🔒 Session Security**: Secure session management with encryption, expiration, and revocation
- **🛡️ Multi-Factor Authentication**: Support for MFA and advanced authentication methods

### 🛡️ Data Protection & Privacy

- **✅ Input Validation**: Comprehensive request validation with sanitization and XSS prevention
- **🚫 SQL Injection Prevention**: Parameterized queries, input validation, and secure data access
- **📝 Access Logging**: Detailed access logs, operation tracking, and compliance reporting
- **🔒 Error Sanitization**: Secure error message handling preventing information disclosure
- **🗃️ Data Encryption**: Encryption at rest and in transit with key management
- **📋 GDPR Compliance**: Data privacy controls, user consent management, and data portability

### 🔍 Audit & Compliance

- **📊 Comprehensive Audit Trail**: Complete tracking of all data changes and user actions
- **📋 Compliance Reporting**: Automated generation of compliance reports and documentation
- **🎯 Data Retention**: Configurable data retention policies with automated cleanup
- **🔒 Access Control Matrix**: Detailed permission tracking and privilege escalation monitoring

## 🚀 Performance & Scalability

### ⚡ Performance Optimizations

- **📊 Caching Strategy**: Multi-layer caching with Redis for session data and frequently accessed records
- **🔍 Query Optimization**: Efficient database queries with indexing and query plan optimization
- **📦 Bulk Operations**: Optimized batch processing with transaction management
- **⏱️ Response Time Monitoring**: Real-time performance monitoring and alerting
- **🔄 Connection Pooling**: Efficient database connection management and resource utilization

### 📈 Scalability Features

- **🔄 Horizontal Scaling**: Stateless design supporting horizontal scaling and load balancing
- **📊 Load Balancing**: Support for multiple application instances with session affinity
- **🗃️ Database Sharding**: Support for database partitioning and distributed storage
- **🌐 CDN Integration**: Content delivery network support for static assets and caching

## 🧪 Testing Strategy & Quality Assurance

### 🔬 Comprehensive Testing Coverage

- **🧪 Unit Tests**: Individual component testing with >90% code coverage target
- **🔗 Integration Tests**: End-to-end workflow validation and service integration testing
- **🗃️ Repository Tests**: Data access layer validation with mock and real database testing
- **🔄 Orchestrator Tests**: Session management and workflow coordination testing
- **🌐 API Tests**: Complete API endpoint testing with various scenarios and edge cases
- **⚡ Performance Tests**: Load testing, stress testing, and performance regression testing

### 🎯 Quality Assurance Features

- **📊 Code Quality Metrics**: Automated code quality analysis with SonarQube integration
- **🔒 Security Testing**: Automated security vulnerability scanning and penetration testing
- **📋 Compliance Testing**: Automated compliance validation and regulatory requirement testing
- **🔄 Regression Testing**: Automated regression testing with comprehensive test suites

## ⏰ Background Tasks & Maintenance

### 🔄 Scheduled Operations

- **🧹 Data Cleanup**: Automated cleanup of expired sessions, temporary data, and orphaned records
- **🔄 Sync Operations**: Periodic synchronization with external systems and data validation
- **📊 Analytics Processing**: Batch processing of analytics data and report generation
- **🔍 Health Checks**: System health monitoring and automated diagnostic reporting
- **📋 Audit Processing**: Periodic audit log processing and compliance report generation

### 🛠️ Maintenance Features

- **📊 Performance Monitoring**: Continuous monitoring of system performance and resource utilization
- **⚠️ Error Alerting**: Automated error detection and notification systems
- **🔄 Backup Operations**: Automated backup and disaster recovery procedures
- **📈 Capacity Planning**: Resource usage tracking and capacity planning recommendations

## 🛠️ Development Guidelines & Best Practices

### 🏗️ Architecture Patterns

- **🏛️ Repository Pattern**: Use repository services for all data access with clean abstraction
- **⚖️ Business Rule Services**: Centralize business logic validation and domain rules
- **📡 Event Emission**: Emit events for all significant operations and state changes
- **🛡️ Error Handling**: Use structured error handling with comprehensive context and logging
- **🔄 Dependency Injection**: Leverage NestJS DI for service composition and testability
- **🎯 Single Responsibility**: Each service and component has a single, well-defined responsibility

### 📝 Coding Standards

#### 🎨 Code Style

```typescript
// ✅ Good: Descriptive naming and proper typing
export class OtEducationBusinessRuleService {
  async validateCotoRegistration(
    cotoNumber: string,
    province: string,
  ): Promise<CotoValidationResult> {
    // Implementation with proper error handling
  }
}

// ❌ Avoid: Generic naming and any types
export class Service {
  async validate(data: any): Promise<any> {
    // Unclear implementation
  }
}
```

#### 🏷️ Naming Conventions

- **📁 Files**: `kebab-case.suffix.ts` (e.g., `ot-education-crud.service.ts`)
- **🏛️ Classes**: `PascalCase` with descriptive suffixes (e.g., `OtEducationCrudService`)
- **🔧 Methods**: `camelCase` with action verbs (e.g., `validateEducationData`)
- **🔑 Constants**: `SCREAMING_SNAKE_CASE` (e.g., `OT_EDUCATION_DEFAULTS`)
- **📊 Interfaces**: `PascalCase` with descriptive names (e.g., `OtEducationRecord`)

#### 📋 Documentation Standards

````typescript
/**
 * Validates COTO registration number format and status
 *
 * @param cotoNumber - COTO registration number (8 characters)
 * @param province - Canadian province/territory code
 * @returns Promise<CotoValidationResult> - Validation result with status and errors
 *
 * @throws {ValidationError} When COTO number format is invalid
 * @throws {ExternalServiceError} When COTO API is unavailable
 *
 * @example
 * ```typescript
 * const result = await validateCotoRegistration('12345678', 'ON');
 * if (result.isValid) {
 *   // Process valid registration
 * }
 * ```
 */
````

### 🧪 Testing Guidelines

#### 🔬 Unit Testing

```typescript
describe('OtEducationBusinessRuleService', () => {
  let service: OtEducationBusinessRuleService;
  let mockRepository: jest.Mocked<OtEducationRepositoryService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OtEducationBusinessRuleService,
        {
          provide: OtEducationRepositoryService,
          useFactory: () => createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<OtEducationBusinessRuleService>(
      OtEducationBusinessRuleService,
    );
    mockRepository = module.get(OtEducationRepositoryService);
  });

  describe('validateCotoRegistration', () => {
    it('should validate correct COTO registration format', async () => {
      // Arrange
      const cotoNumber = '12345678';
      const province = 'ON';

      // Act
      const result = await service.validateCotoRegistration(
        cotoNumber,
        province,
      );

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
```

#### 🔗 Integration Testing

```typescript
describe('OT Education API Integration', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [OtEducationModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authToken = await getTestAuthToken();
  });

  it('/ot-education/private/create (POST)', async () => {
    const createDto: CreateOtEducationDto = {
      userBusinessId: 'test-123',
      university: OtUniversity.UNIVERSITY_OF_TORONTO,
      graduationYear: GraduationYear.YEAR_2020,
      // ... other required fields
    };

    return request(app.getHttpServer())
      .post('/ot-education/private/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createDto)
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.userBusinessId).toBe(createDto.userBusinessId);
      });
  });
});
```

### 🔧 Configuration Management

#### 🌍 Environment Configuration

```typescript
// config/ot-education.config.ts
export const otEducationConfig = {
  validation: {
    cotoApiUrl: process.env.COTO_API_URL,
    cotoApiTimeout: parseInt(process.env.COTO_API_TIMEOUT || '5000'),
    enableCotoValidation: process.env.ENABLE_COTO_VALIDATION === 'true',
  },
  cache: {
    ttl: parseInt(process.env.OT_EDUCATION_CACHE_TTL || '3600'),
    maxSize: parseInt(process.env.OT_EDUCATION_CACHE_SIZE || '1000'),
  },
  orchestrator: {
    sessionTtl: parseInt(process.env.OT_EDUCATION_SESSION_TTL || '86400'),
    maxRetries: parseInt(process.env.OT_EDUCATION_MAX_RETRIES || '3'),
  },
};
```

### 🚀 Deployment Guidelines

#### 🐳 Docker Configuration

```dockerfile
# Dockerfile for OT Education module
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY config/ ./config/

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

#### ☁️ Environment Setup

```yaml
# docker-compose.yml
version: '3.8'
services:
  ot-education-api:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - COTO_API_URL=${COTO_API_URL}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - '3000:3000'
    depends_on:
      - redis
      - postgres
```

## 📚 Related Documentation

### 📖 Component Documentation

- [🎮 Controller Documentation](../controllers/README.md) - API endpoints and request/response schemas
- [⚙️ Service Documentation](../services/README.md) - Business logic and service layer architecture
- [🗃️ Repository Documentation](../repositories/README.md) - Data access patterns and Dataverse integration
- [🔄 Orchestrator Documentation](../orchestrator/README.md) - Workflow management and session handling
- [✅ Validator Documentation](../validators/README.md) - Custom validation rules and decorators
- [🎭 Mapper Documentation](../mappers/README.md) - Data transformation and entity mapping
- [📊 DTO Documentation](../dtos/README.md) - Data transfer objects and API contracts
- [📅 Scheduler Documentation](../schedulers/README.md) - Background tasks and maintenance operations
- [🧪 Testing Documentation](../tests/README.md) - Testing strategies and test suites

### 🏗️ Architecture Documentation

- [🎯 Project Architecture](../../../../documentation/ARCHITECTURE_OVERVIEW.md) - Overall system architecture
- [🗃️ Dataverse Integration](../../../../documentation/DATAVERSE_INTEGRATION_OVERVIEW.md) - External system integration
- [🔐 Authentication Flow](../../../../documentation/AUTH_SECURE_FLOW.md) - Security implementation
- [📊 Domain Architecture](../../../../documentation/DOMAIN_ARCHITECTURE_GUIDE.md) - Domain-driven design patterns

### 🔄 Development Process

- [📋 Project Timeline](../../../../documentation/PROJECT_TIMELINE_2026.md) - Development roadmap and milestones
- [✅ Project Permissions](../../../../documentation/PROJECT_PERMISSIONS_AND_CRUD_MATRIX.md) - Access control matrix
- [🎯 Registration Orchestrator](../../../../documentation/REGISTRATION_ORCHESTRATOR_IMPLEMENTATION_PLAN.md) - Orchestrator implementation strategy

---

**📦 Module Information**

- **Version**: 2.0.0
- **👥 Author**: OSOT Development Team
- **📅 Last Updated**: December 2024
- **🏷️ License**: Proprietary - OSOT Internal Use Only
- **🔧 Node.js Version**: >=18.0.0
- **🎯 NestJS Version**: ^10.0.0
- **🗃️ Database**: Microsoft Dataverse
- **📊 Cache**: Redis
- **🧪 Test Coverage**: >90%

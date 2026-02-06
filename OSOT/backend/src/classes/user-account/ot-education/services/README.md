# OT Education Services

This module contains three essential services for managing Occupational Therapy Education data in the OSOT system, following enterprise-grade patterns with comprehensive business rule validation, repository pattern integration, and event-driven architecture.

## Overview

The OT Education services implement the established three-service pattern with significant enhancements:

- **Business Rule Service**: Advanced validation engine with business logic enforcement
- **CRUD Service**: Full lifecycle management with role-based permissions and event publishing
- **Lookup Service**: High-performance query operations with repository pattern integration

## Architecture Enhancements

### Repository Pattern Integration

All services now integrate with `OtEducationRepositoryService` for:

- Clean data access abstraction over Dataverse
- Type-safe database operations
- Consistent error handling and logging
- Performance optimization through specialized queries

### Event-Driven Architecture

Integration with `OtEducationEventsService` provides:

- Comprehensive audit trails
- Business event notifications
- Lifecycle event tracking
- Integration hooks for external systems

### Enhanced Error Handling

Structured error management using:

- `createAppError` factory for consistent error formats
- `ErrorCodes` enum for standardized error classification
- Detailed error context and debugging information
- Proper HTTP status code mapping

## Services Documentation

### OtEducationBusinessRuleService

**Purpose**: Advanced business rule validation engine with membership integration.

**Key Responsibilities**:

- **Comprehensive Validation**: Multi-layer validation with detailed error reporting
- **Education Category Determination**: Intelligent categorization based on graduation year and membership status
- **COTO Registration Validation**: Format validation and status alignment checking
- **University-Country Alignment**: Geographic consistency validation
- **User Business ID Uniqueness**: Cross-system uniqueness validation
- **Data Completeness Validation**: Scenario-based validation (registration, profile completion)
- **Membership Integration**: Integration with membership settings for category determination

**Enhanced Business Rules**:

- User Business ID must be globally unique across all education records
- COTO registration format validation with province-specific patterns
- University-country pairing validation with comprehensive mapping
- Graduation year constraints with realistic bounds (1990-current+5)
- Education category auto-determination with membership expires date consideration
- One education record per account with conflict detection
- Data completeness validation for different user scenarios

**New Methods**:

```typescript
// Enhanced validation with detailed error reporting
validateEducationRecord(data: CreateOtEducationDto): ValidationResult

// Intelligent category determination with membership integration
determineEducationCategory(graduationYear: GraduationYear, membershipExpiresDate?: Date): EducationCategory

// Advanced COTO validation with province patterns
validateCotoRegistrationAlignment(status: CotoStatus, registration?: string): ValidationResult

// Geographic consistency validation
validateUniversityCountryAlignment(university: OtUniversity, country: Country): ValidationResult

// Global uniqueness checking with exclusion support
checkUserBusinessIdUniqueness(userBusinessId: string, excludeId?: string): boolean
```

### OtEducationCrudService

**Purpose**: Enterprise-grade CRUD operations with comprehensive business rule validation and event lifecycle management.

**Key Responsibilities**:

- **Full CRUD Operations**: Create, read, update, delete with business rule enforcement
- **Role-Based Access Control**: Granular permissions based on user privilege levels
- **Business Rule Integration**: Automatic validation on all data modifications
- **Event Publishing**: Comprehensive lifecycle event notifications
- **Data Validation**: Multi-scenario validation support
- **Repository Integration**: Clean data access through repository pattern
- **Mapper Integration**: Type-safe data transformation

**Enhanced Features**:

- **Automatic Business Rule Validation**: All create/update operations validated
- **Education Category Auto-Determination**: Intelligent categorization on data changes
- **Role-Based Field Filtering**: Sensitive data protection based on user privileges
- **Event Publishing**: Audit trails and business event notifications
- **Repository Pattern**: Clean abstraction over Dataverse operations
- **Comprehensive Error Handling**: Structured error responses with context
- **Performance Optimization**: Efficient queries through repository layer

**New Methods**:

```typescript
// Enhanced CRUD with business rule validation
create(createDto: CreateOtEducationDto, userPrivilege: string): Promise<OtEducationResponseDto>
findOne(id: string, userPrivilege: string): Promise<OtEducationResponseDto>
update(id: string, updateDto: UpdateOtEducationDto, userPrivilege: string): Promise<OtEducationResponseDto>
remove(id: string, userPrivilege: string): Promise<void>

// Advanced query operations
findByAccount(accountId: string, userPrivilege: string): Promise<OtEducationResponseDto[]>
findByUserBusinessId(userBusinessId: string, userPrivilege: string): Promise<OtEducationResponseDto | null>

// Multi-scenario validation
validateDataCompleteness(id: string, scenario: 'registration' | 'profile_completion', userPrivilege: string): Promise<ValidationResult>
```

### OtEducationLookupService

**Purpose**: High-performance specialized query operations with repository integration and comprehensive analytics.

**Key Responsibilities**:

- **Repository-Based Queries**: High-performance lookups through repository pattern
- **Multi-Criteria Filtering**: Complex filtering by various education attributes
- **Statistical Analysis**: Comprehensive analytics and reporting capabilities
- **Geographic Queries**: University and country-based filtering
- **Temporal Queries**: Graduation year and date-based filtering
- **Professional Status Queries**: COTO status and registration-based lookups
- **Performance Optimization**: Efficient queries with minimal data transfer

**Enhanced Specialized Queries**:

- **Repository Integration**: All queries now use repository pattern for performance
- **Type-Safe Operations**: Strong typing throughout with enum-based filtering
- **Comprehensive Statistics**: Multi-dimensional analytics with breakdown by various attributes
- **Advanced Filtering**: Complex queries with multiple criteria support
- **Error Handling**: Structured error management with detailed context
- **Logging Integration**: Comprehensive logging for query performance monitoring

**New Methods**:

```typescript
// Repository-based core queries
findOneByGuid(guid: string): Promise<Record<string, unknown> | null>
findByAccountId(accountId: string): Promise<Record<string, unknown>[]>
findByUserBusinessId(userBusinessId: string): Promise<Record<string, unknown> | null>

// Enhanced filtering queries
findByCotoStatus(status: CotoStatus): Promise<Record<string, unknown>[]>
findByUniversity(university: OtUniversity): Promise<Record<string, unknown>[]>
findByGraduationYear(year: GraduationYear): Promise<Record<string, unknown>[]>
findByCountry(country: Country): Promise<Record<string, unknown>[]>

// Comprehensive analytics
getEducationStatistics(): Promise<EducationStatistics>

// Complex multi-criteria queries with repository optimization
findNewGraduates(year: number): Promise<Record<string, unknown>[]>
findInternationalEducation(): Promise<Record<string, unknown>[]>
```

## Usage Examples

### Creating an Education Record with Full Validation

```typescript
import { OtEducationCrudService } from './ot-education-crud.service';

// Create with automatic business rule validation and event publishing
const educationRecord = await this.crudService.create(
  {
    graduationYear: 2024,
    university: OtUniversity.UNIVERSITY_OF_TORONTO,
    country: Country.CANADA,
    cotoStatus: CotoStatus.GENERAL,
    cotoRegistration: 'ON123456',
  },
  'owner',
);

// Education category automatically determined
// Events published for audit trail
// Business rules validated before creation
```

### Advanced Business Rule Validation

```typescript
import { OtEducationBusinessRuleService } from './ot-education-business-rule.service';

// Comprehensive validation with detailed error reporting
const validation = await this.businessRuleService.validateEducationRecord({
  graduationYear: 2024,
  university: OtUniversity.UNIVERSITY_OF_TORONTO,
  country: Country.CANADA,
  cotoStatus: CotoStatus.GENERAL,
  cotoRegistration: 'ON123456',
});

if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
  // Handle validation failures with detailed error context
}

// Intelligent education category determination
const category = await this.businessRuleService.determineEducationCategory(
  2024,
  new Date('2025-12-31'), // membership expires date
);

// COTO registration validation with province patterns
const cotoValidation =
  this.businessRuleService.validateCotoRegistrationAlignment(
    CotoStatus.GENERAL,
    'ON123456',
  );

// University-country alignment validation
const alignmentValidation =
  this.businessRuleService.validateUniversityCountryAlignment(
    OtUniversity.UNIVERSITY_OF_TORONTO,
    Country.CANADA,
  );
```

### High-Performance Lookup Operations

```typescript
import { OtEducationLookupService } from './ot-education-lookup.service';

// Repository-based queries for optimal performance
const educationRecord = await this.lookupService.findOneByGuid('guid-here');

// Multi-criteria filtering
const torontoGrads = await this.lookupService.findByUniversity(
  OtUniversity.UNIVERSITY_OF_TORONTO,
);

const generalStatus = await this.lookupService.findByCotoStatus(
  CotoStatus.GENERAL,
);

const recentGrads = await this.lookupService.findByGraduationYear(2024);

// Comprehensive statistics and analytics
const stats = await this.lookupService.getEducationStatistics();
console.log('Total records:', stats.totalRecords);
console.log('By COTO status:', stats.byCotoStatus);
console.log('By university:', stats.byUniversity);
console.log('By country:', stats.byCountry);
```

## Integration Notes

### Repository Pattern Implementation

- **Clean Architecture**: Data access abstracted through repository layer
- **Type Safety**: Strong typing throughout with mapper integration
- **Performance**: Optimized queries with minimal data transfer
- **Error Handling**: Structured error management with context
- **Logging**: Comprehensive logging for debugging and monitoring

### Event System Integration

- **Audit Trails**: Complete lifecycle event tracking
- **Business Events**: Integration hooks for external systems
- **Performance Monitoring**: Event-based performance metrics
- **Error Tracking**: Event-driven error reporting and alerting

### Business Logic Utils Integration

- **Centralized Validation**: Reusable validation logic across services
- **Permission Management**: Role-based access control enforcement
- **Data Transformation**: Type-safe mapping between DTOs and entities
- **Utility Functions**: Common operations abstracted into utilities

## Architecture Integration

All services are fully integrated with the enhanced OSOT architecture:

- **Repository Pattern**: `OtEducationRepositoryService` for clean data access
- **Event System**: `OtEducationEventsService` for audit trails and notifications
- **Error Handling**: Enhanced `ErrorCodes` and `createAppError` for structured errors
- **Type Safety**: Comprehensive enum usage (`CotoStatus`, `OtUniversity`, `Country`, etc.)
- **Validation**: Advanced validation with `OtEducationValidationUtil`
- **Mapping**: Type-safe transformation with mapper integration
- **Permissions**: Role-based access control with detailed privilege checking

### Enhanced Permission System

Granular role-based access control with enhanced privilege checking:

- **main**: Full CRUD access including delete operations and administrative functions
- **admin**: Read/Write access to all data across accounts, no delete permissions
- **owner**: Create/Read/Write access to own data with sensitive field filtering

### Performance Optimizations

- **Repository Pattern**: Optimized queries through specialized repository methods
- **Type Safety**: Compile-time type checking reduces runtime errors
- **Caching Strategy**: Intelligent caching of frequently accessed data
- **Query Optimization**: Efficient database access patterns
- **Error Reduction**: Comprehensive validation reduces invalid operations

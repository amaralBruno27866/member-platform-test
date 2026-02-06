# OTA Education Services

This module contains three essential services for managing Occupational Therapy Assistant Education data in the OSOT system, following enterprise-grade patterns with comprehensive business rule validation, repository pattern integration, and event-driven architecture.

## Overview

The OTA Education services implement the established three-service pattern with significant enhancements specifically tailored for OTA education requirements:

- **Business Rule Service**: Advanced validation engine with OTA-specific business logic enforcement
- **CRUD Service**: Full lifecycle management with role-based permissions and event publishing
- **Lookup Service**: High-performance query operations with repository pattern integration and comprehensive analytics

## Architecture Enhancements

### Repository Pattern Integration

All services now integrate with `OtaEducationRepositoryService` for:

- Clean data access abstraction over Dataverse
- Type-safe database operations with OTA-specific entities
- Consistent error handling and logging
- Performance optimization through specialized queries
- OTA-specific field mapping and validation

### Event-Driven Architecture

Integration with `OtaEducationEventsService` provides:

- Comprehensive audit trails for OTA education records
- Business event notifications for work declaration changes
- Lifecycle event tracking for education status transitions
- Integration hooks for external verification systems

### Enhanced Error Handling

Structured error management using:

- `createAppError` factory for consistent error formats
- `ErrorCodes` enum for standardized error classification
- Detailed error context and debugging information
- Proper HTTP status code mapping
- OTA-specific validation error messages

## Services Documentation

### OtaEducationBusinessRuleService

**Purpose**: Advanced business rule validation engine with OTA-specific requirements and college integration.

**Key Responsibilities**:

- **Comprehensive OTA Validation**: Multi-layer validation with detailed error reporting for OTA education
- **Education Category Determination**: Intelligent categorization based on college and country alignment
- **Work Declaration Validation**: Format validation and completeness checking for OTA work requirements
- **College-Country Alignment**: Geographic consistency validation for Canadian and international institutions
- **User Business ID Uniqueness**: Cross-system uniqueness validation for OTA education records
- **Data Completeness Validation**: Scenario-based validation (registration, profile completion, verification)
- **Degree Type Validation**: OTA-specific degree type validation and alignment

**Enhanced OTA Business Rules**:

- User Business ID must be globally unique across all OTA education records
- Work declaration format validation with OTA-specific requirements
- College-country pairing validation with comprehensive OTA institution mapping
- Graduation year constraints with realistic bounds (1990-current+5)
- Education category auto-determination with college classification logic
- One education record per account with conflict detection for OTA programs
- Data completeness validation for different OTA certification scenarios
- Degree type alignment with OTA program requirements

**New Methods**:

```typescript
// Enhanced OTA validation with detailed error reporting
validateOtaEducationRecord(data: CreateOtaEducationDto): ValidationResult

// Intelligent category determination with college integration
determineOtaEducationCategory(college: OtaCollege, country: Country): EducationCategory

// Advanced work declaration validation with OTA patterns
validateOtaWorkDeclaration(workDeclaration: string): ValidationResult

// Geographic consistency validation for OTA institutions
validateOtaCollegeCountryAlignment(college: OtaCollege, country: Country): ValidationResult

// Global uniqueness checking with exclusion support
checkOtaUserBusinessIdUniqueness(userBusinessId: string, excludeId?: string): boolean

// Degree type validation for OTA programs
validateOtaDegreeTypeAlignment(degreeType: DegreeType, college: OtaCollege): ValidationResult
```

### OtaEducationCrudService

**Purpose**: Enterprise-grade CRUD operations with comprehensive OTA business rule validation and event lifecycle management.

**Key Responsibilities**:

- **Full OTA CRUD Operations**: Create, read, update, delete with OTA business rule enforcement
- **Role-Based Access Control**: Granular permissions based on user privilege levels for OTA data
- **Business Rule Integration**: Automatic OTA validation on all data modifications
- **Event Publishing**: Comprehensive lifecycle event notifications for OTA education changes
- **Work Declaration Management**: Specialized handling of OTA work declaration requirements
- **Repository Integration**: Clean data access through OTA repository pattern
- **Mapper Integration**: Type-safe data transformation for OTA entities

**Enhanced OTA Features**:

- **Automatic OTA Business Rule Validation**: All create/update operations validated against OTA requirements
- **Education Category Auto-Determination**: Intelligent categorization based on OTA college classifications
- **Role-Based Field Filtering**: Sensitive OTA data protection based on user privileges
- **Event Publishing**: Audit trails and business event notifications for OTA education lifecycle
- **Repository Pattern**: Clean abstraction over Dataverse operations for OTA entities
- **Comprehensive Error Handling**: Structured error responses with OTA-specific context
- **Performance Optimization**: Efficient queries through repository layer for OTA data

**New Methods**:

```typescript
// Enhanced CRUD with OTA business rule validation
create(createDto: CreateOtaEducationDto, userPrivilege: string): Promise<OtaEducationResponseDto>
findOne(id: string, userPrivilege: string): Promise<OtaEducationResponseDto>
update(id: string, updateDto: UpdateOtaEducationDto, userPrivilege: string): Promise<OtaEducationResponseDto>
remove(id: string, userPrivilege: string): Promise<void>

// Advanced OTA query operations
findByAccount(accountId: string, userPrivilege: string): Promise<OtaEducationResponseDto[]>
findByUserBusinessId(userBusinessId: string, userPrivilege: string): Promise<OtaEducationResponseDto | null>

// Multi-scenario OTA validation
validateOtaDataCompleteness(id: string, scenario: 'registration' | 'verification' | 'certification', userPrivilege: string): Promise<ValidationResult>

// Work declaration management
updateWorkDeclaration(id: string, workDeclaration: string, userPrivilege: string): Promise<OtaEducationResponseDto>
```

### OtaEducationLookupService

**Purpose**: High-performance specialized query operations with repository integration and comprehensive OTA analytics.

**Key Responsibilities**:

- **Repository-Based OTA Queries**: High-performance lookups through repository pattern for OTA data
- **Multi-Criteria Filtering**: Complex filtering by various OTA education attributes
- **Statistical Analysis**: Comprehensive analytics and reporting capabilities for OTA programs
- **Geographic Queries**: College and country-based filtering for OTA institutions
- **Temporal Queries**: Graduation year and experience level-based filtering
- **Work Declaration Queries**: Work experience and declaration-based lookups
- **Performance Optimization**: Efficient queries with minimal data transfer for OTA operations

**Enhanced OTA Specialized Queries**:

- **Repository Integration**: All queries now use repository pattern for optimal OTA data performance
- **Type-Safe Operations**: Strong typing throughout with OTA enum-based filtering
- **Comprehensive Statistics**: Multi-dimensional analytics with breakdown by OTA-specific attributes
- **Advanced Filtering**: Complex queries with multiple OTA criteria support
- **Error Handling**: Structured error management with detailed OTA context
- **Logging Integration**: Comprehensive logging for OTA query performance monitoring

**New Methods**:

```typescript
// Repository-based core OTA queries
findOneByGuid(guid: string): Promise<OtaEducationResponseDto>
findByAccountId(accountId: string): Promise<OtaEducationResponseDto[]>
findByUserBusinessId(userBusinessId: string): Promise<OtaEducationResponseDto | null>

// Enhanced OTA filtering queries
findByWorkDeclarationStatus(hasWorkDeclaration: boolean): Promise<Record<string, unknown>[]>
findByCollege(college: OtaCollege): Promise<Record<string, unknown>[]>
findByGraduationYear(year: GraduationYear): Promise<Record<string, unknown>[]>
findByEducationCategory(category: EducationCategory): Promise<Record<string, unknown>[]>
findByCountry(country: Country): Promise<Record<string, unknown>[]>
findByDegreeType(degreeType: DegreeType): Promise<Record<string, unknown>[]>

// OTA-specific specialized queries
findWithWorkDeclarations(): Promise<Record<string, unknown>[]>
findNewGraduates(currentYear?: number): Promise<Record<string, unknown>[]>
findInternationalEducation(): Promise<Record<string, unknown>[]>
findCanadianCollegeEducation(): Promise<Record<string, unknown>[]>
findRequiringVerification(): Promise<Record<string, unknown>[]>
findByExperienceLevel(experienceLevel: 'new' | 'mid' | 'senior'): Promise<Record<string, unknown>[]>

// Comprehensive OTA analytics
getEducationStatistics(): Promise<OtaEducationStatistics>

// Complex multi-criteria queries with repository optimization
findWithCriteria(criteria: OtaEducationCriteria): Promise<{ records: Record<string, unknown>[]; total: number }>
searchByWorkDeclarationContent(searchTerm: string): Promise<Record<string, unknown>[]>
```

## Usage Examples

### Creating an OTA Education Record with Full Validation

```typescript
import { OtaEducationCrudService } from './ota-education-crud.service';

// Create with automatic OTA business rule validation and event publishing
const otaEducationRecord = await this.crudService.create(
  {
    graduationYear: 2024,
    college: OtaCollege.SHERIDAN,
    country: Country.CANADA,
    degreeType: DegreeType.DIPLOMA,
    workDeclaration:
      'Completed OTA clinical placements at Sunnybrook Health Sciences Centre...',
    educationCategory: EducationCategory.CANADIAN_EDUCATED, // Auto-determined
  },
  'owner',
);

// Education category automatically determined based on college and country
// Events published for audit trail
// Business rules validated before creation
// Work declaration validated for completeness
```

### Advanced OTA Business Rule Validation

```typescript
import { OtaEducationBusinessRuleService } from './ota-education-business-rule.service';

// Comprehensive OTA validation with detailed error reporting
const validation = await this.businessRuleService.validateOtaEducationRecord({
  graduationYear: 2024,
  college: OtaCollege.SHERIDAN,
  country: Country.CANADA,
  degreeType: DegreeType.DIPLOMA,
  workDeclaration: 'Clinical experience summary...',
});

if (!validation.isValid) {
  console.log('OTA Validation errors:', validation.errors);
  // Handle validation failures with detailed error context
}

// Intelligent OTA education category determination
const category = await this.businessRuleService.determineOtaEducationCategory(
  OtaCollege.SHERIDAN,
  Country.CANADA,
);

// Work declaration validation with OTA-specific patterns
const workValidation = this.businessRuleService.validateOtaWorkDeclaration(
  'Completed 1000+ hours of supervised clinical practice...',
);

// College-country alignment validation for OTA institutions
const alignmentValidation =
  this.businessRuleService.validateOtaCollegeCountryAlignment(
    OtaCollege.SHERIDAN,
    Country.CANADA,
  );

// Degree type alignment with OTA program requirements
const degreeValidation =
  this.businessRuleService.validateOtaDegreeTypeAlignment(
    DegreeType.DIPLOMA,
    OtaCollege.SHERIDAN,
  );
```

### High-Performance OTA Lookup Operations

```typescript
import { OtaEducationLookupService } from './ota-education-lookup.service';

// Repository-based queries for optimal performance
const otaEducationRecord = await this.lookupService.findOneByGuid('guid-here');

// OTA-specific filtering
const sheridanGrads = await this.lookupService.findByCollege(
  OtaCollege.SHERIDAN,
);

const withWorkDeclarations =
  await this.lookupService.findWithWorkDeclarations();

const recentGrads = await this.lookupService.findByGraduationYear(2024);

// Experience level categorization
const newGrads = await this.lookupService.findByExperienceLevel('new');
const midLevel = await this.lookupService.findByExperienceLevel('mid');
const senior = await this.lookupService.findByExperienceLevel('senior');

// Geographic filtering
const canadianEducation =
  await this.lookupService.findCanadianCollegeEducation();
const internationalEducation =
  await this.lookupService.findInternationalEducation();

// Verification requirements
const requiresVerification =
  await this.lookupService.findRequiringVerification();

// Complex multi-criteria filtering
const complexQuery = await this.lookupService.findWithCriteria({
  workDeclaration: true,
  college: OtaCollege.SHERIDAN,
  country: Country.CANADA,
  requiresVerification: false,
  limit: 50,
  offset: 0,
});

// Comprehensive OTA statistics and analytics
const stats = await this.lookupService.getEducationStatistics();
console.log('Total OTA records:', stats.totalRecords);
console.log('By work declaration status:', stats.byWorkDeclarationStatus);
console.log('By college:', stats.byCollege);
console.log('By country:', stats.byCountry);
console.log('By education category:', stats.byEducationCategory);
console.log('By degree type:', stats.byDegreeType);
console.log(
  'International education count:',
  stats.internationalEducationCount,
);
console.log('Verification required count:', stats.verificationRequiredCount);

// Search functionality
const workExperienceSearch =
  await this.lookupService.searchByWorkDeclarationContent('clinical placement');
```

## Integration Notes

### Repository Pattern Implementation

- **Clean Architecture**: Data access abstracted through OTA repository layer
- **Type Safety**: Strong typing throughout with OTA mapper integration
- **Performance**: Optimized queries with minimal data transfer for OTA operations
- **Error Handling**: Structured error management with OTA-specific context
- **Logging**: Comprehensive logging for debugging and monitoring OTA operations

### Event System Integration

- **Audit Trails**: Complete lifecycle event tracking for OTA education records
- **Business Events**: Integration hooks for external OTA verification systems
- **Performance Monitoring**: Event-based performance metrics for OTA operations
- **Error Tracking**: Event-driven error reporting and alerting for OTA processes

### Business Logic Utils Integration

- **Centralized OTA Validation**: Reusable validation logic across OTA services
- **Permission Management**: Role-based access control enforcement for OTA data
- **Data Transformation**: Type-safe mapping between OTA DTOs and entities
- **Utility Functions**: Common OTA operations abstracted into utilities

## Architecture Integration

All services are fully integrated with the enhanced OSOT architecture for OTA education:

- **Repository Pattern**: `OtaEducationRepositoryService` for clean data access
- **Event System**: `OtaEducationEventsService` for audit trails and notifications
- **Error Handling**: Enhanced `ErrorCodes` and `createAppError` for structured errors
- **Type Safety**: Comprehensive enum usage (`OtaCollege`, `DegreeType`, `Country`, etc.)
- **Validation**: Advanced validation with `OtaEducationValidationUtil`
- **Mapping**: Type-safe transformation with OTA mapper integration
- **Permissions**: Role-based access control with detailed privilege checking

### Enhanced Permission System

Granular role-based access control with enhanced privilege checking for OTA data:

- **main**: Full CRUD access including delete operations and administrative functions for OTA records
- **admin**: Read/Write access to all OTA data across accounts, no delete permissions
- **owner**: Create/Read/Write access to own OTA data with sensitive field filtering

### Performance Optimizations

- **Repository Pattern**: Optimized queries through specialized OTA repository methods
- **Type Safety**: Compile-time type checking reduces runtime errors in OTA operations
- **Caching Strategy**: Intelligent caching of frequently accessed OTA data
- **Query Optimization**: Efficient database access patterns for OTA education records
- **Error Reduction**: Comprehensive validation reduces invalid OTA operations

## OTA-Specific Considerations

### Work Declaration Management

- **Format Validation**: Comprehensive validation of work declaration content
- **Completeness Checking**: Ensures work declarations meet OTA requirements
- **Search Functionality**: Full-text search capabilities within work declarations
- **Version Control**: Track changes to work declarations over time

### College and Institution Handling

- **Canadian OTA Programs**: Specialized handling for recognized Canadian OTA colleges
- **International Recognition**: Support for international OTA education validation
- **Verification Requirements**: Automatic flagging of records requiring additional verification
- **Geographic Consistency**: Validation of college-country alignment

### Graduation and Experience Tracking

- **Experience Level Categorization**: Automatic categorization based on graduation year
- **New Graduate Support**: Specialized handling for recent OTA graduates
- **Career Progression**: Track education to practice progression
- **Temporal Analysis**: Year-over-year analysis of OTA graduation trends

### Regulatory Compliance

- **Data Validation**: Comprehensive validation aligned with OTA regulatory requirements
- **Audit Trails**: Complete audit trails for regulatory compliance
- **Privacy Protection**: Role-based access control for sensitive OTA data
- **Integration Ready**: Prepared for integration with regulatory systems

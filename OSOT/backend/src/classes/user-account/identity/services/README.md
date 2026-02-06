# Identity Services (ENTERPRISE ARCHITECTURE)

## Purpose

Contains specialized business logic services for Identity domain operations with comprehensive CRUD functionality, business rule validation, and advanced lookup capabilities. These services follow **Enterprise Architecture patterns** with Repository abstraction, Event-driven architecture, Structured logging, and Security-first design principles.

## Enterprise Standards Compliance

✅ **Repository Pattern**: Clean data access abstraction with dependency injection tokens
✅ **Event-Driven Architecture**: Comprehensive lifecycle event management with audit trails
✅ **Structured Logging**: Operation IDs, security-aware logging with PII redaction
✅ **Security-First Design**: Privilege-based access control and comprehensive audit
✅ **Hybrid Architecture**: Modern Repository + Legacy DataverseService for migration
✅ **Centralized Error Handling**: Uses `createAppError` and `ErrorCodes` from `/common/errors`
✅ **Centralized Enums**: Imports all enums from `/common/enums` index
✅ **Type Safety**: Full TypeScript integration with `DataverseIdentity` interfaces

## Service Architecture Overview

### **🔧 Identity CRUD Service (`identity-crud.service.ts`) - ENTERPRISE**

Core CRUD operations with business rule validation, structured logging, and role-based permissions.

#### **Enterprise Dependency Injection**

```ts
@Injectable()
export class IdentityCrudService {
  private readonly logger = new Logger(IdentityCrudService.name);

  constructor(
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IdentityRepository,
    private readonly businessRuleService: IdentityBusinessRuleService,
    private readonly eventsService: IdentityEventService,
  ) {}
}
```

#### **Structured Logging Implementation**

```ts
// Operation tracking with unique IDs
const operationId = Math.random().toString(36).substring(2, 15);

this.logger.log(`Identity creation initiated - Operation: ${operationId}`, {
  operation: 'create_identity',
  operationId,
  userRole: userRole || 'undefined',
  hasPermissions: { canCreate, canRead, canWrite },
  timestamp: new Date().toISOString(),
});

// PII redaction for security
const filteredResponse = { ...identityResponse };
delete filteredResponse.userBusinessId; // Redact sensitive data

this.logger.log(`Identity created successfully - Operation: ${operationId}`, {
  operation: 'create_identity',
  operationId,
  identityId: filteredResponse?.osot_identity_id?.substring(0, 8) + '...',
  userRole: userRole || 'undefined',
  timestamp: new Date().toISOString(),
});
```

#### **Enterprise Permission System Architecture**

```ts
// Permission Hierarchy with Enhanced Security:
// - main: Full CRUD access to all fields + structured audit logging
// - admin: Read/Write access to all fields, no delete + permission tracking
// - owner: Create/Read/Write access, sensitive fields filtered + security logs
// - Filtered fields for 'owner': access_modifiers, privilege, audit fields
```

#### **Core CRUD Operations with Enterprise Features**

##### **`create(createIdentityDto, userRole): Promise<IdentityResponseDto>`**

Creates new identity with comprehensive validation, structured logging, and event emission.

**Enterprise Features:**

- **Structured Logging**: Operation IDs with PII redaction and security context
- **Permission Validation**: `canCreate(userRole)` with detailed audit logs
- **Business Rule Validation**: User Business ID uniqueness, cultural consistency
- **Event-Driven Architecture**: `IdentityCreated` event with comprehensive context
- **Error Management**: Structured error handling with operation tracking
- **Security Logging**: Permission denials and access attempts tracked

**Enhanced Process Flow:**

1. **Operation Initialization**: Generate unique operation ID for tracking
2. **Permission Verification**: `canCreate` with security audit logging
3. **Structured Logging**: Request initiation with context and PII redaction
4. **Business Rule Validation**: `validateForCreation` with detailed error context
5. **Repository Transaction**: `identityRepository.create` with error handling
6. **Response Processing**: `mapDataverseToIdentityResponse` with field filtering
7. **Success Logging**: Structured success logs with redacted sensitive data
8. **Event Emission**: `emitIdentityCreated` with comprehensive audit context
9. **Error Handling**: Structured error logging with operation context

**Structured Logging Example:**

```ts
// Success logging with PII redaction
this.logger.log(`Identity created successfully - Operation: ${operationId}`, {
  operation: 'create_identity',
  operationId,
  identityId: filteredResponse?.osot_identity_id?.substring(0, 8) + '...',
  userRole: userRole || 'undefined',
  hasPermissions: { canCreate, canRead, canWrite },
  timestamp: new Date().toISOString(),
});

// Error logging with context
this.logger.error(`Identity creation failed - Operation: ${operationId}`, {
  operation: 'create_identity',
  operationId,
  error: error instanceof Error ? error.message : 'Unknown error',
  userRole: userRole || 'undefined',
  timestamp: new Date().toISOString(),
});
```

##### **`findOne(id, userRole): Promise<IdentityResponseDto | null>`**

Retrieves identity by GUID with comprehensive security logging and role-based field filtering.

**Enterprise Features:**

- **Operation Tracking**: Unique operation IDs for audit trails
- **Permission Logging**: Security-aware access attempt tracking
- **PII Redaction**: GUID masking in logs (`id?.substring(0, 8) + '...'`)
- **Not Found Tracking**: Structured logging for missing records
- **Error Context**: Comprehensive error logging with operation details

##### **`findByUserBusinessId(userBusinessId, userRole): Promise<IdentityResponseDto | null>`**

Finds identity by unique business identifier with enhanced security validation and PII protection.

**Security Features:**

- **PII Redaction**: Business ID masking in logs (first 4 chars + '...')
- **Permission Auditing**: Detailed access control logging
- **Operation Tracking**: Full audit trail with context
- **Error Recovery**: Graceful error handling with structured logging

##### **`update(id, updateIdentityDto, userRole): Promise<IdentityResponseDto | null>`**

Updates existing identity with comprehensive change tracking, validation, and structured logging.

**Enterprise Features:**

- **Change Detection**: Detailed tracking of field modifications
- **Validation Logging**: Business rule validation with structured context
- **Update Events**: `IdentityUpdated` with specific change tracking
- **Operation Auditing**: Complete audit trail with operation IDs
- **Error Recovery**: Structured error handling with detailed context

##### **`delete(id, userRole): Promise<boolean>`**

Removes identity with comprehensive security auditing and cleanup tracking.

**Security Features:**

- **Restrictive Permissions**: Only 'main' role with detailed audit logging
- **Pre-deletion Validation**: Comprehensive existence checking with logging
- **Cleanup Events**: `IdentityDeleted` with full security context
- **Operation Tracking**: Complete deletion audit trail
- **Error Recovery**: Graceful error handling with structured logging

##### **`getDataCompletenessAssessment(id): Promise<CompletenessResult>`**

Analyzes identity data completeness for verification purposes.

#### **Role-Based Field Filtering**

##### **Security Implementation**

```ts
private filterIdentityFields(identity: IdentityResponseDto, userRole?: string): IdentityResponseDto {
  // main/admin: Full access to all fields
  if (userRole === 'main' || userRole === 'admin') {
    return identity;
  }

  // owner: Limited access, sensitive fields filtered out
  if (userRole === 'owner') {
    return {
      osot_identity_id: identity.osot_identity_id,
      osot_user_business_id: identity.osot_user_business_id,
      osot_language: identity.osot_language,
      osot_table_account: identity.osot_table_account,
    } as IdentityResponseDto;
  }

  // Default: Full identity for backward compatibility
  return identity;
}
```

### **⚖️ Identity Business Rule Service (`identity-business-rule.service.ts`) - ENTERPRISE**

Centralized business logic and validation with Repository Pattern, Event integration, and Structured Logging.

#### **Enterprise Architecture Integration**

```ts
@Injectable()
export class IdentityBusinessRuleService {
  private readonly logger = new Logger(IdentityBusinessRuleService.name);

  constructor(
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IdentityRepository,
    private readonly identityEvents: IdentityEventService,
    private readonly dataverseService: DataverseService,
  ) {}
}
```

#### **Business Rules Implementation with Enterprise Features**

##### **User Business ID Management with Structured Logging**

```ts
// Uniqueness Validation with Operation Tracking
async checkUserBusinessIdUniqueness(
  userBusinessId: string,
  excludeIdentityId?: string
): Promise<boolean> {
  const operationId = Math.random().toString(36).substring(2, 15);

  this.logger.log(`Business ID uniqueness check initiated - Operation: ${operationId}`, {
    operation: 'check_business_id_uniqueness',
    operationId,
    userBusinessId: userBusinessId?.substring(0, 4) + '...', // PII redaction
    timestamp: new Date().toISOString(),
  });
}

// Pattern Generation with Security Logging
async generateUserBusinessId(): Promise<string> {
  // CSV Pattern: osot-id-0000001
  // With comprehensive audit logging
}
```

##### **Enhanced Validation Methods with Operation Tracking**

###### **`validateForCreation(dto, accountId): Promise<ValidationResult>`**

Comprehensive creation validation with structured logging and security auditing.

**Enterprise Validation Features:**

- **Operation Tracking**: Unique operation IDs for complete audit trails
- **Security Logging**: Permission validation with detailed context
- **Business Rule Auditing**: Each validation step logged with context
- **Error Context**: Detailed validation failure information
- **PII Protection**: Sensitive data redaction in logs

###### **`validateForUpdate(dto, existingUserBusinessId): Promise<ValidationResult>`**

Update validation with comprehensive change tracking and security auditing.

**Enterprise Update Features:**

- **Change Detection**: Field-level modification tracking
- **Security Auditing**: Permission-based validation logging
- **Business Rule Enforcement**: Immutability rules with audit trails
- **Operation Context**: Complete validation audit with operation IDs

#### **Data Normalization**

##### **`normalizeForCreation(dto): IdentityCreateDto`**

Applies defaults and formatting per CSV specifications.

**Normalization Rules:**

- **Default Access Modifiers**: Private (CSV default)
- **Default Privilege**: Owner (CSV default)
- **Case Standardization**: User Business ID to uppercase
- **String Trimming**: Name and text field cleanup
- **Array Formatting**: Language array standardization

##### **`normalizeForUpdate(dto): IdentityUpdateDto`**

Update-specific normalization with existing data preservation.

#### **Permission Management**

##### **Privilege-Based Access Control**

```ts
canCreateIdentity(userPrivilege: Privilege): boolean  // Admin, Owner, Main
canUpdateIdentity(userPrivilege: Privilege): boolean  // Admin, Owner, Main
canDeleteIdentity(userPrivilege: Privilege): boolean  // Admin, Owner only
```

#### **Data Quality Assessment**

##### **`assessDataCompleteness(identity): CompletenessResult`**

Evaluates profile completeness for verification scoring.

**Assessment Criteria:**

- **Required Fields**: User Business ID, Language
- **Optional Fields**: Demographics, cultural identity, accessibility
- **Completeness Score**: Percentage calculation (0-100%)
- **Missing Fields**: Specific field identification

##### **`meetsMinimumRequirements(identity): boolean`**

Validates minimum system operation requirements.

### **🔍 Identity Lookup Service (`identity-lookup.service.ts`) - ENTERPRISE**

Advanced query operations with Repository Pattern, Hybrid Architecture, and Security-First Design.

#### **Enterprise Architecture Features**

```ts
@Injectable()
export class IdentityLookupService {
  private readonly logger = new Logger(IdentityLookupService.name);

  constructor(
    private readonly dataverseService: DataverseService,
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IdentityRepository,
    private readonly identityEvents: IdentityEventService,
  ) {}
}
```

#### **Hybrid Architecture Implementation**

```ts
// Modern Repository Path with fallback to Legacy DataverseService
if (!credentials) {
  this.logger.debug(
    `Using Repository Pattern for lookup - Operation: ${operationId}`,
  );

  const repositoryResult = await this.identityRepository
    .findByGuid(guid)
    .catch((error: Error) => {
      this.logger.warn(
        `Repository lookup failed, fallback to legacy - Operation: ${operationId}`,
        {
          operation: 'findOneByGuid',
          operationId,
          error: error.message,
          fallbackMethod: 'DataverseService',
          timestamp: new Date().toISOString(),
        },
      );
      return null;
    });
}

// Legacy DataverseService Path for backward compatibility
this.logger.debug(
  `Using Legacy DataverseService for lookup - Operation: ${operationId}`,
);
```

#### **Core Lookup Operations with Enterprise Security**

##### **`findOneByGuid(guid, credentials?, userRole?): Promise<DataverseIdentity>`**

GUID-based lookup with comprehensive security logging and operation tracking.

**Enterprise Security Features:**

- **Operation Tracking**: Unique operation IDs for complete audit trails
- **Permission Validation**: `canRead(userRole)` with detailed security logging
- **PII Protection**: GUID masking in logs (`guid?.substring(0, 8) + '...'`)
- **Hybrid Architecture**: Repository Pattern with legacy fallback
- **Error Recovery**: Comprehensive error handling with structured logging

##### **`findOneByUserBusinessId(userBusinessId, credentials?, userRole?): Promise<DataverseIdentity | null>`**

Business identifier lookup with enhanced PII protection and security auditing.

**Security Features:**

- **PII Redaction**: Business ID masking (`userBusinessId?.substring(0, 4) + '...'`)
- **Permission Auditing**: Detailed access control validation and logging
- **Operation Context**: Complete lookup audit trail with operation IDs
- **Security Logging**: Access attempts and permission denials tracked

##### **`findByAccount(accountId, credentials?, userRole?): Promise<DataverseIdentity[]>`**

Account-based lookup with bulk operation tracking and security validation.

**Enterprise Features:**

- **Account ID Masking**: PII protection (`accountId?.substring(0, 8) + '...'`)
- **Permission Validation**: Role-based access control with audit logging
- **Count Tracking**: Performance monitoring with result count logging
- **Bulk Operation Auditing**: Complete audit trail for account-wide lookups

##### **`findByLanguage(language, credentials?, userRole?): Promise<DataverseIdentity[]>`**

Cultural/demographic queries with comprehensive security and operation tracking.

**Enhanced Features:**

- **Cultural Analysis Logging**: Language preference tracking for business analytics
- **Permission Validation**: Access control for demographic data
- **Operation Auditing**: Complete audit trail with cultural context

#### **Type-Safe Demographic Queries**

```ts
findByLanguage(language, credentials?, userRole?): Promise<DataverseIdentity[]>
findByRace(race, credentials?): Promise<DataverseIdentity[]>
findByGender(gender, credentials?): Promise<DataverseIdentity[]>
findByPrivilege(privilege, credentials?): Promise<DataverseIdentity[]>
findByAccessModifier(accessModifier, credentials?): Promise<DataverseIdentity[]>
```

## Enterprise Error Handling Architecture

### **Structured Error Context with Operation Tracking**

```ts
// All service methods include comprehensive error handling with operation IDs
try {
  const operationId = Math.random().toString(36).substring(2, 15);
  this.logger.log(`Operation initiated - Operation: ${operationId}`, {
    operation: 'specific_operation_name',
    operationId,
    userRole: userRole || 'undefined',
    timestamp: new Date().toISOString(),
  });

  const result = await operation();

  this.logger.log(
    `Operation completed successfully - Operation: ${operationId}`,
    {
      operation: 'specific_operation_name',
      operationId,
      success: true,
      timestamp: new Date().toISOString(),
    },
  );

  return result;
} catch (error) {
  this.logger.error(`Operation failed - Operation: ${operationId}`, {
    operation: 'specific_operation_name',
    operationId,
    error: error instanceof Error ? error.message : 'Unknown error',
    userRole: userRole || 'undefined',
    timestamp: new Date().toISOString(),
  });

  if (error && typeof error === 'object' && 'code' in error) {
    throw error; // Re-throw custom errors
  }

  throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
    operation: 'specific_operation_name',
    operationId,
    error: error instanceof Error ? error.message : 'Unknown error',
    context: {
      /* relevant operation data */
    },
  });
}
```

### **Enhanced Permission Error Patterns with Security Auditing**

```ts
// Standardized permission error handling with security logging
if (!canCreate(userRole)) {
  this.logger.warn(`Permission denied - Operation: ${operationId}`, {
    operation: 'create_identity',
    operationId,
    requiredPrivilege: 'canCreate',
    userRole: userRole || 'undefined',
    error: 'PERMISSION_DENIED',
    timestamp: new Date().toISOString(),
  });

  throw createAppError(ErrorCodes.PERMISSION_DENIED, {
    operation: 'create_identity',
    operationId,
    message: 'Insufficient permissions to create identity',
    requiredRole: 'main or owner',
    currentRole: userRole,
  });
}
```

## Enterprise Service Integration Patterns

### **Repository Pattern Integration with Type Safety**

```ts
// Clean repository abstraction with TypeScript safety and error handling
const record = (await this.identityRepository.findByGuid(
  id,
)) as DataverseIdentity;
const responseDto = mapDataverseToIdentityResponse(record);
return responseDto ? this.filterIdentityFields(responseDto, userRole) : null;
```

### **Event System Integration with Comprehensive Context**

```ts
// Lifecycle event emission with complete audit context
this.eventsService.emitIdentityCreated({
  identityId: filteredResponse.osot_identity_id || '',
  accountId: 'default',
  userBusinessId: filteredResponse.osot_user_business_id || '',
  language: filteredResponse.osot_language || [],
  privilege: (filteredResponse.osot_privilege as Privilege) || Privilege.OWNER,
  createdBy: 'system',
  operationId, // Enhanced with operation tracking
  timestamp: new Date().toISOString(),
});
```

### **Structured Logging Integration with PII Protection**

```ts
// Security-aware logging with comprehensive context
this.logger.log(`Identity operation completed - Operation: ${operationId}`, {
  operation: 'identity_operation',
  operationId,
  identityId: result?.osot_identity_id?.substring(0, 8) + '...', // PII redaction
  userRole: userRole || 'undefined',
  hasPermissions: { canCreate, canRead, canWrite },
  timestamp: new Date().toISOString(),
});
```

## Enterprise Usage Examples

### **Complete CRUD Operations with Enterprise Features**

```ts
// Create with comprehensive logging and validation
const operationId = 'op_' + Date.now();
const newIdentity = await identityCrudService.create(
  {
    osot_user_business_id: 'OSOT-ID-1234567',
    osot_language: [Language.ENGLISH, Language.FRENCH],
    osot_chosen_name: 'Alex Thompson',
  },
  'main', // Role for permission validation
);
// Automatic operation tracking, PII redaction, and event emission

// Find with role-based filtering and security logging
const identity = await identityCrudService.findOne(identityId, 'owner');
// Automatic permission validation, audit logging, and field filtering

// Update with comprehensive change tracking
const updatedIdentity = await identityCrudService.update(
  identityId,
  { osot_chosen_name: 'Alexander Thompson' },
  'admin',
);
// Change detection, validation logging, and event emission
```

### **Business Rule Validation with Enterprise Logging**

```ts
// Creation validation with operation tracking
const validation = await businessRuleService.validateForCreation(
  createDto,
  accountId,
);
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
  // Comprehensive validation logging with operation context
}

// Data completeness assessment with structured logging
const assessment = await businessRuleService.assessDataCompleteness(identity);
console.log(`Profile ${assessment.completenessScore}% complete`);
// Automatic assessment logging with privacy protection
```

### **Advanced Lookup Operations with Security**

```ts
// Secure lookup with permission validation and audit logging
const identity = await lookupService.findOneByGuid(
  guid,
  credentials,
  'admin', // Role for access control
);
// Automatic permission checking, PII redaction, and operation tracking

// Business ID lookup with enhanced security
const identity = await lookupService.findOneByUserBusinessId(
  userBusinessId,
  credentials,
  'main',
);
// Business ID masking, permission auditing, and security logging
```

## Enterprise Architecture Benefits

### **Security-First Design**

- **Operation Tracking**: Every operation has unique IDs for complete audit trails
- **PII Protection**: Automatic redaction of sensitive data in logs (GUIDs, Business IDs)
- **Permission Auditing**: Detailed logging of access control validation
- **Security Logging**: Comprehensive tracking of permission denials and access attempts
- **Role-Based Access Control**: Granular permission checking with audit trails
- **Field-Level Security**: Sensitive data protection with structured filtering

### **Observability & Monitoring**

- **Structured Logging**: Consistent log format with operation context
- **Performance Tracking**: Operation timing and result count monitoring
- **Error Context**: Comprehensive error information with operation details
- **Audit Trails**: Complete lifecycle tracking for compliance
- **Business Analytics**: Cultural and demographic insights with privacy protection

### **Enterprise Scalability**

- **Repository Abstraction**: Database-agnostic data access with type safety
- **Hybrid Architecture**: Modern Repository + Legacy service coexistence
- **Event-Driven Architecture**: Loose coupling for extensibility and integration
- **Type Safety**: Full TypeScript integration with `DataverseIdentity` interfaces
- **Error Recovery**: Graceful fallback mechanisms with comprehensive logging

### **Maintainability & Quality**

- **Clean Architecture**: Clear separation of concerns with dependency injection
- **Standardized Patterns**: Consistent error handling, logging, and validation
- **Comprehensive Testing**: Injectable dependencies and structured interfaces
- **Operation Context**: Detailed operation tracking for debugging and monitoring
- **Business Rule Centralization**: Domain logic consolidation with audit trails

## Enterprise Best Practices

1. **Service Layer Usage**: Use services for business logic with operation tracking, not direct repository access
2. **Permission Validation**: Always validate user roles with comprehensive audit logging before operations
3. **Event Emission**: Emit events for all significant lifecycle changes with complete context
4. **Structured Logging**: Use operation IDs and structured context for all operations
5. **Error Context**: Provide detailed error information with operation tracking for debugging
6. **Data Validation**: Apply business rules with comprehensive logging before persistence
7. **PII Protection**: Apply automatic redaction of sensitive data in logs
8. **Field Filtering**: Apply role-based security consistently with audit trails
9. **Transaction Management**: Use repository methods for data consistency with logging
10. **Performance Monitoring**: Leverage structured logging for performance insights and optimization

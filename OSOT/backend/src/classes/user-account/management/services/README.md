# Management Services (ENTERPRISE ARCHITECTURE)

## Purpose

Contains specialized business logic services for Management domain operations with comprehensive CRUD functionality, business rule validation, advanced lookup capabilities, enterprise audit trails, and business workflow events. These services follow **Enterprise Architecture patterns** with Repository abstraction, Security-first design, Structured logging, and Compliance-ready audit trails.

## Architecture Decision: Services + Events + Audit

Management is unique in having **both Events and Audit services** due to its critical security role:

### 🔄 **Events** (`ManagementEventService`)

- **Purpose**: Business workflow integration and real-time notifications
- **Focus**: System integration, event sourcing, and business processes
- **Target**: Other services, external systems, workflow engines
- **Data**: Business-relevant information for integration

### 📋 **Audit** (`ManagementAuditService`)

- **Purpose**: Compliance, regulatory audit trails, and security monitoring
- **Focus**: Legal compliance, security auditing, and regulatory requirements
- **Target**: Auditors, compliance teams, security monitoring
- **Data**: PII-redacted logs with security classifications

**Why Both?** Management handles critical security operations requiring:

- **Events**: Enable business workflows and system integration
- **Audit**: Ensure compliance and security monitoring

Other entities (Identity, Address, Contact) only have Events since they're less security-critical.

## Enterprise Standards Compliance

✅ **Repository Pattern**: Clean data access abstraction with dependency injection tokens
✅ **Structured Logging**: Operation IDs, security-aware logging with PII redaction
✅ **Security-First Design**: Role-based access control and comprehensive audit
✅ **Audit & Compliance**: Complete lifecycle tracking with regulatory compliance support
✅ **Hybrid Architecture**: Modern Repository + Legacy DataverseService for migration
✅ **Centralized Error Handling**: Uses `createAppError` and `ErrorCodes` from `/common/errors`
✅ **Centralized Enums**: Imports all enums from `/common/enums` index
✅ **Type Safety**: Full TypeScript integration with `DataverseManagement` interfaces

## Service Architecture Overview

### **🔧 Management CRUD Service (`management-crud.service.ts`) - ENTERPRISE**

Complete CRUD operations with Repository Pattern, Business Rule integration, and Enterprise logging.

#### **Enterprise Architecture Features**

- **Repository Pattern**: `ManagementRepository` for clean data access abstraction
- **Business Rule Integration**: `ManagementBusinessRuleService` for validation
- **Structured Logging**: Operation IDs with security-aware PII redaction
- **Role-Based Security**: Privilege checking with comprehensive audit trails
- **Error Management**: Centralized error handling with detailed context

#### **Core CRUD Operations with Enterprise Features**

##### **`create(createManagementDto, userRole): Promise<ManagementResponseDto>`**

Creates new management record with comprehensive validation and audit logging.

**Enterprise Features:**

- **Permission Validation**: Role-based access control with security logging
- **Business Rule Validation**: Complete validation framework integration
- **Operation Tracking**: Unique operation IDs for complete audit trails
- **Data Transformation**: DTO → Internal → Dataverse mapper chain
- **Security Logging**: PII redaction and structured audit context

##### **`findOne(id, userRole): Promise<ManagementResponseDto | null>`**

Retrieves management by GUID with security logging and role-based filtering.

**Enterprise Features:**

- **Operation Tracking**: Unique operation IDs for audit trails
- **Permission Logging**: Security-aware access attempt tracking
- **PII Redaction**: GUID masking in logs (`id?.substring(0, 8) + '...'`)
- **Not Found Tracking**: Structured logging for missing records
- **Error Context**: Comprehensive error logging with operation details

##### **`findByAccountId(accountId, userRole): Promise<ManagementResponseDto[]>`**

Account-based lookup with comprehensive security and performance monitoring.

**Enterprise Features:**

- **Account Relationship Validation**: Verify account access permissions
- **Batch Processing**: Efficient handling of multiple management records
- **Security Filtering**: Role-based result filtering with audit trails
- **Performance Monitoring**: Query performance tracking and optimization

##### **`update(id, updateManagementDto, userRole): Promise<ManagementResponseDto | null>`**

Updates management with change tracking and comprehensive validation.

**Enterprise Features:**

- **Change Detection**: Before/after value comparison for audit trails
- **Immutable Field Protection**: Prevents modification of system fields
- **Business Rule Enforcement**: Complete validation before persistence
- **Update Audit**: Comprehensive change logging with user attribution

##### **`delete(id, userRole): Promise<boolean>`**

Removes management with comprehensive security auditing and cleanup tracking.

**Enterprise Features:**

- **Restrictive Permissions**: Role-based deletion with detailed audit logging
- **Pre-deletion Validation**: Comprehensive existence checking with logging
- **Cleanup Events**: Complete deletion audit trail with security context
- **Operation Tracking**: Complete deletion audit trail
- **Error Recovery**: Graceful error handling with structured logging

### **🔍 Management Lookup Service (`management-lookup.service.ts`) - ENTERPRISE**

Advanced query operations with Repository Pattern, Hybrid Architecture, and Security-First Design.

#### **Enterprise Architecture Features**

- **Hybrid Architecture**: Repository Pattern with DataverseService fallback
- **Security Logging**: Operation tracking with PII redaction
- **Performance Optimization**: Efficient queries with minimal data transfer
- **Credential Management**: Support for both authenticated and repository queries
- **Error Recovery**: Comprehensive error handling with structured logging

#### **Core Lookup Operations with Enterprise Security**

##### **`findOneByGuid(guid, credentials?, userRole?): Promise<DataverseManagement | null>`**

GUID-based lookup with comprehensive security logging and operation tracking.

**Enterprise Security Features:**

- **Operation Tracking**: Unique operation IDs for complete audit trails
- **Permission Validation**: `canRead(userRole)` with detailed security logging
- **PII Protection**: GUID masking in logs (`guid?.substring(0, 8) + '...'`)
- **Hybrid Architecture**: Repository Pattern with legacy fallback
- **Error Recovery**: Comprehensive error handling with structured logging

##### **`findByAccount(accountId, credentials?, userRole?): Promise<DataverseManagement[]>`**

Account-based lookup with security filtering and performance monitoring.

**Enterprise Features:**

- **Account Access Validation**: Verify user permissions for account access
- **Batch Result Processing**: Efficient handling of multiple records
- **Performance Monitoring**: Query timing and result count tracking
- **Security Auditing**: Access attempt logging with user attribution

##### **`searchManagement(criteria, options, credentials?): Promise<SearchResult>`**

Advanced multi-criteria search with pagination and sorting capabilities.

**Search Features:**

- **Complex Filtering**: Multi-field search with privilege and access modifier filters
- **Pagination Support**: Limit, offset, and count functionality
- **Sorting Options**: Configurable field-based sorting with direction control
- **Performance Optimization**: Efficient OData query generation

##### **`getManagementStatistics(accountId, credentials?): Promise<Statistics>`**

Comprehensive analytics and reporting for management entities.

**Analytics Features:**

- **Distribution Analysis**: Privilege and access modifier breakdowns
- **Performance Metrics**: Query performance and result analysis
- **Trend Analysis**: Management entity growth and usage patterns
- **Business Intelligence**: Data insights for decision making

### **⚖️ Management Business Rule Service (`management-business-rule.service.ts`) - ENTERPRISE**

Centralized business logic and validation with Repository Pattern and Structured Logging.

#### **Enterprise Architecture Integration**

- **Repository Pattern**: Clean data access through ManagementRepository
- **Structured Logging**: Operation IDs, security-aware logging with PII redaction
- **Security-First Design**: Privilege-based access control with comprehensive validation
- **Business Rule Framework**: Centralized validation logic with detailed error context
- **Error Management**: Structured error handling with operation tracking

#### **Business Rules Implementation with Enterprise Features**

##### **Data Integrity Validation with Operation Tracking**

**Account Relationship Validation:**

- Verify account existence and user access permissions
- Validate account-management relationship integrity
- Security logging for access validation attempts

**Enum Validation:**

- AccessModifier and Privilege enum validation
- Type-safe validation with comprehensive error reporting
- Business rule compliance checking

##### **Enhanced Validation Methods with Operation Tracking**

###### **`validateForCreation(dto, accountId, userRole): Promise<ValidationResult>`**

Comprehensive creation validation with structured logging and security auditing.

**Enterprise Validation Features:**

- **Operation Tracking**: Unique operation IDs for complete audit trails
- **Security Logging**: Permission validation with detailed context
- **Business Rule Auditing**: Each validation step logged with context
- **Error Context**: Detailed validation failure information
- **PII Protection**: Sensitive data redaction in logs

###### **`validateForUpdate(dto, existingId, userRole): Promise<ValidationResult>`**

Update validation with immutable field protection and change tracking.

**Update Validation Features:**

- **Immutable Field Protection**: Prevent modification of system identifiers
- **Change Detection**: Validate only modified fields for efficiency
- **Permission Escalation**: Detect privilege changes requiring additional validation
- **Audit Trail**: Complete validation attempt logging

##### **Permission Management with Security Auditing**

**Role-Based Access Control:**

- `canCreateManagement()`, `canReadManagement()`, `canUpdateManagement()`, `canDeleteManagement()`
- Detailed permission checking with audit trails
- Security event logging for permission denials

**Data Completeness Assessment:**

- `assessDataCompleteness()`: Analyze management record completeness
- `meetsMinimumRequirements()`: Validate minimum data requirements
- Business intelligence for data quality improvement

### **📋 Management Audit Service (`management-audit.service.ts`) - ENTERPRISE**

Comprehensive audit trails and compliance with enterprise-grade security and reporting.

#### **Enterprise Audit Features**

- **Complete Lifecycle Tracking**: Creation, updates, deletions, and access operations
- **Security Event Monitoring**: Permission denials, unauthorized access, security violations
- **Compliance Reporting**: Regulatory audit trails with automated compliance validation
- **PII Protection**: Automatic redaction of sensitive data in audit logs
- **Threat Intelligence**: Security event classification and risk assessment

#### **Audit Operations with Enterprise Compliance**

##### **`logManagementCreation(auditData): void`**

Comprehensive audit trail for management entity creation.

**Audit Features:**

- **Complete Context**: User attribution, IP tracking, operation details
- **PII Protection**: Automatic redaction of sensitive identifiers
- **Security Classification**: Operation risk level assessment
- **Compliance Flags**: Regulatory compliance requirement tracking

##### **`logManagementUpdate(auditData): void`**

Change tracking with before/after values for compliance.

**Change Tracking Features:**

- **Before/After Values**: Complete change documentation
- **Field-Level Changes**: Specific field modification tracking
- **Security Level Assessment**: Risk evaluation based on changed fields
- **Compliance Documentation**: Regulatory change requirement tracking

##### **`logSecurityEvent(auditData): void`**

Security event tracking with threat intelligence integration.

**Security Features:**

- **Event Classification**: Permission denials, unauthorized access, violations
- **Risk Assessment**: LOW, MEDIUM, HIGH, CRITICAL risk classification
- **Threat Context**: Security context preservation for analysis
- **Alert Generation**: Automatic alerting for high-risk events

##### **`generateComplianceReport(criteria): ComplianceReport`**

Regulatory compliance reporting with automated validation.

**Compliance Features:**

- **Audit Trail Completeness**: Verify complete audit coverage
- **Success Rate Analysis**: Operation success/failure statistics
- **Security Event Summary**: Security incident reporting
- **Compliance Status**: COMPLIANT, NON_COMPLIANT, REVIEW_REQUIRED classification

## Enterprise Service Integration Patterns

### **Repository Pattern Integration with Type Safety**

```ts
// Clean repository abstraction with dependency injection
constructor(
  @Inject(MANAGEMENT_REPOSITORY)
  private readonly managementRepository: ManagementRepository,
) {}

// Type-safe repository operations
const management = await this.managementRepository.findByGuid(id);
```

### **Structured Logging Integration with PII Protection**

```ts
// Security-aware logging with comprehensive context
this.logger.log(`Management operation completed - Operation: ${operationId}`, {
  operation: 'management_operation',
  operationId,
  managementId:
    result?.osot_table_account_managementid?.substring(0, 8) + '...', // PII redaction
  userRole: userRole || 'undefined',
  timestamp: new Date().toISOString(),
});
```

### **Business Rule Integration with Validation Framework**

```ts
// Comprehensive validation with detailed error context
const validation = await this.businessRuleService.validateForCreation(
  dto,
  accountId,
  userRole,
);

if (!validation.isValid) {
  throw createAppError(ErrorCodes.VALIDATION_FAILED, {
    operation: 'create_management',
    errors: validation.errors,
    operationId,
  });
}
```

## Enterprise Usage Examples

### **Complete CRUD Operations with Enterprise Features**

```ts
// Create with comprehensive logging and validation
const operationId = 'op_' + Date.now();
const newManagement = await managementCrudService.create(
  {
    osot_access_modifiers: AccessModifier.PRIVATE,
    osot_privilege: Privilege.MAIN,
  },
  'admin', // Role for permission validation
);
// Automatic operation tracking, PII redaction, and audit logging

// Find with role-based filtering and security logging
const management = await managementCrudService.findOne(managementId, 'owner');
// Automatic permission validation, audit logging, and field filtering

// Update with comprehensive change tracking
const updatedManagement = await managementCrudService.update(
  managementId,
  { osot_privilege: Privilege.ADMIN },
  'admin',
);
// Change detection, validation logging, and audit trail
```

### **Advanced Lookup Operations with Security**

```ts
// Secure lookup with permission validation and audit logging
const management = await lookupService.findOneByGuid(
  guid,
  credentials,
  'admin', // Role for access control
);
// Automatic permission checking, PII redaction, and operation tracking

// Account-based lookup with security filtering
const managements = await lookupService.findByAccount(
  accountId,
  credentials,
  'main',
);
// Account access validation, security logging, and result filtering
```

### **Business Rule Validation with Enterprise Context**

```ts
// Comprehensive validation with audit trails
const validation = await businessRuleService.validateForCreation(
  createDto,
  accountId,
  'main',
);

// Data completeness assessment for business intelligence
const completeness = businessRuleService.assessDataCompleteness(management);
// Business analytics with privacy-compliant data analysis
```

### **Enterprise Audit Operations**

```ts
// Complete audit trail for creation
auditService.logManagementCreation({
  operationId: 'op_123456',
  managementId: 'mgmt-001',
  accountId: 'acc-001',
  userRole: 'admin',
  timestamp: new Date(),
  success: true,
  dataValues: createdData,
});

// Security event logging with threat classification
auditService.logSecurityEvent({
  operationId: 'sec_789012',
  eventType: 'PERMISSION_DENIED',
  riskLevel: 'HIGH',
  securityContext: { attemptedOperation: 'delete' },
  timestamp: new Date(),
});
```

## Enterprise Error Handling Architecture

### **Structured Error Context with Operation Tracking**

```ts
// Comprehensive error context with operation correlation
throw createAppError(ErrorCodes.MANAGEMENT_NOT_FOUND, {
  operation: 'find_management',
  operationId,
  managementId: id?.substring(0, 8) + '...', // PII redaction
  userRole: userRole || 'undefined',
  timestamp: new Date().toISOString(),
});
```

### **Enhanced Permission Error Patterns with Security Auditing**

```ts
// Security-aware permission error handling
if (!canRead(userRole)) {
  this.logger.warn(`Access denied - Operation: ${operationId}`, {
    operation: 'permission_check',
    operationId,
    requiredPrivilege: 'READ',
    userRole: userRole || 'undefined',
    securityEvent: 'PERMISSION_DENIED',
  });

  throw createAppError(ErrorCodes.PERMISSION_DENIED, {
    message: 'Access denied to management operations',
    operationId,
    requiredPrivilege: 'READ',
    userRole: userRole || 'undefined',
  });
}
```

## Enterprise Architecture Benefits

### **Security-First Design**

- **Operation Tracking**: Every operation has unique IDs for complete audit trails
- **PII Protection**: Automatic redaction of sensitive data in logs (GUIDs, IDs)
- **Permission Auditing**: Detailed logging of access control validation
- **Security Logging**: Comprehensive tracking of permission denials and access attempts
- **Role-Based Access Control**: Granular permission checking with audit trails
- **Field-Level Security**: Sensitive data protection with structured filtering

### **Observability & Monitoring**

- **Structured Logging**: Consistent log format with operation context
- **Performance Tracking**: Operation timing and result count monitoring
- **Error Context**: Comprehensive error information with operation details
- **Audit Trails**: Complete lifecycle tracking for compliance
- **Business Analytics**: Management analytics with privacy protection

### **Compliance & Governance**

- **Regulatory Compliance**: Complete audit trails for regulatory requirements
- **Change Management**: Before/after tracking for all modifications
- **Security Governance**: Security event classification and response
- **Data Governance**: PII protection and data retention compliance
- **Business Rule Compliance**: Centralized rule enforcement with audit trails

## Migration Status

| Service                       | Architecture                  | Status      | Features                                                                         |
| ----------------------------- | ----------------------------- | ----------- | -------------------------------------------------------------------------------- |
| ManagementCrudService         | Repository + Logging + Events | ✅ COMPLETE | Operation tracking, Business rule integration, Role-based security, Audit trails |
| ManagementLookupService       | Hybrid + Logging + Migration  | ✅ COMPLETE | Security logging, PII redaction, Performance monitoring, Analytics capabilities  |
| ManagementBusinessRuleService | Rules Framework + Tracking    | ✅ COMPLETE | Validation framework, Permission checking, Data completeness, Security auditing  |
| ManagementAuditService        | Compliance + Security         | ✅ COMPLETE | Complete audit trails, Security events, Compliance reporting, PII protection     |

## Enterprise Best Practices

1. **Service Layer Usage**: Use services for business logic with operation tracking, not direct repository access
2. **Permission Validation**: Always validate user roles with comprehensive audit logging before operations
3. **Audit Integration**: Use audit service for all significant operations with complete context
4. **Structured Logging**: Use operation IDs and structured context for all operations
5. **Error Context**: Provide detailed error information with operation tracking for debugging
6. **Data Validation**: Apply business rules with comprehensive logging before persistence
7. **PII Protection**: Apply automatic redaction of sensitive data in logs
8. **Security Monitoring**: Use security event logging for threat detection and response
9. **Transaction Management**: Use repository methods for data consistency with logging
10. **Performance Monitoring**: Leverage structured logging for performance insights and optimization

## Guidelines (Enterprise)

- **Operation Tracking**: All operations generate unique operation IDs for comprehensive audit trails
- **Permission Enforcement**: All services require role validation with detailed security logging
- **Security-First**: PII redaction in logs, role-based field filtering, audit compliance
- **Audit Integration**: All state-changing operations integrate with audit service
- **Error Context**: Use createAppError with operation IDs and detailed context for debugging
- **Performance**: Monitor query performance and log metrics for optimization
- **Business Rules**: Centralized validation framework with comprehensive error reporting
- **Compliance**: Complete audit trails for regulatory compliance and governance
- **Migration Path**: Hybrid architecture supports gradual migration from legacy systems

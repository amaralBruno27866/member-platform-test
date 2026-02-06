# Address Services (ENTERPRISE ARCHITECTURE)

## Purpose

Contains enterprise-grade business logic for address operations following modern architectural patterns. Services orchestrate calls to repositories, external integrations, and emit comprehensive audit events. They are the core of the address domain logic with privilege-based access control, structured logging, and operation tracking.

## Architecture Overview

The address services have been modernized with enterprise patterns:

- **Repository Pattern**: Clean data access abstraction with DataverseAddressRepository
- **Event-Driven Architecture**: Comprehensive audit trails with AddressEventsService
- **Structured Logging**: Operation IDs, security-aware logging with PII redaction
- **Security-First Design**: Privilege-based access control and data filtering
- **Error Management**: Centralized error handling with createAppError and detailed context
- **Business Rules**: Integrated validation and standardization framework

## Available Services

### AddressCrudService (ENTERPRISE)

**Architecture Status**: ✅ MODERNIZED - Repository Pattern + Event System + Structured Logging

Primary service for CRUD operations with integrated enterprise security patterns.

**Enterprise Features:**

- Operation tracking with unique IDs for audit trails
- Comprehensive event emission for all CRUD operations
- Security-aware logging with PII redaction capabilities
- Privilege-based field filtering and access control
- Business rule validation with detailed error reporting

**Methods:**

- `create(createDto, userRole)` -> Enhanced with operation tracking, validates privileges, creates address, emits comprehensive events with audit data
- `findOne(id, userRole)` -> Gets single address with privilege validation and security-aware logging
- `findByAccount(accountId, userRole)` -> Retrieves addresses with role-based field filtering and performance monitoring
- `update(id, updateDto, userRole)` -> Applies business rules and updates with privilege checking and change tracking
- `remove(id, userRole)` -> Delete with privilege validation and comprehensive audit trail
- `getFormattedAddress(id, userRole)` -> Formatted address retrieval with Canadian standards
- `validateAddress(addressData)` -> Address validation without saving, with detailed reporting
- `filterAddressFields(address, userRole)` -> Privilege-based field filtering (OWNER/ADMIN/MAIN)

**Security Levels:**

- **OWNER**: Full CRUD access to all fields and operations
- **ADMIN**: Read/Write access to all fields, limited delete permissions
- **MAIN**: Create/Read/Write access with sensitive field filtering

### AddressLookupService (ENTERPRISE)

**Architecture Status**: ✅ MODERNIZED - Hybrid Architecture + Comprehensive Logging + Migration Path

Specialized service for address search, filtering, and geographic operations with hybrid architecture support.

**Enterprise Features:**

- Operation tracking with unique IDs for comprehensive audit trails
- Security-aware logging with PII redaction capabilities
- Privilege-based field filtering and access control
- Performance monitoring and query optimization
- Hybrid architecture enabling gradual migration from legacy systems

**Methods:**

- `findByAccountId(accountId, userRole)` -> Enhanced with operation tracking, searches addresses by account with privilege enforcement and audit logging
- `findByUserBusinessId(userBusinessId, userRole)` -> User business ID filtering with security validation and performance monitoring
- `findByPostalCode(postalCode, userRole)` -> Postal code searches with province-specific validation and audit trails
- `getAddressStatistics(userRole)` -> Generates address statistics with performance monitoring and privilege filtering
- `searchFormattedAddresses(query, userRole)` -> Comprehensive address search with Canadian formatting standards
- `filterAddressFields(address, userRole)` -> Privilege-based field filtering with security audit

**Security Integration:**

- Privilege-based access control with detailed audit trails
- PII redaction in logging for privacy compliance
- Performance monitoring for query optimization

### AddressBusinessRulesService (ENTERPRISE)

**Architecture Status**: ✅ MODERNIZED - Business Rule Framework + Operation Tracking + Event Integration

Service for validation, standardization, and business rule enforcement with comprehensive tracking.

**Enterprise Features:**

- Canadian postal code validation with province-specific rules
- Address standardization following Canadian addressing standards
- Comprehensive business rule validation with detailed error reporting
- Security-aware logging with PII redaction capabilities
- Operation tracking for compliance and debugging

**Methods:**

- `validatePostalCodeFormat(postalCode, province, userRole)` -> Enhanced with operation tracking, validates postal code format by province with comprehensive logging and audit trails
- `validateAddressCreation(addressData, userRole)` -> Complete address validation with privilege checking and detailed error reporting
- `validateAddressUpdate(addressId, addressData, userRole)` -> Update validation with business rule enforcement and audit logging
- `standardizeAddressData(addressData, userRole)` -> Address standardization according to Canada Post guidelines with operation tracking
- `createWithValidation(addressData, userRole)` -> Create address with full business rule validation and comprehensive audit
- `updateWithValidation(addressId, addressData, userRole)` -> Update with full validation and change tracking

**Canadian Standards:**

- Province-specific postal code validation (all 13 provinces/territories)
- Canada Post addressing standards compliance
- Bilingual address support (English/French)

## Permission System (Privilege-Based)

All services implement comprehensive privilege-based access control with detailed audit trails:

**Privilege Hierarchy:**

- **OWNER**: Full access to all operations and fields with comprehensive audit trails
- **ADMIN**: Extended access with administrative privileges and security monitoring
- **MAIN**: Standard access with sensitive field filtering and operation tracking

**Security Features:**

- Automatic field filtering based on privilege levels
- Security-aware logging with PII redaction
- Operation tracking for compliance auditing
- Privilege validation with detailed error reporting

## Integration Features (Enterprise)

- **Repository Pattern**: Clean abstraction with DataverseAddressRepository
- **Event-Driven Architecture**: AddressEventsService for comprehensive audit trails
- **Structured Logging**: Operation IDs, security-aware logging, PII redaction
- **Error Management**: createAppError with detailed context and operation tracking
- **Business Rules**: Comprehensive validation framework with Canadian standards
- **Security Framework**: Privilege-based access control with audit compliance

## Migration Status

| Service                     | Architecture                  | Status      | Features                                               |
| --------------------------- | ----------------------------- | ----------- | ------------------------------------------------------ |
| AddressCrudService          | Repository + Events + Logging | ✅ COMPLETE | Operation tracking, Event emission, Privilege security |
| AddressLookupService        | Hybrid + Logging + Migration  | ✅ COMPLETE | Audit trails, PII redaction, Performance monitoring    |
| AddressBusinessRulesService | Rules Framework + Tracking    | ✅ COMPLETE | Canadian standards, Operation tracking, Validation     |

## Usage Examples (Enterprise)

```typescript
// Create address with comprehensive audit and operation tracking
const operationId = `create_addr_${Date.now()}`;
const newAddress = await addressCrudService.create(createDto, 'OWNER');
// Result: Operation tracked, events emitted, security validated, audit logged

// Search addresses by postal code with privilege enforcement
const addresses = await addressLookupService.findByAccountId(
  accountId,
  'ADMIN',
);
// Result: PII-redacted logging, privilege filtering, performance monitored

// Validate postal code with comprehensive business rules
const isValid = addressBusinessRulesService.validatePostalCodeFormat(
  'K1A 0A6',
  Province.ONTARIO,
  'MAIN',
);
// Result: Operation tracked, province-specific validation, audit logged

// Update with full validation and change tracking
const updatedAddress = await addressBusinessRulesService.updateWithValidation(
  addressId,
  updateDto,
  'ADMIN',
);
// Result: Business rules applied, changes tracked, events emitted, audit logged
```

## Guidelines (Enterprise)

- **Operation Tracking**: All operations generate unique operation IDs for audit trails
- **Privilege Enforcement**: All services require privilege validation with detailed logging
- **Security-First**: PII redaction in logs, privilege-based field filtering, audit compliance
- **Event Emission**: All state-changing operations emit comprehensive audit events
- **Error Context**: Use createAppError with operation IDs and detailed context
- **Performance**: Monitor query performance and log metrics for optimization
- **Canadian Standards**: Follow Canada Post guidelines for address validation and formatting
- **Migration Path**: Hybrid architecture supports gradual migration from legacy systems

## Security Considerations

- **PII Protection**: Automatic redaction of sensitive data in logs
- **Privilege Validation**: Comprehensive privilege checking with audit trails
- **Operation Auditing**: All operations tracked with unique IDs and timestamps
- **Error Security**: No sensitive data exposed in error messages
- **Field Filtering**: Automatic filtering based on privilege levels
- **Compliance**: Full audit trails for regulatory compliance

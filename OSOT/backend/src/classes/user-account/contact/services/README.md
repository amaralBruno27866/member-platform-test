# Contact Services (ENTERPRISE ARCHITECTURE)

## Purpose

Contains enterprise-grade business logic for contact operations following modern architectural patterns. Services orchestrate calls to repositories, external integrations, and emit comprehensive audit events. They are the core of the contact domain logic with privilege-based access control, structured logging, and operation tracking.

## Architecture Overview

The contact services have been modernized with enterprise patterns:

- **Repository Pattern**: Clean data access abstraction with ContactRepository
- **Event-Driven Architecture**: Comprehensive audit trails with ContactEventsService
- **Structured Logging**: Operation IDs, security-aware logging with PII redaction
- **Security-First Design**: Privilege-based access control and data filtering
- **Business Rule Framework**: Integrated validation and Canadian standards compliance
- **Error Management**: Centralized error handling with createAppError and detailed context

## Available Services

### ContactCrudService (ENTERPRISE)

**Architecture Status**: ✅ MODERNIZED - Repository Pattern + Event System + Structured Logging

Primary service for CRUD operations with integrated enterprise security patterns.

**Enterprise Features:**

- Operation tracking with unique IDs for comprehensive audit trails
- Comprehensive event emission for all CRUD operations with social media tracking
- Security-aware logging with PII redaction capabilities for contact data
- Privilege-based field filtering and access control
- Business rule validation with detailed error reporting
- Social media profile management with platform-specific validation
- Professional networking analysis and tracking
- Communication preference management with Canadian standards

**Methods:**

- `create(createDto, userRole)` -> Enhanced with operation tracking, validates business ID uniqueness, normalizes social media URLs, creates contact with comprehensive audit trails
- `findOne(id, userRole)` -> Gets single contact with privilege validation and security-aware logging
- `findByBusinessId(businessId, userRole)` -> Retrieves contact by unique business ID with audit logging
- `findByAccount(accountId, userRole)` -> Account-based contact queries with performance monitoring
- `update(id, updateDto, userRole)` -> Applies business rules and updates with privilege checking and change tracking
- `remove(id, userRole)` -> Delete with privilege validation and comprehensive audit trail
- `filterContactFields(contact, userRole)` -> Privilege-based field filtering (OWNER/ADMIN/MAIN)

**Security Levels:**

- **OWNER**: Full CRUD access to all fields and operations
- **ADMIN**: Read/Write access to all fields, limited delete permissions
- **MAIN**: Create/Read/Write access with sensitive field filtering

### ContactLookupService (ENTERPRISE)

**Architecture Status**: ✅ MODERNIZED - Hybrid Architecture + Comprehensive Logging + Migration Path

Specialized service for contact search, filtering, and professional networking operations.

**Enterprise Features:**

- Operation tracking with unique IDs for comprehensive audit trails
- Security-aware logging with PII redaction for contact searches
- Privilege-based access control with detailed audit logging
- Performance monitoring for query optimization and analytics
- Social media platform validation with enterprise security
- Professional networking queries with business intelligence
- Canadian contact standards with bilingual support

**Methods:**

- `findOneByGuid(guid, userRole, credentials?)` -> Enhanced with operation tracking, finds contact by GUID with privilege validation and audit logging
- `findByBusinessId(businessId, userRole, credentials?)` -> Business ID searches with uniqueness validation and security logging
- `findByAccountId(accountId, userRole, credentials?)` -> Account-based contact queries with performance monitoring
- `findByJobTitle(jobTitlePattern, accountId?, userRole, credentials?)` -> Job title pattern matching with professional networking analytics
- `findBySocialMediaPlatform(platform, accountId?, userRole, credentials?)` -> Social media platform searches with privacy-compliant PII handling
- `findByEmail(email, userRole, credentials?)` -> Email-based lookups with security validation and audit compliance

**Social Media Integration:**

- Type-safe platform validation using SocialMediaPlatform enum
- Privacy-compliant PII redaction in audit logs
- Professional networking analysis with security controls

### ContactBusinessRuleService (ENTERPRISE)

**Architecture Status**: ✅ MODERNIZED - Business Rule Framework + Operation Tracking + Event Integration

Service for validation, standardization, and business rule enforcement with comprehensive tracking.

**Enterprise Features:**

- Business ID uniqueness validation across the entire system
- Social media URL validation and normalization with platform-specific rules
- Account relationship validation with status verification
- Phone number formatting following Canadian telecommunications standards
- Email validation with Canadian domain considerations
- Operation tracking for compliance and debugging requirements
- Security-aware logging with PII redaction capabilities

**Methods:**

- `checkBusinessIdUniqueness(businessId, excludeContactId?, userRole)` -> Enhanced with operation tracking, validates business ID uniqueness globally with comprehensive audit trails
- `validateAccountRelationship(accountBinding, userRole)` -> Account relationship validation with status verification and detailed logging
- `normalizeSocialMediaUrls(contactData)` -> Social media URL validation and normalization for major platforms with security validation
- `validateSecondaryEmail(email)` -> Email format and domain validation with detailed error reporting
- `validatePhoneNumber(phone)` -> Phone number validation and formatting following Canadian standards
- `validateBusinessWebsite(website)` -> Business website URL validation and normalization
- `validateCreateContact(createContactDto)` -> Complete contact creation validation with business rule enforcement
- `validateUpdateContact(contactId, updateContactDto)` -> Update validation with business rule enforcement and change tracking
- `checkForDuplicates(contactData)` -> Duplicate contact detection with sophisticated matching algorithms

**Canadian Standards:**

- Phone number formatting following Canadian telecommunications standards
- Email validation with Canadian domain considerations
- Bilingual support for French/English contact information
- Integration with Canadian address standards

## Permission System (Privilege-Based)

All services implement comprehensive privilege-based access control with detailed audit trails:

**Privilege Hierarchy:**

- **OWNER**: Full access to all operations and fields with comprehensive audit trails
- **ADMIN**: Extended access with administrative privileges and security monitoring
- **MAIN**: Standard access with sensitive field filtering and operation tracking

**Security Features:**

- Automatic field filtering based on privilege levels
- Security-aware logging with PII redaction for contact data
- Operation tracking for compliance auditing with unique operation IDs
- Privilege validation with detailed error reporting
- Business rule enforcement regardless of privilege level

## Integration Features (Enterprise)

- **Repository Pattern**: Clean abstraction with ContactRepository
- **Event-Driven Architecture**: ContactEventsService for comprehensive audit trails
- **Structured Logging**: Operation IDs, security-aware logging, PII redaction
- **Error Management**: createAppError with detailed context and operation tracking
- **Business Rules**: Comprehensive validation framework with Canadian standards
- **Security Framework**: Privilege-based access control with audit compliance
- **Social Media Integration**: Platform-specific validation with privacy protection
- **Professional Networking**: Business intelligence and analytics capabilities

## Migration Status

| Service                    | Architecture                  | Status      | Features                                                                         |
| -------------------------- | ----------------------------- | ----------- | -------------------------------------------------------------------------------- |
| ContactCrudService         | Repository + Events + Logging | ✅ COMPLETE | Operation tracking, Event emission, Privilege security, Social media integration |
| ContactLookupService       | Hybrid + Logging + Migration  | ✅ COMPLETE | Audit trails, PII redaction, Performance monitoring, Professional networking     |
| ContactBusinessRuleService | Rules Framework + Tracking    | ✅ COMPLETE | Canadian standards, Operation tracking, Business validation, Duplicate detection |

## Usage Examples (Enterprise)

```typescript
// Create contact with comprehensive audit and social media tracking
const operationId = `create_contact_${Date.now()}`;
const newContact = await contactCrudService.create(createDto, 'OWNER');
// Result: Operation tracked, business rules validated, social media normalized, events emitted, audit logged

// Search contacts with privilege enforcement and performance monitoring
const contacts = await contactLookupService.findByAccountId(accountId, 'ADMIN');
// Result: PII-redacted logging, privilege filtering, performance monitored, audit trails

// Validate business ID uniqueness with comprehensive tracking
const isUnique = await contactBusinessRuleService.checkBusinessIdUniqueness(
  'CONT001',
  undefined,
  'MAIN',
);
// Result: Operation tracked, uniqueness validated globally, audit logged, events emitted

// Professional networking query with business intelligence
const professionals = await contactLookupService.findByJobTitle(
  'Senior Developer',
  accountId,
  'ADMIN',
);
// Result: Job title pattern matched, professional analytics tracked, audit logged

// Social media platform search with privacy protection
const socialContacts = await contactLookupService.findBySocialMediaPlatform(
  'linkedin',
  accountId,
  'OWNER',
);
// Result: Platform validated, PII redacted in logs, privacy-compliant search, audit trails

// Update contact with full validation and change tracking
const updatedContact = await contactBusinessRuleService.validateUpdateContact(
  contactId,
  updateDto,
);
// Result: Business rules applied, changes tracked, validation events emitted, audit logged
```

## Guidelines (Enterprise)

- **Operation Tracking**: All operations generate unique operation IDs for comprehensive audit trails
- **Privilege Enforcement**: All services require privilege validation with detailed security logging
- **Security-First**: PII redaction in logs, privilege-based field filtering, audit compliance
- **Event Emission**: All state-changing operations emit comprehensive audit events with business context
- **Error Context**: Use createAppError with operation IDs and detailed context for debugging
- **Performance**: Monitor query performance and log metrics for optimization
- **Canadian Standards**: Follow Canadian telecommunications and addressing guidelines
- **Social Media**: Validate platform URLs with privacy-compliant PII handling
- **Professional Networking**: Track business relationships with intelligence analytics
- **Migration Path**: Hybrid architecture supports gradual migration from legacy systems

## Security Considerations

- **PII Protection**: Automatic redaction of sensitive contact data in logs
- **Privilege Validation**: Comprehensive privilege checking with detailed audit trails
- **Operation Auditing**: All operations tracked with unique IDs, timestamps, and context
- **Error Security**: No sensitive contact data exposed in error messages
- **Field Filtering**: Automatic filtering based on privilege levels for data protection
- **Social Media Privacy**: Platform URL validation with privacy-compliant handling
- **Business Intelligence**: Professional networking analytics with security controls
- **Compliance**: Full audit trails for regulatory compliance and data protection

## Canadian Standards Compliance

- **Telecommunications**: Phone number formatting following Canadian standards
- **Addressing**: Integration with Canadian postal code validation
- **Bilingual Support**: French/English contact information handling
- **Privacy**: PIPEDA compliance with PII redaction and data protection
- **Professional Standards**: Canadian business networking and communication preferences

# OTA Education Constants

## Purpose

This folder contains comprehensive constant values for the OTA Education domain, implementing enterprise-grade configuration management following the established patterns from OT Education and Identity services.

## Architecture

The constants are organized following **Enterprise Architecture patterns**:

- **Domain-Driven Design**: Constants grouped by business domain
- **Configuration Management**: Centralized settings and defaults
- **Security-First**: Access control and audit configurations
- **Type Safety**: Full TypeScript integration with proper typing

## File Structure

### `ota-education.constants.ts`

Main constants file containing all OTA Education domain configurations:

#### Core Constants Groups

**1. Defaults (`OTA_EDUCATION_DEFAULTS`)**

```typescript
- OTA_DEGREE_TYPE: DegreeType.DIPLOMA_CREDENTIAL  // Primary OTA degree type
- OTA_COUNTRY: Country.CANADA                     // Default country for OTA programs
- WORK_DECLARATION: false                         // Default work declaration setting
- ACCESS_MODIFIER: AccessModifier.PRIVATE         // Default privacy setting
- PRIVILEGE: Privilege.OWNER                      // Default user privilege level
```

**2. Validation Rules (`OTA_EDUCATION_VALIDATION`)**

```typescript
- USER_BUSINESS_ID: { MAX_LENGTH: 20, REQUIRED: true, PATTERN: /^[a-zA-Z0-9_-]+$/ }
- OTA_OTHER: { MAX_LENGTH: 100, REQUIRED: false }
- REQUIRED_FIELDS: ['osot_user_business_id', 'osot_work_declaration']
```

**3. Field Mappings (`OTA_EDUCATION_FIELDS`)**

```typescript
// Dataverse schema field names
- OTA_EDUCATION_ID: 'osot_ota_education_id'
- USER_BUSINESS_ID: 'osot_user_business_id'
- OTA_DEGREE_TYPE: 'osot_ota_degree_type'
- WORK_DECLARATION: 'osot_work_declaration'
```

**4. OData Configuration (`OTA_EDUCATION_ODATA`)**

```typescript
- TABLE_NAME: 'osot_table_ota_educations'
- SELECT_FIELDS: [...] // Optimized field selection
- EXPAND_RELATIONS: [...] // Related entity expansion
```

**5. Business Rules (`OTA_EDUCATION_BUSINESS_RULES`)**

```typescript
- WORK_DECLARATION: { MUST_BE_EXPLICIT: true }
- DEGREE_TYPE: { ALLOWED_TYPES: [DegreeType.DIPLOMA_CREDENTIAL, DegreeType.OTHER] }
- COUNTRY: { DEFAULT_TO_CANADA: true, VALIDATE_AGAINST_COLLEGE: true }
```

**6. Cache Configuration (`OTA_EDUCATION_CACHE`)**

```typescript
- TTL_DEFAULT: 3600 // 1 hour
- TTL_VALIDATION: 1800 // 30 minutes
- KEY_PATTERNS: { RECORD: 'ota-education:record:{id}' }
```

**7. Security Configuration (`OTA_EDUCATION_SECURITY`)**

```typescript
- DEFAULT_PERMISSIONS: Read/Write based on ownership
- AUDIT_REQUIRED: true // All operations logged
- PII_FIELDS: [...] // Fields requiring special handling
```

**8. Error Messages (`OTA_EDUCATION_ERRORS`)**

```typescript
- VALIDATION: User-friendly validation error messages
- BUSINESS_RULES: Business logic violation messages
- SYSTEM: Technical error messages for logging
```

## Usage Examples

### Import Constants

```typescript
import {
  OTA_EDUCATION_DEFAULTS,
  OTA_EDUCATION_VALIDATION,
  OTA_EDUCATION_FIELDS,
  OTA_EDUCATION_ERRORS,
} from './ota-education.constants';
```

### Using Defaults

```typescript
const defaultEducation = {
  [OTA_EDUCATION_FIELDS.OTA_DEGREE_TYPE]:
    OTA_EDUCATION_DEFAULTS.OTA_DEGREE_TYPE,
  [OTA_EDUCATION_FIELDS.OTA_COUNTRY]: OTA_EDUCATION_DEFAULTS.OTA_COUNTRY,
  [OTA_EDUCATION_FIELDS.WORK_DECLARATION]:
    OTA_EDUCATION_DEFAULTS.WORK_DECLARATION,
};
```

### Validation Usage

```typescript
const maxLength = OTA_EDUCATION_VALIDATION.USER_BUSINESS_ID.MAX_LENGTH;
const pattern = OTA_EDUCATION_VALIDATION.USER_BUSINESS_ID.PATTERN;
const requiredFields = OTA_EDUCATION_VALIDATION.REQUIRED_FIELDS;
```

### Error Handling

```typescript
throw createAppError(
  ErrorCodes.VALIDATION_ERROR,
  OTA_EDUCATION_ERRORS.VALIDATION.USER_BUSINESS_ID_REQUIRED,
  { field: 'osot_user_business_id' },
);
```

## Enterprise Patterns Implemented

### 1. **Repository Pattern Support**

- Field mappings for data access layer
- OData query configurations
- Relationship definitions

### 2. **Event-Driven Architecture**

- Audit configuration for lifecycle events
- Security event definitions
- Business rule event triggers

### 3. **Structured Logging**

- Operation context definitions
- PII field identification for redaction
- Error code standardization

### 4. **Security-First Design**

- Default access controls
- Permission matrices
- Audit trail requirements

### 5. **Type Safety**

- Proper enum integration (DegreeType, Country, etc.)
- TypeScript const assertions
- Interface compliance

## Maintenance Guidelines

### Adding New Constants

1. **Group by Domain**: Place in appropriate constant group
2. **Follow Naming**: Use SCREAMING_SNAKE_CASE
3. **Document Purpose**: Add JSDoc comments
4. **Maintain Types**: Ensure proper TypeScript typing

### Updating Existing Constants

1. **Backward Compatibility**: Consider existing usage
2. **Update Tests**: Verify all dependent tests
3. **Document Changes**: Update this README
4. **Version Control**: Follow semantic versioning

### Security Considerations

1. **No Secrets**: Never store sensitive data in constants
2. **PII Awareness**: Mark personal data fields appropriately
3. **Access Control**: Respect permission boundaries
4. **Audit Trail**: Ensure all changes are logged

## Integration Points

### With Other Services

- **Identity Services**: Shared enum values and patterns
- **OT Education**: Consistent architectural approach
- **Dataverse Service**: Field mapping compatibility
- **Cache Service**: TTL and key pattern coordination

### External Dependencies

- **Common Enums**: DegreeType, Country, AccessModifier, Privilege
- **Error Factory**: Standardized error creation
- **Logger**: Structured logging integration
- **Validator**: Business rule enforcement

## Performance Considerations

1. **Lazy Loading**: Constants loaded only when needed
2. **Memory Efficiency**: Const assertions prevent mutations
3. **Cache Optimization**: Appropriate TTL values
4. **Query Optimization**: Selective field loading

## Compliance & Audit

- **Data Retention**: Follows organizational policies
- **Privacy**: GDPR/PIPEDA compliant field handling
- **Security**: Enterprise security standards
- **Logging**: Comprehensive audit trail requirements

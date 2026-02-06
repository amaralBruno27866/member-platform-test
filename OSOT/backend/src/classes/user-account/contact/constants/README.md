# Contact Constants

## Purpose

This folder contains constant values used across the contact domain with proper type safety and integration with project modules. Constants include default settings, cache keys, validation limits, error codes, business rules, and static values shared between modules using standardized enums and patterns.

## Available Constants File

### contact.constants.ts

Comprehensive constants file containing all Contact domain configuration with proper enum integration and error handling.

## Key Features

### ✅ **Enum Integration**

Constants now use proper enums from `src/common/enums/`:

```typescript
CONTACT_DEFAULTS = {
  ACCESS_MODIFIER: AccessModifier.PRIVATE, // Not magic number 0
  PRIVILEGE: Privilege.OWNER, // Not magic number 1
};
```

### ✅ **Error Code Integration**

Standardized error handling using `src/common/errors/error-codes.ts`:

```typescript
CONTACT_ERROR_CODES = {
  CONTACT_NOT_FOUND: ErrorCodes.NOT_FOUND,
  INVALID_EMAIL_FORMAT: ErrorCodes.INVALID_EMAIL_FORMAT,
  DUPLICATE_BUSINESS_ID: ErrorCodes.BUSINESS_RULE_VIOLATION,
};
```

### ✅ **Comprehensive Configuration**

- **Cache Management**: Keys, TTL values, and Redis patterns
- **Validation Limits**: Field lengths, pattern matching, business rules
- **Rate Limiting**: API throttling and security controls
- **Event Definitions**: Audit trail and notification events
- **Dataverse Mapping**: Field names and OData configuration

## Constants Sections

### Core Configuration

- `CONTACT_CACHE_KEYS` - Redis cache key patterns with functions
- `CONTACT_CACHE_TTL` - Time-to-live values for different cache types
- `CONTACT_DEFAULTS` - Default values using proper enums
- `CONTACT_LIMITS` - Validation limits matching Table Contact.csv spec

### Business Rules & Validation

- `CONTACT_PATTERNS` - Regex patterns for validation (phone, email, URLs)
- `CONTACT_BUSINESS_RULES` - Business logic configuration flags
- `CONTACT_ERROR_CODES` - Standardized error code mappings
- `CONTACT_RATE_LIMITS` - API rate limiting configuration

### Data Integration

- `CONTACT_FIELDS` - Dataverse field name mappings
- `CONTACT_CHOICE_FIELDS` - Choice field configuration
- `CONTACT_ODATA` - OData query configuration
- `CONTACT_AUTONUMBER` - Auto-generated ID configuration

### Communication & Social Media

- `CONTACT_SOCIAL_MEDIA` - Social platform configuration
- `CONTACT_COMMUNICATION` - Communication method preferences
- `CONTACT_EVENTS` - Event type definitions for audit trails

## Examples

### ✅ **Proper Enum Usage**

```typescript
// Before (magic numbers)
const defaultStatus = 0;
const ownerPrivilege = 1;

// After (typed enums)
import { CONTACT_CONSTANTS } from './contact.constants';
const defaultStatus = CONTACT_CONSTANTS.DEFAULTS.ACCESS_MODIFIER; // AccessModifier.PRIVATE
const ownerPrivilege = CONTACT_CONSTANTS.DEFAULTS.PRIVILEGE; // Privilege.OWNER
```

### ✅ **Error Code Integration**

```typescript
// Standardized error handling
import { CONTACT_CONSTANTS } from './contact.constants';

if (!contact) {
  throw createAppError(CONTACT_CONSTANTS.ERROR_CODES.CONTACT_NOT_FOUND, {
    message: 'Contact not found',
    context: { contactId },
  });
}
```

### ✅ **Cache Key Generation**

```typescript
// Dynamic cache keys with proper typing
import { CONTACT_CONSTANTS } from './contact.constants';

const cacheKey = CONTACT_CONSTANTS.CACHE_KEYS.CONTACT_BY_ID(contactId);
const ttl = CONTACT_CONSTANTS.CACHE_TTL.DEFAULT;
```

### ✅ **Validation Patterns**

```typescript
// Reusable validation patterns
import { CONTACT_CONSTANTS } from './contact.constants';

const isValidPhone =
  CONTACT_CONSTANTS.PATTERNS.CANADIAN_PHONE.test(phoneNumber);
const isValidEmail = CONTACT_CONSTANTS.PATTERNS.EMAIL.test(emailAddress);
```

## Usage Guidelines

### ✅ **Best Practices**

- **Import Once**: Use `CONTACT_CONSTANTS` object for all constants
- **Type Safety**: Leverage enum types instead of magic numbers/strings
- **Consistency**: Follow established patterns across contact domain
- **Validation**: Use predefined patterns and limits for consistency

### ✅ **Integration Points**

- **Enums**: Proper integration with `AccessModifier` and `Privilege`
- **Error Codes**: Standardized error handling using `ErrorCodes`
- **Cache Management**: Redis integration with proper key patterns
- **Dataverse**: Field mappings aligned with Table Contact.csv specification

### ✅ **Configuration Sections**

- **Business Logic**: Rules, validation, and constraints
- **Performance**: Cache TTL, rate limiting, optimization
- **Security**: Access control, privilege management
- **Integration**: Dataverse fields, OData queries, external APIs

## Architecture Alignment

These constants are designed to work seamlessly with:

- **Business Rules Service** - Providing validation limits and patterns
- **Cache Layer** - Redis key patterns and TTL configuration
- **Dataverse Integration** - Field mappings and OData configuration
- **Error Handling** - Standardized error codes and messages
- **Validation Layer** - Regex patterns and business rule flags
- **Event System** - Audit trail and notification event definitions

## CSV Specification Compliance

All constants align with **Table Contact.csv** requirements:

- Field length limits match CSV maximums exactly
- Choice field defaults follow CSV specifications
- Business rules enforce CSV constraints
- Autonumber format matches CSV pattern (osot-ct-0000001)

## Migration Notes

Constants have been updated to use modern TypeScript patterns:

- ❌ Magic numbers replaced with enum values
- ❌ Hardcoded strings replaced with typed constants
- ✅ Proper error code integration
- ✅ Enhanced type safety throughout

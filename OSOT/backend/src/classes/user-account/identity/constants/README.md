# Identity Constants

## Purpose

This folder contains constant values used across the identity domain with proper type safety and integration with project modules. Constants include default settings, cache keys, validation limits, error codes, business rules, and static values shared between modules using standardized enums and patterns.

## Available Constants File

### identity.constants.ts

Comprehensive constants file containing all Identity domain configuration with proper enum integration and error handling.

## Key Features

### ✅ **Enum Integration**

Constants now use proper enums from `src/common/enums/`:

```typescript
IDENTITY_DEFAULTS = {
  ACCESS_MODIFIER: AccessModifier.PRIVATE, // Not magic number 3
  PRIVILEGE: Privilege.OWNER, // Not magic number 1
  LANGUAGE: Language.ENGLISH.toString(), // Not magic string '13'
};
```

### ✅ **Error Code Integration**

Standardized error handling using `src/common/errors/error-codes.ts`:

```typescript
IDENTITY_ERROR_CODES = {
  IDENTITY_NOT_FOUND: ErrorCodes.NOT_FOUND,
  INVALID_LANGUAGE_SELECTION: ErrorCodes.INVALID_INPUT,
  DUPLICATE_USER_BUSINESS_ID: ErrorCodes.BUSINESS_RULE_VIOLATION,
};
```

### ✅ **Comprehensive Configuration**

- **Cache Management**: Keys, TTL values, and Redis patterns
- **Validation Limits**: Field lengths, pattern matching, business rules
- **Rate Limiting**: API throttling and security controls
- **Event Definitions**: Audit trail and notification events
- **Dataverse Mapping**: Field names and OData configuration
- **Language Support**: Multiple language selection with proper formatting

## Constants Sections

### Core Configuration

- `IDENTITY_CACHE_KEYS` - Redis cache key patterns with functions
- `IDENTITY_CACHE_TTL` - Time-to-live values for different cache types
- `IDENTITY_DEFAULTS` - Default values using proper enums
- `IDENTITY_LIMITS` - Validation limits matching Table Identity.csv spec

### Business Rules & Validation

- `IDENTITY_PATTERNS` - Regex patterns for validation (SIN, Business ID, names)
- `IDENTITY_BUSINESS_RULES` - Business logic configuration flags
- `IDENTITY_ERROR_CODES` - Standardized error code mappings
- `IDENTITY_RATE_LIMITS` - API rate limiting configuration

### Data Integration

- `IDENTITY_FIELDS` - Dataverse field name mappings
- `IDENTITY_CHOICE_FIELDS` - Choice field configuration
- `IDENTITY_ODATA` - OData query configuration
- `IDENTITY_AUTONUMBER` - Auto-generated ID configuration (osot-id-0000001)

### Identity-Specific Features

- `IDENTITY_LANGUAGE_HELPERS` - Multiple language selection utilities
- `IDENTITY_ENUM_VALUES` - Quick access to common enum combinations
- `IDENTITY_VERIFICATION_STATUS` - Identity verification workflow states
- `IDENTITY_DOCUMENT_TYPES` - Supported verification document types

## Examples

### ✅ **Proper Enum Usage**

```typescript
// Before (magic numbers)
const defaultPrivilege = 1;
const privateAccess = 3;
const englishLanguage = '13';

// After (typed enums)
import { IDENTITY_CONSTANTS } from './identity.constants';
const defaultPrivilege = IDENTITY_CONSTANTS.DEFAULTS.PRIVILEGE; // Privilege.OWNER
const privateAccess = IDENTITY_CONSTANTS.DEFAULTS.ACCESS_MODIFIER; // AccessModifier.PRIVATE
const englishLanguage = IDENTITY_CONSTANTS.DEFAULTS.LANGUAGE; // Language.ENGLISH.toString()
```

### ✅ **Error Code Integration**

```typescript
// Standardized error handling
import { IDENTITY_CONSTANTS } from './identity.constants';

if (!identity) {
  throw createAppError(IDENTITY_CONSTANTS.ERROR_CODES.IDENTITY_NOT_FOUND, {
    message: 'Identity not found',
    context: { identityId },
  });
}
```

### ✅ **Language Selection Handling**

```typescript
// Multiple language selection with proper conversion
import { IDENTITY_CONSTANTS } from './identity.constants';

// Convert array to Dataverse format
const languageArray = [Language.ENGLISH, Language.FRENCH];
const dataverseFormat =
  IDENTITY_CONSTANTS.LANGUAGE_HELPERS.arrayToDataverse(languageArray);
// Result: "13,18"

// Convert from Dataverse to array
const dataverseString = '13,18';
const languageArray =
  IDENTITY_CONSTANTS.LANGUAGE_HELPERS.dataverseToArray(dataverseString);
// Result: [13, 18]
```

### ✅ **Cache Key Generation**

```typescript
// Dynamic cache keys with proper typing
import { IDENTITY_CONSTANTS } from './identity.constants';

const cacheKey = IDENTITY_CONSTANTS.CACHE_KEYS.IDENTITY_BY_ID(identityId);
const businessIdKey =
  IDENTITY_CONSTANTS.CACHE_KEYS.IDENTITY_BY_USER_BUSINESS_ID(businessId);
const ttl = IDENTITY_CONSTANTS.CACHE_TTL.DEFAULT;
```

### ✅ **Validation Patterns**

```typescript
// Reusable validation patterns
import { IDENTITY_CONSTANTS } from './identity.constants';

const isValidSIN = IDENTITY_CONSTANTS.PATTERNS.CANADIAN_SIN.test(sinNumber);
const isValidBusinessId =
  IDENTITY_CONSTANTS.PATTERNS.USER_BUSINESS_ID.test(businessId);
const isValidName = IDENTITY_CONSTANTS.PATTERNS.NAME.test(chosenName);
```

## Usage Guidelines

### ✅ **Best Practices**

- **Import Once**: Use `IDENTITY_CONSTANTS` object for all constants
- **Type Safety**: Leverage enum types instead of magic numbers/strings
- **Consistency**: Follow established patterns across identity domain
- **Validation**: Use predefined patterns and limits for consistency
- **Language Handling**: Use helper functions for multiple language selection

### ✅ **Integration Points**

- **Enums**: Proper integration with `AccessModifier`, `Privilege`, `Language`, `IndigenousDetail`
- **Error Codes**: Standardized error handling using `ErrorCodes`
- **Cache Management**: Redis integration with proper key patterns
- **Dataverse**: Field mappings aligned with Table Identity.csv specification
- **Language Support**: Multiple choice field handling with conversion utilities

### ✅ **Configuration Sections**

- **Business Logic**: Rules, validation, and constraints
- **Performance**: Cache TTL, rate limiting, optimization
- **Security**: Access control, privilege management
- **Integration**: Dataverse fields, OData queries, external APIs
- **Localization**: Language selection and formatting

## Architecture Alignment

These constants are designed to work seamlessly with:

- **Business Rules Service** - Providing validation limits and patterns
- **Cache Layer** - Redis key patterns and TTL configuration
- **Dataverse Integration** - Field mappings and OData configuration
- **Error Handling** - Standardized error codes and messages
- **Validation Layer** - Regex patterns and business rule flags
- **Event System** - Audit trail and notification event definitions
- **Language Services** - Multiple language selection and conversion

## CSV Specification Compliance

All constants align with **Table Identity.csv** requirements:

- Field length limits match CSV maximums exactly
- Choice field defaults follow CSV specifications
- Business rules enforce CSV constraints
- Autonumber format matches CSV pattern (osot-id-0000001)
- Language field configured as multiple choice with proper conversion
- Indigenous and disability fields follow CSV boolean patterns

## Identity-Specific Features

### Language Multiple Choice Support

The Identity module includes special handling for language selection:

```typescript
// Predefined language combinations
IDENTITY_LANGUAGE_HELPERS = {
  DATAVERSE: {
    ENGLISH_ONLY: Language.ENGLISH.toString(), // "13"
    FRENCH_ONLY: Language.FRENCH.toString(), // "18"
    BILINGUAL_EN_FR: `${Language.ENGLISH},${Language.FRENCH}`, // "13,18"
  },
  ARRAYS: {
    ENGLISH_ONLY: [Language.ENGLISH], // [13]
    FRENCH_ONLY: [Language.FRENCH], // [18]
    BILINGUAL_EN_FR: [Language.ENGLISH, Language.FRENCH], // [13, 18]
  },
};
```

### Identity Verification Support

```typescript
// Document types for identity verification
IDENTITY_DOCUMENT_TYPES = {
  GOVERNMENT_ID: 'government_id',
  PASSPORT: 'passport',
  DRIVERS_LICENSE: 'drivers_license',
  HEALTH_CARD: 'health_card',
  SIN_DOCUMENT: 'sin_document',
  PROFESSIONAL_LICENSE: 'professional_license',
};
```

## Migration Notes

Constants have been updated to use modern TypeScript patterns:

- ❌ Magic numbers (3 for PRIVATE) replaced with enum values (AccessModifier.PRIVATE)
- ❌ Hardcoded language strings ('13') replaced with enum values (Language.ENGLISH)
- ❌ Hardcoded privilege numbers (1) replaced with enum values (Privilege.OWNER)
- ✅ Proper error code integration
- ✅ Enhanced type safety throughout
- ✅ Language multiple choice support with conversion utilities
- ✅ Identity verification workflow support

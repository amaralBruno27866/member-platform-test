# OT Education Constants

## Purpose

This folder contains constant values used across the **OT Education domain**. Constants include default settings, validation rules, cache keys, business constraints, and domain-specific values for **Occupational Therapy Education management**.

## 📁 Structure

```
constants/
├── ot-education.constants.ts    # Main constants file
├── index.ts                     # Centralized exports
└── README.md                   # This documentation
```

## 🎯 Constants Categories

### 🔧 **Default Values** (`OT_EDUCATION_DEFAULTS`)

Based on CSV schema defaults for new OT Education records:

```typescript
import { OT_EDUCATION_DEFAULTS } from './constants';

// Usage examples
const newRecord = {
  coto_status: OT_EDUCATION_DEFAULTS.COTO_STATUS, // CotoStatus.OTHER
  degree_type: OT_EDUCATION_DEFAULTS.DEGREE_TYPE, // DegreeType.MASTERS
  country: OT_EDUCATION_DEFAULTS.COUNTRY, // Country.CANADA
  access_modifier: OT_EDUCATION_DEFAULTS.ACCESS_MODIFIER, // AccessModifier.PRIVATE
  privilege: OT_EDUCATION_DEFAULTS.PRIVILEGE, // Privilege.OWNER
};
```

### ✅ **Validation Rules** (`OT_EDUCATION_VALIDATION`)

Field constraints and business validation rules:

```typescript
import { OT_EDUCATION_VALIDATION } from './constants';

// Validate User Business ID
if (
  userBusinessId.length > OT_EDUCATION_VALIDATION.USER_BUSINESS_ID.MAX_LENGTH
) {
  throw new Error('User Business ID too long');
}

// Check COTO Registration format
if (!OT_EDUCATION_VALIDATION.COTO_REGISTRATION.PATTERN.test(registration)) {
  throw new Error('Invalid COTO Registration format');
}

// Required fields validation
const missingFields = OT_EDUCATION_VALIDATION.REQUIRED_FIELDS.filter(
  (field) => !data[field],
);
```

### 🏗️ **AutoNumber Generation** (`OT_EDUCATION_AUTONUMBER`)

Constants for OT Education ID generation:

```typescript
import { OT_EDUCATION_AUTONUMBER } from './constants';

// Generate next ID: osot-oted-0000001, osot-oted-0000002, etc.
const nextId = `${OT_EDUCATION_AUTONUMBER.PREFIX}-${seedValue
  .toString()
  .padStart(OT_EDUCATION_AUTONUMBER.MIN_DIGITS, '0')}`;

// Validate ID format
const isValidId = OT_EDUCATION_AUTONUMBER.REGEX_VALIDATION.test(id);
```

### 🚀 **Cache Keys** (`OT_EDUCATION_CACHE_KEYS`)

Redis cache key patterns for performance optimization:

```typescript
import { OT_EDUCATION_CACHE_KEYS } from './constants';

// Cache OT Education by ID
const cacheKey = OT_EDUCATION_CACHE_KEYS.BY_ID('osot-oted-0000001');

// Cache COTO registration lookup
const cotoKey = OT_EDUCATION_CACHE_KEYS.COTO_REGISTRATION('AB123456');

// Cache university statistics
const uniStatsKey = OT_EDUCATION_CACHE_KEYS.UNIVERSITY_STATS('university_id');
```

### 🏥 **Business Rules** (`OT_EDUCATION_BUSINESS_RULES`)

Domain-specific business logic constants:

```typescript
import { OT_EDUCATION_BUSINESS_RULES } from './constants';

// COTO Registration validation
const requiresRegistration =
  OT_EDUCATION_BUSINESS_RULES.COTO.STATUS_REQUIRES_REGISTRATION.includes(
    status,
  );

// Graduation year validation
const currentYear = new Date().getFullYear();
const maxYear =
  currentYear + OT_EDUCATION_BUSINESS_RULES.GRADUATION_YEAR.MAX_FUTURE_YEARS;
```

### ❌ **Error Messages** (`OT_EDUCATION_ERROR_MESSAGES`)

Standardized error messages for consistent UX:

```typescript
import { OT_EDUCATION_ERROR_MESSAGES } from './constants';

// Usage in validation
if (userBusinessId.length > 20) {
  throw new Error(OT_EDUCATION_ERROR_MESSAGES.INVALID_USER_BUSINESS_ID);
}

// Usage in business rules
if (needsRegistration && !registration) {
  throw new Error(
    OT_EDUCATION_ERROR_MESSAGES.COTO_STATUS_REGISTRATION_MISMATCH,
  );
}
```

### 🔄 **Session Management** (`OT_EDUCATION_SESSION_KEYS`)

Redis session keys for orchestrator workflows:

```typescript
import { OT_EDUCATION_SESSION_KEYS } from './constants';

// Create staging session
const stagingKey = OT_EDUCATION_SESSION_KEYS.STAGING_SESSION(sessionId);
await redis.setex(stagingKey, OT_EDUCATION_SESSION_KEYS.DEFAULT_TTL, data);

// Track workflow progress
const progressKey = OT_EDUCATION_SESSION_KEYS.WORKFLOW_PROGRESS(sessionId);
```

### 📊 **Analytics Constants** (`OT_EDUCATION_ANALYTICS`)

Configuration for demographic analytics and reporting:

```typescript
import { OT_EDUCATION_ANALYTICS } from './constants';

// Generate university distribution report
const reportType = OT_EDUCATION_ANALYTICS.DEMOGRAPHICS.BY_UNIVERSITY;

// Privacy-safe analytics (minimum group size)
const minGroupSize =
  OT_EDUCATION_ANALYTICS.PRIVACY_SAFE_ANALYTICS.MIN_GROUP_SIZE;
```

### 🔗 **Integration Constants** (`OT_EDUCATION_INTEGRATION`)

Dataverse and API integration specifications:

```typescript
import { OT_EDUCATION_INTEGRATION } from './constants';

// Dataverse table information
const tableName = OT_EDUCATION_INTEGRATION.DATAVERSE.TABLE_NAME;
const primaryKey = OT_EDUCATION_INTEGRATION.DATAVERSE.PRIMARY_KEY;

// API endpoint construction
const publicPath = OT_EDUCATION_INTEGRATION.API_ENDPOINTS.PUBLIC_PATH;
```

## 🎨 **Domain-Specific Features**

### 🏛️ **COTO (College of Occupational Therapists of Ontario)**

- **Status Management**: Professional registration status tracking
- **Registration Numbers**: 8-character alphanumeric codes
- **Business Rules**: Registration required for active/provisional statuses
- **Validation**: Cross-validation between status and registration number

### 🎓 **Academic Credentials**

- **Degree Types**: Masters, Doctoral, Bachelor's degree tracking
- **Universities**: Canadian and international institution support
- **Graduation Years**: Historical and future graduation tracking
- **Education Categories**: Specialized education classification

### 🌍 **International Support**

- **Country Validation**: Canada default with international support
- **University-Country Alignment**: Business rules for geography consistency
- **Degree Recognition**: International credential validation protocols

### 🔐 **Privacy & Access Control**

- **Default Private**: Privacy-first approach for education records
- **Owner Privileges**: User maintains full control of their education data
- **Access Modifiers**: Public, Private, Restricted visibility levels
- **GDPR Compliance**: Privacy-safe analytics and reporting

## 📋 **Usage Guidelines**

### ✅ **Best Practices**

1. **Import Constants**: Always use constants instead of magic numbers/strings
2. **Type Safety**: Leverage TypeScript types for compile-time validation
3. **Cache Keys**: Use provided cache key generators for consistent Redis operations
4. **Error Messages**: Use standardized error messages for consistent UX
5. **Business Rules**: Reference business rule constants for validation logic

### ❌ **Anti-Patterns**

- ❌ **Hard-coded values**: `if (status === 'active')` → ✅ Use enum comparisons
- ❌ **Magic numbers**: `if (id.length > 20)` → ✅ Use `VALIDATION.MAX_LENGTH`
- ❌ **Inconsistent cache keys**: → ✅ Use `CACHE_KEYS` generators
- ❌ **Custom error messages**: → ✅ Use `ERROR_MESSAGES` constants

### 🔄 **Integration with Other Modules**

```typescript
// Import from centralized location
import {
  OT_EDUCATION_DEFAULTS,
  OT_EDUCATION_VALIDATION,
  OT_EDUCATION_CACHE_KEYS,
  OT_EDUCATION_BUSINESS_RULES,
} from './constants';

// Use in services, controllers, validators, etc.
export class OtEducationService {
  async create(data: CreateOtEducationDto) {
    // Apply defaults
    const defaultedData = { ...OT_EDUCATION_DEFAULTS, ...data };

    // Validate business rules
    this.validateBusinessRules(defaultedData);

    // Cache result
    const cacheKey = OT_EDUCATION_CACHE_KEYS.BY_ID(result.id);
  }
}
```

## 🚀 **Next Steps**

After implementing constants, typical next steps include:

1. **DTOs**: Create data transfer objects using these validation constants
2. **Interfaces**: Define service contracts referencing these constants
3. **Services**: Implement business logic using these rules and defaults
4. **Controllers**: Apply these constants in API request/response handling
5. **Validators**: Create custom validators using these business rules

**These constants serve as the foundation for all OT Education domain operations!** 🎯

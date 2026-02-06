# Affiliate Constants

## Overview

This directory contains all constant values used across the Affiliate module. These constants are derived from the Dataverse table schema and provide a centralized location for configuration values, validation rules, and business logic constants.

## Purpose

The constants module serves as the single source of truth for:

- **Dataverse field values**: Choices and default values from the Affiliate table
- **Business rules**: Validation limits, timeouts, and operational parameters
- **API configuration**: Route prefixes, pagination settings, and cache keys
- **Display labels**: User-friendly text for UI components
- **Type definitions**: TypeScript types for enhanced type safety

## Structure

### Core Constants (`affiliate.constants.ts`)

#### 🏢 **Affiliate Areas**

```typescript
AFFILIATE_AREAS = {
  OTHER: 0,
  HEALTHCARE_AND_LIFE_SCIENCES: 1,
  GOVERNMENT_AND_PUBLIC_SECTOR: 2,
  CONSTRUCTION_REAL_ESTATE_AND_PROPERTY_MANAGEMENT: 3,
  CONSUMER_GOODS_AND_RETAIL: 4,
  FINANCIAL_SERVICES_AND_INSURANCE: 5,
  INFORMATION_TECHNOLOGY_AND_SOFTWARE: 6,
  LEGAL_SERVICES: 7,
  NONPROFIT_AND_SOCIAL_SERVICES: 8,
  PHARMACEUTICALS_AND_BIOTECHNOLOGY: 9,
  PROFESSIONAL_SERVICES: 10,
  SCIENCE_AND_RESEARCH: 11,
};
```

#### 📊 **Account Status**

```typescript
AFFILIATE_ACCOUNT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  PENDING: 3,
};
```

#### 🔐 **Privilege Levels**

```typescript
AFFILIATE_PRIVILEGES = {
  OWNER: 1,
  ADMIN: 2,
  MAIN: 3,
};
```

#### 🌍 **Geographic Data**

```typescript
AFFILIATE_PROVINCES = {
  N_A: 0,
  ONTARIO: 1,
  ALBERTA: 2,
  BRITISH_COLUMBIA: 3,
  MANITOBA: 4,
  NEW_BRUNSWICK: 5,
  NEWFOUNDLAND_AND_LABRADOR: 6,
  NOVA_SCOTIA: 7,
  // ... all Canadian provinces
};

AFFILIATE_COUNTRIES = {
  OTHER: 0,
  CANADA: 1,
  USA: 2,
};
```

#### ✅ **Validation Rules**

```typescript
AFFILIATE_FIELD_LIMITS = {
  NAME: 255,
  EMAIL: 255,
  PHONE: 14,
  POSTAL_CODE: 7,
  // ... field length limits
};

AFFILIATE_VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,14}$/,
  POSTAL_CODE_CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  // ... validation patterns
};
```

#### 💾 **Cache Configuration**

```typescript
AFFILIATE_CACHE_KEYS = {
  PREFIX: 'affiliate:',
  BY_ID: 'affiliate:id:',
  BY_EMAIL: 'affiliate:email:',
  // ... cache key patterns
};

AFFILIATE_CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  EXTENDED: 86400, // 24 hours
};
```

#### 🔧 **Business Rules**

```typescript
AFFILIATE_BUSINESS_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCK_DURATION: 3600,
  SESSION_TIMEOUT: 1800,
  EMAIL_VERIFICATION_TIMEOUT: 86400,
};
```

## Usage Examples

### Import Constants

```typescript
import {
  AFFILIATE_AREAS,
  AFFILIATE_ACCOUNT_STATUS,
  AFFILIATE_FIELD_LIMITS,
  DEFAULT_AFFILIATE_COUNTRY,
} from './affiliate.constants';
```

### Validation Usage

```typescript
// Validate field length
if (affiliateName.length > AFFILIATE_FIELD_LIMITS.NAME) {
  throw new Error('Name too long');
}

// Check valid area (numeric value)
if (!Object.values(AFFILIATE_AREAS).includes(selectedArea)) {
  throw new Error('Invalid affiliate area');
}

// Working with numeric enum values
const isHealthcareAffiliate =
  affiliate.area === AFFILIATE_AREAS.HEALTHCARE_AND_LIFE_SCIENCES; // 1
const isActiveAccount = affiliate.status === AFFILIATE_ACCOUNT_STATUS.ACTIVE; // 1
```

### UI Label Usage

```typescript
import { AFFILIATE_AREAS_LABELS, AFFILIATE_AREAS } from './affiliate.constants';

// Display user-friendly label using numeric key
const displayLabel = AFFILIATE_AREAS_LABELS[affiliate.area]; // e.g., affiliate.area = 1
console.log(displayLabel); // "Healthcare and Life Sciences"

// Example with status labels
import { AFFILIATE_ACCOUNT_STATUS_LABELS } from './affiliate.constants';
const statusLabel =
  AFFILIATE_ACCOUNT_STATUS_LABELS[AFFILIATE_ACCOUNT_STATUS.ACTIVE]; // "Active"
```

### Cache Key Generation

```typescript
import { AFFILIATE_CACHE_KEYS } from './affiliate.constants';

// Generate cache key
const cacheKey = `${AFFILIATE_CACHE_KEYS.BY_ID}${affiliateId}`;
```

### Type Safety

```typescript
import type {
  AffiliateArea,
  AffiliateAccountStatus,
} from './affiliate.constants';

interface AffiliateData {
  area: AffiliateArea;
  status: AffiliateAccountStatus;
}
```

## Key Features

### 🎯 **Dataverse Alignment**

- All choice values match Dataverse field definitions exactly
- Field limits reflect actual database constraints
- Default values match Dataverse defaults
- **Numeric values aligned with global enum system for consistency**

### 🔗 **Global Enum Integration**

- **AFFILIATE_AREAS**: Aligned with `AffiliateArea` enum (12 business sectors, numeric values 0-11)
- **AFFILIATE_ACCOUNT_STATUS**: Aligned with `AccountStatus` enum (ACTIVE=1, INACTIVE=2, PENDING=3)
- **AFFILIATE_PRIVILEGES**: Aligned with `Privilege` enum (OWNER=1, ADMIN=2, MAIN=3)
- **AFFILIATE_ACCESS_MODIFIERS**: Aligned with `AccessModifier` enum (PUBLIC=1, PROTECTED=2, PRIVATE=3)
- **AFFILIATE_PROVINCES**: Aligned with `Province` enum (N_A=0, ONTARIO=1, etc.)
- **AFFILIATE_COUNTRIES**: Aligned with `Country` enum (OTHER=0, CANADA=1, USA=2)

### 🏷️ **Display Labels**

- Separate label constants for UI-friendly text
- Consistent naming conventions
- Internationalization-ready structure

### 🔒 **Type Safety**

- TypeScript type exports for all constant groups
- Compile-time validation of constant usage
- Enhanced IDE support and autocompletion

### ⚡ **Performance Optimization**

- Cache key patterns for efficient data retrieval
- TTL settings for different data types
- Optimized for high-frequency operations

## Best Practices

1. **Import Selectively**: Only import the constants you need
2. **Use Type Definitions**: Leverage exported types for better type safety
3. **Avoid Magic Values**: Always use named constants instead of hardcoded values
4. **Use Numeric Values**: All constants now use numeric values aligned with global enums
5. **Cache Wisely**: Use appropriate TTL values based on data volatility
6. **Validate Consistently**: Use validation patterns across all modules
7. **Global Enum Alignment**: Always reference global enums when working with choice fields

## Important Notes

⚠️ **Numeric Values**: All choice-based constants now use numeric values (not strings) to align with the global enum system. This ensures consistency across the entire application and proper integration with Dataverse.

✅ **Display Labels**: Use the corresponding `_LABELS` constants for user-friendly text display while keeping numeric values for data processing.

## Dependencies

- **None**: This module has no external dependencies
- **Platform Agnostic**: Works across all environments
- **Framework Independent**: Can be used with any TypeScript/JavaScript framework

## Version History

- **v1.0.0**: Initial implementation with full Dataverse schema support

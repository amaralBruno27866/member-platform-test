# Identity DTOs

## Purpose

Contains specialized Data Transfer Objects for Identity domain operations with standardized enum usage and comprehensive validation. All DTOs follow established patterns for consistency across the application.

## Standards Compliance

✅ **Centralized Enums**: Uses consolidated imports from `/common/enums`
✅ **Validation Integration**: Implements custom Identity validators
✅ **Class-Validator**: Full integration with NestJS validation pipeline
✅ **API Documentation**: Complete Swagger/OpenAPI annotations
✅ **Type Safety**: Comprehensive TypeScript type definitions

## Available DTOs

### Core Operation DTOs

- **`IdentityBasicDto`** - Base DTO with essential identity fields and validation
- **`IdentityCreateDto`** - Creation DTO extending basic (excludes virtual fields)
- **`IdentityUpdateDto`** - Update DTO with partial field support
- **`IdentityResponseDto`** - Response DTO with complete identity data + metadata

### Specialized DTOs

- **`IdentityRegistrationDto`** - Registration-optimized DTO (streamlined UX)
- **`IdentityListDto`** - List view DTO (performance optimized, privacy-aware)

## DTO Characteristics

### **IdentityBasicDto** - Foundation DTO

```ts
// Core validation with custom validators
@Validate(IdentityUserBusinessIdValidator)
osot_user_business_id: string;

@Validate(IdentityLanguagesValidator)
osot_language: Language[];

@Validate(IdentityCulturalConsistencyValidator)
_culturalConsistency?: any; // Cross-field validation
```

**Features:**

- ✅ Required fields: `osot_user_business_id`, `osot_language`
- ✅ Custom validators for business logic enforcement
- ✅ Cultural consistency validation across Indigenous fields
- ✅ Complete enum integration for all choice fields

### **IdentityRegistrationDto** - Registration UX

```ts
// Registration-optimized constraints
@ArrayMaxSize(5, { message: 'Maximum 5 languages during registration' })
osot_language: Language[];
```

**Features:**

- ✅ Simplified field set for better registration UX
- ✅ Reduced complexity (5 language max vs 10 in basic)
- ✅ User-friendly validation messages
- ✅ Optional cultural fields to respect comfort levels

### **IdentityListDto** - Performance & Privacy

```ts
// No validation decorators - read-only response DTO
osot_user_business_id: string;
osot_chosen_name?: string;
osot_access_modifiers: AccessModifier;
```

**Features:**

- ✅ Performance-optimized field subset
- ✅ Privacy-aware (excludes sensitive details)
- ✅ Essential metadata (created/modified dates)
- ✅ Access control integration

### **IdentityResponseDto** - Complete API Response

```ts
// Full identity data with system metadata
osot_identity_id: string; // Autonumber ID
osot_table_identityid: string; // UUID
ownerid: string; // System field
createdon: string; // Audit field
```

**Features:**

- ✅ Complete identity information
- ✅ System metadata included
- ✅ Audit trail fields
- ✅ Dataverse integration fields

## Enum Integration

### **Standardized Pattern**

```ts
// ✅ CORRECT: Centralized enum imports
import {
  Language,
  Gender,
  Race,
  IndigenousDetail,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

// ❌ AVOID: Individual enum file imports
import { Language } from '../../../../common/enums/language-choice.enum';
```

### **Supported Enums**

- **`Language`**: Multi-select language preferences (1-10 selections)
- **`Gender`**: Gender identity choices with privacy options
- **`Race`**: Racial identity options including privacy choices
- **`IndigenousDetail`**: Canadian Indigenous identity classifications
- **`AccessModifier`**: Privacy/visibility control (Public/Protected/Private)
- **`Privilege`**: System privilege levels (Owner/Admin/Main)

## Validation Features

### **Cross-Field Validation**

```ts
// Cultural consistency validation
@Validate(IdentityCulturalConsistencyValidator)
_culturalConsistency?: any;
```

- Indigenous detail requires Indigenous status = true
- Indigenous detail "other" requires specific Indigenous detail selection

### **Business Rule Enforcement**

```ts
// Language selection constraints
@ArrayMinSize(1, { message: 'At least one language must be selected' })
@ArrayMaxSize(10, { message: 'Maximum 10 languages allowed' })
osot_language: Language[];
```

### **Privacy Protection**

```ts
// Access modifier validation
@Validate(IdentityAccessModifierValidator)
osot_access_modifiers?: AccessModifier;

// Defaults to Private for new users
```

## Best Practices

1. **Inheritance Strategy**: Use `OmitType`/`PartialType` for DTO variations
2. **Validation Consistency**: Apply custom validators consistently across DTOs
3. **Privacy First**: Default to private access modifiers for sensitive data
4. **Performance Optimization**: Use minimal field sets for list operations
5. **User Experience**: Simplify registration DTOs for better conversion
6. **Type Safety**: Leverage TypeScript and enum types for compile-time validation

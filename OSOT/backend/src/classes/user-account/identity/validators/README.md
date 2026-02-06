# Identity Validators

## Purpose

Contains specialized validation logic for Identity domain using standardized enums and centralized error handling. All validators follow established patterns for consistency across the application.

## Standards Compliance

✅ **Centralized Enums**: Uses `Language`, `AccessModifier`, `Privilege` from `/common/enums`
✅ **Error Handling**: Compatible with centralized error factory patterns
✅ **Class-Validator**: Implements `ValidatorConstraintInterface` for NestJS integration
✅ **Business Rules**: Enforces Identity-specific validation requirements

## Available Validators

### Core Field Validators

- **`IdentityUserBusinessIdValidator`** - Validates user business ID format and length
- **`IdentityChosenNameValidator`** - Validates optional preferred name format
- **`IdentityLanguagesValidator`** - Validates language selection (array/string formats)
- **`IdentityIndigenousDetailOtherValidator`** - Validates indigenous detail text input

### Security & Compliance Validators

- **`IdentityCanadianSINValidator`** - Validates Canadian SIN with checksum algorithm
- **`IdentityAccessModifierValidator`** - Validates access permission levels
- **`IdentityPrivilegeValidator`** - Validates privilege levels (internal-only)

### Business Logic Validators

- **`IdentityCulturalConsistencyValidator`** - Ensures cultural fields are consistent
- **`IdentityCompositeValidator`** - Orchestrates complete Identity validation

## Usage Examples

```ts
// Individual field validation in DTOs
@Validate(IdentityUserBusinessIdValidator)
userBusinessId: string;

// Multiple language format support
@Validate(IdentityLanguagesValidator)
languages: number[] | string;

// Complete entity validation
@Validate(IdentityCompositeValidator)
identityData: IdentityCreateDto;

// Internal privilege validation with constraints
@Validate(IdentityPrivilegeValidator, ['internal-only'])
privilege: number;
```

## Validator Features

### **Enum Integration**

```ts
// Uses centralized enums instead of hardcoded values
const validLanguages = [Language.ENGLISH, Language.FRENCH];
const validModifiers = [AccessModifier.PUBLIC, AccessModifier.PROTECTED];
```

### **Format Flexibility**

- **Language Validator**: Handles both array format (internal) and string format (Dataverse)
- **SIN Validator**: Accepts formatted (123-456-789) and unformatted (123456789) input
- **Cultural Validator**: Cross-validates related Indigenous identity fields

### **Security Enforcement**

- **Privilege Validator**: Restricts privilege setting to internal systems only
- **Access Modifier**: Validates appropriate visibility levels
- **Business Rules**: Enforces required field combinations

## Best Practices

1. **Reuse Over Recreation**: Use existing validators before creating new ones
2. **Enum Compliance**: Always use centralized enums from `/common/enums`
3. **Error Consistency**: Follow standardized error message patterns
4. **Unit Testing**: Complex validation logic is testable independently
5. **Performance**: Validators are lightweight and non-async for efficiency

# Contact Interfaces

## Purpose

Holds TypeScript interfaces that describe shapes used within the contact domain. Interfaces define repository contracts, service return types, validation results, business rules, and shared contact domain concepts with proper type safety and integration with project modules.

## Available Interfaces

### Core Data Interfaces

- **ContactInternal** - Complete internal contact representation with all sensitive fields
- **ContactDataverse** - Raw Dataverse response mapping for osot_table_contact
- **ContactFormatting** - Contract for data transformation and formatting operations
- **ContactMapping** - Contract for mapping between different data representations

### Business Logic Interfaces

- **ContactBusinessRules** - Contract for enforcing contact-specific business logic
- **ContactValidation** - Contract for validating contact data against business rules
- **ContactRepository** - Contract for data persistence and retrieval operations

## Key Features

### ✅ **Enum Integration**

All interfaces now use proper enums from `src/common/enums/`:

- `AccessModifier` for privacy/visibility settings
- `Privilege` for user permission levels
- Strong typing eliminates magic numbers and improves maintainability

### ✅ **Utils Integration**

Interfaces reference existing utilities for consistent implementation:

- `phone-formatter.utils.ts` for phone number validation/formatting
- `url-sanitizer.utils.ts` for URL validation/sanitization
- `business-rule.util.ts` for business logic validation

### ✅ **Type Safety**

- Choice fields use specific enum types instead of generic `number`
- User roles use `Privilege` enum instead of generic `string`
- Platform types use `SocialMediaPlatform` instead of generic `string`
- Phone types use `PhoneType` instead of hardcoded strings

## Examples

```typescript
// Using proper enum types
interface ContactExample {
  osot_access_modifiers: AccessModifier.PRIVATE;
  osot_privilege: Privilege.OWNER;
}

// Repository with typed parameters
interface ContactRepository {
  search(criteria: {
    status?: AccessModifier; // Not generic number
  }): Promise<ContactResult[]>;
}

// Business rules with enum parameters
interface ContactBusinessRules {
  validateStatusTransition(
    currentStatus: AccessModifier,
    newStatus: AccessModifier,
    userPrivilege: Privilege, // Not generic string
  ): ValidationResult;
}

// Validation with typed platforms
interface ContactValidation {
  validateSocialMediaUrl(
    url: string,
    platform: SocialMediaPlatform, // Not generic string
  ): Promise<ValidationResult>;
}
```

## Usage Guidelines

### ✅ **Best Practices**

- **Type Safety**: Always use specific enum types instead of generic primitives
- **Documentation**: Include implementation notes referencing appropriate utils
- **Consistency**: Follow established patterns across all contact interfaces
- **Validation**: Leverage existing validation utilities for consistent behavior

### ✅ **Integration Points**

- **Enums**: Import from `src/common/enums/` for choice fields
- **Utils**: Reference existing utilities in documentation and implementation
- **Error Handling**: Use standardized error codes from `src/common/errors/`
- **Dataverse**: Align with DataverseService integration patterns

### ✅ **Implementation Notes**

- Prefer interfaces for internal contracts and DTOs for external API inputs/outputs
- Keep interfaces descriptive and well-documented with proper typing
- Include contact-specific interfaces for validation results, communication channels, and business rules
- Reference existing project utilities to avoid code duplication
- Use enum types consistently across all choice field implementations

## Architecture Alignment

These interfaces are designed to work seamlessly with:

- **Business Rules Service** - Leveraging business-rule.util.ts
- **Dataverse Integration** - Aligned with DataverseService patterns
- **Validation Layer** - Using phone-formatter and url-sanitizer utils
- **Error Handling** - Integrated with standardized error codes
- **Type System** - Full TypeScript support with proper enum usage

# Identity Utils

## Purpose

Contains specialized utility functions and business logic specific to the Identity domain with standardized error handling and type safety. These utilities implement business rules, data formatting, sanitization, and field stripping for identity-related operations.

## Standards Compliance

✅ **Centralized Error Handling**: Uses `createAppError` and `ErrorCodes` from `/common/errors`
✅ **Centralized Enums**: Imports all enums from `/common/enums` index
✅ **Type Safety**: Comprehensive TypeScript interfaces and validation
✅ **Pure Functions**: Side-effect free utilities for reliable operation
✅ **Security Focus**: Safe data handling and internal field protection

## Utility Modules Overview

### **🧠 Identity Business Logic (`identity-business-logic.util.ts`)**

Contains pure business logic functions implementing identity domain rules and validation.

#### **Core Business Functions**

##### **`validateCulturalConsistency(identity): ValidationResult`**

Ensures cultural identity fields are logically consistent with comprehensive rule validation.

- **Indigenous Status Rules**: Validates indigenous flag consistency with detail fields
- **Detail Requirements**: Ensures "Other" selections include descriptive text
- **Cross-Field Validation**: Prevents conflicting cultural identity data
- **Error Context**: Detailed validation messages for each rule violation

##### **`assessDataCompleteness(identity): CompletenessResult`**

Evaluates identity data completeness for verification and profile quality scoring.

- **Required Fields**: Validates mandatory identity information
- **Optional Fields**: Assesses additional demographic information
- **Completeness Score**: Calculates percentage completion (0-100%)
- **Missing Fields**: Lists specific fields needed for completion

##### **`canShareIdentityData(identity, requesterPrivilege): SharingResult`**

Determines identity data sharing permissions based on access modifiers and privilege levels.

- **Privilege Hierarchy**: Admin/Owner → Member → Guest access levels
- **Privacy Controls**: Respects user-defined access modifiers
- **Field-Level Restrictions**: Granular control over sensitive information
- **Audit Trail**: Provides reasoning for sharing decisions

##### **`generateUserBusinessId(existingIds, prefix): string`**

Generates unique business identifiers with collision avoidance.

- **Uniqueness Guarantee**: Validates against existing ID list
- **Format Consistency**: Configurable prefix with numeric suffix
- **Collision Handling**: Multiple attempts with fallback strategies
- **Canadian Standards**: Aligned with business ID conventions

##### **`calculateDiversityScore(identities): DiversityMetrics`**

Analyzes demographic diversity across identity collections for analytics and reporting.

- **Language Diversity**: Calculates linguistic representation
- **Gender Diversity**: Measures gender identity distribution
- **Racial Diversity**: Assesses racial/ethnic representation
- **Overall Score**: Weighted diversity index for organizational insights

##### **`validateLanguageSelection(languages): ValidationResult`**

Validates language selections against business rules and Canadian context.

- **Minimum Requirements**: At least one language selection
- **Maximum Limits**: Prevents excessive language selections
- **Duplicate Prevention**: Ensures unique language choices
- **Canadian Context**: Encourages English/French inclusion

### **🎨 Identity Formatter (`identity-formatter.util.ts`)**

Provides consistent formatting functions for identity display and presentation.

#### **Display Formatting Functions**

##### **`formatUserBusinessId(businessId): string`**

Standardizes business ID display format with consistent casing and validation.

##### **`formatChosenName(chosenName): string`**

Applies title case formatting to chosen names for professional display.

##### **`formatLanguageList(languages): string`**

Converts language enum arrays to human-readable text with proper conjunction.

- **Single Language**: Direct name display
- **Two Languages**: "English and French" format
- **Multiple Languages**: "English, French, and Spanish" format
- **Localization Ready**: Extensible for multiple language mappings

##### **`formatGender(gender): string`**

Converts gender enums to respectful, inclusive display text.

- **Comprehensive Coverage**: All gender identity options
- **Respectful Language**: Inclusive terminology
- **Privacy Options**: "Prefer Not to Disclose" handling

##### **`formatRace(race): string`**

Formats racial identity with culturally appropriate terminology.

- **Detailed Descriptions**: Full racial category names
- **Cultural Sensitivity**: Respectful identity representation
- **Statistics Canada Alignment**: Consistent with census categories

##### **`formatIndigenousDetail(detail, otherDescription): string`**

Formats indigenous identity details with custom description support.

- **Standard Categories**: First Nations, Métis, Inuit
- **Custom Descriptions**: "Other" category with text support
- **Cultural Respect**: Appropriate terminology usage

#### **Specialized Formatting**

##### **`formatIdentitySummary(identity): string`**

Creates comprehensive identity overview for profile displays.

##### **`formatForAccessibility(identity): string`**

Generates screen reader friendly identity descriptions.

##### **`createDisplayName(identity): string`**

Determines best available display name with fallback hierarchy.

##### **`formatCulturalIdentity(identity): string`**

Formats cultural identity information for demographic displays.

### **🛡️ Identity Sanitizer (`identity-sanitizer.util.ts`)**

Provides data sanitization and cleaning functions with security focus.

#### **Core Sanitization Functions**

##### **`sanitizeUserBusinessId(businessId): string`**

Cleans business IDs with character validation and length limits.

- **Character Filtering**: Removes invalid characters (preserves A-Z, 0-9, -, \_)
- **Case Standardization**: Converts to uppercase
- **Length Enforcement**: 20 character maximum from CSV specification
- **Error Handling**: Robust error context for sanitization failures

##### **`sanitizeChosenName(chosenName): string`**

Sanitizes chosen names while preserving cultural authenticity.

- **HTML Protection**: Removes potential HTML brackets
- **Whitespace Normalization**: Standardizes spacing
- **Length Limits**: 255 character maximum from CSV specification
- **Cultural Preservation**: Maintains name authenticity

##### **`sanitizeLanguages(languages): Language[]`**

Converts various language input formats to valid enum arrays.

- **Multi-Format Support**: Arrays, comma-separated strings, single values
- **Enum Validation**: Filters to valid Language enum values
- **Default Fallback**: English default for empty selections
- **Type Safety**: Ensures consistent Language[] output

##### **`sanitizeIndigenousDetailOther(detailText): string`**

Cleans indigenous detail text with cultural sensitivity.

- **Content Protection**: Removes harmful HTML content
- **Length Limits**: 100 character maximum from CSV specification
- **Cultural Respect**: Preserves cultural information integrity

#### **Advanced Sanitization**

##### **`sanitizeIdentity(identity): Record<string, unknown>`**

Comprehensive identity object sanitization with field-by-field processing.

##### **`removePotentiallyHarmfulContent(text): string`**

Removes security threats from text fields including script tags and event handlers.

##### **`sanitizeEnumValue<T>(value, enumObject): T | undefined`**

Generic enum value sanitization with type safety.

##### **`sanitizeBoolean(value): boolean | undefined`**

Converts various boolean representations to standard boolean values.

### **🔒 Strip Internal Fields (`strip-internal-fields.util.ts`)**

Provides security-focused utilities for removing sensitive internal data.

#### **Security Functions**

##### **`stripInternalFields(identity): Record<string, unknown>`**

Removes internal-only fields before client exposure with comprehensive security.

- **Internal GUID Removal**: Strips `osot_table_identityid`
- **Privilege Protection**: Removes `osot_privilege` security data
- **System Field Exclusion**: Excludes `ownerid` and system metadata
- **Error Validation**: Input validation with detailed error context

##### **`stripInternalFieldsBulk(identities): Record<string, unknown>[]`**

Bulk processing version for identity arrays with consistent security application.

##### **`hasInternalFields(identity): boolean`**

Detects presence of internal fields requiring stripping.

##### **`stripForLogging(identity): Record<string, unknown>`**

Creates logging-safe identity objects with sensitive data masking.

- **Personal Data Masking**: Redacts chosen names and cultural details
- **Identifier Preservation**: Retains non-sensitive IDs for tracing
- **Audit Compliance**: Safe for log file inclusion

##### **`isIdentityLike(identity): boolean`**

Type guard for validating identity structure with required field verification.

## Business Logic Examples

### **Cultural Consistency Validation**

```ts
const validationResult = IdentityBusinessLogic.validateCulturalConsistency({
  osot_indigenous: true,
  osot_indigenous_detail: IndigenousDetail.FIRST_NATIONS,
  // ✅ Valid: indigenous status matches detail
});

const invalidResult = IdentityBusinessLogic.validateCulturalConsistency({
  osot_indigenous: false,
  osot_indigenous_detail: IndigenousDetail.METIS,
  // ❌ Invalid: indigenous false but detail provided
});
```

### **Data Completeness Assessment**

```ts
const completeness = IdentityBusinessLogic.assessDataCompleteness({
  osot_user_business_id: 'OSOT-ID-1234567',
  osot_language: [Language.ENGLISH, Language.FRENCH],
  osot_chosen_name: 'Alex Thompson',
  osot_gender: Gender.NON_BINARY,
  // Score: 57% (4/7 fields completed)
});
```

### **Sharing Permission Evaluation**

```ts
const sharingResult = IdentityBusinessLogic.canShareIdentityData(
  { osot_access_modifiers: AccessModifier.PRIVATE },
  Privilege.MEMBER,
);
// Result: Limited sharing with restricted fields
```

## Formatting Examples

### **Language List Formatting**

```ts
IdentityFormatter.formatLanguageList([Language.ENGLISH]);
// Output: "English"

IdentityFormatter.formatLanguageList([Language.ENGLISH, Language.FRENCH]);
// Output: "English and French"

IdentityFormatter.formatLanguageList([
  Language.ENGLISH,
  Language.FRENCH,
  Language.SPANISH,
]);
// Output: "English, French, and Spanish"
```

### **Cultural Identity Display**

```ts
const culturalInfo = IdentityFormatter.formatCulturalIdentity({
  osot_race: Race.FIRST_NATIONS,
  osot_indigenous: true,
  osot_indigenous_detail: IndigenousDetail.FIRST_NATIONS,
});
// Output: "Race: First Nations, Indigenous: First Nations"
```

## Sanitization Examples

### **Business ID Cleaning**

```ts
IdentityDataSanitizer.sanitizeUserBusinessId('osot-id-123$%^&456');
// Output: "OSOT-ID-123456"
```

### **Language Array Processing**

```ts
IdentityDataSanitizer.sanitizeLanguages('13,18,99');
// Output: [Language.ENGLISH, Language.FRENCH] (invalid 99 filtered out)
```

### **Comprehensive Identity Sanitization**

```ts
const cleanIdentity = IdentityDataSanitizer.sanitizeIdentity({
  osot_user_business_id: 'user@123!',
  osot_chosen_name: '  <script>alert("xss")</script>John Doe  ',
  osot_language: '13,18',
});
// Output: Clean, validated identity object
```

## Security Examples

### **Internal Field Stripping**

```ts
const publicSafeData = stripInternalFields({
  osot_identity_id: 'identity-123',
  osot_user_business_id: 'OSOT-ID-1234567',
  osot_table_identityid: 'internal-guid-456', // ❌ REMOVED
  osot_privilege: Privilege.ADMIN, // ❌ REMOVED
  ownerid: 'system-user-789', // ❌ REMOVED
  osot_chosen_name: 'Alex Thompson', // ✅ KEPT
});
```

### **Logging-Safe Data**

```ts
const loggingData = stripForLogging({
  osot_chosen_name: 'Sensitive Name',
  osot_user_business_id: 'OSOT-ID-1234567',
  osot_indigenous_detail_other: 'Cultural information',
});
// Output: { osot_chosen_name: '[REDACTED]', osot_user_business_id: 'OSOT-ID-1234567' }
```

## Error Handling Integration

### **Comprehensive Error Context**

```ts
// All utility functions include detailed error handling
try {
  const result = IdentityFormatter.formatUserBusinessId(invalidInput);
} catch (error) {
  // Error includes:
  // - Operation: 'format_user_business_id'
  // - Original input for debugging
  // - Detailed error message
  // - ErrorCodes.DATAVERSE_SERVICE_ERROR
}
```

### **Business Logic Validation Errors**

```ts
try {
  const validation =
    IdentityBusinessLogic.validateCulturalConsistency(invalidIdentity);
} catch (error) {
  // Provides context about validation operation and invalid data
}
```

## Architecture Benefits

### **Domain-Specific Logic**

- Business rules centralized in dedicated utilities
- Cultural sensitivity in formatting and validation
- Canadian regulatory compliance (languages, demographics)

### **Security by Design**

- Automatic internal field stripping
- Comprehensive input sanitization
- Logging-safe data preparation

### **Type Safety**

- Generic enum sanitization utilities
- Comprehensive type guards
- Compile-time validation support

### **Performance Optimized**

- Pure functions for caching compatibility
- Efficient bulk processing options
- Minimal object creation overhead

### **Testing Ready**

- Pure functions enable easy unit testing
- Comprehensive error scenarios covered
- Deterministic output for given inputs

## Best Practices

1. **Business Logic**: Use business logic utilities for domain-specific validation
2. **Data Formatting**: Apply consistent formatting before display
3. **Input Sanitization**: Always sanitize user input before processing
4. **Security**: Strip internal fields before client responses
5. **Error Handling**: Leverage comprehensive error context for debugging
6. **Type Safety**: Use type guards and enum validation utilities
7. **Performance**: Use bulk processing for large datasets
8. **Cultural Sensitivity**: Apply respectful terminology in all formatting

# OT Education Module - Utilities Documentation

## Overview

The OT Education utils module provides essential business logic utilities for managing occupational therapy education records within the OSOT system.

**Note**: Validation utilities have been consolidated into `validators/ot-education.validators.ts` to eliminate duplication between decorators and programmatic functions.

## Utility Classes

### OtEducationBusinessLogic

Core business logic utility for OT education operations, implementing professional requirements and regulatory constraints.

#### Key Features

- **Education Category Determination**: Automatically calculates `osot_education_category` based on graduation year and COTO status
- **COTO Validation**: Validates COTO registration alignment with professional status
- **University-Country Alignment**: Ensures geographic consistency in education records
- **Business Rule Enforcement**: Implements professional requirements and constraints

#### Key Integration Features

- **Enum Integration**: Leverages existing enum helper functions from `graduation-year.enum.ts` and `ot-university.enum.ts`
- **No Code Duplication**: Uses `getGraduationYearDisplayName()`, `getOtUniversityDisplayName()`, and `isOntarioUniversity()` from their respective enums
- **Consistent Display Names**: University and graduation year display follows established enum patterns

#### Primary Methods

```typescript
// Determine education category for osot_education_category field
OtEducationBusinessLogic.determineEducationCategory(
  graduationYear: GraduationYear,
  cotoStatus: CotoStatus,
  currentYear?: number
): EducationCategory

// Validate COTO status and registration alignment
OtEducationBusinessLogic.validateCotoAlignment(
  cotoStatus: CotoStatus,
  cotoRegistration?: string
): ValidationResult

// Validate university-country pairing
OtEducationBusinessLogic.validateUniversityCountryAlignment(
  university: OtUniversity,
  country: Country
): ValidationResult

// Check graduation year constraints
OtEducationBusinessLogic.validateGraduationYear(
  graduationYear: GraduationYear,
  currentYear?: number
): ValidationResult

// Comprehensive education record validation
OtEducationBusinessLogic.validateEducationRecord(
  education: OtEducationInternal
): ValidationResult
```

#### Business Rules Implemented

1. **Education Categories**:
   - `STUDENT`: Graduation year in the future
   - `NEW_GRAD`: Within 2 years of graduation with appropriate COTO status
   - `NONE`: Established professionals

2. **COTO Registration Requirements**:
   - `GENERAL` and `PROVISIONAL_TEMPORARY` require 8-digit registration
   - `OTHER` and `RESIGNED` typically don't require registration
   - Registration format: exactly 8 digits

3. **University-Country Alignment**:
   - Canadian universities must be paired with Canada
   - International education flagged for verification
   - Specific validation for recognized OT programs

4. **Graduation Year Constraints**:
   - Valid range: 1950 to current year + 10
   - Future dates generate warnings for current students
   - Historical limits based on formal OT program establishment

### OtEducationValidationUtil

**MOVED TO**: `validators/ot-education.validators.ts`

The validation utility has been consolidated with class-validator decorators to eliminate code duplication. You can still import it from utils for convenience:

```typescript
// Both imports work the same way
import { OtEducationValidationUtil } from './utils';
import { OtEducationValidationUtil } from './validators/ot-education.validators';
```

#### Consolidation Benefits

- **Single Source of Truth**: All validation logic in one place
- **No Duplication**: Decorators and programmatic functions use same implementation
- **Consistency**: Same validation behavior for DTOs and forms
- **Maintainability**: Changes in one place only

#### Primary Methods

```typescript
// Determine education category for osot_education_category field
OtEducationBusinessLogic.determineEducationCategory(
  graduationYear: GraduationYear,
  cotoStatus: CotoStatus,
  currentYear?: number
): EducationCategory

// Validate COTO status and registration alignment
OtEducationBusinessLogic.validateCotoAlignment(
  cotoStatus: CotoStatus,
  cotoRegistration?: string
): ValidationResult

// Validate university-country pairing
OtEducationBusinessLogic.validateUniversityCountryAlignment(
  university: OtUniversity,
  country: Country
): ValidationResult

// Check graduation year constraints
OtEducationBusinessLogic.validateGraduationYear(
  graduationYear: GraduationYear,
  currentYear?: number
): ValidationResult

// Comprehensive education record validation
OtEducationBusinessLogic.validateEducationRecord(
  education: OtEducationInternal
): ValidationResult
```

## Validation Functions

For validation utilities, see: `validators/ot-education.validators.ts`

````typescript
// Import validation utilities directly from validators
import { OtEducationValidationUtil } from './validators/ot-education.validators';

// Or through centralized exports from main module index
import { OtEducationValidationUtil } from '../ot-education';
```## Usage Examples

### Education Category Determination

```typescript
import { OtEducationBusinessLogic } from './utils';

// Determine category for a new graduate
const category = OtEducationBusinessLogic.determineEducationCategory(
  GraduationYear.YEAR_2023,
  CotoStatus.PROVISIONAL_TEMPORARY,
  2024,
);
// Returns: EducationCategory.NEW_GRAD

// Determine category for current student
const studentCategory = OtEducationBusinessLogic.determineEducationCategory(
  GraduationYear.YEAR_2025,
  CotoStatus.STUDENT,
  2024,
);
// Returns: EducationCategory.STUDENT
````

### COTO Validation

```typescript
import { OtEducationBusinessLogic } from './utils';

// Validate COTO alignment
const validation = OtEducationBusinessLogic.validateCotoAlignment(
  CotoStatus.GENERAL,
  '12345678',
);

if (!validation.isValid) {
  console.log('COTO Validation Errors:', validation.errors);
}
```

### Form Validation

```typescript
import { OtEducationValidationUtil } from './utils';

// Real-time field validation
const fieldValidation = OtEducationValidationUtil.validateField(
  'osot_coto_registration',
  '1234567',
  { osot_coto_status: CotoStatus.GENERAL },
);

if (!fieldValidation.isValid) {
  // Display: "Must be exactly 8 digits"
  showError(fieldValidation.message);
}

// Complete form validation summary
const summary =
  OtEducationValidationUtil.createValidationSummary(educationData);
if (!summary.isValid) {
  displayValidationSummary(summary.summary, summary.details);
}
```

### University-Country Validation

```typescript
import { OtEducationBusinessLogic } from './utils';

// Validate university-country pairing
const universityValidation =
  OtEducationBusinessLogic.validateUniversityCountryAlignment(
    OtUniversity.UNIVERSITY_OF_TORONTO,
    Country.UNITED_STATES,
  );

if (!universityValidation.isValid) {
  // Error: "University of Toronto is a Canadian university and should be paired with Canada"
  console.log(universityValidation.errors[0]);
}
```

## Integration Points

### With Existing Enum Helper Functions

The OT Education utils leverage existing helper functions from the enum files instead of duplicating logic:

```typescript
// Uses graduation-year.enum.ts helper
import { getGraduationYearDisplayName } from '../../../../common/enums/graduation-year.enum';

// Uses ot-university.enum.ts helpers
import {
  getOtUniversityDisplayName,
  isOntarioUniversity,
} from '../../../../common/enums/ot-university.enum';

// Example usage in business logic
const displayName = getGraduationYearDisplayName(graduationYear);
const isCanadian = isOntarioUniversity(university);
const universityName = getOtUniversityDisplayName(university);
```

### With EducationCategory Enum

```typescript
// The utils leverage the EducationCategory enum for osot_education_category field logic
enum EducationCategory {
  NONE = 0,
  STUDENT = 1,
  NEW_GRAD = 2,
}

// Business logic automatically determines appropriate category
const category = OtEducationBusinessLogic.determineEducationCategory(
  graduationYear,
  cotoStatus,
);
```

### With Business Rule Engine

```typescript
// Utils integrate with the global business rule pattern
import { BusinessRuleUtil } from '../../../utils/business-rule.util';

// Can be used with centralized business rule validation
const ruleResult = BusinessRuleUtil.validateWithCustomRule(
  educationData,
  (data) => OtEducationBusinessLogic.validateEducationRecord(data),
);
```

### With Error Handling

```typescript
// Utils provide structured error results for consistent error handling
const validation = OtEducationBusinessLogic.validateEducationRecord(education);

if (!validation.isValid) {
  // Errors are categorized and user-friendly
  validation.errors.forEach((error) => logError(error));
  validation.warnings.forEach((warning) => logWarning(warning));
}
```

## Architecture Patterns

### Separation of Concerns

**Clear division between validators and utils to eliminate duplication:**

#### **`validators/ot-education.validators.ts`** (Source of Truth)

- **Purpose**: Class-validator decorators for DTOs
- **Contains**: Validation constraint classes with business logic
- **Usage**: `@IsCotoRegistrationFormat()`, `@IsValidGraduationYear()`

#### **`utils/ot-education-validation.util.ts`** (Programmatic Interface)

- **Purpose**: Programmatic functions for form validation
- **Implementation**: Leverages validator constraint classes
- **Usage**: `OtEducationValidationUtil.isValidCotoRegistration()`

```typescript
// Example: Utils use validators as backend
const cotoValidator = new IsCotoRegistrationFormatConstraint();

export class OtEducationValidationUtil {
  static isValidCotoRegistration(registration: string): boolean {
    return cotoValidator.validate(registration); // Reuses validator logic
  }
}
```

### Static Method Design

Both utility classes use static methods following the established pattern from `AddressBusinessLogic` and `ContactBusinessLogic`.

### Validation Result Pattern

Consistent validation result structure across all methods:

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

### Frontend Integration Pattern

Validation utilities designed for easy frontend integration:

```typescript
// Real-time validation
const fieldResult = OtEducationValidationUtil.validateField(
  fieldName,
  value,
  context,
);

// Form submission validation
const formResult = OtEducationValidationUtil.createValidationSummary(formData);
```

## Performance Considerations

- **Static Methods**: No instance creation overhead
- **Minimal Dependencies**: Only essential enum imports
- **Efficient Validation**: Early returns and focused checks
- **Cached Lookups**: University lists and validation patterns cached

## Testing Patterns

Utilities are designed for comprehensive unit testing:

```typescript
// Business logic testing
describe('OtEducationBusinessLogic', () => {
  describe('determineEducationCategory', () => {
    it('should return STUDENT for future graduation', () => {
      const result = OtEducationBusinessLogic.determineEducationCategory(
        GraduationYear.YEAR_2025,
        CotoStatus.STUDENT,
        2024,
      );
      expect(result).toBe(EducationCategory.STUDENT);
    });
  });
});

// Validation utility testing
describe('OtEducationValidationUtil', () => {
  describe('isValidCotoRegistration', () => {
    it('should validate 8-digit registration', () => {
      expect(
        OtEducationValidationUtil.isValidCotoRegistration('12345678'),
      ).toBe(true);
      expect(OtEducationValidationUtil.isValidCotoRegistration('1234567')).toBe(
        false,
      );
    });
  });
});
```

## Error Messages

All validation utilities provide user-friendly error messages suitable for frontend display:

- **COTO Registration**: "COTO registration must be exactly 8 digits"
- **University Alignment**: "University of Toronto is a Canadian university and should be paired with Canada"
- **Graduation Year**: "Graduation year cannot be more than 10 years in the future"
- **Required Fields**: "Missing required fields: COTO Status, University, Graduation Year"

## Summary

The OT Education utils module provides comprehensive business logic and validation support for managing occupational therapy education records, focusing on:

1. **Education category determination** for the `osot_education_category` field
2. **COTO professional status validation** with registration requirements
3. **University-country alignment** ensuring geographic consistency
4. **Frontend-friendly validation** for real-time user feedback
5. **Business rule enforcement** maintaining regulatory compliance

These utilities integrate seamlessly with the existing OSOT architecture while providing education-specific logic essential for proper OT professional record management.

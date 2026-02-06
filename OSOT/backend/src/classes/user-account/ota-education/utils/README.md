# OTA Education Utils

## Overview

This directory contains utility functions and business logic helpers for OTA Education domain operations, implementing comprehensive business rules and validation patterns.

## Core Components

### Business Logic Utility (`ota-education-business-logic.util.ts`)

Central business logic implementation for OTA Education operations, providing:

#### Business Rule Validation

- **Work Declaration Validation** - Comprehensive validation for work declaration requirements
- **College-Country Alignment** - Ensures geographic consistency between college and country
- **Graduation Year Constraints** - Validates reasonable graduation year ranges
- **Degree Type Requirements** - Validates degree types against historical context

#### Education Category Logic

- **Automatic Category Determination** - Calculates education category based on graduation year
- **Student/Graduate Classification** - Business rules for current vs completed education
- **New Graduate Recognition** - Special handling for recent graduates

#### Data Quality & Consistency

- **Multiple Record Prevention** - Enforces one education record per user
- **Required Field Determination** - Context-aware required field calculation
- **International Verification** - Identifies records requiring additional verification

#### Access Control & Privileges

- **Privilege Determination** - Calculates appropriate access levels based on education status
- **Membership Benefits Qualification** - Determines eligibility for various benefits
- **Professional Experience Calculation** - Computes years of potential experience

## Business Rules Implementation

### Core Education Business Rules

1. **Single Education Record** - Each user can have only one OTA education record
2. **Work Declaration Required** - Work declarations mandatory for registration
3. **College-Country Alignment** - Canadian colleges must be paired with Canada
4. **Graduation Year Validation** - Years must be within reasonable ranges (1960-current+10)

### Education Category Logic

```typescript
// Automatic category determination
if (graduationYear > currentYear) → STUDENT
if (graduationYear === currentYear || currentYear-1) → NEW_GRADUATED
if (graduationYear < currentYear-1) → GRADUATED
```

### Validation Patterns

- **Comprehensive Validation** - All education record validation in single method
- **Error & Warning Separation** - Distinguishes between blocking errors and informational warnings
- **Context-Aware Rules** - Different validation based on registration vs update contexts

## Key Methods

### Business Logic Methods

- `canHaveMultipleEducationRecords()` - Always returns false (business rule)
- `getRequiredFields()` - Context-aware required field determination
- `determineEducationCategory()` - Automatic category calculation
- `validateEducationRecord()` - Comprehensive record validation

### Validation Methods

- `validateWorkDeclaration()` - Work declaration business rules
- `validateCollegeCountryAlignment()` - Geographic consistency validation
- `validateGraduationYear()` - Year constraint validation
- `validateDegreeType()` - Historical degree type validation

### Utility Methods

- `requiresInternationalVerification()` - International education detection
- `calculateExperienceYears()` - Professional experience calculation
- `determineAccessPrivilege()` - Access level determination
- `qualifiesForMembershipBenefits()` - Benefit eligibility assessment
- `generateEducationSummary()` - Human-readable education description

## Integration Points

### Dependencies

- `../../../../common/enums/` - All domain enumerations
- `../../../../common/enums/ota-college.enum` - Includes `isCanadianCollege()` helper function
- `../interfaces/ota-education-internal.interface.ts` - Internal data models

### Architecture Pattern Alignment

- Follows same validation pattern as OT Education domain
- Uses `isCanadianCollege()` helper function (similar to `isOntarioUniversity()` in OT Education)
- Centralized college validation logic in enum rather than hardcoded arrays

### Used By

- Validation services for data integrity
- Registration orchestrators for business rule enforcement
- Access control systems for privilege determination
- Reporting services for education summaries

## Example Usage

```typescript
// Business rule validation
const validation = OtaEducationBusinessLogic.validateEducationRecord(education);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}

// Education category determination
const category = OtaEducationBusinessLogic.determineEducationCategory(
  graduationYear,
  currentYear,
);

// Privilege calculation
const privilege = OtaEducationBusinessLogic.determineAccessPrivilege(education);

// International verification check
const needsVerification =
  OtaEducationBusinessLogic.requiresInternationalVerification(
    education.osot_ota_country,
    education.osot_ota_college,
  );

// College-country alignment validation (using isCanadianCollege helper)
const collegeValidation =
  OtaEducationBusinessLogic.validateCollegeCountryAlignment(
    education.osot_ota_college,
    education.osot_ota_country,
  );
```

## Business Rule Categories

### Registration Rules

- Work declaration requirements
- Account linking requirements
- Required field enforcement

### Data Quality Rules

- College-country geographic alignment
- Graduation year reasonableness
- Degree type historical accuracy

### Access Control Rules

- Privilege level determination
- Membership benefit qualification
- Professional experience assessment

### Compliance Rules

- International education verification
- Duplicate record prevention
- Data consistency enforcement

## Error Handling

All validation methods return structured results:

```typescript
{
  isValid: boolean;
  errors: string[];      // Blocking validation failures
  warnings: string[];    // Non-blocking concerns
}
```

This pattern allows for:

- Clear distinction between errors and warnings
- Detailed feedback for users and administrators
- Flexible handling based on context (registration vs updates)

---

_Part of OSOT Dataverse API - OTA Education Domain Implementation_

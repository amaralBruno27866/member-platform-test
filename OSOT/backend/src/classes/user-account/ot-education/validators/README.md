# OT Education Validators

## Purpose

Contains **custom validation logic** specific to the **Occupational Therapy Education** domain. Validators include class-validator custom decorators and standalone helper functions for business rule enforcement, data integrity, and domain-specific constraints.

## 📁 Structure

```
validators/
├── ot-education.validators.ts    # Main validators file
└── README.md                    # This documentation
```

## 🔧 Validator Categories

### 🏛️ **COTO Registration Validators**

Validators specific to **College of Occupational Therapists of Ontario** requirements:

#### **Format Validation**:

```typescript
import { IsCotoRegistrationFormat } from './validators';

class CreateOtEducationDto {
  @IsOptional()
  @IsCotoRegistrationFormat()
  osot_coto_registration?: string;
}
```

**Validation Rules**:

- ✅ **Max 8 characters**
- ✅ **Uppercase alphanumeric only** (A-Z, 0-9)
- ✅ **Optional field** (can be null/undefined)
- ✅ **Pattern**: `/^[A-Z0-9]+$/`

#### **Business Rule Validation**:

```typescript
import { IsCotoStatusRegistrationValid } from './validators';

class CreateOtEducationDto {
  @IsEnum(CotoStatus)
  osot_coto_status: CotoStatus;

  @IsOptional()
  @IsCotoRegistrationFormat()
  @IsCotoStatusRegistrationValid() // Cross-field validation
  osot_coto_registration?: string;
}
```

**Business Logic**:

- ✅ **GENERAL/PROVISIONAL_TEMPORARY status** → Registration **required**
- ✅ **OTHER/STUDENT/PENDING/RESIGNED status** → Registration **not allowed**
- ✅ **Cross-field validation** between status and registration
- ✅ **Dynamic error messages** based on status

### 🆔 **User Business ID Validators**

Domain-specific User Business ID validation for OT Education:

```typescript
import { IsOtEducationUserBusinessId } from './validators';

class CreateOtEducationDto {
  @IsOtEducationUserBusinessId()
  osot_user_business_id: string;
}
```

**Validation Rules**:

- ✅ **Required field** (cannot be null/undefined)
- ✅ **Max 20 characters**
- ✅ **Alphanumeric + underscore/dash** pattern: `/^[a-zA-Z0-9_-]+$/`
- ✅ **Uniqueness** (via helper functions)

### 🎓 **University & Country Validators**

Geographic and institutional alignment validation:

```typescript
import { IsUniversityCountryAligned } from './validators';

class CreateOtEducationDto {
  @IsEnum(OtUniversity)
  osot_ot_university: OtUniversity;

  @IsEnum(Country)
  @IsUniversityCountryAligned() // Cross-field validation
  osot_ot_country: Country;
}
```

**Business Logic**:

- ✅ **Canadian universities** → Must have **Country = Canada**
- ✅ **International degrees** → Validation warnings
- ✅ **Geographic consistency** enforcement
- ✅ **Accreditation awareness**

### 📅 **Graduation Year Validators**

Temporal validation for graduation years:

```typescript
import { IsValidGraduationYear } from './validators';

class CreateOtEducationDto {
  @IsValidGraduationYear()
  osot_ot_grad_year: GraduationYear;
}
```

**Validation Rules**:

- ✅ **Min year**: 1950 (reasonable historical limit)
- ✅ **Max year**: Current year + 5 (future graduations allowed)
- ✅ **Business logic**: Prevents unrealistic dates
- ✅ **Dynamic range**: Updates based on current year

### 📝 **Additional Field Validators**

Other domain-specific field validations:

```typescript
import { IsValidOtOther } from './validators';

class CreateOtEducationDto {
  @IsOptional()
  @IsValidOtOther()
  osot_ot_other?: string;
}
```

**OT Other Field**:

- ✅ **Max 100 characters**
- ✅ **Optional field**
- ✅ **No empty strings** (trim validation)
- ✅ **Content validation**

## 🛠️ **Helper Functions**

### **Completeness Validation**

```typescript
import { validateOtEducationCompleteness } from './validators';

const result = validateOtEducationCompleteness(educationData);
console.log(result);
// {
//   isValid: true,
//   errors: [],
//   warnings: ['Profile completeness is below 70%'],
//   completenessScore: 65
// }
```

**Features**:

- ✅ **Required fields check**
- ✅ **Completeness scoring** (0-100%)
- ✅ **Error collection**
- ✅ **Warning generation**
- ✅ **Business recommendations**

### **Uniqueness Validation (Async)**

```typescript
import {
  validateCotoRegistrationUniqueness,
  validateUserBusinessIdUniqueness,
} from './validators';

// COTO Registration uniqueness
const isUnique = await validateCotoRegistrationUniqueness(
  'AB123456',
  excludeId,
);

// User Business ID uniqueness
const isUserIdUnique = await validateUserBusinessIdUniqueness(
  'user-123',
  excludeId,
);
```

**Features**:

- ✅ **Async validation** (database checks)
- ✅ **Exclude ID support** (for updates)
- ✅ **Repository integration** (when available)
- ✅ **Performance optimized**

### **International Degree Validation**

```typescript
import { validateInternationalDegreeRequirements } from './validators';

const result = validateInternationalDegreeRequirements(university, country);
// {
//   requiresValidation: true,
//   warnings: ['International degrees may require additional validation...']
// }
```

## 📋 **Usage Patterns**

### **DTO Integration**

```typescript
import {
  IsCotoRegistrationFormat,
  IsCotoStatusRegistrationValid,
  IsOtEducationUserBusinessId,
  IsUniversityCountryAligned,
  IsValidGraduationYear,
  IsValidOtOther,
} from './validators';

export class CreateOtEducationDto {
  // Required Business Fields
  @IsOtEducationUserBusinessId()
  osot_user_business_id: string;

  @IsEnum(CotoStatus)
  osot_coto_status: CotoStatus;

  @IsEnum(DegreeType)
  osot_ot_degree_type: DegreeType;

  @IsEnum(OtUniversity)
  osot_ot_university: OtUniversity;

  @IsValidGraduationYear()
  osot_ot_grad_year: GraduationYear;

  @IsEnum(Country)
  @IsUniversityCountryAligned()
  osot_ot_country: Country;

  // Optional Fields
  @IsOptional()
  @IsCotoRegistrationFormat()
  @IsCotoStatusRegistrationValid()
  osot_coto_registration?: string;

  @IsOptional()
  @IsEnum(EducationCategory)
  osot_education_category?: EducationCategory;

  @IsOptional()
  @IsValidOtOther()
  osot_ot_other?: string;
}
```

### **Service Integration**

```typescript
import { validateOtEducationCompleteness } from './validators';

export class OtEducationBusinessRuleService {
  async validateForCreation(
    data: CreateOtEducationDto,
  ): Promise<ValidationResult> {
    // Use completeness validator
    const completenessResult = validateOtEducationCompleteness(data);

    // Use async uniqueness validators
    const isUserIdUnique = await validateUserBusinessIdUniqueness(
      data.osot_user_business_id,
    );
    const isCotoUnique = data.osot_coto_registration
      ? await validateCotoRegistrationUniqueness(data.osot_coto_registration)
      : true;

    // Combine results
    return {
      isValid: completenessResult.isValid && isUserIdUnique && isCotoUnique,
      errors: [
        ...completenessResult.errors,
        ...(isUserIdUnique ? [] : ['User Business ID already exists']),
        ...(isCotoUnique ? [] : ['COTO Registration already exists']),
      ],
      warnings: completenessResult.warnings,
      completenessScore: completenessResult.completenessScore,
    };
  }
}
```

## 🎯 **Domain-Specific Features**

### 🏛️ **COTO Professional Standards**

- **Registration Format**: 8-character alphanumeric codes
- **Status Dependencies**: Registration requirements based on professional status
- **Uniqueness Enforcement**: System-wide registration number uniqueness
- **Professional Validation**: Cross-validation with COTO business rules

### 🎓 **Academic Credential Validation**

- **Institutional Recognition**: Canadian vs international university validation
- **Temporal Logic**: Graduation year reasonableness checks
- **Geographic Consistency**: University-country alignment enforcement
- **Degree Validation**: Type and level consistency

### 🌍 **International Education Support**

- **Multi-country Recognition**: Support for international degrees
- **Validation Requirements**: Flagging for additional validation needs
- **Accreditation Awareness**: Recognition status tracking
- **Professional Equivalency**: Warnings for non-Canadian credentials

### 🔒 **Data Integrity & Security**

- **Format Enforcement**: Strict field format validation
- **Business Rule Compliance**: Domain-specific constraint enforcement
- **Uniqueness Guarantees**: Preventing duplicate registrations
- **Completeness Scoring**: Encouraging comprehensive profiles

## ⚠️ **Implementation Notes**

### **TODO Items** (for future implementation):

1. **Enum Integration**: Complete implementation when enum values are finalized
2. **Repository Integration**: Connect uniqueness validators to actual data layer
3. **University Mapping**: Implement Canadian university detection logic
4. **Performance Optimization**: Cache validation results for repeated checks

### **Extension Points**:

- **Custom Error Messages**: Localization support
- **Dynamic Business Rules**: Configuration-driven validation
- **Integration Testing**: Comprehensive validation scenario testing
- **Async Validation**: Database-dependent validation patterns

## 🚀 **Usage Guidelines**

### ✅ **Best Practices**

1. **Combine Validators**: Use multiple decorators for comprehensive validation
2. **Cross-field Validation**: Leverage business rule validators for related fields
3. **Async Validation**: Use helper functions for database-dependent checks
4. **Error Handling**: Provide clear, actionable error messages
5. **Performance**: Cache validation results where appropriate

### ❌ **Anti-Patterns**

- ❌ **Single Field Focus**: Ignoring cross-field business rules
- ❌ **Hardcoded Values**: Use constants for all validation parameters
- ❌ **Generic Messages**: Provide domain-specific error messages
- ❌ **Sync Database Calls**: Use async patterns for uniqueness checks

**These validators ensure data integrity, business rule compliance, and professional standards for OT Education records!** 🎯

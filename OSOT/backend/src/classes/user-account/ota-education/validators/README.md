# OTA Education Validators

## Purpose

Contains custom validation logic and decorators specific to the OTA Education domain. Implements business rules for Occupational Therapy Assistant education records, including field validation, business logic constraints, and data integrity checks.

## Architecture

The validators follow **Enterprise Architecture patterns**:

- **Domain-Driven Design**: Validators focused on OTA education business rules
- **Type Safety**: Full TypeScript integration with proper error handling
- **Business Logic**: Encapsulated domain-specific validation rules
- **Reusability**: Decorator pattern for easy application to DTOs

## File Structure

### `ota-education.validators.ts`

Main validators file containing all OTA Education domain validation logic:

#### Validator Categories

**1. User Business ID Validators**

```typescript
@IsOtaEducationUserBusinessId()
osot_user_business_id: string;
```

- **Purpose**: Validates format and requirements for user business identifiers
- **Rules**: 20 chars max, alphanumeric with underscore/dash only
- **Required**: Yes (business required field)

**2. Work Declaration Validators**

```typescript
@IsWorkDeclarationExplicit()
osot_work_declaration: boolean;
```

- **Purpose**: Ensures work declaration is explicitly set (true or false)
- **Rules**: Cannot be null, undefined, or other values
- **Required**: Yes (business required field)

**3. Degree Type Validators**

```typescript
@IsOtaDegreeTypeValid()
osot_ota_degree_type?: DegreeType;
```

- **Purpose**: Validates degree type is appropriate for OTA programs
- **Rules**: Must be from allowed types (DIPLOMA_CREDENTIAL, OTHER)
- **Required**: No (optional with defaults)

**4. College-Country Alignment Validators**

```typescript
@IsCollegeCountryAligned()
osot_ota_college?: OtaCollege;
```

- **Purpose**: Ensures selected college matches specified country
- **Rules**: Canadian colleges for Canada country selection
- **Required**: No (optional field)

**5. Field Length Validators**

```typescript
@IsOtaOtherLengthValid()
osot_ota_other?: string;
```

- **Purpose**: Validates optional field lengths
- **Rules**: Max 100 characters for OTA Other field
- **Required**: No (optional field)

## Usage Examples

### DTO Integration

```typescript
import {
  IsOtaEducationUserBusinessId,
  IsWorkDeclarationExplicit,
  IsOtaDegreeTypeValid,
  IsCollegeCountryAligned,
  IsOtaOtherLengthValid,
} from '../validators/ota-education.validators';

export class CreateOtaEducationDto {
  @IsOtaEducationUserBusinessId()
  @IsNotEmpty()
  osot_user_business_id: string;

  @IsWorkDeclarationExplicit()
  osot_work_declaration: boolean;

  @IsOtaDegreeTypeValid()
  @IsOptional()
  osot_ota_degree_type?: DegreeType;

  @IsCollegeCountryAligned()
  @IsOptional()
  osot_ota_college?: OtaCollege;

  @IsOtaOtherLengthValid()
  @IsOptional()
  osot_ota_other?: string;
}
```

### Utility Function Usage

```typescript
import {
  isValidOtaCollege,
  isValidOtaDegreeType,
  isWorkDeclarationValid,
  validateOtaEducationBusinessRules,
} from '../validators/ota-education.validators';

// Individual validation checks
const isValidCollege = isValidOtaCollege(OtaCollege.ALGONQUIN_COLLEGE); // true
const isValidDegree = isValidOtaDegreeType(DegreeType.DIPLOMA_CREDENTIAL); // true
const isValidWork = isWorkDeclarationValid(true); // true

// Comprehensive business rule validation
const education: Partial<OtaEducationInternal> = {
  osot_user_business_id: 'USER123',
  osot_work_declaration: true,
  osot_ota_degree_type: DegreeType.DIPLOMA_CREDENTIAL,
};

const validation = validateOtaEducationBusinessRules(education);
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}
```

## Validation Rules Summary

### Required Fields (Business Required)

| Field                   | Validator                         | Rules                                        | Error Message                                              |
| ----------------------- | --------------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| `osot_user_business_id` | `@IsOtaEducationUserBusinessId()` | Max 20 chars, alphanumeric + underscore/dash | "User Business ID must be 20 characters or less..."        |
| `osot_work_declaration` | `@IsWorkDeclarationExplicit()`    | Must be explicitly true or false             | "Work declaration must be explicitly set to true or false" |

### Optional Fields with Validation

| Field                  | Validator                    | Rules                           | Default              |
| ---------------------- | ---------------------------- | ------------------------------- | -------------------- |
| `osot_ota_degree_type` | `@IsOtaDegreeTypeValid()`    | Must be allowed OTA degree type | `DIPLOMA_CREDENTIAL` |
| `osot_ota_college`     | `@IsCollegeCountryAligned()` | Must match country selection    | None                 |
| `osot_ota_other`       | `@IsOtaOtherLengthValid()`   | Max 100 characters              | None                 |

### Business Logic Rules

- **College-Country Alignment**: Canadian colleges only for Canada selection
- **Degree Type Restriction**: Only OTA-appropriate degree types allowed
- **Work Declaration**: Must be explicit boolean value (not null/undefined)

## Integration Points

### With Constants

```typescript
// Uses validation rules from constants
const maxLength = OTA_EDUCATION_VALIDATION.USER_BUSINESS_ID.MAX_LENGTH;
const pattern = OTA_EDUCATION_VALIDATION.USER_BUSINESS_ID.PATTERN;
const allowedTypes = OTA_EDUCATION_BUSINESS_RULES.DEGREE_TYPE.ALLOWED_TYPES;
```

### With Enums

```typescript
// Validates against proper enum values
const isValidCollege = Object.values(OtaCollege).includes(college);
const isCanadian = college !== OtaCollege.OTHER; // for country alignment
```

### With DTOs

```typescript
// Applied as decorators in DTO classes
@IsOtaEducationUserBusinessId()
@IsWorkDeclarationExplicit()
@IsOtaDegreeTypeValid()
```

### With Services

```typescript
// Used in business logic validation
const validation = validateOtaEducationBusinessRules(educationData);
if (!validation.isValid) {
  throw new ValidationException(validation.errors);
}
```

## Enterprise Patterns

### **Domain-Driven Design**

- Validators encapsulate OTA education domain rules
- Business logic separated from technical validation
- Domain-specific error messages and rules

### **Type Safety**

- Full TypeScript integration with proper typing
- Enum validation with type checking
- Interface compliance for validation objects

### **Security-First Design**

- Input validation prevents malicious data
- Business rule enforcement at validation layer
- Proper error handling without data exposure

### **Testability**

- Utility functions for unit testing
- Isolated validation logic
- Clear separation of concerns

## Error Handling

### Validation Error Types

```typescript
// Format validation errors
'User Business ID must be 20 characters or less and contain only alphanumeric characters, underscores, or dashes';

// Business rule errors
'Work declaration must be explicitly set to true or false';
'OTA degree type must be one of: 1, 0';
'Selected college must be from the specified country';

// Length validation errors
'OTA Other field cannot exceed 100 characters';
```

### Comprehensive Validation Response

```typescript
const result = validateOtaEducationBusinessRules(education);
// Returns: { isValid: boolean; errors: string[] }

if (!result.isValid) {
  result.errors.forEach((error) => console.log(error));
}
```

## Maintenance Guidelines

### Adding New Validators

1. **Create Constraint Class**: Implement `ValidatorConstraintInterface`
2. **Create Decorator Function**: Export decorator for DTO usage
3. **Add Utility Function**: For programmatic validation
4. **Update Documentation**: Include in this README
5. **Write Tests**: Unit tests for all validation scenarios

### Modifying Existing Validators

1. **Check Impact**: Review all usages in DTOs and services
2. **Update Constants**: Modify validation rules in constants file
3. **Update Error Messages**: Ensure user-friendly messages
4. **Test Thoroughly**: Verify backward compatibility

### Business Rule Changes

1. **Update Constants**: Modify business rules in constants
2. **Update Validators**: Reflect changes in validation logic
3. **Update DTOs**: Apply new validation decorators
4. **Update Documentation**: Keep README current

## Performance Considerations

1. **Synchronous Validation**: All validators are synchronous for performance
2. **Early Return**: Validators return early on null/undefined when appropriate
3. **Regex Efficiency**: Patterns compiled once and reused
4. **Minimal Dependencies**: Lightweight validation logic

## Compliance & Security

- **Input Sanitization**: Validates format and content
- **Business Rule Enforcement**: Ensures domain integrity
- **Error Boundaries**: Prevents system exposure through validation errors
- **Type Safety**: Prevents type confusion and injection attacks

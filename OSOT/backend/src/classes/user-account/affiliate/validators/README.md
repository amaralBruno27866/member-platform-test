# Affiliate Validators

## Purpose

Contains custom validation logic used by DTOs and services for the Affiliate module. Validators implement comprehensive business rules for affiliate registration, updates, and data integrity.

## Architecture

**Unified Structure**: Following the established project pattern, all affiliate validators are consolidated into a single `affiliate.validators.ts` file for consistency with other modules (account, address, contact). This approach improves maintainability and provides a centralized validation resource.

## Structure

The affiliate validators are organized into the following specialized sections:

### 🏢 **Organization Profile Validators**

- **`AffiliateNameValidator`** - Organization name format and length validation
- **`AffiliateAreaValidator`** - Business area selection against global enum values

### 👤 **Representative Identity Validators**

- **`RepresentativeFirstNameValidator`** - Contact person first name validation
- **`RepresentativeLastNameValidator`** - Contact person last name validation
- **`RepresentativeJobTitleValidator`** - Job title format and business rules
- **`RepresentativeFullNameValidator`** - Cross-field validation for name uniqueness

### 📞 **Contact Information Validators**

- **`AffiliateEmailValidator`** - Email format and length validation
- **`AffiliatePhoneValidator`** - Canadian phone number validation
- **`AffiliateWebsiteValidator`** - Business website URL validation

### 🌐 **Social Media URL Validators**

- **`FacebookUrlValidator`** - Facebook page/profile URL validation
- **`InstagramUrlValidator`** - Instagram profile URL validation
- **`TiktokUrlValidator`** - TikTok profile URL validation
- **`LinkedinUrlValidator`** - LinkedIn company/profile URL validation
- **`SocialMediaPlatformValidator`** - Platform-specific URL validation
- **`SocialMediaUniquenessValidator`** - Prevents duplicate URLs across platforms

### 🏠 **Address Validators**

- **`AffiliateAddress1Validator`** - Primary address line validation
- **`AffiliateAddress2Validator`** - Secondary address line validation
- **`AffiliateProvinceValidator`** - Province selection validation
- **`AffiliateCountryValidator`** - Country selection validation
- **`AffiliatePostalCodeValidator`** - Country-specific postal code validation

### 🔐 **Password & Security Validators**

- **`AffiliatePasswordValidator`** - Password complexity and security rules
- **`PasswordConfirmationValidator`** - Password confirmation matching
- **`PasswordPolicyValidator`** - Organizational password policy enforcement

### 🔒 **Account & Security Validators**

- **`AccountDeclarationValidator`** - Account declaration acceptance validation
- **`AffiliateAccountStatusValidator`** - Account status validation
- **`AffiliateAccessModifiersValidator`** - Access modifier validation

### ⚙️ **Account & System Validators**

- **`AccountDeclarationValidator`** - Account declaration acceptance validation
- **`AffiliateAccountStatusValidator`** - Account status selection validation
- **`AffiliateAccessModifiersValidator`** - Access control level validation

## Examples

### Basic Organization Validation

```typescript
import { AffiliateNameValidator, AffiliateAreaValidator } from './validators';
import { AffiliateArea } from '../../../../common/enums';

// Organization name validation
@Validate(AffiliateNameValidator)
affiliateName: string;

// Business area validation
@Validate(AffiliateAreaValidator)
affiliateArea: AffiliateArea;

// Example usage
const orgValidator = new AffiliateNameValidator();
console.log(orgValidator.validate('Tech Solutions Inc.')); // true
console.log(orgValidator.validate('123')); // false - too short, no letters
```

### Representative Identity Validation

```typescript
import {
  RepresentativeFirstNameValidator,
  RepresentativeLastNameValidator,
  RepresentativeJobTitleValidator,
} from './validators';

class CreateAffiliateDto {
  @Validate(RepresentativeFirstNameValidator)
  representativeFirstName: string;

  @Validate(RepresentativeLastNameValidator)
  representativeLastName: string;

  @Validate(RepresentativeJobTitleValidator)
  representativeJobTitle: string;
}

// Example validation
const nameValidator = new RepresentativeFirstNameValidator();
console.log(nameValidator.validate('John')); // true
console.log(nameValidator.validate('J')); // true - minimum 1 char
console.log(nameValidator.validate('John123')); // false - no numbers allowed
```

### Contact Information Validation

```typescript
import {
  AffiliateEmailValidator,
  AffiliatePhoneValidator,
  AffiliateWebsiteValidator,
} from './validators';

class AffiliateContactDto {
  @Validate(AffiliateEmailValidator)
  affiliateEmail: string;

  @Validate(AffiliatePhoneValidator)
  affiliatePhone: string;

  @Validate(AffiliateWebsiteValidator)
  affiliateWebsite?: string;
}

// Example validation
const emailValidator = new AffiliateEmailValidator();
console.log(emailValidator.validate('contact@company.com')); // true
console.log(emailValidator.validate('invalid-email')); // false

const phoneValidator = new AffiliatePhoneValidator();
console.log(phoneValidator.validate('+1-416-555-0123')); // true
console.log(phoneValidator.validate('416-555-0123')); // true
console.log(phoneValidator.validate('123')); // false - too short
```

### Social Media URL Validation

```typescript
import {
  FacebookUrlValidator,
  InstagramUrlValidator,
  LinkedinUrlValidator,
  SocialMediaUniquenessValidator,
} from './validators';

class SocialMediaDto {
  @Validate(FacebookUrlValidator)
  affiliateFacebook?: string;

  @Validate(InstagramUrlValidator)
  affiliateInstagram?: string;

  @Validate(LinkedinUrlValidator)
  affiliateLinkedIn?: string;

  @Validate(SocialMediaUniquenessValidator)
  validateUniqueness?: boolean;
}

// Example validation
const fbValidator = new FacebookUrlValidator();
console.log(fbValidator.validate('https://facebook.com/company')); // true
console.log(fbValidator.validate('https://instagram.com/company')); // false

const igValidator = new InstagramUrlValidator();
console.log(igValidator.validate('https://instagram.com/company')); // true
console.log(igValidator.validate('https://facebook.com/company')); // false
```

### Address Validation

```typescript
import {
  AffiliateAddress1Validator,
  AffiliatePostalCodeValidator,
  AffiliateProvinceValidator,
} from './validators';
import { Province, Country } from '../../../../common/enums';

class AddressDto {
  @Validate(AffiliateAddress1Validator)
  affiliateAddress1: string;

  @Validate(AffiliatePostalCodeValidator)
  affiliatePostalCode: string;

  @Validate(AffiliateProvinceValidator)
  affiliateProvince: Province;

  affiliateCountry: Country; // Used by postal code validator
}

// Example validation
const addressValidator = new AffiliateAddress1Validator();
console.log(addressValidator.validate('123 Main Street')); // true
console.log(addressValidator.validate('Main Street')); // false - no number

const postalValidator = new AffiliatePostalCodeValidator();
// Validates against country context
console.log(
  postalValidator.validate('K1A 0A6', {
    object: { affiliateCountry: Country.CANADA },
  }),
); // true
console.log(
  postalValidator.validate('12345', {
    object: { affiliateCountry: Country.USA },
  }),
); // true
```

### Password Validation

```typescript
import {
  AffiliatePasswordValidator,
  PasswordStrengthValidator,
  PasswordPolicyValidator,
  validatePasswordWithFeedback,
} from './validators';

class PasswordDto {
  @Validate(AffiliatePasswordValidator)
  password: string;

  @Validate(PasswordConfirmationValidator)
  confirmPassword: string;
}

// Example validation
const passwordValidator = new AffiliatePasswordValidator();
console.log(passwordValidator.validate('StrongPass123!')); // true
console.log(passwordValidator.validate('weak')); // false

// Detailed password feedback
const feedback = validatePasswordWithFeedback('MyPassword123!');
console.log(feedback);
// {
//   isValid: true,
//   strength: PasswordStrength.STRONG,
//   feedback: [],
//   score: 7
// }

const weakFeedback = validatePasswordWithFeedback('123');
console.log(weakFeedback);
// {
//   isValid: false,
//   strength: PasswordStrength.VERY_WEAK,
//   feedback: [
//     'Password must be at least 8 characters',
//     'Password must contain at least one uppercase letter',
//     // ... more feedback
//   ],
//   score: 1
// }
```

### Cross-Field Validation

```typescript
import {
  RepresentativeFullNameValidator,
  PasswordConfirmationValidator,
  SocialMediaUniquenessValidator,
} from './validators';

class CreateAffiliateDto {
  representativeFirstName: string;
  representativeLastName: string;
  password: string;

  @Validate(PasswordConfirmationValidator)
  confirmPassword: string;

  @Validate(RepresentativeFullNameValidator)
  validateNames?: boolean; // Triggers cross-field validation

  affiliateFacebook?: string;
  affiliateInstagram?: string;

  @Validate(SocialMediaUniquenessValidator)
  validateSocialUniqueness?: boolean;
}

// Cross-field validators access the entire object for validation
const nameValidator = new RepresentativeFullNameValidator();
console.log(
  nameValidator.validate(true, {
    object: {
      representativeFirstName: 'John',
      representativeLastName: 'Smith',
    },
  }),
); // true

console.log(
  nameValidator.validate(true, {
    object: {
      representativeFirstName: 'John',
      representativeLastName: 'John', // Same as first name
    },
  }),
); // false
```

### Utility Functions

```typescript
import {
  formatPostalCode,
  validatePostalCodeForCountry,
  getPasswordRequirements,
  validateSocialMediaUrl,
} from './validators';
import { Country } from '../../../../common/enums';

// Postal code utilities
const formatted = formatPostalCode('K1A0A6', Country.CANADA);
console.log(formatted); // 'K1A 0A6'

const isValid = validatePostalCodeForCountry('12345', Country.USA);
console.log(isValid); // true

// Password utilities
const requirements = getPasswordRequirements();
console.log(requirements);
// [
//   'At least 8 characters long',
//   'At least one uppercase letter (A-Z)',
//   // ... more requirements
// ]

// Social media utilities
const isValidFb = validateSocialMediaUrl(
  'https://facebook.com/company',
  'FACEBOOK',
);
console.log(isValidFb); // true
```

## Usage Guidelines

### 🎯 **When to Use Each Validator**

- **DTO Classes** - Use `@Validate()` decorators for automatic validation
- **Service Layer** - Call validator methods directly for business logic validation
- **Frontend** - Import utility functions for client-side validation
- **Testing** - Use validators to ensure data integrity in tests

### 🔒 **Security Considerations**

- **Password validation** is comprehensive with strength scoring and policy enforcement
- **Email validation** prevents injection attacks with proper sanitization
- **URL validation** ensures social media links are from correct platforms
- **Cross-field validation** prevents inconsistent data combinations

### 📊 **Performance Optimization**

- **Validators are stateless** - safe to instantiate multiple times
- **Utility functions** are pure functions with no side effects
- **Pattern matching** uses compiled RegExp for optimal performance
- **Early validation** returns false quickly for obvious invalid inputs

### 🎛️ **Customization Options**

- **Extend validators** by inheriting from base validator classes
- **Override messages** by implementing custom `defaultMessage()` methods
- **Add business rules** by creating new validator classes following the pattern
- **Combine validators** using the collections provided in the index

## Key Features

### 🔗 **Global Integration**

- **Constants alignment** - All validators use constants from affiliate.constants.ts
- **Enum validation** - Choice fields validated against global enum values
- **Utility integration** - Leverages phone, email, and URL utilities
- **Error handling** - Consistent error messages through ErrorMessages enum

### 📱 **Multi-Platform Support**

- **Canadian focus** - Specialized validation for Canadian postal codes and phone numbers
- **US support** - ZIP code validation and US phone number support
- **International** - Generic validation patterns for other countries
- **Social platforms** - Support for major social media platforms

### 🎨 **Developer Experience**

- **TypeScript types** - Full type safety with proper interfaces
- **Decorator support** - Works seamlessly with class-validator decorators
- **Utility functions** - Helper functions for common validation tasks
- **Comprehensive documentation** - Clear examples and usage patterns

## Composite Validators

Following the established project pattern, the affiliate module includes composite validators for comprehensive validation:

### `AffiliateSocialMediaValidator`

Validates all social media URLs in a single pass:

```typescript
import { AffiliateSocialMediaValidator } from './affiliate.validators';

const affiliateData = {
  affiliateWebsite: 'https://company.com',
  affiliateFacebook: 'https://facebook.com/company',
  affiliateInstagram: 'https://instagram.com/company',
  affiliateTikTok: 'https://tiktok.com/@company',
  affiliateLinkedIn: 'https://linkedin.com/company/company',
};

const result = AffiliateSocialMediaValidator.validate(affiliateData);
console.log(result.isValid); // true/false
console.log(result.errors); // Array of error messages
```

### `AffiliateFieldsValidator`

Comprehensive validation for entire affiliate objects:

```typescript
import { AffiliateFieldsValidator } from './affiliate.validators';

const affiliateData = {
  affiliateName: 'Tech Solutions Inc.',
  affiliateArea: 1,
  representativeFirstName: 'John',
  representativeLastName: 'Doe',
  representativeJobTitle: 'CEO',
  affiliateEmail: 'contact@techsolutions.com',
  affiliatePhone: '+1-416-555-0123',
  // ... other fields
};

const result = AffiliateFieldsValidator.validate(affiliateData);
if (!result.isValid) {
  console.log('Validation errors:', result.errors);
}
```

## Utility Functions

The module provides several utility functions for external usage:

### `validateSocialMediaUrl(url, platform)`

Platform-specific social media URL validation:

```typescript
import { validateSocialMediaUrl } from './affiliate.validators';

const isValid = validateSocialMediaUrl(
  'https://facebook.com/company',
  'FACEBOOK',
);
console.log(isValid); // true
```

### `formatPostalCode(postalCode, country)`

Country-specific postal code formatting:

```typescript
import { formatPostalCode } from './affiliate.validators';
import { Country } from '../../../../common/enums';

const formatted = formatPostalCode('K1A0A6', Country.CANADA);
console.log(formatted); // 'K1A 0A6'
```

### `getPasswordRequirements()`

Get human-readable password requirements:

```typescript
import { getPasswordRequirements } from './affiliate.validators';

const requirements = getPasswordRequirements();
requirements.forEach((req) => console.log(req));
// At least 8 characters long
// No more than 100 characters
// At least one uppercase letter (A-Z)
// ...
```

### `calculatePasswordStrength(password)`

Calculate password strength score:

```typescript
import {
  calculatePasswordStrength,
  PasswordStrength,
} from './affiliate.validators';

const strength = calculatePasswordStrength('MySecureP@ssw0rd!');
console.log(strength === PasswordStrength.STRONG); // true
```

## Dependencies

- **class-validator** - Provides decorator and constraint interfaces
- **Global constants** - Uses AFFILIATE\_\* constants for validation rules
- **Global enums** - Validates against centralized enum definitions
- **Utility functions** - Phone, email, and URL validation utilities
- **Error handling** - Structured error messages and codes

## Version History

- **v1.0.0**: Initial implementation with complete affiliate validation suite

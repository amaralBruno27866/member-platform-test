# Affiliate Utils Module

This folder contains **only formatting utilities and display helpers** maintaining clean architecture and separation of responsibilities.

## 📁 Structure

### 🧠 Business Logic

- **affiliate-business-logic.util.ts** - Affiliate-specific business rules
  - Access privilege determination
  - Representative authorization validation
  - Organizational profile validation
  - Special requirements verification
  - Summary generation for display

### 🛠️ Helper Utilities (Formatting Only)

- **affiliate-helpers.util.ts** - Utility functions for formatting and display
  - Social media URL formatting (add https://)
  - Postal code formatting (by country)
  - Phone number formatting
  - Data formatting utilities
  - Password strength display helpers (display only)

## 🔄 Complete Refactoring - Separation of Responsibilities

### ✅ VALIDATIONS → Moved to `affiliate.validators.ts`:

- `validateSocialMediaUrl()` - URL validation by platform
- `validatePostalCode()` - Postal code validation by country
- `validateAndFormatPhone()` - Canadian phone validation
- `calculatePasswordStrength()` - Password strength calculation
- `isWeakPassword()` - Weak password verification
- `PASSWORD_REQUIREMENTS` - Password configurations
- `WEAK_PASSWORDS` - Weak password list
- `PasswordStrength` enum

### ✅ HELPERS → Maintained in `affiliate-helpers.util.ts`:

- `formatSocialMediaUrl()` - URL formatting (add https://)
- `formatPostalCode()` - Visual formatting of postal codes
- `formatCanadianPhoneNumber()` - Visual formatting of phones
- `getPasswordRequirements()` - Requirements list for UI
- `getPasswordStrengthDisplayName()` - Strength name for display
- `capitalizeWords()` - Text capitalization

### ✅ BUSINESS LOGIC → Maintained in `affiliate-business-logic.util.ts`:

- `determineAccessPrivilege()` - Privilege logic
- `validateRepresentativeAuthorization()` - Representative authorization
- `validateOrganizationProfile()` - Organizational profile validation
- `requiresSpecialVerification()` - Special verifications
- `validateAffiliateRecord()` - Complete record validation
- `generateAffiliateSummary()` - Summary generation

## 🎯 Applied Design Principles

### ✅ Separation of Responsibilities

- **Validators**: Only field validation and input rules
- **Business Logic**: Business rules and domain logic
- **Helpers**: Reusable utilities and formatting

### OTA Education Pattern

Following the example of `ota-education-business-logic.util.ts`:

- Static methods for easy use
- Comprehensive validations with errors/warnings
- Privilege determination based on business rules
- Qualification verification for enhanced features

### Integration with Central Modules

- ✅ **enums**: Uses centralized enums for consistency
- ✅ **constants**: Integrates with affiliate module constants
- ✅ **global utils**: Leverages existing utilities (phone, URL)
- ✅ **errors**: Integrates with centralized error system

## 📋 Next Steps

1. **Refactor Validators** - Remove utility functions from validators
2. **Implement Services** - Use business logic and helpers in services
3. **Unit Tests** - Create tests for each utility
4. **Documentation** - Document each function with examples

## 🔗 Dependencies

```typescript
// Business Logic
import { AffiliateBusinessLogic } from './affiliate-business-logic.util';

// Helpers
import {
  validateSocialMediaUrl,
  formatPostalCode,
  calculatePasswordStrength,
  formatCanadianPhoneNumber,
} from './affiliate-helpers.util';
```

## 📝 Usage Examples

### Business Logic

```typescript
// Determine access privilege
const privilege = AffiliateBusinessLogic.determineAccessPrivilege(
  AffiliateArea.HEALTHCARE_AND_LIFE_SCIENCES,
  true, // isVerified
  AccountStatus.ACTIVE,
);

// Validate representative authorization
const validation = AffiliateBusinessLogic.validateRepresentativeAuthorization(
  'John',
  'Smith',
  'Director',
  true, // isRegistration
);
```

### Helpers

```typescript
// Validate social media URL
const isValid = validateSocialMediaUrl(
  'https://linkedin.com/company/example',
  'LINKEDIN',
);

// Format postal code
const formatted = formatPostalCode('K1A0A6', Country.CANADA);
// Result: 'K1A 0A6'

// Calculate password strength
const strength = calculatePasswordStrength('MySecureP@ssw0rd123');
```

# Address Utils

## Purpose

Contains essential utility functions for address data handling, including formatting, sanitization, and business logic validation. These utils provide reusable functionality across the Address module with essential modules integration.

## Core Utilities

### AddressFormatter

Address display and formatting utilities with Canadian address support.

**Key Methods:**

- `formatCanadianPostalCode(postalCode: string): string` - Format postal codes to K1A 0A6 standard
- `formatFullAddress(address: AddressInternal): string` - Single-line address format
- `formatMailingLabel(address: AddressInternal): string[]` - Multi-line mailing format
- `getCityDisplayName(city: City): string` - City enum to display name
- `getProvinceDisplayName(province: Province): string` - Province abbreviations (ON, BC, etc.)
- `getCountryDisplayName(country: Country): string` - Country display names
- `getAddressTypeDisplayName(type: AddressType): string` - Address type names
- `getAddressPreferenceDisplayName(preference: AddressPreference): string` - Preference names
- `normalizeAddressLine(line: string): string` - Address line normalization

### AddressDataSanitizer

Data cleaning and validation utilities for secure address handling.

**Key Methods:**

- `sanitizeUserBusinessId(businessId: string): string` - Clean business IDs
- `sanitizeAddressLine(line: string): string` - Clean address lines safely
- `sanitizePostalCode(postalCode: string): string` - Clean and format postal codes
- `sanitizeAddressData(address: Partial<AddressInternal>): Partial<AddressInternal>` - Complete address sanitization
- `validateAddressData(address: Partial<AddressInternal>): {isValid: boolean; errors: string[]}` - Validation with error messages
- `isCompleteAddress(address: Partial<AddressInternal>): boolean` - Completeness check
- `stripInternalFields(address: AddressInternal): Partial<AddressInternal>` - Remove sensitive fields

### AddressBusinessLogic

Business rules and constraints for address operations.

**Key Methods:**

- `canHaveMultipleAddresses(): boolean` - Multiple address policy
- `getRequiredFields(isRegistration?: boolean, addressType?: AddressType): string[]` - Context-based required fields
- `validateAddressTypeRules(existing: AddressInternal[], newType: AddressType): ValidationResult` - Address type validation
- `validateAddressPreferenceRules(existing: AddressInternal[], preference?: AddressPreference): ValidationResult` - Preference validation
- `getDefaultAddressPreference(existing: AddressInternal[], type: AddressType): AddressPreference` - Smart defaults
- `validateCountrySpecificRules(address: Partial<AddressInternal>): ValidationResult` - Country-specific validation
- `canBePrimaryAddress(address: Partial<AddressInternal>): boolean` - Primary address eligibility
- `getDefaultAccessModifier(type: AddressType, isRegistration?: boolean): AccessModifier` - Default access levels
- `getDefaultPrivilege(isOwner?: boolean, isRegistration?: boolean): Privilege` - Default privilege levels
- `validateBusinessRules(address: Partial<AddressInternal>, context: BusinessContext): ValidationResult` - Complete business validation

## Essential Modules Integration

- **Centralized Enums**: Full integration with City, Province, Country, AddressType, etc.
- **Error Handling**: Uses ErrorCodes for consistent error reporting
- **Type Safety**: Complete TypeScript support with proper interfaces
- **Data Patterns**: Standardized validation patterns for Canadian addresses
- **Business Rules**: OSOT-specific address management policies

## Usage Examples

### Address Formatting

```typescript
import { AddressFormatter } from '@/classes/user-account/address/utils/address-formatter.util';

// Format postal code
const formatted = AddressFormatter.formatCanadianPostalCode('k1a0a6'); // 'K1A 0A6'

// Format full address
const fullAddress = AddressFormatter.formatFullAddress(addressData);
// '123 Main St, Ottawa, ON K1A 0A6'

// Format mailing label
const lines = AddressFormatter.formatMailingLabel(addressData);
// ['123 Main St', 'Ottawa ON K1A 0A6', 'Canada']
```

### Address Sanitization

```typescript
import { AddressDataSanitizer } from '@/classes/user-account/address/utils/address-sanitizer.util';

// Sanitize complete address
const clean = AddressDataSanitizer.sanitizeAddressData(rawAddress);

// Validate address
const validation = AddressDataSanitizer.validateAddressData(address);
if (!validation.isValid) {
  console.log('Errors:', validation.errors);
}

// Check completeness
const isComplete = AddressDataSanitizer.isCompleteAddress(address);
```

### Business Logic

```typescript
import { AddressBusinessLogic } from '@/classes/user-account/address/utils/address-business-logic.util';

// Get required fields for context
const required = AddressBusinessLogic.getRequiredFields(true, AddressType.HOME);

// Validate business rules
const validation = AddressBusinessLogic.validateBusinessRules(address, {
  isRegistration: true,
  existingAddresses: userAddresses,
});

// Get smart defaults
const defaultPreference = AddressBusinessLogic.getDefaultAddressPreference(
  existingAddresses,
  AddressType.WORK,
);
```

## Guidelines

- **Pure Functions**: All utilities are stateless and side-effect free
- **Type Safety**: Full TypeScript validation and enum support
- **Error Handling**: Consistent error patterns with meaningful messages
- **Canadian Focus**: Specialized handling for Canadian address standards
- **Business Rules**: OSOT-specific policies and constraints
- **Essential Integration**: Seamless integration with centralized enums and error handling

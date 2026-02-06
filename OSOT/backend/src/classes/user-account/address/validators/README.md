# Address Validators (SIMPLIFIED)

## Purpose

Contains custom validation logic for Address module following OSOT requirements and simplification philosophy. All validators integrate with essential modules (errors, enums, constants) and use class-validator decorators.

## Available Validators

### Field Validators

- **AddressUserBusinessIdValidator** - Validates user business ID format and length
- **AddressLine1Validator** - Validates required address line 1 (3-100 chars)
- **AddressLine2Validator** - Validates optional address line 2 (max 100 chars)
- **ODataAccountBindingValidator** - Validates `/osot_table_accounts(guid)` format

### Postal Code Validator

- **PostalCodeValidator** - Comprehensive Canadian postal code validator with utils integration

### Enum Validators

- **CityEnumValidator** - Validates against centralized City enum
- **ProvinceEnumValidator** - Validates against centralized Province enum
- **CountryEnumValidator** - Validates against centralized Country enum
- **AddressTypeEnumValidator** - Validates against centralized AddressType enum
- **AddressPreferenceEnumValidator** - Validates optional AddressPreference enum
- **AccessModifierEnumValidator** - Validates optional AccessModifier enum
- **PrivilegeEnumValidator** - Validates optional Privilege enum

## Integration Points

- **Constants**: Uses `ADDRESS_FIELD_LIMITS` and `CANADIAN_POSTAL_CODE_PATTERN`
- **Enums**: Validates against all centralized enums from `common/enums`
- **Class-validator**: All validators use `@ValidatorConstraint` decorator
- **Error Handling**: Provides meaningful error messages for validation failures

## Usage Examples

```typescript
import {
  PostalCodeValidator,
  CityEnumValidator,
  AddressLine1Validator
} from './validators';

// Standalone validation
const isValid = PostalCodeValidator.isValid('K1A 0A6');

// Normalize postal code
const normalized = PostalCodeValidator.normalize(' k1a 0a6 ');

// In DTOs with decorators
@Validate(AddressLine1Validator)
address1: string;

@Validate(CityEnumValidator)
city: City;
```

## Simplification Philosophy

- **Essential validation only** - No complex geographic validation or external API calls
- **Canadian focus** - Postal code validation specifically for Canadian format
- **Enum integration** - All enum validation uses centralized enums
- **Clear error messages** - User-friendly validation feedback from ErrorMessages
- **Self-contained logic** - PostalCodeValidator has internalized postal code validation
- **No overengineering** - Straightforward validation logic only

## ✅ Integration Status (CORRECTED)

**Essential Modules Integration:**

- ✅ **#file:errors** - All validators use `ErrorMessages[ErrorCodes.XXX].publicMessage`
- ✅ **#file:enums** - All enum validators use centralized enums
- ✅ **#file:utils** - Self-contained validator logic (no external utils dependency)
- ✅ **#file:integrations** - Ready for DataverseService integration in services

**Pattern Compliance:**

- ✅ Follows exact same pattern as Contact validators
- ✅ No hardcoded error messages
- ✅ Proper ErrorCodes usage
- ✅ Utils integration following phone-formatter pattern

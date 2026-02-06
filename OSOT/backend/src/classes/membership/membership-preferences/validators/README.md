# Membership Preferences Validators

## Overview

Custom validators for Membership Preferences entity using `class-validator` decorators. Ensures data integrity based on CSV specifications and business rules.

## Validators (12 total)

### ID & Format Validators

**`PreferenceIdValidator`**
- Validates: Business ID format `osot-pref-0000001`
- Pattern: `osot-pref` + 7 digits
- Required: Optional on creation, required on updates

**`MembershipYearPreferenceValidator`**
- Validates: 4-digit year format (YYYY)
- Range: 2020 to current year + 5
- Required: Business required field

### Lookup Validators

**`ExclusiveUserReferencePreferenceValidator`**
- Validates: Account and Affiliate are mutually exclusive (XOR)
- Rule: Can have Account OR Affiliate, never both
- Note: Category can coexist with either one

**`LookupRequiredValidator`**
- Validates: At least one lookup field present
- Fields: category, account, or affiliate
- Business Rule: Minimum 1 lookup required

### Enum Validators (Local)

**`ThirdPartiesValidator`**
- Validates: ThirdParties enum values
- Optional field

**`PracticePromotionValidator`**
- Validates: PracticePromotion enum values
- Optional field

**`SearchToolsValidator`**
- Validates: SearchTools enum values
- Optional field

**`PsychotherapySupervisionValidator`**
- Validates: PsychotherapySupervision enum values
- Optional field

### Boolean Validators

**`ShadowingValidator`**
- Validates: Boolean type
- Optional field (default: false)

**`AutoRenewalValidator`**
- Validates: Boolean type
- Required: Business required field

### Enum Validators (Global)

**`PrivilegePreferenceValidator`**
- Validates: Privilege enum values
- Optional field (default: Owner)

**`AccessModifiersPreferenceValidator`**
- Validates: AccessModifier enum values
- Optional field (default: Private)

### Async Validators

**`UserYearUniqueValidator`**
- Validates: User-year uniqueness
- Async: Requires repository access
- Business Rule: One preference per user per year

## Usage in DTOs

```typescript
import { Validate } from 'class-validator';
import {
  PreferenceIdValidator,
  MembershipYearPreferenceValidator,
  LookupRequiredValidator,
  ThirdPartiesValidator,
  AutoRenewalValidator
} from '../validators/membership-preference.validators';

export class CreatePreferenceDto {
  @Validate(MembershipYearPreferenceValidator)
  osot_membership_year: string;

  @Validate(AutoRenewalValidator)
  osot_auto_renewal: boolean;

  @Validate(LookupRequiredValidator)
  @IsOptional()
  osot_table_account?: string;
}
```

## Business Rules

1. **Year Format**: Must be exactly 4 digits (YYYY)
2. **Year Range**: 2020 to current year + 5 years
3. **Lookups**: At least one of (category, account, affiliate) required
4. **User Reference XOR**: Account and Affiliate are mutually exclusive - only one allowed
5. **Category Coexistence**: Category can exist with Account OR Affiliate
6. **Auto Renewal**: Required boolean field
7. **Uniqueness**: One preference per user per year (async validation)

## Integration

- **DTOs**: Use `@Validate()` decorator
- **Constants**: Import validation patterns and limits
- **Enums**: Validate against local and global enums
- **Repository**: Async uniqueness validation

## Security & Permissions

When implementing services and controllers, remember:

**Authentication**:
- All private routes require `@UseGuards(AuthGuard('jwt'))`
- User context extracted from JWT using `@User()` decorator
- Users can only access their own preference data

**Authorization** (by Privilege level):
- **MAIN**: Full CRUD access
- **ADMIN**: Read, Write, Delete access
- **OWNER**: Create, Read, Write own data only

**Implementation Pattern** (from membership-category):
```typescript
// In controller
@UseGuards(AuthGuard('jwt'))
export class MembershipPreferencePrivateController {
  private getUserPrivilege(user: Record<string, unknown>): Privilege {
    return (user?.privilege as number) || Privilege.OWNER;
  }
  
  private getUserRole(privilege: Privilege): string {
    switch (privilege) {
      case Privilege.MAIN: return 'main';
      case Privilege.ADMIN: return 'admin';
      case Privilege.OWNER:
      default: return 'owner';
    }
  }
}

// In service
private canCreatePreference(privilege?: Privilege): boolean {
  return privilege === Privilege.MAIN || 
         privilege === Privilege.ADMIN || 
         privilege === Privilege.OWNER;
}
```

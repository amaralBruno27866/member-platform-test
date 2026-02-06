# Membership Preferences - Mappers Layer

This directory contains data transformation mappers for the membership preferences module, providing type-safe data transformations between different representations with specialized OData bind handling.

## Architecture Overview

The mappers layer follows a **clean transformation pattern** with centralized data conversion logic:

1. **DTO Mapping** - Transform between API DTOs and internal representations
2. **Dataverse Mapping** - Convert between external API responses and internal format
3. **OData Bind Handling** - Convert between GUID references and OData bind format
4. **Data Normalization** - Consistent data formatting and validation
5. **Type Safety** - Enum conversion (4 local + 2 global) and type-safe transformations

## Mapper Files

### `membership-preference.mapper.ts`

- **Purpose**: Complete data transformation service for membership preferences
- **Usage**: All data conversion operations between layers
- **Features**: Type-safe transformations, OData bind conversions, enum parsing, XOR validation
- **Type Safety**: Full enum integration (6 enums) and error handling
- **Specialization**: Handles 3 lookup fields with OData bind format conversions

## Design Philosophy

### Simplicity First

- Clean transformation methods without over-engineering
- Essential data conversions only
- Clear separation of transformation concerns
- OData bind utilities for lookup field handling

### CSV Alignment

- All field mappings follow `Table Membership Preferences.csv` specification
- Logical names used consistently throughout transformations
- No invented fields or custom additions
- Exact match with 17 CSV fields

### Type Safety

- Full enum integration with parsing functions (6 total)
- Proper nullable types for optional fields
- Safe OData bind extraction and creation
- XOR validation for Account/Affiliate

## Integration Points

### With DTOs Layer

```typescript
// Create operation
const internal = MembershipPreferenceMapper.mapCreateDtoToInternal(createDto);

// Update operation
const partial = MembershipPreferenceMapper.mapUpdateDtoToInternal(updateDto);

// Response operation
const response = MembershipPreferenceMapper.mapInternalToResponseDto(internal);
```

### With Dataverse Integration

```typescript
// From Dataverse API
const internal =
  MembershipPreferenceMapper.mapDataverseToInternal(dataverseResponse);

// To Dataverse API (create)
const payload = MembershipPreferenceMapper.mapInternalToDataverse(internal, false);

// To Dataverse API (update)
const payload = MembershipPreferenceMapper.mapInternalToDataverse(internal, true);
```

### With Validation Layer

```typescript
// Data validation with XOR rule
const errors =
  MembershipPreferenceMapper.validateMembershipPreferenceData(preference);

// Data sanitization for logging
const sanitized =
  MembershipPreferenceMapper.sanitizeMembershipPreferenceData(preference);
```

## Key Features

### Enum Conversion Functions

**Local Enums (4):**
- **`parseThirdParties()`** - Safe ThirdParties enum conversion
- **`parsePracticePromotion()`** - Safe PracticePromotion enum conversion
- **`parseSearchTools()`** - Safe SearchTools enum conversion
- **`parsePsychotherapySupervision()`** - Safe PsychotherapySupervision enum conversion

**Global Enums (2):**
- **`parsePrivilege()`** - Safe Privilege enum conversion
- **`parseAccessModifier()`** - Safe AccessModifier enum conversion

### OData Bind Utilities

- **`extractGuidFromBind()`** - Extract GUID from OData bind string
  - Example: `/osot_table_accounts(guid)` → `guid`
- **`createODataBind()`** - Create OData bind from table name and GUID
  - Example: `('osot_table_accounts', 'guid')` → `/osot_table_accounts(guid)`

### Transformation Methods

- **`mapCreateDtoToInternal()`** - API creation requests → Internal format
  - Converts OData binds to GUIDs for 3 lookup fields
  - Handles optional preference fields
  - Applies access control defaults
  
- **`mapUpdateDtoToInternal()`** - API update requests → Internal format (partial)
  - Supports partial updates
  - Converts OData binds to GUIDs
  - Preserves only provided fields
  
- **`mapInternalToResponseDto()`** - Internal format → API responses
  - Converts lookup GUIDs to `_field_value` format
  - Formats timestamps as ISO 8601 strings
  - Includes all 17 fields
  
- **`mapDataverseToInternal()`** - Dataverse API → Internal format
  - Parses all 6 enums safely
  - Extracts lookup GUIDs directly
  - Handles system timestamps
  
- **`mapInternalToDataverse()`** - Internal format → Dataverse API
  - Converts GUIDs to OData bind format using constants
  - Handles create vs update differences
  - Includes only defined fields

### Validation and Safety

- **`validateMembershipPreferenceData()`** - Business rule validation
  - XOR validation (Account vs Affiliate)
  - Lookup required validation
  - Year format validation (4 digits)
  - All 6 enum validations
  
- **`sanitizeMembershipPreferenceData()`** - Sensitive data removal for logging
  - Removes sensitive fields (if any)
  - Safe for external logging systems

## Business Rules Integration

### Field Validation

- All mappers enforce enum constraints during conversion (6 enums total)
- Required fields validated with proper error messages
- Optional fields handled with safe null checking
- Year must be 4-digit format
- Auto renewal is required boolean

### Lookup Field Rules

- **XOR Rule**: Account and Affiliate are mutually exclusive
- **Lookup Required**: At least one lookup field must be provided (category, account, or affiliate)
- **OData Bind Format**: All lookups use proper `@odata.bind` format for Dataverse

### Data Integrity

- Type-safe enum conversions prevent invalid data (6 enums validated)
- Proper error handling for transformation failures
- Consistent field naming across all transformations
- OData bind validation for lookup fields

## Usage Examples

### Service Layer Integration

```typescript
@Injectable()
export class MembershipPreferenceService {
  async create(
    dto: CreateMembershipPreferenceDto,
  ): Promise<MembershipPreferenceResponseDto> {
    // Transform DTO to internal format (converts OData binds to GUIDs)
    const internal = MembershipPreferenceMapper.mapCreateDtoToInternal(dto);

    // Validate business rules (includes XOR validation)
    const errors = MembershipPreferenceMapper.validateMembershipPreferenceData(internal);
    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    // Business logic operations...
    const saved = await this.repository.create(internal);

    // Transform back to response format
    return MembershipPreferenceMapper.mapInternalToResponseDto(saved);
  }
}
```

### Repository Layer Integration

```typescript
@Injectable()
export class MembershipPreferenceRepository {
  async findById(id: string): Promise<MembershipPreferenceInternal | null> {
    const dataverseResponse = await this.dataverseService.findById(id);

    if (!dataverseResponse) return null;

    // Transform Dataverse response to internal format (parses all enums)
    return MembershipPreferenceMapper.mapDataverseToInternal(dataverseResponse);
  }

  async create(internal: MembershipPreferenceInternal): Promise<MembershipPreferenceInternal> {
    // Transform internal to Dataverse payload (creates OData binds)
    const payload = MembershipPreferenceMapper.mapInternalToDataverse(internal, false);
    
    const created = await this.dataverseService.create(payload);
    
    return MembershipPreferenceMapper.mapDataverseToInternal(created);
  }
}
```

### OData Bind Handling Example

```typescript
// Input DTO with OData bind
const dto = {
  osot_membership_year: '2025',
  osot_auto_renewal: false,
  'osot_Table_Account@odata.bind': '/osot_table_accounts/abc-123-def-456'
};

// Mapper extracts GUID
const internal = MembershipPreferenceMapper.mapCreateDtoToInternal(dto);
// Result: internal.osot_table_account = 'abc-123-def-456'

// Mapper creates OData bind for Dataverse
const payload = MembershipPreferenceMapper.mapInternalToDataverse(internal);
// Result: payload['osot_Table_Account@odata.bind'] = '/osot_table_accounts/abc-123-def-456'
```

## Quality Standards

### Code Quality

- ESLint compliant code formatting
- Comprehensive TypeScript type coverage
- Clear documentation for all transformation methods
- Safe enum parsing with fallback handling

### Business Alignment

- Field mappings match CSV logical names exactly (17 fields)
- Business rules reflected in validation functions (XOR, lookup required)
- No deviation from source documentation
- Exact enum value matching with Dataverse choices

### Performance

- Efficient enum parsing with early returns
- Minimal data copying in transformations
- Optimized OData bind extraction with regex
- Safe GUID validation

## OData Bind Constants

All OData bind field names are centralized in constants:

```typescript
import { MEMBERSHIP_PREFERENCES_FIELDS } from '../constants/membership-preference.constants';

// Usage
MEMBERSHIP_PREFERENCES_FIELDS.MEMBERSHIP_CATEGORY_BIND // 'osot_Table_Membership_Category@odata.bind'
MEMBERSHIP_PREFERENCES_FIELDS.ACCOUNT_BIND            // 'osot_Table_Account@odata.bind'
MEMBERSHIP_PREFERENCES_FIELDS.ACCOUNT_AFFILIATE_BIND  // 'osot_Table_Account_Affiliate@odata.bind'
```

## Next Steps

After completing the mappers layer, the following layers will be implemented:

1. **Repository Layer** - Concrete implementation using these mappers
2. **Services Layer** - Business logic implementation with mapper integration
3. **Controller Layer** - HTTP API endpoints with automatic transformation

Each layer will build upon these mapper contracts to ensure consistent data transformation throughout the application.

## Related Documentation

- [Constants README](../constants/README.md) - Field mappings and OData configurations
- [DTOs README](../dtos/README.md) - DTO structure and validation rules
- [Interfaces README](../interfaces/README.md) - Type definitions
- [Validators README](../validators/README.md) - Business rule validators


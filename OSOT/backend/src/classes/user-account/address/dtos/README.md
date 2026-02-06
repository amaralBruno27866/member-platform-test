# Address DTOs (SIMPLIFIED)

## Purpose

Contains Data Transfer Objects for Address module following OSOT requirements and simplification philosophy. All DTOs integrate with essential modules (#file:errors, #file:enums, #file:validators, #file:integrations) and use proper validation.

## Available DTOs

### Core DTOs

- **AddressBasicDto** - Basic address representation with all essential fields
- **AddressCreateDto** - For creating new addresses with OData Account binding
- **AddressUpdateDto** - For updating existing addresses (all fields optional)
- **AddressResponseDto** - API response format with system fields and navigation properties
- **AddressRegistrationDto** - For address registration workflow with confirmation flags

### Query DTOs

- **ListAddressesQueryDto** - Query parameters for address listing with pagination and filtering

## Integration Points ✅

### ✅ #file:errors Integration

- **Validation**: All DTOs use class-validator with proper error handling

### ✅ #file:enums Integration

- **All enum fields**: Uses centralized enums (City, Province, Country, AddressType, etc.)

### ✅ #file:validators Integration

- **Field validation**: Uses Address validators for all field validation
- **OData binding**: ODataAccountBindingValidator for Account relationship

### ✅ #file:integrations Integration (Ready)

- **OData binding**: Proper `/osot_table_accounts(guid)` format
- **DataverseService**: Compatible with Dataverse API operations

## OData Binding Pattern ✅

```typescript
['osot_Table_Account@odata.bind']: string; // Required for creation
```

## Simplification Philosophy

- **Essential fields only** - No unnecessary complexity
- **Canadian focus** - Postal code validation for Canadian format
- **Enum integration** - All enum fields use centralized enums
- **Clean validation** - Structured validation with meaningful messages

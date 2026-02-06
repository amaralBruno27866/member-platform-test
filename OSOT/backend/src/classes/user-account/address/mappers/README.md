# Address Mappers

## Purpose

Contains mapping utilities that transform address data between layers (DTOs ↔ Internal ↔ Dataverse), with essential modules integration for type safety and data normalization.

## Core Implementation: AddressMapper

The `AddressMapper` class provides 7 static methods for comprehensive address data transformation:

### Primary Mapping Methods

#### 1. DTO → Internal Conversions

```typescript
// Create DTO to internal format
AddressMapper.mapCreateDtoToInternal(createDto: AddressCreateDto): AddressInternal

// Update DTO to partial internal format
AddressMapper.mapUpdateDtoToInternal(updateDto: AddressUpdateDto): Partial<AddressInternal>
```

#### 2. Internal → Response DTO

```typescript
// Internal format to API response
AddressMapper.mapInternalToResponseDto(internal: AddressInternal): AddressResponseDto
```

#### 3. Dataverse ↔ Internal Conversions

```typescript
// Dataverse record to internal format
AddressMapper.mapDataverseToInternal(dataverse: Record<string, unknown>): AddressInternal

// Internal format to Dataverse payload
AddressMapper.mapInternalToDataverse(internal: AddressInternal): Record<string, unknown>
```

### Utility Methods

#### 4. Data Validation

```typescript
// Comprehensive address validation
AddressMapper.validateAddressData(address: AddressInternal): boolean
```

#### 5. Data Sanitization

```typescript
// Clean and normalize address data
AddressMapper.sanitizeAddressData(address: AddressInternal): Partial<AddressInternal>
```

## Essential Modules Integration

- **Centralized Enums**: City, Province, Country, AddressType, AddressPreference, AccessModifier, Privilege
- **Type Safety**: Full TypeScript support with proper enum parsing
- **Data Normalization**: Canadian postal code formatting and geographic data standardization
- **Error Handling**: Integration with centralized error codes

## Key Features

### Enum Parsing Functions

- `parseCity()`, `parseProvince()`, `parseCountry()`
- `parseAddressType()`, `parseAddressPreference()`
- `parseAccessModifier()`, `parsePrivilege()`

### Data Normalization

- Canadian postal code formatting (K1A 0A6 format)
- Address line trimming and sanitization
- Geographic coordinate handling

### OData Integration

- Proper `@odata.bind` syntax for account relationships
- Dataverse entity reference formatting
- Field mapping between camelCase and osot\_\* schema

## Usage Examples

```typescript
import {
  AddressMapper,
  AddressCreateDto,
} from '@/classes/user-account/address';

// Transform create DTO to internal format
const createDto: AddressCreateDto = {
  /* ... */
};
const internal = AddressMapper.mapCreateDtoToInternal(createDto);

// Prepare for Dataverse submission
const dataversePayload = AddressMapper.mapInternalToDataverse(internal);

// Convert Dataverse response to API response
const dataverseRecord = await dataverseService.create(dataversePayload);
const internalData = AddressMapper.mapDataverseToInternal(dataverseRecord);
const response = AddressMapper.mapInternalToResponseDto(internalData);
```

## Guidelines

- **Pure Functions**: All mappers are side-effect free static methods
- **Type Safety**: Comprehensive TypeScript validation and enum conversion
- **Centralized Logic**: Complex transformations consolidated in mapper layer
- **Address-Specific**: Specialized handling for postal codes, geographic data, and Canadian addressing standards
- **Essential Integration**: Seamless integration with ErrorCodes, centralized enums, and DataverseService patterns

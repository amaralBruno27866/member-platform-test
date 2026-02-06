# Membership Settings - Mappers Layer

This directory contains data transformation mappers for the membership settings module, providing type-safe data transformations between different representations.

## Architecture Overview

The mappers layer follows a **clean transformation pattern** with centralized data conversion logic:

1. **DTO Mapping** - Transform between API DTOs and internal representations
2. **Dataverse Mapping** - Convert between external API responses and internal format
3. **Data Normalization** - Consistent data formatting and validation
4. **Type Safety** - Enum conversion and type-safe transformations

## Mapper Files

### `membership-settings.mapper.ts`

- **Purpose**: Complete data transformation service for membership settings
- **Usage**: All data conversion operations between layers
- **Features**: Type-safe transformations, enum parsing, data normalization
- **Type Safety**: Full enum integration and error handling

## Design Philosophy

### Simplicity First

- Clean transformation methods without over-engineering
- Essential data conversions only
- Clear separation of transformation concerns

### CSV Alignment

- All field mappings follow `Table Membership Setting.csv` specification
- Logical names used consistently throughout transformations
- No invented fields or custom additions

### Type Safety

- Full enum integration with parsing functions
- Proper nullable types for optional fields
- Generic transformation patterns for extensibility

## Integration Points

### With DTOs Layer

```typescript
// Create operation
const internal = MembershipSettingsMapper.mapCreateDtoToInternal(createDto);

// Update operation
const partial = MembershipSettingsMapper.mapUpdateDtoToInternal(updateDto);

// Response operation
const response = MembershipSettingsMapper.mapInternalToResponseDto(internal);
```

### With Dataverse Integration

```typescript
// From Dataverse API
const internal =
  MembershipSettingsMapper.mapDataverseToInternal(dataverseResponse);

// To Dataverse API
const payload = MembershipSettingsMapper.mapInternalToDataverse(internal);
```

### With Validation Layer

```typescript
// Data validation
const errors =
  MembershipSettingsMapper.validateMembershipSettingsData(settings);

// Data sanitization for logging
const sanitized =
  MembershipSettingsMapper.sanitizeMembershipSettingsData(settings);
```

## Key Features

### Organization/Multi-Tenant Handling

- **`mapCreateDtoToInternal()`** - Accepts `organizationGuid` parameter from JWT context
- **`mapUpdateDtoToInternal()`** - Validates and preserves existing `organizationGuid` (immutable)
- **`mapDataverseToInternal()`** - Extracts org GUID from `_osot_table_organization_value` lookup
- **`mapInternalToDataverse()`** - Creates OData binding: `'osot_table_organization@odata.bind'`
- **`validateMembershipSettingsData()`** - Validates `organizationGuid` is present

### Enum Conversion Functions

- **`parseMembershipGroup()`** - Safe MembershipGroup enum conversion (Individual/Business)
- **`parseAccountStatus()`** - Safe AccountStatus enum conversion
- **`parseAccessModifier()`** - Safe AccessModifier enum conversion
- **`parsePrivilege()`** - Safe Privilege enum conversion

### Data Normalization Functions

- **`normalizeSettingsId()`** - Business ID sanitization and validation

### Transformation Methods

- **`mapCreateDtoToInternal(dto, organizationGuid)`** - API creation requests → Internal format (WITH org injection)
- **`mapUpdateDtoToInternal(dto, existingOrganizationGuid)`** - API update requests → Internal format (preserves org)
- **`mapInternalToResponseDto()`** - Internal format → API responses (includes org for traceability)
- **`mapDataverseToInternal()`** - Dataverse API → Internal format (extracts org lookup)
- **`mapInternalToDataverse()`** - Internal format → Dataverse API (creates org binding)

### Validation and Safety

- **`validateMembershipSettingsData()`** - Business rule validation
- **`sanitizeMembershipSettingsData()`** - Sensitive data removal for logging

## Business Rules Integration

### Field Validation

- All mappers enforce enum constraints during conversion
- Required fields validated with proper error messages
- Optional fields handled with safe null checking

### Business Logic Support

- Date range validation for year periods (year_starts < year_ends)
- MembershipGroup enum validation (Individual/Business)
- Business ID format validation for Settings ID

### Data Integrity

- Type-safe enum conversions prevent invalid data
- Proper error handling for transformation failures
- Consistent field naming across all transformations

## Usage Examples

### Multi-Tenant Organization Handling

#### Creation Flow (organizationGuid injected from JWT)

```typescript
// Service receives organization context from JWT
const organizationGuid = decryptOrganizationId(req.user.organizationId);

// DTO comes without organizationGuid (not in request)
const createDto = new CreateMembershipSettingsDto();
createDto.osot_membership_year = '2025';
// ... other fields

// Mapper injects organizationGuid from service layer
const internal = MembershipSettingsMapper.mapCreateDtoToInternal(
  createDto,
  organizationGuid  // From JWT context
);

// Result includes organizationGuid for Dataverse persistence
// {
//   organizationGuid: 'org-guid-from-jwt',
//   osot_membership_year: '2025',
//   ...
// }
```

#### Update Flow (organizationGuid preserved, immutable)

```typescript
// Retrieve existing record
const existing = await this.repository.findById(id);

// DTO includes organizationGuid (inherited from BasicDto)
const updateDto = new UpdateMembershipSettingsDto();
updateDto.organizationGuid = 'org-guid'; // From BasicDto inheritance
updateDto.osot_settingsid = 'osot-set-0000001';
updateDto.osot_membership_year = '2025';

// Mapper validates org GUID matches existing (immutable)
const internal = MembershipSettingsMapper.mapUpdateDtoToInternal(
  updateDto,
  existing.organizationGuid  // Validate it matches
);

// Service layer will reject if organizationGuid differs
```

#### Dataverse Binding (OData)

```typescript
const internal: MembershipSettingsInternal = {
  organizationGuid: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
  osot_membership_year: '2025',
  // ... other fields
};

// Mapper creates OData binding for Dataverse
const dataversePayload = MembershipSettingsMapper.mapInternalToDataverse(internal);

// Result:
// {
//   'osot_table_organization@odata.bind': '/osot_table_organizations(b1a2c3d4-e5f6-7890-abcd-ef1234567890)',
//   osot_membership_year: '2025',
//   ...
// }
```

### Service Layer Integration

```typescript
@Injectable()
export class MembershipSettingsService {
  async create(
    dto: CreateMembershipSettingsDto,
    organizationGuid: string,  // From JWT
  ): Promise<MembershipSettingsResponseDto> {
    // Inject organization from context
    const internal = MembershipSettingsMapper.mapCreateDtoToInternal(
      dto,
      organizationGuid
    );

    // Validate with org requirement
    const errors = MembershipSettingsMapper.validateMembershipSettingsData(internal);
    if (errors.length > 0) throw new ValidationException(errors);

    // Save to Dataverse (mapper creates @odata.bind)
    const payload = MembershipSettingsMapper.mapInternalToDataverse(internal);
    const saved = await this.repository.create(payload);

    // Transform response (includes org)
    return MembershipSettingsMapper.mapInternalToResponseDto(saved);
  }
}
```

## Quality Standards

### Code Quality

- ESLint compliant code formatting
- Comprehensive TypeScript type coverage
- Clear documentation for all transformation methods

### Business Alignment

- Field mappings match CSV logical names exactly
- Business rules reflected in validation functions
- No deviation from source documentation

### Performance

- Efficient enum parsing with early returns
- Minimal data copying in transformations
- Optimized normalization functions

## Next Steps

After completing the mappers layer, the following layers will be implemented:

1. **Repository Layer** - Concrete implementation using these mappers
2. **Services Layer** - Business logic implementation with mapper integration
3. **Controller Layer** - HTTP API endpoints with automatic transformation

Each layer will build upon these mapper contracts to ensure consistent data transformation throughout the application.

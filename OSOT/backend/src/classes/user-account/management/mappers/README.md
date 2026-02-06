# Management Mappers

## Purpose

Contains mapping utilities that transform data between layers for the Management module. These mappers handle data conversion between Dataverse entities, internal models, and DTOs while maintaining type safety and business rule validation.

## Architecture

The Management mappers follow a layered architecture pattern:

```
Dataverse ↔ Internal ↔ DTO
     ↑         ↑        ↑
   CSV/OData  Domain   API
```

## Core Functions

### Data Transformation Functions

#### `mapDataverseToInternal(dataverse: ManagementDataverse): ManagementInternal`

Converts Dataverse entity data to internal domain model format.

- Handles CSV field mapping
- Converts Dataverse booleans (0/1) to JavaScript booleans
- Parses enum values (AccessModifier, Privilege)
- Validates required fields

#### `mapInternalToResponseDto(internal: ManagementInternal): ManagementResponseDto`

Converts internal domain model to API response DTO.

- Adds computed fields (lifecycleStatus, businessSummary, securityLevel)
- Formats dates and display values
- Includes metadata for frontend consumption

#### `mapCreateDtoToInternal(dto: CreateManagementDto): ManagementInternal`

Converts creation DTO to internal domain model.

- Applies default values
- Validates business rules
- Normalizes text fields
- Generates required identifiers

#### `mapUpdateDtoToInternal(dto: UpdateManagementDto, existing: ManagementInternal): ManagementInternal`

Merges update DTO with existing internal model.

- Preserves immutable fields
- Validates update constraints
- Handles partial updates
- Maintains data integrity

#### `mapInternalToDataverse(internal: ManagementInternal): ManagementDataverse`

Converts internal domain model to Dataverse entity format.

- Maps to CSV field names
- Converts booleans to Dataverse format (0/1)
- Serializes enums to numeric values
- Prepares for OData operations

### Utility Functions

#### `parseAccessModifier(value: unknown): AccessModifier | undefined`

Safely parses AccessModifier enum from various input types (string, number, enum).

#### `parsePrivilege(value: unknown): Privilege | undefined`

Safely parses Privilege enum from various input types with fallback handling.

#### `dateverseToBoolean(value: unknown): boolean`

Converts Dataverse boolean values (0, 1, true, false, "true", "false") to JavaScript boolean.

#### `booleanToDataverse(value: boolean): 0 | 1`

Converts JavaScript boolean to Dataverse format (0 or 1).

#### `normalizeText(value: string | undefined): string`

Normalizes text input by trimming whitespace and handling null/undefined values.

#### `validateManagement(management: ManagementInternal): string[]`

Validates management data against business rules:

- Deceased members cannot have active services
- Required field validation
- Cross-field validation rules

#### `extractPublicFields(management: ManagementInternal): Partial<ManagementInternal>`

Removes sensitive fields (osot_table_account_managementid, ownerid) for public APIs.

## Usage Examples

### Basic Transformation

```typescript
import {
  mapDataverseToInternal,
  mapInternalToResponseDto,
} from './management.mapper';

// Dataverse to Internal
const internal = mapDataverseToInternal(dataverseEntity);

// Internal to Response DTO
const responseDto = mapInternalToResponseDto(internal);
```

### Create Flow

```typescript
import {
  mapCreateDtoToInternal,
  mapInternalToDataverse,
} from './management.mapper';

// DTO to Internal
const internal = mapCreateDtoToInternal(createDto);

// Internal to Dataverse for persistence
const dataverseEntity = mapInternalToDataverse(internal);
```

### Update Flow

```typescript
import {
  mapUpdateDtoToInternal,
  validateManagement,
} from './management.mapper';

// Merge update with existing
const updated = mapUpdateDtoToInternal(updateDto, existingInternal);

// Validate business rules
const errors = validateManagement(updated);
if (errors.length > 0) {
  throw new ValidationError(errors);
}
```

## Guidelines

### Data Integrity

- All mappers are pure functions with no side effects
- Type safety is enforced throughout transformations
- Business rules are validated during mapping
- Immutable fields are preserved during updates

### Performance

- Mappers use object spread for efficient copying
- Enum parsing includes optimized switch statements
- Validation is performed only when necessary
- Text normalization prevents unnecessary processing

### Error Handling

- Invalid enum values return undefined with graceful fallback
- Required field validation provides clear error messages
- Business rule violations are collected and reported
- Type mismatches are handled safely

### Extensibility

- New fields can be added to mappers easily
- Business rules are centralized in validation functions
- Enum parsing supports multiple input formats
- Utility functions can be reused across mappers

## Testing

Each mapper function should be tested with:

- Valid input data
- Invalid/malformed data
- Edge cases (null, undefined, empty values)
- Business rule violations
- Type safety scenarios

## Dependencies

- `@classes/management/interfaces/*` - Type definitions
- `@classes/management/dtos/*` - Data Transfer Objects
- `@common/enums/*` - Enum definitions
- `class-validator` - Validation decorators

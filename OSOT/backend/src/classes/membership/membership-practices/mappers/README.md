# Membership Practices Mappers

This directory contains data transformation logic (mappers) for the membership practices entity, handling conversions between DTOs, internal representations, and Dataverse formats.

## Files Overview

### 1. `membership-practices.mapper.ts`

Main mapper class with static methods for all data transformations.

**Total Methods**: 8 public methods + 9 helper functions

## Key Responsibilities

### DTO Transformations

- `mapCreateDtoToInternal()`: CreateDto → Internal (supports enriched DTO)
- `mapUpdateDtoToInternal()`: UpdateDto → Partial Internal

### Response Transformations

- `mapInternalToResponseDto()`: Internal → ResponseDto (enum→label conversion)
- `mapInternalToSelfServiceDto()`: Internal → Self-Service DTO

### Dataverse Transformations

- `mapDataverseToInternal()`: Dataverse → Internal (comma-separated strings → arrays)
- `mapInternalToDataverse()`: Internal → Dataverse (arrays → comma-separated strings)

### Validation & Sanitization

- `validatePracticeData()`: Validates completeness and business rules
- `sanitizePracticeData()`: Removes sensitive fields for logging

## Multi-Select Array Handling

All 4 custom enums are multi-select arrays requiring special conversion:

**Dataverse Format** (comma-separated strings):

```typescript
osot_clients_age: '1,4,5';
osot_practice_area: '10,40';
```

**Internal Format** (enum arrays):

```typescript
osot_clients_age: [ClientsAge.ADULT, ClientsAge.ADOLESCENT, ClientsAge.OLDER];
osot_practice_area: [PracticeArea.CHRONIC_PAIN, PracticeArea.STROKE];
```

**Response Format** (string label arrays):

```typescript
osot_clients_age: ['Adult', 'Adolescent (13-17 yrs)', 'Older (65+)'];
osot_practice_area: ['Chronic Pain', 'Stroke'];
```

## Enum-to-Label Conversion

The mapper uses display name functions from enums:

- `getClientsAgeDisplayName()`: ClientsAge → "Adult"
- `getPracticeAreaDisplayName()`: PracticeArea → "Chronic Pain"
- `getPracticeSettingsDisplayName()`: PracticeSettings → "Client's Home"
- `getPracticeServicesDisplayName()`: PracticeServices → "Cognitive Behaviour Therapy"

## Business Rules Validated

1. **osot_clients_age**: REQUIRED array with minimum 1 value
2. **Conditional "Other" fields**:
   - When `PracticeSettings.OTHER` selected → `osot_practice_settings_other` required
   - When `PracticeServices.OTHER` selected → `osot_practice_services_other` required
3. **Membership year**: 4-digit YYYY format, system-defined (immutable on update)

## Best Practices

1. Use `validatePracticeData()` before Dataverse operations
2. Use enriched DTO overload when system fields are available
3. Set `isUpdate=true` flag to exclude membership_year from PATCH
4. Handle optional arrays (area, settings, services) with undefined checks
5. Preserve enum types until final Response DTO conversion

## Related Files

- **DTOs**: `../dtos/*.dto.ts`
- **Interfaces**: `../interfaces/*.interface.ts`
- **Enums**: `../enums/*.enum.ts`
- **Constants**: `../constants/membership-practices.constants.ts`

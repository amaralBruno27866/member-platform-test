# Membership Practices DTOs

This directory contains all Data Transfer Objects (DTOs) for the membership practices entity, providing validation and typing for API operations.

## Files Overview

### 1. `membership-practices-create.dto.ts`

**Purpose**: Validates POST requests for creating new practice records.

**Fields**: 7 user-provided fields (1 required array + 6 optional)

**Key Features**:

- `osot_clients_age`: **REQUIRED** multi-select array (minimum 1 value)
- All enum fields use proper validation decorators
- Conditional \"other\" fields for settings and services

**Usage**: `POST /private/membership-practices/me`

### 2. `membership-practices-update.dto.ts`

**Purpose**: Validates PATCH requests for updating existing practice records.

**Fields**: Same 7 fields, ALL optional (partial update)

**Key Features**:

- `osot_clients_age` if provided must have minimum 1 value
- Cannot update `osot_membership_year` (immutable)

**Usage**: `PATCH /private/membership-practices/me`

### 3. `membership-practices-response.dto.ts`

**Purpose**: Defines GET response structure with enum-to-label conversion.

**Fields**: 8 total (7 user + 1 system field)

**Key Features**:

- All enum arrays converted to **string arrays** with human-readable labels
- Example: `[ClientsAge.ADULT]` → `[\"Adult\"]`
- `osot_membership_year`: READ-ONLY system field

**Usage**: `GET /private/membership-practices/me`

### 4. `membership-practices-basic.dto.ts`

**Purpose**: Complete entity DTO with all fields including system-generated ones.

**Fields**: 17 total (7 user + 10 system fields)

**Key Features**:

- Includes UUIDs: `osot_table_membership_practiceid`, `osot_practice_id`
- Includes timestamps: `createdon`, `modifiedon`, `ownerid`
- Includes lookup: `osot_Table_Account@odata.bind`
- Includes access control: `osot_privilege`, `osot_access_modifiers`
- Base DTO for internal service operations and mappers

**Usage**: Internal service layer, mapper operations, Update DTO base

### 5. `list-membership-practices.query.dto.ts`

**Purpose**: Query parameters for GET list operations with filtering and pagination.

**Fields**: 12 query parameters

**Key Features**:

- Primary filters: `membershipYear`, `accountId`
- Enum filters (single values): `clientsAge`, `practiceArea`, `practiceSettings`, `practiceServices`
- Boolean filter: `preceptorDeclaration`
- Pagination: `skip` (default: 0), `top` (default: 20, max: 100)
- Sorting: `orderBy` (field enum), `sortDirection` (asc/desc)
- Text search: `search` (searches "other" fields)

**Usage**: `GET /private/membership-practices` (list with filters)

## Key Validation Rules

### Required Fields (Create)

- `osot_clients_age`: Array with minimum 1 value (**business required**)

### Optional Fields

- All other fields: `osot_preceptor_declaration`, `osot_practice_area`, `osot_practice_settings`, `osot_practice_services`

### Conditional \"Other\" Fields

- When `PracticeSettings.OTHER` selected → `osot_practice_settings_other` required (255 chars)
- When `PracticeServices.OTHER` selected → `osot_practice_services_other` required (255 chars)

### Multi-Select Arrays

All 4 custom enums are multi-select arrays:

- `osot_clients_age: ClientsAge[]` (required)
- `osot_practice_area: PracticeArea[]` (optional)
- `osot_practice_settings: PracticeSettings[]` (optional)
- `osot_practice_services: PracticeServices[]` (optional)

## Enum-to-Label Conversion (Response DTO)

````typescript
// Internal representation (enums)
{\n  osot_clients_age: [ClientsAge.ADULT, ClientsAge.OLDER],\n  osot_practice_area: [PracticeArea.CHRONIC_PAIN]\n}\n\n// Response (human-readable labels)
{\n  \"osot_clients_age\": [\"Adult\", \"Older (65+)\"],\n  \"osot_practice_area\": [\"Chronic Pain\"]\n}\n```

## Example Requests

### Valid Create
```json
{\n  \"osot_clients_age\": [1, 4, 5],\n  \"osot_practice_area\": [10, 40],\n  \"osot_practice_settings\": [1, 7]\n}\n```

### Invalid Create (empty array)
```json
{\n  \"osot_clients_age\": []\n  // ERROR: minimum 1 value required\n}\n```

### Valid Update (partial)
```json
{\n  \"osot_practice_services\": [47, 54]\n}\n```

## Best Practices

1. **Always validate clients_age** - Required with minimum 1 value
2. **Validate conditional \"other\" fields** - Check when OTHER selected
3. **Never include membership_year** - System-defined field
4. **Use enum-to-label conversion** - Response DTOs return strings
5. **Handle multi-select arrays** - All 4 enums are arrays

## Related Files

- **Enums**: `../enums/*.enum.ts`
- **Interfaces**: `../interfaces/*.interface.ts`
- **Mappers**: `../mappers/membership-practices.mapper.ts`
- **Services**: `../services/*.service.ts`
````

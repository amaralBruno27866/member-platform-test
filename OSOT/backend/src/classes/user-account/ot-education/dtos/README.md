# OT Education DTOs

## Purpose

Contains Data Transfer Objects used for request validation and response shaping in the OT Education domain. DTOs define the expected shape of input and output payloads for Occupational Therapy education credentials and include comprehensive validation decorators for COTO business rules.

## DTOs Overview

### Core DTOs

- **`ot-education-basic.dto.ts`** → `OtEducationBasicDto` - Base fields with validation
- **`create-ot-education.dto.ts`** → `CreateOtEducationDto` - Creation with OData binding
- **`update-ot-education.dto.ts`** → `UpdateOtEducationDto` - Partial updates
- **`ot-education-response.dto.ts`** → `OtEducationResponseDto` - API responses
- **`ot-education-registration.dto.ts`** → `OtEducationRegistrationDto` - User registration
- **`list-ot-education.query.dto.ts`** → `ListOtEducationQueryDto` - Query/filtering

## Business Rules Validation

### COTO Registration Rules

```typescript
// Example: General status requires registration number
{
  osot_coto_status: CotoStatus.GENERAL,
  osot_coto_registration: "AB123456" // Required
}

// Example: Student status cannot have registration
{
  osot_coto_status: CotoStatus.STUDENT,
  osot_coto_registration: undefined // Must be null
}
```

### University-Country Alignment

```typescript
// Example: Canadian university should have Canada as country
{
  osot_ot_university: OtUniversity.UNIVERSITY_OF_TORONTO,
  osot_ot_country: Country.CANADA // Aligned
}
```

### Graduation Year Validation

```typescript
// Valid range: 1950 to current year + 5
{
  osot_ot_grad_year: GraduationYear.YEAR_2020; // Valid
}
```

## Usage Examples

### Creating OT Education Record

```typescript
import { CreateOtEducationDto } from './create-ot-education.dto';

const createDto: CreateOtEducationDto = {
  'osot_Table_Account@odata.bind': '/osot_table_accounts/account-guid',
  osot_user_business_id: 'OTED001',
  osot_coto_status: CotoStatus.GENERAL,
  osot_coto_registration: 'AB123456',
  osot_ot_degree_type: DegreeType.MASTERS,
  osot_ot_university: OtUniversity.UNIVERSITY_OF_TORONTO,
  osot_ot_grad_year: GraduationYear.YEAR_2020,
  osot_ot_country: Country.CANADA,
  osot_ot_other: 'Specialized in pediatric therapy',
};
```

### Updating OT Education Record

```typescript
import { UpdateOtEducationDto } from './update-ot-education.dto';

const updateDto: UpdateOtEducationDto = {
  osot_coto_status: CotoStatus.PROVISIONAL_TEMPORARY,
  osot_coto_registration: 'CD789012',
  osot_ot_other: 'Updated certification details',
};
```

### Registration Workflow

```typescript
import { OtEducationRegistrationDto } from './ot-education-registration.dto';

const registrationDto: OtEducationRegistrationDto = {
  osot_user_business_id: 'REG-OTED-001',
  osot_coto_status: CotoStatus.GENERAL,
  osot_coto_registration: 'AB123456',
  osot_ot_degree_type: DegreeType.MASTERS,
  osot_ot_university: OtUniversity.MCMASTER_UNIVERSITY,
  osot_ot_grad_year: GraduationYear.YEAR_2022,
  osot_ot_country: Country.CANADA,
};
```

### Querying/Filtering

```typescript
import { ListOtEducationQueryDto } from './list-ot-education.query.dto';

const queryDto: ListOtEducationQueryDto = {
  q: 'toronto university',
  osot_coto_status: '1', // General status
  osot_ot_country: '1', // Canada
  page: 1,
  limit: 25,
  sort_by: 'CreatedOn',
  sort_order: 'desc',
};
```

## Validation Features

### Custom Validators Applied

- `@IsOtEducationUserBusinessId()` - Business ID format validation
- `@IsCotoRegistrationFormat()` - COTO registration format (8 chars, alphanumeric)
- `@IsCotoStatusRegistrationValid()` - Business rule alignment
- `@IsUniversityCountryAligned()` - Geographic consistency
- `@IsValidGraduationYear()` - Year range validation
- `@IsValidOtOther()` - Additional details validation

### OData Binding Validation

```typescript
// Account relationship binding
'osot_Table_Account@odata.bind': '/osot_table_accounts/guid'
```

## Best Practices

### Request Validation

- Use class-validator decorators for comprehensive validation
- Apply custom business rule validators
- Maintain proper enum usage for type safety

### Response Shaping

- Include computed fields for UI convenience
- Provide formatted summaries (education_summary, coto_summary)
- Include status flags (is_coto_active, is_international_education)

### Error Handling

- Custom validators provide meaningful error messages
- Business rule violations are clearly communicated
- Field-level validation with context-aware messages

## Integration Points

### Dataverse Integration

- Compatible with Microsoft Dataverse OData APIs
- Proper field mapping to Table OT Education schema
- OData binding strings for relationship management

### Orchestrator Integration

- Registration DTO optimized for user onboarding workflows
- Streamlined field sets for different business processes
- Validation aligned with COTO professional standards

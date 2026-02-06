# OTA Education DTOs - Enterprise Implementation

## Overview

This directory contains the complete Data Transfer Object (DTO) implementation for the OTA Education domain, following enterprise architecture patterns and maintaining consistency with the existing OT Education implementation.

## Enterprise Architecture Patterns

### 🏗️ Design Patterns Applied

- **Data Transfer Object Pattern**: Clean separation between API contracts and internal models
- **Inheritance Hierarchy**: Structured DTO inheritance for code reusability
- **Validation Strategy**: Custom decorators with class-validator integration
- **Enterprise Documentation**: Comprehensive Swagger/OpenAPI documentation

### 🔧 Technical Integration

- **Type Safety**: Full TypeScript integration with proper enum handling
- **Custom Validators**: Integration with domain-specific validation rules
- **OData Support**: Ready for Microsoft Dataverse OData queries
- **Error Handling**: Structured validation with proper error responses

## DTO Architecture

### Base Foundation

```
OtaEducationBasicDto (Base)
├── CreateOtaEducationDto (extends Basic + OData binding)
├── UpdateOtaEducationDto (partial fields, independent)
└── OtaEducationRegistrationDto (extends Create + workflow metadata)
```

### Independent DTOs

- **OtaEducationResponseDto**: Complete entity representation with metadata
- **ListOtaEducationQueryDto**: Advanced filtering and pagination

## File Structure

```
dtos/
├── ota-education-basic.dto.ts          # Base DTO with core validation
├── create-ota-education.dto.ts         # Creation with OData binding
├── update-ota-education.dto.ts         # Partial updates
├── ota-education-response.dto.ts       # API responses with metadata
├── list-ota-education.query.dto.ts     # Query parameters and filtering
├── ota-education-registration.dto.ts   # Registration workflow
└── index.ts                           # Centralized exports
```

## DTO Details

### OtaEducationBasicDto

**Purpose**: Base validation and field definitions
**Key Features**:

- Required fields: `user_business_id`, `work_declaration`
- Optional fields with proper defaults
- Custom validator integration
- Comprehensive Swagger documentation

### CreateOtaEducationDto

**Purpose**: Creating new records with relationship binding
**Extends**: OtaEducationBasicDto
**Additional Features**:

- OData binding for Account relationship
- Optional system GUID support
- Complete field validation inheritance

### UpdateOtaEducationDto

**Purpose**: Partial updates to existing records
**Design**: Independent implementation (not extending)
**Features**:

- All fields optional for flexibility
- Maintains validation when fields provided
- No relationship binding (updates don't change relationships)

### OtaEducationResponseDto

**Purpose**: API response representation
**Features**:

- Complete entity with system metadata
- Account relationship information
- Proper enum types for type safety
- Creation/modification timestamps

### ListOtaEducationQueryDto

**Purpose**: Advanced querying and filtering
**Features**:

- Field-specific filtering with type safety
- Enum-based filtering
- Date range filtering
- Full-text search capabilities
- OData query parameter support
- Pagination and sorting controls

### OtaEducationRegistrationDto

**Purpose**: Registration workflow specific operations
**Extends**: CreateOtaEducationDto
**Additional Features**:

- Terms acceptance tracking
- Registration metadata
- Audit trail information
- Workflow context tracking

## Validation Integration

### Custom Validators Used

- **@IsValidUserBusinessId()**: Business ID format validation
- **@IsValidWorkDeclaration()**: Work declaration business rules
- **@IsValidDegreeType()**: Degree type validation
- **@IsValidCollegeCountryAlignment()**: College-country alignment

### Standard Validators

- **class-validator**: Core validation decorators
- **Type validation**: String, Boolean, UUID, Date validation
- **Enum validation**: Type-safe enum value checking

## Enterprise Standards Compliance

### ✅ Security

- PII-aware field handling
- Input sanitization through validation
- Type-safe enum handling
- Audit trail support

### ✅ Documentation

- Comprehensive Swagger/OpenAPI documentation
- Clear field descriptions and examples
- Enum documentation with valid values
- Request/response examples

### ✅ Maintainability

- Clear separation of concerns
- Consistent naming conventions
- Modular architecture
- Centralized exports

### ✅ Integration Ready

- OData query support
- Dataverse relationship binding
- Custom validator integration
- Error handling compatibility

## Usage Examples

### Creating a Record

```typescript
const createDto: CreateOtaEducationDto = {
  user_business_id: 'USR-2024-001234',
  work_declaration: 'I declare that this education information is accurate',
  college: 'University of Toronto',
  country: 'CA',
  education_category: EducationCategory.GRADUATED,
  'osot_Table_Account@odata.bind': '/osot_table_accounts/guid-here',
};
```

### Updating a Record

```typescript
const updateDto: UpdateOtaEducationDto = {
  grade: '3.8',
  program: 'Occupational Therapy',
  // Only include fields to update
};
```

### Querying Records

```typescript
const queryDto: ListOtaEducationQueryDto = {
  education_category: EducationCategory.GRADUATED,
  country: 'CA',
  limit: '25',
  sort_by: 'year',
  sort_direction: 'desc',
};
```

## Future Enhancements

1. **Advanced Validation**: Additional business rule validators
2. **Localization**: Multi-language field descriptions
3. **Custom Serializers**: Domain-specific data transformation
4. **Caching Strategy**: DTO-level caching for performance
5. **Audit Integration**: Enhanced audit trail DTOs

## Integration Points

- **Controllers**: Direct DTO usage in API endpoints
- **Services**: DTO to entity mapping
- **Validators**: Custom validation integration
- **Documentation**: Auto-generated API docs
- **Testing**: DTO-based test fixtures

This implementation provides a robust, type-safe, and maintainable foundation for OTA Education operations while maintaining consistency with enterprise architecture patterns.

- login.dto.ts -> LoginDto { email, password }

Usage

- Use class-validator decorators to validate incoming requests.
- Keep DTOs minimal and focused to the endpoint's needs.

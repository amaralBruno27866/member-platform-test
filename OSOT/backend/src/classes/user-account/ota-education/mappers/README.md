# OTA Education Mappers

## Overview

This directory contains data mapping functions that transform OTA Education data between different layers of the application architecture:

- **DTOs** ↔ **Internal Models** ↔ **Dataverse Entities**

## Architecture Pattern

Following Enterprise Data Mapping Pattern with clean separation:

```
API Layer (DTOs) ←→ Business Layer (Internal) ←→ Data Layer (Dataverse)
```

## Core Functions

### Data Transformation

- `mapCreateDtoToInternal()` - Transform creation requests for business layer
- `mapUpdateDtoToInternal()` - Transform update requests (partial mapping)
- `mapDataverseToInternal()` - Transform Dataverse responses to internal models
- `mapInternalToResponse()` - Transform internal models to API responses
- `mapInternalToDataverse()` - Transform internal models for Dataverse operations

### Data Validation & Parsing

- `parseEducationCategory()` - Type-safe enum conversion
- `parseDegreeType()` - Degree type validation
- `parseOtaCollege()` - College enumeration handling
- `parseGraduationYear()` - Year validation
- `parseCountry()` - Country code validation
- `parseAccessModifier()` - Access control parsing

### Data Normalization

- `normalizeUserBusinessId()` - Business ID formatting
- `normalizeDescription()` - Text field standardization

## Field Mapping Strategy

### DTO → Internal

Maps simplified API field names to internal Dataverse field names:

- `user_business_id` → `osot_user_business_id`
- `work_declaration` → `osot_work_declaration`
- `college` → `osot_ota_college`
- `country` → `osot_ota_country`
- `year` → `osot_ota_grad_year`

### Internal → Response

Maps internal fields back to clean API response format while preserving type safety and filtering sensitive fields.

## Type Safety

All mapping functions maintain full TypeScript type safety:

- Enum validation with fallback handling
- Undefined field handling for partial updates
- Type guards for data integrity
- Comprehensive error handling

## Enterprise Patterns

- **Repository Pattern**: Clean data access abstraction
- **Data Transfer Object**: API contract isolation
- **Type Safety**: Full compile-time validation
- **Business Logic Isolation**: Domain-specific transformations
- **Error Handling**: Comprehensive validation with meaningful messages

## Example Usage

```typescript
// Create mapping
const internal = mapCreateDtoToInternal(createDto);
const dataverse = mapInternalToDataverse(internal);

// Response mapping
const internal = mapDataverseToInternal(dataverseResponse);
const response = mapInternalToResponse(internal);

// Enum parsing with validation
const degreeType = parseDegreeType(stringValue); // Returns DegreeType enum
const college = parseOtaCollege(collegeString); // Returns OtaCollege enum
```

---

_Part of OSOT Dataverse API - OTA Education Domain Implementation_

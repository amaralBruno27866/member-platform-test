# OT Education Mappers

## Purpose

Contains mapping utilities that transform **Occupational Therapy Education** data between different layers and representations. These pure functions handle data transformation without side effects and ensure type safety across the application.

## 🔄 **Data Flow Transformations**

```
Dataverse API ⟷ Internal Model ⟷ Response DTOs
     ↕                             ↕
Create/Update DTOs            Public API Response
```

## 📋 **Available Mappers**

### **1. Core Mapping Functions**

| Function                 | Purpose                      | Input → Output                                          |
| ------------------------ | ---------------------------- | ------------------------------------------------------- |
| `mapDataverseToInternal` | Raw API to internal model    | `DataverseOtEducation` → `OtEducationInternal`          |
| `mapInternalToResponse`  | Internal to public response  | `OtEducationInternal` → `OtEducationResponseDto`        |
| `mapCreateDtoToInternal` | Create DTO to internal       | `CreateOtEducationDto` → `Partial<OtEducationInternal>` |
| `mapUpdateDtoToInternal` | Update DTO to internal       | `UpdateOtEducationDto` → `Partial<OtEducationInternal>` |
| `mapInternalToDataverse` | Internal to Dataverse format | `OtEducationInternal` → `DataverseOtEducation`          |

### **2. Validation Utilities**

| Function                             | Purpose                             | Returns                                |
| ------------------------------------ | ----------------------------------- | -------------------------------------- |
| `validateCotoAlignment`              | COTO status/registration validation | `{ isValid: boolean; error?: string }` |
| `validateUniversityCountryAlignment` | University-country validation       | `{ isValid: boolean; error?: string }` |
| `calculateCompletenessScore`         | Data completeness percentage        | `number (0-100)`                       |
| `extractSearchableText`              | Full-text search indexing           | `string`                               |

## 🛠️ **Usage Examples**

### **Basic Data Transformation**

```typescript
import {
  mapDataverseToInternal,
  mapInternalToResponse,
  mapCreateDtoToInternal,
} from './ot-education.mapper';

// Transform raw Dataverse response
const internal = mapDataverseToInternal(dataverseResponse);

// Create public API response
const response = mapInternalToResponse(internal);

// Prepare creation data
const createData = mapCreateDtoToInternal(createDto);
```

### **Business Rule Validation**

```typescript
import {
  validateCotoAlignment,
  validateUniversityCountryAlignment,
} from './ot-education.mapper';

// Validate COTO registration
const cotoValidation = validateCotoAlignment(CotoStatus.GENERAL, '12345678');

// Validate university-country pairing
const universityValidation = validateUniversityCountryAlignment(
  OtUniversity.UNIVERSITY_OF_TORONTO,
  Country.CANADA,
);
```

### **Data Analysis**

```typescript
import {
  calculateCompletenessScore,
  extractSearchableText,
} from './ot-education.mapper';

// Calculate completeness (0-100%)
const completeness = calculateCompletenessScore(internal);

// Extract searchable text for indexing
const searchText = extractSearchableText(internal);
```

## 🔧 **Transformation Features**

### **Data Normalization**

- **COTO Registration**: Validates 8-digit format
- **User Business ID**: Trims and enforces 20-char limit
- **Date Parsing**: Handles Dataverse ISO date strings
- **Enum Conversion**: Numbers ↔ TypeScript enums
- **Text Fields**: Length limits and trimming

### **Business Rules Enforcement**

- **COTO Alignment**: Registration required for GENERAL status
- **University-Country**: Canadian universities require Canada
- **Field Validation**: Length limits, format requirements
- **Optional Handling**: Proper undefined/null management

### **Security & Privacy**

- **Response Mapping**: Excludes internal system fields
- **Field Filtering**: Removes sensitive data from public APIs
- **Type Safety**: Prevents data leakage through strong typing

## 📝 **Guidelines**

### **✅ Best Practices**

- **Pure Functions**: No side effects, same input = same output
- **Type Safety**: Leverage TypeScript for compile-time validation
- **Error Handling**: Return validation objects with clear messages
- **Performance**: Minimal object creation, efficient transformations
- **Consistency**: Follow established patterns from Address/Contact mappers

### **❌ Avoid**

- **Side Effects**: Don't modify external state in mappers
- **Complex Logic**: Keep business rules in service layer
- **Direct Mutations**: Always return new objects
- **Unsafe Casting**: Validate data before type assertions

## 🎯 **Integration Points**

- **Repository Layer**: Transform Dataverse responses
- **Service Layer**: Apply business rules and validation
- **Controller Layer**: Convert DTOs for API responses
- **Event System**: Extract data for audit trails
- **Search Engine**: Generate searchable text indexes

These mappers ensure **clean separation of concerns** and **type-safe data flow** throughout the OT Education module.

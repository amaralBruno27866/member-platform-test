# Identity Entity - Frontend Integration Guide

**Last Updated**: December 17, 2025  
**Version**: 2.0 (Production)  
**Status**: ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Entity Purpose](#entity-purpose)
3. [Available Endpoints](#available-endpoints)
4. [Field Specifications](#field-specifications)
5. [Validation Rules](#validation-rules)
6. [Business Rules](#business-rules)
7. [Request/Response Examples](#requestresponse-examples)
8. [Error Handling](#error-handling)
9. [Use Cases](#use-cases)
10. [Cultural & Accessibility Features](#cultural--accessibility-features)
11. [Privacy & Security](#privacy--security)
12. [Testing Checklist](#testing-checklist)

---

## Overview

The **Identity** entity stores personal, cultural, and accessibility information for users. It serves as the cultural and personal identity profile that complements the Account entity's business data.

### Key Characteristics

- **One-to-One Relationship**: Each Account has exactly one Identity record
- **Cultural Sensitivity**: Optional fields for self-identification (race, indigenous status, disability)
- **Privacy-First**: User-controlled visibility via access modifiers
- **Multi-Language Support**: Users can select multiple language preferences
- **Auto-Generated IDs**: System automatically generates `osot_identity_id` and `osot_user_business_id`

### Architecture Pattern

Follows **Clean Architecture** with:
- Separate DTOs for Create/Update/Response operations
- Mappers that strip sensitive internal fields
- Custom validators for cultural data consistency
- Business rules service for complex validations
- Public/Private controller separation

---

## Entity Purpose

### What Identity Stores

✅ **Personal Identity**:
- Chosen/preferred name (different from legal name)
- User business identifier (auto-generated)

✅ **Cultural Identity**:
- Language preferences (multi-select, required)
- Gender identity (optional, self-reported)
- Racial identity (optional, self-reported)
- Indigenous identity and details (optional)

✅ **Accessibility**:
- Disability status (optional, self-reported)

✅ **Privacy Controls**:
- Access modifiers (Public/Private/Organization)
- System privilege level (internal only)

### What Identity DOES NOT Store

❌ Legal names (stored in Account)
❌ Contact information (stored in Account)
❌ Credentials/passwords (handled by Auth system)
❌ Membership data (stored in Membership tables)

---

## Available Endpoints

### Public Endpoints (No Authentication)

#### `POST /public/identities/create`
Create identity record linked to account (used by Registration Orchestrator)

**Request Body**: `CreateIdentityForAccountDto`

**Use Case**: Called during user registration flow after account creation

**Response**: `201 Created` with identity record

---

#### `GET /public/identities/health`
Health check endpoint

---

### Private Endpoints (Authenticated - JWT Required)

#### `GET /private/identities/me`
Get my identity record

**Authentication**: JWT Bearer token required

**Response**: `IdentityPublicDto` (sanitized, no internal fields)

```typescript
interface IdentityPublicDto {
  osot_identity_id: string;
  osot_user_business_id: string;
  osot_chosen_name?: string;
  osot_language: string[];          // Array of language labels
  osot_other_language?: string;
  osot_gender?: string;             // Gender label
  osot_race?: string;               // Race label
  osot_indigenous?: boolean;
  osot_indigenous_detail?: string;  // Indigenous detail label
  osot_indigenous_detail_other?: string;
  osot_disability?: boolean;
  // Note: osot_privilege, osot_table_identityid, ownerid are NOT exposed
}
```

---

#### `PATCH /private/identities/me`
Update my identity record (partial updates supported)

**Request Body**: `IdentityUpdateDto` (all fields optional)

**Authentication**: JWT Bearer token required

**Partial Updates**: You can send only the fields you want to update

```typescript
// Example: Update only chosen name and languages
PATCH /private/identities/me
{
  "osot_chosen_name": "Alex",
  "osot_language": [13, 18]  // English + French
}
```

---

#### `GET /private/identities` (Admin Only)
List all identity records with pagination

**Query Parameters**:
- `skip?: number` - Pagination offset (default: 0)
- `top?: number` - Results per page (default: 10)
- `page?: number` - Page number (alternative to skip)
- `limit?: number` - Results per page (alternative to top)

**Authorization**: Requires appropriate privilege level

---

#### `GET /private/identities/:id` (Admin Only)
Get specific identity record by ID

**Parameters**:
- `id: string` - Identity GUID (`osot_table_identityid`)

**Authorization**: Requires appropriate privilege level

---

## Field Specifications

### 🔑 System Fields (Auto-Generated, Read-Only)

| Field | Type | Description |
|-------|------|-------------|
| `osot_table_identityid` | `string` (UUID) | Internal GUID for Dataverse relationships |
| `osot_identity_id` | `string` | Public auto-number ID (e.g., "osot-id-0000001") |
| `osot_user_business_id` | `string` | Business identifier (auto-generated, max 20 chars) |
| `createdon` | `Date` | System creation timestamp |
| `modifiedon` | `Date` | System modification timestamp |
| `ownerid` | `string` | System owner (managed by Dataverse) |

**⚠️ Important**: These fields are **auto-generated** by the backend. Frontend should never send them in create/update requests.

---

### 👤 Personal Identity Fields

#### `osot_chosen_name` (string, optional)

**Purpose**: Preferred or chosen name (different from legal name in Account)

**Validation**:
- ✅ Optional field
- ✅ Max 255 characters
- ✅ Letters, spaces, hyphens, apostrophes, dots allowed
- ✅ Pattern: `/^[a-zA-Z\s\-'.]+$/`

**Use Cases**:
- Trans/non-binary individuals using different name
- Preferred nickname or shortened name
- Cultural name preferences

**Display Logic**:
```typescript
// Show chosen name with fallback to legal name
const displayName = identity.osot_chosen_name || account.osot_first_name;

// Show both names if different
{identity.osot_chosen_name && (
  <div>
    <strong>{identity.osot_chosen_name}</strong>
    <span className="legal-name">(Legal: {account.osot_first_name})</span>
  </div>
)}
```

---

### 🌍 Language Preferences

#### `osot_language` (array, required)

**Purpose**: User's language preferences for communication and content

**Type**: Array of `Language` enum values (multi-select)

**Validation**:
- ✅ **Required field** (business required)
- ✅ Minimum: 1 language
- ✅ Maximum: 10 languages
- ✅ Must be valid Language enum values

**Important Notes**:
- **Internal Format**: Array of numbers `[13, 18]` (English, French)
- **Dataverse Format**: Comma-separated string `"13,18"`
- **Response Format**: Array of labels `["English", "French"]`

**Enum Values** (fetch from `/public/enums/languages`):
```typescript
enum Language {
  ENGLISH = 13,
  FRENCH = 18,
  SPANISH = 6,
  MANDARIN = 10,
  // ... 65 languages total
}
```

**Form Implementation**:
```tsx
<MultiSelect
  label="Language Preferences *"
  name="osot_language"
  options={languageOptions}  // Fetch from /public/enums/languages
  required
  min={1}
  max={10}
  helperText="Select at least one language (max 10)"
/>

// On submit
{
  "osot_language": [13, 18, 6]  // Send as array of numbers
}
```

---

#### `osot_other_language` (string, optional)

**Purpose**: Specify languages not in predefined list

**Validation**:
- ✅ Optional field
- ✅ Max 255 characters
- ✅ Free text input

**Example Values**: `"Mandarin"`, `"Portuguese"`, `"Arabic"`

---

### 🧑‍🤝‍🧑 Cultural Identity Fields (Optional, Self-Reported)

#### `osot_gender` (enum, optional)

**Purpose**: Gender identity (optional self-identification)

**Type**: `Gender` enum value

**Validation**:
- ✅ Optional field
- ✅ Must be valid Gender enum value if provided

**Enum Values** (fetch from `/public/enums/genders`):
```typescript
enum Gender {
  MALE = 1,
  FEMALE = 2,
  NON_BINARY = 3,
  PREFER_NOT_TO_DISCLOSE = 4,
  OTHER = 5
}
```

**Privacy Note**: This field is optional and respects user privacy choices

---

#### `osot_race` (enum, optional)

**Purpose**: Racial identity (optional self-identification)

**Type**: `Race` enum value

**Validation**:
- ✅ Optional field
- ✅ Must be valid Race enum value if provided

**Enum Values** (fetch from `/public/enums/races`):
```typescript
enum Race {
  INDIGENOUS = 1,
  BLACK = 2,
  EAST_ASIAN = 3,
  SOUTH_ASIAN = 4,
  SOUTHEAST_ASIAN = 5,
  MIDDLE_EASTERN = 6,
  LATIN_AMERICAN = 7,
  WHITE = 8,
  MIXED = 9,
  OTHER = 10,
  PREFER_NOT_TO_DISCLOSE = 11
}
```

---

#### `osot_indigenous` (boolean, optional)

**Purpose**: Indigenous identity status

**Validation**:
- ✅ Optional field
- ✅ Boolean value (true/false)

**Default**: `false`

**Related Fields**: If `true`, user may provide `osot_indigenous_detail`

---

#### `osot_indigenous_detail` (enum, optional)

**Purpose**: Specific Indigenous identity

**Type**: `IndigenousDetail` enum value

**Validation**:
- ✅ Optional field
- ✅ Should only be provided if `osot_indigenous === true`
- ✅ Business rule: Validates consistency with `osot_indigenous` flag

**Enum Values** (fetch from `/public/enums/indigenous-details`):
```typescript
enum IndigenousDetail {
  FIRST_NATIONS = 1,
  INUIT = 2,
  METIS = 3,
  OTHER = 4
}
```

---

#### `osot_indigenous_detail_other` (string, optional)

**Purpose**: Free-text description for "Other" Indigenous identity

**Validation**:
- ✅ Optional field
- ✅ Max 100 characters
- ✅ Should only be provided if `osot_indigenous_detail === IndigenousDetail.OTHER`

**Business Rule**: Validator checks consistency between these fields

---

### ♿ Accessibility Fields

#### `osot_disability` (boolean, optional)

**Purpose**: Disability status (optional self-identification)

**Validation**:
- ✅ Optional field
- ✅ Boolean value (true/false)

**Default**: `false`

**Privacy Note**: Used for accessibility accommodations and inclusivity metrics

---

### 🔒 Internal Fields (NOT Exposed to Frontend)

These fields exist in the backend but are **stripped from public responses**:

- `osot_privilege` (enum): Internal privilege level for system access
- `osot_access_modifiers` (enum): Future visibility controls
- `osot_table_account` (string): Internal account relationship GUID

**⚠️ Security Warning**: Never request or display these fields in frontend applications

---

## Validation Rules

### Field-Level Validations

```typescript
// IdentityBasicDto / IdentityUpdateDto Validation Rules

osot_chosen_name: {
  optional: true,
  maxLength: 255,
  pattern: /^[a-zA-Z\s\-'.]+$/,
  validator: IdentityChosenNameValidator
}

osot_language: {
  required: true,          // Business required
  type: 'array',
  itemType: 'enum',
  minItems: 1,
  maxItems: 10,
  enum: Language,
  validator: IdentityLanguagesValidator
}

osot_other_language: {
  optional: true,
  maxLength: 255
}

osot_gender: {
  optional: true,
  enum: Gender
}

osot_race: {
  optional: true,
  enum: Race
}

osot_indigenous: {
  optional: true,
  type: 'boolean'
}

osot_indigenous_detail: {
  optional: true,
  enum: IndigenousDetail
}

osot_indigenous_detail_other: {
  optional: true,
  maxLength: 100,
  validator: IdentityIndigenousDetailOtherValidator
}

osot_disability: {
  optional: true,
  type: 'boolean'
}
```

---

### Cross-Field Validations (Business Rules)

#### Indigenous Fields Consistency

**Rule 1**: `osot_indigenous_detail` should only be provided if `osot_indigenous === true`

```typescript
// Backend validator checks:
if (osot_indigenous_detail && !osot_indigenous) {
  return ValidationError(
    "Indigenous detail can only be provided if indigenous status is true"
  );
}
```

**Rule 2**: `osot_indigenous_detail_other` should only be provided if `osot_indigenous_detail === IndigenousDetail.OTHER`

```typescript
if (osot_indigenous_detail_other && osot_indigenous_detail !== IndigenousDetail.OTHER) {
  return ValidationError(
    "Indigenous detail other can only be provided when detail is 'Other'"
  );
}
```

**Frontend Implementation**:
```tsx
// Conditional rendering based on indigenous status
{values.osot_indigenous && (
  <FormSelect
    name="osot_indigenous_detail"
    label="Indigenous Detail"
    options={indigenousDetailOptions}
  />
)}

{values.osot_indigenous_detail === IndigenousDetail.OTHER && (
  <FormInput
    name="osot_indigenous_detail_other"
    label="Please Specify"
    maxLength={100}
  />
)}
```

---

### Custom Validators

#### IdentityChosenNameValidator
- Validates name format (letters, spaces, hyphens, apostrophes, dots)
- Max 255 characters
- Optional field

#### IdentityLanguagesValidator
- Validates array of Language enum values
- Minimum 1 language, maximum 10 languages
- Business required field

#### IdentityIndigenousDetailOtherValidator
- Validates indigenous detail other text
- Max 100 characters
- Consistency with indigenous_detail field

---

## Business Rules

### 1. Language Selection Requirement

**Rule**: At least one language must be selected (business required)

**Enforcement**: 
- DTO validation: `@ArrayMinSize(1)`
- Custom validator: `IdentityLanguagesValidator`

**Frontend**:
```typescript
// Form validation
const schema = yup.object({
  osot_language: yup
    .array()
    .min(1, 'At least one language is required')
    .max(10, 'Maximum 10 languages allowed')
    .required('Language selection is required')
});
```

---

### 2. Indigenous Fields Logical Consistency

**Rule**: Indigenous detail fields should only be populated when indigenous status is true

**Enforcement**: Service-layer validation in `IdentityBusinessRuleService`

**Frontend Logic**:
```typescript
// Reset dependent fields when parent changes
const handleIndigenousChange = (value: boolean) => {
  setFieldValue('osot_indigenous', value);
  
  if (!value) {
    // Clear dependent fields
    setFieldValue('osot_indigenous_detail', null);
    setFieldValue('osot_indigenous_detail_other', null);
  }
};

const handleIndigenousDetailChange = (value: IndigenousDetail) => {
  setFieldValue('osot_indigenous_detail', value);
  
  if (value !== IndigenousDetail.OTHER) {
    // Clear "other" field
    setFieldValue('osot_indigenous_detail_other', null);
  }
};
```

---

### 3. Privacy-Sensitive Fields

**Rule**: Cultural identity fields are optional and respect user privacy

**Implementation**:
- All cultural fields are optional
- No default values enforced
- "Prefer not to disclose" options available
- Users can skip these fields entirely

**Frontend Messaging**:
```tsx
<FormSection title="Cultural Identity (Optional)">
  <Alert severity="info">
    These fields are optional and help us understand our community better. 
    You may skip any questions or select "Prefer not to disclose".
  </Alert>
  
  <FormSelect name="osot_gender" label="Gender Identity (Optional)" />
  <FormSelect name="osot_race" label="Racial Identity (Optional)" />
</FormSection>
```

---

## Request/Response Examples

### Example 1: Create Identity During Registration

**Request**: `POST /public/identities/create`

```json
{
  "osot_Table_Account@odata.bind": "/osot_table_accounts/a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "osot_chosen_name": "Alex",
  "osot_language": [13, 18],
  "osot_gender": 3,
  "osot_indigenous": false,
  "osot_disability": false
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "osot_identity_id": "osot-id-0000123",
    "osot_table_identityid": "f1e2d3c4-b5a6-7890-1234-567890fedcba",
    "osot_user_business_id": "user-123456",
    "osot_chosen_name": "Alex",
    "osot_language": ["English", "French"],
    "osot_gender": "Non-Binary",
    "osot_indigenous": false,
    "osot_disability": false,
    "createdon": "2025-12-17T10:30:00.000Z"
  },
  "message": "Identity record created successfully"
}
```

---

### Example 2: Get My Identity

**Request**: `GET /private/identities/me`

**Headers**: 
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "osot_identity_id": "osot-id-0000123",
      "osot_user_business_id": "user-123456",
      "osot_chosen_name": "Alex",
      "osot_language": ["English", "French"],
      "osot_other_language": null,
      "osot_gender": "Non-Binary",
      "osot_race": null,
      "osot_indigenous": false,
      "osot_indigenous_detail": null,
      "osot_indigenous_detail_other": null,
      "osot_disability": false
    }
  ],
  "message": "Identity record retrieved successfully"
}
```

**Note**: Response is an array (for flexibility), but typically contains one record per user.

---

### Example 3: Update Identity - Add Cultural Information

**Request**: `PATCH /private/identities/me`

**Headers**: 
```
Authorization: Bearer <JWT_TOKEN>
```

**Body**:
```json
{
  "osot_race": 8,
  "osot_indigenous": true,
  "osot_indigenous_detail": 1,
  "osot_disability": true
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "osot_identity_id": "osot-id-0000123",
    "osot_user_business_id": "user-123456",
    "osot_chosen_name": "Alex",
    "osot_language": ["English", "French"],
    "osot_gender": "Non-Binary",
    "osot_race": "White",
    "osot_indigenous": true,
    "osot_indigenous_detail": "First Nations",
    "osot_indigenous_detail_other": null,
    "osot_disability": true
  },
  "message": "Identity record updated successfully"
}
```

---

### Example 4: Update Only Language Preferences

**Request**: `PATCH /private/identities/me`

```json
{
  "osot_language": [13, 18, 6],
  "osot_other_language": "Portuguese"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "osot_identity_id": "osot-id-0000123",
    "osot_language": ["English", "French", "Spanish"],
    "osot_other_language": "Portuguese"
    // ... other fields unchanged
  },
  "message": "Identity record updated successfully"
}
```

---

### Example 5: Indigenous Identity with Other Detail

**Request**: `PATCH /private/identities/me`

```json
{
  "osot_indigenous": true,
  "osot_indigenous_detail": 4,
  "osot_indigenous_detail_other": "Algonquin"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "osot_indigenous": true,
    "osot_indigenous_detail": "Other",
    "osot_indigenous_detail_other": "Algonquin"
    // ... other fields
  }
}
```

---

## Error Handling

### Validation Errors

**HTTP 400 - Bad Request**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "osot_language",
        "message": "At least one language must be selected"
      },
      {
        "field": "osot_chosen_name",
        "message": "Chosen name must contain only letters, spaces, hyphens, apostrophes, and dots"
      }
    ]
  }
}
```

---

### Business Rule Violations

**HTTP 400 - Business Rule Violation**

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Indigenous detail can only be provided if indigenous status is true",
    "details": {
      "field": "osot_indigenous_detail",
      "providedValue": 1,
      "requiredCondition": "osot_indigenous === true"
    }
  }
}
```

---

### Not Found Errors

**HTTP 404 - Identity Not Found**

```json
{
  "success": false,
  "error": {
    "code": "IDENTITY_NOT_FOUND",
    "message": "Identity record not found for this user",
    "details": {
      "userId": "abc123-def456"
    }
  }
}
```

---

### Authentication Errors

**HTTP 401 - Unauthorized**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": "No JWT token provided or token expired"
  }
}
```

---

### Permission Errors

**HTTP 403 - Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PRIVILEGE",
    "message": "You do not have permission to access this resource",
    "details": {
      "requiredPrivilege": "ADMIN",
      "userPrivilege": "OWNER"
    }
  }
}
```

---

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_LANGUAGE_SELECTION` | 400 | Language array validation failed |
| `LANGUAGE_SELECTION_REQUIRED` | 400 | At least one language must be selected |
| `TOO_MANY_LANGUAGES_SELECTED` | 400 | Maximum 10 languages allowed |
| `INVALID_INDIGENOUS_DETAIL` | 400 | Indigenous detail inconsistency |
| `IDENTITY_NOT_FOUND` | 404 | Identity record does not exist |
| `INSUFFICIENT_PRIVILEGE` | 403 | User lacks required permissions |
| `IDENTITY_ACCESS_DENIED` | 403 | Cannot access another user's identity |
| `UNAUTHORIZED` | 401 | Authentication required |

---

## Use Cases

### Use Case 1: User Profile Setup During Registration

**Scenario**: New user completing registration flow

**Flow**:
```typescript
// Step 1: Create account (handled by account registration)
const accountResponse = await createAccount(accountData);

// Step 2: Create identity linked to account
const identityData = {
  "osot_Table_Account@odata.bind": `/osot_table_accounts/${accountResponse.data.osot_table_accountid}`,
  "osot_language": [Language.ENGLISH],
  "osot_chosen_name": formData.preferredName,
  "osot_indigenous": false,
  "osot_disability": false
};

const identityResponse = await fetch('/public/identities/create', {
  method: 'POST',
  body: JSON.stringify(identityData)
});

// Step 3: Continue with additional profile setup
```

---

### Use Case 2: User Updating Cultural Identity

**Scenario**: User adding cultural identity information after initial registration

**Implementation**:
```tsx
const CulturalIdentityForm = () => {
  const { identity, updateIdentity } = useIdentity();
  
  const handleSubmit = async (values) => {
    try {
      await updateIdentity({
        osot_gender: values.gender,
        osot_race: values.race,
        osot_indigenous: values.indigenous,
        osot_indigenous_detail: values.indigenousDetail,
        osot_indigenous_detail_other: values.indigenousDetailOther
      });
      
      showSuccessMessage("Cultural identity updated successfully");
    } catch (error) {
      handleError(error);
    }
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      <Alert severity="info">
        This information is optional and helps us understand our community better.
      </Alert>
      
      <FormSelect
        name="gender"
        label="Gender Identity (Optional)"
        options={genderOptions}
      />
      
      <FormSelect
        name="race"
        label="Racial Identity (Optional)"
        options={raceOptions}
      />
      
      <FormCheckbox
        name="indigenous"
        label="I identify as Indigenous"
      />
      
      {values.indigenous && (
        <FormSelect
          name="indigenousDetail"
          label="Indigenous Identity"
          options={indigenousDetailOptions}
        />
      )}
      
      {values.indigenousDetail === IndigenousDetail.OTHER && (
        <FormInput
          name="indigenousDetailOther"
          label="Please specify"
          maxLength={100}
        />
      )}
      
      <Button type="submit">Save Changes</Button>
    </Form>
  );
};
```

---

### Use Case 3: Multi-Language Preference Selection

**Scenario**: User selecting multiple language preferences

**Implementation**:
```tsx
const LanguagePreferences = () => {
  const [languages, setLanguages] = useState<Language[]>([Language.ENGLISH]);
  const [languageOptions, setLanguageOptions] = useState([]);
  
  useEffect(() => {
    // Fetch language options from enum endpoint
    const fetchLanguages = async () => {
      const response = await fetch('/public/enums/languages');
      setLanguageOptions(response.data);
    };
    fetchLanguages();
  }, []);
  
  const handleSubmit = async () => {
    if (languages.length === 0) {
      showError("Please select at least one language");
      return;
    }
    
    if (languages.length > 10) {
      showError("Maximum 10 languages allowed");
      return;
    }
    
    try {
      await updateIdentity({
        osot_language: languages  // Send as array of enum values
      });
      showSuccess("Language preferences updated");
    } catch (error) {
      handleError(error);
    }
  };
  
  return (
    <MultiSelect
      label="Language Preferences *"
      value={languages}
      onChange={setLanguages}
      options={languageOptions}
      min={1}
      max={10}
      required
      helperText="Select 1-10 languages for communication (required)"
    />
  );
};
```

---

### Use Case 4: Displaying User Profile with Privacy

**Scenario**: Showing user profile with optional cultural data

**Implementation**:
```tsx
const UserProfile = ({ identity }) => {
  return (
    <ProfileCard>
      <Section>
        <h3>Personal Information</h3>
        
        {identity.osot_chosen_name && (
          <Field label="Preferred Name">
            {identity.osot_chosen_name}
          </Field>
        )}
        
        <Field label="Languages">
          {identity.osot_language.join(', ')}
        </Field>
        
        {identity.osot_other_language && (
          <Field label="Other Languages">
            {identity.osot_other_language}
          </Field>
        )}
      </Section>
      
      <Section>
        <h3>Cultural Identity</h3>
        <Alert severity="info">
          This information is optional and private by default
        </Alert>
        
        {identity.osot_gender && (
          <Field label="Gender Identity">
            {identity.osot_gender}
          </Field>
        )}
        
        {identity.osot_race && (
          <Field label="Racial Identity">
            {identity.osot_race}
          </Field>
        )}
        
        {identity.osot_indigenous && (
          <Field label="Indigenous Identity">
            {identity.osot_indigenous_detail || 'Yes'}
            {identity.osot_indigenous_detail_other && 
              ` (${identity.osot_indigenous_detail_other})`}
          </Field>
        )}
        
        {!identity.osot_gender && !identity.osot_race && !identity.osot_indigenous && (
          <EmptyState>
            <p>No cultural identity information provided</p>
            <Button onClick={openCulturalIdentityForm}>
              Add Cultural Identity
            </Button>
          </EmptyState>
        )}
      </Section>
      
      <Section>
        <h3>Accessibility</h3>
        {identity.osot_disability && (
          <Badge>Disability accommodations may be needed</Badge>
        )}
      </Section>
    </ProfileCard>
  );
};
```

---

### Use Case 5: Admin Viewing Identity Records

**Scenario**: Admin reviewing user identity records with proper permissions

**Implementation**:
```tsx
const AdminIdentityList = () => {
  const [identities, setIdentities] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchIdentities = async () => {
      try {
        const response = await fetch(
          `/private/identities?page=${page}&limit=20`,
          {
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`
            }
          }
        );
        
        if (response.ok) {
          setIdentities(response.data);
        }
      } catch (error) {
        if (error.code === 'INSUFFICIENT_PRIVILEGE') {
          showError("You don't have permission to view identity records");
          navigate('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchIdentities();
  }, [page]);
  
  return (
    <AdminPanel>
      <Table>
        <thead>
          <tr>
            <th>Identity ID</th>
            <th>Chosen Name</th>
            <th>Languages</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {identities.map(identity => (
            <tr key={identity.osot_identity_id}>
              <td>{identity.osot_identity_id}</td>
              <td>{identity.osot_chosen_name || '-'}</td>
              <td>{identity.osot_language.join(', ')}</td>
              <td>{formatDate(identity.createdon)}</td>
              <td>
                <Button onClick={() => viewDetails(identity)}>
                  View Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      <Pagination
        page={page}
        onChange={setPage}
        total={identities.length}
      />
    </AdminPanel>
  );
};
```

---

## Cultural & Accessibility Features

### 1. Multi-Language Support

**Purpose**: Accommodate users' communication preferences

**Implementation**:
- Users can select multiple languages
- Content delivery respects language preferences
- Email communications use preferred language
- Interface localization based on primary language

**Best Practices**:
```typescript
// Use first language as primary
const primaryLanguage = identity.osot_language[0];

// Show all languages in profile
const allLanguages = identity.osot_language.join(', ');

// Check if user speaks specific language
const speaksFrench = identity.osot_language.includes('French');
```

---

### 2. Cultural Sensitivity

**Guidelines**:
- All cultural fields are **optional**
- "Prefer not to disclose" options available
- Clear messaging about optional nature
- Data used for inclusivity, not discrimination

**UI Messaging**:
```tsx
<FormSection>
  <Alert severity="info" icon={<InfoIcon />}>
    The following questions are optional and help us:
    <ul>
      <li>Understand our community demographics</li>
      <li>Improve our services for diverse populations</li>
      <li>Track our inclusivity efforts</li>
    </ul>
    You can skip any question or select "Prefer not to disclose".
  </Alert>
</FormSection>
```

---

### 3. Indigenous Identity Respect

**Special Considerations**:
- Three-tiered approach: Status → Detail → Other
- Allows specific self-identification
- Respects diverse Indigenous identities
- Free-text option for unlisted identities

**Conditional Logic**:
```tsx
{values.osot_indigenous && (
  <>
    <FormSelect
      name="osot_indigenous_detail"
      label="Which Indigenous identity do you identify with?"
      options={[
        { value: 1, label: 'First Nations' },
        { value: 2, label: 'Inuit' },
        { value: 3, label: 'Métis' },
        { value: 4, label: 'Other' }
      ]}
    />
    
    {values.osot_indigenous_detail === 4 && (
      <FormInput
        name="osot_indigenous_detail_other"
        label="Please specify your Indigenous identity"
        placeholder="e.g., Algonquin, Cree, Haudenosaunee"
        maxLength={100}
      />
    )}
  </>
)}
```

---

### 4. Accessibility Accommodations

**Purpose**: `osot_disability` field enables:
- Proactive accommodation planning
- Accessible event planning
- Communication accessibility
- Service adaptation

**Implementation**:
```tsx
// Event registration with accessibility
{identity.osot_disability && (
  <Alert severity="info">
    We see you've indicated you may need accessibility accommodations. 
    Please let us know specific requirements in the notes below.
  </Alert>
)}

<FormTextArea
  name="accessibilityNeeds"
  label="Accessibility Requirements"
  placeholder="e.g., wheelchair access, sign language interpreter, dietary restrictions"
/>
```

---

## Privacy & Security

### 1. Field-Level Privacy

**Internal Fields** (never exposed):
- `osot_table_identityid` - Internal GUID
- `osot_privilege` - System privilege level
- `ownerid` - System owner
- `osot_access_modifiers` - Future visibility controls

**Public Fields** (exposed via `IdentityPublicDto`):
- All user-facing identity fields
- Enum values converted to labels
- System IDs sanitized

---

### 2. Authentication Requirements

**Public Endpoints**:
- ✅ `POST /public/identities/create` - No auth (registration flow)
- ✅ `GET /public/identities/health` - No auth (health check)

**Private Endpoints**:
- 🔒 `GET /private/identities/me` - JWT required
- 🔒 `PATCH /private/identities/me` - JWT required
- 🔒 `GET /private/identities` - JWT + Admin privilege
- 🔒 `GET /private/identities/:id` - JWT + Admin privilege

---

### 3. Data Mapping & Sanitization

**Response Sanitization**:
```typescript
// Backend mapper strips internal fields
const publicDto = mapResponseDtoToPublicDto(internalIdentity);

// Result: Clean DTO without:
// - osot_privilege
// - osot_table_account
// - ownerid
// - Internal metadata
```

**Frontend Should**:
- Never attempt to send internal fields
- Never display system GUIDs to users
- Use enum labels, not raw values
- Respect optional field privacy

---

### 4. JWT Token Structure

**Token Payload** (for identity operations):
```typescript
{
  "userId": "abc123-def456",         // Account GUID
  "identityId": "osot-id-0000123",   // Identity public ID
  "privilege": 1,                     // Privilege level
  "role": "owner",                    // User role
  "email": "user@example.com",
  "iat": 1702821600,
  "exp": 1702908000
}
```

**Extraction in Frontend**:
```typescript
import jwtDecode from 'jwt-decode';

const token = localStorage.getItem('access_token');
const decoded = jwtDecode(token);

// Use userId for API calls
const response = await fetch('/private/identities/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Testing Checklist

### Unit Tests

- [ ] Language array validation (min 1, max 10)
- [ ] Chosen name format validation
- [ ] Indigenous fields consistency validation
- [ ] Enum value validation for all choice fields
- [ ] Max length validation for text fields

### Integration Tests

- [ ] Create identity during registration flow
- [ ] Get identity record with JWT
- [ ] Update identity with partial data
- [ ] Indigenous detail conditional logic
- [ ] Language multi-select functionality
- [ ] Enum endpoint integration

### UI/UX Tests

- [ ] Cultural identity form displays correctly
- [ ] Optional fields clearly marked
- [ ] Conditional fields show/hide properly
- [ ] Indigenous "other" field appears when selected
- [ ] Multi-select language picker works
- [ ] Privacy messaging displays
- [ ] Accessibility field honored in forms
- [ ] Error messages clear and helpful

### Security Tests

- [ ] Internal fields not exposed in responses
- [ ] JWT required for private endpoints
- [ ] Users can only access own identity
- [ ] Admin endpoints check privilege level
- [ ] Sensitive fields stripped from public DTOs

### Accessibility Tests

- [ ] All form fields keyboard navigable
- [ ] Screen reader compatible labels
- [ ] Clear focus indicators
- [ ] Logical tab order
- [ ] ARIA labels for custom controls

---

## Migration & Integration Notes

### For Existing Applications

#### 1. Update TypeScript Interfaces

```typescript
// OLD - Basic interface
interface User {
  id: string;
  name: string;
  email: string;
}

// NEW - Add identity
interface User {
  id: string;
  name: string;
  email: string;
  identity: {
    osot_identity_id: string;
    osot_chosen_name?: string;
    osot_language: string[];
    osot_gender?: string;
    osot_race?: string;
    osot_indigenous?: boolean;
    osot_indigenous_detail?: string;
    osot_disability?: boolean;
  };
}
```

---

#### 2. Fetch Identity on Login

```typescript
// After successful authentication
const authenticateUser = async (credentials) => {
  // Step 1: Login
  const authResponse = await login(credentials);
  const token = authResponse.token;
  
  // Step 2: Fetch identity
  const identityResponse = await fetch('/private/identities/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  // Step 3: Store in context/state
  setUser({
    account: authResponse.account,
    identity: identityResponse.data[0]  // Array with one record
  });
  
  return { token, identity: identityResponse.data[0] };
};
```

---

#### 3. Add Language Enum Fetch

```typescript
// Fetch language options on app init
const initializeApp = async () => {
  const languagesResponse = await fetch('/public/enums/languages');
  const gendersResponse = await fetch('/public/enums/genders');
  const racesResponse = await fetch('/public/enums/races');
  const indigenousResponse = await fetch('/public/enums/indigenous-details');
  
  setEnums({
    languages: languagesResponse.data,
    genders: gendersResponse.data,
    races: racesResponse.data,
    indigenousDetails: indigenousResponse.data
  });
};
```

---

#### 4. Profile Update Form

```typescript
// Identity update form
const IdentityUpdateForm = () => {
  const { identity } = useAuth();
  const [formData, setFormData] = useState(identity);
  
  const handleSubmit = async (values) => {
    try {
      const response = await fetch('/private/identities/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      
      if (response.ok) {
        showSuccess("Profile updated successfully");
        updateUserContext(response.data);
      }
    } catch (error) {
      handleError(error);
    }
  };
  
  return <Form initialValues={formData} onSubmit={handleSubmit} />;
};
```

---

## Support & Related Documentation

**Entity Structure**: See folder for detailed implementation
- **Constants**: `/constants/identity.constants.ts`
- **Validators**: `/validators/identity.validators.ts`
- **Business Rules**: `/services/identity-business-rule.service.ts`
- **Mappers**: `/mappers/identity.mapper.ts`

**Related Entities**:
- **Account**: Legal name, contact info, credentials
- **Membership**: Membership status, categories, payments

**Related Documentation**:
- `ORCHESTRATOR_INTEGRATION_GUIDE.md` - Registration flow integration
- `ARCHITECTURE_OVERVIEW.md` - Entity architecture details
- `FRONTEND_INTEGRATION_GUIDE.md` - General integration patterns

**Enum Endpoints**:
- `/public/enums/languages` - Language options (65 languages)
- `/public/enums/genders` - Gender identity options
- `/public/enums/races` - Racial identity options
- `/public/enums/indigenous-details` - Indigenous identity details

---

**Document Version**: 2.0  
**Last Reviewed**: December 17, 2025  
**Next Review**: March 2026

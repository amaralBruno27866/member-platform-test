# Membership Settings Entity - Frontend Integration Guide

**Last Updated**: December 17, 2025  
**Version**: 2.0 (Production)  
**Status**: ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Entity Purpose](#entity-purpose)
3. [Available Endpoints](#available-endpoints)
4. [Field Specifications](#field-specifications)
5. [Business Rules](#business-rules)
6. [Validation Rules](#validation-rules)
7. [Request/Response Examples](#requestresponse-examples)
8. [Error Handling](#error-handling)
9. [Use Cases](#use-cases)
10. [Privilege & Access Control](#privilege--access-control)
11. [Bulk Operations](#bulk-operations)
12. [Testing Checklist](#testing-checklist)

---

## Overview

The **Membership Settings** entity defines the annual membership year configuration for the organization. It controls membership periods, groups (Individual/Business), and status for each year.

### Key Characteristics

- **Year-Based Configuration**: Each record represents one membership year for one group
- **Two Membership Groups**: Individual (for personal accounts) and Business (for corporate affiliates)
- **Period Definition**: Defines start and end dates for membership validity
- **Status Management**: Active/Inactive/Pending status control
- **Auto-Generated IDs**: System generates unique `osot_settingsid` (e.g., "osot-set-0000001")
- **Admin-Only Management**: Requires Main or Admin privilege for modifications

### Critical Business Concept

**Group-Year Uniqueness**: Each combination of membership group and year must be unique.
- ✅ Valid: Individual 2025 + Business 2025 (different groups)
- ❌ Invalid: Two Individual 2025 records (duplicate)

---

## Entity Purpose

### What Membership Settings Defines

✅ **Annual Configuration**:
- Membership year (e.g., "2025")
- Year period (start date → end date)
- Status (Active/Inactive/Pending)

✅ **Group Differentiation**:
- Individual memberships (personal accounts)
- Business memberships (corporate affiliates)

✅ **System Controls**:
- Determines valid membership periods
- Controls membership registration availability
- Manages year-to-year transitions

### What Membership Settings DOES NOT Store

❌ Individual member records (stored in Membership Category)
❌ Membership pricing (stored in Product)
❌ Member personal data (stored in Account/Identity)
❌ Payment transactions (stored in Payment History)

### Relationship to Other Entities

```
Membership Settings (Configuration)
    ↓ defines periods for
Membership Category (Individual Records)
    ↓ linked to
Account/Affiliate (Members/Businesses)
```

---

## Available Endpoints

### Public Endpoints (No Authentication Required)

#### `GET /public/membership-settings/active`
Fetch all active membership settings

**Purpose**: Display available membership periods for registration forms

**Response**: Array of `MembershipSettingsResponseDto`

**Use Cases**:
- Membership registration forms
- Public membership information pages
- Year selection dropdowns

```typescript
// Response structure
[
  {
    osot_settingsid: "osot-set-0000001",
    osot_membership_year: "2025",
    osot_membership_group: "Individual",
    osot_year_starts: "2025-01-01",
    osot_year_ends: "2025-12-31",
    osot_membership_year_status: "Active"
  },
  {
    osot_settingsid: "osot-set-0000002",
    osot_membership_year: "2025",
    osot_membership_group: "Business",
    osot_year_starts: "2025-01-01",
    osot_year_ends: "2025-12-31",
    osot_membership_year_status: "Active"
  }
]
```

---

#### `GET /public/membership-settings/active/group/:group`
Fetch active membership settings filtered by group

**Parameters**:
- `group: number` - MembershipGroup enum (1=Individual, 2=Business)

**Purpose**: Display group-specific membership options

**Examples**:
```typescript
// Individual memberships only
GET /public/membership-settings/active/group/1

// Business memberships only
GET /public/membership-settings/active/group/2
```

---

### Private Endpoints (Admin Only - JWT Required)

#### `GET /private/membership-settings/my-expiration`
Get membership expiration date for authenticated user

**Authentication**: JWT Bearer token required

**Response**:
```typescript
{
  expiresDate: "2025-12-31",       // YYYY-MM-DD
  daysRemaining: 348,              // Days until expiration
  status: "Active",                // Membership status
  membershipYear: "2025"           // Current membership year
}
```

**Use Case**: Display user's membership expiration countdown

---

#### `POST /private/membership-settings`
Create new membership settings record

**Authentication**: JWT + **Main privilege** required

**Request Body**: `CreateMembershipSettingsDto`

```typescript
{
  osot_membership_year: string;          // Required, 4 chars (e.g., "2025")
  osot_membership_year_status: number;   // Required, AccountStatus enum
  osot_membership_group: number;         // Required, MembershipGroup enum
  osot_year_starts: string;              // Required, ISO date (YYYY-MM-DD)
  osot_year_ends: string;                // Required, ISO date (YYYY-MM-DD)
}
```

**Business Rules Enforced**:
- Group-year combination must be unique
- Year end date must be after year start date
- Year must be within valid range (2020 - currentYear+5)

---

#### `POST /private/membership-settings/bulk`
Create multiple membership settings in one request

**Authentication**: JWT + **Main privilege** required

**Request Body**: `BulkCreateMembershipSettingsDto`

```typescript
{
  settings: [
    {
      osot_membership_year: "2025",
      osot_membership_year_status: 1,
      osot_membership_group: 1,
      osot_year_starts: "2025-01-01",
      osot_year_ends: "2025-12-31"
    },
    {
      osot_membership_year: "2025",
      osot_membership_year_status: 1,
      osot_membership_group: 2,
      osot_year_starts: "2025-01-01",
      osot_year_ends: "2025-12-31"
    }
  ]
}
```

**Limits**:
- Minimum: 1 setting
- Maximum: 50 settings per request
- All-or-nothing transaction

---

#### `GET /private/membership-settings`
List all membership settings with filtering and pagination

**Authentication**: JWT + **Admin or Main privilege** required

**Query Parameters**:
```typescript
{
  group?: number;        // Filter by MembershipGroup (1 or 2)
  year?: string;         // Filter by year (e.g., "2025")
  status?: string;       // Filter by status ("active", "inactive", "pending")
  page?: number;         // Page number (default: 1)
  limit?: number;        // Results per page (default: 10)
  sortBy?: string;       // Sort field (default: "osot_membership_year")
  sortOrder?: string;    // Sort direction ("asc" or "desc")
}
```

**Examples**:
```typescript
// All settings for 2025
GET /private/membership-settings?year=2025

// Active Individual memberships
GET /private/membership-settings?group=1&status=active

// Paginated results, sorted by year descending
GET /private/membership-settings?page=1&limit=20&sortBy=osot_membership_year&sortOrder=desc
```

---

#### `GET /private/membership-settings/:id`
Get specific membership settings by ID

**Authentication**: JWT + **Admin or Main privilege** required

**Parameters**:
- `id: string` - Settings GUID (`osot_table_membership_settingid`)

---

#### `PATCH /private/membership-settings/:id`
Update existing membership settings

**Authentication**: JWT + **Admin or Main privilege** required

**Request Body**: `UpdateMembershipSettingsDto` (all fields optional)

```typescript
{
  osot_membership_year?: string;
  osot_membership_year_status?: number;
  osot_membership_group?: number;
  osot_year_starts?: string;
  osot_year_ends?: string;
}
```

**Partial Updates**: Send only the fields you want to update

---

#### `DELETE /private/membership-settings/:id`
Delete (soft delete) membership settings

**Authentication**: JWT + **Main privilege** required

**Effect**: Sets status to Inactive rather than hard delete

---

## Field Specifications

### 🔑 System Fields (Auto-Generated, Read-Only)

| Field | Type | Description |
|-------|------|-------------|
| `osot_table_membership_settingid` | `string` (UUID) | Internal GUID for Dataverse relationships |
| `osot_settingsid` | `string` | Auto-number ID (format: "osot-set-0000001") |
| `createdon` | `Date` | System creation timestamp |
| `modifiedon` | `Date` | System modification timestamp |
| `ownerid` | `string` | System owner (managed by Dataverse) |

**⚠️ Important**: These fields are **auto-generated**. Frontend should never send them in create/update requests.

---

### 📅 Business Fields (Required)

#### `osot_membership_year` (string, required)

**Purpose**: The membership year this configuration represents

**Type**: Text field (4 characters)

**Validation**:
- ✅ Required field
- ✅ Must be 4 characters
- ✅ Must be a valid year number
- ✅ Range: 2020 to (current year + 5)

**Format**: `"2025"`, `"2026"`, etc.

**Examples**:
```typescript
// Valid
osot_membership_year: "2025"
osot_membership_year: "2026"

// Invalid
osot_membership_year: "25"      // Too short
osot_membership_year: "20250"   // Too long
osot_membership_year: "2050"    // Beyond max range
```

---

#### `osot_membership_year_status` (enum, required)

**Purpose**: Status of the membership year configuration

**Type**: `AccountStatus` enum value

**Validation**:
- ✅ Required field
- ✅ Must be valid AccountStatus enum value

**Enum Values** (fetch from `/public/enums/account-statuses`):
```typescript
enum AccountStatus {
  ACTIVE = 1,      // Membership year is active and open for registration
  INACTIVE = 2,    // Membership year is inactive (closed)
  PENDING = 3      // Membership year is pending (future/preparation)
}
```

**Usage**:
- **Active**: Current or active membership periods
- **Inactive**: Past or closed periods (soft delete)
- **Pending**: Future periods in preparation

---

#### `osot_membership_group` (enum, required)

**Purpose**: Membership group type (Individual vs Business)

**Type**: `MembershipGroup` enum value

**Validation**:
- ✅ Required field
- ✅ Must be valid MembershipGroup enum value

**Enum Values** (fetch from `/public/enums/membership-groups`):
```typescript
enum MembershipGroup {
  INDIVIDUAL = 1,    // Individual/personal memberships (linked to Accounts)
  BUSINESS = 2       // Business/corporate memberships (linked to Affiliates)
}
```

**Business Rule**: Group + Year combination must be unique
```typescript
// Valid scenario
Record 1: { group: 1, year: "2025" }  // Individual 2025
Record 2: { group: 2, year: "2025" }  // Business 2025

// Invalid scenario (duplicate)
Record 1: { group: 1, year: "2025" }  // Individual 2025
Record 2: { group: 1, year: "2025" }  // ❌ Duplicate Individual 2025
```

---

#### `osot_year_starts` (date, required)

**Purpose**: Membership year period start date

**Type**: ISO date string (date only, no time)

**Validation**:
- ✅ Required field
- ✅ Must be valid ISO date format (YYYY-MM-DD)
- ✅ Must be before `osot_year_ends`

**Format**: `"2025-01-01"`

**Example**:
```typescript
osot_year_starts: "2025-01-01"  // January 1, 2025
```

---

#### `osot_year_ends` (date, required)

**Purpose**: Membership year period end date

**Type**: ISO date string (date only, no time)

**Validation**:
- ✅ Required field
- ✅ Must be valid ISO date format (YYYY-MM-DD)
- ✅ Must be after `osot_year_starts`

**Format**: `"2025-12-31"`

**Example**:
```typescript
osot_year_ends: "2025-12-31"  // December 31, 2025
```

**Business Rule**: Year period validation
```typescript
// Valid
osot_year_starts: "2025-01-01"
osot_year_ends: "2025-12-31"     // ✅ End after start

// Invalid
osot_year_starts: "2025-12-31"
osot_year_ends: "2025-01-01"     // ❌ End before start
```

---

### 🔒 Internal Fields (NOT Exposed to Frontend)

These fields exist in the backend but are **never exposed** in public/private responses:

- `osot_privilege` (enum): Internal privilege level
- `osot_access_modifiers` (enum): Internal access controls

**⚠️ Security**: These fields are for internal system use only and are stripped from all API responses.

---

## Business Rules

### 1. Group-Year Uniqueness Constraint

**Rule**: Each combination of membership group and year must be unique

**Enforcement**: Database constraint + service-layer validation

**Validation**:
```typescript
// Backend validates before creation/update
const exists = await checkDuplicateGroupYear(group, year);
if (exists) {
  throw new Error(
    `Membership settings for ${groupName} ${year} already exists`
  );
}
```

**Frontend Handling**:
```typescript
const handleCreateSettings = async (formData) => {
  try {
    await createMembershipSettings(formData);
  } catch (error) {
    if (error.code === 'DUPLICATE_GROUP_YEAR') {
      showError(
        `Settings for ${formData.group} ${formData.year} already exist. ` +
        `Please edit the existing record or choose a different year/group.`
      );
    }
  }
};
```

---

### 2. Year Period Validation

**Rule**: End date must be after start date

**Enforcement**: DTO validation + custom validator

**Validation**:
```typescript
// Backend validator
if (osot_year_ends <= osot_year_starts) {
  return ValidationError(
    "Year end date must be after year start date"
  );
}
```

**Frontend Implementation**:
```tsx
<FormDatePicker
  name="osot_year_starts"
  label="Year Start Date *"
  required
/>

<FormDatePicker
  name="osot_year_ends"
  label="Year End Date *"
  required
  minDate={values.osot_year_starts}  // Enforce end > start
  helperText="Must be after start date"
/>
```

---

### 3. Year Range Validation

**Rule**: Year must be within valid business range (2020 to currentYear+5)

**Rationale**: 
- Past years: Support historical data (2020+)
- Future years: Allow 5 years advance planning

**Validation**:
```typescript
const MEMBERSHIP_YEAR_RANGE = {
  MIN_YEAR: 2020,
  MAX_YEAR: new Date().getFullYear() + 5
};

// Example in 2025:
// Valid range: 2020 - 2030
// Invalid: 2019 (too old), 2031 (too far future)
```

**Frontend Year Picker**:
```tsx
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  for (let year = 2020; year <= currentYear + 5; year++) {
    years.push({
      value: String(year),
      label: String(year)
    });
  }
  
  return years;
};

<FormSelect
  name="osot_membership_year"
  label="Membership Year *"
  options={generateYearOptions()}
  required
/>
```

---

### 4. Status-Based Access Control

**Rule**: Only active settings are exposed via public endpoints

**Enforcement**: Repository query filter

**Implementation**:
```typescript
// Public endpoint automatically filters by status
GET /public/membership-settings/active
// Returns only records where osot_membership_year_status === AccountStatus.ACTIVE

// Private endpoint can access all statuses
GET /private/membership-settings?status=inactive
// Admin can view inactive/pending records
```

---

## Validation Rules

### Field-Level Validations

```typescript
// CreateMembershipSettingsDto Validation Rules

osot_membership_year: {
  required: true,
  type: 'string',
  maxLength: 4,
  validator: MembershipYearValidator,
  pattern: /^\d{4}$/,
  range: { min: 2020, max: currentYear + 5 }
}

osot_membership_year_status: {
  required: true,
  enum: AccountStatus,
  validator: MembershipYearStatusValidator,
  values: [1, 2, 3]  // ACTIVE, INACTIVE, PENDING
}

osot_membership_group: {
  required: true,
  enum: MembershipGroup,
  validator: MembershipGroupValidator,
  values: [1, 2]  // INDIVIDUAL, BUSINESS
}

osot_year_starts: {
  required: true,
  type: 'date-string',
  format: 'YYYY-MM-DD',
  validator: IsDateString
}

osot_year_ends: {
  required: true,
  type: 'date-string',
  format: 'YYYY-MM-DD',
  validator: IsDateString,
  crossField: { mustBeAfter: 'osot_year_starts' }
}
```

---

### Custom Validators

#### MembershipYearValidator
- Validates year format (4 digits)
- Checks year range (2020 to currentYear+5)
- Required field

#### MembershipYearStatusValidator
- Validates against AccountStatus enum
- Ensures valid status value (1, 2, or 3)
- Required field

#### MembershipGroupValidator
- Validates against MembershipGroup enum
- Ensures valid group value (1 or 2)
- Required field

---

## Request/Response Examples

### Example 1: Create Individual Membership Settings for 2025

**Request**: `POST /private/membership-settings`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN_WITH_MAIN_PRIVILEGE>
Content-Type: application/json
```

**Body**:
```json
{
  "osot_membership_year": "2025",
  "osot_membership_year_status": 1,
  "osot_membership_group": 1,
  "osot_year_starts": "2025-01-01",
  "osot_year_ends": "2025-12-31"
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "osot_settingsid": "osot-set-0000123",
    "osot_membership_year": "2025",
    "osot_membership_group": "Individual",
    "osot_year_starts": "2025-01-01",
    "osot_year_ends": "2025-12-31",
    "osot_membership_year_status": "Active"
  },
  "message": "Membership settings created successfully"
}
```

---

### Example 2: Bulk Create Settings for 2025 (Both Groups)

**Request**: `POST /private/membership-settings/bulk`

**Body**:
```json
{
  "settings": [
    {
      "osot_membership_year": "2025",
      "osot_membership_year_status": 1,
      "osot_membership_group": 1,
      "osot_year_starts": "2025-01-01",
      "osot_year_ends": "2025-12-31"
    },
    {
      "osot_membership_year": "2025",
      "osot_membership_year_status": 1,
      "osot_membership_group": 2,
      "osot_year_starts": "2025-01-01",
      "osot_year_ends": "2025-12-31"
    }
  ]
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "created": 2,
    "results": [
      {
        "osot_settingsid": "osot-set-0000123",
        "osot_membership_year": "2025",
        "osot_membership_group": "Individual"
      },
      {
        "osot_settingsid": "osot-set-0000124",
        "osot_membership_year": "2025",
        "osot_membership_group": "Business"
      }
    ]
  },
  "message": "2 membership settings created successfully"
}
```

---

### Example 3: Fetch Active Settings for Public Registration

**Request**: `GET /public/membership-settings/active`

**Response**: `200 OK`

```json
[
  {
    "osot_settingsid": "osot-set-0000123",
    "osot_membership_year": "2025",
    "osot_membership_group": "Individual",
    "osot_year_starts": "2025-01-01",
    "osot_year_ends": "2025-12-31",
    "osot_membership_year_status": "Active"
  },
  {
    "osot_settingsid": "osot-set-0000124",
    "osot_membership_year": "2025",
    "osot_membership_group": "Business",
    "osot_year_starts": "2025-01-01",
    "osot_year_ends": "2025-12-31",
    "osot_membership_year_status": "Active"
  },
  {
    "osot_settingsid": "osot-set-0000125",
    "osot_membership_year": "2026",
    "osot_membership_group": "Individual",
    "osot_year_starts": "2026-01-01",
    "osot_year_ends": "2026-12-31",
    "osot_membership_year_status": "Active"
  }
]
```

---

### Example 4: Filter Active Individual Memberships

**Request**: `GET /public/membership-settings/active/group/1`

**Response**: `200 OK`

```json
[
  {
    "osot_settingsid": "osot-set-0000123",
    "osot_membership_year": "2025",
    "osot_membership_group": "Individual",
    "osot_year_starts": "2025-01-01",
    "osot_year_ends": "2025-12-31",
    "osot_membership_year_status": "Active"
  },
  {
    "osot_settingsid": "osot-set-0000125",
    "osot_membership_year": "2026",
    "osot_membership_group": "Individual",
    "osot_year_starts": "2026-01-01",
    "osot_year_ends": "2026-12-31",
    "osot_membership_year_status": "Active"
  }
]
```

---

### Example 5: Update Settings Status to Inactive

**Request**: `PATCH /private/membership-settings/:id`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN_WITH_ADMIN_OR_MAIN>
```

**Body**:
```json
{
  "osot_membership_year_status": 2
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "osot_settingsid": "osot-set-0000123",
    "osot_membership_year": "2025",
    "osot_membership_group": "Individual",
    "osot_year_starts": "2025-01-01",
    "osot_year_ends": "2025-12-31",
    "osot_membership_year_status": "Inactive"
  },
  "message": "Membership settings updated successfully"
}
```

---

### Example 6: Get My Membership Expiration

**Request**: `GET /private/membership-settings/my-expiration`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**: `200 OK`

```json
{
  "expiresDate": "2025-12-31",
  "daysRemaining": 348,
  "status": "Active",
  "membershipYear": "2025"
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
        "field": "osot_membership_year",
        "message": "Membership year must be a valid year between 2020 and 2030"
      },
      {
        "field": "osot_year_ends",
        "message": "Year end date must be after year start date"
      }
    ]
  }
}
```

---

### Business Rule Violations

**HTTP 409 - Conflict (Duplicate Group-Year)**

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_GROUP_YEAR",
    "message": "Membership settings for Individual 2025 already exists",
    "details": {
      "group": "Individual",
      "year": "2025",
      "existingSettingsId": "osot-set-0000123"
    }
  }
}
```

---

### Permission Errors

**HTTP 403 - Forbidden (Insufficient Privilege)**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PRIVILEGE",
    "message": "User does not have permission to create membership settings (Main privilege required)",
    "details": {
      "requiredPrivilege": "Main",
      "userPrivilege": "Owner",
      "operation": "create"
    }
  }
}
```

---

### Not Found Errors

**HTTP 404 - Settings Not Found**

```json
{
  "success": false,
  "error": {
    "code": "SETTINGS_NOT_FOUND",
    "message": "Membership settings record not found",
    "details": {
      "settingsId": "abc123-def456-ghi789"
    }
  }
}
```

---

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_YEAR_RANGE` | 400 | Year outside valid range (2020 to currentYear+5) |
| `INVALID_DATE_PERIOD` | 400 | End date before start date |
| `DUPLICATE_GROUP_YEAR` | 409 | Group-year combination already exists |
| `SETTINGS_NOT_FOUND` | 404 | Settings record does not exist |
| `INSUFFICIENT_PRIVILEGE` | 403 | User lacks required privilege level |
| `BULK_OPERATION_LIMIT_EXCEEDED` | 400 | Bulk create exceeds 50 settings limit |

---

## Use Cases

### Use Case 1: Public Membership Registration Form

**Scenario**: Public website displays available membership years for registration

**Implementation**:
```tsx
const MembershipRegistrationForm = () => {
  const [settings, setSettings] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(MembershipGroup.INDIVIDUAL);
  
  useEffect(() => {
    const fetchSettings = async () => {
      // Fetch active settings filtered by group
      const response = await fetch(
        `/public/membership-settings/active/group/${selectedGroup}`
      );
      setSettings(response.data);
    };
    fetchSettings();
  }, [selectedGroup]);
  
  return (
    <Form>
      <h2>Membership Registration</h2>
      
      <FormRadioGroup
        label="Membership Type"
        value={selectedGroup}
        onChange={setSelectedGroup}
        options={[
          { value: 1, label: 'Individual Membership' },
          { value: 2, label: 'Business Membership' }
        ]}
      />
      
      {settings.length > 0 ? (
        <FormSelect
          label="Membership Year"
          name="membershipYear"
          required
          options={settings.map(s => ({
            value: s.osot_settingsid,
            label: `${s.osot_membership_year} (${s.osot_year_starts} to ${s.osot_year_ends})`
          }))}
        />
      ) : (
        <Alert severity="warning">
          No active membership periods available for {
            selectedGroup === 1 ? 'Individual' : 'Business'
          } membership.
        </Alert>
      )}
      
      <Button type="submit">Continue to Payment</Button>
    </Form>
  );
};
```

---

### Use Case 2: Admin Annual Setup (Bulk Create)

**Scenario**: Admin creates membership settings for new year (both groups at once)

**Implementation**:
```tsx
const AnnualSetupWizard = () => {
  const [year, setYear] = useState(String(new Date().getFullYear() + 1));
  const [loading, setLoading] = useState(false);
  
  const handleSetupYear = async () => {
    setLoading(true);
    
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    try {
      // Create settings for both groups in one request
      const response = await fetch('/private/membership-settings/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: [
            {
              osot_membership_year: year,
              osot_membership_year_status: AccountStatus.PENDING,  // Start as pending
              osot_membership_group: MembershipGroup.INDIVIDUAL,
              osot_year_starts: startDate,
              osot_year_ends: endDate
            },
            {
              osot_membership_year: year,
              osot_membership_year_status: AccountStatus.PENDING,
              osot_membership_group: MembershipGroup.BUSINESS,
              osot_year_starts: startDate,
              osot_year_ends: endDate
            }
          ]
        })
      });
      
      if (response.ok) {
        showSuccess(`Membership year ${year} configured successfully for both groups!`);
        navigate('/admin/membership-settings');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <h2>Setup New Membership Year</h2>
      
      <FormSelect
        label="Year to Setup"
        value={year}
        onChange={setYear}
        options={generateFutureYearOptions(5)}
      />
      
      <Alert severity="info">
        This will create membership settings for <strong>both Individual and Business</strong> groups
        for the year {year}, with a period from January 1 to December 31.
        Settings will be created with <strong>Pending</strong> status.
      </Alert>
      
      <PreviewSection>
        <h3>Preview</h3>
        <ul>
          <li>Individual Membership {year}: Jan 1 - Dec 31 (Pending)</li>
          <li>Business Membership {year}: Jan 1 - Dec 31 (Pending)</li>
        </ul>
      </PreviewSection>
      
      <Button
        onClick={handleSetupYear}
        loading={loading}
        disabled={loading}
      >
        Create Membership Year Settings
      </Button>
    </Card>
  );
};
```

---

### Use Case 3: Admin Settings Management Dashboard

**Scenario**: Admin views and manages all membership settings with filtering

**Implementation**:
```tsx
const MembershipSettingsDashboard = () => {
  const [settings, setSettings] = useState([]);
  const [filters, setFilters] = useState({
    year: '',
    group: '',
    status: ''
  });
  const [page, setPage] = useState(1);
  
  useEffect(() => {
    const fetchSettings = async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      });
      
      const response = await fetch(
        `/private/membership-settings?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        }
      );
      
      setSettings(response.data);
    };
    
    fetchSettings();
  }, [filters, page]);
  
  const handleActivateSettings = async (settingsId: string) => {
    try {
      await fetch(`/private/membership-settings/${settingsId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          osot_membership_year_status: AccountStatus.ACTIVE
        })
      });
      
      showSuccess('Settings activated successfully');
      // Refresh list
    } catch (error) {
      handleError(error);
    }
  };
  
  return (
    <AdminPanel>
      <h1>Membership Settings Management</h1>
      
      <FilterBar>
        <FormSelect
          label="Year"
          value={filters.year}
          onChange={(value) => setFilters({ ...filters, year: value })}
          options={[
            { value: '', label: 'All Years' },
            ...generateYearOptions()
          ]}
        />
        
        <FormSelect
          label="Group"
          value={filters.group}
          onChange={(value) => setFilters({ ...filters, group: value })}
          options={[
            { value: '', label: 'All Groups' },
            { value: '1', label: 'Individual' },
            { value: '2', label: 'Business' }
          ]}
        />
        
        <FormSelect
          label="Status"
          value={filters.status}
          onChange={(value) => setFilters({ ...filters, status: value })}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' }
          ]}
        />
      </FilterBar>
      
      <Table>
        <thead>
          <tr>
            <th>Settings ID</th>
            <th>Year</th>
            <th>Group</th>
            <th>Period</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {settings.map(setting => (
            <tr key={setting.osot_settingsid}>
              <td>{setting.osot_settingsid}</td>
              <td>{setting.osot_membership_year}</td>
              <td>{setting.osot_membership_group}</td>
              <td>
                {formatDate(setting.osot_year_starts)} - {formatDate(setting.osot_year_ends)}
              </td>
              <td>
                <StatusBadge status={setting.osot_membership_year_status} />
              </td>
              <td>
                {setting.osot_membership_year_status === 'Pending' && (
                  <Button onClick={() => handleActivateSettings(setting.osot_settingsid)}>
                    Activate
                  </Button>
                )}
                <Button onClick={() => editSettings(setting)}>Edit</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      <Pagination
        page={page}
        onChange={setPage}
        total={settings.length}
      />
    </AdminPanel>
  );
};
```

---

### Use Case 4: User Dashboard - Membership Expiration Display

**Scenario**: User sees their membership expiration countdown

**Implementation**:
```tsx
const MembershipExpirationWidget = () => {
  const [expiration, setExpiration] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchExpiration = async () => {
      try {
        const response = await fetch('/private/membership-settings/my-expiration', {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        });
        setExpiration(response);
      } catch (error) {
        console.error('Failed to fetch expiration:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpiration();
  }, []);
  
  if (loading) return <LoadingSpinner />;
  if (!expiration) return null;
  
  const isExpiringSoon = expiration.daysRemaining <= 30;
  const isExpired = expiration.daysRemaining <= 0;
  
  return (
    <Card severity={isExpired ? 'error' : isExpiringSoon ? 'warning' : 'info'}>
      <h3>Membership Status</h3>
      
      {isExpired ? (
        <>
          <Alert severity="error">
            Your membership expired on {formatDate(expiration.expiresDate)}
          </Alert>
          <Button variant="primary" onClick={() => navigate('/membership/renew')}>
            Renew Now
          </Button>
        </>
      ) : (
        <>
          <p>
            Your {expiration.membershipYear} membership expires on{' '}
            <strong>{formatDate(expiration.expiresDate)}</strong>
          </p>
          
          <CountdownDisplay>
            <CountdownNumber>{expiration.daysRemaining}</CountdownNumber>
            <CountdownLabel>days remaining</CountdownLabel>
          </CountdownDisplay>
          
          {isExpiringSoon && (
            <Alert severity="warning">
              Your membership expires in less than 30 days. Renew now to avoid interruption.
            </Alert>
          )}
          
          <Button onClick={() => navigate('/membership/renew')}>
            Renew Early
          </Button>
        </>
      )}
    </Card>
  );
};
```

---

### Use Case 5: Year-End Transition (Deactivate Old, Activate New)

**Scenario**: Admin transitions from current year to next year membership

**Implementation**:
```tsx
const YearTransitionTool = () => {
  const [currentYearSettings, setCurrentYearSettings] = useState([]);
  const [nextYearSettings, setNextYearSettings] = useState([]);
  const [transitionDate, setTransitionDate] = useState('');
  
  const handleTransition = async () => {
    try {
      // Confirm action
      const confirmed = await showConfirmDialog({
        title: 'Confirm Year Transition',
        message: `This will deactivate all ${getCurrentYear()} settings and activate all ${getNextYear()} settings. This action cannot be undone easily.`,
        confirmText: 'Proceed with Transition'
      });
      
      if (!confirmed) return;
      
      // Deactivate current year settings
      await Promise.all(
        currentYearSettings.map(setting =>
          fetch(`/private/membership-settings/${setting.osot_table_membership_settingid}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              osot_membership_year_status: AccountStatus.INACTIVE
            })
          })
        )
      );
      
      // Activate next year settings
      await Promise.all(
        nextYearSettings.map(setting =>
          fetch(`/private/membership-settings/${setting.osot_table_membership_settingid}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              osot_membership_year_status: AccountStatus.ACTIVE
            })
          })
        )
      );
      
      showSuccess('Year transition completed successfully!');
      // Refresh settings
    } catch (error) {
      showError('Year transition failed. Please check and try again.');
      console.error(error);
    }
  };
  
  return (
    <Card>
      <h2>Year-End Transition Tool</h2>
      
      <Alert severity="warning">
        <strong>Important:</strong> This tool deactivates current year settings 
        and activates next year settings. Use carefully during year-end transition.
      </Alert>
      
      <TransitionPreview>
        <Column>
          <h3>Current Year ({getCurrentYear()})</h3>
          <StatusBadge status="Active">Active</StatusBadge>
          <ul>
            {currentYearSettings.map(s => (
              <li key={s.osot_settingsid}>
                {s.osot_membership_group} - Will be deactivated
              </li>
            ))}
          </ul>
        </Column>
        
        <Arrow>→</Arrow>
        
        <Column>
          <h3>Next Year ({getNextYear()})</h3>
          <StatusBadge status="Pending">Pending</StatusBadge>
          <ul>
            {nextYearSettings.map(s => (
              <li key={s.osot_settingsid}>
                {s.osot_membership_group} - Will be activated
              </li>
            ))}
          </ul>
        </Column>
      </TransitionPreview>
      
      <FormDatePicker
        label="Transition Date"
        value={transitionDate}
        onChange={setTransitionDate}
        helperText="When should the transition occur?"
      />
      
      <Button
        variant="primary"
        onClick={handleTransition}
        disabled={!transitionDate || nextYearSettings.length === 0}
      >
        Execute Year Transition
      </Button>
    </Card>
  );
};
```

---

## Privilege & Access Control

### Privilege Levels

The system uses three privilege levels for access control:

```typescript
enum Privilege {
  OWNER = 1,    // Basic user - read-only access to active settings
  ADMIN = 2,    // Administrator - read and update access
  MAIN = 3      // Main admin - full CRUD access
}
```

### Permission Matrix

| Operation | Endpoint | Owner | Admin | Main |
|-----------|----------|-------|-------|------|
| View Active Settings (Public) | `GET /public/membership-settings/active` | ✅ | ✅ | ✅ |
| View My Expiration | `GET /private/membership-settings/my-expiration` | ✅ | ✅ | ✅ |
| List All Settings | `GET /private/membership-settings` | ❌ | ✅ | ✅ |
| Get Settings by ID | `GET /private/membership-settings/:id` | ❌ | ✅ | ✅ |
| **Create** Settings | `POST /private/membership-settings` | ❌ | ❌ | ✅ |
| **Bulk Create** Settings | `POST /private/membership-settings/bulk` | ❌ | ❌ | ✅ |
| **Update** Settings | `PATCH /private/membership-settings/:id` | ❌ | ✅ | ✅ |
| **Delete** Settings | `DELETE /private/membership-settings/:id` | ❌ | ❌ | ✅ |

### Frontend Permission Checks

```tsx
const MembershipSettingsAdmin = () => {
  const { user } = useAuth();
  const canCreate = user.privilege === Privilege.MAIN;
  const canUpdate = user.privilege >= Privilege.ADMIN;
  
  return (
    <div>
      {canCreate && (
        <Button onClick={createNewSettings}>
          Create New Settings
        </Button>
      )}
      
      <SettingsList
        canEdit={canUpdate}
        canDelete={canCreate}
      />
    </div>
  );
};

// Permission utility
const checkPermission = (operation: string, userPrivilege: Privilege) => {
  const permissions = {
    create: [Privilege.MAIN],
    update: [Privilege.ADMIN, Privilege.MAIN],
    delete: [Privilege.MAIN],
    read: [Privilege.ADMIN, Privilege.MAIN]
  };
  
  return permissions[operation]?.includes(userPrivilege) ?? false;
};
```

---

## Bulk Operations

### Bulk Create Specifications

**Endpoint**: `POST /private/membership-settings/bulk`

**Limits**:
- Minimum: 1 setting
- Maximum: 50 settings per request

**Validation**:
- Each setting validated individually
- Group-year uniqueness enforced across batch
- All-or-nothing transaction (if one fails, all fail)

**Use Cases**:
- Annual setup (create multiple years/groups at once)
- Initial system configuration
- CSV import operations

**Example - Setup Multiple Years**:
```typescript
const setupMultipleYears = async (years: string[]) => {
  const settings = years.flatMap(year => [
    {
      osot_membership_year: year,
      osot_membership_year_status: AccountStatus.PENDING,
      osot_membership_group: MembershipGroup.INDIVIDUAL,
      osot_year_starts: `${year}-01-01`,
      osot_year_ends: `${year}-12-31`
    },
    {
      osot_membership_year: year,
      osot_membership_year_status: AccountStatus.PENDING,
      osot_membership_group: MembershipGroup.BUSINESS,
      osot_year_starts: `${year}-01-01`,
      osot_year_ends: `${year}-12-31`
    }
  ]);
  
  try {
    const response = await fetch('/private/membership-settings/bulk', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ settings })
    });
    
    if (response.ok) {
      showSuccess(`Created settings for ${years.length} years (${settings.length} total records)`);
    }
  } catch (error) {
    handleError(error);
  }
};

// Usage: Setup 2025, 2026, 2027
setupMultipleYears(['2025', '2026', '2027']);
```

---

## Testing Checklist

### Unit Tests

- [ ] Year validation (4 chars, numeric, within range)
- [ ] Date validation (start before end)
- [ ] Enum validation (group, status)
- [ ] Group-year uniqueness validation
- [ ] Bulk create validation (min 1, max 50)

### Integration Tests

- [ ] Create settings with valid data
- [ ] Create duplicate group-year (should fail)
- [ ] Update settings status
- [ ] Fetch active settings (public endpoint)
- [ ] Filter by group
- [ ] Bulk create multiple settings
- [ ] Permission checks (Owner/Admin/Main)

### UI/UX Tests

- [ ] Registration form displays active settings
- [ ] Year dropdown shows valid range
- [ ] Date pickers enforce end > start
- [ ] Group selector works correctly
- [ ] Status changes reflect immediately
- [ ] Permission-based UI rendering
- [ ] Expiration countdown displays
- [ ] Error messages clear and helpful

### Security Tests

- [ ] Public endpoints accessible without auth
- [ ] Private endpoints require JWT
- [ ] Create requires Main privilege
- [ ] Update requires Admin/Main privilege
- [ ] Delete requires Main privilege
- [ ] Internal fields not exposed in responses

---

## Migration & Integration Notes

### Fetching Enum Options

```typescript
// App initialization
const initEnums = async () => {
  const [groups, statuses] = await Promise.all([
    fetch('/public/enums/membership-groups'),
    fetch('/public/enums/account-statuses')
  ]);
  
  return {
    groups: groups.data,    // [{ value: 1, label: 'Individual' }, ...]
    statuses: statuses.data // [{ value: 1, label: 'Active' }, ...]
  };
};
```

### Fetching Active Settings on App Load

```typescript
// Store or Context
const MembershipSettingsContext = createContext();

export const MembershipSettingsProvider = ({ children }) => {
  const [activeSettings, setActiveSettings] = useState([]);
  
  useEffect(() => {
    const fetchActiveSettings = async () => {
      const response = await fetch('/public/membership-settings/active');
      setActiveSettings(response);
    };
    fetchActiveSettings();
  }, []);
  
  return (
    <MembershipSettingsContext.Provider value={{ activeSettings }}>
      {children}
    </MembershipSettingsContext.Provider>
  );
};

// Usage in components
const { activeSettings } = useContext(MembershipSettingsContext);
```

---

## Support & Related Documentation

**Entity Structure**: See folder for detailed implementation
- **Constants**: `/constants/membership-settings.constants.ts`
- **Validators**: `/validators/membership-settings.validators.ts`
- **Business Rules**: `/services/membership-settings-business-rules.service.ts`

**Related Entities**:
- **Membership Category**: Individual membership records
- **Affiliate**: Business membership records
- **Product**: Membership pricing

**Related Documentation**:
- `MEMBERSHIP_SETTINGS_README.md` - Architecture overview
- `FRONTEND_INTEGRATION_GUIDE.md` - General integration patterns

**Enum Endpoints**:
- `/public/enums/membership-groups` - Group options (Individual/Business)
- `/public/enums/account-statuses` - Status options (Active/Inactive/Pending)

---

**Document Version**: 2.0  
**Last Reviewed**: December 17, 2025  
**Next Review**: March 2026

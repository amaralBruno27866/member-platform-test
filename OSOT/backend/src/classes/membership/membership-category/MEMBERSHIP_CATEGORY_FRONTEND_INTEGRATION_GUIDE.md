# Membership Category Entity - Frontend Integration Guide

**Last Updated**: December 17, 2025  
**Version**: 2.0 (Production)  
**Status**: ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Entity Purpose](#entity-purpose)
3. [Three-Step Process](#three-step-process)
4. [Available Endpoints](#available-endpoints)
5. [Field Specifications](#field-specifications)
6. [Business Rules](#business-rules)
7. [Validation Rules](#validation-rules)
8. [Request/Response Examples](#requestresponse-examples)
9. [Error Handling](#error-handling)
10. [Use Cases](#use-cases)
11. [Special Features](#special-features)
12. [Testing Checklist](#testing-checklist)

---

## Overview

The **Membership Category** entity represents an individual's membership classification for a specific year. It determines membership type, eligibility status, and special circumstances like parental leave or retirement.

### Key Characteristics

- **User-Specific Records**: Each record links to either an Account (OT/OTA) or Affiliate (Business)
- **Annual Records**: One membership category per user per year
- **Automated Determination**: System calculates final category based on user data and eligibility
- **Three-Step Process**: User Group → Eligibility → Final Category
- **Self-Service**: Users can register their own membership via `/me` endpoints
- **Special Statuses**: Handles parental leave, retirement, student status

### Critical Business Concept

**Exclusive User Reference**: Each membership category belongs to EITHER an Account OR an Affiliate, never both.

---

## Entity Purpose

### What Membership Category Stores

✅ **Annual Membership Classification**:
- Membership year (e.g., "2025")
- Final membership category (OT Practicing, OTA Student, etc.)
- User group classification
- Eligibility status

✅ **User-Specific Information**:
- Link to Account (OT/OTA users) OR Affiliate (Business users)
- Membership declaration acceptance
- Registration timestamp

✅ **Special Circumstances**:
- Parental leave period (from/to dates + expected duration)
- Retirement start date
- Student status

### What Membership Category DOES NOT Store

❌ Membership pricing (stored in Product entity)
❌ Payment information (stored in Payment History)
❌ Personal identity data (stored in Identity entity)
❌ Account credentials (stored in Account entity)

### Relationship to Other Entities

```
Account/Affiliate (User)
    ↓ has one per year
Membership Category (Annual Record)
    ↓ references
Membership Settings (Year Configuration)
    ↓ linked to
Product (Membership Pricing)
```

---

## Three-Step Process

The system uses a **three-step automated process** to determine the final membership category:

### Step 1: User Group Determination (Automatic)

**Input**: Account data + Education data  
**Process**: System analyzes account group and education category  
**Output**: User Group (e.g., OT Practitioner, OTA Student, Affiliate)

**User Groups**:
- **OT** (1): Occupational Therapist (includes retired/resigned)
- **OTA** (2): Occupational Therapist Assistant (includes retired/resigned)
- **OT_STUDENT** (3): OT Student
- **OTA_STUDENT** (4): OTA Student
- **AFFILIATE** (5): Affiliate member
- **VENDOR_ADVERTISER_RECRUITER** (6): Vendor/Advertiser/Recruiter
- **OT_STUDENT_NEW_GRAD** (7): OT Student New Graduate
- **OTA_STUDENT_NEW_GRAD** (8): OTA Student New Graduate
- **OTHER** (9): Other member types

**Frontend**: This step is invisible to users - system handles automatically

---

### Step 2: Eligibility Selection (User Input)

**Input**: User selects their eligibility status  
**Process**: User chooses from available options based on their user group  
**Output**: Eligibility enum value

#### For Account Users (OT/OTA):

```typescript
enum MembershipEligibility {
  QUESTION_1 = 0,  // Living and working as OT (clinical/non-clinical) in Ontario
  QUESTION_2 = 1,  // Working as OT outside Ontario but resident of Ontario
  QUESTION_3 = 2,  // Not working as OT (on career break, unemployed, etc.)
  QUESTION_4 = 3,  // Employed as OT outside Ontario and non-resident
  QUESTION_5 = 4,  // OT Student
  QUESTION_6 = 5,  // On Parental Leave (requires dates + expected duration)
  QUESTION_7 = 6,  // Retired OT (requires retirement start date)
  QUESTION_8 = 7   // Resigned from OT profession
}
```

#### For Affiliate Users (Business):

```typescript
enum AffiliateEligibility {
  PRIMARY = 1,    // Primary affiliate membership
  PREMIUM = 2     // Premium affiliate membership
}
```

**Frontend**: Display eligibility options as radio buttons or dropdown

---

### Step 3: Category Calculation (Automatic)

**Input**: User Group + Eligibility + Special dates  
**Process**: System applies business rules matrix  
**Output**: Final Membership Category

**Final Categories**:
- **OT_PR** (1): OT - Practicing
- **OT_NPR** (2): OT - Non-Practicing  
- **OT_RET** (3): OT - Retired
- **OT_RES** (4): OT - Resigned
- **OT_STU** (5): OT - Student
- **OTA_PR** (6): OTA - Practicing
- **OTA_NPR** (7): OTA - Non-Practicing
- **OTA_RET** (8): OTA - Retired
- **OTA_RES** (9): OTA - Resigned
- **OTA_STU** (10): OTA - Student
- **OT_LIFE** (11): OT - Life Member
- **OTA_LIFE** (12): OTA - Life Member
- **AFF_PRIM** (13): Affiliate - Primary
- **AFF_PREM** (14): Affiliate - Premium

**Frontend**: Display final category after registration completes

---

## Available Endpoints

### Private Endpoints (Authenticated - JWT Required)

#### `POST /private/membership-categories/me`
Register/create my membership category for current year

**Authentication**: JWT Bearer token required

**Request Body**: `MembershipCategoryRegistrationDto`

```typescript
{
  // User selects ONE based on their type (Account vs Affiliate)
  osot_eligibility?: MembershipEligibility;              // For OT/OTA users
  osot_eligibility_affiliate?: AffiliateEligibility;     // For Business users
  
  // REQUIRED: Must be true to accept membership terms
  osot_membership_declaration: boolean;
  
  // OPTIONAL: Special circumstance dates
  osot_parental_leave_from?: string;        // ISO date (YYYY-MM-DD)
  osot_parental_leave_to?: string;          // ISO date (YYYY-MM-DD)
  osot_parental_leave_expected?: ParentalLeaveExpected;  // 1=Full Year, 2=Six Months
  osot_retirement_start?: string;           // ISO date (YYYY-MM-DD)
}
```

**Important Notes**:
- ✅ **Membership year**: Auto-determined from active membership settings
- ✅ **User reference**: Auto-extracted from JWT token
- ✅ **User group**: Auto-calculated from account/education data
- ✅ **Final category**: Auto-calculated by business rules
- ⚠️ **One per year**: Can only register once per membership year

**Response**: `201 Created` with complete membership category

---

#### `GET /private/membership-categories/me`
Get my membership category records

**Authentication**: JWT Bearer token required

**Response**: Array of `MembershipCategoryResponseDto` (user's records for all years)

```typescript
[
  {
    osot_category_id: "osot-cat-0000123",
    osot_table_membership_categoryid: "abc123-def456-ghi789",
    osot_membership_year: "2025",
    osot_membership_category: "OT - Practicing",
    osot_eligibility: "Living and working as OT in Ontario",
    osot_users_group: "Occupational Therapist",
    osot_membership_declaration: true,
    osot_parental_leave_from: null,
    osot_parental_leave_to: null,
    osot_parental_leave_expected: null,
    osot_retirement_start: null,
    createdon: "2025-01-15T10:30:00Z",
    modifiedon: "2025-01-15T10:30:00Z"
  }
]
```

---

## Field Specifications

### 🔑 System Fields (Auto-Generated, Read-Only)

| Field | Type | Description |
|-------|------|-------------|
| `osot_table_membership_categoryid` | `string` (UUID) | Internal GUID for Dataverse |
| `osot_category_id` | `string` | Auto-number ID (format: "osot-cat-0000001") |
| `createdon` | `Date` | System creation timestamp |
| `modifiedon` | `Date` | System modification timestamp |
| `ownerid` | `string` | System owner (managed by Dataverse) |

**⚠️ Important**: These fields are **auto-generated**. Frontend should never send them.

---

### 👤 User Reference Fields (Auto-Determined)

#### `osot_table_account` (string UUID, conditional)

**Purpose**: Link to Account record (for OT/OTA users)

**Auto-Determined**: Extracted from JWT token during registration

**Exclusive Relationship**: Present ONLY if user is Account type (not Affiliate)

**Business Rule**: Cannot coexist with `osot_table_account_affiliate`

---

#### `osot_table_account_affiliate` (string UUID, conditional)

**Purpose**: Link to Affiliate record (for Business users)

**Auto-Determined**: Extracted from JWT token during registration

**Exclusive Relationship**: Present ONLY if user is Affiliate type (not Account)

**Business Rule**: Cannot coexist with `osot_table_account`

---

### 📅 Core Membership Fields

#### `osot_membership_year` (string, required)

**Purpose**: The membership year this record represents

**Format**: String (e.g., "2025", "2026")

**Auto-Determined**: System fetches current active membership year from Membership Settings

**Validation**:
- ✅ Required field
- ✅ Must match active membership year in settings
- ✅ One record per user per year

**Frontend**: Display to user after registration, but don't allow input

---

#### `osot_membership_category` (enum, auto-calculated)

**Purpose**: Final membership classification

**Type**: `Category` enum value

**Auto-Determined**: Calculated by business rules based on User Group + Eligibility

**Response Format**: Human-readable label (e.g., "OT - Practicing")

**Available Categories**:
- OT categories: Practicing, Non-Practicing, Retired, Resigned, Student, Life Member
- OTA categories: Practicing, Non-Practicing, Retired, Resigned, Student, Life Member
- Affiliate categories: Primary, Premium

**Frontend**: Display after registration completes (read-only)

---

#### `osot_membership_declaration` (boolean, required)

**Purpose**: User acceptance of membership terms and conditions

**Validation**:
- ✅ **Required field**
- ✅ **Must be true** to register
- ✅ Cannot be false

**Frontend Implementation**:
```tsx
<FormCheckbox
  name="osot_membership_declaration"
  required
  label="I agree to the membership terms and conditions"
  helperText="You must accept the terms to continue"
  validate={(value) => 
    value === true || "You must accept the membership terms"
  }
/>
```

---

#### `osot_users_group` (enum, auto-calculated)

**Purpose**: Internal user classification (Step 1 of three-step process)

**Type**: `UserGroup` enum value

**Auto-Determined**: Calculated from Account Group + Education Category

**Response Format**: Human-readable label (e.g., "Occupational Therapist")

**Frontend**: Display to user but never allow input

---

### 🎯 Eligibility Fields (User Selects ONE Based on Type)

#### `osot_eligibility` (enum, conditional)

**Purpose**: Eligibility status for Account users (OT/OTA)

**Type**: `MembershipEligibility` enum value

**When Required**: User type is Account (not Affiliate)

**Validation**:
- ✅ Required for Account users
- ✅ Must be valid enum value (0-7)
- ✅ Cannot coexist with `osot_eligibility_affiliate`

**Enum Options** (fetch from `/public/enums/eligibility`):
```typescript
{
  value: 0,
  label: "Living and working as an occupational therapist (clinical or non-clinical) in Ontario"
},
{
  value: 5,
  label: "On Parental Leave"  // Requires dates + expected duration
},
{
  value: 6,
  label: "Retired from occupational therapy practice"  // Requires retirement date
}
// ... etc
```

**Special Cases**:
- **Parental Leave** (5): Requires `osot_parental_leave_from`, `osot_parental_leave_to`, `osot_parental_leave_expected`
- **Retired** (6): Requires `osot_retirement_start`

---

#### `osot_eligibility_affiliate` (enum, conditional)

**Purpose**: Eligibility status for Affiliate users (Business)

**Type**: `AffiliateEligibility` enum value

**When Required**: User type is Affiliate (not Account)

**Validation**:
- ✅ Required for Affiliate users
- ✅ Must be valid enum value (1 or 2)
- ✅ Cannot coexist with `osot_eligibility`

**Enum Options** (fetch from `/public/enums/affiliate-eligibility`):
```typescript
{
  value: 1,
  label: "Primary"  // Standard affiliate membership
},
{
  value: 2,
  label: "Premium"  // Enhanced affiliate membership
}
```

---

### 🍼 Parental Leave Fields (Optional, Account Users Only)

#### `osot_parental_leave_from` (date, optional)

**Purpose**: Parental leave period start date

**Format**: ISO date string (YYYY-MM-DD)

**Validation**:
- ✅ Optional field
- ✅ Must be valid ISO date
- ✅ Cannot be future date
- ✅ If provided, `osot_parental_leave_to` usually also provided

**Business Rule**: Only applicable for Account users with eligibility = 5 (On Parental Leave)

---

#### `osot_parental_leave_to` (date, optional)

**Purpose**: Parental leave period end date

**Format**: ISO date string (YYYY-MM-DD)

**Validation**:
- ✅ Optional field
- ✅ Must be valid ISO date
- ✅ Must be after `osot_parental_leave_from`
- ✅ Cannot be future date

---

#### `osot_parental_leave_expected` (enum, optional)

**Purpose**: Expected duration of parental leave

**Type**: `ParentalLeaveExpected` enum value

**Validation**:
- ✅ Optional field
- ✅ **Account users only** (not for Affiliates - businesses don't take parental leave)
- ✅ **Requires eligibility = 5** (On Parental Leave)
- ✅ **One-time use**: Each option can only be used once in user's lifetime
- ✅ **Practitioner only**: Only for OT or OTA user groups

**Enum Values** (fetch from `/public/enums/parental-leave-expected`):
```typescript
enum ParentalLeaveExpected {
  FULL_YEAR = 1,    // 12 months parental leave
  SIX_MONTHS = 2    // 6 months parental leave
}
```

**Business Rule**: Once a user uses FULL_YEAR, they cannot use it again. Same for SIX_MONTHS.

**Frontend Logic**:
```tsx
// Only show if user is Account type + eligibility is Parental Leave
{userType === 'account' && eligibility === MembershipEligibility.QUESTION_6 && (
  <>
    <FormDatePicker
      name="osot_parental_leave_from"
      label="Parental Leave Start Date"
    />
    <FormDatePicker
      name="osot_parental_leave_to"
      label="Parental Leave End Date"
    />
    <FormSelect
      name="osot_parental_leave_expected"
      label="Expected Parental Leave Duration"
      options={[
        { value: 1, label: 'Full Year (12 months)' },
        { value: 2, label: 'Six Months' }
      ]}
      helperText="This option can only be used once in your lifetime"
    />
  </>
)}
```

---

### 👴 Retirement Field (Optional)

#### `osot_retirement_start` (date, optional)

**Purpose**: Retirement start date

**Format**: ISO date string (YYYY-MM-DD)

**Validation**:
- ✅ Optional field
- ✅ Must be valid ISO date
- ✅ Cannot be future date
- ✅ **Required if eligibility = 6** (Retired)

**Business Rule**: When user selects "Retired" eligibility, this field becomes required

**Frontend Logic**:
```tsx
// Show and require if user selects Retired eligibility
{eligibility === MembershipEligibility.QUESTION_7 && (
  <FormDatePicker
    name="osot_retirement_start"
    label="Retirement Start Date *"
    required
    maxDate={new Date()}
    helperText="Required for retired members"
  />
)}
```

---

### 🔒 Internal Fields (NOT Exposed to Frontend)

These fields exist in backend but are **never exposed** in API responses:

- `osot_privilege` (enum): Internal privilege level
- `osot_access_modifiers` (enum): Internal access controls

---

## Business Rules

### 1. Exclusive User Reference (Critical)

**Rule**: Membership category must link to EITHER Account OR Affiliate, never both

**Enforcement**: DTO validation + database constraint

**Validation**:
```typescript
// Backend validates
const hasAccount = !!dto['osot_Table_Account@odata.bind'];
const hasAffiliate = !!dto['osot_Table_Account_Affiliate@odata.bind'];

if (hasAccount && hasAffiliate) {
  throw new Error("Cannot link to both Account and Affiliate");
}

if (!hasAccount && !hasAffiliate) {
  throw new Error("Must link to either Account or Affiliate");
}
```

**Frontend**: System handles automatically via JWT token - frontend doesn't send these fields

---

### 2. One Membership Per User Per Year

**Rule**: Each user can only have one membership category record per year

**Enforcement**: Database uniqueness constraint + service-layer check

**Validation**:
```typescript
// Backend checks before creation
const exists = await checkMembershipCategoryExists(
  userGuid,
  userType,
  membershipYear
);

if (exists) {
  throw new Error(
    `Membership category already exists for ${userType} in ${membershipYear}`
  );
}
```

**Frontend Handling**:
```tsx
const handleRegister = async (formData) => {
  try {
    await registerMembership(formData);
    showSuccess("Membership registered successfully!");
  } catch (error) {
    if (error.code === 'CONFLICT') {
      showError(
        "You already have a membership for this year. " +
        "Please contact support if you need to modify it."
      );
    }
  }
};
```

---

### 3. Membership Declaration Required

**Rule**: User must accept membership terms (declaration must be true)

**Enforcement**: DTO validation

**Validation**:
```typescript
@IsBoolean()
@Validate(MembershipDeclarationRequiredValidator)
osot_membership_declaration: boolean;

// Validator checks value === true
```

**Frontend**:
```tsx
<FormCheckbox
  name="osot_membership_declaration"
  required
  label={
    <>
      I accept the <Link to="/terms">membership terms and conditions</Link>
    </>
  }
  validate={(value) => 
    value === true || "You must accept the membership terms to register"
  }
/>
```

---

### 4. Eligibility-Based Required Fields

**Rule**: Certain eligibility choices require additional fields

**Parental Leave** (eligibility = 5):
- Requires: `osot_parental_leave_from`, `osot_parental_leave_to`, `osot_parental_leave_expected`
- **One-time use**: Each parental leave option can only be used once per user lifetime

**Retired** (eligibility = 6):
- Requires: `osot_retirement_start`

**Frontend Implementation**:
```tsx
const MembershipRegistrationForm = () => {
  const [eligibility, setEligibility] = useState(null);
  
  // Dynamically show/hide fields based on eligibility
  const showParentalLeaveFields = 
    eligibility === MembershipEligibility.QUESTION_6;
  
  const showRetirementField = 
    eligibility === MembershipEligibility.QUESTION_7;
  
  return (
    <Form>
      <FormSelect
        name="osot_eligibility"
        label="Eligibility Status *"
        options={eligibilityOptions}
        onChange={setEligibility}
        required
      />
      
      {showParentalLeaveFields && (
        <ParentalLeaveFields />
      )}
      
      {showRetirementField && (
        <RetirementDateField required />
      )}
    </Form>
  );
};
```

---

### 5. Date Validation Rules

**Parental Leave Dates**:
- End date must be after start date
- No future dates allowed
- Both dates usually provided together

**Retirement Date**:
- No future dates allowed
- Required if eligibility is Retired

**Validation**:
```typescript
// Backend validators
@Validate(NoFutureDatesValidator)
@Validate(ParentalLeaveDateRangeValidator)
osot_parental_leave_from?: string;

@Validate(NoFutureDatesValidator)
@Validate(RetirementDateRequiredValidator)
osot_retirement_start?: string;
```

---

### 6. Parental Leave Expected - One-Time Use

**Rule**: Each parental leave duration option (FULL_YEAR, SIX_MONTHS) can only be used once per user's lifetime

**Rationale**: Prevents abuse of membership fee reductions for parental leave

**Enforcement**: Backend checks user's history across all years

**Validation**:
```typescript
// Backend validates
const previousUse = await checkParentalLeaveExpectedHistory(
  userId,
  parentalLeaveExpected
);

if (previousUse) {
  throw new Error(
    `You have already used the "${getLabel(parentalLeaveExpected)}" parental leave option. ` +
    `Each option can only be used once in your membership history.`
  );
}
```

**Frontend Warning**:
```tsx
<FormSelect
  name="osot_parental_leave_expected"
  label="Expected Parental Leave Duration"
  options={parentalLeaveOptions}
  helperText={
    <Alert severity="info">
      <strong>Important:</strong> Each parental leave duration option can only 
      be used once in your membership history. Please choose carefully.
    </Alert>
  }
/>
```

---

### 7. Account Type Consistency

**Rule**: Eligibility type must match user type

**Account Users**: Use `osot_eligibility` (NOT `osot_eligibility_affiliate`)  
**Affiliate Users**: Use `osot_eligibility_affiliate` (NOT `osot_eligibility`)

**Validation**: Backend enforces via `EligibilityConsistencyValidator`

**Frontend**: Conditionally render correct field based on user type from JWT

---

## Validation Rules

### Field-Level Validations

```typescript
// MembershipCategoryRegistrationDto Validation Rules

osot_membership_declaration: {
  required: true,
  type: 'boolean',
  mustBeTrue: true,
  validator: MembershipDeclarationRequiredValidator
}

osot_eligibility: {
  optional: true,  // Required for Account users
  enum: MembershipEligibility,
  values: [0, 1, 2, 3, 4, 5, 6, 7],
  mutuallyExclusive: ['osot_eligibility_affiliate']
}

osot_eligibility_affiliate: {
  optional: true,  // Required for Affiliate users
  enum: AffiliateEligibility,
  values: [1, 2],
  mutuallyExclusive: ['osot_eligibility']
}

osot_parental_leave_from: {
  optional: true,
  type: 'date-string',
  format: 'YYYY-MM-DD',
  validators: [IsoDateFormatValidator, NoFutureDatesValidator],
  conditionallyRequired: { when: 'osot_eligibility === 5' }
}

osot_parental_leave_to: {
  optional: true,
  type: 'date-string',
  format: 'YYYY-MM-DD',
  validators: [IsoDateFormatValidator, ParentalLeaveDateRangeValidator],
  mustBeAfter: 'osot_parental_leave_from'
}

osot_parental_leave_expected: {
  optional: true,
  enum: ParentalLeaveExpected,
  values: [1, 2],
  accountOnly: true,
  practitionerOnly: true,
  oneTimeUse: true,
  conditionallyRequired: { when: 'osot_eligibility === 5' }
}

osot_retirement_start: {
  optional: true,
  type: 'date-string',
  format: 'YYYY-MM-DD',
  validators: [IsoDateFormatValidator, NoFutureDatesValidator],
  conditionallyRequired: { when: 'osot_eligibility === 6' }
}
```

---

### Custom Validators

#### MembershipDeclarationRequiredValidator
- Ensures declaration is true
- Registration cannot proceed with false

#### EligibilityConsistencyValidator
- Validates eligibility matches user type
- Account users cannot use affiliate eligibility and vice versa

#### ParentalLeaveDateRangeValidator
- Validates end date is after start date
- Ensures logical date range

#### NoFutureDatesValidator
- Prevents future dates for parental leave and retirement
- All dates must be in the past or present

#### RetirementDateRequiredValidator
- Enforces retirement date when eligibility is Retired
- Validates date format and logic

---

## Request/Response Examples

### Example 1: OT Practitioner Registration (Standard)

**Request**: `POST /private/membership-categories/me`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body**:
```json
{
  "osot_eligibility": 0,
  "osot_membership_declaration": true
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "osot_category_id": "osot-cat-0000456",
    "osot_table_membership_categoryid": "abc123-def456-ghi789",
    "osot_table_account": "user-guid-123",
    "osot_membership_year": "2025",
    "osot_eligibility": "Living and working as an occupational therapist (clinical or non-clinical) in Ontario",
    "osot_membership_category": "OT - Practicing",
    "osot_users_group": "Occupational Therapist",
    "osot_membership_declaration": true,
    "osot_parental_leave_from": null,
    "osot_parental_leave_to": null,
    "osot_parental_leave_expected": null,
    "osot_retirement_start": null,
    "createdon": "2025-12-17T10:30:00.000Z",
    "modifiedon": "2025-12-17T10:30:00.000Z"
  },
  "message": "Membership category registered successfully"
}
```

---

### Example 2: Parental Leave Registration

**Request**: `POST /private/membership-categories/me`

**Body**:
```json
{
  "osot_eligibility": 5,
  "osot_membership_declaration": true,
  "osot_parental_leave_from": "2025-03-01",
  "osot_parental_leave_to": "2026-02-28",
  "osot_parental_leave_expected": 1
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "osot_category_id": "osot-cat-0000457",
    "osot_membership_year": "2025",
    "osot_eligibility": "On Parental Leave",
    "osot_membership_category": "OT - Non-Practicing",
    "osot_users_group": "Occupational Therapist",
    "osot_membership_declaration": true,
    "osot_parental_leave_from": "2025-03-01",
    "osot_parental_leave_to": "2026-02-28",
    "osot_parental_leave_expected": "Full Year",
    "osot_retirement_start": null,
    "createdon": "2025-12-17T11:00:00.000Z"
  },
  "message": "Membership category registered successfully with parental leave"
}
```

---

### Example 3: Retired Member Registration

**Request**: `POST /private/membership-categories/me`

**Body**:
```json
{
  "osot_eligibility": 6,
  "osot_membership_declaration": true,
  "osot_retirement_start": "2024-06-30"
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "osot_category_id": "osot-cat-0000458",
    "osot_membership_year": "2025",
    "osot_eligibility": "Retired from occupational therapy practice",
    "osot_membership_category": "OT - Retired",
    "osot_users_group": "Occupational Therapist",
    "osot_membership_declaration": true,
    "osot_parental_leave_from": null,
    "osot_parental_leave_to": null,
    "osot_parental_leave_expected": null,
    "osot_retirement_start": "2024-06-30",
    "createdon": "2025-12-17T12:00:00.000Z"
  },
  "message": "Membership category registered successfully for retired member"
}
```

---

### Example 4: Affiliate (Business) Registration

**Request**: `POST /private/membership-categories/me`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN_AFFILIATE_USER>
```

**Body**:
```json
{
  "osot_eligibility_affiliate": 1,
  "osot_membership_declaration": true
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "osot_category_id": "osot-cat-0000459",
    "osot_table_account_affiliate": "affiliate-guid-456",
    "osot_membership_year": "2025",
    "osot_eligibility_affiliate": "Primary",
    "osot_membership_category": "Affiliate - Primary",
    "osot_users_group": "Affiliate",
    "osot_membership_declaration": true,
    "osot_parental_leave_from": null,
    "osot_parental_leave_to": null,
    "osot_parental_leave_expected": null,
    "osot_retirement_start": null,
    "createdon": "2025-12-17T13:00:00.000Z"
  },
  "message": "Affiliate membership category registered successfully"
}
```

---

### Example 5: Get My Membership Categories

**Request**: `GET /private/membership-categories/me`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**: `200 OK`

```json
[
  {
    "osot_category_id": "osot-cat-0000456",
    "osot_membership_year": "2025",
    "osot_membership_category": "OT - Practicing",
    "osot_eligibility": "Living and working as OT in Ontario",
    "osot_users_group": "Occupational Therapist",
    "createdon": "2025-01-15T10:00:00.000Z"
  },
  {
    "osot_category_id": "osot-cat-0000123",
    "osot_membership_year": "2024",
    "osot_membership_category": "OT - Practicing",
    "osot_eligibility": "Living and working as OT in Ontario",
    "osot_users_group": "Occupational Therapist",
    "createdon": "2024-01-20T09:30:00.000Z"
  }
]
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
        "field": "osot_membership_declaration",
        "message": "Membership declaration must be true to register"
      },
      {
        "field": "osot_retirement_start",
        "message": "Retirement start date is required when eligibility is Retired"
      }
    ]
  }
}
```

---

### Business Rule Violations

**HTTP 409 - Conflict (Duplicate Registration)**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Membership category already exists for this user in year 2025",
    "details": {
      "membershipYear": "2025",
      "reason": "Business rule: One membership category per user per year",
      "existingCategoryId": "osot-cat-0000456"
    }
  }
}
```

---

**HTTP 400 - Parental Leave Already Used**

```json
{
  "success": false,
  "error": {
    "code": "PARENTAL_LEAVE_ALREADY_USED",
    "message": "You have already used the 'Full Year' parental leave option in 2023. Each option can only be used once in your membership history.",
    "details": {
      "option": "Full Year",
      "previousYear": "2023",
      "previousCategoryId": "osot-cat-0000234"
    }
  }
}
```

---

### Missing Required Fields

**HTTP 400 - Missing Eligibility**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Eligibility selection is required",
    "details": {
      "userType": "account",
      "requiredField": "osot_eligibility",
      "availableOptions": [0, 1, 2, 3, 4, 5, 6, 7]
    }
  }
}
```

---

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `CONFLICT` | 409 | Membership already exists for year |
| `PARENTAL_LEAVE_ALREADY_USED` | 400 | Parental leave option used before |
| `RETIREMENT_DATE_REQUIRED` | 400 | Missing retirement date for retired eligibility |
| `PARENTAL_LEAVE_DATES_REQUIRED` | 400 | Missing parental leave dates |
| `INVALID_DATE_RANGE` | 400 | End date before start date |
| `FUTURE_DATE_NOT_ALLOWED` | 400 | Date cannot be in the future |
| `DECLARATION_NOT_ACCEPTED` | 400 | Membership declaration must be true |
| `MULTIPLE_USER_REFERENCES` | 400 | Cannot link to both Account and Affiliate |
| `NO_USER_REFERENCE` | 400 | Must link to Account or Affiliate |

---

## Use Cases

### Use Case 1: Standard OT Practitioner Registration

**Scenario**: OT practicing in Ontario registers for annual membership

**Implementation**:
```tsx
const StandardMembershipRegistration = () => {
  const { user } = useAuth();
  const [eligibilityOptions, setEligibilityOptions] = useState([]);
  
  useEffect(() => {
    // Fetch eligibility options
    const fetchOptions = async () => {
      const response = await fetch('/public/enums/eligibility');
      setEligibilityOptions(response.data);
    };
    fetchOptions();
  }, []);
  
  const handleSubmit = async (values) => {
    try {
      const response = await fetch('/private/membership-categories/me', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          osot_eligibility: values.eligibility,
          osot_membership_declaration: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        showSuccess(
          `Membership registered successfully! ` +
          `Your category: ${data.data.osot_membership_category}`
        );
        navigate('/membership/payment');
      }
    } catch (error) {
      handleError(error);
    }
  };
  
  return (
    <Card>
      <h2>Annual Membership Registration</h2>
      
      <Alert severity="info">
        Based on your profile, you are registering as: <strong>Occupational Therapist</strong>
      </Alert>
      
      <Form onSubmit={handleSubmit}>
        <FormRadioGroup
          name="eligibility"
          label="Please select your current status *"
          required
          options={eligibilityOptions}
        />
        
        <FormCheckbox
          name="declaration"
          required
          label={
            <>
              I accept the <Link to="/terms">membership terms and conditions</Link> *
            </>
          }
        />
        
        <Button type="submit">Register Membership</Button>
      </Form>
    </Card>
  );
};
```

---

### Use Case 2: Parental Leave Registration with Conditional Fields

**Scenario**: OT on parental leave registers with special dates

**Implementation**:
```tsx
const ParentalLeaveMembershipForm = () => {
  const [values, setValues] = useState({
    eligibility: null,
    parentalLeaveFrom: '',
    parentalLeaveTo: '',
    parentalLeaveExpected: null,
    declaration: false
  });
  
  const isParentalLeave = values.eligibility === MembershipEligibility.QUESTION_6;
  
  const handleSubmit = async () => {
    // Validation
    if (isParentalLeave) {
      if (!values.parentalLeaveFrom || !values.parentalLeaveTo || !values.parentalLeaveExpected) {
        showError("Parental leave dates and duration are required");
        return;
      }
    }
    
    try {
      const payload = {
        osot_eligibility: values.eligibility,
        osot_membership_declaration: true
      };
      
      // Add parental leave fields if applicable
      if (isParentalLeave) {
        payload.osot_parental_leave_from = values.parentalLeaveFrom;
        payload.osot_parental_leave_to = values.parentalLeaveTo;
        payload.osot_parental_leave_expected = values.parentalLeaveExpected;
      }
      
      const response = await fetch('/private/membership-categories/me', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        showSuccess("Membership registered with parental leave status!");
        navigate('/membership/confirmation');
      }
    } catch (error) {
      if (error.code === 'PARENTAL_LEAVE_ALREADY_USED') {
        showError(
          `You have already used the "${getLabel(values.parentalLeaveExpected)}" ` +
          `parental leave option. Each option can only be used once.`
        );
      } else {
        handleError(error);
      }
    }
  };
  
  return (
    <Form>
      <FormRadioGroup
        name="eligibility"
        label="Current Status *"
        value={values.eligibility}
        onChange={(value) => setValues({ ...values, eligibility: value })}
        options={eligibilityOptions}
      />
      
      {isParentalLeave && (
        <ParentalLeaveFields>
          <Alert severity="info">
            Additional information required for parental leave status
          </Alert>
          
          <FormDatePicker
            name="parentalLeaveFrom"
            label="Parental Leave Start Date *"
            value={values.parentalLeaveFrom}
            onChange={(date) => setValues({ ...values, parentalLeaveFrom: date })}
            required
            maxDate={new Date()}
          />
          
          <FormDatePicker
            name="parentalLeaveTo"
            label="Parental Leave End Date *"
            value={values.parentalLeaveTo}
            onChange={(date) => setValues({ ...values, parentalLeaveTo: date })}
            required
            minDate={values.parentalLeaveFrom}
            maxDate={new Date()}
          />
          
          <FormSelect
            name="parentalLeaveExpected"
            label="Expected Duration *"
            value={values.parentalLeaveExpected}
            onChange={(value) => setValues({ ...values, parentalLeaveExpected: value })}
            required
            options={[
              { value: 1, label: 'Full Year (12 months)' },
              { value: 2, label: 'Six Months' }
            ]}
            helperText={
              <Alert severity="warning">
                <strong>One-time use:</strong> Each duration option can only be used 
                once in your membership history.
              </Alert>
            }
          />
        </ParentalLeaveFields>
      )}
      
      <FormCheckbox
        name="declaration"
        required
        label="I accept the membership terms and conditions *"
      />
      
      <Button onClick={handleSubmit}>Register Membership</Button>
    </Form>
  );
};
```

---

### Use Case 3: Retired Member Registration

**Scenario**: Retired OT registers with retirement date

**Implementation**:
```tsx
const RetiredMembershipForm = () => {
  const [eligibility, setEligibility] = useState(null);
  const [retirementDate, setRetirementDate] = useState('');
  
  const isRetired = eligibility === MembershipEligibility.QUESTION_7;
  
  const handleSubmit = async () => {
    if (isRetired && !retirementDate) {
      showError("Retirement start date is required");
      return;
    }
    
    const payload = {
      osot_eligibility: eligibility,
      osot_membership_declaration: true
    };
    
    if (isRetired) {
      payload.osot_retirement_start = retirementDate;
    }
    
    try {
      await fetch('/private/membership-categories/me', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      showSuccess("Retired membership registered successfully!");
      navigate('/membership/retired-benefits');
    } catch (error) {
      handleError(error);
    }
  };
  
  return (
    <Form>
      <FormSelect
        label="Current Status *"
        value={eligibility}
        onChange={setEligibility}
        options={eligibilityOptions}
      />
      
      {isRetired && (
        <Alert severity="info">
          Retired members enjoy special benefits and reduced fees.
        </Alert>
      )}
      
      {isRetired && (
        <FormDatePicker
          name="retirementDate"
          label="Retirement Start Date *"
          value={retirementDate}
          onChange={setRetirementDate}
          required
          maxDate={new Date()}
          helperText="When did you retire from occupational therapy practice?"
        />
      )}
      
      <FormCheckbox
        name="declaration"
        required
        label="I accept the membership terms *"
      />
      
      <Button onClick={handleSubmit}>Register Membership</Button>
    </Form>
  );
};
```

---

### Use Case 4: Affiliate (Business) Registration

**Scenario**: Business/affiliate registers for membership

**Implementation**:
```tsx
const AffiliateMembershipForm = () => {
  const { user } = useAuth();
  const [affiliateEligibility, setAffiliateEligibility] = useState(null);
  
  // Check if user is affiliate type
  const isAffiliate = user.userType === 'affiliate';
  
  if (!isAffiliate) {
    return <Redirect to="/membership/individual" />;
  }
  
  const handleSubmit = async () => {
    try {
      const response = await fetch('/private/membership-categories/me', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          osot_eligibility_affiliate: affiliateEligibility,
          osot_membership_declaration: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        showSuccess(
          `Affiliate membership registered! ` +
          `Category: ${data.data.osot_membership_category}`
        );
        navigate('/membership/affiliate-benefits');
      }
    } catch (error) {
      handleError(error);
    }
  };
  
  return (
    <Card>
      <h2>Affiliate Membership Registration</h2>
      
      <Alert severity="info">
        Affiliate memberships provide business exposure and networking opportunities.
      </Alert>
      
      <Form onSubmit={handleSubmit}>
        <FormRadioGroup
          name="affiliateEligibility"
          label="Select Membership Level *"
          value={affiliateEligibility}
          onChange={setAffiliateEligibility}
          required
          options={[
            {
              value: AffiliateEligibility.PRIMARY,
              label: 'Primary Affiliate',
              description: 'Standard affiliate benefits and listing'
            },
            {
              value: AffiliateEligibility.PREMIUM,
              label: 'Premium Affiliate',
              description: 'Enhanced visibility and additional benefits'
            }
          ]}
        />
        
        <PricingDisplay affiliateLevel={affiliateEligibility} />
        
        <FormCheckbox
          name="declaration"
          required
          label="I accept the affiliate membership terms *"
        />
        
        <Button type="submit">Register Affiliate Membership</Button>
      </Form>
    </Card>
  );
};
```

---

### Use Case 5: Viewing Membership History

**Scenario**: User views their membership history across years

**Implementation**:
```tsx
const MembershipHistory = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/private/membership-categories/me', {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Sort by year descending
          const sorted = data.sort((a, b) => 
            parseInt(b.osot_membership_year) - parseInt(a.osot_membership_year)
          );
          setMemberships(sorted);
        }
      } catch (error) {
        showError("Failed to load membership history");
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, []);
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <Card>
      <h2>My Membership History</h2>
      
      {memberships.length === 0 ? (
        <EmptyState>
          <p>You don't have any membership records yet.</p>
          <Button onClick={() => navigate('/membership/register')}>
            Register for Membership
          </Button>
        </EmptyState>
      ) : (
        <Timeline>
          {memberships.map(membership => (
            <TimelineItem key={membership.osot_category_id}>
              <TimelineDate>{membership.osot_membership_year}</TimelineDate>
              
              <Card>
                <h3>{membership.osot_membership_category}</h3>
                
                <DetailRow>
                  <Label>Eligibility:</Label>
                  <Value>{membership.osot_eligibility || membership.osot_eligibility_affiliate}</Value>
                </DetailRow>
                
                <DetailRow>
                  <Label>User Group:</Label>
                  <Value>{membership.osot_users_group}</Value>
                </DetailRow>
                
                {membership.osot_parental_leave_from && (
                  <DetailRow>
                    <Label>Parental Leave:</Label>
                    <Value>
                      {formatDate(membership.osot_parental_leave_from)} - {formatDate(membership.osot_parental_leave_to)}
                      <br />
                      <Badge>{membership.osot_parental_leave_expected}</Badge>
                    </Value>
                  </DetailRow>
                )}
                
                {membership.osot_retirement_start && (
                  <DetailRow>
                    <Label>Retirement Date:</Label>
                    <Value>{formatDate(membership.osot_retirement_start)}</Value>
                  </DetailRow>
                )}
                
                <DetailRow>
                  <Label>Registered:</Label>
                  <Value>{formatDateTime(membership.createdon)}</Value>
                </DetailRow>
              </Card>
            </TimelineItem>
          ))}
        </Timeline>
      )}
    </Card>
  );
};
```

---

## Special Features

### 1. Three-Step Automated Process

The backend automatically determines:
- **Step 1**: User Group (from account + education data)
- **Step 2**: User provides eligibility
- **Step 3**: Final Category (calculated from group + eligibility)

**Frontend Transparency**: Show users what the system determined

```tsx
<ProcessStepper>
  <Step completed>
    <StepLabel>User Group Determined</StepLabel>
    <StepContent>
      System determined: <strong>Occupational Therapist</strong>
    </StepContent>
  </Step>
  
  <Step active>
    <StepLabel>Select Your Eligibility</StepLabel>
    <StepContent>
      <FormRadioGroup name="eligibility" options={eligibilityOptions} />
    </StepContent>
  </Step>
  
  <Step>
    <StepLabel>Final Category</StepLabel>
    <StepContent>Will be calculated automatically</StepContent>
  </Step>
</ProcessStepper>
```

---

### 2. Parental Leave One-Time Use Tracking

Backend tracks usage across all years to prevent duplicate use

**Frontend Warning Display**:
```tsx
const ParentalLeaveSelector = () => {
  const [previousUse, setPreviousUse] = useState(null);
  
  useEffect(() => {
    // Check if user has used parental leave before
    const checkHistory = async () => {
      const history = await fetchMembershipHistory();
      const used = history.find(m => m.osot_parental_leave_expected);
      setPreviousUse(used);
    };
    checkHistory();
  }, []);
  
  return (
    <FormSelect
      name="parentalLeaveExpected"
      label="Expected Duration"
      options={parentalLeaveOptions}
      helperText={
        previousUse ? (
          <Alert severity="warning">
            You used "{previousUse.osot_parental_leave_expected}" in {previousUse.osot_membership_year}. 
            You cannot use the same option again.
          </Alert>
        ) : (
          <Alert severity="info">
            This option can only be used once in your membership history.
          </Alert>
        )
      }
    />
  );
};
```

---

### 3. Conditional Field Requirements

Fields dynamically become required based on eligibility selection

**Implementation Pattern**:
```tsx
const DynamicForm = () => {
  const [eligibility, setEligibility] = useState(null);
  
  // Define conditional requirements
  const requirements = {
    [MembershipEligibility.QUESTION_6]: { // Parental Leave
      fields: ['parentalLeaveFrom', 'parentalLeaveTo', 'parentalLeaveExpected'],
      message: "Parental leave dates and duration are required"
    },
    [MembershipEligibility.QUESTION_7]: { // Retired
      fields: ['retirementStart'],
      message: "Retirement start date is required"
    }
  };
  
  const currentRequirements = requirements[eligibility];
  
  return (
    <Form>
      <FormSelect
        name="eligibility"
        onChange={setEligibility}
        options={eligibilityOptions}
      />
      
      {currentRequirements && (
        <Alert severity="info">
          {currentRequirements.message}
        </Alert>
      )}
      
      {/* Conditionally render required fields */}
    </Form>
  );
};
```

---

## Testing Checklist

### Unit Tests

- [ ] Membership declaration validation (must be true)
- [ ] Exclusive user reference (Account XOR Affiliate)
- [ ] Eligibility consistency (Account vs Affiliate)
- [ ] Date validation (no future dates)
- [ ] Parental leave date range (end > start)
- [ ] Retirement date requirement for retired eligibility

### Integration Tests

- [ ] Register standard OT membership
- [ ] Register with parental leave (all fields)
- [ ] Register retired member (with date)
- [ ] Register affiliate membership
- [ ] Prevent duplicate registration (same year)
- [ ] Parental leave one-time use enforcement
- [ ] Get membership history

### UI/UX Tests

- [ ] Conditional fields show/hide correctly
- [ ] Parental leave fields visible when selected
- [ ] Retirement date required when selected
- [ ] Declaration checkbox must be checked
- [ ] Appropriate error messages display
- [ ] Success confirmation after registration
- [ ] Membership history displays correctly

### Security Tests

- [ ] JWT required for all endpoints
- [ ] User can only access own memberships
- [ ] Internal fields not exposed in responses
- [ ] User type from JWT cannot be manipulated

---

## Support & Related Documentation

**Entity Structure**: See folder for detailed implementation
- **Constants**: `/constants/business.constants.ts`
- **Validators**: `/validators/membership-category.validators.ts`
- **Business Rules**: `/services/membership-category-business-rule.service.ts`
- **Mappers**: `/mappers/membership-category.mapper.ts`

**Related Entities**:
- **Account**: User account data
- **Affiliate**: Business account data
- **Membership Settings**: Year configuration
- **OT Education / OTA Education**: Education records for user group determination

**Related Documentation**:
- `DefiningMembershipCategory.csv` - Business rules matrix
- `FRONTEND_INTEGRATION_GUIDE.md` - General patterns

**Enum Endpoints**:
- `/public/enums/membership-eligibility` - OT/OTA eligibility options
- `/public/enums/affiliate-eligibility` - Affiliate eligibility options
- `/public/enums/parental-leave-expected` - Parental leave duration options
- `/public/enums/categories` - Final membership categories
- `/public/enums/user-groups` - User group classifications

---

**Document Version**: 2.0  
**Last Reviewed**: December 17, 2025  
**Next Review**: March 2026

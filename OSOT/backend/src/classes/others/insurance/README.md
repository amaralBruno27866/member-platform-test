# Insurance Entity - Business Rules Documentation

## Overview
Insurance entity manages certificates of insurance for occupational therapists and organizations. Each insurance certificate is a snapshot of coverage at the time of creation.

---

## Key Business Rules

### 1. Insurance Types & Risk Assessment

**Types requiring risk assessment questions (Professional):**
- `Professional` - Professional liability coverage for OT practitioners
  - **Requires high-risk questions:** Yes
  - **Questions cover:** Prior allegations, insurer history, known claims
  - **Purpose:** Identify high-risk practitioners for manual review

**Types NOT requiring risk assessment questions:**
- `General` - Basic coverage with minimal risk assessment
- `Corporative` - Organization-wide coverage, handled at org level
- `Property` - Asset-based coverage, different underwriting
- Other types - Custom types per jurisdiction

**Implementation:**
```typescript
// Questions (1, 2, 3) are ONLY required for Professional insurance
// For other types, questions should remain null/undefined

if (insuranceType === 'Professional') {
  // Validate questions if provided
  if (question1 === true) require explanation1;
  if (question2 === true) require explanation2;
  if (question3 === true) require explanation3;
} else {
  // Skip question validation entirely
  // Questions should not be submitted for non-Professional types
}
```

### 2. Declaration vs. Questions

**Declaration (always required):**
- User confirms all information is true and complete
- Applies to ALL insurance types
- Must be `true` to create insurance

**Questions (Professional only):**
- High-risk assessment for Professional liability
- Not applicable to other insurance types
- Optional if not Professional type
- If answered "Yes", explanations mandatory (1-4000 chars)

### 3. Immutable Fields (Snapshot Pattern)

Insurance freezes data at creation time (21 immutable fields):

**Account Snapshot:**
- `osot_account_group` - Group classification at creation
- `osot_first_name`, `osot_last_name` - Names at creation
- `osot_certificate` - Certificate ID at creation

**Address Snapshot:**
- `osot_address_1`, `osot_address_2` - Address at creation
- `osot_city`, `osot_province`, `osot_postal_code` - Location at creation
- `osot_phone_number`, `osot_email` - Contact at creation

**Membership Snapshot:**
- `osot_category` - Professional category (OT/OTA) at creation
- `osot_membership` - Membership type at creation

**Insurance Snapshot:**
- `osot_insurance_type` - Coverage type at creation
- `osot_insurance_limit` - Coverage limit at creation
- `osot_insurance_price` - Premium price at creation
- `osot_total` - Total amount (price + tax) at creation

**Questions (Professional only):**
- `osot_insurance_question_1`, `osot_insurance_question_1_explain`
- `osot_insurance_question_2`, `osot_insurance_question_2_explain`
- `osot_insurance_question_3`, `osot_insurance_question_3_explain`

**Why Immutable?**
- Audit trail: Historical record of what was covered
- Compliance: Insurance declaration tied to specific conditions at creation
- Data integrity: Cannot retroactively change coverage details

---

## Status Lifecycle

```
DRAFT
  ↓
PENDING ──→ CANCELLED
  ↓
ACTIVE ──→ EXPIRED or CANCELLED
  ↓
EXPIRED (final state)

CANCELLED (final state, any status can transition here)
```

**Status Rules:**
- `DRAFT`: Created but not activated
- `PENDING`: Submitted, awaiting activation on effective_date
- `ACTIVE`: Currently providing coverage (effective_date ≤ today ≤ expiry_date)
- `EXPIRED`: Natural expiration (expiry_date < today)
- `CANCELLED`: Explicit cancellation (no reactivation possible)

---

## Validation Layers

### Field-Level Validation (DTOs)
```typescript
// In InsuranceBasicDto
@IsNotEmpty()
@IsString()
@MaxLength(100)
osot_first_name: string;

@IsBoolean()
osot_insurance_declaration: boolean;

@IsEnum(InsuranceStatus)
osot_insurance_status: InsuranceStatus;
```

### Custom Validators (Business Rules)
```typescript
// In CreateInsuranceDto
@IsDeclarationTrue()                    // declaration must be true
osot_insurance_declaration: boolean;

@IsQuestionExplanationRequired()        // Yes answers need explanations (Professional only)
osot_insurance_question_1_explain?: string;

@IsValidEffectiveDate()                 // Cannot start in future
osot_effective_date: string;

@IsValidExpiryDate()                    // Must be after effective date
osot_expires_date: string;

@IsValidInsuranceTotal()                // Total ≈ price (within $0.01)
osot_total: number;
```

### Service-Level Validation (Business Rule Services)
- Status transition validation (not all transitions allowed)
- Endorsement permissions (only ACTIVE/PENDING)
- Organization isolation (multi-tenant safety)
- Auto-expiration (daily batch job)

---

## Create Insurance Flow

```
Frontend → CreateInsuranceDto
           ├── Field validation (required, type, length)
           ├── Custom validation
           │   ├── IsDeclarationTrue ✓
           │   ├── IsQuestionExplanationRequired (if Professional) ✓
           │   ├── IsValidEffectiveDate ✓
           │   ├── IsValidExpiryDate ✓
           │   └── IsValidInsuranceTotal ✓
           └── Business rule validation
               ├── Organization exists
               ├── Order exists
               ├── Account exists
               ├── Insurance type valid
               └── Status transition valid

Backend → InsuranceRepository
         └── Create in Dataverse (if all validations pass)

Frontend ← InsuranceResponseDto
          └── 201 Created + insurance data
```

**For Professional Insurance:**
```json
{
  "osot_account_group": "Occupational Therapist (includes student, new grad or retired/resigned)",
  "osot_first_name": "John",
  "osot_last_name": "Smith",
  "osot_insurance_type": "Professional",
  "osot_insurance_declaration": true,
  "osot_insurance_question_1": true,
  "osot_insurance_question_1_explain": "Had one claim in 2020, resolved without liability",
  "osot_insurance_question_2": false,
  "osot_insurance_question_2_explain": null,  // Not required (false)
  "osot_insurance_question_3": false,
  "osot_insurance_question_3_explain": null   // Not required (false)
}
```

**For General Insurance:**
```json
{
  "osot_account_group": "Occupational Therapist (includes student, new grad or retired/resigned)",
  "osot_first_name": "Jane",
  "osot_last_name": "Doe",
  "osot_insurance_type": "General",
  "osot_insurance_declaration": true,
  "osot_insurance_question_1": null,    // Not applicable
  "osot_insurance_question_1_explain": null,  // Not applicable
  "osot_insurance_question_2": null,
  "osot_insurance_question_2_explain": null,
  "osot_insurance_question_3": null,
  "osot_insurance_question_3_explain": null
}
```

---

## Update Insurance Flow

**Mutable fields only:**
1. `osot_insurance_status` - Lifecycle transitions
2. `osot_endorsement_description` - Admin-only amendments
3. `osot_endorsement_effective_date` - Amendment effective date
4. `osot_privilege` - Access control
5. `osot_access_modifiers` - Access rules

**Immutable fields** (21 fields) cannot be updated - snapshot is permanent.

**Endorsement Rules:**
- Can only add endorsements when status = ACTIVE or PENDING
- Admin privilege required
- Endorsement effective date must be valid
- If endorsement includes questions (for Professional), explanations required

---

## Error Scenarios

### Scenario 1: Non-Professional Insurance with Questions
```
POST /insurance {
  "osot_insurance_type": "General",
  "osot_insurance_question_1": true,
  "osot_insurance_question_1_explain": "This should not be required"
}

Response: 200 OK
Reason: Questions are ignored/skipped for General insurance
Expected behavior: Validation passes, questions are not validated
```

### Scenario 2: Professional Insurance without Explanations
```
POST /insurance {
  "osot_insurance_type": "Professional",
  "osot_insurance_question_1": true,
  "osot_insurance_question_1_explain": null
}

Response: 400 Bad Request
Error: "For Professional insurance, if any high-risk question is answered 'Yes', 
         an explanation is required. Explanations must be 1-4000 characters."
```

### Scenario 3: Future Effective Date
```
POST /insurance {
  "osot_effective_date": "2026-12-31",  // Future date
  ...
}

Response: 400 Bad Request
Error: "Insurance coverage cannot start in the future. 
        Effective date must be today or earlier."
```

### Scenario 4: Expiry Before Effective
```
POST /insurance {
  "osot_effective_date": "2026-01-27",
  "osot_expires_date": "2026-01-26"  // Before effective
}

Response: 400 Bad Request
Error: "Insurance expiry date must be after the effective date. 
        Coverage period must be at least 1 day."
```

---

## Related Documentation

- **Enum:** [insurance-status.enum.ts](./enum/insurance-status.enum.ts) - Status values
- **Constants:** [constants/](./constants/) - Field definitions and business rules
- **Validators:** [validators/](./validators/) - Custom validation logic
- **Mappers:** [mappers/](./mappers/) - DTO ↔ Internal ↔ Dataverse transformation
- **Services:** [services/](./services/) - CRUD, lookup, business rule logic
- **DTOs:** [dtos/](./dtos/) - Request/response schemas

---

## Architecture Pattern

Insurance entity follows NestJS domain-driven architecture:

```
Constants (rules, field definitions)
    ↓
Interfaces (types: Dataverse, Internal)
    ↓
DTOs (validation, request/response)
    ↓
Validators (custom business logic)
    ↓
Mappers (bidirectional transformation)
    ↓
Repository (Dataverse CRUD)
    ↓
Services (CRUD, Lookup, Business Rules)
    ↓
Events (domain events publishing)
    ↓
Controllers (HTTP endpoints)
```

Each layer is independent and testable.

---

**Last Updated:** 2026-01-27  
**Status:** Active - Insurance entity implementation in progress

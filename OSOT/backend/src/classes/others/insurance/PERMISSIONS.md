# Insurance Entity - App Permissions

## Overview
Permissions for `osot_table_insurance` entity across Main, Admin, and Owner apps.

**Architecture Decision:** Owner creates Insurance during checkout with health declarations - Main/Admin manage lifecycle and status transitions.

---

## Permission Matrix

| App | Create | Read | Update | Delete | Justification |
|-----|--------|------|--------|--------|---------------|
| **Main** | ✅ | ✅ | ✅ | ✅ | Full Access - Background jobs (expiration), status transitions, endorsements, soft/hard deletes |
| **Admin** | ❌ | ✅ | ✅ | ❌ | Read + Update - View org insurance, add endorsements, adjust status, NO CREATE/DELETE for compliance |
| **Owner** | ✅ | ✅ | ❌ | ❌ | Create + Read - Create during checkout with health declarations, view own certificates, NO UPDATE/DELETE |

---

## Permission Details

### Main App (Full Access)
**Use Cases:**
- Automated insurance creation via batch/backend processes (if needed)
- Status transitions based on business logic:
  - `PENDING` → `ACTIVE` (after payment confirmed)
  - `ACTIVE` → `EXPIRED` (expiration date reached)
  - Any status → `CANCELLED` (business rule violation)
- Background jobs (expiration checks, renewals)
- Add programmatic endorsements
- Soft delete for cancellations (audit trail)
- Hard delete for GDPR compliance only

**Critical Operations:**
- Status lifecycle management
- Expiration date calculations and updates
- Endorsement generation (premium changes, coverage adjustments)
- Compliance and audit trail management

**Example Scenarios:**
```typescript
// Payment webhook confirmed → Activate insurance
await insuranceCrudService.updateStatus(insuranceId, InsuranceStatus.ACTIVE, 'main');

// Daily cron job → Check expirations
await insuranceLookupService.findExpired(orgGuid);
await insuranceCrudService.updateStatus(expiredId, InsuranceStatus.EXPIRED, 'main');
```

---

### Admin App (Read + Update, NO CREATE/DELETE)
**Use Cases:**
- View all insurance certificates within organization
- Customer service: add endorsements manually
  - "Added dependent coverage"
  - "Adjusted premium due to policy change"
- Exceptional status adjustments (with justification)
- Support and troubleshooting
- Generate reports and analytics

**Restrictions:**
- ❌ Cannot CREATE insurance (Owner creates during checkout OR Main auto-creates)
- ❌ Cannot DELETE insurance (legal document - must preserve audit trail)
- ⚠️ Updates logged for compliance with admin details and timestamp

**Updatable Fields (Admin):**
- `osot_insurance_status` (with business rule validation)
- `osot_endorsement_description`
- `osot_endorsement_effective_date`
- `osot_privilege` (coverage type adjustments)
- `osot_access_modifiers` (internal notes)

**Immutable Fields (Admin CANNOT change):**
- All snapshot fields (account details, address, original coverage)
- Relationship fields (organizationGuid, orderGuid, accountGuid)
- System fields (createdon, modifiedon, osot_table_insuranceid)
- Original dates (osot_effective_date, osot_expiry_date - initial values)

**Audit Requirements:**
```typescript
// Every Admin update must include
{
  updatedBy: adminUserId,
  updateReason: 'Customer requested coverage adjustment',
  updateTimestamp: new Date()
}
```

---

### Owner App (Create + Read, NO UPDATE/DELETE)
**Use Cases:**
- **Create insurance during checkout:**
  ```typescript
  POST /insurance {
    orderGuid: '...',
    osot_declaration_health: true,
    osot_declaration_accuracy: true,
    osot_question_1_answer: 'No',
    osot_question_2_answer: 'Yes',
    osot_question_2_explanation: 'Had minor surgery 5 years ago',
    // ... additional health questions
  }
  ```
- View own insurance certificates: `GET /insurance?account={userGuid}`
- View certificate details: `GET /insurance/{id}`
- Download certificate PDF (future enhancement)

**Restrictions:**
- ✅ **CAN CREATE:** Only for own account, linked to valid Order
- ❌ **CANNOT UPDATE:** Status/endorsement changes handled by Admin/Main
- ❌ **CANNOT DELETE:** Legal document - immutable after creation
- ⚠️ Can only create **ONE insurance per Order**

**Security Enforcement:**
```typescript
// Business rules validate
if (dto.orderGuid) {
  const order = await orderLookupService.findById(dto.orderGuid);
  
  // 1. Order must belong to user
  if (order.accountGuid !== req.user.userGuid) {
    throw createAppError(ErrorCodes.PERMISSION_DENIED, {
      message: 'Cannot create insurance for another user\'s order'
    });
  }
  
  // 2. Order must not already have insurance
  const existing = await insuranceLookupService.findByOrder(dto.orderGuid);
  if (existing) {
    throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
      message: 'Insurance already exists for this order'
    });
  }
  
  // 3. Order must have insurance product
  if (!order.hasInsurance) {
    throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
      message: 'Order does not include insurance product'
    });
  }
}
```

**Read Filtering:**
```typescript
// Automatic filter applied in services
$filter=_osot_account_value eq '{userGuid}' and _osot_organization_value eq '{orgGuid}'
```

---

## Business Rules

### Owner Create Validation
Owner can only create insurance if ALL conditions met:

1. **Account Ownership:** `accountGuid` (derived from Order) matches `req.user.userGuid`
2. **Valid Order:** Order exists, belongs to user, and includes insurance product
3. **No Duplicates:** Order does not already have insurance certificate
4. **Health Declarations:** All required declarations are `true`
5. **Question Explanations:** If health question answered "Yes", explanation required
6. **Organization Context:** Order and Insurance belong to same organization

```typescript
// Enforced in insurance-business-rules.service.ts
async validateInsuranceForCreation(
  dto: CreateInsuranceDto,
  userGuid: string,
  userRole: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  
  if (userRole === 'owner') {
    // Get order to derive accountGuid
    const order = await this.orderLookupService.findById(dto.orderGuid);
    
    if (!order) {
      errors.push('Order not found');
    } else if (order.accountGuid !== userGuid) {
      errors.push('Cannot create insurance for another user\'s order');
    } else if (!order.hasInsurance) {
      errors.push('Order does not include insurance product');
    }
    
    // Check duplicates
    const existing = await this.insuranceLookupService.findByOrder(dto.orderGuid);
    if (existing) {
      errors.push('Insurance already exists for this order');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}
```

### Status Update Flow
Owner cannot update status directly. Status transitions happen via:

1. **Initial Creation (Owner):** Status = `PENDING` (awaiting payment)
2. **Payment Success (Main):** Webhook triggers status → `ACTIVE`
3. **Expiration Job (Main):** Daily cron checks dates → `EXPIRED`
4. **Cancellation (Admin/Main):** Business rules validated → `CANCELLED`

```typescript
// Allowed transitions by app
PENDING → ACTIVE:    Main only (after payment)
ACTIVE → EXPIRED:    Main only (date-based)
ACTIVE → CANCELLED:  Main/Admin (with reason)
PENDING → CANCELLED: Main/Admin (order cancelled)
EXPIRED → ACTIVE:    Admin only (renewal/correction)
```

### Immutability Rules

**21 Snapshot Fields (NEVER updatable after creation):**
- Account details (name, address, contact)
- Insurance specifics (type, coverage amounts, deductibles)
- Original dates (effective_date, expiry_date - initial values)
- Relationship GUIDs (organizationGuid, orderGuid, accountGuid)

**5 Mutable Fields (Admin/Main can update):**
- `osot_insurance_status` (lifecycle management)
- `osot_endorsement_description` (coverage changes)
- `osot_endorsement_effective_date` (when endorsement applies)
- `osot_privilege` (coverage type modifications)
- `osot_access_modifiers` (internal flags/notes)

**Rationale:** Insurance certificate is a **legal snapshot** at time of issuance. Changes happen via endorsements, not modifications to original data.

---

## Field-Level Permissions Notes

### Snapshot Fields (Immutable)
These fields capture account/address state at insurance creation:
- `osot_table_account_id`, `osot_table_address_id` (IDs)
- `osot_first_name`, `osot_last_name`, `osot_email`, `osot_phone`
- `osot_address_line_1`, `osot_city`, `osot_province`, `osot_postal_code`
- `osot_insurance_type`, `osot_coverage_amount`, `osot_deductible`
- `osot_premium_monthly`, `osot_total_premium`

### System Fields (Read-Only)
- `osot_table_insuranceid` (GUID)
- `osot_insuranceid` (autonumber)
- `createdon`, `modifiedon`, `ownerid`

### Sensitive Fields
- **Health Declarations:** Visible to Owner (own), Admin (org), Main (all)
- **Question Explanations:** Same visibility as declarations
- **No PII beyond what's already in Account entity**

---

## Audit Trail Requirements

### Creation Audit
```typescript
{
  createdBy: userGuid,
  createdByApp: 'owner', // or 'main'
  createdAt: new Date(),
  orderReference: orderGuid,
  initialStatus: InsuranceStatus.PENDING
}
```

### Update Audit (Admin/Main)
```typescript
{
  updatedBy: adminUserId,
  updatedByApp: 'admin', // or 'main'
  updatedAt: new Date(),
  fieldsChanged: ['osot_insurance_status'],
  oldValues: { osot_insurance_status: 1 },
  newValues: { osot_insurance_status: 3 },
  reason: 'Payment confirmed via webhook' // Required for manual changes
}
```

### Deletion Audit (Soft Delete)
```typescript
{
  deletedBy: adminUserId,
  deletedByApp: 'main',
  deletedAt: new Date(),
  deletionReason: 'Customer requested cancellation - Refund processed',
  finalStatus: InsuranceStatus.CANCELLED
}
```

---

## Integration with Order Entity

**Lifecycle Connection:**
```
1. Owner creates Order with hasInsurance=true
2. Owner creates Insurance linked to Order (health questions)
3. Owner completes payment
4. Payment webhook triggers:
   - Order.payment_status → PAID (Main)
   - Insurance.status → ACTIVE (Main)
5. Daily job checks Insurance.expiry_date:
   - If expired → Insurance.status → EXPIRED (Main)
```

**Dependency Rules:**
- Insurance **CANNOT exist** without Order
- Order with `hasInsurance=true` **SHOULD have** Insurance (validated at checkout)
- Deleting Order does NOT auto-delete Insurance (cascade configured in Dataverse)

---

## Related Entities
- **Order** (N:1) - Parent order that includes insurance product
- **Account** (N:1) - Insured person (snapshot copied at creation)
- **Address** (N:1) - Insured address (snapshot copied at creation)
- **Organization** (N:1) - Organization context for multi-tenancy

---

## Future Enhancements

### Endorsement History Table (Planned)
Track all endorsements separately:
```typescript
osot_table_insurance_endorsement {
  osot_table_insurance_endorsementid: GUID,
  osot_Insurance: Lookup(Insurance),
  osot_endorsement_type: OptionSet,
  osot_description: Text,
  osot_effective_date: Date,
  osot_premium_change: Decimal,
  osot_added_by: Lookup(User),
  createdon: DateTime
}
```

### Renewal Workflow (Future)
- 30 days before expiry: notification to Owner
- Owner can renew via `POST /insurance/{id}/renew`
- Creates new Insurance certificate, links to original

### Claims Integration (Future)
- Owner submits claim: `POST /insurance/{id}/claims`
- Admin processes claim
- Updates Insurance with claim history

---

**Last Updated:** January 27, 2026  
**Decision Context:** Owner-driven creation for UX simplicity, Admin oversight for compliance, Main automation for lifecycle management  
**GDPR Compliance:** Hard delete available via Main app only, with full audit trail

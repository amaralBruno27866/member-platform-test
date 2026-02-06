# Membership Orchestrator Implementation Plan

**Last Updated:** December 6, 2025  
**Status:** Planning Phase  
**Owner:** Backend Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Workflow Design](#workflow-design)
4. [Entity Creation Order](#entity-creation-order)
5. [Data Flow](#data-flow)
6. [Product Integration](#product-integration)
7. [Payment Integration](#payment-integration)
8. [Pricing Calculation](#pricing-calculation)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Future Enhancements](#future-enhancements)

---

## Overview

The Membership Orchestrator coordinates the complete membership registration workflow for authenticated users who wish to become OSOT members. Unlike the Account Orchestrator (which handles new user registration), the Membership Orchestrator operates on **existing, authenticated accounts**.

### Key Characteristics

- **User-Initiated:** Manual trigger via "Become a Member" button
- **Post-Authentication:** User must be logged in with an active account
- **Session-Based:** Uses Redis for temporary data storage during workflow
- **Payment-Integrated:** PayPal integration (future implementation)
- **No Admin Approval:** Automatic activation upon successful payment
- **Multi-Entity Coordination:** Creates 5 membership entities + optional product links

---

## Architecture Decisions

### 1. **User Authentication Requirement**

**Decision:** Membership creation requires an authenticated user with an active account.

**Rationale:**
- Account must exist before membership can be created
- All membership entities require `Table_Account` lookup reference
- User data (name, email, etc.) already validated during account creation
- JWT token provides accountId/accountGuid without additional input

**Implementation:**
```typescript
// User must be authenticated
@UseGuards(JwtAuthGuard)
@Post('/membership/initiate')
async initiateMembership(@Request() req: AuthenticatedRequest) {
  const accountId = req.user.userId; // From JWT
  const accountGuid = req.user.userGuid; // From JWT
  // ... orchestrator logic
}
```

---

### 2. **Redis-Based Session Management**

**Decision:** Use Redis to cache all necessary data before creating Dataverse records.

**Rationale:**
- Prevents incomplete data in Dataverse
- Allows workflow resumption if interrupted
- Enables pre-validation before entity creation
- Supports payment processing delay
- Session TTL: 48 hours (longer than account orchestrator)

**Redis Keys:**
```typescript
membership-orchestrator:session:{sessionId}        // Main session
membership-orchestrator:account:{sessionId}        // Account data cache
membership-orchestrator:pricing:{sessionId}        // Pricing calculation
membership-orchestrator:products:{sessionId}       // Insurance + Donation selection
membership-orchestrator:payment:{sessionId}        // Payment intent reference
```

---

### 3. **No DTOs for Account Integration**

**Decision:** Do NOT create `CreateXxxForAccountDto` variants.

**Rationale:**
- Account already exists - no need for cross-entity validation
- Each membership entity already has its own CRUD DTOs
- Entities handle `@odata.bind` internally
- AccountId available from JWT - no need to pass in DTO

**Contrast with Account Orchestrator:**
```typescript
// Account Orchestrator (new user)
CreateAddressForAccountDto {
  'osot_Table_Account@odata.bind': string; // Must be provided
}

// Membership Orchestrator (existing user)
CreateMembershipCategoryDto {
  // @odata.bind handled internally by entity service
  // accountId from JWT context
}
```

---

### 4. **Manual Workflow Trigger**

**Decision:** User explicitly initiates membership process.

**Rationale:**
- Not all users want to become members
- Membership has costs (fees, insurance)
- Requires additional data collection (employment, practices)
- User must accept membership terms

**UI Flow:**
```
User Dashboard → "Become a Member" Button → Membership Form → Payment → Confirmation
```

---

## Workflow Design

### State Machine

```
INITIATED → COLLECTING_DATA → PRICING_CALCULATED → PAYMENT_PENDING → 
PAYMENT_CONFIRMED → PROCESSING → COMPLETED / FAILED
```

### State Descriptions

| State | Description | Duration |
|-------|-------------|----------|
| `INITIATED` | User clicked "Become a Member", session created | Immediate |
| `COLLECTING_DATA` | Frontend collecting membership data | User-driven |
| `PRICING_CALCULATED` | Backend calculated membership fee + insurance | < 5 seconds |
| `PAYMENT_PENDING` | Waiting for PayPal payment confirmation | Up to 30 min |
| `PAYMENT_CONFIRMED` | Payment successful, ready to create entities | Immediate |
| `PROCESSING` | Creating entities in Dataverse | 30-60 seconds |
| `COMPLETED` | All entities created, membership active | Terminal |
| `FAILED` | Error during processing | Terminal |

### No Admin Approval

**Critical Decision:** Unlike Account Orchestrator, there is NO `PENDING_APPROVAL` or `APPROVED` state.

**Reason:** Payment confirmation is the approval mechanism. If payment succeeds, membership proceeds automatically.

---

## Entity Creation Order

### Sequence (CRITICAL - Must Follow Order)

```typescript
ENTITY_CREATION_ORDER = [
  'membership-category',      // 1. REQUIRED - Determines workflow
  'membership-employment',    // 2. REQUIRED - Work status
  'membership-practices',     // 3. REQUIRED - Practice details
  'membership-preferences',   // 4. OPTIONAL - User preferences
  'membership-settings',      // 5. OPTIONAL - Membership config
  'product-insurance',        // 6. OPTIONAL - Insurance linking (if selected)
] as const;
```

### Why This Order?

1. **MembershipCategory First:**
   - Determines membership type (Full, Student, Retired, etc.)
   - Affects pricing calculation
   - Referenced by other entities

2. **Employment & Practices:**
   - Required for all members
   - Validates professional status
   - Affects eligibility

3. **Preferences & Settings:**
   - Optional configurations
   - Can fail without blocking workflow
   - User can update later

4. **Product Linking Last:**
   - Depends on payment confirmation
   - Optional (user may decline insurance)
   - Separate from core membership

---

## Data Flow

### Phase 1: Initialization

```
User Clicks "Become a Member"
  ↓
POST /membership/initiate
  ↓
Generate sessionId
  ↓
Fetch Account Data (from JWT)
  ↓
Fetch Available Products (Insurance + Donation)
  ↓
Store in Redis
  ↓
Return session + product list to Frontend
```

### Phase 2: Data Collection

```
Frontend Form Submission
  ↓
POST /membership/submit-data
  ↓
Validate Input
  ↓
Calculate Pricing (via membership-settings)
  ↓
Update Redis Session
  ↓
Return pricing breakdown to Frontend
```

### Phase 3: Payment (Future)

```
Frontend Initiates PayPal
  ↓
POST /membership/process-payment
  ↓
PayPal Integration
  ↓
Payment Confirmed
  ↓
Update Session Status → PAYMENT_CONFIRMED
  ↓
Trigger Entity Creation
```

### Phase 4: Entity Creation

```
PROCESSING State
  ↓
Create MembershipCategory
  ↓
Create MembershipEmployment
  ↓
Create MembershipPractices
  ↓
Create MembershipPreferences (optional)
  ↓
Create MembershipSettings (optional)
  ↓
Link Product/Insurance (if selected)
  ↓
Update Account Status → ACTIVE_MEMBER
  ↓
Emit Certificate Generation Event (future)
  ↓
COMPLETED State
```

---

## Product Integration

### Product Categories for Membership

1. **Insurance Products**
   - Category: `INSURANCE`
   - Fetched at workflow initiation
   - User selects 0 or 1 insurance product
   - Price included in total

2. **Donation Products**
   - Category: `DONATION`
   - Fetched at workflow initiation
   - User can select multiple donations
   - Price added to total

### Product Selection DTO

```typescript
interface ProductSelectionDto {
  insurance?: {
    productId: string;           // osot-prod-0000001
    productName: string;         // Display name
    price: number;               // Amount
  };
  
  donations?: Array<{
    productId: string;
    productName: string;
    amount: number;              // User-specified amount
  }>;
}
```

### Product Linking

**When:** After membership entities are created  
**How:** Create lookup relationship in Dataverse  
**Table:** TBD (Future: `Table_Membership_Products` or similar)

---

## Payment Integration

### PayPal Integration (Future Implementation)

**Status:** Not yet implemented - will be added in Phase 2

**Placeholder Behavior:**
- Payment simulation: Auto-confirm
- Session progresses immediately to `PAYMENT_CONFIRMED`
- No actual payment processing

**Future Implementation:**
```typescript
interface PaymentDto {
  method: 'paypal';
  amount: number;
  currency: 'CAD';
  paypalOrderId?: string;     // PayPal order reference
  paypalPayerId?: string;     // PayPal payer reference
}
```

### Payment Workflow (Future)

```
1. Frontend creates PayPal order
2. User completes payment on PayPal
3. PayPal webhook notifies backend
4. Backend verifies payment
5. Session status → PAYMENT_CONFIRMED
6. Entity creation triggered automatically
```

---

## Pricing Calculation

### Source: `membership-settings` Entity

**Location:** `src/classes/membership/membership-settings`

**Calculation Factors:**
- Membership Category (Full, Student, Retired, etc.)
- Membership Year (2025, 2026, etc.)
- Account Group (OT, OTA, Affiliate, etc.)
- Start Date (pro-rated if mid-year)
- Insurance Selection (adds to total)
- Donations (adds to total)

### Pricing Logic (Simplified)

```typescript
const membershipFee = await membershipSettingsService.calculateFee({
  category: membershipCategory,
  year: membershipYear,
  accountGroup: accountGroup,
  startDate: new Date(),
});

const insuranceFee = selectedInsurance?.price || 0;
const donationTotal = donations.reduce((sum, d) => sum + d.amount, 0);

const totalAmount = membershipFee + insuranceFee + donationTotal;
```

**Note:** Detailed pricing rules will be implemented when we reach that phase.

---

## Implementation Roadmap

### Phase 1: Core Orchestrator (Current)

**Tasks:**
1. ✅ Create constants (DONE)
2. ⏳ Create enums (state machine)
3. ⏳ Create DTOs (input/output/session)
4. ⏳ Create interfaces
5. ⏳ Create events (observability)
6. ⏳ Create mappers (transformations)
7. ⏳ Create validators (business rules)
8. ⏳ Create repository (Redis)
9. ⏳ Create services (orchestrator + pricing)
10. ⏳ Create controller (API endpoints)
11. ⏳ Create module (NestJS integration)

### Phase 2: Product Integration

**Tasks:**
- Fetch insurance products at initiation
- Fetch donation products at initiation
- Product selection validation
- Product linking after entity creation

### Phase 3: Payment Integration

**Tasks:**
- PayPal SDK integration
- Webhook handling
- Payment verification
- Retry logic for failed payments
- Payment reconciliation

### Phase 4: Certificate Generation

**Tasks:**
- Create `Table_Insurance_Certificate` in Dataverse
- Generate PDF certificate
- Email certificate to user
- Store certificate metadata

---

## Entity Requirements

### 1. Membership Category

**CSV:** `Table Membership Category.csv`

**Required Fields:**
- `osot_Membership_Year` (Business Required)
- `osot_Membership_Declaration` (Business Required)
- `osot_Table_Account` (Lookup - Optional, handled by service)
- `osot_Table_Account_Affiliate` (Lookup - Optional)

**Optional Fields:**
- `osot_Eligibility`
- `osot_Eligibility_Affiliate`
- `osot_Membership_Category`
- `osot_Parental_Leave_From`
- `osot_Parental_Leave_To`
- `osot_Retirement_Start`
- `osot_Privilege`
- `osot_Access_Modifiers`
- `osot_Users_Group`

---

### 2. Membership Employment

**CSV:** `Table Membership Employment.csv`

**Required Fields:**
- `osot_Membership_Year` (Business Required)
- `osot_Employment_Status` (Business Required)
- `osot_Work_Hours` (Business Required)
- `osot_Role_Descriptor` (Business Required)
- `osot_Practice_Years` (Business Required)
- `osot_Position_Funding` (Business Required)
- `osot_Employment_Benefits` (Business Required)
- `osot_Earnings_Employment` (Business Required)
- `osot_Earnings_Self_Direct` (Business Required)
- `osot_Earnings_Self_Indirect` (Business Required)
- `osot_Union_Name` (Business Required)
- `osot_Table_Account` (Lookup - Optional, handled by service)

**Optional Fields:**
- `osot_Role_Descriptor_Other`
- `osot_Position_Funding_Other`
- `osot_Employment_Benefits_Other`
- `osot_Another_Employment`
- `osot_Privilege`
- `osot_Access_Modifiers`

---

### 3. Membership Practices

**CSV:** `Table Membership Practices.csv`

**Required Fields:**
- `osot_Membership_Year` (Business Required)
- `osot_Clients_Age` (Business Required)
- `osot_Table_Account` (Lookup - Optional, handled by service)

**Optional Fields:**
- `osot_Preceptor_Declaration`
- `osot_Practice_Area`
- `osot_Practice_Settings`
- `osot_Practice_Settings_Other`
- `osot_Practice_Services`
- `osot_Practice_Services_Other`
- `osot_Privilege`
- `osot_Access_Modifiers`

---

### 4. Membership Preferences

**CSV:** `Table Membership Preferences.csv`

**Required Fields:**
- `osot_Membership_Year` (Business Required)
- `osot_Auto_Renewal` (Business Required)

**Optional Fields:**
- `osot_Table_Membership_Category` (Lookup)
- `osot_Table_Account` (Lookup)
- `osot_Table_Account_Affiliate` (Lookup)
- `osot_Third_Parties`
- `osot_Practice_Promotion`
- `osot_Members_Search_Tools`
- `osot_Shadowing`
- `osot_Psychotherapy_Supervision`
- `osot_Privilege`
- `osot_Access_Modifiers`

---

### 5. Membership Settings

**CSV:** `Table Membership Setting.csv`

**Required Fields:**
- `osot_Membership_Year` (Business Required)
- `osot_Membership_Year_Status` (Business Required)
- `osot_Membership_Category` (Business Required - Choice enum)
- `osot_Expires_Date` (Business Required)
- `osot_Membership_Fee` (Business Required)
- `osot_Membership_Fee_Start` (Business Required)
- `osot_Membership_Fee_End` (Business Required)

**Optional Fields:**
- `osot_Privilege`
- `osot_Access_Modifiers`

**Note:** This entity is used for pricing calculation reference, not necessarily created per user.

---

## Data Pre-Fetch Strategy

### Initial GET Request

**Endpoint:** `GET /membership/prepare`

**Purpose:** Fetch all data needed before user fills form

**Response:**
```typescript
{
  sessionId: string;
  account: {
    accountId: string;
    accountGuid: string;
    firstName: string;
    lastName: string;
    email: string;
    accountGroup: AccountGroup;
    // ... other account data
  };
  products: {
    insurance: ProductResponseDto[];
    donations: ProductResponseDto[];
  };
  membershipYear: string; // Current year
  expiresAt: Date;
}
```

**Redis Storage:**
```typescript
// Store account data
redis.set(`membership-orchestrator:account:{sessionId}`, accountData, TTL);

// Store product list
redis.set(`membership-orchestrator:products:{sessionId}`, products, TTL);
```

---

## Future Enhancements

### 1. Insurance Certificate Generation

**Table:** `Table_Insurance_Certificate` (to be created)

**Trigger:** After membership entities created + insurance product selected

**Fields:**
- Certificate Number (auto-generated)
- Member Name
- Policy Number
- Coverage Amount
- Effective Date
- Expiry Date
- PDF URL (stored in Azure Blob)

**Process:**
1. Generate PDF certificate
2. Upload to Azure Blob Storage
3. Create Dataverse record
4. Email certificate to member

---

### 2. Membership Renewal Workflow

**Trigger:** Annual membership expiration

**Process:**
1. Detect expiring memberships (scheduler)
2. Send renewal reminder emails
3. Pre-fill renewal form with previous data
4. Process payment
5. Update membership year
6. Extend expiry date

---

### 3. Membership Upgrade/Downgrade

**Use Case:** Student → Full Member, Full → Retired, etc.

**Process:**
1. Validate eligibility for new category
2. Calculate pro-rated pricing adjustment
3. Process payment difference
4. Update membership category
5. Notify user

---

## Success Criteria

### Definition of Done

- [ ] User can initiate membership workflow
- [ ] Session created in Redis with 48h TTL
- [ ] Account data pre-fetched and cached
- [ ] Insurance + Donation products listed
- [ ] User can submit membership data
- [ ] Pricing calculated correctly
- [ ] All 5 entities created in correct order
- [ ] Product links created (if selected)
- [ ] Account status updated to ACTIVE_MEMBER
- [ ] Session cleaned up after completion
- [ ] Error handling and retry logic implemented
- [ ] Events emitted for observability
- [ ] API documented in Swagger

---

## Technical Debt & Known Limitations

### Current Limitations

1. **Payment Simulation:** PayPal integration not yet implemented
2. **Certificate Generation:** Deferred to Phase 4
3. **Renewal Workflow:** Not yet implemented
4. **Partial Failure Recovery:** Needs enhancement
5. **Concurrency Control:** Basic Redis locks only

### Future Improvements

1. Implement idempotency keys for entity creation
2. Add comprehensive audit logging
3. Build admin dashboard for membership monitoring
4. Create data migration scripts for year transitions
5. Implement webhook retry mechanism for PayPal

---

## Contact & Support

For questions or issues with the Membership Orchestrator:

1. Review this document first
2. Check `ARCHITECTURE_OVERVIEW.md` for system context
3. Review entity-specific documentation in `src/classes/membership/*/README.md`
4. Contact backend team with:
   - SessionId (if applicable)
   - Error messages
   - Request/response payloads
   - Server logs

---

**End of Membership Orchestrator Implementation Plan**

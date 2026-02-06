/**
 * Insurance Business Rules Constants
 *
 * Business logic rules and constraints for Insurance operations:
 * - Status transitions
 * - Coverage rules
 * - Expiration logic
 * - Endorsement rules
 * - Insurance lifecycle
 *
 * These rules define the business behavior of the Insurance entity
 */

import { InsuranceStatus } from '../enum/insurance-status.enum';

/**
 * Valid insurance status transitions
 * Defines which status changes are allowed
 *
 * BUSINESS RULES:
 * - DRAFT → PENDING: Admin/system creates insurance in draft
 * - PENDING → ACTIVE: Certificate activated on effective date
 * - ACTIVE → SUSPENDED: Temporary hold (e.g., payment issue)
 * - SUSPENDED → ACTIVE: Resume coverage if conditions met
 * - ACTIVE → EXPIRED: Natural expiration on expiry date
 * - ACTIVE/PENDING/DRAFT → CANCELLED: Explicit cancellation
 * - EXPIRED → (none): Final state, cannot transition
 * - CANCELLED → (none): Final state, cannot transition
 */
export const VALID_INSURANCE_STATUS_TRANSITIONS: Record<
  InsuranceStatus,
  InsuranceStatus[]
> = {
  /**
   * From DRAFT status:
   * Insurance created but not yet activated
   */
  [InsuranceStatus.DRAFT]: [
    InsuranceStatus.PENDING, // Move to pending approval
    InsuranceStatus.CANCELLED, // Cancel draft
  ],

  /**
   * From PENDING status:
   * Insurance waiting for activation or approval
   */
  [InsuranceStatus.PENDING]: [
    InsuranceStatus.ACTIVE, // Activate on effective date
    InsuranceStatus.CANCELLED, // Cancel before activation
  ],

  /**
   * From ACTIVE status:
   * Insurance is currently providing coverage
   */
  [InsuranceStatus.ACTIVE]: [
    InsuranceStatus.EXPIRED, // Natural expiration when expiry_date reached
    InsuranceStatus.CANCELLED, // Explicit cancellation
  ],

  /**
   * From EXPIRED status:
   * Certificate has naturally expired - CANNOT transition
   * Must create new certificate for continued coverage
   */
  [InsuranceStatus.EXPIRED]: [],

  /**
   * From CANCELLED status:
   * Certificate explicitly cancelled - CANNOT transition (final state)
   */
  [InsuranceStatus.CANCELLED]: [],
};

/**
 * Insurance lifecycle status descriptions
 */
export const INSURANCE_STATUS_DESCRIPTIONS: Record<InsuranceStatus, string> = {
  [InsuranceStatus.DRAFT]:
    'Insurance created but not yet submitted for processing',
  [InsuranceStatus.PENDING]:
    'Insurance submitted, awaiting activation or approval',
  [InsuranceStatus.ACTIVE]:
    'Insurance certificate is currently active and provides coverage',
  [InsuranceStatus.EXPIRED]:
    'Insurance certificate has passed its expiry date and no longer provides coverage',
  [InsuranceStatus.CANCELLED]:
    'Insurance certificate has been explicitly cancelled and cannot be reactivated',
};

/**
 * Insurance coverage rules
 */
export const INSURANCE_COVERAGE_RULES = {
  /**
   * Insurance is considered "in force" when:
   * - Status = ACTIVE
   * - effective_date <= today
   * - expiry_date >= today
   */
  IS_IN_FORCE: {
    REQUIRED_STATUS: InsuranceStatus.ACTIVE,
    REQUIRE_EFFECTIVE_PASSED: true,
    REQUIRE_EXPIRY_FUTURE: true,
  },
  /**
   * Insurance is considered "expired" when:
   * - expiry_date < today (does not include today)
   */
  IS_EXPIRED: {
    CHECK_EXPIRY_DATE_PASSED: true,
    INCLUDE_EXPIRY_DATE_IN_RANGE: false, // expiry_date < today, not <=
  },

  /**
   * Insurance can have endorsements (amendments) when:
   * - Status = ACTIVE or PENDING
   * - User has admin privilege
   */
  CAN_ADD_ENDORSEMENT: {
    ALLOWED_STATUSES: [InsuranceStatus.ACTIVE, InsuranceStatus.PENDING],
    REQUIRES_ADMIN_PRIVILEGE: true,
  },

  /**
   * Endorsement takes effect on endorsement_effective_date
   * If endorsement_effective_date is null, endorsement not yet applied
   */
  ENDORSEMENT_EFFECTIVE_DATE_OPTIONAL: true,
} as const;

/**
 * Insurance expiration rules
 */
export const INSURANCE_EXPIRATION_RULES = {
  /**
   * System automatically marks insurance as EXPIRED when:
   * - Current date > expiry_date
   * - Status is currently ACTIVE
   * - (Can be automated via scheduled job)
   */
  AUTO_EXPIRE_WHEN_DATE_PASSED: true,

  /**
   * Grace period for renewal (in days)
   * Customer can renew within this period before expiry
   */
  RENEWAL_GRACE_PERIOD_DAYS: 30,

  /**
   * Notification timing for expiry
   * Send renewal reminder N days before expiry
   */
  EXPIRY_REMINDER_DAYS_BEFORE: 14,

  /**
   * Expired insurance cannot be reactivated
   * Must create new certificate
   */
  EXPIRED_IS_FINAL_STATE: true,
} as const;

/**
 * Insurance question rules (business logic)
 * Note: Similar constant exists in validation.constant.ts for field-level validation
 */
export const INSURANCE_QUESTION_BUSINESS_RULES = {
  /**
   * When question answer is "Yes" (true), explanation is mandatory
   * Questions 1, 2, 3
   */
  YES_ANSWER_REQUIRES_EXPLANATION: true,

  /**
   * High-risk questions (answer "Yes" may affect approval)
   * Question 1: Allegations of negligence
   * Question 2: Insurer denial/cancellation
   * Question 3: Potential claims awareness
   */
  HIGH_RISK_QUESTIONS: [1, 2, 3],

  /**
   * High-risk flag: Certificate may need manual review if any high-risk answer is "Yes"
   */
  FLAG_FOR_MANUAL_REVIEW_IF_HIGH_RISK: true,

  /**
   * Insurance declaration (separate from questions)
   * Must be true to create insurance
   * User declares all information is accurate and complete
   */
  DECLARATION_MANDATORY: true,

  /**
   * Insurance types that require risk assessment questions
   * PROFESSIONAL: Liability coverage for OT practitioners
   *   - Requires questions about prior claims, allegations, insurer history
   *   - High-risk assessment mandatory
   *
   * Other types (GENERAL, CORPORATIVE, PROPERTY, etc.) do NOT require questions
   * - Questions should be null/undefined for non-Professional types
   * - Declaration still mandatory for all types
   */
  TYPES_REQUIRING_QUESTIONS: ['Professional'] as const,

  /**
   * Insurance types that do NOT require risk assessment questions
   * These types have different assessment criteria
   * - GENERAL: Basic coverage, minimal risk assessment
   * - CORPORATIVE: Company-wide coverage, handled at organization level
   * - PROPERTY: Asset-based coverage, different underwriting process
   * - Custom types may be added per jurisdiction/product
   */
  TYPES_WITHOUT_QUESTIONS: ['General', 'Corporative', 'Property'] as const,
} as const;

/**
 * Insurance snapshot rules
 */
export const INSURANCE_SNAPSHOT_RULES = {
  /**
   * Insurance is a snapshot created from:
   * - Order (order GUID, effective date)
   * - Account (name, address, contact info, group, category, membership)
   * - Product (insurance type, limit, price)
   * - Membership settings (expiry date/year ends)
   *
   * Snapshot is IMMUTABLE - preserves historical accuracy
   * If account/product changes, does NOT affect existing certificate
   * New certificate must be created for updated information
   */
  SNAPSHOT_IS_IMMUTABLE: true,

  /**
   * Required snapshot fields from Account:
   * - account_group
   * - first_name
   * - last_name
   * - mobile_phone
   * - email
   * - certificate_id
   */
  ACCOUNT_SNAPSHOT_FIELDS: [
    'account_group',
    'first_name',
    'last_name',
    'mobile_phone',
    'email',
    'certificate_id',
  ],

  /**
   * Required snapshot fields from Address:
   * - address_1 (required)
   * - address_2 (optional)
   * - city
   * - province
   * - postal_code
   */
  ADDRESS_SNAPSHOT_FIELDS: [
    'address_1',
    'address_2',
    'city',
    'province',
    'postal_code',
  ],

  /**
   * Required snapshot fields from Membership Category:
   * - category
   * - membership
   */
  MEMBERSHIP_SNAPSHOT_FIELDS: ['category', 'membership'],

  /**
   * Required snapshot fields from Product:
   * - insurance_type (product name)
   * - insurance_limit (from product)
   * - insurance_price (selected_price at purchase)
   */
  PRODUCT_SNAPSHOT_FIELDS: [
    'insurance_type',
    'insurance_limit',
    'insurance_price',
  ],

  /**
   * Required snapshot fields from Order/Order Product:
   * - total (item_total from order_product)
   * - effective_date (order creation date)
   * - expiry_date (from membership_settings.year_ends)
   */
  ORDER_SNAPSHOT_FIELDS: ['total', 'effective_date', 'expiry_date'],
} as const;

/**
 * Insurance creation rules (from Order)
 */
export const INSURANCE_CREATION_RULES = {
  /**
   * Insurance certificate is created when:
   * - Order is created with insurance product
   * - Order moves to certain status (e.g., APPROVED or COMPLETED)
   * - OR created manually via admin endpoint
   */
  TRIGGER_AUTOMATIC_CREATION: true,

  /**
   * Initial status when created:
   * - If created automatically: PENDING
   * - If created by admin: DRAFT (manual review needed)
   */
  INITIAL_STATUS_AUTO: InsuranceStatus.PENDING,
  INITIAL_STATUS_ADMIN: InsuranceStatus.DRAFT,

  /**
   * Insurance must have:
   * - Organization (same as order)
   * - Order reference (parent order)
   * - Account/User (who is insured - from order buyer)
   * - All snapshot fields (from account, address, product, order)
   * - Insurance declaration = true
   */
  REQUIRES_DECLARATION_FOR_CREATION: true,

  /**
   * Cannot create multiple active insurances for same order
   * One order = one insurance certificate (for now)
   * If renewal needed, create new insurance + new order
   */
  ONE_INSURANCE_PER_ORDER: true,
} as const;

/**
 * Access control rules for insurance operations
 */
export const INSURANCE_ACCESS_RULES = {
  /**
   * Only Main app can create/delete insurance
   * Admin app can create/update/read
   * Owner can read own insurance only
   */
  APPS_CAN_CREATE: ['main', 'admin'] as const,
  APPS_CAN_DELETE: ['main'] as const,
  APPS_CAN_UPDATE: ['main', 'admin'] as const,
  APPS_CAN_READ: ['main', 'admin', 'owner'] as const,

  /**
   * Endorsement (amendment) can only be added by admin
   */
  ADD_ENDORSEMENT_REQUIRES_ADMIN: true,

  /**
   * Insurance questions/declaration are sensitive
   * Read access restricted based on user role and privilege
   */
  RESTRICT_QUESTION_READ_TO_ADMIN: true,
} as const;

/**
 * Financial rules for insurance
 */
export const INSURANCE_FINANCIAL_RULES = {
  /**
   * Insurance total = price + tax
   * Tax is calculated based on province
   */
  TOTAL_CALCULATION: 'price + tax',

  /**
   * Insurance limit and price are independent
   * Limit: coverage amount (e.g., $250,000)
   * Price: premium cost (e.g., $125.00)
   */
  LIMIT_NOT_EQUAL_PRICE: true,

  /**
   * Both limit and price are required for insurance
   */
  BOTH_LIMIT_AND_PRICE_REQUIRED: true,

  /**
   * Currency precision: 2 decimal places
   */
  CURRENCY_DECIMALS: 2,
} as const;

/**
 * Audit and logging rules
 */
export const INSURANCE_AUDIT_RULES = {
  /**
   * Track all status transitions
   * Useful for compliance and debugging
   */
  LOG_STATUS_CHANGES: true,

  /**
   * Track all endorsement applications
   * Record who applied it and when
   */
  LOG_ENDORSEMENTS: true,

  /**
   * Track expiration events
   * Record when certificate automatically expired
   */
  LOG_EXPIRATIONS: true,

  /**
   * Do NOT log sensitive question responses
   * Especially high-risk answers that may need review
   */
  REDACT_SENSITIVE_QUESTIONS_IN_LOGS: true,
} as const;

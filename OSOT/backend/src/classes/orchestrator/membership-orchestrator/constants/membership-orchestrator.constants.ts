/**
 * Membership Orchestrator Constants
 *
 * Centralizes configuration values, timeouts, Redis keys, and other constants
 * specific to the Membership Orchestrator workflow in the OSOT Dataverse API.
 *
 * This orchestrator coordinates the complete membership registration process across
 * multiple entities: MembershipCategory, MembershipEmployment, MembershipPractices,
 * MembershipPreferences, MembershipSettings, and Product (insurance) integration.
 *
 * COMPLEXITY NOTE:
 * Membership orchestration is more complex than Account orchestration because it involves:
 * - Product (insurance) selection and pricing calculations
 * - Payment processing integration
 * - Multi-phase approval (admin + financial verification)
 * - Dynamic pricing based on membership category and insurance selection
 * - Conditional entity creation based on membership type
 */

import { ErrorCodes } from '../../../../common/errors/error-codes';

// ========================================
// ERROR CODE MAPPINGS
// ========================================
export const MEMBERSHIP_ORCHESTRATOR_ERROR_MAPPINGS = {
  MEMBERSHIP_SESSION_NOT_FOUND: ErrorCodes.NOT_FOUND,
  MEMBERSHIP_SESSION_EXPIRED: ErrorCodes.ACCOUNT_SESSION_EXPIRED,
  MEMBERSHIP_ENTITY_CREATION_FAILED: ErrorCodes.INTERNAL_ERROR,
  ACCOUNT_NOT_FOUND: ErrorCodes.ACCOUNT_NOT_FOUND,
  PARTIAL_MEMBERSHIP_FAILURE: ErrorCodes.INTERNAL_ERROR,
  VALIDATION_ERROR: ErrorCodes.VALIDATION_ERROR,
  PERMISSION_DENIED: ErrorCodes.PERMISSION_DENIED,
  DATAVERSE_ERROR: ErrorCodes.DATAVERSE_SERVICE_ERROR,
  REDIS_ERROR: ErrorCodes.REDIS_SERVICE_ERROR,
  EMAIL_ERROR: ErrorCodes.EMAIL_SERVICE_ERROR,
  PRICING_CALCULATION_ERROR: ErrorCodes.BUSINESS_RULE_VIOLATION,
  PRODUCT_NOT_FOUND: ErrorCodes.NOT_FOUND,
  PAYMENT_PROCESSING_ERROR: ErrorCodes.BUSINESS_RULE_VIOLATION,
  INVALID_MEMBERSHIP_CATEGORY: ErrorCodes.VALIDATION_ERROR,
  INSURANCE_SELECTION_ERROR: ErrorCodes.BUSINESS_RULE_VIOLATION,
} as const;

// ========================================
// REDIS CONFIGURATION
// ========================================
export const MEMBERSHIP_ORCHESTRATOR_REDIS_KEYS = {
  // Main membership session
  MEMBERSHIP_SESSION: (sessionId: string) =>
    `membership-orchestrator:session:${sessionId}`,

  // Progress tracking
  MEMBERSHIP_PROGRESS: (sessionId: string) =>
    `membership-orchestrator:progress:${sessionId}`,

  // Account reference (link to account orchestrator session)
  ACCOUNT_REFERENCE: (sessionId: string) =>
    `membership-orchestrator:account:${sessionId}`,

  // Pricing calculation cache (temporary during session)
  PRICING_CACHE: (sessionId: string) =>
    `membership-orchestrator:pricing:${sessionId}`,

  // Product selection cache
  PRODUCT_SELECTION: (sessionId: string) =>
    `membership-orchestrator:products:${sessionId}`,

  // Order draft reference
  ORDER_REFERENCE: (sessionId: string) =>
    `membership-orchestrator:order:${sessionId}`,

  // Insurance GUIDs reference (created in DRAFT)
  INSURANCE_GUIDS: (sessionId: string) =>
    `membership-orchestrator:insurances:${sessionId}`,

  // Donation selection reference (single donation per session)
  DONATION_SELECTIONS: (sessionId: string) =>
    `membership-orchestrator:donations:${sessionId}`,

  // Order summary reference (Step 8 - Order Review)
  ORDER_SUMMARY: (sessionId: string) =>
    `membership-orchestrator:order-summary:${sessionId}`,

  // Payment intent reference (for payment processing)
  PAYMENT_INTENT: (sessionId: string) =>
    `membership-orchestrator:payment:${sessionId}`,

  // Failed entities queue for retry
  FAILED_ENTITIES: (sessionId: string) =>
    `membership-orchestrator:failed:${sessionId}`,

  // Retry queue
  RETRY_QUEUE: (sessionId: string) =>
    `membership-orchestrator:retry:${sessionId}`,

  // Session locks (prevent concurrent processing)
  SESSION_LOCK: (sessionId: string) =>
    `membership-orchestrator:lock:${sessionId}`,

  // Cleanup patterns
  ALL_SESSIONS: 'membership-orchestrator:session:*',
  ALL_PROGRESS: 'membership-orchestrator:progress:*',
  ALL_LOCKS: 'membership-orchestrator:lock:*',
  EXPIRED_SESSIONS: 'membership-orchestrator:session:*:expired',
} as const;

// ========================================
// TIMEOUT CONFIGURATION
// ========================================
export const MEMBERSHIP_ORCHESTRATOR_TIMEOUTS = {
  // Session timeouts (in seconds)
  MEMBERSHIP_SESSION_TTL:
    parseInt(process.env.MEMBERSHIP_SESSION_TIMEOUT_HOURS || '48') * 3600, // 48h default (longer than account)
  PRICING_CACHE_TTL: 3600, // 1 hour for pricing calculations
  PRODUCT_SELECTION_TTL: 7200, // 2 hours for product selection
  PAYMENT_INTENT_TTL: 1800, // 30 minutes for payment intent
  PROGRESS_LOCK_TTL: 300, // 5 minutes for processing lock
  RETRY_QUEUE_TTL: 86400, // 24 hours for retry attempts

  // Processing timeouts
  ENTITY_CREATION_TIMEOUT: 30000, // 30 seconds per entity creation
  PRICING_CALCULATION_TIMEOUT: 10000, // 10 seconds for pricing calculation
  PAYMENT_PROCESSING_TIMEOUT: 60000, // 60 seconds for payment processing
  ADMIN_APPROVAL_TIMEOUT:
    parseInt(process.env.MEMBERSHIP_APPROVAL_PENDING_DAYS || '14') * 86400, // 14 days
  FINANCIAL_VERIFICATION_TIMEOUT: 259200, // 3 days for financial verification
} as const;

// ========================================
// SCHEDULER CONFIGURATION
// ========================================
export const MEMBERSHIP_ORCHESTRATOR_SCHEDULER = {
  // Membership workflow monitoring
  MEMBERSHIP_REMINDER_INTERVAL: '0 */12 * * *', // Every 12 hours (less frequent than account)
  MEMBERSHIP_RETRY_INTERVAL: '0 */2 * * *', // Every 2 hours
  PAYMENT_VERIFICATION_INTERVAL: '*/15 * * * *', // Every 15 minutes for pending payments

  // Cleanup schedules
  SESSION_CLEANUP_INTERVAL: '0 */12 * * *', // Every 12 hours
  DAILY_CLEANUP_INTERVAL: '0 3 * * *', // Daily at 3 AM

  // Health monitoring
  HEALTH_CHECK_INTERVAL: '0 9 * * 1', // Monday at 9 AM
  STATISTICS_UPDATE_INTERVAL: '0 */6 * * *', // Every 6 hours

  // Financial monitoring
  PAYMENT_RECONCILIATION_INTERVAL: '0 1 * * *', // Daily at 1 AM
} as const;

// ========================================
// MEMBERSHIP WORKFLOW CONFIGURATION
// ========================================
export const MEMBERSHIP_WORKFLOW = {
  // Entity creation order (CRITICAL - MembershipCategory must be first to determine workflow)
  ENTITY_CREATION_ORDER: [
    'membership-category',
    'membership-employment',
    'membership-practices',
    'membership-preferences',
    'membership-settings',
    'product-insurance', // Product/Insurance linking
  ] as const,

  // Required entities (all must succeed for complete membership)
  REQUIRED_ENTITIES: [
    'membership-category',
    'membership-employment',
    'membership-practices',
  ] as const,

  // Optional entities (can fail without blocking workflow)
  OPTIONAL_ENTITIES: [
    'membership-preferences',
    'membership-settings',
    'product-insurance',
  ] as const,

  // Retry configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_BACKOFF_MULTIPLIER: 2, // 2s, 4s, 8s
  INITIAL_RETRY_DELAY: 2000, // 2 seconds (longer than account)

  // Payment retry configuration
  MAX_PAYMENT_RETRY_ATTEMPTS: 5,
  PAYMENT_RETRY_DELAY: 5000, // 5 seconds

  // IMPORTANT: App Credentials Strategy
  // All membership entity creations MUST use 'main' app for elevated permissions
  // Reason: User may be 'owner' role but membership creation is a system-level operation
  // This ensures consistent permission handling across all entity types
  USE_MAIN_APP_FOR_CREATION: true,
  DEFAULT_USER_ROLE_FOR_OPERATIONS: 'main' as const,
} as const;

// ========================================
// MEMBERSHIP CATEGORY CONFIGURATION
// ========================================
export const MEMBERSHIP_CATEGORIES = {
  // Category IDs (match Dataverse enum values)
  FULL_MEMBER: 1,
  ASSOCIATE_MEMBER: 2,
  STUDENT_MEMBER: 3,
  RETIRED_MEMBER: 4,
  PROVISIONAL_MEMBER: 5,
  INACTIVE_MEMBER: 6,
  LIFE_MEMBER: 7,

  // Category names for display
  CATEGORY_NAMES: {
    1: 'Full Member',
    2: 'Associate Member',
    3: 'Student Member',
    4: 'Retired Member',
    5: 'Provisional Member',
    6: 'Inactive Member',
    7: 'Life Member',
  } as const,

  // Categories that require payment
  PAID_CATEGORIES: [1, 2, 3, 5] as const,

  // Categories that require insurance
  INSURANCE_REQUIRED_CATEGORIES: [1, 2, 5] as const,

  // Categories with reduced pricing
  DISCOUNTED_CATEGORIES: [3, 4] as const,
} as const;

// ========================================
// PRODUCT (INSURANCE) CONFIGURATION
// ========================================
export const PRODUCT_INSURANCE_CONFIG = {
  // Insurance types
  PROFESSIONAL_LIABILITY: 'professional_liability',
  EXTENDED_COVERAGE: 'extended_coverage',
  CYBER_LIABILITY: 'cyber_liability',

  // Insurance requirement rules
  MANDATORY_FOR_FULL_MEMBER: true,
  MANDATORY_FOR_ASSOCIATE_MEMBER: true,
  MANDATORY_FOR_PROVISIONAL_MEMBER: true,
  OPTIONAL_FOR_STUDENT: true,
  NOT_AVAILABLE_FOR_RETIRED: true,

  // Pricing cache duration
  PRICING_CACHE_DURATION: 3600, // 1 hour
} as const;

// ========================================
// PRICING CONFIGURATION
// ========================================
export const MEMBERSHIP_PRICING = {
  // Base pricing (fallback values, should be from Product entity in Dataverse)
  BASE_PRICES: {
    FULL_MEMBER: 500.0,
    ASSOCIATE_MEMBER: 350.0,
    STUDENT_MEMBER: 100.0,
    RETIRED_MEMBER: 50.0,
    PROVISIONAL_MEMBER: 300.0,
  } as const,

  // Discount percentages
  DISCOUNTS: {
    STUDENT: 0.8, // 80% discount
    RETIRED: 0.9, // 90% discount
    EARLY_BIRD: 0.1, // 10% discount if registered before deadline
  } as const,

  // Tax rates (configurable by province)
  TAX_RATES: {
    DEFAULT: 0.13, // 13% HST (Ontario default)
    GST: 0.05, // 5% GST
    PST: 0.08, // 8% PST
  } as const,

  // Currency
  CURRENCY: 'CAD',
} as const;

// ========================================
// PAYMENT PROCESSING CONFIGURATION
// ========================================
export const PAYMENT_PROCESSING = {
  // Payment methods
  SUPPORTED_METHODS: ['credit_card', 'debit_card', 'bank_transfer'] as const,

  // Payment states
  PAYMENT_STATES: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled',
  } as const,

  // Payment timeouts
  PAYMENT_TIMEOUT: 300000, // 5 minutes for payment completion
  PAYMENT_VERIFICATION_INTERVAL: 5000, // 5 seconds between verification checks
} as const;

// ========================================
// EMAIL CONFIGURATION
// ========================================
export const MEMBERSHIP_ORCHESTRATOR_EMAILS = {
  MEMBERSHIP_INITIATED: 'membership-orchestrator-initiated',
  MEMBERSHIP_PAYMENT_PENDING: 'membership-orchestrator-payment-pending',
  MEMBERSHIP_PAYMENT_CONFIRMED: 'membership-orchestrator-payment-confirmed',
  MEMBERSHIP_PAYMENT_FAILED: 'membership-orchestrator-payment-failed',
  MEMBERSHIP_ADMIN_APPROVAL: 'membership-orchestrator-admin-approval',
  MEMBERSHIP_APPROVED: 'membership-orchestrator-approved',
  MEMBERSHIP_REJECTED: 'membership-orchestrator-rejected',
  MEMBERSHIP_COMPLETED: 'membership-orchestrator-completed',
  MEMBERSHIP_FAILED: 'membership-orchestrator-failed',
  MEMBERSHIP_REMINDER: 'membership-orchestrator-reminder',
} as const;

// ========================================
// EVENT TYPES
// ========================================
export const MEMBERSHIP_ORCHESTRATOR_EVENTS = {
  // Membership lifecycle
  MEMBERSHIP_STARTED: 'membership-orchestrator.membership.started',
  MEMBERSHIP_COMPLETED: 'membership-orchestrator.membership.completed',
  MEMBERSHIP_FAILED: 'membership-orchestrator.membership.failed',

  // Entity events
  ENTITY_CREATION_STARTED: 'membership-orchestrator.entity.creation.started',
  ENTITY_CREATION_COMPLETED:
    'membership-orchestrator.entity.creation.completed',
  ENTITY_CREATION_FAILED: 'membership-orchestrator.entity.creation.failed',

  // Pricing events
  PRICING_CALCULATED: 'membership-orchestrator.pricing.calculated',
  PRICING_ERROR: 'membership-orchestrator.pricing.error',

  // Product/Insurance events
  PRODUCT_SELECTED: 'membership-orchestrator.product.selected',
  INSURANCE_VALIDATED: 'membership-orchestrator.insurance.validated',

  // Payment events
  PAYMENT_INITIATED: 'membership-orchestrator.payment.initiated',
  PAYMENT_PROCESSING: 'membership-orchestrator.payment.processing',
  PAYMENT_COMPLETED: 'membership-orchestrator.payment.completed',
  PAYMENT_FAILED: 'membership-orchestrator.payment.failed',

  // Approval events
  ADMIN_APPROVAL_REQUESTED: 'membership-orchestrator.approval.requested',
  ADMIN_APPROVAL_GRANTED: 'membership-orchestrator.approval.granted',
  ADMIN_APPROVAL_DENIED: 'membership-orchestrator.approval.denied',

  // Progress events
  PROGRESS_UPDATED: 'membership-orchestrator.progress.updated',

  // Retry events
  RETRY_STARTED: 'membership-orchestrator.retry.started',
  RETRY_COMPLETED: 'membership-orchestrator.retry.completed',
  RETRY_EXHAUSTED: 'membership-orchestrator.retry.exhausted',
} as const;

// ========================================
// MEMBERSHIP STATES
// ========================================
export const MEMBERSHIP_STATES = {
  INITIATED: 'initiated',
  PRICING_CALCULATED: 'pricing_calculated',
  PRODUCT_SELECTED: 'product_selected',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_PROCESSING: 'payment_processing',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  ENTITIES_CREATING: 'entities_creating',
  ENTITIES_COMPLETED: 'entities_completed',
  PENDING_ADMIN_APPROVAL: 'pending_admin_approval',
  PENDING_FINANCIAL_VERIFICATION: 'pending_financial_verification',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRY_PENDING: 'retry_pending',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

// ========================================
// VALIDATION RULES
// ========================================
export const MEMBERSHIP_VALIDATION_RULES = {
  // Account must exist before membership
  REQUIRE_EXISTING_ACCOUNT: true,

  // Account must be in specific statuses
  ALLOWED_ACCOUNT_STATUSES: [1, 2], // ACTIVE, PENDING

  // Prevent duplicate memberships
  PREVENT_DUPLICATE_ACTIVE_MEMBERSHIP: true,

  // Category-specific rules
  STUDENT_REQUIRES_EDUCATION_PROOF: false, // Future implementation
  RETIRED_REQUIRES_AGE_VERIFICATION: false, // Future implementation

  // Employment validation
  REQUIRE_EMPLOYMENT_FOR_FULL_MEMBER: true,
  REQUIRE_PRACTICE_INFO_FOR_FULL_MEMBER: true,
} as const;

// ========================================
// DEFAULT VALUES
// ========================================
export const MEMBERSHIP_ORCHESTRATOR_DEFAULTS = {
  TIMEZONE: process.env.TZ || 'America/Toronto',
  DEFAULT_MEMBERSHIP_CATEGORY: 1, // FULL_MEMBER
  DEFAULT_CURRENCY: 'CAD',
  DEFAULT_TAX_RATE: 0.13, // 13% HST (Ontario)
  DEFAULT_PAYMENT_METHOD: 'credit_card',

  // Safe defaults for optional fields
  DEFAULT_RETRY_COUNT: 0,
  DEFAULT_PROGRESS_PERCENTAGE: 0,
} as const;

// ========================================
// BUSINESS RULES
// ========================================
export const MEMBERSHIP_BUSINESS_RULES = {
  // Membership activation
  AUTO_ACTIVATE_AFTER_PAYMENT: true,
  REQUIRE_ADMIN_APPROVAL_FOR_ACTIVATION: false, // Can be enabled per category

  // Insurance requirements
  INSURANCE_MANDATORY_CATEGORIES: [1, 2, 5], // Full, Associate, Provisional
  INSURANCE_OPTIONAL_CATEGORIES: [3], // Student
  INSURANCE_NOT_ALLOWED_CATEGORIES: [4, 6, 7], // Retired, Inactive, Life

  // Payment requirements
  PAYMENT_REQUIRED_CATEGORIES: [1, 2, 3, 5], // All except Retired, Inactive, Life
  ALLOW_PAYMENT_PLANS: false, // Future implementation

  // Category transitions
  ALLOW_CATEGORY_UPGRADE: true,
  ALLOW_CATEGORY_DOWNGRADE: false,
  REQUIRE_APPROVAL_FOR_CATEGORY_CHANGE: true,
} as const;

// ========================================
// INTEGRATION ENDPOINTS
// ========================================
export const MEMBERSHIP_INTEGRATION_ENDPOINTS = {
  // Entity creation endpoints
  MEMBERSHIP_CATEGORY: '/api/membership-category/create',
  MEMBERSHIP_EMPLOYMENT: '/api/membership-employment/create',
  MEMBERSHIP_PRACTICES: '/api/membership-practices/create',
  MEMBERSHIP_PREFERENCES: '/api/membership-preferences/create',
  MEMBERSHIP_SETTINGS: '/api/membership-settings/create',

  // Product/Insurance endpoints
  PRODUCT_LOOKUP: '/api/products/lookup',
  PRODUCT_PRICING: '/api/products/pricing',
  INSURANCE_VALIDATE: '/api/products/insurance/validate',

  // Payment endpoints (placeholder for future payment gateway integration)
  PAYMENT_INTENT_CREATE: '/api/payments/intent/create',
  PAYMENT_PROCESS: '/api/payments/process',
  PAYMENT_VERIFY: '/api/payments/verify',
} as const;

// ========================================
// FEATURE FLAGS
// ========================================
export const MEMBERSHIP_ORCHESTRATOR_FEATURE_FLAGS = {
  // Enable/disable specific features
  ENABLE_PAYMENT_PROCESSING: false, // To be enabled when payment gateway is ready
  ENABLE_INSURANCE_INTEGRATION: true,
  ENABLE_PRICING_CALCULATION: true,
  ENABLE_ADMIN_APPROVAL_WORKFLOW: true,
  ENABLE_FINANCIAL_VERIFICATION: false, // Future implementation
  ENABLE_AUTOMATIC_RENEWAL: false, // Future implementation
  ENABLE_PAYMENT_PLANS: false, // Future implementation

  // Debug and testing
  SKIP_PAYMENT_FOR_TESTING: true, // Allow membership creation without payment in dev
  ALLOW_DUPLICATE_MEMBERSHIP_FOR_TESTING: false,
} as const;

// ========================================
// CENTRALIZED CONSTANTS EXPORT
// ========================================
/**
 * Centralized export of all Membership Orchestrator constants.
 * This provides a single source of truth for all configuration values.
 *
 * @example
 * import { MEMBERSHIP_ORCHESTRATOR_CONSTANTS } from './constants/membership-orchestrator.constants';
 *
 * const sessionKey = MEMBERSHIP_ORCHESTRATOR_CONSTANTS.REDIS_KEYS.MEMBERSHIP_SESSION(sessionId);
 * const timeout = MEMBERSHIP_ORCHESTRATOR_CONSTANTS.TIMEOUTS.MEMBERSHIP_SESSION_TTL;
 */
export const MEMBERSHIP_ORCHESTRATOR_CONSTANTS = {
  ERROR_MAPPINGS: MEMBERSHIP_ORCHESTRATOR_ERROR_MAPPINGS,
  REDIS_KEYS: MEMBERSHIP_ORCHESTRATOR_REDIS_KEYS,
  TIMEOUTS: MEMBERSHIP_ORCHESTRATOR_TIMEOUTS,
  SCHEDULER: MEMBERSHIP_ORCHESTRATOR_SCHEDULER,
  WORKFLOW: MEMBERSHIP_WORKFLOW,
  CATEGORIES: MEMBERSHIP_CATEGORIES,
  PRODUCT_INSURANCE: PRODUCT_INSURANCE_CONFIG,
  PRICING: MEMBERSHIP_PRICING,
  PAYMENT: PAYMENT_PROCESSING,
  EMAILS: MEMBERSHIP_ORCHESTRATOR_EMAILS,
  EVENTS: MEMBERSHIP_ORCHESTRATOR_EVENTS,
  STATES: MEMBERSHIP_STATES,
  VALIDATION_RULES: MEMBERSHIP_VALIDATION_RULES,
  DEFAULTS: MEMBERSHIP_ORCHESTRATOR_DEFAULTS,
  BUSINESS_RULES: MEMBERSHIP_BUSINESS_RULES,
  INTEGRATION_ENDPOINTS: MEMBERSHIP_INTEGRATION_ENDPOINTS,
  FEATURE_FLAGS: MEMBERSHIP_ORCHESTRATOR_FEATURE_FLAGS,
} as const;

// ========================================
// TYPE EXPORTS FOR TYPESCRIPT SAFETY
// ========================================

/**
 * Entity types in the membership creation workflow
 */
export type MembershipEntityType =
  (typeof MEMBERSHIP_WORKFLOW.ENTITY_CREATION_ORDER)[number];

/**
 * Membership category type (1-7)
 */
export type MembershipCategoryType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Valid membership category values
 */
export type MembershipCategoryValue = (typeof MEMBERSHIP_CATEGORIES)[keyof Omit<
  typeof MEMBERSHIP_CATEGORIES,
  | 'CATEGORY_NAMES'
  | 'PAID_CATEGORIES'
  | 'INSURANCE_REQUIRED_CATEGORIES'
  | 'DISCOUNTED_CATEGORIES'
>];

/**
 * Payment method types
 */
export type PaymentMethodType =
  (typeof PAYMENT_PROCESSING.SUPPORTED_METHODS)[number];

/**
 * Payment state types
 */
export type PaymentStateType =
  (typeof PAYMENT_PROCESSING.PAYMENT_STATES)[keyof typeof PAYMENT_PROCESSING.PAYMENT_STATES];

/**
 * Membership workflow state types
 */
export type MembershipStateType =
  (typeof MEMBERSHIP_STATES)[keyof typeof MEMBERSHIP_STATES];

/**
 * Insurance types available in the system
 */
export type InsuranceType =
  | typeof PRODUCT_INSURANCE_CONFIG.PROFESSIONAL_LIABILITY
  | typeof PRODUCT_INSURANCE_CONFIG.EXTENDED_COVERAGE
  | typeof PRODUCT_INSURANCE_CONFIG.CYBER_LIABILITY;

/**
 * Email template types for membership orchestrator
 */
export type MembershipEmailTemplateType =
  (typeof MEMBERSHIP_ORCHESTRATOR_EMAILS)[keyof typeof MEMBERSHIP_ORCHESTRATOR_EMAILS];

/**
 * Event types for membership orchestrator
 */
export type MembershipEventType =
  (typeof MEMBERSHIP_ORCHESTRATOR_EVENTS)[keyof typeof MEMBERSHIP_ORCHESTRATOR_EVENTS];

/**
 * Required entities that must succeed
 */
export type RequiredEntityType =
  (typeof MEMBERSHIP_WORKFLOW.REQUIRED_ENTITIES)[number];

/**
 * Optional entities that can fail without blocking
 */
export type OptionalEntityType =
  (typeof MEMBERSHIP_WORKFLOW.OPTIONAL_ENTITIES)[number];

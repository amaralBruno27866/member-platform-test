/**
 * Account Orchestrator Constants
 *
 * Centralizes configuration values, timeouts, Redis keys, and other constants
 * specific to the Account Orchestrator workflow in the OSOT Dataverse API.
 *
 * This orchestrator coordinates the complete user registration process across
 * multiple entities: Account, Address, Contact, Identity, Education, and Management.
 */

import { ErrorCodes } from '../../../../common/errors/error-codes';

// ========================================
// ERROR CODE MAPPINGS
// ========================================
export const ORCHESTRATOR_ERROR_MAPPINGS = {
  REGISTRATION_SESSION_NOT_FOUND: ErrorCodes.NOT_FOUND,
  REGISTRATION_SESSION_EXPIRED: ErrorCodes.ACCOUNT_SESSION_EXPIRED,
  ENTITY_CREATION_FAILED: ErrorCodes.INTERNAL_ERROR,
  ACCOUNT_GUID_NOT_FOUND: ErrorCodes.ACCOUNT_NOT_FOUND,
  PARTIAL_REGISTRATION_FAILURE: ErrorCodes.INTERNAL_ERROR,
  VALIDATION_ERROR: ErrorCodes.VALIDATION_ERROR,
  PERMISSION_DENIED: ErrorCodes.PERMISSION_DENIED,
  DATAVERSE_ERROR: ErrorCodes.DATAVERSE_SERVICE_ERROR,
  REDIS_ERROR: ErrorCodes.REDIS_SERVICE_ERROR,
  EMAIL_ERROR: ErrorCodes.EMAIL_SERVICE_ERROR,
} as const;

// ========================================
// REDIS CONFIGURATION
// ========================================
export const ORCHESTRATOR_REDIS_KEYS = {
  // Main registration session
  REGISTRATION_SESSION: (sessionId: string) =>
    `orchestrator:session:${sessionId}`,

  // Progress tracking
  REGISTRATION_PROGRESS: (sessionId: string) =>
    `orchestrator:progress:${sessionId}`,

  // Account GUID storage (temporary after account creation)
  ACCOUNT_GUID: (sessionId: string) => `orchestrator:account_guid:${sessionId}`,

  // Failed entities queue for retry
  FAILED_ENTITIES: (sessionId: string) => `orchestrator:failed:${sessionId}`,

  // Retry queue
  RETRY_QUEUE: (sessionId: string) => `orchestrator:retry:${sessionId}`,

  // Session locks (prevent concurrent processing)
  SESSION_LOCK: (sessionId: string) => `orchestrator:lock:${sessionId}`,

  // Cleanup patterns
  ALL_SESSIONS: 'orchestrator:session:*',
  ALL_PROGRESS: 'orchestrator:progress:*',
  ALL_LOCKS: 'orchestrator:lock:*',
  EXPIRED_SESSIONS: 'orchestrator:session:*:expired',
} as const;

// ========================================
// TIMEOUT CONFIGURATION
// ========================================
export const ORCHESTRATOR_TIMEOUTS = {
  // Session timeouts (in seconds)
  REGISTRATION_SESSION_TTL:
    parseInt(
      process.env.REGISTRATION_EMAIL_CONFIRMATION_TIMEOUT_HOURS || '24',
    ) * 3600,
  ACCOUNT_GUID_TTL: 3600, // 1 hour to complete entity creation after account
  PROGRESS_LOCK_TTL: 300, // 5 minutes for processing lock
  RETRY_QUEUE_TTL: 86400, // 24 hours for retry attempts

  // Processing timeouts
  ENTITY_CREATION_TIMEOUT: 30000, // 30 seconds per entity creation
  EMAIL_VERIFICATION_TIMEOUT:
    parseInt(
      process.env.REGISTRATION_EMAIL_CONFIRMATION_TIMEOUT_HOURS || '24',
    ) * 3600,
  ADMIN_APPROVAL_TIMEOUT:
    parseInt(process.env.REGISTRATION_CLEANUP_PENDING_DAYS || '7') * 86400,
} as const;

// ========================================
// SCHEDULER CONFIGURATION
// ========================================
export const ORCHESTRATOR_SCHEDULER = {
  // Registration workflow monitoring
  REGISTRATION_REMINDER_INTERVAL: '*/30 * * * *', // Every 30 minutes
  REGISTRATION_RETRY_INTERVAL: '0 */1 * * *', // Every hour

  // Cleanup schedules
  SESSION_CLEANUP_INTERVAL: '0 */6 * * *', // Every 6 hours
  DAILY_CLEANUP_INTERVAL: '0 2 * * *', // Daily at 2 AM

  // Health monitoring
  HEALTH_CHECK_INTERVAL: '0 8 * * 1', // Monday at 8 AM
  STATISTICS_UPDATE_INTERVAL: '0 */4 * * *', // Every 4 hours
} as const;

// ========================================
// REGISTRATION WORKFLOW CONFIGURATION
// ========================================
export const REGISTRATION_WORKFLOW = {
  // Entity creation order (CRITICAL - Account must be first)
  ENTITY_CREATION_ORDER: [
    'account',
    'address',
    'contact',
    'identity',
    'education',
    'management',
  ] as const,

  // Required entities (all must succeed)
  REQUIRED_ENTITIES: [
    'account',
    'address',
    'contact',
    'identity',
    'education',
  ] as const,

  // Optional entities (can fail without blocking workflow)
  OPTIONAL_ENTITIES: ['management'] as const,

  // Retry configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_BACKOFF_MULTIPLIER: 2, // 1s, 2s, 4s
  INITIAL_RETRY_DELAY: 1000, // 1 second
} as const;

// ========================================
// ENTITY ENDPOINTS CONFIGURATION
// ========================================
export const ENTITY_ENDPOINTS = {
  account: '/public/accounts/register',
  address: '/public/addresses/create',
  contact: '/public/contacts/create',
  identity: '/public/identities/create',
  'ot-education': '/public/ot-education/create',
  'ota-education': '/public/ota-education/create',
  management: '/public/managements/create',
} as const;

// ========================================
// EMAIL CONFIGURATION
// ========================================
export const ORCHESTRATOR_EMAILS = {
  REGISTRATION_REMINDER: 'orchestrator-registration-reminder',
  REGISTRATION_FAILED: 'orchestrator-registration-failed',
  PARTIAL_SUCCESS: 'orchestrator-partial-success',
  ADMIN_NOTIFICATION: 'orchestrator-admin-notification',
} as const;

// ========================================
// EVENT TYPES
// ========================================
export const ORCHESTRATOR_EVENTS = {
  // Registration lifecycle
  REGISTRATION_STARTED: 'orchestrator.registration.started',
  REGISTRATION_COMPLETED: 'orchestrator.registration.completed',
  REGISTRATION_FAILED: 'orchestrator.registration.failed',

  // Entity events
  ENTITY_CREATION_STARTED: 'orchestrator.entity.creation.started',
  ENTITY_CREATION_COMPLETED: 'orchestrator.entity.creation.completed',
  ENTITY_CREATION_FAILED: 'orchestrator.entity.creation.failed',

  // Progress events
  PROGRESS_UPDATED: 'orchestrator.progress.updated',

  // Retry events
  RETRY_STARTED: 'orchestrator.retry.started',
  RETRY_COMPLETED: 'orchestrator.retry.completed',
  RETRY_EXHAUSTED: 'orchestrator.retry.exhausted',
} as const;

// ========================================
// REGISTRATION STATES
// ========================================
export const REGISTRATION_STATES = {
  STAGED: 'staged',
  EMAIL_VERIFIED: 'email_verified',
  ACCOUNT_CREATED: 'account_created',
  ENTITIES_CREATING: 'entities_creating',
  ENTITIES_COMPLETED: 'entities_completed',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRY_PENDING: 'retry_pending',
} as const;

// ========================================
// DEFAULT VALUES
// ========================================
export const ORCHESTRATOR_DEFAULTS = {
  TIMEZONE: process.env.TZ || 'America/Toronto',
  EDUCATION_TYPE: 'ot' as 'ot' | 'ota',
  MANAGEMENT_FLAGS_DEFAULT: {
    osot_life_member_retired: false,
    osot_shadowing: false,
    osot_passed_away: false,
    osot_vendor: false,
    osot_advertising: false,
    osot_recruitment: false,
    osot_driver_rehab: false,
  },
} as const;

// ========================================
// CENTRALIZED CONSTANTS EXPORT
// ========================================
export const ORCHESTRATOR_CONSTANTS = {
  ERROR_MAPPINGS: ORCHESTRATOR_ERROR_MAPPINGS,
  REDIS_KEYS: ORCHESTRATOR_REDIS_KEYS,
  TIMEOUTS: ORCHESTRATOR_TIMEOUTS,
  SCHEDULER: ORCHESTRATOR_SCHEDULER,
  WORKFLOW: REGISTRATION_WORKFLOW,
  ENDPOINTS: ENTITY_ENDPOINTS,
  EMAILS: ORCHESTRATOR_EMAILS,
  EVENTS: ORCHESTRATOR_EVENTS,
  STATES: REGISTRATION_STATES,
  DEFAULTS: ORCHESTRATOR_DEFAULTS,
} as const;

// Type exports for TypeScript
export type EntityType =
  (typeof REGISTRATION_WORKFLOW.ENTITY_CREATION_ORDER)[number];

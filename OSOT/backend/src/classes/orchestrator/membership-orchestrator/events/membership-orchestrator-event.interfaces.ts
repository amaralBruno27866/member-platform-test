/**
 * Membership Orchestrator Event Interfaces
 *
 * Defines all event types and payloads for the membership orchestrator workflow.
 * Events provide observability and enable reactive programming patterns.
 */

import { MembershipState } from '../enums/membership-state.enum';
import { MembershipEntityType } from '../constants/membership-orchestrator.constants';

// ========================================
// EVENT TYPE CONSTANTS
// ========================================

export const MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES = {
  // Membership lifecycle events
  MEMBERSHIP_INITIATED: 'membership-orchestrator.membership.initiated',
  MEMBERSHIP_VALIDATED: 'membership-orchestrator.membership.validated',
  MEMBERSHIP_STAGED: 'membership-orchestrator.membership.staged',
  MEMBERSHIP_STATUS_CHANGED:
    'membership-orchestrator.membership.status-changed',
  MEMBERSHIP_COMPLETED: 'membership-orchestrator.membership.completed',
  MEMBERSHIP_FAILED: 'membership-orchestrator.membership.failed',
  MEMBERSHIP_EXPIRED: 'membership-orchestrator.membership.expired',
  MEMBERSHIP_CANCELLED: 'membership-orchestrator.membership.cancelled',

  // Entity creation events
  ENTITY_CREATION_STARTED: 'membership-orchestrator.entity.creation-started',
  ENTITY_CREATION_COMPLETED:
    'membership-orchestrator.entity.creation-completed',
  ENTITY_CREATION_FAILED: 'membership-orchestrator.entity.creation-failed',

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
  ADMIN_APPROVAL_REJECTED: 'membership-orchestrator.approval.rejected',

  // Account update events
  ACCOUNT_STATUS_UPDATED: 'membership-orchestrator.account.status-updated',
} as const;

export type MembershipOrchestratorEventType =
  (typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES)[keyof typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES];

// ========================================
// BASE EVENT INTERFACE
// ========================================

export interface MembershipOrchestratorEvent {
  type: MembershipOrchestratorEventType;
  sessionId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ========================================
// MEMBERSHIP LIFECYCLE EVENTS
// ========================================

export interface MembershipInitiatedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_INITIATED;
  accountId: string;
  organizationId: string;
  membershipYear: string;
  category: number;
  email: string;
  firstName: string;
  lastName: string;
  expiresAt: Date;
}

export interface MembershipValidatedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_VALIDATED;
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  validationDuration: number;
}

export interface MembershipStagedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_STAGED;
  accountId: string;
  organizationId: string;
  email: string;
  progressPercentage: number;
  expiresAt: Date;
}

export interface MembershipStatusChangedEvent
  extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_STATUS_CHANGED;
  previousStatus: MembershipState;
  newStatus: MembershipState;
  reason?: string;
  triggeredBy?: string; // userId or 'system'
}

export interface MembershipCompletedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_COMPLETED;
  accountId: string;
  organizationId: string;
  email: string;
  totalDuration: number;
  entitiesCreated: MembershipEntityType[];
}

export interface MembershipFailedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_FAILED;
  accountId?: string;
  email: string;
  error: string;
  errorCode: string;
  stage: string;
  totalDuration: number;
  partialData?: {
    createdEntities: MembershipEntityType[];
    failedEntity?: MembershipEntityType;
  };
}

export interface MembershipExpiredEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_EXPIRED;
  accountId?: string;
  email?: string;
  expiredAt: Date;
  lastStatus: MembershipState;
  sessionDuration: number;
}

export interface MembershipCancelledEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_CANCELLED;
  accountId?: string;
  cancelledBy: string; // userId or 'system'
  reason?: string;
  currentStatus: MembershipState;
}

// ========================================
// ENTITY CREATION EVENTS
// ========================================

export interface EntityCreationStartedEvent
  extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ENTITY_CREATION_STARTED;
  entityType: MembershipEntityType;
  entityOrder: number;
  totalEntities: number;
  accountId: string;
}

export interface EntityCreationCompletedEvent
  extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ENTITY_CREATION_COMPLETED;
  entityType: MembershipEntityType;
  entityId: string;
  duration: number;
  progressPercentage: number;
}

export interface EntityCreationFailedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ENTITY_CREATION_FAILED;
  entityType: MembershipEntityType;
  error: string;
  errorCode?: string;
  retryCount: number;
  willRetry: boolean;
}

// ========================================
// PRICING EVENTS
// ========================================

export interface PricingCalculatedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PRICING_CALCULATED;
  accountId: string;
  category: number;
  basePrice: number;
  insurancePrice: number;
  totalPrice: number;
  currency: string;
  calculationDuration: number;
}

export interface PricingErrorEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PRICING_ERROR;
  error: string;
  category?: number;
  insuranceSelection?: any;
}

// ========================================
// PRODUCT/INSURANCE EVENTS
// ========================================

export interface ProductSelectedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PRODUCT_SELECTED;
  productId: string;
  productType: string;
  coverageAmount?: number;
}

export interface InsuranceValidatedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.INSURANCE_VALIDATED;
  isValid: boolean;
  insuranceType: string;
  coverageAmount: number;
  errors?: string[];
}

// ========================================
// PAYMENT EVENTS
// ========================================

export interface PaymentInitiatedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PAYMENT_INITIATED;
  accountId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentIntentId?: string;
}

export interface PaymentProcessingEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PAYMENT_PROCESSING;
  paymentIntentId: string;
  amount: number;
  paymentMethod: string;
}

export interface PaymentCompletedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PAYMENT_COMPLETED;
  accountId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  paymentIntentId?: string;
  processingDuration: number;
}

export interface PaymentFailedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PAYMENT_FAILED;
  accountId: string;
  amount: number;
  paymentMethod: string;
  error: string;
  errorCode?: string;
  retryCount: number;
  canRetry: boolean;
}

// ========================================
// APPROVAL EVENTS
// ========================================

export interface AdminApprovalRequestedEvent
  extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ADMIN_APPROVAL_REQUESTED;
  accountId: string;
  email: string;
  category: number;
  requestedAt: Date;
}

export interface AdminApprovalGrantedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ADMIN_APPROVAL_GRANTED;
  accountId: string;
  approvedBy: string;
  approvalNotes?: string;
  approvalDuration: number;
}

export interface AdminApprovalRejectedEvent
  extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ADMIN_APPROVAL_REJECTED;
  accountId: string;
  rejectedBy: string;
  rejectionReason: string;
  rejectionDuration: number;
}

// ========================================
// ACCOUNT UPDATE EVENTS
// ========================================

export interface AccountStatusUpdatedEvent extends MembershipOrchestratorEvent {
  type: typeof MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ACCOUNT_STATUS_UPDATED;
  accountId: string;
  previousActiveMember: boolean;
  newActiveMember: boolean;
  membershipYear: string;
}

// ========================================
// UNION TYPE FOR ALL EVENTS
// ========================================

export type MembershipOrchestratorEventPayload =
  | MembershipInitiatedEvent
  | MembershipValidatedEvent
  | MembershipStagedEvent
  | MembershipStatusChangedEvent
  | MembershipCompletedEvent
  | MembershipFailedEvent
  | MembershipExpiredEvent
  | MembershipCancelledEvent
  | EntityCreationStartedEvent
  | EntityCreationCompletedEvent
  | EntityCreationFailedEvent
  | PricingCalculatedEvent
  | PricingErrorEvent
  | ProductSelectedEvent
  | InsuranceValidatedEvent
  | PaymentInitiatedEvent
  | PaymentProcessingEvent
  | PaymentCompletedEvent
  | PaymentFailedEvent
  | AdminApprovalRequestedEvent
  | AdminApprovalGrantedEvent
  | AdminApprovalRejectedEvent
  | AccountStatusUpdatedEvent;

/**
 * Membership State Enum
 *
 * Defines all possible states during the membership registration workflow.
 * States progress through a linear flow from initiated to completed/failed.
 *
 * WORKFLOW PHASES:
 * 1. Initiation: INITIATED → VALIDATING
 * 2. Pricing (future): PRICING_CALCULATED → PAYMENT_PENDING → PAYMENT_COMPLETED
 * 3. Entity Creation: CREATING_ENTITIES → COMPLETED
 * 4. Terminal States: FAILED, EXPIRED, CANCELLED
 */

export enum MembershipState {
  /**
   * Initial state - Membership data received and session created
   * Next: VALIDATING
   */
  INITIATED = 'initiated',

  /**
   * Business rules validation in progress
   * Next: PRICING_CALCULATED | CREATING_ENTITIES (if no payment) | FAILED
   */
  VALIDATING = 'validating',

  /**
   * Pricing calculated based on category and insurance
   * Next: PAYMENT_PENDING | CREATING_ENTITIES (if free category)
   */
  PRICING_CALCULATED = 'pricing_calculated',

  /**
   * Product/Insurance selected and confirmed
   * Next: PAYMENT_PENDING
   */
  PRODUCT_SELECTED = 'product_selected',

  /**
   * Awaiting payment from user
   * Next: PAYMENT_PROCESSING | FAILED | EXPIRED | CANCELLED
   */
  PAYMENT_PENDING = 'payment_pending',

  /**
   * Payment is being processed by payment gateway
   * Next: PAYMENT_COMPLETED | PAYMENT_FAILED
   */
  PAYMENT_PROCESSING = 'payment_processing',

  /**
   * Payment successfully completed
   * Next: CREATING_ENTITIES
   */
  PAYMENT_COMPLETED = 'payment_completed',

  /**
   * Payment failed (can retry)
   * Next: PAYMENT_PENDING | FAILED | CANCELLED
   */
  PAYMENT_FAILED = 'payment_failed',

  /**
   * Creating membership entities in Dataverse
   * Next: COMPLETED | FAILED
   */
  CREATING_ENTITIES = 'creating_entities',

  /**
   * All entities created successfully
   * Next: PENDING_ADMIN_APPROVAL (if required) | COMPLETED
   */
  ENTITIES_COMPLETED = 'entities_completed',

  /**
   * Awaiting admin approval (for certain categories)
   * Next: APPROVED | REJECTED
   */
  PENDING_ADMIN_APPROVAL = 'pending_admin_approval',

  /**
   * Awaiting financial verification
   * Next: APPROVED | REJECTED
   */
  PENDING_FINANCIAL_VERIFICATION = 'pending_financial_verification',

  /**
   * Admin approved the membership
   * Next: COMPLETED
   */
  APPROVED = 'approved',

  /**
   * Admin rejected the membership
   * Terminal state
   */
  REJECTED = 'rejected',

  /**
   * Membership registration completed successfully
   * Terminal state (success)
   */
  COMPLETED = 'completed',

  /**
   * Membership registration failed during processing
   * Terminal state (error)
   */
  FAILED = 'failed',

  /**
   * Retry pending after temporary failure
   * Next: CREATING_ENTITIES | FAILED
   */
  RETRY_PENDING = 'retry_pending',

  /**
   * Membership session has expired (TTL exceeded)
   * Terminal state
   */
  EXPIRED = 'expired',

  /**
   * Membership registration was cancelled by user or admin
   * Terminal state
   */
  CANCELLED = 'cancelled',
}

/**
 * Type alias for string literal types
 */
export type MembershipStateValue = `${MembershipState}`;

/**
 * Membership state transitions mapping
 * Defines which states can transition to which other states
 */
export const MEMBERSHIP_STATE_TRANSITIONS: Record<
  MembershipState,
  MembershipState[]
> = {
  [MembershipState.INITIATED]: [
    MembershipState.VALIDATING,
    MembershipState.FAILED,
    MembershipState.CANCELLED,
    MembershipState.EXPIRED,
  ],
  [MembershipState.VALIDATING]: [
    MembershipState.PRICING_CALCULATED,
    MembershipState.CREATING_ENTITIES, // Skip pricing for free categories
    MembershipState.FAILED,
    MembershipState.CANCELLED,
    MembershipState.EXPIRED,
  ],
  [MembershipState.PRICING_CALCULATED]: [
    MembershipState.PRODUCT_SELECTED,
    MembershipState.PAYMENT_PENDING,
    MembershipState.CREATING_ENTITIES, // Skip payment for free categories
    MembershipState.FAILED,
    MembershipState.CANCELLED,
    MembershipState.EXPIRED,
  ],
  [MembershipState.PRODUCT_SELECTED]: [
    MembershipState.PAYMENT_PENDING,
    MembershipState.FAILED,
    MembershipState.CANCELLED,
    MembershipState.EXPIRED,
  ],
  [MembershipState.PAYMENT_PENDING]: [
    MembershipState.PAYMENT_PROCESSING,
    MembershipState.PAYMENT_FAILED,
    MembershipState.FAILED,
    MembershipState.CANCELLED,
    MembershipState.EXPIRED,
  ],
  [MembershipState.PAYMENT_PROCESSING]: [
    MembershipState.PAYMENT_COMPLETED,
    MembershipState.PAYMENT_FAILED,
    MembershipState.FAILED,
  ],
  [MembershipState.PAYMENT_COMPLETED]: [
    MembershipState.CREATING_ENTITIES,
    MembershipState.FAILED,
  ],
  [MembershipState.PAYMENT_FAILED]: [
    MembershipState.PAYMENT_PENDING, // Allow retry
    MembershipState.RETRY_PENDING,
    MembershipState.FAILED,
    MembershipState.CANCELLED,
  ],
  [MembershipState.CREATING_ENTITIES]: [
    MembershipState.ENTITIES_COMPLETED,
    MembershipState.RETRY_PENDING,
    MembershipState.FAILED,
  ],
  [MembershipState.ENTITIES_COMPLETED]: [
    MembershipState.PENDING_ADMIN_APPROVAL, // If approval required
    MembershipState.PENDING_FINANCIAL_VERIFICATION, // If financial verification required
    MembershipState.COMPLETED, // Auto-complete for most cases
  ],
  [MembershipState.PENDING_ADMIN_APPROVAL]: [
    MembershipState.APPROVED,
    MembershipState.REJECTED,
    MembershipState.EXPIRED,
  ],
  [MembershipState.PENDING_FINANCIAL_VERIFICATION]: [
    MembershipState.APPROVED,
    MembershipState.REJECTED,
    MembershipState.EXPIRED,
  ],
  [MembershipState.APPROVED]: [MembershipState.COMPLETED],
  [MembershipState.REJECTED]: [], // Terminal state
  [MembershipState.COMPLETED]: [], // Terminal state
  [MembershipState.FAILED]: [
    MembershipState.RETRY_PENDING, // Allow manual retry
  ],
  [MembershipState.RETRY_PENDING]: [
    MembershipState.CREATING_ENTITIES,
    MembershipState.PAYMENT_PENDING, // Retry payment
    MembershipState.FAILED,
  ],
  [MembershipState.EXPIRED]: [], // Terminal state
  [MembershipState.CANCELLED]: [], // Terminal state
};

/**
 * Terminal states - workflow cannot progress further
 */
export const TERMINAL_STATES: MembershipState[] = [
  MembershipState.COMPLETED,
  MembershipState.REJECTED,
  MembershipState.FAILED,
  MembershipState.EXPIRED,
  MembershipState.CANCELLED,
];

/**
 * Success states - membership is active
 */
export const SUCCESS_STATES: MembershipState[] = [
  MembershipState.COMPLETED,
  MembershipState.APPROVED,
];

/**
 * Error states - something went wrong
 */
export const ERROR_STATES: MembershipState[] = [
  MembershipState.FAILED,
  MembershipState.REJECTED,
  MembershipState.PAYMENT_FAILED,
];

/**
 * Pending states - requires action
 */
export const PENDING_STATES: MembershipState[] = [
  MembershipState.PAYMENT_PENDING,
  MembershipState.PENDING_ADMIN_APPROVAL,
  MembershipState.PENDING_FINANCIAL_VERIFICATION,
  MembershipState.RETRY_PENDING,
];

/**
 * Processing states - workflow in progress
 */
export const PROCESSING_STATES: MembershipState[] = [
  MembershipState.VALIDATING,
  MembershipState.PAYMENT_PROCESSING,
  MembershipState.CREATING_ENTITIES,
];

/**
 * Get display-friendly name for membership state
 */
export function getMembershipStateDisplayName(state: MembershipState): string {
  switch (state) {
    case MembershipState.INITIATED:
      return 'Initiated';
    case MembershipState.VALIDATING:
      return 'Validating';
    case MembershipState.PRICING_CALCULATED:
      return 'Pricing Calculated';
    case MembershipState.PRODUCT_SELECTED:
      return 'Product Selected';
    case MembershipState.PAYMENT_PENDING:
      return 'Payment Pending';
    case MembershipState.PAYMENT_PROCESSING:
      return 'Processing Payment';
    case MembershipState.PAYMENT_COMPLETED:
      return 'Payment Completed';
    case MembershipState.PAYMENT_FAILED:
      return 'Payment Failed';
    case MembershipState.CREATING_ENTITIES:
      return 'Creating Membership';
    case MembershipState.ENTITIES_COMPLETED:
      return 'Entities Created';
    case MembershipState.PENDING_ADMIN_APPROVAL:
      return 'Pending Admin Approval';
    case MembershipState.PENDING_FINANCIAL_VERIFICATION:
      return 'Pending Financial Verification';
    case MembershipState.APPROVED:
      return 'Approved';
    case MembershipState.REJECTED:
      return 'Rejected';
    case MembershipState.COMPLETED:
      return 'Completed';
    case MembershipState.FAILED:
      return 'Failed';
    case MembershipState.RETRY_PENDING:
      return 'Retry Pending';
    case MembershipState.EXPIRED:
      return 'Expired';
    case MembershipState.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Check if a state is terminal (workflow cannot progress)
 */
export function isTerminalState(state: MembershipState): boolean {
  return TERMINAL_STATES.includes(state);
}

/**
 * Check if a state is a success state
 */
export function isSuccessState(state: MembershipState): boolean {
  return SUCCESS_STATES.includes(state);
}

/**
 * Check if a state is an error state
 */
export function isErrorState(state: MembershipState): boolean {
  return ERROR_STATES.includes(state);
}

/**
 * Check if a state is pending user/admin action
 */
export function isPendingState(state: MembershipState): boolean {
  return PENDING_STATES.includes(state);
}

/**
 * Check if a state is actively processing
 */
export function isProcessingState(state: MembershipState): boolean {
  return PROCESSING_STATES.includes(state);
}

/**
 * Check if state transition is valid
 */
export function canTransitionTo(
  fromState: MembershipState,
  toState: MembershipState,
): boolean {
  const allowedTransitions = MEMBERSHIP_STATE_TRANSITIONS[fromState];
  return allowedTransitions.includes(toState);
}

/**
 * Get next possible states from current state
 */
export function getNextPossibleStates(
  currentState: MembershipState,
): MembershipState[] {
  return MEMBERSHIP_STATE_TRANSITIONS[currentState] || [];
}

/**
 * Get user-friendly description of what the state means
 */
export function getMembershipStateDescription(state: MembershipState): string {
  switch (state) {
    case MembershipState.INITIATED:
      return 'Your membership registration has been initiated.';
    case MembershipState.VALIDATING:
      return 'We are validating your membership information.';
    case MembershipState.PRICING_CALCULATED:
      return 'Your membership pricing has been calculated.';
    case MembershipState.PRODUCT_SELECTED:
      return 'Your insurance/product selection has been confirmed.';
    case MembershipState.PAYMENT_PENDING:
      return 'Payment is pending. Please complete your payment.';
    case MembershipState.PAYMENT_PROCESSING:
      return 'Your payment is being processed. Please wait.';
    case MembershipState.PAYMENT_COMPLETED:
      return 'Payment completed successfully.';
    case MembershipState.PAYMENT_FAILED:
      return 'Payment failed. Please try again.';
    case MembershipState.CREATING_ENTITIES:
      return 'We are setting up your membership. This may take a moment.';
    case MembershipState.ENTITIES_COMPLETED:
      return 'Your membership has been created and is being finalized.';
    case MembershipState.PENDING_ADMIN_APPROVAL:
      return 'Your membership is pending admin approval.';
    case MembershipState.PENDING_FINANCIAL_VERIFICATION:
      return 'Your payment is being verified by our financial team.';
    case MembershipState.APPROVED:
      return 'Your membership has been approved!';
    case MembershipState.REJECTED:
      return 'Your membership application was not approved.';
    case MembershipState.COMPLETED:
      return 'Your membership is now active!';
    case MembershipState.FAILED:
      return 'Membership registration failed. Please contact support.';
    case MembershipState.RETRY_PENDING:
      return 'Retrying membership creation.';
    case MembershipState.EXPIRED:
      return 'Your membership session has expired. Please start again.';
    case MembershipState.CANCELLED:
      return 'Membership registration was cancelled.';
    default:
      return 'Unknown status.';
  }
}

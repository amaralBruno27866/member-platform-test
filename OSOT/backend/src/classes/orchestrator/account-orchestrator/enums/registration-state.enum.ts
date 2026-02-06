/**
 * Registration State Enum
 *
 * Defines all possible states during the user registration workflow.
 * States progress through a linear flow from initiated to completed/failed.
 */

export enum RegistrationState {
  /**
   * Initial state - Registration data received and session created
   */
  STAGED = 'staged',

  /**
   * Email verification sent and pending user action
   */
  EMAIL_VERIFICATION_PENDING = 'email_verification_pending',

  /**
   * Email has been verified by user
   */
  EMAIL_VERIFIED = 'email_verified',

  /**
   * Registration is pending admin approval
   */
  PENDING_APPROVAL = 'pending_approval',

  /**
   * Registration has been approved by admin
   */
  APPROVED = 'approved',

  /**
   * Registration has been rejected by admin
   */
  REJECTED = 'rejected',

  /**
   * Entity creation is in progress
   */
  PROCESSING = 'processing',

  /**
   * Registration completed successfully - all entities created
   */
  COMPLETED = 'completed',

  /**
   * Registration failed during processing
   */
  FAILED = 'failed',

  /**
   * Registration session has expired
   */
  EXPIRED = 'expired',

  /**
   * Registration was cancelled by user or admin
   */
  CANCELLED = 'cancelled',
}

/**
 * Type alias for string literal types
 */
export type RegistrationStateValue = `${RegistrationState}`;

/**
 * Registration state transitions mapping
 * Defines which states can transition to which other states
 */
export const REGISTRATION_STATE_TRANSITIONS: Record<
  RegistrationState,
  RegistrationState[]
> = {
  [RegistrationState.STAGED]: [
    RegistrationState.EMAIL_VERIFICATION_PENDING,
    RegistrationState.PENDING_APPROVAL, // Skip email verification if not required
    RegistrationState.FAILED,
    RegistrationState.CANCELLED,
    RegistrationState.EXPIRED,
  ],
  [RegistrationState.EMAIL_VERIFICATION_PENDING]: [
    RegistrationState.EMAIL_VERIFIED,
    RegistrationState.FAILED,
    RegistrationState.CANCELLED,
    RegistrationState.EXPIRED,
  ],
  [RegistrationState.EMAIL_VERIFIED]: [
    RegistrationState.PENDING_APPROVAL,
    RegistrationState.APPROVED, // Auto-approval scenarios
    RegistrationState.FAILED,
    RegistrationState.CANCELLED,
    RegistrationState.EXPIRED,
  ],
  [RegistrationState.PENDING_APPROVAL]: [
    RegistrationState.APPROVED,
    RegistrationState.REJECTED,
    RegistrationState.CANCELLED,
    RegistrationState.EXPIRED,
  ],
  [RegistrationState.APPROVED]: [
    RegistrationState.PROCESSING,
    RegistrationState.FAILED,
    RegistrationState.CANCELLED,
  ],
  [RegistrationState.REJECTED]: [
    // Terminal state - no transitions allowed
  ],
  [RegistrationState.PROCESSING]: [
    RegistrationState.COMPLETED,
    RegistrationState.FAILED,
  ],
  [RegistrationState.COMPLETED]: [
    // Terminal state - no transitions allowed
  ],
  [RegistrationState.FAILED]: [
    RegistrationState.STAGED, // Allow retry from beginning
    RegistrationState.CANCELLED,
  ],
  [RegistrationState.EXPIRED]: [
    RegistrationState.STAGED, // Allow restart
    RegistrationState.CANCELLED,
  ],
  [RegistrationState.CANCELLED]: [
    // Terminal state - no transitions allowed
  ],
};

/**
 * Helper functions for state management
 */
export class RegistrationStateHelper {
  /**
   * Check if a state transition is valid
   */
  static isValidTransition(
    from: RegistrationState,
    to: RegistrationState,
  ): boolean {
    const allowedTransitions = REGISTRATION_STATE_TRANSITIONS[from];
    return allowedTransitions.includes(to);
  }

  /**
   * Get all possible next states for a given state
   */
  static getNextStates(state: RegistrationState): RegistrationState[] {
    return REGISTRATION_STATE_TRANSITIONS[state] || [];
  }

  /**
   * Check if a state is terminal (no further transitions)
   */
  static isTerminalState(state: RegistrationState): boolean {
    return REGISTRATION_STATE_TRANSITIONS[state].length === 0;
  }

  /**
   * Check if a state indicates success
   */
  static isSuccessState(state: RegistrationState): boolean {
    return state === RegistrationState.COMPLETED;
  }

  /**
   * Check if a state indicates failure
   */
  static isFailureState(state: RegistrationState): boolean {
    return [
      RegistrationState.FAILED,
      RegistrationState.REJECTED,
      RegistrationState.EXPIRED,
      RegistrationState.CANCELLED,
    ].includes(state);
  }

  /**
   * Check if a state indicates pending/in-progress
   */
  static isPendingState(state: RegistrationState): boolean {
    return [
      RegistrationState.STAGED,
      RegistrationState.EMAIL_VERIFICATION_PENDING,
      RegistrationState.EMAIL_VERIFIED,
      RegistrationState.PENDING_APPROVAL,
      RegistrationState.APPROVED,
      RegistrationState.PROCESSING,
    ].includes(state);
  }

  /**
   * Get human-readable description of state
   */
  static getStateDescription(state: RegistrationState): string {
    const descriptions: Record<RegistrationState, string> = {
      [RegistrationState.STAGED]: 'Registration data validated and staged',
      [RegistrationState.EMAIL_VERIFICATION_PENDING]:
        'Waiting for email verification',
      [RegistrationState.EMAIL_VERIFIED]: 'Email verified successfully',
      [RegistrationState.PENDING_APPROVAL]: 'Pending administrator approval',
      [RegistrationState.APPROVED]: 'Approved by administrator',
      [RegistrationState.REJECTED]: 'Rejected by administrator',
      [RegistrationState.PROCESSING]: 'Creating user account entities',
      [RegistrationState.COMPLETED]: 'Registration completed successfully',
      [RegistrationState.FAILED]: 'Registration failed',
      [RegistrationState.EXPIRED]: 'Registration session expired',
      [RegistrationState.CANCELLED]: 'Registration cancelled',
    };

    return descriptions[state] || 'Unknown state';
  }

  /**
   * Get progress percentage for state
   */
  static getProgressPercentage(state: RegistrationState): number {
    const progressMap: Record<RegistrationState, number> = {
      [RegistrationState.STAGED]: 10,
      [RegistrationState.EMAIL_VERIFICATION_PENDING]: 20,
      [RegistrationState.EMAIL_VERIFIED]: 30,
      [RegistrationState.PENDING_APPROVAL]: 50,
      [RegistrationState.APPROVED]: 60,
      [RegistrationState.PROCESSING]: 80,
      [RegistrationState.COMPLETED]: 100,
      [RegistrationState.REJECTED]: 0,
      [RegistrationState.FAILED]: 0,
      [RegistrationState.EXPIRED]: 0,
      [RegistrationState.CANCELLED]: 0,
    };

    return progressMap[state] || 0;
  }
}

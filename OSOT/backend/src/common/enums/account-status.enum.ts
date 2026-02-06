/**
 * Enum: AccountStatus
 * Objective: Define the available account status states for user account management.
 * Functionality: Provides standardized account status choices synchronized with Dataverse global choices.
 * Expected Result: Clear account state tracking for access control and user management.
 *
 * Note: This enum corresponds to the Choices_AccountStatus global choice in Dataverse.
 * Values are synchronized with the Choice field osot_AccountStatus in Table_Account.
 */
export enum AccountStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  PENDING = 3,
}

/**
 * Helper function to get account status display name
 */
export function getAccountStatusDisplayName(status: AccountStatus): string {
  switch (status) {
    case AccountStatus.ACTIVE:
      return 'Active';
    case AccountStatus.INACTIVE:
      return 'Inactive';
    case AccountStatus.PENDING:
      return 'Pending';
    default:
      return 'Unknown';
  }
}

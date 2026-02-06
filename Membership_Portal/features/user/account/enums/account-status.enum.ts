/**
 * Account Status Enum
 *
 * Represents the lifecycle status of a user account.
 *
 * @file account-status.enum.ts
 * @module Account
 * @layer Enums
 */
export enum AccountStatus {
  PENDING = 1,
  ACTIVE = 2,
  CANCELED = 3
}

export const getAccountStatusLabel = (status: AccountStatus): string => {
  switch (status) {
    case AccountStatus.PENDING:
      return 'Pending';
    case AccountStatus.ACTIVE:
      return 'Active';
    case AccountStatus.CANCELED:
      return 'Canceled';
    default:
      return 'Unknown';
  }
};

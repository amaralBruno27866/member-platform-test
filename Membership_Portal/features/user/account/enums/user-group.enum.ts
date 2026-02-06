/**
 * User Group Enum
 *
 * Represents the account category used for business rules.
 *
 * @file user-group.enum.ts
 * @module Account
 * @layer Enums
 */
export enum UserGroup {
  OT = 1,
  OTA = 2,
  AFFILIATE = 3,
  STAFF = 4
}

export const getUserGroupLabel = (group: UserGroup): string => {
  switch (group) {
    case UserGroup.OT:
      return 'OT';
    case UserGroup.OTA:
      return 'OTA';
    case UserGroup.AFFILIATE:
      return 'Affiliate';
    case UserGroup.STAFF:
      return 'Staff';
    default:
      return 'Unknown';
  }
};

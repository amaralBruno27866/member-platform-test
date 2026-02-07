/**
 * Privilege Enum
 *
 * Describes the privilege level of an account.
 *
 * @file privilege.enum.ts
 * @module Account
 * @layer Enums
 */
export enum Privilege {
  USER = 1,
  ADMIN = 2
}

export const getPrivilegeLabel = (privilege: Privilege): string => {
  switch (privilege) {
    case Privilege.USER:
      return 'User';
    case Privilege.ADMIN:
      return 'Admin';
    default:
      return 'Unknown';
  }
};

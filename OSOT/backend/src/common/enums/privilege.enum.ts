/**
 * Enum: Privilege
 * Objective: Define the available privilege levels for user roles and permissions.
 * Functionality: Provides standardized privilege choices synchronized with Dataverse global choices.
 * Expected Result: Consistent privilege management for access control and business logic.
 *
 * Note: This enum corresponds to the Choices_Privilege global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Privilege in Table_Account.
 */
export enum Privilege {
  OWNER = 1,
  ADMIN = 2,
  MAIN = 3,
}

/**
 * Helper function to get privilege display name
 */
export function getPrivilegeDisplayName(privilege: Privilege): string {
  switch (privilege) {
    case Privilege.OWNER:
      return 'Owner';
    case Privilege.ADMIN:
      return 'Admin';
    case Privilege.MAIN:
      return 'Main';
    default:
      return 'Unknown';
  }
}

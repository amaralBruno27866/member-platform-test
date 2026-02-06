/**
 * Enum: MembershipGroup
 * Objective: Define the available membership group types for membership settings records.
 * Functionality: Provides standardized membership group classification synchronized with Dataverse global choices.
 * Expected Result: Consistent membership group tracking for membership settings configuration.
 *
 * Note: This enum corresponds to the Choices_Membership_Group global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Membership_Group in Table_Membership_Settings.
 */
export enum MembershipGroup {
  INDIVIDUAL = 1,
  BUSINESS = 2,
}

/**
 * Helper function to get membership group display name
 */
export function getMembershipGroupDisplayName(group: MembershipGroup): string {
  switch (group) {
    case MembershipGroup.INDIVIDUAL:
      return 'Individual';
    case MembershipGroup.BUSINESS:
      return 'Business';
    default:
      return 'Unknown Membership Group';
  }
}

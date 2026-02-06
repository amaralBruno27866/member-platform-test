/**
 * Enum: AccountGroup
 * Objective: Define the available account group categories for user classification.
 * Functionality: Provides standardized account type choices synchronized with Dataverse global choices.
 * Expected Result: Accurate user categorization for licensing and access control.
 *
 * Note: This enum corresponds to the Choices_AccountGroups global choice in Dataverse.
 * Values are synchronized with the Choice field osot_AccountGroup in Table_Account.
 */
export enum AccountGroup {
  OTHER = 0,
  OCCUPATIONAL_THERAPIST = 1,
  OCCUPATIONAL_THERAPIST_ASSISTANT = 2,
  VENDOR_ADVERTISER = 3,
  STAFF = 4,
}

/**
 * Helper function to get account group display name
 */
export function getAccountGroupDisplayName(group: AccountGroup): string {
  switch (group) {
    case AccountGroup.OTHER:
      return 'Other';
    case AccountGroup.OCCUPATIONAL_THERAPIST:
      return 'Occupational Therapist (includes student, new grad or retired/resigned)';
    case AccountGroup.OCCUPATIONAL_THERAPIST_ASSISTANT:
      return 'Occupational Therapist Assistant (includes student, new grad or retired)';
    case AccountGroup.VENDOR_ADVERTISER:
      return 'Vendor / Advertiser';
    case AccountGroup.STAFF:
      return 'Staff';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to parse account group from label string back to enum
 * Used when business logic needs to work with enum values from Response DTOs
 */
export function parseAccountGroupFromLabel(label: string): AccountGroup {
  if (label.includes('Occupational Therapist Assistant')) {
    return AccountGroup.OCCUPATIONAL_THERAPIST_ASSISTANT;
  }
  if (label.includes('Occupational Therapist')) {
    return AccountGroup.OCCUPATIONAL_THERAPIST;
  }
  if (label.includes('Vendor') || label.includes('Advertiser')) {
    return AccountGroup.VENDOR_ADVERTISER;
  }
  return AccountGroup.OTHER;
}

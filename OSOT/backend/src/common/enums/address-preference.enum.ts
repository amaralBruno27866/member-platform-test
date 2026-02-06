/**
 * Enum: AddressPreference
 * Objective: Define the available address preference types for address classification.
 * Functionality: Provides standardized address usage choices synchronized with Dataverse global choices.
 * Expected Result: Clear address categorization for mail, shipping, and billing purposes.
 *
 * Note: This enum corresponds to the Choices_AddressPreference global choice in Dataverse.
 * Values are synchronized with the Choice field osot_AddressPreference in Table_Address.
 */
export enum AddressPreference {
  OTHER = 0,
  MAIL = 1,
  SHIPPING = 2,
  BILLING = 3,
}

/**
 * Helper function to get address preference display name
 */
export function getAddressPreferenceDisplayName(
  preference: AddressPreference,
): string {
  switch (preference) {
    case AddressPreference.OTHER:
      return 'Other';
    case AddressPreference.MAIL:
      return 'Mail';
    case AddressPreference.SHIPPING:
      return 'Shipping';
    case AddressPreference.BILLING:
      return 'Billing';
    default:
      return 'Unknown';
  }
}

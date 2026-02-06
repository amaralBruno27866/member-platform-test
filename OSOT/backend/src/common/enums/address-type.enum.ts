/**
 * Enum: AddressType
 * Objective: Define the available address types for address classification.
 * Functionality: Provides standardized address type choices synchronized with Dataverse global choices.
 * Expected Result: Clear address categorization for home, work, and other purposes.
 *
 * Note: This enum corresponds to the Choices_AddressType global choice in Dataverse.
 * Values are synchronized with the Choice field osot_AddressType in Table_Address.
 */
export enum AddressType {
  OTHER = 0,
  HOME = 1,
  WORK = 2,
}

/**
 * Helper function to get address type display name
 */
export function getAddressTypeDisplayName(type: AddressType): string {
  switch (type) {
    case AddressType.OTHER:
      return 'Other';
    case AddressType.HOME:
      return 'Home';
    case AddressType.WORK:
      return 'Work';
    default:
      return 'Unknown';
  }
}

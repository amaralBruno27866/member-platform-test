/**
 * Enum: ThirdParties
 * Objective: Define the available third-party communication preferences for membership settings.
 * Functionality: Provides standardized third-party communication choices synchronized with Dataverse global choices.
 * Expected Result: Consistent third-party preference management for privacy and communication control.
 *
 * Note: This enum corresponds to the Choices_Third_Parties global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Third_Parties in Table_Membership_Preferences.
 */
export enum ThirdParties {
  RECRUITMENT = 1,
  PRODUCT = 2,
  PROFESSIONAL_DEVELOPMENT = 3,
}

/**
 * Helper function to get third-party display name
 */
export function getThirdPartyDisplayName(thirdParty: ThirdParties): string {
  switch (thirdParty) {
    case ThirdParties.RECRUITMENT:
      return 'Recruitment';
    case ThirdParties.PRODUCT:
      return 'Product';
    case ThirdParties.PROFESSIONAL_DEVELOPMENT:
      return 'Professional Development';
    default:
      return 'Unknown';
  }
}

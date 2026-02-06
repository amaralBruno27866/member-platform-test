/**
 * Enum: PracticePromotion
 * Objective: Define the available practice promotion preferences for membership settings.
 * Functionality: Provides standardized practice promotion choices synchronized with Dataverse global choices.
 * Expected Result: Consistent practice promotion preference management for member visibility control.
 *
 * Note: This enum corresponds to the Choices_Practice_Promotion global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Practice_Promotion in Table_Membership_Preferences.
 */
export enum PracticePromotion {
  SELF = 1,
  EMPLOYER = 2,
}

/**
 * Helper function to get practice promotion display name
 */
export function getPracticePromotionDisplayName(
  promotion: PracticePromotion,
): string {
  switch (promotion) {
    case PracticePromotion.SELF:
      return 'Self';
    case PracticePromotion.EMPLOYER:
      return 'Employer';
    default:
      return 'Unknown';
  }
}

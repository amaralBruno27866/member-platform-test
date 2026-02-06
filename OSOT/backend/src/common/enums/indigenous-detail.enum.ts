/**
 * Enum: IndigenousDetail
 * Objective: Define the available indigenous detail types for Canadian indigenous identity classification.
 * Functionality: Provides standardized choices synchronized with Dataverse global choices.
 * Expected Result: Clear categorization for indigenous identity details.
 *
 * Note: This enum corresponds to the Choices_IndigenousDetail global choice in Dataverse.
 * Values are synchronized with the Choice field osot_IndigenousDetail in Table_Identity.
 */
export enum IndigenousDetail {
  OTHER = 0,
  FIRST_NATIONS = 1,
  INUIT = 2,
  METIS = 3,
}

/**
 * Helper function to get indigenous detail display name
 */
export function getIndigenousDetailDisplayName(
  detail: IndigenousDetail,
): string {
  switch (detail) {
    case IndigenousDetail.OTHER:
      return 'Other';
    case IndigenousDetail.FIRST_NATIONS:
      return 'First Nations';
    case IndigenousDetail.INUIT:
      return 'Inuit';
    case IndigenousDetail.METIS:
      return 'Metis';
    default:
      return 'Unknown';
  }
}

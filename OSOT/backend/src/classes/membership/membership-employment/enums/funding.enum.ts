/**
 * Enum: Funding
 * Objective: Define the available position funding sources for membership employment records.
 * Functionality: Provides standardized funding source choices synchronized with Dataverse global choices.
 * Expected Result: Consistent position funding tracking for member employment financial data.
 *
 * Note: This enum corresponds to the Choices_Funding global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Position_Funding in Table_Membership_Employment.
 * This is a multiple choice field - positions can have multiple funding sources.
 */
export enum Funding {
  OTHER = 0,
  CORPORATE_BUSINESS = 1,
  FEDERAL_GOVERNMENT = 2,
  PROVINCIAL_GOVERMENT_HEALTH = 3,
  PROVINCIAL_GOVERMENT_OTHER = 4,
  INSURANCE_AUTO = 5,
  INSURANCE_EXTENDED_HEALTH_DISABILITY = 6,
  MUNICIPAL_GOVERMENT = 7,
  PRIVATE_PAY_OUT_OF_POCKET = 8,
  WORKPLACE_SAFETY_AND_INSURANCE_BOARD = 9,
  INTERIM_FEDERAL_HEALTH_PROGRAM_IFHP = 10,
}

/**
 * Helper function to get funding source display name
 */
export function getFundingDisplayName(funding: Funding): string {
  switch (funding) {
    case Funding.OTHER:
      return 'Other';
    case Funding.CORPORATE_BUSINESS:
      return 'Corporate/Business';
    case Funding.FEDERAL_GOVERNMENT:
      return 'Federal Government';
    case Funding.PROVINCIAL_GOVERMENT_HEALTH:
      return 'Provincial Government - Health';
    case Funding.PROVINCIAL_GOVERMENT_OTHER:
      return 'Provincial Government - Other';
    case Funding.INSURANCE_AUTO:
      return 'Insurance - Auto';
    case Funding.INSURANCE_EXTENDED_HEALTH_DISABILITY:
      return 'Insurance - Extended Health/Disability';
    case Funding.MUNICIPAL_GOVERMENT:
      return 'Municipal Government';
    case Funding.PRIVATE_PAY_OUT_OF_POCKET:
      return 'Private Pay/Out of Pocket';
    case Funding.WORKPLACE_SAFETY_AND_INSURANCE_BOARD:
      return 'Workplace Safety and Insurance Board';
    case Funding.INTERIM_FEDERAL_HEALTH_PROGRAM_IFHP:
      return 'Interim Federal Health Program (IFHP)';
    default:
      return 'Unknown';
  }
}

/**
 * Enum: PracticeYears
 * Objective: Define the available practice years experience ranges for membership employment records.
 * Functionality: Provides standardized practice years choices synchronized with Dataverse global choices.
 * Expected Result: Consistent professional experience tracking for member employment data.
 *
 * Note: This enum corresponds to the Choices_Practice_Years global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Practice_Years in Table_Membership_Employment.
 */
export enum PracticeYears {
  NEW_GRADUATE = 1,
  BETWEEN_1_AND_2_YEARS = 2,
  BETWEEN_3_AND_5_YEARS = 3,
  BETWEEN_6_AND_10_YEARS = 4,
  BETWEEN_11_AND_15_YEARS = 5,
  BETWEEN_16_AND_20_YEARS = 6,
  BETWEEN_21_AND_25_YEARS = 7,
  BETWEEN_26_AND_30_YEARS = 8,
  BETWEEN_31_AND_35_YEARS = 9,
  BETWEEN_36_AND_40_YEARS = 10,
  BETWEEN_41_AND_45_YEARS = 11,
  MORE_THAN_46_YEARS = 12,
}

/**
 * Helper function to get practice years display name
 */
export function getPracticeYearsDisplayName(
  practiceYears: PracticeYears,
): string {
  switch (practiceYears) {
    case PracticeYears.NEW_GRADUATE:
      return 'New Graduate';
    case PracticeYears.BETWEEN_1_AND_2_YEARS:
      return '1-2 Years';
    case PracticeYears.BETWEEN_3_AND_5_YEARS:
      return '3-5 Years';
    case PracticeYears.BETWEEN_6_AND_10_YEARS:
      return '6-10 Years';
    case PracticeYears.BETWEEN_11_AND_15_YEARS:
      return '11-15 Years';
    case PracticeYears.BETWEEN_16_AND_20_YEARS:
      return '16-20 Years';
    case PracticeYears.BETWEEN_21_AND_25_YEARS:
      return '21-25 Years';
    case PracticeYears.BETWEEN_26_AND_30_YEARS:
      return '26-30 Years';
    case PracticeYears.BETWEEN_31_AND_35_YEARS:
      return '31-35 Years';
    case PracticeYears.BETWEEN_36_AND_40_YEARS:
      return '36-40 Years';
    case PracticeYears.BETWEEN_41_AND_45_YEARS:
      return '41-45 Years';
    case PracticeYears.MORE_THAN_46_YEARS:
      return 'More than 46 Years';
    default:
      return 'Unknown';
  }
}

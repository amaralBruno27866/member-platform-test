/**
 * Enum: ParentalLeaveExpected
 * Objective: Define the available parental leave duration options for Membership Category entity.
 * Functionality: Provides standardized parental leave expected duration choices synchronized with Dataverse global choices.
 * Expected Result: Consistent parental leave duration selection across the system.
 *
 * Note: This enum corresponds to the Choices_Parental_Leave_Expected global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Parental_Leave_Expected in Table_Membership_Category.
 */
export enum ParentalLeaveExpected {
  FULL_YEAR = 1,
  SIX_MONTHS = 2,
}

/**
 * Helper function to get parental leave expected display name
 */
export function getParentalLeaveExpectedDisplayName(
  expected: ParentalLeaveExpected,
): string {
  switch (expected) {
    case ParentalLeaveExpected.FULL_YEAR:
      return 'Full Year';
    case ParentalLeaveExpected.SIX_MONTHS:
      return 'Six Months';
    default:
      return 'Unknown';
  }
}

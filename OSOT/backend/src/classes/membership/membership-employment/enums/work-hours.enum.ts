/**
 * Enum: WorkHours
 * Objective: Define the available work hours ranges for membership employment records.
 * Functionality: Provides standardized work hours choices synchronized with Dataverse global choices.
 * Expected Result: Consistent work hours tracking for member employment schedules.
 *
 * Note: This enum corresponds to the Choices_Work_Hours global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Work_Hours in Table_Membership_Employment.
 * This is a multiple choice field - users can select multiple work hour categories.
 */
export enum WorkHours {
  BETWEEN_1_TO_10 = 1,
  BETWEEN_11_TO_15 = 2,
  BETWEEN_16_TO_25 = 3,
  BETWEEN_26_TO_34 = 4,
  EXACTLY_35 = 5,
  MORE_THAN_37 = 6,
  CASUAL = 7,
}

/**
 * Helper function to get work hours display name
 */
export function getWorkHoursDisplayName(hours: WorkHours): string {
  switch (hours) {
    case WorkHours.BETWEEN_1_TO_10:
      return '5-10 Hrs';
    case WorkHours.BETWEEN_11_TO_15:
      return '11-15 Hrs';
    case WorkHours.BETWEEN_16_TO_25:
      return '16-25 Hrs';
    case WorkHours.BETWEEN_26_TO_34:
      return '26-34 Hrs';
    case WorkHours.EXACTLY_35:
      return '35 Hrs';
    case WorkHours.MORE_THAN_37:
      return '>37.5 Hrs';
    case WorkHours.CASUAL:
      return 'Casual';
    default:
      return 'Unknown';
  }
}

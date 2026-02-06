/**
 * Enum: CotoStatus
 * Objective: Define the available COTO (College of Occupational Therapists of Ontario) membership status options.
 * Functionality: Provides standardized COTO registration status choices synchronized with Dataverse global choices.
 * Expected Result: Accurate professional registration status classification for regulatory compliance.
 *
 * Note: This enum corresponds to the Choices_COTO_Status global choice in Dataverse.
 * Values are synchronized with the Choice field osot_COTO_Status in Table_OT_Education.
 */
export enum CotoStatus {
  OTHER = 0,
  STUDENT = 1,
  PENDING = 2,
  PROVISIONAL_TEMPORARY = 3,
  GENERAL = 4,
  RESIGNED = 5,
}

/**
 * Helper function to get COTO status display name
 */
export function getCotoStatusDisplayName(status: CotoStatus): string {
  switch (status) {
    case CotoStatus.OTHER:
      return 'Other';
    case CotoStatus.STUDENT:
      return 'Student';
    case CotoStatus.PENDING:
      return 'Pending';
    case CotoStatus.PROVISIONAL_TEMPORARY:
      return 'Provisional/Temporary';
    case CotoStatus.GENERAL:
      return 'General';
    case CotoStatus.RESIGNED:
      return 'Resigned';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to check if COTO status is active
 */
export function isCotoStatusActive(status: CotoStatus): boolean {
  return (
    status === CotoStatus.GENERAL ||
    status === CotoStatus.PROVISIONAL_TEMPORARY ||
    status === CotoStatus.STUDENT
  );
}

/**
 * Helper function to get all COTO status values
 */
export function getAllCotoStatuses(): CotoStatus[] {
  return Object.values(CotoStatus).filter(
    (value) => typeof value === 'number',
  ) as CotoStatus[];
}

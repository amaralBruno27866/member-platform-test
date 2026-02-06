/**
 * Enum: EmploymentStatus
 * Objective: Define the available employment status types for membership employment records.
 * Functionality: Provides standardized employment status choices synchronized with Dataverse global choices.
 * Expected Result: Consistent employment status classification for member work arrangements.
 *
 * Note: This enum corresponds to the Choices_Employment_Status global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Employment_Status in Table_Membership_Employment.
 */
export enum EmploymentStatus {
  EMPLOYEE_CONTRACT = 1,
  EMPLOYEE_SALARIED = 2,
  SELF_EMPLOYED_INDEPENDENT_CONTRACTOR = 3,
  SELF_EMPLOYED_OWN_PRACTICE = 4,
}

/**
 * Helper function to get employment status display name
 */
export function getEmployementStatusDisplayName(
  status: EmploymentStatus,
): string {
  switch (status) {
    case EmploymentStatus.EMPLOYEE_CONTRACT:
      return 'Employee - Contract - Scheduled End Date ';
    case EmploymentStatus.EMPLOYEE_SALARIED:
      return 'Employee – Salaried Position ';
    case EmploymentStatus.SELF_EMPLOYED_INDEPENDENT_CONTRACTOR:
      return 'Self-Employed – Independent Contractor ';
    case EmploymentStatus.SELF_EMPLOYED_OWN_PRACTICE:
      return 'Self-Employed – Own Practice ';
    default:
      return 'Unknown';
  }
}

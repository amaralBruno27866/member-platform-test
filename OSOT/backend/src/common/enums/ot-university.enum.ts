/**
 * Enum: OtUniversity
 * Objective: Define the available Canadian university options for Occupational Therapy education.
 * Functionality: Provides standardized OT university choices synchronized with Dataverse global choices.
 * Expected Result: Accurate educational institution classification for OT degree verification.
 *
 * Note: This enum corresponds to the Choices_OT_Universities global choice in Dataverse.
 * Values are synchronized with the Choice field osot_OT_University in Table_OT_Education.
 * These universities are recognized Canadian institutions offering accredited OT programs.
 */
export enum OtUniversity {
  OTHER = 0,
  NOT_APPLICABLE = 1,
  MCMASTER_UNIVERSITY = 2,
  QUEENS_UNIVERSITY = 3,
  UNIVERSITY_OF_OTTAWA = 4,
  UNIVERSITY_OF_TORONTO = 5,
  WESTERN_UNIVERSITY = 6,
}

/**
 * Helper function to get OT university display name
 */
export function getOtUniversityDisplayName(university: OtUniversity): string {
  switch (university) {
    case OtUniversity.OTHER:
      return 'Other';
    case OtUniversity.NOT_APPLICABLE:
      return 'N/A';
    case OtUniversity.MCMASTER_UNIVERSITY:
      return 'McMaster University';
    case OtUniversity.QUEENS_UNIVERSITY:
      return 'Queens University';
    case OtUniversity.UNIVERSITY_OF_OTTAWA:
      return 'University of Ottawa';
    case OtUniversity.UNIVERSITY_OF_TORONTO:
      return 'University of Toronto';
    case OtUniversity.WESTERN_UNIVERSITY:
      return 'Western University';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to get university location (city, province)
 */
export function getOtUniversityLocation(university: OtUniversity): string {
  switch (university) {
    case OtUniversity.MCMASTER_UNIVERSITY:
      return 'Hamilton, Ontario';
    case OtUniversity.QUEENS_UNIVERSITY:
      return 'Kingston, Ontario';
    case OtUniversity.UNIVERSITY_OF_OTTAWA:
      return 'Ottawa, Ontario';
    case OtUniversity.UNIVERSITY_OF_TORONTO:
      return 'Toronto, Ontario';
    case OtUniversity.WESTERN_UNIVERSITY:
      return 'London, Ontario';
    case OtUniversity.OTHER:
      return 'Various';
    case OtUniversity.NOT_APPLICABLE:
    default:
      return 'N/A';
  }
}

/**
 * Helper function to check if university is in Ontario
 */
export function isOntarioUniversity(university: OtUniversity): boolean {
  return (
    university === OtUniversity.MCMASTER_UNIVERSITY ||
    university === OtUniversity.QUEENS_UNIVERSITY ||
    university === OtUniversity.UNIVERSITY_OF_OTTAWA ||
    university === OtUniversity.UNIVERSITY_OF_TORONTO ||
    university === OtUniversity.WESTERN_UNIVERSITY
  );
}

/**
 * Helper function to get university website URL
 */
export function getOtUniversityWebsite(university: OtUniversity): string {
  switch (university) {
    case OtUniversity.MCMASTER_UNIVERSITY:
      return 'https://www.mcmaster.ca';
    case OtUniversity.QUEENS_UNIVERSITY:
      return 'https://www.queensu.ca';
    case OtUniversity.UNIVERSITY_OF_OTTAWA:
      return 'https://www.uottawa.ca';
    case OtUniversity.UNIVERSITY_OF_TORONTO:
      return 'https://www.utoronto.ca';
    case OtUniversity.WESTERN_UNIVERSITY:
      return 'https://www.uwo.ca';
    default:
      return '';
  }
}

/**
 * Helper function to get all OT university values
 */
export function getAllOtUniversities(): OtUniversity[] {
  return Object.values(OtUniversity).filter(
    (value) => typeof value === 'number',
  ) as OtUniversity[];
}

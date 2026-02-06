/**
 * Enum: DegreeType
 * Objective: Define the available degree type options for educational qualification classification.
 * Functionality: Provides standardized degree level choices synchronized with Dataverse global choices.
 * Expected Result: Accurate educational qualification classification for both OT and non-OT degrees.
 *
 * Note: This enum corresponds to the Choices_Degree_Type global choice in Dataverse.
 * Values are synchronized with the Choice fields osot_OT_Degree_Type and osot_NonOT_Degree_Type in Table_OT_Education.
 */
export enum DegreeType {
  OTHER = 0,
  DIPLOMA_CREDENTIAL = 1,
  BACHELORS = 2,
  MASTERS = 3,
  DOCTORATE = 4,
}

/**
 * Helper function to get degree type display name
 */
export function getDegreeTypeDisplayName(degreeType: DegreeType): string {
  switch (degreeType) {
    case DegreeType.OTHER:
      return 'Other';
    case DegreeType.DIPLOMA_CREDENTIAL:
      return 'Diploma/Credential';
    case DegreeType.BACHELORS:
      return 'Bachelors';
    case DegreeType.MASTERS:
      return 'Masters';
    case DegreeType.DOCTORATE:
      return 'Doctorate';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to check if degree type is undergraduate level
 */
export function isUndergraduateLevel(degreeType: DegreeType): boolean {
  return (
    degreeType === DegreeType.DIPLOMA_CREDENTIAL ||
    degreeType === DegreeType.BACHELORS
  );
}

/**
 * Helper function to check if degree type is graduate level
 */
export function isGraduateLevel(degreeType: DegreeType): boolean {
  return (
    degreeType === DegreeType.MASTERS || degreeType === DegreeType.DOCTORATE
  );
}

/**
 * Helper function to get degree type hierarchy level (for comparison)
 */
export function getDegreeTypeLevel(degreeType: DegreeType): number {
  switch (degreeType) {
    case DegreeType.DIPLOMA_CREDENTIAL:
      return 1;
    case DegreeType.BACHELORS:
      return 2;
    case DegreeType.MASTERS:
      return 3;
    case DegreeType.DOCTORATE:
      return 4;
    case DegreeType.OTHER:
    default:
      return 0;
  }
}

/**
 * Helper function to get all degree type values
 */
export function getAllDegreeTypes(): DegreeType[] {
  return Object.values(DegreeType).filter(
    (value) => typeof value === 'number',
  ) as DegreeType[];
}

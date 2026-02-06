/**
 * Enum: EducationCategory
 * Objective: Define the available education category options for OT education records.
 * Functionality: Provides standardized choice values synchronized with Dataverse global choices.
 * Expected Result: Consistent education category selection across the application.
 *
 * Note: Values correspond to the Choices_EducationCategory (or equivalent) in Dataverse.
 */
export enum EducationCategory {
  GRADUATED = 0,
  STUDENT = 1,
  NEW_GRADUATED = 2,
}

/**
 * Helper function to get education category display name
 */
export function getEducationCategoryDisplayName(
  category: EducationCategory,
): string {
  switch (category) {
    case EducationCategory.GRADUATED:
      return 'Graduate';
    case EducationCategory.STUDENT:
      return 'Student';
    case EducationCategory.NEW_GRADUATED:
      return 'New Graduated';
    default:
      return 'Unknown';
  }
}

/**
 * Helper to get all education category options for selects/dropdowns
 */
export function getAllEducationCategories(): Array<{
  value: number;
  label: string;
}> {
  return Object.values(EducationCategory)
    .filter((v) => typeof v === 'number')
    .map((v) => ({
      value: v as number,
      label: getEducationCategoryDisplayName(v as EducationCategory),
    }));
}

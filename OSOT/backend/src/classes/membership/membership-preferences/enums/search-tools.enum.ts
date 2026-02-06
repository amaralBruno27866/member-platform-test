/**
 * Enum: SearchTools
 * Objective: Define the available member search tools preferences for membership settings.
 * Functionality: Provides standardized search visibility choices synchronized with Dataverse global choices.
 * Expected Result: Consistent member search preference management for professional networking and mentoring visibility.
 *
 * Note: This enum corresponds to the Choices_Search_Tools global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Members_Search_Tools in Table_Membership_Preferences.
 */
export enum SearchTools {
  PROFESSIONAL_NETWORKS = 1,
  POTENTIAL_MENTORING = 2,
  SUPERVISING_CLINIC_PLACEMENTS = 3,
  EXAM_MENTORING = 4,
  PRESENTER = 5,
}

/**
 * Helper function to get search tool display name
 */
export function getSearchToolDisplayName(searchTool: SearchTools): string {
  switch (searchTool) {
    case SearchTools.PROFESSIONAL_NETWORKS:
      return 'Professional Networks';
    case SearchTools.POTENTIAL_MENTORING:
      return 'Potential Mentoring';
    case SearchTools.SUPERVISING_CLINIC_PLACEMENTS:
      return 'Supervising Clinic Placements';
    case SearchTools.EXAM_MENTORING:
      return 'Exam Mentoring';
    case SearchTools.PRESENTER:
      return 'Presenter';
    default:
      return 'Unknown';
  }
}

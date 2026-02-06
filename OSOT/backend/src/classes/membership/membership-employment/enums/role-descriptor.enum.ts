/**
 * Enum: RoleDescription
 * Objective: Define the available role descriptor types for membership employment records.
 * Functionality: Provides standardized role descriptor choices synchronized with Dataverse global choices.
 * Expected Result: Consistent role classification for member employment positions.
 *
 * Note: This enum corresponds to the Choices_Role_Descriptor global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Role_Descriptor in Table_Membership_Employment.
 * When OTHER is selected, the field osot_Role_Descriptor_Other becomes required.
 */
export enum RoleDescription {
  OTHER = 0,
  ADMINISTRATION_MANAGEMENT = 1,
  CONSULTATION = 2,
  DIRECT_INDIRECT_CARE_PROVIDER = 3,
  EDUCATION = 4,
  PUBLIC_RELATIONS_PROFESSIONAL_PROMOTION = 5,
  RESEARCH = 6,
  OWNER_OPERATIONS = 7,
}

/**
 * Helper function to get role descriptor display name
 */
export function getRoleDescriptionDisplayName(role: RoleDescription): string {
  switch (role) {
    case RoleDescription.OTHER:
      return 'Other';
    case RoleDescription.ADMINISTRATION_MANAGEMENT:
      return 'Administration/Management';
    case RoleDescription.CONSULTATION:
      return 'Consultation';
    case RoleDescription.DIRECT_INDIRECT_CARE_PROVIDER:
      return 'Direct/Indirect Care Provider';
    case RoleDescription.EDUCATION:
      return 'Education';
    case RoleDescription.PUBLIC_RELATIONS_PROFESSIONAL_PROMOTION:
      return 'Public Relations/Professional Promotion';
    case RoleDescription.RESEARCH:
      return 'Research';
    case RoleDescription.OWNER_OPERATIONS:
      return 'Owner/Operations';
    default:
      return 'Unknown';
  }
}

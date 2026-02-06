/**
 * Enum: PracticeSettings
 * Objective: Define the available practice settings where occupational therapy services are provided.
 * Functionality: Provides standardized practice setting choices synchronized with Dataverse global choices.
 * Expected Result: Consistent practice setting classification for member practice information.
 *
 * Note: This enum corresponds to the Choices_Practice_Settings global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Practice_Settings in Table_Membership_Practice.
 * Associated text field: osot_Practice_Settings_Other for OTHER value description.
 */
export enum PracticeSettings {
  OTHER = 0,
  CLIENTS_HOME = 1,
  CLIENTS_WORK_SITE = 2,
  COMMUNITY_CLINIC_AGENCY = 3,
  CONTINUING_CARE_FACILITY = 4,
  CORRECTIONAL_SYSTEM = 5,
  FAMILY_HEALTH_TEAM = 6,
  GENERAL_HOSPITAL = 7,
  GOVERNMENT = 8,
  GROUP_HOME = 9,
  INDUSTRY = 10,
  INSURANCE_COMPANY = 11,
  LONG_TERM_CARE_FACILITY = 12,
  MENTAL_HEALTH_CENTER = 13,
  OUTPATIENT_CLINIC = 14,
  PAEDIATRIC_CENTER = 15,
  POST_SECONDARY_INSTITUTION_COMMUNITY = 16,
  POST_SECONDARY_INSTITUTION_UNIVERSITY = 17,
  PRIMARY_HEALTH_CARE = 18,
  PRIVATE_HEALTH_BUSINESS = 19,
  PROFESSIONAL_SERVICES = 20,
  RECREATIONAL_FACILITY_SERVICES = 21,
  REGULATORY_BODY_PROFESSIONAL_ASSOCIATION = 22,
  REHABILITATION_CENTRE = 23,
  RETAIL_BUSINESS = 24,
  RETIREMENT_HOME = 25,
  SCHOOL_SYSTEM_ELEMENTARY_SECONDARY = 26,
  SHELTER_TRANSITIONAL_LIVING = 27,
  WSIB_CLINIC = 28,
}

/**
 * Helper function to get practice settings display name
 */
export function getPracticeSettingsDisplayName(
  practiceSetting: PracticeSettings,
): string {
  switch (practiceSetting) {
    case PracticeSettings.OTHER:
      return 'Other';
    case PracticeSettings.CLIENTS_HOME:
      return "Client's Home";
    case PracticeSettings.CLIENTS_WORK_SITE:
      return "Client's Work Site";
    case PracticeSettings.COMMUNITY_CLINIC_AGENCY:
      return 'Community Clinic/Agency';
    case PracticeSettings.CONTINUING_CARE_FACILITY:
      return 'Continuing Care Facility';
    case PracticeSettings.CORRECTIONAL_SYSTEM:
      return 'Correctional System';
    case PracticeSettings.FAMILY_HEALTH_TEAM:
      return 'Family Health Team';
    case PracticeSettings.GENERAL_HOSPITAL:
      return 'General Hospital';
    case PracticeSettings.GOVERNMENT:
      return 'Government';
    case PracticeSettings.GROUP_HOME:
      return 'Group Home';
    case PracticeSettings.INDUSTRY:
      return 'Industry';
    case PracticeSettings.INSURANCE_COMPANY:
      return 'Insurance Company';
    case PracticeSettings.LONG_TERM_CARE_FACILITY:
      return 'Long Term Care Facility';
    case PracticeSettings.MENTAL_HEALTH_CENTER:
      return 'Mental Health Center';
    case PracticeSettings.OUTPATIENT_CLINIC:
      return 'Outpatient Clinic';
    case PracticeSettings.PAEDIATRIC_CENTER:
      return 'Paediatric Center';
    case PracticeSettings.POST_SECONDARY_INSTITUTION_COMMUNITY:
      return 'Post-Secondary Institution - Community';
    case PracticeSettings.POST_SECONDARY_INSTITUTION_UNIVERSITY:
      return 'Post-Secondary Institution - University';
    case PracticeSettings.PRIMARY_HEALTH_CARE:
      return 'Primary Health Care';
    case PracticeSettings.PRIVATE_HEALTH_BUSINESS:
      return 'Private Health Business';
    case PracticeSettings.PROFESSIONAL_SERVICES:
      return 'Professional Services';
    case PracticeSettings.RECREATIONAL_FACILITY_SERVICES:
      return 'Recreational Facility/Services';
    case PracticeSettings.REGULATORY_BODY_PROFESSIONAL_ASSOCIATION:
      return 'Regulatory Body/Professional Association';
    case PracticeSettings.REHABILITATION_CENTRE:
      return 'Rehabilitation Centre';
    case PracticeSettings.RETAIL_BUSINESS:
      return 'Retail Business';
    case PracticeSettings.RETIREMENT_HOME:
      return 'Retirement Home';
    case PracticeSettings.SCHOOL_SYSTEM_ELEMENTARY_SECONDARY:
      return 'School System - Elementary/Secondary';
    case PracticeSettings.SHELTER_TRANSITIONAL_LIVING:
      return 'Shelter/Transitional Living';
    case PracticeSettings.WSIB_CLINIC:
      return 'WSIB Clinic';
    default:
      return 'Unknown';
  }
}

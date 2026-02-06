/**
 * Enum: ClientsAge
 * Objective: Define the available age groups for clients served in membership practice records.
 * Functionality: Provides standardized age group choices synchronized with Dataverse global choices.
 * Expected Result: Consistent client age classification for member practice information.
 *
 * Note: This enum corresponds to the Choices_Populations global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Clients_Age in Table_Membership_Practice.
 */
export enum ClientsAge {
  NOT_APPLICABLE = 0,
  INFANT = 1,
  TODDLER = 2,
  CHILD = 3,
  YOUTH = 4,
  ADULT = 5,
  OLDER = 6,
}

/**
 * Helper function to get clients age display name
 */
export function getClientsAgeDisplayName(age: ClientsAge): string {
  switch (age) {
    case ClientsAge.NOT_APPLICABLE:
      return 'Not Applicable';
    case ClientsAge.INFANT:
      return 'Infant (up to 1 yr)';
    case ClientsAge.TODDLER:
      return 'Toddler (1-3 yrs)';
    case ClientsAge.CHILD:
      return 'Child (4-13 yrs)';
    case ClientsAge.YOUTH:
      return 'Youth (14-17 yrs)';
    case ClientsAge.ADULT:
      return 'Adult (18-64 yrs)';
    case ClientsAge.OLDER:
      return 'Older Adult (65+ yrs)';
    default:
      return 'Unknown';
  }
}

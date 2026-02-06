/**
 * Enum: Race
 * Objective: Define the available racial/ethnic identity options for Table_Identity entity.
 * Functionality: Provides comprehensive racial and ethnic choices synchronized with Dataverse global choices.
 * Expected Result: Inclusive racial/ethnic selection options that respect diversity and cultural identity.
 *
 * Note: This enum corresponds to the Choices_Races global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Race in Table_Identity.
 */
export enum Race {
  OTHER = 1,
  WHITE = 2,
  BLACK = 3,
  CHINESE = 4,
  FILIPINO = 5,
  KOREAN = 6,
  NON_WHITE_LATIN_AMERICAN = 7,
  NON_WHITE_WEST_ASIAN = 8,
  PERSON_OF_MIXED_ORIGIN = 9,
  SOUTH_ASIAN_INDIAN = 10,
  SOUTHEAST_ASIAN = 11,
}

/**
 * Helper function to get race display name
 */
export function getRaceDisplayName(race: Race): string {
  switch (race) {
    case Race.OTHER:
      return 'Other';
    case Race.WHITE:
      return 'White';
    case Race.BLACK:
      return 'Black';
    case Race.CHINESE:
      return 'Chinese';
    case Race.FILIPINO:
      return 'Filipino';
    case Race.KOREAN:
      return 'Korean';
    case Race.NON_WHITE_LATIN_AMERICAN:
      return 'Non-White Latin American (including Indigenous persons from Central and South America, etc.)';
    case Race.NON_WHITE_WEST_ASIAN:
      return 'Non-White West Asian (including Egyptian; Libyan; Lebanese; Iranian; etc.)';
    case Race.PERSON_OF_MIXED_ORIGIN:
      return 'Person of Mixed Origin';
    case Race.SOUTH_ASIAN_INDIAN:
      return 'South Asian/Indian (including Indian from India; Bangladeshi; Pakistani; Indian from Guyana, Trinidad, East Africa; etc.)';
    case Race.SOUTHEAST_ASIAN:
      return 'Southeast Asian (including Burmese; Cambodian; Laotian; Thai; Vietnamese; etc.)';
    default:
      return 'Unknown';
  }
}

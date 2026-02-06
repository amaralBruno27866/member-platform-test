/**
 * Enum: Gender
 * Objective: Define the available gender identity options for Table_Identity entity.
 * Functionality: Provides comprehensive gender choices synchronized with Dataverse global choices.
 * Expected Result: Inclusive gender selection options that respect diversity and identity.
 *
 * Note: This enum corresponds to the Choices_Genders global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Gender in Table_Identity.
 */
export enum Gender {
  FEMALE = 1,
  MALE = 2,
  QUEER = 3,
  TRANSGENDER = 4,
  GENDER_NON_CONFORMING = 5,
  GENDERFLUID = 6,
  NON_BINARY = 7,
  TWO_SPIRIT = 8,
  PREFER_NOT_TO_DISCLOSE = 9,
}

/**
 * Helper function to get gender display name
 */
export function getGenderDisplayName(gender: Gender): string {
  switch (gender) {
    case Gender.FEMALE:
      return 'Female';
    case Gender.MALE:
      return 'Male';
    case Gender.QUEER:
      return 'Queer';
    case Gender.TRANSGENDER:
      return 'Transgender';
    case Gender.GENDER_NON_CONFORMING:
      return 'Gender Non-Conforming';
    case Gender.GENDERFLUID:
      return 'Genderfluid';
    case Gender.NON_BINARY:
      return 'Non-Binary';
    case Gender.TWO_SPIRIT:
      return 'Two-Spirit';
    case Gender.PREFER_NOT_TO_DISCLOSE:
      return 'Prefer Not to Disclose';
    default:
      return 'Unknown';
  }
}

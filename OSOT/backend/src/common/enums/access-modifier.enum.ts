/**
 * Enum: AccessModifier
 * Objective: Define the available access modifier options for account visibility and data protection.
 * Functionality: Provides standardized access modifier choices synchronized with Dataverse global choices.
 * Expected Result: Consistent access control for account data.
 *
 * Note: This enum corresponds to the Choices_Access_Modifiers global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Access_Modifiers in Table_Account.
 */
export enum AccessModifier {
  PUBLIC = 1,
  PROTECTED = 2,
  PRIVATE = 3,
}

/**
 * Helper function to get access modifier display name
 */
export function getAccessModifierDisplayName(modifier: AccessModifier): string {
  switch (modifier) {
    case AccessModifier.PUBLIC:
      return 'Public';
    case AccessModifier.PROTECTED:
      return 'Protected';
    case AccessModifier.PRIVATE:
      return 'Private';
    default:
      return 'Unknown';
  }
}

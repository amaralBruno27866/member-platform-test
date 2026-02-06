/**
 * Access Modifier Enum
 *
 * Controls visibility and access scope for account data.
 *
 * @file access-modifier.enum.ts
 * @module Account
 * @layer Enums
 */
export enum AccessModifier {
  PUBLIC = 1,
  PROTECTED = 2,
  PRIVATE = 3
}

export const getAccessModifierLabel = (modifier: AccessModifier): string => {
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
};

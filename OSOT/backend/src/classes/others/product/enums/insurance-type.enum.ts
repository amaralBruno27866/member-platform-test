/**
 * Enum: InsuranceType
 * Objective: Define the available insurance type options for product classification.
 * Functionality: Provides standardized insurance type choices synchronized with Dataverse global choices.
 * Expected Result: Consistent insurance type categorization for products and membership insurance selection.
 *
 * Note: This enum corresponds to the Choices_Insurance_Type global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Insurance_Type in Table_Product.
 * This is a single choice field - products can have only one insurance type.
 */
export enum InsuranceType {
  PROFESSIONAL = 1,
  GENERAL = 2,
  CORPORATIVE = 3,
  PROPERTY = 4,
}

/**
 * Helper function to get insurance type display name
 * Used for UI rendering, emails, and API responses
 */
export function getInsuranceTypeDisplayName(type: InsuranceType): string {
  switch (type) {
    case InsuranceType.PROFESSIONAL:
      return 'Professional';
    case InsuranceType.GENERAL:
      return 'Commercial';
    case InsuranceType.CORPORATIVE:
      return 'Corporate';
    case InsuranceType.PROPERTY:
      return 'Commercial Property';
    default:
      return 'Unknown';
  }
}

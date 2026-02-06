/**
 * Enum: ProductCategory
 * Objective: Define the available product category options for product classification and organization.
 * Functionality: Provides standardized product category choices synchronized with Dataverse global choices.
 * Expected Result: Consistent product categorization for inventory management and reporting.
 *
 * Note: This enum corresponds to the Choices_Products_Categories global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Product_Category in Table_Product.
 * This is a single choice field - users can select only one category per product.
 */
export enum ProductCategory {
  MEMBERSHIP = 0,
  INSURANCE = 1,
  PROMOTIONAL = 2,
  ADVERTISING = 3,
  EVENT = 4,
  CONFERENCE = 5,
  ARCHIVED_WEBINAR = 6,
  CAREERS = 7,
  MEMBERS_BENEFITS = 8,
  DONATIONS = 9,
  GENERAL = 10,
}

/**
 * Helper function to get product category display name
 */
export function getProductCategoryDisplayName(
  category: ProductCategory,
): string {
  switch (category) {
    case ProductCategory.MEMBERSHIP:
      return 'Membership';
    case ProductCategory.INSURANCE:
      return 'Insurance';
    case ProductCategory.PROMOTIONAL:
      return 'Promotional';
    case ProductCategory.ADVERTISING:
      return 'Advertising';
    case ProductCategory.EVENT:
      return 'Event';
    case ProductCategory.CONFERENCE:
      return 'Conference';
    case ProductCategory.ARCHIVED_WEBINAR:
      return 'Archived Webinar';
    case ProductCategory.CAREERS:
      return 'Careers';
    case ProductCategory.MEMBERS_BENEFITS:
      return "Member's Benefits";
    case ProductCategory.DONATIONS:
      return 'Donations';
    case ProductCategory.GENERAL:
      return 'General';
    default:
      return 'Unknown';
  }
}

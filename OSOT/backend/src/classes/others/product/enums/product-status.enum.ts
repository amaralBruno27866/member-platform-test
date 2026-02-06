/**
 * Enum: ProductStatus
 * Objective: Define the available product status options for product lifecycle management.
 * Functionality: Provides standardized product status choices synchronized with Dataverse global choices.
 * Expected Result: Consistent product status tracking for inventory and sales management.
 *
 * Note: This enum corresponds to the Choices_Product_Status global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Product_Status in Table_Product.
 * This is a single choice field - users can select only one status per product.
 */
export enum ProductStatus {
  UNAVAILABLE = 0,
  AVAILABLE = 1,
  DISCONTINUED = 2,
  DRAFT = 3,
  OUT_OF_STOCK = 4,
}

/**
 * Helper function to get product status display name
 */
export function getProductStatusDisplayName(status: ProductStatus): string {
  switch (status) {
    case ProductStatus.UNAVAILABLE:
      return 'Unavailable';
    case ProductStatus.AVAILABLE:
      return 'Available';
    case ProductStatus.DISCONTINUED:
      return 'Discontinued';
    case ProductStatus.DRAFT:
      return 'Draft';
    case ProductStatus.OUT_OF_STOCK:
      return 'Out of Stock';
    default:
      return 'Unknown Status';
  }
}

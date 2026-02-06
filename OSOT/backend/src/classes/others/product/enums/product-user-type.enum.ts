/**
 * Product User Type Enum
 *
 * Defines the target user type for products to enable quick filtering
 * before applying detailed audience targeting rules.
 *
 * Values:
 * - 1 (OT_OTA): Product available only for Account users (OT/OTA members)
 * - 2 (AFFILIATE): Product available only for Affiliate users
 * - 3 (BOTH): Product available for all user types (default)
 *
 * Usage:
 * - First layer filter: Check product.osot_user_type vs req.user.userType
 * - Second layer filter: Apply audience target rules for additional refinement
 *
 * Example:
 * ```typescript
 * if (product.osot_user_type === ProductUserType.OT_OTA && userType === 'account') {
 *   // User can see this product, proceed with audience target filtering
 * }
 * ```
 */
export enum ProductUserType {
  /** Product only for OT/OTA Account users */
  OT_OTA = 1,

  /** Product only for Affiliate users */
  AFFILIATE = 2,

  /** Product for both Account and Affiliate users (public) */
  BOTH = 3,
}

/**
 * Get human-readable display name for product user type
 * @param userType - ProductUserType enum value
 * @returns Display name string
 */
export function getProductUserTypeDisplayName(
  userType: ProductUserType,
): string {
  switch (userType) {
    case ProductUserType.OT_OTA:
      return 'OT/OTA';
    case ProductUserType.AFFILIATE:
      return 'Affiliate';
    case ProductUserType.BOTH:
      return 'Both (All Users)';
    default:
      return 'Unknown User Type';
  }
}

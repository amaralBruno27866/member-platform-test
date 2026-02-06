/**
 * Product Utility Functions
 * Shared business logic for product operations
 */

import type { ProductPrices, ProductResponse } from '@/types/product';
import { PRICE_LABELS } from './productConstants';

/**
 * Get all active prices from product (where value is defined, including 0.00)
 */
export function getActivePrices(prices: ProductPrices): Array<{ label: string; value: number }> {
  const activePrices: Array<{ label: string; value: number }> = [];
  
  // Check all possible price fields (using PRICE_LABELS as reference)
  Object.keys(PRICE_LABELS).forEach((key) => {
    const value = prices[key as keyof ProductPrices];
    // Include if value is a defined number (including 0)
    if (typeof value === 'number') {
      activePrices.push({
        label: PRICE_LABELS[key],
        value: value,
      });
    }
  });
  
  return activePrices;
}

/**
 * Get display price (general or highest available)
 */
export function getDisplayPrice(prices: ProductPrices): number {
  // If general price is defined (including 0), use it
  if (prices.general !== undefined && prices.general !== null) {
    return prices.general;
  }
  
  // Otherwise, return the highest price among all categories
  const activePrices = getActivePrices(prices);
  if (activePrices.length > 0) {
    return Math.max(...activePrices.map(p => p.value));
  }
  
  // No prices available
  return 0;
}

/**
 * Check if product is visible in public store
 * Same logic as ProductsStorePage filter
 */
export function isVisibleInStore(product: ProductResponse): boolean {
  // Must be Available status
  if (product.productStatus !== 'Available') {
    return false;
  }
  
  // Check isActive flag (based on dates)
  if (product.isActive === false) {
    return false;
  }
  
  return true;
}

/**
 * Count number of additional prices beyond the display price
 */
export function countAdditionalPrices(prices: ProductPrices, hasGeneralPrice: boolean): number {
  const activePrices = getActivePrices(prices);
  return activePrices.length - (hasGeneralPrice ? 1 : 0);
}

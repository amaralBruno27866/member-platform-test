/**
 * Product Type Definitions
 * Based on backend DTOs: product-response.dto.ts, create-product.dto.ts, update-product.dto.ts
 */

/**
 * Structured prices object
 */
export interface ProductPrices {
  general?: number;
  otStu?: number;
  otNg?: number;
  otPr?: number;
  otNp?: number;
  otRet?: number;
  otLife?: number;
  otaStu?: number;
  otaNg?: number;
  otaNp?: number;
  otaRet?: number;
  otaPr?: number;
  otaLife?: number;
  assoc?: number;
  affPrim?: number;
  affPrem?: number;
}

/**
 * Product Response from API
 */
export interface ProductResponse {
  // Identifiers
  id?: string;
  productId?: string;
  productCode: string;

  // Basic Information
  productName: string;
  productDescription: string;
  productCategory: string; // Enum label (e.g., "Insurance")
  productPicture?: string;

  // Control Fields
  productStatus: string; // Enum label (e.g., "Available")
  productGlCode: string; // Enum label (e.g., "Membership Fee 4100")
  privilege?: string; // Enum label (e.g., "Admin")
  accessModifiers?: string; // Enum label (e.g., "Public")

  // Date Fields (Time-limited products)
  startDate?: string; // ISO 8601 date (YYYY-MM-DD)
  endDate?: string;   // ISO 8601 date (YYYY-MM-DD)
  isActive?: boolean; // Whether product is currently active

  // Pricing
  prices: ProductPrices;
  applicablePrice?: number;
  isGeneralPrice?: boolean; // Whether the applicable price is the general price
  membershipCategory?: string; // User's membership category if applicable

  // Access Control
  isExclusive?: boolean; // Whether product is exclusive to certain membership categories
  userHasAccess?: boolean; // Whether the current user has access to this product
  activeMembershipOnly: boolean; // Whether product requires active membership (NEW)

  // Administrative Fields
  postPurchaseInfo?: string; // Post-purchase information for email receipts (max 4000 chars) (NEW)
  productYear: string; // Product year in YYYY format (e.g., "2025") (NEW)

  // Other Fields
  inventory?: number;
  shipping?: number;
  taxes: number;

  // Computed Fields
  inStock?: boolean;
  lowStock?: boolean;
  totalPrice?: number;
}

/**
 * DTO for creating a new product
 */
export interface CreateProductDto {
  // Basic Information (Required)
  productName: string;
  productCode: string;
  productDescription: string;
  productCategory: number; // Enum value
  productPicture?: string;

  // Control Fields (Required)
  productStatus: number; // Enum value
  productGlCode: number; // Enum value
  privilege?: number; // Enum value
  accessModifiers?: number; // Enum value

  // Pricing (At least one price required)
  generalPrice?: number;
  otStuPrice?: number;
  otNgPrice?: number;
  otPrPrice?: number;
  otNpPrice?: number;
  otRetPrice?: number;
  otLifePrice?: number;
  otaStuPrice?: number;
  otaNgPrice?: number;
  otaNpPrice?: number;
  otaRetPrice?: number;
  otaPrPrice?: number;
  otaLifePrice?: number;
  assocPrice?: number;
  affPrimPrice?: number;
  affPremPrice?: number;

  // Other Fields (Required)
  inventory?: number;
  shipping?: number;
  taxes: number;

  // Date Fields (Time-limited products)
  startDate?: string; // ISO 8601 date (YYYY-MM-DD)
  endDate?: string;   // ISO 8601 date (YYYY-MM-DD)

  // Access Control (NEW)
  activeMembershipOnly: boolean; // Whether product requires active membership (default: false)

  // Administrative Fields (NEW)
  postPurchaseInfo?: string; // Post-purchase information for email receipts (max 4000 chars)
  productYear: string; // Product year in YYYY format (e.g., "2025") - REQUIRED
}

/**
 * DTO for updating a product
 */
export interface UpdateProductDto {
  // Basic Information
  productName?: string;
  productDescription?: string;
  productCategory?: number;
  productPicture?: string;

  // Control Fields
  productStatus?: number;
  productGlCode?: number;
  privilege?: number;
  accessModifiers?: number;

  // Pricing
  generalPrice?: number;
  otStuPrice?: number;
  otNgPrice?: number;
  otPrPrice?: number;
  otNpPrice?: number;
  otRetPrice?: number;
  otLifePrice?: number;
  otaStuPrice?: number;
  otaNgPrice?: number;
  otaNpPrice?: number;
  otaRetPrice?: number;
  otaPrPrice?: number;
  otaLifePrice?: number;
  assocPrice?: number;
  affPrimPrice?: number;
  affPremPrice?: number;

  // Other Fields
  inventory?: number;
  shipping?: number;
  taxes?: number;

  // Date Fields (Time-limited products)
  startDate?: string; // ISO 8601 date (YYYY-MM-DD)
  endDate?: string;   // ISO 8601 date (YYYY-MM-DD)

  // Access Control (NEW)
  activeMembershipOnly?: boolean; // Whether product requires active membership

  // Administrative Fields (NEW)
  postPurchaseInfo?: string; // Post-purchase information for email receipts (max 4000 chars)
  // Note: productYear is NOT editable after creation
}

/**
 * API Response wrapper
 */
export interface ProductApiResponse {
  success: boolean;
  data: ProductResponse;
  message: string;
  timestamp: string;
}

/**
 * API Response wrapper for list
 */
export interface ProductListApiResponse {
  data: ProductResponse[];
  meta?: {
    count: number;
    skip: number;
    take: number;
  };
}

/**
 * Product query filters
 */
export interface ProductQueryParams {
  productCategory?: number;
  productStatus?: number;
  productYear?: string; // Filter by product year (YYYY format) (NEW)
  skip?: number;
  take?: number;
  orderBy?: string;
}

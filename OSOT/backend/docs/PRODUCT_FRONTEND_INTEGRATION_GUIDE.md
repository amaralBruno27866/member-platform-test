# Product Frontend Integration Guide

**Last Updated:** December 8, 2025  
**Target Audience:** Frontend Developers  
**Backend API Version:** v1.1

---

## ⚠️ BREAKING CHANGES & NEW FEATURES (v1.1)

### What's New

1. **Time-Limited Products** 🕒
   - Products can now have `startDate` and `endDate` for promotions/seasonal items
   - Public routes automatically filter by active dates
   - New `isActive` field indicates current availability

2. **Membership-Based Pricing** 🎯
   - Dynamic pricing based on user's membership category (0-14)
   - Account status validation (must be ACTIVE)
   - Membership year validation (current year only)
   - Falls back to `generalPrice` if category price not set

3. **Product Exclusivity** ⭐
   - Products can be exclusive to specific membership categories
   - New `isExclusive` field indicates restricted access
   - `userHasAccess` shows if current user can purchase
   - `applicablePrice` can be `null` if user has no access

4. **Enhanced Response Fields**
   - `membershipCategory`: User's category (0-14)
   - `userGroup`: User's group from membership
   - `accountGroup`: User's account group
   - `isActive`: Date-based availability status
   - `startDate`/`endDate`: Product availability period

### Migration Checklist

- [ ] Update TypeScript interfaces with new fields
- [ ] Handle `null` values for `applicablePrice` and `totalPrice`
- [ ] Check `userHasAccess` before showing purchase options
- [ ] Display `isActive` status for time-limited products
- [ ] Show expiration warnings for products with `endDate`
- [ ] Handle exclusive products with appropriate UI messages
- [ ] Update date pickers to support ISO 8601 format (YYYY-MM-DD)
- [ ] Test with different membership categories
- [ ] Validate date ranges (endDate >= startDate)

---

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Data Types & Enums](#data-types--enums)
4. [Product Schema](#product-schema)
5. [Public vs Private Routes](#public-vs-private-routes)
6. [CRUD Operations Examples](#crud-operations-examples)
7. [Price System](#price-system)
8. [File Upload (Product Picture)](#file-upload-product-picture)
9. [Common Errors](#common-errors)
10. [TypeScript Types](#typescript-types)

---

## Overview

The Product API provides comprehensive product management functionality with two access patterns:

- **Public Routes** (`/public/products`): Browse AVAILABLE products without authentication
- **Private Routes** (`/private/products`): Full CRUD operations requiring JWT authentication + Admin privilege

### Key Features

- **16 price fields** for different membership categories (0-14)
- **Dynamic pricing** based on user membership category and status
- **Time-limited products** with start/end dates for promotions
- **Product exclusivity** - products can be restricted to specific membership categories
- **Access control** - validates user account status and membership before showing prices
- Product categorization and status management
- Image upload via Cloudinary integration
- Inventory tracking with low stock warnings
- Tax and shipping calculation

---

## API Endpoints

### Public Routes (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/public/products` | List all AVAILABLE products |
| GET | `/public/products/:id` | Get product details (by GUID or productId) |
| GET | `/public/products/category/:category` | List products by category |
| GET | `/public/products/stats/basic` | Basic product statistics |

### Private Routes (JWT + Admin Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/private/products` | List ALL products (includes DRAFT, DISCONTINUED) |
| GET | `/private/products/:id` | Get product details with full price info |
| POST | `/private/products` | Create new product |
| PATCH | `/private/products/:id` | Update existing product |
| DELETE | `/private/products/:id` | Soft delete (set to DISCONTINUED) |
| DELETE | `/private/products/:id/hard` | Hard delete (Owner privilege only) |
| PATCH | `/private/products/batch` | Batch update multiple products |
| GET | `/private/products/stats/full` | Full product statistics |

---

## Data Types & Enums

### ProductCategory (Enum)

```typescript
enum ProductCategory {
  INSURANCE = 0,
  GENERAL = 1,
  SERVICE = 2,
  MEMBERSHIP = 3,
  EVENT = 4,
  MERCHANDISE = 5,
  DONATION = 6,
  PUBLICATION = 7,
  TRAINING = 8,
  CERTIFICATION = 9
}
```

**Display Names:**
- `0` → "Insurance"
- `1` → "General"
- `2` → "Service"
- etc.

### ProductStatus (Enum)

```typescript
enum ProductStatus {
  DRAFT = 0,
  AVAILABLE = 1,
  DISCONTINUED = 2,
  OUT_OF_STOCK = 3
}
```

**Display Names:**
- `0` → "Draft"
- `1` → "Available"
- `2` → "Discontinued"
- `3` → "Out of Stock"

### ProductGLCode (Enum)

```typescript
enum ProductGLCode {
  MEMBERSHIP_FEE_4100 = 9,
  CONFERENCE_PREPAID_2086 = 0,
  // ... (10 GL codes total)
}
```

**Display Names:**
- `9` → "Membership Fee 4100"
- `0` → "Pre-paid Conference 2086"
- etc.

### Privilege (Enum)

```typescript
enum Privilege {
  OWNER = 1,
  ADMIN = 2,
  MAIN = 3
}
```

**⚠️ IMPORTANT:** Never use `0` for privilege - it's invalid!

### AccessModifier (Enum)

```typescript
enum AccessModifier {
  PUBLIC = 1,
  PROTECTED = 2,
  PRIVATE = 3
}
```

**⚠️ IMPORTANT:** Never use `0` for accessModifiers - it's invalid!

---

## Product Schema

### Request Schema (Create/Update)

```typescript
interface CreateProductDto {
  // Required Fields
  productName: string;              // Max 100 chars
  productCode: string;              // Max 25 chars, unique, case-insensitive
  productDescription: string;       // Max 255 chars
  productCategory: ProductCategory; // Enum value (0-9)
  productStatus: ProductStatus;     // Enum value (0-3)
  productGlCode: ProductGLCode;     // Enum value
  taxes: number;                    // Decimal, 0-100 (percentage)
  
  // Optional Fields
  productPicture?: string;          // URL, max 2048 chars
  privilege?: Privilege;            // Enum value (1, 2, or 3) - Default: 1
  accessModifiers?: AccessModifier; // Enum value (1, 2, or 3) - Default: 1
  inventory?: number;               // Integer, 0-2147483647 - Default: 0
  shipping?: number;                // Currency - Default: 0
  
  // Date Fields (NEW - Time-Limited Products)
  startDate?: string;               // ISO 8601 date (YYYY-MM-DD) - Product becomes available
  endDate?: string;                 // ISO 8601 date (YYYY-MM-DD) - Product expires
  
  // Price Fields (16 total - all optional)
  generalPrice?: number;            // Currency, max 2 decimals
  otStuPrice?: number;              // OT-STU category price (Category 0)
  otNgPrice?: number;               // OT-NG category price (Category 1)
  otPrPrice?: number;               // OT-PR category price (Category 2)
  otNpPrice?: number;               // OT-NP category price (Category 3)
  otRetPrice?: number;              // OT-RET category price (Category 4)
  otLifePrice?: number;             // OT-LIFE category price (Category 5)
  otaStuPrice?: number;             // OTA-STU category price (Category 6)
  otaNgPrice?: number;              // OTA-NG category price (Category 7)
  otaNpPrice?: number;              // OTA-NP category price (Category 8)
  otaRetPrice?: number;             // OTA-RET category price (Category 9)
  otaPrPrice?: number;              // OTA-PR category price (Category 10)
  otaLifePrice?: number;            // OTA-LIFE category price (Category 11)
  assocPrice?: number;              // ASSOC category price (Category 12)
  affPrimPrice?: number;            // AFF-PRIM category price (Category 13)
  affPremPrice?: number;            // AFF-PREM category price (Category 14)
}
```

### Response Schema

```typescript
interface ProductResponseDto {
  // Identifiers
  id: string;                       // GUID (osot_table_productid)
  productId: string;                // Business ID (osot-prod-0000001)
  productCode: string;
  
  // Basic Information
  productName: string;
  productDescription: string;
  productCategory: string;          // Display name (e.g., "Insurance")
  productPicture?: string;
  
  // Control Fields
  productStatus: string;            // Display name (e.g., "Available")
  productGlCode: string;            // Display name (e.g., "Membership Fee 4100")
  privilege?: string;               // Display name (e.g., "Owner")
  accessModifiers?: string;         // Display name (e.g., "Public")
  
  // Date Fields (NEW - Time-Limited Products)
  startDate?: string;               // ISO 8601 date (YYYY-MM-DD) - When product becomes available
  endDate?: string;                 // ISO 8601 date (YYYY-MM-DD) - When product expires
  isActive?: boolean;               // Whether product is active NOW (based on dates)
  
  // Pricing
  prices: ProductPricesDto;         // Object with non-zero prices only
  applicablePrice?: number;         // Price for current user's category (null if no access)
  
  // Membership Integration (NEW)
  isExclusive?: boolean;            // Product exclusive to specific category
  userHasAccess?: boolean;          // Whether current user can purchase
  userGroup?: string;               // User's group from membership
  accountGroup?: string;            // User's account group
  membershipCategory?: number;      // User's membership category (0-14)
  
  // Other Fields
  inventory?: number;
  shipping?: number;                // Always present (defaults to 0)
  taxes: number;
  
  // Computed Fields
  inStock: boolean;                 // inventory > 0
  lowStock: boolean;                // inventory <= 10 and > 0
  totalPrice?: number;              // applicablePrice + taxes + shipping (null if no access)
  
  // Additional Fields (Private routes only)
  displayPrice?: number;            // Same as applicablePrice
  priceField?: string;              // Field name used (e.g., "osot_category_0_price")
  isGeneralPrice?: boolean;         // true if using general price
  canPurchase?: boolean;            // Eligibility check (considers dates + membership + status)
}
```

### ProductPricesDto (Object)

```typescript
interface ProductPricesDto {
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
```

**⚠️ IMPORTANT:** Only prices > 0 are included. If a product has only `generalPrice: 100`, the response will be:

```json
{
  "prices": {
    "general": 100
  }
}
```

---

## Public vs Private Routes

### Public Routes (`/public/products`)

**Access:** No authentication required  
**Visibility:** Only AVAILABLE products that are currently active (based on dates)  
**Price Calculation:** Always returns `generalPrice` or `null` if product is exclusive and user not authenticated  
**Date Filtering:** Only products where `startDate <= TODAY <= endDate` (or dates are null)

**Example Response:**

```json
{
  "data": [
    {
      "id": "047d4f3d-bed2-f011-8544-7ced8da6d363",
      "productId": "osot-prod-0000004",
      "productCode": "MEMBERSHIP-2025",
      "productName": "OSOT Membership 2025",
      "productCategory": "Insurance",
      "productStatus": "Available",
      "startDate": "2025-01-01",
      "endDate": "2025-12-31",
      "isActive": true,
      "prices": {
        "general": 100
      },
      "applicablePrice": 100,
      "isExclusive": false,
      "userHasAccess": true,
      "inventory": 100,
      "shipping": 10,
      "taxes": 13,
      "totalPrice": 123
    }
  ]
}
```

### Private Routes (`/private/products`)

**Access:** JWT token required + Admin privilege  
**Visibility:** ALL products (DRAFT, AVAILABLE, DISCONTINUED, OUT_OF_STOCK) regardless of dates  
**Price Calculation:** Category-specific pricing based on user's membership  
**Date Filtering:** NO filtering - shows all products even if expired

**Example Response (Authenticated User with OT-STU Membership):**

```json
{
  "data": [
    {
      "id": "047d4f3d-bed2-f011-8544-7ced8da6d363",
      "productId": "osot-prod-0000004",
      "productCode": "MEMBERSHIP-2025",
      "productName": "OSOT Membership 2025",
      "productCategory": "Insurance",
      "productStatus": "Available",
      "privilege": "Owner",
      "accessModifiers": "Private",
      "startDate": "2025-01-01",
      "endDate": "2025-12-31",
      "isActive": true,
      "prices": {
        "general": 100,
        "otStu": 50,
        "otNg": 75,
        "otPr": 100,
        "assoc": 120,
        "affPrim": 85,
        "affPrem": 95
      },
      "applicablePrice": 50,
      "isExclusive": false,
      "userHasAccess": true,
      "membershipCategory": 0,
      "userGroup": "Student",
      "inventory": 100,
      "shipping": 10,
      "taxes": 13,
      "totalPrice": 73,
      "displayPrice": 50,
      "priceField": "osot_category_0_price",
      "isGeneralPrice": false,
      "canPurchase": true
    }
  ]
}
```

**Example Response (Exclusive Product - User Without Access):**

```json
{
  "data": [
    {
      "id": "c5e8f2a1-9d4b-3c7e-8f1a-2b6d9e4c8a7f",
      "productId": "osot-prod-0000042",
      "productCode": "OT-STU-EXCLUSIVE",
      "productName": "OT Student Exclusive Training",
      "productCategory": "Training",
      "productStatus": "Available",
      "startDate": "2025-01-01",
      "endDate": "2025-06-30",
      "isActive": true,
      "prices": {
        "otStu": 25
      },
      "applicablePrice": null,
      "isExclusive": true,
      "userHasAccess": false,
      "membershipCategory": 2,
      "userGroup": "Practitioner",
      "inventory": 50,
      "shipping": 0,
      "taxes": 13,
      "totalPrice": null,
      "canPurchase": false
    }
  ]
}
```

---

## CRUD Operations Examples

### 1. Create Product (POST `/private/products`)

**Request:**

```typescript
const createProduct = async () => {
  const response = await fetch('http://localhost:3000/private/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      productName: 'OSOT Membership 2025',
      productCode: 'MEMBERSHIP-2025',
      productDescription: 'Annual membership for OT professionals',
      productPicture: 'https://example.com/images/membership.jpg',
      productCategory: 0,      // Insurance
      productStatus: 1,        // Available
      productGlCode: 9,        // Membership Fee 4100
      privilege: 1,            // Owner (NOT 0!)
      accessModifiers: 3,      // Private (NOT 0!)
      generalPrice: 100,
      otStuPrice: 50,
      otNgPrice: 75,
      inventory: 100,
      shipping: 10,
      taxes: 13
    })
  });
  
  const data = await response.json();
  return data;
};
```

**Response:**

```json
{
  "data": {
    "id": "047d4f3d-bed2-f011-8544-7ced8da6d363",
    "productId": "osot-prod-0000004",
    "productCode": "MEMBERSHIP-2025",
    "productName": "OSOT Membership 2025",
    "prices": {
      "general": 100,
      "otStu": 50,
      "otNg": 75
    },
    "inventory": 100,
    "shipping": 10,
    "taxes": 13
  },
  "message": "Product created successfully"
}
```

### 2. Update Product (PATCH `/private/products/:id`)

**Request:**

```typescript
const updateProduct = async (productId: string) => {
  const response = await fetch(`http://localhost:3000/private/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      generalPrice: 120,       // Update price
      otStuPrice: 60,          // Update price
      shipping: 15,            // Update shipping
      inventory: 150           // Update inventory
    })
  });
  
  return await response.json();
};
```

**⚠️ IMPORTANT:** You can use either:
- GUID: `047d4f3d-bed2-f011-8544-7ced8da6d363`
- Product ID: `osot-prod-0000004`

### 3. Get Product Details (GET `/private/products/:id`)

**Request:**

```typescript
const getProduct = async (productId: string) => {
  const response = await fetch(`http://localhost:3000/private/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  return await response.json();
};
```

### 4. List All Products (GET `/private/products`)

**Request with Filters:**

```typescript
const listProducts = async (filters?: {
  productCategory?: number;
  productStatus?: number;
  skip?: number;
  take?: number;
  orderBy?: string;
}) => {
  const params = new URLSearchParams();
  
  if (filters?.productCategory !== undefined) {
    params.append('productCategory', filters.productCategory.toString());
  }
  if (filters?.productStatus !== undefined) {
    params.append('productStatus', filters.productStatus.toString());
  }
  if (filters?.skip) params.append('skip', filters.skip.toString());
  if (filters?.take) params.append('take', filters.take.toString());
  if (filters?.orderBy) params.append('orderBy', filters.orderBy);
  
  const response = await fetch(
    `http://localhost:3000/private/products?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    }
  );
  
  return await response.json();
};
```

**Response:**

```json
{
  "data": [
    { /* product 1 */ },
    { /* product 2 */ }
  ],
  "meta": {
    "count": 2,
    "skip": 0,
    "take": 20
  }
}
```

### 5. Delete Product (DELETE `/private/products/:id`)

**Soft Delete (DISCONTINUED):**

```typescript
const deleteProduct = async (productId: string) => {
  const response = await fetch(`http://localhost:3000/private/products/${productId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  return await response.json();
};
```

**Hard Delete (Owner Only):**

```typescript
const hardDeleteProduct = async (productId: string) => {
  const response = await fetch(`http://localhost:3000/private/products/${productId}/hard`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  return await response.json();
};
```

---

## Price System

### Price Fields Mapping

| DTO Field Name | Display Name | User Category | Category Number |
|----------------|--------------|---------------|-----------------|
| `generalPrice` | General Price | Public/Default | N/A |
| `otStuPrice` | OT-STU Price | OT Student | 0 |
| `otNgPrice` | OT-NG Price | OT New Graduate | 1 |
| `otPrPrice` | OT-PR Price | OT Practitioner | 2 |
| `otNpPrice` | OT-NP Price | OT Non-Practitioner | 3 |
| `otRetPrice` | OT-RET Price | OT Retired | 4 |
| `otLifePrice` | OT-LIFE Price | OT Life Member | 5 |
| `otaStuPrice` | OTA-STU Price | OTA Student | 6 |
| `otaNgPrice` | OTA-NG Price | OTA New Graduate | 7 |
| `otaNpPrice` | OTA-NP Price | OTA Non-Practitioner | 8 |
| `otaRetPrice` | OTA-RET Price | OTA Retired | 9 |
| `otaPrPrice` | OTA-PR Price | OTA Practitioner | 10 |
| `otaLifePrice` | OTA-LIFE Price | OTA Life Member | 11 |
| `assocPrice` | ASSOC Price | Associate Member | 12 |
| `affPrimPrice` | AFF-PRIM Price | Affiliate Primary | 13 |
| `affPremPrice` | AFF-PREM Price | Affiliate Premium | 14 |

### Price Calculation Logic (IMPLEMENTED)

The backend now calculates prices based on user authentication and membership status:

#### 1. User NOT Authenticated
- Returns `generalPrice`
- If product is **exclusive** (only one category price set), returns `null` for `applicablePrice`
- `userHasAccess` = `false` if exclusive, `true` if general price exists

#### 2. User Authenticated + Account Status NOT ACTIVE
- Returns `generalPrice`
- `userHasAccess` = `false` if exclusive, `true` if general price exists
- User must have `account_status = 1` (ACTIVE) to access category prices

#### 3. User Authenticated + Active Account + NO Active Membership
- Returns `generalPrice`
- `activeMember` flag must be `true` to access category prices
- Falls back to general price if membership inactive

#### 4. User Authenticated + Active Account + Active Membership
- Fetches user's `MembershipCategory` (for current year)
- Maps category (0-14) to corresponding price field
- Returns category-specific price (e.g., `otStuPrice` for category 0)
- Falls back to `generalPrice` if category price is not set
- `userHasAccess` = `true`
- `isGeneralPrice` = `false`

**Example Flow:**

```
User Login → Check account_status → Check active_member → Fetch MembershipCategory
                                                          ↓
                                             Get membership_category (0-14)
                                                          ↓
                                             Map to price field (otStuPrice, etc.)
                                                          ↓
                                    Return category price OR fallback to generalPrice
```

### Product Exclusivity

Products can be **exclusive** to specific membership categories. This happens when:
- Only ONE category price field is populated (excluding `generalPrice`)
- No `generalPrice` is set OR only ONE category price + `generalPrice`

**Examples:**

```typescript
// Exclusive Product (OT Students Only)
{
  generalPrice: null,
  otStuPrice: 25,
  // All other prices: null
}
// Result: Only users with category 0 can purchase

// Non-Exclusive Product (Multiple Categories)
{
  generalPrice: 100,
  otStuPrice: 50,
  otPrPrice: 75,
  assocPrice: 120
}
// Result: Users get their category price, others get general

// Public Product (General Only)
{
  generalPrice: 100
  // All other prices: null
}
// Result: Everyone gets general price
```

**UI Handling:**

```typescript
const displayProductAccess = (product: ProductResponseDto) => {
  if (product.isExclusive && !product.userHasAccess) {
    return (
      <div className="exclusive-notice">
        <p>This product is exclusive to specific membership categories.</p>
        <p>You do not have access to purchase this item.</p>
      </div>
    );
  }
  
  if (product.applicablePrice === null) {
    return <p>Price not available for your membership category.</p>;
  }
  
  return <p>Price: ${product.applicablePrice}</p>;
};
```

### Filtering Empty Prices

The API automatically filters out prices that are `<= 0`. This means:

```typescript
// Request
{
  generalPrice: 100,
  otStuPrice: 50,
  otLifePrice: 0,  // This will be excluded
  otNgPrice: 75
}

// Response
{
  "prices": {
    "general": 100,
    "otStu": 50,
    "otNg": 75
    // otLife is NOT included because it was 0
  }
}
```

---

## Time-Limited Products (NEW)

Products can now have start and end dates for promotional periods or seasonal availability.

### Date Fields

- **`startDate`** (optional): Date when product becomes available (YYYY-MM-DD)
- **`endDate`** (optional): Date when product expires/becomes unavailable (YYYY-MM-DD)
- **`isActive`** (computed): Whether product is currently active based on dates

### Date Validation Rules

1. **Both dates null**: Product always active (no time limit)
2. **Only `startDate` set**: Product active from start date onwards
3. **Only `endDate` set**: Product active until end date
4. **Both dates set**: Product active within date range
5. **`endDate` must be >= `startDate`** (validation enforced)

### Public Route Filtering

Public routes (`/public/products`) automatically filter by active dates:
- Shows only products where `startDate <= TODAY <= endDate` (or dates null)
- Respects product status (AVAILABLE only)

### Private Route Behavior

Private routes (`/private/products`) show ALL products regardless of dates:
- Admin users can see expired/future products
- Use `isActive` field to check current availability

### Creating Time-Limited Products

```typescript
const createPromotionalProduct = async () => {
  const response = await fetch('http://localhost:3000/private/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      productName: 'Summer Sale - OT Training',
      productCode: 'SUMMER-2025',
      productDescription: 'Limited time summer training discount',
      productCategory: 8,           // Training
      productStatus: 1,             // Available
      productGlCode: 2,             // Course Fee
      startDate: '2025-06-01',      // Available from June 1
      endDate: '2025-08-31',        // Expires August 31
      generalPrice: 150,
      otStuPrice: 75,               // 50% discount for students
      taxes: 13,
      inventory: 50
    })
  });
  
  return await response.json();
};
```

### UI Display Examples

```typescript
// Display product availability period
const displayProductPeriod = (product: ProductResponseDto) => {
  if (!product.startDate && !product.endDate) {
    return <p>Always available</p>;
  }
  
  if (product.startDate && product.endDate) {
    return (
      <p>
        Available: {formatDate(product.startDate)} - {formatDate(product.endDate)}
      </p>
    );
  }
  
  if (product.startDate) {
    return <p>Available from: {formatDate(product.startDate)}</p>;
  }
  
  return <p>Available until: {formatDate(product.endDate)}</p>;
};

// Show expiration warning
const showExpirationWarning = (product: ProductResponseDto) => {
  if (!product.endDate || !product.isActive) return null;
  
  const daysUntilExpiration = calculateDaysUntil(product.endDate);
  
  if (daysUntilExpiration <= 7) {
    return (
      <div className="expiration-warning">
        <p>⚠️ This product expires in {daysUntilExpiration} days!</p>
      </div>
    );
  }
  
  return null;
};

// Disable purchase for inactive products
const canPurchaseProduct = (product: ProductResponseDto) => {
  return (
    product.productStatus === 'Available' &&
    product.isActive &&              // Check date-based availability
    product.inStock &&
    product.userHasAccess &&         // Check membership access
    product.applicablePrice !== null // Check price availability
  );
};
```

### Common Date Scenarios

#### Scenario 1: Pre-Order Product
```json
{
  "productName": "Conference 2026 Early Bird",
  "startDate": "2026-01-01",
  "endDate": "2026-02-28",
  "isActive": false
}
```
UI: Show "Available from January 1, 2026" with countdown

#### Scenario 2: Limited Time Promotion
```json
{
  "productName": "Black Friday Deal",
  "startDate": "2025-11-29",
  "endDate": "2025-12-01",
  "isActive": true
}
```
UI: Show "Ends in X hours!" with urgency indicator

#### Scenario 3: Expired Product
```json
{
  "productName": "2024 Membership",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "isActive": false
}
```
UI: Show "This product has expired" (only visible in admin/private routes)

---

## File Upload (Product Picture)

### Upload Flow

1. **Upload image to Cloudinary first**
2. **Use returned URL in product creation/update**

**Example:**

```typescript
const uploadProductPicture = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:3000/upload/product-picture', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    },
    body: formData
  });
  
  const data = await response.json();
  return data.url; // Use this URL in productPicture field
};

// Then create product with uploaded URL
const createProductWithImage = async (imageFile: File) => {
  const pictureUrl = await uploadProductPicture(imageFile);
  
  const response = await fetch('http://localhost:3000/private/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      productName: 'My Product',
      productCode: 'PROD-001',
      productPicture: pictureUrl, // Cloudinary URL
      // ... other fields
    })
  });
  
  return await response.json();
};
```

**⚠️ IMPORTANT:** 
- Maximum URL length: 2048 characters
- Must be a valid URL format
- Cloudinary URLs are automatically validated

---

## Common Errors

### 1. Validation Errors (400 Bad Request)

**Error: Using `0` for enums**

```json
{
  "statusCode": 400,
  "message": [
    "privilege must not be less than 1",
    "accessModifiers must not be less than 1"
  ],
  "error": "Bad Request"
}
```

**Solution:** Use valid enum values (1, 2, or 3) for `privilege` and `accessModifiers`.

**Error: Field name with `osot_` prefix**

```json
{
  "statusCode": 400,
  "message": "property osot_general_price should not exist",
  "error": "Bad Request"
}
```

**Solution:** Use camelCase names WITHOUT `osot_` prefix:
- ❌ `osot_general_price`
- ✅ `generalPrice`

### 2. Duplicate Product Code (409 Conflict)

```json
{
  "statusCode": 409,
  "message": "Product code MEMBERSHIP-2025 already exists",
  "error": "Conflict"
}
```

**Solution:** Use a unique `productCode` (case-insensitive check).

### 3. Invalid Date Range (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "End date must be equal to or after start date",
  "error": "Bad Request"
}
```

**Solution:** Ensure `endDate >= startDate` when both are provided.

### 4. Invalid Date Format (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": [
    "startDate must be a valid ISO 8601 date string",
    "endDate must be a valid ISO 8601 date string"
  ],
  "error": "Bad Request"
}
```

**Solution:** Use ISO 8601 date format (YYYY-MM-DD) for date fields.

### 5. Not Found (404)

```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

**Solution:** Verify the product ID (GUID or productId) is correct.

### 6. Forbidden (403)

```json
{
  "statusCode": 403,
  "message": "Only Admin users can create products",
  "error": "Forbidden"
}
```

**Solution:** Ensure user has Admin or Main privilege.

### 7. Unauthorized (401)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Solution:** Include valid JWT token in Authorization header.

---

## TypeScript Types

### Complete Type Definitions

```typescript
// Enums
export enum ProductCategory {
  INSURANCE = 0,
  GENERAL = 1,
  SERVICE = 2,
  MEMBERSHIP = 3,
  EVENT = 4,
  MERCHANDISE = 5,
  DONATION = 6,
  PUBLICATION = 7,
  TRAINING = 8,
  CERTIFICATION = 9
}

export enum ProductStatus {
  DRAFT = 0,
  AVAILABLE = 1,
  DISCONTINUED = 2,
  OUT_OF_STOCK = 3
}

export enum ProductGLCode {
  CONFERENCE_PREPAID_2086 = 0,
  CONSULTING_INCOME_4210 = 1,
  COURSE_FEE_4200 = 2,
  EXAM_FEE_4300 = 3,
  PUBLICATION_SALES_4400 = 4,
  RENTAL_INCOME_4500 = 5,
  ACCREDITATION_FEE_4600 = 6,
  SPONSORSHIP_INCOME_4700 = 7,
  DONATION_INCOME_4800 = 8,
  MEMBERSHIP_FEE_4100 = 9
}

export enum Privilege {
  OWNER = 1,
  ADMIN = 2,
  MAIN = 3
}

export enum AccessModifier {
  PUBLIC = 1,
  PROTECTED = 2,
  PRIVATE = 3
}

// DTOs
export interface CreateProductDto {
  productName: string;
  productCode: string;
  productDescription: string;
  productCategory: ProductCategory;
  productStatus: ProductStatus;
  productGlCode: ProductGLCode;
  taxes: number;
  productPicture?: string;
  privilege?: Privilege;
  accessModifiers?: AccessModifier;
  inventory?: number;
  shipping?: number;
  startDate?: string;        // NEW - ISO 8601 date (YYYY-MM-DD)
  endDate?: string;          // NEW - ISO 8601 date (YYYY-MM-DD)
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
}

export interface UpdateProductDto {
  productName?: string;
  productCode?: string;
  productDescription?: string;
  productCategory?: ProductCategory;
  productStatus?: ProductStatus;
  productGlCode?: ProductGLCode;
  productPicture?: string;
  privilege?: Privilege;
  accessModifiers?: AccessModifier;
  inventory?: number;
  shipping?: number;
  taxes?: number;
  startDate?: string;        // NEW - ISO 8601 date (YYYY-MM-DD)
  endDate?: string;          // NEW - ISO 8601 date (YYYY-MM-DD)
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
}

export interface ProductPricesDto {
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

export interface ProductResponseDto {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  productDescription: string;
  productCategory: string;
  productPicture?: string;
  productStatus: string;
  productGlCode: string;
  privilege?: string;
  accessModifiers?: string;
  startDate?: string;           // NEW - ISO 8601 date (YYYY-MM-DD)
  endDate?: string;             // NEW - ISO 8601 date (YYYY-MM-DD)
  isActive?: boolean;           // NEW - Whether product is currently active
  prices: ProductPricesDto;
  applicablePrice?: number;     // Can be null if user has no access
  isExclusive?: boolean;        // NEW - Product exclusive to category
  userHasAccess?: boolean;      // NEW - Whether user can purchase
  userGroup?: string;           // NEW - User's membership group
  accountGroup?: string;        // NEW - User's account group
  membershipCategory?: number;  // NEW - User's category (0-14)
  inventory?: number;
  shipping?: number;
  taxes: number;
  inStock?: boolean;
  lowStock?: boolean;
  totalPrice?: number;          // Can be null if no access
  displayPrice?: number;
  priceField?: string;
  isGeneralPrice?: boolean;
  canPurchase?: boolean;
}

export interface ListProductsQueryDto {
  productCategory?: ProductCategory;
  productStatus?: ProductStatus;
  skip?: number;
  take?: number;
  orderBy?: string;
}

export interface ProductListResponse {
  data: ProductResponseDto[];
  meta: {
    count: number;
    skip: number;
    take: number;
  };
}

export interface ProductCreateResponse {
  data: ProductResponseDto;
  message: string;
}
```

---

## Best Practices

### 1. Always Use Enum Values (Not 0)

```typescript
// ❌ WRONG
{
  privilege: 0,
  accessModifiers: 0
}

// ✅ CORRECT
{
  privilege: 1,        // Owner
  accessModifiers: 1   // Public
}
```

### 2. Use CamelCase Field Names

```typescript
// ❌ WRONG
{
  osot_general_price: 100,
  osot_otstu_price: 50
}

// ✅ CORRECT
{
  generalPrice: 100,
  otStuPrice: 50
}
```

### 3. Handle Null Prices (NEW)

```typescript
// Always check if user has access before displaying price
const displayPrice = (product: ProductResponseDto) => {
  if (product.applicablePrice === null) {
    if (product.isExclusive) {
      return 'This product is exclusive to specific membership categories';
    }
    return 'Price not available';
  }
  
  return `$${product.applicablePrice.toFixed(2)}`;
};

// Check membership-based pricing
const isPricingCustomized = (product: ProductResponseDto) => {
  return (
    !product.isGeneralPrice && 
    product.membershipCategory !== undefined
  );
};
```

### 4. Check Product Availability (UPDATED)

```typescript
const canPurchase = (product: ProductResponseDto) => {
  return (
    product.productStatus === 'Available' &&
    product.isActive &&              // Check date-based availability
    product.inStock &&
    product.userHasAccess &&         // Check membership access
    product.applicablePrice !== null && // Check price availability
    product.canPurchase
  );
};
```

### 5. Display Computed Fields

```typescript
// Use totalPrice for checkout (can be null)
const checkoutPrice = product.totalPrice; 
if (checkoutPrice === null) {
  console.error('User does not have access to purchase this product');
}

// Show stock warnings
if (product.lowStock) {
  console.warn('Low stock warning!');
}

// Show expiration warnings
if (product.endDate && product.isActive) {
  const daysLeft = calculateDaysUntil(product.endDate);
  if (daysLeft <= 7) {
    console.warn(`Product expires in ${daysLeft} days!`);
  }
}
```

### 6. Validate Date Ranges (NEW)

```typescript
// When creating/updating products with dates
const validateDateRange = (startDate?: string, endDate?: string) => {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      throw new Error('End date must be equal to or after start date');
    }
  }
};

// Format dates for display
const formatProductDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
```

### 7. Handle Exclusive Products (NEW)

```typescript
// Display appropriate message for exclusive products
const displayExclusiveMessage = (product: ProductResponseDto) => {
  if (!product.isExclusive) return null;
  
  if (product.userHasAccess) {
    return (
      <div className="exclusive-badge">
        ⭐ Exclusive Member Price
      </div>
    );
  }
  
  return (
    <div className="exclusive-notice">
      <p>This product is available exclusively to specific membership categories.</p>
      {product.membershipCategory !== undefined && (
        <p>Your current category: {getCategoryName(product.membershipCategory)}</p>
      )}
    </div>
  );
};

// Helper to get category name
const getCategoryName = (category: number): string => {
  const categories = [
    'OT Student', 'OT New Graduate', 'OT Practitioner', 'OT Non-Practitioner',
    'OT Retired', 'OT Life Member', 'OTA Student', 'OTA New Graduate',
    'OTA Non-Practitioner', 'OTA Retired', 'OTA Practitioner', 'OTA Life Member',
    'Associate', 'Affiliate Primary', 'Affiliate Premium'
  ];
  return categories[category] || 'Unknown';
};
```

### 8. Filter Products by Active Status (NEW)

```typescript
// Client-side filtering for date-based availability
const filterActiveProducts = (products: ProductResponseDto[]) => {
  return products.filter(product => product.isActive);
};

// Show upcoming products separately
const filterUpcomingProducts = (products: ProductResponseDto[]) => {
  return products.filter(product => {
    if (!product.startDate) return false;
    return new Date(product.startDate) > new Date();
  });
};

// Show expired products (admin view)
const filterExpiredProducts = (products: ProductResponseDto[]) => {
  return products.filter(product => {
    if (!product.endDate) return false;
    return new Date(product.endDate) < new Date();
  });
};
```

---

## Future Changes

### Multiple Product Images (Planned for Monday, December 9, 2025)

**Current:** `productPicture: string` (single URL)  
**Future:** `productPictures: string[]` (array of URLs for carousel)

**Migration Plan:**
1. Dataverse column type change: `URL` → `Text`
2. Backend will store JSON stringified array
3. Frontend will receive array of URLs

**Example Future Response:**

```json
{
  "productPictures": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ]
}
```

---

## Support & Contact

For questions or issues with the Product API:

1. Check Swagger documentation: `http://localhost:3000/api`
2. Review error messages in response body
3. Contact backend team with:
   - Request payload
   - Response error
   - Server logs (if available)

---

**End of Product Frontend Integration Guide**

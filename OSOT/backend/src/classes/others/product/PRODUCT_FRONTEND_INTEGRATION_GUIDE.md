# Product Entity - Frontend Integration Guide

**Last Updated**: December 17, 2025  
**Version**: 2.0 (Refactored)  
**Status**: ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [New Fields Summary](#new-fields-summary)
3. [Available Endpoints](#available-endpoints)
4. [Field Specifications](#field-specifications)
5. [Business Rules](#business-rules)
6. [Validation Rules](#validation-rules)
7. [Query & Filtering](#query--filtering)
8. [Request/Response Examples](#requestresponse-examples)
9. [Error Handling](#error-handling)
10. [Use Cases](#use-cases)
11. [Migration Notes](#migration-notes)

---

## Overview

The **Product** entity has been refactored to include three new fields that enhance product management, member-exclusive offerings, and post-purchase communication capabilities.

### What's New in v2.0

- **Active Membership Restriction**: Products can now be restricted to active members only
- **Post-Purchase Information**: Customizable email content for purchase receipts
- **Product Year Tracking**: Administrative filtering by year for product organization

### Architecture Pattern

This entity follows **Clean Architecture** principles with 8 distinct layers:
- Interfaces (Internal & Dataverse)
- DTOs (Data Transfer Objects)
- Mappers (Data Transformation)
- Constants (OData, Validation, Business Rules)
- Validators (Custom & Class-Validator)
- Business Rules (Service Layer)
- Repository (Data Access)
- Controllers (Public & Private Routes)

---

## New Fields Summary

| Field Name | Type | Required | Max Length | Description |
|------------|------|----------|------------|-------------|
| `activeMembershipOnly` | `boolean` | No | N/A | Restricts product purchase to active members |
| `postPurchaseInfo` | `string` | No | 4000 chars | Plain text content for email receipts |
| `productYear` | `string` | **Yes** | 4 chars | Product year in YYYY format (e.g., "2025") |

### Backend Field Names (Dataverse)

```typescript
{
  activeMembershipOnly: 'osot_active_membership_only',
  postPurchaseInfo: 'osot_post_purchase_info',
  productYear: 'osot_product_year'
}
```

---

## Available Endpoints

### Public Endpoints (No Authentication Required)

#### `GET /public/products`
Fetch available products (status = Active, inventory > 0)

**Query Parameters**:
- `category?: number` - Filter by ProductCategory enum
- `skip?: number` - Pagination offset (default: 0)
- `top?: number` - Results per page (default: 10, max: 100)
- `orderBy?: string` - Sort field (default: 'name')

**Response**: Array of `ProductBasicDto`

```typescript
interface ProductBasicDto {
  id: string;
  productCode: string;
  name: string;
  category: number;
  categoryName: string;
  price: number;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  activeMembershipOnly: boolean;  // 🆕 NEW
  productYear: string;             // 🆕 NEW
}
```

---

#### `GET /public/products/:id`
Fetch single product details

**Response**: `ProductResponseDto` (full details)

---

### Private Endpoints (Admin Only - Requires Authentication)

#### `GET /private/products`
Fetch all products with advanced filtering

**Query Parameters**:
- `category?: number` - Filter by ProductCategory enum
- `status?: number` - Filter by ProductStatus enum
- `productYear?: string` - Filter by year (YYYY format) 🆕 **NEW**
- `skip?: number` - Pagination offset
- `top?: number` - Results per page
- `orderBy?: string` - Sort field (supports all product fields)

**Supported OrderBy Values**:
```typescript
'productCode' | 'name' | 'category' | 'status' | 'price' | 
'memberPrice' | 'inventory' | 'startDate' | 'endDate' | 
'activeMembershipOnly' | 'postPurchaseInfo' | 'productYear'  // 🆕 NEW
```

---

#### `POST /private/products`
Create new product

**Request Body**: `CreateProductDto`

```typescript
{
  productCode: string;              // Unique, max 50 chars
  name: string;                     // Required, max 255 chars
  category: number;                 // ProductCategory enum
  status: number;                   // ProductStatus enum
  description?: string;             // Max 2000 chars
  price: number;                    // Min 0
  memberPrice?: number;             // Min 0
  inventory?: number;               // Min 0
  glCode?: number;                  // ProductGLCode enum
  startDate?: Date;                 // ISO 8601 format
  endDate?: Date;                   // Must be after startDate
  activeMembershipOnly: boolean;    // 🆕 NEW - Default: false
  postPurchaseInfo?: string;        // 🆕 NEW - Max 4000 chars
  productYear: string;              // 🆕 NEW - Required, YYYY format
}
```

**Validation Example**:
```json
{
  "productCode": "MEMBERSHIP-2025-FULL",
  "name": "Full Membership 2025",
  "category": 1,
  "status": 1,
  "price": 450.00,
  "memberPrice": 400.00,
  "inventory": 100,
  "activeMembershipOnly": true,
  "postPurchaseInfo": "Thank you for your membership! Your card will arrive within 7-10 business days. Contact us at membership@example.com for questions.",
  "productYear": "2025"
}
```

---

#### `PATCH /private/products/:id`
Update existing product

**Request Body**: `UpdateProductDto` (all fields optional via PartialType)

---

#### `DELETE /private/products/:id`
Soft delete product (sets status to Inactive)

---

## Field Specifications

### 🆕 activeMembershipOnly (boolean)

**Purpose**: Restrict product purchases to users with active membership status

**Backend Validation**:
- Checked in `ProductBusinessRulesService.canPurchase()`
- Validates `isActiveMember` flag passed from frontend
- Returns error if member is not active

**Display Logic**:
```typescript
// Show badge for member-exclusive products
if (product.activeMembershipOnly) {
  return <Badge>Members Only</Badge>;
}
```

**Purchase Flow**:
```typescript
// Before allowing purchase, check:
const canPurchase = await checkPurchaseEligibility(productId, {
  isActiveMember: currentUser.activeMemberStatus
});

if (!canPurchase.allowed) {
  showError(canPurchase.reason); // "Produto exclusivo para membros ativos"
}
```

---

### 🆕 postPurchaseInfo (string, max 4000 chars)

**Purpose**: Provide customizable content for post-purchase email receipts

**Format**: Plain text (not HTML)

**Use Case**: 
- Confirmation details
- Next steps after purchase
- Contact information
- Delivery instructions
- Event logistics

**Display**:
```typescript
// Show in confirmation modal after purchase
<ConfirmationModal>
  <h2>Purchase Successful!</h2>
  <p>{product.postPurchaseInfo}</p>
</ConfirmationModal>
```

**Example Content**:
```
"Conference confirmation email with venue details will be sent 48 hours 
before the event. Please check your spam folder if you don't receive it. 
For questions, contact events@osot.on.ca or call (416) 555-0123."
```

**Validation**:
- ✅ Optional field
- ✅ Max 4000 characters
- ✅ Plain text only (no HTML)
- ✅ Whitespace preserved

---

### 🆕 productYear (string, required, YYYY format)

**Purpose**: Administrative tracking and filtering of products by year

**Format**: Exactly 4 digits (e.g., "2025", "2026")

**Validation Regex**: `/^\d{4}$/`

**Important Notes**:
- ⚠️ **Required field** for all new products
- ⚠️ **Not related to startDate/endDate** - this is purely administrative
- ✅ Used for filtering products by year in admin panel
- ✅ Helps organize products across multiple years

**Admin Filtering Example**:
```typescript
// Fetch all products for 2025
const products = await fetch('/private/products?productYear=2025');

// Fetch all membership products for 2025
const memberships = await fetch('/private/products?category=1&productYear=2025');
```

**Dropdown Options**:
```typescript
// Generate year options for form
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear + i - 2),
  label: String(currentYear + i - 2)
}));
// Result: ["2023", "2024", "2025", "2026", "2027"]
```

---

## Business Rules

### Active Membership Validation

**Rule**: If `activeMembershipOnly === true`, only active members can purchase

**Implementation**:
```typescript
// Service: ProductBusinessRulesService.canPurchase()

interface PurchaseEligibilityCheck {
  productId: string;
  isActiveMember?: boolean;  // Pass from frontend
}

// Backend validates:
if (product.osot_active_membership_only === true) {
  if (!isActiveMember) {
    return {
      canPurchase: false,
      reason: "Produto exclusivo para membros ativos"
    };
  }
}
```

**Frontend Implementation**:
```typescript
// 1. Check membership status before showing purchase button
const user = useAuth();
const canPurchase = !product.activeMembershipOnly || user.isActiveMember;

// 2. Show appropriate UI
{!canPurchase && (
  <Alert severity="warning">
    This product is exclusive to active members. 
    <Link to="/membership">Renew your membership</Link>
  </Alert>
)}

// 3. Validate on purchase attempt
const handlePurchase = async () => {
  try {
    await purchaseProduct(product.id, {
      isActiveMember: user.isActiveMember
    });
  } catch (error) {
    if (error.code === 'NOT_ACTIVE_MEMBER') {
      showMembershipUpgradeModal();
    }
  }
};
```

---

### Product Year Validation

**Rule**: Product year must be exactly 4 digits (YYYY format)

**Valid Examples**: `"2025"`, `"2026"`, `"2030"`  
**Invalid Examples**: `"25"`, `"20250"`, `"202"`, `"abcd"`

**Error Message**: `"Product year must be a 4-digit year (YYYY)"`

---

## Validation Rules

### Field-Level Validations

```typescript
// CreateProductDto Decorators

@IsBoolean()
@IsOptional()
activeMembershipOnly?: boolean;  // Default: false

@IsString()
@MaxLength(4000)
@IsOptional()
postPurchaseInfo?: string;

@IsString()
@Matches(/^\d{4}$/, {
  message: 'Product year must be a 4-digit year (YYYY)'
})
productYear: string;  // Required
```

### Cross-Field Validations

**Date Validation**:
- `endDate` must be after `startDate` (if both provided)
- Validator: `IsEndDateAfterStartDateValidator`

**Price Validation**:
- At least one price must be provided (price or memberPrice)
- Validator: `AtLeastOnePriceValidator`
- Both prices must be available when status is Active

**Inventory Validation**:
- Inventory must be > 0 when status is Active
- Validator: `IsInventoryValidForStatusValidator`

**Status Transition Validation**:
- Certain status transitions are restricted
- Validator: `IsValidStatusTransitionValidator`

---

## Query & Filtering

### Public Products List

```typescript
// Basic fetch - active products only
GET /public/products

// Filter by category
GET /public/products?category=1  // Memberships

// Pagination
GET /public/products?skip=0&top=20

// Sort by price
GET /public/products?orderBy=price

// Combined filters
GET /public/products?category=2&orderBy=startDate&top=10
```

---

### Admin Products List (with productYear)

```typescript
// All products for 2025
GET /private/products?productYear=2025

// Active memberships for 2025
GET /private/products?category=1&status=1&productYear=2025

// Inactive products from 2024
GET /private/products?status=2&productYear=2024

// Sort by product year
GET /private/products?orderBy=productYear

// Combined with pagination
GET /private/products?productYear=2025&skip=0&top=50&orderBy=name
```

---

## Request/Response Examples

### Example 1: Create Member-Exclusive Product

**Request**: `POST /private/products`

```json
{
  "productCode": "MEMBERSHIP-2025-FULL",
  "name": "Full Membership 2025",
  "category": 1,
  "status": 1,
  "description": "Full annual membership with all benefits",
  "price": 450.00,
  "memberPrice": 400.00,
  "inventory": 500,
  "glCode": 100,
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-12-31T23:59:59Z",
  "activeMembershipOnly": true,
  "postPurchaseInfo": "Thank you for renewing your membership! Your membership card will arrive within 7-10 business days. You'll receive a separate email with your digital membership certificate and access instructions for the member portal.",
  "productYear": "2025"
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "abc123-def456-ghi789",
    "productCode": "MEMBERSHIP-2025-FULL",
    "name": "Full Membership 2025",
    "category": 1,
    "categoryName": "Membership",
    "status": 1,
    "statusName": "Active",
    "description": "Full annual membership with all benefits",
    "price": 450.00,
    "memberPrice": 400.00,
    "inventory": 500,
    "glCode": 100,
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.000Z",
    "activeMembershipOnly": true,
    "postPurchaseInfo": "Thank you for renewing your membership! Your membership card will arrive within 7-10 business days. You'll receive a separate email with your digital membership certificate and access instructions for the member portal.",
    "productYear": "2025",
    "createdAt": "2025-12-17T10:30:00.000Z",
    "modifiedAt": "2025-12-17T10:30:00.000Z"
  }
}
```

---

### Example 2: Create Public Event Product

**Request**: `POST /private/products`

```json
{
  "productCode": "CONF-2025-SPRING",
  "name": "Spring Conference 2025",
  "category": 2,
  "status": 1,
  "description": "Annual spring conference with workshops and networking",
  "price": 350.00,
  "memberPrice": 275.00,
  "inventory": 150,
  "startDate": "2025-04-15T09:00:00Z",
  "endDate": "2025-04-17T17:00:00Z",
  "activeMembershipOnly": false,
  "postPurchaseInfo": "Conference confirmation email with venue details and schedule will be sent 48 hours before the event. Hotel accommodation information and parking details are available on our website. For questions, contact events@osot.on.ca or call (416) 555-0123.",
  "productYear": "2025"
}
```

---

### Example 3: Update Product Year

**Request**: `PATCH /private/products/:id`

```json
{
  "productYear": "2026"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "abc123-def456-ghi789",
    "productYear": "2026",
    "modifiedAt": "2025-12-17T11:00:00.000Z"
    // ... other fields unchanged
  }
}
```

---

### Example 4: Fetch Products by Year

**Request**: `GET /private/products?productYear=2025&orderBy=name`

**Response**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "prod-001",
      "name": "Associate Membership 2025",
      "productYear": "2025",
      "activeMembershipOnly": false
      // ... other fields
    },
    {
      "id": "prod-002",
      "name": "Full Membership 2025",
      "productYear": "2025",
      "activeMembershipOnly": true
      // ... other fields
    },
    {
      "id": "prod-003",
      "name": "Spring Conference 2025",
      "productYear": "2025",
      "activeMembershipOnly": false
      // ... other fields
    }
  ],
  "pagination": {
    "skip": 0,
    "top": 10,
    "total": 3
  }
}
```

---

## Error Handling

### Validation Errors

**HTTP 400 - Bad Request**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "productYear",
        "message": "Product year must be a 4-digit year (YYYY)"
      },
      {
        "field": "postPurchaseInfo",
        "message": "Post purchase info must be at most 4000 characters"
      }
    ]
  }
}
```

---

### Business Rule Errors

**HTTP 403 - Forbidden (Purchase Attempt)**

```json
{
  "success": false,
  "error": {
    "code": "NOT_ACTIVE_MEMBER",
    "message": "Produto exclusivo para membros ativos",
    "details": {
      "productId": "abc123-def456-ghi789",
      "activeMembershipRequired": true,
      "userActiveMemberStatus": false
    }
  }
}
```

**Frontend Handling**:
```typescript
try {
  await purchaseProduct(productId, { isActiveMember });
} catch (error) {
  if (error.code === 'NOT_ACTIVE_MEMBER') {
    showDialog({
      title: 'Membership Required',
      message: 'This product is exclusive to active members.',
      actions: [
        { label: 'View Memberships', action: () => navigate('/membership') },
        { label: 'Cancel', action: () => closeDialog() }
      ]
    });
  }
}
```

---

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `PRODUCT_NOT_FOUND` | 404 | Product ID does not exist |
| `INVALID_PRODUCT_YEAR` | 400 | Product year format invalid |
| `NOT_ACTIVE_MEMBER` | 403 | User not eligible for member-only product |
| `PRODUCT_CODE_EXISTS` | 409 | Product code already in use |
| `INVALID_STATUS_TRANSITION` | 400 | Status change not allowed |
| `INSUFFICIENT_INVENTORY` | 400 | Not enough inventory available |

---

## Use Cases

### Use Case 1: Member-Exclusive Membership Renewal

**Scenario**: Existing members renewing their annual membership

**Implementation**:
```typescript
// Product Configuration
{
  name: "Full Membership 2025 Renewal",
  activeMembershipOnly: true,  // Only for existing members
  postPurchaseInfo: "Your membership has been renewed! New card shipping soon.",
  productYear: "2025"
}

// Frontend Purchase Flow
const renewMembership = async () => {
  // 1. Check eligibility
  if (!user.isActiveMember) {
    showError("This renewal is for existing members only");
    return;
  }
  
  // 2. Show product details including post-purchase info
  showProductModal(product);
  
  // 3. Process purchase
  await purchaseProduct(product.id, { isActiveMember: true });
  
  // 4. Show confirmation with post-purchase info
  showConfirmation(product.postPurchaseInfo);
};
```

---

### Use Case 2: Public Conference Registration

**Scenario**: Anyone can register for a conference, members get discount

**Implementation**:
```typescript
// Product Configuration
{
  name: "Annual Conference 2025",
  price: 500.00,
  memberPrice: 400.00,
  activeMembershipOnly: false,  // Open to everyone
  postPurchaseInfo: "Conference details will be emailed 2 weeks before event...",
  productYear: "2025"
}

// Frontend Display
<ProductCard>
  <h3>{product.name}</h3>
  <PriceDisplay>
    {user.isActiveMember ? (
      <>
        <s>${product.price}</s> ${product.memberPrice} (Member Price)
      </>
    ) : (
      <>${product.price}</>
    )}
  </PriceDisplay>
  <button onClick={() => purchase(product)}>Register Now</button>
</ProductCard>
```

---

### Use Case 3: Admin Year-End Product Archival

**Scenario**: Admin reviews and archives products from previous years

**Implementation**:
```typescript
// 1. Fetch all products from 2024
const products2024 = await fetch('/private/products?productYear=2024');

// 2. Filter expired products
const expiredProducts = products2024.filter(p => 
  new Date(p.endDate) < new Date()
);

// 3. Bulk update status to Inactive
await Promise.all(
  expiredProducts.map(p => 
    updateProduct(p.id, { status: ProductStatus.Inactive })
  )
);

// 4. Generate report
generateYearEndReport(products2024);
```

---

### Use Case 4: Multi-Year Product Filtering

**Scenario**: Admin dashboard showing products across different years

**Implementation**:
```typescript
// Year selector component
const [selectedYear, setSelectedYear] = useState('2025');
const [products, setProducts] = useState([]);

useEffect(() => {
  const fetchProducts = async () => {
    const response = await fetch(
      `/private/products?productYear=${selectedYear}&orderBy=name`
    );
    setProducts(response.data);
  };
  fetchProducts();
}, [selectedYear]);

// UI
<YearSelector value={selectedYear} onChange={setSelectedYear} />
<ProductTable products={products} />
```

---

## Migration Notes

### For Existing Frontend Code

#### 1. Update Product Interface/Type

```typescript
// OLD
interface Product {
  id: string;
  name: string;
  // ... other fields
}

// NEW - Add these fields
interface Product {
  id: string;
  name: string;
  // ... other fields
  activeMembershipOnly: boolean;  // 🆕
  postPurchaseInfo?: string;       // 🆕
  productYear: string;             // 🆕
}
```

---

#### 2. Update Create/Edit Forms

```typescript
// Add to product form schema
const productSchema = yup.object({
  // ... existing fields
  
  activeMembershipOnly: yup
    .boolean()
    .default(false),
  
  postPurchaseInfo: yup
    .string()
    .max(4000, 'Maximum 4000 characters')
    .optional(),
  
  productYear: yup
    .string()
    .matches(/^\d{4}$/, 'Must be a 4-digit year (YYYY)')
    .required('Product year is required'),
});
```

**Form Fields**:
```tsx
<FormCheckbox
  name="activeMembershipOnly"
  label="Restrict to Active Members Only"
  helperText="Only users with active membership can purchase"
/>

<FormTextArea
  name="postPurchaseInfo"
  label="Post-Purchase Information"
  placeholder="Message to show after purchase..."
  maxLength={4000}
  rows={6}
  helperText="Plain text content for email receipts (max 4000 chars)"
/>

<FormSelect
  name="productYear"
  label="Product Year"
  required
  options={generateYearOptions()}
  helperText="Administrative year for filtering"
/>
```

---

#### 3. Update Purchase Flow

```typescript
// Before purchase, check active membership requirement
const handlePurchase = async (product: Product) => {
  // Check if product requires active membership
  if (product.activeMembershipOnly && !currentUser.isActiveMember) {
    showMembershipRequiredDialog();
    return;
  }
  
  try {
    // Include membership status in purchase request
    await purchaseProduct(product.id, {
      isActiveMember: currentUser.isActiveMember
    });
    
    // Show post-purchase info if available
    if (product.postPurchaseInfo) {
      showConfirmationWithInfo(product.postPurchaseInfo);
    }
  } catch (error) {
    handlePurchaseError(error);
  }
};
```

---

#### 4. Update Admin Filters

```tsx
// Add year filter to admin product list
<ProductFilters>
  <CategoryFilter />
  <StatusFilter />
  <YearFilter />  {/* 🆕 NEW */}
</ProductFilters>

// Implementation
const YearFilter = () => {
  const [year, setYear] = useState<string>('');
  
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => 
      String(currentYear - i)
    );
  }, []);
  
  return (
    <Select
      label="Product Year"
      value={year}
      onChange={(e) => setYear(e.target.value)}
      options={[
        { value: '', label: 'All Years' },
        ...years.map(y => ({ value: y, label: y }))
      ]}
    />
  );
};
```

---

#### 5. Display Product Year in Lists

```tsx
// Admin product table columns
const columns = [
  { field: 'productCode', headerName: 'Code' },
  { field: 'name', headerName: 'Name' },
  { field: 'category', headerName: 'Category' },
  { field: 'productYear', headerName: 'Year' },  // 🆕 NEW
  { field: 'status', headerName: 'Status' },
  // ... other columns
];
```

---

### Backward Compatibility

**Existing Products** (created before refactoring):
- `activeMembershipOnly` defaults to `false` → No purchase restrictions
- `postPurchaseInfo` is `null` → No additional email content
- `productYear` **must be set** during migration → Run migration script

**Migration Script** (Backend):
```sql
-- Set default productYear for existing products
UPDATE Table_Products
SET osot_product_year = YEAR(osot_start_date)
WHERE osot_product_year IS NULL AND osot_start_date IS NOT NULL;

-- For products without startDate, use current year
UPDATE Table_Products
SET osot_product_year = '2025'
WHERE osot_product_year IS NULL;
```

---

## Testing Checklist

### Frontend Testing

- [ ] Product list displays new fields correctly
- [ ] Create form includes all 3 new fields with validation
- [ ] Edit form allows updating new fields
- [ ] Product year filter works in admin panel
- [ ] Member-exclusive badge shows on restricted products
- [ ] Non-members cannot purchase member-only products
- [ ] Post-purchase info displays after successful purchase
- [ ] Year selector generates correct year options
- [ ] Form validation prevents invalid year formats (e.g., "25", "202")
- [ ] Post-purchase info respects 4000 character limit
- [ ] Error messages display correctly for business rule violations

### Integration Testing

- [ ] Public endpoints don't expose member-only products to non-members
- [ ] Private endpoints return all products with new fields
- [ ] Filtering by productYear returns correct results
- [ ] Sorting by new fields works correctly
- [ ] Purchase validation checks active membership status
- [ ] Error responses include appropriate error codes

---

## Support & Questions

**Backend Implementation**: See folder structure for detailed implementation
- Constants: `/constants/product-*.constant.ts`
- Validators: `/validators/*.validator.ts`
- Business Rules: `/services/product-business-rules.service.ts`
- Repositories: `/repositories/dataverse-product.repository.ts`

**Related Documentation**:
- `FRONTEND_INTEGRATION_GUIDE.md` - General frontend integration patterns
- `ERROR_HANDLING_FRONTEND_GUIDE.md` - Error handling best practices
- `PRIVATE_ROUTES_CONSUMPTION_GUIDE.md` - Authentication & authorization

**Enum Values**: `/public/enums/product-*` endpoints for dropdown options

---

**Document Version**: 2.0  
**Last Reviewed**: December 17, 2025  
**Next Review**: March 2026

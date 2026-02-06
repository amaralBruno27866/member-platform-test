# Product CRUD Integration Guide

**Complete guide for consuming the Product API with focus on CRUD operations and orchestrator workflows.**

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Product Entity Structure](#product-entity-structure)
4. [Enums & Constants](#enums--constants)
5. [CREATE - Product Creation Flow](#create---product-creation-flow)
6. [READ - Fetch Products](#read---fetch-products)
7. [UPDATE - Modify Products](#update---modify-products)
8. [DELETE - Remove Products](#delete---remove-products)
9. [Error Handling](#error-handling)
10. [Complete Examples](#complete-examples)

---

## Overview

The Product API provides full CRUD operations for managing products in the OSOT platform. Products can be created through two flows:

1. **Standard Create** - Direct creation with auto-generated audience target
2. **Orchestrator Create** - Multi-step workflow for complex product setup with audience targeting

### Key Concepts

- **Product GUID** (`osot_table_productid`) - Internal Dataverse identifier
- **Product ID** (`osot-prod-0000001`) - User-friendly sequential identifier
- **Privilege Levels**:
  - `ADMIN` (2) - Can CREATE, UPDATE, SOFT DELETE
  - `MAIN` (3) - Can CREATE, UPDATE, DELETE (all types), SOFT DELETE
  - `OWNER` (3) - Required for HARD DELETE only

---

## Authentication

All endpoints require a **Bearer JWT token** in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

JWT payload must include:
```json
{
  "userId": "osot-0000239",
  "userGuid": "448bfe5c-66f5-f011-8407-7ced8d663058",
  "privilege": 3,
  "userType": "account",
  "organizationId": "encrypted_org_guid"
}
```

---

## Product Entity Structure

### Product Response DTO

```typescript
{
  // Identifiers
  osot_table_productid: "d5763f3c-0cf6-f011-8406-7c1e5254ad6e",  // GUID
  osot_productid: "osot-prod-0000044",                           // Sequential ID
  osot_product_code: "WT-SHIRT-2025",                            // Unique code

  // Basic Information
  osot_product_name: "OSOT T-Shirt White",
  osot_product_description: "Professional development t-shirt",
  osot_product_category: 1,                                      // ProductCategory enum
  osot_product_picture: "https://example.com/image.jpg",

  // Control Fields
  osot_product_status: 1,                                        // ProductStatus enum
  osot_product_gl_code: 16,                                      // ProductGLCode enum
  osot_privilege: 1,                                             // ProductUserType enum
  osot_access_modifiers: 1,                                      // AccessModifier enum

  // Pricing (16 fields)
  osot_general_price: 19.99,
  osot_otstu_price: null,
  osot_otng_price: null,
  osot_otpr_price: null,
  osot_otnp_price: null,
  osot_otret_price: null,
  osot_otlife_price: null,
  osot_otastu_price: null,
  osot_otang_price: null,
  osot_otanp_price: null,
  osot_otaret_price: null,
  osot_otapr_price: null,
  osot_otalife_price: null,
  osot_assoc_price: null,
  osot_affprim_price: null,
  osot_affprem_price: null,

  // Logistics
  osot_inventory: 25,
  osot_shipping: 2.45,
  osot_taxes: 13,

  // Dates
  osot_start_date: null,
  osot_end_date: null,

  // Flags
  osot_active_membership_only: false,
  osot_post_purchase_info: null,
  osot_product_year: "2025",

  // Metadata
  createdon: "2026-01-20T14:28:07Z",
  modifiedon: "2026-01-20T14:28:07Z"
}
```

---

## Enums & Constants

### ProductCategory

| Value | Name | Description |
|-------|------|-------------|
| 0 | GENERAL | General products |
| 1 | INSURANCE | Insurance products |
| 2 | MEMBERSHIP | Membership products |

**IMPORTANT**: When updating, always send the **numeric value** (0, 1, or 2), not the enum name.

### ProductStatus

| Value | Name | Description |
|-------|------|-------------|
| 0 | DRAFT | Not yet available |
| 1 | AVAILABLE | Ready for purchase |
| 2 | DISCONTINUED | No longer available |

### ProductGLCode

| Value | Name | Description |
|-------|------|-------------|
| 10 | MEMBERSHIP_FEE_4100 | Membership revenue account |
| 15 | PRODUCT_SALES_4200 | Product sales account |
| 16 | WORKSHOP_REVENUE_4300 | Workshop/service revenue |
| ... | ... | See enum for all values |

### AccessModifier

| Value | Name | Description |
|-------|------|-------------|
| 0 | NONE | No access modifiers |
| 1 | MEMBER_ONLY | Members only |
| 2 | ADMIN_ONLY | Admin access |
| 3 | PUBLIC | Public access |

### ProductUserType (osot_privilege)

| Value | Name | Applies To |
|-------|------|-----------|
| 1 | OT_OTA | OT/OTA professionals |
| 2 | AFFILIATE | Affiliate members |
| 3 | BOTH | All user types |

---

## CREATE - Product Creation Flow

### Option 1: Direct Create (Simple)

**Endpoint**: `POST /private/products`

**Use Case**: Quick product creation with auto-generated default audience target

**Request Body**:

```json
{
  "productName": "OSOT T-Shirt White",
  "productCode": "WT-SHIRT-2025",
  "productDescription": "Professional development t-shirt",
  "productCategory": 0,
  "productStatus": 1,
  "productGlCode": 16,
  "productPicture": "https://example.com/image.jpg",
  "privilege": 3,
  "accessModifiers": 1,
  "generalPrice": 19.99,
  "inventory": 25,
  "taxes": 13,
  "shipping": 2.45,
  "productYear": "2025"
}
```

**Response** (201 Created):

```json
{
  "data": {
    "osot_table_productid": "d5763f3c-0cf6-f011-8406-7c1e5254ad6e",
    "osot_productid": "osot-prod-0000044",
    "osot_product_code": "WT-SHIRT-2025",
    ...
  },
  "message": "Product created successfully"
}
```

**Notes**:
- Audience target is auto-created with ALL fields null (open to all users)
- If audience target creation fails, product is rolled back
- Inventory is validated based on product status

---

### Option 2: Orchestrator Create (Complex - Recommended for Strategic Products)

**Use Case**: Create products with specific audience targeting rules

#### Step 1: Create Session

**Endpoint**: `POST /private/products/orchestrate/session/create`

```json
{}
```

**Response** (201 Created):

```json
{
  "sessionId": "b6afd72b-b07f-4f1c-a155-338190fbcb21",
  "state": "initiated",
  "expiresAt": "2026-01-20T16:28:06.276Z",
  "message": "Product orchestrator session created"
}
```

**Session TTL**: 2 hours (7200 seconds)

---

#### Step 2: Add Product Data

**Endpoint**: `POST /private/products/orchestrate/session/{sessionId}/product`

```json
{
  "productName": "OSOT T-Shirt White",
  "productCode": "WT-SHIRT-2025",
  "productDescription": "Professional development t-shirt",
  "productCategory": 0,
  "productStatus": 1,
  "productGlCode": 16,
  "productPicture": "https://example.com/image.jpg",
  "privilege": 3,
  "accessModifiers": 1,
  "generalPrice": 19.99,
  "inventory": 25,
  "taxes": 13,
  "shipping": 2.45,
  "productYear": "2025"
}
```

**Response** (200 OK):

```json
{
  "sessionId": "b6afd72b-b07f-4f1c-a155-338190fbcb21",
  "state": "product-added",
  "product": {
    "productName": "OSOT T-Shirt White",
    "productCode": "WT-SHIRT-2025",
    ...
  },
  "message": "Product data added to session"
}
```

**Validations**:
- Product code uniqueness checked
- All required fields validated
- At least one price required

---

#### Step 3: Configure Audience Target (Optional)

**Endpoint**: `POST /private/products/orchestrate/session/{sessionId}/audience-target`

```json
{
  "osot_account_group": [1, 2],
  "osot_gender": "Male",
  "osot_language": "English",
  "osot_province": "Ontario",
  "osot_membership_category": 1
}
```

**Available Targeting Fields** (32 total):

```
// Group & Location
osot_account_group (array)
osot_affiliate_area
osot_affiliate_city
osot_affiliate_province
osot_membership_city
osot_province

// Demographics
osot_gender
osot_language
osot_race
osot_indigenous_details

// Professional Status
osot_employment_status
osot_employment_benefits
osot_position_funding
osot_practice_years
osot_role_description
osot_work_hours

// Membership
osot_membership_category
osot_coto_status
osot_eligibility_affiliate

// Practice Details
osot_practice_area
osot_practice_services
osot_practice_settings
osot_client_age

// Advanced Features
osot_earnings
osot_earnings_selfdirect
osot_earnings_selfindirect
osot_membership_search_tools
osot_practice_promotion
osot_psychotherapy_supervision
osot_third_parties

// Education
osot_ot_grad_year
osot_ot_university
osot_ota_grad_year
osot_ota_college
```

**Response** (200 OK):

```json
{
  "sessionId": "b6afd72b-b07f-4f1c-a155-338190fbcb21",
  "state": "target-configured",
  "audienceTarget": {
    "osot_account_group": [1, 2],
    "osot_gender": "Male"
  },
  "message": "Target configuration added"
}
```

**Notes**:
- All fields are optional (null = no filtering on that field)
- Multiple values in arrays = OR logic
- If no target configured, defaults to open-to-all

---

#### Step 4: Commit Session

**Endpoint**: `POST /private/products/orchestrate/session/{sessionId}/commit`

```json
{}
```

**Response** (200 OK):

```json
{
  "productGuid": "d5763f3c-0cf6-f011-8406-7c1e5254ad6e",
  "targetGuid": "d7763f3c-0cf6-f011-8406-7c1e5254ad6e",
  "productCode": "WT-SHIRT-2025",
  "message": "Session committed successfully"
}
```

**What Happens**:
1. Product created in Dataverse
2. Audience target created with configured rules
3. Cache invalidated
4. Session deleted from Redis
5. Events emitted for audit trail

**Error Handling**:
- If product creation fails → Rollback, throw error
- If target creation fails (after 3 retries) → Product rolled back
- If commit fails → Session remains in Redis for retry

---

## READ - Fetch Products

### List All Products

**Endpoint**: `GET /private/products?page=1&limit=20`

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page |
| category | number | - | Filter by ProductCategory |
| status | number | - | Filter by ProductStatus |
| search | string | - | Search by name/code |
| sortBy | string | name | Sort field (name, price, created) |
| sortOrder | asc\|desc | asc | Sort order |

**Response** (200 OK):

```json
{
  "data": [
    {
      "osot_table_productid": "d5763f3c-0cf6-f011-8406-7c1e5254ad6e",
      "osot_productid": "osot-prod-0000044",
      "osot_product_name": "OSOT T-Shirt White",
      "osot_product_category": 0,
      "osot_product_status": 1,
      "osot_general_price": 19.99,
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

**Admin View**: Includes DRAFT and DISCONTINUED products

---

### Get Single Product

**Endpoint**: `GET /private/products/:id`

**URL Parameters**:
- `:id` - Product GUID (`d5763f3c-0cf6-f011-8406-7c1e5254ad6e`) or ID (`osot-prod-0000044`)

**Response** (200 OK):

```json
{
  "data": {
    "osot_table_productid": "d5763f3c-0cf6-f011-8406-7c1e5254ad6e",
    "osot_productid": "osot-prod-0000044",
    ...
  }
}
```

---

## UPDATE - Modify Products

**Endpoint**: `PATCH /private/products/:id`

**URL Parameters**:
- `:id` - Product GUID or ID

**CRITICAL**: Send ONLY the fields you want to update, with their NEW values.

### Example: Update Category

❌ **WRONG** - Sending old value:
```json
{
  "productCategory": 1
}
```

✅ **CORRECT** - Send the new value:
```json
{
  "productCategory": 0
}
```

### Example: Update Multiple Fields

```json
{
  "productName": "OSOT Premium T-Shirt",
  "productCategory": 0,
  "generalPrice": 24.99,
  "inventory": 50
}
```

**Response** (200 OK):

```json
{
  "data": {
    "osot_table_productid": "d5763f3c-0cf6-f011-8406-7c1e5254ad6e",
    "osot_product_name": "OSOT Premium T-Shirt",
    "osot_product_category": 0,
    "osot_general_price": 24.99,
    "osot_inventory": 50,
    ...
  },
  "message": "Product updated successfully"
}
```

**Restrictions**:
- Cannot change `osot_product_code` (immutable)
- Cannot change `osot_table_productid` (system field)
- Product code uniqueness validated if provided
- Inventory validated against status rules

**Validations**:
- At least one price must remain set
- End date must be after start date (if both provided)
- Status transitions must be valid

---

## DELETE - Remove Products

### Soft Delete (Recommended)

**Endpoint**: `DELETE /private/products/:id`

**Effect**: Sets product status to DISCONTINUED (code: 2)

**Response** (200 OK):

```json
{
  "message": "Product soft deleted successfully"
}
```

**Pros**:
- Preserves audit trail
- Data not actually removed
- Can be restored by changing status back to AVAILABLE

**Requires**: ADMIN or MAIN privilege

---

### Hard Delete (Permanent)

**Endpoint**: `DELETE /private/products/:id/permanent`

**Effect**: Completely removes product from database (including related audience targets)

**Response** (200 OK):

```json
{
  "message": "Product permanently deleted successfully"
}
```

**Cons**:
- Destroys data permanently
- No audit trail recovery
- Breaks references in orders/invoices

**Requires**: MAIN privilege only (most restrictive)

---

## Error Handling

### HTTP Status Codes

| Code | Scenario | Example |
|------|----------|---------|
| 200 | Success | Product fetched/updated |
| 201 | Created | Product created successfully |
| 400 | Validation error | Invalid enum value |
| 403 | Permission denied | Admin required |
| 404 | Not found | Product ID doesn't exist |
| 409 | Conflict | Product code already exists |
| 500 | Server error | Dataverse connection failed |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": {
    "productCode": "must be uppercase alphanumeric",
    "generalPrice": "must be greater than 0"
  }
}
```

### Common Validation Errors

```json
// Product code validation
{
  "error": "Product code must contain only uppercase letters, numbers, hyphens, and underscores"
}

// Enum validation
{
  "error": "productCategory must be a valid ProductCategory enum value (0, 1, or 2)"
}

// Uniqueness violation
{
  "message": "Product code WT-SHIRT-2025 already exists"
}

// Inventory validation
{
  "error": "Inventory must be at least 1 when status is AVAILABLE"
}

// At least one price
{
  "error": "At least one price field must be set"
}
```

---

## Complete Examples

### Example 1: Create Product (Simple)

```bash
curl -X POST http://localhost:3000/private/products \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "OSOT Workshop 2025",
    "productCode": "WORKSHOP-2025",
    "productDescription": "Annual professional development workshop",
    "productCategory": 0,
    "productStatus": 1,
    "productGlCode": 16,
    "privilege": 3,
    "accessModifiers": 1,
    "generalPrice": 149.99,
    "inventory": 100,
    "taxes": 20,
    "shipping": 5.00,
    "productYear": "2025"
  }'
```

---

### Example 2: Create Product (Orchestrator)

```bash
# Step 1: Create session
SESSION=$(curl -s -X POST http://localhost:3000/private/products/orchestrate/session/create \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.sessionId')

echo "Session ID: $SESSION"

# Step 2: Add product data
curl -s -X POST http://localhost:3000/private/products/orchestrate/session/$SESSION/product \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "OSOT Workshop 2025",
    "productCode": "WORKSHOP-2025",
    "productDescription": "Annual professional development workshop",
    "productCategory": 0,
    "productStatus": 1,
    "productGlCode": 16,
    "privilege": 3,
    "accessModifiers": 1,
    "generalPrice": 149.99,
    "inventory": 100,
    "taxes": 20,
    "shipping": 5.00,
    "productYear": "2025"
  }'

# Step 3: Configure audience (OT professionals only)
curl -s -X POST http://localhost:3000/private/products/orchestrate/session/$SESSION/audience-target \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "osot_practice_area": "Mental Health"
  }'

# Step 4: Commit
curl -s -X POST http://localhost:3000/private/products/orchestrate/session/$SESSION/commit \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

---

### Example 3: Update Product Category

❌ **WRONG** - Will not update because sending old value:

```bash
curl -X PATCH http://localhost:3000/private/products/d5763f3c-0cf6-f011-8406-7c1e5254ad6e \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productCategory": 1
  }'
```

✅ **CORRECT** - Change to General (0):

```bash
curl -X PATCH http://localhost:3000/private/products/d5763f3c-0cf6-f011-8406-7c1e5254ad6e \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productCategory": 0
  }'
```

---

### Example 4: List Products with Filters

```bash
# Get page 2, 50 items per page, filtered by category
curl "http://localhost:3000/private/products?page=2&limit=50&category=0" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Search for products with "T-Shirt" in name
curl "http://localhost:3000/private/products?search=T-Shirt&sortBy=price&sortOrder=asc" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### Example 5: Soft Delete Product

```bash
curl -X DELETE http://localhost:3000/private/products/d5763f3c-0cf6-f011-8406-7c1e5254ad6e \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Response: Product status changed to DISCONTINUED (2)

---

### Example 6: Hard Delete Product (Owner Only)

```bash
curl -X DELETE http://localhost:3000/private/products/d5763f3c-0cf6-f011-8406-7c1e5254ad6e/permanent \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Response: Product completely removed from database

---

## Best Practices

### 1. Always Handle Errors

```typescript
try {
  const response = await fetch(`/private/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ productCategory: 0 })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Update failed:', error.message);
    // Handle specific error codes
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### 2. Validate Enum Values Before Sending

```typescript
const PRODUCT_CATEGORIES = {
  GENERAL: 0,
  INSURANCE: 1,
  MEMBERSHIP: 2
};

// Send the numeric value
const updateData = {
  productCategory: PRODUCT_CATEGORIES.GENERAL
};
```

### 3. Use Orchestrator for Complex Products

Use the orchestrator when:
- Product requires specific audience targeting
- Product setup involves multiple stakeholders
- Product needs approval/review workflow (future)
- Product launch is strategic

Use simple create when:
- Quick product addition
- Default audience (open-to-all) is acceptable
- Simple product with no complex rules

### 4. Cache Product List

```typescript
// Cache response for 5 minutes
const cacheKey = `products:list:page:1`;
const cached = sessionStorage.getItem(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const response = await fetch('/private/products?page=1&limit=20');
const data = await response.json();
sessionStorage.setItem(cacheKey, JSON.stringify(data), 300000);
```

### 5. Invalidate Cache on Mutations

```typescript
// After create, update, or delete
const invalidateCache = () => {
  // Clear specific product
  sessionStorage.removeItem(`product:${productId}`);
  
  // Clear all product lists
  Array.from(sessionStorage.keys())
    .filter(key => key.startsWith('products:list:'))
    .forEach(key => sessionStorage.removeItem(key));
};
```

---

## Troubleshooting

### Product Update Not Reflecting

**Problem**: Sent update but value didn't change

**Cause**: Likely sending the OLD value instead of NEW value

**Solution**:
```typescript
// WRONG
{ productCategory: 1 }  // Value already in DB

// RIGHT
{ productCategory: 0 }  // New value different from current
```

**Debugging**:
1. Check backend logs for received DTO
2. Verify enum mapping (frontend to backend)
3. Ensure form captures new value before submit
4. Test with curl to isolate frontend vs backend issue

### Orchestrator Session Expires

**Problem**: Got 404 when committing session

**Cause**: Session TTL is 2 hours - expired or wrong sessionId

**Solution**:
1. Check session creation timestamp
2. Verify sessionId in URL matches creation response
3. Don't store sessionId in localStorage - use immediately
4. Implement session timeout UI warning at 1.5 hours

### Permission Denied

**Problem**: Got 403 error on create/update

**Cause**: User privilege insufficient or JWT token expired

**Solution**:
1. Check `privilege` value in JWT (must be 2 or 3)
2. Verify token not expired
3. For hard delete, privilege must be exactly 3 (MAIN)
4. Refresh token and retry

---

## Rate Limiting

- **Public endpoints**: 100 req/min per IP
- **Authenticated endpoints**: 500 req/min per user
- **Dataverse calls**: Limited to ~100 req/sec globally

If rate limited (429), retry with exponential backoff:
```typescript
const MAX_RETRIES = 3;
const BACKOFF = [1000, 2000, 4000];  // ms

for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    return await fetch(url);
  } catch (error) {
    if (error.status === 429 && attempt < MAX_RETRIES - 1) {
      await sleep(BACKOFF[attempt]);
    }
  }
}
```

---

## Summary

| Operation | Endpoint | Method | Auth | Privilege |
|-----------|----------|--------|------|-----------|
| Create (Simple) | `/private/products` | POST | Required | ADMIN+ |
| Create (Orchestrator) | `/private/products/orchestrate/session/create` | POST | Required | ADMIN+ |
| List | `/private/products` | GET | Required | ADMIN+ |
| Get One | `/private/products/:id` | GET | Required | ADMIN+ |
| Update | `/private/products/:id` | PATCH | Required | ADMIN+ |
| Soft Delete | `/private/products/:id` | DELETE | Required | ADMIN+ |
| Hard Delete | `/private/products/:id/permanent` | DELETE | Required | MAIN |

---

**Last Updated**: January 20, 2026  
**Version**: 1.0  
**Status**: Production Ready

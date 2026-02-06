# Frontend Integration Guide: Products & Audience Targets

## Overview

With the current implementation, **audience targets are automatically created when a product is created**. The frontend no longer needs to make separate calls to create targets.

## Simplified Flow

```
Frontend                     Backend                     Dataverse
   |                            |                            |
   |-- POST /private/products --|                            |
   |                            |-- Create Product --------->|
   |                            |                            |
   |                            |<-- Product GUID -----------|
   |                            |                            |
   |                            |-- Create Target ---------->|
   |                            |   (with product reference) |
   |                            |                            |
   |                            |<-- Target Created ---------|
   |                            |                            |
   |<- Response with ---------  |                            |
   |   product + targetId       |                            |
```

## 1. Create Product (Auto-creates Target)

### Endpoint
```
POST /private/products
```

### Request Body
```json
{
  "productCode": "MEMBERSHIP-2025",
  "name": "Membership Premium 2025",
  "description": "Premium access for 2025",
  "price": 199.90,
  "currency": "BRL",
  "duration": 12,
  "durationUnit": "months",
  "status": "active",
  "category": "membership"
}
```

### Response
```json
{
  "id": "615a4dbe-53df-f011-8406-7ced8d663da9",
  "productId": "osot-prod-0000037",
  "productCode": "MEMBERSHIP-2025",
  "name": "Membership Premium 2025",
  "description": "Premium access for 2025",
  "price": 199.90,
  "currency": "BRL",
  "duration": 12,
  "durationUnit": "months",
  "status": "active",
  "category": "membership",
  "targetId": "osot-target-0000025",
  "_links": {
    "self": {
      "href": "/private/products/615a4dbe-53df-f011-8406-7ced8d663da9"
    },
    "target": {
      "href": "/private/audience-targets/osot-target-0000025"
    }
  },
  "createdOn": "2025-12-22T10:30:00Z",
  "modifiedOn": "2025-12-22T10:30:00Z"
}
```

### Important Fields in Response
- **`id`**: Product GUID (use for OData queries)
- **`productId`**: Business ID (osot-prod-XXXXXXX)
- **`targetId`**: Auto-created target business ID (osot-target-XXXXXXX)
- **`_links.target.href`**: Direct link to the target

## 2. Configure Audience Target

After creating the product, use the returned `targetId` to configure the audiences.

### Endpoint
```
PATCH /private/audience-targets/{targetId}
```

⚠️ **IMPORTANT**: Use `PATCH`, not `POST`. The target already exists!

### Understanding Audience Targeting

**Audience target fields are ARRAYS OF ENUM VALUES**, not booleans. This is critical to understand:

#### Filtering Logic (Whitelist)

1. **ALL fields empty/not sent** = **Public Product** (everyone can see)
   ```json
   {
     // No fields sent - product visible to all users
   }
   ```

2. **At least ONE field with values** = **Restricted Product** (whitelist)
   ```json
   {
     "osot_account_group": [1, 2]  // Only OT and OTA can see
   }
   ```
   → **Only users matching AccountGroup 1 OR 2 can see the product**

3. **Multiple fields with values** = **OR logic between all criteria**
   ```json
   {
     "osot_account_group": [1],           // Occupational Therapist
     "osot_membership_city": [5, 10],     // Toronto or Ottawa
     "osot_practice_years": [3, 4, 5]     // 5-10+ years
   }
   ```
   → **User can see if they match ANY of these criteria**:
   - AccountGroup = 1 (OT) **OR**
   - City = 5 or 10 (Toronto/Ottawa) **OR**
   - Practice Years = 3, 4, or 5 (5-10+ years)

#### Key Rules

✅ **Empty array `[]`** = same as not sending the field (ignored)
✅ **Array with values `[1, 2, 3]`** = apply filter for these values
✅ **Field not sent** = ignored (no filtering)
✅ **OR logic**: User needs to match **at least one** criterion to see the product

### Request Body Example

```json
{
  "osot_account_group": [1, 2],
  "osot_membership_city": [5, 10, 15],
  "osot_practice_years": [3, 4, 5]
}
```

### Response
```json
{
  "osot_target": "osot-target-0000025",
  "osot_Table_Product": {
    "id": "615a4dbe-53df-f011-8406-7ced8d663da9",
    "productId": "osot-prod-0000037",
    "productCode": "MEMBERSHIP-2025"
  },
  "osot_account_group": [1, 2],
  "osot_membership_city": [5, 10, 15],
  "osot_practice_years": [3, 4, 5],
  "_links": {
    "self": {
      "href": "/private/audience-targets/osot-target-0000025"
    },
    "product": {
      "href": "/private/products/615a4dbe-53df-f011-8406-7ced8d663da9"
    }
  },
  "createdOn": "2025-12-22T10:30:00Z",
  "modifiedOn": "2025-12-22T10:30:05Z"
}
```

## 3. Find Target by Product

### Endpoint
```
GET /private/audience-targets?productId={productGuid}
```

⚠️ **IMPORTANT**: Use the product GUID (`id`), not the business ID (`productId`)

### Example
```
GET /private/audience-targets?productId=615a4dbe-53df-f011-8406-7ced8d663da9
```

### Response
```json
{
  "data": [
    {
      "osot_target": "osot-target-0000025",
      "osot_Table_Product": {
        "id": "615a4dbe-53df-f011-8406-7ced8d663da9",
        "productId": "osot-prod-0000037",
        "productCode": "MEMBERSHIP-2025"
      },
      "osot_target_accounts": true,
      "osot_target_afiliados": false,
      "osot_target_prospects": true,
      "osot_target_medicos": false,
      "osot_target_users": true,
      "osot_target_contacts": false,
      "_links": {
        "self": {
          "href": "/private/audience-targets/osot-target-0000025"
        },
        "product": {
          "href": "/private/products/615a4dbe-53df-f011-8406-7ced8d663da9"
        }
      }
    }
  ],
  "_links": {
    "self": {
      "href": "/private/audience-targets?productId=615a4dbe-53df-f011-8406-7ced8d663da9"
    }
  }
}
```

## 4. Find Specific Target

### Endpoint
```
GET /private/audience-targets/{targetId}
```

### Example
```
GET /private/audience-targets/osot-target-0000025
```

## 5. Complete Frontend Flow

### React/TypeScript Example

```typescript
// 1. Create product (auto-creates target)
async function createProduct(productData: CreateProductDto) {
  const response = await fetch('/private/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  
  const product = await response.json();
  
  // product.targetId is available!
  console.log('Product created:', product.id);
  console.log('Target auto-created:', product.targetId);
  
  return product;
}

// 2. Configure target audiences
async function configureAudiences(targetId: string, audiences: AudienceConfig) {
  const response = await fetch(`/private/audience-targets/${targetId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(audiences)
  });
  
  return await response.json();
}

// 3. Complete flow
async function createProductWithAudiences() {
  // Step 1: Create product
  const product = await createProduct({
    productCode: 'MEMBERSHIP-2025',
    name: 'Membership Premium 2025',
    price: 199.90,
    currency: 'BRL',
    // ...other fields
  });
  
  // Step 2: Configure audiences
  const target = await configureAudiences(product.targetId, {
    osot_account_group: [1, 2],           // OT and OTA
    osot_membership_city: [5, 10],        // Toronto and Ottawa
    osot_practice_years: [3, 4, 5]        // 5-10+ years
  });
  
  console.log('Setup complete!');
  return { product, target };
}
```

## 6. Audience Target Fields (35 Total)

### Field Categories

All fields are **arrays of enum values** (multi-select, 0-50 values per field).

#### Account & Identity (5 fields)
- `osot_account_group` - Account types (OT, OTA, Vendor, etc.)
- `osot_membership_gender` - Gender
- `osot_indigenous_detail` - Indigenous details
- `osot_membership_language` - Languages
- `osot_membership_race` - Race/ethnicity

#### Location (4 fields)
- `osot_affiliate_city` - Affiliate city
- `osot_affiliate_province` - Affiliate province
- `osot_membership_city` - Member city
- `osot_province` - Member province

#### Membership (3 fields)
- `osot_affiliate_area` - Affiliate service areas
- `osot_affiliate_eligibility` - Affiliate eligibility
- `osot_membership_category` - Membership categories

#### Employment (7 fields)
- `osot_earnings_selfindirect` - Earnings (self/indirect)
- `osot_employment_benefits` - Employment benefits
- `osot_employment_status` - Employment status
- `osot_position_funding` - Position funding
- `osot_practice_years` - Years in practice
- `osot_role_description` - Role descriptors
- `osot_work_hours` - Work hours

#### Practice (4 fields)
- `osot_client_age` - Client age groups
- `osot_practice_area` - Practice areas
- `osot_practice_services` - Practice services
- `osot_practice_settings` - Practice settings

#### Preferences (4 fields)
- `osot_membership_search_tools` - Search tool preferences
- `osot_practice_promotion` - Practice promotion methods
- `osot_psychotherapy_supervision` - Psychotherapy supervision types
- `osot_third_parties` - Third party preferences

#### Education - OT (3 fields)
- `osot_coto_status` - COTO status
- `osot_ot_grad_year` - OT graduation year
- `osot_ot_university` - OT universities

#### Education - OTA (2 fields)
- `osot_ota_grad_year` - OTA graduation year
- `osot_ota_college` - OTA colleges

### Read-Only Fields (returned in response)
- `osot_target`: Target business ID (autonumber)
- `osot_Table_Product`: Object with related product data
- `createdOn`: Creation date
- `modifiedOn`: Last modification date
- `_links`: HATEOAS links for navigation

## 7. Working with Enums

### Where to Get Enum Values

#### Option 1: OpenAPI/Swagger Documentation
Access `/api` in your browser and check the schema definitions for each field. Each enum includes:
- Numeric values
- String labels
- Descriptions

Example from Swagger:
```json
"AccountGroup": {
  "type": "integer",
  "enum": [1, 2, 3, 4],
  "x-enumNames": [
    "OCCUPATIONAL_THERAPIST",
    "OCCUPATIONAL_THERAPIST_ASSISTANT",
    "VENDOR_ADVERTISER",
    "OTHER"
  ]
}
```

#### Option 2: GET Endpoints with Enum Expansion
Use `$select` parameter to get field metadata:
```
GET /private/audience-targets/{id}?$select=osot_account_group
```

#### Option 3: Reference TypeScript Enums
If using TypeScript, request the enum definitions from backend team. They are available in:
- `src/common/enums/*.enum.ts` (15 common enums)
- `src/classes/membership/*/enums/*.enum.ts` (15 membership enums)

### Common Enum Examples

#### AccountGroup
```typescript
enum AccountGroup {
  OCCUPATIONAL_THERAPIST = 1,
  OCCUPATIONAL_THERAPIST_ASSISTANT = 2,
  VENDOR_ADVERTISER = 3,
  OTHER = 4
}
```

#### Province (Canada)
```typescript
enum Province {
  ONTARIO = 1,
  QUEBEC = 2,
  BRITISH_COLUMBIA = 3,
  ALBERTA = 4,
  MANITOBA = 5,
  SASKATCHEWAN = 6,
  NOVA_SCOTIA = 7,
  NEW_BRUNSWICK = 8,
  NEWFOUNDLAND_AND_LABRADOR = 9,
  PRINCE_EDWARD_ISLAND = 10,
  NORTHWEST_TERRITORIES = 11,
  YUKON = 12,
  NUNAVUT = 13
}
```

#### PracticeYears
```typescript
enum PracticeYears {
  LESS_THAN_1_YEAR = 1,
  ONE_TO_5_YEARS = 2,
  FIVE_TO_10_YEARS = 3,
  TEN_TO_15_YEARS = 4,
  MORE_THAN_15_YEARS = 5
}
```

### Usage Examples

#### Example 1: Public Product (no restrictions)
```typescript
// Don't send any targeting fields
const target = await updateTarget(targetId, {});
// Result: Everyone can see the product
```

#### Example 2: Only OTs in Toronto
```typescript
const target = await updateTarget(targetId, {
  osot_account_group: [1],      // Occupational Therapist
  osot_membership_city: [5]     // Toronto
});
// Result: Only OTs OR users in Toronto can see (OR logic)
```

#### Example 3: Experienced OTs and OTAs
```typescript
const target = await updateTarget(targetId, {
  osot_account_group: [1, 2],      // OT and OTA
  osot_practice_years: [3, 4, 5]   // 5+ years
});
// Result: (OT or OTA) OR (5+ years practice) can see
```

#### Example 4: Complex Targeting
```typescript
const target = await updateTarget(targetId, {
  osot_account_group: [1],                    // OT only
  osot_province: [1, 3],                      // Ontario or BC
  osot_practice_area: [1, 2, 3],              // Specific practice areas
  osot_employment_status: [1, 2]              // Full-time or part-time
});
// Result: Match ANY of these criteria (OR logic)
```

## 8. Practical Scenarios

### Scenario 1: Public Webinar
**Requirement**: Everyone should be able to see and register

```typescript
// Don't configure any targeting
const product = await createProduct({
  productCode: 'WEBINAR-2025',
  name: 'Public Webinar: OT Trends 2025',
  price: 0,
  status: 'active'
});

// Target exists but is empty - no restrictions
// No PATCH call needed!
```

### Scenario 2: OT-Only Advanced Course
**Requirement**: Only Occupational Therapists

```typescript
const product = await createProduct({ /* ... */ });

const target = await updateTarget(product.targetId, {
  osot_account_group: [1]  // OCCUPATIONAL_THERAPIST only
});
```

### Scenario 3: Regional Event
**Requirement**: Only members in Ontario and Quebec

```typescript
const product = await createProduct({ /* ... */ });

const target = await updateTarget(product.targetId, {
  osot_province: [1, 2]  // Ontario and Quebec
});
```

### Scenario 4: Experienced Practitioners Workshop
**Requirement**: OTs and OTAs with 5+ years experience

```typescript
const product = await createProduct({ /* ... */ });

const target = await updateTarget(product.targetId, {
  osot_account_group: [1, 2],        // OT and OTA
  osot_practice_years: [3, 4, 5]     // 5+ years (OR logic applies)
});
// Note: This allows OTs/OTAs OR anyone with 5+ years
// If you want AND logic, handle it in application layer
```

## 9. Error Handling

### Product Without Target
If for some reason the target was not automatically created:

```typescript
async function ensureTargetExists(productId: string) {
  try {
    const response = await fetch(
      `/private/audience-targets?productId=${productId}`
    );
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      return data.data[0]; // Target exists
    }
    
    // Target doesn't exist - contact support
    throw new Error('Target not found for product');
  } catch (error) {
    console.error('Error checking target:', error);
    throw error;
  }
}
```

### Retry on Failure
The backend already has automatic retry (3 attempts), but you can add retry logic on the frontend:

```typescript
async function createProductWithRetry(
  productData: CreateProductDto, 
  maxRetries = 2
) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await createProduct(productData);
    } catch (error) {
      if (i === maxRetries) throw error;
      
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## 10. Important Considerations

### ✅ What TO DO
- Use `PATCH` to update existing targets
- Use the product GUID (`id`) for OData queries
- Check if `targetId` is present in the product response
- Handle permission errors (403) appropriately
- Use HATEOAS links (`_links`) for navigation

### ❌ What NOT to do
- ~~Create targets manually via POST~~ (they are auto-created)
- ~~Use business ID (`productId`) in OData queries~~ (use `id`)
- ~~Try to create target before product~~ (orphan not allowed)
- ~~Ignore errors on product creation~~ (target depends on it)

## 11. TypeScript Data Structures

```typescript
// Product
interface Product {
  id: string;                    // GUID
  productId: string;             // Business ID
  productCode: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration?: number;
  durationUnit?: 'days' | 'months' | 'years';
  status: 'active' | 'inactive' | 'draft';
  category?: string;
  targetId?: string;             // Target business ID
  _links: {
    self: { href: string };
    target?: { href: string };
  };
  createdOn: string;
  modifiedOn: string;
}

// Audience Target
interface AudienceTarget {
  osot_target: string;           // Business ID (autonumber)
  osot_Table_Product: {
    id: string;
    productId: string;
    productCode: string;
  };
  // All fields are optional arrays of enum values
  osot_account_group?: number[];
  osot_membership_city?: number[];
  osot_province?: number[];
  osot_practice_years?: number[];
  osot_practice_area?: number[];
  osot_employment_status?: number[];
  // ... 29 more fields (35 total)
  _links: {
    self: { href: string };
    product: { href: string };
  };
  createdOn: string;
  modifiedOn: string;
}

// DTOs for creation
interface CreateProductDto {
  productCode: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration?: number;
  durationUnit?: 'days' | 'months' | 'years';
  status: 'active' | 'inactive' | 'draft';
  category?: string;
}

interface UpdateAudienceTargetDto {
  // All 35 fields optional, all are number arrays
  osot_account_group?: number[];
  osot_affiliate_area?: number[];
  osot_affiliate_city?: number[];
  osot_affiliate_province?: number[];
  osot_affiliate_eligibility?: number[];
  osot_membership_city?: number[];
  osot_province?: number[];
  osot_membership_gender?: number[];
  osot_indigenous_detail?: number[];
  osot_membership_language?: number[];
  osot_membership_race?: number[];
  osot_membership_category?: number[];
  osot_earnings_selfindirect?: number[];
  osot_employment_benefits?: number[];
  osot_employment_status?: number[];
  osot_position_funding?: number[];
  osot_practice_years?: number[];
  osot_role_description?: number[];
  osot_work_hours?: number[];
  osot_client_age?: number[];
  osot_practice_area?: number[];
  osot_practice_services?: number[];
  osot_practice_settings?: number[];
  osot_membership_search_tools?: number[];
  osot_practice_promotion?: number[];
  osot_psychotherapy_supervision?: number[];
  osot_third_parties?: number[];
  osot_coto_status?: number[];
  osot_ot_grad_year?: number[];
  osot_ot_university?: number[];
  osot_ota_grad_year?: number[];
  osot_ota_college?: number[];
}
```

## 12. Debugging

### Backend Logs
The backend logs all operations:
```
Successfully created product <productCode>
Successfully created target <targetId> for product <productGuid>
Successfully auto-created target for product <productCode>
```

### Verify in Swagger
Access `/api` to test endpoints manually:
- POST `/private/products` - Create product
- PATCH `/private/audience-targets/{id}` - Update target
- GET `/private/audience-targets?productId={guid}` - Find target

### Common Errors

| Error | Cause | Solution |
|------|-------|---------|
| `Property 'osot_target_id' not found` | Field renamed | Use `osot_target` |
| `Missing prvReadosot_Table_Audience_Target` | Permission | App 'main' needs READ |
| `Syntax error in OData filter` | Using business ID | Use GUID (`id`) |
| `Target not found` | Incorrect query | Verify product GUID |

## 13. Migration Path

If you already have old code that creates targets manually:

### BEFORE (old code)
```typescript
// ❌ DON'T DO THIS ANYMORE
const product = await createProduct(data);
const target = await createTarget({
  osot_Table_Product: product.id
});
```

### AFTER (new code)
```typescript
// ✅ DO THIS INSTEAD
const product = await createProduct(data);
// Target already exists! Use product.targetId
await updateTarget(product.targetId, audienceConfig);
```

## 14. Useful Links

- **Swagger UI**: `/api`
- **OpenAPI Spec**: `/openapi.json`
- **Internal Docs**:
  - `PRODUCT_FRONTEND_INTEGRATION_GUIDE.md`
  - `ERROR_HANDLING_FRONTEND_GUIDE.md`
  - `PRIVATE_ROUTES_CONSUMPTION_GUIDE.md`

---

## Questions?

If you encounter problems or have questions:
1. Check backend logs
2. Test in Swagger UI
3. Verify app permissions in Dataverse
4. Contact backend team

**Last update**: December 22, 2025

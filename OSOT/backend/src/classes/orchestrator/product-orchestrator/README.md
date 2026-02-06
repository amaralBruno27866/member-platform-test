# Product Creation Orchestrator - Frontend Integration Guide

## 📋 Overview

The **Product Creation Orchestrator** is a Redis-first workflow that allows administrators to create products with their Audience Target configurations in a single atomic operation.

**Benefits:**
- ✅ Frontend can enable "Audience Target" tab from the start
- ✅ Data validation before saving to Dataverse
- ✅ Atomic creation (Product + Target created together or neither)
- ✅ Automatic rollback on failure
- ✅ Retry logic (3 attempts with 1s delay)
- ✅ 2-hour TTL for security

---

## 🔐 Authentication

**Required Privileges:** `Admin` (2) or `Main` (3)

All requests must include the JWT token in the header:

```http
Authorization: Bearer <jwt_token>
```

---

## 🔄 Workflow

### Session States

```
INITIATED → PRODUCT_ADDED → TARGET_CONFIGURED → COMMITTED → COMPLETED
                                                    ↓
                                                 FAILED
```

| State | Description |
|-------|-------------|
| `INITIATED` | Session created, waiting for product data |
| `PRODUCT_ADDED` | Product data validated and stored in Redis |
| `TARGET_CONFIGURED` | Target configuration added (optional) |
| `COMMITTED` | Data sent to Dataverse (processing) |
| `COMPLETED` | Product + Target created successfully |
| `FAILED` | Failed after 3 commit attempts |
| `EXPIRED` | Session expired (2 hours without commit) |

---

## 🛠️ API Endpoints

Base URL: `/private/products/orchestrate`

### 1️⃣ Create Session

**Endpoint:** `POST /session/create`

**Description:** Initiates a new product creation session.

**Request:**
```http
POST /private/products/orchestrate/session/create
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response (201):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "state": "INITIATED",
  "expiresAt": "2026-01-16T18:30:00.000Z",
  "operationId": "create-product-session-1705425600000"
}
```

**Store the `sessionId`** - it will be used in the next steps.

---

### 2️⃣ Add Product Data

**Endpoint:** `POST /session/{sessionId}/product`

**Description:** Validates and stores product data in Redis.

**Applied Validations:**
- ✅ Required fields: `productName`, `productCode`, `productDescription`, `productCategory`
- ✅ Code format: `PROD-XXXXXX` (6 digits)
- ✅ `productCode` uniqueness (checked in Dataverse)
- ✅ At least 1 price field required (`priceOntario`, `priceQuebec`, `priceStudent`, `priceOta`)
- ✅ Prices between `0.01` and `999999.99`

**Request:**
```http
POST /private/products/orchestrate/session/550e8400-e29b-41d4-a716-446655440000/product
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "productName": "Advanced OT Assessment Workshop",
  "productCode": "PROD-000123",
  "productDescription": "Comprehensive workshop on occupational therapy assessment techniques",
  "productCategory": "CEU",
  "productType": "Workshop",
  "productStatus": "DRAFT",
  "priceOntario": 299.99,
  "priceQuebec": 299.99,
  "priceStudent": 199.99,
  "priceOta": 249.99,
  "inventoryTotal": 50,
  "ceuCredits": 5.0,
  "duration": "8 hours",
  "deliveryMethod": "In-Person",
  "requiresPrerequisite": false
}
```

**Response (200):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "state": "PRODUCT_ADDED",
  "expiresAt": "2026-01-16T18:30:00.000Z",
  "operationId": "add-product-1705425700000"
}
```

**Common Errors:**

```json
// 400 - Validation failed
{
  "statusCode": 400,
  "message": "Product validation failed",
  "errors": [
    "Missing required field: productName",
    "Invalid product code format. Expected: PROD-XXXXXX",
    "At least one price field must be specified and greater than 0"
  ],
  "operationId": "add-product-1705425700000"
}

// 409 - Code already exists
{
  "statusCode": 409,
  "message": "Product with code PROD-000123 already exists",
  "productCode": "PROD-000123",
  "operationId": "add-product-1705425700000"
}
```

---

### 3️⃣ Configure Audience Target (Optional)

**Endpoint:** `POST /session/{sessionId}/audience-target`

**Description:** Adds target configuration. If omitted, a default target (open-to-all) will be created.

**Request:**
```http
POST /private/products/orchestrate/session/550e8400-e29b-41d4-a716-446655440000/audience-target
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "osot_location_province": ["Ontario", "Quebec"],
  "osot_employment_status": ["Employed Full-Time"],
  "osot_registration_class": ["General Class"],
  "osot_practice_area": ["Mental Health", "Pediatrics"],
  "osot_years_in_practice": ["5-10 years", "10+ years"],
  "osot_education_level": ["Bachelor's Degree", "Master's Degree"],
  "osot_professional_interest": ["Evidence-Based Practice"],
  "osot_ceu_topic_preference": ["Assessment", "Intervention"]
}
```

**Available Fields (all optional):**

| Field | Type | Max Selections | Description |
|-------|------|----------------|-------------|
| `osot_location_province` | string[] | 50 | Provinces/Territories |
| `osot_location_region` | string[] | 50 | Regions (Rural, Urban, etc.) |
| `osot_employment_status` | string[] | 50 | Employment status |
| `osot_employment_sector` | string[] | 50 | Work sector |
| `osot_employment_setting` | string[] | 50 | Work environment |
| `osot_registration_class` | string[] | 50 | Registration class |
| `osot_practice_area` | string[] | 50 | Practice area |
| `osot_client_age_group` | string[] | 50 | Client age range |
| `osot_years_in_practice` | string[] | 50 | Years of experience |
| `osot_education_level` | string[] | 50 | Education level |
| `osot_professional_interest` | string[] | 50 | Professional interests |
| `osot_ceu_topic_preference` | string[] | 50 | CEU topic preferences |
| *... 21 more fields* | string[] | 50 | See complete DTO |

**Note:** Unspecified fields = "open-to-all" (open target for all).

**Response (200):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "state": "TARGET_CONFIGURED",
  "expiresAt": "2026-01-16T18:30:00.000Z",
  "operationId": "add-target-1705425800000"
}
```

---

### 4️⃣ Commit (Create in Dataverse)

**Endpoint:** `POST /session/{sessionId}/commit`

**Description:** Sends validated data to Dataverse. Atomic operation with retry.

**Request:**
```http
POST /private/products/orchestrate/session/550e8400-e29b-41d4-a716-446655440000/commit
Authorization: Bearer <jwt_token>
```

**Response (200 - Success):**
```json
{
  "success": true,
  "productGuid": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "targetGuid": "f6e5d4c3-b2a1-0987-6543-210fedcba987",
  "productCode": "PROD-000123",
  "operationId": "commit-1705425900000"
}
```

**Response (200 - Failed after 3 attempts):**
```json
{
  "success": false,
  "errors": [
    "Failed to create product in Dataverse after 3 attempts",
    "Connection timeout"
  ],
  "operationId": "commit-1705425900000"
}
```

**Behavior:**
- 🔄 **3 attempts** with 1 second delay between each
- 🔙 **Automatic rollback** if it fails
- 🧹 **Cleanup** of Redis session after 5 seconds (if successful)

**Possible Errors:**

```json
// 400 - Product not added
{
  "statusCode": 400,
  "message": "Product data must be added before commit",
  "operationId": "commit-1705425900000"
}

// 400 - Invalid state
{
  "statusCode": 400,
  "message": "Cannot commit session in state FAILED",
  "operationId": "commit-1705425900000"
}
```

---

### 5️⃣ Check Progress

**Endpoint:** `GET /session/{sessionId}/progress`

**Description:** Queries the current status of the session.

**Request:**
```http
GET /private/products/orchestrate/session/550e8400-e29b-41d4-a716-446655440000/progress
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "state": "TARGET_CONFIGURED",
  "steps": {
    "productAdded": true,
    "targetConfigured": true,
    "committed": false
  },
  "errors": [],
  "canCommit": true
}
```

**Properties:**

| Field | Type | Description |
|-------|------|-------------|
| `steps.productAdded` | boolean | Was product added? |
| `steps.targetConfigured` | boolean | Was target configured? |
| `steps.committed` | boolean | Was commit performed? |
| `canCommit` | boolean | Is session ready for commit? |
| `errors` | string[] | Accumulated errors (if any) |

---

## 💻 Exemplo de Implementação Frontend (React)

### Hook Customizado

```typescript
// useProductOrchestrator.ts
import { useState } from 'react';
import axios from 'axios';

interface OrchestratorSession {
  sessionId: string;
  state: string;
  expiresAt: string;
}

interface CommitResult {
  success: boolean;
  productGuid?: string;
  targetGuid?: string;
  productCode?: string;
  errors?: string[];
}

export function useProductOrchestrator() {
  const [session, setSession] = useState<OrchestratorSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('jwt_token')}`,
    },
  });

  // 1. Create session
  const createSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/private/products/orchestrate/session/create');
      setSession(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 2. Add product
  const addProduct = async (productData: any) => {
    if (!session) throw new Error('No active session');
    
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(
        `/private/products/orchestrate/session/${session.sessionId}/product`,
        productData
      );
      setSession(data);
      return data;
    } catch (err: any) {
      const errors = err.response?.data?.errors || [err.response?.data?.message];
      setError(errors.join(', '));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 3. Add target (optional)
  const addTarget = async (targetData: any) => {
    if (!session) throw new Error('No active session');
    
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(
        `/private/products/orchestrate/session/${session.sessionId}/audience-target`,
        targetData
      );
      setSession(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add target');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 4. Commit
  const commit = async (): Promise<CommitResult> => {
    if (!session) throw new Error('No active session');
    
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(
        `/private/products/orchestrate/session/${session.sessionId}/commit`
      );
      
      if (!data.success) {
        setError(data.errors?.join(', ') || 'Commit failed');
      }
      
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to commit');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 5. Check progress
  const checkProgress = async () => {
    if (!session) throw new Error('No active session');
    
    try {
      const { data } = await api.get(
        `/private/products/orchestrate/session/${session.sessionId}/progress`
      );
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check progress');
      throw err;
    }
  };

  return {
    session,
    loading,
    error,
    createSession,
    addProduct,
    addTarget,
    commit,
    checkProgress,
  };
}
```

### Product Creation Component

```tsx
// CreateProductForm.tsx
import React, { useState } from 'react';
import { useProductOrchestrator } from './useProductOrchestrator';

export function CreateProductForm() {
  const { session, loading, error, createSession, addProduct, addTarget, commit } = useProductOrchestrator();
  const [step, setStep] = useState(0); // 0: Initial, 1: Product, 2: Target, 3: Review
  const [productData, setProductData] = useState({});
  const [targetData, setTargetData] = useState({});

  // Start workflow
  const handleStart = async () => {
    try {
      await createSession();
      setStep(1);
    } catch (err) {
      alert('Failed to start: ' + error);
    }
  };

  // Save product
  const handleSaveProduct = async (data: any) => {
    try {
      await addProduct(data);
      setProductData(data);
      setStep(2); // Go to Target
    } catch (err) {
      alert('Product validation failed: ' + error);
    }
  };

  // Save target (or skip)
  const handleSaveTarget = async (data: any) => {
    if (Object.keys(data).length > 0) {
      try {
        await addTarget(data);
        setTargetData(data);
      } catch (err) {
        alert('Target validation failed: ' + error);
      }
    }
    setStep(3); // Go to Review
  };

  // Finalize
  const handleCommit = async () => {
    try {
      const result = await commit();
      
      if (result.success) {
        alert(`Product created! GUID: ${result.productGuid}`);
        // Redirect to product list
      } else {
        alert(`Commit failed: ${result.errors?.join(', ')}`);
      }
    } catch (err) {
      alert('Commit error: ' + error);
    }
  };

  return (
    <div>
      {step === 0 && (
        <button onClick={handleStart} disabled={loading}>
          Start Product Creation
        </button>
      )}

      {step === 1 && (
        <ProductStep onNext={handleSaveProduct} loading={loading} />
      )}

      {step === 2 && (
        <TargetStep onNext={handleSaveTarget} onSkip={() => setStep(3)} loading={loading} />
      )}

      {step === 3 && (
        <ReviewStep
          product={productData}
          target={targetData}
          onCommit={handleCommit}
          loading={loading}
        />
      )}

      {error && <div className="error">{error}</div>}
      
      {session && (
        <div className="session-info">
          Session: {session.sessionId} | State: {session.state}
        </div>
      )}
    </div>
  );
}
```

---

## ⚠️ Error Handling

### HTTP Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Session created |
| `400` | Validation failed / Invalid state |
| `401` | Invalid/expired JWT token |
| `403` | No privilege (Admin/Main only) |
| `404` | Session not found |
| `409` | Product already exists (duplicate code) |
| `500` | Internal server error |

### Session Expiration

If the session expires (2 hours):

```json
{
  "statusCode": 400,
  "message": "Session expired",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": "2026-01-16T18:30:00.000Z"
}
```

**Solution:** Create a new session and restart the workflow.

---

## ✅ Best Practices

### 1. Always Store the SessionId

```typescript
// Save in localStorage or state management
sessionStorage.setItem('productSessionId', session.sessionId);
```

### 2. Implement Expiration Timer

```typescript
// Show 2-hour countdown
const expiresAt = new Date(session.expiresAt);
const now = new Date();
const timeLeft = expiresAt.getTime() - now.getTime();
// Show alert 5 minutes before
```

### 3. Frontend Validation BEFORE Backend

```typescript
// Validate product code on frontend
const isValidCode = /^PROD-\d{6}$/.test(productCode);

// Validate prices
const hasPrice = priceOntario > 0 || priceQuebec > 0 || priceStudent > 0 || priceOta > 0;
```

### 4. Visual Feedback by State

```tsx
const stateColors = {
  INITIATED: 'blue',
  PRODUCT_ADDED: 'green',
  TARGET_CONFIGURED: 'purple',
  COMMITTED: 'orange',
  COMPLETED: 'success',
  FAILED: 'error',
};
```

### 5. Allow Saving Drafts

The orchestrator does NOT save drafts. If you need this functionality:

```typescript
// Save to localStorage
localStorage.setItem('productDraft', JSON.stringify(productData));

// Retrieve on reload
const draft = JSON.parse(localStorage.getItem('productDraft') || '{}');
```

---

## 🔍 Use Cases

### Case 1: Complete Creation

```
1. POST /session/create → sessionId
2. POST /session/{id}/product → PRODUCT_ADDED
3. POST /session/{id}/audience-target → TARGET_CONFIGURED
4. POST /session/{id}/commit → COMPLETED ✅
```

### Case 2: Without Target (Open-to-All)

```
1. POST /session/create → sessionId
2. POST /session/{id}/product → PRODUCT_ADDED
3. POST /session/{id}/commit → COMPLETED ✅ (default target created)
```

### Case 3: Check Progress During Commit

```
1. POST /session/{id}/commit (async)
2. GET /session/{id}/progress (polling)
3. Check if state === 'COMPLETED'
```

### Case 4: Error and Retry

```
1. POST /session/{id}/commit → success: false
2. Check errors array
3. Fix data (if necessary)
4. POST /session/{id}/commit (manual retry)
```

---

## 🚀 Differences from Old Flow

### ❌ Old Flow (PATCH)

```
1. POST /products → Create product (auto-create empty target)
2. GET /products/{id} → Get productGuid
3. Find targetGuid via product
4. PATCH /audience-target/{targetGuid} → Configure target
```

**Problems:**
- Target tab disabled until product exists
- Product created without complete validation
- 3 requests (slow)
- Target always empty initially

### ✅ New Flow (Orchestrator)

```
1. POST /session/create → Validation in Redis
2. POST /session/{id}/product → Pre-validation
3. POST /session/{id}/audience-target → Configuration BEFORE creating
4. POST /session/{id}/commit → Atomic creation
```

**Advantages:**
- Target tab enabled from the start
- Complete validation before saving
- 1 atomic operation (fast + safe)
- Target configured at the moment of creation

---

## 📊 Monitoring

### Event Logs

The orchestrator emits 6 events for observability:

```typescript
// 1. Session created
'product-orchestrator.session.created'

// 2. Product added
'product-orchestrator.product.added'

// 3. Target configured
'product-orchestrator.target.configured'

// 4. Commit started
'product-orchestrator.commit.started'

// 5. Commit success
'product-orchestrator.commit.success'

// 6. Commit failed
'product-orchestrator.commit.failed'

// 7. Session expired
'product-orchestrator.session.expired'
```

**Use these events for:**
- Analytics (how many creations per day)
- Debugging (where users drop off)
- Alerts (high failure rate)

---

## 🔗 Related Resources

- **Product CRUD Service:** `/classes/others/product/services/product-crud.service.ts`
- **Audience Target CRUD:** `/classes/others/audience-target/services/audience-target-crud.service.ts`
- **CreateProductDto:** `/classes/others/product/dtos/create-product.dto.ts`
- **CreateAudienceTargetDto:** `/classes/others/audience-target/dtos/audience-target-create.dto.ts`

---

## ❓ Frontend Frequently Asked Questions

### 1. Flow Coexistence

**Q: Does the old POST /private/products endpoint still exist for editing?**

✅ **Yes, the old endpoints continue to work normally:**

```typescript
// CREATION - Use Orchestrator (NEW)
POST /private/products/orchestrate/session/create

// EDITING - Use direct endpoints (OLD - still works)
PATCH /private/products/{productGuid}
PATCH /private/audience-target/{targetGuid}
```

**Summary:**
- ✅ **Creation:** Use orchestrator (better UX)
- ✅ **Editing:** Use direct endpoints (PATCH)
- ✅ **Listing:** Use GET /private/products (no changes)

---

### 2. Product Editing

**Q: How does editing existing products work?**

📝 **Editing continues using direct endpoints (old flow):**

```typescript
// Editar produto
PATCH /private/products/{productGuid}
Content-Type: application/json

{
  "productName": "Updated Name",
  "priceOntario": 349.99
  // Only changed fields
}

// Edit audience target
PATCH /private/audience-target/{targetGuid}
Content-Type: application/json

{
  "osot_location_province": ["Ontario", "British Columbia"],
  "osot_practice_area": ["Pediatrics"]
}
```

**Why is there no orchestrator for editing?**

The orchestrator solves the **atomic creation** problem (Product + Target together). In editing, the product already exists, so:
- There's no risk of creating product without target
- No need for pre-validation (data was already validated)
- Update is an independent operation (doesn't need to be atomic)

---

### 3. Audience Target in Editing

**Q: In editing, does the target continue to be PATCH /private/audience-target/{targetGuid}?**

✅ **Yes, exactly:**

```typescript
// 1. Fetch product with target
GET /private/products/{productGuid}
// Response includes osot_table_audience_targetid

// 2. Edit target directly
PATCH /private/audience-target/{targetGuid}
```

**Complete editing workflow:**

```typescript
// useProductEdit.ts
const editProduct = async (productGuid: string, updates: Partial<ProductDto>) => {
  // Edit product
  await api.patch(`/private/products/${productGuid}`, updates);
};

const editTarget = async (targetGuid: string, updates: Partial<TargetDto>) => {
  // Edit target
  await api.patch(`/private/audience-target/${targetGuid}`, updates);
};

// Use separately as needed
```

---

### 4. Gradual Migration

**Q: Can we keep the old code for editing and use orchestrator only for creation?**

✅ **YES! This is the recommended approach:**

```typescript
// Recommended route structure
const ProductRoutes = {
  // CREATION - Orchestrator (NEW)
  create: '/products/create',           // Uses orchestrator
  
  // EDITING - Direct endpoints (OLD)
  edit: '/products/:id/edit',           // Uses PATCH directly
  editTarget: '/products/:id/audience', // Uses PATCH directly
  
  // OTHERS (no change)
  list: '/products',
  view: '/products/:id',
};
```

**Implementation:**

```typescript
// pages/products/CreateProduct.tsx
import { useProductOrchestrator } from '@/hooks/useProductOrchestrator';

export function CreateProduct() {
  const orchestrator = useProductOrchestrator();
  // Use new flow (orchestrator)
}

// pages/products/EditProduct.tsx
import { useProductApi } from '@/hooks/useProductApi';

export function EditProduct() {
  const api = useProductApi();
  // Use old flow (PATCH)
  
  const handleSave = async () => {
    await api.updateProduct(productId, formData);
    await api.updateTarget(targetId, targetData);
  };
}
```

**Advantages:**
- ✅ No breaking changes
- ✅ Gradual and safe migration
- ✅ Old code continues to work
- ✅ Better UX for creation, stability for editing

**You don't need to migrate everything at once!**

---

### 5. Field Validation

**Q: Have the validation DTOs (CreateProductDto) changed?**

✅ **No changes! The DTOs are the same:**

```typescript
// CreateProductDto - NO CHANGES
interface CreateProductDto {
  productName: string;           // Required
  productCode: string;           // Required (PROD-XXXXXX)
  productDescription: string;    // Required
  productCategory: string;       // Required
  productType?: string;
  productStatus?: string;        // Default: 'DRAFT'
  priceOntario?: number;         // At least 1 price required
  priceQuebec?: number;
  priceStudent?: number;
  priceOta?: number;
  inventoryTotal?: number;
  ceuCredits?: number;
  duration?: string;
  deliveryMethod?: string;
  requiresPrerequisite?: boolean;
  // ... other optional fields
}
```

**Orchestrator Validations (same as direct endpoint):**

| Field | Validation | Error Message |
|-------|-----------|---------------|
| `productCode` | Regex: `^PROD-\d{6}$` | "Invalid product code format" |
| `productCode` | Uniqueness | "Product already exists" |
| Prices | At least 1 > 0 | "At least one price field required" |
| Prices | Range: 0.01 - 999999.99 | "Price must be between..." |

**TypeScript Types:**

```typescript
// You can use the same types you already have!
import { CreateProductDto } from '@/types/product';
import { CreateAudienceTargetDto } from '@/types/audience-target';

// No changes needed
```

**If you want to generate types from backend:**

```bash
# Backend exposes OpenAPI
GET /api-docs/json

# Use openapi-typescript-codegen
npx openapi-typescript-codegen --input http://localhost:3000/api-docs/json --output ./src/types/api
```

---

### 6. Session Persistence

**Q: If the user closes the browser during creation, does the Redis session expire in 2h?**

✅ **Yes, and there is NO automatic recovery. Recommendations:**

#### Scenario 1: User Closes Browser

```
1. Session created in Redis (TTL: 2h)
2. User closes browser
3. SessionId lost (no recovery)
4. After 2h: Redis deletes automatically
```

**❌ It is not possible to recover the session** because:
- SessionId is not linked to userId
- Redis is temporary (not a database)
- Orchestrator is stateless

#### Scenario 2: User Refreshes Page

```
1. SessionId is in state (React)
2. User refreshes (F5)
3. State lost → SessionId lost
4. No recovery
```

#### ⚠️ Recommended Warning

**Suggested implementation:**

```typescript
// useUnsavedChanges.ts
import { useEffect } from 'react';

export function useUnsavedChanges(hasUnsavedData: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedData) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Do you really want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedData]);
}

// Use in component
function CreateProduct() {
  const { session } = useProductOrchestrator();
  const hasUnsavedData = session && session.state !== 'COMPLETED';
  
  useUnsavedChanges(hasUnsavedData);
  // ...
}
```

**Suggested UI:**

```tsx
// Warning banner
{session && session.state !== 'COMPLETED' && (
  <Alert variant="warning" className="mb-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Unsaved draft</AlertTitle>
    <AlertDescription>
      This session expires in {formatTimeLeft(session.expiresAt)}.
      Finish creation or your data will be lost.
    </AlertDescription>
  </Alert>
)}
```

**Expiration Timer:**

```typescript
// useExpirationTimer.ts
import { useState, useEffect } from 'react';

export function useExpirationTimer(expiresAt: string) {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;
      
      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  return timeLeft;
}
```

#### Alternative: Local Drafts (Frontend)

If you need persistence:

```typescript
// useDraftPersistence.ts
export function useDraftPersistence(sessionId?: string) {
  const saveLocal = (data: any) => {
    if (!sessionId) return;
    localStorage.setItem(`draft_${sessionId}`, JSON.stringify({
      data,
      timestamp: new Date().toISOString(),
    }));
  };
  
  const loadLocal = () => {
    if (!sessionId) return null;
    const saved = localStorage.getItem(`draft_${sessionId}`);
    if (!saved) return null;
    
    const { data, timestamp } = JSON.parse(saved);
    const age = Date.now() - new Date(timestamp).getTime();
    
    // Expire after 2 hours
    if (age > 2 * 60 * 60 * 1000) {
      localStorage.removeItem(`draft_${sessionId}`);
      return null;
    }
    
    return data;
  };
  
  const clearLocal = () => {
    if (sessionId) {
      localStorage.removeItem(`draft_${sessionId}`);
    }
  };
  
  return { saveLocal, loadLocal, clearLocal };
}
```

**Summary of Recommendations:**

| Situation | Solution |
|-----------|----------|
| User navigates to another page | `beforeunload` warning |
| Session about to expire | Visual timer (yellow alert at 5min) |
| Important data | Save to localStorage (backup) |
| Session expired | Show modal: "Session expired. Do you want to restart?" |

---

## 📋 Frontend Implementation Checklist

Use this checklist to implement the orchestrator:

### Phase 1: Basic Setup
- [ ] Create `useProductOrchestrator` hook
- [ ] Create `OrchestratorSession` interface
- [ ] Add routes `/products/create` (orchestrator) and `/products/:id/edit` (old)
- [ ] Configure axios with JWT

### Phase 2: Creation Flow
- [ ] `CreateProductForm` component with stepper
- [ ] Step 1: Product data
- [ ] Step 2: Audience target (with skip option)
- [ ] Step 3: Review and commit
- [ ] Loading states during commit

### Phase 3: UX Enhancements
- [ ] "Unsaved changes" warning (`beforeunload`)
- [ ] Expiration timer (show countdown)
- [ ] Alert when 5 minutes left until expiration
- [ ] Error feedback with clear messages
- [ ] Success modal with productGuid

### Phase 4: Edge Cases
- [ ] Handle expired session (404/400)
- [ ] Manual retry if commit fails
- [ ] Field validation on frontend (before sending)
- [ ] Duplicate product code detection (before sending)

### Phase 5: Optional
- [ ] Draft persistence with localStorage
- [ ] Progress polling during commit
- [ ] Abandonment analytics
- [ ] A/B test: orchestrator vs old flow

---

## 📞 Support

**Technical questions?**
- Backend: Check the code at `src/classes/orchestrator/product-orchestrator/`
- Swagger: `GET /api-docs` (interactive documentation)
- Logs: Check `product-orchestrator.*` events in the backend

**Integration problems?**
- Test manually via Postman/Insomnia first
- Use `GET /session/{id}/progress` for debugging
- Check backend logs for validation errors

---

## 📝 Final Notes

1. **2-hour TTL:** Sessions expire automatically
2. **Automatic Rollback:** If commit fails, nothing is created
3. **Retry Logic:** 3 automatic attempts
4. **Cleanup:** Redis session deleted 5s after success
5. **Privilege Required:** Only Admin/Main can use
6. **Old Endpoints:** Continue to work for editing
7. **Gradual Migration:** Use orchestrator for creation, keep PATCH for editing

**Questions?** Check the source code at `src/classes/orchestrator/product-orchestrator/`

---

**Last Updated:** January 16, 2026  
**Version:** 1.0.0  
**Author:** OSOT Platform Team

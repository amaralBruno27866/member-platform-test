# Product Orchestrator Frontend Integration Guide

**Status:** Issue Found - Frontend Missing Step 2 (Add Product Data)  
**Date:** January 19, 2026  
**Severity:** High - Product creation workflow broken

## Problem Summary

Frontend is attempting to add audience target **without first adding product data** to the session. This violates the orchestrator's 4-step workflow and results in:

```
Error: Product data must be added before target configuration
```

## Current Broken Flow

```
1. POST /session/create                    ✅ Works
2. POST /session/{id}/product              ❌ SKIPPED - NOT BEING CALLED
3. POST /session/{id}/audience-target      ❌ FAILS - Product not in session
4. POST /session/{id}/commit               ❌ Never reached
```

## Correct Required Flow

The Product Orchestrator requires **4 sequential API calls**:

### Step 1: Create Session
```bash
POST /private/products/orchestrate/session/create

Response:
{
  "sessionId": "91911023-073f-4814-8933-448d47cd8fb1",
  "state": "INITIATED",
  "createdAt": "2026-01-19T20:15:00Z"
}
```

### Step 2: Add Product Data ⚠️ **MISSING IN FRONTEND**

**This is the missing step that needs to be added!**

```bash
POST /private/products/orchestrate/session/{sessionId}/product
Content-Type: application/json

{
  "productCode": "osot-prd-001234",
  "productName": "Professional Development Course",
  "productCategory": "Training",
  "productStatus": "Active",
  "priceOntario": 299.99,
  "priceQuebec": 279.99,
  "priceStudent": 199.99,
  "priceOta": 249.99,
  "glCode": "5000-001",
  "hst": 0,
  "gst": 0,
  "qst": 0
}

Response:
{
  "sessionId": "91911023-073f-4814-8933-448d47cd8fb1",
  "state": "PRODUCT_ADDED",
  "product": {
    "productCode": "osot-prd-001234",
    "productName": "Professional Development Course",
    ...
  }
}
```

**Required Fields:**
- `productCode` - Format: `osot-prd-XXXXXX` (must be unique)
- `productName` - Display name (max 100 chars)
- `productCategory` - One of: `Membership`, `Insurance`, `Training`, `Other`
- `productStatus` - One of: `Active`, `Inactive`, `Draft`
- **At least ONE price field** (priceOntario, priceQuebec, priceStudent, priceOta)
- `glCode` - General Ledger code for accounting

**Validation Rules:**
- Product code must NOT already exist in Dataverse
- Price values must be between 0 and 999,999.99
- At least one price field must be > 0

### Step 3: Add Audience Target Configuration

```bash
POST /private/products/orchestrate/session/{sessionId}/audience-target
Content-Type: application/json

{
  "osot_account_group": [1, 2],
  "osot_location_province": [1, 3],
  "osot_employment_status": [1, 2]
}

Response:
{
  "sessionId": "91911023-073f-4814-8933-448d47cd8fb1",
  "state": "TARGET_CONFIGURED",
  "product": { ... },
  "audienceTarget": {
    "osot_account_group": [1, 2],
    "osot_location_province": [1, 3],
    ...
  }
}
```

**Important:**
- ⚠️ **DO NOT send** `osot_Table_Product@odata.bind` - it's auto-generated on commit
- All fields are optional (0-50 selections each)
- Null/undefined field = open-to-all for that criterion
- Example: If only `osot_location_province: [1]` is set, product visible to all users in Ontario regardless of other criteria

### Step 4: Commit Session

```bash
POST /private/products/orchestrate/session/{sessionId}/commit

Response:
{
  "success": true,
  "productGuid": "p1r2o3d4-u5c6-7890-abcd-product123456",
  "targetGuid": "t1a2r3g4-e5t6-7890-abcd-target1234567",
  "productCode": "osot-prd-001234",
  "operationId": "commit-91911023..."
}
```

## Frontend Implementation Checklist

### Files to Modify

1. **`useProductOrchestrator.ts`** or equivalent hook
   - [ ] Add `addProductData()` function
   - [ ] Call it BEFORE `addTarget()`
   - [ ] Wait for product data to be saved before proceeding

2. **`AudienceTargetForm.tsx`** or form component
   - [ ] Extract product data from form/state
   - [ ] Add Step 2 API call between steps
   - [ ] Show loading state for each step
   - [ ] Display errors for each step separately

### Suggested Implementation Pattern

```typescript
// useProductOrchestrator.ts

export const useProductOrchestrator = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Create session
  const createSession = async () => {
    try {
      setLoading(true);
      const response = await api.post('/private/products/orchestrate/session/create');
      setSessionId(response.data.sessionId);
      return response.data.sessionId;
    } catch (err) {
      setError('Failed to create session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Step 2: ADD PRODUCT DATA (NEW - MISSING CURRENTLY)
  const addProductData = async (sessionId: string, productData: CreateProductDto) => {
    try {
      setLoading(true);
      const response = await api.post(
        `/private/products/orchestrate/session/${sessionId}/product`,
        productData
      );
      return response.data;
    } catch (err) {
      setError('Failed to add product data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Add target
  const addTarget = async (sessionId: string, targetData: AddTargetToSessionDto) => {
    try {
      setLoading(true);
      const response = await api.post(
        `/private/products/orchestrate/session/${sessionId}/audience-target`,
        targetData
      );
      return response.data;
    } catch (err) {
      setError('Failed to add target configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Commit
  const commitSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await api.post(
        `/private/products/orchestrate/session/${sessionId}/commit`
      );
      return response.data;
    } catch (err) {
      setError('Failed to commit session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    sessionId,
    loading,
    error,
    createSession,
    addProductData,      // NEW
    addTarget,
    commitSession
  };
};
```

### Form Component Flow

```typescript
// AudienceTargetForm.tsx or similar

const handleSave = async () => {
  try {
    // Step 1: Create session (if not exists)
    if (!sessionId) {
      const newSessionId = await createSession();
    }

    // Step 2: Add product data (NEW - CRITICAL)
    await addProductData(sessionId, {
      productCode: formData.productCode,
      productName: formData.productName,
      productCategory: formData.productCategory,
      productStatus: formData.productStatus,
      priceOntario: formData.priceOntario,
      priceQuebec: formData.priceQuebec,
      priceStudent: formData.priceStudent,
      priceOta: formData.priceOta,
      glCode: formData.glCode,
      hst: 0,
      gst: 0,
      qst: 0
    });

    // Step 3: Add target configuration
    await addTarget(sessionId, {
      osot_account_group: targetData.accountGroup,
      osot_location_province: targetData.province,
      osot_employment_status: targetData.employmentStatus,
      // ... other target fields
    });

    // Step 4: Commit to Dataverse
    const result = await commitSession(sessionId);
    
    showSuccess(`Product created: ${result.productCode}`);
  } catch (err) {
    showError(`Product creation failed: ${err.message}`);
  }
};
```

## API Endpoints Summary

| Step | Method | Endpoint | Body | Response |
|------|--------|----------|------|----------|
| 1 | POST | `/private/products/orchestrate/session/create` | None | `{ sessionId }` |
| 2 | POST | `/private/products/orchestrate/session/{id}/product` | `CreateProductDto` | `{ sessionId, state, product }` |
| 3 | POST | `/private/products/orchestrate/session/{id}/audience-target` | `AddTargetToSessionDto` | `{ sessionId, state, audienceTarget }` |
| 4 | POST | `/private/products/orchestrate/session/{id}/commit` | None | `{ success, productGuid, targetGuid }` |

## Testing the Flow

### Manual API Test (Postman/Insomnia)

```bash
# 1. Create session
curl -X POST http://localhost:3000/private/products/orchestrate/session/create \
  -H "Authorization: Bearer {TOKEN}"

# Copy sessionId from response: 91911023-073f-4814-8933-448d47cd8fb1

# 2. Add product (MISSING STEP)
curl -X POST http://localhost:3000/private/products/orchestrate/session/91911023-073f-4814-8933-448d47cd8fb1/product \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "productCode": "osot-prd-001234",
    "productName": "Test Product",
    "productCategory": "Membership",
    "productStatus": "Active",
    "priceOntario": 99.99,
    "glCode": "1234"
  }'

# 3. Add target
curl -X POST http://localhost:3000/private/products/orchestrate/session/91911023-073f-4814-8933-448d47cd8fb1/audience-target \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "osot_account_group": [1, 2]
  }'

# 4. Commit
curl -X POST http://localhost:3000/private/products/orchestrate/session/91911023-073f-4814-8933-448d47cd8fb1/commit \
  -H "Authorization: Bearer {TOKEN}"
```

## Root Cause Analysis

**Current State (Broken):**
- Frontend form collects BOTH product data AND target data
- On save, frontend only calls Step 3 (audience-target endpoint)
- Step 2 (product data endpoint) is never called
- Backend validates that product exists in session → Fails

**Expected State (Fixed):**
- Frontend form collects BOTH product data AND target data
- On save, frontend calls Step 2 FIRST with product data
- Once Step 2 succeeds, frontend calls Step 3 with target data
- Only after both succeed, Step 4 (commit) is called

## Error Messages Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `Product data must be added before target configuration` | Step 2 not called before Step 3 | Call `/product` endpoint first |
| `Product code already exists` | Product code not unique | Generate unique code or check before submission |
| `At least one price field must be specified` | No prices entered | Provide at least one price field > 0 |
| `Invalid product code format` | Code doesn't match `osot-prd-XXXXXX` | Update code format |
| `Session not found` | Invalid or expired sessionId | Create new session |
| `Session expired` | Session > 2 hours old | Create new session |

## Migration Notes

**If upgrading from direct product creation (non-orchestrator):**

Old flow (still works):
```
POST /private/products → Creates product directly
```

New flow (with targeting):
```
POST /session/create → /session/{id}/product → /session/{id}/audience-target → /session/{id}/commit
```

Both flows exist simultaneously. Choose based on whether you need to configure audience targeting:
- **Direct creation**: Use old flow if targeting not needed
- **Orchestrator**: Use new flow if targeting needed BEFORE product creation

## Questions?

Contact: Backend Team / Bruno Amaral  
Backend Repo: `osot-dataverse-api-phantom`  
API Documentation: Swagger at `http://localhost:3000/api/docs`

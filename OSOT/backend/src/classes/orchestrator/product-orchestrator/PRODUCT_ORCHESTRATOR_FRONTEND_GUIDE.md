# Product Orchestrator - Frontend Integration Guide

**Last Updated**: January 20, 2026  
**Version**: 1.0  
**Status**: ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Why Use Orchestrator?](#why-use-orchestrator)
3. [Workflow Steps](#workflow-steps)
4. [API Endpoints](#api-endpoints)
5. [Request/Response Examples](#requestresponse-examples)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)
8. [UI/UX Recommendations](#uiux-recommendations)

---

## Overview

The **Product Orchestrator** provides a **4-step workflow** for creating products with pre-configured audience targeting. It uses **Redis-first validation** to ensure data quality before committing to Dataverse.

### Key Features

✅ **Redis-First Validation** - Validate all data before Dataverse commit  
✅ **Atomic Operations** - Product + Target created together or not at all  
✅ **Pre-Configured Targeting** - Set audience criteria BEFORE product creation  
✅ **Session-Based** - 2-hour TTL for draft products  
✅ **Retry Logic** - 3 automatic retries on commit failures  
✅ **Progress Tracking** - Real-time session state monitoring

---

## Why Use Orchestrator?

### ❌ Direct Creation (`POST /private/products`)

```typescript
// Step 1: Create product (with empty target = open-to-all)
const product = await api.post('/private/products', productData);

// Step 2: Update target later (requires separate PATCH)
await api.patch(`/private/products/${product.id}/target`, targetData);
```

**Problems:**
- Product is live immediately (even if targeting not ready)
- Two separate API calls (not atomic)
- Target is initially open-to-all (visibility issues)

### ✅ Orchestrator (`POST /private/products/orchestrate`)

```typescript
// Step 1: Create session
const session = await api.post('/private/products/orchestrate/session/create');

// Step 2: Add product data (validated in Redis)
await api.post(`/private/products/orchestrate/session/${session.sessionId}/product`, productData);

// Step 3: Configure target (validated in Redis)
await api.post(`/private/products/orchestrate/session/${session.sessionId}/audience-target`, targetData);

// Step 4: Commit atomically (product + target created together)
const result = await api.post(`/private/products/orchestrate/session/${session.sessionId}/commit`);
```

**Benefits:**
- ✅ Product + Target created together (atomic)
- ✅ Redis validation before Dataverse write
- ✅ Better UX (enable target tab from start)
- ✅ No intermediate "open-to-all" state

---

## Workflow Steps

### Step 1️⃣: Create Session

**Purpose:** Initialize workflow with 2-hour TTL

```http
POST /private/products/orchestrate/session/create
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "state": "initiated",
  "userId": "user123",
  "organizationGuid": "org-guid-xyz",
  "createdAt": "2026-01-20T10:00:00Z",
  "expiresAt": "2026-01-20T12:00:00Z"
}
```

**Frontend Action:**
- Store `sessionId` in component state
- Start 2-hour countdown timer
- Enable "Add Product" form

---

### Step 2️⃣: Add Product Data

**Purpose:** Submit product details for validation

```http
POST /private/products/orchestrate/session/{sessionId}/product
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "productCode": "OSOT-WORKSHOP-2026",
  "productName": "Advanced OT Workshop 2026",
  "productDescription": "Professional development workshop for OTs",
  "productCategory": 3,
  "productStatus": 1,
  "productGlCode": 16,
  "generalPrice": 199.99,
  "otStuPrice": 149.99,
  "inventory": 50,
  "taxes": 13,
  "shipping": 0,
  "productYear": "2026",
  "activeMembershipOnly": true,
  "postPurchaseInfo": "Workshop materials will be sent 1 week before event."
}
```

**Response:**
```json
{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "state": "product-added",
  "product": { ...productData },
  "updatedAt": "2026-01-20T10:05:00Z"
}
```

**Validation Errors:**
```json
{
  "statusCode": 400,
  "message": "Product validation failed",
  "errors": [
    "Product code must follow format: osot-prd-XXXXXX",
    "generalPrice must be between 0 and 999999.99"
  ],
  "operationId": "add-product-1705751400000"
}
```

**Frontend Action:**
- Show validation errors inline
- Enable "Configure Target" tab
- Show "Skip to Commit" button (target is optional)

---

### Step 3️⃣: Configure Audience Target (Optional)

**Purpose:** Set targeting criteria for product visibility

```http
POST /private/products/orchestrate/session/{sessionId}/audience-target
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Request Body (all fields optional):**
```json
{
  "osot_location_province": [1, 2],
  "osot_registration_class": [1],
  "osot_practice_area": [2, 5, 8],
  "osot_years_in_practice": [3, 4],
  "osot_employment_status": [1, 3],
  "osot_employment_sector": [2, 5]
}
```

**Targeting Logic:**
- **Omit field = null = open-to-all** for that criterion
- Example: Only `osot_location_province: [1,2]` → visible to Ontario/Quebec users (regardless of other fields)

**Response:**
```json
{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "state": "target-configured",
  "product": { ...productData },
  "audienceTarget": { ...targetData },
  "updatedAt": "2026-01-20T10:10:00Z"
}
```

**Frontend Action:**
- Enable "Commit" button
- Show preview of targeting criteria
- Allow editing (call Step 3 again to update)

---

### Step 4️⃣: Commit to Dataverse

**Purpose:** Create product + target atomically

```http
POST /private/products/orchestrate/session/{sessionId}/commit
Authorization: Bearer {jwt_token}
```

**Success Response:**
```json
{
  "success": true,
  "productGuid": "234e5678-f89b-12d3-a456-426614174111",
  "targetGuid": "345e6789-f89b-12d3-a456-426614174222",
  "productCode": "OSOT-WORKSHOP-2026",
  "operationId": "commit-product-1705751400000"
}
```

**Failure Response:**
```json
{
  "success": false,
  "errors": [
    "Failed to commit session after 3 attempts",
    "Product code OSOT-WORKSHOP-2026 already exists"
  ],
  "operationId": "commit-product-1705751400000"
}
```

**Frontend Action:**
- **On success:** Redirect to product detail page (`/products/{productGuid}`)
- **On failure:** Show error message, allow retry
- Clear `sessionId` from state

---

## API Endpoints

### Base URL
```
/private/products/orchestrate
```

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/session/create` | ✅ Admin | Create new session |
| `POST` | `/session/{id}/product` | ✅ Admin | Add product data |
| `POST` | `/session/{id}/audience-target` | ✅ Admin | Configure target (optional) |
| `POST` | `/session/{id}/commit` | ✅ Admin | Commit to Dataverse |
| `GET` | `/session/{id}/progress` | ✅ Admin | Get session progress |

**Authentication:** All endpoints require JWT token with `privilege: "admin"` or `privilege: "main"`

---

## Request/Response Examples

### TypeScript API Client

```typescript
import axios from 'axios';

interface ProductOrchestratorClient {
  createSession(): Promise<SessionResponse>;
  addProduct(sessionId: string, data: CreateProductDto): Promise<SessionResponse>;
  configureTarget(sessionId: string, data: TargetDto): Promise<SessionResponse>;
  commit(sessionId: string): Promise<CommitResponse>;
  getProgress(sessionId: string): Promise<ProgressResponse>;
}

class ProductOrchestrator implements ProductOrchestratorClient {
  private baseUrl = '/private/products/orchestrate';
  
  async createSession(): Promise<SessionResponse> {
    const { data } = await axios.post(`${this.baseUrl}/session/create`);
    return data;
  }
  
  async addProduct(sessionId: string, productData: CreateProductDto): Promise<SessionResponse> {
    const { data } = await axios.post(
      `${this.baseUrl}/session/${sessionId}/product`,
      productData
    );
    return data;
  }
  
  async configureTarget(sessionId: string, targetData: TargetDto): Promise<SessionResponse> {
    const { data } = await axios.post(
      `${this.baseUrl}/session/${sessionId}/audience-target`,
      targetData
    );
    return data;
  }
  
  async commit(sessionId: string): Promise<CommitResponse> {
    const { data } = await axios.post(
      `${this.baseUrl}/session/${sessionId}/commit`
    );
    return data;
  }
  
  async getProgress(sessionId: string): Promise<ProgressResponse> {
    const { data } = await axios.get(
      `${this.baseUrl}/session/${sessionId}/progress`
    );
    return data;
  }
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { ProductOrchestrator } from './api/product-orchestrator';

export const useProductCreation = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const orchestrator = new ProductOrchestrator();
  
  // Step 1: Create session
  const startSession = async () => {
    try {
      setState('creating');
      const session = await orchestrator.createSession();
      setSessionId(session.sessionId);
      return session;
    } catch (err) {
      setError(err.message);
      setState('error');
      throw err;
    }
  };
  
  // Step 2: Add product
  const addProduct = async (productData: CreateProductDto) => {
    if (!sessionId) throw new Error('No active session');
    
    try {
      const session = await orchestrator.addProduct(sessionId, productData);
      return session;
    } catch (err) {
      setError(err.message);
      setState('error');
      throw err;
    }
  };
  
  // Step 3: Configure target
  const configureTarget = async (targetData: TargetDto) => {
    if (!sessionId) throw new Error('No active session');
    
    try {
      const session = await orchestrator.configureTarget(sessionId, targetData);
      return session;
    } catch (err) {
      setError(err.message);
      setState('error');
      throw err;
    }
  };
  
  // Step 4: Commit
  const commit = async () => {
    if (!sessionId) throw new Error('No active session');
    
    try {
      const result = await orchestrator.commit(sessionId);
      
      if (result.success) {
        setState('success');
        return result;
      } else {
        setError(result.errors.join('; '));
        setState('error');
        throw new Error(result.errors.join('; '));
      }
    } catch (err) {
      setError(err.message);
      setState('error');
      throw err;
    }
  };
  
  // Auto-refresh progress
  useEffect(() => {
    if (!sessionId) return;
    
    const interval = setInterval(async () => {
      try {
        await orchestrator.getProgress(sessionId);
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [sessionId]);
  
  return {
    sessionId,
    state,
    error,
    startSession,
    addProduct,
    configureTarget,
    commit
  };
};
```

---

## State Management

### Session States

| State | Description | Next Valid States | Frontend Action |
|-------|-------------|-------------------|-----------------|
| `initiated` | Session created | `product-added` | Enable "Add Product" form |
| `product-added` | Product data validated | `target-configured`, `committed` | Enable "Configure Target" OR "Commit" |
| `target-configured` | Target configured | `committed` | Enable "Commit" button |
| `committed` | Successfully committed | N/A | Redirect to product page |
| `failed` | Commit failed | N/A | Show error, allow retry |

### State Transition Diagram

```
initiated
   │
   ├─→ addProduct() ──→ product-added
                            │
                            ├─→ configureTarget() ──→ target-configured
                            │                              │
                            └──────────────────────────────┴─→ commit() ──→ committed
                                                                              or failed
```

---

## Error Handling

### Common Errors

#### 400 Bad Request - Validation Failed
```json
{
  "statusCode": 400,
  "message": "Product validation failed",
  "errors": [
    "productCode must match format osot-prd-XXXXXX",
    "generalPrice must be between 0 and 999999.99"
  ]
}
```

**Frontend Action:**
- Show errors inline near input fields
- Highlight invalid fields in red
- Allow user to fix and retry

---

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Frontend Action:**
- Redirect to login page
- Clear session state

---

#### 403 Forbidden - Insufficient Privileges
```json
{
  "statusCode": 403,
  "message": "Only Admin users can create products"
}
```

**Frontend Action:**
- Show "Access Denied" message
- Hide "Create Product" button for non-admin users

---

#### 404 Not Found - Session Expired
```json
{
  "statusCode": 404,
  "message": "Session not found or expired",
  "sessionId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Frontend Action:**
- Show "Session expired" message
- Offer to create new session
- Clear stale `sessionId` from state

---

#### 409 Conflict - Product Code Exists
```json
{
  "statusCode": 409,
  "message": "Product code OSOT-WORKSHOP-2026 already exists",
  "operationId": "add-product-1705751400000"
}
```

**Frontend Action:**
- Highlight `productCode` field
- Suggest alternative code (e.g., append year or suffix)

---

#### 500 Internal Server Error - Commit Failed
```json
{
  "success": false,
  "errors": [
    "Failed to commit session after 3 attempts",
    "Connection timeout to Dataverse"
  ],
  "operationId": "commit-product-1705751400000"
}
```

**Frontend Action:**
- Show "Retry" button
- Log error to monitoring service
- Contact support if issue persists

---

## UI/UX Recommendations

### Stepper Component

```tsx
<Stepper activeStep={currentStep}>
  <Step label="Create Session" completed={sessionId !== null} />
  <Step label="Add Product" completed={state === 'product-added'} />
  <Step label="Configure Target (Optional)" completed={state === 'target-configured'} />
  <Step label="Commit" completed={state === 'committed'} />
</Stepper>
```

### Session Expiration Timer

```tsx
<Typography>
  Session expires in: {formatTimeRemaining(expiresAt)}
</Typography>
```

**Warning at 15 minutes remaining:**
```tsx
{timeRemaining < 15 * 60 && (
  <Alert severity="warning">
    ⚠️ Session expires soon! Save your progress.
  </Alert>
)}
```

### Progress Tracking

```tsx
<LinearProgress 
  variant="determinate" 
  value={getProgressPercentage(state)} 
/>
```

Progress mapping:
- `initiated`: 25%
- `product-added`: 50%
- `target-configured`: 75%
- `committed`: 100%

### Target Configuration Preview

```tsx
{targetData && (
  <Card>
    <CardContent>
      <Typography variant="h6">Targeting Preview</Typography>
      <Chip label={`${targetData.osot_location_province?.length || 0} Provinces`} />
      <Chip label={`${targetData.osot_practice_area?.length || 0} Practice Areas`} />
      {/* ... more chips */}
    </CardContent>
  </Card>
)}
```

### Commit Confirmation Dialog

```tsx
<Dialog open={showConfirm}>
  <DialogTitle>Confirm Product Creation</DialogTitle>
  <DialogContent>
    <Typography>Product: {productData.productName}</Typography>
    <Typography>Target: {targetSummary}</Typography>
    <Typography color="warning">
      This will create the product in Dataverse. Continue?
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCancel}>Cancel</Button>
    <Button onClick={handleCommit} variant="contained">
      Create Product
    </Button>
  </DialogActions>
</Dialog>
```

---

## Comparison: Direct Creation vs Orchestrator

| Feature | Direct Creation | Orchestrator |
|---------|----------------|--------------|
| **API Calls** | 2 (POST product → PATCH target) | 4 (session → product → target → commit) |
| **Atomic** | ❌ No | ✅ Yes |
| **Redis Validation** | ❌ No | ✅ Yes |
| **Pre-Configured Target** | ❌ No | ✅ Yes |
| **Retry Logic** | ❌ Manual | ✅ Automatic (3 attempts) |
| **Session TTL** | N/A | 2 hours |
| **Use Case** | Quick products | Production-critical products |

**Recommendation:**
- Use **Direct Creation** for quick internal tests
- Use **Orchestrator** for production products with targeting

---

## Testing Checklist

### Step 1: Session Creation
- [ ] Session created with valid JWT
- [ ] `sessionId` returned
- [ ] `expiresAt` is 2 hours from now
- [ ] 401 error for missing JWT
- [ ] 403 error for non-admin user

### Step 2: Add Product
- [ ] Valid product data accepted
- [ ] Validation errors shown for invalid data
- [ ] Product code uniqueness checked
- [ ] 404 error for expired/invalid session

### Step 3: Configure Target
- [ ] Target data accepted (all fields optional)
- [ ] 400 error if product not added yet
- [ ] Can update target by calling Step 3 again

### Step 4: Commit
- [ ] Product + Target created in Dataverse
- [ ] `productGuid` and `targetGuid` returned
- [ ] Retry logic works (test by simulating failures)
- [ ] Session cleaned up after 5 seconds
- [ ] Failed session marked as `failed` state

### Progress Tracking
- [ ] Progress updates correctly after each step
- [ ] `canCommit` flag accurate
- [ ] Session expiration handled gracefully

---

## Troubleshooting

### Issue: Session Not Found
**Symptoms:** 404 error when calling any endpoint  
**Cause:** Session expired (2 hours) or invalid `sessionId`  
**Solution:** Create new session, implement session expiration warnings

### Issue: Commit Fails Repeatedly
**Symptoms:** `success: false` with retry errors  
**Cause:** Dataverse connectivity, validation failures, or data conflicts  
**Solution:** Check backend logs, verify data against validation rules

### Issue: Product Code Conflict
**Symptoms:** 409 error during Step 2  
**Cause:** Product code already exists in Dataverse  
**Solution:** Generate unique code (append timestamp or UUID suffix)

### Issue: Target Not Created
**Symptoms:** Product created but target missing  
**Cause:** Target validation failure after product commit  
**Solution:** Backend has rollback logic, but check audit logs

---

## Related Documentation

- [Product Entity Frontend Guide](../product/PRODUCT_FRONTEND_INTEGRATION_GUIDE.md)
- [Audience Target Frontend Guide](../audience-target/FRONTEND_PRODUCT_TARGET_INTEGRATION.md)
- [Error Handling Guide](../../../docs/ERROR_HANDLING_FRONTEND_GUIDE.md)

---

## Support

For issues or questions:
- Backend logs: Check `ProductOrchestratorService` and `ProductCrudService` logs
- Redis: Inspect session keys: `product-orchestrator:session:{sessionId}`
- Dataverse: Check `osot_table_product` and `osot_table_audience_target` tables

---

**End of Guide** 🎉

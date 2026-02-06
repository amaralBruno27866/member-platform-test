# Product Orchestrator - Debug Guide

**Issue:** Frontend attempting to add audience target WITHOUT first adding product data  
**Error:** "Product data must be added before target configuration"  
**Status:** Backend fix verified, Frontend needs confirmation

## The Problem

The logs show:
```
[Nest] 33784  - 01/19/2026, 2:24:54 PM LOG [ProductOrchestratorService] 
  Created product orchestrator session d5d6eba8-91f2-4a81-b0da-8eea0f66f2f3

[Nest] 33784  - 01/19/2026, 2:25:59 PM LOG [ProductOrchestratorService] 
  Adding target configuration to session d5d6eba8-91f2-4a81-b0da-8eea0f66f2f3

[Nest] 33784  - 01/19/2026, 2:25:59 PM ERROR [HttpExceptionFilter]
  Object(2) {
    status: 400,
    body: {
      message: 'Product data must be added before target configuration',
      operationId: 'add-target-d5d6eba8-91f2-4a81-b0da-8eea0f66f2f3-1768850759101'
    }
  }
```

**Notice:** Session created at 2:24:54, but next action is "Adding target" at 2:25:59.  
**Missing:** No log line saying "Added product data to session"!

This means:
1. ✅ Step 1 was called: `POST /session/create` 
2. ❌ **Step 2 was NOT called**: `POST /session/{id}/product` is missing
3. ❌ Step 3 was attempted: `POST /session/{id}/audience-target` but failed because Step 2 wasn't done

## What We've Added: Enhanced Debugging

Backend has been updated with detailed debug logging that will show:

**When Step 2 IS called correctly:**
```
[ProductOrchestratorService] Added product data to session d5d6eba8-91f2-4a81-b0da-8eea0f66f2f3 - Code: osot-prd-123456
[ProductOrchestratorRepository] Retrieved session d5d6eba8-91f2-4a81-b0da-8eea0f66f2f3 from Redis: state=PRODUCT_ADDED, has_product=true
[ProductOrchestratorRepository] Product data in session: {"productCode":"osot-prd-123456","productName":"..."}
```

**When Step 2 is NOT called (current issue):**
```
[ProductOrchestratorRepository] Retrieved session d5d6eba8-91f2-4a81-b0da-8eea0f66f2f3 from Redis: state=INITIATED, has_product=false
[ProductOrchestratorService] Validation failed for session d5d6eba8-91f2-4a81-b0da-8eea0f66f2f3: Product data missing. Session keys: [...]
```

## How to Verify Frontend Issue

### Option 1: Browser DevTools (Recommended)

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Create a new product:
   - Fill in product details
   - Click "Save Details"
   - Look for these requests in order:
     1. ✅ `POST .../session/create` → Response: `sessionId`
     2. ❌ `POST .../session/{id}/product` → **This should appear but is missing**
     3. Navigate to "Audience Targeting" tab
     4. Click "Save Targeting"
     5. ❌ `POST .../session/{id}/audience-target` → This fails with 400

**If you don't see request #2, the frontend is not calling the product endpoint.**

### Option 2: Manual Test with cURL

Save this as `test-orchestrator.sh`:

```bash
#!/bin/bash

# Get your JWT token first (login with valid credentials)
TOKEN="your-jwt-token-here"
SESSION_ID=""
PRODUCT_CODE="osot-prd-$(date +%s)"

echo "🚀 Testing Product Orchestrator Workflow"
echo ""

# Step 1: Create session
echo "Step 1: Creating session..."
RESPONSE=$(curl -s -X POST http://localhost:3000/private/products/orchestrate/session/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

SESSION_ID=$(echo $RESPONSE | jq -r '.sessionId')
echo "✅ Session created: $SESSION_ID"
echo ""

# Step 2: Add product data (THIS IS CRITICAL)
echo "Step 2: Adding product data..."
RESPONSE=$(curl -s -X POST http://localhost:3000/private/products/orchestrate/session/$SESSION_ID/product \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productCode\": \"$PRODUCT_CODE\",
    \"productName\": \"Test Product\",
    \"productCategory\": \"Training\",
    \"productStatus\": \"Active\",
    \"priceOntario\": 299.99,
    \"glCode\": \"5000-001\"
  }")

echo "Response: $RESPONSE"
HAS_PRODUCT=$(echo $RESPONSE | jq -r '.product // empty')
if [ -z "$HAS_PRODUCT" ]; then
  echo "❌ Product NOT in response!"
  exit 1
fi
echo "✅ Product added"
echo ""

# Step 3: Add target
echo "Step 3: Adding target configuration..."
RESPONSE=$(curl -s -X POST http://localhost:3000/private/products/orchestrate/session/$SESSION_ID/audience-target \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"osot_account_group\": [1, 2],
    \"osot_location_province\": [1]
  }")

echo "Response: $RESPONSE"
STATE=$(echo $RESPONSE | jq -r '.state')
if [ "$STATE" == "TARGET_CONFIGURED" ]; then
  echo "✅ Target configured"
else
  echo "❌ Target configuration failed"
  exit 1
fi
echo ""

# Step 4: Commit
echo "Step 4: Committing session..."
RESPONSE=$(curl -s -X POST http://localhost:3000/private/products/orchestrate/session/$SESSION_ID/commit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $RESPONSE"
SUCCESS=$(echo $RESPONSE | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  echo "✅ Product created successfully!"
else
  echo "❌ Commit failed"
  exit 1
fi
```

Run it:
```bash
chmod +x test-orchestrator.sh
./test-orchestrator.sh
```

## Checklist for Frontend Team

### Verify useProductOrchestrator Hook

```typescript
// ✅ CORRECT: Should have 4 functions
export const useProductOrchestrator = () => {
  const createSession = async () => { ... };
  const addProductData = async (sessionId, productData) => { ... };  // ← CRITICAL
  const addTarget = async (sessionId, targetData) => { ... };
  const commitSession = async (sessionId) => { ... };
  
  return {
    createSession,
    addProductData,    // ← Should be exported
    addTarget,
    commitSession,
    // ... other state
  };
};
```

### Verify Form Submission Order

```typescript
// ✅ CORRECT ORDER
const handleProductSave = async (formData) => {
  // 1. Create session if not exists
  if (!sessionId) {
    await createSession();
  }
  
  // 2. Add product data FIRST
  await addProductData(sessionId, {
    productCode: formData.productCode,
    productName: formData.productName,
    productCategory: formData.productCategory,
    productStatus: formData.productStatus,
    priceOntario: formData.priceOntario,
    // ... other product fields
  });
  
  // Show success message
  toast.success("Product details saved");
};

// ❌ WRONG: Calling target before product
const handleTargetSave = async (formData) => {
  // This should be protected:
  if (orchestrator?.session?.state === 'INITIATED') {
    toast.error('Save product details first');
    return;
  }
  
  // Only then add target
  await addTarget(sessionId, { ... });
};
```

## Backend Debug Output Examples

### What To Look For in Terminal Logs

**Good Scenario (All 4 steps):**
```
[ProductOrchestratorService] Created product orchestrator session abc-123
[ProductOrchestratorService] Adding product data to session abc-123
[ProductOrchestratorRepository] Retrieved session abc-123 from Redis: state=INITIATED, has_product=false
[ProductOrchestratorService] Added product data to session abc-123 - Code: osot-prd-123456
[ProductOrchestratorRepository] Product data in session: {"productCode":"osot-prd-123456",...}
[ProductOrchestratorService] Adding target configuration to session abc-123
[ProductOrchestratorRepository] Retrieved session abc-123 from Redis: state=PRODUCT_ADDED, has_product=true
[ProductOrchestratorRepository] Product data in session: {"productCode":"osot-prd-123456",...}
[ProductOrchestratorService] Audience target configuration added
[ProductOrchestratorService] Committing session abc-123
[ProductOrchestratorService] Product created successfully in Dataverse
```

**Bad Scenario (Missing Step 2):**
```
[ProductOrchestratorService] Created product orchestrator session abc-123
[ProductOrchestratorService] Adding target configuration to session abc-123  ← JUMP TO STEP 3!
[ProductOrchestratorRepository] Retrieved session abc-123 from Redis: state=INITIATED, has_product=false
[ProductOrchestratorService] Validation failed for session abc-123: Product data missing
[HttpExceptionFilter] Object(2) {status: 400, message: 'Product data must be added before target configuration'}
```

## Questions?

1. **When did the frontend fix get deployed?** - Restart required?
2. **Is the frontend code using the updated useProductOrchestrator hook?**
3. **Can you share the exact frontend code for form submission?**
4. **Can you run the manual cURL test and share the output?**
5. **Check browser Network tab - are you seeing 2 POST requests or just 1?**

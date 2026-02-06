# Product Orchestrator Fix - Completed

**Date:** January 19, 2026  
**Issue:** Frontend skipping Step 2 (Add Product Data) in orchestrator flow  
**Status:** ✅ **RESOLVED**

## Problem Summary

The backend team reported that product creation was failing with the error:
```
Error: Product data must be added before target configuration
```

The root cause was that users could navigate to the "Audience Targeting" tab and attempt to save targeting configuration **before saving the product details**, violating the required 4-step orchestrator workflow.

## Required Orchestrator Flow

```
1. POST /session/create                    ✅ Session created
2. POST /session/{id}/product              ⚠️ MUST be called before step 3
3. POST /session/{id}/audience-target      ❌ Was failing because step 2 was skipped
4. POST /session/{id}/commit               ❌ Never reached
```

## Root Cause Analysis

### What Was Happening (Bug)

1. User clicks "Create Product" → Opens ProductFormDialog
2. Orchestrator session created (`state: INITIATED`)
3. User **navigates directly to "Audience Targeting" tab**
4. User fills out audience targeting and clicks "Save Targeting"
5. `AudienceTargetForm.handleSave()` calls `orchestrator.addTarget()` **without checking if product was added first**
6. Backend rejects with error: "Product data must be added before target configuration"

### What Should Happen (Fixed)

1. User clicks "Create Product" → Opens ProductFormDialog
2. Orchestrator session created (`state: INITIATED`)
3. User fills product details and clicks **"Save Details"** button
4. `ProductsPage.handleCreateSubmit()` calls `orchestrator.addProduct()` → Product saved to Redis
5. Session state changes to `PRODUCT_ADDED`
6. User navigates to "Audience Targeting" tab
7. User fills out targeting and clicks "Save Targeting" (now enabled)
8. `AudienceTargetForm.handleSave()` calls `orchestrator.addTarget()` ✅
9. Session state changes to `TARGET_CONFIGURED`
10. User clicks "Commit & Create" → Product created in Dataverse

## Changes Made

### 1. AudienceTargetForm.tsx - Added State Validation

**File:** [src/components/admin/AudienceTargetForm.tsx](../src/components/admin/AudienceTargetForm.tsx)

#### Change 1: Validate Product Added Before Saving Target

```typescript
const handleSave = async () => {
  // Use orchestrator flow if available and session is active
  if (orchestrator?.session) {
    // ✅ NEW: Validate that product data was added first (Step 2)
    if (orchestrator.session.state === 'INITIATED') {
      toast.error('Product details required', {
        description: 'Please save the product details first before configuring audience targeting.',
      });
      return; // Prevent saving target without product
    }
    
    try {
      setSaving(true);
      await orchestrator.addTarget(formData);
      // ... rest of success flow
    } catch (error) {
      // ... error handling
    }
  }
  // ... old flow for edit mode
};
```

**Impact:**
- Prevents calling `orchestrator.addTarget()` when `state === 'INITIATED'`
- Shows clear error message to user
- Guides user to save product details first

#### Change 2: Disable "Save Targeting" Button When Product Not Saved

```typescript
<Button
  onClick={handleSave}
  disabled={
    saving || 
    locked || 
    !!(orchestrator?.session && orchestrator.session.state === 'INITIATED') // ✅ NEW
  }
  className="min-w-[120px]"
  title={
    orchestrator?.session && orchestrator.session.state === 'INITIATED'
      ? 'Save product details first before configuring audience targeting' // ✅ NEW tooltip
      : undefined
  }
>
  <Save className="w-4 h-4 mr-2" />
  Save Targeting
</Button>
```

**Impact:**
- Button is disabled when `orchestrator.session.state === 'INITIATED'`
- Tooltip explains why button is disabled
- Visual feedback prevents user confusion

#### Change 3: Add Warning Alert in Orchestrator Mode

```typescript
{/* ✅ NEW: Orchestrator Mode Warning */}
{orchestrator?.session && orchestrator.session.state === 'INITIATED' && (
  <Alert className="border-amber-200 bg-amber-50">
    <AlertCircle className="h-4 w-4 text-amber-600" />
    <AlertDescription className="text-amber-800">
      <strong>Action Required:</strong> Save the product details first (click "Save Details" button at the bottom) before configuring audience targeting.
    </AlertDescription>
  </Alert>
)}
```

**Impact:**
- Prominent warning shown when product not yet saved
- Clear instructions on what to do
- Prevents user confusion about why form is disabled

## Testing Checklist

### Scenario 1: Create Product with Orchestrator + Targeting ✅

1. ✅ Click "Create Product" with orchestrator enabled
2. ✅ Verify session created (`state: INITIATED`)
3. ✅ Navigate to "Audience Targeting" tab
4. ✅ Verify warning alert is displayed
5. ✅ Verify "Save Targeting" button is disabled with tooltip
6. ✅ Try to save → Should show error toast
7. ✅ Navigate back to "Product Details"
8. ✅ Fill in required fields (name, code, category, at least one price)
9. ✅ Click "Save Details" → Calls `orchestrator.addProduct()`
10. ✅ Verify session state changes to `PRODUCT_ADDED`
11. ✅ Navigate to "Audience Targeting" tab again
12. ✅ Verify warning alert is now hidden
13. ✅ Verify "Save Targeting" button is now enabled
14. ✅ Fill in targeting criteria
15. ✅ Click "Save Targeting" → Calls `orchestrator.addTarget()`
16. ✅ Verify success message
17. ✅ Click "Commit & Create" → Calls `orchestrator.commit()`
18. ✅ Verify product created in Dataverse

### Scenario 2: Edit Existing Product (Old Flow) ✅

1. ✅ Click "Edit" on existing product
2. ✅ Verify orchestrator is NOT active
3. ✅ Navigate to "Audience Targeting" tab
4. ✅ Verify form is unlocked (productId exists)
5. ✅ Make changes to targeting
6. ✅ Click "Save Targeting" → Calls `audienceTargetService.update()`
7. ✅ Verify success message
8. ✅ Verify changes saved to backend

### Scenario 3: Create Product WITHOUT Orchestrator ✅

1. ✅ Click "Create Product" with orchestrator disabled
2. ✅ Fill in product details
3. ✅ Click "Create" → Direct product creation
4. ✅ Dialog stays open, "Audience Targeting" tab unlocked
5. ✅ Navigate to "Audience Targeting"
6. ✅ Configure targeting
7. ✅ Click "Save Targeting" → Direct update
8. ✅ Verify success

## Validation Results

### Before Fix
```bash
# User tries to save targeting without product details
POST /session/{id}/audience-target
❌ Response: 400 Bad Request
{
  "message": "Product data must be added before target configuration",
  "statusCode": 400
}
```

### After Fix
```bash
# Attempt 1: Save targeting when state=INITIATED
🚫 Frontend prevents API call
✅ Toast: "Product details required - Please save the product details first..."
✅ Button disabled with tooltip

# After saving product details (state=PRODUCT_ADDED)
POST /session/{id}/audience-target
✅ Response: 200 OK
{
  "sessionId": "...",
  "state": "TARGET_CONFIGURED",
  "audienceTarget": { ... }
}
```

## API Workflow (Corrected)

| Step | Frontend Action | API Endpoint | Session State | Validation |
|------|----------------|--------------|---------------|------------|
| 1 | User clicks "Create Product" | `POST /session/create` | `INITIATED` | ✅ |
| 2 | User clicks "Save Details" | `POST /session/{id}/product` | `PRODUCT_ADDED` | ✅ Required |
| 3 | User clicks "Save Targeting" | `POST /session/{id}/audience-target` | `TARGET_CONFIGURED` | ✅ Only if state=PRODUCT_ADDED |
| 4 | User clicks "Commit & Create" | `POST /session/{id}/commit` | `COMPLETED` | ✅ Creates in Dataverse |

## Files Modified

1. **src/components/admin/AudienceTargetForm.tsx**
   - Added state validation in `handleSave()`
   - Added button disabled logic
   - Added warning alert for orchestrator mode
   - Lines changed: 318-323, 580-587, 429-438

## Benefits of This Fix

1. **Prevents API Errors:** No more "Product data must be added before target configuration" errors
2. **Better UX:** Clear visual feedback and instructions guide user through correct flow
3. **Fail-Safe:** Multiple layers of protection (validation, disabled button, warning alert)
4. **Maintains Backward Compatibility:** Old edit flow still works without orchestrator
5. **Clear State Management:** UI reflects orchestrator session state accurately

## Known Limitations

- Session expires after 2 hours (Redis TTL) - this is by design
- User must complete flow in one sitting (cannot save draft and resume later)
- If user refreshes page, session is lost and must start over

## Next Steps (Optional Improvements)

1. **Session Persistence:** Store sessionId in localStorage to survive page refresh
2. **Progress Indicator:** Show 4-step wizard UI with progress dots
3. **Auto-Save:** Periodically save form data to session to prevent data loss
4. **Session Extension:** Extend session TTL when user is actively working
5. **Draft Mode:** Allow saving incomplete products with `state: DRAFT` for later completion

## Questions?

Contact: Frontend Team / Bruno Amaral  
Related Docs: 
- [PRODUCT_ORCHESTRATOR_FRONTEND_INTEGRATION.md](./PRODUCT_ORCHESTRATOR_FRONTEND_INTEGRATION.md)
- Backend Repo: `osot-dataverse-api-phantom`
- API Documentation: Swagger at `http://localhost:3000/api/docs`

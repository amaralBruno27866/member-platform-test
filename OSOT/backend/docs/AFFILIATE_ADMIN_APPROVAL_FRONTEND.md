# Affiliate Admin Approval - Frontend Implementation Requirements

## Overview
The admin approval workflow for affiliate registration requires the frontend to properly extract the token from the email link and include it in the API request.

## Current Issue

### Error Observed
```
[MIDDLEWARE DEBUG] Received body: {"action":"approve","reason":""}
[Nest] Manager approve for affiliate token: approve_...
ERROR: A record with matching key values already exists. (Code: 0x80040237)
```

### Root Cause Analysis
The frontend is sending the request but may not be including the token correctly in the URL path, or there may be duplicate submission attempts.

## Email Link Structure

The admin receives an email with approval/rejection buttons:

**Approve Button:**
```
{{frontendUrl}}/admin/approve-affiliate/{{approveToken}}
```

**Reject Button:**
```
{{frontendUrl}}/admin/reject-affiliate/{{rejectToken}}
```

**Example URLs:**
```
http://localhost:5173/admin/approve-affiliate/approve_aff_1764707831555_0c732d2a78142b8d_1764707866000
http://localhost:5173/admin/reject-affiliate/reject_aff_1764707831555_0c732d2a78142b8d_1764707866000
```

## Frontend Implementation Required

### 1. Routes

Create two frontend routes:

```javascript
// Route 1: Approve
/admin/approve-affiliate/:token

// Route 2: Reject  
/admin/reject-affiliate/:token
```

### 2. Page Flow

When admin clicks the button in email:

**Step 1:** Browser opens frontend page
- Approve: `http://localhost:5173/admin/approve-affiliate/{TOKEN}`
- Reject: `http://localhost:5173/admin/reject-affiliate/{TOKEN}`

**Step 2:** Frontend extracts token from URL
```javascript
// Example using React Router
import { useParams } from 'react-router-dom';

function ApproveAffiliatePage() {
  const { token } = useParams(); // Extract token from URL
  const [reason, setReason] = useState('');
  
  // token = "approve_aff_1764707831555_0c732d2a78142b8d_1764707866000"
}
```

**Step 3:** Display confirmation form
- Show affiliate information (optional - can be fetched or displayed statically)
- Show text input for approval/rejection reason (optional)
- Show "Confirm Approval" or "Confirm Rejection" button

**Step 4:** When admin clicks confirm button, make POST request

### 3. API Request Structure

**Endpoint:**
```
POST http://192.168.10.61:3000/public/affiliates/approve/{TOKEN}
```

**⚠️ CRITICAL:** The token MUST be in the URL path, not in the request body!

**Request Example (Approve):**
```javascript
const token = "approve_aff_1764707831555_0c732d2a78142b8d_1764707866000";
const reason = "Organization meets all requirements";

// CORRECT - Token in URL path
await axios.post(
  `http://192.168.10.61:3000/public/affiliates/approve/${token}`,
  {
    action: "approve",
    reason: reason  // Optional
  }
);
```

**Request Example (Reject):**
```javascript
const token = "reject_aff_1764707831555_0c732d2a78142b8d_1764707866000";
const reason = "Insufficient documentation provided";

// CORRECT - Token in URL path
await axios.post(
  `http://192.168.10.61:3000/public/affiliates/approve/${token}`,
  {
    action: "reject",
    reason: reason  // Optional
  }
);
```

### 4. Request Body Schema

```typescript
{
  "action": "approve" | "reject",  // Required
  "reason": string                 // Optional - admin's explanation
}
```

**Validation Rules:**
- `action`: Must be exactly "approve" or "reject" (lowercase)
- `reason`: String, optional, can be empty string

### 5. Complete Implementation Example

```javascript
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

function ApproveAffiliatePage() {
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine action from URL path
  const isApproval = window.location.pathname.includes('/approve-affiliate/');
  const action = isApproval ? 'approve' : 'reject';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `http://192.168.10.61:3000/public/affiliates/approve/${token}`,
        {
          action: action,
          reason: reason || ''
        }
      );

      // Success response:
      // {
      //   "success": true,
      //   "message": "Affiliate registration approved successfully",
      //   "sessionId": "aff_...",
      //   "affiliateId": "c2816cb2-becf-f011-8544-7ced8da79325",
      //   "status": "completed"
      // }

      // Show success message and redirect
      alert(`Affiliate ${action}d successfully!`);
      navigate('/admin/dashboard'); // Or wherever admin should go

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process approval');
      console.error('Approval error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{isApproval ? 'Approve' : 'Reject'} Affiliate Registration</h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Reason (optional):</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter your reason for this decision..."
            rows={4}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : `Confirm ${isApproval ? 'Approval' : 'Rejection'}`}
        </button>
      </form>
    </div>
  );
}

export default ApproveAffiliatePage;
```

### 6. Expected Backend Responses

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Affiliate registration approved successfully",
  "sessionId": "aff_1764707831555_0c732d2a78142b8d",
  "affiliateId": "c2816cb2-becf-f011-8544-7ced8da79325",
  "status": "completed",
  "action": "approve",
  "processedBy": "admin-user-id",
  "reason": "Organization meets all requirements",
  "processedAt": "2025-12-02T20:37:46.000Z"
}
```

**Error - Invalid Token (404):**
```json
{
  "statusCode": 404,
  "message": "Invalid or expired approval token",
  "error": "Not Found"
}
```

**Error - Already Processed (400):**
```json
{
  "statusCode": 400,
  "message": "Approval not available for status: completed",
  "error": "Bad Request"
}
```

**Error - Duplicate Key (412):**
```json
{
  "statusCode": 400,
  "message": "Approval processing failed",
  "error": "Bad Request"
}
```

### 7. Important Notes

**⚠️ Token in URL Path, NOT Body**
```javascript
// ❌ WRONG - Token in body
await axios.post('/public/affiliates/approve', {
  token: token,
  action: "approve"
});

// ✅ CORRECT - Token in URL path
await axios.post(`/public/affiliates/approve/${token}`, {
  action: "approve"
});
```

**⚠️ One-Time Use Token**
- Each token can only be used **once**
- After successful approval/rejection, the token becomes invalid
- Do NOT allow users to submit multiple times
- Disable the submit button after first click

**⚠️ Token Expiration**
- Tokens expire in **7 days** (configurable)
- Show appropriate error message for expired tokens
- Suggest admin contact support if token expired

### 8. User Experience Recommendations

**Loading State:**
- Show loading spinner while processing
- Disable submit button to prevent double-submission
- Show "Processing..." text

**Success State:**
- Show success message clearly
- Provide next action (e.g., "Return to Dashboard")
- Optionally show affiliate details that were approved/rejected

**Error State:**
- Show user-friendly error messages
- For expired tokens: "This approval link has expired. Please contact support."
- For invalid tokens: "This approval link is invalid. Please check your email."
- For duplicate submissions: "This affiliate has already been processed."

### 9. Testing Checklist

- [ ] Frontend route `/admin/approve-affiliate/:token` exists
- [ ] Frontend route `/admin/reject-affiliate/:token` exists
- [ ] Token is correctly extracted from URL using router params
- [ ] POST request includes token in URL path (not body)
- [ ] POST body contains `action` field with correct value
- [ ] POST body contains `reason` field (can be empty string)
- [ ] Submit button is disabled after first click
- [ ] Success response shows appropriate message to admin
- [ ] Error responses are handled gracefully
- [ ] Backend logs show the token being received correctly

### 10. Current Backend Expectation

The backend controller is defined as:

```typescript
@Post('approve/:token')
async approveRegistration(
  @Param('token') token: string,      // ← Token from URL path
  @Body() dto: AffiliateAdminApprovalDto,  // ← { action, reason }
)
```

This means:
- **URL:** `/public/affiliates/approve/{TOKEN}` ← Token here
- **Body:** `{ "action": "approve", "reason": "..." }` ← No token here

### 11. Comparison with Account Approval

If you already have Account (OT/OTA) approval working, the **exact same pattern** should work for Affiliate:

| Aspect | Account Approval | Affiliate Approval |
|--------|------------------|-------------------|
| Email Button URL | `/admin/approve-account/{token}` | `/admin/approve-affiliate/{token}` |
| Backend Endpoint | `POST /public/orchestrator/admin/approve/{token}` | `POST /public/affiliates/approve/{token}` |
| Request Body | `{ action, reason }` | `{ action, reason }` |
| Token Location | URL path parameter | URL path parameter |
| Response Format | `{ success, message, ... }` | `{ success, message, ... }` |

**Action Item:** Review your existing Account approval frontend code and replicate the same pattern for Affiliate approval.

---

## Questions for Frontend Team

1. **Route Implementation:**
   - Do the routes `/admin/approve-affiliate/:token` and `/admin/reject-affiliate/:token` exist?
   - Are they correctly extracting the token from URL params?

2. **API Call:**
   - What URL is being called when admin clicks "Confirm Approval"?
   - Is the token included in the URL path or in the request body?
   - Can you share the axios/fetch call being made?

3. **Error "Duplicate Key":**
   - Is the submit button being disabled after first click?
   - Could the admin be clicking multiple times rapidly?
   - Is there any retry logic that might be resubmitting?

4. **Comparison:**
   - How is the Account (OT/OTA) approval implemented in the frontend?
   - Can we use the same pattern for Affiliate approval?

---

**Backend Developer:** Bruno Amaral  
**Date:** December 2, 2025  
**Backend Status:** ✅ Ready - Waiting for correct token in URL path

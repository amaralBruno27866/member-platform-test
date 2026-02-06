# Affiliate Email Verification - Frontend Implementation Requirements

## Overview
The affiliate registration email verification is not working because the frontend page is not making the required POST request to the backend API.

## Current Status

### ✅ Backend (Working)
- Email is being sent successfully with verification link
- Email contains correct frontend URL: `http://localhost:5173/verify-affiliate-email?sessionId=XXX&token=YYY`
- Backend endpoint is ready and waiting for POST requests

### ❌ Frontend (Missing Implementation)
- The verification page exists but is **not sending POST request** to backend
- Currently showing error: "Verification session not found or expired"
- No POST request appears in backend logs when user clicks verification button

## What Frontend Needs to Implement

### 1. Route: `/verify-affiliate-email`

The frontend should have a page/component at this route that:

**a) Reads URL parameters:**
```javascript
// Example using React Router or similar
const searchParams = new URLSearchParams(window.location.search);
const sessionId = searchParams.get('sessionId');  // Example: "aff_1764705330333_a87f1fba46f3d5df"
const token = searchParams.get('token');          // Example: "f580ac7bff58b884fcb487fb32d7a02e5ad9cc43b93f9fec7463e3621c867bc8"
```

**b) Makes POST request to backend:**

```javascript
// Endpoint
POST http://192.168.10.61:3000/public/affiliates/verify-email

// Request Body (JSON)
{
  "sessionId": "aff_1764705330333_a87f1fba46f3d5df",
  "verificationToken": "f580ac7bff58b884fcb487fb32d7a02e5ad9cc43b93f9fec7463e3621c867bc8"
}

// Headers
{
  "Content-Type": "application/json"
}
```

**⚠️ IMPORTANT:** The field name in the POST body must be `verificationToken` (NOT `token`)

### 2. Example Implementation

```javascript
// Example using axios or fetch
async function verifyAffiliateEmail() {
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('sessionId');
  const token = searchParams.get('token');

  if (!sessionId || !token) {
    // Show error: Missing parameters
    return;
  }

  try {
    const response = await axios.post(
      'http://192.168.10.61:3000/public/affiliates/verify-email',
      {
        sessionId: sessionId,
        verificationToken: token  // ⚠️ Note: 'verificationToken', not 'token'
      }
    );

    // Success response example:
    // {
    //   "success": true,
    //   "message": "Email verified successfully. Awaiting admin approval.",
    //   "nextStep": "ADMIN_APPROVAL"
    // }

    // Show success message to user
    console.log('Verification successful:', response.data);
    
  } catch (error) {
    // Handle errors
    // Common errors:
    // - 404: Session not found or expired
    // - 400: Invalid session ID or token format
    // - 409: Email already verified
    
    console.error('Verification failed:', error.response?.data);
  }
}

// Call this function when page loads or when user clicks verify button
verifyAffiliateEmail();
```

### 3. Expected Backend Responses

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully. Awaiting admin approval.",
  "nextStep": "ADMIN_APPROVAL"
}
```

**Error - Session Not Found (404):**
```json
{
  "statusCode": 404,
  "message": "Verification session not found or expired. Please register again.",
  "error": "Not Found"
}
```

**Error - Invalid Format (400):**
```json
{
  "statusCode": 400,
  "message": [
    "Session ID must follow format: aff_{timestamp}_{random}",
    "Verification token must be a 64-character hex string"
  ],
  "error": "Bad Request"
}
```

**Error - Already Verified (409):**
```json
{
  "statusCode": 409,
  "message": "Email already verified. Awaiting admin approval.",
  "error": "Conflict"
}
```

### 4. Validation Requirements

The backend validates the following:

**Session ID:**
- Format: `aff_{timestamp}_{random}`
- Length: 20-50 characters
- Example: `aff_1764705330333_a87f1fba46f3d5df`

**Verification Token:**
- Format: 64-character hexadecimal string
- Lowercase letters (a-f) and numbers (0-9) only
- Example: `f580ac7bff58b884fcb487fb32d7a02e5ad9cc43b93f9fec7463e3621c867bc8`

### 5. User Flow

1. User fills affiliate registration form
2. Backend sends verification email
3. User clicks "Verify Email" button in email
4. Browser opens: `http://localhost:5173/verify-affiliate-email?sessionId=XXX&token=YYY`
5. **Frontend makes POST request** to backend (this is missing!)
6. Backend verifies and updates session status
7. Frontend shows success message: "Email verified! Awaiting admin approval"

## Testing Checklist

- [ ] Route `/verify-affiliate-email` exists in frontend
- [ ] Page reads `sessionId` and `token` from URL parameters
- [ ] Page makes POST request to `http://192.168.10.61:3000/public/affiliates/verify-email`
- [ ] POST body uses field name `verificationToken` (not `token`)
- [ ] Success response shows user-friendly message
- [ ] Error responses are handled gracefully
- [ ] POST request appears in backend logs when verification is attempted

## Current Issue

When user clicks verification link:
- ✅ Frontend page loads correctly
- ❌ No POST request is sent to backend
- ❌ Error message shown: "Verification session not found or expired"
- ❌ Backend logs show **NO incoming request** to `/public/affiliates/verify-email`

This confirms the frontend is **NOT making the POST request**.

## Questions for Frontend Team

1. Does the route `/verify-affiliate-email` exist in the frontend router?
2. Is there a component/page handling this route?
3. Is the component reading URL parameters correctly?
4. Is the component making a POST request to the backend API?
5. If yes to #4, what endpoint and payload are being used?

---

**Backend Developer:** Bruno Amaral  
**Date:** December 2, 2025  
**Backend Status:** ✅ Ready and waiting for frontend POST requests

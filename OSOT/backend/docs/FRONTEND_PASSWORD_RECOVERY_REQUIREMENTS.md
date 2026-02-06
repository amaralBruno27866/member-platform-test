# 📋 Frontend Requirements for Password Recovery Implementation

## 🎯 Overview
This document lists the frontend routes and configurations needed to complete the password recovery implementation with clickable email buttons.

---

## ✅ What Backend Has Ready

### Email Templates Created:
1. ✅ `password-reset-request.html` - Email sent when user requests password recovery
2. ✅ `password-reset-confirmation.html` - Email sent after successful password change

### Email Features:
- ✅ Clickable buttons (better UX than manual token copying)
- ✅ Fallback copy-paste link
- ✅ Security warnings
- ✅ Professional styling matching existing templates
- ✅ Mobile-responsive design

### Backend Endpoints:
- ✅ `POST /password-recovery/request` - Request password reset
- ✅ `POST /password-recovery/validate` - Validate token (optional)
- ✅ `POST /password-recovery/reset` - Reset password with token

---

## 📝 What We Need from Frontend Team

### 1. **Frontend URL Configuration** ⚠️ REQUIRED

**What**: The base URL of the frontend application.

**Why**: Email templates use `{{frontendUrl}}` variable to generate clickable links like:
```
{{frontendUrl}}/reset-password?token=abc123
```

**Current Configuration**:
```env
# In backend .env file
WP_FRONTEND_URL=http://localhost:5173,http://192.168.10.61:5173
```

**What we need**:
- ✅ **Development URL**: Already configured (`http://localhost:5173`)
- ⚠️ **Production URL**: What will be the production frontend URL?
  - Example: `https://app.osot.org`, `https://portal.osot.com`, etc.
  
**Action Required**:
```
Please provide the production frontend URL so we can add it to WP_FRONTEND_URL
```

---

### 2. **Frontend Routes** ⚠️ REQUIRED

**What**: Two pages/routes need to be created or confirmed.

#### Route 1: Forgot Password Page
**Confirmed Path**: `/auth/forgot-password` ✅

**Purpose**: User enters email to request password reset.

**Required Elements**:
- Email input field
- Submit button
- Loading state
- Success message display
- Error message display

**Example Flow**:
```typescript
// User enters email and clicks "Send Recovery Link"
POST /password-recovery/request
Body: { email: "user@example.com" }

// Always shows success (security)
Display: "If the email exists, you will receive a recovery link shortly."
```

---

#### Route 2: Reset Password Page
**Confirmed Path**: `/auth/reset-password` ✅

**Purpose**: User lands here after clicking email link, enters new password.

**URL Format**: `/auth/reset-password?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Required Elements**:
- Extract token from URL query parameter
- New password input field (with strength indicator)
- Confirm password field
- Submit button
- Password requirements display
- Loading state
- Success/error message display

**Example Flow**:
```typescript
// Extract token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Optional: Validate token before showing form
POST /password-recovery/validate
Body: { token }
Response: { valid: true/false }

// User enters new password
POST /password-recovery/reset
Body: { 
  token: "a1b2c3d4...",
  newPassword: "NewPassword123!"
}

// On success
Display: "Password changed successfully! Redirecting to login..."
Redirect to /login after 2 seconds
```

---

### 3. **Password Validation Rules** ⚠️ REQUIRED

**What**: Frontend must validate password strength before submitting.

**Regex Pattern**:
```typescript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
```

**Requirements**:
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (@$!%*?&#)

**Validation Function Example**:
```typescript
const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Minimum 8 characters required';
  if (!/[a-z]/.test(password)) return 'Must include lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Must include uppercase letter';
  if (!/\d/.test(password)) return 'Must include number';
  if (!/[@$!%*?&#]/.test(password)) return 'Must include special character (@$!%*?&#)';
  return null; // Valid
};
```

**UI Suggestion**:
Show real-time password strength indicator:
- ❌ Weak (red) - Missing requirements
- ⚠️ Medium (yellow) - Meets minimum but could be stronger
- ✅ Strong (green) - Meets all requirements

---

### 4. **Security Report Route** ✅ USING EMAIL LINK

**What**: Route to report unauthorized password changes.

**Frontend Decision**: Use `mailto:` link instead of dedicated page (Phase 1)

**Current Implementation**: 
- ✅ Email template uses `mailto:support@osot.org.br` with pre-filled subject/body
- 📋 Future: Can create `/security/report-unauthorized` page in Phase 3

**Action Required**:
```
✅ DONE - Email template updated to use mailto: link
No additional route needed for Phase 1
```

---

### 5. **Login Route** ✅ CONFIRMED

**What**: Route where user logs in after password reset.

**Confirmed Path**: `/auth/login` ✅

**Why**: Password reset confirmation email has a "Log In Now" button.

**Status**: Confirmed by frontend team - route exists and is working.

---

## 📧 Email Template Variables Reference

### Password Reset Request Email
**Template**: `password-reset-request.html`

**Variables Used**:
```typescript
{
  frontendUrl: string,        // Example: "http://localhost:5173"
  token: string,              // Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  accountType: string,        // "account" or "affiliate"
  organizationContext: string // "" or " for [Organization Name]"
}
```

**Generated Link Example**:
```
http://localhost:5173/auth/reset-password?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### Password Reset Confirmation Email
**Template**: `password-reset-confirmation.html`

**Variables Used**:
```typescript
{
  frontendUrl: string,        // Example: "http://localhost:5173"
  accountType: string,        // "account" or "affiliate"
  organizationContext: string, // "" or " for your organization"
  changeDate: string,         // Example: "Sunday, December 1, 2024 at 3:45 PM"
  ipAddress: string           // Example: "192.168.1.100" (currently "N/A")
}
```

**Generated Links**:
```
Login: http://localhost:5173/auth/login
Report: mailto:support@osot.org.br (email link with pre-filled data)
```

---

## 🚀 Implementation Checklist for Frontend

### Phase 1: Basic Implementation (MVP)
- [ ] Create `/forgot-password` page
- [ ] Create `/reset-password` page
- [ ] Implement password strength validation
- [ ] Handle API responses (always success due to anti-enumeration)
- [ ] Show generic success messages
- [ ] Redirect to login after successful reset

### Phase 2: UX Enhancements
- [ ] Add password strength indicator
- [ ] Add "Show/Hide Password" toggle
- [ ] Add loading states and animations
- [ ] Add countdown timer on success message
- [ ] Implement "Resend recovery email" option

### Phase 3: Security Features
- [ ] Create `/security/report-unauthorized` page
- [ ] Add CAPTCHA to forgot password form (prevent abuse)
- [ ] Add rate limiting indicators (after 429 response)

---

## 🔗 Backend API Reference

### Request Password Recovery
```typescript
POST /password-recovery/request
Content-Type: application/json

Body: {
  "email": "user@example.com",
  "accountType": "account" // optional
}

Response: {
  "success": true // always true (security)
}
```

### Validate Token (Optional)
```typescript
POST /password-recovery/validate
Content-Type: application/json

Body: {
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}

Response: {
  "valid": true // or false
}
```

### Reset Password
```typescript
POST /password-recovery/reset
Content-Type: application/json

Body: {
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "newPassword": "NewPassword123!"
}

Response: {
  "success": true // always true (security)
}

Error Responses:
- 400: Password doesn't meet requirements
- 429: Rate limit exceeded (5 requests/minute)
```

---

## 📊 User Flow Diagram

```
1. User visits /forgot-password
   ↓
2. User enters email and submits
   ↓
3. Backend sends email with button
   ↓
4. User clicks "Reset Password" button in email
   ↓
5. Opens /reset-password?token=abc123 in browser
   ↓
6. User enters new password (validated by frontend)
   ↓
7. Frontend submits to /password-recovery/reset
   ↓
8. Backend sends confirmation email
   ↓
9. User clicks "Log In Now" button
   ↓
10. Opens /login
   ↓
11. User logs in with new password ✅
```

---

## 🎨 Design Consistency

**Important**: The email templates follow the same design pattern as existing templates:
- Blue primary button (`#2563eb`)
- Red danger button (`#dc2626`) for security actions
- Yellow warning boxes (`#fef3c7`)
- Red alert boxes (`#fef2f2`)
- Monospace font for links/tokens
- Mobile-responsive layout
- Maximum width: 600px

**Action Required**:
```
Please ensure frontend pages match the email design for brand consistency.
```

---

## 🐛 Error Handling

### Frontend Should Handle:

**429 Too Many Requests** (Rate Limit):
```typescript
if (response.status === 429) {
  showError('Too many attempts. Please wait a few minutes before trying again.');
}
```

**400 Bad Request** (Weak Password):
```typescript
if (response.status === 400) {
  const data = await response.json();
  showError(data.message[0]); // "Password must contain uppercase, lowercase, number, special character"
}
```

**Network Errors**:
```typescript
catch (error) {
  showError('Connection error. Please check your internet and try again.');
}
```

---

## 📞 Questions for Frontend Team

1. **Production URL**: What will be the production frontend URL?
   - Needed for: Email template links in production
   
2. **Route Paths**: Confirm or suggest route paths:
   - `/forgot-password` - OK? Or prefer `/password-recovery`?
   - `/reset-password` - OK? Or prefer `/password-reset`?
   - `/login` - Already exists? Path correct?
   
3. **Security Report**: Should we implement `/security/report-unauthorized` now or later?
   - Option A: Simple page with support email
   - Option B: Full API integration (requires backend endpoint)
   
4. **Design**: Any specific design requirements beyond matching email templates?

5. **CAPTCHA**: Should we add CAPTCHA to forgot password form?
   - Prevents automated abuse
   - Can use Google reCAPTCHA, hCaptcha, etc.

---

## 📅 Timeline Suggestion

**Week 1**:
- [ ] Confirm routes and URLs
- [ ] Create basic `/forgot-password` page
- [ ] Create basic `/reset-password` page
- [ ] Integrate with backend APIs

**Week 2**:
- [ ] Add password validation and strength indicator
- [ ] Add error handling and loading states
- [ ] Add success animations and redirects
- [ ] Test complete flow end-to-end

**Week 3**:
- [ ] Create `/security/report-unauthorized` page
- [ ] Add CAPTCHA (if decided)
- [ ] Polish UX and design
- [ ] Mobile testing
- [ ] Production deployment

---

## ✅ Summary - Action Items for Frontend

**REQUIRED NOW**:
1. ✅ Confirm/provide production frontend URL
2. ✅ Confirm route paths (`/forgot-password`, `/reset-password`, `/login`)
3. ✅ Implement password validation regex
4. ✅ Create forgot password page with email form
5. ✅ Create reset password page with token extraction and password form

**OPTIONAL/LATER**:
6. 📋 Create `/security/report-unauthorized` page
7. 📋 Add CAPTCHA to prevent abuse
8. 📋 Add password strength indicator
9. 📋 Add "Resend email" functionality

---

## 📚 Related Documentation

- **Backend Flow**: `docs/PASSWORD_RECOVERY_FLOW.md`
- **Frontend Integration Guide**: `docs/PASSWORD_RECOVERY_FRONTEND_GUIDE.md`
- **Email Templates**: `src/emails/templates/password-reset-*.html`
- **API Documentation**: `http://localhost:3000/api-docs` (Swagger)

---

**Created**: December 2, 2025  
**Status**: ✅ Backend Ready - Waiting for Frontend Implementation  
**Contact**: Backend team available for questions

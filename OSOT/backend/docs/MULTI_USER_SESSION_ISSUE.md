# Multi-User Session Issue - Frontend Fix Required

## Critical Issue

**Problem:** Users cannot login with different accounts in multiple tabs of the same browser. When opening a new tab and attempting to login with a different user, the application automatically uses the previous user's session.

**Impact:** This is a **critical limitation** that prevents:
- Testing with multiple user accounts simultaneously
- Administrators from accessing different user contexts
- Development and QA testing workflows
- Multi-user scenarios on the same device

---

## Root Cause

The frontend is storing the JWT token in `localStorage` or `sessionStorage`, which is **shared across all tabs** in the same browser profile. When a new tab is opened:

1. User A logs in → JWT saved in `localStorage`
2. User opens new tab
3. New tab reads the **same** `localStorage`
4. Frontend automatically authenticates as **User A** (reusing existing JWT)
5. Attempting to login as User B fails because the old JWT is still active

---

## Current Behavior (Incorrect)

```
Browser Tab 1: Login as User A → JWT saved in localStorage
Browser Tab 2: Open new tab → Automatically logged in as User A ❌
Browser Tab 2: Try to login as User B → Still shows User A ❌
```

---

## Expected Behavior (Correct)

```
Browser Tab 1: Login as User A → JWT saved in sessionStorage (tab-specific)
Browser Tab 2: Open new tab → No session, shows login screen ✅
Browser Tab 2: Login as User B → New JWT, logged in as User B ✅
```

---

## Solutions

### Solution 1: Use `sessionStorage` Instead of `localStorage` (RECOMMENDED)

**Change storage mechanism from `localStorage` to `sessionStorage`**

#### Current Implementation (Incorrect):
```javascript
// ❌ WRONG - Shared across all tabs
localStorage.setItem('jwt_token', token);
localStorage.setItem('user_data', JSON.stringify(userData));

const token = localStorage.getItem('jwt_token');
```

#### Correct Implementation:
```javascript
// ✅ CORRECT - Isolated per tab
sessionStorage.setItem('jwt_token', token);
sessionStorage.setItem('user_data', JSON.stringify(userData));

const token = sessionStorage.getItem('jwt_token');
```

#### Benefits:
- ✅ Each tab has independent session
- ✅ Session cleared when tab is closed
- ✅ More secure (tokens don't persist after browser restart)
- ✅ No code changes needed beyond storage API swap

---

### Solution 2: Implement Proper Logout Before Login

**Ensure logout clears all stored authentication data**

#### Logout Function (Required):
```javascript
function logout() {
  // Clear all authentication data
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_data');
  localStorage.removeItem('refresh_token');
  sessionStorage.clear();
  
  // Clear any user-specific cache
  // ... clear other user data
  
  // Redirect to login
  window.location.href = '/login';
}
```

#### Login Function (Must clear old data):
```javascript
async function login(email, password) {
  // STEP 1: Clear any existing session FIRST
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_data');
  sessionStorage.clear();
  
  // STEP 2: Perform login
  const response = await axios.post('/auth/login', { email, password });
  
  // STEP 3: Save new session
  sessionStorage.setItem('jwt_token', response.data.access_token);
  sessionStorage.setItem('user_data', JSON.stringify(response.data.user));
  
  // STEP 4: Redirect to dashboard
  window.location.href = '/dashboard';
}
```

---

### Solution 3: Add "Switch User" Feature

**Implement a user-friendly way to switch between accounts**

```javascript
function switchUser() {
  // Show confirmation dialog
  if (confirm('Are you sure you want to switch user? You will be logged out.')) {
    // Clear session
    sessionStorage.clear();
    localStorage.clear();
    
    // Redirect to login
    window.location.href = '/login';
  }
}
```

#### UI Component:
```jsx
// Add to user menu dropdown
<MenuItem onClick={switchUser}>
  <LogoutIcon /> Switch User
</MenuItem>
```

---

## Implementation Checklist

### Phase 1: Immediate Fix (Critical)
- [ ] **Replace `localStorage` with `sessionStorage`** for JWT token storage
- [ ] **Replace `localStorage` with `sessionStorage`** for user data storage
- [ ] Test login in multiple tabs with different users
- [ ] Verify each tab maintains independent session

### Phase 2: Logout Enhancement
- [ ] Implement comprehensive logout function that clears all storage
- [ ] Add logout confirmation dialog
- [ ] Test logout clears all authentication data
- [ ] Verify login screen appears after logout

### Phase 3: User Experience
- [ ] Add "Switch User" option to user menu
- [ ] Show current user info prominently in header
- [ ] Add visual indication when user is logged in
- [ ] Test switching between different user types (Account vs Affiliate)

---

## Testing Scenarios

### Test 1: Multiple Tabs, Different Users
1. Open Tab 1 → Login as `user1@example.com` (Account)
2. Open Tab 2 → Should show login screen (not auto-login)
3. Login as `affiliate1@example.com` (Affiliate)
4. Verify Tab 1 still shows User 1
5. Verify Tab 2 shows Affiliate 1
6. Close Tab 2 → Session should be destroyed
7. Reopen Tab → Should show login screen

**Expected Result:** ✅ Each tab maintains independent session

### Test 2: Logout and Re-login
1. Login as `user1@example.com`
2. Click Logout
3. Verify redirected to login screen
4. Login as `user2@example.com`
5. Verify dashboard shows User 2 data (not User 1)

**Expected Result:** ✅ New user session completely replaces old session

### Test 3: Browser Refresh
1. Login as `user1@example.com`
2. Refresh browser (F5)
3. If using `sessionStorage`: Should remain logged in
4. If using `localStorage`: Should remain logged in (but shared across tabs)

**Expected Result:** ✅ Session persists through refresh (within same tab)

### Test 4: Close and Reopen Browser
1. Login as `user1@example.com`
2. Close entire browser
3. Reopen browser → Navigate to application
4. If using `sessionStorage`: Should show login screen ✅
5. If using `localStorage`: Would auto-login (less secure) ❌

**Expected Result:** ✅ Using `sessionStorage` forces re-login after browser restart

---

## Code Examples

### Example 1: Auth Service with sessionStorage

```javascript
// services/authService.js
class AuthService {
  static TOKEN_KEY = 'jwt_token';
  static USER_KEY = 'user_data';
  
  // Use sessionStorage for tab-isolated sessions
  static saveSession(token, userData) {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(userData));
  }
  
  static getToken() {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }
  
  static getUser() {
    const userData = sessionStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }
  
  static clearSession() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    // Clear any other session data
  }
  
  static isAuthenticated() {
    return !!this.getToken();
  }
  
  static getUserType() {
    const user = this.getUser();
    return user?.userType || 'account'; // 'account' or 'affiliate'
  }
}

export default AuthService;
```

### Example 2: Login Component

```javascript
// components/Login.jsx
import { useState } from 'react';
import axios from 'axios';
import AuthService from '../services/authService';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // IMPORTANT: Clear any existing session first
      AuthService.clearSession();
      
      // Perform login
      const response = await axios.post('http://192.168.2.73:3000/auth/login', {
        osot_email: email,
        osot_password: password
      });
      
      // Save new session (using sessionStorage)
      AuthService.saveSession(
        response.data.access_token,
        response.data.user
      );
      
      // Redirect based on user type
      const userType = AuthService.getUserType();
      if (userType === 'affiliate') {
        window.location.href = '/affiliate-dashboard';
      } else {
        window.location.href = '/dashboard';
      }
      
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default Login;
```

### Example 3: Logout Component

```javascript
// components/Header.jsx
import AuthService from '../services/authService';

function Header() {
  const user = AuthService.getUser();
  
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      AuthService.clearSession();
      window.location.href = '/login';
    }
  };
  
  const handleSwitchUser = () => {
    if (confirm('Switch user? You will be logged out from current session.')) {
      AuthService.clearSession();
      window.location.href = '/login';
    }
  };
  
  return (
    <header>
      <div className="user-info">
        <span>Welcome, {user?.firstName} {user?.lastName}</span>
        <span className="user-type">({user?.userType})</span>
      </div>
      <div className="actions">
        <button onClick={handleSwitchUser}>Switch User</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Header;
```

### Example 4: Axios Interceptor

```javascript
// utils/axiosConfig.js
import axios from 'axios';
import AuthService from '../services/authService';

// Add token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 Unauthorized (token expired/invalid)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear session and redirect to login
      AuthService.clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;
```

---

## Backend Compatibility

The backend **already supports** multiple simultaneous users. No backend changes are required.

**Backend JWT Structure:**
```json
{
  "sub": "user-guid-here",
  "userId": "osot-0000213",
  "userGuid": "2323048b-d0ce-f011-8544-002248b106dc",
  "email": "user@example.com",
  "role": "owner",
  "privilege": 1,
  "userType": "account",
  "iat": 1733342553,
  "exp": 1733428953
}
```

**Each JWT is independent:**
- User A in Tab 1 → JWT for User A
- User B in Tab 2 → JWT for User B
- Backend validates each JWT separately
- No conflict or session sharing on backend

---

## Migration Guide

### Step 1: Identify Current Storage Usage

**Search codebase for:**
```javascript
localStorage.setItem
localStorage.getItem
localStorage.removeItem
```

### Step 2: Replace with sessionStorage

**Find:**
```javascript
localStorage.setItem('jwt_token', token);
const token = localStorage.getItem('jwt_token');
localStorage.removeItem('jwt_token');
```

**Replace with:**
```javascript
sessionStorage.setItem('jwt_token', token);
const token = sessionStorage.getItem('jwt_token');
sessionStorage.removeItem('jwt_token');
```

### Step 3: Test Thoroughly

1. Test login in single tab
2. Test login in multiple tabs with different users
3. Test logout clears session
4. Test browser refresh maintains session (same tab)
5. Test closing tab destroys session
6. Test closing browser destroys all sessions

---

## Temporary Workarounds (Until Fixed)

While the frontend is being fixed, users can:

**Option 1: Use Different Browsers**
- Chrome → User A
- Firefox → User B
- Edge → User C

**Option 2: Use Incognito/Private Mode**
- Normal Window → User A
- Incognito Window (Ctrl+Shift+N) → User B
- Each incognito window has isolated storage

**Option 3: Use Browser Profiles (Chrome/Edge)**
- Profile 1 → User A
- Profile 2 → User B
- Each profile has separate storage

**Option 4: Manual Token Clearing**
```javascript
// Open DevTools (F12) → Console
localStorage.clear();
sessionStorage.clear();
// Then refresh and login with different user
```

---

## Priority

**CRITICAL - HIGH PRIORITY**

This issue significantly impacts:
- ✅ Development workflow
- ✅ QA testing capabilities
- ✅ Administrator operations
- ✅ User experience
- ✅ System usability

**Recommended Timeline:**
- Immediate: Implement `sessionStorage` solution (1-2 hours)
- Short-term: Add proper logout (1 day)
- Medium-term: Add "Switch User" feature (2-3 days)

---

## Questions?

If you need clarification or encounter issues during implementation, please contact the backend team.

**Backend Developer:** Bruno Amaral  
**Date:** December 4, 2025  
**Backend Status:** ✅ Ready - Supports multiple simultaneous users  
**Frontend Action Required:** Replace `localStorage` with `sessionStorage` for JWT storage

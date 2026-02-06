# STAFF Admin Interface - Frontend Integration Guide

**Target Audience:** Frontend Development Team  
**Purpose:** Enable administrative interface for STAFF users (Account Group 7)  
**Date:** January 12, 2026  
**Status:** ✅ Backend Ready | 🔄 Frontend Implementation Pending

---

## Table of Contents
1. [Overview](#overview)
2. [User Identification](#user-identification)
3. [Account Groups Reference](#account-groups-reference)
4. [Role-Based Permissions](#role-based-permissions)
5. [Available Endpoints](#available-endpoints)
6. [Implementation Examples](#implementation-examples)
7. [Route Protection Patterns](#route-protection-patterns)
8. [Common Scenarios](#common-scenarios)

---

## Overview

### What is STAFF?
STAFF (`account_group = 7`) represents internal administrative users who:
- Have elevated permissions to manage other users
- Can create accounts for all groups (MEMBER, STUDENT, etc.)
- Access administrative dashboards
- Perform organization-wide operations

### Architecture
```
User Types:
├── account (Person) - Has account_group field
│   ├── STAFF (7) - Administrative users
│   ├── MEMBER (1) - Regular members
│   ├── STUDENT (2) - Students
│   ├── RESIDENT (3) - Residents
│   ├── RETIRED (5) - Retired professionals
│   └── CANDIDATE (6) - Applicants
└── affiliate (Company) - No account_group (always treated as regular)
```

---

## User Identification

### 1. JWT Payload Structure
After successful login, decode the JWT to access user metadata:

```typescript
interface JwtPayload {
  // User Identity
  userId: string;              // osot_account_id (e.g., "osot-account-0000001")
  email: string;               // User email
  userType: 'account' | 'affiliate'; // User type
  
  // Permissions
  role: 'owner' | 'admin' | 'main';  // Privilege-based role
  privilege: 1 | 2 | 3;              // 1=Owner, 2=Admin, 3=Main
  
  // Organization Context (Multi-Tenant)
  organizationId: string;      // Encrypted GUID
  organizationSlug: string;    // Public slug (e.g., "osot")
  organizationName: string;    // Display name
}
```

**⚠️ JWT does NOT contain `account_group` field!**  
You must fetch it from the user profile endpoint.

---

### 2. Fetching User Profile

**Endpoint:** `GET /api/accounts/me`  
**Authentication:** Bearer token required  
**Purpose:** Get complete user profile including `account_group`

#### Request Example:
```typescript
const token = localStorage.getItem('access_token');

const response = await fetch('http://192.168.10.53:3000/api/accounts/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const userProfile = await response.json();
```

#### Response Example:
```json
{
  "osot_table_accountid": "abc-123-def",
  "osot_account_id": "osot-account-0000001",
  "osot_first_name": "Bruno",
  "osot_last_name": "Amaral",
  "osot_email": "b.alencar.amaral@gmail.com",
  "osot_account_group": 7,  // ⭐ STAFF indicator
  "osot_account_status": 1,
  "osot_privilege": 3,
  "createdon": "2026-01-12T18:00:00Z",
  "modifiedon": "2026-01-12T18:00:00Z"
}
```

---

### 3. Detecting STAFF Users

**Recommended Pattern:**

```typescript
// src/utils/userPermissions.ts

export enum AccountGroup {
  MEMBER = 1,
  STUDENT = 2,
  RESIDENT = 3,
  RETIRED = 5,
  CANDIDATE = 6,
  STAFF = 7,
}

export interface UserProfile {
  osot_account_id: string;
  osot_email: string;
  osot_first_name: string;
  osot_last_name: string;
  osot_account_group: number;
  osot_privilege: number;
  osot_account_status: number;
}

/**
 * Check if user is STAFF (administrative user)
 */
export function isStaffUser(profile: UserProfile): boolean {
  return profile.osot_account_group === AccountGroup.STAFF;
}

/**
 * Check if user has administrative privileges
 * STAFF users typically have MAIN privilege (3)
 */
export function hasAdminPrivileges(profile: UserProfile): boolean {
  return profile.osot_privilege === 3; // Main privilege
}

/**
 * Check if user can access admin dashboard
 */
export function canAccessAdminDashboard(profile: UserProfile): boolean {
  return isStaffUser(profile) && hasAdminPrivileges(profile);
}
```

---

## Account Groups Reference

### Complete Account Groups Table

| Group ID | Name      | Description                          | Can Create Accounts? | Admin Access? |
|----------|-----------|--------------------------------------|---------------------|---------------|
| 1        | MEMBER    | Regular members                      | ❌ No               | ❌ No         |
| 2        | STUDENT   | Students                             | ❌ No               | ❌ No         |
| 3        | RESIDENT  | Residents                            | ❌ No               | ❌ No         |
| 5        | RETIRED   | Retired professionals                | ❌ No               | ❌ No         |
| 6        | CANDIDATE | Applicants                           | ❌ No               | ❌ No         |
| 7        | STAFF     | Internal administrative users        | ✅ Yes              | ✅ Yes        |

### Group-Specific Permissions

```typescript
// src/utils/groupPermissions.ts

export const GROUP_PERMISSIONS = {
  [AccountGroup.STAFF]: {
    canCreateAccounts: true,
    canViewAllUsers: true,
    canEditAnyUser: true,
    canDeleteUsers: false,  // Reserved for MAIN role only
    canAccessReports: true,
    canManageOrganization: true,
    dashboardRoute: '/admin/dashboard',
  },
  [AccountGroup.MEMBER]: {
    canCreateAccounts: false,
    canViewAllUsers: false,
    canEditAnyUser: false,
    canDeleteUsers: false,
    canAccessReports: false,
    canManageOrganization: false,
    dashboardRoute: '/member/dashboard',
  },
  // ... other groups
};

export function getUserPermissions(accountGroup: number) {
  return GROUP_PERMISSIONS[accountGroup] || GROUP_PERMISSIONS[AccountGroup.MEMBER];
}
```

---

## Role-Based Permissions

### Privilege Levels (from JWT)

```typescript
export enum Privilege {
  OWNER = 1,  // Can read/update own records
  ADMIN = 2,  // Can read/update organization-wide
  MAIN = 3,   // Full CRUD (only role that can DELETE)
}

export interface RolePermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  scope: 'own' | 'organization' | 'all';
}

export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  owner: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    scope: 'own',
  },
  admin: {
    canCreate: false,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    scope: 'organization',
  },
  main: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    scope: 'all',
  },
};
```

### Combined Permission Check

```typescript
/**
 * Check if user can perform action on target
 */
export function canPerformAction(
  userProfile: UserProfile,
  action: 'create' | 'read' | 'update' | 'delete',
  targetUserId?: string
): boolean {
  const role = getRoleFromPrivilege(userProfile.osot_privilege);
  const permissions = ROLE_PERMISSIONS[role];
  
  // Check basic permission
  const hasPermission = permissions[`can${capitalize(action)}`];
  if (!hasPermission) return false;
  
  // Check scope
  if (permissions.scope === 'own') {
    return targetUserId === userProfile.osot_account_id;
  }
  
  return true;
}

function getRoleFromPrivilege(privilege: number): string {
  switch (privilege) {
    case 1: return 'owner';
    case 2: return 'admin';
    case 3: return 'main';
    default: return 'owner';
  }
}
```

---

## Available Endpoints

### 1. Account Management (STAFF Only)

#### Create Account
```typescript
POST /api/accounts
Authorization: Bearer {token}
Content-Type: application/json

// Request Body
{
  "osot_first_name": "John",
  "osot_last_name": "Doe",
  "osot_email": "john.doe@example.com",
  "osot_mobile_phone": "+14165550100",
  "osot_date_of_birth": "1990-01-15",
  "osot_account_group": 1,  // MEMBER
  "osot_password": "SecurePass123!"
}

// Response (201 Created)
{
  "osot_account_id": "osot-account-0000025",
  "osot_table_accountid": "guid-here",
  "osot_email": "john.doe@example.com",
  "osot_account_group": 1,
  "osot_account_status": 1
}
```

#### List All Accounts
```typescript
GET /api/accounts?osot_account_group=1&page=1&limit=20
Authorization: Bearer {token}

// Response
{
  "data": [
    {
      "osot_account_id": "osot-account-0000001",
      "osot_first_name": "John",
      "osot_last_name": "Doe",
      "osot_email": "john@example.com",
      "osot_account_group": 1,
      "osot_account_status": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

#### Get Account Details
```typescript
GET /api/accounts/{accountId}
Authorization: Bearer {token}

// Response
{
  "osot_table_accountid": "guid",
  "osot_account_id": "osot-account-0000001",
  "osot_first_name": "John",
  "osot_last_name": "Doe",
  "osot_email": "john@example.com",
  "osot_account_group": 1,
  "osot_account_status": 1,
  "osot_privilege": 1,
  "createdon": "2026-01-01T00:00:00Z"
}
```

#### Update Account
```typescript
PATCH /api/accounts/{accountId}
Authorization: Bearer {token}
Content-Type: application/json

// Request Body
{
  "osot_mobile_phone": "+14165559999",
  "osot_account_status": 2  // Deactivate
}

// Response (200 OK)
{
  "osot_account_id": "osot-account-0000001",
  "osot_mobile_phone": "+14165559999",
  "osot_account_status": 2
}
```

---

### 2. User Profile Endpoint

#### Get Current User Profile
```typescript
GET /api/accounts/me
Authorization: Bearer {token}

// Response
{
  "osot_table_accountid": "abc-123",
  "osot_account_id": "osot-account-0000001",
  "osot_first_name": "Bruno",
  "osot_last_name": "Amaral",
  "osot_email": "b.alencar.amaral@gmail.com",
  "osot_account_group": 7,  // STAFF
  "osot_account_status": 1,
  "osot_privilege": 3,      // MAIN
  "osot_mobile_phone": "+14165550100"
}
```

---

### 3. Authentication Endpoints

#### Login (Multi-Tenant)
```typescript
POST /api/auth/login
Content-Type: application/json

// Request Body
{
  "osot_email": "b.alencar.amaral@gmail.com",
  "osot_password": "YourPassword123!",
  "organizationSlug": "osot"  // ⚠️ Required for multi-tenant
}

// Response
{
  "access_token": "eyJhbGc...",
  "user": {
    "osot_account_id": "osot-account-0000001",
    "osot_email": "b.alencar.amaral@gmail.com",
    "osot_first_name": "Bruno",
    "osot_last_name": "Amaral"
  },
  "role": "main",
  "userType": "account"
}
```

---

## Implementation Examples

### React Component Example

```typescript
// src/components/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isStaffUser, canAccessAdminDashboard } from '../utils/userPermissions';
import { fetchUserProfile } from '../services/authService';

export const AdminDashboard: React.FC = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAccess() {
      try {
        const profile = await fetchUserProfile();
        
        // Verify user is STAFF
        if (!canAccessAdminDashboard(profile)) {
          navigate('/dashboard'); // Redirect to regular dashboard
          return;
        }
        
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    }
    
    checkAccess();
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Welcome, {userProfile?.osot_first_name}!</p>
      
      <div className="admin-sections">
        <section>
          <h2>User Management</h2>
          <button onClick={() => navigate('/admin/users')}>
            Manage Users
          </button>
        </section>
        
        <section>
          <h2>Reports</h2>
          <button onClick={() => navigate('/admin/reports')}>
            View Reports
          </button>
        </section>
      </div>
    </div>
  );
};
```

### Auth Service Example

```typescript
// src/services/authService.ts
import axios from 'axios';

const API_BASE_URL = 'http://192.168.10.53:3000/api';

export interface LoginCredentials {
  osot_email: string;
  osot_password: string;
  organizationSlug: string;
}

export async function login(credentials: LoginCredentials) {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
  
  // Store token
  localStorage.setItem('access_token', response.data.access_token);
  
  return response.data;
}

export async function fetchUserProfile() {
  const token = localStorage.getItem('access_token');
  
  const response = await axios.get(`${API_BASE_URL}/accounts/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
}

export function logout() {
  localStorage.removeItem('access_token');
}
```

---

## Route Protection Patterns

### React Router Protected Route

```typescript
// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchUserProfile } from '../services/authService';
import { isStaffUser } from '../utils/userPermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireStaff?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireStaff = false 
}) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const profile = await fetchUserProfile();
        
        // If route requires STAFF, check account_group
        if (requireStaff) {
          setAuthorized(isStaffUser(profile));
        } else {
          setAuthorized(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [requireStaff]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### Route Configuration

```typescript
// src/routes.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { Login } from './components/Login';

export const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Regular user routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* STAFF-only routes */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute requireStaff={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  </BrowserRouter>
);
```

---

## Common Scenarios

### Scenario 1: Login Flow for STAFF User

```typescript
// 1. User logs in
const loginData = await login({
  osot_email: 'b.alencar.amaral@gmail.com',
  osot_password: 'password',
  organizationSlug: 'osot'
});

// 2. Fetch full profile (includes account_group)
const profile = await fetchUserProfile();

// 3. Check if STAFF
if (isStaffUser(profile)) {
  navigate('/admin/dashboard');
} else {
  navigate('/dashboard');
}
```

### Scenario 2: Conditional UI Rendering

```typescript
function UserMenu({ profile }) {
  return (
    <nav>
      <a href="/dashboard">Dashboard</a>
      <a href="/profile">My Profile</a>
      
      {/* Show admin link only for STAFF */}
      {isStaffUser(profile) && (
        <a href="/admin">Admin Panel</a>
      )}
      
      <a href="/logout">Logout</a>
    </nav>
  );
}
```

### Scenario 3: Creating New User (STAFF Action)

```typescript
async function createNewMember(formData: any) {
  const token = localStorage.getItem('access_token');
  
  try {
    const response = await axios.post(
      'http://192.168.10.53:3000/api/accounts',
      {
        osot_first_name: formData.firstName,
        osot_last_name: formData.lastName,
        osot_email: formData.email,
        osot_mobile_phone: formData.phone,
        osot_date_of_birth: formData.birthDate,
        osot_account_group: 1, // MEMBER
        osot_password: formData.password
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('User created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
}
```

---

## Security Best Practices

### 1. Always Verify Tokens Server-Side
Frontend checks are for UX only. Backend enforces actual permissions.

### 2. Never Trust JWT Alone for account_group
Always fetch from `/api/accounts/me` to get fresh `account_group` value.

### 3. Handle Token Expiration
```typescript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 4. Secure Token Storage
```typescript
// Use httpOnly cookies in production (preferred)
// Or encrypt localStorage values
import CryptoJS from 'crypto-js';

function storeToken(token: string) {
  const encrypted = CryptoJS.AES.encrypt(token, 'secret-key').toString();
  localStorage.setItem('access_token', encrypted);
}

function getToken(): string | null {
  const encrypted = localStorage.getItem('access_token');
  if (!encrypted) return null;
  
  const decrypted = CryptoJS.AES.decrypt(encrypted, 'secret-key');
  return decrypted.toString(CryptoJS.enc.Utf8);
}
```

---

## Error Handling

### Common Backend Errors

```typescript
// 401 Unauthorized
{
  "code": 1003,
  "message": "Authentication failed",
  "context": {
    "email": "user@example.com"
  }
}

// 403 Forbidden (insufficient permissions)
{
  "code": 1002,
  "message": "Permission denied",
  "context": {
    "requiredRole": "main",
    "userRole": "owner"
  }
}

// 404 Not Found
{
  "code": 1001,
  "message": "Organization not found",
  "context": {
    "slug": "invalid-org"
  }
}

// 400 Validation Error
{
  "code": 1004,
  "message": "Validation failed",
  "errors": [
    "osot_email must be a valid email",
    "osot_password must be at least 8 characters"
  ]
}
```

### Error Handler Example

```typescript
function handleApiError(error: any) {
  if (error.response) {
    const { code, message, context } = error.response.data;
    
    switch (code) {
      case 1001: // NOT_FOUND
        alert(`Resource not found: ${message}`);
        break;
      case 1002: // PERMISSION_DENIED
        alert('You do not have permission to perform this action');
        break;
      case 1003: // AUTHENTICATION_FAILED
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        break;
      case 1004: // VALIDATION_ERROR
        displayValidationErrors(error.response.data.errors);
        break;
      default:
        alert(`Error: ${message}`);
    }
  } else {
    alert('Network error. Please try again.');
  }
}
```

---

## Testing Checklist

### Frontend Implementation Checklist

- [ ] **User Profile Fetching**
  - [ ] Fetch profile on login success
  - [ ] Store profile in state/context
  - [ ] Handle 401 errors gracefully

- [ ] **STAFF Detection**
  - [ ] Check `osot_account_group === 7`
  - [ ] Redirect STAFF to admin dashboard
  - [ ] Redirect non-STAFF to regular dashboard

- [ ] **Protected Routes**
  - [ ] Implement `ProtectedRoute` component
  - [ ] Require authentication for all private routes
  - [ ] Require `requireStaff` for admin routes

- [ ] **Admin Dashboard**
  - [ ] Display user list
  - [ ] Show create user form
  - [ ] Filter by account_group
  - [ ] Pagination support

- [ ] **Conditional UI**
  - [ ] Show/hide admin menu items
  - [ ] Display role-appropriate actions
  - [ ] Handle permission errors gracefully

- [ ] **Multi-Tenant Support**
  - [ ] Include `organizationSlug` in login
  - [ ] Display organization name in UI
  - [ ] Filter data by organization context

---

## Support & Contact

**Backend Team Contact:** Bruno Amaral  
**API Base URL (Dev):** `http://192.168.10.53:3000`  
**API Documentation:** `http://192.168.10.53:3000/api-docs`

**Questions?** Reference this guide or contact the backend team for clarification.

---

**Document Version:** 1.0  
**Last Updated:** January 12, 2026  
**Next Review:** After frontend implementation complete

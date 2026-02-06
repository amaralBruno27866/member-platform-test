# 🚨 URGENT: Privilege Level Clarification

**Date:** January 16, 2026  
**Priority:** CRITICAL  
**Affects:** Frontend Admin Interface Access

---

## ❌ Problem Identified

Frontend team was using **incorrect privilege documentation** that inverted Admin and Main privileges, causing **administrators to lose access to the admin interface**.

---

## ✅ CORRECT Privilege System

### Enum Definition (from `src/common/enums/privilege.enum.ts`)

```typescript
export enum Privilege {
  OWNER = 1,  // Default user - own data only
  ADMIN = 2,  // Administrative - organization-wide access
  MAIN = 3,   // Super Admin - full CRUD including DELETE
}
```

### Privilege Descriptions

| Value | Name | Description | Access Level |
|-------|------|-------------|--------------|
| **1** | `OWNER` | Default user privilege | Own data only (Create, Read, Update own records) |
| **2** | `ADMIN` | Administrative privilege | Organization-wide (Read + Update all records) |
| **3** | `MAIN` | Super administrative privilege | Full CRUD + DELETE permissions |

---

## 🔍 What Was Wrong

### ❌ Incorrect Documentation (OLD - DO NOT USE)

```markdown
1 = owner
2 = admin/ota  ← WRONG
3 = staff      ← WRONG (staff is a GROUP, not a PRIVILEGE)
```

**Problems:**
- "staff" is **NOT** a privilege level - it's an **account group** (`osot_account_group = 7`)
- "ota" is **NOT** a privilege - it's a user type or account group
- This caused confusion between **groups** (who the user is) vs **privileges** (what they can do)

### ✅ Correct Definition (USE THIS)

```markdown
1 = OWNER  (Privilege.OWNER)
2 = ADMIN  (Privilege.ADMIN)
3 = MAIN   (Privilege.MAIN)
```

---

## 🔐 Permission Matrix

| Operation | OWNER (1) | ADMIN (2) | MAIN (3) |
|-----------|-----------|-----------|----------|
| **Create own records** | ✅ | ✅ | ✅ |
| **Read own records** | ✅ | ✅ | ✅ |
| **Update own records** | ✅ | ✅ | ✅ |
| **Delete own records** | ❌ | ❌ | ✅ |
| **Read org-wide records** | ❌ | ✅ | ✅ |
| **Update org-wide records** | ❌ | ✅ | ✅ |
| **Delete org-wide records** | ❌ | ❌ | ✅ |
| **Access Admin Interface** | ❌ | ✅ | ✅ |

---

## 🧑‍💼 Staff vs Privilege (IMPORTANT!)

### Staff is a GROUP, not a PRIVILEGE

```typescript
// WRONG ❌
if (user.privilege === 'staff') { ... }

// CORRECT ✅
if (user.osot_account_group === 7) { // STAFF group
  // This user is a staff member
}

if (user.osot_privilege === 2 || user.osot_privilege === 3) {
  // This user has admin privileges (regardless of group)
}
```

### Account Groups (from `osot_account_group`)

| Value | Name | Description |
|-------|------|-------------|
| 1 | MEMBER | Regular OT member |
| 2 | STUDENT | Student member |
| 3 | RESIDENT | Resident member |
| 5 | RETIRED | Retired member |
| 6 | CANDIDATE | Candidate for membership |
| **7** | **STAFF** | **Administrative staff** |

**Key Point:** STAFF members typically have `osot_privilege = 3` (MAIN), but the privilege determines permissions, NOT the group.

---

## 💻 Frontend Implementation

### ✅ Correct: Check Admin Interface Access

```typescript
// Check if user can access admin interface
function canAccessAdminInterface(user: UserProfile): boolean {
  // Admin (2) or Main (3) can access
  return user.osot_privilege === 2 || user.osot_privilege === 3;
}

// Alternative using enum
import { Privilege } from '@/enums/privilege.enum';

function canAccessAdminInterface(user: UserProfile): boolean {
  return (
    user.osot_privilege === Privilege.ADMIN || 
    user.osot_privilege === Privilege.MAIN
  );
}
```

### ✅ Correct: Check if User is Staff

```typescript
// Check if user is STAFF (group check, not privilege)
function isStaffMember(user: UserProfile): boolean {
  return user.osot_account_group === 7; // STAFF group
}

// STAFF members should have MAIN privilege
function validateStaffUser(user: UserProfile): boolean {
  return (
    user.osot_account_group === 7 && 
    user.osot_privilege === 3 // MAIN
  );
}
```

### ❌ WRONG: What Frontend May Be Doing

```typescript
// ❌ WRONG - This blocks admins!
function canAccessAdminInterface(user: UserProfile): boolean {
  return user.osot_privilege === 3; // Only MAIN, blocks ADMIN (2)
}

// ❌ WRONG - Checking "staff" as privilege
if (user.privilege === 'staff') { // staff is not a privilege!
  showAdminInterface();
}
```

---

## 🛠️ Frontend Fix Required

### 1. Update Privilege Constants

```typescript
// src/constants/privileges.ts
export enum Privilege {
  OWNER = 1,
  ADMIN = 2,
  MAIN = 3,
}

export enum AccountGroup {
  MEMBER = 1,
  STUDENT = 2,
  RESIDENT = 3,
  RETIRED = 5,
  CANDIDATE = 6,
  STAFF = 7, // ← This is a GROUP, not a privilege
}
```

### 2. Update Admin Interface Guard

```typescript
// src/guards/AdminGuard.tsx or similar
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // ✅ CORRECT: Check privilege 2 or 3
  const hasAdminAccess = user?.osot_privilege === 2 || user?.osot_privilege === 3;
  
  if (!hasAdminAccess) {
    return <Navigate to="/user-dashboard" replace />;
  }
  
  return <>{children}</>;
}
```

### 3. Update Route Protection

```typescript
// src/routes/PrivateRoutes.tsx
<Routes>
  {/* User Routes - All authenticated users (privilege >= 1) */}
  <Route path="/user/*" element={<UserDashboard />} />
  
  {/* Admin Routes - ADMIN (2) or MAIN (3) only */}
  <Route
    path="/admin/*"
    element={
      <PrivilegeGuard minPrivilege={Privilege.ADMIN}>
        <AdminDashboard />
      </PrivilegeGuard>
    }
  />
</Routes>
```

### 4. Update User Profile Checks

```typescript
// src/hooks/useUserPermissions.ts
export function useUserPermissions() {
  const { user } = useAuth();
  
  return {
    isOwner: user?.osot_privilege === 1,
    isAdmin: user?.osot_privilege === 2,
    isMain: user?.osot_privilege === 3,
    hasAdminAccess: user?.osot_privilege === 2 || user?.osot_privilege === 3,
    isStaffMember: user?.osot_account_group === 7,
    canDelete: user?.osot_privilege === 3, // Only MAIN can delete
  };
}
```

---

## 🔍 Backend Verification (Already Correct)

All backend code uses the correct privilege system:

### ✅ Enum Definition
```typescript
// src/common/enums/privilege.enum.ts
export enum Privilege {
  OWNER = 1,
  ADMIN = 2,
  MAIN = 3,
}
```

### ✅ JWT Payload
```json
{
  "userId": "osot-0000123",
  "userGuid": "abc-123-def",
  "email": "admin@osot.ca",
  "role": "admin",
  "privilege": 2,  // ← Numeric value
  "osot_privilege": 2,
  "osot_account_group": 7  // ← STAFF group (separate from privilege)
}
```

### ✅ Backend Checks
```typescript
// Product Orchestrator (example)
if (userPrivilege !== Privilege.ADMIN && userPrivilege !== Privilege.MAIN) {
  throw createAppError(ErrorCodes.PERMISSION_DENIED, {
    message: 'Only Admin or Main can create products',
  });
}
```

---

## 📋 Testing Checklist for Frontend

- [ ] Update privilege enum (OWNER=1, ADMIN=2, MAIN=3)
- [ ] Remove any "staff" privilege references
- [ ] Update admin interface guards (allow privilege 2 AND 3)
- [ ] Test login with ADMIN user (privilege = 2) → should see admin interface
- [ ] Test login with MAIN user (privilege = 3) → should see admin interface
- [ ] Test login with OWNER user (privilege = 1) → should see user interface only
- [ ] Verify STAFF group check uses `osot_account_group === 7`
- [ ] Update route protection to accept privilege >= 2 for admin routes
- [ ] Update permission hooks/utilities
- [ ] Test delete operations (only MAIN = 3 should work)

---

## 🚨 Immediate Action Required

**For Frontend Team:**

1. **STOP using privilege = 3 as sole admin check** → This blocks ADMIN users!
2. **UPDATE admin guards to check:** `privilege === 2 || privilege === 3`
3. **REMOVE any "staff" privilege references** → Use `osot_account_group = 7` instead
4. **TEST with multiple user types:**
   - Admin user (privilege = 2, group = 7) → Must access admin interface
   - Main user (privilege = 3, group = 7) → Must access admin interface
   - Owner user (privilege = 1, group = 1) → Must see user interface only

---

## 📞 Support

**Questions?** Check:
- Backend enum: `src/common/enums/privilege.enum.ts`
- JWT payload: Decode token at jwt.io
- Backend logs: Look for `osot_privilege` values in auth responses

**Backend Team Contact:** Confirm privilege values in JWT are:
- OWNER = 1
- ADMIN = 2
- MAIN = 3

---

**Last Updated:** January 16, 2026  
**Status:** CRITICAL FIX REQUIRED  
**Affected Systems:** Frontend Admin Interface, Route Guards, Permission Checks

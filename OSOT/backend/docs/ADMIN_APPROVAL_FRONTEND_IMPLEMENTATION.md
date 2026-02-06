# Admin Approval Frontend Implementation Guide

**Status:** 🔴 PENDING IMPLEMENTATION  
**Priority:** HIGH  
**Affected Feature:** Account Registration Admin Approval Workflow  
**Date Created:** January 13, 2026  
**Last Updated:** January 14, 2026

---

## 🎯 Quick Start - Recommended Approach

### ✨ Use Auto-Detection (No Configuration Needed)

**Best solution for daily IP changes:** Frontend automatically detects the correct backend URL based on its own hostname.

**Implementation (5 minutes):**

```typescript
// src/config/api.config.ts
const getApiBaseUrl = (): string => {
  // Production environment
  if (import.meta.env.PROD) {
    return 'https://api.osot.ca';
  }
  
  // Development: Use same IP as frontend
  const hostname = window.location.hostname;
  
  // Network access (e.g., mobile testing)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3000`;
  }
  
  // Default: localhost
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();
```

**Why this works:**
- ✅ No daily IP configuration needed
- ✅ Works on localhost AND network automatically
- ✅ Single source of truth (frontend's own hostname)
- ✅ Zero maintenance
- ✅ Production-ready with environment check

**Then implement the two routes below** (see full code in sections below):
1. `/admin/approve-account/:token` → calls `GET /public/orchestrator/admin/approve/{token}`
2. `/admin/reject-account/:token` → calls `GET /public/orchestrator/admin/reject/{token}`

---

## 📋 Problem Summary

### Current Behavior
When an admin clicks the approval/rejection link in the admin notification email, the link opens the frontend route:
```
http://192.168.10.66:5173/admin/approve-account/{approvalToken}
http://192.168.10.66:5173/admin/reject-account/{rejectionToken}
```

**Issue:** The frontend routes don't exist or aren't calling the backend API, so:
- No processing occurs
- User sees empty page or redirects to login
- Account remains in PENDING status in Dataverse
- User never receives approval notification email

### Expected Behavior
When admin clicks the approval/rejection link:
1. Frontend route intercepts the token from URL
2. Frontend makes HTTP GET request to backend API
3. Backend processes approval/rejection and updates account status
4. Backend sends notification email to user
5. Frontend displays success/error confirmation page
6. Admin can navigate to dashboard or close tab

---

## 🎯 Required Implementation

### Frontend Routes Required

#### Route 1: Admin Approval Page
```typescript
Route: /admin/approve-account/:approvalToken
Method: GET (link from email)
Purpose: Process admin approval of user registration
```

#### Route 2: Admin Rejection Page
```typescript
Route: /admin/reject-account/:rejectionToken
Method: GET (link from email)
Purpose: Process admin rejection of user registration
```

---

## 🔌 Backend API Endpoints (Already Implemented)

### Approval Endpoint
```http
GET /public/orchestrator/admin/approve/:approvalToken
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Registration approved successfully",
  "sessionId": "reg_mkd1hc5w_96d2006c",
  "timestamp": "2026-01-13T20:30:00.000Z",
  "action": "approve",
  "status": "approved",
  "nextStep": "entity_creation",
  "processedBy": "system_admin",
  "processedAt": "2026-01-13T20:30:00.000Z",
  "reason": "Approved by administrator",
  "userNotificationSent": true,
  "isIdempotent": false
}
```

**Response (Error - 404):**
```json
{
  "statusCode": 404,
  "message": "Registration session not found or approval token expired",
  "error": "Not Found"
}
```

**Response (Error - 409):**
```json
{
  "statusCode": 409,
  "message": "Cannot approve registration from state: REJECTED. Expected: PENDING_APPROVAL",
  "error": "Conflict"
}
```

### Rejection Endpoint
```http
GET /public/orchestrator/admin/reject/:rejectionToken
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Registration rejected successfully",
  "sessionId": "reg_mkd1hc5w_96d2006c",
  "timestamp": "2026-01-13T20:30:00.000Z",
  "action": "reject",
  "status": "rejected",
  "nextStep": "registration_rejected",
  "processedBy": "system_admin",
  "processedAt": "2026-01-13T20:30:00.000Z",
  "reason": "Rejected by administrator",
  "userNotificationSent": true
}
```

---

## 💻 Implementation Examples

### React Router Example (TypeScript)

#### 1. Route Configuration
```typescript
// src/routes/AdminRoutes.tsx
import { Routes, Route } from 'react-router-dom';
import AdminApproveAccountPage from '@/pages/admin/AdminApproveAccountPage';
import AdminRejectAccountPage from '@/pages/admin/AdminRejectAccountPage';

export const AdminRoutes = () => {
  return (
    <Routes>
      {/* Other admin routes */}
      <Route 
        path="/admin/approve-account/:token" 
        element={<AdminApproveAccountPage />} 
      />
      <Route 
        path="/admin/reject-account/:token" 
        element={<AdminRejectAccountPage />} 
      />
    </Routes>
  );
};
```

#### 2. Admin Approval Page Component
```typescript
// src/pages/admin/AdminApproveAccountPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { approveRegistration } from '@/services/api/registration';

type ApprovalStatus = 'loading' | 'success' | 'error';

interface ApprovalResult {
  success: boolean;
  message: string;
  sessionId?: string;
  userNotificationSent?: boolean;
}

export default function AdminApproveAccountPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<ApprovalStatus>('loading');
  const [result, setResult] = useState<ApprovalResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No approval token provided');
      return;
    }

    const processApproval = async () => {
      try {
        setStatus('loading');
        
        // Call backend API
        const response = await approveRegistration(token);
        
        setStatus('success');
        setResult(response);
      } catch (err: any) {
        console.error('Approval error:', err);
        setStatus('error');
        
        // Handle different error types
        if (err.response?.status === 404) {
          setError('Registration session not found or approval token expired');
        } else if (err.response?.status === 409) {
          setError(err.response.data.message || 'Registration has already been processed');
        } else {
          setError(err.message || 'An unexpected error occurred');
        }
      }
    };

    processApproval();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Approval...
            </h2>
            <p className="text-gray-600">
              Please wait while we approve the registration.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ✅ Approval Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              {result?.message || 'The registration has been approved successfully.'}
            </p>
            {result?.userNotificationSent && (
              <p className="text-sm text-green-600 mb-4">
                📧 User has been notified via email
              </p>
            )}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate('/admin/registrations')}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                View Registrations
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ❌ Approval Failed
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 3. Admin Rejection Page Component
```typescript
// src/pages/admin/AdminRejectAccountPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rejectRegistration } from '@/services/api/registration';

type RejectionStatus = 'loading' | 'success' | 'error';

interface RejectionResult {
  success: boolean;
  message: string;
  sessionId?: string;
  userNotificationSent?: boolean;
}

export default function AdminRejectAccountPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<RejectionStatus>('loading');
  const [result, setResult] = useState<RejectionResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No rejection token provided');
      return;
    }

    const processRejection = async () => {
      try {
        setStatus('loading');
        
        // Call backend API
        const response = await rejectRegistration(token);
        
        setStatus('success');
        setResult(response);
      } catch (err: any) {
        console.error('Rejection error:', err);
        setStatus('error');
        
        // Handle different error types
        if (err.response?.status === 404) {
          setError('Registration session not found or rejection token expired');
        } else if (err.response?.status === 409) {
          setError(err.response.data.message || 'Registration has already been processed');
        } else {
          setError(err.message || 'An unexpected error occurred');
        }
      }
    };

    processRejection();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Rejection...
            </h2>
            <p className="text-gray-600">
              Please wait while we process the rejection.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
              <svg
                className="h-10 w-10 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registration Rejected
            </h2>
            <p className="text-gray-600 mb-6">
              {result?.message || 'The registration has been rejected.'}
            </p>
            {result?.userNotificationSent && (
              <p className="text-sm text-orange-600 mb-4">
                📧 User has been notified via email
              </p>
            )}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate('/admin/registrations')}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                View Registrations
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ❌ Rejection Failed
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 4. API Service Layer
```typescript
// src/services/api/registration.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.10.66:3000';

export async function approveRegistration(token: string) {
  const response = await axios.get(
    `${API_BASE_URL}/public/orchestrator/admin/approve/${token}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data;
}

export async function rejectRegistration(token: string) {
  const response = await axios.get(
    `${API_BASE_URL}/public/orchestrator/admin/reject/${token}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data;
}
```

---

## 🔧 Environment Configuration

### ⚠️ CRITICAL: Frontend e Backend em Máquinas Diferentes

**A solução de auto-detecção abaixo SÓ funciona quando frontend e backend estão NA MESMA MÁQUINA.**

Se frontend e backend estão em máquinas diferentes (ex: frontend em 192.168.10.50, backend em 192.168.10.66), **use a nova solução de descoberta de backend.**

📚 **Leia:** `docs/CROSS_MACHINE_NETWORK_GUIDE.md` para solução completa.

---

### ⚡ Quick Fix para Máquinas Diferentes:

**Backend já expõe endpoint de configuração:**
```http
GET http://192.168.10.66:3000/config
Response: { "apiUrl": "http://192.168.10.66:3000", "version": "1.0.0" }
```

**Frontend deve buscar configuração ao iniciar:**
```typescript
// src/config/api.config.ts
const BACKEND_IP = import.meta.env.VITE_BACKEND_IP || '192.168.10.66';

async function fetchBackendConfig() {
  const cached = localStorage.getItem('osot_api_url');
  if (cached) return cached;
  
  try {
    const response = await fetch(`http://${BACKEND_IP}:3000/config`);
    const config = await response.json();
    localStorage.setItem('osot_api_url', config.apiUrl);
    return config.apiUrl;
  } catch {
    return `http://${BACKEND_IP}:3000`; // Fallback
  }
}

export const API_BASE_URL = await fetchBackendConfig();
```

**Configure apenas o IP:**
```bash
# .env.local
VITE_BACKEND_IP=192.168.10.66
```

---

### ⚠️ Important: Choose ONE Approach

You have two options for handling daily IP changes:

**Option A: Auto-Detection (RECOMMENDED APENAS para mesma máquina ✨)**
- No environment variables needed
- No daily script execution
- Frontend automatically adapts to any IP
- See "Quick Start" section above

**Option B: Environment Variable Sync (Alternative)**
- Requires daily script execution
- Backend script updates frontend `.env.local`
- More explicit configuration
- See details below

---

### Backend Configuration (Already Automated)

The backend IP is automatically updated daily via `setup-backend-network.ps1`:

```powershell
# Run this script every morning (already in your workflow)
.\setup-backend-network.ps1
```

This script:
- Detects current Wi-Fi IP address automatically
- Updates `.env` file with `API_URL=http://{DETECTED_IP}:3000`
- Configures CORS with multiple origins (localhost + network IP)
- Updates firewall rules for network access

### Frontend Configuration

**Option 1: Use Environment Variable (Recommended)**

Add to frontend `.env.local`:
```bash
# Will be updated automatically by backend script
VITE_API_BASE_URL=http://192.168.10.66:3000
```

**Option 2: Dynamic API Discovery (Best for Daily IP Changes)**

Create a script that reads the backend's IP from a shared location:

```typescript
// src/config/api.config.ts
async function getBackendUrl(): Promise<string> {
  // Option A: Fetch from backend health endpoint
  try {
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    return data.apiUrl || 'http://localhost:3000';
  } catch {
    // Fallback to environment variable
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }
}

// Option B: Use relative URLs (requires same origin)
export const API_BASE_URL = ''; // Empty string uses current origin

// Option C: Use window.location.hostname (if frontend runs on same machine)
export const API_BASE_URL = `http://${window.location.hostname}:3000`;
```

**Option 3: Sync Frontend .env with Backend**

Create a script to copy the IP from backend to frontend:

```powershell
# sync-api-url.ps1 (run after setup-backend-network.ps1)
$backendEnv = Get-Content "..\osot-dataverse-api-phantom\.env" -Raw
$apiUrl = ($backendEnv | Select-String -Pattern "API_URL=(.*)").Matches[0].Groups[1].Value

$frontendEnvPath = ".\.env.local"
$frontendContent = Get-Content $frontendEnvPath -Raw

if ($frontendContent -match "VITE_API_BASE_URL=") {
    $frontendContent = $frontendContent -replace "VITE_API_BASE_URL=.*", "VITE_API_BASE_URL=$apiUrl"
} else {
    $frontendContent += "`nVITE_API_BASE_URL=$apiUrl"
}

Set-Content -Path $frontendEnvPath -Value $frontendContent
Write-Host "✅ Frontend API URL synchronized: $apiUrl" -ForegroundColor Green
```

### Recommended Setup for Daily IP Changes

**🎯 Simplified Morning Workflow (Recommended):**

```powershell
# Single command - updates both backend and frontend automatically
cd osot-dataverse-api-phantom
.\setup-backend-network.ps1

# This script now:
# 1. Detects Wi-Fi IP
# 2. Updates backend .env with API_URL
# 3. Configures CORS
# 4. Updates firewall rules
# 5. Syncs API URL to frontend .env.local automatically

# Then start servers:
npm run start:dev              # Backend (terminal 1)
cd ..\osot-frontend && npm run dev  # Frontend (terminal 2)
```

**📋 Manual Sync (if needed):**
```powershell
# If automatic sync fails, run manually:
cd osot-dataverse-api-phantom
.\sync-frontend-api-url.ps1
```

**🔍 Verification:**
```powershell
# Check backend configuration
Get-Content .env | Select-String "API_URL"

# Check frontend configuration
Get-Content ..\osot-frontend\.env.local | Select-String "VITE_API_BASE_URL"

# Should show the same IP
```

### Production Configuration
```bash
VITE_API_BASE_URL=https://api.osot.ca
```

---

## 🎯 Alternative: Frontend Auto-Detection (No Daily Script Needed)

If you prefer not to run the sync script daily, implement smart detection in the frontend:

### Option 1: Same-Host Detection (Best for Testing on Mobile)
```typescript
// src/config/api.config.ts
const getApiBaseUrl = (): string => {
  // Production
  if (import.meta.env.PROD) {
    return 'https://api.osot.ca';
  }
  
  // Development: Use same IP as frontend
  const hostname = window.location.hostname;
  
  // If accessing via network IP (e.g., from mobile), use same IP for backend
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3000`;
  }
  
  // Default: localhost
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();
```

**How it works:**
- User accesses frontend via `http://192.168.10.66:5173` (mobile)
- Frontend detects hostname is `192.168.10.66`
- Backend URL becomes `http://192.168.10.66:3000` automatically
- No IP hardcoding, no daily updates needed

### Option 2: Environment Variable with Fallback
```typescript
// src/config/api.config.ts
export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL ||  // Use .env value if exists
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'                    // Localhost development
    : `http://${window.location.hostname}:3000`  // Network access
  );
```

### Option 3: Health Check Auto-Discovery
```typescript
// src/config/api.config.ts
let cachedApiUrl: string | null = null;

export async function discoverApiUrl(): Promise<string> {
  if (cachedApiUrl) return cachedApiUrl;
  
  const candidates = [
    'http://localhost:3000',
    `http://${window.location.hostname}:3000`,
    import.meta.env.VITE_API_BASE_URL,
  ].filter(Boolean);
  
  for (const url of candidates) {
    try {
      const response = await fetch(`${url}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2s timeout
      });
      
      if (response.ok) {
        cachedApiUrl = url;
        return url;
      }
    } catch {
      continue;
    }
  }
  
  // Fallback
  return 'http://localhost:3000';
}

// Usage in API service
export async function getApiBaseUrl(): Promise<string> {
  return await discoverApiUrl();
}
```

**Pros of Auto-Detection:**
- ✅ No daily script execution needed
- ✅ Works on any IP automatically
- ✅ Same code for localhost and network testing
- ✅ Fallback to environment variable if needed

**Cons:**
- ⚠️ Adds small overhead (health check)
- ⚠️ Requires backend to be running first
- ⚠️ May have initial delay on first request

**Recommendation:** Use **Option 1 (Same-Host Detection)** for simplicity and best performance.

---

## 🧪 Testing Guide

### Manual Testing Steps

#### 1. Test Registration Flow
```bash
# 1. Start backend server
cd osot-dataverse-api-phantom
npm run start:dev

# 2. Start frontend server
cd osot-frontend
npm run dev

# 3. Register new user via frontend
# Email will be sent to admin
```

#### 2. Test Approval (from email link)
```
1. Open admin email inbox
2. Find "Admin Approval Required" email
3. Click "✅ Approve Registration" button
4. Should redirect to: http://192.168.10.66:5173/admin/approve-account/{token}
5. Frontend should show loading → success page
6. Check backend logs for approval processing
7. Check user email for approval notification
8. Verify in Dataverse: osot_account_status = 1 (ACTIVE)
```

#### 3. Test Rejection (from email link)
```
1. Register another user
2. Open admin email
3. Click "❌ Reject Registration" button
4. Should redirect to: http://192.168.10.66:5173/admin/reject-account/{token}
5. Frontend should show loading → success page
6. Check backend logs for rejection processing
7. Check user email for rejection notification
8. Verify in Dataverse: osot_account_status = 2 (INACTIVE)
```

#### 4. Test Error Scenarios

**Invalid Token:**
```
http://192.168.10.66:5173/admin/approve-account/invalid_token_12345
Expected: Error page with "token not found" message
```

**Expired Token:**
```
# Wait 7 days or manually expire token in Redis
Expected: Error page with "token expired" message
```

**Already Processed:**
```
# Click approval link twice
Expected: Success page with idempotent message (already approved)
```

### Automated Testing (Jest/Vitest)

```typescript
// src/pages/admin/__tests__/AdminApproveAccountPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import AdminApproveAccountPage from '../AdminApproveAccountPage';
import * as registrationApi from '@/services/api/registration';

// Mock API
vi.mock('@/services/api/registration');

describe('AdminApproveAccountPage', () => {
  const mockApproveRegistration = registrationApi.approveRegistration as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    mockApproveRegistration.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={['/admin/approve-account/test-token']}>
        <Routes>
          <Route path="/admin/approve-account/:token" element={<AdminApproveAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/processing approval/i)).toBeInTheDocument();
  });

  it('should show success message on successful approval', async () => {
    mockApproveRegistration.mockResolvedValue({
      success: true,
      message: 'Registration approved successfully',
      userNotificationSent: true,
    });

    render(
      <MemoryRouter initialEntries={['/admin/approve-account/test-token']}>
        <Routes>
          <Route path="/admin/approve-account/:token" element={<AdminApproveAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/approval successful/i)).toBeInTheDocument();
      expect(screen.getByText(/user has been notified/i)).toBeInTheDocument();
    });
  });

  it('should show error message on approval failure', async () => {
    mockApproveRegistration.mockRejectedValue({
      response: {
        status: 404,
        data: { message: 'Session not found' },
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin/approve-account/test-token']}>
        <Routes>
          <Route path="/admin/approve-account/:token" element={<AdminApproveAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/approval failed/i)).toBeInTheDocument();
      expect(screen.getByText(/session not found/i)).toBeInTheDocument();
    });
  });

  it('should call API with correct token', async () => {
    const testToken = 'approve_test123';
    mockApproveRegistration.mockResolvedValue({ success: true });

    render(
      <MemoryRouter initialEntries={[`/admin/approve-account/${testToken}`]}>
        <Routes>
          <Route path="/admin/approve-account/:token" element={<AdminApproveAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockApproveRegistration).toHaveBeenCalledWith(testToken);
    });
  });
});
```

---

## 📊 Backend Processing Flow (Already Implemented)

```
Admin clicks email link
  ↓
GET /public/orchestrator/admin/approve/{token}
  ↓
AccountOrchestratorPublicController.approveRegistration()
  ↓
AccountOrchestratorService.processAdminApprovalByToken()
  ↓
OrchestratorEmailWorkflowService.processAdminApprovalByToken()
  ↓
1. Find session by approval token (Redis)
2. Validate token and session state
3. Update session state to APPROVED
  ↓
AccountOrchestratorService.updateAccountStatus()
  ↓
AccountCrudService.updateSystemFields(guid, {osot_account_status: 1}, 'main')
  ↓
AccountRepository.update() with 'main' app credentials
  ↓
Dataverse: PATCH osot_table_accounts
  ↓
osot_account_status updated to 1 (ACTIVE)
  ↓
OrchestratorEmailWorkflowService.sendPostEntityCreationNotification()
  ↓
EmailService.sendEmail('account-approved-active' template)
  ↓
User receives approval email
  ↓
Return success response to frontend
```

---

## 🐛 Known Issues & Edge Cases

### Issue 1: Token Already Used (Idempotent Operation)
**Scenario:** Admin clicks approval link twice  
**Backend Behavior:** Returns success with `isIdempotent: true`  
**Frontend Action:** Show success message indicating already processed

### Issue 2: Expired Token
**Scenario:** Token older than 7 days  
**Backend Behavior:** Returns 404 error  
**Frontend Action:** Show error with "token expired" message

### Issue 3: Wrong Action Token
**Scenario:** Using rejection token on approval endpoint  
**Backend Behavior:** Returns 409 Conflict  
**Frontend Action:** Show error with "invalid token" message

### Issue 4: Network Timeout
**Scenario:** Backend unavailable or slow  
**Frontend Action:** Show error after 30s timeout, provide "Try Again" button

---

## 📝 Acceptance Criteria

- [ ] Frontend routes `/admin/approve-account/:token` and `/admin/reject-account/:token` exist
- [ ] Clicking email approval link calls backend API automatically
- [ ] Loading state shows while processing
- [ ] Success page displays on successful approval/rejection
- [ ] Error page displays with clear message on failure
- [ ] User receives notification email after approval/rejection
- [ ] Account status in Dataverse updates to ACTIVE (1) or INACTIVE (2)
- [ ] Idempotent operations handled (clicking link twice doesn't fail)
- [ ] Error handling for expired tokens, invalid tokens, network errors
- [ ] Navigation buttons work (Go to Dashboard, View Registrations)
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Automated tests cover success, error, and edge cases

---

## 🔗 Related Documentation

- Backend Implementation: `ARCHITECTURE_OVERVIEW.md`
- Email Workflow: `docs/EMAIL_VERIFICATION_URLS.md`
- API Endpoints: OpenAPI spec at `http://192.168.10.66:3000/api-docs`
- Registration Orchestrator: `docs/ACCOUNT_UPDATE_PLAN.md`

---

## 👥 Contacts

**Backend Lead:** Bruno Amaral (bamaral@osot.on.ca)  
**Frontend Team:** [Add contact]  
**Questions:** Check backend logs for detailed error messages

---

## 📅 Implementation Timeline

**Estimated Effort:** 4-6 hours  
- Route setup: 30 min
- Component development: 2-3 hours
- API integration: 1 hour
- Testing: 1-2 hours
- Bug fixes: 1 hour buffer

**Priority:** HIGH - Blocking registration workflow completion

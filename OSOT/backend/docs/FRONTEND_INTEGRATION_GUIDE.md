# 🚀 OSOT Dataverse API - Frontend Integration Guide

**Version**: 1.0.0  
**Last Updated**: January 21, 2026  
**API Base URL**: `https://api.osot.com` (Production) | `http://localhost:3000` (Development)

---

## ⚡ NEW: Cache Invalidation System (January 2026)

**IMPORTANT:** The backend now automatically invalidates cache after UPDATE/DELETE operations. This means:

- ✅ Data updates are reflected much **faster** (~2-3 seconds instead of 60 seconds)
- ⚠️ Frontend needs to **wait 2-3 seconds** before refetching after mutations
- 📖 **See:** [CACHE_INVALIDATION_QUICK_REFERENCE.md](CACHE_INVALIDATION_QUICK_REFERENCE.md) for integration patterns

**For Developers:**
- See [FRONTEND_CACHE_INVALIDATION_INTEGRATION_GUIDE.md](FRONTEND_CACHE_INVALIDATION_INTEGRATION_GUIDE.md) for complete guide
- See [BACKEND_CACHE_INVALIDATION_ARCHITECTURE.md](BACKEND_CACHE_INVALIDATION_ARCHITECTURE.md) for technical details

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [⚡ Cache Invalidation (NEW)](#-cache-invalidation-system-january-2026)
3. [Authentication](#authentication)
4. [API Resources Overview](#api-resources-overview)
5. [OpenAPI/Swagger Integration](#openapiswagger-integration)
6. [Code Generation Setup](#code-generation-setup)
7. [Consuming Enums](#consuming-enums)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [Request/Response Examples](#requestresponse-examples)
10. [Error Handling](#error-handling)
11. [Best Practices](#best-practices)

---

## 🎯 Quick Start

### **Step 1: Access API Documentation**

The API provides interactive documentation via Swagger UI:

```
Development: http://localhost:3000/api-docs
Production:  https://api.osot.com/api-docs
```

### **Step 2: Download OpenAPI Specification**

Get the complete API schema in JSON format:

```bash
# Option A: Download from running API
curl http://localhost:3000/openapi.json -o openapi.json

# Option B: Generate locally (backend team)
npm run openapi:generate
```

### **Step 3: Test Health Endpoint**

Verify API connectivity:

```bash
curl http://localhost:3000/
```

**Response:**
```json
{
  "message": "OSOT Dataverse API - Production Ready Modules: Account, Address, Contact, Identity, OT Education | Documentation: /api-docs",
  "version": "1.0.0",
  "timestamp": "2025-11-28T10:00:00.000Z"
}
```

---

## 🔐 Authentication

### **Authentication Flow**

The API uses **JWT Bearer Token** authentication.

#### **1. Login**

**Endpoint**: `POST /auth/login`

**Request:**
```typescript
POST /auth/login
Content-Type: application/json

{
  "osot_email": "user@example.com",
  "osot_password": "SecurePass123!"
}
```

**Response:**
```typescript
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "osot_user_guid_account": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "osot_email": "user@example.com",
    "osot_first_name": "John",
    "osot_last_name": "Doe",
    "userType": "account"
  }
}
```

#### **2. Using the Token**

Include the token in the `Authorization` header for all authenticated requests:

```typescript
fetch('http://localhost:3000/private/accounts/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  }
});
```

#### **3. Token Expiration**

- Tokens expire after 1 hour (configurable)
- Implement refresh logic or re-authenticate when receiving `401 Unauthorized`

---

## 📚 API Resources Overview

The API is organized into **logical modules**:

| Module | Description | Base Path |
|--------|-------------|-----------|
| **Health Check** | API status and health monitoring | `/`, `/health` |
| **Authentication** | Login, logout, token management | `/auth` |
| **Account** | User account management | `/public/accounts`, `/private/accounts` |
| **Identity** | User identity information | `/public/identities`, `/private/identities` |
| **Contact** | Contact information | `/public/contacts`, `/private/contacts` |
| **Address** | Address management | `/public/addresses`, `/private/addresses` |
| **OT Education** | Occupational Therapy education | `/public/ot-educations`, `/private/ot-educations` |
| **OTA Education** | Occupational Therapy Assistant education | `/public/ota-educations`, `/private/ota-educations` |
| **Membership Settings** | Membership configuration | `/public/membership-settings`, `/private/membership-settings` |
| **Membership Category** | Member categories | `/private/membership-categories` |
| **Membership Employment** | Employment information | `/private/membership-employments` |
| **Membership Practices** | Practice information | `/private/membership-practices` |
| **Membership Preferences** | User preferences | `/private/membership-preferences` |
| **Orchestrator** | Complex multi-step operations | `/public/orchestrator` |

---

## 🔧 OpenAPI/Swagger Integration

### **Why Use OpenAPI?**

✅ **Type-safe** client code generation  
✅ **Auto-complete** in your IDE  
✅ **Enums automatically shared** with backend  
✅ **Documentation always synchronized**  
✅ **Reduces bugs** from manual typing  

### **Accessing OpenAPI Schema**

The API exposes its OpenAPI specification at:

```
http://localhost:3000/openapi.json
```

**Example Schema Structure:**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "OSOT Dataverse API",
    "version": "1.0"
  },
  "servers": [
    { "url": "http://localhost:3000" }
  ],
  "paths": {
    "/auth/login": { ... },
    "/private/accounts/me": { ... }
  },
  "components": {
    "schemas": {
      "CreateAccountDto": { ... },
      "EmploymentStatus": { "enum": ["...", "..."] }
    }
  }
}
```

---

## 🛠️ Code Generation Setup

### **Option 1: TypeScript + Axios (Recommended)**

#### **Install Generator**

```bash
npm install --save-dev @openapitools/openapi-generator-cli
```

#### **Generate Client**

```bash
npx openapi-generator-cli generate \
  -i http://localhost:3000/openapi.json \
  -g typescript-axios \
  -o ./src/api-client \
  --additional-properties=supportsES6=true,npmName=osot-api-client
```

#### **Use Generated Client**

```typescript
import { 
  Configuration, 
  AccountsApi, 
  MembershipEmploymentsApi,
  EmploymentStatus,
  CreateMembershipEmploymentDto
} from './api-client';

// Configure API client
const config = new Configuration({
  basePath: 'http://localhost:3000',
  accessToken: localStorage.getItem('access_token') || ''
});

// Create API instances
const accountsApi = new AccountsApi(config);
const employmentsApi = new MembershipEmploymentsApi(config);

// Type-safe API calls with autocomplete!
const account = await accountsApi.getMyAccount();

const employment: CreateMembershipEmploymentDto = {
  osot_employment_status: EmploymentStatus.EMPLOYEE_SALARIED, // Enum autocomplete!
  osot_work_hours: [WorkHours.EXACTLY_35],
  osot_role_descriptor: RoleDescription.DIRECT_INDIRECT_CARE_PROVIDER,
  // ... all fields with type checking
};

await employmentsApi.createMyEmployment(employment);
```

---

### **Option 2: React Query + Generated Client**

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { AccountsApi } from './api-client';

const accountsApi = new AccountsApi(config);

// Fetch account
const { data: account, isLoading } = useQuery({
  queryKey: ['account', 'me'],
  queryFn: () => accountsApi.getMyAccount()
});

// Update account
const updateAccount = useMutation({
  mutationFn: (data: UpdateAccountDto) => accountsApi.updateMyAccount(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['account', 'me']);
  }
});
```

---

### **Option 3: Fetch API (Manual)**

If you prefer not to use code generation:

```typescript
// types.ts - Define types manually
export enum EmploymentStatus {
  EMPLOYEE_SALARIED = 'Employee (Salaried)',
  EMPLOYEE_HOURLY = 'Employee (Hourly)',
  SELF_EMPLOYED = 'Self-Employed',
  // ... copy from backend enums
}

export interface CreateMembershipEmploymentDto {
  osot_employment_status: EmploymentStatus;
  osot_work_hours: WorkHours[];
  // ... all fields
}

// api.ts - Create API service
class OsotApi {
  private baseUrl = 'http://localhost:3000';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Account endpoints
  async getMyAccount() {
    return this.request<AccountDto>('/private/accounts/me');
  }

  async updateMyAccount(data: UpdateAccountDto) {
    return this.request<AccountDto>('/private/accounts/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Employment endpoints
  async createMyEmployment(data: CreateMembershipEmploymentDto) {
    return this.request<MembershipEmploymentDto>('/private/membership-employments/me', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new OsotApi();
```

---

## 🎨 Consuming Enums

The API provides **47 dedicated enum endpoints** organized in **10 categories**, exposing **36 public enums** (100% coverage). All enums are available at `/public/enums/*` endpoints.

### **📊 Available Enum Endpoints (47 Total)**

#### **Geography (3 endpoints)**
- `GET /public/enums/provinces` - Canadian provinces
- `GET /public/enums/countries` - Countries
- `GET /public/enums/cities` - Canadian cities

#### **Account (5 endpoints)**
- `GET /public/enums/account-statuses` - Account statuses
- `GET /public/enums/account-groups` - Account groups (OT, OTA, Vendor)
- `GET /public/enums/access-modifiers` - Access modifiers (PUBLIC, PROTECTED, PRIVATE)
- `GET /public/enums/privileges` - Privilege levels (OWNER, ADMIN, MAIN)
- `GET /public/enums/user-groups` - User groups (9 types)

#### **Address (2 endpoints)**
- `GET /public/enums/address-types` - Address types (HOME, WORK, OTHER)
- `GET /public/enums/address-preferences` - Address preferences (MAIL, SHIPPING, BILLING)

#### **Identity (4 endpoints)**
- `GET /public/enums/genders` - Gender options
- `GET /public/enums/languages` - Language preferences
- `GET /public/enums/races` - Race/ethnicity options (11 options)
- `GET /public/enums/indigenous-details` - Indigenous identity details (4 options)

#### **Education (6 endpoints)**
- `GET /public/enums/degree-types` - Degree types (5 options)
- `GET /public/enums/coto-statuses` - COTO membership statuses (6 options)
- `GET /public/enums/education-categories` - Education categories (GRADUATED, STUDENT, NEW_GRADUATED)
- `GET /public/enums/graduation-years` - Graduation years (51 years: PRE_1960 to YEAR_2027)
- `GET /public/enums/ot-universities` - OT universities (7 Canadian institutions)
- `GET /public/enums/ota-colleges` - OTA colleges (27 Canadian institutions)

#### **Employment (7 endpoints)**
- `GET /public/enums/employment-statuses` - Employment statuses
- `GET /public/enums/benefits` - Employment benefits
- `GET /public/enums/funding-sources` - Funding sources
- `GET /public/enums/hourly-earnings` - Hourly earnings ranges
- `GET /public/enums/practice-years` - Years of practice
- `GET /public/enums/role-descriptors` - Role descriptors
- `GET /public/enums/work-hours` - Work hours options

#### **Practice (4 endpoints)**
- `GET /public/enums/clients-age` - Client age groups
- `GET /public/enums/practice-areas` - Practice areas
- `GET /public/enums/practice-services` - Practice services
- `GET /public/enums/practice-settings` - Practice settings

#### **Preferences (4 endpoints)**
- `GET /public/enums/practice-promotion` - Practice promotion preferences
- `GET /public/enums/psychotherapy-supervision` - Psychotherapy supervision
- `GET /public/enums/search-tools` - Search tools preferences
- `GET /public/enums/third-parties` - Third party sharing preferences

#### **Membership (2 endpoints)**
- `GET /public/enums/affiliate-areas` - Affiliate areas
- `GET /public/enums/membership-categories` - Membership categories

#### **Consolidated Endpoints (9 endpoints)**
- `GET /public/enums/all` - **All enums in one request** (recommended for app initialization)
- `GET /public/enums/geography` - All geography enums
- `GET /public/enums/account` - All account enums
- `GET /public/enums/address` - All address enums
- `GET /public/enums/identity` - All identity enums
- `GET /public/enums/education` - All education enums
- `GET /public/enums/employment` - All employment enums
- `GET /public/enums/practice` - All practice enums
- `GET /public/enums/preferences` - All preferences enums

#### **Utility (1 endpoint)**
- `GET /public/enums/health` - Health check for enums service

---

### **Strategy 1: Fetch All Enums at Startup (Recommended)**

Fetch all 36 enums in a single request for optimal performance:

```typescript
// Fetch all enums at app initialization
const response = await fetch('http://localhost:3000/public/enums/all');
const { success, data } = await response.json();

// Response structure:
{
  "success": true,
  "data": {
    // Geography
    "provinces": [{ "value": 1, "label": "Ontario" }, ...],
    "countries": [{ "value": 1, "label": "Canada" }, ...],
    "cities": [{ "value": 1, "label": "Toronto" }, ...],
    
    // Account
    "accountStatuses": [{ "value": 1, "label": "Active" }, ...],
    "accountGroups": [{ "value": 1, "label": "Occupational Therapist" }, ...],
    "accessModifiers": [{ "value": 1, "label": "Public" }, ...],
    "privileges": [{ "value": 1, "label": "Owner" }, ...],
    "userGroups": [{ "value": 1, "label": "OT Student" }, ...],
    
    // Address
    "addressTypes": [{ "value": 1, "label": "Home" }, ...],
    "addressPreferences": [{ "value": 1, "label": "Mail" }, ...],
    
    // Identity
    "genders": [{ "value": 1, "label": "Male" }, ...],
    "languages": [{ "value": 1, "label": "English" }, ...],
    "races": [{ "value": 1, "label": "White" }, ...],
    "indigenousDetails": [{ "value": 1, "label": "First Nations" }, ...],
    
    // Education
    "degreeTypes": [{ "value": 1, "label": "Bachelor's Degree" }, ...],
    "cotoStatuses": [{ "value": 1, "label": "Active Member" }, ...],
    "educationCategories": [{ "value": 1, "label": "Graduated" }, ...],
    "graduationYears": [{ "value": 0, "label": "Pre-1960" }, { "value": 1, "label": "1960" }, ...],
    "otUniversities": [{ "value": 1, "label": "University of Toronto" }, ...],
    "otaColleges": [{ "value": 1, "label": "George Brown College" }, ...],
    
    // Employment
    "employmentStatuses": [{ "value": 1, "label": "Employee (Salaried)" }, ...],
    "benefits": [{ "value": 1, "label": "Extended Health/Dental Care" }, ...],
    "fundingSources": [{ "value": 1, "label": "Provincial Government" }, ...],
    "hourlyEarnings": [{ "value": 1, "label": "Between $41 to $50" }, ...],
    "practiceYears": [{ "value": 1, "label": "Less than 1 year" }, ...],
    "roleDescriptors": [{ "value": 1, "label": "Direct/Indirect Care Provider" }, ...],
    "workHours": [{ "value": 1, "label": "Exactly 35 hours" }, ...],
    
    // Practice
    "clientsAge": [{ "value": 1, "label": "Children (0-12)" }, ...],
    "practiceAreas": [{ "value": 1, "label": "Mental Health" }, ...],
    "practiceServices": [{ "value": 1, "label": "Assessment" }, ...],
    "practiceSettings": [{ "value": 1, "label": "Hospital" }, ...],
    
    // Preferences
    "practicePromotion": [{ "value": 1, "label": "Yes" }, ...],
    "psychotherapySupervision": [{ "value": 1, "label": "Yes" }, ...],
    "searchTools": [{ "value": 1, "label": "Google" }, ...],
    "thirdParties": [{ "value": 1, "label": "Yes" }, ...],
    
    // Membership
    "affiliateAreas": [{ "value": 1, "label": "Toronto" }, ...],
    "membershipCategories": [{ "value": 1, "label": "Full Member" }, ...]
  }
}

// Store in app state (Redux, Context, etc.)
const [enums, setEnums] = useState(null);

useEffect(() => {
  fetch('http://localhost:3000/public/enums/all')
    .then(res => res.json())
    .then(({ data }) => setEnums(data));
}, []);

// Use in components
<select name="province">
  {enums?.provinces.map(province => (
    <option key={province.value} value={province.value}>
      {province.label}
    </option>
  ))}
</select>
```

---

### **Strategy 2: Fetch Specific Enum Categories**

For lazy loading or smaller bundles, fetch only needed categories:

```typescript
// Fetch only employment-related enums
const response = await fetch('http://localhost:3000/public/enums/employment');
const { success, data } = await response.json();

// Response:
{
  "success": true,
  "data": {
    "employmentStatuses": [{ "value": 1, "label": "Employee (Salaried)" }, ...],
    "benefits": [...],
    "fundingSources": [...],
    "hourlyEarnings": [...],
    "practiceYears": [...],
    "roleDescriptors": [...],
    "workHours": [...]
  }
}

// Or fetch individual enums
const provincesResponse = await fetch('http://localhost:3000/public/enums/provinces');
const { data: provinces } = await provincesResponse.json();
// provinces = [{ value: 1, label: "Ontario" }, { value: 2, label: "Quebec" }, ...]
```

---

### **Strategy 3: Use Generated Enums (Type-Safe)**

When using OpenAPI code generation, enums are automatically created:

```typescript
import { EmploymentStatus, WorkHours, Benefits } from './api-client';

// TypeScript knows all valid values
const status: EmploymentStatus = EmploymentStatus.EMPLOYEE_SALARIED;

// Use in forms with autocomplete
<select value={formData.status}>
  {Object.values(EmploymentStatus).map(status => (
    <option key={status} value={status}>{status}</option>
  ))}
</select>
```

---

### **Strategy 4: Copy Enums Manually (Not Recommended)**

⚠️ **Only use if you cannot use dynamic fetching or code generation:**

```typescript
// frontend/src/enums/employment-status.enum.ts
export enum EmploymentStatus {
  EMPLOYEE_SALARIED = 1,
  EMPLOYEE_HOURLY = 2,
  SELF_EMPLOYED = 3,
  CONTRACT_CASUAL = 4,
  RETIRED = 5,
  NOT_EMPLOYED = 6,
}

// With display names
export const EmploymentStatusLabels: Record<EmploymentStatus, string> = {
  [EmploymentStatus.EMPLOYEE_SALARIED]: "Employee (Salaried)",
  [EmploymentStatus.EMPLOYEE_HOURLY]: "Employee (Hourly)",
  [EmploymentStatus.SELF_EMPLOYED]: "Self-Employed",
  [EmploymentStatus.CONTRACT_CASUAL]: "Contract/Casual",
  [EmploymentStatus.RETIRED]: "Retired",
  [EmploymentStatus.NOT_EMPLOYED]: "Not Employed",
};
```

⚠️ **Warning**: Manual copying requires keeping enums synchronized with backend!

---

### **Complete React Example with Enums**

```typescript
import React, { useEffect, useState } from 'react';

interface EnumOption {
  value: number;
  label: string;
}

interface AppEnums {
  provinces: EnumOption[];
  genders: EnumOption[];
  employmentStatuses: EnumOption[];
  // ... all other enums
}

export const useEnums = () => {
  const [enums, setEnums] = useState<AppEnums | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/public/enums/all')
      .then(res => res.json())
      .then(({ success, data }) => {
        if (success) {
          setEnums(data);
        } else {
          setError('Failed to load enums');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { enums, loading, error };
};

// Usage in components
const RegistrationForm = () => {
  const { enums, loading } = useEnums();

  if (loading) return <div>Loading form...</div>;

  return (
    <form>
      <select name="province">
        {enums?.provinces.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      <select name="gender">
        {enums?.genders.map(g => (
          <option key={g.value} value={g.value}>{g.label}</option>
        ))}
      </select>

      <select name="employmentStatus">
        {enums?.employmentStatuses.map(e => (
          <option key={e.value} value={e.value}>{e.label}</option>
        ))}
      </select>
    </form>
  );
};
```

---

## 📡 API Endpoints Reference

### **Enums (47 endpoints)**

**All enums are publicly accessible without authentication.**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/public/enums/all` | Get all 36 enums in one request | ❌ |
| GET | `/public/enums/provinces` | Canadian provinces | ❌ |
| GET | `/public/enums/countries` | Countries | ❌ |
| GET | `/public/enums/cities` | Canadian cities | ❌ |
| GET | `/public/enums/account-statuses` | Account statuses | ❌ |
| GET | `/public/enums/account-groups` | Account groups | ❌ |
| GET | `/public/enums/access-modifiers` | Access modifiers | ❌ |
| GET | `/public/enums/privileges` | Privilege levels | ❌ |
| GET | `/public/enums/user-groups` | User groups | ❌ |
| GET | `/public/enums/address-types` | Address types | ❌ |
| GET | `/public/enums/address-preferences` | Address preferences | ❌ |
| GET | `/public/enums/genders` | Gender options | ❌ |
| GET | `/public/enums/languages` | Language preferences | ❌ |
| GET | `/public/enums/races` | Race/ethnicity options | ❌ |
| GET | `/public/enums/indigenous-details` | Indigenous details | ❌ |
| GET | `/public/enums/degree-types` | Degree types | ❌ |
| GET | `/public/enums/coto-statuses` | COTO statuses | ❌ |
| GET | `/public/enums/education-categories` | Education categories | ❌ |
| GET | `/public/enums/graduation-years` | Graduation years (51 years) | ❌ |
| GET | `/public/enums/ot-universities` | OT universities | ❌ |
| GET | `/public/enums/ota-colleges` | OTA colleges | ❌ |
| GET | `/public/enums/employment-statuses` | Employment statuses | ❌ |
| GET | `/public/enums/benefits` | Employment benefits | ❌ |
| GET | `/public/enums/funding-sources` | Funding sources | ❌ |
| GET | `/public/enums/hourly-earnings` | Hourly earnings | ❌ |
| GET | `/public/enums/practice-years` | Years of practice | ❌ |
| GET | `/public/enums/role-descriptors` | Role descriptors | ❌ |
| GET | `/public/enums/work-hours` | Work hours | ❌ |
| GET | `/public/enums/clients-age` | Client age groups | ❌ |
| GET | `/public/enums/practice-areas` | Practice areas | ❌ |
| GET | `/public/enums/practice-services` | Practice services | ❌ |
| GET | `/public/enums/practice-settings` | Practice settings | ❌ |
| GET | `/public/enums/practice-promotion` | Practice promotion | ❌ |
| GET | `/public/enums/psychotherapy-supervision` | Psychotherapy supervision | ❌ |
| GET | `/public/enums/search-tools` | Search tools | ❌ |
| GET | `/public/enums/third-parties` | Third parties | ❌ |
| GET | `/public/enums/affiliate-areas` | Affiliate areas | ❌ |
| GET | `/public/enums/membership-categories` | Membership categories | ❌ |
| GET | `/public/enums/geography` | All geography enums | ❌ |
| GET | `/public/enums/account` | All account enums | ❌ |
| GET | `/public/enums/address` | All address enums | ❌ |
| GET | `/public/enums/identity` | All identity enums | ❌ |
| GET | `/public/enums/education` | All education enums | ❌ |
| GET | `/public/enums/employment` | All employment enums | ❌ |
| GET | `/public/enums/practice` | All practice enums | ❌ |
| GET | `/public/enums/preferences` | All preferences enums | ❌ |
| GET | `/public/enums/health` | Enums service health check | ❌ |

**📌 Best Practice**: Use `/public/enums/all` at app startup to fetch all enums in a single request.

---

### **Authentication**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | User login | ❌ |
| POST | `/auth/logout` | User logout | ✅ |

---

### **Account Management**

#### **Public Endpoints (No Auth)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/public/accounts` | Create new account (registration) |
| GET | `/public/accounts/:id` | Get account by ID |

#### **Private Endpoints (Auth Required)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/private/accounts/me` | Get current user's account |
| PATCH | `/private/accounts/me` | Update current user's account |
| GET | `/private/accounts` | List all accounts (admin) |
| GET | `/private/accounts/:id` | Get specific account (admin) |
| PATCH | `/private/accounts/:id` | Update specific account (admin) |

---

### **Identity**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/public/identities` | Create identity | ❌ |
| GET | `/public/identities/:id` | Get identity | ❌ |
| GET | `/private/identities/me` | Get my identity | ✅ |
| PATCH | `/private/identities/me` | Update my identity | ✅ |

---

### **Contact**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/public/contacts` | Create contact | ❌ |
| GET | `/public/contacts/:id` | Get contact | ❌ |
| GET | `/private/contacts/me` | Get my contact | ✅ |
| PATCH | `/private/contacts/me` | Update my contact | ✅ |

---

### **Address**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/public/addresses` | Create address | ❌ |
| GET | `/public/addresses/:id` | Get address | ❌ |
| GET | `/private/addresses/me` | Get my address | ✅ |
| PATCH | `/private/addresses/me` | Update my address | ✅ |

---

### **OT Education**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/public/ot-educations` | Create OT education | ❌ |
| GET | `/public/ot-educations/:id` | Get OT education | ❌ |
| GET | `/private/ot-educations/me` | Get my OT education | ✅ |
| PATCH | `/private/ot-educations/me` | Update my OT education | ✅ |

---

### **Membership Settings**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/public/membership-settings` | Get active membership settings | ❌ |
| POST | `/private/membership-settings` | Create membership settings (admin) | ✅ |
| GET | `/private/membership-settings/me` | Get my membership settings | ✅ |
| PATCH | `/private/membership-settings/me` | Update my membership settings | ✅ |

---

### **Membership Category**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/private/membership-categories/me` | Create my category | ✅ |
| GET | `/private/membership-categories/me` | Get my category | ✅ |
| PATCH | `/private/membership-categories/me` | Update my category | ✅ |

---

### **Membership Employment**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/private/membership-employments/me` | Create my employment | ✅ |
| GET | `/private/membership-employments/me` | Get my employment | ✅ |
| PATCH | `/private/membership-employments/me` | Update my employment | ✅ |
| GET | `/private/membership-employments` | List all employments (admin) | ✅ |
| GET | `/private/membership-employments/:id` | Get specific employment (admin) | ✅ |
| PATCH | `/private/membership-employments/:id` | Update employment (admin) | ✅ |

---

### **Membership Practices**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/private/membership-practices/me` | Create my practices | ✅ |
| GET | `/private/membership-practices/me` | Get my practices | ✅ |
| PATCH | `/private/membership-practices/me` | Update my practices | ✅ |
| GET | `/private/membership-practices` | List all practices (admin) | ✅ |
| GET | `/private/membership-practices/:id` | Get specific practices (admin) | ✅ |
| PATCH | `/private/membership-practices/:id` | Update practices (admin) | ✅ |

---

### **Membership Preferences**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/private/membership-preferences/me` | Create my preferences | ✅ |
| GET | `/private/membership-preferences/me` | Get my preferences | ✅ |
| PATCH | `/private/membership-preferences/me` | Update my preferences | ✅ |

---

### **Orchestrator (Multi-Step Operations)**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/public/orchestrator/register` | Complete user registration (all tables) | ❌ |

---

## 💡 Request/Response Examples

### **Example 1: User Registration**

**Endpoint**: `POST /public/orchestrator/register`

**Request:**
```typescript
{
  // Account
  "osot_email": "john.doe@example.com",
  "osot_password": "SecurePass123!",
  "osot_type_account": "Individual",
  
  // Identity
  "osot_first_name": "John",
  "osot_last_name": "Doe",
  "osot_preferred_name": "Johnny",
  "osot_gender": "Male",
  "osot_pronouns": "He/Him",
  "osot_birth_date": "1990-05-15",
  
  // Contact
  "osot_telephone_home": "+1-416-555-1234",
  "osot_telephone_cell": "+1-416-555-5678",
  
  // Address
  "osot_street_address_1": "123 Main Street",
  "osot_city": "Toronto",
  "osot_postal_code": "M5H 2N2",
  "osot_province": "Ontario",
  "osot_country": "Canada",
  
  // OT Education
  "osot_university": "University of Toronto",
  "osot_entry_practice_year": "2015",
  "osot_degree": "Master of Science in Occupational Therapy"
}
```

**Response (201 Created):**
```typescript
{
  "osot_user_guid_account": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "osot_email": "john.doe@example.com",
  "osot_first_name": "John",
  "osot_last_name": "Doe",
  "message": "Account created successfully"
}
```

---

### **Example 2: Login**

**Endpoint**: `POST /auth/login`

**Request:**
```typescript
{
  "osot_email": "john.doe@example.com",
  "osot_password": "SecurePass123!"
}
```

**Response (200 OK):**
```typescript
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMWIyYzNkNC1lNWY2LTc4OTAtYWJjZC1lZjEyMzQ1Njc4OTAiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwiaWF0IjoxNzAxMTc4ODAwLCJleHAiOjE3MDExODI0MDB9.xyz...",
  "user": {
    "osot_user_guid_account": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "osot_email": "john.doe@example.com",
    "osot_first_name": "John",
    "osot_last_name": "Doe",
    "userType": "account"
  }
}
```

---

### **Example 3: Get My Account**

**Endpoint**: `GET /private/accounts/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```typescript
{
  "osot_user_guid_account": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "osot_email": "john.doe@example.com",
  "osot_type_account": "Individual",
  "osot_Table_Identity@odata.bind": "/osot_table_identities(guid-here)",
  "osot_Table_Contact@odata.bind": "/osot_table_contacts(guid-here)",
  "osot_Table_Address@odata.bind": "/osot_table_addresses(guid-here)"
}
```

---

### **Example 4: Update My Identity**

**Endpoint**: `PATCH /private/identities/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```typescript
{
  "osot_preferred_name": "Johnny",
  "osot_pronouns": "They/Them"
}
```

**Response (200 OK):**
```typescript
{
  "osot_user_guid_identity": "identity-guid-here",
  "osot_first_name": "John",
  "osot_last_name": "Doe",
  "osot_preferred_name": "Johnny",
  "osot_pronouns": "They/Them",
  "osot_gender": "Male",
  "osot_birth_date": "1990-05-15"
}
```

---

### **Example 5: Create Employment**

**Endpoint**: `POST /private/membership-employments/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```typescript
{
  "osot_employment_status": "Employee (Salaried)",
  "osot_work_hours": ["Exactly 35 hours", "More than 37 hours"],
  "osot_role_descriptor": "Direct/Indirect Care Provider",
  "osot_practice_years": "Between 6 and 10 years",
  "osot_position_funding": ["Provincial Government (Health)", "Federal Government"],
  "osot_employment_benefits": [
    "Extended Health/Dental Care",
    "Paid Vacation",
    "Pension"
  ],
  "osot_earnings_employment": "Between $41 to $50",
  "osot_earnings_self_direct": "Between $51 to $60",
  "osot_earnings_self_indirect": "Between $31 to $40",
  "osot_union_name": "Ontario Public Service Employees Union",
  "osot_another_employment": false
}
```

**Response (201 Created):**
```typescript
{
  "osot_user_guid_membership_employment": "employment-guid-here",
  "osot_membership_year": "2025",
  "osot_employment_status": "Employee (Salaried)",
  "osot_work_hours": ["Exactly 35 hours", "More than 37 hours"],
  // ... all fields returned
  "osot_Table_Account@odata.bind": "/osot_table_accounts(account-guid-here)"
}
```

---

## ⚠️ Error Handling

**📚 Ver Guia Completo**: [`ERROR_HANDLING_FRONTEND_GUIDE.md`](./ERROR_HANDLING_FRONTEND_GUIDE.md)

O backend retorna erros padronizados com códigos e mensagens user-friendly:

```json
{
  "code": 1003,
  "message": "Invalid credentials."
}
```

### **Quick Reference: Error Codes**

| Code | Message | Quando Acontece |
|------|---------|-----------------|
| 1003 | Invalid credentials | Login com senha errada |
| 1004 | Email already in use | Email duplicado no registro |
| 1006 | Account locked | Conta bloqueada |
| 1007 | Session expired | Token JWT expirado |
| 2001 | Invalid input | Dados de formulário inválidos |
| 3001 | Permission denied | Sem permissão para ação |
| 5001 | Not found | Recurso não encontrado |

**📖 Lista completa**: Ver `ERROR_HANDLING_FRONTEND_GUIDE.md` para todos os 26 códigos de erro.

---

### **Exemplo de Implementação**

```typescript
async function login(email: string, password: string) {
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        osot_email: email,
        osot_password: password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // ⭐ Exibir mensagem de erro ao usuário
      alert(error.message); // "Invalid credentials."
      
      // Ou tratar por código específico
      if (error.code === 1003) {
        showError('Email ou senha incorretos');
      }
      
      throw new Error(error.message);
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data;
    
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

**🔗 Mais exemplos**: React Query, Axios Interceptor, Toast notifications → Ver `ERROR_HANDLING_FRONTEND_GUIDE.md`

---

### **Common HTTP Status Codes**

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success (GET/PATCH) | Resource retrieved/updated |
| 201 | Created (POST) | Resource created successfully |
| 400 | Bad Request | Invalid input data (code: 2001) |
| 401 | Unauthorized | Invalid credentials (code: 1003) |
| 403 | Forbidden | Permission denied (code: 3001) |
| 404 | Not Found | Resource not found (code: 5001) |
| 409 | Conflict | Duplicate/constraint (code: 3002) |
| 500 | Server Error | Internal error (code: 5002) |

---

## 🎯 Best Practices

### **1. Token Management**

```typescript
// Store token securely
const storeToken = (token: string) => {
  localStorage.setItem('access_token', token);
  // Or use secure cookie with httpOnly flag
};

// Refresh token before expiration
const checkTokenExpiration = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return;
  
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiresAt = payload.exp * 1000; // Convert to milliseconds
  
  if (Date.now() >= expiresAt - 5 * 60 * 1000) { // 5 min buffer
    // Refresh or re-login
    refreshToken();
  }
};
```

---

### **2. Request Retries**

```typescript
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries = 3
): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}
```

---

### **3. Loading States**

```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchAccount = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const account = await api.getMyAccount();
    setAccount(account);
  } catch (err) {
    setError('Failed to load account');
  } finally {
    setIsLoading(false);
  }
};
```

---

### **4. Request Debouncing**

```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query: string) => {
  const results = await api.searchAccounts(query);
  setResults(results);
}, 300);
```

---

### **5. Cache API Responses**

```typescript
// Using React Query
const { data: account } = useQuery({
  queryKey: ['account', 'me'],
  queryFn: () => api.getMyAccount(),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

---

## 🚀 Complete Integration Example

### **React + TypeScript + Generated Client**

```typescript
// src/hooks/useAuth.ts
import { useState } from 'react';
import { AuthApi, Configuration } from '../api-client';

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('access_token')
  );

  const login = async (email: string, password: string) => {
    const authApi = new AuthApi();
    const response = await authApi.login({ osot_email: email, osot_password: password });
    
    setToken(response.data.access_token);
    localStorage.setItem('access_token', response.data.access_token);
    
    return response.data.user;
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('access_token');
  };

  return { token, login, logout, isAuthenticated: !!token };
};

// src/hooks/useAccount.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountsApi, Configuration } from '../api-client';

export const useAccount = (token: string | null) => {
  const queryClient = useQueryClient();
  
  const config = new Configuration({
    basePath: 'http://localhost:3000',
    accessToken: token || ''
  });
  
  const accountsApi = new AccountsApi(config);

  // Fetch account
  const { data: account, isLoading } = useQuery({
    queryKey: ['account', 'me'],
    queryFn: () => accountsApi.getMyAccount().then(res => res.data),
    enabled: !!token
  });

  // Update account
  const updateAccount = useMutation({
    mutationFn: (data: UpdateAccountDto) => 
      accountsApi.updateMyAccount(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['account', 'me']);
    }
  });

  return { account, isLoading, updateAccount };
};

// src/components/AccountForm.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAccount } from '../hooks/useAccount';

export const AccountForm = () => {
  const { token } = useAuth();
  const { account, updateAccount } = useAccount(token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateAccount.mutateAsync({
      osot_email: 'newemail@example.com'
    });
    
    alert('Account updated!');
  };

  if (!account) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        defaultValue={account.osot_email} 
      />
      <button type="submit">Update</button>
    </form>
  );
};
```

---

## 📞 Support & Questions

- **API Documentation**: `http://localhost:3000/api-docs`
- **OpenAPI Schema**: `http://localhost:3000/openapi.json`
- **Backend Team**: Contact for API changes or issues

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-28 | Initial API documentation |

---

**Happy Coding! 🚀**

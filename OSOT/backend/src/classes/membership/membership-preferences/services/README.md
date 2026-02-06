# Membership Preferences Services

**Module:** `membership-preferences/services`  
**Version:** 1.0.0  
**Date:** 21 November 2025

---

## 📚 Overview

This directory contains all business logic services for the Membership Preferences module. Services are organized by responsibility following **Single Responsibility Principle** and **Separation of Concerns**.

### **Service Architecture**

```
services/
├── membership-preference-crud.service.ts          # Create, Update, Delete operations
├── membership-preference-lookup.service.ts        # Read/Query operations
└── membership-preference-business-rules.service.ts # Validation & business rules
```

---

## 🎯 Services

### **1. CRUD Service**
**File:** `membership-preference-crud.service.ts`  
**Responsibility:** Create, Update, Delete operations with event emission

#### **Methods:**
```typescript
create(dto: CreateMembershipPreferenceDto, userId: string, categoryId?: string): Promise<MembershipPreferenceResponse>
update(preferenceId: string, dto: UpdateMembershipPreferenceDto, userId: string): Promise<MembershipPreferenceResponse>
delete(preferenceId: string, userId: string): Promise<void>
```

#### **Features:**
- ✅ Privilege-based access control (OWNER/ADMIN/MAIN)
- ✅ User-year uniqueness validation
- ✅ Auto-renewal change tracking
- ✅ Event emission (via EventsService)
- ✅ Comprehensive error handling
- ✅ Structured logging

#### **Events Emitted:**
- `PreferenceCreated` - After successful creation
- `PreferenceUpdated` - After successful update
- `PreferenceDeleted` - After successful deletion
- `AutoRenewalChanged` - When auto-renewal status changes
- `UserYearDuplicate` - When duplicate user-year detected

---

### **2. Lookup Service**
**File:** `membership-preference-lookup.service.ts`  
**Responsibility:** Read/Query operations with privilege-based filtering

#### **Methods:**
```typescript
// Single entity lookups
findByPreferenceId(preferenceId: string, userId: string): Promise<MembershipPreferenceResponse | null>
findById(id: string, userId: string): Promise<MembershipPreferenceResponse | null>
findByUserAndYear(userId: string, year: string, requestingUserId: string): Promise<MembershipPreferenceResponse | null>

// Collection queries
getByYear(year: string, userId: string, options?: PaginationOptions): Promise<{ data: MembershipPreferenceResponse[]; total: number }>
getByCategory(categoryId: string, userId: string, options?: PaginationOptions): Promise<{ data: MembershipPreferenceResponse[]; total: number }>
getByAccount(accountId: string, userId: string, options?: PaginationOptions): Promise<{ data: MembershipPreferenceResponse[]; total: number }>
getByAffiliate(affiliateId: string, userId: string, options?: PaginationOptions): Promise<{ data: MembershipPreferenceResponse[]; total: number }>
getByAutoRenewal(autoRenewal: boolean, userId: string, options?: PaginationOptions): Promise<{ data: MembershipPreferenceResponse[]; total: number }>
list(dto: ListMembershipPreferencesQueryDto, userId: string): Promise<{ data: MembershipPreferenceResponse[]; total: number; page: number; limit: number }>

// Validation helpers
existsByUserAndYear(userId: string, year: string, excludePreferenceId?: string): Promise<boolean>
count(filters?: { categoryId?: string; year?: string }): Promise<number>
```

#### **Features:**
- ✅ Privilege-based filtering (OWNER sees own, ADMIN/MAIN see all)
- ✅ In-memory filtering for complex queries
- ✅ Pagination support
- ✅ Comprehensive error handling

---

### **3. Business Rules Service**
**File:** `membership-preference-business-rules.service.ts`  
**Responsibility:** Category-based field validation and business rules

#### **Category-Field Matrix:**

| Category | Auto-Renewal | Third Parties | Practice Promotion | Search Tools | Shadowing | Psychotherapy |
|----------|-------------|---------------|-------------------|--------------|-----------|---------------|
| **OT_PR** | ✅ | ✅ | ✅ | ✅ All | ✅ | ✅ |
| **OT_NP** | ✅ | ✅ | ❌ | ⚠️ Limited* | ✅ | ⚠️ If cert. |
| **OT_RET** | ✅ | ✅ | ❌ | ⚠️ Limited* | ❌ | ❌ |
| **OT_NG** | ✅ | ✅ | ❌ | ⚠️ Limited** | ❌ | ❌ |
| **OT_STU** | ❌ | ✅ | ❌ | ⚠️ Limited** | ❌ | ❌ |
| **OT_LIFE** | ✅ | ✅ | ❌ | ⚠️ Limited* | ❌ | ❌ |
| **OTA_PR** | ✅ | ✅ | ✅ | ✅ All | ✅ | ❌ |
| **OTA_NP** | ✅ | ✅ | ❌ | ⚠️ Limited* | ✅ | ❌ |
| **OTA_RET** | ✅ | ✅ | ❌ | ⚠️ Limited* | ❌ | ❌ |
| **OTA_NG** | ✅ | ✅ | ❌ | ⚠️ Limited** | ❌ | ❌ |
| **OTA_STU** | ❌ | ✅ | ❌ | ⚠️ Limited** | ❌ | ❌ |
| **OTA_LIFE** | ✅ | ✅ | ❌ | ⚠️ Limited* | ❌ | ❌ |
| **ASSOC** | ✅ | ✅ | ❌ | ⚠️ Limited* | ❌ | ❌ |
| **AFF_PRIM** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **AFF_PREM** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ = Fully applicable
- ❌ = Not applicable
- ⚠️ Limited* = PROFESSIONAL_NETWORKS + POTENTIAL_MENTORING only
- ⚠️ Limited** = POTENTIAL_MENTORING + EXAM_MENTORING only

For complete business rules documentation, see `BUSINESS_RULES_ANALYSIS.md`.

---

## 🔄 Service Integration

### **Dependency Graph**
```
MembershipPreferenceCrudService
  ↓
  ├── MembershipPreferenceRepository
  ├── MembershipPreferenceMapper
  ├── EventsService
  ├── MembershipPreferenceBusinessRulesService
  └── MembershipPreferenceLookupService

MembershipPreferenceLookupService
  ↓
  ├── MembershipPreferenceRepository
  └── MembershipPreferenceMapper

MembershipPreferenceBusinessRulesService
  ↓
  └── (No dependencies - pure validation logic)
```

---

## 🎓 Usage Examples

### **Create Preference**
```typescript
@Post()
async create(@Body() dto: CreateMembershipPreferenceDto, @User() userId: string) {
  return this.crudService.create(dto, userId);
}
```

### **Get User's Preference for Year**
```typescript
@Get('user/:userId/year/:year')
async findByUserAndYear(
  @Param('userId') targetUserId: string,
  @Param('year') year: string,
  @User() userId: string,
) {
  return this.lookupService.findByUserAndYear(targetUserId, year, userId);
}
```

### **Validate Category-Specific Fields**
```typescript
const category = Category.OT_PR;
const applicableFields = this.businessRules.getApplicableFields(category);
// { autoRenewal: true, practicePromotion: true, ... }
```

---

## 🔐 Security

- **Privilege-Based Access**: OWNER sees own, ADMIN/MAIN see all
- **Validation Layers**: DTO → Business Rules → Repository
- **Audit Events**: All CUD operations emit events for logging

---

**Last Updated:** 21 November 2025  
**Status:** All services implemented and tested

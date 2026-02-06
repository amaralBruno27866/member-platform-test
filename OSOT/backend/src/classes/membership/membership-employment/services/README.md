# Membership Employment Services

**Module:** `membership-employment/services`  
**Version:** 1.0.0  
**Date:** 26 November 2025

---

## 📚 Overview

This directory contains all business logic services for the Membership Employment module. Services are organized by responsibility following **Single Responsibility Principle** and **Separation of Concerns**.

### **Service Architecture**

```
services/
├── membership-employment-crud.service.ts          # Create, Update, Delete operations
├── membership-employment-lookup.service.ts        # Read/Query operations
└── membership-employment-business-rules.service.ts # Validation & business rules
```

---

## 🎯 Services

### **1. CRUD Service**
**File:** `membership-employment-crud.service.ts`  
**Responsibility:** Create, Update, Delete operations with privilege-based access control

#### **Methods:**
```typescript
create(dto: CreateMembershipEmploymentDto, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipEmploymentDto>
update(employmentId: string, dto: UpdateMembershipEmploymentDto, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipEmploymentDto>
delete(employmentId: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<boolean>
```

#### **Features:**
- ✅ Privilege-based access control (OWNER/ADMIN/MAIN)
- ✅ User-year uniqueness validation (one employment per user per year)
- ✅ XOR validation (Account OR Affiliate, never both)
- ✅ Membership year immutability (cannot be changed after creation)
- ✅ Hard delete only (no soft delete)
- ✅ Default privilege assignment (OWNER) and access modifiers (PRIVATE)
- ✅ Comprehensive error handling with ErrorCodes
- ✅ Structured logging with operation IDs

#### **Business Rules Enforced:**
- **User-Year Uniqueness:** One employment record per user per membership year
- **XOR Validation:** Must have exactly one of `osot_table_account` OR `osot_table_account_affiliate`
- **Immutable Fields:** `osot_membership_year`, `osot_table_account`, `osot_table_account_affiliate` cannot be updated
- **Delete Restrictions:** Only Admin and Main can delete (Owner cannot delete own records)

---

### **2. Lookup Service**
**File:** `membership-employment-lookup.service.ts`  
**Responsibility:** Read/Query operations with privilege-based filtering

#### **Methods:**
```typescript
// Single entity lookups
findByEmploymentId(employmentId: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipEmploymentDto | null>
findById(id: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipEmploymentDto | null>
findByUserAndYear(userId: string, year: string, userType: 'account' | 'affiliate', userPrivilege?: Privilege, requestingUserId?: string, operationId?: string): Promise<ResponseMembershipEmploymentDto | null>

// Collection queries
getByYear(year: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipEmploymentDto[]>
getByAccount(accountId: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipEmploymentDto[]>
getByAffiliate(affiliateId: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipEmploymentDto[]>
getByEmploymentStatus(status: EmploymentStatus, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipEmploymentDto[]>

// List with pagination and filtering
list(query: ListMembershipEmploymentsQueryDto, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<{
  data: ResponseMembershipEmploymentDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}>

// Validation helpers
existsByUserAndYear(userId: string, year: string, userType: 'account' | 'affiliate', operationId?: string): Promise<boolean>
count(userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<number>
```

#### **Features:**
- ✅ Privilege-based filtering (OWNER sees own, ADMIN/MAIN see all)
- ✅ In-memory filtering for advanced queries (membershipYear, accountId, affiliateId, employmentStatus)
- ✅ Pagination support with sorting
- ✅ User-year uniqueness validation support
- ✅ Employment status filtering (Admin/Main only)
- ✅ Comprehensive error handling

#### **Privilege Matrix:**
| Privilege | Can Read Own | Can Read All | Can Query by Status |
|-----------|--------------|--------------|---------------------|
| **OWNER** | ✅ | ❌ | ❌ |
| **ADMIN** | ✅ | ✅ | ✅ |
| **MAIN** | ✅ | ✅ | ✅ |

---

### **3. Business Rules Service**
**File:** `membership-employment-business-rules.service.ts`  
**Responsibility:** Orchestrates CRUD operations with comprehensive business rule validation

#### **Methods:**
```typescript
createWithValidation(dto: CreateMembershipEmploymentDto, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipEmploymentDto>
updateWithValidation(employmentId: string, dto: UpdateMembershipEmploymentDto, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipEmploymentDto>
deleteWithValidation(employmentId: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<boolean>
```

#### **Business Rules Validated:**

##### **1. Conditional "_Other" Fields**
Required when corresponding enum contains `OTHER` value:

| Field | Condition | Required Field |
|-------|-----------|----------------|
| `osot_role_descriptor` | = `RoleDescription.OTHER` (10) | `osot_role_descriptor_other` |
| `osot_position_funding` | includes `Funding.OTHER` (7) | `osot_position_funding_other` |
| `osot_employment_benefits` | includes `Benefits.OTHER` (8) | `osot_employment_benefits_other` |

##### **2. Membership Year Validation**
- **Create:** Year must exist in `membership-settings` table with `ACTIVE` status
- **Update:** Year cannot be changed (immutable field)

##### **3. User-Year Uniqueness**
- Validates via `MembershipEmploymentLookupService.existsByUserAndYear()`
- Prevents duplicate employment records for same user in same year
- Checked during creation only (year immutable on update)

##### **4. Account/Affiliate XOR**
- Must have exactly ONE of: `osot_table_account` OR `osot_table_account_affiliate`
- Validated at controller/enrichment layer (extracted from JWT)
- Not user input - SYSTEM-DEFINED field

#### **Features:**
- ✅ Pre-create validation (year exists, user uniqueness, conditional fields)
- ✅ Pre-update validation (year immutability, conditional fields, record existence)
- ✅ Integration with MembershipSettingsLookupService for year validation
- ✅ Enriched error messages with business context
- ✅ Operation tracking for audit trails
- ✅ Delegates to CRUD service after validation passes

---

## 🔄 Service Integration

### **Dependency Graph**
```
MembershipEmploymentBusinessRulesService
  ↓
  ├── MembershipEmploymentCrudService
  │     ↓
  │     ├── MembershipEmploymentRepository
  │     └── MembershipEmploymentMapper
  ├── MembershipEmploymentLookupService
  │     ↓
  │     ├── MembershipEmploymentRepository
  │     └── MembershipEmploymentMapper
  └── MembershipSettingsLookupService (external)

MembershipEmploymentLookupService
  ↓
  ├── MembershipEmploymentRepository
  └── MembershipEmploymentMapper

MembershipEmploymentCrudService
  ↓
  ├── MembershipEmploymentRepository
  └── (Mapper called inline)
```

### **External Module Dependencies**
- **MembershipSettingsModule:** Required for year validation via `MembershipSettingsLookupService`

---

## 🎓 Usage Examples

### **Create Employment Record (with Business Rules)**
```typescript
@Post('/me')
async createMyEmployment(@Body() dto: CreateMembershipEmploymentDto, @User() user) {
  // Controller enriches DTO with system fields
  const enrichedDto = {
    ...dto,
    osot_membership_year: await this.getMembershipYear(), // "2026"
    'osot_Table_Account@odata.bind': `/osot_table_accounts(${user.guid})`,
    osot_privilege: Privilege.OWNER,
    osot_access_modifiers: AccessModifier.PRIVATE,
  };

  return this.businessRulesService.createWithValidation(
    enrichedDto,
    user.privilege,
    user.id,
  );
}
```

### **Get User's Employment for Year**
```typescript
@Get('/me')
async getMyEmployment(@User() user, @Query('year') year: string) {
  return this.lookupService.findByUserAndYear(
    user.guid,
    year,
    'account', // from JWT userType
    user.privilege,
    user.id,
  );
}
```

### **Update with Conditional Field Validation**
```typescript
@Patch('/:employmentId')
async updateEmployment(
  @Param('employmentId') employmentId: string,
  @Body() dto: UpdateMembershipEmploymentDto,
  @User() user,
) {
  // Business rules will validate conditional "_Other" fields
  return this.businessRulesService.updateWithValidation(
    employmentId,
    dto,
    user.privilege,
    user.id,
  );
}
```

### **List with Filters**
```typescript
@Get()
async listEmployments(
  @Query() query: ListMembershipEmploymentsQueryDto,
  @User() user,
) {
  // Supports filtering by: membershipYear, accountId, affiliateId, employmentStatus
  return this.lookupService.list(query, user.privilege, user.id);
}
```

---

## 🔐 Security & Permissions

### **Privilege Levels**

| Privilege | Create | Read Own | Read All | Update Own | Update All | Delete Own | Delete All |
|-----------|--------|----------|----------|------------|------------|------------|------------|
| **OWNER** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **MAIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### **System-Defined Fields**
These fields are injected by the **enrichment layer** (controller), NOT user input:

- `osot_membership_year` - Current active year from membership-settings (e.g., "2026")
- `osot_table_account` - Account GUID from JWT
- `osot_table_account_affiliate` - Affiliate GUID from JWT
- `osot_privilege` - Default: `OWNER` (1)
- `osot_access_modifiers` - Default: `PRIVATE` (2)

### **Validation Layers**
1. **DTO Validation:** Class-validator decorators
2. **Business Rules Validation:** Conditional fields, year existence, user-year uniqueness
3. **Repository Validation:** Data integrity, Dataverse constraints

---

## 📊 Data Flow

### **Create Flow**
```
Frontend Request
  ↓
Controller (Enrichment Layer)
  ├─ Extract user from JWT → osot_table_account
  ├─ Get current year → "2026"
  ├─ Set defaults → privilege=OWNER, access=PRIVATE
  └─ Validate year active
  ↓
BusinessRulesService.createWithValidation()
  ├─ Validate conditional "_Other" fields
  ├─ Log user-year uniqueness (handled in CRUD)
  └─ Delegate to CRUD
  ↓
CrudService.create()
  ├─ Validate privilege (Owner/Admin/Main)
  ├─ Check user-year uniqueness
  ├─ Validate XOR (account OR affiliate)
  ├─ Apply defaults
  └─ Create in repository
  ↓
Repository → Dataverse → Response
```

### **Update Flow**
```
Frontend Request
  ↓
Controller
  ↓
BusinessRulesService.updateWithValidation()
  ├─ Fetch existing record (Lookup)
  ├─ Validate year immutability (in DTO)
  ├─ Merge existing + update data
  ├─ Validate conditional "_Other" fields
  └─ Delegate to CRUD
  ↓
CrudService.update()
  ├─ Validate privilege
  ├─ Check record exists
  └─ Update in repository
  ↓
Repository → Dataverse → Response
```

---

## 🧪 Testing Considerations

### **Unit Tests**
- Mock repository for isolated service testing
- Test privilege-based access control
- Test conditional field validation rules
- Test user-year uniqueness validation

### **Integration Tests**
- Test with real repository (in-memory Dataverse mock)
- Test year validation with MembershipSettingsLookupService
- Test complete create/update/delete flows

---

## 📝 Notes

- **No Soft Delete:** Employment records are hard deleted (no `isDeleted` flag)
- **Year Immutability:** Membership year cannot be changed after creation
- **One Employment Per Year:** Users can have multiple employment records across different years, but only one per year
- **Multi-Select Fields:** `osot_position_funding` and `osot_employment_benefits` are arrays (support multiple selections)

---

**Last Updated:** 26 November 2025  
**Status:** All services implemented and integrated with MembershipSettingsModule


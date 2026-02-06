# Membership Practices Services

**Module:** `membership-practices/services`  
**Version:** 1.0.0  
**Date:** 27 November 2025

---

## 📚 Overview

This directory contains all business logic services for the Membership Practices module. Services are organized by responsibility following **Single Responsibility Principle** and **Separation of Concerns**.

### **Service Architecture**

```
services/
├── membership-practices-crud.service.ts          # Create, Update, Delete operations
├── membership-practices-lookup.service.ts        # Read/Query operations
└── membership-practices-business-rules.service.ts # Validation & business rules
```

---

## 🎯 Services

### **1. CRUD Service**

**File:** `membership-practices-crud.service.ts`  
**Responsibility:** Create, Update, Delete operations with privilege-based access control

#### **Methods:**

```typescript
create(dto: CreateMembershipPracticesDto, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipPracticesDto>
update(practiceId: string, dto: UpdateMembershipPracticesDto, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipPracticesDto>
delete(practiceId: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<boolean>
```

#### **Features:**

- ✅ Privilege-based access control (OWNER/ADMIN/MAIN)
- ✅ User-year uniqueness validation (one practice per user per year)
- ✅ Clients age required validation (business required array with minimum 1 value)
- ✅ Membership year immutability (cannot be changed after creation)
- ✅ Hard delete only (no soft delete)
- ✅ Default privilege assignment (OWNER) and access modifiers (PRIVATE)
- ✅ Comprehensive error handling with ErrorCodes
- ✅ Structured logging with operation IDs

#### **Business Rules Enforced:**

- **User-Year Uniqueness:** One practice record per user per membership year (if account provided)
- **Clients Age Required:** Must have at least one value in `osot_clients_age` array (business required)
- **Immutable Fields:** `osot_membership_year`, `osot_table_account` cannot be updated
- **Delete Restrictions:** Only Admin and Main can delete (Owner cannot delete own records)
- **Optional Account:** Unlike employment, account lookup is optional (practices can exist without account)

---

### **2. Lookup Service**

**File:** `membership-practices-lookup.service.ts`  
**Responsibility:** Read/Query operations with privilege-based filtering

#### **Methods:**

```typescript
// Single entity lookups
findByPracticeId(practiceId: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipPracticesDto | null>
findById(id: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipPracticesDto | null>
findByUserAndYear(userId: string, year: string, userPrivilege?: Privilege, requestingUserId?: string, operationId?: string): Promise<ResponseMembershipPracticesDto | null>

// Collection queries
getByYear(year: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipPracticesDto[]>
getByAccount(accountId: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipPracticesDto[]>
getByClientsAge(clientsAge: ClientsAge, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipPracticesDto[]>

// List with pagination and filtering
list(query: ListMembershipPracticesQueryDto, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<{
  data: ResponseMembershipPracticesDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}>

// Validation helpers
existsByUserAndYear(userId: string, year: string, operationId?: string): Promise<boolean>
count(userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<number>
```

#### **Features:**

- ✅ Privilege-based filtering (OWNER sees own, ADMIN/MAIN see all)
- ✅ In-memory filtering for advanced queries (membershipYear, accountId, clientsAge, practiceArea)
- ✅ Pagination support with sorting (skip/top pattern)
- ✅ User-year uniqueness validation support
- ✅ Clients age filtering (Admin/Main only for demographics)
- ✅ Comprehensive error handling

#### **Privilege Matrix:**

| Privilege | Can Read Own | Can Read All | Can Query by Clients Age |
| --------- | ------------ | ------------ | ------------------------ |
| **OWNER** | ✅           | ❌           | ❌                       |
| **ADMIN** | ✅           | ✅           | ✅                       |
| **MAIN**  | ✅           | ✅           | ✅                       |

---

### **3. Business Rules Service**

**File:** `membership-practices-business-rules.service.ts`  
**Responsibility:** Orchestrates CRUD operations with comprehensive business rule validation

#### **Methods:**

```typescript
createWithValidation(dto: CreateMembershipPracticesDto, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipPracticesDto>
updateWithValidation(practiceId: string, dto: UpdateMembershipPracticesDto, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<ResponseMembershipPracticesDto>
deleteWithValidation(practiceId: string, userPrivilege?: Privilege, userId?: string, operationId?: string): Promise<boolean>
validateUpdateDto(dto: UpdateMembershipPracticesDto, existingData: Partial<MembershipPracticesInternal>, operationId?: string): void
```

#### **Business Rules Validated:**

##### **1. Conditional "\_Other" Fields**

Required when corresponding enum contains `OTHER` value:

| Field                    | Condition                              | Required Field                 |
| ------------------------ | -------------------------------------- | ------------------------------ |
| `osot_practice_settings` | includes `PracticeSettings.OTHER` (28) | `osot_practice_settings_other` |
| `osot_practice_services` | includes `PracticeServices.OTHER` (59) | `osot_practice_services_other` |

**Note:** Only 2 conditional fields (vs 3 in employment module)

##### **2. Clients Age Required**

- **Business Required Array:** Must have at least 1 value in `osot_clients_age`
- **Create:** Validated in business rules before CRUD
- **Update:** Validated if provided (cannot be set to empty array)
- **Multi-Select:** Users can select multiple age groups (e.g., [1, 2, 3] = INFANT, CHILD, YOUTH)

##### **3. Membership Year Validation**

- **Create:** Year must exist in `membership-settings` table with `ACTIVE` status
- **Update:** Year cannot be changed (immutable field)
- **Integration:** Uses `MembershipSettingsLookupService` for validation

##### **4. User-Year Uniqueness**

- Validates via `MembershipPracticesRepository.existsByUserAndYear()`
- Prevents duplicate practice records for same user in same year
- Checked during creation only (year immutable on update)
- Only enforced if `osot_table_account` is provided

#### **Key Differences from Employment Module:**

- ❌ **NO XOR Validation:** Only one optional lookup (Account), no Affiliate
- ✅ **2 Conditional Fields:** vs 3 in employment
- ✅ **Clients Age Required:** Business required array (unique to practices)
- ✅ **Simpler Validation Logic:** No complex Account/Affiliate XOR rules

#### **Features:**

- ✅ Pre-create validation (year exists, clients_age required, conditional fields)
- ✅ Pre-update validation (year immutability, conditional fields, record existence)
- ✅ Integration with MembershipSettingsLookupService for year validation
- ✅ Enriched error messages with business context
- ✅ Operation tracking for audit trails
- ✅ Delegates to CRUD service after validation passes
- ✅ Public `validateUpdateDto()` method for controller pre-validation

---

## 🔄 Service Integration

### **Dependency Graph**

```
MembershipPracticesBusinessRulesService
  ↓
  ├── MembershipPracticesCrudService
  │     ↓
  │     ├── MembershipPracticesRepository
  │     └── MembershipPracticesMapper
  ├── MembershipPracticesLookupService
  │     ↓
  │     ├── MembershipPracticesRepository
  │     └── MembershipPracticesMapper
  └── MembershipSettingsLookupService (external)

MembershipPracticesLookupService
  ↓
  ├── MembershipPracticesRepository
  └── MembershipPracticesMapper

MembershipPracticesCrudService
  ↓
  ├── MembershipPracticesRepository
  └── (Mapper called inline)
```

### **External Module Dependencies**

- **MembershipSettingsModule:** Required for year validation via `MembershipSettingsLookupService`

---

## 🎓 Usage Examples

### **Create Practice Record (with Business Rules)**

```typescript
@Post('/me')
async createMyPractice(@Body() dto: CreateMembershipPracticesDto, @User() user) {
  // Controller enriches DTO with system fields
  const enrichedDto = {
    ...dto,
    osot_membership_year: await this.getMembershipYear(), // "2026"
    'osot_Table_Account@odata.bind': `/osot_table_accounts(${user.guid})`, // Optional
    osot_privilege: Privilege.OWNER,
    osot_access_modifiers: AccessModifier.PRIVATE,
  };

  // Business rules validates:
  // - clients_age has at least 1 value
  // - conditional "_Other" fields
  // - user-year uniqueness (if account provided)
  return this.businessRulesService.createWithValidation(
    enrichedDto,
    user.privilege,
    user.id,
  );
}
```

### **Get User's Practice for Year**

```typescript
@Get('/me')
async getMyPractice(@User() user, @Query('year') year: string) {
  return this.lookupService.findByUserAndYear(
    user.guid,
    year,
    user.privilege,
    user.id,
  );
}
```

### **Update with Conditional Field Validation**

```typescript
@Patch('/:practiceId')
async updatePractice(
  @Param('practiceId') practiceId: string,
  @Body() dto: UpdateMembershipPracticesDto,
  @User() user,
) {
  // Example: User adds PracticeSettings.OTHER to practice_settings
  // Business rules will validate that practice_settings_other is provided
  return this.businessRulesService.updateWithValidation(
    practiceId,
    dto,
    user.privilege,
    user.id,
  );
}
```

### **List with Filters**

```typescript
@Get()
async listPractices(
  @Query() query: ListMembershipPracticesQueryDto,
  @User() user,
) {
  // Supports filtering by: membershipYear, accountId, clientsAge, practiceArea
  // Uses skip/top for pagination (not page/pageSize)
  return this.lookupService.list(query, user.privilege, user.id);
}
```

### **Query by Demographics (Admin/Main only)**

```typescript
@Get('/demographics/clients-age/:clientsAge')
async getPracticesByClientsAge(
  @Param('clientsAge') clientsAge: ClientsAge,
  @User() user,
) {
  // Only Admin and Main can query by clients age
  return this.lookupService.getByClientsAge(
    clientsAge,
    user.privilege,
    user.id,
  );
}
```

---

## 🔐 Security & Permissions

### **Privilege Levels**

| Privilege | Create | Read Own | Read All | Update Own | Update All | Delete Own | Delete All |
| --------- | ------ | -------- | -------- | ---------- | ---------- | ---------- | ---------- |
| **OWNER** | ✅     | ✅       | ❌       | ✅         | ❌         | ❌         | ❌         |
| **ADMIN** | ✅     | ✅       | ✅       | ✅         | ✅         | ❌         | ❌         |
| **MAIN**  | ✅     | ✅       | ✅       | ✅         | ✅         | ✅         | ✅         |

### **System-Defined Fields**

These fields are injected by the **enrichment layer** (controller), NOT user input:

- `osot_membership_year` - Current active year from membership-settings (e.g., "2026")
- `osot_table_account` - Account GUID from JWT (OPTIONAL for practices)
- `osot_privilege` - Default: `OWNER` (0)
- `osot_access_modifiers` - Default: `PRIVATE` (2)

### **User-Provided Fields**

All practice-specific fields are user input:

- `osot_clients_age` - **BUSINESS REQUIRED** array, minimum 1 value (e.g., [1, 2] = INFANT, CHILD)
- `osot_practice_area` - Multi-select array (optional, e.g., [1, 5, 10])
- `osot_practice_settings` - Multi-select array (optional, e.g., [1, 2])
- `osot_practice_services` - Multi-select array (optional, e.g., [1, 3, 5])
- `osot_practice_settings_other` - Text field (required if OTHER selected in practice_settings)
- `osot_practice_services_other` - Text field (required if OTHER selected in practice_services)
- `osot_preceptor_declaration` - Boolean (optional, default: false)

### **Validation Layers**

1. **DTO Validation:** Class-validator decorators (e.g., `@ArrayMinSize(1)` for clients_age)
2. **Business Rules Validation:** Conditional fields, year existence, clients_age required
3. **Repository Validation:** Data integrity, Dataverse constraints

---

## 📊 Data Flow

### **Create Flow**

```
Frontend Request
  ↓
Controller (Enrichment Layer)
  ├─ Extract user from JWT → osot_table_account (optional)
  ├─ Get current year → "2026"
  ├─ Set defaults → privilege=OWNER, access=PRIVATE
  └─ Validate year active
  ↓
BusinessRulesService.createWithValidation()
  ├─ Validate clients_age required (minimum 1 value)
  ├─ Validate conditional "_Other" fields (2 fields)
  ├─ Log user-year uniqueness (handled in CRUD)
  └─ Delegate to CRUD
  ↓
CrudService.create()
  ├─ Validate privilege (Owner/Admin/Main)
  ├─ Check clients_age required
  ├─ Check user-year uniqueness (if account provided)
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
  ├─ Fetch existing record (Repository)
  ├─ Validate year immutability (in DTO)
  ├─ Validate clients_age if provided (minimum 1 value)
  ├─ Merge existing + update data
  ├─ Validate conditional "_Other" fields
  └─ Delegate to CRUD
  ↓
CrudService.update()
  ├─ Validate privilege
  ├─ Validate clients_age if provided
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
- Test conditional field validation rules (2 fields)
- Test clients_age required validation (minimum 1 value)
- Test user-year uniqueness validation

### **Integration Tests**

- Test with real repository (in-memory Dataverse mock)
- Test year validation with MembershipSettingsLookupService
- Test complete create/update/delete flows
- Test multi-select array handling (clients_age, practice_area, practice_settings, practice_services)

---

## 📊 Multi-Select Field Handling

### **Four Multi-Select Arrays:**

1. **`osot_clients_age`** (ClientsAge enum)
   - **Business Required:** Minimum 1 value
   - **Values:** 1-7 (INFANT, CHILD, YOUTH, YOUNG_ADULT, ADULT, SENIOR, GERIATRIC)
   - **Storage:** Comma-separated string in Dataverse (e.g., "1,2,3")
   - **Example:** `[ClientsAge.INFANT, ClientsAge.CHILD]` → `"1,2"`

2. **`osot_practice_area`** (PracticeArea enum)
   - **Optional:** Can be empty array or omitted
   - **Values:** 1-47 (47 practice areas)
   - **Storage:** Comma-separated string in Dataverse
   - **Example:** `[PracticeArea.CHRONIC_PAIN, PracticeArea.MENTAL_HEALTH]` → `"1,5"`

3. **`osot_practice_settings`** (PracticeSettings enum)
   - **Optional:** Can be empty array or omitted
   - **Values:** 1-29 (29 practice settings)
   - **Conditional:** If includes OTHER (28), requires `osot_practice_settings_other`
   - **Storage:** Comma-separated string in Dataverse
   - **Example:** `[PracticeSettings.CLIENTS_HOME, PracticeSettings.OTHER]` → `"1,28"`

4. **`osot_practice_services`** (PracticeServices enum)
   - **Optional:** Can be empty array or omitted
   - **Values:** 1-60 (60 practice services)
   - **Conditional:** If includes OTHER (59), requires `osot_practice_services_other`
   - **Storage:** Comma-separated string in Dataverse
   - **Example:** `[PracticeServices.COGNITIVE_BEHAVIOUR_THERAPY, PracticeServices.OTHER]` → `"1,59"`

### **Mapper Transformations:**

- **DTO → Internal:** Enum arrays preserved as number arrays
- **Internal → Dataverse:** Number arrays → comma-separated strings
- **Dataverse → Internal:** Comma-separated strings → number arrays
- **Internal → Response:** Number arrays → label arrays (human-readable)

---

## 📝 Key Differences from Employment Module

| Feature                 | Employment                           | Practices                                                            |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| **Lookups**             | Account **XOR** Affiliate (required) | Account only (optional)                                              |
| **XOR Validation**      | ✅ Yes (complex logic)               | ❌ No                                                                |
| **Conditional Fields**  | 3 fields                             | 2 fields                                                             |
| **Business Required**   | All fields system-defined            | `clients_age` array (min 1)                                          |
| **Multi-Select Arrays** | 2 (funding, benefits)                | 4 (clients_age, practice_area, practice_settings, practice_services) |
| **Uniqueness**          | Always enforced                      | Only if account provided                                             |
| **Complexity**          | Higher (XOR logic)                   | Lower (simpler validation)                                           |

---

## 📝 Notes

- **No Soft Delete:** Practice records are hard deleted (no `isDeleted` flag)
- **Year Immutability:** Membership year cannot be changed after creation
- **One Practice Per Year:** Users can have multiple practice records across different years, but only one per year (if account provided)
- **Optional Account:** Unlike employment, practices can exist without an account lookup
- **Multi-Select Fields:** 4 arrays (clients_age, practice_area, practice_settings, practice_services) support multiple selections
- **Clients Age Required:** Only business required field - must have at least 1 value (enforced at DTO and service level)
- **Enum-to-Label Conversion:** Response DTOs convert enum numbers to human-readable labels for frontend display

---

**Last Updated:** 27 November 2025  
**Status:** All services implemented and integrated with MembershipSettingsModule

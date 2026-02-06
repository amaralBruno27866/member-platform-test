# Management Interfaces

## Purpose

Holds TypeScript interfaces that describe shapes used within the management domain. Interfaces define repository contracts, service return types, and shared domain concepts for managing user account administration including business permissions, lifecycle status, and administrative privileges.

## 📁 Interface Structure

### Core Interfaces

- **`DataverseManagement`** - Raw data shape from Dataverse API (exactly as returned)
- **`ManagementInternal`** - Internal business representation with typed enums
- **`ManagementRepository`** - Repository contract for data access operations

## 📋 Available Interfaces

### **1. DataverseManagement** (`management-dataverse.interface.ts`)

Raw management shape returned directly from Dataverse API before any transformations.

#### **Key Characteristics:**

- **Field Naming**: Follows Dataverse conventions (`osot_` prefix, snake_case)
- **Choice Fields**: Represented as numbers (1, 2, 3, etc.) as returned by Dataverse
- **Yes/No Fields**: Returned as numbers (0 = No, 1 = Yes)
- **System Fields**: Includes all internal Dataverse metadata
- **Lookup Relations**: Raw GUID references to related tables

#### **Field Categories:**

```typescript
// System Fields
osot_table_account_managementid?: string; // Primary Key
osot_account_management_id?: string;      // Auto-generated (osot-am-0000001)
createdon?: string;                       // Creation timestamp
modifiedon?: string;                      // Modification timestamp
ownerid?: string;                         // System owner

// Account Relationship
osot_table_account?: string;              // Account lookup (optional)

// Business Data
osot_user_business_id?: string;           // Business identifier (required)

// Management Flags (0 = No, 1 = Yes)
osot_life_member_retired?: number;       // Life member status
osot_shadowing?: number;                  // Shadowing availability
osot_passed_away?: number;                // Deceased status
osot_vendor?: number;                     // Vendor permissions
osot_advertising?: number;                // Advertising permissions
osot_recruitment?: number;                // Recruitment permissions
osot_driver_rehab?: number;               // Driver rehab services

// Choice Fields (Enum values as numbers)
osot_access_modifiers?: number;           // Visibility control (1=Public, 2=Protected, 3=Private)
osot_privilege?: number;                  // Admin level (1=Owner, 2=Admin, 3=Main)
```

#### **Usage Example:**

```typescript
const rawResponse: DataverseManagement = {
  osot_table_account_managementid: '12345678-1234-1234-1234-123456789abc',
  osot_account_management_id: 'osot-am-0000001',
  osot_user_business_id: 'user-123',
  osot_vendor: 1, // Yes (true)
  osot_recruitment: 0, // No (false)
  osot_access_modifiers: 2, // Protected
  osot_privilege: 1, // Owner
};
```

### **2. ManagementInternal** (`management-internal.interface.ts`)

Internal management representation used within the application with typed enums and business logic.

#### **Key Characteristics:**

- **Enum Types**: Uses proper TypeScript enums for choice fields
- **Boolean Fields**: Yes/No fields converted to `boolean` type
- **Business Logic**: Includes validation rules and business constraints
- **Security**: Contains sensitive fields that must NOT be exposed publicly
- **Type Safety**: Full TypeScript support for all operations

#### **Field Categories:**

```typescript
// System Fields (Internal Only)
osot_table_account_managementid?: string; // NEVER expose publicly
osot_account_management_id?: string;      // Public business ID
ownerid?: string;                         // System owner (internal)
createdon?: string;                       // Creation timestamp
modifiedon?: string;                      // Modification timestamp

// Account Relationship
osot_table_account?: string;              // Account lookup

// Business Data
osot_user_business_id?: string;           // Business identifier

// Management Flags (Boolean)
osot_life_member_retired?: boolean;       // Life member status
osot_shadowing?: boolean;                 // Shadowing availability
osot_passed_away?: boolean;               // Deceased status
osot_vendor?: boolean;                    // Vendor permissions
osot_advertising?: boolean;               // Advertising permissions
osot_recruitment?: boolean;               // Recruitment permissions
osot_driver_rehab?: boolean;              // Driver rehab services

// Choice Fields (Typed Enums)
osot_access_modifiers?: AccessModifier;   // Visibility control (enum)
osot_privilege?: Privilege;               // Admin level (enum) - SENSITIVE
```

#### **Utility Types:**

```typescript
// For creating new records (excludes system fields)
type CreateManagementInternal = Omit<
  ManagementInternal,
  | 'osot_table_account_managementid'
  | 'osot_account_management_id'
  | 'createdon'
  | 'modifiedon'
  | 'ownerid'
>;

// For updates (excludes immutable fields)
type UpdateManagementInternal = Omit<
  ManagementInternal,
  | 'osot_table_account_managementid'
  | 'osot_account_management_id'
  | 'createdon'
  | 'modifiedon'
  | 'ownerid'
  | 'osot_user_business_id'
>;

// For public APIs (removes sensitive fields)
type PublicManagement = Omit<
  ManagementInternal,
  'osot_table_account_managementid' | 'osot_privilege' | 'ownerid'
>;
```

#### **Business Rules Example:**

```typescript
// Mutual exclusivity validation
if (management.osot_vendor && management.osot_recruitment) {
  throw new Error('Vendors cannot have recruitment permissions');
}

// Lifecycle validation
if (management.osot_passed_away && management.osot_shadowing) {
  throw new Error('Deceased members cannot offer shadowing');
}
```

### **3. ManagementRepository** (`management-repository.interface.ts`)

Repository contract defining data access operations following the Repository Pattern.

#### **Key Features:**

- **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- **Advanced Search**: Multi-criteria queries with flags and permissions
- **Business Operations**: Vendor management, recruitment, shadowing services
- **Analytics**: System-wide and account-specific statistics
- **Administrative Tools**: Bulk operations, audit trails, lifecycle management
- **Validation**: Business rule enforcement and conflict detection

#### **Core Operations:**

```typescript
interface ManagementRepository {
  // Basic CRUD
  create(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
  findByGuid(guid: string): Promise<Record<string, unknown> | undefined>;
  updateByGuid(guid: string, payload: Record<string, unknown>): Promise<void>;
  deleteByGuid(guid: string): Promise<void>;

  // Business Operations
  findByAccountId(accountId: string): Promise<Record<string, unknown>[]>;
  findByBusinessId(
    businessId: string,
  ): Promise<Record<string, unknown> | undefined>;
  findVendors(includeInactive?: boolean): Promise<Record<string, unknown>[]>;
  findRecruitmentEnabled(): Promise<Record<string, unknown>[]>;
  findShadowingAvailable(): Promise<Record<string, unknown>[]>;
  findLifeMembers(retiredOnly?: boolean): Promise<Record<string, unknown>[]>;
}
```

#### **Advanced Search:**

```typescript
search(criteria: {
  accountId?: string;
  lifeMemberRetired?: boolean;
  shadowing?: boolean;
  passedAway?: boolean;
  vendor?: boolean;
  advertising?: boolean;
  recruitment?: boolean;
  driverRehab?: boolean;
  accessModifiers?: number[];
  privilege?: number[];
  limit?: number;
}): Promise<{
  results: Record<string, unknown>[];
  totalCount: number;
}>;
```

#### **Analytics Operations:**

```typescript
// Account-specific statistics
getManagementStatistics(accountId: string): Promise<{
  total: number;
  flags: Record<string, number>;
  permissions: Record<string, Record<string, number>>;
  business: Record<string, number>;
}>;

// System-wide analytics
getSystemAnalytics(): Promise<{
  totalManagementRecords: number;
  flagAnalytics: Record<string, unknown>;
  privilegeAnalytics: Record<string, number>;
  businessMetrics: Record<string, number>;
}>;
```

#### **Administrative Operations:**

```typescript
// Bulk operations
bulkUpdate(criteria: Record<string, unknown>,
          updateData: Record<string, unknown>): Promise<{updatedCount: number}>;

// Business rule validation
validateBusinessRules(managementData: Record<string, unknown>): Promise<{
  isValid: boolean;
  violations: string[];
  warnings: string[];
}>;

// Account lifecycle
deactivateAccount(businessId: string,
                 reason: 'passed_away' | 'retired' | 'suspended'): Promise<void>;
reactivateAccount(businessId: string): Promise<void>;

// Audit operations
getAuditTrail(businessId: string, startDate?: string, endDate?: string): Promise<{
  changes: Array<{
    timestamp: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
    changedBy: string;
  }>;
}>;
```

## 🔧 Integration Points

### **Dependency Injection**

```typescript
// Repository injection token
export const MANAGEMENT_REPOSITORY = Symbol('MANAGEMENT_REPOSITORY');

// Service injection example
@Injectable()
export class ManagementCrudService {
  constructor(
    @Inject(MANAGEMENT_REPOSITORY)
    private readonly repository: ManagementRepository,
  ) {}
}
```

### **Data Flow Patterns**

```typescript
// Dataverse → Internal (via mappers)
const internal = mapDataverseToInternal(dataverseResponse);

// Internal → Public DTO (via mappers)
const publicDto = mapInternalToResponseDto(internal);

// Never expose internal fields publicly
// ❌ Wrong: return internal;
// ✅ Correct: return mapInternalToResponseDto(internal);
```

## 🛡️ Security Considerations

### **Sensitive Fields (Never Expose Publicly)**

- `osot_table_account_managementid` - Internal GUID
- `osot_privilege` - Administrative access level
- `ownerid` - System owner identifier

### **Business Rule Enforcement**

- **Mutual Exclusivity**: Vendors cannot have recruitment permissions
- **Lifecycle Rules**: Deceased members cannot have active services
- **Access Control**: Privilege levels determine operation permissions

### **Data Privacy**

- Management flags require appropriate access levels
- Administrative analytics restricted to privileged users
- Audit trails available only to system administrators

## 📊 Business Logic Rules

### **Flag Combinations**

```typescript
// Valid combinations
vendor: true, advertising: true     // ✅ Vendors can advertise
shadowing: true, recruitment: false // ✅ Can offer shadowing without recruiting

// Invalid combinations
vendor: true, recruitment: true     // ❌ Vendors cannot recruit
passed_away: true, shadowing: true  // ❌ Deceased cannot offer services
```

### **Access Levels**

- **Owner (1)**: Full administrative access
- **Admin (2)**: Configuration and management access
- **Main (3)**: Standard user access (read-only for management)

### **Lifecycle States**

- **Active**: Normal operations, all services available
- **Retired**: Life member status, limited services
- **Deceased**: Archived status, no active services

## 📚 Usage Guidelines

### **Repository Pattern**

- Use dependency injection for repository access
- Abstract data access through interface contracts
- Implement business logic in services, not repositories

### **Type Safety**

- Always use typed interfaces for internal operations
- Convert Dataverse responses using mappers
- Validate business rules before data persistence

### **Error Handling**

- Implement proper validation for business rule violations
- Provide meaningful error messages for constraint failures
- Log administrative actions for audit purposes

---

**💡 Keep interfaces synchronized with business requirements and Dataverse schema changes.**

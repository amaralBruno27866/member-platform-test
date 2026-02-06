# Management Repositories

## Purpose

Contains repository implementations that encapsulate data access logic for Management records. The repository provides a clean abstraction layer over Dataverse operations, implementing the Repository Pattern for consistent and testable data access across the Management module.

## 📁 File Structure

### `management.repository.ts`

Comprehensive repository implementation containing:

#### 🔧 **Core CRUD Operations**

- **Create**: Create new management records with validation
- **Read**: Find by GUID, business ID, account ID with flexible querying
- **Update**: Update existing records by GUID with partial data
- **Delete**: Remove records by GUID (supports soft delete patterns)

#### 🔍 **Business Query Operations**

- **Search**: Advanced multi-criteria search with flags and permissions
- **Filters**: Pre-built queries for vendors, recruitment, shadowing, life members
- **Privilege-based**: Find records by administrative privilege levels
- **Status-based**: Active users, deceased users, specific service providers

#### 📊 **Analytics and Reporting** (Placeholder)

- **Statistics**: Management analytics for accounts
- **System Analytics**: Organization-wide management metrics
- **Conflict Detection**: Business rule violation detection
- **Audit Trails**: Change tracking and audit history

## 🏗️ **Repository Architecture**

### **Implementation Pattern**

```typescript
@Injectable()
export class ManagementRepositoryService implements ManagementRepository {
  constructor(private readonly dataverseService: DataverseService) {}

  // Core CRUD operations
  async create(
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  async findByGuid(guid: string): Promise<Record<string, unknown> | undefined>;
  async updateByGuid(
    guid: string,
    payload: Record<string, unknown>,
  ): Promise<void>;
  async deleteByGuid(guid: string): Promise<void>;

  // Business operations
  async search(criteria: SearchCriteria): Promise<SearchResults>;
  async findVendors(
    includeInactive?: boolean,
  ): Promise<Record<string, unknown>[]>;
  // ... additional business methods
}
```

### **Data Flow Architecture**

```
Controller → Service → Repository → DataverseService → Dataverse
     ↑                    ↑              ↑
   DTOs            Domain Models    Record<string, unknown>
```

### **Error Handling Pattern**

```typescript
try {
  const response = await this.dataverseService.request('GET', endpoint);
  return response as Record<string, unknown>;
} catch (error) {
  throw new Error(
    `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${error.message}`,
  );
}
```

## 🎯 **Core Methods**

### **Primary CRUD Operations**

#### `create(payload: Record<string, unknown>): Promise<Record<string, unknown>>`

Creates a new management record with the provided data.

```typescript
const newRecord = await repository.create({
  osot_user_business_id: 'user-12345',
  osot_vendor: true,
  osot_access_modifiers: 2, // PROTECTED
  osot_privilege: 1, // OWNER
});
```

#### `findByGuid(guid: string): Promise<Record<string, unknown> | undefined>`

Finds a management record by its unique GUID identifier.

```typescript
const record = await repository.findByGuid(
  '550e8400-e29b-41d4-a716-446655440000',
);
if (record) {
  console.log('Found record:', record.osot_user_business_id);
}
```

#### `updateByGuid(guid: string, payload: Record<string, unknown>): Promise<void>`

Updates an existing management record with partial data.

```typescript
await repository.updateByGuid(guid, {
  osot_vendor: false,
  osot_recruitment: true,
  osot_advertising: false,
});
```

#### `deleteByGuid(guid: string): Promise<void>`

Deletes a management record by GUID.

```typescript
await repository.deleteByGuid(guid);
```

### **Business Query Operations**

#### `findByBusinessId(businessId: string): Promise<Record<string, unknown> | undefined>`

Finds management record by user business identifier.

```typescript
const record = await repository.findByBusinessId('user-12345');
```

#### `findByAccountId(accountId: string): Promise<Record<string, unknown>[]>`

Finds all management records associated with an account.

```typescript
const records = await repository.findByAccountId('account-67890');
```

#### `search(criteria: SearchCriteria): Promise<SearchResults>`

Advanced multi-criteria search with pagination and filtering.

```typescript
const results = await repository.search({
  vendor: true,
  passedAway: false,
  privilege: [1, 2], // OWNER or ADMIN
  limit: 50,
});

console.log(`Found ${results.totalCount} records`);
results.results.forEach((record) => {
  console.log(record.osot_user_business_id);
});
```

### **Specialized Query Operations**

#### `findVendors(includeInactive?: boolean): Promise<Record<string, unknown>[]>`

Finds all vendor accounts with optional inactive filtering.

```typescript
const activeVendors = await repository.findVendors(false);
const allVendors = await repository.findVendors(true);
```

#### `findRecruitmentEnabled(): Promise<Record<string, unknown>[]>`

Finds all accounts with recruitment permissions.

```typescript
const recruiters = await repository.findRecruitmentEnabled();
```

#### `findShadowingAvailable(): Promise<Record<string, unknown>[]>`

Finds all accounts offering shadowing services.

```typescript
const shadowingProviders = await repository.findShadowingAvailable();
```

#### `findLifeMembers(retiredOnly?: boolean): Promise<Record<string, unknown>[]>`

Finds life member accounts.

```typescript
const lifeMembers = await repository.findLifeMembers();
```

#### `findByPrivilege(privilege: number): Promise<Record<string, unknown>[]>`

Finds records by administrative privilege level.

```typescript
const owners = await repository.findByPrivilege(1); // OWNER
const admins = await repository.findByPrivilege(2); // ADMIN
```

## 🔧 **Search Criteria Interface**

```typescript
interface SearchCriteria {
  accountId?: string; // Filter by account
  lifeMemberRetired?: boolean; // Life member status
  shadowing?: boolean; // Shadowing availability
  passedAway?: boolean; // Deceased status
  vendor?: boolean; // Vendor status
  advertising?: boolean; // Advertising permissions
  recruitment?: boolean; // Recruitment permissions
  driverRehab?: boolean; // Driver rehab services
  accessModifiers?: number[]; // Access modifier levels
  privilege?: number[]; // Privilege levels
  limit?: number; // Result limit
}
```

## 🎭 **Advanced Features (Placeholder)**

### **Analytics Methods**

```typescript
// Comprehensive management statistics
getManagementStatistics(accountId: string): Promise<ManagementStats>

// System-wide analytics
getSystemAnalytics(): Promise<SystemAnalytics>

// Business rule validation
validateBusinessRules(data: Record<string, unknown>): Promise<ValidationResult>

// Conflict detection
findConflicts(): Promise<ConflictReport>
```

### **Lifecycle Management**

```typescript
// Account deactivation
deactivateAccount(businessId: string, reason: DeactivationReason): Promise<void>

// Account reactivation
reactivateAccount(businessId: string): Promise<void>

// Audit trail access
getAuditTrail(businessId: string, startDate?: string, endDate?: string): Promise<AuditTrail>
```

### **Bulk Operations**

```typescript
// Bulk updates with criteria
bulkUpdate(criteria: Record<string, unknown>, updateData: Record<string, unknown>): Promise<BulkUpdateResult>
```

## 🔗 **Integration Points**

### **Dataverse Service Integration**

```typescript
// Direct Dataverse communication
const response = await this.dataverseService.request(
  'GET',
  `${MANAGEMENT_ODATA.TABLE_NAME}?${query}`,
);
```

### **Constants Integration**

```typescript
// Field mappings
MANAGEMENT_FIELDS.USER_BUSINESS_ID; // 'osot_user_business_id'
MANAGEMENT_FIELDS.VENDOR; // 'osot_vendor'
MANAGEMENT_FIELDS.ACCESS_MODIFIERS; // 'osot_access_modifiers'

// OData configuration
MANAGEMENT_ODATA.TABLE_NAME; // 'osot_table_account_management'
MANAGEMENT_ODATA.QUERY_PATTERNS.VENDORS; // Pre-built vendor filter
MANAGEMENT_ODATA.DEFAULT_ORDER_BY; // Default sorting
```

### **Error Handling Integration**

```typescript
// Standardized error handling
ErrorMessages[ErrorCodes.GENERIC].publicMessage;
```

## 🧪 **Testing Examples**

### **Unit Testing Pattern**

```typescript
describe('ManagementRepositoryService', () => {
  let repository: ManagementRepositoryService;
  let dataverseService: jest.Mocked<DataverseService>;

  beforeEach(() => {
    const module = Test.createTestingModule({
      providers: [
        ManagementRepositoryService,
        { provide: DataverseService, useValue: mockDataverseService },
      ],
    }).compile();

    repository = module.get<ManagementRepositoryService>(
      ManagementRepositoryService,
    );
    dataverseService = module.get(DataverseService);
  });

  it('should create management record', async () => {
    const payload = { osot_user_business_id: 'test-user' };
    const expectedResponse = {
      ...payload,
      osot_table_account_managementid: 'guid',
    };

    dataverseService.request.mockResolvedValue(expectedResponse);

    const result = await repository.create(payload);

    expect(result).toEqual(expectedResponse);
    expect(dataverseService.request).toHaveBeenCalledWith(
      'POST',
      MANAGEMENT_ODATA.TABLE_NAME,
      payload,
    );
  });
});
```

## 📚 **Guidelines**

### **Adding New Query Methods**

- **Follow Naming Convention**: Use descriptive method names (`findByStatus`, `findActiveVendors`)
- **Return Type Consistency**: Use `Record<string, unknown>[]` for collections
- **Error Handling**: Wrap all Dataverse calls in try-catch blocks
- **Query Building**: Use MANAGEMENT_FIELDS constants for field names

### **OData Query Construction**

```typescript
// Use constants for field names
const query = `$filter=${MANAGEMENT_FIELDS.VENDOR} eq 1`;

// Use pre-built patterns when available
const query = MANAGEMENT_ODATA.QUERY_PATTERNS.ACTIVE_USERS;

// Combine with ordering and pagination
const fullQuery = `${query}&${MANAGEMENT_ODATA.DEFAULT_ORDER_BY}&$top=50`;
```

### **Error Handling Best Practices**

- **404 Handling**: Return `undefined` for single record not found
- **Collection Queries**: Return empty array for no results
- **Generic Errors**: Use standardized error messages
- **Specific Errors**: Include operation context in error messages

### **Performance Considerations**

- **Use $select**: Limit returned fields when possible
- **Pagination**: Implement $skip and $top for large result sets
- **Filtering**: Apply filters at database level, not in memory
- **Caching**: Consider caching for frequently accessed data

---

**🎯 Keep repository methods focused, testable, and aligned with business operations.**

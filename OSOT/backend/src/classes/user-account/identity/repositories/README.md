# Identity Repository

## Purpose

Contains specialized repository implementation for Identity domain with standardized error handling and Dataverse integration. Provides clean abstraction layer between business logic and Microsoft Dataverse, ensuring consistency and maintainability.

## Standards Compliance

✅ **Centralized Error Handling**: Uses `createAppError` and `ErrorCodes` from `/common/errors`
✅ **Dataverse Integration**: Proper field mapping and OData query construction
✅ **CSV Compliance**: All field names match Dataverse table specification
✅ **Type Safety**: Comprehensive TypeScript interfaces and error context
✅ **Multi-Select Support**: Correct handling of Dataverse multi-select fields

## Repository Implementation

### **DataverseIdentityRepository**

Injectable repository implementing `IdentityRepository` interface with comprehensive CRUD operations and specialized queries.

```ts
@Injectable()
export class DataverseIdentityRepository implements IdentityRepository {
  constructor(private readonly dataverseService: DataverseService) {}
}
```

## Available Operations

### **Core CRUD Operations**

- **`create(payload)`** - Create new identity record with generated IDs
- **`findByGuid(guid)`** - Find identity by unique GUID identifier
- **`updateByGuid(guid, payload)`** - Update existing identity record
- **`deleteByGuid(guid)`** - Remove identity record

### **Business Logic Queries**

- **`findByAccountId(accountId)`** - Find all identities for specific account
- **`findByBusinessId(businessId)`** - Find identity by business identifier
- **`findByLanguage(language)`** - Find identities by language preference
- **`findByRace(race)`** - Find identities by racial identity

### **Advanced Search**

```ts
search(criteria: {
  accountId?: string;
  gender?: number;
  race?: number[];
  languages?: number[];
  indigenousDetail?: number;
  limit?: number;
}): Promise<{ results: Record<string, unknown>[]; totalCount: number; }>
```

## Field Mapping Compliance

### **CSV-Compliant Field Names**

All repository methods use correct field names based on Dataverse table specification:

```ts
// ✅ CORRECT: CSV-compliant field names
const filter = `osot_user_business_id eq '${businessId}'`;
const filter = `osot_gender eq ${criteria.gender}`;
const filter = `osot_race eq ${race}`;
const filter = `osot_indigenous_detail eq ${criteria.indigenousDetail}`;

// ❌ AVOID: Incorrect field names
const filter = `osot_User_Business_ID eq '${businessId}'`; // Wrong casing
const filter = `osot_Gender eq ${criteria.gender}`; // Wrong casing
```

### **Multi-Select Field Handling**

```ts
// ✅ CORRECT: Proper OData for multi-select fields
const filter = `Microsoft.Dynamics.CRM.ContainValues(PropertyName='osot_language',PropertyValues=['${language}'])`;

// ✅ CORRECT: Multi-value search
const langValues = criteria.languages.map((l) => `'${l}'`).join(',');
const filter = `Microsoft.Dynamics.CRM.ContainValues(PropertyName='osot_language',PropertyValues=[${langValues}])`;
```

## Error Handling Integration

### **Standardized Error Patterns**

```ts
// ✅ CORRECT: Centralized error handling
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

try {
  const response = await this.dataverseService.request(
    'POST',
    endpoint,
    payload,
  );
  return response;
} catch (error) {
  throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
    operation: 'create_identity',
    payload,
    error: error instanceof Error ? error.message : 'Unknown error',
  });
}
```

### **Error Context Enhancement**

All methods provide detailed error context:

- **Operation**: Specific operation being performed
- **Parameters**: Relevant identifiers and data
- **Original Error**: Underlying error message for debugging

## Query Optimization Features

### **Selective Field Loading**

```ts
// Performance optimization with specific field selection
const endpoint = `${IDENTITY_ODATA.TABLE_NAME}(${guid})?$select=${IDENTITY_ODATA.SELECT_FIELDS.join(',')}`;
```

### **Efficient Filtering**

```ts
// Proper URL encoding and OData syntax
const filter = `_osot_table_account_value eq ${accountId}`;
const endpoint = `${IDENTITY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`;
```

### **Result Limiting**

```ts
// Configurable limits with default safety
const limit = criteria.limit || 50;
let endpoint = `${IDENTITY_ODATA.TABLE_NAME}?$top=${limit}`;
```

## Architecture Benefits

### **Clean Abstraction**

- Hides Dataverse complexity from business logic
- Consistent error handling across all operations
- Type-safe interfaces for all methods

### **Testing Support**

```ts
// Interface enables easy mocking for unit tests
export interface IdentityRepository {
  create(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
  findByGuid(guid: string): Promise<Record<string, unknown> | undefined>;
  // ... other methods
}
```

### **Performance Ready**

- Selective field loading reduces payload size
- Efficient OData query construction
- Built-in result limiting for large datasets

## Usage Examples

### **Basic CRUD Operations**

```ts
// Create new identity
const newIdentity = await identityRepo.create({
  osot_user_business_id: 'user-123',
  osot_language: [Language.ENGLISH, Language.FRENCH],
  osot_privilege: Privilege.OWNER,
});

// Find by business ID
const identity = await identityRepo.findByBusinessId('user-123');

// Update identity
await identityRepo.updateByGuid(identityId, {
  osot_chosen_name: 'Alex',
  osot_access_modifiers: AccessModifier.PRIVATE,
});
```

### **Advanced Search**

```ts
// Complex demographic search
const results = await identityRepo.search({
  gender: Gender.NON_BINARY,
  race: [Race.INDIGENOUS, Race.MIXED],
  languages: [Language.ENGLISH, Language.FRENCH],
  indigenousDetail: IndigenousDetail.FIRST_NATIONS,
  limit: 25,
});
```

### **Account-Based Queries**

```ts
// Find all identities for account
const accountIdentities = await identityRepo.findByAccountId(accountId);

// Find by language preference
const frenchSpeakers = await identityRepo.findByLanguage(Language.FRENCH);
```

## Best Practices

1. **Error Context**: Always provide meaningful error context with operation details
2. **Field Names**: Use exact field names from CSV specification
3. **Multi-Select**: Use proper OData functions for multi-select fields
4. **Performance**: Leverage selective field loading and result limiting
5. **Type Safety**: Use TypeScript interfaces for compile-time validation
6. **Testing**: Design for easy mocking and unit testing
7. **Consistency**: Follow established patterns for all repository methods

# Address Repositories (SIMPLIFIED)

## Purpose

Contains repository implementations for Address module data access layer. Follows the Contact repository pattern with essential modules integration (#file:errors, #file:integrations, #file:interfaces) and provides clean abstraction over DataverseService.

## Available Repositories

### DataverseAddressRepository

- **Purpose**: Main repository implementation using Microsoft Dataverse
- **Interface**: Implements `AddressRepository` contract
- **Features**:
  - Full CRUD operations with proper error handling
  - Account-based address queries with business ID validation
  - Postal code validation and duplicate checking
  - Address statistics and counting
  - Health check functionality
  - Type-safe interfaces for all operations

## Integration Points ✅

### ✅ #file:errors Integration

- **Error Handling**: Uses ErrorCodes.GENERIC and ErrorCodes.NOT_FOUND
- **Messages**: Structured error messages with ErrorMessages mapping
- **Logging**: Proper error context and technical details

### ✅ #file:integrations Integration

- **DataverseService**: All operations use DataverseService.request()
- **OData Queries**: Compatible with Dataverse OData API
- **Type Safety**: Proper typing for all Dataverse interactions

### ✅ #file:interfaces Integration

- **AddressRepository**: Implements contract interface
- **AddressInternal**: Uses for internal data representation
- **AddressDataverse**: Uses for Dataverse response mapping

### ✅ #file:utils Integration (Ready)

- **Business Rules**: Ready for business-rule.util integration
- **Data Mapping**: Clean internal/external data transformation
- **Validation**: Structured validation patterns

## Architecture Benefits

- **Abstraction**: Clean separation between business logic and data access
- **Testing**: Easy unit testing with mock implementations
- **Consistency**: Centralized data access patterns
- **Maintainability**: Single point of change for data layer modifications

## Key Methods

### CRUD Operations

- `create(addressData)` - Create new address
- `findById(addressId)` - Find by GUID
- `update(addressId, updateData)` - Update existing
- `delete(addressId)` - Delete by GUID
- `exists(addressId)` - Check existence

### Query Operations

- `findByAccountId(accountId)` - Find all addresses for account
- `findByUserId(userId)` - Find addresses by owner
- `findByPostalCode(postalCode, accountId?)` - Find by postal code
- `countByAccountId(accountId)` - Count addresses for account

### Utility Operations

- `queryRaw(oDataQuery)` - Raw OData queries
- `batchCreate(addresses)` - Batch operations
- `healthCheck()` - Repository health status

## Data Mapping

### Internal → Dataverse

Maps AddressInternal interface to Dataverse payload format with proper OData binding for Account relationships.

### Dataverse → Internal

Maps Dataverse response back to AddressInternal interface for business logic consumption.

## Error Handling

All operations include proper error handling with:

- Structured error messages using ErrorMessages
- Technical error details for logging
- User-friendly public messages
- 404 handling for not found scenarios

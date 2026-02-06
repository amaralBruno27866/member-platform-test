# Affiliate Repositories

## Purpose

Contains repository implementations that encapsulate data access logic for affiliates. Repositories interact with the Dataverse database and provide a consistent API to services following the clean architecture pattern.

## Architecture

The affiliate repository follows the **Repository Pattern** and implements the `AffiliateRepository` interface, providing a clean abstraction layer between business logic and data persistence.

**Key Features:**

- **Dataverse Integration**: Direct integration with Microsoft Dataverse through DataverseService
- **Type Safety**: Full TypeScript typing with internal/dataverse mapping
- **Error Handling**: Structured error responses using ErrorCodes and ErrorMessages
- **Business Logic**: Affiliate-specific query patterns for OSOT business needs

## Repository Implementation

### **AffiliateRepositoryService**

**Purpose**: Complete data access layer for affiliate entities with comprehensive CRUD operations, business queries, and advanced filtering capabilities.

**Core Operations:**

- `create()` - Create new affiliate records
- `findById()` - Find by internal GUID identifier
- `findByBusinessId()` - Find by public business ID (affi-0000001)
- `findByEmail()` - Find by email address (unique constraint)
- `update()` - Update affiliate data
- `delete()` - Soft delete affiliate records
- `exists()` - Check affiliate existence

**Business Queries:**

- `findByArea()` - Filter by business area
- `findByStatus()` - Filter by account status
- `findActiveAffiliates()` - Active members only
- `findByProvince()` - Geographic filtering by province
- `findByCountry()` - Geographic filtering by country
- `findByLocation()` - Combined geographic filtering

**Search Operations:**

- `searchByName()` - Partial name matching
- `searchByRepresentative()` - Representative name search
- `advancedSearch()` - Multi-criteria filtering
- `findMany()` - Complex query builder with filters

**Authentication & Validation:**

- `validateCredentials()` - Login credential validation
- `emailExists()` - Duplicate email checking
- `updatePassword()` - Secure password updates

**Analytics & Reporting:**

- `countByArea()` - Count affiliates per business area
- `countByStatus()` - Count affiliates per status
- `countByProvince()` - Geographic distribution
- `getTotalCount()` - Total affiliate count
- `getRecentlyCreated()` - Recent registration tracking

**Advanced Operations:**

- `bulkUpdateStatus()` - Batch status updates
- `queryRaw()` - Custom OData queries
- `executeQuery()` - Direct query execution
- `batchCreate()` - Bulk affiliate creation
- `batchUpdate()` - Bulk affiliate updates

**Relationship Management:**

- `findByOwner()` - Affiliates by owner
- `transferOwnership()` - Change affiliate ownership

## Data Transformation

### **Mapping Functions**

**`mapFromDataverse()`**: Transforms raw Dataverse responses to internal `AffiliateInternal` format

- Handles all 27 affiliate fields from Table Account Affiliate
- Maps system fields (IDs, timestamps, ownership)
- Converts choice field numbers to business values
- Maintains data integrity across transformations

**`mapToDataverse()`**: Transforms internal format to Dataverse-compatible payload

- Converts business objects to Dataverse schema
- Handles partial updates for PATCH operations
- Manages field validation and constraints
- Ensures proper OData format compliance

## Integration

### **Dependencies**

- **DataverseService**: Core Dataverse API integration
- **ErrorMessages/ErrorCodes**: Structured error handling
- **AFFILIATE_FIELDS**: Field name constants for type safety
- **AFFILIATE_ODATA**: OData configuration and table metadata

### **Field Mapping**

Uses `AFFILIATE_FIELDS` constants for consistent field mapping:

```typescript
// Organization profile
AFFILIATE_NAME: 'osot_affiliate_name';
AFFILIATE_AREA: 'osot_affiliate_area';

// Representative identity
REPRESENTATIVE_FIRST_NAME: 'osot_representative_first_name';
REPRESENTATIVE_LAST_NAME: 'osot_representative_last_name';

// Contact information
AFFILIATE_EMAIL: 'osot_affiliate_email';
AFFILIATE_PHONE: 'osot_affiliate_phone';

// Address information
AFFILIATE_ADDRESS_1: 'osot_affiliate_address_1';
AFFILIATE_PROVINCE: 'osot_affiliate_province';
AFFILIATE_COUNTRY: 'osot_affiliate_country';

// Account & security
ACCOUNT_STATUS: 'osot_account_status';
ACCESS_MODIFIERS: 'osot_access_modifiers';
```

## Usage Examples

### **Basic CRUD Operations**

```typescript
// Create affiliate
const newAffiliate = await affiliateRepo.create({
  osot_affiliate_name: 'Tech Solutions Inc.',
  osot_affiliate_area: AffiliateArea.TECHNOLOGY,
  osot_representative_first_name: 'John',
  osot_representative_last_name: 'Doe',
  osot_affiliate_email: 'contact@techsolutions.com',
  // ... other required fields
});

// Find by email
const affiliate = await affiliateRepo.findByEmail('contact@techsolutions.com');

// Update affiliate
const updated = await affiliateRepo.update(affiliateId, {
  osot_account_status: AccountStatus.ACTIVE,
});
```

### **Business Queries**

```typescript
// Find by business area
const techAffiliates = await affiliateRepo.findByArea(
  AffiliateArea.TECHNOLOGY,
  10, // limit
);

// Geographic search
const ontarioAffiliates = await affiliateRepo.findByProvince(Province.ONTARIO);

// Advanced search
const results = await affiliateRepo.advancedSearch(
  {
    area: AffiliateArea.HEALTHCARE,
    province: Province.ONTARIO,
    activeOnly: true,
  },
  20,
);
```

### **Analytics**

```typescript
// Count by business area
const areaCounts = await affiliateRepo.countByArea();
// Returns: { 1: 25, 2: 18, 3: 42, ... }

// Recent registrations
const recentAffiliates = await affiliateRepo.getRecentlyCreated(30); // last 30 days
```

## Technical Notes

### **Error Handling**

All repository methods use structured error handling:

```typescript
try {
  const affiliate = await affiliateRepo.findById(id);
} catch (error) {
  // Error contains structured message from ErrorMessages[ErrorCodes.GENERIC]
}
```

### **Performance Considerations**

- Utilizes OData `$select` to limit returned fields
- Implements pagination with `$top` and `$skip`
- Uses indexed fields for common queries (email, business ID)
- Batch operations for bulk updates

### **Security**

- No direct SQL injection risk (OData parameterization)
- Password handling uses hashed values only
- Owner-based access control through Dataverse security
- Input validation through TypeScript typing

## Best Practices

1. **Use specific query methods**: Prefer `findByEmail()` over generic `findMany()`
2. **Implement pagination**: Always use `limit` for large result sets
3. **Handle errors gracefully**: Catch and transform repository errors to business errors
4. **Leverage batch operations**: Use bulk methods for multiple record operations
5. **Validate before persistence**: Ensure data integrity before calling repository methods

## Future Enhancements

- **Caching Layer**: Add Redis caching for frequently accessed data
- **Query Optimization**: Implement query result caching and optimization
- **Audit Trail**: Add change tracking for affiliate modifications
- **Relationship Loading**: Implement lazy/eager loading for related entities

# Management Constants

## Purpose

This folder contains constant values used across the Management domain. Constants include administrative settings, validation rules, business logic constraints, access control definitions, and integration points for the Account Management module.

## 📁 File Structure

### `management.constants.ts`

Comprehensive constants file containing:

#### 🗄️ **Dataverse Schema Constants**

- **Table Names**: Schema names, logical names, display names
- **Field Names**: All Dataverse field mappings
- **OData Binds**: Relationship binding patterns
- **Relationships**: Entity relationship definitions

#### 🔗 **Field Mapping Constants (MANAGEMENT_FIELDS)**

- **System Fields**: Primary keys, audit fields (created_on, modified_on)
- **Business Fields**: User business ID, management flags, access control
- **Relationship Fields**: Account table relationships
- **Choice Fields**: Access modifiers and privilege mappings

#### 📊 **OData Configuration Constants (MANAGEMENT_ODATA)**

- **Table Configuration**: Entity set names, primary keys
- **Query Patterns**: Pre-built OData filter patterns
- **Select Options**: Default field selection lists
- **Ordering**: Default sorting configurations
- **Expand Options**: Related data expansion patterns

#### ⚙️ **Management Configuration Constants**

- **Default Values**: Default settings for new management records
- **Flag Categories**: Logical grouping of management flags
- **Boolean Flags**: Life member, shadowing, vendor, advertising, etc.
- **Choice Field Defaults**: Default values for Access Modifiers and Privilege fields

#### 🔐 **Access Control Constants**

- **Required Privileges**: Admin privilege requirements for operations
- **Administrative Roles**: Super admin, config admin, view admin
- **Sensitive Operations**: Operations requiring additional verification

#### 📋 **Business Rule Constants**

- **Mutual Exclusivity**: Rules for conflicting flags
- **Lifecycle Rules**: Account state management
- **Audit Requirements**: Operations requiring audit trails

#### 🔍 **Query and Search Constants**

- **Pagination Settings**: Default page sizes and sorting
- **Search Weights**: Field relevance scoring
- **Common Filters**: Pre-defined filter expressions

#### ⚡ **Performance Constants**

- **Cache Settings**: Cache keys, TTL values
- **Batch Limits**: Bulk operation constraints
- **Optimization**: Query and performance tuning

#### 🚨 **Error Handling Constants**

- **Error Codes**: Management-specific error identifiers
- **Error Messages**: User-friendly error descriptions
- **Validation Rules**: Field validation constraints

#### 🔗 **Integration Constants**

- **Related Tables**: References to Account and Affiliate tables
- **Event Types**: Management lifecycle events
- **External Systems**: Integration points for notifications and audit

## 📊 **Key Constants Categories**

### **Management Flags (Boolean Configurations)**

```typescript
LIFE_MEMBER_RETIRED: boolean; // Lifetime member status
SHADOWING: boolean; // Allow professional shadowing
PASSED_AWAY: boolean; // Deceased user status
VENDOR: boolean; // Vendor/supplier status
ADVERTISING: boolean; // Allow advertising content
RECRUITMENT: boolean; // Allow recruitment activities
DRIVER_REHAB: boolean; // Driver rehabilitation services
```

### **Choice Field Defaults (CSV Aligned)**

```typescript
ACCESS_MODIFIERS: AccessModifier.PROTECTED; // Default: Protected (2)
PRIVILEGE: Privilege.OWNER; // Default: Owner (1)
```

### **Access Control Levels**

```typescript
OWNER: 'OWNER'; // Super admin - all operations
ADMIN: 'ADMIN'; // Config admin - most operations
MAIN: 'MAIN'; // View admin - read-only access
```

### **Business Rules**

```typescript
// Mutual exclusivity rules
ACTIVE_VS_DECEASED: Cannot be both active and passed away
VENDOR_RESTRICTIONS: Vendors cannot have recruitment flags

// Lifecycle rules
REQUIRE_ACTIVE_ACCOUNT: Most flags require active account
DEACTIVATING_FLAGS: Some flags deactivate accounts

// Audit requirements
REQUIRE_AUDIT: Sensitive changes need audit trails
REQUIRE_APPROVAL: Privilege changes need approval
```

## 🚀 **Usage Examples**

### **Import Constants**

```typescript
import {
  MANAGEMENT_CONSTANTS,
  MANAGEMENT_SCHEMA,
  MANAGEMENT_FIELDS,
  MANAGEMENT_ODATA,
  MANAGEMENT_FLAGS,
  MANAGEMENT_CHOICE_DEFAULTS,
} from './management.constants';
```

### **Schema Field Access**

```typescript
// Dataverse field names for queries
const userIdField = MANAGEMENT_FIELDS.USER_BUSINESS_ID;
const privilegeField = MANAGEMENT_FIELDS.PRIVILEGE;
const accountField = MANAGEMENT_FIELDS.TABLE_ACCOUNT;

// Schema information
const tableName = MANAGEMENT_SCHEMA.TABLE_NAME;
const accountBind = MANAGEMENT_SCHEMA.ODATA_BINDS.TABLE_ACCOUNT;
```

### **OData Query Building**

```typescript
// Pre-built query patterns
const activeUsersQuery = MANAGEMENT_ODATA.QUERY_PATTERNS.ACTIVE_USERS;
const vendorsQuery = MANAGEMENT_ODATA.QUERY_PATTERNS.VENDORS;
const byBusinessIdQuery = MANAGEMENT_ODATA.QUERY_PATTERNS.BY_BUSINESS_ID;

// Table configuration
const tableName = MANAGEMENT_ODATA.TABLE_NAME;
const primaryKey = MANAGEMENT_ODATA.PRIMARY_KEY;
const defaultSelect = MANAGEMENT_ODATA.DEFAULT_SELECT;
const defaultOrderBy = MANAGEMENT_ODATA.DEFAULT_ORDER_BY;
```

### **Default Values**

```typescript
// Default flag values for new records
const defaults = MANAGEMENT_FLAGS.DEFAULTS;
// { LIFE_MEMBER_RETIRED: false, SHADOWING: false, ... }

// Default choice field values (CSV aligned)
const choiceDefaults = MANAGEMENT_CHOICE_DEFAULTS;
// { ACCESS_MODIFIERS: 2, PRIVILEGE: 1 }
```

### **Validation Rules**

```typescript
// User Business ID validation
const validation = MANAGEMENT_VALIDATION.USER_BUSINESS_ID;
// { MIN_LENGTH: 1, MAX_LENGTH: 20, PATTERN: /^[a-zA-Z0-9_-]+$/ }
```

### **Access Control**

```typescript
// Check required privileges
const readPrivileges = MANAGEMENT_ACCESS.REQUIRED_PRIVILEGES.READ;
// ['OWNER', 'ADMIN']
```

### **Business Rules**

```typescript
// Check exclusive flags
const exclusiveFlags =
  MANAGEMENT_BUSINESS_RULES.EXCLUSIVE_FLAGS.ACTIVE_VS_DECEASED;
// ['lifeMemberRetired', 'passedAway']
```

## 🔧 **Integration Points**

### **Dataverse Integration**

- **Schema Field Mappings**: MANAGEMENT_FIELDS for entity operations
- **OData Query Patterns**: Pre-built filters for common searches
- **Table Configuration**: MANAGEMENT_ODATA for repository operations
- **Relationship Navigation**: Bind patterns for cross-entity queries

### **Error Handling Integration**

- Standardized error codes for management operations
- User-friendly error messages
- Validation rule definitions

### **Access Control Integration**

- Privilege requirement definitions
- Administrative role hierarchies
- Sensitive operation classifications

### **Business Logic Integration**

- Flag combination rules
- Account lifecycle management
- Audit and approval requirements

## 📚 **Guidelines**

### **Adding New Constants**

- **Categorize Appropriately**: Place constants in logical sections
- **Follow Naming Convention**: Use SCREAMING_SNAKE_CASE for constants
- **Provide Documentation**: Add JSDoc comments for complex constants
- **Type Safety**: Export type definitions for constant values

### **Validation Constants**

- **Pattern Definitions**: Use RegExp for field validation
- **Length Constraints**: Define min/max lengths for text fields
- **Required Fields**: List mandatory fields for operations
- **Business Rules**: Define constraint relationships

### **Performance Constants**

- **Cache Configuration**: Set appropriate TTL values
- **Batch Limits**: Define safe bulk operation sizes
- **Query Optimization**: Configure pagination and sorting defaults

## 🔄 **Maintenance Notes**

### **Schema Changes**

- Update field mappings when Dataverse schema changes
- Verify OData bind patterns after relationship modifications
- Sync constants with CSV schema definitions

### **Business Rule Updates**

- Review flag combinations when adding new management features
- Update access control requirements for new operations
- Maintain audit requirements for sensitive changes

### **Performance Tuning**

- Adjust cache TTL based on usage patterns
- Update batch limits based on system performance
- Optimize query defaults for common use cases

---

**🎯 Keep constants synchronized with business requirements and system capabilities.**

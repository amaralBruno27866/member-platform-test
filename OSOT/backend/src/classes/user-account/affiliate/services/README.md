# Affiliate Services

## Purpose

Contains business logic for affiliate operations following enterprise patterns. Services orchestrate calls to DataverseService, apply business rules, validate data, and provide secure access control. They are the core of the affiliate domain logic.

## Architecture Overview

The affiliate services follow a layered architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     Controllers Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Business Rule  │  │      CRUD       │  │   Lookup     │ │
│  │    Service      │  │    Service      │  │   Service    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   DataverseService Layer                    │
├─────────────────────────────────────────────────────────────┤
│                     External APIs                           │
└─────────────────────────────────────────────────────────────┘
```

## Implemented Services

### 1. 🔐 **AffiliateAuthService** (`affiliate-auth.service.ts`)

**Purpose**: Secure authentication operations for affiliate organizations following enterprise patterns.

**Key Features**:

- Repository Pattern integration for clean data access
- Comprehensive event emission for audit trails
- Enhanced security validation with organizational context
- Representative authorization checking
- Organization-specific business rules validation
- Structured logging with operation IDs

**Methods**:

```typescript
validateCredentials(email: string, password: string)
// -> Validates affiliate credentials with events and audit trail

requestPasswordReset(email: string)
// -> Generates reset tokens with organizational security events
```

**Events Emitted**:

- `AffiliateLoginEvent` (success/failure with organizational context)
- `AffiliatePasswordResetEvent` (reset requests with organization validation)

**Architecture**: ✅ Repository Pattern + Events + Organizational Security

---

### 2. AffiliateBusinessRuleService (`affiliate-business-rule.service.ts`)

**Purpose**: Centralized business logic and validation engine for affiliate operations.

**Key Features**:

- 🔐 **Password Security**: Hash generation, verification, strength validation
- ✅ **Business Rule Validation**: Email uniqueness, data integrity checks
- � **Email Validation**: Public endpoint for registration email availability checking
- �🛡️ **Privilege Management**: Access control and field-level filtering
- 📋 **Data Validation**: Comprehensive input sanitization and format checking
- 🔄 **Integration Layer**: Secure DataverseService communication

**Core Methods**:

```typescript
// Password Operations
hashPassword(password: string): Promise<string>
verifyPassword(password: string, hash: string): Promise<boolean>
validatePasswordStrength(password: string): ValidationResult

// Business Rule Validation
validateEmailUniqueness(email: string): Promise<boolean>
validateBusinessRules(data: CreateAffiliateDto): Promise<ValidationResult>
validateUpdateConsistency(id: string, data: UpdateAffiliateDto): Promise<ValidationResult>

// Privilege Management
checkCreatePrivileges(userPrivilege: Privilege): boolean
checkUpdatePrivileges(userPrivilege: Privilege, targetId: string): Promise<boolean>
filterFieldsByPrivilege(data: any, privilege: Privilege): FilteredData
```

### 2. AffiliateCrudService (`affiliate-crud.service.ts`)

**Purpose**: Complete CRUD operations with integrated security and business rule enforcement.

**Key Features**:

- 🆕 **Create Operations**: Secure affiliate creation with password hashing
- 📖 **Read Operations**: Privilege-based data retrieval and filtering
- ✏️ **Update Operations**: Data consistency validation and security checks
- 🗑️ **Delete Operations**: Soft delete with cascade considerations
- 📄 **Pagination Support**: Efficient large dataset handling
- 🔍 **Search & Filter**: Advanced querying with security constraints

**Core Methods**:

```typescript
// Primary CRUD Operations
createAffiliate(data: CreateAffiliateDto, userPrivilege?: Privilege): Promise<AffiliateInternal>
findAffiliateById(id: string, userPrivilege?: Privilege): Promise<AffiliateInternal | null>
updateAffiliate(id: string, data: UpdateAffiliateDto, userPrivilege?: Privilege): Promise<AffiliateInternal>
deleteAffiliate(id: string, userPrivilege?: Privilege): Promise<boolean>

// Advanced Operations
findAllAffiliates(options: PaginationOptions, userPrivilege?: Privilege): Promise<PaginatedResult>
verifyAffiliatePassword(id: string, password: string): Promise<boolean>
```

### 3. AffiliateLookupService (`affiliate-lookup.service.ts`)

**Purpose**: Specialized search and discovery operations with multi-level security filtering.

**Key Features**:

- 🔍 **Multi-Search Types**: Email, name, geographic, area-based searches
- 🔒 **Security Levels**: PUBLIC, AUTHENTICATED, PRIVILEGED access control
- 📊 **Pagination**: Efficient result set management (1-100 limit)
- 🌍 **Geographic Filtering**: City, province, country-based searches
- 📈 **Status Filtering**: Active/inactive affiliate discovery
- ⚡ **Performance Optimized**: Selective field queries and indexed searches

**Core Methods**:

```typescript
// Search Operations
findByEmail(email: string, userPrivilege?: Privilege, securityLevel?: SecurityLevel): Promise<AffiliateInternal | null>
findByName(name: string, userPrivilege?: Privilege, securityLevel?: SecurityLevel, limit?: number, offset?: number): Promise<PaginatedResult>

// Geographic Searches
findByCity(city: string | number, ...options): Promise<PaginatedResult>
findByProvince(province: string | number, ...options): Promise<PaginatedResult>
findByCountry(country: string | number, ...options): Promise<PaginatedResult>

// Categorical & Status Searches
findByArea(area: number, ...options): Promise<PaginatedResult>
findActiveAffiliates(...options): Promise<PaginatedResult>
findInactiveAffiliates(...options): Promise<PaginatedResult>
```

## Security Architecture

### Security Levels

- **PUBLIC**: Basic information (name, area, geographic data)
- **AUTHENTICATED**: Contact information (email, phone, website)
- **PRIVILEGED**: Sensitive data (representative details, addresses, status)

### Privilege Hierarchy

```
OWNER > ADMIN > MAIN
```

### Access Control Matrix

| Operation           | PUBLIC | AUTHENTICATED | PRIVILEGED       |
| ------------------- | ------ | ------------- | ---------------- |
| Basic Info          | ✅     | ✅            | ✅               |
| Contact Data        | ❌     | ✅            | ✅               |
| Representative Info | ❌     | ❌            | ✅               |
| Admin Operations    | ❌     | ❌            | ✅ (OWNER/ADMIN) |

## Type Safety & Validation

All services implement comprehensive type safety:

```typescript
// Type Guards
isDataverseResponse(obj: unknown): obj is DataverseResponse
isAffiliateRecord(obj: unknown): obj is DataversePayload

// Safe Conversions
safeStringifyForOData(value: unknown): string
safeEnumConversion<T>(value: string | number | undefined): T | undefined

// Input Validation
validateAndSanitizeEmail(email: string): string
validateGuid(guid: string): string
validateAffiliateName(name: string): string
```

## Error Handling

Structured error handling with comprehensive logging:

```typescript
// Error Codes Used
ErrorCodes.VALIDATION_ERROR; // Input validation failures
ErrorCodes.PERMISSION_DENIED; // Access control violations
ErrorCodes.EXTERNAL_SERVICE_ERROR; // DataverseService failures
ErrorCodes.INTERNAL_ERROR; // Unexpected system errors
ErrorCodes.BUSINESS_RULE_VIOLATION; // Business logic violations
```

## Logging & Monitoring

Enterprise-grade logging with operation tracking:

```typescript
// Operation IDs for tracing
const operationId = `create_affiliate_${Date.now()}`;

// Structured logging with context
this.logger.log('Operation completed', {
  operation: 'createAffiliate',
  operationId,
  userPrivilege,
  timestamp: new Date().toISOString(),
  fieldsReturned: Object.keys(result).length,
});
```

## Integration Points

- **DataverseService**: Primary data persistence layer
- **ErrorFactory**: Centralized error creation and formatting
- **Enums**: Type-safe constants for privileges, areas, statuses
- **Interfaces**: Structured data contracts (AffiliateInternal, DTOs)
- **Validators**: Input sanitization and format verification

## Usage Examples

### Creating an Affiliate

```typescript
const createData: CreateAffiliateDto = {
  osot_affiliate_name: 'Healthcare Partners Inc.',
  osot_affiliate_email: 'contact@healthpartners.ca',
  osot_password: 'SecurePass123!',
  // ... other required fields
};

const affiliate = await affiliateCrudService.createAffiliate(
  createData,
  Privilege.ADMIN,
);
```

### Searching Affiliates

```typescript
// Public search by name
const results = await affiliateLookupService.findByName(
  'Healthcare',
  undefined, // No user privilege
  SecurityLevel.PUBLIC,
  25, // limit
  0, // offset
);

// Privileged search with full data
const privilegedResults = await affiliateLookupService.findByArea(
  AffiliateArea.HEALTHCARE,
  Privilege.ADMIN,
  SecurityLevel.PRIVILEGED,
);
```

### Password Verification

```typescript
const isValid = await affiliateBusinessRuleService.verifyPassword(
  'userInputPassword',
  storedHashedPassword,
);
```

### Email Uniqueness Validation

```typescript
// Check if email is available for registration
const isEmailAvailable =
  await affiliateBusinessRuleService.validateEmailUniqueness(
    'newuser@example.com',
  );

if (isEmailAvailable) {
  console.log('Email is available for registration');
} else {
  console.log('Email is already in use');
}
```

## Guidelines

- **Type Safety**: Always use type guards and proper TypeScript types
- **Security First**: Validate privileges before any data access
- **Error Handling**: Use structured errors with appropriate HTTP status codes
- **Logging**: Include operation IDs and comprehensive context in logs
- **Validation**: Sanitize all inputs and validate business rules
- **Performance**: Use pagination for large datasets and selective field queries
- **Testing**: Keep services testable and decoupled from transport layers
- **Injection**: Use constructor injection for dependencies (DataverseService, BusinessRuleService)

## Dependencies

```typescript
// Required Injections
constructor(
  private readonly dataverseService: DataverseService,
  private readonly businessRuleService: AffiliateBusinessRuleService, // CRUD & Lookup only
) {}
```

## File Structure

```
services/
├── affiliate-business-rule.service.ts   # Business logic & validation (530+ lines)
├── affiliate-crud.service.ts            # CRUD operations (700+ lines)
├── affiliate-lookup.service.ts          # Search & discovery (1600+ lines)
└── README.md                           # This documentation
```

---

_These services follow enterprise patterns and are production-ready with comprehensive error handling, logging, and security features._

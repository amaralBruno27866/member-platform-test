# Address API - Public/Private Architecture

## Overview

Address management follows the public/private controller pattern with role-based access control:

- **Public Controller**: Address validation and geographic lookup routes (no auth required)
- **Private Controller**: Address CRUD operations (JWT auth required)

## Public Routes (`/public/addresses`)

### Address Validation and Lookup

These routes provide utility functions for address validation and geographic lookup without requiring authentication:

| Route                                     | Method | Purpose                          | Usage                 |
| ----------------------------------------- | ------ | -------------------------------- | --------------------- |
| `POST /public/addresses/validate`         | POST   | Validate address format          | Form validation       |
| `POST /public/addresses/validate-postal`  | POST   | Validate postal code by province | Real-time validation  |
| `GET /public/addresses/provinces`         | GET    | Get list of provinces            | Dropdown population   |
| `GET /public/addresses/cities/{province}` | GET    | Get cities by province           | Cascading dropdowns   |
| `POST /public/addresses/normalize`        | POST   | Standardize address format       | Data cleanup          |
| `POST /public/addresses/suggest`          | POST   | Address autocomplete suggestions | User input assistance |

### Public Features

```
1. Address format validation → Postal code patterns by province
2. Geographic lookup → Province/city combinations
3. Address standardization → Consistent formatting
4. Autocomplete → Real-time suggestions
5. Business rules → Validation without data access
```

## Private Routes (`/private/addresses`)

### User Address Management

| Route                           | Method | Auth | Purpose              |
| ------------------------------- | ------ | ---- | -------------------- |
| `GET /private/addresses/me`     | GET    | JWT  | Get my addresses     |
| `POST /private/addresses`       | POST   | JWT  | Create new address   |
| `GET /private/addresses/:id`    | GET    | JWT  | Get specific address |
| `PATCH /private/addresses/:id`  | PATCH  | JWT  | Update address       |
| `DELETE /private/addresses/:id` | DELETE | JWT  | Delete address       |

### Lookup Operations

| Route                                          | Method | Auth | Purpose                   |
| ---------------------------------------------- | ------ | ---- | ------------------------- |
| `GET /private/addresses/by-postal/:code`       | GET    | JWT  | Find by postal code       |
| `GET /private/addresses/by-account/:accountId` | GET    | JWT  | Get addresses for account |

## Role-Based Access Control

### Permission Levels

```typescript
// User roles determine data access and field visibility
export enum UserRole {
  OWNER = 'owner',     // Own addresses only
  ADMIN = 'admin',     // Extended access
  MAIN = 'main'        // Full system access
}

// Field filtering by role
- OWNER: Basic address fields, no sensitive data
- ADMIN: Extended fields, system metadata
- MAIN: All fields including internal identifiers
```

### Security Features

1. **JWT Authentication**: All private routes require valid JWT
2. **Role Extraction**: User role extracted from JWT payload
3. **Field Filtering**: Response data filtered by user role
4. **Permission Validation**: CRUD operations check user permissions
5. **Data Isolation**: Users see only authorized address data

## Service Integration

### Address Services Usage

```typescript
// Controller delegates to appropriate service layer
private addressCrudService: AddressCrudService;
private addressLookupService: AddressLookupService;
private addressBusinessRulesService: AddressBusinessRulesService;

// Permission-aware operations
const addresses = await this.addressCrudService.findAll(userRole, queryOptions);
const validation = this.addressBusinessRulesService.validateAddressCreation(dto, userRole);
const searchResults = await this.addressLookupService.searchAddresses(query, userRole);
```

### Response Structure

```typescript
// Consistent API responses
interface AddressResponse {
  success: boolean;
  data?: AddressResponseDto | AddressResponseDto[];
  message?: string;
  errors?: ValidationError[];
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
```

## Integration Patterns

### With Account Module

```typescript
// Address creation linked to account
POST /private/addresses
{
  "accountId": "account-guid",
  "addressData": { ... }
}

// Automatic relationship binding
const address = await this.addressCrudService.create({
  ...addressData,
  'osot_Table_Account@odata.bind': `/osot_table_accounts(${accountId})`
}, userRole);
```

### With Registration Orchestrator

```typescript
// Address validation in registration flow
const validation = await fetch('/public/addresses/validate', {
  method: 'POST',
  body: JSON.stringify(addressData),
});

// Address creation after account approval
const address = await this.addressCrudService.create(
  stagingData.address,
  accountGuid,
);
```

## Validation Strategy

### Public Routes

- Schema validation using DTOs
- Business rule validation
- No data persistence
- Format standardization

### Private Routes

- JWT authentication required
- Role-based permission checks
- Data persistence with audit trail
- Event emission for state changes

## Benefits of This Architecture

1. **Clear Separation**: Public utilities vs private data operations
2. **Security First**: Role-based access control throughout
3. **Orchestrator Friendly**: Public validation for registration flows
4. **Performance Optimized**: Efficient field filtering and caching
5. **Developer Experience**: Consistent API patterns and responses
6. **Audit Trail**: Complete tracking of address operations
7. **Geographic Features**: Built-in postal code and proximity search
8. **Scalable Design**: Service layer separation for maintainability

## Migration and Integration

### Module Registration

```typescript
// In address.module.ts
@Module({
  controllers: [AddressPublicController, AddressPrivateController],
  providers: [
    AddressCrudService,
    AddressLookupService,
    AddressBusinessRulesService,
    // ... other providers
  ],
})
export class AddressModule {}
```

### Route Testing

- Public routes: No authentication headers needed
- Private routes: Valid JWT token required
- Role testing: Different JWT payloads for role verification
- Integration testing: End-to-end address workflows

### Next Steps

1. Implement controllers following this architecture
2. Add comprehensive input validation
3. Create integration tests for both controller types
4. Document API endpoints with Swagger
5. Integrate with existing authentication middleware

# Product Access Control Architecture

## Overview

The Product entity implements a **two-level access control system** that separates management rights from viewing rights:

1. **Privilege System**: Controls who can CRUD (Create, Read, Update, Delete) products
2. **Access Modifier System**: Controls who can VIEW/BUY products in the catalog

This dual-layer approach enables flexible business scenarios such as public landing pages, member-only products, and admin-internal tools.

---

## Two-Level Access Control

### Level 1: Privilege (Management Rights)

Controls **management operations** (CRUD) based on user role.

**Source**: `PrivilegeMatrixForProducts.csv`

| Privilege | Create | Read | Update | Delete |
|-----------|--------|------|--------|--------|
| Owner     | ❌      | ✅    | ❌      | ❌      |
| Admin     | ❌      | ✅    | ✅      | ❌      |
| Main      | ✅      | ✅    | ✅      | ✅      |

**Implementation**: `product-privilege.helper.ts`
- `canCreateProduct()`: Main only
- `canReadProduct()`: Owner/Admin/Main (for management)
- `canUpdateProduct()`: Admin/Main
- `canDeleteProduct()`: Main only

**Used By**: `ProductCrudService`

---

### Level 2: Access Modifier (Viewing Rights)

Controls **viewing/purchasing** access based on product visibility level and user status.

**Access Modifier Values**:
- `0` = **PUBLIC**: Anyone can view if product is AVAILABLE
- `1` = **PROTECTED**: Requires active membership
- `2` = **PRIVATE**: Only Admin/Main can view

**Implementation**: `canViewProduct()` in `product-privilege.helper.ts`

```typescript
export function canViewProduct(
  accessModifier: number,
  productStatus: number,
  userPrivilege?: Privilege,
  hasMembership?: boolean,
): boolean {
  const { ADMIN, MAIN } = Privilege;
  const { AVAILABLE } = ProductStatus;
  const { PUBLIC, PROTECTED, PRIVATE } = ProductAccessModifiers;

  const isAdminOrMain = userPrivilege === ADMIN || userPrivilege === MAIN;

  // Admin/Main can see all products except non-AVAILABLE
  if (productStatus !== AVAILABLE && !isAdminOrMain) {
    return false;
  }

  // Access Modifier logic
  if (accessModifier === PUBLIC) {
    return productStatus === AVAILABLE;
  }

  if (accessModifier === PROTECTED) {
    return hasMembership === true;
  }

  if (accessModifier === PRIVATE) {
    return isAdminOrMain;
  }

  return false;
}
```

**Used By**: `ProductLookupService`

---

## Business Scenarios

### Scenario 1: Public Landing Page

**Use Case**: T-shirt or general merchandise visible to everyone

**Configuration**:
- Access Modifier: `PUBLIC` (0)
- Product Status: `AVAILABLE`

**Access**:
- ✅ Unauthenticated users: Can view
- ✅ Members: Can view
- ✅ Admin/Main: Can view

**Implementation**:
```typescript
// Landing page endpoint (Public Controller)
await productLookupService.getAvailableProducts();
// Returns only PUBLIC + AVAILABLE products
```

---

### Scenario 2: Member-Only Products

**Use Case**: Conference 2025, specialized courses, premium content

**Configuration**:
- Access Modifier: `PROTECTED` (1)
- Product Status: `AVAILABLE`

**Access**:
- ❌ Unauthenticated users: Cannot view
- ✅ Members (hasMembership=true): Can view
- ✅ Admin/Main: Can view

**Implementation**:
```typescript
// Member area endpoint (Private Controller with JWT)
const hasMembership = req.user.osot_membership; // from JWT
await productLookupService.findByProductId(productId, privilege, hasMembership);
```

---

### Scenario 3: Admin-Internal Products

**Use Case**: Internal tools, testing products, admin resources

**Configuration**:
- Access Modifier: `PRIVATE` (2)
- Product Status: `AVAILABLE`

**Access**:
- ❌ Unauthenticated users: Cannot view
- ❌ Members: Cannot view
- ✅ Admin/Main: Can view

**Implementation**:
```typescript
// Admin area endpoint (Private Controller)
await productLookupService.list(queryDto, Privilege.ADMIN, hasMembership);
```

---

### Scenario 4: Discontinued Products

**Use Case**: Product no longer available for purchase

**Configuration**:
- Access Modifier: Any (PUBLIC/PROTECTED/PRIVATE)
- Product Status: `DISCONTINUED`

**Access**:
- ❌ Unauthenticated users: Cannot view
- ❌ Members: Cannot view
- ✅ Admin/Main: Can view (for management purposes)

**Implementation**:
```typescript
// Admin management endpoint
await productLookupService.getByStatus(ProductStatus.DISCONTINUED, Privilege.MAIN);
```

---

## ProductLookupService Methods

All methods updated to support Access Modifier-based filtering:

### Individual Product Queries
- `findByProductId(productId, privilege?, hasMembership?, operationId?)`
- `findById(id, privilege?, hasMembership?, operationId?)`
- `findByProductCode(productCode, privilege?, hasMembership?, operationId?)`

### Collection Queries
- `getByCategory(category, privilege?, hasMembership?, operationId?)`
- `getByStatus(status, privilege?, hasMembership?, operationId?)`
- `getLowStockProducts(threshold, privilege?, hasMembership?, operationId?)`
- `searchProducts(query, privilege?, hasMembership?, operationId?)`
- `list(queryDto, privilege?, hasMembership?, operationId?)`
- `count(category?, status?, privilege?, hasMembership?, operationId?)`

### Special Methods
- `getAvailableProducts(operationId?)`: **Landing page** - Returns only PUBLIC + AVAILABLE
- `existsByProductCode(productCode, privilege?, operationId?)`: **Management only** - No Access Modifier filtering

---

## Controller Integration

### ProductPublicController (Landing Page)

**No authentication required**

```typescript
@Get('catalog')
async getPublicCatalog() {
  // Returns only PUBLIC + AVAILABLE products
  return this.productLookupService.getAvailableProducts();
}
```

**Access**:
- No JWT required
- No privilege needed
- No membership check
- Returns: PUBLIC products with AVAILABLE status

---

### ProductPrivateController (Member/Admin Area)

**Requires JWT authentication**

```typescript
@UseGuards(JwtAuthGuard)
@Get(':productId')
async getProduct(
  @Param('productId') productId: string,
  @Request() req,
) {
  const privilege = req.user.privilege; // from JWT
  const hasMembership = req.user.osot_membership; // from JWT

  return this.productLookupService.findByProductId(
    productId,
    privilege,
    hasMembership,
  );
}
```

**Access**:
- Extracts `privilege` from JWT token
- Extracts `hasMembership` from JWT token
- Applies Access Modifier filtering
- Returns product if user has access

---

## Access Rules Summary

| Access Modifier | Product Status | No Auth | Member | Admin/Main |
|----------------|----------------|---------|--------|------------|
| PUBLIC         | AVAILABLE      | ✅       | ✅      | ✅          |
| PUBLIC         | DISCONTINUED   | ❌       | ❌      | ✅          |
| PROTECTED      | AVAILABLE      | ❌       | ✅      | ✅          |
| PROTECTED      | DISCONTINUED   | ❌       | ❌      | ✅          |
| PRIVATE        | AVAILABLE      | ❌       | ❌      | ✅          |
| PRIVATE        | DISCONTINUED   | ❌       | ❌      | ✅          |

**Legend**:
- ✅ = Can view product
- ❌ = Cannot view product

---

## Implementation Files

### Core Logic
- `src/classes/others/product/utils/product-privilege.helper.ts`
  - `canViewProduct()`: Access Modifier validation
  - `canCreateProduct()`, `canReadProduct()`, `canUpdateProduct()`, `canDeleteProduct()`: Privilege validation
  - `getAccessModifierName()`: Human-readable names
  - `getRequiredAccessForViewing()`: Error messages

### Services
- `src/classes/others/product/services/product-crud.service.ts`
  - Uses **Privilege** for management (create/update/delete)
- `src/classes/others/product/services/product-lookup.service.ts`
  - Uses **Access Modifier** for viewing (find/get/search/list)

### Constants
- `src/classes/others/product/constants/product-odata.constant.ts`
  - `ProductAccessModifiers` enum: PUBLIC (0), PROTECTED (1), PRIVATE (2)

---

## Migration from Old Logic

### Before (Broken Logic)
```typescript
// Old dual-check approach
if (!canReadProduct(userPrivilege)) {
  return null; // Blocks public users immediately
}

if (!userPrivilege && product.osot_product_status !== AVAILABLE) {
  return null; // Never reached for public users
}
```

**Problem**: Public users were blocked before checking if product was PUBLIC + AVAILABLE.

### After (Access Modifier Logic)
```typescript
// New integrated approach
if (!this.canAccessProduct(product, userPrivilege, hasMembership)) {
  return null;
}

// Helper method
private canAccessProduct(product, privilege?, hasMembership?): boolean {
  return canViewProduct(
    product.osot_access_modifiers ?? 0,
    product.osot_product_status ?? 0,
    privilege,
    hasMembership,
  );
}
```

**Solution**: Single check considers Access Modifier, product status, privilege, and membership together.

---

## Testing Checklist

### Public Landing Page
- [ ] `getAvailableProducts()` returns only PUBLIC + AVAILABLE products
- [ ] PROTECTED and PRIVATE products are filtered out
- [ ] DISCONTINUED products are filtered out

### Member Area
- [ ] Members can view PROTECTED + AVAILABLE products
- [ ] Members cannot view PRIVATE products
- [ ] Members cannot view DISCONTINUED products

### Admin Area
- [ ] Admin/Main can view all AVAILABLE products (PUBLIC/PROTECTED/PRIVATE)
- [ ] Admin/Main can view DISCONTINUED products for management
- [ ] Regular users cannot access admin-only products

### Edge Cases
- [ ] Product with missing `osot_access_modifiers` defaults to PUBLIC (0)
- [ ] Product with missing `osot_product_status` defaults to 0
- [ ] `existsByProductCode()` works without Access Modifier filtering (management operation)

---

## Error Messages

When access is denied, the helper provides clear error messages:

```typescript
getRequiredAccessForViewing(accessModifier: number): string {
  if (accessModifier === PUBLIC) {
    return 'Product must be AVAILABLE for public access';
  }
  if (accessModifier === PROTECTED) {
    return 'Active membership required';
  }
  if (accessModifier === PRIVATE) {
    return 'Admin or Main privilege required';
  }
  return 'Invalid access modifier';
}
```

---

## Future Enhancements

1. **Access Modifier Groups**: Allow multiple access levels per product
2. **Time-Based Access**: Products available only during specific periods
3. **Quantity-Based Access**: Limited availability for members
4. **Access Logs**: Track who views what products
5. **Dynamic Pricing**: Different prices based on Access Modifier

---

## Conclusion

The two-level access control system provides:
- **Clear separation** between management and viewing rights
- **Flexible product catalog** for public, member, and admin areas
- **Business alignment** with landing page requirements
- **Scalable architecture** for future access control needs

This architecture ensures products can be properly segmented for different audiences while maintaining secure management operations.

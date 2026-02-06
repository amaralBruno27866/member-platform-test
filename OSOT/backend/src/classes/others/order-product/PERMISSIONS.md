# OrderProduct Entity - App Permissions

## Overview
Permissions for `osot_table_order_product` entity across Main, Admin, and Owner apps.

**Architecture Decision:** OrderProduct is an **immutable snapshot** of product details at purchase time (line items).

---

## Permission Matrix

| App | Create | Read | Update | Delete | Justification |
|-----|--------|------|--------|--------|---------------|
| **Main** | ✅ | ✅ | ✅ | ✅ | Full Access - Backend automatically creates line items when Order is created, administrative operations |
| **Admin** | ✅ | ✅ | ✅ | ❌ | Read + Write - View/modify for exceptional cases (corrections), NO DELETE for audit compliance |
| **Owner** | ❌ | ✅ | ❌ | ❌ | Read Only - View own order line items, CANNOT create/modify directly (prevents fraud/tampering) |

---

## Permission Details

### Main App (Full Access)
**Use Cases:**
- **Automatic creation** when Order is created (backend orchestration)
- Create OrderProduct snapshots with product details (productId, productName, selectedPrice, productTaxRate, etc.)
- Update for exceptional administrative corrections
- Soft/hard delete for testing or compliance
- Cascade delete when parent Order is deleted

**Critical Operations:**
```typescript
// When Order is created
const order = await orderService.create(orderDto);
for (const product of orderDto.products) {
  await orderProductService.create({
    orderId: order.osot_table_orderid,
    productId: product.productId,
    productName: product.productName, // Snapshot
    quantity: product.quantity,
    selectedPrice: product.selectedPrice, // Snapshot
    productTaxRate: product.productTaxRate, // Snapshot
    taxAmount: product.taxAmount,
    itemSubtotal: product.itemSubtotal,
    itemTotal: product.itemTotal
  });
}
```

---

### Admin App (Read + Write, NO DELETE)
**Use Cases:**
- View all order line items within the organization
- Correct line items for exceptional cases (pricing errors, refunds)
- Support and troubleshooting

**Restrictions:**
- ❌ Cannot delete order products (audit trail must persist)
- ⚠️ Updates should be rare and logged (snapshots should remain immutable)

---

### Owner App (Read Only)
**Use Cases:**
- View line items of own orders via expansion: `GET /orders/{orderId}?$expand=osot_order_orderproducts`
- See purchase history with product details

**Restrictions:**
- ❌ Cannot CREATE order products directly (only backend creates them)
- ❌ Cannot UPDATE order products (prevents price/tax tampering)
- ❌ Cannot DELETE order products (audit/compliance)

**Security Rationale:**
- **Prevents fraud:** Owner cannot manipulate prices, taxes, or quantities after checkout
- **Immutability:** Snapshots are frozen at purchase time
- **Auditability:** Complete trail of what was sold at what price
- **Compliance:** Required for tax reporting and invoice generation

---

## Business Rules

### Snapshot Immutability
OrderProduct is a **point-in-time snapshot** of product data:
- `productName`: Frozen at purchase (even if product name changes later)
- `selectedPrice`: Price applied at checkout (even if product price changes)
- `productTaxRate`: HST/tax rate at purchase time (8%, 13%, etc.)
- `taxAmount`: Calculated tax at purchase (immutable)

**Why snapshots?**
1. ✅ Historical accuracy for invoices/receipts
2. ✅ Audit compliance (prove exact charges)
3. ✅ Tax reporting (show correct HST applied)
4. ✅ Dispute resolution (show what customer agreed to pay)

### Owner Security
Owner can only read OrderProducts belonging to their own Orders:
```typescript
// Enforced in services
const order = await orderService.findById(orderId);
if (order.accountGuid !== req.user.userGuid) {
  throw createAppError(ErrorCodes.PERMISSION_DENIED, {
    message: 'Cannot access another user\'s order products'
  });
}
```

### Relationship Integrity
- **Lookup Field:** `osot_Order` (required, points to parent Order)
- **Cascade Delete:** Configured in Dataverse - deleting Order deletes all OrderProducts
- **Orphan Prevention:** OrderProduct cannot exist without parent Order

---

## Data Model

### Key Fields
```typescript
{
  osot_table_order_productid: string;       // GUID
  osot_Order: string;                       // Lookup to osot_table_order (required)
  osot_product_id: string;                  // Reference to original product
  osot_product_name: string;                // Snapshot - product name at purchase
  osot_quantity: number;                    // Quantity purchased
  osot_selected_price: number;              // Snapshot - price applied (CAD)
  osot_product_tax_rate: number;            // Snapshot - tax % (8, 13, etc.)
  osot_tax_amount: number;                  // Calculated: selectedPrice * (taxRate/100)
  osot_item_subtotal: number;               // selectedPrice * quantity
  osot_item_total: number;                  // itemSubtotal + taxAmount
}
```

### Example Snapshot
```json
{
  "osot_table_order_productid": "abc-123",
  "osot_Order@odata.bind": "/osot_table_orders(order-guid-456)",
  "osot_product_id": "osot-prod-0000048",
  "osot_product_name": "2025 Professional Liability - $ 5,000 millions",
  "osot_quantity": 1,
  "osot_selected_price": 79,
  "osot_product_tax_rate": 8,
  "osot_tax_amount": 6.32,
  "osot_item_subtotal": 79,
  "osot_item_total": 85.32
}
```

---

## Query Patterns

### Owner Viewing Order with Line Items
```
GET /orders/{orderId}?$expand=osot_order_orderproducts
```

Dataverse returns:
```json
{
  "osot_table_orderid": "order-guid-456",
  "osot_order_number": "ORD-001",
  "subtotal": 100,
  "total": 110,
  "osot_order_orderproducts": [
    { /* OrderProduct 1 */ },
    { /* OrderProduct 2 */ }
  ]
}
```

---

## Related Entities
- **Order** (N:1) - Parent order (required lookup)
- **Product** (reference via `osot_product_id`) - Original product entity (not a formal lookup to preserve immutability)

---

## Future Considerations

### If Implementing Persistent Cart
Even with `Cart` and `CartItem` entities in the future:
- CartItem = mutable (Owner can add/remove)
- OrderProduct = immutable snapshot (created on checkout)
- No architectural changes needed for OrderProduct

### Invoice Generation
OrderProduct snapshots are the source of truth for:
- PDF invoices
- Tax reporting (HST breakdown)
- Receipts emailed to customers
- Accounting integration (GL codes from Product)

---

**Last Updated:** January 22, 2026
**Decision Context:** Immutable snapshots for audit/compliance, Owner read-only to prevent tampering

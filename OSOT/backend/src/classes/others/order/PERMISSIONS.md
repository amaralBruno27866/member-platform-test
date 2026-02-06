# Order Entity - App Permissions

## Overview
Permissions for `osot_table_order` entity across Main, Admin, and Owner apps.

**Architecture Decision:** Carrinho frontend-only (Option 1) - Owner creates Order directly on checkout, no persistent cart backend initially.

---

## Permission Matrix

| App | Create | Read | Update | Delete | Justification |
|-----|--------|------|--------|--------|---------------|
| **Main** | ✅ | ✅ | ✅ | ✅ | Full Access - Administrative operations, background jobs, status updates, soft/hard deletes |
| **Admin** | ✅ | ✅ | ✅ | ❌ | Read + Write - View/modify organization orders for exceptional cases (refunds, corrections), NO DELETE for compliance |
| **Owner** | ✅ | ✅ | ❌ | ❌ | Read + Create - Create orders via checkout, view own order history, NO DIRECT UPDATE/DELETE |

---

## Permission Details

### Main App (Full Access)
**Use Cases:**
- Create orders via backend orchestration
- Update `order_status` and `payment_status` based on payment gateway responses
- Background jobs (order expiration, cleanup)
- Soft delete for compliance/audit trails
- Hard delete for testing/development only
- Convert Order → Transaction after payment

**Critical Operations:**
- Status transitions (`Pending` → `Processing` → `Completed` → `Cancelled`)
- Payment status updates (`Unpaid` → `Paid` → `Refunded`)
- Audit trail management

---

### Admin App (Read + Write, NO DELETE)
**Use Cases:**
- View all orders within the organization
- Manually adjust order status for exceptional cases (customer service)
- Process refunds or corrections
- Support and troubleshooting

**Restrictions:**
- ❌ Cannot delete orders (compliance requirement - audit trail must persist)
- ⚠️ Updates should be logged for audit purposes

---

### Owner App (Read + Create, NO UPDATE/DELETE)
**Use Cases:**
- Create order during checkout: `POST /orders { products: [...] }`
- View own order history: `GET /orders?account={userGuid}`
- View specific order details: `GET /orders/{orderId}`

**Restrictions:**
- ❌ Cannot UPDATE orders directly (status changes handled by backend using Main credentials)
- ❌ Cannot DELETE orders (audit/compliance)
- ⚠️ Order cancellation must go through dedicated endpoint: `POST /orders/{id}/cancel` (backend validates business rules and uses Main credentials)

**Security Enforcement:**
- Business rules filter queries: `$filter=_osot_account_value eq '{userGuid}'`
- Backend validates ownership before any operation
- JWT provides `userGuid` for ownership checks

---

## Business Rules

### Owner Security
Even with Create permission, Owner can only:
- Create orders for their own account (`account = req.user.userGuid`)
- Read orders where `_osot_account_value = req.user.userGuid`
- Cannot access orders from other users

```typescript
// Enforced in services
if (order.accountGuid !== req.user.userGuid) {
  throw createAppError(ErrorCodes.PERMISSION_DENIED, {
    message: 'Cannot access another user\'s order'
  });
}
```

### Status Update Flow
Owner cannot update status directly. Status changes happen via:
1. Payment gateway webhook → Backend updates using **Main credentials**
2. Order cancellation endpoint → Backend validates business rules → Updates using **Main credentials**
3. Admin manual adjustment → Uses **Admin credentials** with audit log

---

## Future Enhancement: Cart Persistence

**Current State:** Carrinho frontend-only (localStorage/state)

**Future Migration (when time allows):**
- Add `Cart` and `CartItem` entities
- Owner gets Full Access on Cart/CartItem (own carts only)
- Endpoint: `POST /orders/checkout` converts Cart → Order
- Enables abandoned cart emails and cross-device persistence

**Migration Impact:** Zero breaking changes - Order entity stays the same, Cart is a pre-order layer

---

## Field-Level Permissions Notes

All apps have access to all fields based on their CRUD permissions. No field-level restrictions needed.

**Sensitive Fields (none in Order):** Order doesn't store payment credentials directly (handled by Transaction entity).

---

## Related Entities
- **OrderProduct** (1:N) - See `order-product/PERMISSIONS.md`
- **Transaction** (1:1) - Payment record for this order
- **Account** (N:1) - Owner of the order
- **Organization** (N:1) - Organization context
- **Affiliate** (N:1) - Optional affiliate relationship

---

**Last Updated:** January 22, 2026
**Decision Context:** Time-constrained delivery, pragmatic approach, future-proof architecture

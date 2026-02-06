# Order Redis Caching Strategy

## Overview

Redis is used in the Order module to optimize performance and manage state during payment workflows. This document outlines the current implementation and future integrations.

---

## 📊 Current Implementation (Phase 1)

### Cache Keys & TTLs

#### 1. **Individual Order Cache**
```
Key: order:{orderId}
Type: OrderInternal
TTL: 300 seconds (5 minutes)
```

**When Set:**
- OrderLookupService.findById() - After fetching from Dataverse
- OrderCrudService.update() - After successful update
- OrderCrudService.create() - After successful creation

**When Invalidated:**
- OrderCrudService.update() - Calls lookupService.invalidateCache(orderId)
- OrderCrudService.delete() - Calls lookupService.invalidateCache(orderId)
- OrderCrudService.hardDelete() - Calls lookupService.invalidateCache(orderId)

**Example:**
```typescript
const cacheKey = `order:${orderId}`;
const cached = await this.cacheService.get<OrderInternal>(cacheKey);

if (cached) {
  return cached; // Cache hit
}

const order = await this.orderRepository.findById(orderId);
await this.cacheService.set(cacheKey, order, 300); // Cache for 5 min
```

---

#### 2. **Orders List Cache**
```
Key: orders:list:{JSON.stringify(filters)}
Type: OrderInternal[]
TTL: 300 seconds (5 minutes)
```

**When Set:**
- OrderLookupService.listOrders() - After querying with filters/pagination

**When Invalidated:**
- OrderCrudService.create() - List may change (new order added)
- OrderCrudService.update() - List may change (order status changed)
- OrderCrudService.delete() - List may change (order removed)

**Example:**
```typescript
const cacheKey = `orders:list:${JSON.stringify(filters)}`;
const cached = await this.cacheService.get<OrderInternal[]>(cacheKey);

if (cached) {
  return cached;
}

const orders = await this.orderRepository.findAll(filters);
await this.cacheService.set(cacheKey, orders, 300);
```

---

#### 3. **Order Statistics Cache**
```
Key: order:stats:{organizationGuid || 'all'}
Type: OrderStatistics
TTL: 300 seconds (5 minutes)
```

**When Set:**
- OrderLookupService.getOrderStatistics() - After aggregating from all orders

**When Invalidated:**
- OrderCrudService.create() - Stats change (new order)
- OrderCrudService.update() - Stats change (status/amount changed)
- OrderCrudService.delete() - Stats change (order removed)

**Aggregated Data:**
- totalOrders: number
- ordersByStatus: Record<OrderStatus, number>
- ordersByPaymentStatus: Record<PaymentStatus, number>
- totalRevenue: number
- averageOrderValue: number

**Example:**
```typescript
const cacheKey = `order:stats:${organizationGuid || 'all'}`;
const cached = await this.cacheService.get<OrderStatistics>(cacheKey);

if (cached) {
  return cached;
}

// Aggregate from orders...
const stats = { totalOrders, ordersByStatus, ... };
await this.cacheService.set(cacheKey, stats, 300);
```

---

## 🔮 Future Implementation (Phase 2 - PayPal Integration)

### Payment Session Cache

Used to maintain state during PayPal redirect flow. Enables recovery from timeouts/failures.

```
Key: order-payment:session:{sessionId}
Type: OrderPaymentSession
TTL: 1800 seconds (30 minutes)
```

**Structure:**
```typescript
interface OrderPaymentSession {
  orderId: string;
  orderTotal: number;
  paymentGateway: 'paypal' | 'stripe' | 'other';
  status: 'awaiting_redirect' | 'awaiting_callback' | 'completed' | 'failed';
  externalTransactionId?: string; // PayPal transaction ID
  webhookData?: Record<string, any>; // Full webhook payload
  createdAt: Date;
  updatedAt: Date;
}
```

**Flow:**
1. User initiates PayPal payment → Create session in Redis
2. User redirected to PayPal → Session state = 'awaiting_callback'
3. PayPal webhook arrives → Update session with transactionId + webhookData
4. Backend validates webhook → Session state = 'completed' → Update Order.paymentStatus
5. Session TTL expires → Clean up

**Example:**
```typescript
// 1. Initiate payment
const sessionId = uuid();
await redisService.set(
  `order-payment:session:${sessionId}`,
  {
    orderId: 'abc-123',
    orderTotal: 199.99,
    paymentGateway: 'paypal',
    status: 'awaiting_redirect',
    externalTransactionId: null,
    webhookData: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  1800 // 30 min TTL
);

// 2. PayPal webhook callback
const session = await redisService.get(`order-payment:session:${sessionId}`);
session.externalTransactionId = webhookData.id;
session.webhookData = webhookData;
session.status = 'completed';
session.updatedAt = new Date();
await redisService.set(`order-payment:session:${sessionId}`, session, 1800);

// 3. Update Order
await orderCrudService.update(session.orderId, {
  osot_payment_status: PaymentStatus.PAID,
  externalTransactionId: webhookData.id,
});
```

---

### Webhook Validation Cache

Optional: Cache webhook data temporarily for deduplication (prevent processing same webhook twice).

```
Key: order-payment:webhook:{externalTransactionId}
Type: { processed: boolean; timestamp: Date }
TTL: 3600 seconds (1 hour)
```

**Use Case:**
```typescript
// Prevent duplicate webhook processing
const webhookKey = `order-payment:webhook:${externalTransactionId}`;
const alreadyProcessed = await redisService.get(webhookKey);

if (alreadyProcessed) {
  return { status: 'already_processed' }; // Idempotent
}

// Process webhook...

await redisService.set(webhookKey, { processed: true, timestamp: new Date() }, 3600);
```

---

## ❌ NOT Required

### Session Orchestration
Order CRUD is simple (no complex multi-step validation workflow). Orchestration sessions would only be needed if:
- Validating products across multiple carts
- Reserving inventory before payment
- Complex approval workflows

**Decision:** Not required for Phase 1. Order is straightforward CRUD.

---

## 🚀 Implementation Timeline

| Phase | Feature | Status | Redis Keys |
|-------|---------|--------|-----------|
| 1 ✅ | Individual/List/Stats cache | Implemented | `order:*`, `orders:list:*`, `order:stats:*` |
| 2 🔮 | PayPal payment sessions | Planned (Q2 2026) | `order-payment:session:*`, `order-payment:webhook:*` |
| 3 🔮 | Transaction entity | Planned (Q2 2026) | `transaction:*` |

---

## 📝 Notes

- All cache keys follow pattern: `{entity}:{type}:{identifier}`
- TTLs are conservative (5 min) to ensure fresh data
- Payment sessions have longer TTL (30 min) to account for user think-time
- Webhook deduplication prevents double-processing during network retries
- Automatic invalidation happens in CRUD service layer
- No manual cache clearing needed (except by TTL expiration)

---

## Related Entities

- **OrderProduct:** Will inherit Order's cache invalidation (child entity)
- **Transaction:** Separate entity with its own redis strategy (future)
- **PaymentSession:** Redis-only (not persisted in Dataverse)

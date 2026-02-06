# Management Events

## Purpose

Contains comprehensive domain events for Management operations with standardized enum integration and centralized error handling. Events provide business workflow triggers, enable asynchronous processing, and support real-time notifications for management-related changes.

## Architecture Decision: Events vs Audit

### 🔄 **Management Events (THIS SERVICE)**

- **Purpose**: Business workflow integration and real-time notifications
- **Focus**: System integration, event sourcing, and business processes
- **Target Audience**: Other services, external systems, workflow engines
- **Data**: Business-relevant information for integration
- **Examples**:
  - Trigger notification when privilege changes
  - Update related systems when user group changes
  - Enable real-time permission synchronization
  - Power analytics and business intelligence

### 📋 **Management Audit Service (SEPARATE)**

- **Purpose**: Compliance, regulatory audit trails, and security monitoring
- **Focus**: Legal compliance, security auditing, and regulatory requirements
- **Target Audience**: Auditors, compliance teams, security monitoring
- **Data**: PII-redacted logs with security classifications
- **Examples**:
  - Compliance reports for regulatory authorities
  - Security event tracking for threat analysis
  - Audit trails for legal requirements
  - PII-protected compliance logs

## Key Distinction

**Events** = Business Integration | **Audit** = Legal Compliance

Both are needed for Management due to its critical security role:

- **Events**: Enable business workflows and system integration
- **Audit**: Ensure compliance and security monitoring

## Available Events

### ManagementEventService

- **Purpose**: Main events service for business workflows and system integration
- **Features**:
  - Management lifecycle event tracking (Created, Updated, Deleted)
  - Privilege and access control change notifications
  - User group management events
  - Bulk operation event aggregation
  - Validation event tracking
  - Business workflow triggers

## Event Types

### Lifecycle Events

- `ManagementCreatedEvent` - New management record creation
- `ManagementUpdatedEvent` - Management record modifications
- `ManagementDeletedEvent` - Management record deletion

### Security Events

- `ManagementPrivilegeChangedEvent` - Privilege level changes
- `ManagementAccessModifierChangedEvent` - Access modifier modifications
- `ManagementUserGroupChangedEvent` - User group assignments

### Operational Events

- `ManagementBulkEvent` - Bulk operation tracking
- `ManagementValidationEvent` - Validation result events

## Standards Compliance

✅ **Centralized Enums**: Uses `AccessModifier`, `Privilege`, `UserGroup` from `/common/enums`
✅ **Error Handling**: Implements centralized error factory patterns
✅ **Type Safety**: Full TypeScript type definitions with proper enum integration
✅ **Business Integration**: Comprehensive event tracking for workflow requirements
✅ **Event Architecture**: Injectable service with structured event emission

## Integration Patterns

### **Event Bus Integration**

```ts
// TODO: Future integration with event bus
// this.eventEmitter.emit('management.created', event);
// this.eventEmitter.emit('management.privilege.changed', event);
```

### **Business Workflow Usage**

```ts
// Retrieve complete event history
const managementEvents =
  await managementEventService.getManagementEventHistory('osot-mgt-0000001');
const accountEvents =
  await managementEventService.getAccountEventHistory('account-uuid');
```

### **Real-time Notifications**

```ts
// Events can trigger real-time workflows
// - Email notifications for privilege changes
// - System updates for access modifier changes
// - Dashboard updates for user group changes
// - External system synchronization
```

## Best Practices

1. **Event Immutability**: Events are immutable records of business state changes
2. **Timestamp Injection**: Service automatically adds timestamps to all events
3. **Enum Consistency**: Always use centralized enums for type safety
4. **Error Context**: Include operation context in error handling
5. **Business Focus**: Events focus on business value and system integration
6. **Workflow Support**: Ensure events support business process requirements
7. **Performance**: Use bulk operations for batch processing scenarios

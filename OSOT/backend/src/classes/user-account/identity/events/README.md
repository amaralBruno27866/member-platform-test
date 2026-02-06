# Identity Events

## Purpose

Contains comprehensive domain events for Identity operations with standardized enum integration and centralized error handling. Events provide audit trails, enable asynchronous processing, and support real-time notifications for identity-related changes.

## Standards Compliance

✅ **Centralized Enums**: Uses `Language`, `Gender`, `Race`, `Privilege`, `IndigenousDetail` from `/common/enums`
✅ **Error Handling**: Implements centralized error factory patterns
✅ **Type Safety**: Full TypeScript type definitions with proper enum integration
✅ **Audit Trail**: Comprehensive event tracking for compliance requirements
✅ **Event Architecture**: Injectable service with structured event emission

## Available Events

### Core Identity Events

- **`IdentityCreatedEvent`** - New identity record created
- **`IdentityUpdatedEvent`** - Identity information modified
- **`IdentityDeletedEvent`** - Identity record removed

### Verification & Compliance Events

- **`IdentityVerifiedEvent`** - Identity verification successful
- **`IdentityVerificationFailedEvent`** - Identity verification failed
- **`IdentityDocumentUploadedEvent`** - Supporting documents uploaded

### Privilege & Access Events

- **`IdentityPrivilegeChangedEvent`** - User privilege level modified
- **`IdentityLanguageChangedEvent`** - Language preferences updated
- **`IdentityDemographicUpdatedEvent`** - Cultural/demographic information changed

## Event Structure

### **Standardized Event Pattern**

```ts
interface BaseIdentityEvent {
  identityId: string;      // Identity record identifier
  accountId: string;       // Associated account identifier
  userBusinessId: string;  // Business user identifier
  timestamp: Date;         // Automatic timestamp injection
  [action]By: string;      // User who performed the action
}
```

### **Enum Integration Examples**

```ts
// ✅ CORRECT: Using centralized enums
interface IdentityCreatedEvent {
  language: Language[]; // Multi-select language array
  privilege: Privilege; // Privilege enum (OWNER/ADMIN/MAIN)
}

interface IdentityDemographicUpdatedEvent {
  demographicFields: {
    gender?: Gender; // Gender enum with privacy options
    race?: Race; // Race enum with inclusivity options
    indigenousDetail?: IndigenousDetail; // Canadian Indigenous classifications
  };
}

// ❌ AVOID: Raw numbers or strings
privilege: number; // Don't use raw numbers
gender: string; // Don't use raw strings
```

## Service Features

### **Event Emission Methods**

```ts
// Core operations
emitIdentityCreated(data: Omit<IdentityCreatedEvent, 'timestamp'>): void
emitIdentityUpdated(data: Omit<IdentityUpdatedEvent, 'timestamp'>): void
emitIdentityDeleted(data: Omit<IdentityDeletedEvent, 'timestamp'>): void

// Verification workflow
emitIdentityVerified(data: Omit<IdentityVerifiedEvent, 'timestamp'>): void
emitVerificationFailed(data: Omit<IdentityVerificationFailedEvent, 'timestamp'>): void

// Privilege and demographic changes
emitPrivilegeChanged(data: Omit<IdentityPrivilegeChangedEvent, 'timestamp'>): void
emitLanguageChanged(data: Omit<IdentityLanguageChangedEvent, 'timestamp'>): void
emitDemographicUpdated(data: Omit<IdentityDemographicUpdatedEvent, 'timestamp'>): void
```

### **Error Handling Integration**

```ts
// Centralized error handling for audit trail retrieval
getIdentityEventHistory(identityId: string): Promise<any[]>
getAccountEventHistory(accountId: string): Promise<any[]>

// Errors use standardized error factory
throw createAppError(ErrorCodes.INTERNAL_ERROR, {
  operation: 'get_identity_event_history',
  identityId,
  error: error.message,
});
```

### **Event Analytics & Monitoring**

```ts
// Event statistics for system monitoring
getEventStats(): {
  eventsEmitted: number;
  lastEventTime: Date;
  eventTypes: Record<string, number>;
}

// Bulk event processing for batch operations
emitBulkEvents(events: Array<{ type: string; data: any }>): void
```

## Usage Examples

### **Identity Creation Event**

```ts
// Service usage
identityEventService.emitIdentityCreated({
  identityId: 'osot-id-0000001',
  accountId: 'account-uuid',
  userBusinessId: 'user-123',
  language: [Language.ENGLISH, Language.FRENCH],
  privilege: Privilege.OWNER,
  createdBy: 'system',
});
```

### **Privilege Change Event**

```ts
// Privilege elevation tracking
identityEventService.emitPrivilegeChanged({
  identityId: 'osot-id-0000001',
  accountId: 'account-uuid',
  userBusinessId: 'user-123',
  previousPrivilege: Privilege.MAIN,
  newPrivilege: Privilege.ADMIN,
  changedBy: 'admin-user',
  reason: 'Promoted to department head',
});
```

### **Demographic Update Event**

```ts
// Cultural information changes
identityEventService.emitDemographicUpdated({
  identityId: 'osot-id-0000001',
  accountId: 'account-uuid',
  userBusinessId: 'user-123',
  demographicFields: {
    race: Race.INDIGENOUS,
    indigenousDetail: IndigenousDetail.FIRST_NATIONS,
    disability: false,
  },
  updatedBy: 'user-self',
});
```

## Integration Patterns

### **Event Bus Integration**

```ts
// TODO: Future integration with event bus
// this.eventEmitter.emit('identity.created', event);
// this.eventEmitter.emit('identity.privilege.changed', event);
```

### **Audit Trail Usage**

```ts
// Retrieve complete audit history
const identityEvents =
  await identityEventService.getIdentityEventHistory('osot-id-0000001');
const accountEvents =
  await identityEventService.getAccountEventHistory('account-uuid');
```

### **Real-time Notifications**

```ts
// Events can trigger real-time notifications
// - Email notifications for privilege changes
// - SMS alerts for verification failures
// - Dashboard updates for demographic changes
```

## Best Practices

1. **Event Immutability**: Events are immutable records of what happened
2. **Timestamp Injection**: Service automatically adds timestamps to all events
3. **Enum Consistency**: Always use centralized enums for type safety
4. **Error Context**: Include operation context in error handling
5. **Privacy Compliance**: Respect user privacy settings in event data
6. **Audit Requirements**: Ensure events support regulatory compliance needs
7. **Performance**: Use bulk operations for batch processing scenarios

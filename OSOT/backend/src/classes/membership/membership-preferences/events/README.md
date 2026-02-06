# Membership Preferences Events

## Purpose

Contains domain events for membership preferences operations. Events are emitted by services when significant changes occur and can be used for:
- Asynchronous processing
- Event-driven workflows
- Audit logging
- Real-time notifications
- Analytics and reporting

## Event Architecture

All events extend `MembershipPreferenceBaseEvent` which provides:
- `preferenceId`: GUID of the preference
- `operationId`: Unique identifier for the operation
- `userId`: User who triggered the event (optional)
- `userPrivilege`: User's privilege level (optional)
- `timestamp`: When the event occurred

## Events

### 1. MembershipPreferenceCreatedEvent

Emitted when a new membership preference is created.

**Fields:**
- `membershipYear`: Year of the membership
- `accountId`: Account GUID (if preference is for account)
- `affiliateId`: Affiliate GUID (if preference is for affiliate)
- `categoryId`: Category GUID (optional)
- `autoRenewal`: Auto-renewal setting (optional)

**Usage:**
```typescript
this.eventEmitter.emit(
  'membership-preference.created',
  new MembershipPreferenceCreatedEvent(
    preferenceId,
    operationId,
    '2025',
    accountId,
    undefined,
    categoryId,
    true,
    userId,
    userPrivilege,
  ),
);
```

**Use Cases:**
- Trigger welcome email with preference summary
- Create audit log entry
- Update user dashboard
- Initialize related entities

---

### 2. MembershipPreferenceUpdatedEvent

Emitted when an existing preference is updated.

**Fields:**
- `previousValues`: Object with old values
- `newValues`: Object with updated values
- `membershipYear`: Year of the membership

**Usage:**
```typescript
this.eventEmitter.emit(
  'membership-preference.updated',
  new MembershipPreferenceUpdatedEvent(
    preferenceId,
    operationId,
    { autoRenewal: false, thirdParties: 0 },
    { autoRenewal: true, thirdParties: 1 },
    '2025',
    userId,
    userPrivilege,
  ),
);
```

**Use Cases:**
- Track preference changes over time
- Send notification of changes to user
- Sync with external systems
- Analytics on preference patterns

---

### 3. MembershipPreferenceDeletedEvent

Emitted when a preference is permanently deleted (hard delete).

**Fields:**
- `membershipYear`: Year of the deleted preference
- `accountId`: Account GUID (if applicable)
- `affiliateId`: Affiliate GUID (if applicable)

**Usage:**
```typescript
this.eventEmitter.emit(
  'membership-preference.deleted',
  new MembershipPreferenceDeletedEvent(
    preferenceId,
    operationId,
    '2025',
    accountId,
    undefined,
    userId,
    userPrivilege,
  ),
);
```

**Use Cases:**
- Cleanup related data
- Send cancellation confirmation
- Archive preference data
- Update statistics

**⚠️ Important:** Unlike membership-settings (soft delete), preferences use hard delete. This event is the last chance to capture data before permanent deletion.

---

### 4. MembershipPreferenceAutoRenewalChangedEvent

Emitted when auto-renewal setting changes (critical for renewal workflows).

**Fields:**
- `previousAutoRenewal`: Old auto-renewal value
- `newAutoRenewal`: New auto-renewal value
- `membershipYear`: Year of the preference
- `accountId`: Account GUID (if applicable)
- `affiliateId`: Affiliate GUID (if applicable)

**Usage:**
```typescript
this.eventEmitter.emit(
  'membership-preference.auto-renewal-changed',
  new MembershipPreferenceAutoRenewalChangedEvent(
    preferenceId,
    operationId,
    false,
    true,
    '2025',
    accountId,
    undefined,
    userId,
    userPrivilege,
  ),
);
```

**Use Cases:**
- Schedule/cancel auto-renewal jobs
- Send confirmation email
- Update payment processor settings
- Track renewal opt-in/opt-out rates

**Business Impact:** This event directly affects annual renewal workflows and payment processing.

---

### 5. MembershipPreferenceUserYearDuplicateEvent

Emitted when attempting to create a duplicate preference for user+year combination (validation failure).

**Fields:**
- `membershipYear`: Year of attempted duplicate
- `accountId`: Account GUID (if applicable)
- `affiliateId`: Affiliate GUID (if applicable)
- `existingPreferenceId`: ID of the existing preference

**Usage:**
```typescript
this.eventEmitter.emit(
  'membership-preference.duplicate-detected',
  new MembershipPreferenceUserYearDuplicateEvent(
    attemptedPreferenceId,
    operationId,
    '2025',
    accountId,
    undefined,
    existingPreferenceId,
    userId,
    userPrivilege,
  ),
);
```

**Use Cases:**
- Security monitoring (duplicate creation attempts)
- User education (inform about existing preference)
- Analytics on validation failures
- Detect potential bugs in client code

**⚠️ Note:** This event is for auditing only. The operation will fail with validation error.

---

## Integration

### Event Emitter (NestJS)

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MembershipPreferenceCrudService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async createPreference(data: CreateDto) {
    const preference = await this.repository.create(data);
    
    // Emit event
    this.eventEmitter.emit(
      'membership-preference.created',
      new MembershipPreferenceCreatedEvent(
        preference.preferenceId,
        generateOperationId(),
        preference.membershipYear,
        preference.tableAccount,
        preference.tableAccountAffiliate,
        preference.tableMembershipCategory,
        preference.autoRenewal,
      ),
    );
    
    return preference;
  }
}
```

### Event Listeners

```typescript
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class MembershipPreferenceEventHandler {
  @OnEvent('membership-preference.created')
  async handlePreferenceCreated(event: MembershipPreferenceCreatedEvent) {
    // Send welcome email
    await this.emailService.sendPreferenceConfirmation({
      preferenceId: event.preferenceId,
      year: event.membershipYear,
    });
    
    // Log to audit trail
    await this.auditService.log({
      action: 'PREFERENCE_CREATED',
      entityId: event.preferenceId,
      userId: event.userId,
      timestamp: event.timestamp,
    });
  }

  @OnEvent('membership-preference.auto-renewal-changed')
  async handleAutoRenewalChanged(event: MembershipPreferenceAutoRenewalChangedEvent) {
    if (event.newAutoRenewal) {
      // Schedule renewal job
      await this.schedulerService.scheduleRenewal(event.preferenceId);
    } else {
      // Cancel renewal job
      await this.schedulerService.cancelRenewal(event.preferenceId);
    }
  }

  @OnEvent('membership-preference.deleted')
  async handlePreferenceDeleted(event: MembershipPreferenceDeletedEvent) {
    // Archive data before permanent deletion
    await this.archiveService.archivePreference({
      preferenceId: event.preferenceId,
      year: event.membershipYear,
      deletedAt: event.timestamp,
    });
  }
}
```

## Event Naming Convention

Format: `membership-preference.{action}`

- `membership-preference.created`
- `membership-preference.updated`
- `membership-preference.deleted`
- `membership-preference.auto-renewal-changed`
- `membership-preference.duplicate-detected`

## Best Practices

1. **Always emit events** - Even for simple operations, events provide valuable audit trail
2. **Include operation ID** - Use unique ID for tracing operations across systems
3. **Capture user context** - Include userId and privilege when available
4. **Handle async failures** - Event listeners should not block main operation
5. **Log event emissions** - Track when events are emitted for debugging
6. **Version events** - Consider adding version field for future compatibility

## Event Flow Example

```
User creates preference
    ↓
Service validates data
    ↓
Repository saves to Dataverse
    ↓
Service emits MembershipPreferenceCreatedEvent
    ↓
    ├─→ Email handler sends confirmation
    ├─→ Audit handler logs to database
    ├─→ Analytics handler updates metrics
    └─→ Integration handler syncs to external system
```

## Related Files

- **Events**: `membership-preference.events.ts`
- **Services**: `services/membership-preference-crud.service.ts`
- **Event Handlers**: (to be implemented in application layer)

---

**Last Updated**: 2025-01-XX  
**Total Events**: 5 (Created, Updated, Deleted, AutoRenewalChanged, UserYearDuplicate)

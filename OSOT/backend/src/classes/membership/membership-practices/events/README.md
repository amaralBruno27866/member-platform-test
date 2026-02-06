# Membership Practices Events

## Purpose

Contains domain events for membership practices operations. Events are emitted by services when significant changes occur and can be used for:

- Asynchronous processing
- Event-driven workflows
- Audit logging
- Real-time notifications
- Analytics and reporting
- Practice demographics and services tracking

## Event Architecture

All events include core fields:

- `practiceId`: GUID of the practice record
- `operationId`: Unique identifier for the operation
- `membershipYear`: Year of the membership
- `userId`: User who triggered the event (optional)
- `userPrivilege`: User's privilege level (optional)
- `timestamp`: When the event occurred

## Events

### 1. MembershipPracticesCreatedEvent

Emitted when a new membership practice is created.

**Fields:**

- `practiceId`: GUID of the practice
- `operationId`: Unique identifier for the operation
- `membershipYear`: Year of the membership
- `accountId`: Account GUID (optional - practices can exist without account)
- `clientsAge`: Comma-separated string of client age groups (business required, e.g., "1,2,3")
- `practiceArea`: Comma-separated string of practice areas (optional, e.g., "1,5,10")
- `practiceSettings`: Comma-separated string of practice settings (optional, e.g., "1,2")
- `practiceServices`: Comma-separated string of practice services (optional, e.g., "1,3,5")
- `practiceSettingsOther`: Text description when OTHER selected in practice settings (optional)
- `practiceServicesOther`: Text description when OTHER selected in practice services (optional)
- `preceptorDeclaration`: Boolean indicating preceptor status (optional)
- `userId`: User who created the record (optional)
- `userPrivilege`: User's privilege level (optional)
- `registrationSource`: Source of registration (web, api, admin, etc.)
- `timestamp`: When the event occurred

**Usage:**

```typescript
this.eventsService.publishPracticesCreated({
  practiceId: result.osot_membership_practicesid,
  operationId: this.generateOperationId(),
  membershipYear: result.osot_membership_year,
  accountId: result.osot_table_account,
  clientsAge: result.osot_clients_age, // "1,2,3"
  practiceArea: result.osot_practice_area, // "1,5,10"
  practiceSettings: result.osot_practice_settings, // "1,2"
  practiceServices: result.osot_practice_services, // "1,3,5"
  practiceSettingsOther: result.osot_practice_settings_other,
  practiceServicesOther: result.osot_practice_services_other,
  preceptorDeclaration: result.osot_preceptor_declaration,
  userId: extractedUserId,
  userPrivilege: privilege,
  registrationSource: 'web',
  timestamp: new Date(),
});
```

**Use Cases:**

- Trigger welcome email with practice summary
- Create audit log entry
- Update user dashboard
- Initialize practice demographics analytics
- Notify admin of new practice registration
- Track preceptor declarations

---

### 2. MembershipPracticesUpdatedEvent

Emitted when an existing practice is updated.

**Fields:**

- `practiceId`: GUID of the practice
- `operationId`: Unique identifier for the operation
- `membershipYear`: Year of the membership
- `changes`: Object with `old` and `new` values
- `updateReason`: Reason for update (user_request, admin_action, system_update, practice_expansion)
- `updatedBy`: User who updated the record
- `userPrivilege`: User's privilege level (optional)
- `timestamp`: When the event occurred

**Usage:**

```typescript
this.eventsService.publishPracticesUpdated({
  practiceId: practiceId,
  operationId: this.generateOperationId(),
  membershipYear: currentPractice.osot_membership_year,
  changes: {
    old: { clientsAge: '1,2', practiceArea: '1' },
    new: { clientsAge: '1,2,3', practiceArea: '1,5' },
  },
  updateReason: 'practice_expansion',
  updatedBy: userId,
  userPrivilege: privilege,
  timestamp: new Date(),
});
```

**Use Cases:**

- Track practice changes over time
- Send notification of changes to user
- Sync with external systems
- Analytics on practice expansion patterns
- Compliance tracking for practice data
- Monitor preceptor status changes

---

### 3. MembershipPracticesDeletedEvent

Emitted when a practice is permanently deleted (hard delete).

**Fields:**

- `practiceId`: GUID of the practice
- `operationId`: Unique identifier for the operation
- `membershipYear`: Year of the deleted practice
- `accountId`: Account GUID (if applicable)
- `clientsAge`: Comma-separated string of client age groups (optional)
- `practiceArea`: Comma-separated string of practice areas (optional)
- `deletionReason`: Reason for deletion (user_request, admin_action, year_change, duplicate_cleanup, data_correction)
- `deletedBy`: User who deleted the record
- `userPrivilege`: User's privilege level (optional)
- `timestamp`: When the event occurred

**Usage:**

```typescript
this.eventsService.publishPracticesDeleted({
  practiceId: practice.osot_membership_practicesid,
  operationId: this.generateOperationId(),
  membershipYear: practice.osot_membership_year,
  accountId: practice.osot_table_account,
  clientsAge: practice.osot_clients_age,
  practiceArea: practice.osot_practice_area,
  deletionReason: 'admin_action',
  deletedBy: userId,
  userPrivilege: privilege,
  timestamp: new Date(),
});
```

**Use Cases:**

- Create audit trail for deletions
- Trigger cleanup of related data
- Send confirmation email to user
- Analytics on deletion patterns
- Compliance tracking
- Monitor practice data quality

---

### 4. MembershipPracticesClientsAgeRequiredEvent

Emitted when validation fails due to missing or empty clients_age array (business required field).

**Fields:**

- `practiceId`: The ID that was attempted
- `operationId`: Unique identifier for the operation
- `membershipYear`: Year of the membership
- `accountId`: Account GUID (if applicable)
- `attemptedBy`: User who attempted the operation (optional)
- `ipAddress`: IP address of the request (optional)
- `timestamp`: When the event occurred

**Usage:**

```typescript
this.eventsService.publishClientsAgeRequired({
  practiceId: dto.osot_membership_practicesid || this.generateGuid(),
  operationId: this.generateOperationId(),
  membershipYear: dto.osot_membership_year,
  accountId: dto.osot_table_account,
  attemptedBy: userId,
  ipAddress: request.ip,
  timestamp: new Date(),
});
```

**Use Cases:**

- Security monitoring for suspicious activity
- Audit trail for failed validations
- Alert admin of potential data quality issues
- Analytics on validation failures
- User education on required fields

---

### 5. MembershipPracticesUserYearDuplicateEvent

Emitted when validation fails due to user-year uniqueness constraint violation.

**Fields:**

- `practiceId`: The ID that was attempted
- `operationId`: Unique identifier for the operation
- `membershipYear`: Year of the membership
- `accountId`: Account GUID (if applicable)
- `existingPracticeId`: The existing practice that caused conflict (optional)
- `attemptedBy`: User who attempted the operation (optional)
- `ipAddress`: IP address of the request (optional)
- `timestamp`: When the event occurred

**Usage:**

```typescript
this.eventsService.publishUserYearDuplicate({
  practiceId: dto.osot_membership_practicesid || this.generateGuid(),
  operationId: this.generateOperationId(),
  membershipYear: dto.osot_membership_year,
  accountId: dto.osot_table_account,
  existingPracticeId: existingPractice.osot_membership_practicesid,
  attemptedBy: userId,
  ipAddress: request.ip,
  timestamp: new Date(),
});
```

**Use Cases:**

- Security monitoring for duplicate attempts
- Audit trail for failed validations
- Alert user of existing practice record
- Analytics on duplicate detection patterns
- Prevent data inconsistency

---

## Event Service

### MembershipPracticesEventsService

Injectable service that handles event publishing with structured logging.

**Methods:**

- `publishPracticesCreated(event: MembershipPracticesCreatedEvent): void`
- `publishPracticesUpdated(event: MembershipPracticesUpdatedEvent): void`
- `publishPracticesDeleted(event: MembershipPracticesDeletedEvent): void`
- `publishClientsAgeRequired(event: MembershipPracticesClientsAgeRequiredEvent): void`
- `publishUserYearDuplicate(event: MembershipPracticesUserYearDuplicateEvent): void`
- `getEventStats(): { eventsEmitted: number; lastEventTime: Date; eventTypes: Record<string, number> }`
- `getPracticeEventHistory(practiceId: string): Promise<any[]>`
- `getUserPracticesHistory(accountId: string): Promise<any[]>`

**Current Implementation:**

- Phase 1: Structured logging only (current)
- All events are logged with comprehensive context
- Errors in event publishing do not break main flow
- Logs include operation context for audit trails

**Future Integration:**

- Phase 2: NestJS EventEmitter2 integration
- Phase 3: PostgreSQL event sourcing
- Phase 4: CQRS (Read/Write model separation)
- Phase 5: Distributed events (RabbitMQ/Kafka)

---

## Integration with Services

### CRUD Service

The CRUD service should emit events after successful operations:

```typescript
// After successful create
this.eventsService.publishPracticesCreated({
  practiceId: result.osot_membership_practicesid,
  operationId: this.generateOperationId(),
  membershipYear: result.osot_membership_year,
  accountId: result.osot_table_account,
  clientsAge: result.osot_clients_age,
  practiceArea: result.osot_practice_area,
  practiceSettings: result.osot_practice_settings,
  practiceServices: result.osot_practice_services,
  practiceSettingsOther: result.osot_practice_settings_other,
  practiceServicesOther: result.osot_practice_services_other,
  preceptorDeclaration: result.osot_preceptor_declaration,
  userId: extractedUserId,
  userPrivilege: privilege,
  timestamp: new Date(),
});

// After successful update
this.eventsService.publishPracticesUpdated({
  practiceId: practiceId,
  operationId: this.generateOperationId(),
  membershipYear: currentPractice.osot_membership_year,
  changes: { old: oldValues, new: newValues },
  updateReason: 'user_request',
  updatedBy: userId,
  userPrivilege: privilege,
  timestamp: new Date(),
});

// After successful delete
this.eventsService.publishPracticesDeleted({
  practiceId: practice.osot_membership_practicesid,
  operationId: this.generateOperationId(),
  membershipYear: practice.osot_membership_year,
  accountId: practice.osot_table_account,
  clientsAge: practice.osot_clients_age,
  practiceArea: practice.osot_practice_area,
  deletionReason: 'user_request',
  deletedBy: userId,
  userPrivilege: privilege,
  timestamp: new Date(),
});
```

### Business Rules Service

The Business Rules service should emit validation events:

```typescript
// On clients_age required validation failure
this.eventsService.publishClientsAgeRequired({
  practiceId: dto.osot_membership_practicesid || this.generateGuid(),
  operationId: this.generateOperationId(),
  membershipYear: dto.osot_membership_year,
  accountId: dto.osot_table_account,
  attemptedBy: userId,
  timestamp: new Date(),
});

// On user-year uniqueness validation failure
this.eventsService.publishUserYearDuplicate({
  practiceId: dto.osot_membership_practicesid || this.generateGuid(),
  operationId: this.generateOperationId(),
  membershipYear: dto.osot_membership_year,
  accountId: dto.osot_table_account,
  existingPracticeId: existingPractice.osot_membership_practicesid,
  attemptedBy: userId,
  timestamp: new Date(),
});
```

---

## Best Practices

1. **Always emit events after successful operations** - Don't emit before operation completes
2. **Include comprehensive context** - More data is better for audit trails
3. **Don't throw errors** - Events should not break the main flow
4. **Use operation IDs** - Correlate events across distributed systems
5. **Log all events** - Even validation failures should be logged
6. **Include user context** - Who did what, when, and why
7. **Use structured logging** - Makes searching and filtering easier
8. **Track business reasons** - updateReason, deletionReason, etc.
9. **Future-proof** - Design events for event sourcing from day one
10. **Monitor events** - Track event statistics for system health

---

## Security Considerations

- Never log sensitive data (passwords, tokens, etc.)
- Include IP addresses for security monitoring
- Track failed validations for abuse detection
- Use privilege levels for audit trails
- Log all deletion operations
- Monitor duplicate detection patterns
- Alert on suspicious activity patterns
- Track preceptor declarations for compliance

---

## Key Differences from Employment Events

| Feature                     | Employment Events                 | Practices Events                                                 |
| --------------------------- | --------------------------------- | ---------------------------------------------------------------- |
| **Main Entity**             | Employment record                 | Practice record                                                  |
| **User Types**              | Account XOR Affiliate             | Account only (optional)                                          |
| **XOR Conflict Event**      | ✅ Yes (AccountAffiliateConflict) | ❌ No                                                            |
| **Business Required Event** | ❌ No special event               | ✅ Yes (ClientsAgeRequired)                                      |
| **Multi-Select Fields**     | 2 (funding, benefits)             | 4 (clientsAge, practiceArea, practiceSettings, practiceServices) |
| **Conditional Fields**      | 3 "\_Other" fields                | 2 "\_Other" fields                                               |
| **Demographics**            | Employment status, role           | Clients age, practice areas                                      |
| **Uniqueness**              | Always enforced                   | Only if account provided                                         |

---

## Testing

When testing services that emit events:

```typescript
// Mock the events service
const mockEventsService = {
  publishPracticesCreated: jest.fn(),
  publishPracticesUpdated: jest.fn(),
  publishPracticesDeleted: jest.fn(),
  publishClientsAgeRequired: jest.fn(),
  publishUserYearDuplicate: jest.fn(),
};

// Verify events are emitted
expect(mockEventsService.publishPracticesCreated).toHaveBeenCalledWith(
  expect.objectContaining({
    practiceId: expect.any(String),
    membershipYear: '2026',
    clientsAge: expect.any(String),
  }),
);

// Verify clients_age is comma-separated string
expect(mockEventsService.publishPracticesCreated).toHaveBeenCalledWith(
  expect.objectContaining({
    clientsAge: '1,2,3', // INFANT, CHILD, YOUTH
  }),
);
```

---

## Next Steps

After implementing events:

1. **Update CRUD Service** - Add event emissions after operations
2. **Update Business Rules Service** - Add validation event emissions
3. **Create Controller** - Implement private controller with /me endpoints
4. **Create Module** - Wire up all components
5. **Integration Testing** - Verify events are emitted correctly
6. **Event Sourcing** - Plan for future event store integration

---

**Last Updated:** 27 November 2025  
**Status:** Events service implemented, ready for integration with CRUD and Business Rules services

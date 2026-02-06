# Membership Employment Events

## Purpose

Contains domain events for membership employment operations. Events are emitted by services when significant changes occur and can be used for:
- Asynchronous processing
- Event-driven workflows
- Audit logging
- Real-time notifications
- Analytics and reporting
- Career progression tracking

## Event Architecture

All events include core fields:
- `employmentId`: GUID of the employment record
- `operationId`: Unique identifier for the operation
- `membershipYear`: Year of the membership
- `userId`: User who triggered the event (optional)
- `userPrivilege`: User's privilege level (optional)
- `timestamp`: When the event occurred

## Events

### 1. MembershipEmploymentCreatedEvent

Emitted when a new membership employment is created.

**Fields:**
- `employmentId`: GUID of the employment
- `operationId`: Unique identifier for the operation
- `membershipYear`: Year of the membership
- `accountId`: Account GUID (if employment is for account)
- `affiliateId`: Affiliate GUID (if employment is for affiliate)
- `employmentStatus`: Employment status (EMPLOYEE, SELF_EMPLOYED, etc.)
- `roleDescriptor`: Role descriptor (PSYCHOTHERAPIST, SUPERVISOR, etc.)
- `organizationName`: Name of the organization (optional)
- `practiceYears`: Years of practice (optional)
- `workHours`: Work hours per week (optional)
- `hourlyEarnings`: Hourly earnings range (optional)
- `funding`: Funding type (optional)
- `benefits`: Benefits type (optional)
- `userId`: User who created the record (optional)
- `userPrivilege`: User's privilege level (optional)
- `registrationSource`: Source of registration (web, api, admin, etc.)
- `timestamp`: When the event occurred

**Usage:**
```typescript
this.eventsService.publishEmploymentCreated({
  employmentId: result.osot_membership_employmentid,
  operationId: this.generateOperationId(),
  membershipYear: result.osot_membership_year,
  accountId: result.osot_table_account,
  affiliateId: result.osot_table_account_affiliate,
  employmentStatus: result.osot_employment_status,
  roleDescriptor: result.osot_role_descriptor,
  organizationName: result.osot_organization_name,
  practiceYears: result.osot_practice_years,
  workHours: result.osot_work_hours,
  hourlyEarnings: result.osot_hourly_earnings,
  funding: result.osot_funding,
  benefits: result.osot_benefits,
  userId: extractedUserId,
  userPrivilege: privilege,
  registrationSource: 'web',
  timestamp: new Date(),
});
```

**Use Cases:**
- Trigger welcome email with employment summary
- Create audit log entry
- Update user dashboard
- Initialize career progression analytics
- Notify admin of new employment registration

---

### 2. MembershipEmploymentUpdatedEvent

Emitted when an existing employment is updated.

**Fields:**
- `employmentId`: GUID of the employment
- `operationId`: Unique identifier for the operation
- `membershipYear`: Year of the membership
- `changes`: Object with `old` and `new` values
- `updateReason`: Reason for update (user_request, admin_action, system_update, career_progression)
- `updatedBy`: User who updated the record
- `userPrivilege`: User's privilege level (optional)
- `timestamp`: When the event occurred

**Usage:**
```typescript
this.eventsService.publishEmploymentUpdated({
  employmentId: employmentId,
  operationId: this.generateOperationId(),
  membershipYear: currentEmployment.osot_membership_year,
  changes: {
    old: { employmentStatus: 'EMPLOYEE', workHours: 'FULL_TIME' },
    new: { employmentStatus: 'SELF_EMPLOYED', workHours: 'PART_TIME' },
  },
  updateReason: 'career_progression',
  updatedBy: userId,
  userPrivilege: privilege,
  timestamp: new Date(),
});
```

**Use Cases:**
- Track employment changes over time
- Send notification of changes to user
- Sync with external systems
- Analytics on career progression patterns
- Compliance tracking for employment data

---

### 3. MembershipEmploymentDeletedEvent

Emitted when an employment is permanently deleted (hard delete).

**Fields:**
- `employmentId`: GUID of the employment
- `operationId`: Unique identifier for the operation
- `membershipYear`: Year of the deleted employment
- `accountId`: Account GUID (if applicable)
- `affiliateId`: Affiliate GUID (if applicable)
- `employmentStatus`: Employment status (optional)
- `organizationName`: Name of the organization (optional)
- `deletionReason`: Reason for deletion (user_request, admin_action, year_change, duplicate_cleanup, data_correction)
- `deletedBy`: User who deleted the record
- `userPrivilege`: User's privilege level (optional)
- `timestamp`: When the event occurred

**Usage:**
```typescript
this.eventsService.publishEmploymentDeleted({
  employmentId: employment.osot_membership_employmentid,
  operationId: this.generateOperationId(),
  membershipYear: employment.osot_membership_year,
  accountId: employment.osot_table_account,
  affiliateId: employment.osot_table_account_affiliate,
  employmentStatus: employment.osot_employment_status,
  organizationName: employment.osot_organization_name,
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

---

### 4. MembershipEmploymentAccountAffiliateConflictEvent

Emitted when validation fails due to both Account and Affiliate being provided (XOR violation).

**Fields:**
- `employmentId`: The ID that was attempted
- `operationId`: Unique identifier for the operation
- `membershipYear`: Year of the membership
- `accountId`: Account GUID (if provided)
- `affiliateId`: Affiliate GUID (if provided)
- `attemptedBy`: User who attempted the operation (optional)
- `ipAddress`: IP address of the request (optional)
- `timestamp`: When the event occurred

**Usage:**
```typescript
this.eventsService.publishAccountAffiliateConflict({
  employmentId: dto.osot_membership_employmentid || this.generateGuid(),
  operationId: this.generateOperationId(),
  membershipYear: dto.osot_membership_year,
  accountId: dto.osot_table_account,
  affiliateId: dto.osot_table_account_affiliate,
  attemptedBy: userId,
  ipAddress: request.ip,
  timestamp: new Date(),
});
```

**Use Cases:**
- Security monitoring for suspicious activity
- Audit trail for failed validations
- Alert admin of potential data quality issues
- Analytics on XOR validation failures

---

### 5. MembershipEmploymentUserYearDuplicateEvent

Emitted when validation fails due to user-year uniqueness constraint violation.

**Fields:**
- `employmentId`: The ID that was attempted
- `operationId`: Unique identifier for the operation
- `membershipYear`: Year of the membership
- `accountId`: Account GUID (if applicable)
- `affiliateId`: Affiliate GUID (if applicable)
- `existingEmploymentId`: The existing employment that caused conflict (optional)
- `attemptedBy`: User who attempted the operation (optional)
- `ipAddress`: IP address of the request (optional)
- `timestamp`: When the event occurred

**Usage:**
```typescript
this.eventsService.publishUserYearDuplicate({
  employmentId: dto.osot_membership_employmentid || this.generateGuid(),
  operationId: this.generateOperationId(),
  membershipYear: dto.osot_membership_year,
  accountId: dto.osot_table_account,
  affiliateId: dto.osot_table_account_affiliate,
  existingEmploymentId: existingEmployment.osot_membership_employmentid,
  attemptedBy: userId,
  ipAddress: request.ip,
  timestamp: new Date(),
});
```

**Use Cases:**
- Security monitoring for duplicate attempts
- Audit trail for failed validations
- Alert user of existing employment record
- Analytics on duplicate detection patterns

---

## Event Service

### MembershipEmploymentEventsService

Injectable service that handles event publishing with structured logging.

**Methods:**
- `publishEmploymentCreated(event: MembershipEmploymentCreatedEvent): void`
- `publishEmploymentUpdated(event: MembershipEmploymentUpdatedEvent): void`
- `publishEmploymentDeleted(event: MembershipEmploymentDeletedEvent): void`
- `publishAccountAffiliateConflict(event: MembershipEmploymentAccountAffiliateConflictEvent): void`
- `publishUserYearDuplicate(event: MembershipEmploymentUserYearDuplicateEvent): void`
- `getEventStats(): { eventsEmitted: number; lastEventTime: Date; eventTypes: Record<string, number> }`
- `getEmploymentEventHistory(employmentId: string): Promise<any[]>`
- `getUserEmploymentHistory(userId: string, userType: 'account' | 'affiliate'): Promise<any[]>`

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
this.eventsService.publishEmploymentCreated({
  employmentId: result.osot_membership_employmentid,
  operationId: this.generateOperationId(),
  membershipYear: result.osot_membership_year,
  accountId: result.osot_table_account,
  affiliateId: result.osot_table_account_affiliate,
  employmentStatus: result.osot_employment_status,
  roleDescriptor: result.osot_role_descriptor,
  organizationName: result.osot_organization_name,
  userId: extractedUserId,
  userPrivilege: privilege,
  timestamp: new Date(),
});

// After successful update
this.eventsService.publishEmploymentUpdated({
  employmentId: employmentId,
  operationId: this.generateOperationId(),
  membershipYear: currentEmployment.osot_membership_year,
  changes: { old: oldValues, new: newValues },
  updateReason: 'user_request',
  updatedBy: userId,
  userPrivilege: privilege,
  timestamp: new Date(),
});

// After successful delete
this.eventsService.publishEmploymentDeleted({
  employmentId: employment.osot_membership_employmentid,
  operationId: this.generateOperationId(),
  membershipYear: employment.osot_membership_year,
  accountId: employment.osot_table_account,
  affiliateId: employment.osot_table_account_affiliate,
  deletionReason: 'user_request',
  deletedBy: userId,
  userPrivilege: privilege,
  timestamp: new Date(),
});
```

### Business Rules Service

The Business Rules service should emit validation events:

```typescript
// On XOR validation failure
this.eventsService.publishAccountAffiliateConflict({
  employmentId: dto.osot_membership_employmentid || this.generateGuid(),
  operationId: this.generateOperationId(),
  membershipYear: dto.osot_membership_year,
  accountId: dto.osot_table_account,
  affiliateId: dto.osot_table_account_affiliate,
  attemptedBy: userId,
  timestamp: new Date(),
});

// On user-year uniqueness validation failure
this.eventsService.publishUserYearDuplicate({
  employmentId: dto.osot_membership_employmentid || this.generateGuid(),
  operationId: this.generateOperationId(),
  membershipYear: dto.osot_membership_year,
  accountId: dto.osot_table_account,
  affiliateId: dto.osot_table_account_affiliate,
  existingEmploymentId: existingEmployment.osot_membership_employmentid,
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

---

## Testing

When testing services that emit events:

```typescript
// Mock the events service
const mockEventsService = {
  publishEmploymentCreated: jest.fn(),
  publishEmploymentUpdated: jest.fn(),
  publishEmploymentDeleted: jest.fn(),
  publishAccountAffiliateConflict: jest.fn(),
  publishUserYearDuplicate: jest.fn(),
};

// Verify events are emitted
expect(mockEventsService.publishEmploymentCreated).toHaveBeenCalledWith(
  expect.objectContaining({
    employmentId: expect.any(String),
    membershipYear: '2026',
    accountId: testAccountId,
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

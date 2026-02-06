# Membership Settings - Events Layer

This directory contains the domain events for the membership settings module, providing event-driven architecture capabilities for notifications, audit trails, and system integration.

## Architecture Overview

The events layer follows a **domain events pattern** with structured event classes:

1. **Base Event Class** - Common properties and structure for all membership settings events
2. **Domain Events** - Specific events for create, update, delete, and status change operations
3. **Event Handlers** - Listeners for events to trigger notifications and integrations

## Event Files

### `membership-settings.events.ts`

- **Purpose**: Domain event definitions for membership settings operations
- **Usage**: Event emission from services layer, event handling for notifications
- **Features**: Structured event data, operation tracking, user context
- **Access Control**: Events include user privilege context for security

## Design Philosophy

### Event-Driven Architecture

- **Domain Events**: Business-meaningful events that reflect real operations
- **Audit Trail**: Complete operation tracking with user context and timestamps
- **System Integration**: Events enable loose coupling between system components
- **Notification Support**: Events trigger email notifications and system alerts

### Event Structure

- **Consistent Base**: All events extend MembershipSettingsBaseEvent
- **Operation Context**: Every event includes operationId for tracking
- **User Context**: User ID and privilege level for security auditing
- **Timestamp**: Automatic timestamping for chronological ordering

## Event Types

### MembershipSettingsCreatedEvent

- **Trigger**: When new membership settings are successfully created
- **Data**: settingsId, category, membershipYear, feeAmount, user context
- **Usage**: Audit logging, notification to administrators, cache invalidation
- **Security**: Includes user privilege that performed the creation

### MembershipSettingsUpdatedEvent

- **Trigger**: When existing membership settings are modified
- **Data**: settingsId, previousValues, newValues, user context
- **Usage**: Change tracking, notification of modifications, audit compliance
- **Security**: Tracks what changed and who made the changes

### MembershipSettingsDeletedEvent

- **Trigger**: When membership settings are soft deleted (status = INACTIVE)
- **Data**: settingsId, category, membershipYear, user context
- **Usage**: Deletion audit, notification of removal, cleanup operations
- **Security**: Records who performed the deletion operation

### MembershipSettingsStatusChangedEvent

- **Trigger**: When membership settings status changes (ACTIVE ↔ INACTIVE)
- **Data**: settingsId, previousStatus, newStatus, category, year, user context
- **Usage**: Status change tracking, public fee visibility changes
- **Security**: Monitors status changes that affect public access

## Integration Points

### With Services Layer

```typescript
// Events emitted from CRUD service operations
await this.crudService.create(dto, userPrivilege, operationId);
// Emits: MembershipSettingsCreatedEvent

await this.crudService.update(id, dto, userPrivilege, operationId);
// Emits: MembershipSettingsUpdatedEvent

await this.crudService.delete(id, userPrivilege, operationId);
// Emits: MembershipSettingsDeletedEvent
```

### With Event Bus

```typescript
// Event emission pattern
this.eventBus.publish(
  new MembershipSettingsCreatedEvent(
    settingsId,
    operationId,
    category,
    membershipYear,
    feeAmount,
    userId,
    userPrivilege,
  ),
);
```

### With Notification System

```typescript
// Event handler for notifications
@EventsHandler(MembershipSettingsCreatedEvent)
export class MembershipSettingsCreatedHandler {
  async handle(event: MembershipSettingsCreatedEvent) {
    // Send notification to administrators
    // Update cache
    // Log audit trail
  }
}
```

## Event Handler Patterns

### Audit Trail Handler

```typescript
@EventsHandler(MembershipSettingsBaseEvent)
export class MembershipSettingsAuditHandler {
  async handle(event: MembershipSettingsBaseEvent) {
    // Log to audit database
    // Include user context and operation details
    // Ensure compliance with audit requirements
  }
}
```

### Notification Handler

```typescript
@EventsHandler(MembershipSettingsCreatedEvent, MembershipSettingsUpdatedEvent)
export class MembershipSettingsNotificationHandler {
  async handle(
    event: MembershipSettingsCreatedEvent | MembershipSettingsUpdatedEvent,
  ) {
    // Send email notifications to administrators
    // Update dashboard notifications
    // Trigger webhook integrations
  }
}
```

### Cache Invalidation Handler

```typescript
@EventsHandler(
  MembershipSettingsUpdatedEvent,
  MembershipSettingsStatusChangedEvent,
)
export class MembershipSettingsCacheHandler {
  async handle(
    event:
      | MembershipSettingsUpdatedEvent
      | MembershipSettingsStatusChangedEvent,
  ) {
    // Invalidate public fee cache
    // Update cached membership information
    // Refresh UI data
  }
}
```

## Security Considerations

### User Context Tracking

- **User Identification**: All events include userId when available
- **Privilege Tracking**: User privilege level recorded for security audit
- **Operation Tracking**: Unique operationId for complete audit trail
- **Timestamp Accuracy**: Precise timestamping for security investigation

### Event Data Security

- **Sensitive Data**: Events avoid including sensitive personal information
- **Access Control**: Event handlers respect privilege-based access patterns
- **Audit Compliance**: Events provide complete audit trail for compliance
- **Data Integrity**: Event data immutability for reliable audit records

## Usage Examples

### Service Integration

```typescript
// In CRUD service
export class MembershipSettingsCrudService {
  constructor(private readonly eventBus: EventBus) {}

  async create(
    dto: CreateMembershipSettingsDto,
    userPrivilege: Privilege,
    operationId: string,
  ) {
    // Create membership settings
    const settings = await this.repository.create(internal);

    // Emit creation event
    this.eventBus.publish(
      new MembershipSettingsCreatedEvent(
        settings.settingsId,
        operationId,
        settings.category,
        settings.membershipYear,
        settings.feeAmount,
        this.getCurrentUserId(),
        userPrivilege,
      ),
    );

    return mapper.mapInternalToResponseDto(settings);
  }
}
```

### Event Handler Implementation

```typescript
@EventsHandler(MembershipSettingsCreatedEvent)
export class NewMembershipSettingsHandler
  implements IEventHandler<MembershipSettingsCreatedEvent>
{
  constructor(
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async handle(event: MembershipSettingsCreatedEvent) {
    // Log audit trail
    await this.auditService.logEvent({
      eventType: 'MEMBERSHIP_SETTINGS_CREATED',
      settingsId: event.settingsId,
      userId: event.userId,
      userPrivilege: event.userPrivilege,
      operationId: event.operationId,
      timestamp: event.timestamp,
      data: {
        category: event.category,
        membershipYear: event.membershipYear,
        feeAmount: event.feeAmount,
      },
    });

    // Send notification email
    await this.emailService.sendAdminNotification({
      subject: 'New Membership Fee Settings Created',
      data: {
        category: event.category,
        year: event.membershipYear,
        amount: event.feeAmount,
      },
    });
  }
}
```

## Quality Standards

### Code Quality

- ESLint compliant event class definitions
- Comprehensive TypeScript type coverage for all event properties
- Clear documentation for all event types and their usage patterns
- Consistent naming conventions following domain terminology

### Business Alignment

- Events reflect actual business operations and requirements
- Event data includes all necessary information for audit and notification
- Event timing aligns with business process completion
- Event names use clear, business-meaningful terminology

### Integration Standards

- Events follow NestJS CQRS event pattern conventions
- Event handlers are independent and can be added without service changes
- Events include all necessary context for handler implementations
- Event emission is consistent across all service operations

## Next Steps

After completing the events layer, the following integration will be implemented:

1. **Modules Layer** - NestJS module configuration with event bus setup
2. **Event Handlers** - Specific handlers for audit, notification, and integration
3. **Testing** - Event emission and handler testing

Each integration will build upon these event foundations to ensure complete audit trails and system notifications throughout the application.

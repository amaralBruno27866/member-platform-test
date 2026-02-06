Events

Purpose

Contains domain events related to contacts. Events are simple payloads emitted by services when significant changes occur (e.g., ContactCreated, ContactUpdated, CommunicationAttempted) and can be used for asynchronous processing or notifications.

Examples

- ContactCreatedEvent { contactId, accountId, createdAt, communicationChannels, initiator }
- ContactUpdatedEvent { contactId, changes, previousData, updatedAt }
- ContactValidatedEvent { contactId, validatedChannels, validationResults }
- CommunicationAttemptEvent { contactId, channel, success, timestamp, details }

Integration

- Events can be published to an in-process event bus, message broker, or used to trigger webhooks.
- Include contact-specific events for communication attempts, channel validation, and preference changes.

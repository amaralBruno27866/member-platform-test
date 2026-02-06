# Address Events (SIMPLIFIED)

## Purpose

Contains event definitions and management for Address module operations. Follows the Contact events pattern with essential modules integration (#file:errors, #file:enums, #file:utils, #file:integrations) and provides clean event sourcing capabilities.

## Available Events

### AddressEventsService

- **Purpose**: Main events service for publishing and managing address-related events
- **Features**:
  - Address lifecycle event tracking (Created, Updated, Deleted)
  - Postal code validation events
  - Location-based event analysis
  - Bulk operation event aggregation
  - Audit trail for address changes
  - Integration with business rule validation

## Event Types

### Lifecycle Events

- **AddressCreatedEvent** - New address creation
- **AddressUpdatedEvent** - Address modifications with change tracking
- **AddressDeletedEvent** - Address deletion with reason

### Validation Events

- **AddressValidationEvent** - Postal code, completeness, duplicate validation
- **AddressPostalCodeEvent** - Postal code changes and corrections

### Location Events

- **AddressLocationEvent** - Location validation, geocoding, duplicate detection
- **AddressTypeEvent** - Address type changes and business context

### Bulk Events

- **AddressBulkEvent** - Bulk operations with success/error tracking

## Integration Points ✅

### ✅ #file:enums Integration

- **Type Safety**: Uses centralized enums (City, Province, Country, AddressType, etc.)
- **Enum Events**: Tracks enum value changes in events
- **Validation**: Event validation using enum constraints

### ✅ #file:errors Integration (Ready)

- **Error Tracking**: Events capture validation errors and failures
- **Structured Errors**: Compatible with ErrorCodes pattern
- **Event Logging**: Error context preserved in event data

### ✅ #file:utils Integration (Ready)

- **Business Rules**: Ready for business-rule.util integration
- **Event Utilities**: Helper methods for event creation
- **Data Transformation**: Clean event data mapping

### ✅ #file:integrations Integration (Ready)

- **Event Sourcing**: Ready for event bus integration
- **External Systems**: Events can trigger external integrations
- **Audit Trail**: Complete audit capabilities

## Architecture Benefits

- **Event Sourcing**: Complete audit trail of address operations
- **Decoupling**: Loose coupling between address operations and consumers
- **Analytics**: Rich event data for business intelligence
- **Integration**: Clean integration points for external systems
- **Monitoring**: Operational visibility through events

## Key Methods

### Event Publishing

- `publishAddressCreated(event)` - Publish address creation
- `publishAddressUpdated(event)` - Publish address updates
- `publishAddressDeleted(event)` - Publish address deletion
- `publishAddressValidation(event)` - Publish validation results

### Event Creation Utilities

- `createAddressCreatedEvent(...)` - Create creation event
- `createValidationEvent(...)` - Create validation event
- `createBulkOperationEvent(...)` - Create bulk operation event

## Event Structure

All events include:

- **Identifiers**: addressId, accountId for correlation
- **Timestamps**: ISO datetime for event ordering
- **Context**: User/system that triggered the event
- **Data**: Relevant address data and changes
- **Metadata**: Event type, validation results, error details

## Usage Patterns

### Service Integration

```typescript
// In address service
await this.eventsService.publishAddressCreated(
  this.eventsService.createAddressCreatedEvent(
    addressId,
    accountId,
    addressData,
    userId,
  ),
);
```

### Validation Events

```typescript
// After validation
this.eventsService.publishAddressValidation(
  this.eventsService.createValidationEvent(
    addressId,
    accountId,
    'postal_code_format',
    isValid,
    errors,
  ),
);
```

## Future Integration

- **Event Bus**: Integration with NestJS EventEmitter or external message bus
- **Event Store**: Persistent event storage for audit trails
- **Consumers**: External systems consuming address events
- **Analytics**: Business intelligence and reporting integration
- AddressValidatedEvent { addressId, validationResults, postalCodeVerified }
- AddressNormalizedEvent { addressId, originalData, normalizedData }

Integration

- Events can be published to an in-process event bus, message broker, or used to trigger webhooks.
- Include address-specific events for validation, normalization, and geographic verification processes.

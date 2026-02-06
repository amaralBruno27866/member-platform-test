/**
 * Audience Target Events
 *
 * Event classes for Audience Target entity lifecycle management.
 * Used for async processing, notifications, audit logs, and integration workflows.
 *
 * EVENTS:
 * - AudienceTargetCreatedEvent: Fired when a new target is created
 * - AudienceTargetUpdatedEvent: Fired when a target is updated
 * - AudienceTargetDeletedEvent: Fired when a target is deleted (hard delete only)
 * - AudienceTargetOpenToAllEvent: Fired when target has all criteria empty (accessible to all users)
 * - AudienceTargetProductLinkedEvent: Fired when target is linked to product (one-to-one relationship)
 *
 * BUSINESS CONTEXT:
 * - Targets define audience criteria for product access control
 * - One target per product (one-to-one relationship)
 * - Empty criteria = product accessible to all users
 * - Only Admin/Main users can manage targets
 *
 * @file audience-target.events.ts
 * @module AudienceTargetModule
 * @layer Events
 * @since 2025-12-22
 */

/**
 * Audience Target Created Event
 * Emitted when a new audience target is successfully created
 */
export class AudienceTargetCreatedEvent {
  constructor(
    public readonly targetId: string, // Business ID (osot-tgt-0000001)
    public readonly targetGuid: string, // GUID
    public readonly productId: string, // Product GUID (one-to-one relationship)
    public readonly isOpenToAll: boolean, // True if all 32 targeting fields are empty
    public readonly targetingFieldsCount: number, // Number of fields with values
    public readonly createdBy: string, // User identifier
    public readonly operationId: string, // Operation tracking ID
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Audience Target Updated Event
 * Emitted when an audience target is successfully updated
 */
export class AudienceTargetUpdatedEvent {
  constructor(
    public readonly targetId: string, // Business ID
    public readonly targetGuid: string, // GUID
    public readonly productId: string, // Product GUID (immutable)
    public readonly updatedFields: string[], // List of fields modified
    public readonly wasOpenToAll: boolean, // Previous state (all empty)
    public readonly isOpenToAll: boolean, // New state (all empty)
    public readonly targetingFieldsCount: number, // Number of fields with values after update
    public readonly updatedBy: string, // User identifier
    public readonly operationId: string, // Operation tracking ID
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Audience Target Deleted Event
 * Emitted when an audience target is deleted
 *
 * NOTE: Only hard delete is supported (no soft delete for this entity)
 * Deleting a target releases the product for a new target creation
 */
export class AudienceTargetDeletedEvent {
  constructor(
    public readonly targetId: string, // Business ID
    public readonly targetGuid: string, // GUID
    public readonly productId: string, // Product GUID (now available for new target)
    public readonly deletedBy: string, // User identifier
    public readonly operationId: string, // Operation tracking ID
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Audience Target Open-to-All Event
 * Emitted when a target has all 32 targeting criteria empty
 * This means the product is accessible to ALL users without restrictions
 *
 * USE CASE: Alert/notification for admins about unrestricted product access
 */
export class AudienceTargetOpenToAllEvent {
  constructor(
    public readonly targetId: string, // Business ID
    public readonly targetGuid: string, // GUID
    public readonly productId: string, // Product GUID
    public readonly action: 'created' | 'updated', // Which operation triggered this state
    public readonly triggeredBy: string, // User identifier
    public readonly operationId: string, // Operation tracking ID
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Audience Target Product Linked Event
 * Emitted when a target establishes one-to-one relationship with product
 *
 * USE CASE: Track product-target relationships for access control system
 */
export class AudienceTargetProductLinkedEvent {
  constructor(
    public readonly targetId: string, // Business ID
    public readonly targetGuid: string, // GUID
    public readonly productId: string, // Product GUID
    public readonly productBusinessId: string | null, // Product business ID (if available)
    public readonly createdBy: string, // User identifier
    public readonly operationId: string, // Operation tracking ID
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Audience Target Criteria Changed Event
 * Emitted when targeting criteria are modified (added or removed)
 *
 * USE CASE: Track changes to audience matching logic for analytics/reporting
 */
export class AudienceTargetCriteriaChangedEvent {
  constructor(
    public readonly targetId: string, // Business ID
    public readonly targetGuid: string, // GUID
    public readonly productId: string, // Product GUID
    public readonly fieldName: string, // Targeting field modified
    public readonly previousValueCount: number, // Number of values before (0 if empty)
    public readonly newValueCount: number, // Number of values after (0 if empty)
    public readonly action: 'added' | 'removed' | 'modified', // Type of change
    public readonly updatedBy: string, // User identifier
    public readonly operationId: string, // Operation tracking ID
    public readonly timestamp: Date = new Date(),
  ) {}
}

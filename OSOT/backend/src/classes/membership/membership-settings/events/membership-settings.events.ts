/**
 * @fileoverview Membership Settings Events
 * @description Domain events for membership settings operations
 * @author Bruno Amaral
 * @since 2024
 *
 * Events emitted:
 * - MembershipSettingsCreatedEvent
 * - MembershipSettingsUpdatedEvent
 * - MembershipSettingsDeletedEvent
 * - MembershipSettingsStatusChangedEvent
 */

import { Privilege } from '../../../../common/enums';

/**
 * Base event for all membership settings events
 */
export abstract class MembershipSettingsBaseEvent {
  constructor(
    public readonly settingsId: string,
    public readonly operationId: string,
    public readonly userId?: string,
    public readonly userPrivilege?: Privilege,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event emitted when new membership settings are created
 */
export class MembershipSettingsCreatedEvent extends MembershipSettingsBaseEvent {
  constructor(
    settingsId: string,
    operationId: string,
    public readonly category: string,
    public readonly membershipYear: string,
    public readonly feeAmount: number,
    userId?: string,
    userPrivilege?: Privilege,
  ) {
    super(settingsId, operationId, userId, userPrivilege);
  }
}

/**
 * Event emitted when membership settings are updated
 */
export class MembershipSettingsUpdatedEvent extends MembershipSettingsBaseEvent {
  constructor(
    settingsId: string,
    operationId: string,
    public readonly previousValues: Record<string, any>,
    public readonly newValues: Record<string, any>,
    userId?: string,
    userPrivilege?: Privilege,
  ) {
    super(settingsId, operationId, userId, userPrivilege);
  }
}

/**
 * Event emitted when membership settings are deleted (soft delete)
 */
export class MembershipSettingsDeletedEvent extends MembershipSettingsBaseEvent {
  constructor(
    settingsId: string,
    operationId: string,
    public readonly category: string,
    public readonly membershipYear: string,
    userId?: string,
    userPrivilege?: Privilege,
  ) {
    super(settingsId, operationId, userId, userPrivilege);
  }
}

/**
 * Event emitted when membership settings status changes
 */
export class MembershipSettingsStatusChangedEvent extends MembershipSettingsBaseEvent {
  constructor(
    settingsId: string,
    operationId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly category: string,
    public readonly membershipYear: string,
    userId?: string,
    userPrivilege?: Privilege,
  ) {
    super(settingsId, operationId, userId, userPrivilege);
  }
}

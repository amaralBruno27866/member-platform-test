import { Injectable, Logger } from '@nestjs/common';
import {
  Category,
  MembershipEligilibility,
  AffiliateEligibility,
  AccessModifier,
  Privilege,
  UserGroup,
} from '../../../../common/enums';

/**
 * Membership Category Event Interfaces
 * Focused on critical business events for individual membership categorization management
 */

/**
 * Event emitted when a new membership category is created for a user
 */
export interface MembershipCategoryCreatedEvent {
  categoryId: string; // Business ID (osot-cat-0000001)
  guid: string; // Dataverse GUID
  userType: 'account' | 'affiliate';
  userId: string; // Account or Affiliate GUID
  membershipYear: string;
  membershipCategory?: Category;
  eligibility?: MembershipEligilibility;
  eligibilityAffiliate?: AffiliateEligibility;
  membershipDeclaration: boolean;
  usersGroup?: UserGroup;
  privilege?: Privilege;
  accessModifiers?: AccessModifier;
  createdBy: string;
  timestamp: Date;
}

/**
 * Event emitted when membership category is updated
 */
export interface MembershipCategoryUpdatedEvent {
  categoryId: string;
  guid: string;
  userType: 'account' | 'affiliate';
  userId: string;
  changes: {
    old: Partial<{
      membershipYear: string;
      membershipCategory?: Category;
      eligibility?: MembershipEligilibility;
      eligibilityAffiliate?: AffiliateEligibility;
      membershipDeclaration: boolean;
      usersGroup?: UserGroup;
      parentalLeaveFrom?: string;
      parentalLeaveTo?: string;
      retirementStart?: string;
      privilege?: Privilege;
      accessModifiers?: AccessModifier;
    }>;
    new: Partial<{
      membershipYear: string;
      membershipCategory?: Category;
      eligibility?: MembershipEligilibility;
      eligibilityAffiliate?: AffiliateEligibility;
      membershipDeclaration: boolean;
      usersGroup?: UserGroup;
      parentalLeaveFrom?: string;
      parentalLeaveTo?: string;
      retirementStart?: string;
      privilege?: Privilege;
      accessModifiers?: AccessModifier;
    }>;
  };
  updatedBy: string;
  timestamp: Date;
}

/**
 * Event emitted when a user enters parental leave
 */
export interface ParentalLeaveStartedEvent {
  categoryId: string;
  guid: string;
  userType: 'account' | 'affiliate';
  userId: string;
  membershipYear: string;
  membershipCategory?: Category;
  parentalLeavePeriod: {
    from: string;
    to: string;
    durationDays: number;
  };
  previousStatus?: 'active' | 'retired' | 'student';
  startedBy: string;
  timestamp: Date;
}

/**
 * Event emitted when a user ends parental leave
 */
export interface ParentalLeaveEndedEvent {
  categoryId: string;
  guid: string;
  userType: 'account' | 'affiliate';
  userId: string;
  membershipYear: string;
  membershipCategory?: Category;
  parentalLeavePeriod: {
    from: string;
    to: string;
    actualDurationDays: number;
  };
  newStatus: 'active' | 'retired' | 'student';
  endedBy: string;
  endedEarly?: boolean;
  timestamp: Date;
}

/**
 * Event emitted when a member retires
 */
export interface MemberRetirementEvent {
  categoryId: string;
  guid: string;
  userType: 'account' | 'affiliate';
  userId: string;
  membershipYear: string;
  retirementDetails: {
    retirementDate: string;
    previousCategory?: Category;
    newRetirementCategory: Category; // OT_RET or OTA_RET
  };
  retiredBy: string;
  timestamp: Date;
}

/**
 * Event emitted when membership declaration is accepted
 */
export interface MembershipDeclarationAcceptedEvent {
  categoryId: string;
  guid: string;
  userType: 'account' | 'affiliate';
  userId: string;
  membershipYear: string;
  membershipCategory?: Category;
  acceptedBy: string;
  acceptanceMethod: 'manual' | 'api' | 'bulk';
  timestamp: Date;
}

/**
 * Event emitted when category changes (e.g., student to practicing)
 */
export interface CategoryChangedEvent {
  categoryId: string;
  guid: string;
  userType: 'account' | 'affiliate';
  userId: string;
  membershipYear: string;
  categoryChange: {
    oldCategory?: Category;
    newCategory: Category;
    reason?: string;
  };
  eligibilityChange?: {
    oldEligibility?: MembershipEligilibility | AffiliateEligibility;
    newEligibility?: MembershipEligilibility | AffiliateEligibility;
  };
  changedBy: string;
  businessImpact: 'low' | 'medium' | 'high';
  timestamp: Date;
}

/**
 * Event emitted when eligibility status changes
 */
export interface EligibilityChangedEvent {
  categoryId: string;
  guid: string;
  userType: 'account' | 'affiliate';
  userId: string;
  membershipYear: string;
  membershipCategory?: Category;
  eligibilityChange: {
    oldEligibility?: MembershipEligilibility | AffiliateEligibility;
    newEligibility: MembershipEligilibility | AffiliateEligibility;
    eligibilityType: 'member' | 'affiliate';
  };
  changedBy: string;
  complianceImpact: boolean;
  timestamp: Date;
}

/**
 * Event emitted when multiple memberships are detected for same user/year
 */
export interface DuplicateMembershipDetectedEvent {
  userType: 'account' | 'affiliate';
  userId: string;
  membershipYear: string;
  duplicateCategories: Array<{
    categoryId: string;
    guid: string;
    category?: Category;
    createdOn: string;
    isDeclarationAccepted: boolean;
  }>;
  totalDuplicateCount: number;
  isBusinessRuleViolation: boolean;
  detectedBy: string;
  resolutionRequired: boolean;
  timestamp: Date;
}

/**
 * Event emitted when membership year renewal occurs
 */
export interface MembershipYearRenewalEvent {
  categoryId: string;
  guid: string;
  userType: 'account' | 'affiliate';
  userId: string;
  renewal: {
    fromYear: string;
    toYear: string;
    categoryCarriedOver?: Category;
    eligibilityCarriedOver?: MembershipEligilibility | AffiliateEligibility;
  };
  renewalMethod: 'automatic' | 'manual' | 'migration';
  renewedBy: string;
  timestamp: Date;
}

/**
 * Event emitted when user access privileges change
 */
export interface UserPrivilegeChangedEvent {
  categoryId: string;
  guid: string;
  userType: 'account' | 'affiliate';
  userId: string;
  membershipYear: string;
  privilegeChanges?: {
    oldPrivilege?: Privilege;
    newPrivilege: Privilege;
  };
  accessChanges?: {
    oldAccess?: AccessModifier;
    newAccess: AccessModifier;
  };
  changedBy: string;
  securityImpact: 'low' | 'medium' | 'high';
  auditRequired: boolean;
  timestamp: Date;
}

/**
 * Membership Category Events Service
 *
 * Manages publication and handling of membership-category-related events.
 * Events focus on individual member lifecycle operations including category assignments,
 * parental leave management, retirement processing, and eligibility changes.
 *
 * Key Features:
 * - Type-safe event interfaces for membership category lifecycle
 * - User-specific membership tracking (Account vs Affiliate)
 * - Parental leave period management and tracking
 * - Retirement workflow and category transitions
 * - Membership declaration acceptance monitoring
 * - Duplicate membership detection and resolution
 * - Cross-year renewal and migration support
 * - Privilege and access control audit trail
 * - Business rule compliance monitoring
 * - Integration-ready for HR systems and member portals
 *
 * Membership-Category-Specific Events:
 * - Individual member category assignments and changes
 * - Parental leave start/end cycles with duration tracking
 * - Retirement workflows and category transitions
 * - Declaration acceptance and compliance monitoring
 * - Duplicate membership detection and business rule enforcement
 * - Year-over-year renewal and status carryover
 * - User privilege and access management
 * - Eligibility status changes and compliance impact
 */
@Injectable()
export class MembershipCategoryEventsService {
  private readonly logger = new Logger(MembershipCategoryEventsService.name);

  /**
   * Emit membership category created event
   * Called when a new membership category is successfully created for a user
   */
  emitMembershipCategoryCreated(event: MembershipCategoryCreatedEvent): void {
    this.logger.log(
      `Membership category created: ID=${event.categoryId}, UserType=${event.userType}, Year=${event.membershipYear}, Category=${event.membershipCategory || 'N/A'}, Declaration=${event.membershipDeclaration}, By=${event.createdBy}`,
    );

    this.publishEvent('membership-category.created', event);
  }

  /**
   * Emit membership category updated event
   * Called when existing membership category is successfully updated
   */
  emitMembershipCategoryUpdated(event: MembershipCategoryUpdatedEvent): void {
    const changeCount = Object.keys(event.changes.new).length;
    const hasCategoryChange = 'membershipCategory' in event.changes.new;
    const hasEligibilityChange =
      'eligibility' in event.changes.new ||
      'eligibilityAffiliate' in event.changes.new;
    const hasLeaveChange =
      'parentalLeaveFrom' in event.changes.new ||
      'parentalLeaveTo' in event.changes.new;

    this.logger.log(
      `Membership category updated: ID=${event.categoryId}, UserType=${event.userType}, Changes=${changeCount}, CategoryChange=${hasCategoryChange}, EligibilityChange=${hasEligibilityChange}, LeaveChange=${hasLeaveChange}, By=${event.updatedBy}`,
    );

    this.publishEvent('membership-category.updated', event);
  }

  /**
   * Emit parental leave started event
   * Called when a member begins parental leave
   */
  emitParentalLeaveStarted(event: ParentalLeaveStartedEvent): void {
    this.logger.log(
      `Parental leave started: ID=${event.categoryId}, UserType=${event.userType}, Year=${event.membershipYear}, Duration=${event.parentalLeavePeriod.durationDays} days, From=${event.parentalLeavePeriod.from}, To=${event.parentalLeavePeriod.to}, By=${event.startedBy}`,
    );

    this.publishEvent('membership-category.parental-leave-started', event);
  }

  /**
   * Emit parental leave ended event
   * Called when a member ends parental leave
   */
  emitParentalLeaveEnded(event: ParentalLeaveEndedEvent): void {
    const completionStatus = event.endedEarly ? 'EARLY' : 'COMPLETED';

    this.logger.log(
      `Parental leave ended: ID=${event.categoryId}, UserType=${event.userType}, Year=${event.membershipYear}, Duration=${event.parentalLeavePeriod.actualDurationDays} days, Status=${completionStatus}, NewStatus=${event.newStatus}, By=${event.endedBy}`,
    );

    this.publishEvent('membership-category.parental-leave-ended', event);
  }

  /**
   * Emit member retirement event
   * Called when a member transitions to retirement status
   */
  emitMemberRetirement(event: MemberRetirementEvent): void {
    this.logger.log(
      `Member retirement: ID=${event.categoryId}, UserType=${event.userType}, Year=${event.membershipYear}, RetirementDate=${event.retirementDetails.retirementDate}, PreviousCategory=${event.retirementDetails.previousCategory || 'N/A'}, NewCategory=${event.retirementDetails.newRetirementCategory}, By=${event.retiredBy}`,
    );

    this.publishEvent('membership-category.member-retired', event);
  }

  /**
   * Emit membership declaration accepted event
   * Called when a member accepts the membership declaration
   */
  emitMembershipDeclarationAccepted(
    event: MembershipDeclarationAcceptedEvent,
  ): void {
    this.logger.log(
      `Membership declaration accepted: ID=${event.categoryId}, UserType=${event.userType}, Year=${event.membershipYear}, Category=${event.membershipCategory || 'N/A'}, Method=${event.acceptanceMethod}, By=${event.acceptedBy}`,
    );

    this.publishEvent('membership-category.declaration-accepted', event);
  }

  /**
   * Emit category changed event
   * Called when a member's category classification changes
   */
  emitCategoryChanged(event: CategoryChangedEvent): void {
    const impactLevel = event.businessImpact.toUpperCase();

    this.logger.log(
      `Category changed: ID=${event.categoryId}, UserType=${event.userType}, Year=${event.membershipYear}, OldCategory=${event.categoryChange.oldCategory || 'N/A'}, NewCategory=${event.categoryChange.newCategory}, Impact=${impactLevel}, Reason=${event.categoryChange.reason || 'N/A'}, By=${event.changedBy}`,
    );

    this.publishEvent('membership-category.category-changed', event);
  }

  /**
   * Emit eligibility changed event
   * Called when a member's eligibility status changes
   */
  emitEligibilityChanged(event: EligibilityChangedEvent): void {
    const complianceStatus = event.complianceImpact
      ? 'COMPLIANCE-IMPACT'
      : 'NO-IMPACT';

    this.logger.log(
      `Eligibility changed: ID=${event.categoryId}, UserType=${event.userType}, Year=${event.membershipYear}, Type=${event.eligibilityChange.eligibilityType}, OldEligibility=${event.eligibilityChange.oldEligibility || 'N/A'}, NewEligibility=${event.eligibilityChange.newEligibility}, Compliance=${complianceStatus}, By=${event.changedBy}`,
    );

    this.publishEvent('membership-category.eligibility-changed', event);
  }

  /**
   * Emit duplicate membership detected event
   * Called when multiple memberships are found for the same user/year
   */
  emitDuplicateMembershipDetected(
    event: DuplicateMembershipDetectedEvent,
  ): void {
    const violationStatus = event.isBusinessRuleViolation
      ? 'VIOLATION'
      : 'ALLOWED';
    const resolutionStatus = event.resolutionRequired ? 'REQUIRED' : 'OPTIONAL';

    this.logger.warn(
      `Duplicate membership detected: UserType=${event.userType}, UserID=${event.userId}, Year=${event.membershipYear}, Count=${event.totalDuplicateCount}, Violation=${violationStatus}, Resolution=${resolutionStatus}, DetectedBy=${event.detectedBy}`,
    );

    if (event.isBusinessRuleViolation) {
      this.logger.error(
        `BUSINESS RULE VIOLATION: Multiple memberships for ${event.userType} ${event.userId} in year ${event.membershipYear} - Immediate resolution required`,
      );
    }

    this.publishEvent('membership-category.duplicate-detected', event);
  }

  /**
   * Emit membership year renewal event
   * Called when a member's membership is renewed for a new year
   */
  emitMembershipYearRenewal(event: MembershipYearRenewalEvent): void {
    this.logger.log(
      `Membership year renewal: ID=${event.categoryId}, UserType=${event.userType}, FromYear=${event.renewal.fromYear}, ToYear=${event.renewal.toYear}, CategoryCarried=${event.renewal.categoryCarriedOver || 'N/A'}, Method=${event.renewalMethod}, By=${event.renewedBy}`,
    );

    this.publishEvent('membership-category.year-renewed', event);
  }

  /**
   * Emit user privilege changed event
   * Called when a member's privileges or access modifiers change
   */
  emitUserPrivilegeChanged(event: UserPrivilegeChangedEvent): void {
    const changeType = event.privilegeChanges ? 'PRIVILEGE' : 'ACCESS';
    const securityLevel = event.securityImpact.toUpperCase();
    const auditStatus = event.auditRequired ? 'AUDIT-REQUIRED' : 'NO-AUDIT';

    this.logger.log(
      `User privilege changed: ID=${event.categoryId}, UserType=${event.userType}, Year=${event.membershipYear}, ChangeType=${changeType}, SecurityImpact=${securityLevel}, AuditStatus=${auditStatus}, By=${event.changedBy}`,
    );

    if (event.securityImpact === 'high') {
      this.logger.warn(
        `HIGH SECURITY IMPACT: Privilege change for ${event.userType} ${event.userId} - Enhanced monitoring recommended`,
      );
    }

    this.publishEvent('membership-category.privilege-changed', event);
  }

  /**
   * Private method to publish events to external systems
   * Can be extended to integrate with event buses, message brokers, or webhooks
   */
  private publishEvent(eventType: string, eventData: unknown): void {
    // Log structured event data for audit trail and business intelligence
    this.logger.debug(`Publishing event: ${eventType}`, {
      eventType,
      timestamp: new Date().toISOString(),
      data: eventData,
    });

    // TODO: Integrate with external event systems
    // Examples:
    // - Event Bus (NestJS EventEmitter, Redis Pub/Sub, RabbitMQ)
    // - Message Brokers (Apache Kafka, AWS SQS, Azure Service Bus)
    // - Webhooks (HTTP POST to external endpoints)
    // - Analytics Platforms (Google Analytics, Mixpanel, Custom BI)
    // - Notification Systems (Email, SMS, Push notifications)
    // - Audit Systems (Elasticsearch, Splunk, CloudWatch)
    // - Member Management Systems (CRM, ERP integration)
    // - Financial Systems (Billing, invoicing, payment processing)

    // Example implementation:
    // await this.eventBus.emit(eventType, eventData);
    // await this.webhookService.sendWebhook(eventType, eventData);
    // await this.analyticsService.track(eventType, eventData);
  }

  /**
   * Utility method to create timestamp for consistent event timing
   */
  private createTimestamp(): Date {
    return new Date();
  }

  /**
   * Utility method to calculate parental leave duration in days
   */
  static calculateParentalLeaveDuration(
    startDate: string,
    endDate: string,
  ): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Utility method to determine business impact level for category changes
   */
  static determineCategoryChangeImpact(
    oldCategory?: Category,
    newCategory?: Category,
  ): 'low' | 'medium' | 'high' {
    if (!oldCategory || !newCategory) return 'medium';

    // High impact changes (retirement, student transitions)
    const retirementCategories = [Category.OT_RET, Category.OTA_RET];
    const studentCategories = [Category.OT_STU, Category.OTA_STU];
    const practiceCategories = [Category.OT_PR, Category.OTA_PR];

    // Retirement transitions
    if (
      retirementCategories.includes(newCategory) ||
      retirementCategories.includes(oldCategory)
    ) {
      return 'high';
    }

    // Student to practice transitions
    if (
      studentCategories.includes(oldCategory) &&
      practiceCategories.includes(newCategory)
    ) {
      return 'high';
    }

    // Practice to student (unusual)
    if (
      practiceCategories.includes(oldCategory) &&
      studentCategories.includes(newCategory)
    ) {
      return 'high';
    }

    // OT to OTA transitions or vice versa
    const isOTtoOTA =
      [
        Category.OT_PR,
        Category.OT_STU,
        Category.OT_NG,
        Category.OT_LIFE,
      ].includes(oldCategory) &&
      [
        Category.OTA_PR,
        Category.OTA_STU,
        Category.OTA_NG,
        Category.OTA_LIFE,
      ].includes(newCategory);

    const isOTAtoOT =
      [
        Category.OTA_PR,
        Category.OTA_STU,
        Category.OTA_NG,
        Category.OTA_LIFE,
      ].includes(oldCategory) &&
      [
        Category.OT_PR,
        Category.OT_STU,
        Category.OT_NG,
        Category.OT_LIFE,
      ].includes(newCategory);

    if (isOTtoOTA || isOTAtoOT) {
      return 'high';
    }

    // Medium impact for other significant changes
    return 'medium';
  }

  /**
   * Utility method to determine security impact level
   */
  static determineSecurityImpact(
    privilegeChange?: { old?: Privilege; new: Privilege },
    accessChange?: { old?: AccessModifier; new: AccessModifier },
  ): 'low' | 'medium' | 'high' {
    // High impact for privilege escalations
    if (privilegeChange) {
      const { new: newPriv } = privilegeChange;
      if (newPriv === Privilege.OWNER || newPriv === Privilege.MAIN) {
        return 'high';
      }
    }

    // Medium impact for access modifier changes
    if (accessChange) {
      const { old: oldAccess, new: newAccess } = accessChange;
      if (
        oldAccess === AccessModifier.PRIVATE &&
        newAccess === AccessModifier.PUBLIC
      ) {
        return 'medium';
      }
    }

    return 'low';
  }
}

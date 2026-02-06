/**
 * Progress Mappers
 *
 * Data transformation utilities for progress tracking in the Membership Orchestrator.
 * Handles progress state management, entity status tracking, and workflow progress.
 */

import { MembershipProgressDto, MembershipEntityType } from '../index';

// ========================================
// PROGRESS MAPPING
// ========================================

/**
 * Maps and updates membership progress tracking data
 */
export class MembershipProgressMapper {
  /**
   * Create initial progress state
   */
  static toInitialProgress(accountGuid: string): MembershipProgressDto {
    const now = new Date().toISOString();
    const entityOrder: MembershipEntityType[] = [
      'membership-category',
      'membership-employment',
      'membership-practices',
      'membership-preferences',
      'membership-settings',
      'product-insurance',
    ];

    return {
      accountGuid,
      currentStep: 'membership-category',
      percentage: 0,
      completedEntities: [],
      failedEntities: [],
      pendingEntities: [...entityOrder],
      entityDetails: {
        'membership-category': {
          entityType: 'membership-category',
          status: 'pending',
          retryCount: 0,
        },
        'membership-employment': {
          entityType: 'membership-employment',
          status: 'pending',
          retryCount: 0,
        },
        'membership-practices': {
          entityType: 'membership-practices',
          status: 'pending',
          retryCount: 0,
        },
        'membership-preferences': {
          entityType: 'membership-preferences',
          status: 'pending',
          retryCount: 0,
        },
        'membership-settings': {
          entityType: 'membership-settings',
          status: 'pending',
          retryCount: 0,
        },
        'product-insurance': {
          entityType: 'product-insurance',
          status: 'pending',
          retryCount: 0,
        },
      },
      startedAt: now,
      updatedAt: now,
    };
  }

  /**
   * Update progress with successful entity creation
   */
  static withEntitySuccess(
    progress: MembershipProgressDto,
    entityType: MembershipEntityType,
    entityGuid: string,
  ): MembershipProgressDto {
    const now = new Date().toISOString();

    // Update entity details
    const entityDetails = {
      ...progress.entityDetails,
      [entityType]: {
        status: 'completed' as const,
        entityGuid,
        createdAt: now,
        retryCount: 0,
      },
    };

    // Update completed/pending lists
    const completedEntities = [
      ...progress.completedEntities.filter((e) => e !== entityType),
      entityType,
    ];
    const pendingEntities = progress.pendingEntities.filter(
      (e) => e !== entityType,
    );
    const failedEntities = progress.failedEntities.filter(
      (e) => e !== entityType,
    );

    // Calculate percentage
    const totalEntities = [
      ...completedEntities,
      ...failedEntities,
      ...pendingEntities,
    ].length;
    const percentage = Math.round(
      (completedEntities.length / totalEntities) * 100,
    );

    // Determine next step
    const nextStep = pendingEntities[0] || entityType;

    // Store membershipCategoryGuid if this is the category entity
    const membershipCategoryGuid =
      entityType === 'membership-category'
        ? entityGuid
        : progress.membershipCategoryGuid;

    return {
      ...progress,
      membershipCategoryGuid,
      currentStep: nextStep,
      percentage,
      completedEntities,
      failedEntities,
      pendingEntities,
      entityDetails,
      updatedAt: now,
    };
  }

  /**
   * Update progress with entity failure
   */
  static withEntityFailure(
    progress: MembershipProgressDto,
    entityType: MembershipEntityType,
    error: string,
  ): MembershipProgressDto {
    const now = new Date().toISOString();

    // Get current retry count
    const currentDetails = progress.entityDetails[entityType];
    const retryCount = (currentDetails?.retryCount || 0) + 1;

    // Update entity details
    const entityDetails = {
      ...progress.entityDetails,
      [entityType]: {
        status: 'failed' as const,
        error,
        retryCount,
        lastAttemptAt: now,
      },
    };

    // Update failed/pending lists
    const failedEntities = [
      ...progress.failedEntities.filter((e) => e !== entityType),
      entityType,
    ];
    const pendingEntities = progress.pendingEntities.filter(
      (e) => e !== entityType,
    );

    return {
      ...progress,
      currentStep: entityType,
      failedEntities,
      pendingEntities,
      entityDetails,
      updatedAt: now,
    };
  }

  /**
   * Mark entity as creating
   */
  static markEntityCreating(
    progress: MembershipProgressDto,
    entityType: MembershipEntityType,
  ): MembershipProgressDto {
    const now = new Date().toISOString();

    const entityDetails = {
      ...progress.entityDetails,
      [entityType]: {
        status: 'creating' as const,
        retryCount: progress.entityDetails[entityType]?.retryCount || 0,
      },
    };

    return {
      ...progress,
      currentStep: entityType,
      entityDetails,
      updatedAt: now,
    };
  }

  /**
   * Add pricing breakdown to progress
   */
  static withPricing(
    progress: MembershipProgressDto,
    pricing: {
      basePrice: number;
      insurancePrice?: number;
      discounts?: Array<{ type: string; amount: number; reason: string }>;
      taxes?: Array<{ type: string; rate: number; amount: number }>;
      totalPrice: number;
    },
  ): MembershipProgressDto {
    return {
      ...progress,
      pricing: {
        basePrice: pricing.basePrice,
        insurancePrice: pricing.insurancePrice || 0,
        subtotal:
          pricing.basePrice +
          (pricing.insurancePrice || 0) -
          (pricing.discounts || []).reduce((sum, d) => sum + d.amount, 0),
        discounts: pricing.discounts || [],
        taxes: pricing.taxes || [],
        total: pricing.totalPrice,
        currency: 'CAD',
        calculatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add payment tracking to progress
   */
  static withPayment(
    progress: MembershipProgressDto,
    payment: {
      status:
        | 'pending'
        | 'processing'
        | 'completed'
        | 'failed'
        | 'refunded'
        | 'cancelled';
      amount: number;
      currency: string;
      paymentIntentId?: string;
      transactionId?: string;
      paidAt?: string;
    },
  ): MembershipProgressDto {
    return {
      ...progress,
      payment,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate overall progress percentage
   */
  static calculatePercentage(progress: MembershipProgressDto): number {
    const totalEntities =
      progress.completedEntities.length +
      progress.failedEntities.length +
      progress.pendingEntities.length;

    if (totalEntities === 0) return 0;

    return Math.round(
      (progress.completedEntities.length / totalEntities) * 100,
    );
  }

  /**
   * Check if all required entities are completed
   */
  static areRequiredEntitiesCompleted(
    progress: MembershipProgressDto,
    requiredEntities: MembershipEntityType[],
  ): boolean {
    return requiredEntities.every((entity) =>
      progress.completedEntities.includes(entity),
    );
  }

  /**
   * Check if any required entity has failed
   */
  static hasRequiredEntityFailed(
    progress: MembershipProgressDto,
    requiredEntities: MembershipEntityType[],
  ): boolean {
    return requiredEntities.some((entity) =>
      progress.failedEntities.includes(entity),
    );
  }

  /**
   * Get next entity to create
   */
  static getNextEntity(
    progress: MembershipProgressDto,
  ): MembershipEntityType | null {
    return progress.pendingEntities[0] || null;
  }

  /**
   * Get failed entities that can be retried
   */
  static getRetryableEntities(
    progress: MembershipProgressDto,
    maxRetries: number,
  ): MembershipEntityType[] {
    return progress.failedEntities.filter((entity) => {
      const details = progress.entityDetails[entity];
      return details && details.retryCount < maxRetries;
    });
  }
}

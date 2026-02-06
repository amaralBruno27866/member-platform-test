/**
 * Progress Mappers
 *
 * Data transformation utilities for progress tracking in the Account Orchestrator.
 * Handles progress state management, entity status tracking, and workflow progress.
 */

import { RegistrationProgressDto, EntityType } from '../index';

// ========================================
// PROGRESS MAPPING
// ========================================

/**
 * Maps and updates progress tracking data
 */
export class ProgressMapper {
  /**
   * Create initial progress state
   */
  static toInitialProgress(): RegistrationProgressDto {
    const now = new Date().toISOString();
    const entityOrder: EntityType[] = [
      'account',
      'address',
      'contact',
      'identity',
      'education',
      'management',
    ];

    return {
      currentStep: 'account',
      progressPercentage: 0,
      entityStatuses: entityOrder.map((entityType) => ({
        entityType,
        success: false,
        createdAt: now,
        retryCount: 0,
      })),
      completedEntities: [],
      failedEntities: [],
      pendingEntities: [...entityOrder],
      totalRetryCount: 0,
      retryQueue: [],
      exhaustedRetries: [],
      startedAt: now,
      currentStepStartedAt: now,
      summary: {
        totalEntities: entityOrder.length,
        successfulEntities: 0,
        failedEntities: 0,
        pendingEntities: entityOrder.length,
        retryingEntities: 0,
      },
    };
  }

  /**
   * Update progress with successful entity creation
   */
  static withEntitySuccess(
    progress: RegistrationProgressDto,
    entityType: EntityType,
    entityGuid: string,
  ): RegistrationProgressDto {
    const now = new Date().toISOString();
    const updatedStatuses = progress.entityStatuses.map((status) =>
      status.entityType === entityType
        ? {
            ...status,
            success: true,
            entityGuid,
            createdAt: now,
          }
        : status,
    );

    const completedEntities = updatedStatuses
      .filter((status) => status.success)
      .map((status) => status.entityType);

    const failedEntities = updatedStatuses
      .filter((status) => !status.success && status.retryCount > 0)
      .map((status) => status.entityType);

    const pendingEntities = updatedStatuses
      .filter((status) => !status.success && status.retryCount === 0)
      .map((status) => status.entityType);

    const progressPercentage = Math.round(
      (completedEntities.length / updatedStatuses.length) * 100,
    );

    // Determine next step
    const nextStep = pendingEntities[0] || failedEntities[0];

    return {
      ...progress,
      entityStatuses: updatedStatuses,
      completedEntities,
      failedEntities,
      pendingEntities,
      progressPercentage,
      currentStep: nextStep || entityType,
      currentStepStartedAt: nextStep ? now : progress.currentStepStartedAt,
      completedAt: !nextStep ? now : undefined,
      accountGuid: entityType === 'account' ? entityGuid : progress.accountGuid,
      summary: {
        totalEntities: updatedStatuses.length,
        successfulEntities: completedEntities.length,
        failedEntities: failedEntities.length,
        pendingEntities: pendingEntities.length,
        retryingEntities: progress.retryQueue.length,
      },
    };
  }

  /**
   * Update progress with entity failure
   */
  static withEntityFailure(
    progress: RegistrationProgressDto,
    entityType: EntityType,
    error: {
      message: string;
      code: string;
      details?: any;
    },
  ): RegistrationProgressDto {
    const now = new Date().toISOString();
    const updatedStatuses = progress.entityStatuses.map((status) =>
      status.entityType === entityType
        ? {
            ...status,
            success: false,
            error,
            retryCount: status.retryCount + 1,
            lastRetryAt: now,
          }
        : status,
    );

    const completedEntities = updatedStatuses
      .filter((status) => status.success)
      .map((status) => status.entityType);

    const failedEntities = updatedStatuses
      .filter((status) => !status.success && status.retryCount > 0)
      .map((status) => status.entityType);

    const pendingEntities = updatedStatuses
      .filter((status) => !status.success && status.retryCount === 0)
      .map((status) => status.entityType);

    // Add to retry queue if under max attempts
    const maxRetries = 3;
    const currentStatus = updatedStatuses.find(
      (s) => s.entityType === entityType,
    );
    const currentRetryCount = currentStatus?.retryCount || 0;

    const retryQueue =
      currentRetryCount < maxRetries
        ? [...progress.retryQueue.filter((e) => e !== entityType), entityType]
        : progress.retryQueue.filter((e) => e !== entityType);

    const exhaustedRetries =
      currentRetryCount >= maxRetries
        ? [
            ...progress.exhaustedRetries.filter((e) => e !== entityType),
            entityType,
          ]
        : progress.exhaustedRetries;

    const totalRetryCount = progress.totalRetryCount + 1;

    return {
      ...progress,
      entityStatuses: updatedStatuses,
      completedEntities,
      failedEntities,
      pendingEntities,
      retryQueue,
      exhaustedRetries,
      totalRetryCount,
      summary: {
        totalEntities: updatedStatuses.length,
        successfulEntities: completedEntities.length,
        failedEntities: failedEntities.length,
        pendingEntities: pendingEntities.length,
        retryingEntities: retryQueue.length,
      },
    };
  }

  /**
   * Move entity from retry queue to processing
   */
  static startRetry(
    progress: RegistrationProgressDto,
    entityType: EntityType,
  ): RegistrationProgressDto {
    const now = new Date().toISOString();
    return {
      ...progress,
      currentStep: entityType,
      currentStepStartedAt: now,
      retryQueue: progress.retryQueue.filter((e) => e !== entityType),
    };
  }
}

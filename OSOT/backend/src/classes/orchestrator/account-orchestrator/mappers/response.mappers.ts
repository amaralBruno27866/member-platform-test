/**
 * Response Mappers
 *
 * Data transformation utilities for API responses in the Account Orchestrator.
 * Handles mapping internal data to API response formats and Redis operations.
 */

import {
  RegistrationSessionDto,
  RegistrationProgressDto,
  EntityType,
} from '../index';

// ========================================
// RESPONSE MAPPING
// ========================================

/**
 * Maps internal data to API response formats
 */
export class ResponseMapper {
  /**
   * Map session to status response
   */
  static toStatusResponse(
    session: RegistrationSessionDto,
    progress: RegistrationProgressDto,
  ) {
    return {
      success: true,
      sessionId: session.sessionId,
      status: session.status,
      progress: {
        percentage: progress.progressPercentage,
        currentStep: progress.currentStep,
        completedEntities: progress.completedEntities,
        failedEntities: progress.failedEntities,
        pendingEntities: progress.pendingEntities,
      },
      timestamps: {
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt,
      },
      lastError: session.lastError,
      estimatedCompletion: progress.estimatedCompletionAt,
    };
  }

  /**
   * Map session to initiation response
   */
  static toInitiationResponse(session: RegistrationSessionDto) {
    return {
      success: true,
      sessionId: session.sessionId,
      status: session.status,
      message:
        'Registration data staged successfully. Please check your email for verification.',
      nextSteps: ['Verify your email address', 'Wait for admin approval'],
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Map session to completion response
   */
  static toCompletionResponse(
    session: RegistrationSessionDto,
    progress: RegistrationProgressDto,
  ) {
    const createdEntities = progress.entityStatuses
      .filter((status) => status.success)
      .reduce(
        (acc, status) => {
          acc[status.entityType] = {
            guid: status.entityGuid || '',
          };
          return acc;
        },
        {} as Record<EntityType, { guid: string }>,
      );

    return {
      success: true,
      sessionId: session.sessionId,
      status: session.status,
      message: 'Registration completed successfully. All entities created.',
      createdEntities,
      userAccount: {
        email: session.userData.account.osot_email,
        businessId: 'TBD', // TODO: Extract from proper field when available
        status: 'active' as const,
      },
      timestamps: {
        started: session.createdAt,
        completed: progress.completedAt || '',
        duration: this.calculateDuration(
          session.createdAt,
          progress.completedAt || '',
        ),
      },
    };
  }

  /**
   * Calculate duration between two timestamps
   */
  private static calculateDuration(start: string, end: string): string {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

// ========================================
// REDIS KEY MAPPING
// ========================================

/**
 * Maps session data to Redis keys and values
 */
export class RedisMapper {
  /**
   * Generate Redis keys for session
   */
  static getSessionKeys(sessionId: string) {
    return {
      session: `orchestrator:session:${sessionId}`,
      progress: `orchestrator:progress:${sessionId}`,
      accountGuid: `orchestrator:account_guid:${sessionId}`,
      retryQueue: `orchestrator:retry:${sessionId}`,
      lock: `orchestrator:lock:${sessionId}`,
    };
  }

  /**
   * Convert session to Redis-storable format
   */
  static toRedisSession(session: RegistrationSessionDto): string {
    return JSON.stringify(session);
  }

  /**
   * Convert Redis data back to session
   */
  static fromRedisSession(data: string): RegistrationSessionDto {
    return JSON.parse(data) as RegistrationSessionDto;
  }

  /**
   * Convert progress to Redis-storable format
   */
  static toRedisProgress(progress: RegistrationProgressDto): string {
    return JSON.stringify(progress);
  }

  /**
   * Convert Redis data back to progress
   */
  static fromRedisProgress(data: string): RegistrationProgressDto {
    return JSON.parse(data) as RegistrationProgressDto;
  }
}

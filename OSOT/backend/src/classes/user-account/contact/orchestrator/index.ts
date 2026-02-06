/**
 * Contact Orchestrator Module Exports
 *
 * Centralized export point for all contact orchestrator components.
 * This module provides orchestration services, interfaces, DTOs, and utilities
 * for managing complex contact workflows.
 *
 * Architecture Overview:
 * - Interfaces: Define orchestrator contracts and workflow structures
 * - DTOs: Data transfer objects for session management and results
 * - Services: Demo implementations showing orchestrator patterns
 * - Utilities: Helper functions for workflow coordination
 *
 * Usage:
 * ```typescript
 * import {
 *   ContactOrchestrator,
 *   ContactStagingResult,
 *   ContactOrchestratorDemoService
 * } from './orchestrator';
 * ```
 */

// Core Orchestrator Interfaces
export * from './interfaces/contact-orchestrator.interface';

// Session and Workflow DTOs
export * from './dto/contact-session.dto';
export * from './dto/workflow-results.dto';

// Demo Services (for pattern demonstration)
export * from './services/contact-orchestrator-demo.service';

/**
 * Re-export commonly used types for convenience
 */
export type {
  ContactOrchestrator,
  ContactStagingResult,
  ContactValidationResult,
  ContactPersistenceResult,
} from './interfaces/contact-orchestrator.interface';

export type {
  ContactStagingOptionsDto,
  ContactValidationOptionsDto,
  ContactPersistenceOptionsDto,
} from './dto/contact-session.dto';

export type {
  ContactWorkflowCompletionDto,
  BulkContactProcessingOptionsDto,
  BulkContactProgressDto,
  SocialMediaAnalysisDto,
  ProfessionalNetworkingInsightsDto,
  ContactWorkflowAnalyticsDto,
} from './dto/workflow-results.dto';

/**
 * Orchestrator Module Constants
 */
export const CONTACT_ORCHESTRATOR_CONSTANTS = {
  SESSION_PREFIX: 'contact:session:',
  BATCH_PREFIX: 'contact:batch:',
  DEFAULT_SESSION_TTL: 7200, // 2 hours
  MAX_BATCH_SIZE: 100,
  MAX_RETRY_COUNT: 3,
  WORKFLOW_STEPS: [
    'staging',
    'validation',
    'persistence',
    'complete',
    'failed',
  ] as const,
  REGISTRATION_FLOWS: ['web', 'mobile', 'api'] as const,
  SOCIAL_MEDIA_PLATFORMS: [
    'facebook',
    'instagram',
    'linkedin',
    'tiktok',
  ] as const,
};

/**
 * Type definitions for orchestrator constants
 */
export type WorkflowStep =
  (typeof CONTACT_ORCHESTRATOR_CONSTANTS.WORKFLOW_STEPS)[number];
export type RegistrationFlow =
  (typeof CONTACT_ORCHESTRATOR_CONSTANTS.REGISTRATION_FLOWS)[number];
export type SocialMediaPlatform =
  (typeof CONTACT_ORCHESTRATOR_CONSTANTS.SOCIAL_MEDIA_PLATFORMS)[number];

/**
 * Utility functions for orchestrator operations
 */
export const ContactOrchestratorUtils = {
  /**
   * Generate a unique session ID
   */
  generateSessionId: (prefix = 'contact'): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  },

  /**
   * Calculate session expiration timestamp
   */
  calculateExpirationTime: (
    ttlSeconds = CONTACT_ORCHESTRATOR_CONSTANTS.DEFAULT_SESSION_TTL,
  ): Date => {
    return new Date(Date.now() + ttlSeconds * 1000);
  },

  /**
   * Validate batch size constraints
   */
  validateBatchSize: (size: number): boolean => {
    return size > 0 && size <= CONTACT_ORCHESTRATOR_CONSTANTS.MAX_BATCH_SIZE;
  },

  /**
   * Check if retry is available for a session
   */
  canRetry: (retryCount: number): boolean => {
    return retryCount < CONTACT_ORCHESTRATOR_CONSTANTS.MAX_RETRY_COUNT;
  },

  /**
   * Determine next workflow step
   */
  getNextStep: (currentStep: WorkflowStep, hasErrors = false): string => {
    switch (currentStep) {
      case 'staging':
        return 'validation';
      case 'validation':
        return hasErrors ? 'retry_validation' : 'persistence';
      case 'persistence':
        return 'complete';
      case 'complete':
        return 'workflow_complete';
      case 'failed':
        return 'retry_available';
      default:
        return 'unknown_state';
    }
  },

  /**
   * Format social media URL based on platform
   */
  normalizeSocialMediaUrl: (
    platform: SocialMediaPlatform,
    url: string,
  ): string => {
    if (!url) return '';

    const baseUrls: Record<SocialMediaPlatform, string> = {
      facebook: 'https://facebook.com/',
      instagram: 'https://instagram.com/',
      linkedin: 'https://linkedin.com/in/',
      tiktok: 'https://tiktok.com/@',
    };

    // Simple normalization - in production would be more sophisticated
    return url.startsWith('http') ? url : baseUrls[platform] + url;
  },

  /**
   * Estimate processing time for batch operations
   */
  estimateBatchProcessingTime: (
    batchSize: number,
    avgTimePerContact = 500,
  ): number => {
    return Math.ceil(batchSize * avgTimePerContact);
  },

  /**
   * Generate business ID from contact data
   */
  generateBusinessId: (userBusinessId?: string): string => {
    if (userBusinessId) {
      return userBusinessId;
    }
    return `CONT-${String(Date.now()).slice(-6)}`;
  },
};

/**
 * Error classes for orchestrator operations
 */
export class ContactOrchestratorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly sessionId?: string,
  ) {
    super(message);
    this.name = 'ContactOrchestratorError';
  }
}

export class ContactSessionNotFoundError extends ContactOrchestratorError {
  constructor(sessionId: string) {
    super(
      `Contact session not found: ${sessionId}`,
      'SESSION_NOT_FOUND',
      sessionId,
    );
    this.name = 'ContactSessionNotFoundError';
  }
}

export class ContactValidationError extends ContactOrchestratorError {
  constructor(
    message: string,
    sessionId?: string,
    public readonly validationErrors?: string[],
  ) {
    super(message, 'VALIDATION_ERROR', sessionId);
    this.name = 'ContactValidationError';
  }
}

export class ContactPersistenceError extends ContactOrchestratorError {
  constructor(message: string, sessionId?: string) {
    super(message, 'PERSISTENCE_ERROR', sessionId);
    this.name = 'ContactPersistenceError';
  }
}

/**
 * Module metadata
 */
export const CONTACT_ORCHESTRATOR_METADATA = {
  version: '1.0.0',
  description: 'Contact orchestrator module for workflow management',
  author: 'OSOT Development Team',
  supportedOperations: [
    'staging',
    'validation',
    'persistence',
    'bulk_processing',
    'session_management',
    'social_media_analysis',
    'professional_networking',
    'workflow_analytics',
  ],
  dependencies: {
    redis: 'Required for session state management',
    dataverse: 'Required for contact persistence',
    validation: 'Required for business rule enforcement',
  },
} as const;

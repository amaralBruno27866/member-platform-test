/**
 * Identity Orchestrator Module Exports
 *
 * Centralized export point for all identity orchestrator components.
 * This module provides orchestration services, interfaces, DTOs, and utilities
 * for managing complex identity workflows with cultural sensitivity and multi-language support.
 *
 * Architecture Overview:
 * - Interfaces: Define orchestrator contracts and cultural workflow structures
 * - DTOs: Data transfer objects for session management, cultural analysis, and workflow results
 * - Services: Demo implementations showing orchestrator patterns with cultural context
 * - Utilities: Helper functions for cultural workflow coordination
 *
 * Cultural Sensitivity Features:
 * - Indigenous identity detection and protocol respect
 * - Multi-language preference analysis and workflow support
 * - Cultural consistency validation and demographic tracking
 * - User Business ID validation with cultural context preservation
 *
 * Usage:
 * ```typescript
 * import {
 *   IdentityOrchestrator,
 *   IdentityStagingResult,
 *   CulturalValidationResult,
 *   IdentityOrchestratorDemoService
 * } from './orchestrator';
 *
 * // Using the orchestrator interface
 * const orchestrator: IdentityOrchestrator = new IdentityOrchestratorDemoService(redisService);
 *
 * // Stage identity with cultural analysis
 * const stagingResult = await orchestrator.stageIdentity(identityData, accountGuid, {
 *   culturalContext: 'indigenous_sensitive',
 *   preferredLanguage: 'english'
 * });
 *
 * // Perform cultural validation
 * const validationResult = await orchestrator.validateStagedIdentity(stagingResult.sessionId, {
 *   respectIndigenousProtocols: true
 * });
 * ```
 *
 * Key Orchestrator Components:
 *
 * 1. **Identity Orchestrator Interface**
 *    - Core orchestrator contract with cultural sensitivity methods
 *    - Staging, validation, persistence workflow coordination
 *    - Cultural analytics and demographic insights
 *    - Session management with cultural context
 *
 * 2. **Session Management DTOs**
 *    - IdentitySessionDto: Complete session state with cultural analysis
 *    - CulturalConsistencyAnalysisDto: Indigenous identity and cultural validation
 *    - IdentityCompletenessDto: Demographic completeness assessment
 *    - UserBusinessIdValidationDto: Business identity validation context
 *
 * 3. **Workflow Result DTOs**
 *    - IdentityStagingResultDto: Cultural staging outcomes
 *    - CulturalValidationResultDto: Cultural consistency validation results
 *    - IdentityCreationResultDto: Final identity creation with cultural context
 *    - BulkIdentityResultDto: Batch processing with demographic analytics
 *
 * 4. **Demo Service Implementation**
 *    - IdentityOrchestratorDemoService: Sample orchestrator implementation
 *    - Cultural analysis workflows and validation patterns
 *    - Redis session management with cultural state
 *    - Multi-language preference detection and handling
 *
 * Integration Notes:
 * - This orchestrator respects Indigenous cultural protocols and sensitivity
 * - All workflows support multi-language preferences and cultural context
 * - Session management includes cultural analysis state and demographic tracking
 * - Bulk operations provide comprehensive demographic analytics and reporting
 * - User Business ID validation preserves cultural identity markers
 */

// ==========================================
// CORE INTERFACES
// ==========================================
export {
  IdentityOrchestrator,
  IdentityStagingResult,
  CulturalValidationResult,
  IdentityPersistenceResult,
  BulkIdentityProgress,
  IdentitySessionState,
  CulturalConsistencyAnalysisResult,
  MultiLanguagePreferenceAnalysis,
  UserBusinessIdValidationInsights,
} from './interfaces/identity-orchestrator.interface';

// ==========================================
// SESSION MANAGEMENT DTOS
// ==========================================
export {
  IdentitySessionDto,
  CulturalConsistencyAnalysisDto,
  IdentityCompletenessDto,
  UserBusinessIdValidationDto,
} from './dto/identity-session.dto';

// ==========================================
// WORKFLOW RESULT DTOS
// ==========================================
export {
  BaseWorkflowResultDto,
  IdentityStagingResultDto,
  CulturalValidationResultDto,
  IdentityCreationResultDto,
  BulkIdentityResultDto,
  SessionCleanupResultDto,
} from './dto/workflow-results.dto';

// ==========================================
// SERVICE IMPLEMENTATIONS
// ==========================================
export { IdentityOrchestratorDemoService } from './services/identity-orchestrator-demo.service';

// ==========================================
// TYPE ALIASES AND CONSTANTS
// ==========================================

/**
 * Cultural validation status types
 */
export type CulturalValidationStatus =
  | 'culturally_validated'
  | 'cultural_validation_failed'
  | 'requires_cultural_review';

/**
 * Identity workflow step types with cultural context
 */
export type IdentityWorkflowStep =
  | 'staging'
  | 'cultural_validation'
  | 'persistence'
  | 'completed'
  | 'failed';

/**
 * Cultural sensitivity flag types
 */
export type CulturalSensitivityFlag =
  | 'indigenous_identity_detected'
  | 'cultural_terminology_review_needed'
  | 'traditional_name_preservation_required'
  | 'cultural_protocol_consultation_needed'
  | 'multi_language_support_required'
  | 'demographic_analysis_required';

/**
 * Completeness assessment levels
 */
export type CompletenessLevel =
  | 'minimal'
  | 'basic'
  | 'comprehensive'
  | 'complete';

/**
 * User Business ID validation status types
 */
export type UserBusinessIdValidationStatus =
  | 'unique'
  | 'duplicate'
  | 'similar'
  | 'invalid_format';

/**
 * Default configuration constants
 */
export const IDENTITY_ORCHESTRATOR_CONSTANTS = {
  DEFAULT_SESSION_TTL: 7200, // 2 hours in seconds
  CULTURAL_CONSISTENCY_THRESHOLD: 70, // Minimum score for cultural validation
  MAX_LANGUAGE_PREFERENCES: 10, // Maximum languages per identity
  DEMOGRAPHIC_COMPLETENESS_THRESHOLD: 75, // Minimum for 'comprehensive' level
  BULK_PROCESSING_BATCH_SIZE: 50, // Default batch size for bulk operations
  SESSION_CLEANUP_INTERVAL: 3600, // 1 hour in seconds
} as const;

/**
 * Cultural sensitivity configuration
 */
export const CULTURAL_SENSITIVITY_CONFIG = {
  INDIGENOUS_IDENTITY_MARKERS: [
    'aboriginal',
    'indigenous',
    'first nation',
    'first nations',
    'métis',
    'metis',
    'inuit',
    'native',
    'tribal',
  ],
  TRADITIONAL_NAME_PATTERNS: [
    /^[A-Z][a-z]+ [A-Z][a-z]+-[A-Z][a-z]+$/, // Hyphenated surnames
    /^[A-Z][a-z]+\s+(of|from|from the|of the)\s+[A-Z]/, // Traditional place names
  ],
  CULTURAL_PROTOCOL_REQUIRED_FIELDS: [
    'osot_indigenous',
    'osot_indigenous_detail',
    'osot_indigenous_detail_other',
  ],
  LANGUAGE_FAMILY_MAPPINGS: {
    // Indigenous language families in Canada
    algonquian: ['cree', 'ojibwe', 'blackfoot', 'mikmaq'],
    athapaskan: ['dene', 'chipewyan', 'gwich_in'],
    inuktitut: ['inuktitut', 'inuinnaqtun'],
    iroquoian: ['mohawk', 'oneida', 'cayuga'],
    siouan: ['dakota', 'nakoda', 'lakota'],
  },
} as const;

/**
 * Multi-language support configuration
 */
export const MULTI_LANGUAGE_CONFIG = {
  OFFICIAL_LANGUAGES: ['english', 'french'],
  INDIGENOUS_LANGUAGES_CANADA: [
    'cree',
    'inuktitut',
    'ojibwe',
    'dene',
    'mikmaq',
    'blackfoot',
    'mohawk',
    'dakota',
    'gwich_in',
    'inuinnaqtun',
  ],
  HERITAGE_LANGUAGES_COMMON: [
    'mandarin',
    'cantonese',
    'punjabi',
    'spanish',
    'arabic',
    'tagalog',
    'italian',
    'german',
    'portuguese',
    'korean',
  ],
  LANGUAGE_DIVERSITY_THRESHOLD: 3, // Considered highly multilingual
} as const;

/**
 * Export configuration objects for easy access
 */
export const IDENTITY_ORCHESTRATOR_CONFIG = {
  ...IDENTITY_ORCHESTRATOR_CONSTANTS,
  CULTURAL_SENSITIVITY: CULTURAL_SENSITIVITY_CONFIG,
  MULTI_LANGUAGE: MULTI_LANGUAGE_CONFIG,
} as const;

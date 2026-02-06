import { CreateAddressDto } from '../../dtos/address-create.dto';
import { AddressResponseDto } from '../../dtos/address-response.dto';
import { Privilege } from '../../../../../common/enums/privilege.enum';
import {
  AddressStageRequest,
  AddressStageResponse,
} from '../dto/address-session.dto';
import {
  AddressWorkflowResult,
  AddressValidationResult,
  AddressLinkingResult,
  AddressCreationResult,
  AddressSessionResponse,
  AddressBulkOperationResult,
} from '../dto/address-workflow-results.dto';

/**
 * Address Orchestrator Integration Contracts
 *
 * These interfaces define the contract between the Address module and
 * the future Registration Orchestrator that will be built.
 *
 * The Address module provides all necessary services (AddressCrudService,
 * AddressBusinessRulesService, etc.) but the orchestrator is responsible for:
 * - Session management in Redis
 * - Address validation workflows
 * - Geographic validation processes
 * - Account linking coordination
 */

// ========================================
// ORCHESTRATOR INTERFACE CONTRACT
// ========================================

/**
 * Interface that the future orchestrator must implement
 * for address registration workflows
 */
export interface AddressOrchestrator {
  /**
   * Stage address registration data in Redis
   *
   * @param request Address staging request with data and options
   * @returns Address registration session information
   *
   * Implementation should:
   * 1. Validate using AddressBusinessRulesService.validateAddressCreation()
   * 2. Perform postal code validation by province
   * 3. Store in Redis with key: address_session:{sessionId}
   * 4. Set TTL (suggested: 24 hours)
   * 5. Emit AddressStageEvent via AddressEventsService
   */
  stageAddressRegistration(
    request: AddressStageRequest,
  ): Promise<AddressStageResponse>;

  /**
   * Validate address format and geographic data
   *
   * @param sessionId Address session ID
   * @returns Validation result with standardization
   *
   * Implementation should:
   * 1. Use AddressBusinessRulesService for format validation
   * 2. Validate postal code patterns by province
   * 3. Standardize address format
   * 4. Update session with validation results
   * 5. Handle validation errors with structured responses
   */
  validateAddress(sessionId: string): Promise<AddressValidationResult>;

  /**
   * Perform geographic validation and geocoding
   *
   * @param sessionId Address session ID
   * @returns Geocoding result with coordinates
   *
   * Implementation should:
   * 1. Use AddressLookupService for geographic validation
   * 2. Obtain coordinates if possible
   * 3. Validate province/city combinations
   * 4. Update session with geocoding results
   * 5. Handle geographic service errors gracefully
   */
  geocodeAddress(sessionId: string): Promise<AddressValidationResult>;

  /**
   * Link address to account with validation
   *
   * @param sessionId Address session ID
   * @param accountId Account to link to
   * @param userPrivilege User's privilege level for validation
   * @returns Account linking result
   *
   * Implementation should:
   * 1. Validate account exists and user has access
   * 2. Check user business ID consistency
   * 3. Validate privilege level for operation
   * 4. Update session with linking information
   * 5. Use structured error handling for validation failures
   */
  linkToAccount(
    sessionId: string,
    accountId: string,
    userPrivilege: Privilege,
  ): Promise<AddressLinkingResult>;

  /**
   * Create address in Dataverse after validation
   *
   * @param sessionId Address session ID
   * @param userRole User role for permission validation
   * @returns Address creation result
   *
   * Implementation should:
   * 1. Use AddressCrudService.create() with appropriate role
   * 2. Include structured error handling
   * 3. Apply business rule validation
   * 4. Handle Dataverse integration errors
   * 5. Emit AddressCreatedEvent via AddressEventsService
   */
  persistAddress(
    sessionId: string,
    userRole: string,
  ): Promise<AddressCreationResult>;

  /**
   * Get complete workflow status for session
   *
   * @param sessionId Address session ID
   * @returns Complete workflow status and next steps
   *
   * Implementation should:
   * 1. Retrieve session from Redis
   * 2. Calculate current progress state
   * 3. Determine next recommended action
   * 4. Include all relevant validation results
   * 5. Handle session expiration gracefully
   */
  getWorkflowStatus(sessionId: string): Promise<AddressWorkflowResult>;

  /**
   * Query session data with full context
   *
   * @param sessionId Address session ID
   * @returns Session data with workflow information
   *
   * Implementation should:
   * 1. Retrieve complete session data
   * 2. Include validation and progress states
   * 3. Calculate workflow recommendations
   * 4. Handle missing or expired sessions
   * 5. Use structured error responses
   */
  getSession(sessionId: string): Promise<AddressSessionResponse>;

  /**
   * Clean up expired sessions
   *
   * @returns Cleanup operation result
   *
   * Implementation should:
   * 1. Query Redis for expired address sessions
   * 2. Remove expired session data
   * 3. Log cleanup operations for monitoring
   * 4. Handle Redis connection errors
   * 5. Return cleanup statistics
   */
  cleanupExpiredSessions(): Promise<{
    cleaned: number;
    errors: number;
    details: string[];
  }>;

  /**
   * Handle bulk address operations
   *
   * @param requests Array of address staging requests
   * @returns Bulk operation results
   *
   * Implementation should:
   * 1. Process each request individually
   * 2. Handle partial failures gracefully
   * 3. Maintain transaction consistency where possible
   * 4. Provide detailed error reporting
   * 5. Support rollback on critical failures
   */
  bulkStageAddresses(
    requests: AddressStageRequest[],
  ): Promise<AddressBulkOperationResult>;
}

// ========================================
// SERVICE INTEGRATION SPECIFICATIONS
// ========================================

/**
 * How the orchestrator should use Address services
 */
export interface AddressServiceIntegration {
  /**
   * Address CRUD Operations
   */
  crud: {
    // Use AddressCrudService.create() for persistence
    create: (
      data: CreateAddressDto,
      role: string,
    ) => Promise<AddressResponseDto>;

    // Use AddressCrudService.findOne() for lookups
    findOne: (id: string, role: string) => Promise<AddressResponseDto | null>;

    // Use AddressCrudService.update() for modifications
    update: (
      id: string,
      data: Partial<CreateAddressDto>,
      role: string,
    ) => Promise<AddressResponseDto>;

    // Use AddressCrudService.remove() for soft deletion
    remove: (id: string, role: string) => Promise<boolean>;
  };

  /**
   * Address Lookup Operations
   */
  lookup: {
    // Use AddressLookupService.findByPostalCode()
    findByPostalCode: (
      code: string,
      role: string,
    ) => Promise<AddressResponseDto[]>;

    // Use AddressLookupService.findByUserBusinessId()
    findByUserBusinessId: (
      businessId: string,
      role: string,
    ) => Promise<AddressResponseDto[]>;

    // Use AddressLookupService.findByAccountId()
    findByAccountId: (
      accountId: string,
      role: string,
    ) => Promise<AddressResponseDto[]>;
  };

  /**
   * Address Business Rules
   */
  businessRules: {
    // Use AddressBusinessRulesService.validateAddressCreation()
    validateCreation: (
      data: CreateAddressDto,
      role: string,
    ) => {
      isValid: boolean;
      errors: string[];
    };

    // Use AddressBusinessRulesService.standardizeAddress()
    standardize: (data: CreateAddressDto) => CreateAddressDto;

    // Use AddressBusinessRulesService.validatePostalCodeByProvince()
    validatePostalCode: (code: string, province: string) => boolean;
  };

  /**
   * Address Events
   */
  events: {
    // Use AddressEventsService.emitAddressStaged()
    emitStaged: (sessionId: string, data: CreateAddressDto) => void;

    // Use AddressEventsService.emitAddressValidated()
    emitValidated: (sessionId: string, result: AddressValidationResult) => void;

    // Use AddressEventsService.emitAddressCreated()
    emitCreated: (addressId: string, data: AddressResponseDto) => void;
  };
}

// ========================================
// ERROR HANDLING SPECIFICATIONS
// ========================================

/**
 * Standardized error codes for address orchestration
 */
export enum AddressOrchestrationErrorCodes {
  SESSION_NOT_FOUND = 'ADDRESS_SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'ADDRESS_SESSION_EXPIRED',
  VALIDATION_FAILED = 'ADDRESS_VALIDATION_FAILED',
  GEOCODING_FAILED = 'ADDRESS_GEOCODING_FAILED',
  ACCOUNT_LINKING_FAILED = 'ADDRESS_ACCOUNT_LINKING_FAILED',
  PERSISTENCE_FAILED = 'ADDRESS_PERSISTENCE_FAILED',
  PRIVILEGE_INSUFFICIENT = 'ADDRESS_PRIVILEGE_INSUFFICIENT',
  REDIS_ERROR = 'ADDRESS_REDIS_ERROR',
  DATAVERSE_ERROR = 'ADDRESS_DATAVERSE_ERROR',
}

/**
 * Redis session key patterns for address orchestration
 */
export const AddressSessionKeys = {
  SESSION: (sessionId: string) => `address_session:${sessionId}`,
  USER_SESSIONS: (userBusinessId: string) =>
    `user_address_sessions:${userBusinessId}`,
  VALIDATION_CACHE: (hash: string) => `address_validation:${hash}`,
  GEOCODING_CACHE: (hash: string) => `address_geocoding:${hash}`,
} as const;

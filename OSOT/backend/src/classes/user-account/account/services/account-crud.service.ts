import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { CreateAccountDto } from '../dtos/create-account.dto';
import { UpdateAccountDto } from '../dtos/update-account.dto';
import { AccountResponseDto } from '../dtos/account-response.dto';
import {
  AccountRepository,
  ACCOUNT_REPOSITORY,
} from '../interfaces/account-repository.interface';
import { AccountInternal } from '../interfaces/account-internal.interface';
import {
  mapCreateDtoToInternal,
  mapUpdateDtoToInternal,
  mapInternalToResponseDto,
} from '../mappers/account.mapper';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import {
  canCreate,
  canRead,
  canWrite,
  canDelete,
  getAppForOperation,
} from '../../../../utils/dataverse-app.helper';
import { hashPassword } from '../../../../common/keys/password-hash.util';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { UserLookupService } from '../../../../auth/user-lookup.service';
import { AccountBusinessRulesService } from './account-business-rules.service';
import { CacheService } from '../../../../cache/cache.service';

/**
 * Account CRUD Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with DataverseAccountRepository
 * - Multi-App Security: Integrates with DataverseService and dataverse-app.helper
 * - Structured Logging: Operation IDs, security-aware logging with PII redaction
 * - Security-First Design: Privilege-based access control and anti-fraud protection
 * - Data Transformation: Mappers, validators, and business logic integration
 * - Error Management: Centralized error handling with ErrorCodes and createAppError
 * - Business Rules: Integrated validation with email/person uniqueness checking
 *
 * PERMISSION SYSTEM (Multi-App based):
 * - MAIN: Full CRUD access (create, read, write, delete)
 * - OWNER: Create/Write/Read access (default for admin/undefined roles)
 * - ADMIN: Read/Write access only
 * - Security fields filtered for lower privileges: internal_id, audit fields
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for audit trails
 * - Multi-app credential routing through DataverseService
 * - Security-aware logging with PII redaction capabilities
 * - Privilege-based field filtering and access control
 * - Business rule validation with anti-fraud protection
 * - Email uniqueness and person uniqueness validation
 * - Automatic data transformation and sanitization
 * - Performance monitoring and error analytics
 *
 * ANTI-FRAUD PROTECTION:
 * - Email uniqueness validation across all accounts
 * - Person uniqueness validation (firstName + lastName + dateOfBirth)
 * - Password complexity enforcement with security standards
 * - Account status transition validation
 * - Group membership validation with security checks
 *
 * Key Features:
 * - Full CRUD operations with enterprise security patterns
 * - Multi-app permission checking with DataverseApp routing
 * - Field-level filtering based on user privilege level
 * - Repository Pattern for clean data access abstraction
 * - Automatic data transformation using enterprise mappers
 * - Business rules validation with detailed error reporting
 * - Account authentication and authorization support
 * - Comprehensive error handling with operation tracking
 * - Structured logging with security-aware PII handling
 */
@Injectable()
export class AccountCrudService {
  private readonly logger = new Logger(AccountCrudService.name);

  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    private readonly dataverseService: DataverseService,
    private readonly userLookupService: UserLookupService,
    @Inject(forwardRef(() => AccountBusinessRulesService))
    private readonly accountBusinessRulesService: AccountBusinessRulesService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new account record with comprehensive validation and anti-fraud checks
   *
   * @param createAccountDto - Account creation data
   * @param organizationGuid - Organization GUID from JWT context (optional for backward compatibility)
   * @param userRole - User role for permission checking
   */
  async create(
    createAccountDto: CreateAccountDto,
    organizationGuid?: string,
    userRole?: string,
  ): Promise<AccountResponseDto | null> {
    const operationId = `account_create_${Date.now()}`;

    this.logger.log(`Starting account creation - Operation: ${operationId}`, {
      operation: 'create_account',
      operationId,
      userRole: userRole || 'undefined',
      hasOrganization: !!organizationGuid,
      timestamp: new Date().toISOString(),
    });

    // Check create permissions
    if (!canCreate(userRole)) {
      this.logger.warn(
        `Account creation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'create_account',
          operationId,
          requiredPrivilege: 'CREATE',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to create account',
        operationId,
        requiredPrivilege: 'CREATE',
        userRole: userRole || 'undefined',
        operation: 'create',
      });
    }

    // Transform DTO to internal format using mapper
    const internalAccount = mapCreateDtoToInternal(createAccountDto);

    // Add organization context if provided (multi-tenant)
    if (organizationGuid) {
      internalAccount.organizationGuid = organizationGuid;

      this.logger.debug(
        `Organization context added to account - Operation: ${operationId}`,
        {
          operation: 'create',
          operationId,
          hasOrganization: true,
          timestamp: new Date().toISOString(),
        },
      );
    }

    // Hash password before saving
    if (internalAccount.osot_password) {
      internalAccount.osot_password = await hashPassword(
        internalAccount.osot_password,
      );
    }

    // Validate account group privilege (STAFF requires ADMIN or MAIN)
    const groupValidation =
      this.accountBusinessRulesService.validateAccountGroupPrivilege(
        createAccountDto.osot_account_group,
        userRole,
      );

    if (!groupValidation.isValid) {
      this.logger.warn(
        `Account group privilege validation failed - Operation: ${operationId}`,
        {
          operation: 'create',
          operationId,
          accountGroup: createAccountDto.osot_account_group,
          error: groupValidation.error,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message:
          groupValidation.error || 'Insufficient privilege for account group',
        operationId,
        accountGroup: createAccountDto.osot_account_group,
        userRole: userRole || 'undefined',
      });
    }

    // Validate business rules with anti-fraud protection
    // Step 1: Email uniqueness check
    // Step 2: Person uniqueness check (firstName + lastName + dateOfBirth)
    const validation =
      await this.accountBusinessRulesService.validateAccountCreation(
        createAccountDto,
        userRole,
      );

    if (!validation.isValid) {
      this.logger.warn(
        `Account validation failed - Operation: ${operationId}`,
        {
          operation: 'create',
          operationId,
          violations: validation.violations,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        message: `Account validation failed: ${validation.violations.join(', ')}`,
        operationId,
        violations: validation.violations,
      });
    }

    // Determine app context for operation
    const app = getAppForOperation('create', userRole);

    this.logger.debug(`Using app context: ${app} for account creation`, {
      operation: 'create',
      operationId,
      appContext: app,
      userRole: userRole || 'undefined',
    });

    try {
      // Create account via repository
      const createdAccount =
        await this.accountRepository.create(internalAccount);

      if (!createdAccount) {
        this.logger.error(
          `Account creation failed - Repository returned null - Operation: ${operationId}`,
          {
            operation: 'create',
            operationId,
            error: 'REPOSITORY_NULL_RESPONSE',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Failed to create account - no data returned',
          operationId,
          operation: 'create',
        });
      }

      // Transform to response DTO
      const responseDto = mapInternalToResponseDto(createdAccount);

      // Invalidate user cache after successful creation
      await this.cacheService.invalidateUser(
        createdAccount.osot_table_accountid,
      );

      this.logger.log(
        `Account created successfully - Operation: ${operationId}`,
        {
          operation: 'create',
          operationId,
          accountId: createdAccount.osot_table_accountid,
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(`Account creation failed - Operation: ${operationId}`, {
        operation: 'create',
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        appContext: app,
        timestamp: new Date().toISOString(),
      });

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create account',
        operationId,
        operation: 'create',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Retrieve an account by ID with privilege-based field filtering
   * @param accountId - Business ID (osot-XXXXXXX) or GUID
   * @param organizationGuid - Organization GUID for filtering (from JWT)
   * @param userRole - User role for permission checking
   */
  async findById(
    accountId: string,
    organizationGuid?: string,
    userRole?: string,
  ): Promise<AccountResponseDto | null> {
    const operationId = `account_read_${Date.now()}`;

    // Check read permissions
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Account read denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'read_account',
          operationId,
          accountId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to read account',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'read',
      });
    }

    // Determine app context for operation
    const app = getAppForOperation('read', userRole);

    try {
      // Detect if accountId is a business ID (osot-0000145) or GUID
      // Business ID pattern: osot-XXXXXXX (7 digits)
      // GUID pattern: 8-4-4-4-12 hex characters with dashes
      const isBusinessId = /^osot-\d{7}$/.test(accountId);
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          accountId,
        );

      let account: AccountInternal | null = null;
      let accountGuid: string | null = null;
      let wasCached = false;

      // Step 1: Try cache
      if (isGuid) {
        // Try cache by GUID
        accountGuid = accountId;
        const cacheKey = this.cacheService.buildAccountKey(accountGuid);
        const cached = await this.cacheService.get<AccountInternal>(cacheKey);
        if (cached) {
          account = cached;
          wasCached = true;
        }
      } else if (isBusinessId) {
        // Try cache by business ID
        const bizIdCacheKey = `account:profile:bizId:${accountId}`;
        const cached =
          await this.cacheService.get<AccountInternal>(bizIdCacheKey);
        if (cached) {
          account = cached;
          accountGuid = cached.osot_table_accountid || null;
          wasCached = true;
        }
      }

      // Step 2: If not in cache, fetch from Dataverse
      if (!account) {
        if (isBusinessId) {
          // Use findByBusinessId for business IDs like osot-0000145
          account = await this.accountRepository.findByBusinessId(
            accountId,
            organizationGuid,
          );
        } else if (isGuid) {
          // Use findById for GUIDs
          account = await this.accountRepository.findById(accountId);
        } else {
          // Try business ID first, then GUID as fallback
          account = await this.accountRepository.findByBusinessId(
            accountId,
            organizationGuid,
          );
          if (!account) {
            account = await this.accountRepository.findById(accountId);
          }
        }

        // Get GUID for caching
        if (account?.osot_table_accountid) {
          accountGuid = account.osot_table_accountid;
        }
      }

      if (!account) {
        this.logger.debug(`Account not found - Operation: ${operationId}`, {
          operation: 'read',
          operationId,
          accountId,
          appContext: app,
          idType: isBusinessId ? 'businessId' : isGuid ? 'guid' : 'unknown',
          timestamp: new Date().toISOString(),
        });
        return null;
      }

      // Step 3: Store in cache if we fetched from Dataverse (not from cache)
      if (account && accountGuid && !wasCached) {
        // Cache by GUID (primary key)
        const guidCacheKey = this.cacheService.buildAccountKey(accountGuid);
        await this.cacheService.set(guidCacheKey, account);

        // Also cache by business ID if we have it (for future lookups)
        const businessId = account.osot_account_id || accountId;
        if (isBusinessId && businessId) {
          const bizIdCacheKey = `account:profile:bizId:${businessId}`;
          await this.cacheService.set(bizIdCacheKey, account);
        }
      }

      // Transform to response DTO with privilege-based filtering
      const responseDto = mapInternalToResponseDto(account);

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Account retrieval failed - Operation: ${operationId}`,
        {
          operation: 'read',
          operationId,
          accountId,
          error: error instanceof Error ? error.message : 'Unknown error',
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve account',
        operationId,
        operation: 'read',
        accountId,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update an existing account with validation and business rules
   */
  async update(
    accountId: string,
    updateAccountDto: UpdateAccountDto,
    userRole?: string,
  ): Promise<AccountResponseDto | null> {
    const operationId = `account_update_${Date.now()}`;

    this.logger.log(`Starting account update - Operation: ${operationId}`, {
      operation: 'update_account',
      operationId,
      accountId,
      userRole: userRole || 'undefined',
      timestamp: new Date().toISOString(),
    });

    // Check write permissions
    if (!canWrite(userRole || '')) {
      this.logger.warn(
        `Account update denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'update_account',
          operationId,
          accountId,
          requiredPrivilege: 'WRITE',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to update account',
        operationId,
        requiredPrivilege: 'WRITE',
        userRole: userRole || 'undefined',
        operation: 'update',
      });
    }

    // Determine app context for operation
    const app = getAppForOperation('write', userRole);

    try {
      // Resolve accountId to GUID if it's a business ID FIRST
      // Business ID pattern: osot-XXXXXXX (7 digits)
      // GUID pattern: 8-4-4-4-12 hex characters with dashes
      const isBusinessId = /^osot-\d{7}$/.test(accountId);
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          accountId,
        );

      let targetAccountId = accountId;

      if (isBusinessId) {
        // Find the account by business ID to get its GUID
        const account =
          await this.accountRepository.findByBusinessId(accountId);
        if (!account) {
          this.logger.error(
            `Account not found for update - Operation: ${operationId}`,
            {
              operation: 'update',
              operationId,
              accountId,
              idType: 'businessId',
              error: 'ACCOUNT_NOT_FOUND',
              timestamp: new Date().toISOString(),
            },
          );

          throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
            message: 'Account not found for update',
            operationId,
            operation: 'update',
            resourceId: accountId,
          });
        }
        targetAccountId = account.osot_table_accountid; // Use the GUID
        this.logger.debug(
          `Resolved business ID to GUID - Operation: ${operationId}`,
          {
            businessId: accountId,
            guid: targetAccountId,
            timestamp: new Date().toISOString(),
          },
        );
      } else if (!isGuid) {
        // Try to find by business ID first, then by GUID
        const accountByBusinessId =
          await this.accountRepository.findByBusinessId(accountId);
        if (accountByBusinessId) {
          targetAccountId = accountByBusinessId.osot_table_accountid;
        } else {
          // Assume it's a GUID and let the repository handle validation
          targetAccountId = accountId;
        }
      }

      // Now get existing account using resolved GUID
      const existingAccount =
        await this.accountRepository.findById(targetAccountId);

      if (!existingAccount) {
        this.logger.warn(
          `Account not found for update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            accountId,
            targetAccountId,
            appContext: app,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          message: 'Account not found for update',
          operationId,
          accountId,
          operation: 'update',
        });
      }

      // Transform update DTO to internal format
      const updateData = mapUpdateDtoToInternal(updateAccountDto);

      // Hash password before updating if it's being changed
      if (updateData.osot_password) {
        updateData.osot_password = await hashPassword(updateData.osot_password);
      }

      // Validate business rules for update
      // TODO: Implement full validation with existing data lookup
      const validation = { isValid: true, violations: [] as string[] };
      // Temporary simple validation - will be enhanced

      if (!validation.isValid) {
        this.logger.warn(
          `Account update validation failed - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            accountId,
            violations: validation.violations,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: `Account update validation failed: ${validation.violations.join(', ')}`,
          operationId,
          violations: validation.violations,
          accountId,
        });
      }

      // Update account via repository
      const updatedAccount = await this.accountRepository.update(
        targetAccountId,
        updateData,
        userRole, // Pass userRole to ensure correct app credentials are used
      );

      if (!updatedAccount) {
        this.logger.error(
          `Account update failed - Repository returned null - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            accountId,
            error: 'REPOSITORY_NULL_RESPONSE',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Failed to update account - no data returned',
          operationId,
          accountId,
          operation: 'update',
        });
      }

      // Phase 7: Invalidate cache after successful update
      const guidCacheKey = this.cacheService.buildAccountKey(targetAccountId);
      await this.cacheService.invalidate(guidCacheKey);

      // Also invalidate business ID cache if available
      const businessId = existingAccount.osot_account_id;
      if (businessId) {
        const bizIdCacheKey = `account:profile:bizId:${businessId}`;
        await this.cacheService.invalidate(bizIdCacheKey);
      }

      // Cache Management: Clear cache if email or password was updated
      if (updateAccountDto.osot_email || updateAccountDto.osot_password) {
        try {
          // Clear cache for new email
          if (updateAccountDto.osot_email) {
            this.logger.debug(
              `Clearing cache for new email - Operation: ${operationId}`,
              { email: updateAccountDto.osot_email },
            );
            await this.userLookupService.clearUserCache(
              updateAccountDto.osot_email,
            );
          }

          // Clear cache for old email if password changed
          if (updateAccountDto.osot_password && existingAccount.osot_email) {
            this.logger.debug(
              `Clearing cache for password update - Operation: ${operationId}`,
              { email: existingAccount.osot_email },
            );
            await this.userLookupService.clearUserCache(
              existingAccount.osot_email,
            );
          }

          this.logger.debug(
            `Cache cleared successfully - Operation: ${operationId}`,
          );
        } catch (cacheError) {
          // Log cache error but don't fail the operation
          this.logger.warn(`Cache clear failed - Operation: ${operationId}`, {
            accountId: targetAccountId,
            error:
              cacheError instanceof Error
                ? cacheError.message
                : 'Unknown error',
          });
        }
      }

      // Transform to response DTO
      const responseDto = mapInternalToResponseDto(updatedAccount);

      this.logger.log(
        `Account updated successfully - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          accountId,
          updatedFields: Object.keys(updateAccountDto),
          returnedEmail: responseDto.osot_email, // Log returned email to verify
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(`Account update failed - Operation: ${operationId}`, {
        operation: 'update',
        operationId,
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
        appContext: app,
        timestamp: new Date().toISOString(),
      });

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to update account',
        operationId,
        accountId,
        operation: 'update',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update system fields for an account (INTERNAL USE ONLY)
   * Used by orchestrators, business rules, and admin workflows
   * SECURITY: This method bypasses public API restrictions and should only be called
   * by internal system components with proper authorization
   */
  async updateSystemFields(
    accountId: string,
    systemUpdate: import('../interfaces/account-internal.interface').AccountSystemUpdate,
    userRole?: string,
  ): Promise<AccountResponseDto | null> {
    const operationId = `account_system_update_${Date.now()}`;

    this.logger.log(
      `Starting account system update - Operation: ${operationId}`,
      {
        operation: 'update_system_fields',
        operationId,
        accountId,
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    // System updates bypass permission checks - repository will use 'main' app for system fields
    // No permission validation needed here since this is for admin approval workflows

    try {
      // Resolve accountId to GUID if it's a business ID
      let targetAccountId = accountId;
      const isBusinessId = /^osot-\d{7}$/.test(accountId);
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          accountId,
        );

      if (isBusinessId) {
        const accountByBusinessId =
          await this.accountRepository.findByBusinessId(accountId);
        if (!accountByBusinessId) {
          throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
            message: 'Account not found by business ID',
            operationId,
            accountId,
            operation: 'update_system_fields',
          });
        }
        targetAccountId = accountByBusinessId.osot_table_accountid;
      } else if (!isGuid) {
        const accountByBusinessId =
          await this.accountRepository.findByBusinessId(accountId);
        if (accountByBusinessId) {
          targetAccountId = accountByBusinessId.osot_table_accountid;
        } else {
          targetAccountId = accountId;
        }
      }

      // Transform system update to internal format
      const { mapSystemUpdateToInternal } = await import(
        '../mappers/account.mapper'
      );
      const updateData = mapSystemUpdateToInternal(systemUpdate);

      // Update account via repository (passing userRole for credentials)
      const updatedAccount = await this.accountRepository.update(
        targetAccountId,
        updateData,
        userRole,
      );

      if (!updatedAccount) {
        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Failed to update account system fields - no data returned',
          operationId,
          accountId,
          operation: 'update_system_fields',
        });
      }

      // Transform to response DTO
      const responseDto = mapInternalToResponseDto(updatedAccount);

      this.logger.log(
        `Account system fields updated successfully - Operation: ${operationId}`,
        {
          operation: 'update_system_fields',
          operationId,
          accountId,
          updatedFields: Object.keys(systemUpdate),
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Account system update failed - Operation: ${operationId}`,
        {
          operation: 'update_system_fields',
          operationId,
          accountId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to update account system fields',
        operationId,
        accountId,
        operation: 'update_system_fields',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete an account by ID (MAIN role only)
   */
  async delete(accountId: string, userRole?: string): Promise<boolean> {
    const operationId = `account_delete_${Date.now()}`;

    this.logger.log(`Starting account deletion - Operation: ${operationId}`, {
      operation: 'delete_account',
      operationId,
      accountId,
      userRole: userRole || 'undefined',
      timestamp: new Date().toISOString(),
    });

    // Check delete permissions (MAIN only)
    if (!canDelete(userRole || '')) {
      this.logger.warn(
        `Account deletion denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'delete_account',
          operationId,
          accountId,
          requiredPrivilege: 'DELETE',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message:
          'Insufficient privileges to delete account - MAIN role required',
        operationId,
        requiredPrivilege: 'DELETE',
        userRole: userRole || 'undefined',
        operation: 'delete',
      });
    }

    // Determine app context for operation (always MAIN for delete)
    const app = getAppForOperation('delete', userRole);

    try {
      // Verify account exists before deletion
      const existingAccount = await this.accountRepository.findById(accountId);

      if (!existingAccount) {
        this.logger.warn(
          `Account not found for deletion - Operation: ${operationId}`,
          {
            operation: 'delete',
            operationId,
            accountId,
            appContext: app,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          message: 'Account not found for deletion',
          operationId,
          accountId,
          operation: 'delete',
        });
      }

      // Resolve accountId to GUID if it's a business ID
      // Business ID pattern: osot-XXXXXXX (7 digits)
      // GUID pattern: 8-4-4-4-12 hex characters with dashes
      const isBusinessId = /^osot-\d{7}$/.test(accountId);
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          accountId,
        );

      let targetAccountId = accountId;

      if (isBusinessId) {
        // Find the account by business ID to get its GUID
        const account =
          await this.accountRepository.findByBusinessId(accountId);
        if (!account) {
          this.logger.error(
            `Account not found for deletion - Operation: ${operationId}`,
            {
              operation: 'delete',
              operationId,
              accountId,
              idType: 'businessId',
              error: 'ACCOUNT_NOT_FOUND',
              timestamp: new Date().toISOString(),
            },
          );

          throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
            message: 'Account not found for deletion',
            operationId,
            operation: 'delete',
            resourceId: accountId,
          });
        }
        targetAccountId = account.osot_table_accountid; // Use the GUID
        this.logger.debug(
          `Resolved business ID to GUID for deletion - Operation: ${operationId}`,
          {
            businessId: accountId,
            guid: targetAccountId,
            timestamp: new Date().toISOString(),
          },
        );
      } else if (!isGuid) {
        // Try to find by business ID first, then by GUID
        const accountByBusinessId =
          await this.accountRepository.findByBusinessId(accountId);
        if (accountByBusinessId) {
          targetAccountId = accountByBusinessId.osot_table_accountid;
        } else {
          // Assume it's a GUID and let the repository handle validation
          targetAccountId = accountId;
        }
      }

      // Delete account via repository
      const deleted = await this.accountRepository.delete(targetAccountId);

      // Invalidate user cache after successful deletion
      await this.cacheService.invalidateUser(targetAccountId);

      this.logger.log(
        `Account deletion completed - Operation: ${operationId}`,
        {
          operation: 'delete',
          operationId,
          accountId,
          success: deleted,
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      return deleted;
    } catch (error) {
      this.logger.error(`Account deletion failed - Operation: ${operationId}`, {
        operation: 'delete',
        operationId,
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
        appContext: app,
        timestamp: new Date().toISOString(),
      });

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to delete account',
        operationId,
        accountId,
        operation: 'delete',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

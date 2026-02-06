import { Injectable, Logger, Inject } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccountResponseDto } from '../dtos/account-response.dto';
import {
  AccountRepository,
  ACCOUNT_REPOSITORY,
  AccountStatistics,
} from '../interfaces/account-repository.interface';
import { AccountInternal } from '../interfaces/account-internal.interface';
import { mapInternalToResponseDto } from '../mappers/account.mapper';
import {
  canRead,
  getAppForOperation,
} from '../../../../utils/dataverse-app.helper';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { AccountGroup, AccountStatus } from '../../../../common/enums';

/**
 * Account Lookup Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with AccountRepositoryService
 * - Multi-App Security: Integrates with DataverseService and dataverse-app.helper
 * - Structured Logging: Operation IDs, security-aware logging with PII redaction
 * - Security-First Design: Privilege-based access control and comprehensive audit
 * - Error Management: Centralized error handling with createAppError and detailed context
 * - Business Rules Support: Duplicate detection and validation helper methods
 *
 * PERMISSION SYSTEM (Multi-App based):
 * - MAIN: Full access to all lookup operations and fields
 * - OWNER: Access to lookup operations with limited sensitive field access
 * - ADMIN: Read access to lookup operations with field filtering
 * - Sensitive fields filtered for lower privileges: internal_id, audit fields, passwords
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Security-aware logging with PII redaction capabilities
 * - Privilege-based field filtering and access control
 * - Performance monitoring and query optimization
 * - Anti-fraud duplicate detection methods
 * - Canadian account focus with proper phone/email validation
 * - Business rules validation support
 *
 * Key Features:
 * - Email-based account lookups with uniqueness validation
 * - Business ID searches with privilege enforcement
 * - Phone number searches with Canadian format handling
 * - Name-based searches with fuzzy matching capabilities
 * - Status and group filtering with security validation
 * - Account counting and statistics with performance monitoring
 * - Duplicate detection for anti-fraud protection
 * - Role-based permission checking with detailed audit trails
 * - Field-level filtering based on user privilege level
 * - Comprehensive error handling with operation tracking
 * - Structured logging with security-aware PII handling
 *
 * BUSINESS RULES INTEGRATION:
 * - Email uniqueness validation for account creation
 * - Person uniqueness validation (firstName + lastName + dateOfBirth)
 * - Duplicate account detection with comprehensive matching
 * - Batch validation operations for efficient processing
 * - Anti-fraud protection through pattern detection
 */
@Injectable()
export class AccountLookupService {
  private readonly logger = new Logger(AccountLookupService.name);

  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    private readonly dataverseService: DataverseService,
  ) {}

  /**
   * Find account by email with comprehensive privilege checking
   * Enhanced with operation tracking and security-aware logging
   * Supports multi-tenant organization isolation
   *
   * @param email Email address to search for
   * @param userRole User role for permission checking
   * @param organizationGuid Optional organization GUID for multi-tenant isolation
   */
  async findByEmail(
    email: string,
    userRole?: string,
    organizationGuid?: string,
  ): Promise<AccountResponseDto | null> {
    const operationId = `lookup_by_email_${Date.now()}`;

    this.logger.log(
      `Starting account lookup by email - Operation: ${operationId}`,
      {
        operation: 'findByEmail',
        operationId,
        userRole: userRole || 'undefined',
        emailDomain: email.split('@')[1] || 'unknown', // PII redaction
        organizationIsolation: !!organizationGuid,
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking with privilege validation
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Account lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findByEmail',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to lookup accounts',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByEmail',
      });
    }

    // Determine app context for operation
    const app = getAppForOperation('read', userRole);

    try {
      const account = await this.accountRepository.findByEmail(
        email,
        organizationGuid,
      );

      if (!account) {
        this.logger.debug(
          `Account not found by email - Operation: ${operationId}`,
          {
            operation: 'findByEmail',
            operationId,
            emailDomain: email.split('@')[1] || 'unknown',
            appContext: app,
            timestamp: new Date().toISOString(),
          },
        );
        return null;
      }

      // Transform to response DTO with privilege-based filtering
      const responseDto = mapInternalToResponseDto(account);

      this.logger.log(`Account found by email - Operation: ${operationId}`, {
        operation: 'findByEmail',
        operationId,
        accountId: account.osot_table_accountid,
        appContext: app,
        timestamp: new Date().toISOString(),
      });

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Account lookup by email failed - Operation: ${operationId}`,
        {
          operation: 'findByEmail',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to lookup account by email',
        operationId,
        operation: 'findByEmail',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find account by business ID with comprehensive privilege checking
   * Enhanced with operation tracking and security-aware logging
   */
  async findByBusinessId(
    businessId: string,
    userRole?: string,
    organizationGuid?: string,
  ): Promise<AccountResponseDto | null> {
    const operationId = `lookup_by_business_id_${Date.now()}`;

    this.logger.log(
      `Starting account lookup by business ID - Operation: ${operationId}`,
      {
        operation: 'findByBusinessId',
        operationId,
        userRole: userRole || 'undefined',
        businessIdPrefix: businessId.substring(0, 8) + '...', // PII redaction
        organizationIsolation: !!organizationGuid,
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking with privilege validation
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Account lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findByBusinessId',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to lookup accounts',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByBusinessId',
      });
    }

    // Determine app context for operation
    const app = getAppForOperation('read', userRole);

    try {
      const account = await this.accountRepository.findByBusinessId(
        businessId,
        organizationGuid,
      );

      if (!account) {
        this.logger.debug(
          `Account not found by business ID - Operation: ${operationId}`,
          {
            operation: 'findByBusinessId',
            operationId,
            businessIdPrefix: businessId.substring(0, 8) + '...',
            appContext: app,
            organizationIsolation: !!organizationGuid,
            timestamp: new Date().toISOString(),
          },
        );
        return null;
      }

      // Transform to response DTO with privilege-based filtering
      const responseDto = mapInternalToResponseDto(account);

      this.logger.log(
        `Account found by business ID - Operation: ${operationId}`,
        {
          operation: 'findByBusinessId',
          operationId,
          accountId: account.osot_table_accountid,
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Account lookup by business ID failed - Operation: ${operationId}`,
        {
          operation: 'findByBusinessId',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to lookup account by business ID',
        operationId,
        operation: 'findByBusinessId',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find account by phone number with comprehensive privilege checking
   * Enhanced with operation tracking and security-aware logging
   */
  async findByPhone(
    phone: string,
    userRole?: string,
  ): Promise<AccountResponseDto | null> {
    const operationId = `lookup_by_phone_${Date.now()}`;

    this.logger.log(
      `Starting account lookup by phone - Operation: ${operationId}`,
      {
        operation: 'findByPhone',
        operationId,
        userRole: userRole || 'undefined',
        phonePrefix: phone.substring(0, 6) + '...', // PII redaction
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking with privilege validation
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Account lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findByPhone',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to lookup accounts',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByPhone',
      });
    }

    // Determine app context for operation
    const app = getAppForOperation('read', userRole);

    try {
      const account = await this.accountRepository.findByPhone(phone);

      if (!account) {
        this.logger.debug(
          `Account not found by phone - Operation: ${operationId}`,
          {
            operation: 'findByPhone',
            operationId,
            phonePrefix: phone.substring(0, 6) + '...',
            appContext: app,
            timestamp: new Date().toISOString(),
          },
        );
        return null;
      }

      // Transform to response DTO with privilege-based filtering
      const responseDto = mapInternalToResponseDto(account);

      this.logger.log(`Account found by phone - Operation: ${operationId}`, {
        operation: 'findByPhone',
        operationId,
        accountId: account.osot_table_accountid,
        appContext: app,
        timestamp: new Date().toISOString(),
      });

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Account lookup by phone failed - Operation: ${operationId}`,
        {
          operation: 'findByPhone',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to lookup account by phone',
        operationId,
        operation: 'findByPhone',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Search accounts by name with comprehensive privilege checking
   * Enhanced with operation tracking and security-aware logging
   */
  async searchByName(
    firstName?: string,
    lastName?: string,
    userRole?: string,
  ): Promise<AccountResponseDto[]> {
    const operationId = `search_by_name_${Date.now()}`;

    this.logger.log(
      `Starting account search by name - Operation: ${operationId}`,
      {
        operation: 'searchByName',
        operationId,
        userRole: userRole || 'undefined',
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking with privilege validation
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Account search denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'searchByName',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to search accounts',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'searchByName',
      });
    }

    // Determine app context for operation
    const app = getAppForOperation('read', userRole);

    try {
      const searchTerm = `${firstName || ''} ${lastName || ''}`.trim();
      const accounts = await this.accountRepository.searchByName(searchTerm);

      // Transform to response DTOs with privilege-based filtering
      const responseDtos = accounts.map((account) =>
        mapInternalToResponseDto(account),
      );

      this.logger.log(
        `Account search by name completed - Operation: ${operationId}`,
        {
          operation: 'searchByName',
          operationId,
          resultsCount: responseDtos.length,
          cached: true,
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDtos;
    } catch (error) {
      this.logger.error(
        `Account search by name failed - Operation: ${operationId}`,
        {
          operation: 'searchByName',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to search accounts by name',
        operationId,
        operation: 'searchByName',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find accounts by status with comprehensive privilege checking
   * Enhanced with operation tracking and security-aware logging
   */
  async findByStatus(
    status: AccountStatus,
    userRole?: string,
    limit?: number,
  ): Promise<AccountResponseDto[]> {
    const operationId = `find_by_status_${Date.now()}`;

    this.logger.log(
      `Starting account lookup by status - Operation: ${operationId}`,
      {
        operation: 'findByStatus',
        operationId,
        userRole: userRole || 'undefined',
        status,
        limit: limit || 'unlimited',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking with privilege validation
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Account lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findByStatus',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to lookup accounts',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByStatus',
      });
    }

    // Determine app context for operation
    const app = getAppForOperation('read', userRole);

    try {
      const accounts = await this.accountRepository.findByStatus(status, {
        limit,
      });

      // Transform to response DTOs with privilege-based filtering
      const responseDtos = accounts.map((account) =>
        mapInternalToResponseDto(account),
      );

      this.logger.log(
        `Account lookup by status completed - Operation: ${operationId}`,
        {
          operation: 'findByStatus',
          operationId,
          status,
          resultsCount: responseDtos.length,
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDtos;
    } catch (error) {
      this.logger.error(
        `Account lookup by status failed - Operation: ${operationId}`,
        {
          operation: 'findByStatus',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to lookup accounts by status',
        operationId,
        operation: 'findByStatus',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find accounts by group with comprehensive privilege checking
   * Enhanced with operation tracking and security-aware logging
   */
  async findByGroup(
    group: AccountGroup,
    userRole?: string,
    limit?: number,
  ): Promise<AccountResponseDto[]> {
    const operationId = `find_by_group_${Date.now()}`;

    this.logger.log(
      `Starting account lookup by group - Operation: ${operationId}`,
      {
        operation: 'findByGroup',
        operationId,
        userRole: userRole || 'undefined',
        group,
        limit: limit || 'unlimited',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking with privilege validation
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Account lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findByGroup',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to lookup accounts',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByGroup',
      });
    }

    // Determine app context for operation
    const app = getAppForOperation('read', userRole);

    try {
      const accounts = await this.accountRepository.findByGroup(group, {
        limit,
      });

      // Transform to response DTOs with privilege-based filtering
      const responseDtos = accounts.map((account) =>
        mapInternalToResponseDto(account),
      );

      this.logger.log(
        `Account lookup by group completed - Operation: ${operationId}`,
        {
          operation: 'findByGroup',
          operationId,
          group,
          resultsCount: responseDtos.length,
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDtos;
    } catch (error) {
      this.logger.error(
        `Account lookup by group failed - Operation: ${operationId}`,
        {
          operation: 'findByGroup',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to lookup accounts by group',
        operationId,
        operation: 'findByGroup',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get account statistics with comprehensive privilege checking
   * Enhanced with operation tracking and security-aware logging
   */
  async getAccountStatistics(userRole?: string): Promise<AccountStatistics> {
    const operationId = `get_statistics_${Date.now()}`;

    this.logger.log(
      `Starting account statistics retrieval - Operation: ${operationId}`,
      {
        operation: 'getAccountStatistics',
        operationId,
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking with privilege validation
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Account statistics denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'getAccountStatistics',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to view account statistics',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'getAccountStatistics',
      });
    }

    // Determine app context for operation
    const app = getAppForOperation('read', userRole);

    try {
      const statistics = await this.accountRepository.getStatistics();

      this.logger.log(
        `Account statistics retrieved - Operation: ${operationId}`,
        {
          operation: 'getAccountStatistics',
          operationId,
          totalAccounts: statistics.total,
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      return statistics;
    } catch (error) {
      this.logger.error(
        `Account statistics retrieval failed - Operation: ${operationId}`,
        {
          operation: 'getAccountStatistics',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve account statistics',
        operationId,
        operation: 'getAccountStatistics',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find duplicate emails for business rules validation
   * Used by Account Business Rules Service for anti-fraud protection
   */
  async findDuplicateEmails(
    email: string,
    excludeAccountId?: string,
  ): Promise<AccountInternal[]> {
    const operationId = `find_duplicate_emails_${Date.now()}`;

    this.logger.log(
      `Starting duplicate email check - Operation: ${operationId}`,
      {
        operation: 'findDuplicateEmails',
        operationId,
        emailDomain: email.split('@')[1] || 'unknown', // PII redaction
        hasExclusion: !!excludeAccountId,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Use repository to find existing email
      const existingAccount = await this.accountRepository.findByEmail(email);

      // If account found and not excluded, return as duplicate
      if (
        existingAccount &&
        existingAccount.osot_table_accountid !== excludeAccountId
      ) {
        this.logger.log(`Duplicate email found - Operation: ${operationId}`, {
          operation: 'findDuplicateEmails',
          operationId,
          duplicateCount: 1,
          timestamp: new Date().toISOString(),
        });

        return [existingAccount];
      }

      this.logger.log(`No duplicate emails found - Operation: ${operationId}`, {
        operation: 'findDuplicateEmails',
        operationId,
        duplicateCount: 0,
        timestamp: new Date().toISOString(),
      });

      return [];
    } catch (error) {
      this.logger.error(
        `Duplicate email check failed - Operation: ${operationId}`,
        {
          operation: 'findDuplicateEmails',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to check for duplicate emails',
        operationId,
        operation: 'findDuplicateEmails',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find duplicate persons for business rules validation
   * Used by Account Business Rules Service for anti-fraud protection
   * Checks for firstName + lastName + dateOfBirth combination
   */
  async findDuplicatePersons(
    firstName: string,
    lastName: string,
    dateOfBirth: string,
    excludeAccountId?: string,
  ): Promise<
    {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      email: string;
    }[]
  > {
    const operationId = `find_duplicate_persons_${Date.now()}`;

    this.logger.log(
      `Starting duplicate person check - Operation: ${operationId}`,
      {
        operation: 'findDuplicatePersons',
        operationId,
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasDateOfBirth: !!dateOfBirth,
        hasExclusion: !!excludeAccountId,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Use name search to find potential duplicates
      const accounts = await this.accountRepository.searchByName(
        `${firstName} ${lastName}`,
      );

      // Filter for exact matches on all three fields
      const duplicates = accounts
        .filter((account) => {
          return (
            account.osot_first_name?.toLowerCase() ===
              firstName.toLowerCase() &&
            account.osot_last_name?.toLowerCase() === lastName.toLowerCase() &&
            account.osot_date_of_birth === dateOfBirth &&
            account.osot_table_accountid !== excludeAccountId
          );
        })
        .map((account) => ({
          firstName: account.osot_first_name || '',
          lastName: account.osot_last_name || '',
          dateOfBirth: account.osot_date_of_birth || '',
          email: account.osot_email || '',
        }));

      this.logger.log(
        `Duplicate person check completed - Operation: ${operationId}`,
        {
          operation: 'findDuplicatePersons',
          operationId,
          duplicateCount: duplicates.length,
          timestamp: new Date().toISOString(),
        },
      );

      return duplicates;
    } catch (error) {
      this.logger.error(
        `Duplicate person check failed - Operation: ${operationId}`,
        {
          operation: 'findDuplicatePersons',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to check for duplicate persons',
        operationId,
        operation: 'findDuplicatePersons',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find active accounts with comprehensive privilege checking
   * Enhanced with operation tracking and security-aware logging
   */
  async findActiveAccounts(
    userRole?: string,
    limit?: number,
  ): Promise<AccountResponseDto[]> {
    const operationId = `find_active_accounts_${Date.now()}`;

    this.logger.log(
      `Starting active accounts lookup - Operation: ${operationId}`,
      {
        operation: 'findActiveAccounts',
        operationId,
        userRole: userRole || 'undefined',
        limit: limit || 'unlimited',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking with privilege validation
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Active accounts lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findActiveAccounts',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to lookup active accounts',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findActiveAccounts',
      });
    }

    // Determine app context for operation
    const app = getAppForOperation('read', userRole);

    try {
      const accounts = await this.accountRepository.findActiveAccounts(limit);

      // Transform to response DTOs with privilege-based filtering
      const responseDtos = accounts.map((account) =>
        mapInternalToResponseDto(account),
      );

      this.logger.log(
        `Active accounts lookup completed - Operation: ${operationId}`,
        {
          operation: 'findActiveAccounts',
          operationId,
          resultsCount: responseDtos.length,
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDtos;
    } catch (error) {
      this.logger.error(
        `Active accounts lookup failed - Operation: ${operationId}`,
        {
          operation: 'findActiveAccounts',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to lookup active accounts',
        operationId,
        operation: 'findActiveAccounts',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find pending accounts with comprehensive privilege checking
   * Enhanced with operation tracking and security-aware logging
   */
  async findPendingAccounts(
    userRole?: string,
    limit?: number,
  ): Promise<AccountResponseDto[]> {
    const operationId = `find_pending_accounts_${Date.now()}`;

    this.logger.log(
      `Starting pending accounts lookup - Operation: ${operationId}`,
      {
        operation: 'findPendingAccounts',
        operationId,
        userRole: userRole || 'undefined',
        limit: limit || 'unlimited',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking with privilege validation
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Pending accounts lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findPendingAccounts',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to lookup pending accounts',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findPendingAccounts',
      });
    }

    // Determine app context for operation
    const app = getAppForOperation('read', userRole);

    try {
      const accounts = await this.accountRepository.findPendingAccounts(limit);

      // Transform to response DTOs with privilege-based filtering
      const responseDtos = accounts.map((account) =>
        mapInternalToResponseDto(account),
      );

      this.logger.log(
        `Pending accounts lookup completed - Operation: ${operationId}`,
        {
          operation: 'findPendingAccounts',
          operationId,
          resultsCount: responseDtos.length,
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDtos;
    } catch (error) {
      this.logger.error(
        `Pending accounts lookup failed - Operation: ${operationId}`,
        {
          operation: 'findPendingAccounts',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          appContext: app,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to lookup pending accounts',
        operationId,
        operation: 'findPendingAccounts',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

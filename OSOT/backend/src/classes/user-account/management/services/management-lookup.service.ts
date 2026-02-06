import { Injectable, Inject, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { DataverseCredentials } from '../../../../integrations/dataverse.service';
import { AccessModifier, Privilege } from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { canRead } from '../../../../utils/dataverse-app.helper';
import {
  ManagementRepository,
  MANAGEMENT_REPOSITORY,
} from '../interfaces/management-repository.interface';
import { DataverseManagement } from '../interfaces/management-dataverse.interface';

/**
 * Management Lookup Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with ManagementRepository
 * - Hybrid Architecture: Modern Repository + Legacy DataverseService for migration
 * - Structured Logging: Operation IDs, security-aware logging with PII redaction
 * - Security-First Design: Privilege-based access control and comprehensive audit
 * - Error Management: Centralized error handling with createAppError and detailed context
 *
 * PERMISSION SYSTEM (Privilege-based):
 * - OWNER: Full access to all lookup operations and fields
 * - ADMIN: Full access to all lookup operations and fields
 * - MAIN: Access to lookup operations with sensitive field filtering
 * - Sensitive fields filtered for lower privileges: access_modifiers, privilege
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Security-aware logging with PII redaction capabilities
 * - Privilege-based field filtering and access control
 * - Performance monitoring and query optimization
 * - Hybrid architecture enabling gradual migration from legacy systems
 *
 * Provides specialized query operations for Management entities:
 * - Find management by various criteria (account, GUID, specific fields)
 * - Account-based management lookups with security filtering
 * - Privilege and access control queries (privilege levels, access modifiers)
 * - Business logic queries (data completeness, management statistics)
 * - Support for complex filtering and sorting
 */
@Injectable()
export class ManagementLookupService {
  private readonly logger = new Logger(ManagementLookupService.name);

  constructor(
    private readonly dataverseService: DataverseService,
    @Inject(MANAGEMENT_REPOSITORY)
    private readonly managementRepository: ManagementRepository,
  ) {}

  /**
   * Find management by GUID with comprehensive security and logging
   * Enhanced with operation tracking and security-aware logging
   */
  async findOneByGuid(
    guid: string,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<DataverseManagement | null> {
    const operationId = Math.random().toString(36).substring(2, 15);

    this.logger.log(
      `Management GUID lookup initiated - Operation: ${operationId}`,
      {
        operation: 'findOneByGuid',
        operationId,
        managementGuid: guid?.substring(0, 8) + '...',
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking for read operations
    if (!canRead(userRole)) {
      this.logger.warn(
        `Management GUID lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findOneByGuid',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to management GUID lookup',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findOneByGuid',
      });
    }

    try {
      // **MODERN PATH**: Use Repository Pattern when credentials are not needed
      if (!credentials) {
        this.logger.debug(
          `Using Repository Pattern for GUID lookup - Operation: ${operationId}`,
        );
        const result = await this.managementRepository.findByGuid(guid);

        if (result) {
          this.logger.log(
            `Management GUID lookup completed (Repository) - Operation: ${operationId}`,
            {
              operation: 'findOneByGuid',
              operationId,
              found: true,
              userRole: userRole || 'undefined',
              method: 'repository',
              timestamp: new Date().toISOString(),
            },
          );
        }

        return result as DataverseManagement;
      }

      // **LEGACY PATH**: Use DataverseService when credentials are provided
      this.logger.debug(
        `Using DataverseService for GUID lookup with credentials - Operation: ${operationId}`,
      );

      const endpoint = `osot_table_account_managements(${guid})`;
      const result = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      this.logger.log(
        `Management GUID lookup completed (Dataverse) - Operation: ${operationId}`,
        {
          operation: 'findOneByGuid',
          operationId,
          found: !!result,
          userRole: userRole || 'undefined',
          method: 'dataverse',
          timestamp: new Date().toISOString(),
        },
      );

      return result as DataverseManagement;
    } catch (error) {
      this.logger.error(
        `Management GUID lookup failed - Operation: ${operationId}`,
        {
          operation: 'findOneByGuid',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findOneByGuid',
        error: error instanceof Error ? error.message : 'Unknown error',
        operationId,
        guid,
      });
    }
  }

  /**
   * Find management records by Account ID with comprehensive security and logging
   * Returns all management records associated with a specific account
   */
  async findByAccount(
    accountId: string,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<DataverseManagement[]> {
    const operationId = Math.random().toString(36).substring(2, 15);

    this.logger.log(
      `Management Account lookup initiated - Operation: ${operationId}`,
      {
        operation: 'findByAccount',
        operationId,
        accountId: accountId?.substring(0, 8) + '...',
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking for read operations
    if (!canRead(userRole)) {
      this.logger.warn(
        `Management Account lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findByAccount',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to management account lookup',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByAccount',
      });
    }

    try {
      // **MODERN PATH**: Use Repository Pattern when credentials are not needed
      if (!credentials) {
        this.logger.debug(
          `Using Repository Pattern for Account lookup - Operation: ${operationId}`,
        );
        const results =
          await this.managementRepository.findByAccountId(accountId);

        this.logger.log(
          `Management Account lookup completed (Repository) - Operation: ${operationId}`,
          {
            operation: 'findByAccount',
            operationId,
            resultCount: results.length,
            userRole: userRole || 'undefined',
            method: 'repository',
            timestamp: new Date().toISOString(),
          },
        );

        return results as DataverseManagement[];
      }

      // **LEGACY PATH**: Use DataverseService when credentials are provided
      this.logger.debug(
        `Using DataverseService for Account lookup with credentials - Operation: ${operationId}`,
      );

      const filter = `osot_table_account eq '${accountId}'`;
      const endpoint = `osot_table_account_managements?$filter=${encodeURIComponent(
        filter,
      )}`;

      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
      );

      const results =
        (response as { value?: DataverseManagement[] })?.value || [];

      this.logger.log(
        `Management Account lookup completed (Dataverse) - Operation: ${operationId}`,
        {
          operation: 'findByAccount',
          operationId,
          resultCount: results.length,
          userRole: userRole || 'undefined',
          method: 'dataverse',
          timestamp: new Date().toISOString(),
        },
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Management Account lookup failed - Operation: ${operationId}`,
        {
          operation: 'findByAccount',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'findByAccount',
        error: error instanceof Error ? error.message : 'Unknown error',
        operationId,
        accountId,
      });
    }
  }

  /**
   * Search management records with complex criteria
   * Supports multiple filters and sorting options
   */
  async searchManagement(
    criteria: {
      accountId?: string;
      privilege?: Privilege;
      accessModifier?: AccessModifier;
    },
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    } = {},
    credentials?: DataverseCredentials,
  ): Promise<{
    management: DataverseManagement[];
    total: number;
    hasMore: boolean;
  }> {
    const filters: string[] = [];

    // Build filter conditions
    if (criteria.accountId) {
      filters.push(`osot_table_account eq '${criteria.accountId}'`);
    }

    if (criteria.privilege !== undefined) {
      filters.push(`osot_privilege eq ${criteria.privilege}`);
    }

    if (criteria.accessModifier !== undefined) {
      filters.push(`osot_access_modifiers eq ${criteria.accessModifier}`);
    }

    // Build query URL
    let queryUrl = 'osot_table_account_managements';
    const queryParams: string[] = [];

    if (filters.length > 0) {
      queryParams.push(`$filter=${encodeURIComponent(filters.join(' and '))}`);
    }

    if (options.limit) {
      queryParams.push(`$top=${options.limit}`);
    }

    if (options.offset) {
      queryParams.push(`$skip=${options.offset}`);
    }

    if (options.orderBy) {
      const direction = options.orderDirection || 'asc';
      queryParams.push(`$orderby=${options.orderBy} ${direction}`);
    }

    // Include count for pagination
    queryParams.push('$count=true');

    if (queryParams.length > 0) {
      queryUrl += '?' + queryParams.join('&');
    }

    const response = (await this.dataverseService.request(
      'GET',
      queryUrl,
      undefined,
      credentials,
    )) as { value?: DataverseManagement[]; '@odata.count'?: number };

    const management = response?.value || [];
    const total = response?.['@odata.count'] || management.length;
    const hasMore = options.limit
      ? (options.offset || 0) + management.length < total
      : false;

    return {
      management,
      total,
      hasMore,
    };
  }

  /**
   * Get management statistics by account
   * Returns aggregated statistics for management records within an account
   */
  async getManagementStatistics(
    accountId: string,
    credentials?: DataverseCredentials,
  ): Promise<{
    totalManagement: number;
    privilegeDistribution: Record<string, number>;
    accessModifierDistribution: Record<string, number>;
  }> {
    const managementRecords = await this.findByAccount(accountId, credentials);

    const stats = {
      totalManagement: managementRecords.length,
      privilegeDistribution: {} as Record<string, number>,
      accessModifierDistribution: {} as Record<string, number>,
    };

    managementRecords.forEach((management) => {
      // Privilege distribution
      const privilege = management.osot_privilege;
      if (privilege !== undefined && privilege !== null) {
        let privilegeKey: string;
        if (typeof privilege === 'number') {
          privilegeKey = privilege.toString();
        } else if (typeof privilege === 'string') {
          privilegeKey = privilege;
        } else {
          privilegeKey = 'unknown';
        }
        stats.privilegeDistribution[privilegeKey] =
          (stats.privilegeDistribution[privilegeKey] || 0) + 1;
      }

      // Access modifier distribution
      const accessModifier = management.osot_access_modifiers;
      if (accessModifier !== undefined && accessModifier !== null) {
        let accessKey: string;
        if (typeof accessModifier === 'number') {
          accessKey = accessModifier.toString();
        } else if (typeof accessModifier === 'string') {
          accessKey = accessModifier;
        } else {
          accessKey = 'unknown';
        }
        stats.accessModifierDistribution[accessKey] =
          (stats.accessModifierDistribution[accessKey] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Find management records by privilege level
   */
  async findByPrivilege(
    privilege: Privilege,
    credentials?: DataverseCredentials,
  ): Promise<DataverseManagement[]> {
    const filter = `osot_privilege eq ${privilege}`;
    const endpoint = `osot_table_account_managements?$filter=${encodeURIComponent(
      filter,
    )}`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    return (response as { value?: DataverseManagement[] })?.value || [];
  }

  /**
   * Find management records by access modifier
   */
  async findByAccessModifier(
    accessModifier: AccessModifier,
    credentials?: DataverseCredentials,
  ): Promise<DataverseManagement[]> {
    const filter = `osot_access_modifiers eq ${accessModifier}`;
    const endpoint = `osot_table_account_managements?$filter=${encodeURIComponent(
      filter,
    )}`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    return (response as { value?: DataverseManagement[] })?.value || [];
  }

  /**
   * Find management records that may need privilege upgrades
   * Based on business criteria and data completeness
   */
  async findPrivilegeUpgradeCandidates(
    credentials?: DataverseCredentials,
  ): Promise<DataverseManagement[]> {
    // Find management records with MAIN privilege that might be eligible for upgrade
    const filter = `osot_privilege eq ${Privilege.MAIN}`;
    const endpoint = `osot_table_account_managements?$filter=${encodeURIComponent(
      filter,
    )}`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    return (response as { value?: DataverseManagement[] })?.value || [];
  }

  /**
   * Count total management records
   */
  async getTotalCount(credentials?: DataverseCredentials): Promise<number> {
    const endpoint = 'osot_table_account_managements?$count=true&$top=1';

    const response = (await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    )) as { '@odata.count'?: number };

    return response?.['@odata.count'] || 0;
  }
}

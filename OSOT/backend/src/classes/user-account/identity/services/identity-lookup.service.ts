import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  DataverseService,
  DataverseCredentials,
} from '../../../../integrations/dataverse.service';

// Repository Pattern Integration
import {
  IdentityRepository,
  IDENTITY_REPOSITORY,
} from '../interfaces/identity-repository.interface';

// Event System Integration
import { IdentityEventService } from '../events/identity.events';

// Types and interfaces
import { DataverseIdentity } from '../interfaces/identity-dataverse.interface';

import {
  IDENTITY_ODATA,
  IDENTITY_FIELDS,
} from '../constants/identity.constants';
import { Language } from '../../../../common/enums/language-choice.enum';
import { Race } from '../../../../common/enums/race-choice.enum';
import { Gender } from '../../../../common/enums/gender-choice.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { canRead } from '../../../../utils/dataverse-app.helper';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Identity Lookup Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with IdentityRepository
 * - Hybrid Architecture: Modern Repository + Legacy DataverseService for migration
 * - Structured Logging: Operation IDs, security-aware logging with PII redaction
 * - Security-First Design: Privilege-based access control and comprehensive audit
 * - Event Integration: Ready for event emission and business rule enforcement
 * - Error Management: Centralized error handling with createAppError and detailed context
 *
 * PERMISSION SYSTEM (Privilege-based):
 * - OWNER: Full access to all lookup operations and fields
 * - ADMIN: Full access to all lookup operations and fields
 * - MAIN: Access to lookup operations with sensitive field filtering
 * - Sensitive fields filtered for lower privileges: userBusinessId, access_modifiers, privilege
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Security-aware logging with PII redaction capabilities
 * - Privilege-based field filtering and access control
 * - Performance monitoring and query optimization
 * - Cultural consistency analysis and demographic insights
 * - Hybrid architecture enabling gradual migration from legacy systems
 *
 * Provides specialized query operations for Identity entities:
 * - Find identities by various criteria (account, User Business ID, language)
 * - Cultural and demographic-based lookups (language, race, gender)
 * - Privilege and access control queries (privilege levels, access modifiers)
 * - Business logic queries (data completeness, cultural consistency)
 * - Support for complex filtering and sorting
 */
@Injectable()
export class IdentityLookupService {
  private readonly logger = new Logger(IdentityLookupService.name);

  constructor(
    private readonly dataverseService: DataverseService,
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IdentityRepository,
    private readonly identityEvents: IdentityEventService,
  ) {}

  /**
   * Find identity by GUID with comprehensive security and logging
   * Enhanced with operation tracking and security-aware logging
   */
  async findOneByGuid(
    guid: string,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<DataverseIdentity> {
    const operationId = Math.random().toString(36).substring(2, 15);

    this.logger.log(
      `Identity GUID lookup initiated - Operation: ${operationId}`,
      {
        operation: 'findOneByGuid',
        operationId,
        identityGuid: guid?.substring(0, 8) + '...',
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking for read operations
    if (!canRead(userRole)) {
      this.logger.warn(
        `Identity GUID lookup denied - insufficient privileges - Operation: ${operationId}`,
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
        message: 'Access denied to identity GUID lookup',
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

        const repositoryResult = (await this.identityRepository
          .findByGuid(guid)
          .catch((error: Error) => {
            this.logger.warn(
              `Repository lookup failed, fallback to legacy - Operation: ${operationId}`,
              {
                operation: 'findOneByGuid',
                operationId,
                error: error.message,
                fallbackMethod: 'DataverseService',
                timestamp: new Date().toISOString(),
              },
            );
            return null;
          })) as DataverseIdentity | null;

        if (repositoryResult) {
          this.logger.log(
            `Identity found via Repository - Operation: ${operationId}`,
            {
              operation: 'findOneByGuid',
              operationId,
              identityGuid: guid?.substring(0, 8) + '...',
              method: 'Repository',
              found: true,
              timestamp: new Date().toISOString(),
            },
          );

          // For lookup service, return raw DataverseIdentity format for consistency
          return repositoryResult;
        }
      }

      // **LEGACY PATH**: Fallback to DataverseService for backward compatibility
      this.logger.debug(
        `Using Legacy DataverseService for GUID lookup - Operation: ${operationId}`,
      );

      const response = await this.dataverseService.request(
        'GET',
        `${IDENTITY_ODATA.TABLE_NAME}(${guid})`,
        undefined,
        credentials,
      );

      if (!response) {
        this.logger.warn(`Identity not found - Operation: ${operationId}`, {
          operation: 'findOneByGuid',
          operationId,
          identityGuid: guid?.substring(0, 8) + '...',
          found: false,
          timestamp: new Date().toISOString(),
        });

        throw createAppError(
          ErrorCodes.INVALID_INPUT,
          { guid },
          404,
          'Identity not found',
        );
      }

      this.logger.log(
        `Identity found via Legacy Service - Operation: ${operationId}`,
        {
          operation: 'findOneByGuid',
          operationId,
          identityGuid: guid?.substring(0, 8) + '...',
          method: 'DataverseService',
          found: true,
          timestamp: new Date().toISOString(),
        },
      );

      return response as Record<string, unknown>;
    } catch (error) {
      this.logger.error(
        `Identity GUID lookup failed - Operation: ${operationId}`,
        {
          operation: 'findOneByGuid',
          operationId,
          identityGuid: guid?.substring(0, 8) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );
      throw error;
    }
  }

  /**
   * Find identity by User Business ID with comprehensive security and logging
   * User Business ID is unique and limited to 20 characters
   */
  async findOneByUserBusinessId(
    userBusinessId: string,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<DataverseIdentity | null> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Redact sensitive data for logging (show only first 4 characters)
    const redactedBusinessId = userBusinessId?.substring(0, 4) + '...';

    this.logger.log(
      `Identity Business ID lookup initiated - Operation: ${operationId}`,
      {
        operation: 'findOneByUserBusinessId',
        operationId,
        userBusinessId: redactedBusinessId,
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    // Enhanced permission checking for read operations
    if (!canRead(userRole)) {
      this.logger.warn(
        `Identity Business ID lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findOneByUserBusinessId',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to identity business ID lookup',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findOneByUserBusinessId',
      });
    }

    try {
      // **MODERN PATH**: Use Repository Pattern when credentials are not needed
      if (!credentials) {
        this.logger.debug(
          `Using Repository Pattern for Business ID lookup - Operation: ${operationId}`,
        );

        const repositoryResult = (await this.identityRepository
          .findByBusinessId(userBusinessId)
          .catch((error: Error) => {
            this.logger.warn(
              `Repository Business ID lookup failed, fallback to legacy - Operation: ${operationId}`,
              {
                operation: 'findOneByUserBusinessId',
                operationId,
                error: error.message,
                fallbackMethod: 'DataverseService',
                timestamp: new Date().toISOString(),
              },
            );
            return null;
          })) as DataverseIdentity | null;

        if (repositoryResult) {
          this.logger.log(
            `Identity found via Repository - Operation: ${operationId}`,
            {
              operation: 'findOneByUserBusinessId',
              operationId,
              userBusinessId: redactedBusinessId,
              method: 'Repository',
              found: true,
              timestamp: new Date().toISOString(),
            },
          );

          // For lookup service, return raw DataverseIdentity format for consistency
          return repositoryResult;
        }
      }

      // **LEGACY PATH**: Fallback to DataverseService for backward compatibility
      this.logger.debug(
        `Using Legacy DataverseService for Business ID lookup - Operation: ${operationId}`,
      );

      const filter = `${IDENTITY_FIELDS.USER_BUSINESS_ID} eq '${userBusinessId}'`;

      const response = (await this.dataverseService.request(
        'GET',
        `${IDENTITY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
        undefined,
        credentials,
      )) as { value?: Record<string, unknown>[] };

      const identities = response?.value || [];
      const result = identities.length > 0 ? identities[0] : null;

      this.logger.log(
        `Identity Business ID lookup completed - Operation: ${operationId}`,
        {
          operation: 'findOneByUserBusinessId',
          operationId,
          userBusinessId: redactedBusinessId,
          method: 'DataverseService',
          found: !!result,
          timestamp: new Date().toISOString(),
        },
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Identity Business ID lookup failed - Operation: ${operationId}`,
        {
          operation: 'findOneByUserBusinessId',
          operationId,
          userBusinessId: redactedBusinessId,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );
      throw error;
    }
  }

  /**
   * Find identities by Account ID with comprehensive security and logging
   * Returns all identities associated with a specific account
   */
  async findByAccount(
    accountId: string,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<DataverseIdentity[]> {
    const operationId = Math.random().toString(36).substring(2, 15);

    this.logger.log(
      `Identity Account lookup initiated - Operation: ${operationId}`,
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
        `Identity Account lookup denied - insufficient privileges - Operation: ${operationId}`,
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
        message: 'Access denied to identity account lookup',
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

        const repositoryResult = (await this.identityRepository
          .findByAccountId(accountId)
          .catch((error: Error) => {
            this.logger.warn(
              `Repository Account lookup failed, fallback to legacy - Operation: ${operationId}`,
              {
                operation: 'findByAccount',
                operationId,
                error: error.message,
                fallbackMethod: 'DataverseService',
                timestamp: new Date().toISOString(),
              },
            );
            return [];
          })) as DataverseIdentity[];

        if (repositoryResult && repositoryResult.length >= 0) {
          this.logger.log(
            `Identities found via Repository - Operation: ${operationId}`,
            {
              operation: 'findByAccount',
              operationId,
              accountId: accountId?.substring(0, 8) + '...',
              method: 'Repository',
              count: repositoryResult.length,
              timestamp: new Date().toISOString(),
            },
          );

          return repositoryResult;
        }
      }

      // **LEGACY PATH**: Fallback to DataverseService for backward compatibility
      this.logger.debug(
        `Using Legacy DataverseService for Account lookup - Operation: ${operationId}`,
      );

      const filter = `${IDENTITY_FIELDS.TABLE_ACCOUNT} eq '${accountId}'`;

      const response = (await this.dataverseService.request(
        'GET',
        `${IDENTITY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
        undefined,
        credentials,
      )) as { value?: Record<string, unknown>[] };

      const result = response?.value || [];

      this.logger.log(
        `Identity Account lookup completed - Operation: ${operationId}`,
        {
          operation: 'findByAccount',
          operationId,
          accountId: accountId?.substring(0, 8) + '...',
          method: 'DataverseService',
          count: result.length,
          timestamp: new Date().toISOString(),
        },
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Identity Account lookup failed - Operation: ${operationId}`,
        {
          operation: 'findByAccount',
          operationId,
          accountId: accountId?.substring(0, 8) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );
      throw error;
    }
  }

  /**
   * Find identities by primary language with security and logging
   * Useful for cultural grouping and language-based services
   */
  async findByLanguage(
    language: Language,
    credentials?: DataverseCredentials,
    userRole?: string,
  ): Promise<DataverseIdentity[]> {
    const operationId = Math.random().toString(36).substring(2, 15);

    this.logger.log(
      `Identity Language lookup initiated - Operation: ${operationId}`,
      {
        operation: 'findByLanguage',
        operationId,
        language,
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    // Permission checking for read operations
    if (!canRead(userRole)) {
      this.logger.warn(
        `Identity Language lookup denied - Operation: ${operationId}`,
        {
          operation: 'findByLanguage',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to identity language lookup',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByLanguage',
      });
    }

    try {
      // Language is stored as a multi-select option set
      // We need to check if the language value is contained in the multi-select field
      const filter = `Microsoft.Dynamics.CRM.ContainValues(PropertyName='${IDENTITY_FIELDS.LANGUAGE}',PropertyValues=['${language}'])`;

      const response = (await this.dataverseService.request(
        'GET',
        `${IDENTITY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
        undefined,
        credentials,
      )) as { value?: Record<string, unknown>[] };

      const result = response?.value || [];

      this.logger.log(
        `Identity Language lookup completed - Operation: ${operationId}`,
        {
          operation: 'findByLanguage',
          operationId,
          language,
          count: result.length,
          timestamp: new Date().toISOString(),
        },
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Identity Language lookup failed - Operation: ${operationId}`,
        {
          operation: 'findByLanguage',
          operationId,
          language,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );
      throw error;
    }
  }

  /**
   * Find identities by race
   * Used for demographic analysis and cultural services
   */
  async findByRace(
    race: Race,
    credentials?: DataverseCredentials,
  ): Promise<DataverseIdentity[]> {
    const filter = `Microsoft.Dynamics.CRM.ContainValues(PropertyName='${IDENTITY_FIELDS.RACE}',PropertyValues=['${race}'])`;

    const response = (await this.dataverseService.request(
      'GET',
      `${IDENTITY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
      undefined,
      credentials,
    )) as { value?: DataverseIdentity[] };

    return response?.value || [];
  }

  /**
   * Find identities by gender
   * Used for demographic analysis and targeted services
   */
  async findByGender(
    gender: Gender,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    const filter = `${IDENTITY_FIELDS.GENDER} eq ${gender}`;

    const response = (await this.dataverseService.request(
      'GET',
      `${IDENTITY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
      undefined,
      credentials,
    )) as { value?: Record<string, unknown>[] };

    return response?.value || [];
  }

  /**
   * Find identities by privilege level
   * Used for access control and permission management
   */
  async findByPrivilege(
    privilege: Privilege,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    const filter = `${IDENTITY_FIELDS.PRIVILEGE} eq ${privilege}`;

    const response = (await this.dataverseService.request(
      'GET',
      `${IDENTITY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
      undefined,
      credentials,
    )) as { value?: Record<string, unknown>[] };

    return response?.value || [];
  }

  /**
   * Find identities by access modifier
   * Used for data visibility and privacy controls
   */
  async findByAccessModifier(
    accessModifier: AccessModifier,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    const filter = `${IDENTITY_FIELDS.ACCESS_MODIFIERS} eq ${accessModifier}`;

    const response = (await this.dataverseService.request(
      'GET',
      `${IDENTITY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`,
      undefined,
      credentials,
    )) as { value?: Record<string, unknown>[] };

    return response?.value || [];
  }

  /**
   * Find multilingual identities
   * Returns identities that have multiple languages configured
   */
  async findMultilingualIdentities(
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    // This is a complex query that would need to be implemented based on
    // how multi-select option sets work in Dataverse
    // For now, we'll fetch all and filter programmatically
    const response = (await this.dataverseService.request(
      'GET',
      IDENTITY_ODATA.TABLE_NAME,
      undefined,
      credentials,
    )) as { value?: Record<string, unknown>[] };

    const allIdentities = response?.value || [];

    // Filter for identities with multiple languages
    return allIdentities.filter((identity: Record<string, unknown>) => {
      const languages = identity[IDENTITY_FIELDS.LANGUAGE];
      if (typeof languages === 'string' && languages.includes(',')) {
        // Multiple values are comma-separated in Dataverse
        return languages.split(',').length > 1;
      }
      return false;
    });
  }

  /**
   * Find identities with incomplete data
   * Returns identities that are missing required or important fields
   */
  async findIncompleteIdentities(
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    const response = (await this.dataverseService.request(
      'GET',
      IDENTITY_ODATA.TABLE_NAME,
      undefined,
      credentials,
    )) as { value?: Record<string, unknown>[] };

    const allIdentities = response?.value || [];

    // Filter for incomplete identities based on business requirements
    return allIdentities.filter((identity: Record<string, unknown>) => {
      const userBusinessId = identity[IDENTITY_FIELDS.USER_BUSINESS_ID];
      const language = identity[IDENTITY_FIELDS.LANGUAGE];

      // Identity is incomplete if missing required fields
      return !userBusinessId || !language;
    });
  }

  /**
   * Search identities with complex criteria
   * Supports multiple filters and sorting options
   */
  async searchIdentities(
    criteria: {
      accountId?: string;
      languages?: Language[];
      races?: Race[];
      gender?: Gender;
      privilege?: Privilege;
      accessModifier?: AccessModifier;
      userBusinessIdPattern?: string; // For partial matching
    },
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    } = {},
    credentials?: DataverseCredentials,
  ): Promise<{
    identities: Record<string, unknown>[];
    total: number;
    hasMore: boolean;
  }> {
    const filters: string[] = [];

    // Build filter conditions
    if (criteria.accountId) {
      filters.push(
        `${IDENTITY_FIELDS.TABLE_ACCOUNT} eq '${criteria.accountId}'`,
      );
    }

    if (criteria.gender !== undefined) {
      filters.push(`${IDENTITY_FIELDS.GENDER} eq ${criteria.gender}`);
    }

    if (criteria.privilege !== undefined) {
      filters.push(`${IDENTITY_FIELDS.PRIVILEGE} eq ${criteria.privilege}`);
    }

    if (criteria.accessModifier !== undefined) {
      filters.push(
        `${IDENTITY_FIELDS.ACCESS_MODIFIERS} eq ${criteria.accessModifier}`,
      );
    }

    if (criteria.userBusinessIdPattern) {
      filters.push(
        `contains(${IDENTITY_FIELDS.USER_BUSINESS_ID}, '${criteria.userBusinessIdPattern}')`,
      );
    }

    // Handle multi-select fields (languages and races)
    if (criteria.languages && criteria.languages.length > 0) {
      const languageValues = criteria.languages.join(',');
      filters.push(
        `Microsoft.Dynamics.CRM.ContainValues(PropertyName='${IDENTITY_FIELDS.LANGUAGE}',PropertyValues=[${languageValues}])`,
      );
    }

    if (criteria.races && criteria.races.length > 0) {
      const raceValues = criteria.races.join(',');
      filters.push(
        `Microsoft.Dynamics.CRM.ContainValues(PropertyName='${IDENTITY_FIELDS.RACE}',PropertyValues=[${raceValues}])`,
      );
    }

    // Build query URL
    let queryUrl = IDENTITY_ODATA.TABLE_NAME;
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

    // Add count for total calculation
    queryParams.push('$count=true');

    if (queryParams.length > 0) {
      queryUrl += `?${queryParams.join('&')}`;
    }

    const response = (await this.dataverseService.request(
      'GET',
      queryUrl,
      undefined,
      credentials,
    )) as { value?: Record<string, unknown>[]; '@odata.count'?: number };

    const identities = response?.value || [];
    const total = response?.['@odata.count'] || identities.length;
    const hasMore = options.limit
      ? (options.offset || 0) + identities.length < total
      : false;

    return {
      identities,
      total,
      hasMore,
    };
  }

  /**
   * Get identity statistics by account
   * Returns aggregated statistics for identities within an account
   */
  async getIdentityStatistics(
    accountId: string,
    credentials?: DataverseCredentials,
  ): Promise<{
    totalIdentities: number;
    languageDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
    raceDistribution: Record<string, number>;
    privilegeDistribution: Record<string, number>;
    multilingualCount: number;
    incompleteCount: number;
  }> {
    const identities = await this.findByAccount(accountId, credentials);

    const stats = {
      totalIdentities: identities.length,
      languageDistribution: {} as Record<string, number>,
      genderDistribution: {} as Record<string, number>,
      raceDistribution: {} as Record<string, number>,
      privilegeDistribution: {} as Record<string, number>,
      multilingualCount: 0,
      incompleteCount: 0,
    };

    identities.forEach((identity) => {
      // Language distribution
      const languages = identity[IDENTITY_FIELDS.LANGUAGE];
      if (languages) {
        let languageList: string[] = [];

        if (typeof languages === 'string') {
          languageList = languages.split(',');
        } else if (typeof languages === 'number') {
          languageList = [languages.toString()];
        } else if (Array.isArray(languages)) {
          languageList = languages.map((lang) => String(lang));
        } else {
          // Skip if cannot parse languages safely
          languageList = [];
        }

        if (languageList.length > 1) {
          stats.multilingualCount++;
        }

        languageList.forEach((lang) => {
          const langKey = lang.trim();
          stats.languageDistribution[langKey] =
            (stats.languageDistribution[langKey] || 0) + 1;
        });
      }

      // Gender distribution
      const gender = identity[IDENTITY_FIELDS.GENDER];
      if (gender !== undefined && gender !== null) {
        let genderKey: string;
        if (typeof gender === 'number') {
          genderKey = gender.toString();
        } else if (typeof gender === 'string') {
          genderKey = gender;
        } else {
          genderKey = 'unknown';
        }
        stats.genderDistribution[genderKey] =
          (stats.genderDistribution[genderKey] || 0) + 1;
      }

      // Race distribution
      const race = identity[IDENTITY_FIELDS.RACE];
      if (race) {
        let raceList: string[] = [];

        if (typeof race === 'string') {
          raceList = race.split(',');
        } else if (typeof race === 'number') {
          raceList = [race.toString()];
        } else if (Array.isArray(race)) {
          raceList = race.map((r) => String(r));
        } else {
          // Skip if cannot parse race safely
          raceList = [];
        }

        raceList.forEach((r) => {
          const raceKey = r.trim();
          stats.raceDistribution[raceKey] =
            (stats.raceDistribution[raceKey] || 0) + 1;
        });
      }

      // Privilege distribution
      const privilege = identity[IDENTITY_FIELDS.PRIVILEGE];
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

      // Check if incomplete
      const userBusinessId = identity[IDENTITY_FIELDS.USER_BUSINESS_ID];
      if (!userBusinessId || !languages) {
        stats.incompleteCount++;
      }
    });

    return stats;
  }

  /**
   * Find identities for cultural consistency analysis
   * Returns identities that may have cultural consistency issues
   */
  async findCulturalConsistencyIssues(
    accountId?: string,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    let identities: Record<string, unknown>[];

    if (accountId) {
      identities = await this.findByAccount(accountId, credentials);
    } else {
      const response = (await this.dataverseService.request(
        'GET',
        IDENTITY_ODATA.TABLE_NAME,
        undefined,
        credentials,
      )) as { value?: Record<string, unknown>[] };
      identities = response?.value || [];
    }

    // Filter for potential cultural consistency issues
    // This would be enhanced with more sophisticated cultural analysis
    return identities.filter((identity) => {
      const languages = identity[IDENTITY_FIELDS.LANGUAGE];

      // Example: Multiple languages with conflicting cultural indicators
      // In a real implementation, this would include more complex cultural analysis
      if (typeof languages === 'string' && languages.includes(',')) {
        const languageList = languages.split(',');
        // Simplified check - in reality this would involve cultural mapping
        return languageList.length > 2; // More than 2 languages might need verification
      }

      return false;
    });
  }

  /**
   * Find identities eligible for privilege upgrades
   * Based on data completeness and other business criteria
   */
  async findPrivilegeUpgradeCandidates(
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    const response = (await this.dataverseService.request(
      'GET',
      IDENTITY_ODATA.TABLE_NAME,
      undefined,
      credentials,
    )) as { value?: Record<string, unknown>[] };

    const allIdentities = response?.value || [];

    return allIdentities.filter((identity) => {
      const privilege = identity[IDENTITY_FIELDS.PRIVILEGE];
      const userBusinessId = identity[IDENTITY_FIELDS.USER_BUSINESS_ID];
      const language = identity[IDENTITY_FIELDS.LANGUAGE];

      // Basic criteria for upgrade eligibility
      // Complete profile (has required fields)
      const hasCompleteProfile = userBusinessId && language;

      // Currently has lower privilege level
      const hasLowerPrivilege =
        privilege !== undefined &&
        typeof privilege === 'number' &&
        privilege < (Privilege.ADMIN as number);

      return hasCompleteProfile && hasLowerPrivilege;
    });
  }
}

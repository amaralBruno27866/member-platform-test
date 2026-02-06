/**
 * Account Repository Implementation
 * Handles data access operations for Account records in Dataverse.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error handling
 * - integrations: Uses DataverseService for all data operations
 * - interfaces: Implements AccountRepository contract
 * - mappers: Uses account mappers for data transformation
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT needs
 * - Clean abstraction over DataverseService
 * - Security-focused: password handling and email uniqueness
 */

import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { getAppForOperation } from '../../../../utils/dataverse-app.helper';

// Import interfaces and constants
import {
  AccountInternal,
  AccountInternalCreate,
} from '../interfaces/account-internal.interface';
import { AccountDataverse } from '../interfaces/account-dataverse.interface';
import {
  AccountRepository,
  AccountSearchOptions,
  AccountStatistics,
} from '../interfaces/account-repository.interface';
import { ACCOUNT_ODATA, ACCOUNT_FIELDS } from '../constants/account.constants';
import {
  mapDataverseToInternal,
  mapInternalToDataverseCreate,
  mapInternalToDataverseUpdate,
} from '../mappers/account.mapper';
import { AccountGroup, AccountStatus } from '../../../../common/enums';

// Type definitions for Dataverse responses
interface DataverseCollectionResponse {
  value: AccountDataverse[];
  '@odata.count'?: number;
}

@Injectable()
export class AccountRepositoryService implements AccountRepository {
  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Helper method to get credentials for requests
   * @param operation - Type of operation (create, read, write, delete)
   * @param userRole - Optional user role for permission checking
   */
  private getCredentials(
    operation: 'create' | 'read' | 'write' | 'delete',
    userRole?: string,
  ) {
    const app = getAppForOperation(operation, userRole || 'owner');
    return {
      credentials: this.dataverseService.getCredentialsByApp(app),
      app,
    };
  }

  /**
   * Create a new account record
   */
  async create(accountData: AccountInternalCreate): Promise<AccountInternal> {
    try {
      // Use 'main' app for create operations - requires full permissions for @odata.bind relationships
      const { credentials, app } = this.getCredentials('create', 'main');
      const payload = mapInternalToDataverseCreate(accountData);
      const response = await this.dataverseService.request(
        'POST',
        ACCOUNT_ODATA.TABLE_NAME,
        payload,
        credentials,
        app,
      );

      // Log dos dados persistidos com sucesso
      console.log('✅ [ACCOUNT] Dados persistidos no Dataverse:');
      console.log(JSON.stringify(response, null, 2));

      const createdRecord = response as AccountDataverse;
      return mapDataverseToInternal(createdRecord);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find account by ID (GUID)
   */
  async findById(accountId: string): Promise<AccountInternal | null> {
    try {
      const { credentials, app } = this.getCredentials('read');
      const query = `$filter=${ACCOUNT_FIELDS.TABLE_ACCOUNT_ID} eq '${accountId}'`;
      const response = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?${query}`,
        undefined,
        credentials,
        app,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.length > 0 ? mapDataverseToInternal(records[0]) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find account by business ID (osot-0000001)
   * @param businessId Business ID to search for
   * @param organizationGuid Optional organization GUID for multi-tenant isolation
   */
  async findByBusinessId(
    businessId: string,
    organizationGuid?: string,
  ): Promise<AccountInternal | null> {
    try {
      // ALWAYS use 'main' app for read operations - owner app doesn't have table access
      const { credentials, app } = this.getCredentials('read', 'main');
      let filter = `${ACCOUNT_FIELDS.ACCOUNT_ID} eq '${businessId}'`;
      if (organizationGuid) {
        filter += ` and _osot_table_organization_value eq '${organizationGuid}'`;
      }

      const query = `$filter=${filter}&$select=${ACCOUNT_ODATA.DEFAULT_SELECT}`;
      const response = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?${query}`,
        undefined,
        credentials,
        app,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];

      return records.length > 0 ? mapDataverseToInternal(records[0]) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find account by email address
   * @param email Email address to search for
   * @param organizationGuid Optional organization GUID for multi-tenant isolation
   */
  async findByEmail(
    email: string,
    organizationGuid?: string,
  ): Promise<AccountInternal | null> {
    try {
      // ALWAYS use 'main' app for read operations - owner app doesn't have table access
      const { credentials, app } = this.getCredentials('read', 'main');
      // Build filter with organization isolation if provided
      let filter = `${ACCOUNT_FIELDS.EMAIL} eq '${email.toLowerCase()}'`;
      if (organizationGuid) {
        filter += ` and _osot_table_organization_value eq '${organizationGuid}'`;
      }

      const query = `$filter=${filter}`;
      const response = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?${query}`,
        undefined,
        credentials,
        app,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.length > 0 ? mapDataverseToInternal(records[0]) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find account by email for authentication (includes password)
   * @param email Email address to search for
   * @param organizationGuid Optional organization GUID for multi-tenant isolation
   */
  async findByEmailForAuth(
    email: string,
    organizationGuid?: string,
  ): Promise<AccountInternal | null> {
    try {
      // Build filter with organization isolation if provided
      let filter = `${ACCOUNT_FIELDS.EMAIL} eq '${email.toLowerCase()}'`;
      if (organizationGuid) {
        filter += ` and _osot_table_organization_value eq '${organizationGuid}'`;
      }

      // Include password field for authentication
      const query = `$filter=${filter}&$select=${ACCOUNT_ODATA.DEFAULT_SELECT},${ACCOUNT_FIELDS.PASSWORD}`;
      const response = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.length > 0 ? mapDataverseToInternal(records[0]) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find account by phone for authentication (includes password)
   */
  async findByPhoneForAuth(phone: string): Promise<AccountInternal | null> {
    try {
      // Include password field for authentication
      const query = `$filter=${ACCOUNT_FIELDS.MOBILE_PHONE} eq '${phone}'&$select=${ACCOUNT_ODATA.DEFAULT_SELECT},${ACCOUNT_FIELDS.PASSWORD}`;
      const response = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.length > 0 ? mapDataverseToInternal(records[0]) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find account by phone number
   * @param phone Phone number to search for
   * @param organizationGuid Optional organization GUID for multi-tenant isolation
   */
  async findByPhone(
    phone: string,
    organizationGuid?: string,
  ): Promise<AccountInternal | null> {
    try {
      const { credentials, app } = this.getCredentials('read');
      let filter = `${ACCOUNT_FIELDS.MOBILE_PHONE} eq '${phone}'`;
      if (organizationGuid) {
        filter += ` and _osot_table_organization_value eq '${organizationGuid}'`;
      }

      const query = `$filter=${filter}`;
      const response = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?${query}`,
        undefined,
        credentials,
        app,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.length > 0 ? mapDataverseToInternal(records[0]) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update account record
   */
  async update(
    accountId: string,
    updateData: Partial<AccountInternal>,
    userRole?: string,
  ): Promise<AccountInternal> {
    try {
      // For system operations (status updates, password resets), use 'main' app for elevated permissions
      // Check if this is a system field update (status, privilege, password, etc.)
      const isSystemFieldUpdate =
        'osot_account_status' in updateData ||
        'osot_privilege' in updateData ||
        'osot_account_group' in updateData ||
        'osot_password' in updateData || // Password resets are system-level operations
        'osot_email' in updateData; // Email changes are system-level operations (identity field)

      // Use 'main' app for system field updates, otherwise use role-based app
      const app = isSystemFieldUpdate
        ? 'main'
        : getAppForOperation('write', userRole || 'owner');

      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = mapInternalToDataverseUpdate(updateData);
      await this.dataverseService.request(
        'PATCH',
        `${ACCOUNT_ODATA.TABLE_NAME}(${accountId})`,
        payload,
        credentials,
        app,
      );

      // Fetch the updated record using same app context to ensure permissions match
      // Important: Use same 'main' app for system field updates to read the result
      const readApp = isSystemFieldUpdate
        ? 'main'
        : getAppForOperation('read', userRole || 'owner');
      const readCredentials =
        this.dataverseService.getCredentialsByApp(readApp);

      const endpoint = `${ACCOUNT_ODATA.TABLE_NAME}(${accountId})?$select=${ACCOUNT_ODATA.DEFAULT_SELECT}`;
      const response = await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        readCredentials,
        readApp,
      );

      if (!response) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          operation: 'update_account',
          entityId: accountId,
          entityType: 'Account',
          message: 'Updated record not found',
        });
      }

      return mapDataverseToInternal(response);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'update_account',
        entityId: accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete account record (soft delete by setting status)
   */
  async delete(accountId: string, userRole?: string): Promise<boolean> {
    try {
      const app = getAppForOperation('write', userRole || 'owner');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = {
        [ACCOUNT_FIELDS.ACCOUNT_STATUS]: AccountStatus.INACTIVE,
      };
      await this.dataverseService.request(
        'PATCH',
        `${ACCOUNT_ODATA.TABLE_NAME}(${accountId})`,
        payload,
        credentials,
        app,
      );
      return true;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update password by account ID
   */
  async updatePassword(
    accountId: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      const payload = {
        [ACCOUNT_FIELDS.PASSWORD]: hashedPassword,
      };
      await this.dataverseService.request(
        'PATCH',
        `${ACCOUNT_ODATA.TABLE_NAME}(${accountId})`,
        payload,
      );
      return true;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Check if account exists by ID
   */
  async exists(accountId: string): Promise<boolean> {
    try {
      const result = await this.findById(accountId);
      return !!result;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Check if email is already in use
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const result = await this.findByEmail(email);
      return !!result;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Check if phone number is already in use
   */
  async phoneExists(phone: string): Promise<boolean> {
    try {
      const result = await this.findByPhone(phone);
      return !!result;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find active accounts (account_status = ACTIVE)
   */
  async findActiveAccounts(limit?: number): Promise<AccountInternal[]> {
    try {
      const options = { accountStatus: AccountStatus.ACTIVE, limit };
      const result = await this.findMany(options);
      return result.accounts;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find accounts by group
   */
  async findByAccountGroup(
    accountGroup: AccountGroup,
    limit?: number,
  ): Promise<AccountInternal[]> {
    try {
      const options = { accountGroup, limit };
      const result = await this.findMany(options);
      return result.accounts;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find accounts by status
   */
  async findByStatus(
    accountStatus: AccountStatus,
    options?: AccountSearchOptions,
  ): Promise<AccountInternal[]> {
    try {
      const searchOptions = { ...options, accountStatus };
      const result = await this.findMany(searchOptions);
      return result.accounts;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find accounts by group
   */
  async findByGroup(
    accountGroup: AccountGroup,
    options?: AccountSearchOptions,
  ): Promise<AccountInternal[]> {
    try {
      const result = await this.findMany(options || {});
      return result.accounts.filter(
        (account) => account.osot_account_group === accountGroup,
      );
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find pending accounts (for admin approval)
   */
  async findPendingAccounts(limit?: number): Promise<AccountInternal[]> {
    try {
      return this.findByStatus(AccountStatus.PENDING, { limit });
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Search accounts by name (first or last name)
   * Supports both single name and full name search
   */
  async searchByName(
    searchTerm: string,
    limit?: number,
  ): Promise<AccountInternal[]> {
    try {
      // Split search term to handle "First Last" format
      const nameParts = searchTerm.trim().split(/\s+/);

      if (nameParts.length === 1) {
        // Single name - search in both firstName and lastName
        const options = { firstName: nameParts[0], limit };
        const result = await this.findMany(options);
        return result.accounts;
      } else {
        // Multiple parts - treat as firstName + lastName
        const options = {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' '),
          limit,
        };
        const result = await this.findMany(options);
        return result.accounts;
      }
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find multiple accounts with pagination
   */
  async findMany(
    options: AccountSearchOptions,
  ): Promise<{ accounts: AccountInternal[]; total: number }> {
    try {
      const queryParts: string[] = [];

      // Build filter conditions
      if (options.accountStatus !== undefined) {
        queryParts.push(
          `${ACCOUNT_FIELDS.ACCOUNT_STATUS} eq ${options.accountStatus}`,
        );
      }
      if (options.accountGroup !== undefined) {
        queryParts.push(
          `${ACCOUNT_FIELDS.ACCOUNT_GROUP} eq ${options.accountGroup}`,
        );
      }
      if (options.activeMember !== undefined) {
        queryParts.push(
          `${ACCOUNT_FIELDS.ACTIVE_MEMBER} eq ${options.activeMember}`,
        );
      }
      if (options.firstName) {
        queryParts.push(
          `contains(${ACCOUNT_FIELDS.FIRST_NAME},'${options.firstName}')`,
        );
      }
      if (options.lastName) {
        queryParts.push(
          `contains(${ACCOUNT_FIELDS.LAST_NAME},'${options.lastName}')`,
        );
      }

      // Get total count first
      let countQuery = '';
      if (queryParts.length > 0) {
        countQuery = `$filter=${queryParts.join(' and ')}&$count=true&$top=1`;
      } else {
        countQuery = '$count=true&$top=1';
      }

      const countResponse = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?${countQuery}`,
      );
      const countCollectionResponse =
        countResponse as DataverseCollectionResponse;
      const total = countCollectionResponse['@odata.count'] || 0;

      // Build query for actual data
      let query = '';
      if (queryParts.length > 0) {
        query += `$filter=${queryParts.join(' and ')}`;
      }
      if (options.limit) {
        query += `${query ? '&' : ''}$top=${options.limit}`;
      }
      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        query += `${query ? '&' : ''}$skip=${skip}`;
      }

      const response = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}${query ? `?${query}` : ''}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      const accounts = records.map((record) => mapDataverseToInternal(record));

      return { accounts, total };
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Get total count of accounts
   */
  async count(): Promise<number> {
    try {
      const response = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?$count=true&$top=1`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      return collectionResponse['@odata.count'] || 0;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Count accounts by status
   */
  async countByStatus(): Promise<Record<AccountStatus, number>> {
    try {
      const counts: Record<AccountStatus, number> = {
        [AccountStatus.PENDING]: 0,
        [AccountStatus.ACTIVE]: 0,
        [AccountStatus.INACTIVE]: 0,
      };

      for (const status of Object.values(AccountStatus)) {
        const queryParts = [`${ACCOUNT_FIELDS.ACCOUNT_STATUS} eq ${status}`];
        const query = `$filter=${queryParts.join(' and ')}&$count=true&$top=1`;

        const response = await this.dataverseService.request(
          'GET',
          `${ACCOUNT_ODATA.TABLE_NAME}?${query}`,
        );

        const collectionResponse = response as DataverseCollectionResponse;
        counts[status] = collectionResponse['@odata.count'] || 0;
      }

      return counts;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Count accounts by group
   */
  async countByGroup(): Promise<Record<AccountGroup, number>> {
    try {
      const counts: Record<AccountGroup, number> = {
        [AccountGroup.OTHER]: 0,
        [AccountGroup.OCCUPATIONAL_THERAPIST]: 0,
        [AccountGroup.OCCUPATIONAL_THERAPIST_ASSISTANT]: 0,
        [AccountGroup.VENDOR_ADVERTISER]: 0,
        [AccountGroup.STAFF]: 0,
      };

      for (const group of Object.values(AccountGroup)) {
        const queryParts = [`${ACCOUNT_FIELDS.ACCOUNT_GROUP} eq ${group}`];
        const query = `$filter=${queryParts.join(' and ')}&$count=true&$top=1`;

        const response = await this.dataverseService.request(
          'GET',
          `${ACCOUNT_ODATA.TABLE_NAME}?${query}`,
        );

        const collectionResponse = response as DataverseCollectionResponse;
        counts[group] = collectionResponse['@odata.count'] || 0;
      }

      return counts;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // ========================================
  // MISSING INTERFACE METHODS
  // ========================================

  /**
   * Check if email exists (for uniqueness validation)
   */
  async existsByEmail(
    email: string,
    excludeAccountId?: string,
  ): Promise<boolean> {
    try {
      const queryParts = [`${ACCOUNT_FIELDS.EMAIL} eq '${email}'`];

      if (excludeAccountId) {
        queryParts.push(
          `${ACCOUNT_FIELDS.ACCOUNT_ID} ne '${excludeAccountId}'`,
        );
      }

      const query = `$filter=${queryParts.join(' and ')}&$top=1`;
      const response = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      return (collectionResponse?.value?.length || 0) > 0;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Check if phone exists (for uniqueness validation)
   */
  async existsByPhone(
    phone: string,
    excludeAccountId?: string,
  ): Promise<boolean> {
    try {
      const queryParts = [`${ACCOUNT_FIELDS.MOBILE_PHONE} eq '${phone}'`];

      if (excludeAccountId) {
        queryParts.push(
          `${ACCOUNT_FIELDS.ACCOUNT_ID} ne '${excludeAccountId}'`,
        );
      }

      const query = `$filter=${queryParts.join(' and ')}&$top=1`;
      const response = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      return (collectionResponse?.value?.length || 0) > 0;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Create multiple accounts (bulk import)
   */
  async createMany(
    accountData: AccountInternalCreate[],
  ): Promise<AccountInternal[]> {
    try {
      const createdAccounts: AccountInternal[] = [];

      for (const data of accountData) {
        const account = await this.create(data);
        createdAccounts.push(account);
      }

      return createdAccounts;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update account status for multiple accounts
   */
  async updateStatusMany(
    accountIds: string[],
    status: AccountStatus,
  ): Promise<number> {
    try {
      let updatedCount = 0;

      for (const accountId of accountIds) {
        try {
          await this.update(accountId, { osot_account_status: status });
          updatedCount++;
        } catch (error) {
          // Continue with other accounts if one fails
          console.error(`Failed to update account ${accountId}:`, error);
        }
      }

      return updatedCount;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Get account statistics
   */
  async getStatistics(): Promise<AccountStatistics> {
    try {
      const total = await this.count();
      const statusCounts = await this.countByStatus();
      const groupCounts = await this.countByGroup();

      // Get active members count
      const activeMembersQuery = `$filter=${ACCOUNT_FIELDS.ACTIVE_MEMBER} eq true&$count=true&$top=1`;
      const activeMembersResponse = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?${activeMembersQuery}`,
      );
      const activeMembersCollectionResponse =
        activeMembersResponse as DataverseCollectionResponse;
      const activeMembers =
        activeMembersCollectionResponse['@odata.count'] || 0;

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentQuery = `$filter=${ACCOUNT_FIELDS.CREATED_ON} ge ${thirtyDaysAgo.toISOString()}&$count=true&$top=1`;
      const recentResponse = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?${recentQuery}`,
      );
      const recentCollectionResponse =
        recentResponse as DataverseCollectionResponse;
      const recentRegistrations = recentCollectionResponse['@odata.count'] || 0;

      // Get accounts created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayQuery = `$filter=${ACCOUNT_FIELDS.CREATED_ON} ge ${today.toISOString()}&$count=true&$top=1`;
      const todayResponse = await this.dataverseService.request(
        'GET',
        `${ACCOUNT_ODATA.TABLE_NAME}?${todayQuery}`,
      );
      const todayCollectionResponse =
        todayResponse as DataverseCollectionResponse;
      const createdToday = todayCollectionResponse['@odata.count'] || 0;

      return {
        total,
        active: statusCounts[AccountStatus.ACTIVE] || 0,
        inactive: statusCounts[AccountStatus.INACTIVE] || 0,
        pending: statusCounts[AccountStatus.PENDING] || 0,
        activeMembers,
        byGroup: groupCounts,
        recentRegistrations,
        createdToday,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}

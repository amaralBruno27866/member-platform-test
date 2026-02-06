/**
 * User GUID Resolver Utility
 *
 * Provides helper functions to resolve Dataverse GUIDs from business IDs
 * for Account and Affiliate entities.
 *
 * USAGE CONTEXT:
 * - Controllers that need to create OData bind references
 * - Services that require GUID lookups for relationships
 * - Cross-entity reference creation (membership-preferences, membership-category, etc.)
 *
 * BUSINESS LOGIC:
 * - Converts business IDs (osot-0000192) to Dataverse GUIDs
 * - Handles both Account and Affiliate entity types
 * - Provides proper error handling for not found scenarios
 *
 * @author OSOT Development Team
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccountRepositoryService } from '../../../user-account/account/repositories/account.repository';
import { AffiliateRepositoryService } from '../../../user-account/affiliate/repositories/affiliate.repository';

@Injectable()
export class UserGuidResolverUtil {
  private readonly logger = new Logger(UserGuidResolverUtil.name);

  constructor(
    private readonly accountRepository: AccountRepositoryService,
    private readonly affiliateRepository: AffiliateRepositoryService,
  ) {}

  /**
   * Resolve Dataverse GUID from business ID
   *
   * @param businessId - Business ID (e.g., "osot-0000192")
   * @param userType - Type of user entity ("account" or "affiliate")
   * @returns Dataverse GUID for the user entity
   * @throws AppError with NOT_FOUND code if user not found
   */
  async resolveUserGuid(
    businessId: string,
    userType: 'account' | 'affiliate',
  ): Promise<string> {
    try {
      if (userType === 'account') {
        const account =
          await this.accountRepository.findByBusinessId(businessId);

        if (!account) {
          throw createAppError(ErrorCodes.NOT_FOUND, {
            message: `Account not found with business ID: ${businessId}`,
            entityType: 'Account',
            businessId,
          });
        }

        return account.osot_table_accountid;
      } else {
        const affiliate =
          await this.affiliateRepository.findByBusinessId(businessId);

        if (!affiliate) {
          throw createAppError(ErrorCodes.NOT_FOUND, {
            message: `Affiliate not found with business ID: ${businessId}`,
            entityType: 'Affiliate',
            businessId,
          });
        }

        return affiliate.osot_table_account_affiliateid;
      }
    } catch (error) {
      // Re-throw if already an AppError
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      this.logger.error(
        `Failed to resolve GUID for ${userType} with business ID ${businessId}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: `Failed to retrieve ${userType} GUID`,
        entityType: userType === 'account' ? 'Account' : 'Affiliate',
        businessId,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create OData bind reference for user entity
   *
   * @param businessId - Business ID (e.g., "osot-0000192")
   * @param userType - Type of user entity ("account" or "affiliate")
   * @returns OData bind string (e.g., "/osot_table_accounts(guid)")
   */
  async createUserODataBind(
    businessId: string,
    userType: 'account' | 'affiliate',
  ): Promise<string> {
    const guid = await this.resolveUserGuid(businessId, userType);

    if (userType === 'account') {
      return `/osot_table_accounts(${guid})`;
    } else {
      return `/osot_table_account_affiliates(${guid})`;
    }
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../redis/redis.service';
import { MembershipDataStagingService } from './step_4-data-stager.service';
import { MembershipCategoryCrudService } from '../../../membership/membership-category/services/membership-category-crud.service';
import { MembershipEmploymentCrudService } from '../../../membership/membership-employment/services/membership-employment-crud.service';
import { MembershipPracticesCrudService } from '../../../membership/membership-practices/services/membership-practices-crud.service';
import { MembershipPreferenceCrudService } from '../../../membership/membership-preferences/services/membership-preference-crud.service';
import { AccountCrudService } from '../../../user-account/account/services/account-crud.service';
import { AffiliateCrudService } from '../../../user-account/affiliate/services/affiliate-crud.service';
import { InsuranceActivationService } from '../../../others/insurance/services/insurance-activation.service';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { createAppError } from '../../../../common/errors/error.factory';
import { Privilege } from '../../../../common/enums/privilege.enum';

/**
 * Membership Entity Creator Service
 *
 * Handles Step 10: Create all membership entities sequentially and activate membership
 * Order: Category → Employment → Practices → Preferences → Activate Membership
 *
 * NOTE: Settings is lookup-only, not created here
 */
@Injectable()
export class MembershipEntityCreatorService {
  private readonly logger = new Logger(MembershipEntityCreatorService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly dataStagingService: MembershipDataStagingService,
    private readonly categoryCrudService: MembershipCategoryCrudService,
    private readonly employmentCrudService: MembershipEmploymentCrudService,
    private readonly practicesCrudService: MembershipPracticesCrudService,
    private readonly preferenceCrudService: MembershipPreferenceCrudService,
    private readonly accountCrudService: AccountCrudService,
    private readonly affiliateCrudService: AffiliateCrudService,
    private readonly insuranceActivationService: InsuranceActivationService,
  ) {}

  /**
   * Create all membership entities sequentially
   * Updates progress tracking in Redis for each entity
   */
  async createAllEntities(
    sessionId: string,
    operationId: string,
    userRole: Privilege = Privilege.MAIN,
  ): Promise<{
    categoryGuid: string;
    employmentGuid?: string;
    practicesGuid?: string;
    preferencesGuid?: string;
  }> {
    try {
      // Get session from Redis
      const sessionData = await this.redisService.get(
        `membership-orchestrator:session:${sessionId}`,
      );

      if (!sessionData) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Session not found',
          operationId,
          sessionId,
        });
      }

      const session = JSON.parse(sessionData) as Record<string, any>;

      // Retrieve staged data
      const stagedData =
        await this.dataStagingService.getAllStagedData(sessionId);

      this.logger.log(`Creating membership entities - Session: ${sessionId}`, {
        hasCategory: !!stagedData.category,
        hasEmployment: !!stagedData.employment,
        hasPractices: !!stagedData.practices,
        hasPreferences: !!stagedData.preferences,
      });

      const entityGuids: {
        categoryGuid: string;
        employmentGuid?: string;
        practicesGuid?: string;
        preferencesGuid?: string;
      } = {
        categoryGuid: '',
      };

      // 1. Create Membership Category (always required)
      this.logger.log(`Creating Membership Category - Session: ${sessionId}`);
      const category = await this.categoryCrudService.create(
        stagedData.category as any,
        userRole,
      );
      entityGuids.categoryGuid = category.osot_table_membership_categoryid;
      this.logger.log(`✅ Category created: ${entityGuids.categoryGuid}`);

      // 2. Create Employment (if needed)
      const metadata = session.metadata as Record<string, any> | undefined;
      if (metadata?.needsEmployment && stagedData.employment) {
        this.logger.log(`Creating Employment - Session: ${sessionId}`);
        const employment = await this.employmentCrudService.create(
          stagedData.employment as any,
          userRole,
        );
        // Response DTO doesn't expose GUID, access via internal representation
        const employmentGuid = (employment as any)
          .osot_table_membership_employmentid;
        if (employmentGuid) {
          entityGuids.employmentGuid = employmentGuid as string;
          this.logger.log(
            `✅ Employment created: ${entityGuids.employmentGuid}`,
          );
        }
      }

      // 3. Create Practices (if needed)
      if (metadata?.needsPractices && stagedData.practices) {
        this.logger.log(`Creating Practices - Session: ${sessionId}`);
        const practices = await this.practicesCrudService.create(
          stagedData.practices as any,
          userRole,
        );
        // Response DTO doesn't expose GUID, access via internal representation
        const practicesGuid = (practices as any)
          .osot_table_membership_practicesid;
        if (practicesGuid) {
          entityGuids.practicesGuid = practicesGuid as string;
          this.logger.log(`✅ Practices created: ${entityGuids.practicesGuid}`);
        }
      }

      // 4. Create Preferences (if provided)
      if (stagedData.preferences) {
        this.logger.log(`Creating Preferences - Session: ${sessionId}`);
        const preferences = await this.preferenceCrudService.create(
          stagedData.preferences as any,
          userRole,
        );
        // Response DTO doesn't expose GUID, access via internal representation
        const preferencesGuid = (preferences as any)
          .osot_table_membership_preferenceid;
        if (preferencesGuid) {
          entityGuids.preferencesGuid = preferencesGuid as string;
          this.logger.log(
            `✅ Preferences created: ${entityGuids.preferencesGuid}`,
          );
        }
      }

      this.logger.log(
        `✅ All entities created successfully - Session: ${sessionId}`,
        { entityGuids },
      );

      // 5. Activate membership in Account or Affiliate
      await this.activateMembership(session, entityGuids, sessionId, userRole);

      // 6. Activate insurance (if insurance data exists in order)
      const insuranceActivated = await this.activateInsurance(
        sessionId,
        session,
        userRole,
        operationId,
      );

      this.logger.log(`✅ Step 10 completed - Session: ${sessionId}`, {
        ...entityGuids,
        insuranceActivated,
      });

      return entityGuids;
    } catch (error) {
      this.logger.error(
        `❌ Failed to create membership entities - Session: ${sessionId}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        message: 'Failed to create membership entities',
        operationId,
        sessionId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Activate membership in Account or Affiliate
   * Updates osot_active_member = true
   */
  private async activateMembership(
    session: Record<string, any>,
    entityGuids: {
      categoryGuid: string;
      employmentGuid?: string;
      practicesGuid?: string;
      preferencesGuid?: string;
    },
    sessionId: string,
    userRole: Privilege,
  ): Promise<void> {
    try {
      const userType = session.userType as string; // 'account' | 'affiliate'
      const userGuid = session.accountId as string; // User's GUID

      this.logger.log(
        `Activating membership for ${userType} ${userGuid} - Session: ${sessionId}`,
      );

      if (userType === 'account') {
        // Update Account with active member status
        // Account service expects string role, convert Privilege enum to lowercase string
        const roleString = userRole.toString().toLowerCase();
        await this.accountCrudService.update(
          userGuid,
          {
            osot_active_member: true,
          } as any,
          roleString,
        );
        this.logger.log(`✅ Account membership activated: ${userGuid}`);
      } else if (userType === 'affiliate') {
        // Update Affiliate with active member status
        await this.affiliateCrudService.updateAffiliate(
          userGuid,
          {
            osot_active_member: true,
          } as any,
          userRole, // Affiliate expects Privilege enum
        );
        this.logger.log(`✅ Affiliate membership activated: ${userGuid}`);
      } else {
        throw new Error(`Unknown user type: ${userType}`);
      }

      this.logger.log(
        `✅ Membership activation completed - Session: ${sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to activate membership - Session: ${sessionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Activate insurance by delegating to InsuranceActivationService
   * Only activates if insurance data exists in the order
   *
   * @param sessionId - Membership session ID
   * @param session - Session data containing organization context
   * @param userRole - User privilege level
   * @param operationId - Operation tracking ID
   * @returns true if insurance was activated, false if no insurance or activation failed
   */
  private async activateInsurance(
    sessionId: string,
    session: Record<string, any>,
    userRole: Privilege,
    operationId: string,
  ): Promise<boolean> {
    try {
      // Check if insurance was selected in order
      const insuranceKey = `membership-orchestrator:insurance:${sessionId}`;
      const insuranceData = await this.redisService.get(insuranceKey);

      if (!insuranceData) {
        this.logger.log(`No insurance to activate - Session: ${sessionId}`);
        return false;
      }

      const insurance = JSON.parse(insuranceData) as Record<string, any>;
      const insuranceGuid = insurance.osot_table_insuranceid as string;

      if (!insuranceGuid) {
        this.logger.warn(
          `Insurance data exists but no GUID found - Session: ${sessionId}`,
        );
        return false;
      }

      // Get organization context from session
      const organizationGuid = session.organizationGuid as string;
      if (!organizationGuid) {
        this.logger.warn(
          `No organization context for insurance activation - Session: ${sessionId}`,
        );
        return false;
      }

      // Delegate to dedicated insurance activation service
      const result = await this.insuranceActivationService.activateInsurance(
        insuranceGuid,
        userRole,
        organizationGuid,
        operationId,
      );

      if (result.success) {
        this.logger.log(
          `✅ Insurance activated: ${result.message} - Session: ${sessionId}`,
        );
        return true;
      } else {
        this.logger.warn(
          `⚠️ Insurance activation failed: ${result.message} - Session: ${sessionId}`,
        );
        return false;
      }
    } catch (error) {
      // Don't throw - insurance activation is optional
      // Log error and continue with membership creation
      this.logger.error(
        `❌ Failed to activate insurance - Session: ${sessionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }
}

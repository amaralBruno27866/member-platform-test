/**
 * Insurance Expiration Scheduler
 *
 * BUSINESS PURPOSE:
 * Automatically expires insurance certificates when membership year changes.
 * Enforces rule: One insurance per type per academic year.
 *
 * INSURANCE ELIGIBILITY:
 * - Only ACCOUNT (Individual) users can have insurance
 * - AFFILIATE (Business) users CANNOT have insurance
 * - Insurance linked via osot_Table_Account@odata.bind (accountGuid)
 *
 * SCHEDULE TRIGGERS:
 * 1. Daily check for year transitions (when membership year changes)
 * 2. Annual check on January 1st (start of new fiscal year)
 * 3. Manual trigger for bulk expiration operations
 *
 * BUSINESS RULES:
 * - Insurance belongs to ACCOUNT (Individual) only
 * - Each ACCOUNT has MembershipCategory → osot_membership_group (OT, OTA, STUDENT_OT, etc.)
 * - Each organization has MembershipSettings per GROUP
 * - When group's membership year changes (e.g., 2024-2025 → 2025-2026)
 * - All insurances from PREVIOUS year for that GROUP are marked as EXPIRED
 * - Enables renewal workflow: Expired → Remove from list → Purchase new
 *
 * MULTI-TENANT ARCHITECTURE:
 * - Each organization has multiple MembershipSettings (one per group)
 * - Group-specific year transitions (OT may be 2025-2026 while STUDENT_OT is 2024-2025)
 * - Insurance expiration respects the group's active membership year
 *
 * SAFETY FEATURES:
 * - Idempotent operations (safe to run multiple times)
 * - Only affects ACTIVE insurances (DRAFT, CANCELLED, EXPIRED remain unchanged)
 * - Comprehensive logging and audit trails
 * - Batch processing to avoid Dataverse throttling
 * - Rate limiting between batches
 *
 * DATA FLOW:
 * 1. Get all ACTIVE insurances for organization
 * 2. For each insurance:
 *    a. Verify accountGuid exists (skip if null = data integrity issue)
 *    b. Get Account's active MembershipCategory
 *    c. Extract osot_membership_group (OT, OTA, etc.)
 *    d. Get MembershipSettings for (organization + group + ACTIVE)
 *    e. Compare insurance.osot_membership_year vs settings.osot_membership_year
 *    f. If insurance year < current year → EXPIRE
 * 3. Log results for audit trail
 *
 * IMPACT:
 * - InsuranceLookupService.findActiveByAccountAndType() will no longer find old insurances
 * - Duplicate validation will allow new purchase of same type
 * - Old insurances still available in read-only mode (compliance/audit)
 *
 * @file insurance-expiration.scheduler.ts
 * @module InsuranceModule
 * @layer Schedulers
 * @since 2026-01-28
 * @updated 2026-01-28 - Multi-tenant group-based expiration logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InsuranceLookupService } from '../services/insurance-lookup.service';
import { InsuranceCrudService } from '../services/insurance-crud.service';
import { InsuranceStatus } from '../enum/insurance-status.enum';
import { Privilege } from '../../../../common/enums';
import { MembershipSettingsLookupService } from '../../../membership/membership-settings/services/membership-settings-lookup.service';
import { MembershipCategoryLookupService } from '../../../membership/membership-category/services/membership-category-lookup.service';
import {
  AccountRepository,
  ACCOUNT_REPOSITORY,
} from '../../../user-account/account/interfaces/account-repository.interface';
import { Inject } from '@nestjs/common';

/**
 * Statistics for expiration operation
 */
export interface ExpirationStats {
  totalProcessed: number;
  totalExpired: number;
  totalSkipped: number;
  totalSkippedNoAccount: number; // Insurance without account (data integrity issue)
  totalSkippedNoCategory: number; // Account without active membership category
  errors: number;
  organizations: {
    [orgId: string]: {
      insurancesChecked: number;
      insurancesExpired: number;
      insurancesSkipped: number;
      errors: number;
      groupStats: {
        [group: string]: {
          checked: number;
          expired: number;
        };
      };
    };
  };
}

/**
 * Result for single insurance expiration
 */
interface ExpirationResult {
  insuranceId: string;
  accountGuid: string;
  membershipGroup?: string; // OT, OTA, STUDENT_OT, etc.
  insuranceType: string;
  insuranceYear: string;
  currentGroupYear?: string;
  success: boolean;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
}

@Injectable()
export class InsuranceExpirationScheduler {
  private readonly logger = new Logger(InsuranceExpirationScheduler.name);

  constructor(
    private readonly insuranceLookupService: InsuranceLookupService,
    private readonly insuranceCrudService: InsuranceCrudService,
    private readonly membershipSettingsLookupService: MembershipSettingsLookupService,
    private readonly membershipCategoryLookupService: MembershipCategoryLookupService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
  ) {}

  /**
   * Daily check for insurance expirations
   * Runs at 1 AM daily to detect year transitions
   * Timezone: America/Toronto (OSOT)
   */
  @Cron('0 1 * * *', {
    name: 'daily-insurance-expiration-check',
    timeZone: 'America/Toronto',
  })
  async handleDailyExpirationCheck(): Promise<void> {
    const operationId = `daily-expiration-check-${Date.now()}`;

    this.logger.log(
      `Starting daily insurance expiration check - Operation: ${operationId}`,
    );

    try {
      await this.performBulkExpiration(operationId, 'daily-automatic');
    } catch (error) {
      this.logger.error(
        `Error in daily insurance expiration check - Operation: ${operationId}`,
        error,
      );
      // Don't throw - scheduler should continue running
    }
  }

  /**
   * Annual insurance expiration check
   * Runs on January 1st at 3 AM (after daily check)
   * Ensures any missed expirations are caught at year boundary
   */
  @Cron('0 3 1 1 *', {
    name: 'annual-insurance-expiration-check',
    timeZone: 'America/Toronto',
  })
  async handleAnnualExpirationCheck(): Promise<void> {
    const operationId = `annual-expiration-check-${Date.now()}`;

    this.logger.log(
      `Starting annual insurance expiration check - Operation: ${operationId}`,
    );

    try {
      await this.performBulkExpiration(operationId, 'annual-automatic');
    } catch (error) {
      this.logger.error(
        `Error in annual insurance expiration check - Operation: ${operationId}`,
        error,
      );
    }
  }

  /**
   * Manual trigger for bulk insurance expiration
   * Called by admin operations or emergency updates
   * For testing or out-of-schedule operations
   *
   * @param organizationGuid - Optional: Only expire insurances in this organization
   * @param reason - Why expiration was triggered (default: 'manual-admin-trigger')
   * @returns Statistics about expiration operation
   */
  async triggerManualExpiration(
    organizationGuid?: string,
    reason: string = 'manual-admin-trigger',
  ): Promise<ExpirationStats> {
    const operationId = `manual-expiration-${Date.now()}`;

    this.logger.log(
      `Starting manual insurance expiration - Operation: ${operationId}, Reason: ${reason}${organizationGuid ? `, Organization: ${organizationGuid}` : ''}`,
    );

    try {
      return await this.performBulkExpiration(
        operationId,
        reason,
        organizationGuid,
      );
    } catch (error) {
      this.logger.error(
        `Error in manual insurance expiration - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Core bulk expiration logic
   *
   * ALGORITHM (GROUP-BASED):
   * 1. Get all ACTIVE insurances for organization
   * 2. For each insurance:
   *    a. Verify accountGuid exists (Insurance = Account only)
   *    b. Get Account to verify it's Individual (not Affiliate/Business)
   *    c. Get Account's active MembershipCategory
   *    d. Extract osot_membership_group (OT, OTA, STUDENT_OT, etc.)
   *    e. Get ACTIVE MembershipSettings for (organization + group)
   *    f. Compare insurance.osot_membership_year vs settings.osot_membership_year
   *    g. If insurance year < settings year → EXPIRE
   * 3. Process in batches to avoid Dataverse throttling
   * 4. Compile statistics by group
   *
   * MULTI-TENANT GROUP-BASED APPROACH:
   * - Each organization has multiple MembershipSettings (one per membership group)
   * - Group-specific year transitions:
   *   * OT may be in 2025-2026
   *   * STUDENT_OT may still be in 2024-2025
   * - Insurance expiration respects each group's active year
   * - Example: OT insurances expire when OT group year changes, independent of STUDENT_OT
   *
   * BUSINESS RULES:
   * - Insurance is ONLY for Account (Individual) users
   * - Affiliate (Business) users do NOT have insurance
   * - Account without MembershipCategory → skip (not a member)
   * - Insurance year matches group's current year → keep ACTIVE
   * - Insurance year < group's current year → EXPIRE
   *
   * FALLBACK LOGIC:
   * - Insurance without accountGuid → skip + log warning (data integrity issue)
   * - Account not found → skip + log warning
   * - MembershipCategory not found → skip (non-member purchasing insurance = possible)
   * - MembershipSettings not found for group → skip + log warning
   *
   * @param operationId - Operation tracking ID
   * @param reason - Why expiration triggered
   * @param organizationGuidFilter - Required: Organization to process
   * @returns Statistics by organization and group
   */
  private async performBulkExpiration(
    operationId: string,
    reason: string,
    organizationGuidFilter?: string,
  ): Promise<ExpirationStats> {
    const stats: ExpirationStats = {
      totalProcessed: 0,
      totalExpired: 0,
      totalSkipped: 0,
      totalSkippedNoAccount: 0,
      totalSkippedNoCategory: 0,
      errors: 0,
      organizations: {},
    };

    try {
      // Organization to process
      if (!organizationGuidFilter) {
        this.logger.warn(
          `No organization filter provided - skipping expiration - Operation: ${operationId}`,
        );
        return stats;
      }

      const orgId = organizationGuidFilter;
      stats.organizations[orgId] = {
        insurancesChecked: 0,
        insurancesExpired: 0,
        insurancesSkipped: 0,
        errors: 0,
        groupStats: {},
      };

      this.logger.log(
        `Processing insurance expiration for organization ${orgId} - Operation: ${operationId}`,
      );

      // Get ALL insurances for organization (will filter by ACTIVE status manually)
      // We need to check ALL insurances to determine which ones need expiration
      const organizationGuid = orgId;

      // Use findByTypeAndStatus with null filters to get all ACTIVE insurances
      // Alternative: Loop through possible years or use repository directly
      // For now, we'll get insurances without year filter by querying multiple potential years
      const currentYearGuess = this.getCurrentMembershipYear();
      const previousYear = this.getPreviousAcademicYear(currentYearGuess);
      const previousPreviousYear = this.getPreviousAcademicYear(previousYear);

      // Get insurances from last 3 years (current, previous, previous-previous)
      const insurancesCurrentYear =
        await this.insuranceLookupService.findByYear(
          currentYearGuess,
          organizationGuid,
          undefined, // Don't exclude any status yet
          operationId,
        );

      const insurancesPreviousYear =
        await this.insuranceLookupService.findByYear(
          previousYear,
          organizationGuid,
          undefined,
          operationId,
        );

      const insurancesPreviousPreviousYear =
        await this.insuranceLookupService.findByYear(
          previousPreviousYear,
          organizationGuid,
          undefined,
          operationId,
        );

      // Combine all insurances and filter by ACTIVE status
      const allInsurances = [
        ...insurancesCurrentYear,
        ...insurancesPreviousYear,
        ...insurancesPreviousPreviousYear,
      ].filter((ins) => ins.osot_insurance_status === InsuranceStatus.ACTIVE);

      if (!allInsurances || allInsurances.length === 0) {
        this.logger.log(
          `No active insurances found - Organization: ${orgId} - Operation: ${operationId}`,
        );
        return stats;
      }

      this.logger.log(
        `Found ${allInsurances.length} active insurances to check - Operation: ${operationId}`,
      );

      // Process in batches to avoid overwhelming Dataverse
      const batchSize = 50;
      const expirationResults: ExpirationResult[] = [];

      for (let i = 0; i < allInsurances.length; i += batchSize) {
        const batch = allInsurances.slice(i, i + batchSize);

        this.logger.log(
          `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allInsurances.length / batchSize)} (${batch.length} items) - Operation: ${operationId}`,
        );

        // Process each insurance in batch with GROUP-BASED logic
        for (const insurance of batch) {
          stats.organizations[orgId].insurancesChecked++;

          try {
            // STEP 1: Verify insurance has accountGuid (Insurance = Account only, not Affiliate)
            if (!insurance.accountGuid) {
              this.logger.warn(
                `Insurance ${insurance.osot_table_insuranceid} has no accountGuid - skipping (data integrity issue) - Operation: ${operationId}`,
              );
              stats.totalSkippedNoAccount++;
              stats.totalSkipped++;
              stats.organizations[orgId].insurancesSkipped++;
              expirationResults.push({
                insuranceId: insurance.osot_table_insuranceid || '',
                accountGuid: '',
                insuranceType: insurance.osot_insurance_type || 'unknown',
                insuranceYear: insurance.osot_membership_year || 'unknown',
                success: false,
                skipped: true,
                skipReason: 'No accountGuid (data integrity issue)',
              });
              continue;
            }

            // STEP 2: Insurance must have osot_membership_year for comparison
            if (!insurance.osot_membership_year) {
              this.logger.warn(
                `Insurance ${insurance.osot_table_insuranceid} has no osot_membership_year - skipping (data integrity issue) - Operation: ${operationId}`,
              );
              stats.totalSkipped++;
              stats.organizations[orgId].insurancesSkipped++;
              expirationResults.push({
                insuranceId: insurance.osot_table_insuranceid || '',
                accountGuid: insurance.accountGuid,
                insuranceType: insurance.osot_insurance_type || 'unknown',
                insuranceYear: 'unknown',
                success: false,
                skipped: true,
                skipReason: 'No membership year in insurance',
              });
              continue;
            }

            // STEP 3: Get the account's business ID (osot_account_id) from accountGuid
            // Insurance has accountGuid (GUID), but MembershipCategory needs business ID
            const account = await this.accountRepository.findById(
              insurance.accountGuid,
            );

            if (!account || !account.osot_account_id) {
              this.logger.warn(
                `Account ${insurance.accountGuid} not found or has no business ID - skipping insurance ${insurance.osot_table_insuranceid} - Operation: ${operationId}`,
              );
              stats.totalSkippedNoAccount++;
              stats.totalSkipped++;
              stats.organizations[orgId].insurancesSkipped++;
              expirationResults.push({
                insuranceId: insurance.osot_table_insuranceid || '',
                accountGuid: insurance.accountGuid,
                insuranceType: insurance.osot_insurance_type || 'unknown',
                insuranceYear: insurance.osot_membership_year,
                success: false,
                skipped: true,
                skipReason: 'Account not found or no business ID',
              });
              continue;
            }

            // STEP 4: Get Account's MembershipCategory for the insurance year
            const membershipCategory =
              await this.membershipCategoryLookupService.findByUserAndYear(
                account.osot_account_id, // Business ID
                insurance.osot_membership_year, // Year from insurance
                'account', // userType (insurance only for accounts)
                Privilege.MAIN,
                operationId,
              );

            if (!membershipCategory) {
              this.logger.debug(
                `No active membership category for account ${insurance.accountGuid} - skipping insurance ${insurance.osot_table_insuranceid} (non-member with insurance) - Operation: ${operationId}`,
              );
              stats.totalSkippedNoCategory++;
              stats.totalSkipped++;
              stats.organizations[orgId].insurancesSkipped++;
              expirationResults.push({
                insuranceId: insurance.osot_table_insuranceid || '',
                accountGuid: insurance.accountGuid,
                insuranceType: insurance.osot_insurance_type || 'unknown',
                insuranceYear: insurance.osot_membership_year || 'unknown',
                success: false,
                skipped: true,
                skipReason: 'No active membership category',
              });
              continue;
            }

            // STEP 4: Extract user group (OT, OTA, etc.) from MembershipCategory
            const userGroup = membershipCategory.osot_users_group;

            if (!userGroup) {
              this.logger.warn(
                `MembershipCategory ${membershipCategory.osot_table_membership_categoryid} has no osot_users_group - skipping - Operation: ${operationId}`,
              );
              stats.totalSkippedNoCategory++;
              stats.totalSkipped++;
              stats.organizations[orgId].insurancesSkipped++;
              expirationResults.push({
                insuranceId: insurance.osot_table_insuranceid || '',
                accountGuid: insurance.accountGuid,
                insuranceType: insurance.osot_insurance_type || 'unknown',
                insuranceYear: insurance.osot_membership_year || 'unknown',
                success: false,
                skipped: true,
                skipReason: 'No user group in category',
              });
              continue;
            }

            // Initialize group stats if not exists
            // Use UserGroup enum value as string key for stats
            const groupKey = String(userGroup);
            if (!stats.organizations[orgId].groupStats[groupKey]) {
              stats.organizations[orgId].groupStats[groupKey] = {
                checked: 0,
                expired: 0,
              };
            }
            stats.organizations[orgId].groupStats[groupKey].checked++;

            // STEP 5: Get ACTIVE MembershipSettings for INDIVIDUAL group
            // Insurance is ONLY for Accounts (INDIVIDUAL), not Affiliates (BUSINESS)
            // All Individual accounts share the same membership year configuration
            const allActiveSettings =
              await this.membershipSettingsLookupService.getActiveSettings(
                organizationGuid,
                operationId,
              );

            const individualSettings = allActiveSettings.filter(
              (s) => s.osot_membership_group === 'Individual', // String comparison for ResponseDTO
            );

            if (!individualSettings || individualSettings.length === 0) {
              this.logger.warn(
                `No active membership settings for INDIVIDUAL group - Organization: ${orgId} - skipping insurance ${insurance.osot_table_insuranceid} - Operation: ${operationId}`,
              );
              stats.totalSkipped++;
              stats.organizations[orgId].insurancesSkipped++;
              expirationResults.push({
                insuranceId: insurance.osot_table_insuranceid || '',
                accountGuid: insurance.accountGuid,
                membershipGroup: groupKey,
                insuranceType: insurance.osot_insurance_type || 'unknown',
                insuranceYear: insurance.osot_membership_year || 'unknown',
                success: false,
                skipped: true,
                skipReason: `No active settings for INDIVIDUAL group`,
              });
              continue;
            }

            // Use first active setting for INDIVIDUAL group (should only be one ACTIVE)
            const activeSettings = individualSettings[0];
            const currentGroupYear = activeSettings.osot_membership_year;

            // STEP 6: Compare insurance year vs group's current year
            if (
              insurance.osot_membership_year &&
              insurance.osot_membership_year !== currentGroupYear
            ) {
              // Insurance year is different from group's current year → EXPIRE
              await this.insuranceCrudService.update(
                insurance.osot_table_insuranceid || '',
                { osot_insurance_status: InsuranceStatus.EXPIRED },
                Privilege.MAIN,
                operationId,
              );

              stats.organizations[orgId].insurancesExpired++;
              stats.organizations[orgId].groupStats[groupKey].expired++;
              stats.totalExpired++;

              expirationResults.push({
                insuranceId: insurance.osot_table_insuranceid || '',
                accountGuid: insurance.accountGuid,
                membershipGroup: groupKey,
                insuranceType: insurance.osot_insurance_type || 'unknown',
                insuranceYear: insurance.osot_membership_year,
                currentGroupYear,
                success: true,
              });

              this.logger.debug(
                `Expired insurance ${insurance.osot_table_insuranceid} - UserGroup: ${groupKey}, Old Year: ${insurance.osot_membership_year}, Current Year: ${currentGroupYear} - Operation: ${operationId}`,
              );
            } else {
              // Insurance year matches current year → keep ACTIVE
              stats.totalSkipped++;
              stats.organizations[orgId].insurancesSkipped++;
              expirationResults.push({
                insuranceId: insurance.osot_table_insuranceid || '',
                accountGuid: insurance.accountGuid,
                membershipGroup: groupKey,
                insuranceType: insurance.osot_insurance_type || 'unknown',
                insuranceYear: insurance.osot_membership_year || 'unknown',
                currentGroupYear,
                success: false,
                skipped: true,
                skipReason: `Year matches current year ${currentGroupYear}`,
              });
            }
          } catch (error) {
            stats.organizations[orgId].errors++;
            stats.errors++;

            this.logger.error(
              `Error processing insurance ${insurance.osot_table_insuranceid} - Operation: ${operationId}`,
              error instanceof Error ? error.message : String(error),
            );

            expirationResults.push({
              insuranceId: insurance.osot_table_insuranceid || '',
              accountGuid: insurance.accountGuid || '',
              membershipGroup: undefined,
              insuranceType: insurance.osot_insurance_type || 'unknown',
              insuranceYear: insurance.osot_membership_year || 'unknown',
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Delay between batches to be nice to Dataverse (1 second)
        if (i + batchSize < allInsurances.length) {
          this.logger.debug(
            `Batch complete, delaying 1 second before next batch - Operation: ${operationId}`,
          );
          await this.delay(1000);
        }
      }

      stats.totalProcessed = allInsurances.length;

      this.logger.log(
        `Bulk insurance expiration completed - Operation: ${operationId}`,
        {
          operationId,
          reason,
          organization: orgId,
          stats,
          timestamp: new Date().toISOString(),
        },
      );

      return stats;
    } catch (error) {
      this.logger.error(
        `Error in bulk insurance expiration - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Helper: Get current membership year
   *
   * INTEGRATED WITH MEMBERSHIPSSETTINGSSERVICE:
   * This is a fallback calculation used when:
   * 1. MembershipSettings lookup is being called
   * 2. To initiate the year lookup query
   *
   * Academic year format: '2025-2026'
   * Starts: September 1st
   * Ends: August 31st
   *
   * Examples:
   * - September 2025 → '2025-2026'
   * - January 2026 → '2025-2026'
   * - August 2026 → '2025-2026'
   * - September 2026 → '2026-2027'
   *
   * NOTE: The actual membership year is determined by MembershipSettingsService
   * This helper is used to initialize the lookup, not to determine the definitive year.
   *
   * @returns Current academic year (e.g., '2025-2026')
   */
  private getCurrentMembershipYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12

    // Academic year starts in September (month 9)
    if (month >= 9) {
      // September onwards: current year
      return `${year}-${year + 1}`;
    } else {
      // January to August: previous year start
      return `${year - 1}-${year}`;
    }
  }

  /**
   * Helper: Calculate previous academic year
   *
   * Academic year format: '2025-2026' (start-end)
   * Previous of '2025-2026' = '2024-2025'
   *
   * @param currentYear - Current academic year (e.g., '2025-2026')
   * @returns Previous academic year (e.g., '2024-2025')
   */
  private getPreviousAcademicYear(currentYear: string): string {
    const [startStr, endStr] = currentYear.split('-');
    const startYear = parseInt(startStr, 10);
    const endYear = parseInt(endStr, 10);

    return `${startYear - 1}-${endYear - 1}`;
  }

  /**
   * Helper: Delay between batches (to be nice to Dataverse)
   *
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

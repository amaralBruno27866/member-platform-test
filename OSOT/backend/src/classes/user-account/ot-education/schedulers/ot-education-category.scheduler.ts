/**
 * OT Education Category Auto-Update Scheduler
 *
 * BUSINESS PURPOSE:
 * Automatically updates education categories based on the natural progression:
 * STUDENT → NEW_GRADUATED → GRADUATED
 *
 * SCHEDULE TRIGGERS:
 * 1. Daily check at membership expiration periods
 * 2. Annual review on membership year transition
 * 3. Manual trigger for bulk updates
 *
 * SAFETY FEATURES:
 * - Idempotent operations (safe to run multiple times)
 * - Comprehensive logging and audit trails
 * - Rate limiting to prevent Dataverse throttling
 *
 * BUSINESS RULES APPLIED:
 * - Uses same logic as manual determination
 * - Respects active membership periods
 * - Considers graduation year progression
 * - Maintains data integrity across updates
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OtEducationCrudService } from '../services/ot-education-crud.service';
import { OtEducationLookupService } from '../services/ot-education-lookup.service';
import { OtEducationBusinessRuleService } from '../services/ot-education-business-rule.service';
import { EducationMembershipIntegrationService } from '../../../../common/services/education-membership-integration.service';
import { EducationCategory, GraduationYear } from '../../../../common/enums';
import {
  OtEducationRepository,
  OT_EDUCATION_REPOSITORY,
} from '../interfaces/ot-education-repository.interface';

export interface CategoryUpdateStats {
  totalProcessed: number;
  studentsToNewGrad: number;
  newGradToGraduated: number;
  graduatedRemaining: number;
  errors: number;
  skipped: number;
}

export interface CategoryUpdateResult {
  otEducationId: string;
  userBusinessId: string;
  oldCategory: EducationCategory;
  newCategory: EducationCategory;
  graduationYear: GraduationYear;
  reason: string;
  success: boolean;
  error?: string;
}

interface EducationRecord {
  osot_ot_education_id: string;
  osot_user_business_id: string;
  osot_education_category: EducationCategory;
  osot_ot_grad_year: GraduationYear;
}

@Injectable()
export class OtEducationCategoryScheduler {
  private readonly logger = new Logger(OtEducationCategoryScheduler.name);

  constructor(
    private readonly otEducationCrudService: OtEducationCrudService,
    private readonly otEducationLookupService: OtEducationLookupService,
    private readonly businessRuleService: OtEducationBusinessRuleService,
    private readonly educationMembershipService: EducationMembershipIntegrationService,
    @Inject(OT_EDUCATION_REPOSITORY)
    private readonly otEducationRepository: OtEducationRepository,
  ) {}

  /**
   * Daily check for education category updates
   * Runs at 2 AM daily to avoid peak usage
   */
  @Cron('0 2 * * *', {
    name: 'daily-education-category-check',
    timeZone: 'America/Toronto', // OSOT timezone
  })
  async handleDailyEducationCategoryCheck() {
    const operationId = `daily-category-check-${Date.now()}`;

    this.logger.log(
      `Starting daily education category check - Operation: ${operationId}`,
    );

    try {
      // Check if we're near membership expiration period
      const shouldRunFullUpdate = this.shouldRunFullUpdate();

      if (shouldRunFullUpdate) {
        await this.performBulkCategoryUpdate(operationId, 'daily-automatic');
      } else {
        this.logger.log(
          `Skipping daily update - not in membership transition period - Operation: ${operationId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error in daily education category check - Operation: ${operationId}`,
        error,
      );
    }
  }

  /**
   * Annual education category update
   * Runs on January 1st to handle year transitions
   */
  @Cron('0 3 1 1 *', {
    name: 'annual-education-category-update',
    timeZone: 'America/Toronto',
  })
  async handleAnnualEducationCategoryUpdate() {
    const operationId = `annual-category-update-${Date.now()}`;

    this.logger.log(
      `Starting annual education category update - Operation: ${operationId}`,
    );

    try {
      await this.performBulkCategoryUpdate(operationId, 'annual-automatic');
    } catch (error) {
      this.logger.error(
        `Error in annual education category update - Operation: ${operationId}`,
        error,
      );
    }
  }

  /**
   * Manual trigger for bulk education category updates
   * Can be called by admin operations or emergency updates
   */
  async triggerManualCategoryUpdate(
    reason: string = 'manual-admin-trigger',
  ): Promise<CategoryUpdateStats> {
    const operationId = `manual-category-update-${Date.now()}`;

    this.logger.log(
      `Starting manual education category update - Operation: ${operationId}, Reason: ${reason}`,
    );

    try {
      return await this.performBulkCategoryUpdate(operationId, reason);
    } catch (error) {
      this.logger.error(
        `Error in manual education category update - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Core bulk update logic
   */
  private async performBulkCategoryUpdate(
    operationId: string,
    reason: string,
  ): Promise<CategoryUpdateStats> {
    const stats: CategoryUpdateStats = {
      totalProcessed: 0,
      studentsToNewGrad: 0,
      newGradToGraduated: 0,
      graduatedRemaining: 0,
      errors: 0,
      skipped: 0,
    };

    try {
      // Get all education records that might need updates
      const educationRecords = await this.getEducationRecordsForUpdate();

      this.logger.log(
        `Found ${educationRecords.length} education records to evaluate - Operation: ${operationId}`,
      );

      const results: CategoryUpdateResult[] = [];

      // Process in batches to avoid overwhelming Dataverse
      const batchSize = 50;
      for (let i = 0; i < educationRecords.length; i += batchSize) {
        const batch = educationRecords.slice(i, i + batchSize);

        this.logger.log(
          `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(educationRecords.length / batchSize)} - Operation: ${operationId}`,
        );

        const batchResults = await this.processBatch(batch, operationId);
        results.push(...batchResults);

        // Small delay between batches to be nice to Dataverse
        if (i + batchSize < educationRecords.length) {
          await this.delay(1000); // 1 second delay
        }
      }

      // Calculate final statistics
      for (const result of results) {
        stats.totalProcessed++;

        if (result.success) {
          if (
            result.oldCategory === EducationCategory.STUDENT &&
            result.newCategory === EducationCategory.NEW_GRADUATED
          ) {
            stats.studentsToNewGrad++;
          } else if (
            result.oldCategory === EducationCategory.NEW_GRADUATED &&
            result.newCategory === EducationCategory.GRADUATED
          ) {
            stats.newGradToGraduated++;
          } else if (result.newCategory === EducationCategory.GRADUATED) {
            stats.graduatedRemaining++;
          }
        } else {
          stats.errors++;
        }
      }

      this.logger.log(
        `Bulk education category update completed - Operation: ${operationId}`,
        {
          operationId,
          reason,
          stats,
          timestamp: new Date().toISOString(),
        },
      );

      return stats;
    } catch (error) {
      this.logger.error(
        `Error in bulk education category update - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Process a batch of education records
   */
  private async processBatch(
    batch: EducationRecord[],
    operationId: string,
  ): Promise<CategoryUpdateResult[]> {
    const results: CategoryUpdateResult[] = [];

    for (const record of batch) {
      try {
        const result = await this.updateSingleEducationCategory(
          record,
          operationId,
        );
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Error updating education category for record ${record.osot_ot_education_id} - Operation: ${operationId}`,
          error,
        );

        results.push({
          otEducationId: record.osot_ot_education_id,
          userBusinessId: record.osot_user_business_id,
          oldCategory: record.osot_education_category,
          newCategory: record.osot_education_category,
          graduationYear: record.osot_ot_grad_year,
          reason: 'Processing error',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Update a single education record's category
   */
  private async updateSingleEducationCategory(
    record: EducationRecord,
    operationId: string,
  ): Promise<CategoryUpdateResult> {
    const currentCategory = record.osot_education_category;
    const graduationYear = record.osot_ot_grad_year;

    // Determine new category using same business logic
    const newCategory =
      await this.businessRuleService.determineEducationCategory(graduationYear);

    const result: CategoryUpdateResult = {
      otEducationId: record.osot_ot_education_id,
      userBusinessId: record.osot_user_business_id,
      oldCategory: currentCategory,
      newCategory: newCategory,
      graduationYear: graduationYear,
      reason: 'Automatic category progression',
      success: false,
    };

    // Only update if category actually changed
    if (currentCategory !== newCategory) {
      try {
        // Use repository directly for system-level updates
        // osot_education_category is read-only in UpdateOtEducationDto for user updates,
        // but system schedulers can update it directly via repository
        await this.otEducationRepository.update(record.osot_ot_education_id, {
          osot_education_category: newCategory,
        });

        result.success = true;
        result.reason = `Updated from ${EducationCategory[currentCategory]} to ${EducationCategory[newCategory]}`;

        this.logger.log(
          `Education category updated - Operation: ${operationId}`,
          {
            otEducationId: record.osot_ot_education_id,
            userBusinessId: record.osot_user_business_id,
            oldCategory: EducationCategory[currentCategory],
            newCategory: EducationCategory[newCategory],
            graduationYear,
          },
        );
      } catch (error) {
        result.error = error instanceof Error ? error.message : 'Update failed';
        throw error;
      }
    } else {
      result.success = true;
      result.reason = 'No change needed';
    }

    return result;
  }

  /**
   * Get education records that might need category updates
   */
  private async getEducationRecordsForUpdate(): Promise<EducationRecord[]> {
    try {
      // Get students and new graduates that might need progression
      const students =
        await this.otEducationLookupService.findByEducationCategory(
          EducationCategory.STUDENT,
        );
      const newGrads =
        await this.otEducationLookupService.findByEducationCategory(
          EducationCategory.NEW_GRADUATED,
        );

      // Transform to our interface format
      const allRecords = [...students, ...newGrads];
      return allRecords.map((record) => ({
        osot_ot_education_id: record.osot_ot_education_id as string,
        osot_user_business_id: record.osot_user_business_id as string,
        osot_education_category:
          record.osot_education_category as EducationCategory,
        osot_ot_grad_year: record.osot_ot_grad_year as GraduationYear,
      }));
    } catch (error) {
      this.logger.error('Error getting education records for update', error);
      throw error;
    }
  }

  /**
   * Check if we should run a full update based on membership periods
   */
  private shouldRunFullUpdate(): boolean {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // 1-12

      // Run updates during typical membership expiration periods
      // Adjust these months based on OSOT's membership cycles
      const updateMonths = [1, 6, 12]; // January, June, December

      return updateMonths.includes(currentMonth);
    } catch (error) {
      this.logger.error('Error checking if should run full update', error);
      return false;
    }
  }

  /**
   * Utility method to add delays between operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get statistics about current education categories (for monitoring)
   */
  async getCategoryDistributionStats(): Promise<{
    students: number;
    newGraduated: number;
    graduated: number;
    total: number;
  }> {
    try {
      const studentsData =
        await this.otEducationLookupService.findByEducationCategory(
          EducationCategory.STUDENT,
        );
      const newGradsData =
        await this.otEducationLookupService.findByEducationCategory(
          EducationCategory.NEW_GRADUATED,
        );
      const graduatedData =
        await this.otEducationLookupService.findByEducationCategory(
          EducationCategory.GRADUATED,
        );

      const stats = {
        students: studentsData.length,
        newGraduated: newGradsData.length,
        graduated: graduatedData.length,
        total: studentsData.length + newGradsData.length + graduatedData.length,
      };

      return stats;
    } catch (error) {
      this.logger.error('Error getting category distribution stats', error);
      throw error;
    }
  }
}

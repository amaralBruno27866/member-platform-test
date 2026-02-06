import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OtaEducationBusinessRuleService } from '../services/ota-education-business-rule.service';
import {
  OtaEducationRepository,
  OTA_EDUCATION_REPOSITORY,
} from '../interfaces/ota-education-repository.interface';
import { EducationCategory } from '../../../../common/enums';
import { OtaEducationInternal } from '../interfaces/ota-education-internal.interface';

/**
 * Interface for category update statistics
 */
export interface CategoryUpdateStats {
  totalProcessed: number;
  studentsUpdated: number;
  newGraduatedUpdated: number;
  graduatedUpdated: number;
  errors: number;
  processingTimeMs: number;
}

/**
 * Interface for category update operation result
 */
export interface CategoryUpdateResult {
  success: boolean;
  stats: CategoryUpdateStats;
  errors: string[];
  timestamp: Date;
}

/**
 * OTA Education Category Scheduler
 *
 * AUTOMATED LIFECYCLE MANAGEMENT:
 * - Daily Processing: Updates education categories based on graduation year and membership status
 * - Annual Reset: Processes all records on January 1st to ensure category accuracy
 * - Batch Processing: Handles records in batches of 50 to prevent system overload
 * - Rate Limiting: 1-second delays between batches for system stability
 * - Timezone: America/Toronto for consistent Canadian operations
 *
 * BUSINESS RULES:
 * - STUDENT: Pre-graduation or future graduation year
 * - NEW_GRADUATED: Graduated within 2 years of active membership expires date
 * - GRADUATED: Graduated more than 2 years ago relative to membership expires date
 *
 * ENTERPRISE FEATURES:
 * - Comprehensive audit logging with operation tracking
 * - Error handling with graceful degradation
 * - Performance monitoring and statistics collection
 * - Integration with membership settings for fraud prevention
 * - Detailed error reporting and alerting capabilities
 */
@Injectable()
export class OtaEducationCategoryScheduler {
  private readonly logger = new Logger(OtaEducationCategoryScheduler.name);
  private isProcessing = false;

  constructor(
    private readonly otaEducationBusinessRuleService: OtaEducationBusinessRuleService,
    @Inject(OTA_EDUCATION_REPOSITORY)
    private readonly otaEducationRepository: OtaEducationRepository,
  ) {}

  /**
   * Daily education category update cron job
   * Runs daily at 2:00 AM Toronto time
   *
   * Updates education categories for all OTA education records based on:
   * - Current graduation year
   * - Active membership expires date
   * - Business rule validation
   */
  @Cron('0 2 * * *', {
    name: 'ota-education-category-daily-update',
    timeZone: 'America/Toronto',
  })
  async handleDailyEducationCategoryUpdate(): Promise<void> {
    if (this.isProcessing) {
      this.logger.warn(
        'Education category update already in progress, skipping scheduled run',
      );
      return;
    }

    this.logger.log('Starting daily OTA education category update');

    try {
      const result = await this.updateEducationCategories(false);

      this.logger.log('Daily OTA education category update completed', {
        totalProcessed: result.stats.totalProcessed,
        errors: result.stats.errors,
        processingTimeMs: result.stats.processingTimeMs,
        timestamp: result.timestamp,
      });
    } catch (error) {
      this.logger.error('Daily OTA education category update failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Annual comprehensive education category update
   * Runs on January 1st at 3:00 AM Toronto time
   *
   * Performs comprehensive category updates for all records to ensure:
   * - Annual membership renewal impacts are captured
   * - Category accuracy after membership year transitions
   * - Complete data consistency across the platform
   */
  @Cron('0 3 1 1 *', {
    name: 'ota-education-category-annual-update',
    timeZone: 'America/Toronto',
  })
  async handleAnnualEducationCategoryUpdate(): Promise<void> {
    if (this.isProcessing) {
      this.logger.warn(
        'Education category update already in progress, skipping annual run',
      );
      return;
    }

    this.logger.log(
      'Starting annual comprehensive OTA education category update',
    );

    try {
      const result = await this.updateEducationCategories(true);

      this.logger.log('Annual OTA education category update completed', {
        totalProcessed: result.stats.totalProcessed,
        errors: result.stats.errors,
        processingTimeMs: result.stats.processingTimeMs,
        timestamp: result.timestamp,
        isAnnualRun: true,
      });
    } catch (error) {
      this.logger.error('Annual OTA education category update failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        isAnnualRun: true,
      });
    }
  }

  /**
   * Core education category update logic
   *
   * @param isAnnualRun Whether this is the comprehensive annual update
   * @returns CategoryUpdateResult with detailed statistics and error information
   */
  async updateEducationCategories(
    isAnnualRun: boolean = false,
  ): Promise<CategoryUpdateResult> {
    const startTime = Date.now();
    const operationId = `ota_category_update_${startTime}`;

    this.isProcessing = true;

    const stats: CategoryUpdateStats = {
      totalProcessed: 0,
      studentsUpdated: 0,
      newGraduatedUpdated: 0,
      graduatedUpdated: 0,
      errors: 0,
      processingTimeMs: 0,
    };

    const errors: string[] = [];

    this.logger.log(
      `Starting OTA education category update process - Operation: ${operationId}`,
      {
        operationId,
        isAnnualRun,
        timestamp: new Date(),
      },
    );

    try {
      // Get all OTA education records
      const educationRecords = await this.otaEducationRepository.findMany({});

      this.logger.log(
        `Retrieved ${educationRecords.length} OTA education records for processing`,
        {
          operationId,
          totalRecords: educationRecords.length,
        },
      );

      // Process records in batches of 50
      const batchSize = 50;
      const totalBatches = Math.ceil(educationRecords.length / batchSize);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(
          batchStart + batchSize,
          educationRecords.length,
        );
        const batch = educationRecords.slice(batchStart, batchEnd);

        this.logger.log(`Processing batch ${batchIndex + 1}/${totalBatches}`, {
          operationId,
          batchIndex: batchIndex + 1,
          totalBatches,
          batchSize: batch.length,
        });

        // Process each record in the batch
        for (const education of batch) {
          try {
            const wasUpdated = await this.processEducationRecord(
              education,
              operationId,
            );

            stats.totalProcessed++;

            if (wasUpdated) {
              // Count by category type for detailed statistics
              switch (education.osot_education_category) {
                case EducationCategory.STUDENT:
                  stats.studentsUpdated++;
                  break;
                case EducationCategory.NEW_GRADUATED:
                  stats.newGraduatedUpdated++;
                  break;
                case EducationCategory.GRADUATED:
                  stats.graduatedUpdated++;
                  break;
              }
            }
          } catch (error) {
            stats.errors++;
            const errorMessage = `Failed to process education record ${education.osot_ota_education_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMessage);

            this.logger.error('Error processing education record', {
              operationId,
              educationId: education.osot_ota_education_id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Rate limiting: 1-second delay between batches
        if (batchIndex < totalBatches - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      stats.processingTimeMs = Date.now() - startTime;

      this.logger.log(
        `OTA education category update completed - Operation: ${operationId}`,
        {
          operationId,
          stats,
          isAnnualRun,
          errorCount: errors.length,
        },
      );

      return {
        success: errors.length === 0,
        stats,
        errors,
        timestamp: new Date(),
      };
    } catch (error) {
      stats.processingTimeMs = Date.now() - startTime;
      const errorMessage = `Critical error during education category update: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);

      this.logger.error(
        `Critical error in OTA education category update - Operation: ${operationId}`,
        {
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stats,
        },
      );

      return {
        success: false,
        stats,
        errors,
        timestamp: new Date(),
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual education record for category updates
   *
   * @param education OTA education record to process
   * @param operationId Operation tracking ID
   * @returns boolean indicating if record was updated
   */
  private async processEducationRecord(
    education: OtaEducationInternal,
    operationId: string,
  ): Promise<boolean> {
    // Skip records without graduation year
    if (!education.osot_ota_grad_year) {
      this.logger.debug('Skipping education record without graduation year', {
        operationId,
        educationId: education.osot_ota_education_id,
      });
      return false;
    }

    try {
      // Determine the correct education category
      const newCategory =
        await this.otaEducationBusinessRuleService.determineEducationCategory(
          education.osot_ota_grad_year,
        );

      // Check if category needs updating
      if (education.osot_education_category === newCategory) {
        this.logger.debug(
          'Education category already correct, no update needed',
          {
            operationId,
            educationId: education.osot_ota_education_id,
            currentCategory: education.osot_education_category,
          },
        );
        return false;
      }

      // Update the education category
      await this.otaEducationRepository.update(
        education.osot_table_ota_educationid,
        { osot_education_category: newCategory },
      );

      this.logger.log('Education category updated successfully', {
        operationId,
        educationId: education.osot_ota_education_id,
        oldCategory: education.osot_education_category,
        newCategory: newCategory,
        graduationYear: education.osot_ota_grad_year,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to process education record category update', {
        operationId,
        educationId: education.osot_ota_education_id,
        graduationYear: education.osot_ota_grad_year,
        currentCategory: education.osot_education_category,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Manual trigger for education category updates
   * Used by admin endpoints for on-demand processing
   *
   * @param isAnnualRun Whether to run as comprehensive annual update
   * @returns CategoryUpdateResult with processing statistics
   */
  async triggerManualUpdate(
    isAnnualRun: boolean = false,
  ): Promise<CategoryUpdateResult> {
    this.logger.log('Manual OTA education category update triggered', {
      isAnnualRun,
      triggeredAt: new Date(),
    });

    return this.updateEducationCategories(isAnnualRun);
  }

  /**
   * Get current processing status
   *
   * @returns boolean indicating if scheduler is currently processing
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Get scheduler health status
   *
   * @returns object with scheduler health information
   */
  getHealthStatus() {
    return {
      isHealthy: true,
      isProcessing: this.isProcessing,
      lastCheck: new Date(),
      schedulerName: 'OtaEducationCategoryScheduler',
    };
  }
}

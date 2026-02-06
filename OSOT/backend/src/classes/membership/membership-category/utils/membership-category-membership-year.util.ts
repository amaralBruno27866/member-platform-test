/**
 * @fileoverview Membership Category Membership Year Utility Functions
 * @description Utility functions for automatic determination of osot_membership_year field
 * @author OSOT Development Team
 * @since 2024
 *
 * This file provides utility functions for:
 * - Automatic membership year determination based on active membership settings
 * - Integration with membership-settings module
 * - Consistent logic across membership category operations
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { MembershipSettingsRepository } from '../../membership-settings/interfaces/membership-settings-repository.interface';
import { MEMBERSHIP_SETTINGS_REPOSITORY } from '../../membership-settings/repositories/membership-settings.repository';
import { AccountStatus } from '../../../../common/enums';

/**
 * Membership Category Membership Year Service
 * Provides automatic determination of osot_membership_year field
 */
@Injectable()
export class MembershipCategoryMembershipYearService {
  private readonly logger = new Logger(
    MembershipCategoryMembershipYearService.name,
  );

  constructor(
    @Inject(MEMBERSHIP_SETTINGS_REPOSITORY)
    private readonly membershipSettingsRepository: MembershipSettingsRepository,
  ) {
    this.logger.log('MembershipCategoryMembershipYearService initialized');
  }

  /**
   * Get current active membership year
   * Used to automatically populate osot_membership_year field
   *
   * IMPORTANT: This returns the ACTIVE membership year from settings,
   * NOT the calendar year! For example: In November 2025, the active
   * membership year might be 2026.
   *
   * @returns Current active membership year as string
   */
  async getCurrentMembershipYear(organizationGuid: string): Promise<string> {
    const operationId = `get_current_membership_year_${Date.now()}`;

    try {
      // Get all active membership settings
      const activeSettings =
        await this.membershipSettingsRepository.findByStatus(
          organizationGuid,
          AccountStatus.ACTIVE,
        );

      if (!activeSettings || activeSettings.length === 0) {
        this.logger.error(
          `CRITICAL: No active membership settings found - Operation: ${operationId}`,
          {
            operationId,
            timestamp: new Date().toISOString(),
          },
        );
        throw new Error(
          'No active membership settings found. Cannot determine membership year.',
        );
      }

      // Get the year from first active setting
      // NOTE: All active settings should have the same year
      const activeYear = activeSettings[0].osot_membership_year;

      return activeYear;
    } catch (error) {
      this.logger.error(
        `Error determining current membership year - Operation: ${operationId}`,
        {
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw error; // Re-throw instead of returning fallback
    }
  }

  /**
   * Validate membership year against active settings
   * Used to verify if a specific year is valid for membership registration
   */
  async validateMembershipYear(
    organizationGuid: string,
    year: string,
  ): Promise<boolean> {
    const operationId = `validate_membership_year_${Date.now()}`;

    this.logger.log(`Validating membership year - Operation: ${operationId}`, {
      operationId,
      year,
      timestamp: new Date().toISOString(),
    });

    try {
      const yearSettings = await this.membershipSettingsRepository.findByYear(
        organizationGuid,
        year,
      );

      const hasActiveSettings = yearSettings.some(
        (setting) =>
          setting.osot_membership_year_status === AccountStatus.ACTIVE,
      );

      this.logger.log(
        `Membership year validation result - Operation: ${operationId}`,
        {
          operationId,
          year,
          isValid: hasActiveSettings,
          settingsCount: yearSettings.length,
          timestamp: new Date().toISOString(),
        },
      );

      return hasActiveSettings;
    } catch (error) {
      this.logger.error(
        `Error validating membership year - Operation: ${operationId}`,
        {
          operationId,
          year,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      return false;
    }
  }
}

/**
 * Standalone function for backward compatibility and direct usage
 * Determines current membership year from active membership settings
 *
 * IMPORTANT: Returns the ACTIVE membership year from settings,
 * NOT the calendar year! For example: In November 2025, the active
 * membership year might be 2026.
 */
export async function getCurrentMembershipYear(
  organizationGuid: string,
  repository: MembershipSettingsRepository,
): Promise<string> {
  try {
    // Get all active membership settings
    const activeSettings = await repository.findByStatus(
      organizationGuid,
      AccountStatus.ACTIVE,
    );

    if (!activeSettings || activeSettings.length === 0) {
      throw new Error(
        'No active membership settings found. Cannot determine membership year.',
      );
    }

    // Get the year from first active setting
    // NOTE: All active settings should have the same year
    return activeSettings[0].osot_membership_year;
  } catch (error) {
    console.error('Error getting current membership year:', error);
    throw error; // Re-throw instead of returning fallback
  }
}

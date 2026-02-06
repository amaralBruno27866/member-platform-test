/**
 * @fileoverview Membership Settings Utility Functions
 * @description Utility functions for membership settings operations
 * @author Bruno Amaral
 * @since 2024
 *
 * This file provides utility functions for:
 * - Active membership date calculations
 * - Education category determinations
 * - Integration support for other modules
 */

import { Injectable, Inject } from '@nestjs/common';
import { MembershipSettingsRepository } from '../interfaces/membership-settings-repository.interface';
import { MEMBERSHIP_SETTINGS_REPOSITORY } from '../repositories/membership-settings.repository';
import { AccountStatus } from '../../../../common/enums';

@Injectable()
export class MembershipSettingsUtilsService {
  constructor(
    @Inject(MEMBERSHIP_SETTINGS_REPOSITORY)
    private readonly repository: MembershipSettingsRepository,
  ) {}

  /**
   * Get current active membership expires date
   * Used by education modules to determine category classification
   * @returns ISO date string or null
   */
  async getCurrentActiveMembershipExpiresDate(
    organizationGuid: string,
  ): Promise<string | null> {
    try {
      // Get all active settings
      const activeSettings = await this.repository.findByStatus(
        organizationGuid,
        AccountStatus.ACTIVE,
      );

      if (!activeSettings || activeSettings.length === 0) {
        return null;
      }

      // Get the most common year from active settings
      const yearCounts = new Map<string, number>();
      for (const setting of activeSettings) {
        const year = setting.osot_membership_year;
        yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
      }

      let currentYear = '';
      let maxCount = 0;
      for (const [year, count] of yearCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          currentYear = year;
        }
      }

      // Filter by current year and find the latest expiry date
      let latestExpiryDate: Date | null = null;

      for (const setting of activeSettings) {
        // Check if this setting is for current year (compare as strings)
        if (
          setting.osot_membership_year === currentYear &&
          setting.osot_year_ends
        ) {
          const expiryDate = new Date(setting.osot_year_ends);

          if (!latestExpiryDate || expiryDate > latestExpiryDate) {
            latestExpiryDate = expiryDate;
          }
        }
      }

      // Return ISO string instead of Date object
      return latestExpiryDate ? latestExpiryDate.toISOString() : null;
    } catch (error) {
      console.error(
        'Error getting current active membership expires date:',
        error,
      );
      return null;
    }
  }

  /**
   * Check if membership is currently active for a specific year
   */
  async isMembershipActiveForYear(
    organizationGuid: string,
    year: string,
  ): Promise<boolean> {
    try {
      const settings = await this.repository.findByYear(organizationGuid, year);

      // Check if any setting for this year is active
      return settings.some(
        (setting) =>
          setting.osot_membership_year_status === AccountStatus.ACTIVE,
      );
    } catch (error) {
      console.error('Error checking membership active status:', error);
      return false;
    }
  }

  /**
   * Get active membership settings for current year
   */
  async getActiveMembershipSettings(organizationGuid: string) {
    try {
      return await this.repository.findByStatus(
        organizationGuid,
        AccountStatus.ACTIVE,
      );
    } catch (error) {
      console.error('Error getting active membership settings:', error);
      return [];
    }
  }
}

/**
 * Standalone function for backward compatibility
 * Used by education modules for category determination
 * @returns ISO date string or null
 */
export async function getCurrentActiveMembershipExpiresDate(
  organizationGuid: string,
  repository: MembershipSettingsRepository,
): Promise<string | null> {
  try {
    // Get all active settings
    const activeSettings = await repository.findByStatus(
      organizationGuid,
      AccountStatus.ACTIVE,
    );

    if (!activeSettings || activeSettings.length === 0) {
      return null;
    }

    // Get the most common year from active settings (NOT calendar year!)
    const yearCounts = new Map<string, number>();
    for (const setting of activeSettings) {
      const year = setting.osot_membership_year;
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    }

    let currentYear = '';
    let maxCount = 0;
    for (const [year, count] of yearCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        currentYear = year;
      }
    }

    // Filter by current year and find the latest expiry date
    let latestExpiryDate: Date | null = null;

    for (const setting of activeSettings) {
      // Check if this setting is for current year (compare as strings)
      if (
        setting.osot_membership_year === currentYear &&
        setting.osot_year_ends
      ) {
        const expiryDate = new Date(setting.osot_year_ends);

        if (!latestExpiryDate || expiryDate > latestExpiryDate) {
          latestExpiryDate = expiryDate;
        }
      }
    }

    // Return ISO string instead of Date object
    return latestExpiryDate ? latestExpiryDate.toISOString() : null;
  } catch (error) {
    console.error(
      'Error getting current active membership expires date:',
      error,
    );
    return null;
  }
}

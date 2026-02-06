import { Injectable, Logger, Inject } from '@nestjs/common';
import { EducationCategory, GraduationYear } from '../enums';
import { getGraduationYearDisplayName } from '../enums/graduation-year.enum';
import { getCurrentActiveMembershipExpiresDate } from '../../classes/membership/membership-settings/utils/membership-settings.utils';
import { MembershipSettingsRepository } from '../../classes/membership/membership-settings/interfaces/membership-settings-repository.interface';
import { MEMBERSHIP_SETTINGS_REPOSITORY } from '../../classes/membership/membership-settings/repositories/membership-settings.repository';

/**
 * Education Membership Integration Service
 *
 * Provides integration between Education and Membership domains
 * without creating direct module dependencies.
 */
@Injectable()
export class EducationMembershipIntegrationService {
  private readonly logger = new Logger(
    EducationMembershipIntegrationService.name,
  );

  constructor(
    @Inject(MEMBERSHIP_SETTINGS_REPOSITORY)
    private readonly membershipSettingsRepository: MembershipSettingsRepository,
  ) {
    this.logger.log('EducationMembershipIntegrationService initialized');
  }

  /**
   * Determine education category based on graduation year and membership status
   * Uses the same comprehensive logic as OTA Education
   */
  async determineEducationCategory(
    graduationYear: GraduationYear,
    currentYear?: number,
  ): Promise<EducationCategory> {
    const operationId = `determine_education_category_${Date.now()}`;

    this.logger.log(
      `Determining education category - Operation: ${operationId}`,
      {
        operationId,
        graduationYear,
        currentYear: currentYear || new Date().getFullYear(),
      },
    );

    try {
      // Step 1: Get current active membership expires date
      // Use OSOT master organization for this cross-org lookup
      const organizationGuid = 'a4f46aa9-2d5e-ef11-a670-000d3a8c1c9c'; // OSOT master org
      const membershipExpiresDate = await getCurrentActiveMembershipExpiresDate(
        organizationGuid,
        this.membershipSettingsRepository,
      );

      // Step 2: Use comprehensive business logic to determine category
      return this.determineEducationCategoryWithMembership(
        graduationYear,
        membershipExpiresDate,
        currentYear,
      );
    } catch (error) {
      this.logger.error(
        `Error determining education category - Operation: ${operationId}`,
        {
          operationId,
          graduationYear,
          currentYear,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );

      // Fallback to simple logic if membership check fails
      return this.determineEducationCategorySimple(graduationYear, currentYear);
    }
  }

  /**
   * Comprehensive education category determination with membership consideration
   * Replicates OtaEducationBusinessLogic.determineEducationCategory
   */
  private determineEducationCategoryWithMembership(
    graduationYear: GraduationYear,
    membershipExpiresDate?: string,
    currentYear: number = new Date().getFullYear(),
  ): EducationCategory {
    const gradYear = this.getGraduationYearValue(graduationYear);
    const today = new Date();

    // Rule 1: If graduation year > current year → STUDENT (still studying)
    if (gradYear > currentYear) {
      return EducationCategory.STUDENT;
    }

    // Rule 3: If graduation year == current year OR current year-1 AND today <= expires_date → NEW_GRADUATED
    if (
      (gradYear === currentYear || gradYear === currentYear - 1) &&
      membershipExpiresDate
    ) {
      const expiresDate = new Date(membershipExpiresDate);
      // Check if today is within the membership period (before or on expires date)
      if (today <= expiresDate) {
        return EducationCategory.NEW_GRADUATED;
      }
    }

    // Rule 2: If graduation year < current year-1 → GRADUATED (already graduated)
    if (gradYear < currentYear - 1) {
      return EducationCategory.GRADUATED;
    }

    // Fallback (should not reach here with current logic)
    return EducationCategory.GRADUATED;
  }

  /**
   * Simple education category determination (fallback)
   */
  private determineEducationCategorySimple(
    graduationYear: GraduationYear,
    currentYear?: number,
  ): EducationCategory {
    const currentYearValue = currentYear || new Date().getFullYear();
    const gradYear = this.getGraduationYearValue(graduationYear);

    // Simple business logic based on graduation year
    if (gradYear > currentYearValue) {
      return EducationCategory.STUDENT;
    }

    return EducationCategory.GRADUATED;
  }

  /**
   * Convert GraduationYear enum to actual year number
   * Replicates OtaEducationBusinessLogic.getGraduationYearValue
   */
  private getGraduationYearValue(graduationYear?: GraduationYear): number {
    if (!graduationYear) {
      return new Date().getFullYear();
    }

    // Handle specific decade ranges
    if (graduationYear === GraduationYear.PRE_1960) return 1959;
    if (graduationYear === GraduationYear.DECADE_1960_1969) return 1965;
    if (graduationYear === GraduationYear.DECADE_1970_1979) return 1975;

    // For individual years (1980-2027), parse from display name
    const displayName = getGraduationYearDisplayName(graduationYear);
    const yearNumber = parseInt(displayName, 10);
    if (!isNaN(yearNumber)) return yearNumber;

    // For dynamic years beyond 2027
    if (graduationYear > GraduationYear.YEAR_2027) {
      return 2027 + (graduationYear - GraduationYear.YEAR_2027);
    }

    // Fallback
    return new Date().getFullYear();
  }
}

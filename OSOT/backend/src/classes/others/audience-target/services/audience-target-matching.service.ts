/**
 * Audience Target Matching Service
 *
 * CORE RESPONSIBILITY:
 * Matches user profiles against audience target criteria to determine
 * if users qualify to see specific content (products, communications, events, etc.)
 *
 * MATCHING LOGIC:
 * - OR logic across ALL 35 fields: If ANY field matches, user qualifies
 * - Empty target (all fields null/empty) = PUBLIC content (everyone qualifies)
 * - Empty user fields are ignored (don't disqualify)
 * - Arrays: User value must be IN target values array
 *
 * GENERIC DESIGN:
 * - Reusable across entities: Product, Communication, Event, Webinar, etc.
 * - Entity-agnostic: Doesn't know about products/communications
 * - Pure matching logic: No data fetching (caller provides profile + target)
 *
 * USAGE PATTERN:
 * ```typescript
 * // In any entity service (Product, Communication, etc.)
 * const userProfile = await this.buildUserProfile(userGuid);
 * const filteredEntities = await this.matchingService.filterEntitiesByUserProfile(
 *   allProducts,
 *   (product) => product.osot_table_productid,
 *   userProfile
 * );
 * ```
 */

import { Injectable, Logger } from '@nestjs/common';
import { AudienceTargetInternal } from '../interfaces/audience-target-internal.interface';
import { UserProfile } from '../interfaces/user-profile.interface';

@Injectable()
export class AudienceTargetMatchingService {
  private readonly logger = new Logger(AudienceTargetMatchingService.name);

  /**
   * Check if user profile matches audience target criteria
   *
   * MATCHING RULES:
   * 1. Empty target (all fields null/empty) = PUBLIC = everyone matches
   * 2. OR logic: If ANY field matches, user qualifies
   * 3. Field matching: User's value must be IN target's array
   * 4. Null/empty user fields = ignored (don't disqualify)
   *
   * @param userProfile - Complete user profile with all 35 fields
   * @param target - Audience target criteria
   * @returns true if user qualifies, false otherwise
   */
  matchesTarget(
    userProfile: UserProfile,
    target: AudienceTargetInternal,
  ): boolean {
    // If target is completely empty = PUBLIC content
    if (this.isPublicTarget(target)) {
      this.logger.debug(`Target is public (all fields empty)`);
      return true;
    }

    // Check each field group - OR logic (any match qualifies)
    const matches = [
      // Account Group (1 field)
      this.matchSingleValue(
        userProfile.accountGroup,
        target.osot_account_group,
        'accountGroup',
      ),

      // Affiliate (3 fields)
      this.matchArrayValues(
        userProfile.affiliateArea,
        target.osot_affiliate_area,
        'affiliateArea',
      ),
      this.matchArrayValues(
        userProfile.affiliateCity,
        target.osot_affiliate_city,
        'affiliateCity',
      ),
      this.matchArrayValues(
        userProfile.affiliateProvince,
        target.osot_affiliate_province,
        'affiliateProvince',
      ),

      // Address (2 fields)
      this.matchSingleValue(
        userProfile.membershipCity,
        target.osot_membership_city,
        'membershipCity',
      ),
      this.matchSingleValue(
        userProfile.province,
        target.osot_province,
        'province',
      ),

      // Identity (4 fields)
      this.matchSingleValue(userProfile.gender, target.osot_gender, 'gender'),
      this.matchArrayValues(
        userProfile.indigenousDetails,
        target.osot_indigenous_details,
        'indigenousDetails',
      ),
      this.matchArrayValues(
        userProfile.language,
        target.osot_language,
        'language',
      ),
      this.matchArrayValues(userProfile.race, target.osot_race, 'race'),

      // Membership Category (2 fields)
      this.matchSingleValue(
        userProfile.affiliateEligibility,
        target.osot_eligibility_affiliate,
        'affiliateEligibility',
      ),
      this.matchSingleValue(
        userProfile.membershipCategory,
        target.osot_membership_category,
        'membershipCategory',
      ),

      // Employment (9 fields)
      this.matchSingleValue(
        userProfile.earnings,
        target.osot_earnings,
        'earnings',
      ),
      this.matchSingleValue(
        userProfile.earningsSelfdirect,
        target.osot_earnings_selfdirect,
        'earningsSelfdirect',
      ),
      this.matchSingleValue(
        userProfile.earningsSelfindirect,
        target.osot_earnings_selfindirect,
        'earningsSelfindirect',
      ),
      this.matchArrayValues(
        userProfile.employmentBenefits,
        target.osot_employment_benefits,
        'employmentBenefits',
      ),
      this.matchSingleValue(
        userProfile.employmentStatus,
        target.osot_employment_status,
        'employmentStatus',
      ),
      this.matchArrayValues(
        userProfile.positionFunding,
        target.osot_position_funding,
        'positionFunding',
      ),
      this.matchSingleValue(
        userProfile.practiceYears,
        target.osot_practice_years,
        'practiceYears',
      ),
      this.matchArrayValues(
        userProfile.roleDescription,
        target.osot_role_description,
        'roleDescription',
      ),
      this.matchSingleValue(
        userProfile.workHours,
        target.osot_work_hours,
        'workHours',
      ),

      // Practice (4 fields)
      this.matchArrayValues(
        userProfile.clientAge,
        target.osot_client_age,
        'clientAge',
      ),
      this.matchArrayValues(
        userProfile.practiceArea,
        target.osot_practice_area,
        'practiceArea',
      ),
      this.matchArrayValues(
        userProfile.practiceServices,
        target.osot_practice_services,
        'practiceServices',
      ),
      this.matchArrayValues(
        userProfile.practiceSettings,
        target.osot_practice_settings,
        'practiceSettings',
      ),

      // Preference (4 fields)
      this.matchArrayValues(
        userProfile.membershipSearchTools,
        target.osot_membership_search_tools,
        'membershipSearchTools',
      ),
      this.matchArrayValues(
        userProfile.practicePromotion,
        target.osot_practice_promotion,
        'practicePromotion',
      ),
      this.matchArrayValues(
        userProfile.psychotherapySupervision,
        target.osot_psychotherapy_supervision,
        'psychotherapySupervision',
      ),
      this.matchArrayValues(
        userProfile.thirdParties,
        target.osot_third_parties,
        'thirdParties',
      ),

      // Education OT (3 fields)
      this.matchArrayValues(
        userProfile.cotoStatus,
        target.osot_coto_status,
        'cotoStatus',
      ),
      this.matchSingleValue(
        userProfile.otGradYear,
        target.osot_ot_grad_year,
        'otGradYear',
      ),
      this.matchSingleValue(
        userProfile.otUniversity,
        target.osot_ot_university,
        'otUniversity',
      ),

      // Education OTA (2 fields)
      this.matchSingleValue(
        userProfile.otaGradYear,
        target.osot_ota_grad_year,
        'otaGradYear',
      ),
      this.matchSingleValue(
        userProfile.otaCollege,
        target.osot_ota_college,
        'otaCollege',
      ),
    ];

    // OR logic: Any match = qualified
    const qualified = matches.some((match) => match === true);

    this.logger.debug(
      `User ${userProfile.userBusinessId} ${qualified ? 'MATCHES' : 'DOES NOT MATCH'} target`,
    );

    return qualified;
  }

  /**
   * Check if target is public (all fields empty)
   */
  private isPublicTarget(target: AudienceTargetInternal): boolean {
    // Log the target for debugging
    this.logger.debug(
      `Checking if target is public. Target ID: ${target.osot_target}`,
    );
    this.logger.debug(
      `Sample fields: accountGroup=${JSON.stringify(target.osot_account_group)}, affiliateArea=${JSON.stringify(target.osot_affiliate_area)}, gender=${JSON.stringify(target.osot_gender)}`,
    );

    const hasAnyValue =
      this.hasValue(target.osot_account_group) ||
      this.hasValue(target.osot_affiliate_area) ||
      this.hasValue(target.osot_affiliate_city) ||
      this.hasValue(target.osot_affiliate_province) ||
      this.hasValue(target.osot_membership_city) ||
      this.hasValue(target.osot_province) ||
      this.hasValue(target.osot_gender) ||
      this.hasValue(target.osot_indigenous_details) ||
      this.hasValue(target.osot_language) ||
      this.hasValue(target.osot_race) ||
      this.hasValue(target.osot_eligibility_affiliate) ||
      this.hasValue(target.osot_membership_category) ||
      this.hasValue(target.osot_earnings) ||
      this.hasValue(target.osot_earnings_selfdirect) ||
      this.hasValue(target.osot_earnings_selfindirect) ||
      this.hasValue(target.osot_employment_benefits) ||
      this.hasValue(target.osot_employment_status) ||
      this.hasValue(target.osot_position_funding) ||
      this.hasValue(target.osot_practice_years) ||
      this.hasValue(target.osot_role_description) ||
      this.hasValue(target.osot_work_hours) ||
      this.hasValue(target.osot_client_age) ||
      this.hasValue(target.osot_practice_area) ||
      this.hasValue(target.osot_practice_services) ||
      this.hasValue(target.osot_practice_settings) ||
      this.hasValue(target.osot_membership_search_tools) ||
      this.hasValue(target.osot_practice_promotion) ||
      this.hasValue(target.osot_psychotherapy_supervision) ||
      this.hasValue(target.osot_third_parties) ||
      this.hasValue(target.osot_coto_status) ||
      this.hasValue(target.osot_ot_grad_year) ||
      this.hasValue(target.osot_ot_university) ||
      this.hasValue(target.osot_ota_grad_year) ||
      this.hasValue(target.osot_ota_college);

    this.logger.debug(
      `Target has any value: ${hasAnyValue}, isPublic: ${!hasAnyValue}`,
    );
    return !hasAnyValue;
  }

  /**
   * Match single value field (user value IN target array)
   */
  private matchSingleValue(
    userValue: number | undefined,
    targetValue: number[] | string | undefined,
    fieldName: string,
  ): boolean {
    // Target field empty = not filtering on this field
    if (!this.hasValue(targetValue)) {
      return false;
    }

    // User doesn't have value = can't match
    if (userValue === undefined || userValue === null) {
      return false;
    }

    const targetArray = this.ensureArray(targetValue);
    const matches = targetArray.includes(userValue);

    if (matches) {
      this.logger.debug(`✓ Match on ${fieldName}: ${userValue}`);
    }

    return matches;
  }

  /**
   * Match array field (any user value IN target array)
   */
  private matchArrayValues(
    userValues: number[] | undefined,
    targetValue: number[] | string | undefined,
    fieldName: string,
  ): boolean {
    // Target field empty = not filtering on this field
    if (!this.hasValue(targetValue)) {
      return false;
    }

    // User doesn't have values = can't match
    if (!userValues || userValues.length === 0) {
      return false;
    }

    const targetArray = this.ensureArray(targetValue);

    // Check if ANY user value is IN target array
    const matches = userValues.some((userVal) => targetArray.includes(userVal));

    if (matches) {
      this.logger.debug(
        `✓ Match on ${fieldName}: ${userValues.filter((v) => targetArray.includes(v)).join(', ')}`,
      );
    }

    return matches;
  }

  /**
   * Check if value exists (not null/undefined/empty array)
   */
  private hasValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }

  /**
   * Ensure value is array format
   */
  private ensureArray(value: number[] | string | undefined): number[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => parseInt(v.trim(), 10))
        .filter((n) => !isNaN(n));
    }
    return [];
  }
}

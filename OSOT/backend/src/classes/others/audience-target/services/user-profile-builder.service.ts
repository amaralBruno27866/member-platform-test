/**
 * User Profile Builder Service
 *
 * RESPONSIBILITY:
 * Builds complete UserProfile from multiple Dataverse entities
 * for audience target matching.
 *
 * DATA SOURCES (8 entities):
 * - Table_Account: account_group
 * - Table_Address: membership_city, province
 * - Table_Identity: gender, indigenous_details, language, race
 * - Table_Membership: affiliate_eligibility, membership_category
 * - Table_Membership_Employment: 9 employment fields
 * - Table_Membership_Practice: 4 practice fields
 * - Table_Membership_Preferences: 4 preference fields
 * - Table_OT_Education: 3 OT education fields
 * - Table_OTA_Education: 2 OTA education fields
 * - Table_Affiliate: 3 affiliate fields
 *
 * USAGE:
 * ```typescript
 * const userProfile = await this.profileBuilder.buildUserProfile(userGuid);
 * const matches = this.matchingService.matchesTarget(userProfile, target);
 * ```
 *
 * NOTE: This is a TEMPORARY implementation that makes individual API calls.
 * TODO: Optimize with batch requests or GraphQL when available.
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { UserProfile } from '../interfaces/user-profile.interface';
import { City } from '../../../../common/enums/cities.enum';
import { Province } from '../../../../common/enums/provinces.enum';
import { AccountGroup } from '../../../../common/enums/account-group.enum';
import { Gender } from '../../../../common/enums/gender-choice.enum';
import { AffiliateEligibility } from '../../../../common/enums/affiliate-eligibility-enum';
import { Category } from '../../../../common/enums/categories-enum';
import { HourlyEarnings } from '../../../membership/membership-employment/enums/hourly-earnings.enum';
import { EmploymentStatus } from '../../../membership/membership-employment/enums/employment-status.enum';
import { PracticeYears } from '../../../membership/membership-employment/enums/practice-years.enum';
import { WorkHours } from '../../../membership/membership-employment/enums/work-hours.enum';
import { GraduationYear } from '../../../../common/enums/graduation-year.enum';
import { OtUniversity } from '../../../../common/enums/ot-university.enum';
import { OtaCollege } from '../../../../common/enums/ota-college.enum';

// Dataverse entity interfaces
interface DataverseAccountData {
  osot_account?: string;
  osot_account_group?: AccountGroup;
  osot_active_member?: boolean;
}

interface DataverseAddressData {
  osot_membership_city?: City;
  osot_province?: Province;
}

interface DataverseIdentityData {
  osot_gender?: Gender;
  osot_indigenous_details?: string;
  osot_language?: string;
  osot_race?: string;
}

interface DataverseMembershipData {
  osot_eligibility_affiliate?: AffiliateEligibility;
  osot_membership_category?: Category;
}

interface DataverseEmploymentData {
  osot_earnings?: HourlyEarnings;
  osot_earnings_selfdirect?: HourlyEarnings;
  osot_earnings_selfindirect?: HourlyEarnings;
  osot_employment_benefits?: string;
  osot_employment_status?: EmploymentStatus;
  osot_position_funding?: string;
  osot_practice_years?: PracticeYears;
  osot_role_description?: string;
  osot_work_hours?: WorkHours;
}

interface DataversePracticeData {
  osot_client_age?: string;
  osot_practice_area?: string;
  osot_practice_services?: string;
  osot_practice_settings?: string;
}

interface DataversePreferenceData {
  osot_membership_search_tools?: string;
  osot_practice_promotion?: string;
  osot_psychotherapy_supervision?: string;
  osot_third_parties?: string;
}

interface DataverseOtEducationData {
  osot_coto_status?: string;
  osot_ot_grad_year?: GraduationYear;
  osot_ot_university?: OtUniversity;
}

interface DataverseOtaEducationData {
  osot_ota_grad_year?: GraduationYear;
  osot_ota_college?: OtaCollege;
}

interface DataverseAffiliateData {
  osot_affiliate_area?: string;
  osot_affiliate_city?: string;
  osot_affiliate_province?: string;
}

@Injectable()
export class UserProfileBuilderService {
  private readonly logger = new Logger(UserProfileBuilderService.name);

  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Build complete user profile from Dataverse
   *
   * @param userGuid - User's GUID from Table_Account
   * @returns Complete user profile with all 35 fields populated
   */
  async buildUserProfile(userGuid: string): Promise<UserProfile> {
    this.logger.log(`Building user profile for ${userGuid}`);

    try {
      // Fetch data from all relevant entities in parallel
      const [
        account,
        address,
        identity,
        membership,
        employment,
        practice,
        preference,
        otEducation,
        otaEducation,
        affiliate,
      ] = await Promise.allSettled([
        this.fetchAccount(userGuid),
        this.fetchAddress(userGuid),
        this.fetchIdentity(userGuid),
        this.fetchMembership(userGuid),
        this.fetchEmployment(userGuid),
        this.fetchPractice(userGuid),
        this.fetchPreference(userGuid),
        this.fetchOtEducation(userGuid),
        this.fetchOtaEducation(userGuid),
        this.fetchAffiliate(userGuid),
      ]);

      // Extract data or use undefined if fetch failed
      const accountData: DataverseAccountData | undefined =
        account.status === 'fulfilled' ? account.value : undefined;
      const addressData: DataverseAddressData | undefined =
        address.status === 'fulfilled' ? address.value : undefined;
      const identityData: DataverseIdentityData | undefined =
        identity.status === 'fulfilled' ? identity.value : undefined;
      const membershipData: DataverseMembershipData | undefined =
        membership.status === 'fulfilled' ? membership.value : undefined;
      const employmentData: DataverseEmploymentData | undefined =
        employment.status === 'fulfilled' ? employment.value : undefined;
      const practiceData: DataversePracticeData | undefined =
        practice.status === 'fulfilled' ? practice.value : undefined;
      const preferenceData: DataversePreferenceData | undefined =
        preference.status === 'fulfilled' ? preference.value : undefined;
      const otEducationData: DataverseOtEducationData | undefined =
        otEducation.status === 'fulfilled' ? otEducation.value : undefined;
      const otaEducationData: DataverseOtaEducationData | undefined =
        otaEducation.status === 'fulfilled' ? otaEducation.value : undefined;
      const affiliateData: DataverseAffiliateData | undefined =
        affiliate.status === 'fulfilled' ? affiliate.value : undefined;

      const profile: UserProfile = {
        userGuid,
        userBusinessId: accountData?.osot_account || userGuid,

        // Account (1 field)
        accountGroup: accountData?.osot_account_group,

        // Active Membership Status
        osot_active_member: accountData?.osot_active_member || false,

        // Affiliate (3 fields)
        affiliateArea: this.parseMultiChoice(
          affiliateData?.osot_affiliate_area,
        ),
        affiliateCity: this.parseMultiChoice(
          affiliateData?.osot_affiliate_city,
        ),
        affiliateProvince: this.parseMultiChoice(
          affiliateData?.osot_affiliate_province,
        ),

        // Address (2 fields)
        membershipCity: addressData?.osot_membership_city,
        province: addressData?.osot_province,

        // Identity (4 fields)
        gender: identityData?.osot_gender,
        indigenousDetails: this.parseMultiChoice(
          identityData?.osot_indigenous_details,
        ),
        language: this.parseMultiChoice(identityData?.osot_language),
        race: this.parseMultiChoice(identityData?.osot_race),

        // Membership (2 fields)
        affiliateEligibility: membershipData?.osot_eligibility_affiliate,
        membershipCategory: membershipData?.osot_membership_category,

        // Employment (9 fields)
        earnings: employmentData?.osot_earnings,
        earningsSelfdirect: employmentData?.osot_earnings_selfdirect,
        earningsSelfindirect: employmentData?.osot_earnings_selfindirect,
        employmentBenefits: this.parseMultiChoice(
          employmentData?.osot_employment_benefits,
        ),
        employmentStatus: employmentData?.osot_employment_status,
        positionFunding: this.parseMultiChoice(
          employmentData?.osot_position_funding,
        ),
        practiceYears: employmentData?.osot_practice_years,
        roleDescription: this.parseMultiChoice(
          employmentData?.osot_role_description,
        ),
        workHours: employmentData?.osot_work_hours,

        // Practice (4 fields)
        clientAge: this.parseMultiChoice(practiceData?.osot_client_age),
        practiceArea: this.parseMultiChoice(practiceData?.osot_practice_area),
        practiceServices: this.parseMultiChoice(
          practiceData?.osot_practice_services,
        ),
        practiceSettings: this.parseMultiChoice(
          practiceData?.osot_practice_settings,
        ),

        // Preference (4 fields)
        membershipSearchTools: this.parseMultiChoice(
          preferenceData?.osot_membership_search_tools,
        ),
        practicePromotion: this.parseMultiChoice(
          preferenceData?.osot_practice_promotion,
        ),
        psychotherapySupervision: this.parseMultiChoice(
          preferenceData?.osot_psychotherapy_supervision,
        ),
        thirdParties: this.parseMultiChoice(preferenceData?.osot_third_parties),

        // Education OT (3 fields)
        cotoStatus: this.parseMultiChoice(otEducationData?.osot_coto_status),
        otGradYear: otEducationData?.osot_ot_grad_year,
        otUniversity: otEducationData?.osot_ot_university,

        // Education OTA (2 fields)
        otaGradYear: otaEducationData?.osot_ota_grad_year,
        otaCollege: otaEducationData?.osot_ota_college,
      };

      this.logger.log(
        `Successfully built profile for ${profile.userBusinessId}`,
      );

      return profile;
    } catch (error) {
      this.logger.error(`Failed to build user profile for ${userGuid}:`, error);
      throw error;
    }
  }

  /**
   * Fetch account data
   */
  private async fetchAccount(userGuid: string): Promise<DataverseAccountData> {
    const response = await this.dataverseService.request(
      'GET',
      `osot_table_accounts?$filter=osot_table_accountid eq '${userGuid}'&$select=osot_account_group,osot_active_member&$top=1`,
      undefined,
      undefined,
      'main',
    );
    const data = response as { value?: DataverseAccountData[] };
    return data?.value?.[0] || {};
  }

  /**
   * Fetch address data (primary address)
   */
  private async fetchAddress(
    userGuid: string,
  ): Promise<DataverseAddressData | undefined> {
    const response = await this.dataverseService.request(
      'GET',
      `osot_table_addresses?$filter=_osot_table_account_value eq ${userGuid}&$select=osot_city,osot_province&$top=1`,
      undefined,
      undefined,
      'main',
    );
    const data = response as { value?: DataverseAddressData[] };
    return data?.value?.[0];
  }

  /**
   * Fetch identity data
   */
  private async fetchIdentity(
    userGuid: string,
  ): Promise<DataverseIdentityData | undefined> {
    const response = await this.dataverseService.request(
      'GET',
      `osot_table_identities?$filter=_osot_table_account_value eq ${userGuid}&$select=osot_gender,osot_indigenous_detail,osot_language,osot_race&$top=1`,
      undefined,
      undefined,
      'main',
    );
    const data = response as { value?: DataverseIdentityData[] };
    return data?.value?.[0];
  }

  /**
   * Fetch membership data
   */
  private async fetchMembership(
    userGuid: string,
  ): Promise<DataverseMembershipData | undefined> {
    const response = await this.dataverseService.request(
      'GET',
      `osot_table_membership_categories?$filter=_osot_table_account_value eq ${userGuid}&$select=osot_eligibility_affiliate,osot_membership_category&$top=1`,
      undefined,
      undefined,
      'main',
    );
    const data = response as { value?: DataverseMembershipData[] };
    return data?.value?.[0];
  }

  /**
   * Fetch employment data
   */
  private async fetchEmployment(
    userGuid: string,
  ): Promise<DataverseEmploymentData | undefined> {
    const response = await this.dataverseService.request(
      'GET',
      `osot_table_membership_employments?$filter=_osot_table_account_value eq ${userGuid}&$select=osot_earnings_employment,osot_earnings_self_direct,osot_earnings_self_indirect,osot_employment_benefits,osot_employment_status,osot_position_funding,osot_practice_years,osot_role_descriptor,osot_work_hours&$top=1`,
      undefined,
      undefined,
      'main',
    );
    const data = response as { value?: DataverseEmploymentData[] };
    return data?.value?.[0];
  }

  /**
   * Fetch practice data
   */
  private async fetchPractice(
    userGuid: string,
  ): Promise<DataversePracticeData | undefined> {
    const response = await this.dataverseService.request(
      'GET',
      `osot_table_membership_practices?$filter=_osot_table_account_value eq ${userGuid}&$select=osot_clients_age,osot_practice_area,osot_practice_services,osot_practice_settings&$top=1`,
      undefined,
      undefined,
      'main',
    );
    const data = response as { value?: DataversePracticeData[] };
    return data?.value?.[0];
  }

  /**
   * Fetch preference data
   */
  private async fetchPreference(
    userGuid: string,
  ): Promise<DataversePreferenceData | undefined> {
    const response = await this.dataverseService.request(
      'GET',
      `osot_table_membership_preferences?$filter=_osot_table_account_value eq ${userGuid}&$select=osot_members_search_tools,osot_practice_promotion,osot_psychotherapy_supervision,osot_third_parties&$top=1`,
      undefined,
      undefined,
      'main',
    );
    const data = response as { value?: DataversePreferenceData[] };
    return data?.value?.[0];
  }

  /**
   * Fetch OT education data
   */
  private async fetchOtEducation(
    userGuid: string,
  ): Promise<DataverseOtEducationData | undefined> {
    const response = await this.dataverseService.request(
      'GET',
      `osot_table_ot_educations?$filter=_osot_table_account_value eq ${userGuid}&$select=osot_coto_status,osot_ot_grad_year,osot_ot_university&$top=1`,
      undefined,
      undefined,
      'main',
    );
    const data = response as { value?: DataverseOtEducationData[] };
    return data?.value?.[0];
  }

  /**
   * Fetch OTA education data
   */
  private async fetchOtaEducation(
    userGuid: string,
  ): Promise<DataverseOtaEducationData | undefined> {
    const response = await this.dataverseService.request(
      'GET',
      `osot_table_ota_educations?$filter=_osot_table_account_value eq ${userGuid}&$select=osot_ota_grad_year,osot_ota_college&$top=1`,
      undefined,
      undefined,
      'main',
    );
    const data = response as { value?: DataverseOtaEducationData[] };
    return data?.value?.[0];
  }

  /**
   * Fetch affiliate data
   *
   * IMPORTANT: Affiliate fields come from two sources:
   * 1. If user is type 'affiliate' → Fields are in osot_table_account_affiliates (their own account)
   * 2. If user is type 'account' → No affiliate data (they are not affiliates)
   *
   * The challenge: We don't have userType here, only userGuid.
   *
   * SOLUTION: Try to fetch from account_affiliates table by GUID.
   * - If found → User is affiliate, use their data
   * - If not found → User is regular account, return undefined
   */
  private async fetchAffiliate(
    userGuid: string,
  ): Promise<DataverseAffiliateData | undefined> {
    try {
      // Try to fetch affiliate account by its GUID (not by lookup)
      // If this user is an affiliate, their GUID will be the primary key
      const response = await this.dataverseService.request(
        'GET',
        `osot_table_account_affiliates(${userGuid})?$select=osot_affiliate_area,osot_affiliate_city,osot_affiliate_province`,
        undefined,
        undefined,
        'main',
        true, // suppressNotFound: true - 404 is expected for regular accounts
      );

      this.logger.debug(
        `Successfully fetched affiliate data for user ${userGuid}`,
      );
      return response as DataverseAffiliateData;
    } catch (error) {
      // 404 is expected for regular accounts (not affiliates) - not an error
      if (error instanceof Error && error.message.includes('404')) {
        this.logger.debug(
          `User ${userGuid} is a regular account (not affiliate)`,
        );
        return undefined;
      }

      // Other errors should be logged but not break the profile build
      this.logger.warn(
        `Unexpected error fetching affiliate data for ${userGuid}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  /**
   * Parse multi-choice field from Dataverse string format to number array
   */
  private parseMultiChoice(
    value: string | number | number[] | undefined,
  ): number[] | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') {
      const parsed = value
        .split(',')
        .map((v) => parseInt(v.trim(), 10))
        .filter((n) => !isNaN(n));
      return parsed.length > 0 ? parsed : undefined;
    }
    if (Array.isArray(value)) return value;
    if (typeof value === 'number') return [value];
    return undefined;
  }
}

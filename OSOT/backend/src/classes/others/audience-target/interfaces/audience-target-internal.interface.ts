/**
 * Internal Audience Target interface used inside the application.
 *
 * This interface includes internal identifiers (e.g., osot_table_audience_targetid)
 * and represents the internal shape used in services, business logic, and orchestrators.
 *
 * IMPORTANT: All 35 choice fields use ARRAY format internally [1, 2, 3]
 * but are stored as comma-separated strings "1,2,3" in Dataverse.
 *
 * SECURITY WARNING: Never expose internal fields directly in public APIs.
 */

// Import all enum types used in the 35 choice fields
import { AccountGroup } from '../../../../common/enums/account-group.enum';
import { AffiliateArea } from '../../../../common/enums/affiliate-area.enum';
import { City } from '../../../../common/enums/cities.enum';
import { Province } from '../../../../common/enums/provinces.enum';
import { Gender } from '../../../../common/enums/gender-choice.enum';
import { IndigenousDetail } from '../../../../common/enums/indigenous-detail.enum';
import { Language } from '../../../../common/enums/language-choice.enum';
import { Race } from '../../../../common/enums/race-choice.enum';
import { AffiliateEligibility } from '../../../../common/enums/affiliate-eligibility-enum';
import { Category } from '../../../../common/enums/categories-enum';
import { HourlyEarnings } from '../../../membership/membership-employment/enums/hourly-earnings.enum';
import { Benefits } from '../../../membership/membership-employment/enums/benefits.enum';
import { EmploymentStatus } from '../../../membership/membership-employment/enums/employment-status.enum';
import { Funding } from '../../../membership/membership-employment/enums/funding.enum';
import { PracticeYears } from '../../../membership/membership-employment/enums/practice-years.enum';
import { RoleDescription } from '../../../membership/membership-employment/enums/role-descriptor.enum';
import { WorkHours } from '../../../membership/membership-employment/enums/work-hours.enum';
import { ClientsAge } from '../../../membership/membership-practices/enums/clients-age.enum';
import { PracticeArea } from '../../../membership/membership-practices/enums/practice-area.enum';
import { PracticeServices } from '../../../membership/membership-practices/enums/practice-services.enum';
import { PracticeSettings } from '../../../membership/membership-practices/enums/practice-settings.enum';
import { SearchTools } from '../../../membership/membership-preferences/enums/search-tools.enum';
import { PracticePromotion } from '../../../membership/membership-preferences/enums/practice-promotion.enum';
import { PsychotherapySupervision } from '../../../membership/membership-preferences/enums/psychotherapy-supervision.enum';
import { ThirdParties } from '../../../membership/membership-preferences/enums/third-parties.enum';
import { CotoStatus } from '../../../../common/enums/coto-status.enum';
import { GraduationYear } from '../../../../common/enums/graduation-year.enum';
import { OtUniversity } from '../../../../common/enums/ot-university.enum';
import { OtaCollege } from '../../../../common/enums/ota-college.enum';

export interface AudienceTargetInternal {
  // ========================================
  // SYSTEM FIELDS (Auto-generated, Read-only)
  // ========================================
  osot_table_audience_targetid?: string; // GUID - Internal Dataverse ID
  osot_target?: string; // Autonumber - Business ID (osot-tgt-0000001)
  ownerid?: string; // System owner ID (managed by Dataverse)
  createdon?: string; // System creation timestamp (ISO date)
  modifiedon?: string; // System modification timestamp (ISO date)

  // ========================================
  // RELATIONSHIP FIELDS
  // ========================================
  osot_table_product?: string; // Lookup to Product (GUID) - Business required

  // ========================================
  // ACCOUNT GROUP (1 field)
  // ========================================
  osot_account_group?: AccountGroup[] | string; // Multiple choice - Account groups to target

  // ========================================
  // AFFILIATE (3 fields)
  // ========================================
  osot_affiliate_area?: AffiliateArea[] | string; // Multiple choice - Affiliate service areas
  osot_affiliate_city?: City[] | string; // Multiple choice - Affiliate cities
  osot_affiliate_province?: Province[] | string; // Multiple choice - Affiliate provinces

  // ========================================
  // ADDRESS (2 fields)
  // ========================================
  osot_membership_city?: City[] | string; // Multiple choice - Member cities
  osot_province?: Province[] | string; // Multiple choice - Member provinces

  // ========================================
  // IDENTITY (4 fields)
  // ========================================
  osot_gender?: Gender[] | string; // Multiple choice - Gender identities
  osot_indigenous_details?: IndigenousDetail[] | string; // Multiple choice - Indigenous details
  osot_language?: Language[] | string; // Multiple choice - Language preferences
  osot_race?: Race[] | string; // Multiple choice - Racial identities

  // ========================================
  // MEMBERSHIP CATEGORY (2 fields)
  // ========================================
  osot_eligibility_affiliate?: AffiliateEligibility[] | string; // Multiple choice - Affiliate eligibility
  osot_membership_category?: Category[] | string; // Multiple choice - Membership categories

  // ========================================
  // EMPLOYMENT (9 fields)
  // ========================================
  osot_earnings?: HourlyEarnings[] | string; // Multiple choice - Hourly earnings ranges
  osot_earnings_selfdirect?: HourlyEarnings[] | string; // Multiple choice - Self-employed direct earnings
  osot_earnings_selfindirect?: HourlyEarnings[] | string; // Multiple choice - Self-employed indirect earnings
  osot_employment_benefits?: Benefits[] | string; // Multiple choice - Employment benefits
  osot_employment_status?: EmploymentStatus[] | string; // Multiple choice - Employment status
  osot_position_funding?: Funding[] | string; // Multiple choice - Position funding sources
  osot_practice_years?: PracticeYears[] | string; // Multiple choice - Years in practice
  osot_role_description?: RoleDescription[] | string; // Multiple choice - Role descriptors
  osot_work_hours?: WorkHours[] | string; // Multiple choice - Work hours per week

  // ========================================
  // PRACTICE (4 fields)
  // ========================================
  osot_client_age?: ClientsAge[] | string; // Multiple choice - Client age groups served
  osot_practice_area?: PracticeArea[] | string; // Multiple choice - Practice areas
  osot_practice_services?: PracticeServices[] | string; // Multiple choice - Practice services offered
  osot_practice_settings?: PracticeSettings[] | string; // Multiple choice - Practice settings/environments

  // ========================================
  // PREFERENCE (4 fields)
  // ========================================
  osot_membership_search_tools?: SearchTools[] | string; // Multiple choice - Search tool preferences
  osot_practice_promotion?: PracticePromotion[] | string; // Multiple choice - Practice promotion preferences
  osot_psychotherapy_supervision?: PsychotherapySupervision[] | string; // Multiple choice - Psychotherapy supervision
  osot_third_parties?: ThirdParties[] | string; // Multiple choice - Third-party interests

  // ========================================
  // EDUCATION OT (3 fields)
  // ========================================
  osot_coto_status?: CotoStatus[] | string; // Multiple choice - COTO registration status
  osot_ot_grad_year?: GraduationYear[] | string; // Multiple choice - OT graduation years
  osot_ot_university?: OtUniversity[] | string; // Multiple choice - OT universities attended

  // ========================================
  // EDUCATION OTA (2 fields)
  // ========================================
  osot_ota_grad_year?: GraduationYear[] | string; // Multiple choice - OTA graduation years
  osot_ota_college?: OtaCollege[] | string; // Multiple choice - OTA colleges attended

  // ========================================
  // INDEX SIGNATURE (for dynamic Dataverse fields)
  // ========================================
  [key: string]: unknown;
}

/**
 * Usage notes:
 *
 * - All 35 choice fields are OPTIONAL (admin activates only needed fields)
 * - Internal format uses ARRAYS: [1, 2, 3]
 * - Dataverse format uses STRINGS: "1,2,3"
 * - Use AUDIENCE_TARGET_ARRAY_HELPERS for conversion between formats
 * - Each field supports 0-50 selections (configurable in constants)
 * - Empty target (no fields populated) matches ALL users
 *
 * @example Array format (internal use):
 * ```ts
 * const target: AudienceTargetInternal = {
 *   osot_account_group: [1, 2], // OT and OTA
 *   osot_province: [1, 3], // Ontario and British Columbia
 * };
 * ```
 *
 * @example String format (from Dataverse):
 * ```ts
 * const dataverseTarget = {
 *   osot_account_group: "1,2",
 *   osot_province: "1,3",
 * };
 * ```
 *
 * @example Comparison mapping:
 * Each field maps to a specific entity for user matching:
 * - osot_account_group → Table_Account.osot_account_group
 * - osot_province → Table_Address.osot_province
 * - osot_language → Table_Identity.osot_language
 * - etc. (see AUDIENCE_TARGET_COMPARISON_MAP)
 */

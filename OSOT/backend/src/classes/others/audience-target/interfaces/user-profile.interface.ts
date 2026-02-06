/**
 * User Profile Interface for Audience Target Matching
 *
 * This interface represents the complete user profile data
 * used to match against audience target criteria (35 fields).
 *
 * DATA SOURCES (Multiple entities):
 * - Account: osot_account_group
 * - Address: osot_membership_city, osot_province
 * - Identity: osot_gender, osot_indigenous_details, osot_language, osot_race
 * - Membership: osot_eligibility_affiliate, osot_membership_category
 * - Employment: 9 fields (earnings, status, benefits, etc.)
 * - Practice: 4 fields (area, services, settings, client age)
 * - Preference: 4 fields (search tools, promotion, supervision, third parties)
 * - OT Education: osot_coto_status, osot_ot_grad_year, osot_ot_university
 * - OTA Education: osot_ota_grad_year, osot_ota_college
 * - Affiliate: osot_affiliate_area, osot_affiliate_city, osot_affiliate_province
 *
 * MATCHING LOGIC:
 * - All fields are OPTIONAL (user may not have data in all areas)
 * - Empty/null fields are ignored in matching
 * - OR logic: If ANY field matches, user qualifies
 * - Target with all empty fields = public (everyone qualifies)
 */

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

export interface UserProfile {
  // User identification
  userGuid: string;
  userBusinessId: string;

  // Account Group (1 field) - From Table_Account
  accountGroup?: AccountGroup;

  // Active Membership Status - From Table_Account
  osot_active_member?: boolean;

  // Affiliate (3 fields) - From Table_Affiliate
  affiliateArea?: AffiliateArea[];
  affiliateCity?: City[];
  affiliateProvince?: Province[];

  // Address (2 fields) - From Table_Address
  membershipCity?: City;
  province?: Province;

  // Identity (4 fields) - From Table_Identity
  gender?: Gender;
  indigenousDetails?: IndigenousDetail[];
  language?: Language[];
  race?: Race[];

  // Membership Category (2 fields) - From Table_Membership
  affiliateEligibility?: AffiliateEligibility;
  membershipCategory?: Category;

  // Employment (9 fields) - From Table_Membership_Employment
  earnings?: HourlyEarnings;
  earningsSelfdirect?: HourlyEarnings;
  earningsSelfindirect?: HourlyEarnings;
  employmentBenefits?: Benefits[];
  employmentStatus?: EmploymentStatus;
  positionFunding?: Funding[];
  practiceYears?: PracticeYears;
  roleDescription?: RoleDescription[];
  workHours?: WorkHours;

  // Practice (4 fields) - From Table_Membership_Practice
  clientAge?: ClientsAge[];
  practiceArea?: PracticeArea[];
  practiceServices?: PracticeServices[];
  practiceSettings?: PracticeSettings[];

  // Preference (4 fields) - From Table_Membership_Preferences
  membershipSearchTools?: SearchTools[];
  practicePromotion?: PracticePromotion[];
  psychotherapySupervision?: PsychotherapySupervision[];
  thirdParties?: ThirdParties[];

  // Education OT (3 fields) - From Table_OT_Education
  cotoStatus?: CotoStatus[];
  otGradYear?: GraduationYear;
  otUniversity?: OtUniversity;

  // Education OTA (2 fields) - From Table_OTA_Education
  otaGradYear?: GraduationYear;
  otaCollege?: OtaCollege;
}

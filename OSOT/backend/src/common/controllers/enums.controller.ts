/**
 * Controller: EnumsController
 * Objective: Provide public endpoints for frontend to fetch enum values
 * Functionality: Returns enum values and labels for dropdowns and form validation
 * Following FRONTEND_INTEGRATION_GUIDE.md - Strategy 2: Fetch Enums Dynamically
 *
 * This controller exposes ALL enums from the application including:
 * - Geography (Provinces, Countries, Cities)
 * - Membership (Categories, Employment, Practices, Preferences)
 * - Identity (Gender, Language)
 * - Account (Status)
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '../../utils/user.decorator';

// Geography Enums
import { Province, getProvinceDisplayName } from '../enums/provinces.enum';
import { Country, getCountryDisplayName } from '../enums/countries.enum';
import { City, getCityDisplayName } from '../enums/cities.enum';

// Affiliate Enums
import {
  AffiliateArea,
  getAffiliateAreaDisplayName,
} from '../enums/affiliate-area.enum';

// Membership Enums
import { Category, getCategoryDisplayName } from '../enums/categories-enum';
import {
  ParentalLeaveExpected,
  getParentalLeaveExpectedDisplayName,
} from '../../classes/membership/membership-category/enums/parental-leave-expected.enum';

// Identity Enums
import { Gender, getGenderDisplayName } from '../enums/gender-choice.enum';
import {
  Language,
  getLanguageDisplayName,
} from '../enums/language-choice.enum';

// Account Enums
import {
  AccountStatus,
  getAccountStatusDisplayName,
} from '../enums/account-status.enum';
import {
  AccountGroup,
  getAccountGroupDisplayName,
} from '../enums/account-group.enum';
import {
  AccessModifier,
  getAccessModifierDisplayName,
} from '../enums/access-modifier.enum';
import { Privilege, getPrivilegeDisplayName } from '../enums/privilege.enum';
import { UserGroup, getUserGroupDisplayName } from '../enums/user-group.enum';

// Address Enums
import {
  AddressType,
  getAddressTypeDisplayName,
} from '../enums/address-type.enum';
import {
  AddressPreference,
  getAddressPreferenceDisplayName,
} from '../enums/address-preference.enum';

// Education Enums
import {
  DegreeType,
  getDegreeTypeDisplayName,
} from '../enums/degree-type.enum';
import {
  CotoStatus,
  getCotoStatusDisplayName,
} from '../enums/coto-status.enum';
import {
  EducationCategory,
  getEducationCategoryDisplayName,
} from '../enums/education-category.enum';
import {
  GraduationYear,
  getGraduationYearDisplayName,
} from '../enums/graduation-year.enum';
import {
  OtUniversity,
  getOtUniversityDisplayName,
} from '../enums/ot-university.enum';
import {
  OtaCollege,
  getOtaCollegeDisplayName,
} from '../enums/ota-college.enum';

// Diversity Enums
import { Race, getRaceDisplayName } from '../enums/race-choice.enum';
import {
  IndigenousDetail,
  getIndigenousDetailDisplayName,
} from '../enums/indigenous-detail.enum';

// Employment Enums
import {
  EmploymentStatus,
  getEmployementStatusDisplayName,
} from '../../classes/membership/membership-employment/enums/employment-status.enum';
import {
  Benefits,
  getBenefitsDisplayName,
} from '../../classes/membership/membership-employment/enums/benefits.enum';
import {
  Funding,
  getFundingDisplayName,
} from '../../classes/membership/membership-employment/enums/funding.enum';
import {
  HourlyEarnings,
  getHourlyEarningsLabel,
} from '../../classes/membership/membership-employment/enums/hourly-earnings.enum';
import {
  PracticeYears,
  getPracticeYearsDisplayName,
} from '../../classes/membership/membership-employment/enums/practice-years.enum';
import {
  RoleDescription,
  getRoleDescriptionDisplayName,
} from '../../classes/membership/membership-employment/enums/role-descriptor.enum';
import {
  WorkHours,
  getWorkHoursDisplayName,
} from '../../classes/membership/membership-employment/enums/work-hours.enum';

// Practice Enums
import {
  ClientsAge,
  getClientsAgeDisplayName,
} from '../../classes/membership/membership-practices/enums/clients-age.enum';
import {
  PracticeArea,
  getPracticeAreaDisplayName,
} from '../../classes/membership/membership-practices/enums/practice-area.enum';
import {
  PracticeServices,
  getPracticeServicesDisplayName,
} from '../../classes/membership/membership-practices/enums/practice-services.enum';
import {
  PracticeSettings,
  getPracticeSettingsDisplayName,
} from '../../classes/membership/membership-practices/enums/practice-settings.enum';

// Preference Enums
import {
  PracticePromotion,
  getPracticePromotionDisplayName,
} from '../../classes/membership/membership-preferences/enums/practice-promotion.enum';
import {
  PsychotherapySupervision,
  getPsychotherapySupervisionDisplayName,
} from '../../classes/membership/membership-preferences/enums/psychotherapy-supervision.enum';
import {
  SearchTools,
  getSearchToolDisplayName,
} from '../../classes/membership/membership-preferences/enums/search-tools.enum';
import {
  ThirdParties,
  getThirdPartyDisplayName,
} from '../../classes/membership/membership-preferences/enums/third-parties.enum';

// Product Enums
import {
  ProductCategory,
  getProductCategoryDisplayName,
} from '../../classes/others/product/enums/product-category.enum';
import {
  ProductStatus,
  getProductStatusDisplayName,
} from '../../classes/others/product/enums/product-status.enum';
import {
  ProductGLCode,
  getProductGLCodeDisplayName,
} from '../../classes/others/product/enums/product-gl-code.enum';

@ApiTags('Public Enums')
@Controller('public/enums')
export class EnumsController {
  // ==================== GEOGRAPHY ENUMS ====================

  @Get('provinces')
  @ApiOperation({ summary: 'Get all Canadian province options' })
  @ApiResponse({
    status: 200,
    description: 'List of provinces with values and labels',
  })
  getProvinces() {
    const provinces = Object.keys(Province)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getProvinceDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: provinces,
    };
  }

  @Get('countries')
  @ApiOperation({ summary: 'Get all country options (175+ countries)' })
  @ApiResponse({
    status: 200,
    description: 'List of countries with values and labels',
  })
  getCountries() {
    const countries = Object.keys(Country)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getCountryDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: countries,
    };
  }

  @Get('cities')
  @ApiOperation({ summary: 'Get all Ontario city options (427 cities)' })
  @ApiResponse({
    status: 200,
    description: 'List of cities with values and labels',
  })
  getCities() {
    const cities = Object.keys(City)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getCityDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: cities,
    };
  }

  // ==================== AFFILIATE ENUMS ====================

  @Get('affiliate-areas')
  @ApiOperation({ summary: 'Get all affiliate business area options' })
  @ApiResponse({
    status: 200,
    description: 'List of affiliate areas with values and labels',
  })
  getAffiliateAreas() {
    const areas = Object.keys(AffiliateArea)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getAffiliateAreaDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: areas,
    };
  }

  // ==================== MEMBERSHIP ENUMS ====================

  @Get('membership-categories')
  @ApiOperation({ summary: 'Get all membership category options' })
  @ApiResponse({
    status: 200,
    description: 'List of membership categories with values and labels',
  })
  getMembershipCategories() {
    const categories = Object.keys(Category)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getCategoryDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: categories,
    };
  }

  @Get('parental-leave-expected')
  @ApiOperation({ summary: 'Get all parental leave expected duration options' })
  @ApiResponse({
    status: 200,
    description:
      'List of parental leave expected durations with values and labels',
  })
  getParentalLeaveExpected() {
    const durations = Object.keys(ParentalLeaveExpected)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getParentalLeaveExpectedDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: durations,
    };
  }

  // ==================== IDENTITY ENUMS ====================

  @Get('genders')
  @ApiOperation({ summary: 'Get all gender identity options' })
  @ApiResponse({
    status: 200,
    description: 'List of gender options with values and labels',
  })
  getGenders() {
    const genders = Object.keys(Gender)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getGenderDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: genders,
    };
  }

  @Get('languages')
  @ApiOperation({ summary: 'Get all language options (65 languages)' })
  @ApiResponse({
    status: 200,
    description: 'List of languages with values and labels',
  })
  getLanguages() {
    const languages = Object.keys(Language)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getLanguageDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: languages,
    };
  }

  // ==================== ACCOUNT ENUMS ====================

  @Get('account-statuses')
  @ApiOperation({ summary: 'Get all account status options' })
  @ApiResponse({
    status: 200,
    description: 'List of account statuses with values and labels',
  })
  getAccountStatuses() {
    const statuses = Object.keys(AccountStatus)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getAccountStatusDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: statuses,
    };
  }

  @Get('account-groups')
  @ApiOperation({
    summary: 'Get all account group options',
    description:
      'Returns account groups. STAFF option is only visible to MAIN privilege users.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of account groups with values and labels',
  })
  getAccountGroups(@User() user?: Record<string, unknown>) {
    let groups = Object.keys(AccountGroup)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getAccountGroupDisplayName(Number(key)),
      }));

    // Filter STAFF option for non-MAIN users
    // STAFF (value 4) is only visible to MAIN privilege users for security
    const userPrivilege =
      (user?.privilege as number) || (user?.osot_privilege as number);
    const isMainUser = userPrivilege === Number(Privilege.MAIN); // MAIN = 3

    if (!isMainUser) {
      groups = groups.filter((g) => g.value !== Number(AccountGroup.STAFF));
    }

    return {
      success: true,
      data: groups,
    };
  }

  @Get('access-modifiers')
  @ApiOperation({ summary: 'Get all access modifier options' })
  @ApiResponse({
    status: 200,
    description: 'List of access modifiers with values and labels',
  })
  getAccessModifiers() {
    const modifiers = Object.keys(AccessModifier)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getAccessModifierDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: modifiers,
    };
  }

  @Get('privileges')
  @ApiOperation({ summary: 'Get all privilege level options' })
  @ApiResponse({
    status: 200,
    description: 'List of privilege levels with values and labels',
  })
  getPrivileges() {
    const privileges = Object.keys(Privilege)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getPrivilegeDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: privileges,
    };
  }

  @Get('user-groups')
  @ApiOperation({ summary: 'Get all user group options' })
  @ApiResponse({
    status: 200,
    description: 'List of user groups with values and labels',
  })
  getUserGroups() {
    const userGroups = Object.keys(UserGroup)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getUserGroupDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: userGroups,
    };
  }

  // ==================== ADDRESS ENUMS ====================

  @Get('address-types')
  @ApiOperation({ summary: 'Get all address type options' })
  @ApiResponse({
    status: 200,
    description: 'List of address types with values and labels',
  })
  getAddressTypes() {
    const types = Object.keys(AddressType)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getAddressTypeDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: types,
    };
  }

  @Get('address-preferences')
  @ApiOperation({ summary: 'Get all address preference options' })
  @ApiResponse({
    status: 200,
    description: 'List of address preferences with values and labels',
  })
  getAddressPreferences() {
    const preferences = Object.keys(AddressPreference)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getAddressPreferenceDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: preferences,
    };
  }

  // ==================== EDUCATION ENUMS ====================

  @Get('degree-types')
  @ApiOperation({ summary: 'Get all degree type options' })
  @ApiResponse({
    status: 200,
    description: 'List of degree types with values and labels',
  })
  getDegreeTypes() {
    const degrees = Object.keys(DegreeType)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getDegreeTypeDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: degrees,
    };
  }

  @Get('coto-statuses')
  @ApiOperation({ summary: 'Get all COTO status options' })
  @ApiResponse({
    status: 200,
    description: 'List of COTO statuses with values and labels',
  })
  getCotoStatuses() {
    const statuses = Object.keys(CotoStatus)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getCotoStatusDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: statuses,
    };
  }

  @Get('education-categories')
  @ApiOperation({ summary: 'Get all education category options' })
  @ApiResponse({
    status: 200,
    description: 'List of education categories with values and labels',
  })
  getEducationCategories() {
    const categories = Object.keys(EducationCategory)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getEducationCategoryDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: categories,
    };
  }

  @Get('graduation-years')
  @ApiOperation({ summary: 'Get all graduation year options (51 years)' })
  @ApiResponse({
    status: 200,
    description: 'List of graduation years with values and labels',
  })
  getGraduationYears() {
    const years = Object.keys(GraduationYear)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getGraduationYearDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: years,
    };
  }

  @Get('ot-universities')
  @ApiOperation({
    summary: 'Get all OT university options (Canadian institutions)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of OT universities with values and labels',
  })
  getOtUniversities() {
    const universities = Object.keys(OtUniversity)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getOtUniversityDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: universities,
    };
  }

  @Get('ota-colleges')
  @ApiOperation({
    summary: 'Get all OTA college options (Canadian institutions)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of OTA colleges with values and labels',
  })
  getOtaColleges() {
    const colleges = Object.keys(OtaCollege)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getOtaCollegeDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: colleges,
    };
  }

  // ==================== DIVERSITY ENUMS ====================

  @Get('races')
  @ApiOperation({ summary: 'Get all race/ethnicity options' })
  @ApiResponse({
    status: 200,
    description: 'List of race/ethnicity options with values and labels',
  })
  getRaces() {
    const races = Object.keys(Race)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getRaceDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: races,
    };
  }

  @Get('indigenous-details')
  @ApiOperation({ summary: 'Get all indigenous detail options' })
  @ApiResponse({
    status: 200,
    description: 'List of indigenous details with values and labels',
  })
  getIndigenousDetails() {
    const details = Object.keys(IndigenousDetail)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getIndigenousDetailDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: details,
    };
  }

  // ==================== EMPLOYMENT ENUMS ====================

  @Get('employment-statuses')
  @ApiOperation({ summary: 'Get all employment status options' })
  @ApiResponse({
    status: 200,
    description: 'List of employment statuses with values and labels',
  })
  getEmploymentStatuses() {
    const statuses = Object.keys(EmploymentStatus)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getEmployementStatusDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: statuses,
    };
  }

  @Get('benefits')
  @ApiOperation({ summary: 'Get all employment benefits options' })
  @ApiResponse({
    status: 200,
    description: 'List of employment benefits with values and labels',
  })
  getBenefits() {
    const benefits = Object.keys(Benefits)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getBenefitsDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: benefits,
    };
  }

  @Get('funding-sources')
  @ApiOperation({ summary: 'Get all position funding source options' })
  @ApiResponse({
    status: 200,
    description: 'List of funding sources with values and labels',
  })
  getFundingSources() {
    const fundingSources = Object.keys(Funding)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getFundingDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: fundingSources,
    };
  }

  @Get('hourly-earnings')
  @ApiOperation({ summary: 'Get all hourly earnings range options' })
  @ApiResponse({
    status: 200,
    description: 'List of hourly earnings ranges with values and labels',
  })
  getHourlyEarnings() {
    const earnings = Object.keys(HourlyEarnings)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getHourlyEarningsLabel(Number(key)),
      }));

    return {
      success: true,
      data: earnings,
    };
  }

  @Get('practice-years')
  @ApiOperation({ summary: 'Get all practice years experience options' })
  @ApiResponse({
    status: 200,
    description: 'List of practice years ranges with values and labels',
  })
  getPracticeYears() {
    const years = Object.keys(PracticeYears)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getPracticeYearsDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: years,
    };
  }

  @Get('role-descriptors')
  @ApiOperation({ summary: 'Get all employment role descriptor options' })
  @ApiResponse({
    status: 200,
    description: 'List of role descriptors with values and labels',
  })
  getRoleDescriptors() {
    const roles = Object.keys(RoleDescription)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getRoleDescriptionDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: roles,
    };
  }

  @Get('work-hours')
  @ApiOperation({ summary: 'Get all work hours range options' })
  @ApiResponse({
    status: 200,
    description: 'List of work hours ranges with values and labels',
  })
  getWorkHours() {
    const hours = Object.keys(WorkHours)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getWorkHoursDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: hours,
    };
  }

  // ==================== PRACTICE ENUMS ====================

  @Get('clients-age')
  @ApiOperation({ summary: 'Get all client age group options' })
  @ApiResponse({
    status: 200,
    description: 'List of client age groups with values and labels',
  })
  getClientsAge() {
    const ageGroups = Object.keys(ClientsAge)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getClientsAgeDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: ageGroups,
    };
  }

  @Get('practice-areas')
  @ApiOperation({ summary: 'Get all practice area options (47 areas)' })
  @ApiResponse({
    status: 200,
    description: 'List of practice areas with values and labels',
  })
  getPracticeAreas() {
    const areas = Object.keys(PracticeArea)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getPracticeAreaDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: areas,
    };
  }

  @Get('practice-services')
  @ApiOperation({ summary: 'Get all practice service options (60 services)' })
  @ApiResponse({
    status: 200,
    description: 'List of practice services with values and labels',
  })
  getPracticeServices() {
    const services = Object.keys(PracticeServices)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getPracticeServicesDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: services,
    };
  }

  @Get('practice-settings')
  @ApiOperation({ summary: 'Get all practice setting options (29 settings)' })
  @ApiResponse({
    status: 200,
    description: 'List of practice settings with values and labels',
  })
  getPracticeSettings() {
    const settings = Object.keys(PracticeSettings)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getPracticeSettingsDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: settings,
    };
  }

  // ==================== PREFERENCE ENUMS ====================

  @Get('practice-promotion')
  @ApiOperation({ summary: 'Get all practice promotion preference options' })
  @ApiResponse({
    status: 200,
    description:
      'List of practice promotion preferences with values and labels',
  })
  getPracticePromotion() {
    const promotions = Object.keys(PracticePromotion)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getPracticePromotionDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: promotions,
    };
  }

  @Get('psychotherapy-supervision')
  @ApiOperation({
    summary: 'Get all psychotherapy supervision approach options',
  })
  @ApiResponse({
    status: 200,
    description:
      'List of psychotherapy supervision approaches with values and labels',
  })
  getPsychotherapySupervision() {
    const supervisions = Object.keys(PsychotherapySupervision)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getPsychotherapySupervisionDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: supervisions,
    };
  }

  @Get('search-tools')
  @ApiOperation({ summary: 'Get all member search tool preference options' })
  @ApiResponse({
    status: 200,
    description: 'List of search tool preferences with values and labels',
  })
  getSearchTools() {
    const searchTools = Object.keys(SearchTools)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getSearchToolDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: searchTools,
    };
  }

  @Get('third-parties')
  @ApiOperation({
    summary: 'Get all third-party communication preference options',
  })
  @ApiResponse({
    status: 200,
    description:
      'List of third-party communication preferences with values and labels',
  })
  getThirdParties() {
    const thirdParties = Object.keys(ThirdParties)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getThirdPartyDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: thirdParties,
    };
  }

  // ==================== PRODUCT ENUMS ====================

  @Get('product-categories')
  @ApiOperation({ summary: 'Get all product category options' })
  @ApiResponse({
    status: 200,
    description: 'List of product categories with values and labels',
  })
  getProductCategories() {
    const categories = Object.keys(ProductCategory)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getProductCategoryDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: categories,
    };
  }

  @Get('product-statuses')
  @ApiOperation({ summary: 'Get all product status options' })
  @ApiResponse({
    status: 200,
    description: 'List of product statuses with values and labels',
  })
  getProductStatuses() {
    const statuses = Object.keys(ProductStatus)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getProductStatusDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: statuses,
    };
  }

  @Get('product-gl-codes')
  @ApiOperation({ summary: 'Get all product GL (General Ledger) code options' })
  @ApiResponse({
    status: 200,
    description: 'List of product GL codes with values and labels',
  })
  getProductGLCodes() {
    const glCodes = Object.keys(ProductGLCode)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => ({
        value: Number(key),
        label: getProductGLCodeDisplayName(Number(key)),
      }));

    return {
      success: true,
      data: glCodes,
    };
  }

  // ==================== CONSOLIDATED ENDPOINTS ====================

  @Get('all')
  @ApiOperation({
    summary: 'Get all enums in a single request (optimized for app startup)',
  })
  @ApiResponse({
    status: 200,
    description: 'All enum options grouped by category',
  })
  getAllEnums() {
    return {
      success: true,
      data: {
        // Geography
        provinces: this.getProvinces().data,
        countries: this.getCountries().data,
        cities: this.getCities().data,

        // Affiliate & Membership
        affiliateAreas: this.getAffiliateAreas().data,
        membershipCategories: this.getMembershipCategories().data,
        parentalLeaveExpected: this.getParentalLeaveExpected().data,

        // Identity
        genders: this.getGenders().data,
        languages: this.getLanguages().data,
        races: this.getRaces().data,
        indigenousDetails: this.getIndigenousDetails().data,

        // Account
        accountStatuses: this.getAccountStatuses().data,
        accountGroups: this.getAccountGroups().data,
        accessModifiers: this.getAccessModifiers().data,
        privileges: this.getPrivileges().data,
        userGroups: this.getUserGroups().data,

        // Address
        addressTypes: this.getAddressTypes().data,
        addressPreferences: this.getAddressPreferences().data,

        // Employment
        employmentStatuses: this.getEmploymentStatuses().data,
        benefits: this.getBenefits().data,
        fundingSources: this.getFundingSources().data,
        hourlyEarnings: this.getHourlyEarnings().data,
        practiceYears: this.getPracticeYears().data,
        roleDescriptors: this.getRoleDescriptors().data,
        workHours: this.getWorkHours().data,

        // Practice
        clientsAge: this.getClientsAge().data,
        practiceAreas: this.getPracticeAreas().data,
        practiceServices: this.getPracticeServices().data,
        practiceSettings: this.getPracticeSettings().data,

        // Preferences
        practicePromotion: this.getPracticePromotion().data,
        psychotherapySupervision: this.getPsychotherapySupervision().data,
        searchTools: this.getSearchTools().data,
        thirdParties: this.getThirdParties().data,

        // Education
        degreeTypes: this.getDegreeTypes().data,
        cotoStatuses: this.getCotoStatuses().data,
        educationCategories: this.getEducationCategories().data,
        graduationYears: this.getGraduationYears().data,
        otUniversities: this.getOtUniversities().data,
        otaColleges: this.getOtaColleges().data,

        // Product
        productCategories: this.getProductCategories().data,
        productStatuses: this.getProductStatuses().data,
        productGLCodes: this.getProductGLCodes().data,
      },
    };
  }

  @Get('geography')
  @ApiOperation({ summary: 'Get all geography-related enums' })
  @ApiResponse({
    status: 200,
    description: 'All geography enum options (provinces, countries, cities)',
  })
  getGeographyEnums() {
    return {
      success: true,
      data: {
        provinces: this.getProvinces().data,
        countries: this.getCountries().data,
        cities: this.getCities().data,
      },
    };
  }

  @Get('employment')
  @ApiOperation({ summary: 'Get all employment-related enums' })
  @ApiResponse({
    status: 200,
    description: 'All employment enum options',
  })
  getEmploymentEnums() {
    return {
      success: true,
      data: {
        employmentStatuses: this.getEmploymentStatuses().data,
        benefits: this.getBenefits().data,
        fundingSources: this.getFundingSources().data,
        hourlyEarnings: this.getHourlyEarnings().data,
        practiceYears: this.getPracticeYears().data,
        roleDescriptors: this.getRoleDescriptors().data,
        workHours: this.getWorkHours().data,
      },
    };
  }

  @Get('practice')
  @ApiOperation({ summary: 'Get all practice-related enums' })
  @ApiResponse({
    status: 200,
    description: 'All practice enum options',
  })
  getPracticeEnums() {
    return {
      success: true,
      data: {
        clientsAge: this.getClientsAge().data,
        practiceAreas: this.getPracticeAreas().data,
        practiceServices: this.getPracticeServices().data,
        practiceSettings: this.getPracticeSettings().data,
      },
    };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get all preference-related enums' })
  @ApiResponse({
    status: 200,
    description: 'All preference enum options',
  })
  getPreferenceEnums() {
    return {
      success: true,
      data: {
        practicePromotion: this.getPracticePromotion().data,
        psychotherapySupervision: this.getPsychotherapySupervision().data,
        searchTools: this.getSearchTools().data,
        thirdParties: this.getThirdParties().data,
      },
    };
  }

  @Get('account')
  @ApiOperation({ summary: 'Get all account-related enums' })
  @ApiResponse({
    status: 200,
    description:
      'All account enum options (statuses, groups, modifiers, privileges, user groups)',
  })
  getAccountEnums() {
    return {
      success: true,
      data: {
        statuses: this.getAccountStatuses().data,
        groups: this.getAccountGroups().data,
        accessModifiers: this.getAccessModifiers().data,
        privileges: this.getPrivileges().data,
        userGroups: this.getUserGroups().data,
      },
    };
  }

  @Get('address')
  @ApiOperation({ summary: 'Get all address-related enums' })
  @ApiResponse({
    status: 200,
    description: 'All address enum options (types, preferences)',
  })
  getAddressEnums() {
    return {
      success: true,
      data: {
        types: this.getAddressTypes().data,
        preferences: this.getAddressPreferences().data,
      },
    };
  }

  @Get('identity')
  @ApiOperation({ summary: 'Get all identity-related enums' })
  @ApiResponse({
    status: 200,
    description:
      'All identity enum options (genders, languages, races, indigenous details)',
  })
  getIdentityEnums() {
    return {
      success: true,
      data: {
        genders: this.getGenders().data,
        languages: this.getLanguages().data,
        races: this.getRaces().data,
        indigenousDetails: this.getIndigenousDetails().data,
      },
    };
  }

  @Get('education')
  @ApiOperation({ summary: 'Get all education-related enums' })
  @ApiResponse({
    status: 200,
    description:
      'All education enum options (degree types, COTO statuses, categories, graduation years, universities, colleges)',
  })
  getEducationEnums() {
    return {
      success: true,
      data: {
        degreeTypes: this.getDegreeTypes().data,
        cotoStatuses: this.getCotoStatuses().data,
        categories: this.getEducationCategories().data,
        graduationYears: this.getGraduationYears().data,
        otUniversities: this.getOtUniversities().data,
        otaColleges: this.getOtaColleges().data,
      },
    };
  }

  @Get('product')
  @ApiOperation({ summary: 'Get all product-related enums' })
  @ApiResponse({
    status: 200,
    description: 'All product enum options (categories, statuses, GL codes)',
  })
  getProductEnums() {
    return {
      success: true,
      data: {
        categories: this.getProductCategories().data,
        statuses: this.getProductStatuses().data,
        glCodes: this.getProductGLCodes().data,
      },
    };
  }

  // ==================== UTILITY ENDPOINTS ====================

  @Get('health')
  @ApiOperation({ summary: 'Health check for enums endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      success: true,
      message: 'Enums service is operational',
      timestamp: new Date().toISOString(),
      totalEndpoints: 52,
      categories: [
        'Geography (3)',
        'Affiliate & Membership (3)',
        'Identity (2)',
        'Account (5)',
        'Address (2)',
        'Employment (7)',
        'Practice (4)',
        'Preferences (4)',
        'Education (6)',
        'Diversity (2)',
        'Product (3)',
        'Consolidated (9)',
        'Utility (2)',
      ],
    };
  }
}

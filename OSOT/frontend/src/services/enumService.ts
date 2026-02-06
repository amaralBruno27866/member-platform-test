/**
 * Enum Service - Fetches enum values from backend API
 * Following FRONTEND_INTEGRATION_GUIDE.md - Strategy 2: Fetch Enums Dynamically
 */

import { api } from '@/lib/api';

export interface EnumOption {
  value: number;
  label: string;
}

export interface EnumsResponse {
  success: boolean;
  data: EnumOption[];
}

export interface AllEnumsResponse {
  success: boolean;
  data: {
    affiliateAreas: EnumOption[];
    provinces: EnumOption[];
    countries: EnumOption[];
    cities: EnumOption[];
    accountGroups: EnumOption[];
    genders: EnumOption[];
    languages: EnumOption[];
    races: EnumOption[];
    indigenousDetails: EnumOption[];
    addressTypes: EnumOption[];
    addressPreferences: EnumOption[];
    degreeTypes: EnumOption[];
    cotoStatuses: EnumOption[];
    otUniversities: EnumOption[];
    otaColleges: EnumOption[];
    graduationYears: EnumOption[];
    // Employment
    hourlyEarnings: EnumOption[];
    benefits: EnumOption[];
    employmentStatuses: EnumOption[];
    fundingSources: EnumOption[];
    practiceYears: EnumOption[];
    roleDescriptors: EnumOption[];
    workHours: EnumOption[];
    // Practice
    clientsAge: EnumOption[];
    practiceAreas: EnumOption[];
    practiceServices: EnumOption[];
    practiceSettings: EnumOption[];
    // Preferences
    searchTools: EnumOption[];
    practicePromotion: EnumOption[];
    psychotherapySupervision: EnumOption[];
    thirdParties: EnumOption[];
    // Membership
    membershipCategories: EnumOption[];
  };
}

class EnumService {
  private baseUrl = '/public/enums';
  private cache: Map<string, EnumOption[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  private async fetchEnum(endpoint: string): Promise<EnumOption[]> {
    const now = Date.now();
    const cached = this.cache.get(endpoint);
    const expiry = this.cacheExpiry.get(endpoint);

    // Return cached data if still valid
    if (cached && expiry && now < expiry) {
      return cached;
    }

    try {
      const response = await api.get<EnumsResponse>(`${this.baseUrl}/${endpoint}`);
      
      if (response.data.success && response.data.data) {
        // Cache the result
        this.cache.set(endpoint, response.data.data);
        this.cacheExpiry.set(endpoint, now + this.CACHE_DURATION);
        return response.data.data;
      }

      throw new Error(`Invalid response format for ${endpoint}`);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      // Return cached data if available, even if expired
      if (cached) {
        console.warn(`Using expired cache for ${endpoint}`);
        return cached;
      }
      throw error;
    }
  }

  async getAffiliateAreas(): Promise<EnumOption[]> {
    return this.fetchEnum('affiliate-areas');
  }

  async getProvinces(): Promise<EnumOption[]> {
    return this.fetchEnum('provinces');
  }

  async getCountries(): Promise<EnumOption[]> {
    return this.fetchEnum('countries');
  }

  async getCities(): Promise<EnumOption[]> {
    return this.fetchEnum('cities');
  }

  async getAccountGroups(): Promise<EnumOption[]> {
    return this.fetchEnum('account-groups');
  }

  async getGenders(): Promise<EnumOption[]> {
    return this.fetchEnum('genders');
  }

  async getLanguages(): Promise<EnumOption[]> {
    return this.fetchEnum('languages');
  }

  async getRaces(): Promise<EnumOption[]> {
    return this.fetchEnum('races');
  }

  async getIndigenousDetails(): Promise<EnumOption[]> {
    return this.fetchEnum('indigenous-details');
  }

  async getCotoStatuses(): Promise<EnumOption[]> {
    return this.fetchEnum('coto-statuses');
  }

  async getGraduationYears(): Promise<EnumOption[]> {
    return this.fetchEnum('graduation-years');
  }

  async getOtUniversities(): Promise<EnumOption[]> {
    return this.fetchEnum('ot-universities');
  }

  async getOtaColleges(): Promise<EnumOption[]> {
    return this.fetchEnum('ota-colleges');
  }

  async getProductGlCodes(): Promise<EnumOption[]> {
    return this.fetchEnum('product-gl-codes');
  }

  async getProductCategories(): Promise<EnumOption[]> {
    return this.fetchEnum('product-categories');
  }

  // Employment enums
  async getHourlyEarnings(): Promise<EnumOption[]> {
    return this.fetchEnum('hourly-earnings');
  }

  async getBenefits(): Promise<EnumOption[]> {
    return this.fetchEnum('benefits');
  }

  async getEmploymentStatuses(): Promise<EnumOption[]> {
    return this.fetchEnum('employment-statuses');
  }

  async getFundingSources(): Promise<EnumOption[]> {
    return this.fetchEnum('funding-sources');
  }

  async getPracticeYears(): Promise<EnumOption[]> {
    return this.fetchEnum('practice-years');
  }

  async getRoleDescriptors(): Promise<EnumOption[]> {
    return this.fetchEnum('role-descriptors');
  }

  async getWorkHours(): Promise<EnumOption[]> {
    return this.fetchEnum('work-hours');
  }

  // Practice enums
  async getClientsAge(): Promise<EnumOption[]> {
    return this.fetchEnum('clients-age');
  }

  async getPracticeAreas(): Promise<EnumOption[]> {
    return this.fetchEnum('practice-areas');
  }

  async getPracticeServices(): Promise<EnumOption[]> {
    return this.fetchEnum('practice-services');
  }

  async getPracticeSettings(): Promise<EnumOption[]> {
    return this.fetchEnum('practice-settings');
  }

  // Preferences enums
  async getSearchTools(): Promise<EnumOption[]> {
    return this.fetchEnum('search-tools');
  }

  async getPracticePromotion(): Promise<EnumOption[]> {
    return this.fetchEnum('practice-promotion');
  }

  async getPsychotherapySupervision(): Promise<EnumOption[]> {
    return this.fetchEnum('psychotherapy-supervision');
  }

  async getThirdParties(): Promise<EnumOption[]> {
    return this.fetchEnum('third-parties');
  }

  // Membership enums
  async getMembershipCategories(): Promise<EnumOption[]> {
    return this.fetchEnum('membership-categories');
  }

  async getAllEnums(): Promise<{
    affiliateAreas: EnumOption[];
    provinces: EnumOption[];
    countries: EnumOption[];
    cities: EnumOption[];
    accountGroups: EnumOption[];
    genders: EnumOption[];
    languages: EnumOption[];
    races: EnumOption[];
    indigenousDetails: EnumOption[];
    addressTypes: EnumOption[];
    addressPreferences: EnumOption[];
    degreeTypes: EnumOption[];
    cotoStatuses: EnumOption[];
    otUniversities: EnumOption[];
    otaColleges: EnumOption[];
    graduationYears: EnumOption[];
    // Employment
    hourlyEarnings: EnumOption[];
    benefits: EnumOption[];
    employmentStatuses: EnumOption[];
    fundingSources: EnumOption[];
    practiceYears: EnumOption[];
    roleDescriptors: EnumOption[];
    workHours: EnumOption[];
    // Practice
    clientsAge: EnumOption[];
    practiceAreas: EnumOption[];
    practiceServices: EnumOption[];
    practiceSettings: EnumOption[];
    // Preferences
    searchTools: EnumOption[];
    practicePromotion: EnumOption[];
    psychotherapySupervision: EnumOption[];
    thirdParties: EnumOption[];
    // Membership
    membershipCategories: EnumOption[];
  }> {
    try {
      const response = await api.get<AllEnumsResponse>(`${this.baseUrl}/all`);
      
      if (response.data.success && response.data.data) {
        // Cache all enums
        const now = Date.now();
        const data = response.data.data;
        
        this.cache.set('affiliate-areas', data.affiliateAreas);
        this.cache.set('provinces', data.provinces);
        this.cache.set('countries', data.countries);
        this.cache.set('cities', data.cities);
        this.cache.set('account-groups', data.accountGroups);
        this.cache.set('genders', data.genders);
        this.cache.set('languages', data.languages);
        this.cache.set('races', data.races);
        this.cache.set('indigenous-details', data.indigenousDetails);
        this.cache.set('address-types', data.addressTypes);
        this.cache.set('address-preferences', data.addressPreferences);
        this.cache.set('degree-types', data.degreeTypes);
        this.cache.set('coto-statuses', data.cotoStatuses);
        this.cache.set('ot-universities', data.otUniversities);
        this.cache.set('ota-colleges', data.otaColleges);
        this.cache.set('graduation-years', data.graduationYears);
        
        // Cache new employment/practice/preferences enums
        if (data.hourlyEarnings) this.cache.set('hourly-earnings', data.hourlyEarnings);
        if (data.benefits) this.cache.set('benefits', data.benefits);
        if (data.employmentStatuses) this.cache.set('employment-statuses', data.employmentStatuses);
        if (data.fundingSources) this.cache.set('funding-sources', data.fundingSources);
        if (data.practiceYears) this.cache.set('practice-years', data.practiceYears);
        if (data.roleDescriptors) this.cache.set('role-descriptors', data.roleDescriptors);
        if (data.workHours) this.cache.set('work-hours', data.workHours);
        if (data.clientsAge) this.cache.set('clients-age', data.clientsAge);
        if (data.practiceAreas) this.cache.set('practice-areas', data.practiceAreas);
        if (data.practiceServices) this.cache.set('practice-services', data.practiceServices);
        if (data.practiceSettings) this.cache.set('practice-settings', data.practiceSettings);
        if (data.searchTools) this.cache.set('search-tools', data.searchTools);
        if (data.practicePromotion) this.cache.set('practice-promotion', data.practicePromotion);
        if (data.psychotherapySupervision) this.cache.set('psychotherapy-supervision', data.psychotherapySupervision);
        if (data.thirdParties) this.cache.set('third-parties', data.thirdParties);
        if (data.membershipCategories) this.cache.set('membership-categories', data.membershipCategories);
        
        this.cacheExpiry.set('affiliate-areas', now + this.CACHE_DURATION);
        this.cacheExpiry.set('provinces', now + this.CACHE_DURATION);
        this.cacheExpiry.set('countries', now + this.CACHE_DURATION);
        this.cacheExpiry.set('cities', now + this.CACHE_DURATION);
        this.cacheExpiry.set('account-groups', now + this.CACHE_DURATION);
        this.cacheExpiry.set('genders', now + this.CACHE_DURATION);
        this.cacheExpiry.set('languages', now + this.CACHE_DURATION);
        this.cacheExpiry.set('races', now + this.CACHE_DURATION);
        this.cacheExpiry.set('indigenous-details', now + this.CACHE_DURATION);
        this.cacheExpiry.set('address-types', now + this.CACHE_DURATION);
        this.cacheExpiry.set('address-preferences', now + this.CACHE_DURATION);
        this.cacheExpiry.set('degree-types', now + this.CACHE_DURATION);
        this.cacheExpiry.set('coto-statuses', now + this.CACHE_DURATION);
        this.cacheExpiry.set('ot-universities', now + this.CACHE_DURATION);
        this.cacheExpiry.set('ota-colleges', now + this.CACHE_DURATION);
        this.cacheExpiry.set('graduation-years', now + this.CACHE_DURATION);
        
        // Set expiry for new enums
        if (data.hourlyEarnings) this.cacheExpiry.set('hourly-earnings', now + this.CACHE_DURATION);
        if (data.benefits) this.cacheExpiry.set('benefits', now + this.CACHE_DURATION);
        if (data.employmentStatuses) this.cacheExpiry.set('employment-statuses', now + this.CACHE_DURATION);
        if (data.fundingSources) this.cacheExpiry.set('funding-sources', now + this.CACHE_DURATION);
        if (data.practiceYears) this.cacheExpiry.set('practice-years', now + this.CACHE_DURATION);
        if (data.roleDescriptors) this.cacheExpiry.set('role-descriptors', now + this.CACHE_DURATION);
        if (data.workHours) this.cacheExpiry.set('work-hours', now + this.CACHE_DURATION);
        if (data.clientsAge) this.cacheExpiry.set('clients-age', now + this.CACHE_DURATION);
        if (data.practiceAreas) this.cacheExpiry.set('practice-areas', now + this.CACHE_DURATION);
        if (data.practiceServices) this.cacheExpiry.set('practice-services', now + this.CACHE_DURATION);
        if (data.practiceSettings) this.cacheExpiry.set('practice-settings', now + this.CACHE_DURATION);
        if (data.searchTools) this.cacheExpiry.set('search-tools', now + this.CACHE_DURATION);
        if (data.practicePromotion) this.cacheExpiry.set('practice-promotion', now + this.CACHE_DURATION);
        if (data.psychotherapySupervision) this.cacheExpiry.set('psychotherapy-supervision', now + this.CACHE_DURATION);
        if (data.thirdParties) this.cacheExpiry.set('third-parties', now + this.CACHE_DURATION);
        if (data.membershipCategories) this.cacheExpiry.set('membership-categories', now + this.CACHE_DURATION);

        return response.data.data;
      }

      throw new Error('Invalid response format for all enums');
    } catch (error) {
      console.error('Error fetching all enums:', error);
      throw error;
    }
  }

  /**
   * Clear cache manually if needed
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Preload all enums at app initialization
   */
  async preloadEnums(): Promise<void> {
    try {
      await this.getAllEnums();
      console.log('✅ Enums preloaded successfully');
    } catch (error) {
      console.error('❌ Failed to preload enums:', error);
    }
  }
}

export const enumService = new EnumService();

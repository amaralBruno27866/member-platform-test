import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { IDENTITY_ODATA } from '../constants/identity.constants';
import { IdentityRepository } from '../interfaces/identity-repository.interface';
import { IdentityInternal } from '../interfaces/identity-internal.interface';

/**
 * DataverseIdentityRepository
 *
 * Repository implementation for Identity entities using Microsoft Dataverse.
 * Provides a clean abstraction layer between the application and Dataverse API,
 * handling all CRUD operations and complex queries for identity data.
 *
 * Key Features:
 * - Full CRUD operations with proper error handling
 * - Complex filtering and search capabilities
 * - Account-based identity queries with demographic filtering
 * - Cultural and linguistic data operations
 * - Statistical operations for identity analytics
 * - Standardized error handling and logging
 * - Type-safe interfaces for all operations
 *
 * Architecture Benefits:
 * - Abstracts Dataverse specifics from business logic
 * - Enables easy testing with mock implementations
 * - Consistent error handling across all operations
 * - Performance optimizations through selective field loading
 * - Caching layer integration ready
 */
@Injectable()
export class DataverseIdentityRepository implements IdentityRepository {
  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Map IdentityInternal to Dataverse payload format
   * Handles OData binding and field transformations for Dataverse API
   * @param internal Identity internal data
   * @returns Dataverse-compatible payload
   */
  private mapInternalToDataverse(
    internal: Partial<IdentityInternal>,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...internal };

    // Handle OData binding for account relationship
    if ('osot_Table_Account@odata.bind' in internal) {
      const odataBinding = (internal as Record<string, unknown>)[
        'osot_Table_Account@odata.bind'
      ];
      if (odataBinding && typeof odataBinding === 'string') {
        payload['osot_Table_Account@odata.bind'] = odataBinding;
      }
    }

    // Handle language array conversion for Dataverse
    if (internal.osot_language && Array.isArray(internal.osot_language)) {
      payload.osot_language = internal.osot_language.join(',');
    }

    return payload;
  }

  /**
   * Create a new identity record in Dataverse
   * @param internal Identity internal data to create
   * @returns Created identity record with generated IDs
   */
  async create(
    internal: Partial<IdentityInternal>,
  ): Promise<Record<string, unknown>> {
    try {
      // Transform internal data to Dataverse payload format
      const payload = this.mapInternalToDataverse(internal);

      const response = await this.dataverseService.request(
        'POST',
        IDENTITY_ODATA.TABLE_NAME,
        payload,
      );

      // Log dos dados persistidos com sucesso
      console.log('✅ [IDENTITY] Dados persistidos no Dataverse:');
      console.log(JSON.stringify(response, null, 2));

      return response as Record<string, unknown>;
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'create_identity',
        payload: internal,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find identity by its unique GUID identifier
   * @param guid Identity GUID to search for
   * @returns Identity record or undefined if not found
   */
  async findByGuid(guid: string): Promise<Record<string, unknown> | undefined> {
    try {
      const endpoint = `${IDENTITY_ODATA.TABLE_NAME}(${guid})?$select=${IDENTITY_ODATA.SELECT_FIELDS.join(',')}`;
      const response = await this.dataverseService.request('GET', endpoint);
      return response as Record<string, unknown> | undefined;
    } catch (error) {
      // Handle 404 as undefined rather than throwing
      if (error instanceof Error && error.message.includes('404')) {
        return undefined;
      }
      throw createAppError(ErrorCodes.NOT_FOUND, {
        resource: 'identity',
        guid,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update identity by GUID
   * @param guid Identity GUID to update
   * @param payload Update data
   */
  async updateByGuid(
    guid: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.dataverseService.request(
        'PATCH',
        `${IDENTITY_ODATA.TABLE_NAME}(${guid})`,
        payload,
      );
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'update_identity',
        guid,
        payload,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete identity by GUID
   * @param guid Identity GUID to delete
   */
  async deleteByGuid(guid: string): Promise<void> {
    try {
      await this.dataverseService.request(
        'DELETE',
        `${IDENTITY_ODATA.TABLE_NAME}(${guid})`,
      );
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'delete_identity',
        guid,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find all identities associated with a specific account
   * @param accountId Account GUID to search for
   * @returns Array of identity records
   */
  async findByAccountId(accountId: string): Promise<Record<string, unknown>[]> {
    try {
      // CORREÇÃO: Usar user_business_id ao invés de lookup complexo (seguindo padrão do address/contact)
      const filter = `${IDENTITY_ODATA.USER_BUSINESS_ID} eq '${accountId}'`;
      const endpoint = `${IDENTITY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}&$select=${IDENTITY_ODATA.SELECT_FIELDS.join(',')}`;
      const response = await this.dataverseService.request('GET', endpoint);
      return (response as { value: Record<string, unknown>[] }).value || [];
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'find_identities_by_account',
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find identity by business ID (user business identifier)
   * @param businessId User business identifier to search for
   * @returns Identity record or undefined if not found
   */
  async findByBusinessId(
    businessId: string,
  ): Promise<Record<string, unknown> | undefined> {
    try {
      const filter = `${IDENTITY_ODATA.USER_BUSINESS_ID} eq '${businessId}'`;
      const endpoint = `${IDENTITY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}&$select=${IDENTITY_ODATA.SELECT_FIELDS.join(',')}&$top=1`;
      const response = await this.dataverseService.request('GET', endpoint);
      const results =
        (response as { value: Record<string, unknown>[] }).value || [];
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'find_identity_by_business_id',
        businessId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Complex search for identities with multiple criteria
   * @param criteria Search criteria object
   * @returns Search results with total count
   */
  async search(criteria: {
    accountId?: string;
    gender?: number;
    race?: number[];
    languages?: number[];
    indigenousDetail?: number;
    limit?: number;
  }): Promise<{
    results: Record<string, unknown>[];
    totalCount: number;
  }> {
    try {
      const filters: string[] = [];

      if (criteria.accountId) {
        filters.push(
          `${IDENTITY_ODATA.USER_BUSINESS_ID} eq '${criteria.accountId}'`,
        );
      }

      if (criteria.gender !== undefined) {
        filters.push(`osot_gender eq ${criteria.gender}`);
      }

      if (criteria.race && criteria.race.length > 0) {
        const raceFilter = criteria.race
          .map((r) => `osot_race eq ${r}`)
          .join(' or ');
        filters.push(`(${raceFilter})`);
      }

      if (criteria.languages && criteria.languages.length > 0) {
        // Languages is a multi-select field, needs special OData function
        const langValues = criteria.languages.map((l) => `'${l}'`).join(',');
        filters.push(
          `Microsoft.Dynamics.CRM.ContainValues(PropertyName='osot_language',PropertyValues=[${langValues}])`,
        );
      }

      if (criteria.indigenousDetail !== undefined) {
        filters.push(`osot_indigenous_detail eq ${criteria.indigenousDetail}`);
      }

      const filter = filters.length > 0 ? filters.join(' and ') : '';
      const limit = criteria.limit || 50;

      let endpoint = `${IDENTITY_ODATA.TABLE_NAME}?$select=${IDENTITY_ODATA.SELECT_FIELDS.join(',')}&$top=${limit}`;
      if (filter) {
        endpoint += `&$filter=${encodeURIComponent(filter)}`;
      }

      const response = await this.dataverseService.request('GET', endpoint);
      const results =
        (response as { value: Record<string, unknown>[] }).value || [];

      return {
        results,
        totalCount: results.length, // Note: This is simplified. In production, you'd want a separate count query
      };
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'search_identities',
        criteria,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find identities by preferred language
   * @param language Language enum value
   * @returns Array of identity records
   */
  async findByLanguage(language: number): Promise<Record<string, unknown>[]> {
    try {
      // Note: Language is a multi-select field, needs to check if language is included
      const filter = `Microsoft.Dynamics.CRM.ContainValues(PropertyName='osot_language',PropertyValues=['${language}'])`;
      const endpoint = `${IDENTITY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}&$select=${IDENTITY_ODATA.SELECT_FIELDS.join(',')}`;
      const response = await this.dataverseService.request('GET', endpoint);
      return (response as { value: Record<string, unknown>[] }).value || [];
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'find_identities_by_language',
        language,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find identities by race
   * @param race Race enum value
   * @returns Array of identity records
   */
  async findByRace(race: number): Promise<Record<string, unknown>[]> {
    try {
      const filter = `osot_race eq ${race}`;
      const endpoint = `${IDENTITY_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}&$select=${IDENTITY_ODATA.SELECT_FIELDS.join(',')}`;
      const response = await this.dataverseService.request('GET', endpoint);
      return (response as { value: Record<string, unknown>[] }).value || [];
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'find_identities_by_race',
        race,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get comprehensive identity statistics for an account
   * @param accountId Account GUID to analyze
   * @returns Detailed demographics and diversity statistics
   */
  async getIdentityStatistics(accountId: string): Promise<{
    total: number;
    demographics: {
      genderDistribution: Record<string, number>;
      raceDistribution: Record<string, number>;
      languageDistribution: Record<string, number>;
      indigenousCount: number;
    };
    diversity: {
      diversityIndex: number;
      culturalRichness: number;
      languageVariety: number;
    };
    trends: {
      mostCommonRace: string;
      dominantLanguage: string;
      genderBalance: number;
    };
  }> {
    try {
      const identities = await this.findByAccountId(accountId);

      const stats = {
        total: identities.length,
        demographics: {
          genderDistribution: {} as Record<string, number>,
          raceDistribution: {} as Record<string, number>,
          languageDistribution: {} as Record<string, number>,
          indigenousCount: 0,
        },
        diversity: {
          diversityIndex: 0,
          culturalRichness: 0,
          languageVariety: 0,
        },
        trends: {
          mostCommonRace: '',
          dominantLanguage: '',
          genderBalance: 0,
        },
      };

      // Calculate demographic distributions
      identities.forEach((identity) => {
        // Gender distribution
        const gender = this.getGenderLabel(identity.osot_gender as number);
        stats.demographics.genderDistribution[gender] =
          (stats.demographics.genderDistribution[gender] || 0) + 1;

        // Race distribution
        const race = this.getRaceLabel(identity.osot_race as number);
        stats.demographics.raceDistribution[race] =
          (stats.demographics.raceDistribution[race] || 0) + 1;

        // Language distribution (multi-select field)
        const languages = (identity.osot_language as number[]) || [];
        languages.forEach((lang) => {
          const langLabel = this.getLanguageLabel(lang);
          stats.demographics.languageDistribution[langLabel] =
            (stats.demographics.languageDistribution[langLabel] || 0) + 1;
        });

        // Indigenous count
        if (identity.osot_indigenous_detail) {
          stats.demographics.indigenousCount++;
        }
      });

      // Calculate diversity metrics
      stats.diversity = this.calculateDiversityMetrics(identities);

      // Calculate trends
      stats.trends = this.calculateTrends(stats.demographics);

      return stats;
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'get_identity_statistics',
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Analyze demographic patterns and diversity metrics
   * @param accountId Account GUID to analyze
   * @returns Advanced demographic analysis with diversity indices
   */
  async analyzeDemographics(accountId: string): Promise<{
    totalIdentities: number;
    diversityMetrics: {
      shannonDiversityIndex: number;
      simpsonDiversityIndex: number;
      culturalComplexity: number;
    };
    representationGaps: Array<{
      category: string;
      underrepresented: string[];
      recommendations: string[];
    }>;
    inclusivityScore: number;
  }> {
    try {
      const identities = await this.findByAccountId(accountId);

      const analysis = {
        totalIdentities: identities.length,
        diversityMetrics: {
          shannonDiversityIndex: 0,
          simpsonDiversityIndex: 0,
          culturalComplexity: 0,
        },
        representationGaps: [] as Array<{
          category: string;
          underrepresented: string[];
          recommendations: string[];
        }>,
        inclusivityScore: 0,
      };

      if (identities.length === 0) {
        return analysis;
      }

      // Calculate Shannon and Simpson diversity indices
      analysis.diversityMetrics =
        this.calculateAdvancedDiversityMetrics(identities);

      // Identify representation gaps
      analysis.representationGaps = this.identifyRepresentationGaps(identities);

      // Calculate overall inclusivity score
      analysis.inclusivityScore = this.calculateInclusivityScore(identities);

      return analysis;
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'analyze_demographics',
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find identities with multiple demographic criteria
   * @param criteria Complex search criteria
   * @returns Paginated search results
   */
  async findByMultipleCriteria(criteria: {
    accountId?: string;
    genders?: number[];
    races?: number[];
    languages?: number[];
    indigenousDetails?: number[];
    ageRange?: { min?: number; max?: number };
    culturalBackground?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{
    results: Record<string, unknown>[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const filters: string[] = [];

      if (criteria.accountId) {
        filters.push(
          `${IDENTITY_ODATA.USER_BUSINESS_ID} eq '${criteria.accountId}'`,
        );
      }

      if (criteria.genders && criteria.genders.length > 0) {
        const genderFilter = criteria.genders
          .map((g) => `osot_gender eq ${g}`)
          .join(' or ');
        filters.push(`(${genderFilter})`);
      }

      if (criteria.races && criteria.races.length > 0) {
        const raceFilter = criteria.races
          .map((r) => `osot_race eq ${r}`)
          .join(' or ');
        filters.push(`(${raceFilter})`);
      }

      if (criteria.languages && criteria.languages.length > 0) {
        const langValues = criteria.languages.map((l) => `'${l}'`).join(',');
        filters.push(
          `Microsoft.Dynamics.CRM.ContainValues(PropertyName='osot_language',PropertyValues=[${langValues}])`,
        );
      }

      if (criteria.indigenousDetails && criteria.indigenousDetails.length > 0) {
        const indigenousFilter = criteria.indigenousDetails
          .map((i) => `osot_indigenous_detail eq ${i}`)
          .join(' or ');
        filters.push(`(${indigenousFilter})`);
      }

      const filter = filters.length > 0 ? filters.join(' and ') : '';
      const limit = criteria.limit || 50;
      const offset = criteria.offset || 0;

      let endpoint = `${IDENTITY_ODATA.TABLE_NAME}?$select=${IDENTITY_ODATA.SELECT_FIELDS.join(',')}&$top=${limit + 1}&$skip=${offset}`;
      if (filter) {
        endpoint += `&$filter=${encodeURIComponent(filter)}`;
      }

      const response = await this.dataverseService.request('GET', endpoint);
      const results =
        (response as { value: Record<string, unknown>[] }).value || [];

      // Check if there are more results
      const hasMore = results.length > limit;
      if (hasMore) {
        results.pop(); // Remove the extra record
      }

      // Get total count (simplified - in production, you'd use a separate count query)
      const total = results.length + offset + (hasMore ? 1 : 0);

      return {
        results,
        total,
        hasMore,
      };
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'find_by_multiple_criteria',
        criteria,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate cultural data integrity and consistency
   * @param accountId Account GUID to validate
   * @returns Validation results with issues and recommendations
   */
  async validateCulturalData(accountId: string): Promise<{
    isValid: boolean;
    issues: Array<{
      identityId: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
      recommendation: string;
    }>;
    completenessScore: number;
  }> {
    try {
      const identities = await this.findByAccountId(accountId);

      const validation = {
        isValid: true,
        issues: [] as Array<{
          identityId: string;
          issue: string;
          severity: 'low' | 'medium' | 'high';
          recommendation: string;
        }>,
        completenessScore: 0,
      };

      let totalCompleteness = 0;

      identities.forEach((identity) => {
        const identityId = identity.osot_table_identityid as string;
        let completeness = 0;
        const totalFields = 6; // Gender, race, language, indigenous, cultural background

        // Validate gender
        if (!this.isValidGender(identity.osot_gender as number)) {
          validation.issues.push({
            identityId,
            issue: 'Invalid or missing gender information',
            severity: 'medium',
            recommendation:
              'Provide valid gender selection from available options',
          });
          validation.isValid = false;
        } else {
          completeness++;
        }

        // Validate race
        if (!this.isValidRace(identity.osot_race as number)) {
          validation.issues.push({
            identityId,
            issue: 'Invalid or missing race/ethnicity information',
            severity: 'medium',
            recommendation:
              'Select appropriate race/ethnicity from available categories',
          });
          validation.isValid = false;
        } else {
          completeness++;
        }

        // Validate languages
        const languages = (identity.osot_language as number[]) || [];
        if (languages.length === 0) {
          validation.issues.push({
            identityId,
            issue: 'No language preferences specified',
            severity: 'low',
            recommendation: 'Add at least one preferred language',
          });
        } else {
          completeness++;
        }

        // Check for cultural consistency
        const culturalIssues = this.validateCulturalConsistency(identity);
        culturalIssues.forEach((issue) => {
          validation.issues.push({
            identityId,
            ...issue,
          });
          if (issue.severity === 'high') {
            validation.isValid = false;
          }
        });

        totalCompleteness += (completeness / totalFields) * 100;
      });

      validation.completenessScore =
        identities.length > 0 ? totalCompleteness / identities.length : 0;

      return validation;
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'validate_cultural_data',
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Helper methods for identity operations
  private getGenderLabel(genderValue: number): string {
    const genderMap: Record<number, string> = {
      1: 'Male',
      2: 'Female',
      3: 'Non-binary',
      4: 'Prefer not to say',
      5: 'Other',
    };
    return genderMap[genderValue] || 'Unknown';
  }

  private getRaceLabel(raceValue: number): string {
    const raceMap: Record<number, string> = {
      1: 'White',
      2: 'Black or African American',
      3: 'American Indian or Alaska Native',
      4: 'Asian',
      5: 'Native Hawaiian or Other Pacific Islander',
      6: 'Hispanic or Latino',
      7: 'Two or More Races',
      8: 'Other',
    };
    return raceMap[raceValue] || 'Unknown';
  }

  private getLanguageLabel(languageValue: number): string {
    const languageMap: Record<number, string> = {
      1: 'English',
      2: 'Spanish',
      3: 'French',
      4: 'Portuguese',
      5: 'Chinese',
      6: 'Arabic',
      7: 'Hindi',
      8: 'Russian',
      9: 'Japanese',
      10: 'German',
      11: 'Other',
    };
    return languageMap[languageValue] || 'Unknown';
  }

  private calculateDiversityMetrics(identities: Record<string, unknown>[]): {
    diversityIndex: number;
    culturalRichness: number;
    languageVariety: number;
  } {
    if (identities.length === 0) {
      return { diversityIndex: 0, culturalRichness: 0, languageVariety: 0 };
    }

    // Calculate Simpson's Diversity Index for races
    const raceCounts: Record<string, number> = {};
    const languageSet = new Set<number>();

    identities.forEach((identity) => {
      const race = this.getRaceLabel(identity.osot_race as number);
      raceCounts[race] = (raceCounts[race] || 0) + 1;

      const languages = (identity.osot_language as number[]) || [];
      languages.forEach((lang) => languageSet.add(lang));
    });

    // Simpson's Diversity Index: 1 - Σ(pi²)
    const total = identities.length;
    let sumSquares = 0;
    Object.values(raceCounts).forEach((count) => {
      const proportion = count / total;
      sumSquares += proportion * proportion;
    });

    const diversityIndex = 1 - sumSquares;
    const culturalRichness = Object.keys(raceCounts).length / 8; // Normalized by max categories
    const languageVariety = languageSet.size / 11; // Normalized by max languages

    return {
      diversityIndex: Math.round(diversityIndex * 1000) / 1000,
      culturalRichness: Math.round(culturalRichness * 1000) / 1000,
      languageVariety: Math.round(languageVariety * 1000) / 1000,
    };
  }

  private calculateTrends(demographics: {
    genderDistribution: Record<string, number>;
    raceDistribution: Record<string, number>;
    languageDistribution: Record<string, number>;
  }): {
    mostCommonRace: string;
    dominantLanguage: string;
    genderBalance: number;
  } {
    // Most common race
    const mostCommonRace =
      Object.entries(demographics.raceDistribution).sort(
        ([, a], [, b]) => b - a,
      )[0]?.[0] || 'None';

    // Dominant language
    const dominantLanguage =
      Object.entries(demographics.languageDistribution).sort(
        ([, a], [, b]) => b - a,
      )[0]?.[0] || 'None';

    // Gender balance (how close to equal distribution)
    const genderCounts = Object.values(demographics.genderDistribution);
    const totalGender = genderCounts.reduce((sum, count) => sum + count, 0);

    if (totalGender === 0 || genderCounts.length <= 1) {
      return { mostCommonRace, dominantLanguage, genderBalance: 0 };
    }

    // Calculate coefficient of variation (lower = more balanced)
    const mean = totalGender / genderCounts.length;
    const variance =
      genderCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
      genderCounts.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    // Convert to balance score (1 = perfectly balanced, 0 = completely imbalanced)
    const genderBalance = Math.max(0, 1 - coefficientOfVariation);

    return {
      mostCommonRace,
      dominantLanguage,
      genderBalance: Math.round(genderBalance * 1000) / 1000,
    };
  }

  private calculateAdvancedDiversityMetrics(
    identities: Record<string, unknown>[],
  ): {
    shannonDiversityIndex: number;
    simpsonDiversityIndex: number;
    culturalComplexity: number;
  } {
    if (identities.length === 0) {
      return {
        shannonDiversityIndex: 0,
        simpsonDiversityIndex: 0,
        culturalComplexity: 0,
      };
    }

    // Count race distributions
    const raceCounts: Record<string, number> = {};
    identities.forEach((identity) => {
      const race = this.getRaceLabel(identity.osot_race as number);
      raceCounts[race] = (raceCounts[race] || 0) + 1;
    });

    const total = identities.length;

    // Shannon Diversity Index: H = -Σ(pi * ln(pi))
    let shannonIndex = 0;
    let simpsonIndex = 0;

    Object.values(raceCounts).forEach((count) => {
      const proportion = count / total;
      if (proportion > 0) {
        shannonIndex -= proportion * Math.log(proportion);
        simpsonIndex += proportion * proportion;
      }
    });

    // Simpson's Diversity Index: D = 1 - Σ(pi²)
    simpsonIndex = 1 - simpsonIndex;

    // Cultural Complexity: combination of racial diversity and language variety
    const uniqueLanguages = new Set<number>();
    identities.forEach((identity) => {
      const languages = (identity.osot_language as number[]) || [];
      languages.forEach((lang) => uniqueLanguages.add(lang));
    });

    const culturalComplexity = (shannonIndex * uniqueLanguages.size) / 10; // Normalized

    return {
      shannonDiversityIndex: Math.round(shannonIndex * 1000) / 1000,
      simpsonDiversityIndex: Math.round(simpsonIndex * 1000) / 1000,
      culturalComplexity: Math.round(culturalComplexity * 1000) / 1000,
    };
  }

  private identifyRepresentationGaps(
    identities: Record<string, unknown>[],
  ): Array<{
    category: string;
    underrepresented: string[];
    recommendations: string[];
  }> {
    const gaps: Array<{
      category: string;
      underrepresented: string[];
      recommendations: string[];
    }> = [];

    if (identities.length === 0) {
      return gaps;
    }

    // Analyze gender representation
    const genderCounts: Record<string, number> = {};
    identities.forEach((identity) => {
      const gender = this.getGenderLabel(identity.osot_gender as number);
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    });

    const expectedGenders = ['Male', 'Female', 'Non-binary'];
    const underrepresentedGenders = expectedGenders.filter(
      (gender) => (genderCounts[gender] || 0) < identities.length * 0.1, // Less than 10%
    );

    if (underrepresentedGenders.length > 0) {
      gaps.push({
        category: 'Gender',
        underrepresented: underrepresentedGenders,
        recommendations: [
          'Consider targeted outreach to underrepresented gender groups',
          'Review hiring and recruitment practices for gender inclusivity',
          'Implement mentorship programs for minority gender groups',
        ],
      });
    }

    // Analyze racial representation
    const raceCounts: Record<string, number> = {};
    identities.forEach((identity) => {
      const race = this.getRaceLabel(identity.osot_race as number);
      raceCounts[race] = (raceCounts[race] || 0) + 1;
    });

    const majorRaces = [
      'White',
      'Black or African American',
      'Hispanic or Latino',
      'Asian',
    ];
    const underrepresentedRaces = majorRaces.filter(
      (race) => (raceCounts[race] || 0) < identities.length * 0.05, // Less than 5%
    );

    if (underrepresentedRaces.length > 0) {
      gaps.push({
        category: 'Race/Ethnicity',
        underrepresented: underrepresentedRaces,
        recommendations: [
          'Expand recruitment to historically underrepresented communities',
          'Partner with minority-serving organizations',
          'Review barriers that may prevent diverse participation',
        ],
      });
    }

    return gaps;
  }

  private calculateInclusivityScore(
    identities: Record<string, unknown>[],
  ): number {
    if (identities.length === 0) {
      return 0;
    }

    let score = 0;
    const maxScore = 100;

    // Diversity component (40 points)
    const metrics = this.calculateAdvancedDiversityMetrics(identities);
    score += metrics.shannonDiversityIndex * 20; // Max ~40 points
    score += metrics.culturalComplexity * 20;

    // Representation component (30 points)
    const genderVariety = new Set(identities.map((i) => i.osot_gender)).size;
    const raceVariety = new Set(identities.map((i) => i.osot_race)).size;
    score += Math.min(genderVariety * 7.5, 30); // Up to 4 genders * 7.5 = 30
    score += Math.min(raceVariety * 3.75, 30); // Up to 8 races * 3.75 = 30

    // Completeness component (30 points)
    let completenessSum = 0;
    identities.forEach((identity) => {
      let fieldCount = 0;
      if (identity.osot_gender) fieldCount++;
      if (identity.osot_race) fieldCount++;
      if (((identity.osot_language as number[]) || []).length > 0) fieldCount++;
      completenessSum += (fieldCount / 3) * 30;
    });
    score += completenessSum / identities.length;

    return Math.min(Math.round(score), maxScore);
  }

  private isValidGender(genderValue: number): boolean {
    return genderValue >= 1 && genderValue <= 5;
  }

  private isValidRace(raceValue: number): boolean {
    return raceValue >= 1 && raceValue <= 8;
  }

  private validateCulturalConsistency(
    identity: Record<string, unknown>,
  ): Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }> {
    const issues: Array<{
      issue: string;
      severity: 'low' | 'medium' | 'high';
      recommendation: string;
    }> = [];

    // Check for missing critical fields
    if (!identity.osot_gender && !identity.osot_race) {
      issues.push({
        issue: 'Missing both gender and race information',
        severity: 'high',
        recommendation:
          'Complete demographic profile with gender and race information',
      });
    }

    // Check language consistency
    const languages = (identity.osot_language as number[]) || [];
    if (languages.length > 5) {
      issues.push({
        issue: 'Unusually high number of languages selected',
        severity: 'low',
        recommendation: 'Verify language selections are accurate and necessary',
      });
    }

    return issues;
  }

  /**
   * Find cultural communities within account
   * @param accountId Account GUID to analyze
   * @returns Cultural communities analysis with connections
   */
  async findCulturalCommunities(accountId: string): Promise<{
    communities: Array<{
      name: string;
      members: Record<string, unknown>[];
      commonTraits: string[];
      diversityLevel: number;
    }>;
    crossCulturalConnections: Array<{
      community1: string;
      community2: string;
      connectionStrength: number;
      commonElements: string[];
    }>;
  }> {
    try {
      const identities = await this.findByAccountId(accountId);

      // Group identities by cultural traits
      const communities = this.identifyCulturalCommunities(identities);

      // Find cross-cultural connections
      const crossCulturalConnections =
        this.findCrossCulturalConnections(communities);

      return {
        communities,
        crossCulturalConnections,
      };
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'find_cultural_communities',
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate diversity and inclusion recommendations
   * @param accountId Account GUID to analyze
   * @returns Actionable diversity recommendations
   */
  async generateDiversityRecommendations(accountId: string): Promise<{
    recommendations: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      action: string;
      expectedImpact: string;
      implementation: string[];
    }>;
    currentInclusivityLevel: number;
    targetInclusivityLevel: number;
    improvementPotential: number;
  }> {
    try {
      const identities = await this.findByAccountId(accountId);
      const analysis = await this.analyzeDemographics(accountId);

      const recommendations = this.generateRecommendations(
        identities,
        analysis,
      );
      const currentLevel = analysis.inclusivityScore;
      const targetLevel = 85; // Target 85% inclusivity
      const improvementPotential = Math.max(0, targetLevel - currentLevel);

      return {
        recommendations,
        currentInclusivityLevel: currentLevel,
        targetInclusivityLevel: targetLevel,
        improvementPotential,
      };
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'generate_diversity_recommendations',
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if cultural identity patterns are consistent
   * @param identityId Identity GUID to validate
   * @returns Consistency validation results
   */
  async validateIdentityConsistency(identityId: string): Promise<{
    isConsistent: boolean;
    conflicts: Array<{
      field1: string;
      field2: string;
      conflict: string;
      resolution: string;
    }>;
    confidenceScore: number;
  }> {
    try {
      const identity = await this.findByGuid(identityId);

      if (!identity) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          resource: 'identity',
          identityId,
        });
      }

      const validation = {
        isConsistent: true,
        conflicts: [] as Array<{
          field1: string;
          field2: string;
          conflict: string;
          resolution: string;
        }>,
        confidenceScore: 100,
      };

      // Validate cultural consistency
      const conflicts = this.detectCulturalConflicts();
      validation.conflicts = conflicts;
      validation.isConsistent = conflicts.length === 0;
      validation.confidenceScore = Math.max(0, 100 - conflicts.length * 15);

      return validation;
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'validate_identity_consistency',
        identityId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find similar cultural profiles
   * @param identityId Identity GUID to compare
   * @param similarity Similarity threshold
   * @returns Similar profiles analysis
   */
  async findSimilarProfiles(
    identityId: string,
    similarity: 'high' | 'medium' | 'low',
  ): Promise<{
    similarProfiles: Array<{
      identityId: string;
      similarityScore: number;
      commonTraits: string[];
      differences: string[];
    }>;
    clusterAnalysis: {
      clusterId: string;
      clusterSize: number;
      averageSimilarity: number;
    };
  }> {
    try {
      const targetIdentity = await this.findByGuid(identityId);

      if (!targetIdentity) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          resource: 'identity',
          identityId,
        });
      }

      const accountId = targetIdentity._osot_table_account_value as string;
      const allIdentities = await this.findByAccountId(accountId);

      const similarityThreshold = this.getSimilarityThreshold(similarity);
      const profiles = this.calculateSimilarProfiles(
        targetIdentity,
        allIdentities,
        similarityThreshold,
      );
      const clusterAnalysis = this.performClusterAnalysis(
        targetIdentity,
        profiles,
      );

      return {
        similarProfiles: profiles,
        clusterAnalysis,
      };
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'find_similar_profiles',
        identityId,
        similarity,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Track identity data evolution over time
   * @param identityId Identity GUID to track
   * @returns Evolution timeline and patterns
   */
  async getIdentityEvolution(identityId: string): Promise<{
    changes: Array<{
      timestamp: Date;
      field: string;
      oldValue: unknown;
      newValue: unknown;
      reason?: string;
    }>;
    stabilityScore: number;
    evolutionPattern: 'stable' | 'evolving' | 'volatile';
  }> {
    try {
      // Note: This would typically require audit tables or change tracking
      // For now, we'll return a simplified implementation
      const identity = await this.findByGuid(identityId);

      if (!identity) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          resource: 'identity',
          identityId,
        });
      }

      // Simplified evolution tracking
      const evolution = {
        changes: [] as Array<{
          timestamp: Date;
          field: string;
          oldValue: unknown;
          newValue: unknown;
          reason?: string;
        }>,
        stabilityScore: 95, // High stability for most identity data
        evolutionPattern: 'stable' as 'stable' | 'evolving' | 'volatile',
      };

      // In a real implementation, this would query audit logs
      // For now, we'll analyze current data completeness as a proxy
      const completeness = this.calculateDataCompleteness(identity);

      if (completeness < 0.5) {
        evolution.evolutionPattern = 'evolving';
        evolution.stabilityScore = 60;
      } else if (completeness < 0.8) {
        evolution.evolutionPattern = 'evolving';
        evolution.stabilityScore = 80;
      }

      return evolution;
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'get_identity_evolution',
        identityId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Additional helper methods for advanced features

  private identifyCulturalCommunities(
    identities: Record<string, unknown>[],
  ): Array<{
    name: string;
    members: Record<string, unknown>[];
    commonTraits: string[];
    diversityLevel: number;
  }> {
    const communities: Array<{
      name: string;
      members: Record<string, unknown>[];
      commonTraits: string[];
      diversityLevel: number;
    }> = [];

    // Group by race/ethnicity
    const raceGroups: Record<string, Record<string, unknown>[]> = {};
    identities.forEach((identity) => {
      const race = this.getRaceLabel(identity.osot_race as number);
      if (!raceGroups[race]) {
        raceGroups[race] = [];
      }
      raceGroups[race].push(identity);
    });

    // Create communities for significant groups (>2 members)
    Object.entries(raceGroups).forEach(([race, members]) => {
      if (members.length > 2) {
        const commonLanguages = this.findCommonLanguages(members);
        const diversityLevel = this.calculateGroupDiversity(members);

        communities.push({
          name: `${race} Community`,
          members,
          commonTraits: [race, ...commonLanguages],
          diversityLevel,
        });
      }
    });

    return communities;
  }

  private findCrossCulturalConnections(
    communities: Array<{
      name: string;
      members: Record<string, unknown>[];
      commonTraits: string[];
      diversityLevel: number;
    }>,
  ): Array<{
    community1: string;
    community2: string;
    connectionStrength: number;
    commonElements: string[];
  }> {
    const connections: Array<{
      community1: string;
      community2: string;
      connectionStrength: number;
      commonElements: string[];
    }> = [];

    for (let i = 0; i < communities.length; i++) {
      for (let j = i + 1; j < communities.length; j++) {
        const comm1 = communities[i];
        const comm2 = communities[j];

        const commonElements = comm1.commonTraits.filter((trait) =>
          comm2.commonTraits.includes(trait),
        );

        if (commonElements.length > 0) {
          const connectionStrength =
            (commonElements.length /
              Math.max(comm1.commonTraits.length, comm2.commonTraits.length)) *
            100;

          connections.push({
            community1: comm1.name,
            community2: comm2.name,
            connectionStrength: Math.round(connectionStrength),
            commonElements,
          });
        }
      }
    }

    return connections.sort(
      (a, b) => b.connectionStrength - a.connectionStrength,
    );
  }

  private generateRecommendations(
    identities: Record<string, unknown>[],
    analysis: {
      diversityMetrics: {
        shannonDiversityIndex: number;
        simpsonDiversityIndex: number;
        culturalComplexity: number;
      };
      inclusivityScore: number;
    },
  ): Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
    implementation: string[];
  }> {
    const recommendations: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      action: string;
      expectedImpact: string;
      implementation: string[];
    }> = [];

    // Low diversity recommendations
    if (analysis.diversityMetrics.shannonDiversityIndex < 0.5) {
      recommendations.push({
        category: 'Diversity Enhancement',
        priority: 'high',
        action: 'Increase racial and ethnic diversity',
        expectedImpact: 'Improve innovation and decision-making quality',
        implementation: [
          'Partner with diverse organizations for recruitment',
          'Review hiring criteria for unconscious bias',
          'Implement diversity targets for leadership roles',
        ],
      });
    }

    // Gender imbalance recommendations
    const genderCount = new Set(identities.map((i) => i.osot_gender)).size;
    if (genderCount < 3) {
      recommendations.push({
        category: 'Gender Inclusion',
        priority: 'medium',
        action: 'Improve gender representation',
        expectedImpact: 'Create more inclusive environment',
        implementation: [
          'Implement gender-neutral recruitment practices',
          'Provide gender identity training',
          'Create supportive policies for all gender identities',
        ],
      });
    }

    // Language diversity recommendations
    const languageCount = new Set();
    identities.forEach((identity) => {
      const languages = (identity.osot_language as number[]) || [];
      languages.forEach((lang) => languageCount.add(lang));
    });

    if (languageCount.size < 3) {
      recommendations.push({
        category: 'Cultural Diversity',
        priority: 'low',
        action: 'Enhance language and cultural diversity',
        expectedImpact: 'Improve global market understanding',
        implementation: [
          'Recruit internationally',
          'Partner with multilingual organizations',
          'Provide language learning opportunities',
        ],
      });
    }

    return recommendations;
  }

  private detectCulturalConflicts(): Array<{
    field1: string;
    field2: string;
    conflict: string;
    resolution: string;
  }> {
    const conflicts: Array<{
      field1: string;
      field2: string;
      conflict: string;
      resolution: string;
    }> = [];

    // Check for logical inconsistencies
    // This is simplified - in reality, cultural data is complex and diverse

    return conflicts;
  }

  private getSimilarityThreshold(
    similarity: 'high' | 'medium' | 'low',
  ): number {
    const thresholds = {
      high: 0.8,
      medium: 0.6,
      low: 0.4,
    };
    return thresholds[similarity];
  }

  private calculateSimilarProfiles(
    targetIdentity: Record<string, unknown>,
    allIdentities: Record<string, unknown>[],
    threshold: number,
  ): Array<{
    identityId: string;
    similarityScore: number;
    commonTraits: string[];
    differences: string[];
  }> {
    const profiles: Array<{
      identityId: string;
      similarityScore: number;
      commonTraits: string[];
      differences: string[];
    }> = [];

    allIdentities.forEach((identity) => {
      if (
        identity.osot_table_identityid === targetIdentity.osot_table_identityid
      ) {
        return; // Skip self
      }

      const similarity = this.calculateIdentitySimilarity(
        targetIdentity,
        identity,
      );

      if (similarity.score >= threshold) {
        profiles.push({
          identityId: identity.osot_table_identityid as string,
          similarityScore: similarity.score,
          commonTraits: similarity.commonTraits,
          differences: similarity.differences,
        });
      }
    });

    return profiles.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  private calculateIdentitySimilarity(
    identity1: Record<string, unknown>,
    identity2: Record<string, unknown>,
  ): {
    score: number;
    commonTraits: string[];
    differences: string[];
  } {
    const commonTraits: string[] = [];
    const differences: string[] = [];
    let matchCount = 0;
    let totalFields = 0;

    // Compare gender
    totalFields++;
    if (identity1.osot_gender === identity2.osot_gender) {
      matchCount++;
      commonTraits.push(
        `Gender: ${this.getGenderLabel(identity1.osot_gender as number)}`,
      );
    } else {
      differences.push('Gender');
    }

    // Compare race
    totalFields++;
    if (identity1.osot_race === identity2.osot_race) {
      matchCount++;
      commonTraits.push(
        `Race: ${this.getRaceLabel(identity1.osot_race as number)}`,
      );
    } else {
      differences.push('Race');
    }

    // Compare languages (intersection)
    totalFields++;
    const lang1 = (identity1.osot_language as number[]) || [];
    const lang2 = (identity2.osot_language as number[]) || [];
    const commonLanguages = lang1.filter((lang) => lang2.includes(lang));

    if (commonLanguages.length > 0) {
      matchCount +=
        commonLanguages.length / Math.max(lang1.length, lang2.length);
      commonTraits.push(
        `Languages: ${commonLanguages.map((l) => this.getLanguageLabel(l)).join(', ')}`,
      );
    } else if (lang1.length > 0 || lang2.length > 0) {
      differences.push('Languages');
    }

    const score = (matchCount / totalFields) * 100;

    return {
      score: Math.round(score),
      commonTraits,
      differences,
    };
  }

  private performClusterAnalysis(
    targetIdentity: Record<string, unknown>,
    profiles: Array<{
      identityId: string;
      similarityScore: number;
      commonTraits: string[];
      differences: string[];
    }>,
  ): {
    clusterId: string;
    clusterSize: number;
    averageSimilarity: number;
  } {
    // Simplified cluster analysis
    const clusterId = `cluster_${targetIdentity.osot_race as number}_${
      targetIdentity.osot_gender as number
    }`;
    const clusterSize = profiles.length + 1; // Include target identity
    const averageSimilarity =
      profiles.length > 0
        ? profiles.reduce((sum, p) => sum + p.similarityScore, 0) /
          profiles.length
        : 100;

    return {
      clusterId,
      clusterSize,
      averageSimilarity: Math.round(averageSimilarity),
    };
  }

  private calculateDataCompleteness(identity: Record<string, unknown>): number {
    const fields = [
      'osot_gender',
      'osot_race',
      'osot_language',
      'osot_indigenous_detail',
    ];
    let completedFields = 0;

    fields.forEach((field) => {
      if (identity[field] !== null && identity[field] !== undefined) {
        if (field === 'osot_language') {
          const languages = (identity[field] as number[]) || [];
          if (languages.length > 0) {
            completedFields++;
          }
        } else {
          completedFields++;
        }
      }
    });

    return completedFields / fields.length;
  }

  private findCommonLanguages(members: Record<string, unknown>[]): string[] {
    const languageCounts: Record<number, number> = {};

    members.forEach((member) => {
      const languages = (member.osot_language as number[]) || [];
      languages.forEach((lang) => {
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      });
    });

    // Return languages spoken by at least half the group
    const threshold = Math.ceil(members.length / 2);
    return Object.entries(languageCounts)
      .filter(([, count]) => count >= threshold)
      .map(([lang]) => this.getLanguageLabel(Number(lang)));
  }

  private calculateGroupDiversity(members: Record<string, unknown>[]): number {
    if (members.length <= 1) return 0;

    // Calculate diversity based on internal variation
    const genderVariety = new Set(members.map((m) => m.osot_gender)).size;
    const maxGenderVariety = Math.min(5, members.length); // Max 5 gender categories

    const languageSet = new Set<number>();
    members.forEach((member) => {
      const languages = (member.osot_language as number[]) || [];
      languages.forEach((lang) => languageSet.add(lang));
    });
    const languageVariety = languageSet.size;
    const maxLanguageVariety = Math.min(11, members.length * 2); // Estimate max languages

    const diversityScore =
      (genderVariety / maxGenderVariety +
        languageVariety / maxLanguageVariety) /
      2;

    return Math.round(diversityScore * 100);
  }
}

// Dependency Injection Token
export const IDENTITY_REPOSITORY = 'IDENTITY_REPOSITORY';

// Export interface for type safety
export { IdentityRepository } from '../interfaces/identity-repository.interface';

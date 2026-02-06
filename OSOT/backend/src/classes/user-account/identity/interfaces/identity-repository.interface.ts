import { IdentityInternal } from './identity-internal.interface';

/**
 * Identity Repository Interface
 *
 * Defines the contract for identity data access operations following the Repository Pattern.
 * This interface abstracts data access operations and provides a clean contract for
 * dependency injection across the identity module.
 *
 * ENTERPRISE FEATURES:
 * - Repository Pattern: Clean data access abstraction
 * - Dependency Injection: Injectable via IDENTITY_REPOSITORY token
 * - Type Safety: Full TypeScript support for all operations
 * - CRUD Operations: Complete Create, Read, Update, Delete functionality
 * - Demographics Queries: Cultural and linguistic identity search capabilities
 * - Search Operations: Multi-criteria identity discovery and analytics
 *
 * BUSINESS OPERATIONS:
 * - Account-based Identity Management: Multi-tenant identity organization
 * - Business ID Lookups: Integration with external business systems
 * - Demographic Analysis: Gender, race, and cultural identity tracking
 * - Language Operations: Multi-language identity support and queries
 * - Indigenous Data: Specialized tracking for indigenous identity details
 *
 * @interface IdentityRepository
 * @follows Repository Pattern, Dependency Injection
 * @author OSOT Development Team
 * @version 2.0.0 - Enterprise Interface Standard
 */
export interface IdentityRepository {
  /**
   * Create a new identity record
   */
  create(internal: Partial<IdentityInternal>): Promise<Record<string, unknown>>;

  /**
   * Find identity by GUID identifier
   */
  findByGuid(guid: string): Promise<Record<string, unknown> | undefined>;

  /**
   * Update identity by GUID with new data
   */
  updateByGuid(guid: string, payload: Record<string, unknown>): Promise<void>;

  /**
   * Delete identity by GUID
   */
  deleteByGuid(guid: string): Promise<void>;

  /**
   * Find all identities associated with an account
   */
  findByAccountId(accountId: string): Promise<Record<string, unknown>[]>;

  /**
   * Find specific identity by business ID
   */
  findByBusinessId(
    businessId: string,
  ): Promise<Record<string, unknown> | undefined>;

  /**
   * Advanced multi-criteria identity search with demographics
   */
  search(criteria: {
    accountId?: string;
    gender?: number;
    race?: number[];
    languages?: number[];
    indigenousDetail?: number;
    limit?: number;
  }): Promise<{
    results: Record<string, unknown>[];
    totalCount: number;
  }>;

  /**
   * Find identities by language preference
   */
  findByLanguage(language: number): Promise<Record<string, unknown>[]>;

  /**
   * Find identities by race/ethnicity
   */
  findByRace(race: number): Promise<Record<string, unknown>[]>;

  /**
   * Get comprehensive identity statistics for an account
   */
  getIdentityStatistics(accountId: string): Promise<{
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
  }>;

  /**
   * Analyze demographic patterns and diversity metrics
   */
  analyzeDemographics(accountId: string): Promise<{
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
  }>;

  /**
   * Find identities with multiple demographic criteria
   */
  findByMultipleCriteria(criteria: {
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
  }>;

  /**
   * Validate cultural data integrity and consistency
   */
  validateCulturalData(accountId: string): Promise<{
    isValid: boolean;
    issues: Array<{
      identityId: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
      recommendation: string;
    }>;
    completenessScore: number;
  }>;

  /**
   * Find cultural communities within account
   */
  findCulturalCommunities(accountId: string): Promise<{
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
  }>;

  /**
   * Generate diversity and inclusion recommendations
   */
  generateDiversityRecommendations(accountId: string): Promise<{
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
  }>;

  /**
   * Check if cultural identity patterns are consistent
   */
  validateIdentityConsistency(identityId: string): Promise<{
    isConsistent: boolean;
    conflicts: Array<{
      field1: string;
      field2: string;
      conflict: string;
      resolution: string;
    }>;
    confidenceScore: number;
  }>;

  /**
   * Find similar cultural profiles
   */
  findSimilarProfiles(
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
  }>;

  /**
   * Track identity data evolution over time
   */
  getIdentityEvolution(identityId: string): Promise<{
    changes: Array<{
      timestamp: Date;
      field: string;
      oldValue: unknown;
      newValue: unknown;
      reason?: string;
    }>;
    stabilityScore: number;
    evolutionPattern: 'stable' | 'evolving' | 'volatile';
  }>;
}

/**
 * Dependency Injection Token for IdentityRepository
 */
export const IDENTITY_REPOSITORY = 'IDENTITY_REPOSITORY';

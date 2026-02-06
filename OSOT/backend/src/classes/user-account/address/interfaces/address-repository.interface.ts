/**
 * Interface for Address repository operations.
 * Defines the contract for data access layer operations.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - integrations: Uses DataverseService for data operations
 * - errors: Returns structured error handling
 * - interfaces: Works with AddressInternal and AddressDataverse
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT needs
 * - No complex aggregations or analytics
 * - Focus on reliable data access patterns
 */

import { AddressInternal } from './address-internal.interface';
import { AddressDataverse } from './address-dataverse.interface';

export interface AddressRepository {
  /**
   * Create a new address record
   */
  create(addressData: Partial<AddressInternal>): Promise<AddressInternal>;

  /**
   * Find address by ID
   */
  findById(addressId: string): Promise<AddressInternal | null>;

  /**
   * Find addresses by account ID
   */
  findByAccountId(accountId: string): Promise<AddressInternal[]>;

  /**
   * Find addresses by user business ID
   */
  findByUserBusinessId(userBusinessId: string): Promise<AddressInternal[]>;

  /**
   * Find address by business ID (osot_address_id)
   */
  findByBusinessId(businessId: string): Promise<AddressInternal | null>;

  /**
   * Find addresses by user (owner)
   */
  findByUserId(userId: string): Promise<AddressInternal[]>;

  /**
   * Update address by ID
   */
  update(
    addressId: string,
    updateData: Partial<AddressInternal>,
  ): Promise<AddressInternal>;

  /**
   * Delete address by ID (soft delete)
   */
  delete(addressId: string): Promise<boolean>;

  /**
   * Delete all addresses associated with an organization
   * Used for cascade delete when deleting an organization
   */
  deleteByOrganizationId(organizationId: string): Promise<number>;

  /**
   * Check if address exists
   */
  exists(addressId: string): Promise<boolean>;

  /**
   * Find addresses by postal code (for duplicate checking)
   */
  findByPostalCode(
    postalCode: string,
    accountId?: string,
  ): Promise<AddressInternal[]>;

  /**
   * Count addresses for account
   */
  countByAccountId(accountId: string): Promise<number>;

  /**
   * Raw Dataverse query for complex scenarios
   */
  queryRaw(oDataQuery: string): Promise<AddressDataverse[]>;

  /**
   * Batch operations for multiple addresses
   */
  batchCreate(
    addresses: Partial<AddressInternal>[],
  ): Promise<AddressInternal[]>;

  /**
   * Health check - verify repository can connect to Dataverse
   */
  healthCheck(): Promise<{
    isHealthy: boolean;
    message: string;
    timestamp: string;
  }>;

  // ========================================
  // ADVANCED ENTERPRISE METHODS
  // ========================================

  /**
   * Get comprehensive address statistics
   */
  getAddressStatistics(): Promise<{
    totalAddresses: number;
    addressesByType: Record<string, number>;
    addressesByProvince: Record<string, number>;
    addressesByCountry: Record<string, number>;
    averageAddressesPerAccount: number;
    timestamp: string;
  }>;

  /**
   * Analyze geographic distribution of addresses
   */
  analyzeGeographicDistribution(): Promise<{
    topProvinces: Array<{
      province: number;
      count: number;
      percentage: number;
    }>;
    topCities: Array<{ city: string; count: number; percentage: number }>;
    postalCodePatterns: Array<{ pattern: string; count: number }>;
    countryDistribution: Record<string, number>;
    timestamp: string;
  }>;

  /**
   * Find addresses by multiple criteria (advanced search)
   */
  findByMultipleCriteria(criteria: {
    accountId?: string;
    userId?: string;
    addressType?: number;
    province?: number;
    city?: string;
    postalCode?: string;
    country?: number;
    addressPreference?: number;
    createdAfter?: Date;
    createdBefore?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    addresses: AddressInternal[];
    totalCount: number;
    hasMore: boolean;
  }>;

  /**
   * Validate address consistency and find potential issues
   */
  validateAddressConsistency(): Promise<{
    duplicateAddresses: Array<{
      address1: AddressInternal;
      address2: AddressInternal;
      similarity: number;
    }>;
    invalidPostalCodes: AddressInternal[];
    orphanedAddresses: AddressInternal[];
    inconsistentProvincePostal: AddressInternal[];
    validationSummary: {
      totalChecked: number;
      issuesFound: number;
      duplicatesFound: number;
      orphansFound: number;
    };
    timestamp: string;
  }>;

  /**
   * Find nearby addresses within a geographic radius
   */
  findNearbyAddresses(referenceAddress: {
    city: string;
    province: number;
    postalCode: string;
  }): Promise<AddressInternal[]>;

  /**
   * Generate location-based recommendations
   */
  generateLocationRecommendations(accountId: string): Promise<{
    suggestedProvinces: Array<{
      province: number;
      reason: string;
      score: number;
    }>;
    suggestedCities: Array<{
      city: string;
      province: number;
      reason: string;
      score: number;
    }>;
    addressOptimizations: Array<{
      currentAddress: AddressInternal;
      suggestion: string;
      impact: string;
    }>;
    timestamp: string;
  }>;

  /**
   * Get address usage patterns and analytics
   */
  getAddressUsagePatterns(): Promise<{
    mostUsedAddressTypes: Array<{
      type: number;
      count: number;
      percentage: number;
    }>;
    preferenceDistribution: Record<string, number>;
    creationTrends: Array<{
      month: string;
      count: number;
      growthRate: number;
    }>;
    peakUsageHours: Array<{ hour: number; activity: number }>;
    averageAddressLifespan: number;
    timestamp: string;
  }>;

  /**
   * Analyze and detect duplicate addresses across accounts
   */
  analyzeDuplicateAddresses(): Promise<{
    exactDuplicates: Array<{
      addresses: AddressInternal[];
      duplicateCount: number;
    }>;
    similarAddresses: Array<{
      group: AddressInternal[];
      similarity: number;
    }>;
    suspiciousPatterns: Array<{
      pattern: string;
      addresses: AddressInternal[];
      riskLevel: 'low' | 'medium' | 'high';
    }>;
    recommendations: string[];
    summary: {
      totalAddresses: number;
      exactDuplicates: number;
      suspiciousGroups: number;
      cleanAddresses: number;
    };
    timestamp: string;
  }>;
}

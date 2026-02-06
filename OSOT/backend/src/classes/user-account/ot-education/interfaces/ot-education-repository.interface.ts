/**
 * Interface for OT Education repository operations.
 * Defines the contract for data access layer operations.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - integrations: Uses DataverseService for data operations
 * - errors: Returns structured error handling
 * - interfaces: Works with OtEducationInternal and DataverseOtEducation
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT needs
 * - No complex aggregations or analytics
 * - Focus on reliable data access patterns
 */

import { OtEducationInternal } from './ot-education-internal.interface';
import { DataverseOtEducation } from './ot-education-dataverse.interface';

export interface OtEducationRepository {
  /**
   * Create a new OT education record
   */
  create(
    educationData: Partial<OtEducationInternal>,
  ): Promise<OtEducationInternal>;

  /**
   * Find OT education by ID
   */
  findById(educationId: string): Promise<OtEducationInternal | null>;

  /**
   * Find OT education records by account ID
   */
  findByAccountId(accountId: string): Promise<OtEducationInternal[]>;

  /**
   * Find OT education records by user (owner)
   */
  findByUserId(userId: string): Promise<OtEducationInternal[]>;

  /**
   * Find OT education by business ID (osot_ot_education_id)
   */
  findByBusinessId(businessId: string): Promise<OtEducationInternal | null>;

  /**
   * Update OT education by ID
   */
  update(
    educationId: string,
    updateData: Partial<OtEducationInternal>,
  ): Promise<OtEducationInternal>;

  /**
   * Delete OT education by ID (soft delete)
   */
  delete(educationId: string): Promise<boolean>;

  /**
   * Check if OT education exists
   */
  exists(educationId: string): Promise<boolean>;

  /**
   * Find OT education records by COTO registration (for duplicate checking)
   */
  findByCotoRegistration(
    cotoRegistration: string,
    accountId?: string,
  ): Promise<OtEducationInternal[]>;

  /**
   * Count OT education records for account
   */
  countByAccountId(accountId: string): Promise<number>;

  /**
   * Raw Dataverse query for complex scenarios
   */
  queryRaw(oDataQuery: string): Promise<DataverseOtEducation[]>;

  /**
   * Batch operations for multiple OT education records
   */
  batchCreate(
    educations: Partial<OtEducationInternal>[],
  ): Promise<OtEducationInternal[]>;

  /**
   * Health check - verify repository can connect to Dataverse
   */
  healthCheck(): Promise<{
    isHealthy: boolean;
    message: string;
    timestamp: string;
  }>;
}

/**
 * Dependency Injection Token for OtEducationRepository
 */
export const OT_EDUCATION_REPOSITORY = 'OT_EDUCATION_REPOSITORY';

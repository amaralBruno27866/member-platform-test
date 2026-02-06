/**
 * Interface for OTA Education repository operations.
 * Defines the contract for data access layer operations.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - integrations: Uses DataverseService for data operations
 * - errors: Returns structured error handling
 * - interfaces: Works with OtaEducationInternal and DataverseOtaEducation
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT needs
 * - No complex aggregations or analytics
 * - Focus on reliable data access patterns
 */

import { OtaEducationInternal } from './ota-education-internal.interface';
import { DataverseOtaEducation } from './ota-education-dataverse.interface';

export interface OtaEducationRepository {
  /**
   * Create a new OTA education record
   */
  create(
    educationData: Partial<OtaEducationInternal>,
  ): Promise<OtaEducationInternal>;

  /**
   * Find OTA education by ID
   */
  findById(id: string): Promise<OtaEducationInternal | null>;

  /**
   * Find OTA education by business ID
   */
  findByBusinessId(businessId: string): Promise<OtaEducationInternal | null>;

  /**
   * Find OTA education by account ID
   */
  findByAccountId(accountId: string): Promise<OtaEducationInternal[]>;

  /**
   * Find OTA education by user business ID
   */
  findByUserBusinessId(
    userBusinessId: string,
  ): Promise<OtaEducationInternal | null>;

  /**
   * Update OTA education record
   */
  update(
    id: string,
    educationData: Partial<OtaEducationInternal>,
  ): Promise<OtaEducationInternal>;

  /**
   * Delete OTA education record (soft delete preferred)
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if user business ID exists (for duplicate validation)
   */
  existsByUserBusinessId(userBusinessId: string): Promise<boolean>;

  /**
   * Find multiple OTA education records with filters
   */
  findMany(filters: {
    accountId?: string;
    degreeType?: number;
    college?: number;
    country?: number;
    graduationYear?: number;
    workDeclaration?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<OtaEducationInternal[]>;

  /**
   * Count OTA education records with filters
   */
  count(filters: {
    accountId?: string;
    degreeType?: number;
    college?: number;
    country?: number;
    graduationYear?: number;
    workDeclaration?: boolean;
  }): Promise<number>;

  /**
   * Transform Dataverse response to internal format
   */
  mapFromDataverse(dataverseData: DataverseOtaEducation): OtaEducationInternal;

  /**
   * Transform internal format to Dataverse format
   */
  mapToDataverse(
    internalData: Partial<OtaEducationInternal>,
  ): Partial<DataverseOtaEducation>;
}

/**
 * Token for dependency injection of OTA Education Repository
 */
export const OTA_EDUCATION_REPOSITORY = 'OTA_EDUCATION_REPOSITORY' as const;

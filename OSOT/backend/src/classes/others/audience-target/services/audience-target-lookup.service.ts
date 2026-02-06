/**
 * Audience Target Lookup Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with DataverseAudienceTargetRepository
 * - Structured Logging: Operation IDs, security-aware logging
 * - Security-First Design: Privilege-based access control for target records
 * - Data Transformation: Mappers for Internal ↔ Response conversions
 * - Error Management: Centralized error handling with ErrorCodes
 *
 * PERMISSION SYSTEM (Audience Target Specific):
 * - ADMIN (privilege = 2): Read access to all target records
 * - MAIN (privilege = 3): Full read access to all target records
 * - OWNER (privilege = 0): No direct access (Admin/Main-only entity)
 * - PUBLIC ACCESS: No access (Admin/Main-only entity)
 *
 * LOOKUP FEATURES:
 * - Find by target ID (business or internal ID)
 * - Find by product ID for one-to-one relationship validation
 * - List with filtering, sorting, and pagination
 * - Existence checking for uniqueness validation
 * - Count for analytics and diagnostics
 * - Product matching based on user profile (35 fields)
 *
 * Key Features:
 * - Privilege-based data filtering (Admin/Main only)
 * - Product-based queries for relationship enforcement
 * - Performance-optimized queries
 * - Operation tracking for compliance and debugging
 * - Integration with product entity via lookup field
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AudienceTargetResponseDto } from '../dtos/audience-target-response.dto';
import { ListAudienceTargetsQueryDto } from '../dtos/audience-target-list-query.dto';
import {
  DataverseAudienceTargetRepository,
  AUDIENCE_TARGET_REPOSITORY,
} from '../repositories/audience-target.repository';
import { AudienceTargetMapper } from '../mappers/audience-target.mapper';
import { Privilege } from '../../../../common/enums';

@Injectable()
export class AudienceTargetLookupService {
  private readonly logger = new Logger(AudienceTargetLookupService.name);

  constructor(
    @Inject(AUDIENCE_TARGET_REPOSITORY)
    private readonly repository: DataverseAudienceTargetRepository,
  ) {}

  /**
   * Find target record by Target ID (business ID)
   * Admin/Main privilege required
   *
   * @param targetId - Business target ID (osot_target)
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier
   * @returns Target record or null if not found/no access
   */
  async findById(
    targetId: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<AudienceTargetResponseDto | null> {
    const opId = operationId || `find-target-${Date.now()}`;
    this.logger.log(`Finding target by ID ${targetId} for operation ${opId}`);

    try {
      // Validate admin/main privilege
      if (!this.canAccessTargets(userPrivilege)) {
        this.logger.warn(
          `Access denied for target ${targetId}, privilege: ${userPrivilege}`,
        );
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      const target = await this.repository.findById(targetId);

      if (!target) {
        return null;
      }

      const response = AudienceTargetMapper.mapInternalToResponseDto(target);
      this.logger.log(
        `Successfully found target ${targetId} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('PERMISSION_DENIED')
      ) {
        throw error;
      }

      this.logger.error(
        `Error finding target by ID ${targetId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find target record by ID',
        operationId: opId,
        targetId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find target record by GUID
   * Admin/Main privilege required
   *
   * @param guid - Target GUID (osot_table_audience_targetid)
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier
   * @returns Target record or null if not found/no access
   */
  async findByGuid(
    guid: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<AudienceTargetResponseDto | null> {
    const opId = operationId || `find-target-guid-${Date.now()}`;
    this.logger.log(`Finding target by GUID ${guid} for operation ${opId}`);

    try {
      // Validate admin/main privilege
      if (!this.canAccessTargets(userPrivilege)) {
        this.logger.warn(
          `Access denied for target GUID ${guid}, privilege: ${userPrivilege}`,
        );
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      const target = await this.repository.findByGuid(guid);

      if (!target) {
        return null;
      }

      const response = AudienceTargetMapper.mapInternalToResponseDto(target);
      this.logger.log(
        `Successfully found target GUID ${guid} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('PERMISSION_DENIED')
      ) {
        throw error;
      }

      this.logger.error(
        `Error finding target by GUID ${guid} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find target record by GUID',
        operationId: opId,
        guid,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find target record by product ID
   * CRITICAL: Used to enforce one-to-one relationship between Product and Target
   * Admin/Main privilege required
   *
   * @param productId - Product GUID
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier
   * @returns Target record or null if not found/no access
   */
  async findByProductId(
    productId: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<AudienceTargetResponseDto | null> {
    const opId = operationId || `find-target-product-${Date.now()}`;
    this.logger.log(
      `Finding target by product ID ${productId} for operation ${opId}`,
    );

    try {
      // Validate admin/main privilege
      if (!this.canAccessTargets(userPrivilege)) {
        this.logger.warn(
          `Access denied for product ${productId} target lookup, privilege: ${userPrivilege}`,
        );
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      const target = await this.repository.findByProductId(productId);

      if (!target) {
        return null;
      }

      const response = AudienceTargetMapper.mapInternalToResponseDto(target);
      this.logger.log(
        `Successfully found target for product ${productId} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('PERMISSION_DENIED')
      ) {
        throw error;
      }

      this.logger.error(
        `Error finding target by product ID ${productId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find target record by product ID',
        operationId: opId,
        productId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Count targets for a specific product
   * Used for diagnostics and relationship validation
   * Admin/Main privilege required
   *
   * @param productId - Product GUID
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier
   * @returns Count of targets for product (should always be 0 or 1)
   */
  async countByProductId(
    productId: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<number> {
    const opId = operationId || `count-target-product-${Date.now()}`;
    this.logger.log(
      `Counting targets for product ID ${productId} for operation ${opId}`,
    );

    try {
      // Validate admin/main privilege
      if (!this.canAccessTargets(userPrivilege)) {
        this.logger.warn(
          `Access denied for product ${productId} target count, privilege: ${userPrivilege}`,
        );
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      const count = await this.repository.countByProductId(productId);

      this.logger.log(
        `Successfully counted ${count} target(s) for product ${productId} for operation ${opId}`,
      );

      return count;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('PERMISSION_DENIED')
      ) {
        throw error;
      }

      this.logger.error(
        `Error counting targets by product ID ${productId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to count target records by product ID',
        operationId: opId,
        productId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * List target records with filtering and pagination
   * Admin/Main privilege required
   *
   * NOTE: Repository findAll only supports basic pagination.
   * Advanced filtering is done in-memory for now.
   *
   * @param query - Query parameters for filtering and pagination
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier
   * @returns Paginated target records list
   */
  async list(
    query: ListAudienceTargetsQueryDto,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<{
    data: AudienceTargetResponseDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const opId = operationId || `list-targets-${Date.now()}`;
    this.logger.log(`Listing target records for operation ${opId}`);

    try {
      // Validate admin/main privilege
      if (!this.canAccessTargets(userPrivilege)) {
        this.logger.warn(
          `Access denied for target listing, privilege: ${userPrivilege}`,
        );
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Repository only supports basic pagination
      const skip = ((query.page || 1) - 1) * (query.pageSize || 20);
      const top = query.pageSize || 20;

      const allTargets = await this.repository.findAll({
        skip,
        top,
        orderBy: `${query.sortBy || 'createdon'} ${query.sortDirection || 'desc'}`,
      });

      // Apply additional filters in-memory
      let filteredData = allTargets;

      // Filter by product ID if provided
      if (query.productId) {
        filteredData = filteredData.filter(
          (target) => target.osot_table_product === query.productId,
        );
      }

      // Search by target ID pattern if provided
      if (query.targetIdPattern) {
        const searchLower = query.targetIdPattern.toLowerCase();
        filteredData = filteredData.filter((target) =>
          target.osot_target?.toLowerCase().includes(searchLower),
        );
      }

      // Filter by exact target ID if provided
      if (query.targetId) {
        filteredData = filteredData.filter(
          (target) => target.osot_target === query.targetId,
        );
      }

      // Transform to response DTOs
      const data = filteredData.map((target) =>
        AudienceTargetMapper.mapInternalToResponseDto(target),
      );

      const page = query.page || 1;
      const pageSize = query.pageSize || 20;

      this.logger.log(
        `Successfully listed ${data.length} target records for operation ${opId}`,
      );

      return {
        data,
        total: data.length,
        page,
        pageSize,
        totalPages: Math.ceil(data.length / pageSize),
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('PERMISSION_DENIED')
      ) {
        throw error;
      }

      this.logger.error(
        `Error listing target records for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to list target records',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if target exists by ID (business ID or GUID)
   * Admin/Main privilege required
   *
   * @param targetId - Business ID or GUID
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier
   * @returns True if exists, false otherwise
   */
  async exists(
    targetId: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `exists-target-${Date.now()}`;
    this.logger.log(
      `Checking existence for target ${targetId} for operation ${opId}`,
    );

    try {
      // Validate admin/main privilege
      if (!this.canAccessTargets(userPrivilege)) {
        this.logger.warn(
          `Access denied for target ${targetId} existence check, privilege: ${userPrivilege}`,
        );
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      const exists = await this.repository.exists(targetId);

      this.logger.log(
        `Existence check result for target ${targetId}: ${exists} for operation ${opId}`,
      );
      return exists;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('PERMISSION_DENIED')
      ) {
        throw error;
      }

      this.logger.error(
        `Error checking existence for target ${targetId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to check target existence',
        operationId: opId,
        targetId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Count total target records
   * Admin/Main privilege required
   *
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier
   * @returns Total count
   */
  async count(
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<number> {
    const opId = operationId || `count-targets-${Date.now()}`;
    this.logger.log(`Counting target records for operation ${opId}`);

    try {
      // Validate admin/main privilege
      if (!this.canAccessTargets(userPrivilege)) {
        this.logger.warn(
          `Access denied for target count, privilege: ${userPrivilege}`,
        );
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      const count = await this.repository.count();

      this.logger.log(
        `Successfully counted ${count} target records for operation ${opId}`,
      );
      return count;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('PERMISSION_DENIED')
      ) {
        throw error;
      }

      this.logger.error(
        `Error counting target records for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to count target records',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find products matching a user's profile
   * Core matching logic for dashboard product filtering
   *
   * NOTE: This delegates to repository's findMatchingProducts which performs
   * the actual matching logic against all 35 targeting fields.
   *
   * @param userData - User profile data from multiple entities
   * @param options - Pagination and filtering options
   * @param operationId - Unique operation identifier
   * @returns Array of product IDs that match the user's profile
   */
  async findMatchingProducts(
    userData: {
      accountGroup?: number;
      affiliateArea?: number[];
      affiliateCity?: number;
      affiliateProvince?: number;
      membershipCity?: number;
      province?: number;
      gender?: number;
      indigenousDetails?: number;
      language?: number[];
      race?: number;
      eligibilityAffiliate?: number;
      membershipCategory?: number;
      earnings?: number;
      earningsSelfDirect?: number;
      earningsSelfIndirect?: number;
      employmentBenefits?: number[];
      employmentStatus?: number;
      positionFunding?: number[];
      practiceYears?: number;
      roleDescription?: number[];
      workHours?: number;
      clientAge?: number[];
      practiceArea?: number[];
      practiceServices?: number[];
      practiceSettings?: number[];
      membershipSearchTools?: number[];
      practicePromotion?: number[];
      psychotherapySupervision?: number;
      thirdParties?: number[];
      cotoStatus?: number;
      otGradYear?: number;
      otUniversity?: number;
      otaGradYear?: number;
      otaCollege?: number;
    },
    options?: {
      page?: number;
      limit?: number;
      cacheKey?: string;
    },
    operationId?: string,
  ): Promise<{
    productIds: string[];
    totalCount: number;
    page: number;
    limit: number;
  }> {
    const opId = operationId || `match-products-${Date.now()}`;
    this.logger.log(`Finding matching products for operation ${opId}`);

    try {
      const result = await this.repository.findMatchingProducts(
        userData,
        options,
      );

      this.logger.log(
        `Successfully found ${result.productIds.length} matching products (total: ${result.totalCount}) for operation ${opId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error finding matching products for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find matching products',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Check if user can access target records (Admin/Main only)
   * Audience targets are Admin/Main-only entities
   */
  private canAccessTargets(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }
}

/**
 * Organization Lookup Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with OrganizationRepository
 * - Public Access: findBySlug for white-label login (no authentication)
 * - Security-First Design: Internal operations require authentication
 * - Structured Logging: Operation IDs for tracking
 * - Caching Strategy: Repository handles caching (5min single, 2min list, 10min slug)
 *
 * PERMISSION SYSTEM (Organization Lookup):
 * - PUBLIC ACCESS: findBySlug only (white-label login)
 * - AUTHENTICATED: findOne, findAll, search operations
 * - NO PRIVILEGE RESTRICTIONS: All authenticated users can read organizations
 *
 * PUBLIC API FEATURES:
 * - Organization lookup by slug (white-label login)
 * - Organization listing with pagination
 * - Search by name/legal name
 * - Filter by status
 * - Count organizations
 *
 * USE CASES:
 * - White-label login: GET /api/public/organization/:slug → branding data
 * - Admin panel: List all organizations for management
 * - User selection: Dropdown of organizations for account creation
 * - Reports: Organization statistics and counts
 *
 * @file organization-lookup.service.ts
 * @module OrganizationModule
 * @layer Services
 * @since 2026-01-07
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccountStatus } from '../../../../common/enums';
import {
  IOrganizationRepository,
  OrganizationQueryOptions,
  OrganizationInternal,
} from '../interfaces';
import { ORGANIZATION_REPOSITORY } from '../constants';
import {
  toResponseDto,
  toPublicResponseDto,
  toResponseDtoArray,
} from '../mappers';
import {
  OrganizationResponseDto,
  OrganizationPublicResponseDto,
} from '../dtos';

/**
 * Paginated organization response
 */
export interface PaginatedOrganizationResponse {
  organizations: OrganizationResponseDto[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Organization Lookup Service
 * Handles all read-only operations for organizations
 */
@Injectable()
export class OrganizationLookupService {
  private readonly logger = new Logger(OrganizationLookupService.name);

  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  // ========================================
  // FIND SINGLE
  // ========================================

  /**
   * Find organization by identifier (GUID or business ID)
   * AUTHENTICATED ACCESS: Requires valid JWT
   *
   * @param identifier - Organization GUID or business ID (osot-org-0000001)
   * @param operationId - Operation tracking ID
   * @returns Organization or null if not found
   */
  async findOne(
    identifier: string,
    operationId?: string,
  ): Promise<OrganizationResponseDto | null> {
    const opId = operationId || `lookup-organization-${Date.now()}`;

    this.logger.debug(
      `Looking up organization ${identifier} for operation ${opId}`,
    );

    try {
      // Try to resolve as GUID first
      const guidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      let organization: OrganizationInternal | null = null;

      if (guidRegex.test(identifier)) {
        // It's a GUID
        organization = await this.organizationRepository.findById(identifier);
      } else {
        // It's a business ID (osot-org-0000001)
        organization =
          await this.organizationRepository.findByOrganizationId(identifier);
      }

      if (!organization) {
        this.logger.debug(
          `Organization ${identifier} not found for operation ${opId}`,
        );
        return null;
      }

      return toResponseDto(organization);
    } catch (error) {
      this.logger.error(
        `Error looking up organization ${identifier} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to lookup organization',
        operationId: opId,
        organizationId: identifier,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find organization by slug (PUBLIC ENDPOINT - no authentication)
   * Used for white-label login: /login/{slug}
   *
   * Returns only public-safe fields (no sensitive data)
   *
   * @param slug - Organization slug (lowercase, unique)
   * @param operationId - Operation tracking ID
   * @returns Organization public data or null if not found
   */
  async findBySlug(
    slug: string,
    operationId?: string,
  ): Promise<OrganizationPublicResponseDto | null> {
    const opId = operationId || `lookup-organization-slug-${Date.now()}`;

    this.logger.debug(
      `Looking up organization by slug ${slug} for operation ${opId} (PUBLIC)`,
    );

    try {
      const organization = await this.organizationRepository.findBySlug(slug);

      if (!organization) {
        this.logger.debug(
          `Organization with slug ${slug} not found for operation ${opId}`,
        );
        return null;
      }

      // Return only public data (for white-label login)
      return toPublicResponseDto(organization);
    } catch (error) {
      this.logger.error(
        `Error looking up organization by slug ${slug} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to lookup organization by slug',
        operationId: opId,
        slug,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // FIND MULTIPLE
  // ========================================

  /**
   * Find all organizations with pagination and filtering
   * AUTHENTICATED ACCESS: Requires valid JWT
   *
   * @param options - Query options (filters, pagination, sorting)
   * @param operationId - Operation tracking ID
   * @returns Paginated organizations with metadata
   */
  async findAll(
    options?: OrganizationQueryOptions,
    operationId?: string,
  ): Promise<PaginatedOrganizationResponse> {
    const opId = operationId || `lookup-all-organizations-${Date.now()}`;

    // Pagination defaults
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const top = pageSize;

    this.logger.log(
      `Looking up organizations - Page ${page}, Size ${pageSize} - Operation: ${opId}`,
    );

    try {
      // Build repository query options
      const queryOptions: OrganizationQueryOptions = {
        ...options,
        skip,
        top,
      };

      // Fetch from repository
      const { data, total } =
        await this.organizationRepository.findAll(queryOptions);

      // Map to response DTOs
      const organizations = toResponseDtoArray(data);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / pageSize);

      return {
        organizations,
        pagination: {
          currentPage: page,
          itemsPerPage: pageSize,
          totalItems: total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error looking up organizations for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to lookup organizations',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find all ACTIVE organizations
   * Convenience method for common use case
   *
   * @param operationId - Operation tracking ID
   * @returns Array of active organizations
   */
  async findAllActive(
    operationId?: string,
  ): Promise<OrganizationResponseDto[]> {
    const opId = operationId || `lookup-active-organizations-${Date.now()}`;

    this.logger.debug(`Looking up active organizations for operation ${opId}`);

    try {
      const { data } = await this.organizationRepository.findAll({
        status: AccountStatus.ACTIVE,
      });

      return toResponseDtoArray(data);
    } catch (error) {
      this.logger.error(
        `Error looking up active organizations for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to lookup active organizations',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Search organizations by name or legal name
   * AUTHENTICATED ACCESS: Requires valid JWT
   *
   * @param searchTerm - Search term (searches organization_name and legal_name)
   * @param options - Additional query options
   * @param operationId - Operation tracking ID
   * @returns Array of matching organizations
   */
  async search(
    searchTerm: string,
    options?: Omit<OrganizationQueryOptions, 'search'>,
    operationId?: string,
  ): Promise<OrganizationResponseDto[]> {
    const opId = operationId || `search-organizations-${Date.now()}`;

    this.logger.log(
      `Searching organizations with term "${searchTerm}" for operation ${opId}`,
    );

    try {
      const queryOptions: OrganizationQueryOptions = {
        ...options,
        search: searchTerm,
      };

      const { data } = await this.organizationRepository.findAll(queryOptions);

      return toResponseDtoArray(data);
    } catch (error) {
      this.logger.error(
        `Error searching organizations for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to search organizations',
        operationId: opId,
        searchTerm,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // UTILITY / CHECKS
  // ========================================

  /**
   * Check if organization exists by identifier
   * AUTHENTICATED ACCESS: Requires valid JWT
   *
   * @param identifier - Organization GUID or business ID
   * @param operationId - Operation tracking ID
   * @returns True if exists, false otherwise
   */
  async exists(identifier: string, operationId?: string): Promise<boolean> {
    const opId = operationId || `check-organization-exists-${Date.now()}`;

    this.logger.debug(
      `Checking if organization ${identifier} exists for operation ${opId}`,
    );

    try {
      const organization = await this.findOne(identifier, opId);
      return organization !== null;
    } catch (error) {
      this.logger.error(
        `Error checking organization existence for operation ${opId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Check if slug is available (not in use)
   * Used during organization creation validation
   *
   * @param slug - Slug to check
   * @param excludeId - Optional organization ID to exclude (for updates)
   * @param operationId - Operation tracking ID
   * @returns True if available, false if taken
   */
  async isSlugAvailable(
    slug: string,
    excludeId?: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `check-slug-available-${Date.now()}`;

    this.logger.debug(
      `Checking if slug ${slug} is available for operation ${opId}`,
    );

    try {
      return await this.organizationRepository.isSlugUnique(slug, excludeId);
    } catch (error) {
      this.logger.error(
        `Error checking slug availability for operation ${opId}:`,
        error,
      );
      return false; // Assume not available on error (safe default)
    }
  }

  /**
   * Count organizations by status
   * AUTHENTICATED ACCESS: Requires valid JWT
   *
   * @param status - Optional status filter (ACTIVE, INACTIVE, PENDING)
   * @param operationId - Operation tracking ID
   * @returns Total count
   */
  async count(status?: AccountStatus, operationId?: string): Promise<number> {
    const opId = operationId || `count-organizations-${Date.now()}`;

    this.logger.debug(
      `Counting organizations${status ? ` with status ${status}` : ''} for operation ${opId}`,
    );

    try {
      const options: OrganizationQueryOptions = status ? { status } : {};
      return await this.organizationRepository.count(options);
    } catch (error) {
      this.logger.error(
        `Error counting organizations for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to count organizations',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get organization statistics
   * AUTHENTICATED ACCESS: Requires valid JWT
   *
   * @param operationId - Operation tracking ID
   * @returns Statistics object
   */
  async getStatistics(operationId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
  }> {
    const opId = operationId || `organization-statistics-${Date.now()}`;

    this.logger.debug(`Getting organization statistics for operation ${opId}`);

    try {
      const [total, active, inactive, pending] = await Promise.all([
        this.count(undefined, opId),
        this.count(AccountStatus.ACTIVE, opId),
        this.count(AccountStatus.INACTIVE, opId),
        this.count(AccountStatus.PENDING, opId),
      ]);

      return { total, active, inactive, pending };
    } catch (error) {
      this.logger.error(
        `Error getting organization statistics for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get organization statistics',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

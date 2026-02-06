/**
 * Membership Practices Lookup Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with DataverseMembershipPracticesRepository
 * - Structured Logging: Operation IDs, security-aware logging
 * - Security-First Design: Privilege-based access control for practice records
 * - Data Transformation: Mappers for Internal ↔ Response conversions
 * - Error Management: Centralized error handling with ErrorCodes
 *
 * PERMISSION SYSTEM (Membership Practices Specific):
 * - OWNER (privilege = 0): Read access to own practice records only
 * - ADMIN (privilege = 2): Read access to all practice records in their organization
 * - MAIN (privilege = 3): Full read access to all practice records
 * - PUBLIC ACCESS: No direct access (must authenticate)
 *
 * LOOKUP FEATURES:
 * - Find by practice ID (business or internal ID)
 * - Find by user and year for current practice lookup
 * - Find by clients age for demographics queries
 * - List with filtering, sorting, and pagination
 * - Existence checking for uniqueness validation
 * - Account-based lookup for user practice records
 *
 * Key Features:
 * - Privilege-based data filtering
 * - Year and clients age-based lookup
 * - User-year uniqueness validation
 * - Performance-optimized queries
 * - Operation tracking for compliance and debugging
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { ResponseMembershipPracticesDto } from '../dtos/membership-practices-response.dto';
import { ListMembershipPracticesQueryDto } from '../dtos/list-membership-practices.query.dto';
import {
  DataverseMembershipPracticesRepository,
  MEMBERSHIP_PRACTICES_REPOSITORY,
} from '../repositories/membership-practices.repository';
import { MembershipPracticesMapper } from '../mappers/membership-practices.mapper';
import { Privilege } from '../../../../common/enums';
import { ClientsAge } from '../enums/clients-age.enum';

@Injectable()
export class MembershipPracticesLookupService {
  private readonly logger = new Logger(MembershipPracticesLookupService.name);

  constructor(
    @Inject(MEMBERSHIP_PRACTICES_REPOSITORY)
    private readonly repository: DataverseMembershipPracticesRepository,
  ) {}

  /**
   * Find practice record by Practice ID (business ID)
   * Privilege-based access control applied
   *
   * @param practiceId - Business practice ID (osot_practice_id)
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership validation
   * @param operationId - Unique operation identifier
   * @returns Practice record or null if not found/no access
   */
  async findByPracticeId(
    practiceId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipPracticesDto | null> {
    const opId = operationId || `find-pra-${Date.now()}`;
    this.logger.log(
      `Finding practice by ID ${practiceId} for operation ${opId}`,
    );

    try {
      const practice = await this.repository.findByPracticeId(practiceId);

      if (!practice) {
        return null;
      }

      // Check access based on privilege and ownership
      if (!this.canAccessPractice(practice, userPrivilege, userId)) {
        this.logger.warn(
          `Access denied for practice ${practiceId}, privilege: ${userPrivilege}, userId: ${userId}`,
        );
        return null;
      }

      const response =
        MembershipPracticesMapper.mapInternalToResponseDto(practice);
      this.logger.log(
        `Successfully found practice ${practiceId} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding practice ${practiceId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find practice record',
        operationId: opId,
        practiceId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find practice record by internal ID
   * Privilege-based access control applied
   *
   * @param id - Internal GUID
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership validation
   * @param operationId - Unique operation identifier
   * @returns Practice record or null if not found/no access
   */
  async findById(
    id: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipPracticesDto | null> {
    const opId = operationId || `find-id-${Date.now()}`;
    this.logger.log(`Finding practice by GUID ${id} for operation ${opId}`);

    try {
      const practice = await this.repository.findById(id);

      if (!practice) {
        return null;
      }

      // Check access based on privilege and ownership
      if (!this.canAccessPractice(practice, userPrivilege, userId)) {
        this.logger.warn(
          `Access denied for practice ${id}, privilege: ${userPrivilege}, userId: ${userId}`,
        );
        return null;
      }

      const response =
        MembershipPracticesMapper.mapInternalToResponseDto(practice);
      this.logger.log(
        `Successfully found practice by GUID ${id} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding practice by GUID ${id} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find practice record by ID',
        operationId: opId,
        id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find practice record by user and year
   * Returns the user's practice record for a specific membership year
   *
   * @param userId - Account GUID
   * @param year - Membership year
   * @param userPrivilege - User's privilege level
   * @param requestingUserId - ID of user making request (for ownership check)
   * @param operationId - Unique operation identifier
   * @returns Practice record or null if not found/no access
   */
  async findByUserAndYear(
    userId: string,
    year: string,
    userPrivilege?: Privilege,
    requestingUserId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipPracticesDto | null> {
    const opId = operationId || `find-user-year-${Date.now()}`;

    try {
      const practice = await this.repository.findByUserAndYear(userId, year);

      if (!practice) {
        return null;
      }

      // Check access based on privilege and ownership
      // When requesting user is the same as the practice owner, always allow
      const isOwnPractice = requestingUserId === userId;
      if (
        !isOwnPractice &&
        !this.canAccessPractice(practice, userPrivilege, requestingUserId)
      ) {
        this.logger.warn(
          `Access denied for account ${userId} practice, year ${year}`,
        );
        return null;
      }

      // Use self-service DTO for /me routes (minimal fields)
      // Admin routes will use mapInternalToResponseDto for full data
      const response =
        MembershipPracticesMapper.mapInternalToSelfServiceDto(practice);
      this.logger.log(
        `Successfully found practice for account ${userId}, year ${year} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding practice for account ${userId}, year ${year} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find practice record by user and year',
        operationId: opId,
        userId,
        year,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get practice records by year
   * Filtered by privilege level
   *
   * @param year - Membership year
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Array of practice records
   */
  async getByYear(
    year: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipPracticesDto[]> {
    const opId = operationId || `year-pras-${Date.now()}`;
    this.logger.log(
      `Getting practice records for year ${year} for operation ${opId}`,
    );

    try {
      const practices = await this.repository.findByYear(year);

      // Filter based on access privileges
      const filteredPractices = practices.filter((pra) =>
        this.canAccessPractice(pra, userPrivilege, userId),
      );

      const response = filteredPractices.map((pra) =>
        MembershipPracticesMapper.mapInternalToResponseDto(pra),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} practice records for year ${year} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting practice records for year ${year} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get practice records by year',
        operationId: opId,
        year,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get practice records by account
   * Filtered by privilege level
   *
   * @param accountId - Account GUID
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Array of practice records
   */
  async getByAccount(
    accountId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipPracticesDto[]> {
    const opId = operationId || `account-pras-${Date.now()}`;
    this.logger.log(
      `Getting practice records for account ${accountId} for operation ${opId}`,
    );

    try {
      const practices = await this.repository.findByAccountId(accountId);

      // Filter based on access privileges
      const filteredPractices = practices.filter((pra) =>
        this.canAccessPractice(pra, userPrivilege, userId),
      );

      const response = filteredPractices.map((pra) =>
        MembershipPracticesMapper.mapInternalToResponseDto(pra),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} practice records for account ${accountId} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting practice records for account ${accountId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get practice records by account',
        operationId: opId,
        accountId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get practice records by clients age
   * Used for demographics and clients age-based filtering
   *
   * @param clientsAge - Clients age enum value
   * @param userPrivilege - User's privilege level (Admin/Main only)
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Array of practice records
   */
  async getByClientsAge(
    clientsAge: ClientsAge,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipPracticesDto[]> {
    const opId = operationId || `clients-age-pras-${Date.now()}`;
    this.logger.log(
      `Getting practice records with clients age ${clientsAge} for operation ${opId}`,
    );

    try {
      // Only Admin and Main can query by clients age
      if (!this.canAccessAllPractices(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      const practices = await this.repository.findByClientsAge(clientsAge);

      const response = practices.map((pra) =>
        MembershipPracticesMapper.mapInternalToResponseDto(pra),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} practice records with clients age ${clientsAge} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting practice records by clients age for operation ${opId}:`,
        error,
      );

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get practice records by clients age',
        operationId: opId,
        clientsAge,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * List practice records with filtering and pagination
   * Privilege-based filtering applied
   *
   * NOTE: Repository findAll only supports basic pagination.
   * Advanced filtering is done in-memory for now.
   *
   * @param query - Query parameters for filtering and pagination
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Paginated practice records list
   */
  async list(
    query: ListMembershipPracticesQueryDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<{
    data: ResponseMembershipPracticesDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const opId = operationId || `list-pras-${Date.now()}`;
    this.logger.log(`Listing practice records for operation ${opId}`);

    try {
      // Repository only supports basic pagination
      const skip = query.skip || 0;
      const top = query.top || 20;

      // Build orderBy string from orderBy and sortDirection
      const orderByField = query.orderBy || 'modifiedon';
      const sortDirection = query.sortDirection || 'desc';
      const orderBy = `${orderByField} ${sortDirection}`;

      const allPractices = await this.repository.findAll({
        skip,
        top,
        orderBy,
      });

      // Apply privilege-based filtering
      let filteredData = allPractices.filter((pra) =>
        this.canAccessPractice(pra, userPrivilege, userId),
      );

      // Apply additional filters in-memory
      if (query.membershipYear) {
        const yearString = query.membershipYear.toString();
        filteredData = filteredData.filter(
          (pra) => pra.osot_membership_year === yearString,
        );
      }

      if (query.accountId) {
        filteredData = filteredData.filter(
          (pra) => pra.osot_table_account === query.accountId,
        );
      }

      if (query.clientsAge !== undefined) {
        const clientsAgeValue = query.clientsAge;
        filteredData = filteredData.filter((pra) =>
          pra.osot_clients_age?.includes(clientsAgeValue),
        );
      }

      if (query.practiceArea !== undefined) {
        filteredData = filteredData.filter((pra) =>
          pra.osot_practice_area?.includes(query.practiceArea as number),
        );
      }

      // Transform to response DTOs
      const data = filteredData.map((pra) =>
        MembershipPracticesMapper.mapInternalToResponseDto(pra),
      );

      this.logger.log(
        `Successfully listed ${data.length} practice records for operation ${opId}`,
      );

      return {
        data,
        total: data.length,
        page: Math.floor(skip / top) + 1,
        pageSize: top,
        totalPages: Math.ceil(data.length / top),
      };
    } catch (error) {
      this.logger.error(
        `Error listing practice records for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to list practice records',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if user-year combination exists (for uniqueness validation)
   *
   * @param userId - Account GUID
   * @param year - Membership year
   * @param operationId - Unique operation identifier
   * @returns True if exists, false otherwise
   */
  async existsByUserAndYear(
    userId: string,
    year: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `exists-check-${Date.now()}`;
    this.logger.log(
      `Checking existence for account ${userId}, year ${year} for operation ${opId}`,
    );

    try {
      const exists = await this.repository.existsByUserAndYear(userId, year);

      this.logger.log(
        `Existence check result for account ${userId}, year ${year}: ${exists} for operation ${opId}`,
      );
      return exists;
    } catch (error) {
      this.logger.error(
        `Error checking existence for account ${userId}, year ${year} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to check user-year existence',
        operationId: opId,
        userId,
        year,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Count total practice records
   * NOTE: Repository count doesn't support filters currently.
   * This returns total count only.
   *
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Total count
   */
  async count(
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<number> {
    const opId = operationId || `count-pras-${Date.now()}`;
    this.logger.log(`Counting practice records for operation ${opId}`);

    try {
      const count = await this.repository.count();

      this.logger.log(
        `Successfully counted ${count} practice records for operation ${opId}`,
      );
      return count;
    } catch (error) {
      this.logger.error(
        `Error counting practice records for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to count practice records',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Check if user can access specific practice record based on privilege and ownership
   */
  private canAccessPractice(
    practice: unknown,
    userPrivilege?: Privilege,
    userId?: string,
  ): boolean {
    // Admin and Main can access all practice records
    if (this.canAccessAllPractices(userPrivilege)) {
      return true;
    }

    // Owner can only access their own practice records
    if (userPrivilege === Privilege.OWNER && userId) {
      const pra = practice as {
        osot_table_account?: string;
      };
      return pra.osot_table_account === userId;
    }

    // No access for other cases
    return false;
  }

  /**
   * Check if user can access all practice records (Admin/Main only)
   */
  private canAccessAllPractices(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }
}

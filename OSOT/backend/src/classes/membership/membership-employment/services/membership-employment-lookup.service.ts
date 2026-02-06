/**
 * Membership Employment Lookup Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with DataverseMembershipEmploymentRepository
 * - Structured Logging: Operation IDs, security-aware logging
 * - Security-First Design: Privilege-based access control for employment records
 * - Data Transformation: Mappers for Internal ↔ Response conversions
 * - Error Management: Centralized error handling with ErrorCodes
 *
 * PERMISSION SYSTEM (Membership Employment Specific):
 * - OWNER (privilege = 0): Read access to own employment records only
 * - ADMIN (privilege = 2): Read access to all employment records in their organization
 * - MAIN (privilege = 3): Full read access to all employment records
 * - PUBLIC ACCESS: No direct access (must authenticate)
 *
 * LOOKUP FEATURES:
 * - Find by employment ID (business or internal ID)
 * - Find by user and year for current employment lookup
 * - Find by employment status for status-specific queries
 * - List with filtering, sorting, and pagination
 * - Existence checking for uniqueness validation
 * - Multi-user lookup for account and affiliate records
 *
 * Key Features:
 * - Privilege-based data filtering
 * - Year and status-based lookup
 * - Employment status queries for analytics
 * - User-year uniqueness validation
 * - Performance-optimized queries
 * - Operation tracking for compliance and debugging
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { ResponseMembershipEmploymentDto } from '../dtos/membership-employment-response.dto';
import { ListMembershipEmploymentsQueryDto } from '../dtos/list-membership-employments.query.dto';
import {
  DataverseMembershipEmploymentRepository,
  MEMBERSHIP_EMPLOYMENT_REPOSITORY,
} from '../repositories/membership-employment.repository';
import { MembershipEmploymentMapper } from '../mappers/membership-employment.mapper';
import { Privilege } from '../../../../common/enums';
import { EmploymentStatus } from '../enums/employment-status.enum';

@Injectable()
export class MembershipEmploymentLookupService {
  private readonly logger = new Logger(MembershipEmploymentLookupService.name);

  constructor(
    @Inject(MEMBERSHIP_EMPLOYMENT_REPOSITORY)
    private readonly repository: DataverseMembershipEmploymentRepository,
  ) {}

  /**
   * Find employment record by Employment ID (business ID)
   * Privilege-based access control applied
   *
   * @param employmentId - Business employment ID (osot_employment_id)
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership validation
   * @param operationId - Unique operation identifier
   * @returns Employment record or null if not found/no access
   */
  async findByEmploymentId(
    employmentId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipEmploymentDto | null> {
    const opId = operationId || `find-emp-${Date.now()}`;
    this.logger.log(
      `Finding employment by ID ${employmentId} for operation ${opId}`,
    );

    try {
      const employment = await this.repository.findByEmploymentId(employmentId);

      if (!employment) {
        return null;
      }

      // Check access based on privilege and ownership
      if (!this.canAccessEmployment(employment, userPrivilege, userId)) {
        this.logger.warn(
          `Access denied for employment ${employmentId}, privilege: ${userPrivilege}, userId: ${userId}`,
        );
        return null;
      }

      const response =
        MembershipEmploymentMapper.mapInternalToResponseDto(employment);
      this.logger.log(
        `Successfully found employment ${employmentId} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding employment ${employmentId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find employment record',
        operationId: opId,
        employmentId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find employment record by internal ID
   * Privilege-based access control applied
   *
   * @param id - Internal GUID
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership validation
   * @param operationId - Unique operation identifier
   * @returns Employment record or null if not found/no access
   */
  async findById(
    id: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipEmploymentDto | null> {
    const opId = operationId || `find-id-${Date.now()}`;
    this.logger.log(`Finding employment by GUID ${id} for operation ${opId}`);

    try {
      const employment = await this.repository.findById(id);

      if (!employment) {
        return null;
      }

      // Check access based on privilege and ownership
      if (!this.canAccessEmployment(employment, userPrivilege, userId)) {
        this.logger.warn(
          `Access denied for employment ${id}, privilege: ${userPrivilege}, userId: ${userId}`,
        );
        return null;
      }

      const response =
        MembershipEmploymentMapper.mapInternalToResponseDto(employment);
      this.logger.log(
        `Successfully found employment by GUID ${id} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding employment by GUID ${id} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find employment record by ID',
        operationId: opId,
        id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find employment record by user and year
   * Returns the user's employment record for a specific membership year
   *
   * @param userId - Account or Affiliate GUID
   * @param year - Membership year
   * @param userType - 'account' or 'affiliate'
   * @param userPrivilege - User's privilege level
   * @param requestingUserId - ID of user making request (for ownership check)
   * @param operationId - Unique operation identifier
   * @returns Employment record or null if not found/no access
   */
  async findByUserAndYear(
    userId: string,
    year: string,
    userType: 'account' | 'affiliate',
    userPrivilege?: Privilege,
    requestingUserId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipEmploymentDto | null> {
    const opId = operationId || `find-user-year-${Date.now()}`;

    try {
      const employment = await this.repository.findByUserAndYear(
        userId,
        year,
        userType,
      );

      if (!employment) {
        return null;
      }

      // Check access based on privilege and ownership
      // When requesting user is the same as the employment owner, always allow
      const isOwnEmployment = requestingUserId === userId;
      if (
        !isOwnEmployment &&
        !this.canAccessEmployment(employment, userPrivilege, requestingUserId)
      ) {
        this.logger.warn(
          `Access denied for ${userType} ${userId} employment, year ${year}`,
        );
        return null;
      }

      // Use self-service DTO for /me routes (minimal fields)
      // Admin routes will use mapInternalToResponseDto for full data
      const response = MembershipEmploymentMapper.mapInternalToSelfServiceDto(
        employment,
      ) as ResponseMembershipEmploymentDto;
      this.logger.log(
        `Successfully found employment for ${userType} ${userId}, year ${year} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding employment for ${userType} ${userId}, year ${year} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find employment record by user and year',
        operationId: opId,
        userId,
        year,
        userType,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get employment records by year
   * Filtered by privilege level
   *
   * @param year - Membership year
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Array of employment records
   */
  async getByYear(
    year: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipEmploymentDto[]> {
    const opId = operationId || `year-emps-${Date.now()}`;
    this.logger.log(
      `Getting employment records for year ${year} for operation ${opId}`,
    );

    try {
      const employments = await this.repository.findByYear(year);

      // Filter based on access privileges
      const filteredEmployments = employments.filter((emp) =>
        this.canAccessEmployment(emp, userPrivilege, userId),
      );

      const response = filteredEmployments.map((emp) =>
        MembershipEmploymentMapper.mapInternalToResponseDto(emp),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} employment records for year ${year} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting employment records for year ${year} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get employment records by year',
        operationId: opId,
        year,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get employment records by account
   * Filtered by privilege level
   *
   * @param accountId - Account GUID
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Array of employment records
   */
  async getByAccount(
    accountId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipEmploymentDto[]> {
    const opId = operationId || `account-emps-${Date.now()}`;
    this.logger.log(
      `Getting employment records for account ${accountId} for operation ${opId}`,
    );

    try {
      const employments = await this.repository.findByAccountId(accountId);

      // Filter based on access privileges
      const filteredEmployments = employments.filter((emp) =>
        this.canAccessEmployment(emp, userPrivilege, userId),
      );

      const response = filteredEmployments.map((emp) =>
        MembershipEmploymentMapper.mapInternalToResponseDto(emp),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} employment records for account ${accountId} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting employment records for account ${accountId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get employment records by account',
        operationId: opId,
        accountId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get employment records by affiliate
   * Filtered by privilege level
   *
   * @param affiliateId - Affiliate GUID
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Array of employment records
   */
  async getByAffiliate(
    affiliateId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipEmploymentDto[]> {
    const opId = operationId || `affiliate-emps-${Date.now()}`;
    this.logger.log(
      `Getting employment records for affiliate ${affiliateId} for operation ${opId}`,
    );

    try {
      const employments = await this.repository.findByAffiliateId(affiliateId);

      // Filter based on access privileges
      const filteredEmployments = employments.filter((emp) =>
        this.canAccessEmployment(emp, userPrivilege, userId),
      );

      const response = filteredEmployments.map((emp) =>
        MembershipEmploymentMapper.mapInternalToResponseDto(emp),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} employment records for affiliate ${affiliateId} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting employment records for affiliate ${affiliateId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get employment records by affiliate',
        operationId: opId,
        affiliateId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get employment records by employment status
   * Used for analytics and status-based filtering
   *
   * @param status - Employment status
   * @param userPrivilege - User's privilege level (Admin/Main only)
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Array of employment records
   */
  async getByEmploymentStatus(
    status: EmploymentStatus,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipEmploymentDto[]> {
    const opId = operationId || `status-emps-${Date.now()}`;
    this.logger.log(
      `Getting employment records with status ${status} for operation ${opId}`,
    );

    try {
      // Only Admin and Main can query by employment status
      if (!this.canAccessAllEmployments(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      const employments = await this.repository.findByEmploymentStatus(status);

      const response = employments.map((emp) =>
        MembershipEmploymentMapper.mapInternalToResponseDto(emp),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} employment records with status ${status} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting employment records by status for operation ${opId}:`,
        error,
      );

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get employment records by status',
        operationId: opId,
        status,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * List employment records with filtering and pagination
   * Privilege-based filtering applied
   *
   * NOTE: Repository findAll only supports basic pagination.
   * Advanced filtering is done in-memory for now.
   *
   * @param query - Query parameters for filtering and pagination
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Paginated employment records list
   */
  async list(
    query: ListMembershipEmploymentsQueryDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<{
    data: ResponseMembershipEmploymentDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const opId = operationId || `list-emps-${Date.now()}`;
    this.logger.log(`Listing employment records for operation ${opId}`);

    try {
      // Repository only supports basic pagination
      const skip = ((query.page || 1) - 1) * (query.pageSize || 10);
      const top = query.pageSize || 10;

      const allEmployments = await this.repository.findAll({
        skip,
        top,
        orderBy: query.sortBy || 'createdOn desc',
      });

      // Apply privilege-based filtering
      let filteredData = allEmployments.filter((emp) =>
        this.canAccessEmployment(emp, userPrivilege, userId),
      );

      // Apply additional filters in-memory
      if (query.membershipYear) {
        const yearString = query.membershipYear.toString();
        filteredData = filteredData.filter(
          (emp) => emp.osot_membership_year === yearString,
        );
      }

      if (query.accountId) {
        filteredData = filteredData.filter(
          (emp) => emp.osot_table_account === query.accountId,
        );
      }

      if (query.affiliateId) {
        filteredData = filteredData.filter(
          (emp) => emp.osot_table_account_affiliate === query.affiliateId,
        );
      }

      if (query.employmentStatus !== undefined) {
        filteredData = filteredData.filter(
          (emp) => emp.osot_employment_status === query.employmentStatus,
        );
      }

      // Transform to response DTOs
      const data = filteredData.map((emp) =>
        MembershipEmploymentMapper.mapInternalToResponseDto(emp),
      );

      const page = query.page || 1;
      const pageSize = query.pageSize || 10;

      this.logger.log(
        `Successfully listed ${data.length} employment records for operation ${opId}`,
      );

      return {
        data,
        total: data.length,
        page,
        pageSize,
        totalPages: Math.ceil(data.length / pageSize),
      };
    } catch (error) {
      this.logger.error(
        `Error listing employment records for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to list employment records',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if user-year combination exists (for uniqueness validation)
   *
   * @param userId - Account or Affiliate GUID
   * @param year - Membership year
   * @param userType - 'account' or 'affiliate'
   * @param operationId - Unique operation identifier
   * @returns True if exists, false otherwise
   */
  async existsByUserAndYear(
    userId: string,
    year: string,
    userType: 'account' | 'affiliate',
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `exists-check-${Date.now()}`;
    this.logger.log(
      `Checking existence for ${userType} ${userId}, year ${year} for operation ${opId}`,
    );

    try {
      const exists = await this.repository.existsByUserAndYear(
        userId,
        year,
        userType,
      );

      this.logger.log(
        `Existence check result for ${userType} ${userId}, year ${year}: ${exists} for operation ${opId}`,
      );
      return exists;
    } catch (error) {
      this.logger.error(
        `Error checking existence for ${userType} ${userId}, year ${year} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to check user-year existence',
        operationId: opId,
        userId,
        year,
        userType,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Count total employment records
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
    const opId = operationId || `count-emps-${Date.now()}`;
    this.logger.log(`Counting employment records for operation ${opId}`);

    try {
      const count = await this.repository.count();

      this.logger.log(
        `Successfully counted ${count} employment records for operation ${opId}`,
      );
      return count;
    } catch (error) {
      this.logger.error(
        `Error counting employment records for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to count employment records',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Check if user can access specific employment record based on privilege and ownership
   */
  private canAccessEmployment(
    employment: unknown,
    userPrivilege?: Privilege,
    userId?: string,
  ): boolean {
    // Admin and Main can access all employment records
    if (this.canAccessAllEmployments(userPrivilege)) {
      return true;
    }

    // Owner can only access their own employment records
    if (userPrivilege === Privilege.OWNER && userId) {
      const emp = employment as {
        osot_table_account?: string;
        osot_table_account_affiliate?: string;
      };
      return (
        emp.osot_table_account === userId ||
        emp.osot_table_account_affiliate === userId
      );
    }

    // No access for other cases
    return false;
  }

  /**
   * Check if user can access all employment records (Admin/Main only)
   */
  private canAccessAllEmployments(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }
}

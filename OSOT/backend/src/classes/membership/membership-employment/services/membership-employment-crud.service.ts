/**
 * Membership Employment CRUD Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with DataverseMembershipEmploymentRepository
 * - Event-Driven Architecture: Emits domain events for all CUD operations
 * - Structured Logging: Operation IDs, security-aware logging
 * - Security-First Design: Privilege-based access control
 * - Data Transformation: Mappers for DTO ↔ Internal conversions
 * - Error Management: Centralized error handling with ErrorCodes
 *
 * PERMISSION SYSTEM (Membership Employment Specific):
 * - OWNER (privilege = 0): Can manage their own employment records
 * - ADMIN (privilege = 2): Can manage employment for their organization
 * - MAIN (privilege = 3): Full access to all employment records
 * - PUBLIC ACCESS: No direct CRUD access
 *
 * BUSINESS RULES ENFORCED:
 * - User-Year Uniqueness: One employment record per user per year
 * - XOR Validation: Account OR Affiliate (never both or neither)
 * - User Reference Required: At least one user reference (account or affiliate)
 * - Conditional "_Other" Fields: Required when corresponding enum contains OTHER value
 * - Membership Year Immutability: Cannot be changed after creation
 *
 * KEY FEATURES:
 * - Hard delete (no soft delete)
 * - User-year uniqueness validation
 * - Employment status change tracking
 * - Operation tracking for compliance and debugging
 * - Comprehensive event emission for audit trails
 * - Integration with membership-settings for year validation
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateMembershipEmploymentDto } from '../dtos/membership-employment-create.dto';
import { UpdateMembershipEmploymentDto } from '../dtos/membership-employment-update.dto';
import { ResponseMembershipEmploymentDto } from '../dtos/membership-employment-response.dto';
import {
  DataverseMembershipEmploymentRepository,
  MEMBERSHIP_EMPLOYMENT_REPOSITORY,
} from '../repositories/membership-employment.repository';
import { MembershipEmploymentMapper } from '../mappers/membership-employment.mapper';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege, AccessModifier } from '../../../../common/enums';

@Injectable()
export class MembershipEmploymentCrudService {
  private readonly logger = new Logger(MembershipEmploymentCrudService.name);

  constructor(
    @Inject(MEMBERSHIP_EMPLOYMENT_REPOSITORY)
    private readonly repository: DataverseMembershipEmploymentRepository,
  ) {}

  /**
   * Create new employment record
   *
   * @param dto - Employment creation data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier for tracking
   * @returns Created employment record
   */
  async create(
    dto: CreateMembershipEmploymentDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipEmploymentDto> {
    const opId = operationId || `create-emp-${Date.now()}`;
    this.logger.log(`Creating employment record for operation ${opId}`);

    try {
      // Privilege validation
      if (!this.canCreateEmployment(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Insufficient privileges: Owner, Admin, or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Owner/Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Transform DTO to internal format
      const internal = MembershipEmploymentMapper.mapCreateDtoToInternal(dto);

      // Determine user type (account or affiliate)
      const isAffiliate = !!internal.osot_table_account_affiliate;
      const userIdForValidation =
        internal.osot_table_account || internal.osot_table_account_affiliate;

      if (!userIdForValidation) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Either account or affiliate must be provided',
          operationId: opId,
        });
      }

      // Validate membership year is provided
      if (!internal.osot_membership_year) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Membership year is required',
          operationId: opId,
        });
      }

      // Validate user-year uniqueness
      const exists = await this.repository.existsByUserAndYear(
        userIdForValidation,
        internal.osot_membership_year,
        isAffiliate ? 'affiliate' : 'account',
      );

      if (exists) {
        throw createAppError(ErrorCodes.ACCOUNT_DUPLICATE, {
          message: `User already has an employment record for year ${internal.osot_membership_year}`,
          operationId: opId,
          membershipYear: internal.osot_membership_year,
          userId: userIdForValidation,
        });
      }

      // Apply default privilege if not set
      internal.osot_privilege = internal.osot_privilege || Privilege.OWNER;
      internal.osot_access_modifiers =
        internal.osot_access_modifiers || AccessModifier.PRIVATE;

      // Create in repository
      const created = await this.repository.create(internal);

      // Transform to response DTO
      const response =
        MembershipEmploymentMapper.mapInternalToResponseDto(created);

      this.logger.log(
        `Successfully created employment ${created.osot_employment_id} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to create employment record', {
        operationId: opId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to create employment record',
        operationId: opId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Update existing employment record
   *
   * @param employmentId - Business employment ID (osot_employment_id)
   * @param dto - Update data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns Updated employment record
   */
  async update(
    employmentId: string,
    dto: UpdateMembershipEmploymentDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipEmploymentDto> {
    const opId = operationId || `update-emp-${Date.now()}`;
    this.logger.log(
      `Updating employment ${employmentId} for operation ${opId}`,
    );

    try {
      // Privilege validation
      if (!this.canUpdateEmployment(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Insufficient privileges: Owner, Admin, or Main privilege required',
          operationId: opId,
          employmentId,
          requiredPrivilege: 'Owner/Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Check if record exists
      const existing = await this.repository.findByEmploymentId(employmentId);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Employment record not found: ${employmentId}`,
          operationId: opId,
          employmentId,
        });
      }

      // Note: Membership year cannot be changed after creation (immutable)
      // System fields (year, account/affiliate) remain immutable after creation

      // Transform DTO to internal format
      const updateData = MembershipEmploymentMapper.mapUpdateDtoToInternal(dto);

      // Update in repository
      const updated = await this.repository.update(employmentId, updateData);

      // Transform to response DTO
      const response =
        MembershipEmploymentMapper.mapInternalToResponseDto(updated);

      this.logger.log(
        `Successfully updated employment ${employmentId} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to update employment record', {
        operationId: opId,
        employmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to update employment record',
        operationId: opId,
        employmentId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Delete employment record (hard delete)
   *
   * @param employmentId - Business employment ID
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns True if deleted
   */
  async delete(
    employmentId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `delete-emp-${Date.now()}`;
    this.logger.log(
      `Deleting employment ${employmentId} for operation ${opId}`,
    );

    try {
      // Privilege validation - Only Admin or Main can delete
      if (!this.canDeleteEmployment(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Insufficient privileges: Admin or Main privilege required for deletion',
          operationId: opId,
          employmentId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Get employment data before deletion (for event)
      const existing = await this.repository.findByEmploymentId(employmentId);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Employment record not found: ${employmentId}`,
          operationId: opId,
          employmentId,
        });
      }

      // Hard delete
      await this.repository.delete(employmentId);

      this.logger.log(
        `Successfully deleted employment ${employmentId} for operation ${opId}`,
      );

      return true;
    } catch (error) {
      this.logger.error('Failed to delete employment record', {
        operationId: opId,
        employmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to delete employment record',
        operationId: opId,
        employmentId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Check if user can create employment records
   * Owner, Admin, and Main can create
   */
  private canCreateEmployment(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.OWNER ||
      userPrivilege === Privilege.ADMIN ||
      userPrivilege === Privilege.MAIN
    );
  }

  /**
   * Check if user can update employment records
   * Owner, Admin, and Main can update
   */
  private canUpdateEmployment(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.OWNER ||
      userPrivilege === Privilege.ADMIN ||
      userPrivilege === Privilege.MAIN
    );
  }

  /**
   * Check if user can delete employment records
   * Only Admin and Main can delete (more restrictive)
   */
  private canDeleteEmployment(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }
}

/**
 * Membership Practices CRUD Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with DataverseMembershipPracticesRepository
 * - Event-Driven Architecture: Emits domain events for all CUD operations
 * - Structured Logging: Operation IDs, security-aware logging
 * - Security-First Design: Privilege-based access control
 * - Data Transformation: Mappers for DTO ↔ Internal conversions
 * - Error Management: Centralized error handling with ErrorCodes
 *
 * PERMISSION SYSTEM (Membership Practices Specific):
 * - OWNER (privilege = 0): Can manage their own practice records
 * - ADMIN (privilege = 2): Can manage practices for their organization
 * - MAIN (privilege = 3): Full access to all practice records
 * - PUBLIC ACCESS: No direct CRUD access
 *
 * BUSINESS RULES ENFORCED:
 * - User-Year Uniqueness: One practice record per user per year
 * - Clients Age Required: Must have at least one value (business required)
 * - Conditional "_Other" Fields: Required when corresponding enum contains OTHER value
 * - Membership Year Immutability: Cannot be changed after creation
 * - Optional Account Lookup: No required user reference (unlike employment)
 *
 * KEY FEATURES:
 * - Hard delete (no soft delete)
 * - User-year uniqueness validation
 * - Operation tracking for compliance and debugging
 * - Comprehensive event emission for audit trails
 * - Integration with membership-settings for year validation
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateMembershipPracticesDto } from '../dtos/membership-practices-create.dto';
import { UpdateMembershipPracticesDto } from '../dtos/membership-practices-update.dto';
import { ResponseMembershipPracticesDto } from '../dtos/membership-practices-response.dto';
import {
  DataverseMembershipPracticesRepository,
  MEMBERSHIP_PRACTICES_REPOSITORY,
} from '../repositories/membership-practices.repository';
import { MembershipPracticesMapper } from '../mappers/membership-practices.mapper';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege, AccessModifier } from '../../../../common/enums';

@Injectable()
export class MembershipPracticesCrudService {
  private readonly logger = new Logger(MembershipPracticesCrudService.name);

  constructor(
    @Inject(MEMBERSHIP_PRACTICES_REPOSITORY)
    private readonly repository: DataverseMembershipPracticesRepository,
  ) {}

  /**
   * Create new practice record
   *
   * @param dto - Practice creation data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier for tracking
   * @returns Created practice record
   */
  async create(
    dto: CreateMembershipPracticesDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipPracticesDto> {
    const opId = operationId || `create-pra-${Date.now()}`;
    this.logger.log(`Creating practice record for operation ${opId}`);

    try {
      // Privilege validation
      if (!this.canCreatePractice(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Insufficient privileges: Owner, Admin, or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Owner/Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Transform DTO to internal format
      const internal = MembershipPracticesMapper.mapCreateDtoToInternal(dto);

      // Validate membership year is provided
      if (!internal.osot_membership_year) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Membership year is required',
          operationId: opId,
        });
      }

      // Validate business required field: clients_age
      if (
        !internal.osot_clients_age ||
        internal.osot_clients_age.length === 0
      ) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Clients age is required and must have at least one value',
          operationId: opId,
        });
      }

      // Validate user-year uniqueness (if account is provided)
      if (internal.osot_table_account) {
        const exists = await this.repository.existsByUserAndYear(
          internal.osot_table_account,
          internal.osot_membership_year,
        );

        if (exists) {
          throw createAppError(ErrorCodes.ACCOUNT_DUPLICATE, {
            message: `User already has a practice record for year ${internal.osot_membership_year}`,
            operationId: opId,
            membershipYear: internal.osot_membership_year,
            userId: internal.osot_table_account,
          });
        }
      }

      // Apply default privilege if not set
      internal.osot_privilege = internal.osot_privilege || Privilege.OWNER;
      internal.osot_access_modifiers =
        internal.osot_access_modifiers || AccessModifier.PRIVATE;

      // Create in repository
      const created = await this.repository.create(internal);

      // Transform to response DTO
      const response =
        MembershipPracticesMapper.mapInternalToResponseDto(created);

      this.logger.log(
        `Successfully created practice ${created.osot_practice_id} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to create practice record', {
        operationId: opId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to create practice record',
        operationId: opId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Update existing practice record
   *
   * @param practiceId - Business practice ID (osot_practice_id)
   * @param dto - Update data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns Updated practice record
   */
  async update(
    practiceId: string,
    dto: UpdateMembershipPracticesDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipPracticesDto> {
    const opId = operationId || `update-pra-${Date.now()}`;
    this.logger.log(`Updating practice ${practiceId} for operation ${opId}`);

    try {
      // Privilege validation
      if (!this.canUpdatePractice(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Insufficient privileges: Owner, Admin, or Main privilege required',
          operationId: opId,
          practiceId,
          requiredPrivilege: 'Owner/Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Check if record exists
      const existing = await this.repository.findByPracticeId(practiceId);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Practice record not found: ${practiceId}`,
          operationId: opId,
          practiceId,
        });
      }

      // Note: Membership year cannot be changed after creation (immutable)
      // System fields (year, account) remain immutable after creation

      // Transform DTO to internal format
      const updateData = MembershipPracticesMapper.mapUpdateDtoToInternal(dto);

      // Validate business required field if provided: clients_age
      if (updateData.osot_clients_age !== undefined) {
        if (
          !updateData.osot_clients_age ||
          updateData.osot_clients_age.length === 0
        ) {
          throw createAppError(ErrorCodes.VALIDATION_ERROR, {
            message: 'Clients age must have at least one value',
            operationId: opId,
            practiceId,
          });
        }
      }

      // Update in repository
      const updated = await this.repository.update(practiceId, updateData);

      // Transform to response DTO
      const response =
        MembershipPracticesMapper.mapInternalToResponseDto(updated);

      this.logger.log(
        `Successfully updated practice ${practiceId} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to update practice record', {
        operationId: opId,
        practiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to update practice record',
        operationId: opId,
        practiceId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Delete practice record (hard delete)
   *
   * @param practiceId - Business practice ID
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns True if deleted
   */
  async delete(
    practiceId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `delete-pra-${Date.now()}`;
    this.logger.log(`Deleting practice ${practiceId} for operation ${opId}`);

    try {
      // Privilege validation - Only Admin or Main can delete
      if (!this.canDeletePractice(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Insufficient privileges: Admin or Main privilege required for deletion',
          operationId: opId,
          practiceId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Get practice data before deletion (for event)
      const existing = await this.repository.findByPracticeId(practiceId);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Practice record not found: ${practiceId}`,
          operationId: opId,
          practiceId,
        });
      }

      // Hard delete
      await this.repository.delete(practiceId);

      this.logger.log(
        `Successfully deleted practice ${practiceId} for operation ${opId}`,
      );

      return true;
    } catch (error) {
      this.logger.error('Failed to delete practice record', {
        operationId: opId,
        practiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to delete practice record',
        operationId: opId,
        practiceId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Check if user can create practice records
   * Owner, Admin, and Main can create
   */
  private canCreatePractice(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.OWNER ||
      userPrivilege === Privilege.ADMIN ||
      userPrivilege === Privilege.MAIN
    );
  }

  /**
   * Check if user can update practice records
   * Owner, Admin, and Main can update
   */
  private canUpdatePractice(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.OWNER ||
      userPrivilege === Privilege.ADMIN ||
      userPrivilege === Privilege.MAIN
    );
  }

  /**
   * Check if user can delete practice records
   * Only Admin and Main can delete (more restrictive)
   */
  private canDeletePractice(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }
}

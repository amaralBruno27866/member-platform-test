/**
 * Membership Preferences CRUD Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with DataverseMembershipPreferenceRepository
 * - Event-Driven Architecture: Emits domain events for all CUD operations
 * - Structured Logging: Operation IDs, security-aware logging
 * - Security-First Design: Privilege-based access control
 * - Data Transformation: Mappers for DTO ↔ Internal conversions
 * - Error Management: Centralized error handling with ErrorCodes
 *
 * PERMISSION SYSTEM (Membership Preferences Specific):
 * - OWNER (privilege = 0): Can manage their own preferences
 * - ADMIN (privilege = 2): Can manage preferences for their organization
 * - MAIN (privilege = 3): Full access to all preferences
 * - PUBLIC ACCESS: No direct CRUD access
 *
 * BUSINESS RULES ENFORCED:
 * - User-Year Uniqueness: One preference per user per year
 * - XOR Validation: Account OR Affiliate (never both or neither)
 * - Lookup Required: At least one lookup field (category, account, or affiliate)
 * - Auto-Renewal Tracking: Emits special event when auto-renewal changes
 *
 * KEY FEATURES:
 * - Hard delete (no soft delete like settings)
 * - User-year uniqueness validation
 * - Auto-renewal change tracking for renewal workflows
 * - Operation tracking for compliance and debugging
 * - Comprehensive event emission for audit trails
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateMembershipPreferenceDto } from '../dtos/membership-preference-create.dto';
import { UpdateMembershipPreferenceDto } from '../dtos/membership-preference-update.dto';
import { MembershipPreferenceResponseDto } from '../dtos/membership-preference-response.dto';
import {
  DataverseMembershipPreferenceRepository,
  MEMBERSHIP_PREFERENCE_REPOSITORY,
} from '../repositories/membership-preference.repository';
import { MembershipPreferenceMapper } from '../mappers/membership-preference.mapper';
import {
  MembershipPreferenceEventsService,
  MembershipPreferenceCreatedEvent,
} from '../events/membership-preference.events';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege, AccessModifier } from '../../../../common/enums';
import { CacheService } from '../../../../cache/cache.service';

@Injectable()
export class MembershipPreferenceCrudService {
  private readonly logger = new Logger(MembershipPreferenceCrudService.name);

  constructor(
    @Inject(MEMBERSHIP_PREFERENCE_REPOSITORY)
    private readonly repository: DataverseMembershipPreferenceRepository,
    private readonly eventsService: MembershipPreferenceEventsService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create new membership preference
   *
   * @param dto - Preference creation data
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier for tracking
   * @returns Created preference
   */
  async create(
    dto: CreateMembershipPreferenceDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<MembershipPreferenceResponseDto> {
    const opId = operationId || `create-pref-${Date.now()}`;
    this.logger.log(`Creating membership preference for operation ${opId}`);

    try {
      // Privilege validation
      if (!this.canCreatePreference(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Insufficient privileges: Owner, Admin, or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Owner/Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Transform DTO to internal format
      const internal = MembershipPreferenceMapper.mapCreateDtoToInternal(dto);

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

      // Validate user-year uniqueness
      const exists = await this.repository.existsByUserAndYear(
        userIdForValidation,
        internal.osot_membership_year,
        isAffiliate ? 'affiliate' : 'account',
      );

      if (exists) {
        // Emit duplicate detection event for auditing
        this.eventsService.publishUserYearDuplicate({
          preferenceId: 'temp-id',
          operationId: opId,
          membershipYear: internal.osot_membership_year,
          accountId: internal.osot_table_account,
          affiliateId: internal.osot_table_account_affiliate,
          existingPreferenceId: undefined,
          attemptedBy: userId,
          timestamp: new Date(),
        });

        throw createAppError(ErrorCodes.ACCOUNT_DUPLICATE, {
          message: `User already has a preference for year ${internal.osot_membership_year}`,
          operationId: opId,
          membershipYear: internal.osot_membership_year,
          userId: userIdForValidation,
        });
      }

      // Apply default privilege if not set
      internal.osot_privilege = internal.osot_privilege || Privilege.OWNER;
      internal.osot_access_modifiers =
        internal.osot_access_modifiers || AccessModifier.PRIVATE; // Default to Private (3)

      // Create in repository
      const created = await this.repository.create(internal);

      // Transform to response DTO
      const response =
        MembershipPreferenceMapper.mapInternalToResponseDto(created);

      // Emit created event
      const createdEvent: MembershipPreferenceCreatedEvent = {
        preferenceId: created.osot_preference_id,
        operationId: opId,
        membershipYear: created.osot_membership_year,
        accountId: created.osot_table_account,
        affiliateId: created.osot_table_account_affiliate,
        categoryId: created.osot_table_membership_category,
        autoRenewal: created.osot_auto_renewal,
        userId,
        userPrivilege,
        registrationSource: 'api',
        timestamp: new Date(),
      };

      this.eventsService.publishPreferenceCreated(createdEvent);

      // Invalidate membership cache for the user
      const userIdToInvalidate =
        created.osot_table_account || created.osot_table_account_affiliate;
      if (userIdToInvalidate) {
        await this.cacheService.invalidateMembership(userIdToInvalidate);
      }

      this.logger.log(
        `Successfully created preference ${created.osot_preference_id} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error('Failed to create membership preference', {
        operationId: opId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to create membership preference',
        operationId: opId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Update existing membership preference
   *
   * @param preferenceId - Business preference ID (osot_preference_id)
   * @param dto - Update data
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier
   * @returns Updated preference
   */
  async update(
    preferenceId: string,
    dto: UpdateMembershipPreferenceDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<MembershipPreferenceResponseDto> {
    const opId = operationId || `update-pref-${Date.now()}`;
    this.logger.log(
      `Updating preference ${preferenceId} for operation ${opId}`,
    );

    try {
      // Privilege validation
      if (!this.canUpdatePreference(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Insufficient privileges: Owner, Admin, or Main privilege required',
          operationId: opId,
          preferenceId,
          requiredPrivilege: 'Owner/Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Check if record exists
      const existing = await this.repository.findByPreferenceId(preferenceId);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Preference not found: ${preferenceId}`,
          operationId: opId,
          preferenceId,
        });
      }

      // Note: Year cannot be changed via update (users can only update preference choices)
      // System fields (year, category, account/affiliate) remain immutable after creation

      // Capture previous values for event
      const _previousValues = {
        autoRenewal: existing.osot_auto_renewal,
        thirdParties: existing.osot_third_parties,
        practicePromotion: existing.osot_practice_promotion,
        membersSearchTools: existing.osot_members_search_tools,
        shadowing: existing.osot_shadowing,
        psychotherapySupervision: existing.osot_psychotherapy_supervision,
      };

      // Transform DTO to internal format
      const updateData = MembershipPreferenceMapper.mapUpdateDtoToInternal(dto);

      // Update in repository
      const updated = await this.repository.update(preferenceId, updateData);

      // Transform to response DTO
      const response =
        MembershipPreferenceMapper.mapInternalToResponseDto(updated);

      // Emit updated event
      const newValues = {
        autoRenewal: updated.osot_auto_renewal,
        thirdParties: updated.osot_third_parties,
        practicePromotion: updated.osot_practice_promotion,
        membersSearchTools: updated.osot_members_search_tools,
        shadowing: updated.osot_shadowing,
        psychotherapySupervision: updated.osot_psychotherapy_supervision,
      };

      this.eventsService.publishPreferenceUpdated({
        preferenceId: updated.osot_preference_id,
        operationId: opId,
        membershipYear: updated.osot_membership_year,
        changes: {
          old: _previousValues,
          new: newValues,
        },
        updateReason: 'user_request',
        updatedBy: userId || 'system',
        userPrivilege,
        timestamp: new Date(),
      });

      // If auto-renewal changed, emit special event
      if (
        dto.osot_auto_renewal !== undefined &&
        existing.osot_auto_renewal !== dto.osot_auto_renewal
      ) {
        this.eventsService.publishAutoRenewalChanged({
          preferenceId: updated.osot_preference_id,
          operationId: opId,
          membershipYear: updated.osot_membership_year,
          accountId: updated.osot_table_account,
          affiliateId: updated.osot_table_account_affiliate,
          previousAutoRenewal: existing.osot_auto_renewal,
          newAutoRenewal: dto.osot_auto_renewal,
          changeReason: 'user_request',
          changedBy: userId || 'system',
          userPrivilege,
          timestamp: new Date(),
        });
      }

      // Invalidate membership cache for the user
      const userIdToInvalidate =
        updated.osot_table_account || updated.osot_table_account_affiliate;
      if (userIdToInvalidate) {
        await this.cacheService.invalidateMembership(userIdToInvalidate);
      }

      this.logger.log(
        `Successfully updated preference ${preferenceId} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error('Failed to update membership preference', {
        operationId: opId,
        preferenceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to update membership preference',
        operationId: opId,
        preferenceId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Delete membership preference (hard delete)
   *
   * @param preferenceId - Business preference ID
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier
   * @returns True if deleted
   */
  async delete(
    preferenceId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `delete-pref-${Date.now()}`;
    this.logger.log(
      `Deleting preference ${preferenceId} for operation ${opId}`,
    );

    try {
      // Privilege validation - Only Admin or Main can delete
      if (!this.canDeletePreference(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Insufficient privileges: Admin or Main privilege required for deletion',
          operationId: opId,
          preferenceId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      // Get preference data before deletion (for event)
      const existing = await this.repository.findByPreferenceId(preferenceId);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Preference not found: ${preferenceId}`,
          operationId: opId,
          preferenceId,
        });
      }

      // Hard delete
      await this.repository.delete(preferenceId);

      // Emit deleted event
      this.eventsService.publishPreferenceDeleted({
        preferenceId,
        operationId: opId,
        membershipYear: existing.osot_membership_year,
        accountId: existing.osot_table_account,
        affiliateId: existing.osot_table_account_affiliate,
        deletionReason: 'admin_action',
        deletedBy: userId || 'system',
        userPrivilege,
        timestamp: new Date(),
      });

      this.logger.log(
        `Successfully deleted preference ${preferenceId} for operation ${opId}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Failed to delete membership preference', {
        operationId: opId,
        preferenceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to delete membership preference',
        operationId: opId,
        preferenceId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Check if user can create preferences
   * Owner, Admin, and Main can create
   */
  private canCreatePreference(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.OWNER ||
      userPrivilege === Privilege.ADMIN ||
      userPrivilege === Privilege.MAIN
    );
  }

  /**
   * Check if user can update preferences
   * Owner, Admin, and Main can update
   */
  private canUpdatePreference(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.OWNER ||
      userPrivilege === Privilege.ADMIN ||
      userPrivilege === Privilege.MAIN
    );
  }

  /**
   * Check if user can delete preferences
   * Only Admin and Main can delete (more restrictive)
   */
  private canDeletePreference(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }
}

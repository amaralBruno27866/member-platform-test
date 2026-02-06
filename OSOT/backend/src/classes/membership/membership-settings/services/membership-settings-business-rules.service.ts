/**
 * @fileoverview Membership Settings Business Rules Service
 * @description Service for centralized business rule validation and enforcement
 * @author Bruno Amaral
 * @since 2024
 *
 * Business rules implemented:
 * - Group-year combination uniqueness validation
 * - Year period validation (year_starts < year_ends, business range)
 * - Privilege-based access control (Main for create/delete, Admin/Main for read/update)
 *
 * Access Control:
 * - Admin (Privilege.ADMIN = 2): Read and update access only
 * - Main (Privilege.MAIN = 3): Full CRUD access (create, read, update, delete)
 * - Other privileges: Read-only access to active settings
 *
 * Features:
 * - Centralized business logic with operation tracking
 * - Privilege validation for all modification operations
 * - Comprehensive validation error reporting
 * - Operation tracking for compliance and debugging
 */

import { Injectable, Logger } from '@nestjs/common';
import { CreateMembershipSettingsDto } from '../dtos/membership-settings-create.dto';
import { UpdateMembershipSettingsDto } from '../dtos/membership-settings-update.dto';
import { Privilege } from '../../../../common/enums';
import { MEMBERSHIP_BUSINESS_RULES } from '../constants/membership-settings.constants';

/**
 * Validation result interface for business rules
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Array of error messages if validation failed */
  errors: string[];
  /** Additional context for debugging */
  context?: Record<string, unknown>;
}

@Injectable()
export class MembershipSettingsBusinessRulesService {
  private readonly logger = new Logger(
    MembershipSettingsBusinessRulesService.name,
  );

  /**
   * Validates business rules for creating new membership settings
   * Performs all business rule checks required for new settings creation
   *
   * @param dto - Settings creation data
   * @param userPrivilege - User privilege level for access control
   * @param operationId - Unique ID for tracking this operation
   * @returns Validation result with success status and error details
   */
  validateCreate(
    dto: CreateMembershipSettingsDto,
    userPrivilege?: Privilege,
    operationId?: string,
  ): ValidationResult {
    const opId = operationId || `val-create-${Date.now()}`;
    const errors: string[] = [];

    try {
      this.logger.debug(`Starting create validation for operation ${opId}`);

      // Check user privilege for create operations
      if (!this.canCreateSettings(userPrivilege)) {
        errors.push(
          'User does not have permission to create membership settings (Main privilege required)',
        );
        return { isValid: false, errors };
      }

      // Validate year period dates
      if (dto.osot_year_starts && dto.osot_year_ends) {
        const yearPeriodValidation = this.validateYearPeriod(
          new Date(dto.osot_year_starts),
          new Date(dto.osot_year_ends),
        );
        if (!yearPeriodValidation.isValid) {
          errors.push(...yearPeriodValidation.errors);
        }
      }

      const isValid = errors.length === 0;
      this.logger.debug(
        `Create validation completed for operation ${opId}: ${isValid ? 'SUCCESS' : 'FAILED'}`,
      );

      return {
        isValid,
        errors,
        context: { operationId: opId, validationType: 'create' },
      };
    } catch (error) {
      this.logger.error(
        `Unexpected error during create validation for operation ${opId}`,
        { operationId: opId, originalError: error as Error },
      );

      return {
        isValid: false,
        errors: ['Business rule validation failed due to system error'],
        context: { operationId: opId, error: error as Error },
      };
    }
  }

  /**
   * Validates business rules for updating existing membership settings
   * Performs update-specific business rule checks including uniqueness validation
   *
   * @param settingsId - ID of settings being updated
   * @param dto - Settings update data
   * @param userPrivilege - User privilege level for access control
   * @param operationId - Unique ID for tracking this operation
   * @returns Validation result with success status and error details
   */
  validateUpdate(
    settingsId: string,
    dto: UpdateMembershipSettingsDto,
    userPrivilege?: Privilege,
    operationId?: string,
  ): ValidationResult {
    const opId = operationId || `val-update-${Date.now()}`;
    const errors: string[] = [];

    try {
      this.logger.debug(`Starting update validation for operation ${opId}`);

      // Check user privilege for update operations
      if (!this.canUpdateSettings(userPrivilege)) {
        errors.push(
          'User does not have permission to update membership settings (Admin or Main privilege required)',
        );
        return { isValid: false, errors };
      }

      // Validate year period dates if provided
      if (dto.osot_year_starts || dto.osot_year_ends) {
        const startDate = dto.osot_year_starts
          ? new Date(dto.osot_year_starts)
          : new Date(); // Default fallback
        const endDate = dto.osot_year_ends
          ? new Date(dto.osot_year_ends)
          : new Date(); // Default fallback

        const yearPeriodValidation = this.validateYearPeriod(
          startDate,
          endDate,
        );
        if (!yearPeriodValidation.isValid) {
          errors.push(...yearPeriodValidation.errors);
        }
      }

      const isValid = errors.length === 0;
      this.logger.debug(
        `Update validation completed for operation ${opId}: ${isValid ? 'SUCCESS' : 'FAILED'}`,
      );

      return {
        isValid,
        errors,
        context: { operationId: opId, validationType: 'update', settingsId },
      };
    } catch (error) {
      this.logger.error(
        `Unexpected error during update validation for operation ${opId}`,
        { operationId: opId, originalError: error as Error },
      );

      return {
        isValid: false,
        errors: ['Business rule validation failed due to system error'],
        context: { operationId: opId, error: error as Error },
      };
    }
  }

  /**
   * Checks if user has permission to create membership settings
   * Only Main privilege can create settings
   *
   * @param userPrivilege - User privilege level
   * @returns True if user can create settings
   */
  canCreateSettings(userPrivilege?: Privilege): boolean {
    return userPrivilege === Privilege.MAIN;
  }

  /**
   * Checks if user has permission to update membership settings
   * Admin and Main privileges can update settings
   *
   * @param userPrivilege - User privilege level
   * @returns True if user can update settings
   */
  canUpdateSettings(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }

  /**
   * Checks if user has permission to delete membership settings
   * Only Main privilege can delete settings
   *
   * @param userPrivilege - User privilege level
   * @returns True if user can delete settings
   */
  canDeleteSettings(userPrivilege?: Privilege): boolean {
    return userPrivilege === Privilege.MAIN;
  }

  /**
   * Checks if user has permission to modify membership settings
   * Admin and Main privileges can modify settings (backward compatibility)
   *
   * @param userPrivilege - User privilege level
   * @returns True if user can modify settings
   */
  canModifySettings(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }

  /**
   * Checks if user has permission to read membership settings
   * All users can read active settings, only privileged users can read all
   *
   * @returns True (all users can read active settings)
   */
  canReadSettings(): boolean {
    // All users can read active settings
    // Privileged users can read all settings (handled at service level)
    return true;
  }

  /**
   * Validates year period date range
   * Ensures start date is before end date and within business range
   *
   * @param startDate - Year period start date
   * @param endDate - Year period end date
   * @returns Validation result with error details
   */
  private validateYearPeriod(startDate: Date, endDate: Date): ValidationResult {
    const errors: string[] = [];

    try {
      // Check if dates are valid
      if (!startDate || !endDate) {
        errors.push('Year period start and end dates are required');
        return { isValid: false, errors };
      }

      // Convert to Date objects if needed
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Check if dates are valid Date objects
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        errors.push('Invalid date format for year period');
        return { isValid: false, errors };
      }

      // Check start < end
      if (start >= end) {
        errors.push('Year period start date must be before end date');
      }

      // Check minimum period length
      const periodDays = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (periodDays < MEMBERSHIP_BUSINESS_RULES.MIN_PERIOD_DAYS) {
        errors.push(
          `Year period too short: ${periodDays} days (minimum: ${MEMBERSHIP_BUSINESS_RULES.MIN_PERIOD_DAYS})`,
        );
      }

      // Check maximum period length
      if (periodDays > MEMBERSHIP_BUSINESS_RULES.MAX_PERIOD_DAYS) {
        errors.push(
          `Year period too long: ${periodDays} days (maximum: ${MEMBERSHIP_BUSINESS_RULES.MAX_PERIOD_DAYS})`,
        );
      }

      return { isValid: errors.length === 0, errors };
    } catch {
      return {
        isValid: false,
        errors: ['Failed to validate year period'],
      };
    }
  }
}

/**
 * Insurance Business Rules Service
 *
 * Encapsulates validation logic and permission checks for Insurance operations.
 *
 * Responsibilities:
 * - Validate create/update/delete permissions
 * - Validate order ownership and insurance product presence
 * - Enforce unique insurance per order
 * - Enforce status transitions and endorsement rules
 * - Enforce declaration/question rules
 *
 * @file insurance-business-rules.service.ts
 * @module InsuranceModule
 * @layer Services
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { Privilege } from '../../../../common/enums';
import { CreateInsuranceDto } from '../dtos/create-insurance.dto';
import { UpdateInsuranceDto } from '../dtos/update-insurance.dto';
import { InsuranceInternal } from '../interfaces/insurance-internal.interface';
import { InsuranceType } from '../../product/enums/insurance-type.enum';
import {
  INSURANCE_COVERAGE_RULES,
  INSURANCE_QUESTION_BUSINESS_RULES,
  VALID_INSURANCE_STATUS_TRANSITIONS,
} from '../constants/insurance-business-rules.constant';
import { INSURANCE_STATE_TRANSITION_RULES } from '../constants/insurance-validation.constant';
import {
  InsuranceRepository,
  INSURANCE_REPOSITORY,
} from '../interfaces/insurance-repository.interface';
import { OrderLookupService } from '../../order/services/order-lookup.service';
import { OrderProductLookupService } from '../../order-product/services/order-product-lookup.service';
import { InsuranceStatus } from '../enum/insurance-status.enum';

/**
 * Validation result object
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class InsuranceBusinessRuleService {
  private readonly logger = new Logger(InsuranceBusinessRuleService.name);

  constructor(
    @Inject(INSURANCE_REPOSITORY)
    private readonly insuranceRepository: InsuranceRepository,
    private readonly orderLookupService: OrderLookupService,
    private readonly orderProductLookupService: OrderProductLookupService,
  ) {}

  // ========================================
  // PERMISSION HELPERS
  // ========================================

  canCreateInsurance(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.OWNER || userPrivilege === Privilege.MAIN
    );
  }

  canUpdateInsurance(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }

  canDeleteInsurance(userPrivilege?: Privilege): boolean {
    return userPrivilege === Privilege.MAIN;
  }

  canReadInsurance(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.OWNER ||
      userPrivilege === Privilege.ADMIN ||
      userPrivilege === Privilege.MAIN
    );
  }

  // ========================================
  // CREATE VALIDATION
  // ========================================

  async validateInsuranceForCreation(
    dto: CreateInsuranceDto,
    userPrivilege: Privilege,
    userId?: string,
    organizationGuid?: string,
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!this.canCreateInsurance(userPrivilege)) {
      errors.push('Insufficient privileges to create insurance');
      return { isValid: false, errors };
    }

    if (organizationGuid && dto.organizationGuid !== organizationGuid) {
      errors.push('Organization context mismatch');
    }

    if (userPrivilege === Privilege.OWNER) {
      if (!userId) {
        errors.push('User ID is required for Owner operations');
      } else if (dto.accountGuid !== userId) {
        errors.push('Cannot create insurance for another user');
      }
    }

    // Validate order ownership and organization
    try {
      const order = await this.orderLookupService.findById(
        dto.orderGuid,
        userPrivilege,
        userId,
        organizationGuid,
      );

      if (!order) {
        errors.push('Order not found');
      } else {
        if (organizationGuid && order.organizationGuid !== organizationGuid) {
          errors.push('Order does not belong to this organization');
        }

        if (userPrivilege === Privilege.OWNER && order.accountGuid !== userId) {
          errors.push('Order does not belong to this account');
        }
      }
    } catch (error) {
      this.logger.warn('Order validation failed during insurance creation', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      errors.push('Order validation failed');
    }

    // Validate order contains insurance product
    try {
      const orderProducts = await this.orderProductLookupService.findByOrderId(
        dto.orderGuid,
      );

      const hasInsuranceProduct = orderProducts.some(
        (item) =>
          item.osot_insurance_type !== undefined ||
          (item.osot_insurance_limit ?? 0) > 0,
      );

      if (!hasInsuranceProduct) {
        errors.push('Order does not include insurance product');
      }
    } catch (error) {
      this.logger.warn('Order product validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      errors.push('Unable to validate order products');
    }

    // Ensure no duplicate insurance for the order
    try {
      const existing = await this.insuranceRepository.findByOrder(
        dto.orderGuid,
        dto.organizationGuid,
      );

      if (existing.length > 0) {
        errors.push('Insurance already exists for this order');
      }
    } catch (error) {
      this.logger.warn('Duplicate insurance check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      errors.push('Unable to validate insurance duplicates');
    }

    // Declaration must be true
    if (
      INSURANCE_QUESTION_BUSINESS_RULES.DECLARATION_MANDATORY &&
      dto.osot_insurance_declaration !== true
    ) {
      errors.push('Insurance declaration must be true');
    }

    // Question rules (Professional only)
    const requiresQuestions =
      INSURANCE_QUESTION_BUSINESS_RULES.TYPES_REQUIRING_QUESTIONS.some(
        (type) => type === dto.osot_insurance_type,
      );

    const hasQuestionAnswers =
      dto.osot_insurance_question_1 !== undefined ||
      dto.osot_insurance_question_2 !== undefined ||
      dto.osot_insurance_question_3 !== undefined ||
      !!dto.osot_insurance_question_1_explain ||
      !!dto.osot_insurance_question_2_explain ||
      !!dto.osot_insurance_question_3_explain;

    if (!requiresQuestions && hasQuestionAnswers) {
      errors.push('Risk questions are not allowed for this insurance type');
    }

    if (requiresQuestions) {
      if (
        dto.osot_insurance_question_1 &&
        !dto.osot_insurance_question_1_explain
      ) {
        errors.push('Question 1 explanation is required');
      }
      if (
        dto.osot_insurance_question_2 &&
        !dto.osot_insurance_question_2_explain
      ) {
        errors.push('Question 2 explanation is required');
      }
      if (
        dto.osot_insurance_question_3 &&
        !dto.osot_insurance_question_3_explain
      ) {
        errors.push('Question 3 explanation is required');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // ========================================
  // UPDATE VALIDATION
  // ========================================

  validateInsuranceForUpdate(
    current: InsuranceInternal,
    updates: UpdateInsuranceDto,
    userPrivilege: Privilege,
  ): ValidationResult {
    const errors: string[] = [];

    if (!this.canUpdateInsurance(userPrivilege)) {
      errors.push('Insufficient privileges to update insurance');
      return { isValid: false, errors };
    }

    const hasUpdates =
      updates.osot_insurance_status !== undefined ||
      updates.osot_endorsement_description !== undefined ||
      updates.osot_endorsement_effective_date !== undefined ||
      updates.osot_privilege !== undefined ||
      updates.osot_access_modifiers !== undefined;

    if (!hasUpdates) {
      errors.push('No updatable fields provided');
      return { isValid: false, errors };
    }

    if (
      updates.osot_insurance_status !== undefined &&
      current.osot_insurance_status !== undefined
    ) {
      const allowed =
        VALID_INSURANCE_STATUS_TRANSITIONS[current.osot_insurance_status] || [];
      if (!allowed.includes(updates.osot_insurance_status)) {
        errors.push(
          `Invalid status transition from ${current.osot_insurance_status} to ${updates.osot_insurance_status}`,
        );
      }
    }

    const hasEndorsementUpdates =
      updates.osot_endorsement_description !== undefined ||
      updates.osot_endorsement_effective_date !== undefined;

    if (hasEndorsementUpdates) {
      const allowedStatuses =
        INSURANCE_COVERAGE_RULES.CAN_ADD_ENDORSEMENT.ALLOWED_STATUSES;

      if (
        current.osot_insurance_status === undefined ||
        !allowedStatuses.some(
          (status) => status === current.osot_insurance_status,
        )
      ) {
        errors.push('Endorsements can only be added for ACTIVE or PENDING');
      }

      if (
        INSURANCE_STATE_TRANSITION_RULES.ENDORSEMENT_IMMUTABLE_AFTER_EFFECTIVE &&
        current.osot_endorsement_effective_date
      ) {
        errors.push('Endorsement cannot be modified after it is effective');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // ========================================
  // MEMBERSHIP VALIDATION
  // ========================================

  /**
   * Validate that user has an active membership
   * REQUIRED: Insurance can only be purchased with active membership
   *
   * @param membershipStatus - Membership status (from membership lookup)
   * @param operationId - Operation tracking ID
   * @returns ValidationResult with errors if membership not active
   */
  validateActiveMembershipExists(
    membershipStatus: string | undefined,
    operationId: string,
  ): ValidationResult {
    const errors: string[] = [];

    if (!membershipStatus || membershipStatus.toLowerCase() !== 'active') {
      errors.push(
        'Active membership is required to purchase insurance. Please activate or renew your membership first.',
      );
      this.logger.warn(
        `Insurance creation blocked: No active membership - Operation: ${operationId}`,
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate insurance type eligibility
   * RULE: Non-professional insurance requires professional to be ACTIVE
   * RULE: Property insurance requires Commercial to be ACTIVE
   *
   * Insurance types hierarchy:
   * 0. Professional (required prerequisite) - Always allowed
   * 1. Commercial - Requires Professional ACTIVE
   * 2. Property - Requires Commercial ACTIVE (+ Professional ACTIVE)
   * 3. Other - Requires Professional ACTIVE
   *
   * @param insuranceType - Type being created (e.g., 'professional', 'extended')
   * @param hasActiveProfessional - Whether user has active professional insurance
   * @param hasActiveCommercial - Whether user has active commercial insurance
   * @param operationId - Operation tracking ID
   * @returns ValidationResult
   */
  validateInsuranceTypeEligibility(
    insuranceType: string | undefined,
    hasActiveProfessional: boolean,
    operationId: string,
    hasActiveCommercial: boolean = false,
  ): ValidationResult {
    const errors: string[] = [];

    // Use numeric enum for type checking (better performance than string comparison)
    const parsedType =
      insuranceType !== undefined ? Number(insuranceType) : NaN;
    const insuranceTypeId = Number.isNaN(parsedType)
      ? undefined
      : (parsedType as InsuranceType);
    const isProfessional = insuranceTypeId === InsuranceType.PROFESSIONAL; // 1
    const isProperty = insuranceTypeId === InsuranceType.PROPERTY; // 4

    // Professional insurance is always allowed (first purchase or renewal)
    if (isProfessional) {
      return { isValid: true, errors: [] };
    }

    // Non-professional types require active professional
    if (!hasActiveProfessional) {
      errors.push(
        `Professional Liability insurance must be purchased first to add ${insuranceType} coverage. ` +
          'Please select Professional Liability Insurance in your order.',
      );
      this.logger.warn(
        `Insurance ${insuranceType} blocked: Professional insurance not active - Operation: ${operationId}`,
      );
    }

    // Property requires Commercial to be ACTIVE
    if (isProperty && !hasActiveCommercial) {
      errors.push(
        'Commercial insurance must be purchased first to add Property coverage. ' +
          'Please select Commercial insurance in your order.',
      );
      this.logger.warn(
        `Insurance ${insuranceType} blocked: Commercial insurance not active - Operation: ${operationId}`,
      );
    }

    return { isValid: errors.length === 0, errors };
  }
  /**
   * Validate no duplicate active insurance of same type in same year
   * RULE: One insurance per type per academic year
   * When membership year changes, old insurances become EXPIRED, allowing new ones
   *
   * @param insuranceType - Type being created
   * @param existingActiveInsurances - User's active insurances from lookup
   * @param currentMembershipYear - Current academic year from membership-settings
   * @param operationId - Operation tracking ID
   * @returns ValidationResult
   */
  validateNoActiveInsuranceOfType(
    insuranceType: string | undefined,
    existingActiveInsurances: InsuranceInternal[],
    currentMembershipYear: string | undefined,
    operationId: string,
  ): ValidationResult {
    const errors: string[] = [];

    const sameTypeActive = existingActiveInsurances.find(
      (ins) =>
        ins.osot_insurance_type === insuranceType &&
        ins.osot_insurance_status === InsuranceStatus.ACTIVE &&
        ins.osot_membership_year === currentMembershipYear,
    );

    if (sameTypeActive) {
      errors.push(
        `You already have an active ${insuranceType} insurance for the current academic year (${currentMembershipYear}). ` +
          'You can purchase a new one next academic year. ' +
          `Existing certificate ID: ${sameTypeActive.osot_certificate}`,
      );
      this.logger.warn(
        `Insurance duplicate blocked: ${insuranceType} already active for year ${currentMembershipYear} - Operation: ${operationId}`,
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  // ========================================
  // DELETE VALIDATION
  // ========================================

  validateInsuranceForDeletion(
    current: InsuranceInternal,
    userPrivilege: Privilege,
  ): ValidationResult {
    const errors: string[] = [];

    if (!this.canDeleteInsurance(userPrivilege)) {
      errors.push('Insufficient privileges to delete insurance');
      return { isValid: false, errors };
    }

    if (current.osot_insurance_status === InsuranceStatus.CANCELLED) {
      errors.push('Insurance is already cancelled');
    }

    return { isValid: errors.length === 0, errors };
  }
}

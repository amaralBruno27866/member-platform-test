import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  Category,
  getCategoryDisplayName,
} from '../../../../common/enums/categories-enum';
import { SearchTools } from '../enums/search-tools.enum';
import {
  CreateMembershipPreferenceDto,
  UpdateMembershipPreferenceDto,
} from '../dtos';

/**
 * Extended DTO interface to handle legacy field names with proper typing
 */
interface ExtendedPreferenceDto {
  osot_search_tools?: SearchTools[];
  osot_members_search_tools?: SearchTools[];
}

/**
 * @class MembershipPreferenceBusinessRulesService
 * @description Enforces business rules for membership preferences based on membership categories
 *
 * **Responsibilities:**
 * - Validate field availability based on membership category
 * - Enforce category-specific field requirements
 * - Validate enum values for category-specific allowed options
 * - Provide helper methods for field eligibility checks
 *
 * **Business Rules Reference:**
 * See BUSINESS_RULES_ANALYSIS.md for complete field-category matrix
 */
@Injectable()
export class MembershipPreferenceBusinessRulesService {
  private readonly logger = new Logger(
    MembershipPreferenceBusinessRulesService.name,
  );

  // ==========================================
  // FIELD AVAILABILITY BY CATEGORY
  // ==========================================

  /**
   * Validates if a category can have auto-renewal
   * @param category - Membership category
   * @returns true if auto-renewal is applicable
   *
   * **Business Rule:** Only PAYING members can have auto-renewal
   * - ✅ All OT/OTA paid categories (PR, NP, RET, NG, LIFE)
   * - ✅ Associates and Affiliates
   * - ❌ Students (OT_STU, OTA_STU) - non-paying
   */
  canHaveAutoRenewal(category: Category): boolean {
    const nonPayingCategories = [Category.OT_STU, Category.OTA_STU];

    return !nonPayingCategories.includes(category);
  }

  /**
   * Validates if a category can have third-party communication preferences
   * @param category - Membership category
   * @returns true if third parties field is applicable
   *
   * **Business Rule:** ALL members can choose third-party communications
   * - ✅ All categories (recruitment, products, professional development relevant to all)
   */
  canHaveThirdParties(_category: Category): boolean {
    // All members can receive communications from third parties
    return true;
  }

  /**
   * Validates if a category can have practice promotion
   * @param category - Membership category
   * @returns true if practice promotion is applicable
   *
   * **Business Rule (Updated):** OT members who can actively promote their practice
   * - ✅ OT_LIFE (lifetime OT members)
   * - ✅ OT_NG (new graduate OTs establishing practice)
   * - ✅ OT_PR (actively practicing OTs)
   * - ❌ All OTAs (work under OT supervision)
   * - ❌ Non-practicing, retired, students, associates, affiliates
   */
  canHavePracticePromotion(category: Category): boolean {
    const practicePromotionCategories = [
      Category.OT_LIFE,
      Category.OT_NG,
      Category.OT_PR,
    ];

    return practicePromotionCategories.includes(category);
  }

  /**
   * Validates if a category can have shadowing availability
   * @param category - Membership category
   * @returns true if shadowing is applicable
   *
   * **Business Rule (Updated):** Only OT members can offer shadowing
   * - ✅ OT_LIFE (experienced lifetime OTs)
   * - ✅ OT_NG (new graduate OTs)
   * - ✅ OT_PR (actively practicing OTs)
   * - ❌ All OTAs (work under OT supervision, cannot independently offer shadowing)
   * - ❌ Non-practicing, retired, students, associates, affiliates
   */
  canHaveShadowing(category: Category): boolean {
    const shadowingCategories = [
      Category.OT_LIFE,
      Category.OT_NG,
      Category.OT_PR,
    ];

    return shadowingCategories.includes(category);
  }

  /**
   * Validates if a category can have psychotherapy supervision
   * @param category - Membership category
   * @returns true if psychotherapy supervision is applicable
   *
   * **Business Rule (Updated):** Only certified OT practitioners can provide psychotherapy supervision
   * - ✅ OT_LIFE (experienced lifetime OTs with certification)
   * - ✅ OT_PR (actively practicing OTs with certification)
   * - ❌ OT_NP (removed - non-practicing cannot supervise)
   * - ❌ All OTAs (not qualified for psychotherapy supervision)
   * - ❌ Students, retired, new grads, associates, affiliates
   */
  canHavePsychotherapySupervision(category: Category): boolean {
    const psychotherapyCategories = [Category.OT_LIFE, Category.OT_PR];

    return psychotherapyCategories.includes(category);
  }

  /**
   * Gets allowed search tools for a category
   * @param category - Membership category
   * @returns Array of allowed SearchTools enum values, or null if all allowed
   *
   * **Business Rules (Updated from CSV Matrix):**
   * - **ALL tools:** OT_LIFE, OT_NG, OT_PR, OT_NP
   * - **All except Presenter:** OT_RET (1,2,3,4)
   * - **Except Exam and Supervising Clinical:** OTA_LIFE, OTA_NG, OTA_NP, OTA_PR, OTA_RET (1,2,5)
   * - **Only network:** ASSOC, OT_STU, OTA_STU (1)
   * - **NO tools:** AFF_PREM, AFF_PRIM (empty)
   */
  getAllowedSearchTools(category: Category): SearchTools[] | null {
    // ALL TOOLS - Full access for OT categories (except retired)
    const allToolsCategories = [
      Category.OT_LIFE,
      Category.OT_NG,
      Category.OT_PR,
      Category.OT_NP,
    ];
    if (allToolsCategories.includes(category)) {
      return null; // null means all allowed
    }

    // OT_RET: All except Presenter (1,2,3,4)
    if (category === Category.OT_RET) {
      return [
        SearchTools.PROFESSIONAL_NETWORKS,
        SearchTools.POTENTIAL_MENTORING,
        SearchTools.SUPERVISING_CLINIC_PLACEMENTS,
        SearchTools.EXAM_MENTORING,
      ];
    }

    // OTAs: Except Exam and Supervising Clinical (1,2,5)
    const otaCategories = [
      Category.OTA_LIFE,
      Category.OTA_NG,
      Category.OTA_NP,
      Category.OTA_PR,
      Category.OTA_RET,
    ];
    if (otaCategories.includes(category)) {
      return [
        SearchTools.PROFESSIONAL_NETWORKS,
        SearchTools.POTENTIAL_MENTORING,
        SearchTools.PRESENTER,
      ];
    }

    // Associates and Students: Only network (1)
    const networkOnlyCategories = [
      Category.ASSOC,
      Category.OT_STU,
      Category.OTA_STU,
    ];
    if (networkOnlyCategories.includes(category)) {
      return [SearchTools.PROFESSIONAL_NETWORKS];
    }

    // Affiliates: NO tools
    const affiliateCategories = [Category.AFF_PRIM, Category.AFF_PREM];
    if (affiliateCategories.includes(category)) {
      return [];
    }

    // Default: no search tools
    this.logger.warn(
      `Unknown category ${category} for search tools eligibility`,
    );
    return [];
  }

  /**
   * Validates if search tools are allowed for a category
   * @param category - Membership category
   * @param searchTools - Array of search tools to validate
   * @returns true if all search tools are allowed for the category
   */
  areSearchToolsAllowed(
    category: Category,
    searchTools: SearchTools[],
  ): boolean {
    const allowedTools = this.getAllowedSearchTools(category);

    // If null, all tools are allowed
    if (allowedTools === null) {
      return true;
    }

    // If empty array, no tools allowed
    if (allowedTools.length === 0) {
      return searchTools.length === 0;
    }

    // Check if all provided tools are in the allowed list
    return searchTools.every((tool) => allowedTools.includes(tool));
  }

  // ==========================================
  // VALIDATION METHODS
  // ==========================================

  /**
   * Validates a CreateMembershipPreferenceDto against category-specific business rules
   * @param dto - DTO to validate
   * @param category - Membership category
   * @throws BadRequestException if any field violates business rules
   */
  validateCreateDto(
    dto: CreateMembershipPreferenceDto,
    category: Category,
  ): void {
    this.logger.debug(`Validating create DTO for category: ${category}`);

    // Validate membership declaration (REQUIRED - must be TRUE)
    if (dto.osot_membership_declaration !== true) {
      throw new BadRequestException(
        'You must accept the membership declaration to proceed with membership registration.',
      );
    }

    // Validate auto-renewal
    if (
      dto.osot_auto_renewal !== undefined &&
      !this.canHaveAutoRenewal(category)
    ) {
      throw new BadRequestException(
        `Auto-renewal is only available for paying members. ` +
          `Category ${getCategoryDisplayName(category)} is non-paying.`,
      );
    }

    // Validate practice promotion
    if (
      dto.osot_practice_promotion !== undefined &&
      !this.canHavePracticePromotion(category)
    ) {
      throw new BadRequestException(
        `Practice promotion is only available for actively practicing members. ` +
          `Category ${getCategoryDisplayName(category)} does not qualify.`,
      );
    }

    // Validate shadowing
    if (dto.osot_shadowing !== undefined && !this.canHaveShadowing(category)) {
      throw new BadRequestException(
        `Shadowing availability is only for professionals with active or recent experience. ` +
          `Category ${getCategoryDisplayName(category)} does not qualify.`,
      );
    }

    // Validate psychotherapy supervision
    if (
      dto.osot_psychotherapy_supervision !== undefined &&
      !this.canHavePsychotherapySupervision(category)
    ) {
      throw new BadRequestException(
        `Psychotherapy supervision is only available for certified OT practitioners. ` +
          `Category ${getCategoryDisplayName(category)} does not qualify.`,
      );
    }

    // Validate search tools
    const extendedDto = dto as CreateMembershipPreferenceDto &
      ExtendedPreferenceDto;
    if (
      (extendedDto.osot_search_tools ||
        extendedDto.osot_members_search_tools) !== undefined
    ) {
      // Get search tools from either field name (legacy support)
      const searchToolsValue =
        extendedDto.osot_search_tools || extendedDto.osot_members_search_tools;

      // Convert single value to array for validation
      const searchToolsArray = Array.isArray(searchToolsValue)
        ? searchToolsValue
        : [searchToolsValue];

      if (!this.areSearchToolsAllowed(category, searchToolsArray)) {
        const allowedTools = this.getAllowedSearchTools(category);
        const allowedToolsStr =
          allowedTools === null
            ? 'all search tools'
            : allowedTools.length === 0
              ? 'no search tools'
              : allowedTools.join(', ');

        throw new BadRequestException(
          `Search tools provided are not allowed for category ${getCategoryDisplayName(category)}. ` +
            `Allowed tools: ${allowedToolsStr}.`,
        );
      }
    }

    this.logger.debug(`Create DTO validation passed for category: ${category}`);
  }

  /**
   * Validates an UpdateMembershipPreferenceDto against category-specific business rules
   * @param dto - DTO to validate
   * @param category - Membership category
   * @throws BadRequestException if any field violates business rules
   */
  validateUpdateDto(
    dto: UpdateMembershipPreferenceDto,
    category: Category,
  ): void {
    this.logger.debug(`Validating update DTO for category: ${category}`);

    // Validate auto-renewal
    if (
      dto.osot_auto_renewal !== undefined &&
      !this.canHaveAutoRenewal(category)
    ) {
      throw new BadRequestException(
        `Auto-renewal is only available for paying members. ` +
          `Category ${getCategoryDisplayName(category)} is non-paying.`,
      );
    }

    // Validate practice promotion
    if (
      dto.osot_practice_promotion !== undefined &&
      !this.canHavePracticePromotion(category)
    ) {
      throw new BadRequestException(
        `Practice promotion is only available for actively practicing members. ` +
          `Category ${getCategoryDisplayName(category)} does not qualify.`,
      );
    }

    // Validate shadowing
    if (dto.osot_shadowing !== undefined && !this.canHaveShadowing(category)) {
      throw new BadRequestException(
        `Shadowing availability is only for professionals with active or recent experience. ` +
          `Category ${getCategoryDisplayName(category)} does not qualify.`,
      );
    }

    // Validate psychotherapy supervision
    if (
      dto.osot_psychotherapy_supervision !== undefined &&
      !this.canHavePsychotherapySupervision(category)
    ) {
      throw new BadRequestException(
        `Psychotherapy supervision is only available for certified OT practitioners. ` +
          `Category ${getCategoryDisplayName(category)} does not qualify.`,
      );
    }

    // Validate search tools
    const extendedDto = dto as UpdateMembershipPreferenceDto &
      ExtendedPreferenceDto;
    if (
      (extendedDto.osot_search_tools ||
        extendedDto.osot_members_search_tools) !== undefined
    ) {
      // Get search tools from either field name (legacy support)
      const searchToolsValue =
        extendedDto.osot_search_tools || extendedDto.osot_members_search_tools;

      // Convert single value to array for validation
      const searchToolsArray = Array.isArray(searchToolsValue)
        ? searchToolsValue
        : [searchToolsValue];

      if (!this.areSearchToolsAllowed(category, searchToolsArray)) {
        const allowedTools = this.getAllowedSearchTools(category);
        const allowedToolsStr =
          allowedTools === null
            ? 'all search tools'
            : allowedTools.length === 0
              ? 'no search tools'
              : allowedTools.join(', ');

        throw new BadRequestException(
          `Search tools provided are not allowed for category ${getCategoryDisplayName(category)}. ` +
            `Allowed tools: ${allowedToolsStr}.`,
        );
      }
    }

    this.logger.debug(`Update DTO validation passed for category: ${category}`);
  }

  /**
   * Gets applicable fields for a category
   * @param category - Membership category
   * @returns Object with field availability flags
   *
   * **Usage:** For UI to show/hide fields dynamically
   */
  getApplicableFields(category: Category): {
    autoRenewal: boolean;
    thirdParties: boolean;
    practicePromotion: boolean;
    searchTools: boolean;
    searchToolsOptions: SearchTools[] | null;
    shadowing: boolean;
    psychotherapySupervision: boolean;
  } {
    return {
      autoRenewal: this.canHaveAutoRenewal(category),
      thirdParties: this.canHaveThirdParties(category),
      practicePromotion: this.canHavePracticePromotion(category),
      searchTools:
        this.getAllowedSearchTools(category) !== null &&
        (this.getAllowedSearchTools(category) || []).length > 0,
      searchToolsOptions: this.getAllowedSearchTools(category),
      shadowing: this.canHaveShadowing(category),
      psychotherapySupervision: this.canHavePsychotherapySupervision(category),
    };
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Validates if a user is changing from one category to another
   * and clears fields that are no longer applicable
   *
   * @param oldCategory - Previous membership category
   * @param newCategory - New membership category
   * @returns Array of field names that should be cleared
   *
   * **Usage:** When a member's category changes (e.g., student → new grad → practicing)
   *
   * **Example:**
   * ```typescript
   * const fieldsToClear = businessRules.getFieldsToClearOnCategoryChange(
   *   Category.OT_STU,
   *   Category.OT_NG
   * );
   * // Returns: [] (no fields to clear, both have same limited access)
   * ```
   */
  getFieldsToClearOnCategoryChange(
    oldCategory: Category,
    newCategory: Category,
  ): string[] {
    const fieldsToClear: string[] = [];

    // Check each field
    if (
      this.canHaveAutoRenewal(oldCategory) &&
      !this.canHaveAutoRenewal(newCategory)
    ) {
      fieldsToClear.push('autoRenewal');
    }

    if (
      this.canHavePracticePromotion(oldCategory) &&
      !this.canHavePracticePromotion(newCategory)
    ) {
      fieldsToClear.push('practicePromotion');
    }

    if (
      this.canHaveShadowing(oldCategory) &&
      !this.canHaveShadowing(newCategory)
    ) {
      fieldsToClear.push('shadowing');
    }

    if (
      this.canHavePsychotherapySupervision(oldCategory) &&
      !this.canHavePsychotherapySupervision(newCategory)
    ) {
      fieldsToClear.push('psychotherapySupervision');
    }

    // Check search tools
    const oldTools = this.getAllowedSearchTools(oldCategory);
    const newTools = this.getAllowedSearchTools(newCategory);

    if (
      oldTools !== null &&
      (newTools === null || newTools.length < (oldTools?.length || 0))
    ) {
      // Search tools restrictions changed, may need to clear some
      fieldsToClear.push('searchTools');
    }

    this.logger.debug(
      `Category change from ${oldCategory} to ${newCategory} requires clearing fields: ${fieldsToClear.join(', ')}`,
    );

    return fieldsToClear;
  }

  /**
   * Gets fields that become available when changing category
   *
   * @param oldCategory - Previous membership category
   * @param newCategory - New membership category
   * @returns Array of field names that are now available
   *
   * **Usage:** To notify users of new features available after category upgrade
   */
  getNewlyAvailableFields(
    oldCategory: Category,
    newCategory: Category,
  ): string[] {
    const newFields: string[] = [];

    // Check each field
    if (
      !this.canHaveAutoRenewal(oldCategory) &&
      this.canHaveAutoRenewal(newCategory)
    ) {
      newFields.push('autoRenewal');
    }

    if (
      !this.canHavePracticePromotion(oldCategory) &&
      this.canHavePracticePromotion(newCategory)
    ) {
      newFields.push('practicePromotion');
    }

    if (
      !this.canHaveShadowing(oldCategory) &&
      this.canHaveShadowing(newCategory)
    ) {
      newFields.push('shadowing');
    }

    if (
      !this.canHavePsychotherapySupervision(oldCategory) &&
      this.canHavePsychotherapySupervision(newCategory)
    ) {
      newFields.push('psychotherapySupervision');
    }

    // Check search tools
    const oldTools = this.getAllowedSearchTools(oldCategory);
    const newTools = this.getAllowedSearchTools(newCategory);

    if (
      newTools !== null &&
      (oldTools === null || newTools.length > (oldTools?.length || 0))
    ) {
      newFields.push('searchTools');
    }

    this.logger.debug(
      `Category change from ${oldCategory} to ${newCategory} makes new fields available: ${newFields.join(', ')}`,
    );

    return newFields;
  }
}

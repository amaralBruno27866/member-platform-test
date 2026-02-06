/**
 * Entity Mappers
 *
 * Data transformation utilities for entity creation in the Membership Orchestrator.
 * Handles mapping membership registration data to individual entity creation requests.
 */

import {
  CompleteMembershipRegistrationDto,
  MembershipEntityType,
} from '../index';

// ========================================
// ENTITY DATA MAPPING
// ========================================

/**
 * Maps membership registration data to individual entity creation requests
 */
export class MembershipEntityDataMapper {
  /**
   * Extract membership category data for creation
   */
  static toCategoryData(registrationData: CompleteMembershipRegistrationDto) {
    return registrationData.category;
  }

  /**
   * Extract membership employment data for creation
   */
  static toEmploymentData(registrationData: CompleteMembershipRegistrationDto) {
    return registrationData.employment;
  }

  /**
   * Extract membership practices data for creation
   */
  static toPracticesData(registrationData: CompleteMembershipRegistrationDto) {
    return registrationData.practices;
  }

  /**
   * Extract membership preferences data for creation
   */
  static toPreferencesData(
    registrationData: CompleteMembershipRegistrationDto,
  ) {
    return registrationData.preferences;
  }

  /**
   * Extract membership settings data for creation
   */
  static toSettingsData(registrationData: CompleteMembershipRegistrationDto) {
    return registrationData.settings;
  }

  /**
   * Extract insurance/product selection data
   */
  static toInsuranceData(registrationData: CompleteMembershipRegistrationDto) {
    return registrationData.insuranceSelection;
  }

  /**
   * Extract payment information data
   */
  static toPaymentData(registrationData: CompleteMembershipRegistrationDto) {
    return registrationData.paymentInfo;
  }

  /**
   * Get entity data by type
   */
  static getEntityData(
    registrationData: CompleteMembershipRegistrationDto,
    entityType: MembershipEntityType,
  ) {
    switch (entityType) {
      case 'membership-category':
        return this.toCategoryData(registrationData);
      case 'membership-employment':
        return this.toEmploymentData(registrationData);
      case 'membership-practices':
        return this.toPracticesData(registrationData);
      case 'membership-preferences':
        return this.toPreferencesData(registrationData);
      case 'membership-settings':
        return this.toSettingsData(registrationData);
      case 'product-insurance':
        return this.toInsuranceData(registrationData);
      default:
        throw new Error(`Unknown entity type: ${String(entityType)}`);
    }
  }

  /**
   * Check if entity data is provided
   */
  static hasEntityData(
    registrationData: CompleteMembershipRegistrationDto,
    entityType: MembershipEntityType,
  ): boolean {
    const data = this.getEntityData(registrationData, entityType);
    return data !== undefined && data !== null;
  }

  /**
   * Get list of entities to be created based on provided data
   */
  static getEntitiesToCreate(
    registrationData: CompleteMembershipRegistrationDto,
  ): MembershipEntityType[] {
    const entities: MembershipEntityType[] = [];

    // Category is always required
    if (this.hasEntityData(registrationData, 'membership-category')) {
      entities.push('membership-category');
    }

    // Employment if provided
    if (this.hasEntityData(registrationData, 'membership-employment')) {
      entities.push('membership-employment');
    }

    // Practices if provided
    if (this.hasEntityData(registrationData, 'membership-practices')) {
      entities.push('membership-practices');
    }

    // Preferences if provided
    if (this.hasEntityData(registrationData, 'membership-preferences')) {
      entities.push('membership-preferences');
    }

    // Settings if provided
    if (this.hasEntityData(registrationData, 'membership-settings')) {
      entities.push('membership-settings');
    }

    // Insurance if provided
    if (this.hasEntityData(registrationData, 'product-insurance')) {
      entities.push('product-insurance');
    }

    return entities;
  }

  /**
   * Extract account context information
   */
  static extractAccountContext(
    registrationData: CompleteMembershipRegistrationDto,
  ) {
    return {
      accountId: registrationData.accountId,
      organizationId: registrationData.organizationId, // NEW - for multi-tenant
      membershipYear: registrationData.membershipYear,
    };
  }

  /**
   * Build @odata.bind string for account reference
   * Used by all membership entities to link to parent account
   */
  static buildAccountBind(accountId: string): string {
    return `/osot_table_accounts(${accountId})`;
  }

  /**
   * Build @odata.bind string for organization reference
   * Used by all membership entities for multi-tenant isolation
   */
  static buildOrganizationBind(organizationId: string): string {
    return `/osot_table_organizations(${organizationId})`;
  }

  /**
   * Extract pricing context information
   */
  static extractPricingContext(
    registrationData: CompleteMembershipRegistrationDto,
  ) {
    return {
      categoryId: registrationData.category?.osot_membership_category,
      insuranceSelection: registrationData.insuranceSelection,
      membershipYear: registrationData.membershipYear,
    };
  }

  /**
   * Extract payment context information
   */
  static extractPaymentContext(
    registrationData: CompleteMembershipRegistrationDto,
  ) {
    return {
      paymentInfo: registrationData.paymentInfo,
      insuranceSelection: registrationData.insuranceSelection,
    };
  }
}

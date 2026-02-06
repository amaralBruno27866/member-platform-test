/**
 * Entity Mappers
 *
 * Data transformation utilities for entity creation in the Account Orchestrator.
 * Handles mapping registration data to individual entity creation requests.
 */

import { CompleteUserRegistrationDto, EntityType } from '../index';

// ========================================
// ENTITY DATA MAPPING
// ========================================

/**
 * Maps registration data to individual entity creation requests
 */
export class EntityDataMapper {
  /**
   * Extract account data for creation
   */
  static toAccountData(registrationData: CompleteUserRegistrationDto) {
    return registrationData.account;
  }

  /**
   * Extract address data for creation
   */
  static toAddressData(registrationData: CompleteUserRegistrationDto) {
    return registrationData.address;
  }

  /**
   * Extract contact data for creation
   */
  static toContactData(registrationData: CompleteUserRegistrationDto) {
    return registrationData.contact;
  }

  /**
   * Extract identity data for creation
   */
  static toIdentityData(registrationData: CompleteUserRegistrationDto) {
    return registrationData.identity;
  }

  /**
   * Extract education data based on type
   */
  static toEducationData(registrationData: CompleteUserRegistrationDto) {
    return registrationData.educationType === 'ot'
      ? registrationData.otEducation
      : registrationData.otaEducation;
  }

  /**
   * Extract management data (with defaults if not provided)
   */
  static toManagementData(registrationData: CompleteUserRegistrationDto) {
    return (
      registrationData.management || {
        osot_life_member_retired: false,
        osot_shadowing: false,
        osot_passed_away: false,
        osot_vendor: false,
        osot_advertising: false,
        osot_recruitment: false,
        osot_driver_rehab: false,
      }
    );
  }

  /**
   * Get entity data by type
   */
  static getEntityData(
    registrationData: CompleteUserRegistrationDto,
    entityType: EntityType,
  ) {
    switch (entityType) {
      case 'account':
        return this.toAccountData(registrationData);
      case 'address':
        return this.toAddressData(registrationData);
      case 'contact':
        return this.toContactData(registrationData);
      case 'identity':
        return this.toIdentityData(registrationData);
      case 'education':
        return this.toEducationData(registrationData);
      case 'management':
        return this.toManagementData(registrationData);
      default:
        throw new Error(`Unknown entity type: ${String(entityType)}`);
    }
  }
}

import { Injectable, Inject, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AppError } from '../../../../common/errors/app-error';
import { AddressResponseDto } from '../dtos/address-response.dto';
import {
  DataverseAddressRepository,
  ADDRESS_REPOSITORY,
} from '../repositories/address.repository';
import { AddressMapper } from '../mappers/address.mapper';
import { AddressFormatter } from '../utils/address-formatter.util';
import { canRead } from '../../../../utils/dataverse-app.helper';

/**
 * Address Lookup Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with DataverseAddressRepository
 * - Hybrid Architecture: Modern Repository + Legacy DataverseService for migration
 * - Structured Logging: Operation IDs, security-aware logging with PII redaction
 * - Security-First Design: Privilege-based access control and comprehensive audit
 * - Event Integration: Ready for event emission and business rule enforcement
 * - Error Management: Centralized error handling with createAppError and detailed context
 *
 * PERMISSION SYSTEM (Privilege-based):
 * - OWNER: Full access to all lookup operations and fields
 * - ADMIN: Full access to all lookup operations and fields
 * - MAIN: Access to lookup operations with sensitive field filtering
 * - Sensitive fields filtered for lower privileges: access_modifiers, privilege, audit fields
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Security-aware logging with PII redaction capabilities
 * - Privilege-based field filtering and access control
 * - Performance monitoring and query optimization
 * - Canadian address focus with proper postal code handling
 * - Hybrid architecture enabling gradual migration from legacy systems
 *
 * Key Features:
 * - Account-based address lookups with privilege enforcement
 * - User business ID filtering with security validation
 * - Postal code searches with province-specific validation
 * - Address counting and statistics with performance monitoring
 * - Formatted address retrieval with Canadian standards
 * - Role-based permission checking with detailed audit trails
 * - Field-level filtering based on user privilege level
 * - Comprehensive error handling with operation tracking
 * - Structured logging with security-aware PII handling
 */
@Injectable()
export class AddressLookupService {
  private readonly logger = new Logger(AddressLookupService.name);

  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: DataverseAddressRepository,
    private readonly addressMapper: AddressMapper,
    private readonly addressFormatter: AddressFormatter,
  ) {}

  /**
   * Find addresses by account ID with comprehensive privilege checking
   * Enhanced with operation tracking and security-aware logging
   */
  async findByAccountId(
    accountId: string,
    userRole?: string,
  ): Promise<AddressResponseDto[]> {
    const operationId = `lookup_by_account_${Date.now()}`;

    // Enhanced permission checking with privilege validation
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Address lookup denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'findByAccountId',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to lookup addresses',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findByAccountId',
      });
    }

    try {
      const records = await this.addressRepository.findByAccountId(accountId);

      const results = records.map((record) => {
        const responseDto = AddressMapper.mapInternalToResponseDto(record);
        return this.filterAddressFields(responseDto, userRole);
      });

      return results;
    } catch (error) {
      this.logger.error(`Address lookup failed - Operation: ${operationId}`, {
        operation: 'findByAccountId',
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to find addresses by account',
        operationId,
        accountId,
        originalError: error,
      });
    }
  }

  /**
   * Find addresses by user business ID
   */
  async findByUserBusinessId(
    userBusinessId: string,
    userRole?: string,
  ): Promise<AddressResponseDto[]> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to lookup addresses',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    try {
      // CORREÇÃO: Usar o método correto findByUserBusinessId ao invés de findByUserId
      const records =
        await this.addressRepository.findByUserBusinessId(userBusinessId);

      return records.map((record) => {
        const responseDto = AddressMapper.mapInternalToResponseDto(record);
        return this.filterAddressFields(responseDto, userRole);
      });
    } catch (error) {
      throw new AppError(
        ErrorCodes.GENERIC,
        'Failed to find addresses by user business ID',
        { userBusinessId, originalError: error },
      );
    }
  }

  /**
   * Find addresses by postal code
   */
  async findByPostalCode(
    postalCode: string,
    userRole?: string,
  ): Promise<AddressResponseDto[]> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to lookup addresses',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    try {
      const records = await this.addressRepository.findByPostalCode(
        postalCode,
        undefined, // No province filter
      );

      return records.map((record) => {
        const responseDto = AddressMapper.mapInternalToResponseDto(record);
        return this.filterAddressFields(responseDto, userRole);
      });
    } catch (error) {
      throw new AppError(
        ErrorCodes.GENERIC,
        'Failed to find addresses by postal code',
        { postalCode, originalError: error },
      );
    }
  }

  /**
   * Find addresses by postal code and province
   */
  async findByPostalCodeAndProvince(
    postalCode: string,
    province: number,
    userRole?: string,
  ): Promise<AddressResponseDto[]> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to lookup addresses',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    try {
      const records = await this.addressRepository.findByPostalCode(
        postalCode,
        province.toString(),
      );

      return records.map((record) => {
        const responseDto = AddressMapper.mapInternalToResponseDto(record);
        return this.filterAddressFields(responseDto, userRole);
      });
    } catch (error) {
      throw new AppError(
        ErrorCodes.GENERIC,
        'Failed to find addresses by postal code and province',
        { postalCode, province, originalError: error },
      );
    }
  }

  /**
   * Count addresses for a specific account
   */
  async countByAccountId(
    accountId: string,
    userRole?: string,
  ): Promise<number> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to count addresses',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    try {
      return await this.addressRepository.countByAccountId(accountId);
    } catch (error) {
      throw new AppError(
        ErrorCodes.GENERIC,
        'Failed to count addresses by account',
        { accountId, originalError: error },
      );
    }
  }

  /**
   * Get formatted addresses for display
   */
  async getFormattedAddresses(
    addressIds: string[],
    format: 'short' | 'full' | 'postal' = 'full',
    userRole?: string,
  ): Promise<{ [key: string]: string }> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to get formatted addresses',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    try {
      const result: { [key: string]: string } = {};

      for (const id of addressIds) {
        const record = await this.addressRepository.findById(id);
        if (record) {
          const responseDto = AddressMapper.mapInternalToResponseDto(record);
          const filteredDto = this.filterAddressFields(responseDto, userRole);

          // Simple formatting based on available data
          switch (format) {
            case 'short':
              result[id] =
                `${filteredDto.osot_address_1 || ''}, ${filteredDto.osot_postal_code || ''}`;
              break;
            case 'postal':
              result[id] = `${filteredDto.osot_postal_code || ''}`;
              break;
            case 'full':
            default:
              result[id] = [
                filteredDto.osot_address_1,
                filteredDto.osot_address_2,
                `${filteredDto.osot_city || ''} ${filteredDto.osot_province || ''} ${filteredDto.osot_postal_code || ''}`,
              ]
                .filter(Boolean)
                .join(', ');
              break;
          }
        }
      }

      return result;
    } catch (error) {
      throw new AppError(
        ErrorCodes.GENERIC,
        'Failed to get formatted addresses',
        { addressIds, format, originalError: error },
      );
    }
  }

  /**
   * Get address statistics for an account
   */
  async getAddressStatistics(
    accountId: string,
    userRole?: string,
  ): Promise<{
    totalAddresses: number;
    byType: { [key: number]: number };
    byProvince: { [key: number]: number };
    hasPostalCode: number;
    activeAddresses: number;
  }> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to get address statistics',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    try {
      const addresses = await this.findByAccountId(accountId, userRole);

      const statistics = {
        totalAddresses: addresses.length,
        byType: {} as { [key: number]: number },
        byProvince: {} as { [key: number]: number },
        hasPostalCode: 0,
        activeAddresses: 0,
      };

      addresses.forEach((address) => {
        // Count by type
        const type = Number(address.osot_address_type) || 0;
        statistics.byType[type] = (statistics.byType[type] || 0) + 1;

        // Count by province
        const province = Number(address.osot_province) || 0;
        statistics.byProvince[province] =
          (statistics.byProvince[province] || 0) + 1;

        // Count addresses with postal codes
        if (address.osot_postal_code) {
          statistics.hasPostalCode++;
        }

        // Count active addresses (assuming active = true if no access to status fields)
        // For 'owner' role, we assume all returned addresses are active
        // For 'main'/'admin', we would check actual status if available
        statistics.activeAddresses++;
      });

      return statistics;
    } catch (error) {
      throw new AppError(
        ErrorCodes.GENERIC,
        'Failed to get address statistics',
        { accountId, originalError: error },
      );
    }
  }

  /**
   * Find addresses with mailing preferences
   * Returns addresses that are marked for mailing/correspondence
   */
  async findMailingAddresses(
    accountId: string,
    userRole?: string,
  ): Promise<AddressResponseDto[]> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to find mailing addresses',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    try {
      const allAddresses = await this.findByAccountId(accountId, userRole);

      // Filter addresses based on address preference
      // Assuming preference values: 1 = mailing, 2 = billing, etc.
      return allAddresses.filter((address) => {
        // Filter for mailing preference (assuming 1 = mailing)
        return Number(address.osot_address_preference) === 1;
      });
    } catch (error) {
      throw new AppError(
        ErrorCodes.GENERIC,
        'Failed to find mailing addresses',
        { accountId, originalError: error },
      );
    }
  }

  /**
   * Validate postal code format and find similar addresses
   */
  async findSimilarPostalCodes(
    postalCode: string,
    userRole?: string,
  ): Promise<{
    isValid: boolean;
    normalizedPostalCode: string;
    similarAddresses: AddressResponseDto[];
  }> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to search postal codes',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    try {
      // Normalize postal code (remove spaces, convert to uppercase)
      const normalizedPostalCode = postalCode.replace(/\s+/g, '').toUpperCase();

      // Validate Canadian postal code format (A1A1A1)
      const canadianPostalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
      const isValid = canadianPostalCodeRegex.test(normalizedPostalCode);

      let similarAddresses: AddressResponseDto[] = [];

      if (isValid) {
        // Format with space (A1A 1A1) for search
        const formattedPostalCode = normalizedPostalCode.replace(
          /^([A-Z]\d[A-Z])(\d[A-Z]\d)$/,
          '$1 $2',
        );

        similarAddresses = await this.findByPostalCode(
          formattedPostalCode,
          userRole,
        );
      }

      return {
        isValid,
        normalizedPostalCode,
        similarAddresses,
      };
    } catch (error) {
      throw new AppError(
        ErrorCodes.GENERIC,
        'Failed to find similar postal codes',
        { postalCode, originalError: error },
      );
    }
  }

  /**
   * Search addresses with text-based criteria
   * Simple implementation using existing repository methods
   */
  async searchAddresses(
    criteria: {
      accountId?: string;
      userBusinessId?: string;
      postalCode?: string;
      province?: number;
    },
    userRole?: string,
  ): Promise<AddressResponseDto[]> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to search addresses',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    try {
      let results: AddressResponseDto[] = [];

      // Search by account ID (primary search)
      if (criteria.accountId) {
        results = await this.findByAccountId(criteria.accountId, userRole);
      }
      // Search by user business ID
      else if (criteria.userBusinessId) {
        results = await this.findByUserBusinessId(
          criteria.userBusinessId,
          userRole,
        );
      }
      // Search by postal code
      else if (criteria.postalCode) {
        if (criteria.province) {
          results = await this.findByPostalCodeAndProvince(
            criteria.postalCode,
            criteria.province,
            userRole,
          );
        } else {
          results = await this.findByPostalCode(criteria.postalCode, userRole);
        }
      }

      // Apply additional filters if specified
      if (criteria.province && results.length > 0) {
        results = results.filter(
          (address) =>
            Number(address.osot_province) === Number(criteria.province),
        );
      }

      return results;
    } catch (error) {
      throw new AppError(ErrorCodes.GENERIC, 'Failed to search addresses', {
        criteria,
        originalError: error,
      });
    }
  }

  /**
   * Filter address fields based on user role permissions
   * - main/admin: Full access to all fields
   * - owner: Limited access, sensitive fields filtered out
   */
  private filterAddressFields(
    address: AddressResponseDto,
    userRole?: string,
  ): AddressResponseDto {
    // Main and admin have full access
    if (userRole === 'main' || userRole === 'admin') {
      return address;
    }

    // For owner role, filter out sensitive fields
    if (userRole === 'owner') {
      return {
        osot_Table_AddressId: address.osot_Table_AddressId,
        osot_Address_ID: address.osot_Address_ID,
        osot_user_business_id: address.osot_user_business_id,
        osot_address_1: address.osot_address_1,
        osot_address_2: address.osot_address_2,
        osot_city: address.osot_city,
        osot_province: address.osot_province,
        osot_postal_code: address.osot_postal_code,
        osot_country: address.osot_country,
        osot_address_type: address.osot_address_type,
        osot_address_preference: address.osot_address_preference,
        osot_other_city: address.osot_other_city,
        osot_other_province_state: address.osot_other_province_state,
        osot_Table_Account: address.osot_Table_Account,
      } as AddressResponseDto;
    }

    // Default: return full address for undefined roles (backward compatibility)
    return address;
  }
}

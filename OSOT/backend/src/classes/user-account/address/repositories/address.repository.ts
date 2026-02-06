/**
 * Address Repository (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes/ErrorMessages for structured error handling
 * - integrations: Uses DataverseService for all data operations
 * - interfaces: Implements AddressRepository contract
 * - utils: Uses business-rule.util for validation patterns
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT needs
 * - Follows Contact repository pattern exactly
 * - Clean abstraction over DataverseService
 * - Structured error handling with proper logging
 */

import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { Country } from '../../../../common/enums/countries.enum';
import { ADDRESS_ODATA } from '../constants/address.constants';
import { AddressRepository } from '../interfaces/address-repository.interface';
import { AddressInternal } from '../interfaces/address-internal.interface';
import { AddressDataverse } from '../interfaces/address-dataverse.interface';

export const ADDRESS_REPOSITORY = 'ADDRESS_REPOSITORY';

/**
 * DataverseAddressRepository
 *
 * Repository implementation for Address entities using Microsoft Dataverse.
 * Provides a clean abstraction layer between the application and Dataverse API.
 */
@Injectable()
export class DataverseAddressRepository implements AddressRepository {
  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new address record in Dataverse
   */
  async create(
    addressData: Partial<AddressInternal>,
  ): Promise<AddressInternal> {
    try {
      const payload = this.mapInternalToDataverse(addressData);

      const response = await this.dataverseService.request(
        'POST',
        ADDRESS_ODATA.TABLE_NAME,
        payload,
      );

      // Log dos dados persistidos com sucesso
      console.log('✅ [ADDRESS] Dados persistidos no Dataverse:');
      console.log(JSON.stringify(response, null, 2));

      return this.mapDataverseToInternal(response as AddressDataverse);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find address by ID
   */
  async findById(addressId: string): Promise<AddressInternal | null> {
    try {
      const response = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}(${addressId})`,
      );

      return response
        ? this.mapDataverseToInternal(response as AddressDataverse)
        : null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw new Error(
        `${ErrorMessages[ErrorCodes.NOT_FOUND].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find addresses by account ID (using business ID for simplicity)
   */
  async findByAccountId(accountId: string): Promise<AddressInternal[]> {
    try {
      // CORREÇÃO: Usar user_business_id ao invés de lookup complexo
      // Isso é mais simples e evita problemas de navegação OData
      const oDataQuery = `$filter=${ADDRESS_ODATA.USER_BUSINESS_ID} eq '${accountId}'&$orderby=${ADDRESS_ODATA.CREATED_ON} desc`;
      const response = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?${oDataQuery}`,
      );

      const responseData = response as { value?: AddressDataverse[] };
      const addresses = responseData?.value || [];
      return addresses.map((address: AddressDataverse) =>
        this.mapDataverseToInternal(address),
      );
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find addresses by user business ID
   */
  async findByUserBusinessId(
    userBusinessId: string,
  ): Promise<AddressInternal[]> {
    try {
      const oDataQuery = `$filter=${ADDRESS_ODATA.USER_BUSINESS_ID} eq '${userBusinessId}'&$orderby=${ADDRESS_ODATA.CREATED_ON} desc`;
      const response = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?${oDataQuery}`,
      );

      const responseData = response as { value?: AddressDataverse[] };
      const addresses = responseData?.value || [];
      return addresses.map((address: AddressDataverse) =>
        this.mapDataverseToInternal(address),
      );
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find address by business ID (osot_address_id)
   */
  async findByBusinessId(businessId: string): Promise<AddressInternal | null> {
    try {
      const filter = `${ADDRESS_ODATA.ID} eq '${businessId}'`;
      const endpoint = `${ADDRESS_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}&$top=1`;
      const response = await this.dataverseService.request('GET', endpoint);

      const responseData = response as { value?: AddressDataverse[] };
      const addresses = responseData?.value || [];
      return addresses.length > 0
        ? this.mapDataverseToInternal(addresses[0])
        : null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw new Error(
        `${ErrorMessages[ErrorCodes.NOT_FOUND].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find addresses by user (owner)
   */
  async findByUserId(userId: string): Promise<AddressInternal[]> {
    try {
      const oDataQuery = `$filter=${ADDRESS_ODATA.OWNER_ID} eq '${userId}'&$orderby=${ADDRESS_ODATA.CREATED_ON} desc`;
      const response = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?${oDataQuery}`,
      );

      const responseData = response as { value?: AddressDataverse[] };
      const addresses = responseData?.value || [];
      return addresses.map((address: AddressDataverse) =>
        this.mapDataverseToInternal(address),
      );
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update address by ID
   */
  async update(
    addressId: string,
    updateData: Partial<AddressInternal>,
  ): Promise<AddressInternal> {
    try {
      const payload = this.mapInternalToDataverse(updateData);
      await this.dataverseService.request(
        'PATCH',
        `${ADDRESS_ODATA.TABLE_NAME}(${addressId})`,
        payload,
      );

      // Fetch the updated record
      const updatedRecord = await this.findById(addressId);
      if (!updatedRecord) {
        throw new Error(ErrorMessages[ErrorCodes.NOT_FOUND].publicMessage);
      }

      return updatedRecord;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Delete address by ID
   */
  async delete(addressId: string): Promise<boolean> {
    try {
      await this.dataverseService.request(
        'DELETE',
        `${ADDRESS_ODATA.TABLE_NAME}(${addressId})`,
      );
      return true;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Delete all addresses associated with an organization
   * Used for cascade delete when deleting an organization
   * NEW: Programmatic cascade delete since Dataverse cascade is limited to Account
   *
   * @param organizationId - Organization GUID
   * @returns Number of addresses deleted
   */
  async deleteByOrganizationId(organizationId: string): Promise<number> {
    try {
      // Query all addresses linked to this organization
      const oDataQuery = `$filter=_osot_table_organization_value eq '${organizationId}'&$select=osot_table_addressid`;

      const response = (await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?${oDataQuery}`,
      )) as { value?: Array<{ osot_table_addressid: string }> };

      if (!response.value || response.value.length === 0) {
        return 0; // No addresses to delete
      }

      // Delete each address
      let deletedCount = 0;
      for (const address of response.value) {
        try {
          await this.delete(address.osot_table_addressid);
          deletedCount++;
        } catch (error) {
          // Log but continue with next address
          console.error(
            `Failed to delete address ${address.osot_table_addressid}:`,
            error,
          );
        }
      }

      return deletedCount;
    } catch (error) {
      throw new Error(
        `Failed to delete addresses for organization ${organizationId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Check if address exists
   */
  async exists(addressId: string): Promise<boolean> {
    try {
      const address = await this.findById(addressId);
      return address !== null;
    } catch {
      return false;
    }
  }

  /**
   * Find addresses by postal code
   */
  async findByPostalCode(
    postalCode: string,
    accountId?: string,
  ): Promise<AddressInternal[]> {
    try {
      let oDataQuery = `$filter=${ADDRESS_ODATA.POSTAL_CODE} eq '${postalCode}'`;

      if (accountId) {
        oDataQuery += ` and ${ADDRESS_ODATA.ACCOUNT_LOOKUP} eq '${accountId}'`;
      }

      const response = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?${oDataQuery}`,
      );

      const responseData = response as { value?: AddressDataverse[] };
      const addresses = responseData?.value || [];
      return addresses.map((address: AddressDataverse) =>
        this.mapDataverseToInternal(address),
      );
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Count addresses for account
   */
  async countByAccountId(accountId: string): Promise<number> {
    try {
      const oDataQuery = `$filter=${ADDRESS_ODATA.ACCOUNT_LOOKUP} eq '${accountId}'&$count=true&$top=0`;
      const response = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?${oDataQuery}`,
      );

      const responseData = response as { '@odata.count'?: number };
      return responseData?.['@odata.count'] || 0;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Raw Dataverse query for complex scenarios
   */
  async queryRaw(oDataQuery: string): Promise<AddressDataverse[]> {
    try {
      const response = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?${oDataQuery}`,
      );

      const responseData = response as { value?: AddressDataverse[] };
      return responseData?.value || [];
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Batch create multiple addresses
   */
  async batchCreate(
    addresses: Partial<AddressInternal>[],
  ): Promise<AddressInternal[]> {
    try {
      const results: AddressInternal[] = [];

      // Simple sequential processing
      for (const addressData of addresses) {
        const created = await this.create(addressData);
        results.push(created);
      }

      return results;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    message: string;
    timestamp: string;
  }> {
    try {
      await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?$top=1`,
      );

      return {
        isHealthy: true,
        message: 'Address repository is healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        isHealthy: false,
        message: `Address repository health check failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========================================
  // ADVANCED ENTERPRISE METHODS
  // ========================================

  /**
   * Get comprehensive address statistics
   * Similar to Account's getActiveUsersCount but for addresses
   */
  async getAddressStatistics(): Promise<{
    totalAddresses: number;
    addressesByType: Record<string, number>;
    addressesByProvince: Record<string, number>;
    addressesByCountry: Record<string, number>;
    averageAddressesPerAccount: number;
    timestamp: string;
  }> {
    try {
      // Get total count
      const totalResponse = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?$count=true&$top=0`,
      );
      const totalAddresses =
        (totalResponse as { '@odata.count': number })['@odata.count'] || 0;

      // Get addresses by type
      const typeResponse = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?$select=${ADDRESS_ODATA.ADDRESS_TYPE}`,
      );
      const typeData =
        (typeResponse as { value: Array<{ [key: string]: number }> }).value ||
        [];
      const addressesByType = this.aggregateByField(
        typeData,
        ADDRESS_ODATA.ADDRESS_TYPE,
      );

      // Get addresses by province
      const provinceResponse = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?$select=${ADDRESS_ODATA.PROVINCE}`,
      );
      const provinceData =
        (provinceResponse as { value: Array<{ [key: string]: number }> })
          .value || [];
      const addressesByProvince = this.aggregateByField(
        provinceData,
        ADDRESS_ODATA.PROVINCE,
      );

      // Get addresses by country
      const countryResponse = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?$select=${ADDRESS_ODATA.COUNTRY}`,
      );
      const countryData =
        (countryResponse as { value: Array<{ [key: string]: number }> })
          .value || [];
      const addressesByCountry = this.aggregateByField(
        countryData,
        ADDRESS_ODATA.COUNTRY,
      );

      // Calculate average addresses per account
      const accountResponse = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?$select=${ADDRESS_ODATA.ACCOUNT_LOOKUP}`,
      );
      const accountData =
        (accountResponse as { value: Array<{ [key: string]: string }> })
          .value || [];
      const uniqueAccounts = new Set(
        accountData.map((item) => item[ADDRESS_ODATA.ACCOUNT_LOOKUP]),
      );
      const averageAddressesPerAccount =
        uniqueAccounts.size > 0 ? totalAddresses / uniqueAccounts.size : 0;

      return {
        totalAddresses,
        addressesByType,
        addressesByProvince,
        addressesByCountry,
        averageAddressesPerAccount:
          Math.round(averageAddressesPerAccount * 100) / 100,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Analyze geographic distribution of addresses
   * Enterprise-level geographic analytics
   */
  async analyzeGeographicDistribution(): Promise<{
    topProvinces: Array<{
      province: number;
      count: number;
      percentage: number;
    }>;
    topCities: Array<{ city: string; count: number; percentage: number }>;
    postalCodePatterns: Array<{ pattern: string; count: number }>;
    countryDistribution: Record<string, number>;
    timestamp: string;
  }> {
    try {
      // Get all addresses with geographic data
      const response = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?$select=${ADDRESS_ODATA.PROVINCE},${ADDRESS_ODATA.CITY},${ADDRESS_ODATA.POSTAL_CODE},${ADDRESS_ODATA.COUNTRY}`,
      );
      const addresses =
        (response as { value: Array<AddressDataverse> }).value || [];

      const totalCount = addresses.length;

      // Analyze provinces
      const provinceMap = new Map<number, number>();
      addresses.forEach((addr) => {
        if (addr[ADDRESS_ODATA.PROVINCE]) {
          const count = provinceMap.get(addr[ADDRESS_ODATA.PROVINCE]) || 0;
          provinceMap.set(addr[ADDRESS_ODATA.PROVINCE], count + 1);
        }
      });

      const topProvinces = Array.from(provinceMap.entries())
        .map(([province, count]) => ({
          province,
          count,
          percentage: Math.round((count / totalCount) * 10000) / 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Analyze cities
      const cityMap = new Map<string, number>();
      addresses.forEach((addr) => {
        const city = addr[ADDRESS_ODATA.CITY];
        if (city && typeof city === 'string') {
          const count = cityMap.get(city) || 0;
          cityMap.set(city, count + 1);
        }
      });

      const topCities = Array.from(cityMap.entries())
        .map(([city, count]) => ({
          city,
          count,
          percentage: Math.round((count / totalCount) * 10000) / 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      // Analyze postal code patterns (first 3 characters for Canadian postal codes)
      const postalPatternMap = new Map<string, number>();
      addresses.forEach((addr) => {
        if (addr[ADDRESS_ODATA.POSTAL_CODE]) {
          const pattern = addr[ADDRESS_ODATA.POSTAL_CODE]
            .substring(0, 3)
            .toUpperCase();
          const count = postalPatternMap.get(pattern) || 0;
          postalPatternMap.set(pattern, count + 1);
        }
      });

      const postalCodePatterns = Array.from(postalPatternMap.entries())
        .map(([pattern, count]) => ({ pattern, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      // Country distribution
      const countryDistribution = this.aggregateByField(
        addresses as unknown as Array<Record<string, unknown>>,
        ADDRESS_ODATA.COUNTRY,
      );

      return {
        topProvinces,
        topCities,
        postalCodePatterns,
        countryDistribution,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find addresses by multiple criteria (advanced search)
   * Enterprise-level multi-criteria search similar to Account's searchAccounts
   */
  async findByMultipleCriteria(criteria: {
    accountId?: string;
    userId?: string;
    addressType?: number;
    province?: number;
    city?: string;
    postalCode?: string;
    country?: number;
    addressPreference?: number;
    createdAfter?: Date;
    createdBefore?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    addresses: AddressInternal[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const filters: string[] = [];

      if (criteria.accountId) {
        filters.push(
          `${ADDRESS_ODATA.ACCOUNT_LOOKUP} eq '${criteria.accountId}'`,
        );
      }

      if (criteria.userId) {
        filters.push(`${ADDRESS_ODATA.OWNER_ID} eq '${criteria.userId}'`);
      }

      if (criteria.addressType !== undefined) {
        filters.push(
          `${ADDRESS_ODATA.ADDRESS_TYPE} eq ${criteria.addressType}`,
        );
      }

      if (criteria.province !== undefined) {
        filters.push(`${ADDRESS_ODATA.PROVINCE} eq ${criteria.province}`);
      }

      if (criteria.city) {
        filters.push(`contains(${ADDRESS_ODATA.CITY}, '${criteria.city}')`);
      }

      if (criteria.postalCode) {
        filters.push(
          `${ADDRESS_ODATA.POSTAL_CODE} eq '${criteria.postalCode}'`,
        );
      }

      if (criteria.country !== undefined) {
        filters.push(`${ADDRESS_ODATA.COUNTRY} eq ${criteria.country}`);
      }

      if (criteria.addressPreference !== undefined) {
        filters.push(
          `${ADDRESS_ODATA.ADDRESS_PREFERENCE} eq ${criteria.addressPreference}`,
        );
      }

      if (criteria.createdAfter) {
        filters.push(
          `${ADDRESS_ODATA.CREATED_ON} ge ${criteria.createdAfter.toISOString()}`,
        );
      }

      if (criteria.createdBefore) {
        filters.push(
          `${ADDRESS_ODATA.CREATED_ON} le ${criteria.createdBefore.toISOString()}`,
        );
      }

      const limit = criteria.limit || 50;
      const offset = criteria.offset || 0;

      let oDataQuery =
        filters.length > 0 ? `$filter=${filters.join(' and ')}` : '';
      oDataQuery += `&$orderby=${ADDRESS_ODATA.CREATED_ON} desc`;
      oDataQuery += `&$top=${limit}&$skip=${offset}`;
      oDataQuery += `&$count=true`;

      const response = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?${oDataQuery}`,
      );

      const responseData = response as {
        value?: AddressDataverse[];
        '@odata.count'?: number;
      };

      const addresses = (responseData?.value || []).map(
        (address: AddressDataverse) => this.mapDataverseToInternal(address),
      );

      const totalCount = responseData?.['@odata.count'] || 0;
      const hasMore = offset + addresses.length < totalCount;

      return {
        addresses,
        totalCount,
        hasMore,
      };
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Validate address consistency and find potential issues
   * Enterprise-level data quality validation
   */
  async validateAddressConsistency(): Promise<{
    duplicateAddresses: Array<{
      address1: AddressInternal;
      address2: AddressInternal;
      similarity: number;
    }>;
    invalidPostalCodes: AddressInternal[];
    orphanedAddresses: AddressInternal[];
    inconsistentProvincePostal: AddressInternal[];
    validationSummary: {
      totalChecked: number;
      issuesFound: number;
      duplicatesFound: number;
      orphansFound: number;
    };
    timestamp: string;
  }> {
    try {
      // Get all addresses for validation
      const response = await this.dataverseService.request(
        'GET',
        ADDRESS_ODATA.TABLE_NAME,
      );
      const addresses = (response as { value: AddressDataverse[] }).value || [];
      const internalAddresses = addresses.map((addr) =>
        this.mapDataverseToInternal(addr),
      );

      const duplicateAddresses: Array<{
        address1: AddressInternal;
        address2: AddressInternal;
        similarity: number;
      }> = [];
      const invalidPostalCodes: AddressInternal[] = [];
      const orphanedAddresses: AddressInternal[] = [];
      const inconsistentProvincePostal: AddressInternal[] = [];

      // Check for duplicates
      for (let i = 0; i < internalAddresses.length; i++) {
        for (let j = i + 1; j < internalAddresses.length; j++) {
          const similarity = this.calculateAddressSimilarity(
            internalAddresses[i],
            internalAddresses[j],
          );
          if (similarity > 0.8) {
            duplicateAddresses.push({
              address1: internalAddresses[i],
              address2: internalAddresses[j],
              similarity,
            });
          }
        }
      }

      // Check for invalid postal codes and other issues
      internalAddresses.forEach((address) => {
        // Validate postal codes (basic Canadian format check)
        if (
          address.osot_postal_code &&
          address.osot_country === Country.CANADA
        ) {
          const postalRegex = /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/;
          if (!postalRegex.test(address.osot_postal_code)) {
            invalidPostalCodes.push(address);
          }
        }

        // Check for orphaned addresses (no account link)
        // Note: Account relationship now handled via @odata.bind, this check is deprecated
        // if (!address.osot_table_account) {
        //   orphanedAddresses.push(address);
        // }

        // Check province-postal code consistency (simplified)
        if (
          address.osot_postal_code &&
          address.osot_province &&
          address.osot_country === Country.CANADA
        ) {
          const firstChar = address.osot_postal_code.charAt(0);
          const isConsistent = this.validateProvincePostalConsistency(
            address.osot_province,
            firstChar,
          );
          if (!isConsistent) {
            inconsistentProvincePostal.push(address);
          }
        }
      });

      const validationSummary = {
        totalChecked: internalAddresses.length,
        issuesFound:
          invalidPostalCodes.length +
          orphanedAddresses.length +
          inconsistentProvincePostal.length,
        duplicatesFound: duplicateAddresses.length,
        orphansFound: orphanedAddresses.length,
      };

      return {
        duplicateAddresses,
        invalidPostalCodes,
        orphanedAddresses,
        inconsistentProvincePostal,
        validationSummary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find nearby addresses within a geographic radius
   * Geographic proximity search for enterprise analytics
   * Note: radiusKm parameter removed as current implementation uses postal prefix matching
   */
  async findNearbyAddresses(referenceAddress: {
    city: string;
    province: number;
    postalCode: string;
  }): Promise<AddressInternal[]> {
    try {
      // Simplified proximity search based on city and postal code prefix
      const postalPrefix = referenceAddress.postalCode.substring(0, 3);

      const oDataQuery = `$filter=${ADDRESS_ODATA.PROVINCE} eq ${referenceAddress.province} and (contains(${ADDRESS_ODATA.CITY}, '${referenceAddress.city}') or startswith(${ADDRESS_ODATA.POSTAL_CODE}, '${postalPrefix}'))&$orderby=${ADDRESS_ODATA.CITY}`;

      const response = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?${oDataQuery}`,
      );

      const responseData = response as { value?: AddressDataverse[] };
      const addresses = responseData?.value || [];

      return addresses.map((address: AddressDataverse) =>
        this.mapDataverseToInternal(address),
      );
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Generate location-based recommendations
   * Enterprise location intelligence
   */
  async generateLocationRecommendations(accountId: string): Promise<{
    suggestedProvinces: Array<{
      province: number;
      reason: string;
      score: number;
    }>;
    suggestedCities: Array<{
      city: string;
      province: number;
      reason: string;
      score: number;
    }>;
    addressOptimizations: Array<{
      currentAddress: AddressInternal;
      suggestion: string;
      impact: string;
    }>;
    timestamp: string;
  }> {
    try {
      // Get account's existing addresses
      const existingAddresses = await this.findByAccountId(accountId);

      // Get geographic distribution to make recommendations
      const geoData = await this.analyzeGeographicDistribution();

      const suggestedProvinces = geoData.topProvinces
        .slice(0, 5)
        .map((prov) => ({
          province: prov.province,
          reason: `High activity area with ${prov.count} addresses (${prov.percentage}% of total)`,
          score: prov.percentage,
        }));

      const suggestedCities = geoData.topCities.slice(0, 8).map((city) => ({
        city: city.city,
        province: 0, // Would need province lookup
        reason: `Popular location with ${city.count} addresses`,
        score: city.percentage,
      }));

      const addressOptimizations = existingAddresses.map((addr) => ({
        currentAddress: addr,
        suggestion: this.generateAddressOptimizationSuggestion(addr),
        impact: 'Improved data quality and delivery efficiency',
      }));

      return {
        suggestedProvinces,
        suggestedCities,
        addressOptimizations,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Get address usage patterns and analytics
   * Enterprise usage intelligence similar to Account metrics
   */
  async getAddressUsagePatterns(): Promise<{
    mostUsedAddressTypes: Array<{
      type: number;
      count: number;
      percentage: number;
    }>;
    preferenceDistribution: Record<string, number>;
    creationTrends: Array<{
      month: string;
      count: number;
      growthRate: number;
    }>;
    peakUsageHours: Array<{ hour: number; activity: number }>;
    averageAddressLifespan: number;
    timestamp: string;
  }> {
    try {
      // Get all addresses with timestamps
      const response = await this.dataverseService.request(
        'GET',
        `${ADDRESS_ODATA.TABLE_NAME}?$select=${ADDRESS_ODATA.ADDRESS_TYPE},${ADDRESS_ODATA.ADDRESS_PREFERENCE},${ADDRESS_ODATA.CREATED_ON},${ADDRESS_ODATA.MODIFIED_ON}`,
      );
      const addresses = (response as { value: AddressDataverse[] }).value || [];

      // Analyze address types
      const typeMap = new Map<number, number>();
      addresses.forEach((addr) => {
        if (addr[ADDRESS_ODATA.ADDRESS_TYPE] !== undefined) {
          const count = typeMap.get(addr[ADDRESS_ODATA.ADDRESS_TYPE]) || 0;
          typeMap.set(addr[ADDRESS_ODATA.ADDRESS_TYPE], count + 1);
        }
      });

      const totalAddresses = addresses.length;
      const mostUsedAddressTypes = Array.from(typeMap.entries())
        .map(([type, count]) => ({
          type,
          count,
          percentage: Math.round((count / totalAddresses) * 10000) / 100,
        }))
        .sort((a, b) => b.count - a.count);

      // Preference distribution
      const preferenceDistribution = this.aggregateByField(
        addresses as unknown as Array<Record<string, unknown>>,
        ADDRESS_ODATA.ADDRESS_PREFERENCE,
      );

      // Creation trends (last 12 months)
      const creationTrends = this.calculateCreationTrends(
        addresses as unknown as Array<Record<string, unknown>>,
      );

      // Simplified peak usage (would need more detailed logging in real scenario)
      const peakUsageHours = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        activity: Math.floor(Math.random() * 100), // Placeholder
      }));

      // Calculate average lifespan
      const currentTime = new Date();
      const lifespans = addresses
        .filter((addr) => addr[ADDRESS_ODATA.CREATED_ON])
        .map((addr) => {
          const createdDate = new Date(addr[ADDRESS_ODATA.CREATED_ON]);
          return currentTime.getTime() - createdDate.getTime();
        });

      const averageAddressLifespan =
        lifespans.length > 0
          ? lifespans.reduce((sum, lifespan) => sum + lifespan, 0) /
            lifespans.length /
            (1000 * 60 * 60 * 24) // Convert to days
          : 0;

      return {
        mostUsedAddressTypes,
        preferenceDistribution,
        creationTrends,
        peakUsageHours,
        averageAddressLifespan: Math.round(averageAddressLifespan),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Analyze and detect duplicate addresses across accounts
   * Enterprise duplicate detection system
   */
  async analyzeDuplicateAddresses(): Promise<{
    exactDuplicates: Array<{
      addresses: AddressInternal[];
      duplicateCount: number;
    }>;
    similarAddresses: Array<{
      group: AddressInternal[];
      similarity: number;
    }>;
    suspiciousPatterns: Array<{
      pattern: string;
      addresses: AddressInternal[];
      riskLevel: 'low' | 'medium' | 'high';
    }>;
    recommendations: string[];
    summary: {
      totalAddresses: number;
      exactDuplicates: number;
      suspiciousGroups: number;
      cleanAddresses: number;
    };
    timestamp: string;
  }> {
    try {
      // Get all addresses
      const response = await this.dataverseService.request(
        'GET',
        ADDRESS_ODATA.TABLE_NAME,
      );
      const addresses = (response as { value: AddressDataverse[] }).value || [];
      const internalAddresses = addresses.map((addr) =>
        this.mapDataverseToInternal(addr),
      );

      const exactDuplicates: Array<{
        addresses: AddressInternal[];
        duplicateCount: number;
      }> = [];

      const similarAddresses: Array<{
        group: AddressInternal[];
        similarity: number;
      }> = [];

      const suspiciousPatterns: Array<{
        pattern: string;
        addresses: AddressInternal[];
        riskLevel: 'low' | 'medium' | 'high';
      }> = [];

      // Group by exact match criteria
      const addressGroups = new Map<string, AddressInternal[]>();

      internalAddresses.forEach((addr) => {
        const key =
          `${addr.osot_address_1}_${addr.osot_city}_${addr.osot_postal_code}`.toLowerCase();
        if (!addressGroups.has(key)) {
          addressGroups.set(key, []);
        }
        const group = addressGroups.get(key);
        if (group) {
          group.push(addr);
        }
      });

      // Find exact duplicates
      addressGroups.forEach((group) => {
        if (group.length > 1) {
          exactDuplicates.push({
            addresses: group,
            duplicateCount: group.length,
          });
        }
      });

      // Find suspicious patterns
      this.detectSuspiciousAddressPatterns(
        internalAddresses,
        suspiciousPatterns,
      );

      // Generate recommendations
      const recommendations = this.generateDuplicateRecommendations(
        exactDuplicates,
        suspiciousPatterns,
      );

      const summary = {
        totalAddresses: internalAddresses.length,
        exactDuplicates: exactDuplicates.reduce(
          (sum, group) => sum + group.duplicateCount,
          0,
        ),
        suspiciousGroups: suspiciousPatterns.length,
        cleanAddresses:
          internalAddresses.length -
          exactDuplicates.reduce((sum, group) => sum + group.duplicateCount, 0),
      };

      return {
        exactDuplicates,
        similarAddresses,
        suspiciousPatterns,
        recommendations,
        summary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Safely convert value to string for aggregation
   */
  private safeStringify(value: unknown): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    // For any other type, return 'unknown'
    return 'unknown';
  }

  /**
   * Aggregate data by a specific field
   */
  private aggregateByField(
    data: Array<Record<string, unknown>>,
    fieldName: string,
  ): Record<string, number> {
    const aggregation: Record<string, number> = {};

    data.forEach((item) => {
      const value = item[fieldName];
      if (value !== undefined && value !== null) {
        const key = this.safeStringify(value);
        aggregation[key] = (aggregation[key] || 0) + 1;
      }
    });

    return aggregation;
  }

  /**
   * Calculate similarity between two addresses
   */
  private calculateAddressSimilarity(
    addr1: AddressInternal,
    addr2: AddressInternal,
  ): number {
    let matches = 0;
    let total = 0;

    // Compare address lines
    if (addr1.osot_address_1 || addr2.osot_address_1) {
      total++;
      if (
        addr1.osot_address_1?.toLowerCase() ===
        addr2.osot_address_1?.toLowerCase()
      ) {
        matches++;
      }
    }

    // Compare cities
    if (addr1.osot_city || addr2.osot_city) {
      total++;
      if (addr1.osot_city === addr2.osot_city) {
        matches++;
      }
    }

    // Compare postal codes
    if (addr1.osot_postal_code || addr2.osot_postal_code) {
      total++;
      if (addr1.osot_postal_code === addr2.osot_postal_code) {
        matches++;
      }
    }

    // Compare provinces
    if (
      addr1.osot_province !== undefined ||
      addr2.osot_province !== undefined
    ) {
      total++;
      if (addr1.osot_province === addr2.osot_province) {
        matches++;
      }
    }

    return total > 0 ? matches / total : 0;
  }

  /**
   * Validate province-postal code consistency for Canadian addresses
   */
  private validateProvincePostalConsistency(
    province: number,
    postalFirstChar: string,
  ): boolean {
    // Simplified mapping of Canadian provinces to postal code first letters
    const provincePostalMap: Record<number, string[]> = {
      1: ['A'], // Newfoundland and Labrador
      2: ['B'], // Nova Scotia
      3: ['C'], // Prince Edward Island
      4: ['E'], // New Brunswick
      5: ['G', 'H', 'J'], // Quebec
      6: ['K', 'L', 'M', 'N', 'P'], // Ontario
      7: ['R'], // Manitoba
      8: ['S'], // Saskatchewan
      9: ['T'], // Alberta
      10: ['V'], // British Columbia
      11: ['X'], // Northwest Territories
      12: ['X'], // Nunavut
      13: ['Y'], // Yukon
    };

    const validChars = provincePostalMap[province] || [];
    return validChars.includes(postalFirstChar);
  }

  /**
   * Generate address optimization suggestion
   */
  private generateAddressOptimizationSuggestion(
    address: AddressInternal,
  ): string {
    const suggestions: string[] = [];

    if (!address.osot_address_2) {
      suggestions.push(
        'Consider adding address line 2 for better delivery accuracy',
      );
    }

    if (address.osot_postal_code && !address.osot_postal_code.includes(' ')) {
      suggestions.push('Format postal code with space (e.g., "K1A 0A6")');
    }

    if (!address.osot_address_preference) {
      suggestions.push('Set address preference for better organization');
    }

    return suggestions.length > 0
      ? suggestions[0]
      : 'Address is well-formatted';
  }

  /**
   * Calculate creation trends over time
   */
  private calculateCreationTrends(
    addresses: Array<{ [key: string]: unknown }>,
  ): Array<{
    month: string;
    count: number;
    growthRate: number;
  }> {
    const monthCounts = new Map<string, number>();
    const now = new Date();

    // Analyze last 12 months
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = month.toISOString().substring(0, 7); // YYYY-MM
      monthCounts.set(monthKey, 0);
    }

    // Count addresses by month
    addresses.forEach((addr) => {
      const createdOn = addr[ADDRESS_ODATA.CREATED_ON];
      if (createdOn && typeof createdOn === 'string') {
        const date = new Date(createdOn);
        const monthKey = date.toISOString().substring(0, 7);
        if (monthCounts.has(monthKey)) {
          monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
        }
      }
    });

    // Calculate trends with growth rates
    const trends: Array<{ month: string; count: number; growthRate: number }> =
      [];
    let previousCount = 0;

    monthCounts.forEach((count, month) => {
      const growthRate =
        previousCount > 0 ? ((count - previousCount) / previousCount) * 100 : 0;
      trends.push({
        month,
        count,
        growthRate: Math.round(growthRate * 100) / 100,
      });
      previousCount = count;
    });

    return trends;
  }

  /**
   * Detect suspicious address patterns
   */
  private detectSuspiciousAddressPatterns(
    addresses: AddressInternal[],
    suspiciousPatterns: Array<{
      pattern: string;
      addresses: AddressInternal[];
      riskLevel: 'low' | 'medium' | 'high';
    }>,
  ): void {
    // Group by user business ID to find users with many addresses
    const userAddressMap = new Map<string, AddressInternal[]>();
    addresses.forEach((addr) => {
      if (addr.osot_user_business_id) {
        if (!userAddressMap.has(addr.osot_user_business_id)) {
          userAddressMap.set(addr.osot_user_business_id, []);
        }
        const userAddresses = userAddressMap.get(addr.osot_user_business_id);
        if (userAddresses) {
          userAddresses.push(addr);
        }
      }
    });

    // Find users with suspiciously many addresses
    userAddressMap.forEach((userAddresses, userId) => {
      if (userAddresses.length > 10) {
        suspiciousPatterns.push({
          pattern: `User ${userId} has ${userAddresses.length} addresses`,
          addresses: userAddresses,
          riskLevel: userAddresses.length > 20 ? 'high' : 'medium',
        });
      }
    });

    // Find addresses with identical postal codes but different cities (potential errors)
    const postalCityMap = new Map<string, Set<string>>();
    addresses.forEach((addr) => {
      if (addr.osot_postal_code && addr.osot_city) {
        if (!postalCityMap.has(addr.osot_postal_code)) {
          postalCityMap.set(addr.osot_postal_code, new Set());
        }
        const citySet = postalCityMap.get(addr.osot_postal_code);
        if (citySet) {
          // Convert enum value to string for the Set
          citySet.add(addr.osot_city.toString());
        }
      }
    });

    postalCityMap.forEach((cities, postalCode) => {
      if (cities.size > 1) {
        const affectedAddresses = addresses.filter(
          (addr) => addr.osot_postal_code === postalCode,
        );
        suspiciousPatterns.push({
          pattern: `Postal code ${postalCode} used with multiple cities: ${Array.from(cities).join(', ')}`,
          addresses: affectedAddresses,
          riskLevel: 'medium',
        });
      }
    });
  }

  /**
   * Generate recommendations for duplicate handling
   */
  private generateDuplicateRecommendations(
    exactDuplicates: Array<{
      addresses: AddressInternal[];
      duplicateCount: number;
    }>,
    suspiciousPatterns: Array<{
      pattern: string;
      addresses: AddressInternal[];
      riskLevel: string;
    }>,
  ): string[] {
    const recommendations: string[] = [];

    if (exactDuplicates.length > 0) {
      recommendations.push(
        `Found ${exactDuplicates.length} groups of exact duplicate addresses. Consider consolidating these records.`,
      );
    }

    if (suspiciousPatterns.length > 0) {
      const highRisk = suspiciousPatterns.filter(
        (p) => p.riskLevel === 'high',
      ).length;
      const mediumRisk = suspiciousPatterns.filter(
        (p) => p.riskLevel === 'medium',
      ).length;

      if (highRisk > 0) {
        recommendations.push(
          `${highRisk} high-risk patterns detected. Immediate review recommended.`,
        );
      }

      if (mediumRisk > 0) {
        recommendations.push(
          `${mediumRisk} medium-risk patterns found. Schedule for review.`,
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Address data quality looks good. No immediate issues detected.',
      );
    }

    return recommendations;
  }

  // ========================================
  // PRIVATE MAPPER METHODS
  // ========================================

  /**
   * Map internal address interface to Dataverse format
   */
  private mapInternalToDataverse(
    internal: Partial<AddressInternal>,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    // Account relationship (required for creation) - handle @odata.bind directly
    const internalWithBinding = internal as Partial<AddressInternal> & {
      'osot_Table_Account@odata.bind'?: string;
    };
    const odataBinding = internalWithBinding['osot_Table_Account@odata.bind'];
    if (
      odataBinding &&
      typeof odataBinding === 'string' &&
      odataBinding.trim() !== ''
    ) {
      payload[ADDRESS_ODATA.ACCOUNT_BIND] = odataBinding;
    }

    // Map each field that exists in the internal object
    if (internal.osot_user_business_id !== undefined) {
      payload[ADDRESS_ODATA.USER_BUSINESS_ID] = internal.osot_user_business_id;
    }
    if (internal.osot_address_1 !== undefined) {
      payload[ADDRESS_ODATA.ADDRESS_1] = internal.osot_address_1;
    }
    if (internal.osot_address_2 !== undefined) {
      payload[ADDRESS_ODATA.ADDRESS_2] = internal.osot_address_2;
    }
    if (internal.osot_city !== undefined) {
      payload[ADDRESS_ODATA.CITY] = internal.osot_city;
    }
    if (internal.osot_province !== undefined) {
      payload[ADDRESS_ODATA.PROVINCE] = internal.osot_province;
    }
    if (internal.osot_postal_code !== undefined) {
      payload[ADDRESS_ODATA.POSTAL_CODE] = internal.osot_postal_code;
    }
    if (internal.osot_country !== undefined) {
      payload[ADDRESS_ODATA.COUNTRY] = internal.osot_country;
    }
    if (internal.osot_address_type !== undefined) {
      payload[ADDRESS_ODATA.ADDRESS_TYPE] = internal.osot_address_type;
    }
    if (internal.osot_address_preference !== undefined) {
      // Address preference is a multi-select choice field, must be sent as string
      // Convert array [1, 2, 3] to string "1,2,3"
      payload[ADDRESS_ODATA.ADDRESS_PREFERENCE] = Array.isArray(
        internal.osot_address_preference,
      )
        ? internal.osot_address_preference.join(',')
        : String(internal.osot_address_preference);
    }
    if (internal.osot_other_city !== undefined) {
      payload[ADDRESS_ODATA.OTHER_CITY] = internal.osot_other_city;
    }
    if (internal.osot_other_province_state !== undefined) {
      payload[ADDRESS_ODATA.OTHER_PROVINCE_STATE] =
        internal.osot_other_province_state;
    }
    if (internal.osot_access_modifiers !== undefined) {
      payload[ADDRESS_ODATA.ACCESS_MODIFIER] = internal.osot_access_modifiers;
    }
    if (internal.osot_privilege !== undefined) {
      payload[ADDRESS_ODATA.PRIVILEGE] = internal.osot_privilege;
    }
    // Account link now handled via @odata.bind in orchestrator service
    // Legacy code removed: internal.osot_table_account field no longer exists

    return payload;
  }

  /**
   * Parse address preference string from Dataverse to array
   * Converts "1,2,3" to [1, 2, 3]
   */
  private parseAddressPreference(
    value: string | undefined,
  ): number[] | undefined {
    if (!value || typeof value !== 'string') {
      return undefined;
    }

    return value
      .split(',')
      .map((item) => parseInt(item.trim(), 10))
      .filter((num) => !isNaN(num));
  }

  /**
   * Map Dataverse response to internal address interface
   */
  private mapDataverseToInternal(dataverse: AddressDataverse): AddressInternal {
    return {
      osot_table_addressid: dataverse[ADDRESS_ODATA.TABLE_ID],
      osot_address_id: dataverse[ADDRESS_ODATA.ID],
      osot_user_business_id: dataverse[ADDRESS_ODATA.USER_BUSINESS_ID],
      osot_address_1: dataverse[ADDRESS_ODATA.ADDRESS_1],
      osot_address_2: dataverse[ADDRESS_ODATA.ADDRESS_2],
      osot_city: dataverse[ADDRESS_ODATA.CITY],
      osot_province: dataverse[ADDRESS_ODATA.PROVINCE],
      osot_postal_code: dataverse[ADDRESS_ODATA.POSTAL_CODE],
      osot_country: dataverse[ADDRESS_ODATA.COUNTRY],
      osot_address_type: dataverse[ADDRESS_ODATA.ADDRESS_TYPE],
      osot_address_preference: this.parseAddressPreference(
        dataverse[ADDRESS_ODATA.ADDRESS_PREFERENCE],
      ),
      osot_other_city: dataverse[ADDRESS_ODATA.OTHER_CITY],
      osot_other_province_state: dataverse[ADDRESS_ODATA.OTHER_PROVINCE_STATE],
      osot_access_modifiers: dataverse[ADDRESS_ODATA.ACCESS_MODIFIER],
      osot_privilege: dataverse[ADDRESS_ODATA.PRIVILEGE],
      // osot_table_account: Removed - now handled via @odata.bind relationship
      createdon: dataverse[ADDRESS_ODATA.CREATED_ON],
      modifiedon: dataverse[ADDRESS_ODATA.MODIFIED_ON],
      ownerid: dataverse[ADDRESS_ODATA.OWNER_ID],
    };
  }
}

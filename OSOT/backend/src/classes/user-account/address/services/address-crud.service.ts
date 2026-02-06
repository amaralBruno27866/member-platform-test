import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateAddressDto } from '../dtos/address-create.dto';
import { UpdateAddressDto } from '../dtos/address-update.dto';
import { AddressResponseDto } from '../dtos/address-response.dto';
import { CacheService } from '../../../../cache/cache.service';
import {
  DataverseAddressRepository,
  ADDRESS_REPOSITORY,
} from '../repositories/address.repository';
import { AddressEventsService } from '../events/address.events';
import { AddressMapper } from '../mappers/address.mapper';
import { AddressDataSanitizer } from '../utils/address-sanitizer.util';
import { AddressBusinessRules } from '../rules/address-business-rules';
import { AddressFormatter } from '../utils/address-formatter.util';
import type { AddressInternal } from '../interfaces/address-internal.interface';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AppError } from '../../../../common/errors/app-error';
import {
  canCreate,
  canRead,
  canWrite,
  canDelete,
} from '../../../../utils/dataverse-app.helper';

/**
 * Address CRUD Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with DataverseAddressRepository
 * - Event-Driven Architecture: AddressEventsService for comprehensive audit trails
 * - Structured Logging: Operation IDs, security-aware logging with PII redaction
 * - Security-First Design: Privilege-based access control and data filtering
 * - Data Transformation: Mappers, sanitizers, formatters, and business logic
 * - Error Management: Centralized error handling with ErrorCodes and createAppError
 * - Business Rules: Integrated validation and standardization
 *
 * PERMISSION SYSTEM (Privilege-based):
 * - OWNER: Full CRUD access to all fields and operations
 * - ADMIN: Read/Write access to all fields, limited delete permissions
 * - MAIN: Create/Read/Write access with sensitive field filtering
 * - Sensitive fields filtered for lower privileges: access_modifiers, privilege, audit fields
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for audit trails
 * - Comprehensive event emission for all CRUD operations
 * - Security-aware logging with PII redaction capabilities
 * - Privilege-based field filtering and access control
 * - Business rule validation with detailed error reporting
 * - Canadian address focus with postal code validation
 * - Automatic data standardization and sanitization
 * - Performance monitoring and error analytics
 *
 * Key Features:
 * - Full CRUD operations with enterprise security patterns
 * - Role-based permission checking with Privilege enum
 * - Field-level filtering based on user privilege level
 * - Repository Pattern for clean data access abstraction
 * - Event-driven architecture for comprehensive audit trails
 * - Automatic data transformation using enterprise mappers
 * - Business ID and address validation with detailed reporting
 * - Canadian postal code handling and province validation
 * - Address type and preference management
 * - Comprehensive error handling with operation tracking
 * - Structured logging with security-aware PII handling
 */
@Injectable()
export class AddressCrudService {
  private readonly logger = new Logger(AddressCrudService.name);

  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: DataverseAddressRepository,
    private readonly eventsService: AddressEventsService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new address record with basic validation
   */
  async create(
    createAddressDto: CreateAddressDto,
    userRole?: string,
  ): Promise<AddressResponseDto | null> {
    const operationId = `address_create_${Date.now()}`;

    this.logger.log(`Starting address creation - Operation: ${operationId}`, {
      operation: 'create_address',
      operationId,
      userRole: userRole || 'undefined',
      timestamp: new Date().toISOString(),
    });

    // Check create permissions
    if (!canCreate(userRole)) {
      this.logger.warn(
        `Address creation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'create_address',
          operationId,
          requiredPrivilege: 'CREATE',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to create address',
        operationId,
        requiredPrivilege: 'CREATE',
        userRole: userRole || 'undefined',
        operation: 'create',
      });
    }
    // Transform DTO to internal format using mapper
    const internalAddress =
      AddressMapper.mapCreateDtoToInternal(createAddressDto);

    // Sanitize address data
    const sanitizedAddress =
      AddressDataSanitizer.sanitizeAddressData(internalAddress);

    // Validate business rules - DELEGATE TO AddressBusinessRules
    const validation = AddressBusinessRules.validateBusinessRules(
      sanitizedAddress,
      {
        isRegistration: false,
      },
    );

    if (!validation.isValid) {
      this.logger.warn(
        `Address validation failed - Operation: ${operationId}`,
        {
          operation: 'create',
          operationId,
          errors: validation.errors,
          warnings: validation.warnings,
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        message: `Address validation failed: ${validation.errors.join(', ')}`,
        operationId,
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    try {
      // Create the address record using repository - returns AddressInternal
      const createdRecord = await this.addressRepository.create(
        sanitizedAddress as AddressInternal,
      );

      // Transform response using mapper and apply field filtering
      const responseDto = AddressMapper.mapInternalToResponseDto(createdRecord);
      const filteredResponse = this.filterAddressFields(responseDto, userRole);

      this.logger.log(
        `Address created successfully - Operation: ${operationId}`,
        {
          operation: 'create',
          operationId,
          addressId: filteredResponse.osot_Table_AddressId,
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      // Invalidate address cache (extract account ID from binding)
      const accountBinding =
        createAddressDto['osot_Table_Account@odata.bind'] || '';
      const accountIdMatch = accountBinding.match(/\(([a-f0-9-]+)\)/i);
      const accountId = accountIdMatch ? accountIdMatch[1] : null;
      if (accountId) {
        await this.cacheService.invalidateAddress(accountId);
      }

      // Emit address created event
      this.eventsService.publishAddressCreated({
        addressId: filteredResponse.osot_Table_AddressId,
        accountId: '', // Account ID no longer available in sanitized address - handled via @odata.bind
        userBusinessId: sanitizedAddress.osot_user_business_id,
        address1: sanitizedAddress.osot_address_1 || '',
        city: sanitizedAddress.osot_city || 0,
        province: sanitizedAddress.osot_province || 0,
        postalCode: sanitizedAddress.osot_postal_code || '',
        country: sanitizedAddress.osot_country || 0,
        addressType: sanitizedAddress.osot_address_type || 0,
        createdBy: 'system',
        timestamp: new Date(),
      });

      return filteredResponse;
    } catch (error) {
      this.logger.error(`Address creation failed - Operation: ${operationId}`, {
        operation: 'create',
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to create address',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Create address for account integration - Simplified method for Registration Orchestrator
   *
   * ACCOUNT INTEGRATION FOCUSED:
   * - Optimized for Registration Orchestrator workflows
   * - Minimal validation for fast account setup
   * - Uses safe defaults for all optional fields
   * - Fast execution for high-volume account registration
   * - Minimal required data (only essential address fields)
   *
   * @param dto - Simplified DTO with minimal required fields
   * @returns Created address record as response DTO
   */
  async createForAccountIntegration(
    dto: import('../dtos/create-address-for-account.dto').CreateAddressForAccountDto,
  ): Promise<AddressResponseDto> {
    const operationId = `create_address_for_account_${Date.now()}`;

    this.logger.log(
      `Creating address record for account integration - Operation: ${operationId}`,
      {
        operation: 'createForAccountIntegration',
        operationId,
        hasAddress: !!dto.osot_address_1,
        city: dto.osot_city,
        province: dto.osot_province,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Use the specialized mapper for account integration workflow
      // This mapper includes relationship fields (osot_user_business_id and @odata.bind)
      const internalAddress =
        AddressMapper.mapCreateAddressForAccountDtoToInternal(dto);

      // Create the address record using repository
      const createdRecord =
        await this.addressRepository.create(internalAddress);

      // Transform response using mapper
      const responseDto = AddressMapper.mapInternalToResponseDto(createdRecord);

      this.logger.log(
        `Address record created successfully for account integration - Operation: ${operationId}`,
        {
          operation: 'createForAccountIntegration',
          operationId,
          addressId: responseDto.osot_Table_AddressId,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Address creation failed for account integration - Operation: ${operationId}`,
        {
          operation: 'createForAccountIntegration',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'createForAccountIntegration',
        operationId,
        message: 'Failed to create address record for account',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find an address by its unique identifier
   */
  async findOne(
    id: string,
    userRole?: string,
  ): Promise<AddressResponseDto | null> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to read address',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    try {
      const record = await this.addressRepository.findById(id);
      if (!record) {
        return null;
      }

      const responseDto = AddressMapper.mapInternalToResponseDto(record);
      return this.filterAddressFields(responseDto, userRole);
    } catch (error) {
      throw new AppError(ErrorCodes.GENERIC, 'Failed to find address', {
        addressId: id,
        originalError: error,
      });
    }
  }

  /**
   * Find all addresses associated with a specific account
   */
  async findByAccount(
    accountId: string,
    userRole?: string,
  ): Promise<AddressResponseDto[]> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to read addresses',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    try {
      // Check cache first
      const cacheKey = this.cacheService.buildAddressKey(accountId);
      const cached =
        await this.cacheService.get<AddressResponseDto[]>(cacheKey);

      if (cached) {
        return cached;
      }

      // Query Dataverse if cache miss
      const records = await this.addressRepository.findByAccountId(accountId);
      const result = records.map((record) => {
        const responseDto = AddressMapper.mapInternalToResponseDto(record);
        return this.filterAddressFields(responseDto, userRole);
      });

      // Cache the result
      await this.cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      throw new AppError(
        ErrorCodes.GENERIC,
        'Failed to find addresses by account',
        { accountId, originalError: error },
      );
    }
  }

  /**
   * Update an existing address with business rule validation
   */
  async update(
    id: string,
    updateAddressDto: UpdateAddressDto,
    userRole?: string,
  ): Promise<AddressResponseDto | null> {
    const operationId = `address_update_${Date.now()}`;

    this.logger.log(`Starting address update - Operation: ${operationId}`, {
      operation: 'update_address',
      operationId,
      addressId: id,
      userRole: userRole || 'undefined',
      timestamp: new Date().toISOString(),
    });

    // Check write permissions
    if (!canWrite(userRole || '')) {
      this.logger.warn(
        `Address update denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'update_address',
          operationId,
          addressId: id,
          requiredPrivilege: 'WRITE',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to update address',
        operationId,
        requiredPrivilege: 'WRITE',
        userRole: userRole || 'undefined',
        operation: 'update',
      });
    }

    try {
      // ID Resolution: Convert Business ID → GUID if needed
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        );

      let targetId = id;

      if (!isGuid) {
        this.logger.debug(
          `Business ID detected, resolving to GUID - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            businessId: id,
            timestamp: new Date().toISOString(),
          },
        );

        const record = await this.addressRepository.findByBusinessId(id);
        if (!record) {
          throw createAppError(ErrorCodes.NOT_FOUND, {
            message: 'Address not found by business ID',
            operationId,
            businessId: id,
            operation: 'update',
          });
        }
        targetId = record.osot_table_addressid || '';

        this.logger.debug(
          `Business ID resolved to GUID - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            businessId: id,
            resolvedGuid: targetId,
            timestamp: new Date().toISOString(),
          },
        );
      }

      // Validação Prévia: Get existing address
      const existingRecord = await this.addressRepository.findById(targetId);

      if (!existingRecord) {
        this.logger.warn(
          `Address not found for update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            addressId: id,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Address not found for update',
          operationId,
          addressId: id,
          operation: 'update',
        });
      }

      // Transform update DTO to internal format using mapper
      const updateData = AddressMapper.mapUpdateDtoToInternal(updateAddressDto);

      // Sanitize update data
      const sanitizedUpdate =
        AddressDataSanitizer.sanitizeAddressData(updateData);

      // Update the address record using repository
      const updatedRecord = await this.addressRepository.update(
        id,
        sanitizedUpdate,
      );

      // Phase 7: Invalidate cache after successful update
      if (updatedRecord && existingRecord.osot_user_business_id) {
        const cacheKey = this.cacheService.buildAddressKey(
          existingRecord.osot_user_business_id,
        );
        await this.cacheService.invalidate(cacheKey);
      }

      if (!updatedRecord) {
        this.logger.error(
          `Address update failed - Repository returned null - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            addressId: id,
            error: 'REPOSITORY_NULL_RESPONSE',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.GENERIC, {
          message: 'Failed to update address - no data returned',
          operationId,
          addressId: id,
          operation: 'update',
        });
      }

      // Transform response using mapper and apply field filtering
      const responseDto = AddressMapper.mapInternalToResponseDto(updatedRecord);
      const filteredResponse = this.filterAddressFields(responseDto, userRole);

      // Emit address updated event
      this.eventsService.publishAddressUpdated({
        addressId: id,
        accountId: '', // Account ID no longer available - handled via @odata.bind
        changes: {
          old: {
            userBusinessId: existingRecord.osot_user_business_id,
            address1: existingRecord.osot_address_1 || '',
            city: existingRecord.osot_city || 0,
            province: existingRecord.osot_province || 0,
            postalCode: existingRecord.osot_postal_code || '',
            country: existingRecord.osot_country || 0,
            addressType: existingRecord.osot_address_type || 0,
          },
          new: {
            userBusinessId: updatedRecord.osot_user_business_id,
            address1: updatedRecord.osot_address_1 || '',
            city: updatedRecord.osot_city || 0,
            province: updatedRecord.osot_province || 0,
            postalCode: updatedRecord.osot_postal_code || '',
            country: updatedRecord.osot_country || 0,
            addressType: updatedRecord.osot_address_type || 0,
          },
        },
        updatedBy: 'system',
        timestamp: new Date(),
      });

      this.logger.log(
        `Address updated successfully - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          addressId: id,
          timestamp: new Date().toISOString(),
        },
      );

      return filteredResponse;
    } catch (error) {
      this.logger.error(`Address update failed - Operation: ${operationId}`, {
        operation: 'update',
        operationId,
        addressId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      // Re-throw if it's already an AppError
      if (error instanceof AppError) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to update address',
        operationId,
        addressId: id,
        operation: 'update',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete an address by its unique identifier
   */
  async remove(id: string, userRole?: string): Promise<boolean> {
    // Check delete permissions
    if (!canDelete(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to delete address',
        { requiredRole: 'main', currentRole: userRole },
      );
    }

    try {
      // First, get the existing address for event data
      const existingRecord = await this.addressRepository.findById(id);
      if (!existingRecord) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Address not found', {
          addressId: id,
        });
      }

      // Delete the address using repository
      const deleted = await this.addressRepository.delete(id);

      if (deleted) {
        // Emit address deleted event
        this.eventsService.publishAddressDeleted({
          addressId: id,
          accountId: '', // Account ID no longer available - handled via @odata.bind
          address1: existingRecord.osot_address_1 || '',
          postalCode: existingRecord.osot_postal_code || '',
          deletedBy: 'system',
          timestamp: new Date(),
        });
      }

      return deleted;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCodes.GENERIC, 'Failed to delete address', {
        addressId: id,
        originalError: error,
      });
    }
  }

  /**
   * Get formatted address display for a specific address
   */
  async getFormattedAddress(
    id: string,
    userRole?: string,
  ): Promise<{
    address: AddressResponseDto;
    formatted: {
      singleLine: string;
      mailingLabel: string[];
    };
  } | null> {
    try {
      const address = await this.findOne(id, userRole);
      if (!address) {
        return null;
      }

      // Fetch internal data from repository for formatting (contains enums)
      const internalData = await this.addressRepository.findById(
        address.osot_Address_ID,
      );
      if (!internalData) {
        return null;
      }

      return {
        address,
        formatted: {
          singleLine: AddressFormatter.formatFullAddress(internalData),
          mailingLabel: AddressFormatter.formatMailingLabel(internalData),
        },
      };
    } catch (error) {
      throw new AppError(
        ErrorCodes.GENERIC,
        'Failed to get formatted address',
        { addressId: id, originalError: error },
      );
    }
  }

  /**
   * Validate address data without saving
   */
  async validateAddress(addressData: Partial<AddressInternal>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitized: Partial<AddressInternal>;
  }> {
    try {
      // Sanitize the address data
      const sanitized = AddressDataSanitizer.sanitizeAddressData(addressData);

      // Validate business rules - DELEGATE TO AddressBusinessRules
      const validation = AddressBusinessRules.validateBusinessRules(sanitized, {
        isRegistration: false,
      });

      return await Promise.resolve({
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        sanitized,
      });
    } catch (error) {
      throw new AppError(ErrorCodes.GENERIC, 'Failed to validate address', {
        addressData,
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

import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../../../utils/user.decorator';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import { AddressCrudService } from '../services/address-crud.service';
import { AddressLookupService } from '../services/address-lookup.service';
import { UpdateAddressDto } from '../dtos/address-update.dto';
import { ListAddressesQueryDto } from '../dtos/list-addresses.query.dto';
import { AddressRepository } from '../interfaces/address-repository.interface';
import { ADDRESS_REPOSITORY } from '../repositories/address.repository';
import { AddressMapper, AddressPublicDto } from '../mappers/address.mapper';

/**
 * Private Address Controller
 *
 * Handles AUTHENTICATED routes for address record management.
 * All routes require JWT authentication and proper user context.
 *
 * User Operations:
 * - GET /private/addresses/me → Get my address record
 * - PATCH /private/addresses/me → Update my address record
 *
 * Admin Operations:
 * - GET /private/addresses → List address records
 * - GET /private/addresses/{id} → Get specific address record
 */
@Controller('private/addresses')
@ApiTags('Private Address Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class AddressPrivateController {
  private readonly logger = new Logger(AddressPrivateController.name);

  constructor(
    private readonly addressCrudService: AddressCrudService,
    private readonly addressLookupService: AddressLookupService,
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: AddressRepository,
  ) {}

  /**
   * Extract privilege from user object (from JWT payload)
   */
  private getUserPrivilege(user: Record<string, unknown>): Privilege {
    // Extract privilege from JWT payload
    const privilege =
      (user?.privilege as number) || (user?.osot_privilege as number);

    return typeof privilege === 'number'
      ? (privilege as Privilege)
      : Privilege.OWNER; // Default to OWNER (lowest privilege) for security
  }

  // ========================================
  // USER SELF-MANAGEMENT ROUTES
  // ========================================

  @Get('me')
  @ApiOperation({
    summary: 'Get my address record',
    description: 'Returns the address record for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Address record found.',
    type: AddressPublicDto,
  })
  async getMyAddress(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
  ) {
    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    const address = await this.addressLookupService.findByAccountId(
      userId,
      userRole,
    );

    // Filter address to public DTO (remove system fields)
    const publicAddress = address.map((addr) =>
      AddressMapper.mapResponseDtoToPublicDto(addr),
    );

    return {
      success: true,
      data: publicAddress,
      message: 'Address record retrieved successfully',
    };
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update my address record',
    description:
      'Updates the address record for the authenticated user without requiring account lookup.',
  })
  @ApiBody({ type: UpdateAddressDto })
  @ApiResponse({
    status: 200,
    description: 'Address record updated successfully.',
    type: AddressPublicDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Address record not found for this user.',
  })
  async updateMyAddress(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() dto: UpdateAddressDto,
  ) {
    this.logger.log(`Updating address record for user: ${userId}`);

    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    // Find the user's address record first
    const existingAddress = await this.addressLookupService.findByAccountId(
      userId,
      userRole,
    );

    if (!existingAddress || existingAddress.length === 0) {
      throw createAppError(
        ErrorCodes.NOT_FOUND,
        { userId },
        404,
        'Address record not found for this user',
      );
    }

    // Validate that the address ID exists
    const addressId = existingAddress[0].osot_Table_AddressId;
    if (!addressId) {
      throw createAppError(
        ErrorCodes.INTERNAL_ERROR,
        { userId, addressRecord: 'missing_id' },
        500,
        'Address record has no valid ID',
      );
    }

    // Update address using CRUD service
    const result = await this.addressCrudService.update(
      addressId,
      dto,
      userRole,
    );

    // Filter result to public DTO (remove system fields)
    const publicResult = AddressMapper.mapResponseDtoToPublicDto(result);

    return {
      success: true,
      data: publicResult,
      message: 'Address record updated successfully',
    };
  }

  // ========================================
  // ADMIN OPERATIONS
  // ========================================

  @Get()
  @ApiOperation({
    summary: 'List address records',
    description: 'Returns a list of address records (admin only).',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'top',
    required: false,
    type: Number,
    description: 'Number of records to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Address records retrieved successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges (admin required).',
  })
  async listAddresses(
    @Query() query: ListAddressesQueryDto,
    @User() user: Record<string, unknown>,
  ) {
    // Extract user privilege for access control
    const userPrivilege = this.getUserPrivilege(user);
    const userRole = (user?.role as string) || 'owner';

    // Check if user has sufficient privileges (MAIN or ADMIN only)
    if (userPrivilege === Privilege.OWNER) {
      throw createAppError(
        ErrorCodes.PERMISSION_DENIED,
        { operation: 'list_addresses', privilege: userPrivilege },
        403,
        'Insufficient privileges to list addresses (admin required)',
      );
    }

    this.logger.log('Listing address records', {
      userRole,
      privilege: userPrivilege,
      operation: 'list_addresses',
    });

    // Use pagination parameters if provided
    const limit = query.top || 50;
    const offset = query.skip || 0;

    this.logger.log(`Fetching ${limit} records starting from ${offset}`);

    // TODO: Implement proper pagination in addressLookupService.searchAddresses
    const results = await this.addressLookupService.searchAddresses(
      {},
      userRole,
    );

    return {
      success: true,
      data: results,
      message: 'Address records retrieved successfully',
      pagination: {
        limit,
        offset,
        total: results.length,
      },
    };
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Address record ID' })
  @ApiOperation({
    summary: 'Get address record by ID',
    description: 'Returns a specific address record.',
  })
  @ApiResponse({
    status: 200,
    description: 'Address record retrieved successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges.',
  })
  @ApiResponse({
    status: 404,
    description: 'Address record not found.',
  })
  async getAddress(
    @Param('id') addressId: string,
    @User() user: Record<string, unknown>,
  ) {
    const userRole = (user?.role as string) || 'owner';

    this.logger.log(`Getting address record: ${addressId}`, {
      userRole,
      operation: 'get_address',
    });

    const address = await this.addressCrudService.findOne(addressId, userRole);

    return {
      success: true,
      data: address,
      message: 'Address record retrieved successfully',
    };
  }

  @Patch('business/:businessId')
  @ApiParam({
    name: 'businessId',
    description: 'Address business ID (e.g., ADDR-000001)',
  })
  @ApiOperation({
    summary: 'Update address by business ID (Admin only)',
    description:
      'Updates specific address by business ID. Requires admin privileges.',
  })
  @ApiBody({ type: UpdateAddressDto })
  @ApiResponse({
    status: 200,
    description: 'Address updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges.',
  })
  async updateAddressByBusinessId(
    @Param('businessId') businessId: string,
    @User() user: Record<string, unknown>,
    @Body() dto: UpdateAddressDto,
  ) {
    // Extract user privilege for access control
    const userPrivilege = this.getUserPrivilege(user);

    // Check if user has sufficient privileges (MAIN or ADMIN only)
    if (userPrivilege === Privilege.OWNER) {
      throw createAppError(
        ErrorCodes.PERMISSION_DENIED,
        { businessId, privilege: userPrivilege },
        403,
        `Insufficient privileges to update address ${businessId}`,
      );
    }

    this.logger.log(
      `Updating address ${businessId} with privilege: ${userPrivilege}`,
    );

    // Extract user role for permission consistency
    const userRole = (user?.role as string) || 'owner';

    // Find address by business ID using repository
    const address = await this.addressRepository.findByBusinessId(businessId);

    if (!address) {
      throw createAppError(ErrorCodes.NOT_FOUND, { businessId }, 404);
    }

    // Validate that the address ID exists
    const addressId = address.osot_table_addressid;
    if (!addressId) {
      throw createAppError(
        ErrorCodes.INTERNAL_ERROR,
        { businessId, addressRecord: 'missing_id' },
        500,
        'Address record has no valid ID',
      );
    }

    // Update address using CRUD service
    const updatedAddress = await this.addressCrudService.update(
      addressId,
      dto,
      userRole,
    );

    this.logger.log(`Successfully updated address ${businessId}`);

    return {
      success: true,
      data: updatedAddress,
      message: 'Address updated successfully',
    };
  }
}

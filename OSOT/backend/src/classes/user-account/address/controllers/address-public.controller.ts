import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AddressCrudService } from '../services/address-crud.service';
import { CreateAddressForAccountDto } from '../dtos/create-address-for-account.dto';

/**
 * Public Address Controller
 *
 * Handles PUBLIC routes for address record creation.
 * These routes are designed to be used by the Registration Orchestrator
 * and do NOT require authentication.
 *
 * Address Flow:
 * 1. Account is created with GUID
 * 2. POST /public/addresses/create → Create address record linked to account
 * 3. Address record serves as geographic and contact information
 */
@Controller('public/addresses')
@ApiTags('Public Address Operations')
export class AddressPublicController {
  private readonly logger = new Logger(AddressPublicController.name);

  constructor(private readonly addressCrudService: AddressCrudService) {}

  // ========================================
  // ADDRESS CREATION ROUTES
  // ========================================

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create address record for account',
    description:
      'Creates an address record linked to an existing account. Used by Registration Orchestrator.',
  })
  @ApiBody({ type: CreateAddressForAccountDto })
  @ApiResponse({
    status: 201,
    description: 'Address record created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address data format.',
  })
  async createAddress(@Body() dto: CreateAddressForAccountDto) {
    this.logger.log(`Creating address record for account`);

    return await this.addressCrudService.createForAccountIntegration(dto);
  }

  // ========================================
  // HEALTH CHECK ROUTE
  // ========================================

  @Get('health')
  @ApiOperation({
    summary: 'Health check for public address routes',
    description: 'Simple health check endpoint.',
  })
  healthCheck() {
    return {
      status: 'healthy',
      service: 'address-public',
      timestamp: new Date().toISOString(),
    };
  }
}

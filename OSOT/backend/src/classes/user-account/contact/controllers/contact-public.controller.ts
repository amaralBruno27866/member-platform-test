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
import { ContactCrudService } from '../services/contact-crud.service';
import { CreateContactForAccountDto } from '../dtos/create-contact-for-account.dto';

/**
 * Public Contact Controller
 *
 * Handles PUBLIC routes for contact record creation.
 * These routes are designed to be used by the Registration Orchestrator
 * and do NOT require authentication.
 *
 * Contact Flow:
 * 1. Account is created with GUID
 * 2. POST /public/contacts/create → Create contact record linked to account
 * 3. Contact record serves as professional and social media information
 */
@Controller('public/contacts')
@ApiTags('Public Contact Operations')
export class ContactPublicController {
  private readonly logger = new Logger(ContactPublicController.name);

  constructor(private readonly contactCrudService: ContactCrudService) {}

  // ========================================
  // CONTACT CREATION ROUTES
  // ========================================

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create contact record for account',
    description:
      'Creates a contact record linked to an existing account. Used by Registration Orchestrator.',
  })
  @ApiBody({ type: CreateContactForAccountDto })
  @ApiResponse({
    status: 201,
    description: 'Contact record created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid contact data format.',
  })
  async createContact(@Body() dto: CreateContactForAccountDto) {
    this.logger.log(`Creating contact record for account`);

    // Use the specialized method for account integration that bypasses complex validation
    // This is similar to how AddressPublicController works with createForAccountIntegration
    return await this.contactCrudService.createForAccountIntegration(dto);
  }

  // ========================================
  // HEALTH CHECK ROUTE
  // ========================================

  @Get('health')
  @ApiOperation({
    summary: 'Health check for public contact routes',
    description: 'Simple health check endpoint.',
  })
  healthCheck() {
    return {
      status: 'healthy',
      service: 'contact-public',
      timestamp: new Date().toISOString(),
    };
  }
}

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
import { ContactCrudService } from '../services/contact-crud.service';
import { ContactLookupService } from '../services/contact-lookup.service';
import { UpdateContactDto } from '../dtos/update-contact.dto';
import { ListContactsQueryDto } from '../dtos/list-contacts.query.dto';
import {
  mapResponseDtoToPublicDto,
  ContactPublicDto,
} from '../mappers/contact.mapper';
// Repository
import {
  ContactRepository,
  CONTACT_REPOSITORY,
} from '../interfaces/contact-repository.interface';

/**

/**
 * Private Contact Controller
 *
 * Handles AUTHENTICATED routes for contact record management.
 * All routes require JWT authentication and proper user context.
 *
 * User Operations:
 * - GET /private/contacts/me → Get my contact record
 * - PATCH /private/contacts/me → Update my contact record
 *
 * Admin Operations:
 * - GET /private/contacts → List contact records
 * - GET /private/contacts/{id} → Get specific contact record
 */
@Controller('private/contacts')
@ApiTags('Private Contact Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class ContactPrivateController {
  private readonly logger = new Logger(ContactPrivateController.name);

  constructor(
    private readonly contactCrudService: ContactCrudService,
    private readonly contactLookupService: ContactLookupService,
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: ContactRepository,
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
    summary: 'Get my contact record',
    description: 'Returns the contact record for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contact record found.',
    type: ContactPublicDto,
  })
  async getMyContact(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
  ) {
    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    const contact = await this.contactCrudService.findByAccount(
      userId,
      userRole,
    );

    // Filter contact to public DTO (remove system fields)
    const publicContact = contact.map((c) => mapResponseDtoToPublicDto(c));

    return {
      success: true,
      data: publicContact,
      message: 'Contact record retrieved successfully',
    };
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update my contact record',
    description:
      'Updates the contact record for the authenticated user with partial update support.',
  })
  @ApiBody({ type: UpdateContactDto })
  @ApiResponse({
    status: 200,
    description: 'Contact record updated successfully.',
    type: ContactPublicDto,
  })
  async updateMyContact(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() dto: UpdateContactDto,
  ) {
    this.logger.log(`Updating contact record for user: ${userId}`);

    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    // DEBUG: Log what we're sending to service
    console.log('[CONTACT_CONTROLLER_DEBUG] Calling findByAccount with:', {
      userId,
      userRole,
      userRoleType: typeof userRole,
    });

    // Find the user's contact record first
    const existingContact = await this.contactCrudService.findByAccount(
      userId,
      userRole,
    );

    if (!existingContact || existingContact.length === 0) {
      return {
        success: false,
        message: 'Contact record not found for this user',
      };
    }

    // Use the DTO directly since it has the same structure as update requirements
    const result = await this.contactCrudService.update(
      existingContact[0].osot_table_contactid || '',
      dto,
      userRole,
    );

    // Filter result to public DTO (remove system fields)
    const publicResult = mapResponseDtoToPublicDto(result);

    return {
      success: true,
      data: publicResult,
      message: 'Contact record updated successfully',
    };
  }

  // ========================================
  // ADMIN OPERATIONS
  // ========================================

  @Get()
  @ApiOperation({
    summary: 'List contact records',
    description: 'Returns a list of contact records (admin only).',
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
  async listContacts(@Query() query: ListContactsQueryDto) {
    this.logger.log('Listing contact records');

    // Use pagination parameters if provided
    const limit = query.limit || 50;
    const page = query.page || 1;

    this.logger.log(`Fetching ${limit} records for page ${page}`);

    const result = await this.contactCrudService.list(query);

    return {
      success: true,
      data: result.contacts,
      message: 'Contact records retrieved successfully',
    };
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Contact record ID' })
  @ApiOperation({
    summary: 'Get contact record by ID',
    description: 'Returns a specific contact record.',
  })
  async getContact(@Param('id') contactId: string) {
    this.logger.log(`Getting contact record: ${contactId}`);

    const contact = await this.contactCrudService.findOne(contactId);

    return {
      success: true,
      data: contact,
      message: 'Contact record retrieved successfully',
    };
  }

  @Patch('business/:businessId')
  @ApiParam({
    name: 'businessId',
    description: 'Contact business ID (e.g., CONT-000001)',
  })
  @ApiOperation({
    summary: 'Update contact by business ID (Admin only)',
    description:
      'Updates specific contact by business ID. Requires admin privileges.',
  })
  @ApiBody({ type: UpdateContactDto })
  @ApiResponse({
    status: 200,
    description: 'Contact updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Contact not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges.',
  })
  async updateContactByBusinessId(
    @Param('businessId') businessId: string,
    @User() user: Record<string, unknown>,
    @Body() dto: UpdateContactDto,
  ) {
    // Extract user privilege for access control
    const userPrivilege = this.getUserPrivilege(user);

    // Check if user has sufficient privileges (MAIN or ADMIN only)
    if (userPrivilege === Privilege.OWNER) {
      throw createAppError(
        ErrorCodes.PERMISSION_DENIED,
        { businessId, privilege: userPrivilege },
        403,
        `Insufficient privileges to update contact ${businessId}`,
      );
    }

    this.logger.log(
      `Updating contact ${businessId} with privilege: ${userPrivilege}`,
    );

    // Find contact by business ID using repository
    const contact = await this.contactRepository.findByBusinessId(businessId);

    if (!contact) {
      throw createAppError(ErrorCodes.NOT_FOUND, { businessId }, 404);
    }

    // Update contact using the contact ID
    const updatedContact = await this.contactCrudService.update(
      (contact.osot_table_contactid as string) || '',
      dto,
    );

    this.logger.log(`Successfully updated contact ${businessId}`);

    return {
      success: true,
      data: updatedContact,
      message: 'Contact updated successfully',
    };
  }
}

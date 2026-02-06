import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateContactDto } from '../dtos/create-contact.dto';
import { UpdateContactDto } from '../dtos/update-contact.dto';
import { ListContactsQueryDto } from '../dtos/list-contacts.query.dto';
import { CacheService } from '../../../../cache/cache.service';
import { ContactBusinessRuleService } from './contact-business-rule.service';
import {
  ContactRepository,
  CONTACT_REPOSITORY,
} from '../interfaces/contact-repository.interface';
import { ContactEventsService } from '../events/contact.events';
import { ContactDataSanitizer } from '../utils/contact-sanitizer.util';
import {
  mapCreateDtoToInternal,
  mapCreateContactForAccountDtoToInternal,
  mapUpdateDtoToDataverse,
  mapDataverseToContactResponse,
  mapDataverseToContactInternal,
  mapDataverseArrayToContactResponse,
  extractAccountIdFromBinding,
  createSocialMediaSummary,
  createCommunicationSummary,
  ContactResponseDto,
} from '../mappers/contact.mapper';
import {
  canCreate,
  canRead,
  canWrite,
  canDelete,
} from '../../../../utils/dataverse-app.helper';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AppError } from '../../../../common/errors/app-error';

/**
 * Contact CRUD Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with ContactRepository
 * - Event-Driven Architecture: ContactEventsService for comprehensive audit trails
 * - Structured Logging: Operation IDs, security-aware logging with PII redaction
 * - Security-First Design: Privilege-based access control and data filtering
 * - Business Rule Framework: Integrated validation through ContactBusinessRuleService
 * - Error Management: Centralized error handling with createAppError and detailed context
 *
 * PERMISSION SYSTEM (Privilege-based):
 * - OWNER: Full CRUD access to all fields and operations
 * - ADMIN: Read/Write access to all fields, limited delete permissions
 * - MAIN: Create/Read/Write access with sensitive field filtering
 * - Sensitive fields filtered for lower privileges: access_modifiers, privilege, audit fields
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Comprehensive event emission for all CRUD operations
 * - Security-aware logging with PII redaction capabilities
 * - Privilege-based field filtering and access control
 * - Business rule validation with detailed error reporting
 * - Social media profile management with platform-specific validation
 * - Professional networking analysis and tracking
 * - Communication preference management with Canadian standards
 * - Business ID uniqueness enforcement across the system
 * - Performance monitoring and contact analytics
 *
 * CANADIAN STANDARDS:
 * - Phone number formatting following Canadian telecommunications standards
 * - Email validation with Canadian domain considerations
 * - Address integration with Canadian postal standards
 * - Bilingual support for French/English contact information
 *
 * Key Features:
 * - Full CRUD operations with enterprise security patterns
 * - Role-based permission checking with Privilege enum
 * - Field-level filtering based on user privilege level
 * - Repository Pattern for clean data access abstraction
 * - Event-driven architecture for comprehensive audit trails
 * - Automatic data transformation using enterprise mappers
 * - Business ID uniqueness enforcement with audit trails
 * - Social media profile management and validation
 * - Professional networking analysis with detailed tracking
 * - Communication preference tracking with security compliance
 * - Comprehensive error handling with operation tracking
 * - Structured logging with security-aware PII handling
 *
 * Dependencies:
 * - ContactRepository: Enterprise data access abstraction
 * - ContactBusinessRuleService: Comprehensive validation and normalization
 * - ContactEventsService: Lifecycle event management with audit capabilities
 */
@Injectable()
export class ContactCrudService {
  private readonly logger = new Logger(ContactCrudService.name);

  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: ContactRepository,
    private readonly businessRuleService: ContactBusinessRuleService,
    private readonly eventsService: ContactEventsService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new contact with comprehensive business rule validation
   * Enhanced with operation tracking, event emission, and privilege-based security
   * - Validates business ID uniqueness and format with audit trails
   * - Normalizes social media URLs and validates platforms
   * - Checks account existence and relationship with detailed logging
   * - Creates the contact record using repository with performance monitoring
   * - Emits contact created event with social media tracking and audit data
   */
  async create(
    createContactDto: CreateContactDto,
    userRole?: string,
  ): Promise<ContactResponseDto | null> {
    const operationId = `create_contact_${Date.now()}`;

    this.logger.log(`Starting contact creation - Operation: ${operationId}`, {
      operation: 'create',
      operationId,
      userRole: userRole || 'undefined',
      hasAccountBinding: !!createContactDto['osot_Table_Account@odata.bind'],
      hasSocialMedia: !!(
        createContactDto.osot_facebook ||
        createContactDto.osot_instagram ||
        createContactDto.osot_tiktok ||
        createContactDto.osot_linkedin
      ),
      timestamp: new Date().toISOString(),
    });

    // Enhanced permission checking with privilege validation
    if (!canCreate(userRole)) {
      this.logger.warn(
        `Contact creation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'create',
          operationId,
          requiredPrivilege: 'CREATE',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to create contact',
        operationId,
        requiredPrivilege: 'CREATE',
        userRole: userRole || 'undefined',
        operation: 'create',
      });
    }

    try {
      // Apply business rules and get normalized data
      const validatedDto = await this.businessRuleService.validateCreateContact(
        createContactDto,
        userRole,
      );

      // Transform validated DTO to internal format using mapper
      const internalContact = mapCreateDtoToInternal(validatedDto);

      // Create the contact record using repository
      const createdRecord =
        await this.contactRepository.create(internalContact);

      // Transform response using mapper and apply field filtering
      const responseDto = mapDataverseToContactResponse(createdRecord);
      const filteredResponse = responseDto
        ? this.filterContactFields(responseDto, userRole)
        : null;

      if (filteredResponse) {
        this.logger.log(
          `Contact created successfully - Operation: ${operationId}`,
          {
            operation: 'create',
            operationId,
            contactId:
              filteredResponse.osot_table_contactid?.substring(0, 8) + '...',
            businessId:
              filteredResponse.osot_user_business_id?.substring(0, 4) + '...',
            userRole: userRole || 'undefined',
            timestamp: new Date().toISOString(),
          },
        );

        // Extract account ID and create summaries
        const accountId = extractAccountIdFromBinding(
          validatedDto['osot_Table_Account@odata.bind'] || '',
        );
        const socialMediaSummary = createSocialMediaSummary(filteredResponse);

        // Invalidate account cache (contact is related to account)
        if (accountId) {
          await this.cacheService.invalidateContact(accountId);
        }

        // Emit contact created event
        this.eventsService.emitContactCreated({
          contactId: filteredResponse.osot_table_contactid || '',
          accountId,
          businessId: filteredResponse.osot_user_business_id,
          jobTitle: filteredResponse.osot_job_title,
          email: filteredResponse.osot_secondary_email,
          socialMedia: {
            facebook: filteredResponse.osot_facebook,
            instagram: filteredResponse.osot_instagram,
            tiktok: filteredResponse.osot_tiktok,
            linkedin: filteredResponse.osot_linkedin,
          },
          timestamp: new Date(),
        });

        // Emit social media event if profiles exist
        if (socialMediaSummary.hasProfile) {
          this.eventsService.emitSocialMediaEvent({
            contactId: responseDto.osot_table_contactid || '',
            accountId,
            platform: 'facebook', // Would iterate through platforms in real implementation
            action: 'added',
            newUrl: filteredResponse.osot_facebook,
            timestamp: new Date(),
          });
        }
      }

      return responseDto;
    } catch (error) {
      this.logger.error(`Contact creation failed - Operation: ${operationId}`, {
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
        message: 'Failed to create contact',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Create contact for account integration - Simplified method for Registration Orchestrator
   *
   * ACCOUNT INTEGRATION FOCUSED:
   * - Optimized for Registration Orchestrator workflows
   * - Minimal validation for fast account setup
   * - Uses safe defaults for all optional fields
   * - Fast execution for high-volume account registration
   * - Minimal required data (only essential contact fields)
   *
   * @param dto - Simplified DTO with minimal required fields
   * @returns Created contact record as response DTO
   */
  async createForAccountIntegration(
    dto: import('../dtos/create-contact-for-account.dto').CreateContactForAccountDto,
  ): Promise<ContactResponseDto> {
    const operationId = `create_contact_for_account_${Date.now()}`;

    this.logger.log(
      `Creating contact record for account integration - Operation: ${operationId}`,
      {
        operation: 'createForAccountIntegration',
        operationId,
        hasJobTitle: !!dto.osot_job_title,
        hasEmail: !!dto.osot_secondary_email,
        hasSocialMedia: !!(
          dto.osot_facebook ||
          dto.osot_instagram ||
          dto.osot_tiktok ||
          dto.osot_linkedin
        ),
        // ✅ NEW: Relationship logging for debug
        hasAccountBinding: !!dto['osot_Table_Account@odata.bind'],
        accountBinding: dto['osot_Table_Account@odata.bind'],
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // ✅ NEW: Create DTO copy and reinforce binding (following OT Education pattern)
      const enhancedDto = { ...dto };

      // Reinforce OData relationship (following the pattern that works in OT Education)
      if (dto['osot_Table_Account@odata.bind']) {
        enhancedDto['osot_Table_Account@odata.bind'] =
          dto['osot_Table_Account@odata.bind'];

        this.logger.debug(
          `Account relationship reinforced - Operation: ${operationId}`,
          {
            operation: 'createForAccountIntegration',
            operationId,
            accountBinding: enhancedDto['osot_Table_Account@odata.bind'],
            timestamp: new Date().toISOString(),
          },
        );
      }

      // Use the specialized mapper for account integration workflow (repository pattern)
      // This mapper includes relationship fields (osot_user_business_id and @odata.bind)
      const contactInternal =
        mapCreateContactForAccountDtoToInternal(enhancedDto);

      // ✅ NEW: Log internal data for debug
      this.logger.debug(
        `Contact internal data prepared - Operation: ${operationId}`,
        {
          operation: 'createForAccountIntegration',
          operationId,
          hasUserBusinessId: !!contactInternal.osot_user_business_id,
          hasTableAccount: !!contactInternal.osot_table_account,
          hasAccountBinding: !!contactInternal['osot_Table_Account@odata.bind'],
          timestamp: new Date().toISOString(),
        },
      );

      // Create the contact record using repository
      const createdRecord =
        await this.contactRepository.create(contactInternal);

      // Transform response using mapper
      const responseDto = mapDataverseToContactResponse(createdRecord);

      if (!responseDto) {
        throw createAppError(ErrorCodes.INTERNAL_ERROR, {
          message: 'Failed to create contact record for account',
          operationId,
        });
      }

      this.logger.log(
        `Contact record created successfully for account integration - Operation: ${operationId}`,
        {
          operation: 'createForAccountIntegration',
          operationId,
          contactId: responseDto.osot_table_contactid,
          // ✅ NEW: Log relationship in result
          hasTableAccount: !!responseDto.osot_table_account,
          tableAccount: responseDto.osot_table_account,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Contact creation failed for account integration - Operation: ${operationId}`,
        {
          operation: 'createForAccountIntegration',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          // ✅ NEW: Log relationship in error
          accountBinding: dto['osot_Table_Account@odata.bind'],
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'createForAccountIntegration',
        operationId,
        message: 'Failed to create contact record for account',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find a contact by its unique identifier
   * Returns detailed contact information using repository and mapper
   */
  async findOne(
    id: string,
    userRole?: string,
  ): Promise<ContactResponseDto | null> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to read contact',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    const record = await this.contactRepository.findByGuid(id);
    const responseDto = mapDataverseToContactResponse(record);
    return responseDto ? this.filterContactFields(responseDto, userRole) : null;
  }

  /**
   * Find a contact by business identifier
   * Business ID is unique across the system
   */
  async findByBusinessId(
    businessId: string,
    userRole?: string,
  ): Promise<ContactResponseDto | null> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to read contact',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    // Find contact by business ID using repository
    const record = await this.contactRepository.findByBusinessId(businessId);
    const responseDto = mapDataverseToContactResponse(record);
    return responseDto ? this.filterContactFields(responseDto, userRole) : null;
  }

  /**
   * Find all contacts associated with a specific account
   * Returns array of contact DTOs for display
   */
  async findByAccount(
    accountId: string,
    userRole?: string,
  ): Promise<ContactResponseDto[]> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to read contacts',
        { requiredRole: 'main, admin, or owner', currentRole: userRole },
      );
    }

    // Check cache first
    const cacheKey = this.cacheService.buildContactKey(accountId);
    const cached = await this.cacheService.get<ContactResponseDto[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // Use findByAccountId (stable and functional)
    // Note: findByUserBusinessId is available in repository but has TypeScript interface conflicts
    const records = await this.contactRepository.findByAccountId(accountId);
    const responseDtos = mapDataverseArrayToContactResponse(records);
    const result = responseDtos.map((dto) =>
      this.filterContactFields(dto, userRole),
    );

    // Cache the result
    await this.cacheService.set(cacheKey, result);

    return result;
  }

  /**
   * List contacts with advanced filtering and pagination
   * Supports comprehensive search criteria from ListContactsQueryDto
   */
  async list(query: ListContactsQueryDto): Promise<{
    contacts: ContactResponseDto[];
    totalCount: number;
    hasMore: boolean;
  }> {
    // Use search method which is available in repository
    const searchCriteria = {
      accountId: query.osot_table_account,
      businessId: query.osot_user_business_id,
      jobTitle: query.osot_job_title,
      email: query.osot_secondary_email,
      limit: query.limit,
    };

    const searchResult = await this.contactRepository.search(searchCriteria);

    return {
      contacts: mapDataverseArrayToContactResponse(searchResult.results),
      totalCount: searchResult.total,
      hasMore: searchResult.hasMore,
    };
  }

  /**
   * Search contacts with multiple criteria
   * Supports job title, social media, business website filtering
   */
  async search(criteria: {
    accountId?: string;
    jobTitle?: string;
    businessWebsite?: string;
    socialMediaPlatform?: 'facebook' | 'instagram' | 'tiktok' | 'linkedin';
    hasEmail?: boolean;
    hasPhone?: boolean;
    limit?: number;
  }): Promise<ContactResponseDto[]> {
    const searchResult = await this.contactRepository.search(criteria);
    return mapDataverseArrayToContactResponse(searchResult.results);
  }

  /**
   * Get social media analytics for a contact
   * Returns comprehensive social media profile analysis
   */
  async getSocialMediaAnalytics(contactId: string): Promise<{
    contact: ContactResponseDto;
    socialMediaSummary: ReturnType<typeof createSocialMediaSummary>;
    communicationSummary: ReturnType<typeof createCommunicationSummary>;
  } | null> {
    const contact = await this.findOne(contactId);
    if (!contact) return null;

    return {
      contact,
      socialMediaSummary: createSocialMediaSummary(contact),
      communicationSummary: createCommunicationSummary(contact),
    };
  }

  /**
   * Find contacts by professional network connections
   * Simplified implementation using search capabilities
   */
  async findProfessionalNetworkConnections(
    businessId: string,
    options: {
      sameJobTitle?: boolean;
      sameIndustry?: boolean;
      socialMediaConnections?: boolean;
      limit?: number;
    } = {},
  ): Promise<ContactResponseDto[]> {
    // Get the current contact to extract criteria
    const currentContact = await this.findByBusinessId(businessId);
    if (!currentContact) {
      return [];
    }

    // Search for contacts with similar characteristics
    const searchCriteria: Parameters<typeof this.contactRepository.search>[0] =
      {
        limit: options.limit || 10,
      };

    // Add job title if requested
    if (options.sameJobTitle && currentContact.osot_job_title) {
      searchCriteria.jobTitle = currentContact.osot_job_title;
    }

    const searchResult = await this.contactRepository.search(searchCriteria);
    return mapDataverseArrayToContactResponse(searchResult.results);
  }

  /**
   * Update an existing contact with business rule validation
   * - Validates the contact exists and is accessible
   * - Applies social media URL normalization rules
   * - Handles business ID uniqueness constraints
   * - Emits contact updated event and social media changes
   */
  async update(
    id: string,
    updateContactDto: UpdateContactDto,
    userRole?: string,
  ): Promise<ContactResponseDto | null> {
    // Generate operation ID for tracking
    const operationId = `contact-update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    this.logger.log(`Starting contact update - Operation: ${operationId}`, {
      operation: 'update',
      operationId,
      contactId: id,
      userRole,
      timestamp: new Date().toISOString(),
    });

    try {
      // Check write permissions
      if (!canWrite(userRole || '')) {
        this.logger.warn(
          `Permission denied for contact update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            contactId: id,
            requiredRole: 'main, admin, or owner',
            currentRole: userRole,
            timestamp: new Date().toISOString(),
          },
        );

        throw new AppError(
          ErrorCodes.PERMISSION_DENIED,
          'Insufficient permissions to update contact',
          { requiredRole: 'main, admin, or owner', currentRole: userRole },
        );
      }

      // ID Resolution: Convert Business ID → GUID if needed
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        );

      let targetContactId = id;

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

        const record = await this.contactRepository.findByBusinessId(id);
        if (!record) {
          throw new AppError(
            ErrorCodes.NOT_FOUND,
            'Contact not found by business ID',
            { businessId: id, operation: 'update', operationId },
          );
        }
        targetContactId = (record.osot_table_contactid as string) || '';

        this.logger.debug(
          `Business ID resolved to GUID - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            businessId: id,
            resolvedGuid: targetContactId,
            timestamp: new Date().toISOString(),
          },
        );
      }

      // Validação Prévia: Get existing contact using resolved GUID
      const existingContact = await this.findOne(targetContactId, userRole);
      if (!existingContact) {
        this.logger.warn(
          `Contact not found for update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            contactId: id,
            targetContactId,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Contact not found',
          operationId,
          contactId: id,
        });
      }

      // Get original internal data for events (contains enums, not string labels)
      const originalInternalRecord =
        await this.contactRepository.findByGuid(targetContactId);
      const originalInternal = mapDataverseToContactInternal(
        originalInternalRecord,
      );

      // Store original data for event and change tracking
      const originalData = { ...existingContact };
      const originalSocialMedia = createSocialMediaSummary(existingContact);

      this.logger.debug(
        `Validating contact update data - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          contactId: targetContactId,
          hasSecondaryEmail: !!updateContactDto.osot_secondary_email,
          hasJobTitle: !!updateContactDto.osot_job_title,
          hasSocialMedia:
            !!updateContactDto.osot_facebook ||
            !!updateContactDto.osot_instagram ||
            !!updateContactDto.osot_linkedin ||
            !!updateContactDto.osot_tiktok,
          timestamp: new Date().toISOString(),
        },
      );

      // Validate update data with business rules
      const validatedData =
        await this.businessRuleService.validateUpdateContact(
          targetContactId,
          updateContactDto,
          userRole,
        );

      // Sanitize validated data before transformation
      const sanitizedData =
        ContactDataSanitizer.sanitizeContactData(validatedData);

      // Transform sanitized data to Dataverse format using mapper
      const updatePayload = mapUpdateDtoToDataverse(sanitizedData);

      this.logger.debug(
        `Sending update to Dataverse - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          contactId: targetContactId,
          payloadFields: Object.keys(updatePayload),
          timestamp: new Date().toISOString(),
        },
      );

      // Update the contact record using repository
      await this.contactRepository.updateByGuid(targetContactId, updatePayload);

      // Get the updated record
      const updatedRecord =
        await this.contactRepository.findByGuid(targetContactId);
      const responseDto = mapDataverseToContactResponse(updatedRecord);

      // Phase 7: Invalidate cache after successful update
      if (responseDto && originalInternalRecord.osot_accountid) {
        const cacheKey = this.cacheService.buildContactKey(
          originalInternalRecord.osot_accountid as string,
        );
        await this.cacheService.invalidate(cacheKey);
      }

      if (!responseDto) {
        this.logger.error(
          `Contact update failed - Repository returned null - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            contactId: targetContactId,
            error: 'REPOSITORY_NULL_RESPONSE',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.GENERIC, {
          message: 'Failed to update contact - no data returned',
          operationId,
          contactId: targetContactId,
          operation: 'update',
        });
      }

      // Get updated internal data for events (contains enums, not string labels)
      const updatedInternal = mapDataverseToContactInternal(updatedRecord);

      // Emit events if update was successful
      // Create updated summaries for comparison
      const updatedSocialMedia = createSocialMediaSummary(responseDto);

      // Emit contact updated event
      this.eventsService.emitContactUpdated({
        contactId: targetContactId,
        accountId: 'unknown', // Would extract from binding in real implementation
        changes: {
          old: {
            businessId: originalInternal.osot_user_business_id,
            jobTitle: originalInternal.osot_job_title,
            email: originalInternal.osot_secondary_email,
            homePhone: originalInternal.osot_home_phone,
            workPhone: originalInternal.osot_work_phone,
            businessWebsite: originalInternal.osot_business_website,
            socialMedia: {
              facebook: originalInternal.osot_facebook,
              instagram: originalInternal.osot_instagram,
              tiktok: originalInternal.osot_tiktok,
              linkedin: originalInternal.osot_linkedin,
            },
            accessModifiers: originalInternal.osot_access_modifiers,
            privilege: originalInternal.osot_privilege,
          },
          new: {
            businessId: updatedInternal.osot_user_business_id,
            jobTitle: updatedInternal.osot_job_title,
            email: updatedInternal.osot_secondary_email,
            homePhone: updatedInternal.osot_home_phone,
            workPhone: updatedInternal.osot_work_phone,
            businessWebsite: updatedInternal.osot_business_website,
            socialMedia: {
              facebook: updatedInternal.osot_facebook,
              instagram: updatedInternal.osot_instagram,
              tiktok: updatedInternal.osot_tiktok,
              linkedin: updatedInternal.osot_linkedin,
            },
            accessModifiers: updatedInternal.osot_access_modifiers,
            privilege: updatedInternal.osot_privilege,
          },
        },
        updatedBy: 'system', // Would be actual user in real implementation
        timestamp: new Date(),
      });

      // Emit social media event if social profiles changed
      if (this.hasSocialMediaChanged(originalSocialMedia, updatedSocialMedia)) {
        this.eventsService.emitSocialMediaEvent({
          contactId: targetContactId,
          accountId: 'unknown', // Would extract from binding in real implementation
          platform: 'facebook', // Simplified - would iterate through all platforms
          action: 'updated',
          oldUrl: originalData.osot_facebook,
          newUrl: responseDto.osot_facebook,
          timestamp: new Date(),
        });
      }

      // Emit job title event if job title changed
      if (originalData.osot_job_title !== responseDto.osot_job_title) {
        this.eventsService.emitJobTitleChanged({
          contactId: targetContactId,
          accountId: 'unknown', // Would extract from binding in real implementation
          oldJobTitle: originalData.osot_job_title,
          newJobTitle: responseDto.osot_job_title,
          industryChange: false, // Simplified - would analyze actual change
          industryCategory: 'unknown', // Would be determined from job title
          updatedBy: 'system', // Would be actual user in real implementation
          timestamp: new Date(),
        });
      }

      this.logger.log(
        `Contact updated successfully - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          contactId: targetContactId,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(`Contact update failed - Operation: ${operationId}`, {
        operation: 'update',
        operationId,
        contactId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Delete a contact by ID
   * - Validates contact exists and can be deleted
   * - Performs soft delete to maintain data integrity
   * - Emits contact deleted event
   */
  async delete(id: string, userRole?: string): Promise<boolean> {
    // Check delete permissions
    if (!canDelete(userRole || '')) {
      throw new AppError(
        ErrorCodes.PERMISSION_DENIED,
        'Insufficient permissions to delete contact',
        { requiredRole: 'main', currentRole: userRole },
      );
    }
    // First check if contact exists
    const existingContact = await this.findOne(id);
    if (!existingContact) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message: 'Contact not found',
        contactId: id,
      });
    }

    // Perform deletion using repository
    await this.contactRepository.deleteByGuid(id);

    // Invalidate contact cache after successful deletion
    if (existingContact?.osot_table_account) {
      await this.cacheService.invalidateContact(
        existingContact.osot_table_account,
      );
    }

    // Emit contact deleted event (deletion was successful if no exception thrown)
    this.eventsService.emitContactDeleted({
      contactId: id,
      accountId: 'unknown', // Would extract from binding in real implementation
      businessId: existingContact.osot_user_business_id || '',
      email: existingContact.osot_secondary_email,
      deletedBy: 'system', // Would be actual user in real implementation
      reason: 'User requested deletion',
      timestamp: new Date(),
    });

    return true; // Return true if no exception was thrown
  }

  /**
   * Bulk create contacts with batch processing
   * - Validates each contact individually
   * - Processes in batches for performance
   * - Emits bulk creation event
   * - Returns summary of successes and failures
   */
  async bulkCreate(
    createDtos: CreateContactDto[],
    batchSize: number = 10,
  ): Promise<{
    successful: ContactResponseDto[];
    failed: Array<{ dto: CreateContactDto; error: string }>;
    totalProcessed: number;
  }> {
    const successful: ContactResponseDto[] = [];
    const failed: Array<{ dto: CreateContactDto; error: string }> = [];

    // Process in batches
    for (let i = 0; i < createDtos.length; i += batchSize) {
      const batch = createDtos.slice(i, i + batchSize);

      const batchPromises = batch.map(async (dto) => {
        try {
          const result = await this.create(dto);
          if (result) {
            successful.push(result);
          } else {
            failed.push({
              dto,
              error: 'Failed to create contact - no result returned',
            });
          }
        } catch (error) {
          failed.push({
            dto,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      await Promise.all(batchPromises);
    }

    // Emit bulk creation event
    this.eventsService.emitBulkOperation({
      operation: 'bulk_create',
      accountId: 'unknown', // Would be determined from first contact in real implementation
      contactCount: createDtos.length,
      successCount: successful.length,
      errorCount: failed.length,
      timestamp: new Date(),
    });

    return {
      successful,
      failed,
      totalProcessed: createDtos.length,
    };
  }

  /**
   * Get contact statistics for analytics
   * Uses repository's statistical analysis capabilities
   */
  async getContactStatistics(accountId?: string): Promise<{
    totalContacts: number;
    contactsWithSocialMedia: number;
    contactsWithEmail: number;
    contactsWithPhone: number;
    contactsWithWebsite: number;
    topJobTitles: Array<{ title: string; count: number }>;
    socialMediaDistribution: Array<{ platform: string; count: number }>;
  }> {
    const stats = await this.contactRepository.getContactStatistics(
      accountId || '',
    );

    // Transform repository stats to expected format
    return {
      totalContacts: stats.total,
      contactsWithSocialMedia: stats.bySocialMedia.withAnyProfile,
      contactsWithEmail: stats.withSecondaryEmail,
      contactsWithPhone: stats.withPhones.home + stats.withPhones.work,
      contactsWithWebsite: 0, // Not available in repository stats
      topJobTitles: Object.entries(stats.byJobTitle).map(([title, count]) => ({
        title,
        count,
      })),
      socialMediaDistribution: [
        { platform: 'facebook', count: stats.bySocialMedia.facebook },
        { platform: 'instagram', count: stats.bySocialMedia.instagram },
        { platform: 'tiktok', count: stats.bySocialMedia.tiktok },
        { platform: 'linkedin', count: stats.bySocialMedia.linkedin },
      ],
    };
  }

  /**
   * Validate contact data without saving
   * Similar to AddressCrudService.validateAddress
   */
  async validateContact(contactData: Partial<CreateContactDto>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    normalizedData: Partial<CreateContactDto>;
  }> {
    try {
      // Apply business rules validation
      const validation = await this.businessRuleService.validateCreateContact(
        contactData as CreateContactDto,
      );

      return {
        isValid: true,
        errors: [],
        warnings: [],
        normalizedData: validation,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown validation error';

      return {
        isValid: false,
        errors: [errorMessage],
        warnings: [],
        normalizedData: contactData,
      };
    }
  }

  /**
   * Get contact summary with social media and communication analysis
   * Similar to AddressCrudService.getFormattedAddress
   */
  async getContactSummary(
    id: string,
    userRole?: string,
  ): Promise<{
    contact: ContactResponseDto;
    summary: {
      socialMediaSummary: ReturnType<typeof createSocialMediaSummary>;
      communicationSummary: ReturnType<typeof createCommunicationSummary>;
      completenessScore: number;
    };
  } | null> {
    try {
      const contact = await this.findOne(id, userRole);
      if (!contact) {
        return null;
      }

      const socialMediaSummary = createSocialMediaSummary(contact);
      const communicationSummary = createCommunicationSummary(contact);

      // Calculate completeness score based on filled fields
      const totalFields = 11; // Total relevant fields
      let filledFields = 0;

      if (contact.osot_user_business_id) filledFields++;
      if (contact.osot_secondary_email) filledFields++;
      if (contact.osot_job_title) filledFields++;
      if (contact.osot_home_phone) filledFields++;
      if (contact.osot_work_phone) filledFields++;
      if (contact.osot_business_website) filledFields++;
      if (contact.osot_facebook) filledFields++;
      if (contact.osot_instagram) filledFields++;
      if (contact.osot_tiktok) filledFields++;
      if (contact.osot_linkedin) filledFields++;
      if (contact.osot_table_account) filledFields++;

      const completenessScore = Math.round((filledFields / totalFields) * 100);

      return {
        contact,
        summary: {
          socialMediaSummary,
          communicationSummary,
          completenessScore,
        },
      };
    } catch (error) {
      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to get contact summary',
        contactId: id,
        originalError: error,
      });
    }
  }

  /**
   * Helper method to identify changed fields between original and updated contact
   */
  private identifyChangedFields(
    original: ContactResponseDto,
    updated: ContactResponseDto,
  ): string[] {
    const changedFields: string[] = [];
    const fieldsToCheck = [
      'osot_user_business_id',
      'osot_secondary_email',
      'osot_home_phone',
      'osot_work_phone',
      'osot_job_title',
      'osot_business_website',
      'osot_facebook',
      'osot_instagram',
      'osot_tiktok',
      'osot_linkedin',
      'osot_access_modifiers',
      'osot_privilege',
    ];

    fieldsToCheck.forEach((field) => {
      const key = field as keyof ContactResponseDto;
      if (original[key] !== updated[key]) {
        changedFields.push(field);
      }
    });

    return changedFields;
  }

  /**
   * Helper method to detect social media profile changes
   */
  private hasSocialMediaChanged(
    original: ReturnType<typeof createSocialMediaSummary>,
    updated: ReturnType<typeof createSocialMediaSummary>,
  ): boolean {
    return (
      original.completenessScore !== updated.completenessScore ||
      original.platforms.length !== updated.platforms.length ||
      !original.platforms.every((platform) =>
        updated.platforms.includes(platform),
      )
    );
  }

  /**
   * Filter contact fields based on user role permissions
   * - main/admin: Full access to all fields
   * - owner: Limited access, sensitive fields filtered out
   *
   * ENUM FIELD FILTERING:
   * - osot_access_modifiers: Uses AccessModifier enum values
   * - osot_privilege: Uses Privilege enum values
   * - These fields are filtered for non-admin users for security
   */
  private filterContactFields(
    contact: ContactResponseDto,
    userRole?: string,
  ): ContactResponseDto {
    // Main and admin have full access (including access control fields)
    if (userRole === 'main' || userRole === 'admin') {
      return contact;
    }

    // For owner role, filter out sensitive access control fields
    if (userRole === 'owner') {
      return {
        osot_table_contactid: contact.osot_table_contactid,
        osot_user_business_id: contact.osot_user_business_id,
        osot_secondary_email: contact.osot_secondary_email,
        osot_home_phone: contact.osot_home_phone,
        osot_work_phone: contact.osot_work_phone,
        osot_job_title: contact.osot_job_title,
        osot_business_website: contact.osot_business_website,
        osot_facebook: contact.osot_facebook,
        osot_instagram: contact.osot_instagram,
        osot_tiktok: contact.osot_tiktok,
        osot_linkedin: contact.osot_linkedin,
        osot_table_account: contact.osot_table_account,
      } as ContactResponseDto;
    }

    // Default: return full contact for undefined roles (backward compatibility)
    return contact;
  }
}

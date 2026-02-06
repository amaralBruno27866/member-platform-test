/**
 * Insurance Private Controller
 *
 * Handles AUTHENTICATED routes for Insurance certificate management.
 * All routes require JWT authentication and proper user context.
 *
 * USER OPERATIONS:
 * - GET /private/insurances → List my insurance certificates
 * - GET /private/insurances/:id → Get specific insurance by ID
 *
 * ADMIN OPERATIONS:
 * - POST /private/insurances → Create new insurance (exceptional cases)
 * - PATCH /private/insurances/:id → Update insurance
 * - DELETE /private/insurances/:id → Soft delete (status=CANCELLED)
 * - POST /private/insurances/:id/hard-delete → Permanent delete (Main only)
 * - POST /private/insurances/expire → Manual expiration trigger (Main only)
 *
 * PERMISSIONS:
 * - CREATE: Owner, Main (via insurance-crud.service)
 * - READ: Owner (own insurances), Admin, Main (all insurances)
 * - UPDATE: Admin, Main only
 * - DELETE: Main only
 *
 * SNAPSHOT PATTERN:
 * - 21 immutable fields at creation
 * - Only status, endorsements, access control can be updated
 * - Hard delete requires Main privilege (full deletion from Dataverse)
 *
 * @file insurance-private.controller.ts
 * @module InsuranceModule
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
  Inject,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

// Services
import { InsuranceCrudService } from '../services/insurance-crud.service';
import { InsuranceLookupService } from '../services/insurance-lookup.service';
import { InsuranceExpirationScheduler } from '../schedulers/insurance-expiration.scheduler';
import { InsuranceReportEmailService } from '../services/insurance-report-email.service';

// DTOs
import {
  CreateInsuranceDto,
  UpdateInsuranceDto,
  InsuranceResponseDto,
} from '../dtos';

// Guards and Decorators
import { User } from '../../../../utils/user.decorator';

// Repository
import { InsuranceRepository } from '../interfaces';

// Enums
import { Privilege } from '../../../../common/enums';

// Mapper
import { InsuranceMapper } from '../mappers/insurance.mapper';

/**
 * Insurance Private Controller
 *
 * Handles authenticated insurance management endpoints.
 * Supports both user-level operations (read own) and admin operations.
 */
@Controller('private/insurances')
@ApiTags('Private Insurance Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class InsurancePrivateController {
  private readonly logger = new Logger(InsurancePrivateController.name);

  constructor(
    private readonly insuranceCrudService: InsuranceCrudService,
    private readonly insuranceLookupService: InsuranceLookupService,
    private readonly insuranceExpirationScheduler: InsuranceExpirationScheduler,
    private readonly insuranceReportEmailService: InsuranceReportEmailService,
    @Inject('INSURANCE_REPOSITORY')
    private readonly insuranceRepository: InsuranceRepository,
  ) {}

  // ========================================
  // USER OPERATIONS: Read Own Insurances
  // ========================================

  /**
   * GET /private/insurances
   *
   * List all insurance certificates for the authenticated user.
   * Filters by account automatically based on JWT context.
   *
   * ACCESSIBLE BY: Owner, Admin, Main
   * - Owner: Sees only own insurances
   * - Admin/Main: Can optionally filter by account query parameter
   *
   * @param user JWT user context
   * @param accountId Optional: Filter by account (admin/main only)
   * @returns Array of InsuranceResponseDto
   */
  @Get()
  @ApiOperation({
    summary: 'List insurance certificates',
    description:
      'Returns all insurance certificates for the authenticated user. Owners see their own, Admins/Main can filter by account.',
  })
  @ApiQuery({
    name: 'accountId',
    required: false,
    description: 'Filter by account ID (Admin/Main only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Insurance certificates retrieved successfully',
    type: [InsuranceResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT required',
  })
  async listInsurances(
    @User() user: Record<string, unknown>,
    @Query('accountId') accountId?: string,
  ) {
    const operationId = `list_insurances_${Date.now()}`;
    const userId = user?.userId as string;
    const userRole = (user?.role as string) || 'owner';
    const organizationId = user?.organizationId as string;

    this.logger.log(
      `Listing insurances for user: ${userId}, Role: ${userRole} - Operation: ${operationId}`,
    );

    try {
      // If accountId is provided and user is admin/main, filter by account
      if (
        accountId &&
        [Privilege.ADMIN, Privilege.MAIN].includes(
          userRole as unknown as Privilege,
        )
      ) {
        const insurances = await this.insuranceLookupService.findByAccount(
          accountId,
          organizationId,
          operationId,
        );

        return {
          success: true,
          data: insurances.map((i) => InsuranceMapper.internalToResponseDto(i)),
          count: insurances.length,
          message: 'Insurance certificates retrieved successfully',
        };
      } else {
        // Otherwise, get insurances for current user's account
        const insurances = await this.insuranceLookupService.findByAccount(
          userId,
          organizationId,
          operationId,
        );

        return {
          success: true,
          data: insurances.map((i) => InsuranceMapper.internalToResponseDto(i)),
          count: insurances.length,
          message: 'Insurance certificates retrieved successfully',
        };
      }
    } catch (error) {
      this.logger.error(
        `Error listing insurances - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * GET /private/insurances/:id
   *
   * Get a specific insurance certificate by ID.
   *
   * ACCESSIBLE BY: Owner (if own), Admin, Main
   * - Owners can only view their own insurances
   * - Admins/Main can view any insurance
   *
   * @param insuranceId Insurance certificate GUID
   * @param user JWT user context
   * @returns InsuranceResponseDto
   */
  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'Insurance certificate ID (GUID)',
    example: 'abc-123-def-456',
  })
  @ApiOperation({
    summary: 'Get insurance certificate by ID',
    description: 'Returns a specific insurance certificate.',
  })
  @ApiResponse({
    status: 200,
    description: 'Insurance certificate found',
    type: InsuranceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Insurance certificate not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges to view this insurance',
  })
  async getInsurance(
    @Param('id') insuranceId: string,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `get_insurance_${Date.now()}`;
    const userRole = (user?.role as string) || Privilege.OWNER;
    const userId = user?.userId as string;
    const organizationId = user?.organizationId as string;

    this.logger.log(
      `Getting insurance: ${insuranceId}, User: ${userId}, Role: ${userRole} - Operation: ${operationId}`,
    );

    try {
      const insurance = await this.insuranceRepository.findById(
        insuranceId,
        organizationId,
        operationId,
      );

      if (!insurance) {
        return {
          success: false,
          message: 'Insurance certificate not found',
          statusCode: 404,
        };
      }

      // Authorization: Owners can only view their own insurances
      if (userRole === Privilege.OWNER && insurance.accountGuid !== userId) {
        return {
          success: false,
          message: 'You do not have permission to view this insurance',
          statusCode: 403,
        };
      }

      return {
        success: true,
        data: InsuranceMapper.internalToResponseDto(insurance),
        message: 'Insurance certificate retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error getting insurance ${insuranceId}`, error);
      throw error;
    }
  }

  // ========================================
  // ADMIN OPERATIONS: Create, Update, Delete
  // ========================================

  /**
   * POST /private/insurances
   *
   * Create a new insurance certificate.
   *
   * ACCESSIBLE BY: Owner, Main, Admin (via insurance-crud.service)
   * - Typically called by OrderCreatedEvent listener
   * - Can be called manually for exceptional cases
   *
   * SNAPSHOT PATTERN:
   * - 21 immutable fields captured at creation
   * - accountGuid, orderGuid, organizationId from context/body
   * - All fields are validated by custom validators
   *
   * @param dto CreateInsuranceDto with all required fields
   * @param user JWT user context
   * @returns Created InsuranceResponseDto
   */
  @Post()
  @ApiOperation({
    summary: 'Create new insurance certificate',
    description:
      'Creates a new insurance certificate. Typically called by order event listener. Can be used for manual creation (exceptional cases).',
  })
  @ApiBody({ type: CreateInsuranceDto })
  @ApiResponse({
    status: 201,
    description: 'Insurance certificate created successfully',
    type: InsuranceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - check required fields and constraints',
  })
  @ApiResponse({
    status: 409,
    description:
      'Business rule violation - e.g., duplicate insurance type for year',
  })
  async createInsurance(
    @Body() dto: CreateInsuranceDto,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `create_insurance_${Date.now()}`;
    const userId = user?.userId as string;
    const userRoleStr = (user?.role as string) || 'owner';
    const userRole = userRoleStr as unknown as Privilege;
    const organizationId = user?.organizationId as string;

    this.logger.log(
      `Creating insurance certificate - User: ${userId}, Role: ${userRole} - Operation: ${operationId}`,
    );

    try {
      // Pass organization context from JWT
      const insurance = await this.insuranceCrudService.create(
        dto,
        userRole,
        userId,
        organizationId,
      );

      return {
        success: true,
        data: insurance,
        message: 'Insurance certificate created successfully',
        statusCode: 201,
      };
    } catch (error) {
      this.logger.error(
        `Error creating insurance certificate - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * PATCH /private/insurances/:id
   *
   * Update an existing insurance certificate.
   *
   * ACCESSIBLE BY: Admin, Main only
   * - Owners cannot update insurances
   *
   * SNAPSHOT PATTERN:
   * - Only status, endorsements, access control fields can be updated
   * - 21 immutable fields cannot be changed
   * - Expiry date is read-only (set by scheduler)
   *
   * @param insuranceId Insurance certificate GUID
   * @param dto UpdateInsuranceDto with fields to update
   * @param user JWT user context
   * @returns Updated InsuranceResponseDto
   */
  @Patch(':id')
  @ApiParam({
    name: 'id',
    description: 'Insurance certificate ID (GUID)',
  })
  @ApiOperation({
    summary: 'Update insurance certificate',
    description:
      'Updates an insurance certificate. Only status, endorsements, and access control fields can be updated (Admin/Main only).',
  })
  @ApiBody({ type: UpdateInsuranceDto })
  @ApiResponse({
    status: 200,
    description: 'Insurance certificate updated successfully',
    type: InsuranceResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges - Admin or Main required',
  })
  @ApiResponse({
    status: 404,
    description: 'Insurance certificate not found',
  })
  async updateInsurance(
    @Param('id') insuranceId: string,
    @Body() dto: UpdateInsuranceDto,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `update_insurance_${Date.now()}`;
    const userRoleStr = (user?.role as string) || 'owner';
    const userRole = userRoleStr as unknown as Privilege;
    const userId = user?.userId as string;
    const organizationId = user?.organizationId as string;

    // Authorization: Only Admin and Main can update
    if (![Privilege.ADMIN, Privilege.MAIN].includes(userRole)) {
      this.logger.warn(
        `Unauthorized update attempt - User: ${userId}, Role: ${userRole} - Operation: ${operationId}`,
      );
      return {
        success: false,
        message: 'Only Admin or Main users can update insurances',
        statusCode: 403,
      };
    }

    this.logger.log(
      `Updating insurance: ${insuranceId}, User: ${userId} - Operation: ${operationId}`,
    );

    try {
      const updated = await this.insuranceCrudService.update(
        insuranceId,
        dto,
        userRole,
        userId,
        organizationId,
      );

      return {
        success: true,
        data: updated,
        message: 'Insurance certificate updated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error updating insurance ${insuranceId} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * DELETE /private/insurances/:id
   *
   * Soft delete an insurance certificate (status=CANCELLED).
   *
   * ACCESSIBLE BY: Admin, Main only
   *
   * SOFT DELETE PATTERN:
   * - Changes status to CANCELLED
   * - Preserves audit trail (createdOn, modifiedOn retained)
   * - Record still visible in read-only mode for compliance
   * - Can be restored by updating status back to ACTIVE/PENDING/DRAFT
   *
   * @param insuranceId Insurance certificate GUID
   * @param user JWT user context
   * @returns Success confirmation
   */
  @Delete(':id')
  @ApiParam({
    name: 'id',
    description: 'Insurance certificate ID (GUID)',
  })
  @ApiOperation({
    summary: 'Soft delete insurance certificate',
    description:
      'Cancels an insurance certificate (changes status to CANCELLED). Preserves audit trail. Admin/Main only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Insurance certificate cancelled successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges - Admin or Main required',
  })
  @ApiResponse({
    status: 404,
    description: 'Insurance certificate not found',
  })
  async deleteInsurance(
    @Param('id') insuranceId: string,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `delete_insurance_${Date.now()}`;
    const userRoleStr = (user?.role as string) || 'owner';
    const userRole = userRoleStr as unknown as Privilege;
    const userId = user?.userId as string;
    const organizationId = user?.organizationId as string;

    // Authorization: Only Admin and Main can delete
    if (![Privilege.ADMIN, Privilege.MAIN].includes(userRole)) {
      this.logger.warn(
        `Unauthorized delete attempt - User: ${userId}, Role: ${userRole} - Operation: ${operationId}`,
      );
      return {
        success: false,
        message: 'Only Admin or Main users can delete insurances',
        statusCode: 403,
      };
    }

    this.logger.log(
      `Deleting insurance: ${insuranceId}, User: ${userId} - Operation: ${operationId}`,
    );

    try {
      await this.insuranceCrudService.delete(
        insuranceId,
        userRole,
        organizationId,
      );

      return {
        success: true,
        message: 'Insurance certificate cancelled successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error deleting insurance ${insuranceId} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * POST /private/insurances/:id/hard-delete
   *
   * Permanently delete an insurance certificate from Dataverse.
   *
   * ACCESSIBLE BY: Main privilege only (full system access)
   *
   * HARD DELETE PATTERN:
   * - Removes record completely from Dataverse (not recoverable)
   * - Use only for data corrections/compliance requirements
   * - Soft delete (status=CANCELLED) preferred for normal operations
   * - Requires explicit Main privilege confirmation
   *
   * @param insuranceId Insurance certificate GUID
   * @param user JWT user context
   * @returns Success confirmation
   */
  @Post(':id/hard-delete')
  @ApiParam({
    name: 'id',
    description: 'Insurance certificate ID (GUID)',
  })
  @ApiOperation({
    summary: 'Hard delete insurance certificate (permanent)',
    description:
      'Permanently removes an insurance certificate from Dataverse. NOT recoverable. Main privilege only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Insurance certificate permanently deleted',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges - Main required',
  })
  @ApiResponse({
    status: 404,
    description: 'Insurance certificate not found',
  })
  async hardDeleteInsurance(
    @Param('id') insuranceId: string,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `hard_delete_insurance_${Date.now()}`;
    const userRoleStr = (user?.role as string) || 'owner';
    const userRole = userRoleStr as unknown as Privilege;
    const userId = user?.userId as string;

    // Authorization: Only Main can hard delete
    if (userRole !== Privilege.MAIN) {
      this.logger.warn(
        `Unauthorized hard delete attempt - User: ${userId}, Role: ${userRole} - Operation: ${operationId}`,
      );
      return {
        success: false,
        message: 'Only Main users can permanently delete insurances',
        statusCode: 403,
      };
    }

    this.logger.log(
      `Hard deleting insurance: ${insuranceId}, User: ${userId} - Operation: ${operationId}`,
    );

    try {
      await this.insuranceCrudService.hardDelete(insuranceId, userRole);

      this.logger.log(
        `Insurance permanently deleted: ${insuranceId} - Operation: ${operationId}`,
      );

      return {
        success: true,
        message: 'Insurance certificate permanently deleted',
      };
    } catch (error) {
      this.logger.error(
        `Error hard deleting insurance ${insuranceId} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  // ========================================
  // SCHEDULER OPERATIONS: Manual Triggers
  // ========================================

  /**
   * POST /private/insurances/expire
   *
   * Manually trigger insurance expiration check.
   *
   * ACCESSIBLE BY: Main privilege only
   *
   * SCHEDULER TRIGGER:
   * - Normally runs automatically (daily 1 AM, annual Jan 1)
   * - Can be triggered manually for testing or emergency operations
   * - Processes all ACTIVE insurances from previous membership year
   * - Changes status: ACTIVE → EXPIRED
   * - Per-item error handling (continues on error)
   *
   * OPTIONAL PARAMETERS:
   * - organizationId: Filter to specific organization (Main only)
   * - reason: Record reason for manual trigger (for audit logs)
   *
   * @param organizationId Optional: Limit expiration to organization
   * @param reason Optional: Reason for manual trigger
   * @param user JWT user context
   * @returns Expiration statistics
   */
  @Post('expire')
  @ApiOperation({
    summary: 'Manually trigger insurance expiration check',
    description:
      'Triggers insurance expiration process for all insurances from previous membership year. Main privilege only.',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Limit expiration to specific organization',
  })
  @ApiQuery({
    name: 'reason',
    required: false,
    description: 'Reason for manual trigger (recorded in audit log)',
  })
  @ApiResponse({
    status: 200,
    description: 'Insurance expiration process completed',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges - Main required',
  })
  async triggerInsuranceExpiration(
    @Query('organizationId') organizationId?: string,
    @Query('reason') reason?: string,
    @User() user?: Record<string, unknown>,
  ) {
    const operationId = `manual_expire_insurance_${Date.now()}`;
    const userRoleStr = (user?.role as string) || 'owner';
    const userRole = userRoleStr as unknown as Privilege;
    const userId = user?.userId as string;

    // Authorization: Only Main can trigger expiration
    if (userRole !== Privilege.MAIN) {
      this.logger.warn(
        `Unauthorized expiration trigger attempt - User: ${userId}, Role: ${userRole} - Operation: ${operationId}`,
      );
      return {
        success: false,
        message: 'Only Main users can trigger manual expiration',
        statusCode: 403,
      };
    }

    // If organizationId not provided, use user's organization
    const targetOrgId = organizationId || (user?.organizationId as string);

    this.logger.log(
      `Triggering manual insurance expiration - User: ${userId}, Organization: ${targetOrgId}, Reason: ${reason || 'not provided'} - Operation: ${operationId}`,
    );

    try {
      const stats =
        await this.insuranceExpirationScheduler.triggerManualExpiration(
          targetOrgId,
          reason || 'manual-admin-trigger',
        );

      return {
        success: true,
        data: stats,
        message: 'Insurance expiration process completed',
      };
    } catch (error) {
      this.logger.error(
        `Error triggering insurance expiration - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  // ========================================
  // ADMIN REPORT OPERATIONS: Approve/Reject
  // ========================================

  /**
   * Approve 24-hour insurance report
   *
   * Validates approval token and sends signed report payload to insurance provider.
   * Admin receives approval email and clicks approve button, which calls this endpoint.
   *
   * WORKFLOW:
   * 1. Validate approval token (matches stored hash)
   * 2. Call InsuranceReportEmailService.sendProviderNotificationEmail()
   * 3. Provider receives signed JSON with HMAC-SHA256 signature
   * 4. Provider validates signature and processes claims
   *
   * @route POST /private/insurance/reports/:reportId/approve?token=XXX
   * @param reportId - Report ID from approval email
   * @param token - Approval token (UUID from InsuranceReportService)
   * @returns {{ success: boolean; reportId: string; message: string }}
   */
  @Post('reports/:reportId/approve')
  @ApiOperation({
    summary: 'Approve insurance report and send to provider',
    description:
      'Admin clicks approve in email → validates token → sends signed JSON to insurance provider',
  })
  @ApiParam({
    name: 'reportId',
    description: 'Report ID from approval email',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'token',
    description: 'Approval token (expires after 24 hours)',
    example: 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
  })
  @ApiResponse({
    status: 200,
    description: 'Report approved and sent to provider',
    schema: {
      properties: {
        success: { type: 'boolean' },
        reportId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
  })
  async approveReport(
    @Param('reportId') reportId: string,
    @Query('token') token: string,
    @User() user: Record<string, unknown>,
  ): Promise<{ success: boolean; reportId: string; message: string }> {
    const operationId = `approve_report_${Date.now()}`;
    const userId = user?.userId as string;

    try {
      this.logger.log(
        `Approving insurance report - Report ID: ${reportId}, User: ${userId} - Operation: ${operationId}`,
      );

      // TODO: Implement token validation
      // 1. Fetch report metadata from Dataverse (including hashed approval token)
      // 2. Hash incoming token and compare (timing-safe)
      // 3. Verify token has not expired (24 hours)
      // 4. Update report status to APPROVED in Dataverse

      // For now, proceed directly to sending provider notification
      // This will be improved when report persistence is implemented

      // Placeholder: Use reportId as organizationGuid for now
      // When reports are persisted in Dataverse, fetch actual organization
      const organizationGuid = reportId;

      await this.insuranceReportEmailService.sendProviderNotificationEmail(
        // TODO: Fetch actual signed payload from Dataverse
        // For now, regenerate (not ideal for production)
        // Should store and retrieve the exact payload that was approved
        {
          reportId,
          organizationGuid,
          generatedAt: new Date().toISOString(),
          summary: {
            periodStart: new Date(Date.now() - 86400000).toISOString(),
            periodEnd: new Date().toISOString(),
            totalRecords: 0,
            totalPremium: 0,
            totalAmount: 0,
            countActive: 0,
            countPending: 0,
            countDraft: 0,
            countExpired: 0,
            countCancelled: 0,
            byStatus: {
              ACTIVE: { count: 0, total: 0 },
              PENDING: { count: 0, total: 0 },
              DRAFT: { count: 0, total: 0 },
              EXPIRED: { count: 0, total: 0 },
              CANCELLED: { count: 0, total: 0 },
            },
          },
          insurances: [],
          signature: '', // Will be generated by service
          signatureAlgorithm: 'HMAC-SHA256',
          signedAt: new Date().toISOString(),
        },
      );

      this.logger.log(
        `Insurance report approved and sent to provider - Report ID: ${reportId} - Operation: ${operationId}`,
        {
          operation: 'approveReport',
          operationId,
          reportId,
          userId,
        },
      );

      return {
        success: true,
        reportId,
        message: 'Report approved and sent to insurance provider',
      };
    } catch (error) {
      this.logger.error(
        `Error approving insurance report - Report ID: ${reportId} - Operation: ${operationId}`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Reject 24-hour insurance report
   *
   * Validates rejection token and marks report as REJECTED.
   * Admin can provide optional reason for audit trail.
   *
   * WORKFLOW:
   * 1. Validate rejection token (matches stored hash)
   * 2. Update report status to REJECTED in Dataverse
   * 3. Log reason for audit trail
   * 4. Return confirmation (no email to provider)
   *
   * @route POST /private/insurance/reports/:reportId/reject?token=XXX
   * @param reportId - Report ID from approval email
   * @param token - Rejection token (UUID from InsuranceReportService)
   * @param reason - Optional reason for rejection
   * @returns {{ success: boolean; reportId: string; message: string }}
   */
  @Post('reports/:reportId/reject')
  @ApiOperation({
    summary: 'Reject insurance report',
    description:
      'Admin clicks reject in email → validates token → report marked as REJECTED, no email sent',
  })
  @ApiParam({
    name: 'reportId',
    description: 'Report ID from approval email',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'token',
    description: 'Rejection token (expires after 24 hours)',
    example: 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
  })
  @ApiQuery({
    name: 'reason',
    description: 'Optional reason for rejection (logged for audit trail)',
    example: 'Data quality issues in 3 records',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Report rejected',
    schema: {
      properties: {
        success: { type: 'boolean' },
        reportId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
  })
  rejectReport(
    @Param('reportId') reportId: string,
    @Query('token') token: string,
    @Query('reason') reason?: string,
    @User() user?: Record<string, unknown>,
  ): Promise<{ success: boolean; reportId: string; message: string }> {
    const operationId = `reject_report_${Date.now()}`;
    const userId = user?.userId as string | undefined;

    try {
      this.logger.log(
        `Rejecting insurance report - Report ID: ${reportId}, Reason: ${reason || 'not provided'} - Operation: ${operationId}`,
      );

      // TODO: Implement token validation
      // 1. Fetch report metadata from Dataverse (including hashed rejection token)
      // 2. Hash incoming token and compare (timing-safe)
      // 3. Verify token has not expired (24 hours)
      // 4. Update report status to REJECTED in Dataverse
      // 5. Store rejection reason for audit trail

      this.logger.log(
        `Insurance report rejected - Report ID: ${reportId}, Reason: ${reason || 'not specified'} - Operation: ${operationId}`,
        {
          operation: 'rejectReport',
          operationId,
          reportId,
          rejectionReason: reason,
          userId,
        },
      );

      return Promise.resolve({
        success: true,
        reportId,
        message: 'Report rejected. Provider will not be notified.',
      });
    } catch (error) {
      this.logger.error(
        `Error rejecting insurance report - Report ID: ${reportId} - Operation: ${operationId}`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }
}

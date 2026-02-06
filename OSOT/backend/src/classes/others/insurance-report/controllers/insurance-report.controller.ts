/**
 * Insurance Report Controller
 *
 * HTTP endpoints for Insurance Report operations.
 * Handles request/response transformation and delegates business logic to service.
 *
 * Endpoints:
 * - POST   /insurance-reports              → Create new report
 * - GET    /insurance-reports              → List all reports
 * - GET    /insurance-reports/pending      → List pending reports
 * - GET    /insurance-reports/:id          → Get report by ID
 * - GET    /insurance-reports/report/:reportId → Get report by report ID
 * - PATCH  /insurance-reports/:id          → Update report
 * - DELETE /insurance-reports/:id          → Delete report
 * - POST   /insurance-reports/:id/approve  → Approve report
 * - POST   /insurance-reports/:id/reject   → Reject report
 * - POST   /insurance-reports/:id/send     → Send to provider
 * - POST   /insurance-reports/:id/acknowledge → Acknowledge report
 *
 * @file insurance-report.controller.ts
 * @module InsuranceReportModule
 * @layer Controllers
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InsuranceReportService } from '../services';
import {
  CreateInsuranceReportDto,
  UpdateInsuranceReportDto,
  InsuranceReportResponseDto,
  RejectInsuranceReportDto,
} from '../dtos';
import { InsuranceReportInternal } from '../interfaces';

/**
 * Request interface with user data from JWT
 */
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    userGuid: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

@Controller('insurance-reports')
@UseGuards(AuthGuard('jwt'))
export class InsuranceReportController {
  private readonly logger = new Logger(InsuranceReportController.name);

  constructor(
    private readonly insuranceReportService: InsuranceReportService,
  ) {}

  /**
   * Create a new Insurance Report
   * POST /insurance-reports
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateInsuranceReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<InsuranceReportResponseDto> {
    const operationId = `create_insurance_report_${Date.now()}`;

    try {
      this.logger.log(`Creating Insurance Report - Operation: ${operationId}`, {
        operationId,
        userRole: req.user.role,
      });

      // Get organization from JWT
      const organizationGuid = req.user.organizationId;

      // Create report
      const result = await this.insuranceReportService.createReport(
        {
          organizationGuid,
          periodStart: new Date(dto.periodStart),
          periodEnd: new Date(dto.periodEnd),
          totalRecords: dto.totalRecords,
          totalValue: dto.totalValue,
          reportStatus: dto.reportStatus,
          privilege: dto.privilege,
          accessModifier: dto.accessModifier,
        },
        req.user.role,
        operationId,
      );

      return this.mapToResponse(result);
    } catch (error) {
      this.logger.error(
        `Error creating Insurance Report - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * List all Insurance Reports
   * GET /insurance-reports
   */
  @Get()
  async findAll(
    @Query('limit') limit?: number,
    @Request() req?: AuthenticatedRequest,
  ): Promise<InsuranceReportResponseDto[]> {
    const operationId = `list_insurance_reports_${Date.now()}`;

    try {
      this.logger.log(`Listing Insurance Reports - Operation: ${operationId}`, {
        operationId,
        userRole: req.user.role,
      });

      const organizationGuid = req.user.organizationId;

      const results = await this.insuranceReportService.listReports(
        organizationGuid,
        req.user.role,
        operationId,
        limit,
      );

      return results.map((r) => this.mapToResponse(r));
    } catch (error) {
      this.logger.error(
        `Error listing Insurance Reports - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * List pending Insurance Reports
   * GET /insurance-reports/pending
   */
  @Get('pending')
  async findPending(
    @Query('limit') limit?: number,
    @Request() req?: AuthenticatedRequest,
  ): Promise<InsuranceReportResponseDto[]> {
    const operationId = `list_pending_insurance_reports_${Date.now()}`;

    try {
      this.logger.log(
        `Listing pending Insurance Reports - Operation: ${operationId}`,
        {
          operationId,
          userRole: req.user.role,
        },
      );

      const organizationGuid = req.user.organizationId;

      const results = await this.insuranceReportService.listPendingReports(
        organizationGuid,
        req.user.role,
        operationId,
        limit,
      );

      return results.map((r) => this.mapToResponse(r));
    } catch (error) {
      this.logger.error(
        `Error listing pending Insurance Reports - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get Insurance Report by ID
   * GET /insurance-reports/:id
   */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<InsuranceReportResponseDto> {
    const operationId = `get_insurance_report_${Date.now()}`;

    try {
      this.logger.log(
        `Getting Insurance Report: ${id} - Operation: ${operationId}`,
        {
          operationId,
          reportId: id,
          userRole: req.user.role,
        },
      );

      const organizationGuid = req.user.organizationId;

      const result = await this.insuranceReportService.getReportById(
        id,
        organizationGuid,
        req.user.role,
        operationId,
      );

      return this.mapToResponse(result);
    } catch (error) {
      this.logger.error(
        `Error getting Insurance Report: ${id} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get Insurance Report by report ID (autonumber)
   * GET /insurance-reports/report/:reportId
   */
  @Get('report/:reportId')
  async findByReportId(
    @Param('reportId') reportId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<InsuranceReportResponseDto> {
    const operationId = `get_insurance_report_by_report_id_${Date.now()}`;

    try {
      this.logger.log(
        `Getting Insurance Report by report ID: ${reportId} - Operation: ${operationId}`,
        {
          operationId,
          reportId,
          userRole: req.user.role,
        },
      );

      const organizationGuid = req.user.organizationId;

      const result = await this.insuranceReportService.getReportByReportId(
        reportId,
        organizationGuid,
        req.user.role,
        operationId,
      );

      return this.mapToResponse(result);
    } catch (error) {
      this.logger.error(
        `Error getting Insurance Report by report ID: ${reportId} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update Insurance Report
   * PATCH /insurance-reports/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<InsuranceReportResponseDto> {
    const operationId = `update_insurance_report_${Date.now()}`;

    try {
      this.logger.log(
        `Updating Insurance Report: ${id} - Operation: ${operationId}`,
        {
          operationId,
          reportId: id,
          userRole: req.user.role,
        },
      );

      const organizationGuid = req.user.organizationId;

      const result = await this.insuranceReportService.updateReport(
        id,
        {
          reportStatus: dto.reportStatus,
          approvedToken: dto.approvedToken,
          approvedBy: dto.approvedBy,
          approvedDate: dto.approvedDate
            ? new Date(dto.approvedDate)
            : undefined,
          rejectionToken: dto.rejectionToken,
          rejectBy: dto.rejectBy,
          rejectedDate: dto.rejectedDate
            ? new Date(dto.rejectedDate)
            : undefined,
          rejectionReason: dto.rejectionReason,
        },
        organizationGuid,
        req.user.role,
        operationId,
      );

      return this.mapToResponse(result);
    } catch (error) {
      this.logger.error(
        `Error updating Insurance Report: ${id} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete Insurance Report
   * DELETE /insurance-reports/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    const operationId = `delete_insurance_report_${Date.now()}`;

    try {
      this.logger.log(
        `Deleting Insurance Report: ${id} - Operation: ${operationId}`,
        {
          operationId,
          reportId: id,
          userRole: req.user.role,
        },
      );

      const organizationGuid = req.user.organizationId;

      await this.insuranceReportService.deleteReport(
        id,
        organizationGuid,
        req.user.role,
        operationId,
      );
    } catch (error) {
      this.logger.error(
        `Error deleting Insurance Report: ${id} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Approve Insurance Report
   * POST /insurance-reports/:id/approve
   */
  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<InsuranceReportResponseDto> {
    const operationId = `approve_insurance_report_${Date.now()}`;

    try {
      this.logger.log(
        `Approving Insurance Report: ${id} - Operation: ${operationId}`,
        {
          operationId,
          reportId: id,
          userRole: req.user.role,
          approverId: req.user.userGuid,
        },
      );

      const organizationGuid = req.user.organizationId;

      const result = await this.insuranceReportService.approveReport(
        id,
        req.user.userGuid,
        organizationGuid,
        req.user.role,
        operationId,
      );

      return this.mapToResponse(result);
    } catch (error) {
      this.logger.error(
        `Error approving Insurance Report: ${id} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Reject Insurance Report
   * POST /insurance-reports/:id/reject
   */
  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectInsuranceReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<InsuranceReportResponseDto> {
    const operationId = `reject_insurance_report_${Date.now()}`;

    try {
      this.logger.log(
        `Rejecting Insurance Report: ${id} - Operation: ${operationId}`,
        {
          operationId,
          reportId: id,
          userRole: req.user.role,
          rejectorId: req.user.userGuid,
        },
      );

      const organizationGuid = req.user.organizationId;

      const result = await this.insuranceReportService.rejectReport(
        id,
        req.user.userGuid,
        dto.reason,
        organizationGuid,
        req.user.role,
        operationId,
      );

      return this.mapToResponse(result);
    } catch (error) {
      this.logger.error(
        `Error rejecting Insurance Report: ${id} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send Insurance Report to provider
   * POST /insurance-reports/:id/send
   */
  @Post(':id/send')
  async sendToProvider(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<InsuranceReportResponseDto> {
    const operationId = `send_insurance_report_${Date.now()}`;

    try {
      this.logger.log(
        `Sending Insurance Report to provider: ${id} - Operation: ${operationId}`,
        {
          operationId,
          reportId: id,
          userRole: req.user.role,
        },
      );

      const organizationGuid = req.user.organizationId;

      const result = await this.insuranceReportService.sendToProvider(
        id,
        organizationGuid,
        req.user.role,
        operationId,
      );

      return this.mapToResponse(result);
    } catch (error) {
      this.logger.error(
        `Error sending Insurance Report to provider: ${id} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Acknowledge Insurance Report
   * POST /insurance-reports/:id/acknowledge
   */
  @Post(':id/acknowledge')
  async acknowledge(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<InsuranceReportResponseDto> {
    const operationId = `acknowledge_insurance_report_${Date.now()}`;

    try {
      this.logger.log(
        `Acknowledging Insurance Report: ${id} - Operation: ${operationId}`,
        {
          operationId,
          reportId: id,
          userRole: req.user.role,
        },
      );

      const organizationGuid = req.user.organizationId;

      const result = await this.insuranceReportService.acknowledgeReport(
        id,
        organizationGuid,
        req.user.role,
        operationId,
      );

      return this.mapToResponse(result);
    } catch (error) {
      this.logger.error(
        `Error acknowledging Insurance Report: ${id} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Map internal model to response DTO
   */
  private mapToResponse(
    internal: InsuranceReportInternal,
  ): InsuranceReportResponseDto {
    return {
      osot_table_insurance_reportid: internal.osot_table_insurance_reportid,
      reportId: internal.reportId,
      organizationGuid: internal.organizationGuid,
      periodStart: internal.periodStart.toISOString(),
      periodEnd: internal.periodEnd.toISOString(),
      totalRecords: internal.totalRecords,
      totalValue: internal.totalValue,
      reportStatus: internal.reportStatus,
      createdon: internal.createdon?.toISOString(),
      modifiedon: internal.modifiedon?.toISOString(),
      approvedBy: internal.approvedBy,
      approvedDate: internal.approvedDate?.toISOString(),
      rejectBy: internal.rejectBy,
      rejectedDate: internal.rejectedDate?.toISOString(),
      rejectionReason: internal.rejectionReason,
    };
  }
}

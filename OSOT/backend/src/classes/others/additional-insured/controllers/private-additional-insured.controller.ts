/**
 * Private Additional Insured Controller
 *
 * AUTHENTICATED ACCESS - REQUIRES AUTHENTICATION & AUTHORIZATION
 *
 * ENDPOINTS:
 * - POST /private/additional-insureds - Create (OWNER/MAIN)
 * - GET /private/additional-insureds/:id - Get by ID
 * - PATCH /private/additional-insureds/:id - Update
 * - DELETE /private/additional-insureds/:id - Delete (OWNER/MAIN)
 *
 * PERMISSIONS (CRUD MATRIX):
 * - CREATE: OWNER ✅, ADMIN ❌, MAIN ✅
 * - READ: OWNER (own), ADMIN (all in org), MAIN (all)
 * - UPDATE: OWNER (own), ADMIN (all in org), MAIN (all)
 * - DELETE: OWNER (own), ADMIN ❌, MAIN ✅
 *
 * @file private-additional-insured.controller.ts
 * @module AdditionalInsuredModule
 * @layer Controllers
 * @since 2026-01-29
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Logger,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdditionalInsuredCrudService } from '../services/additional-insured-crud.service';
import { CreateAdditionalInsuredDto } from '../dtos/create-additional-insured.dto';
import { UpdateAdditionalInsuredDto } from '../dtos/update-additional-insured.dto';
import { AdditionalInsuredResponseDto } from '../dtos/additional-insured-response.dto';
import { decryptOrganizationId } from '../../../../utils/organization-crypto.util';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Request interface with user data from JWT
 */
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    userGuid: string;
    role: string;
    organizationId: string;
  };
}

/**
 * Private Additional Insured Controller
 */
@Controller('private/additional-insureds')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Private Additional Insured Operations')
@ApiBearerAuth('JWT-auth')
export class PrivateAdditionalInsuredController {
  private readonly logger = new Logger(PrivateAdditionalInsuredController.name);

  constructor(private readonly crudService: AdditionalInsuredCrudService) {}

  /**
   * POST /private/additional-insureds
   * Create a new Additional Insured
   * Permission: OWNER or MAIN (ADMIN cannot create)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new Additional Insured',
  })
  @ApiBody({ type: CreateAdditionalInsuredDto })
  @ApiResponse({
    status: 201,
    description: 'Created successfully.',
    type: AdditionalInsuredResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or business rule violation.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - OWNER or MAIN required.',
  })
  async create(
    @Body() createDto: CreateAdditionalInsuredDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    data: AdditionalInsuredResponseDto;
    message: string;
    _links: Record<string, string>;
  }> {
    const operationId = `create_additional_insured_${Date.now()}`;

    try {
      const organizationGuid = decryptOrganizationId(req.user.organizationId);

      this.logger.log(
        `Creating Additional Insured - Operation: ${operationId}`,
        {
          userRole: req.user.role,
          insuranceGuid: createDto.insuranceGuid,
        },
      );

      const created = await this.crudService.create(
        createDto,
        organizationGuid,
        req.user.userGuid,
        req.user.role,
      );

      this.logger.log(
        `Additional Insured created - Operation: ${operationId}`,
        {
          additionalInsuredId: created.osot_table_additional_insuredid,
          companyName: created.osot_company_name,
        },
      );

      return {
        data: created,
        message: 'Additional Insured created successfully',
        _links: {
          self: `/private/additional-insureds/${created.osot_table_additional_insuredid}`,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error creating Additional Insured - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * GET /private/additional-insureds/:id
   * Get Additional Insured by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get Additional Insured by ID',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Additional Insured GUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Found.',
    type: AdditionalInsuredResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found.',
  })
  async findById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ data: AdditionalInsuredResponseDto; message: string }> {
    const operationId = `find_additional_insured_${Date.now()}`;

    try {
      const organizationGuid = decryptOrganizationId(req.user.organizationId);

      const found = await this.crudService.findById(
        id,
        organizationGuid,
        req.user.userGuid,
        req.user.role,
      );

      if (!found) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Additional Insured not found',
          operationId,
          recordId: id,
        });
      }

      return {
        data: found,
        message: 'Retrieved successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error finding Additional Insured ${id} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * PATCH /private/additional-insureds/:id
   * Update an Additional Insured
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Additional Insured',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Additional Insured GUID',
  })
  @ApiBody({ type: UpdateAdditionalInsuredDto })
  @ApiResponse({
    status: 200,
    description: 'Updated successfully.',
    type: AdditionalInsuredResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or immutable field update.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAdditionalInsuredDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ data: AdditionalInsuredResponseDto; message: string }> {
    const operationId = `update_additional_insured_${Date.now()}`;

    try {
      const organizationGuid = decryptOrganizationId(req.user.organizationId);

      const updated = await this.crudService.update(
        id,
        updateDto,
        organizationGuid,
        req.user.userGuid,
        req.user.role,
      );

      return {
        data: updated,
        message: 'Updated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error updating Additional Insured ${id} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * DELETE /private/additional-insureds/:id
   * Delete an Additional Insured (soft delete)
   * Permission: OWNER (own) or MAIN (ADMIN cannot delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete Additional Insured',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Additional Insured GUID',
  })
  @ApiResponse({
    status: 204,
    description: 'Deleted successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - ADMIN cannot delete.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found.',
  })
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    const operationId = `delete_additional_insured_${Date.now()}`;

    try {
      const organizationGuid = decryptOrganizationId(req.user.organizationId);

      await this.crudService.delete(
        id,
        organizationGuid,
        req.user.userGuid,
        req.user.role,
      );

      this.logger.log(
        `Additional Insured ${id} deleted - Operation: ${operationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error deleting Additional Insured ${id} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }
}

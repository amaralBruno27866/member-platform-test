/**
 * @fileoverview Membership Settings Public Controller
 * @description Handles PUBLIC routes for membership settings display and lookup
 * @author Bruno Amaral
 * @since 2024
 *
 * Public Routes:
 * - GET /public/membership-settings/active → All active membership settings
 * - GET /public/membership-settings/active/group/:group → Active settings by group
 *
 * Usage:
 * - Membership registration forms
 * - Public website membership information
 * - UI/UX group filtering
 * - No authentication required
 *
 * Security:
 * - Only active settings are exposed
 * - No sensitive administrative data
 * - Rate limiting recommended
 */

import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { MembershipSettingsLookupService } from '../services/membership-settings-lookup.service';
import { MembershipSettingsResponseDto } from '../dtos/membership-settings-response.dto';
import { MembershipGroup } from '../enums/membership-group.enum';

@Controller('public/membership-settings')
@ApiTags('Public Membership Settings')
export class MembershipSettingsPublicController {
  private readonly logger = new Logger(MembershipSettingsPublicController.name);
  private readonly defaultOrganizationGuid: string;

  constructor(
    private readonly lookupService: MembershipSettingsLookupService,
    private readonly configService: ConfigService,
  ) {
    // Use OSOT master organization for public endpoints
    this.defaultOrganizationGuid =
      this.configService.get<string>('OSOT_ORGANIZATION_GUID') ||
      process.env.OSOT_ORGANIZATION_GUID ||
      'a4f46aa9-2d5e-ef11-a670-000d3a8c1c9c'; // Default OSOT master org GUID
  }

  // ========================================
  // ACTIVE MEMBERSHIP FEES ROUTES
  // ========================================

  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all active membership settings',
    description:
      'Returns all active membership settings for public display. Used by registration forms and membership information components.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active membership settings retrieved successfully.',
    type: [MembershipSettingsResponseDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getActiveSettings(): Promise<MembershipSettingsResponseDto[]> {
    this.logger.log(
      'Fetching all active membership settings for public display',
    );

    try {
      const activeSettings = await this.lookupService.getActiveSettings(
        this.defaultOrganizationGuid,
      );

      this.logger.log(
        `Found ${activeSettings.length} active membership settings`,
      );
      return activeSettings;
    } catch (error) {
      this.logger.error('Failed to fetch active membership settings', error);
      throw error;
    }
  }

  @Get('active/group/:group')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active membership settings by group',
    description:
      'Returns active membership settings filtered by group. Useful for UI/UX group-specific membership display.',
  })
  @ApiParam({
    name: 'group',
    description: 'Membership group filter (1=Individual, 2=Business)',
    enum: MembershipGroup,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Active membership settings for group retrieved successfully.',
    type: [MembershipSettingsResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid group provided.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getActiveSettingsByGroup(
    @Param('group') group: string,
  ): Promise<MembershipSettingsResponseDto[]> {
    this.logger.log(`Fetching active membership settings for group: ${group}`);

    try {
      // Validate and parse group enum
      const groupNumber = parseInt(group, 10);
      const validGroups = Object.values(MembershipGroup).filter(
        (v) => typeof v === 'number',
      ) as number[];

      if (!validGroups.includes(groupNumber)) {
        throw new BadRequestException(
          `Invalid group: ${group}. Valid groups: ${validGroups.join(', ')} (1=Individual, 2=Business)`,
        );
      }

      const groupEnum = groupNumber as MembershipGroup;

      const activeSettings = await this.lookupService.getActiveSettings(
        this.defaultOrganizationGuid,
      );

      // Filter by group (osot_membership_group is string in Response DTO, e.g., "Individual" or "Business")
      const groupLabel =
        groupEnum === MembershipGroup.INDIVIDUAL ? 'Individual' : 'Business';
      const filteredSettings = activeSettings.filter(
        (setting) => setting.osot_membership_group === groupLabel,
      );

      this.logger.log(
        `Found ${filteredSettings.length} active membership settings for group ${group}`,
      );
      return filteredSettings;
    } catch (error) {
      this.logger.error(
        `Failed to fetch active membership settings for group: ${group}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Health check endpoint for testing table connectivity
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Simple health check to verify table connectivity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy.',
  })
  async healthCheck(): Promise<{
    status: string;
    message: string;
    timestamp: string;
  }> {
    this.logger.log('Health check requested');

    try {
      // Use lookup service for consistent app selection and permissions
      await this.lookupService.getActiveSettings(this.defaultOrganizationGuid);

      return {
        status: 'healthy',
        message: 'Membership settings service is operational.',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Debug endpoint for testing raw table access
   */
  @Get('debug')
  @ApiOperation({
    summary: 'Debug table access',
    description: 'Simple query without filters to test raw table access.',
  })
  async debugTableAccess(): Promise<{
    status: string;
    message: string;
    timestamp: string;
  }> {
    this.logger.log('Debug table access requested');

    try {
      // Use lookup service which already has the correct app selection logic
      const activeSettings = await this.lookupService.getActiveSettings(
        this.defaultOrganizationGuid,
      );

      return {
        status: 'success',
        message: `Table access successful. Found ${activeSettings.length} active settings.`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Debug table access failed', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

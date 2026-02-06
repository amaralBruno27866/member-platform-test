/**
 * Public Organization Controller
 *
 * PUBLIC ACCESS - NO AUTHENTICATION REQUIRED
 *
 * ENDPOINTS:
 * - GET /public/organization/:slug - Get organization by slug
 *
 * SECURITY:
 * - No authentication required
 * - Returns only safe public fields (6 fields)
 * - Used for white-label login page customization
 *
 * USE CASE:
 * - White-label login: /login/{slug}
 * - Landing page organization display
 * - Public organization lookup for branding
 *
 * PUBLIC FIELDS EXPOSED:
 * - osot_slug (string)
 * - osot_organization_name (string)
 * - osot_acronym (string)
 * - osot_organization_logo (URL)
 * - osot_organization_website (URL)
 * - osot_organization_status (AccountStatus)
 *
 * @file organization-public.controller.ts
 * @module OrganizationModule
 * @layer Controllers
 * @since 2026-01-07
 */

import {
  Controller,
  Get,
  Param,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrganizationLookupService } from '../services/organization-lookup.service';
import { OrganizationPublicResponseDto } from '../dtos/organization-response.dto';

/**
 * Public Organization Controller
 * Handles all public organization endpoints (no authentication required)
 */
@Controller('public/organizations')
@ApiTags('Public Organization Operations')
export class OrganizationPublicController {
  private readonly logger = new Logger(OrganizationPublicController.name);

  constructor(
    private readonly organizationLookupService: OrganizationLookupService,
  ) {}

  /**
   * GET /public/organization/:slug
   * Get organization by slug (for white-label login)
   *
   * IMPORTANT: This endpoint is PUBLIC (no authentication required)
   * Used by white-label login page to customize branding and identify organization
   *
   * @param slug - Organization slug (e.g., 'osot', 'my-clinic')
   * @returns Organization public data (6 safe fields)
   * @throws NotFoundException if organization not found or inactive
   */
  @Get(':slug')
  @ApiOperation({
    summary: 'Get organization by slug (public access)',
    description:
      'Returns public organization data for white-label login page customization. ' +
      'No authentication required. Returns only safe fields (name, logo, website, etc.). ' +
      'Used by frontend to brand the login page based on organization slug.',
  })
  @ApiParam({
    name: 'slug',
    description:
      'Organization slug (unique identifier, e.g., "osot", "my-clinic")',
    example: 'osot',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization found and data returned.',
    type: OrganizationPublicResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Organization not found or inactive.',
  })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<OrganizationPublicResponseDto> {
    this.logger.log(`Public request: Get organization by slug "${slug}"`);

    const organization = await this.organizationLookupService.findBySlug(slug);

    if (!organization) {
      this.logger.warn(
        `Organization with slug "${slug}" not found or inactive`,
      );
      throw new NotFoundException(
        `Organization "${slug}" not found or inactive`,
      );
    }

    this.logger.log(
      `Organization "${slug}" found: ${organization.osot_organization_name}`,
    );
    return organization;
  }
}

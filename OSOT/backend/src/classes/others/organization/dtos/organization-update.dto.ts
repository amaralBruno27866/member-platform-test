/**
 * Update Organization DTO
 * DTO for organization update operations
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Inherits all validation from OrganizationBasicDto
 * - Makes all fields optional (partial update support)
 * - Requires organization ID for update identification
 * - Excludes slug field (immutable after creation)
 * - Integrates with DataverseService for OData entity updates
 *
 * DATAVERSE INTEGRATION:
 * - Preserves system-generated fields during updates
 * - Validates Organization ID for existing record identification
 * - Business rule validation during organization modification
 * - Slug is immutable and cannot be updated
 *
 * USAGE CONTEXT:
 * - Organization updates via administrative endpoints
 * - Branding updates (logo, website)
 * - Contact information updates
 * - Status changes (Active/Inactive/Pending)
 * - API integration with organization management systems
 *
 * BUSINESS RULES:
 * - Organization ID is required for updates (identifies existing record)
 * - All business fields can be updated with proper validation
 * - Slug cannot be changed after creation (immutable)
 * - System fields (timestamps, owner, business ID) are managed automatically
 * - At least one field must be provided for update
 */

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { OrganizationBasicDto } from './organization-basic.dto';

/**
 * Base class with all fields optional (via PartialType)
 * This allows partial updates where only changed fields are sent
 */
export class UpdateOrganizationDto extends PartialType(OrganizationBasicDto) {
  @ApiProperty({
    example: 'osot-org-0000001',
    description: 'Organization business ID (required for updates)',
  })
  @IsNotEmpty({ message: 'Organization ID is required for updates' })
  @IsString({ message: 'Organization ID must be a string' })
  osot_organizationid: string;

  // Note: Slug is NOT included in updates (immutable after creation)
  // If slug needs to be changed, a new organization must be created

  // Note: All other fields inherited from OrganizationBasicDto
  // are now optional and can be updated with the same validation rules

  // System fields that will be auto-updated:
  // - modifiedon: Updated to current timestamp
  // - ownerid: Preserved from existing record
  // - createdon: Preserved from existing record
  // - osot_table_organizationid: Preserved (immutable GUID)
  // - osot_slug: Preserved (immutable after creation)
}

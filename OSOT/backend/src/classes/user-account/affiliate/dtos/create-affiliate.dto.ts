/**
 * Create Affiliate DTO
 * Extends AffiliateBasicDto for affiliate creation operations
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Inherits all validation and transformation from AffiliateBasicDto
 * - Adds password field with comprehensive security validation
 * - Includes Dataverse OData binding capabilities
 * - Supports optional system-generated field override
 *
 * DATAVERSE INTEGRATION:
 * - OData bind support for related entities
 * - UUID generation override capability
 * - Password field for initial account setup
 * - Comprehensive validation for registration workflow
 *
 * USAGE CONTEXT:
 * - Affiliate registration via public endpoints
 * - Administrative affiliate creation via private endpoints
 * - Bulk affiliate import operations
 * - API integration with external systems
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, Validate } from 'class-validator';
import { AffiliateBasicDto } from './affiliate-basic.dto';
import { AFFILIATE_FIELD_LIMITS } from '../constants/affiliate.constants';
import {
  AffiliatePasswordValidator,
  PasswordPolicyValidator,
} from '../validators/affiliate.validators';

export class CreateAffiliateDto extends AffiliateBasicDto {
  // ========================================
  // PASSWORD & SECURITY (Business Required for Creation)
  // ========================================

  @ApiProperty({
    example: 'MySecureP@ssw0rd!',
    description:
      'Account password with comprehensive security requirements (business required)',
    maxLength: AFFILIATE_FIELD_LIMITS.PASSWORD,
    writeOnly: true,
  })
  @IsString()
  @MaxLength(AFFILIATE_FIELD_LIMITS.PASSWORD)
  @Validate(AffiliatePasswordValidator)
  @Validate(PasswordPolicyValidator)
  osot_password: string;
}

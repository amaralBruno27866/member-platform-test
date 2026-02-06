/**
 * Affiliate Admin Approval DTO
 *
 * PURPOSE:
 * - Handles admin approval/rejection actions in affiliate registration workflow
 * - Validates approval action and optional reason
 * - Used by POST /public/affiliates/approve/{token} endpoint
 *
 * WORKFLOW:
 * - Admin receives email with approve/reject tokens
 * - Clicks link to process approval with this payload
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';

export class AffiliateAdminApprovalDto {
  @ApiProperty({
    example: 'approve',
    description: 'Action to perform on the affiliate registration',
    enum: ['approve', 'reject'],
  })
  @IsString()
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  @ApiProperty({
    example: 'Organization verified and meets all requirements',
    description: 'Optional reason for the approval/rejection decision',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

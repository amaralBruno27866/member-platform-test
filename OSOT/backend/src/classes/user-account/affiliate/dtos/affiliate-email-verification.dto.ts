/**
 * Affiliate Email Verification DTO
 *
 * PURPOSE:
 * - Handles email verification step in affiliate registration workflow
 * - Validates session ID and verification token format
 * - Used by POST /public/affiliates/verify-email endpoint
 *
 * SECURITY:
 * - Token validation ensures only valid verification attempts
 * - Session ID links to temporary registration data in Redis
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class AffiliateEmailVerificationDto {
  @ApiProperty({
    example: 'aff_1729000000000_a1b2c3d4e5f6',
    description:
      'Registration session ID returned from affiliate registration staging',
    minLength: 20,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(50)
  @Matches(/^aff_\d+_[a-z0-9]+$/, {
    message: 'Session ID must follow format: aff_{timestamp}_{random}',
  })
  sessionId: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    description:
      'Verification token sent to affiliate email (64 character hex string)',
    minLength: 64,
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(64)
  @MaxLength(64)
  @Matches(/^[a-f0-9]{64}$/, {
    message: 'Verification token must be a 64-character hex string',
  })
  verificationToken: string;
}

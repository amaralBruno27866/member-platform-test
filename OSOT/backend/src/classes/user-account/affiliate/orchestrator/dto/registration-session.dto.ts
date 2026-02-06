import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Privilege } from '../../../../../common/enums/privilege.enum';

/**
 * ORCHESTRATOR DTO SPECIFICATION: Affiliate Registration Session Management
 *
 * These DTOs define the exact structure for Redis session storage and
 * API communication during the affiliate registration workflow.
 *
 * Used by: AffiliateOrchestrator, RedisService, Public/Private Controllers
 */

export enum AffiliateRegistrationStatus {
  PENDING = 'pending',
  STAGED = 'staged',
  EMAIL_VERIFIED = 'email_verified',
  ADMIN_APPROVED = 'admin_approved',
  ADMIN_REJECTED = 'admin_rejected',
  ACCOUNT_CREATED = 'account_created',
  CREATION_FAILED = 'creation_failed',
  WORKFLOW_COMPLETED = 'workflow_completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export class AffiliateProgressState {
  @ApiProperty({ description: 'Registration data has been staged in Redis' })
  @IsBoolean()
  staged: boolean;

  @ApiProperty({ description: 'Email verification has been completed' })
  @IsBoolean()
  emailVerified: boolean;

  @ApiProperty({ description: 'Admin has approved the registration' })
  @IsBoolean()
  adminApproval: boolean;

  @ApiProperty({ description: 'Account has been persisted to Dataverse' })
  @IsBoolean()
  accountCreated: boolean;

  @ApiProperty({ description: 'Registration workflow has been completed' })
  @IsBoolean()
  workflowCompleted: boolean;
}

export class AffiliateOrganizationData {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  organizationName: string;

  @ApiProperty({ description: 'Organization email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Business area ID' })
  @IsNumber()
  @Min(1)
  area: number;

  @ApiProperty({ description: 'City name', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Province name', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ description: 'Country name', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Representative name', required: false })
  @IsOptional()
  @IsString()
  representativeName?: string;

  @ApiProperty({ description: 'Representative job title', required: false })
  @IsOptional()
  @IsString()
  representativeJobTitle?: string;
}

/**
 * Main session DTO stored in Redis during registration workflow
 */
export class AffiliateRegistrationSessionDto {
  @ApiProperty({ description: 'Unique session identifier' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'Current registration status',
    enum: AffiliateRegistrationStatus,
  })
  @IsEnum(AffiliateRegistrationStatus)
  status: AffiliateRegistrationStatus;

  @ApiProperty({ description: 'Registration progress tracking' })
  @ValidateNested()
  @Type(() => AffiliateProgressState)
  progress: AffiliateProgressState;

  @ApiProperty({ description: 'Organization data for registration' })
  @ValidateNested()
  @Type(() => AffiliateOrganizationData)
  affiliateData: AffiliateOrganizationData;

  @ApiProperty({ description: 'Hashed password for the affiliate account' })
  @IsString()
  hashedPassword: string;

  @ApiProperty({ description: 'Email verification token' })
  @IsString()
  verificationToken: string;

  @ApiProperty({ description: 'Session creation timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Session last update timestamp' })
  @IsDateString()
  updatedAt: string;

  @ApiProperty({ description: 'Session expiration timestamp' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({ description: 'Number of verification email resend attempts' })
  @IsNumber()
  @Min(0)
  @Max(10)
  emailResendAttempts: number;

  @ApiProperty({
    description: 'Admin notes during approval process',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  adminNotes?: string[];

  @ApiProperty({
    description: 'Error messages during workflow',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errorMessages?: string[];

  @ApiProperty({
    description: 'Admin ID who processed approval',
    required: false,
  })
  @IsOptional()
  @IsString()
  processedBy?: string;

  @ApiProperty({
    description: 'Approval processing timestamp',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  processedAt?: string;

  @ApiProperty({
    description: 'Rejection reason if applicable',
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiProperty({
    description: 'Created affiliate ID after successful registration',
    required: false,
  })
  @IsOptional()
  @IsString()
  affiliateId?: string;
}

/**
 * DTO for staging a new affiliate registration
 */
export class StageAffiliateRegistrationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  organizationName: string;

  @ApiProperty({ description: 'Organization email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Account password' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'Business area ID' })
  @IsNumber()
  @Min(1)
  area: number;

  @ApiProperty({ description: 'City name', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Province name', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ description: 'Country name', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Representative name', required: false })
  @IsOptional()
  @IsString()
  representativeName?: string;

  @ApiProperty({ description: 'Representative job title', required: false })
  @IsOptional()
  @IsString()
  representativeJobTitle?: string;

  @ApiProperty({ description: 'Organization website', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ description: 'Organization phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Organization address', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

/**
 * DTO for email verification request
 */
export class VerifyAffiliateEmailDto {
  @ApiProperty({ description: 'Registration session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Email verification token' })
  @IsString()
  verificationToken: string;
}

/**
 * DTO for admin approval/rejection
 */
export class ProcessAffiliateApprovalDto {
  @ApiProperty({ description: 'Registration session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Whether the registration is approved' })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({ description: 'Admin ID making the decision' })
  @IsString()
  adminId: string;

  @ApiProperty({ description: 'Admin privilege level', enum: Privilege })
  @IsEnum(Privilege)
  adminPrivilege: Privilege;

  @ApiProperty({
    description: 'Reason for rejection if applicable',
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiProperty({ description: 'Admin notes', required: false })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

/**
 * DTO for listing pending registrations (admin only)
 */
export class ListPendingRegistrationsDto {
  @ApiProperty({ description: 'Admin privilege level', enum: Privilege })
  @IsEnum(Privilege)
  adminPrivilege: Privilege;

  @ApiProperty({ description: 'Filter by status', required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(AffiliateRegistrationStatus, { each: true })
  status?: AffiliateRegistrationStatus[];

  @ApiProperty({ description: 'Filter by business area', required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  area?: number[];

  @ApiProperty({ description: 'Filter by city', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  city?: string[];

  @ApiProperty({ description: 'Filter by province', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  province?: string[];

  @ApiProperty({ description: 'Filter by country', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  country?: string[];

  @ApiProperty({ description: 'Filter from date', required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ description: 'Filter to date', required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({ description: 'Maximum number of results', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ description: 'Number of records to skip', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

/**
 * DTO for resending verification email
 */
export class ResendVerificationEmailDto {
  @ApiProperty({ description: 'Registration session ID' })
  @IsUUID()
  sessionId: string;
}

/**
 * DTO for cancelling registration
 */
export class CancelRegistrationDto {
  @ApiProperty({ description: 'Registration session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Reason for cancellation' })
  @IsString()
  reason: string;
}

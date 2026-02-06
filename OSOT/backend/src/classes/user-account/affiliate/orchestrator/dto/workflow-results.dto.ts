import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ErrorCodes } from '../../../../../common/errors/error-codes';
import {
  AffiliateRegistrationStatus,
  AffiliateProgressState,
  AffiliateOrganizationData,
} from './registration-session.dto';
import { AffiliateInternal } from '../../interfaces/affiliate-internal.interface';

/**
 * ORCHESTRATOR DTO SPECIFICATION: Workflow Results
 *
 * These DTOs define standardized response structures for all
 * affiliate registration orchestrator operations.
 *
 * Used by: Controllers, Services, External API consumers
 */

/**
 * Base result interface for all orchestrator operations
 */
export class BaseAffiliateWorkflowResult {
  @ApiProperty({ description: 'Whether the operation was successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Human-readable message describing the result' })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Error code if operation failed',
    required: false,
  })
  @IsOptional()
  @IsEnum(ErrorCodes)
  errorCode?: ErrorCodes;

  @ApiProperty({ description: 'Timestamp of the operation' })
  @IsDateString()
  timestamp: string;
}

/**
 * Result for staging affiliate registration
 */
export class AffiliateRegistrationStageResultDto extends BaseAffiliateWorkflowResult {
  @ApiProperty({ description: 'Registration session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Session expiration timestamp' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({
    description: 'Whether verification email was sent successfully',
  })
  @IsBoolean()
  verificationEmailSent: boolean;

  @ApiProperty({ description: 'Organization data that was staged' })
  @ValidateNested()
  @Type(() => AffiliateOrganizationData)
  affiliateData: AffiliateOrganizationData;
}

/**
 * Result for email verification
 */
export class AffiliateEmailVerificationResultDto extends BaseAffiliateWorkflowResult {
  @ApiProperty({ description: 'Registration session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Whether email was successfully verified' })
  @IsBoolean()
  emailVerified: boolean;

  @ApiProperty({ description: 'Whether admin notification was sent' })
  @IsBoolean()
  adminNotified: boolean;

  @ApiProperty({
    description: 'Updated registration status',
    enum: AffiliateRegistrationStatus,
  })
  @IsEnum(AffiliateRegistrationStatus)
  status: AffiliateRegistrationStatus;
}

/**
 * Result for admin approval/rejection process
 */
export class AffiliateApprovalResultDto extends BaseAffiliateWorkflowResult {
  @ApiProperty({ description: 'Registration session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Whether the registration was approved' })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({ description: 'Admin ID who processed the approval' })
  @IsString()
  processedBy: string;

  @ApiProperty({ description: 'Processing timestamp' })
  @IsDateString()
  processedAt: string;

  @ApiProperty({
    description: 'Rejection reason if applicable',
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiProperty({
    description: 'Whether account creation was automatically triggered',
  })
  @IsBoolean()
  accountCreationTriggered: boolean;

  @ApiProperty({
    description: 'Updated registration status',
    enum: AffiliateRegistrationStatus,
  })
  @IsEnum(AffiliateRegistrationStatus)
  status: AffiliateRegistrationStatus;
}

/**
 * Result for affiliate account creation
 */
export class AffiliateAccountCreationResultDto extends BaseAffiliateWorkflowResult {
  @ApiProperty({ description: 'Registration session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Created affiliate ID', required: false })
  @IsOptional()
  @IsString()
  affiliateId?: string;

  @ApiProperty({ description: 'Created affiliate data', required: false })
  @IsOptional()
  affiliate?: AffiliateInternal;

  @ApiProperty({ description: 'Whether welcome email was sent' })
  @IsBoolean()
  welcomeEmailSent: boolean;

  @ApiProperty({ description: 'Whether Redis session was cleaned up' })
  @IsBoolean()
  sessionCleanedUp: boolean;

  @ApiProperty({
    description: 'Final registration status',
    enum: AffiliateRegistrationStatus,
  })
  @IsEnum(AffiliateRegistrationStatus)
  finalStatus: AffiliateRegistrationStatus;
}

/**
 * Result for getting registration status
 */
export class AffiliateRegistrationStatusResultDto {
  @ApiProperty({ description: 'Registration session ID' })
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

  @ApiProperty({ description: 'Session creation timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Session last update timestamp' })
  @IsDateString()
  updatedAt: string;

  @ApiProperty({ description: 'Session expiration timestamp' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({ description: 'Organization data for the registration' })
  @ValidateNested()
  @Type(() => AffiliateOrganizationData)
  affiliateData: AffiliateOrganizationData;

  @ApiProperty({
    description: 'Admin notes during the process',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  adminNotes?: string[];

  @ApiProperty({ description: 'Error messages if any', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errorMessages?: string[];

  @ApiProperty({ description: 'Admin who processed approval', required: false })
  @IsOptional()
  @IsString()
  processedBy?: string;

  @ApiProperty({ description: 'Processing timestamp', required: false })
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
    description: 'Created affiliate ID if completed',
    required: false,
  })
  @IsOptional()
  @IsString()
  affiliateId?: string;
}

/**
 * Result for cancelling registration
 */
export class AffiliateCancellationResultDto extends BaseAffiliateWorkflowResult {
  @ApiProperty({ description: 'Registration session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Cancellation reason' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Whether Redis session was cleaned up' })
  @IsBoolean()
  sessionCleanedUp: boolean;
}

/**
 * Result for resending verification email
 */
export class AffiliateEmailResendResultDto extends BaseAffiliateWorkflowResult {
  @ApiProperty({ description: 'Registration session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Whether email was sent successfully' })
  @IsBoolean()
  emailSent: boolean;

  @ApiProperty({ description: 'Number of resend attempts remaining' })
  @IsNumber()
  attemptsRemaining: number;

  @ApiProperty({ description: 'Total attempts made so far' })
  @IsNumber()
  totalAttempts: number;
}

/**
 * Single pending registration item for admin lists
 */
export class PendingAffiliateRegistrationDto {
  @ApiProperty({ description: 'Registration session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'Current registration status',
    enum: AffiliateRegistrationStatus,
  })
  @IsEnum(AffiliateRegistrationStatus)
  status: AffiliateRegistrationStatus;

  @ApiProperty({ description: 'Organization data' })
  @ValidateNested()
  @Type(() => AffiliateOrganizationData)
  affiliateData: AffiliateOrganizationData;

  @ApiProperty({ description: 'Registration creation timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Days since registration' })
  @IsNumber()
  daysOld: number;

  @ApiProperty({ description: 'Whether email was verified' })
  @IsBoolean()
  emailVerified: boolean;

  @ApiProperty({ description: 'Admin notes count' })
  @IsNumber()
  adminNotesCount: number;

  @ApiProperty({ description: 'Last admin who interacted', required: false })
  @IsOptional()
  @IsString()
  lastProcessedBy?: string;
}

/**
 * Result for listing pending registrations
 */
export class AffiliatePendingRegistrationsListDto {
  @ApiProperty({ description: 'Total number of pending registrations' })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Number of results returned' })
  @IsNumber()
  count: number;

  @ApiProperty({ description: 'Offset used for pagination' })
  @IsNumber()
  offset: number;

  @ApiProperty({ description: 'Limit used for pagination' })
  @IsNumber()
  limit: number;

  @ApiProperty({
    description: 'List of pending registrations',
    type: [PendingAffiliateRegistrationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PendingAffiliateRegistrationDto)
  registrations: PendingAffiliateRegistrationDto[];

  @ApiProperty({ description: 'Applied filters summary' })
  filters: {
    status?: AffiliateRegistrationStatus[];
    area?: number[];
    city?: string[];
    province?: string[];
    country?: string[];
    dateFrom?: string;
    dateTo?: string;
  };
}

/**
 * Summary statistics for admin dashboard
 */
export class AffiliateRegistrationStatsDto {
  @ApiProperty({ description: 'Total pending registrations' })
  @IsNumber()
  totalPending: number;

  @ApiProperty({ description: 'Registrations awaiting email verification' })
  @IsNumber()
  awaitingEmailVerification: number;

  @ApiProperty({ description: 'Registrations awaiting admin approval' })
  @IsNumber()
  awaitingAdminApproval: number;

  @ApiProperty({ description: 'Registrations processed today' })
  @IsNumber()
  processedToday: number;

  @ApiProperty({ description: 'Registrations processed this week' })
  @IsNumber()
  processedThisWeek: number;

  @ApiProperty({ description: 'Average processing time in hours' })
  @IsNumber()
  avgProcessingTimeHours: number;

  @ApiProperty({ description: 'Success rate percentage' })
  @IsNumber()
  successRatePercent: number;
}

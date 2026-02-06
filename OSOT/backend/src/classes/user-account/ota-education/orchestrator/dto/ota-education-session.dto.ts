import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsUUID,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  OtUniversity,
  Country,
  GraduationYear,
  EducationCategory,
  DegreeType,
} from '../../../../../common/enums';
import { AccessModifier } from '../../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../../common/enums/privilege.enum';

/**
 * ORCHESTRATOR DTO SPECIFICATION: OTA Education Session Management
 *
 * These DTOs define the exact structure for Redis session storage and
 * API communication during the OTA education registration workflow.
 *
 * Used by: OtaEducationOrchestrator, RedisService, Public Controller
 */

export enum OtaEducationRegistrationStatus {
  PENDING = 'pending',
  STAGED = 'staged',
  VALIDATED = 'validated',
  CATEGORY_DETERMINED = 'category_determined',
  ACCOUNT_LINKED = 'account_linked',
  EDUCATION_CREATED = 'education_created',
  CREATION_FAILED = 'creation_failed',
  WORKFLOW_COMPLETED = 'workflow_completed',
}

export class OtaEducationProgressState {
  @ApiProperty({ description: 'Education data has been staged in Redis' })
  @IsBoolean()
  staged: boolean;

  @ApiProperty({ description: 'Education validation has been completed' })
  @IsBoolean()
  validated: boolean;

  @ApiProperty({ description: 'Education category has been determined' })
  @IsBoolean()
  categoryDetermined: boolean;

  @ApiProperty({ description: 'Account linking has been verified' })
  @IsBoolean()
  accountLinked: boolean;

  @ApiProperty({
    description: 'Education record has been persisted to Dataverse',
  })
  @IsBoolean()
  persisted: boolean;
}

export class OtaEducationValidationMetadata {
  @ApiProperty({ description: 'User Business ID uniqueness validated' })
  @IsBoolean()
  userBusinessIdValid: boolean;

  @ApiProperty({ description: 'College-country alignment valid' })
  @IsBoolean()
  collegeCountryValid: boolean;

  @ApiProperty({ description: 'University-country pairing valid' })
  @IsBoolean()
  universityCountryValid: boolean;

  @ApiProperty({ description: 'Graduation year constraints valid' })
  @IsBoolean()
  graduationYearValid: boolean;

  @ApiProperty({
    description: 'Education category determined',
    required: false,
  })
  @IsOptional()
  @IsEnum(EducationCategory)
  determinedCategory?: EducationCategory;

  @ApiProperty({
    description: 'Membership expires date used for category determination',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  membershipExpiresDate?: string;
}

export class OtaEducationSessionData {
  @ApiProperty({ description: 'User business ID for association' })
  @IsString()
  userBusinessId: string;

  @ApiProperty({ description: 'Graduation year' })
  @IsNumber()
  @IsEnum(GraduationYear)
  graduationYear: GraduationYear;

  @ApiProperty({ description: 'University where education was completed' })
  @IsNumber()
  @IsEnum(OtUniversity)
  university: OtUniversity;

  @ApiProperty({ description: 'Country of education' })
  @IsNumber()
  @IsEnum(Country)
  country: Country;

  @ApiProperty({ description: 'Degree type obtained' })
  @IsNumber()
  @IsEnum(DegreeType)
  degreeType: DegreeType;

  @ApiProperty({ description: 'College where education was completed' })
  @IsString()
  college: string;

  @ApiProperty({
    description: 'Access modifier for record visibility',
    enum: AccessModifier,
    default: AccessModifier.PRIVATE,
  })
  @IsEnum(AccessModifier)
  @IsOptional()
  accessModifier?: AccessModifier;
}

export class OtaEducationRegistrationSession {
  @ApiProperty({ description: 'Unique session identifier' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'User business ID associated with session' })
  @IsString()
  userBusinessId: string;

  @ApiProperty({
    description: 'Current registration status',
    enum: OtaEducationRegistrationStatus,
  })
  @IsEnum(OtaEducationRegistrationStatus)
  status: OtaEducationRegistrationStatus;

  @ApiProperty({ description: 'Session creation timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Last updated timestamp' })
  @IsDateString()
  lastUpdatedAt: string;

  @ApiProperty({
    description: 'Session expiration timestamp',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({
    description: 'Education data for registration',
    type: OtaEducationSessionData,
  })
  @ValidateNested()
  @Type(() => OtaEducationSessionData)
  educationData: OtaEducationSessionData;

  @ApiProperty({
    description: 'Progress tracking state',
    type: OtaEducationProgressState,
  })
  @ValidateNested()
  @Type(() => OtaEducationProgressState)
  progress: OtaEducationProgressState;

  @ApiProperty({
    description: 'Validation metadata and results',
    type: OtaEducationValidationMetadata,
  })
  @ValidateNested()
  @Type(() => OtaEducationValidationMetadata)
  validation: OtaEducationValidationMetadata;

  @ApiProperty({
    description: 'Associated account ID after linking',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  linkedAccountId?: string;

  @ApiProperty({
    description: 'Final education record ID after creation',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  createdEducationId?: string;

  @ApiProperty({
    description: 'Error messages during workflow',
    required: false,
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({
    description: 'User privilege level for operations',
    enum: Privilege,
    required: false,
  })
  @IsOptional()
  @IsEnum(Privilege)
  userPrivilege?: Privilege;
}

// ========================================
// STAGE REQUEST/RESPONSE DTOs
// ========================================

export class OtaEducationStageRequest {
  @ApiProperty({ description: 'User business ID for session association' })
  @IsString()
  userBusinessId: string;

  @ApiProperty({
    description: 'Education data to stage',
    type: OtaEducationSessionData,
  })
  @ValidateNested()
  @Type(() => OtaEducationSessionData)
  educationData: OtaEducationSessionData;

  @ApiProperty({
    description: 'Session configuration options',
    required: false,
  })
  @IsOptional()
  options?: {
    expirationHours?: number;
    skipValidation?: boolean;
    priority?: 'normal' | 'high' | 'urgent';
  };
}

export class OtaEducationStageResponse {
  @ApiProperty({ description: 'Created session identifier' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Session creation timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Session expiration timestamp' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({
    description: 'Initial registration status',
    enum: OtaEducationRegistrationStatus,
  })
  @IsEnum(OtaEducationRegistrationStatus)
  status: OtaEducationRegistrationStatus;

  @ApiProperty({ description: 'Staging operation success indicator' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Additional context or next steps',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}

// ========================================
// SESSION QUERY DTOs
// ========================================

export class OtaEducationSessionQuery {
  @ApiProperty({
    description: 'Session ID to retrieve',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiProperty({
    description: 'User business ID to filter sessions',
    required: false,
  })
  @IsOptional()
  @IsString()
  userBusinessId?: string;

  @ApiProperty({
    description: 'Registration status to filter',
    enum: OtaEducationRegistrationStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(OtaEducationRegistrationStatus)
  status?: OtaEducationRegistrationStatus;

  @ApiProperty({
    description: 'Include expired sessions',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeExpired?: boolean;
}

export class OtaEducationSessionListResponse {
  @ApiProperty({
    description: 'List of matching sessions',
    type: [OtaEducationRegistrationSession],
  })
  @ValidateNested({ each: true })
  @Type(() => OtaEducationRegistrationSession)
  sessions: OtaEducationRegistrationSession[];

  @ApiProperty({ description: 'Total number of sessions found' })
  @IsNumber()
  totalCount: number;

  @ApiProperty({ description: 'Query execution timestamp' })
  @IsDateString()
  queriedAt: string;
}

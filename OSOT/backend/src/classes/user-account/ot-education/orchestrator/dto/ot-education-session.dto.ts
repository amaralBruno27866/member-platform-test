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
  CotoStatus,
  OtUniversity,
  Country,
  GraduationYear,
  EducationCategory,
  DegreeType,
} from '../../../../../common/enums';
import { AccessModifier } from '../../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../../common/enums/privilege.enum';

/**
 * ORCHESTRATOR DTO SPECIFICATION: OT Education Session Management
 *
 * These DTOs define the exact structure for Redis session storage and
 * API communication during the OT education registration workflow.
 *
 * Used by: OtEducationOrchestrator, RedisService, Public Controller
 */

export enum OtEducationRegistrationStatus {
  PENDING = 'pending',
  STAGED = 'staged',
  VALIDATED = 'validated',
  CATEGORY_DETERMINED = 'category_determined',
  ACCOUNT_LINKED = 'account_linked',
  EDUCATION_CREATED = 'education_created',
  CREATION_FAILED = 'creation_failed',
  WORKFLOW_COMPLETED = 'workflow_completed',
}

export class OtEducationProgressState {
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

export class OtEducationValidationMetadata {
  @ApiProperty({ description: 'User Business ID uniqueness validated' })
  @IsBoolean()
  userBusinessIdValid: boolean;

  @ApiProperty({ description: 'COTO registration format and alignment valid' })
  @IsBoolean()
  cotoRegistrationValid: boolean;

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

export class OtEducationSessionData {
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

  @ApiProperty({ description: 'COTO registration status' })
  @IsNumber()
  @IsEnum(CotoStatus)
  cotoStatus: CotoStatus;

  @ApiProperty({ description: 'COTO registration number', required: false })
  @IsOptional()
  @IsString()
  cotoRegistration?: string;

  @ApiProperty({ description: 'Type of OT degree obtained' })
  @IsNumber()
  @IsEnum(DegreeType)
  degreeType: DegreeType;

  @ApiProperty({
    description: 'Education category (auto-determined)',
    required: false,
  })
  @IsOptional()
  @IsEnum(EducationCategory)
  educationCategory?: EducationCategory;

  @ApiProperty({ description: 'Additional notes or comments', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Privacy settings for education record' })
  @IsEnum(AccessModifier)
  accessModifier: AccessModifier;
}

export class OtEducationRegistrationSession {
  @ApiProperty({ description: 'Unique session identifier' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'User business ID initiating the session' })
  @IsString()
  userBusinessId: string;

  @ApiProperty({ description: 'Current registration status' })
  @IsEnum(OtEducationRegistrationStatus)
  status: OtEducationRegistrationStatus;

  @ApiProperty({ description: 'Session creation timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  @IsDateString()
  updatedAt: string;

  @ApiProperty({ description: 'Session expiration timestamp' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({ description: 'Progress state indicators' })
  @ValidateNested()
  @Type(() => OtEducationProgressState)
  progress: OtEducationProgressState;

  @ApiProperty({ description: 'Validation metadata and results' })
  @ValidateNested()
  @Type(() => OtEducationValidationMetadata)
  validation: OtEducationValidationMetadata;

  @ApiProperty({ description: 'Education data being processed' })
  @ValidateNested()
  @Type(() => OtEducationSessionData)
  data: OtEducationSessionData;

  @ApiProperty({
    description: 'Account ID to link education record to',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiProperty({ description: 'User privilege level for operation validation' })
  @IsEnum(Privilege)
  userPrivilege: Privilege;

  @ApiProperty({
    description: 'Error messages from validation or processing',
    required: false,
  })
  @IsOptional()
  errors?: string[];

  @ApiProperty({
    description: 'Warning messages from validation',
    required: false,
  })
  @IsOptional()
  warnings?: string[];

  @ApiProperty({
    description: 'Additional metadata for session tracking',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

// ========================================
// REQUEST/RESPONSE DTOs
// ========================================

export class OtEducationStageRequest {
  @ApiProperty({ description: 'Education data to stage for registration' })
  @ValidateNested()
  @Type(() => OtEducationSessionData)
  educationData: OtEducationSessionData;

  @ApiProperty({ description: 'User privilege level for validation' })
  @IsEnum(Privilege)
  userPrivilege: Privilege;

  @ApiProperty({
    description: 'Account ID to link education record to',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiProperty({ description: 'Session TTL in seconds', required: false })
  @IsOptional()
  @IsNumber()
  ttlSeconds?: number;

  @ApiProperty({ description: 'Additional staging options', required: false })
  @IsOptional()
  stagingOptions?: {
    skipValidation?: boolean;
    skipCategoryDetermination?: boolean;
    skipUniquenessCheck?: boolean;
  };
}

export class OtEducationStageResponse {
  @ApiProperty({ description: 'Generated session identifier' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Current registration status' })
  @IsEnum(OtEducationRegistrationStatus)
  status: OtEducationRegistrationStatus;

  @ApiProperty({ description: 'Session expiration timestamp' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({ description: 'Initial validation results' })
  @ValidateNested()
  @Type(() => OtEducationValidationMetadata)
  validation: OtEducationValidationMetadata;

  @ApiProperty({ description: 'Progress indicators' })
  @ValidateNested()
  @Type(() => OtEducationProgressState)
  progress: OtEducationProgressState;

  @ApiProperty({
    description: 'Any immediate validation errors',
    required: false,
  })
  @IsOptional()
  errors?: string[];

  @ApiProperty({ description: 'Any validation warnings', required: false })
  @IsOptional()
  warnings?: string[];

  @ApiProperty({
    description: 'Next recommended action in workflow',
    required: false,
  })
  @IsOptional()
  @IsString()
  nextAction?: string;
}

export class OtEducationSessionUpdateRequest {
  @ApiProperty({ description: 'Session identifier to update' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'Partial education data updates',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OtEducationSessionData)
  educationData?: Partial<OtEducationSessionData>;

  @ApiProperty({ description: 'Status update', required: false })
  @IsOptional()
  @IsEnum(OtEducationRegistrationStatus)
  status?: OtEducationRegistrationStatus;

  @ApiProperty({ description: 'Account linking update', required: false })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiProperty({ description: 'User privilege level for validation' })
  @IsEnum(Privilege)
  userPrivilege: Privilege;
}

export class OtEducationSessionResponse {
  @ApiProperty({ description: 'Complete session information' })
  @ValidateNested()
  @Type(() => OtEducationRegistrationSession)
  session: OtEducationRegistrationSession;

  @ApiProperty({ description: 'Session found and accessible' })
  @IsBoolean()
  found: boolean;

  @ApiProperty({ description: 'Session is active and not expired' })
  @IsBoolean()
  active: boolean;

  @ApiProperty({
    description: 'Time remaining until expiration in seconds',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  timeRemaining?: number;

  @ApiProperty({
    description: 'Workflow completion percentage (0-100)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  completionPercentage?: number;

  @ApiProperty({
    description: 'Available actions for current session state',
    required: false,
  })
  @IsOptional()
  availableActions?: string[];
}

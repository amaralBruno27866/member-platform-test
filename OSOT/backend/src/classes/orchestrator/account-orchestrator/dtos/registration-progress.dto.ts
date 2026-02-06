/**
 * Registration Progress DTO
 *
 * Tracks the progress of entity creation during the registration workflow.
 * This DTO maintains state about which entities have been created successfully,
 * which have failed, and stores the Account GUID for entity linking.
 *
 * CRITICAL INFORMATION:
 * - Account GUID is stored after successful account creation
 * - All other entities use this GUID as lookup field value
 * - Failed entities can be retried without affecting successful ones
 * - Progress percentage calculated based on completed/total entities
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EntityType } from '../constants/orchestrator.constants';

/**
 * Status of individual entity creation
 */
export class EntityCreationStatus {
  @ApiProperty({ description: 'Entity type' })
  entityType!: EntityType;

  @ApiProperty({ description: 'Whether creation was successful' })
  success!: boolean;

  @ApiProperty({
    description: 'Created entity GUID if successful',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  entityGuid?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Error details if failed', required: false })
  @IsOptional()
  error?: {
    message: string;
    code: string;
    details?: any;
  };

  @ApiProperty({ description: 'Number of retry attempts for this entity' })
  @IsNumber()
  retryCount: number = 0;

  @ApiProperty({ description: 'Last retry timestamp', required: false })
  @IsOptional()
  lastRetryAt?: string;
}

/**
 * Complete progress tracking for registration workflow
 */
export class RegistrationProgressDto {
  // ========================================
  // ACCOUNT GUID (Critical for entity linking)
  // ========================================
  @ApiProperty({
    description: 'Account GUID obtained after successful account creation',
    example: '1a154db6-a8ae-f011-bbd3-002248b106dc',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  accountGuid?: string;

  // ========================================
  // CURRENT PROGRESS STATE
  // ========================================
  @ApiProperty({
    description: 'Current entity being processed',
    enum: [
      'account',
      'address',
      'contact',
      'identity',
      'education',
      'management',
    ],
    example: 'address',
  })
  currentStep!: EntityType;

  @ApiProperty({
    description: 'Overall progress percentage (0-100)',
    example: 50,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  progressPercentage!: number;

  // ========================================
  // ENTITY STATUS TRACKING
  // ========================================
  @ApiProperty({
    description: 'Status of all entity creation attempts',
    type: [EntityCreationStatus],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityCreationStatus)
  entityStatuses!: EntityCreationStatus[];

  // ========================================
  // CONVENIENCE ARRAYS (Computed from entityStatuses)
  // ========================================
  @ApiProperty({
    description: 'List of successfully created entities',
    example: ['account', 'address', 'contact'],
  })
  @IsArray()
  completedEntities!: EntityType[];

  @ApiProperty({
    description: 'List of entities that failed creation',
    example: ['identity'],
  })
  @IsArray()
  failedEntities!: EntityType[];

  @ApiProperty({
    description: 'List of entities pending creation',
    example: ['education', 'management'],
  })
  @IsArray()
  pendingEntities!: EntityType[];

  // ========================================
  // RETRY MANAGEMENT
  // ========================================
  @ApiProperty({
    description: 'Total retry attempts across all entities',
    example: 2,
  })
  @IsNumber()
  totalRetryCount!: number;

  @ApiProperty({
    description: 'Entities currently in retry queue',
    example: ['identity'],
  })
  @IsArray()
  retryQueue!: EntityType[];

  @ApiProperty({
    description: 'Entities that exhausted all retry attempts',
    example: [],
  })
  @IsArray()
  exhaustedRetries!: EntityType[];

  // ========================================
  // TIMING INFORMATION
  // ========================================
  @ApiProperty({
    description: 'When entity creation process started',
  })
  startedAt!: string;

  @ApiProperty({
    description: 'When current step started',
  })
  currentStepStartedAt!: string;

  @ApiProperty({
    description: 'When entity creation completed (if applicable)',
    required: false,
  })
  @IsOptional()
  completedAt?: string;

  @ApiProperty({
    description: 'Estimated completion time based on current progress',
    required: false,
  })
  @IsOptional()
  estimatedCompletionAt?: string;

  // ========================================
  // SUMMARY STATISTICS
  // ========================================
  @ApiProperty({
    description: 'Summary of creation attempts',
  })
  summary!: {
    totalEntities: number;
    successfulEntities: number;
    failedEntities: number;
    pendingEntities: number;
    retryingEntities: number;
  };
}

/**
 * Simplified progress summary for quick status checks
 */
export class RegistrationProgressSummaryDto {
  @ApiProperty({ description: 'Progress percentage' })
  progressPercentage!: number;

  @ApiProperty({ description: 'Current step being processed' })
  currentStep!: EntityType;

  @ApiProperty({ description: 'Successfully created entities' })
  completedEntities!: EntityType[];

  @ApiProperty({ description: 'Failed entities' })
  failedEntities!: EntityType[];

  @ApiProperty({ description: 'Whether account GUID is available' })
  hasAccountGuid!: boolean;

  @ApiProperty({ description: 'Total retry count' })
  totalRetries!: number;
}

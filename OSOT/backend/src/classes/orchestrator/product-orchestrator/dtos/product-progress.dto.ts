import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsBoolean, IsArray, IsString } from 'class-validator';
import { ProductState } from '../enums/product-state.enum';

/**
 * Step completion status in product orchestrator
 */
class ProductProgressSteps {
  @ApiProperty({
    description: 'Product data added and validated',
    example: true,
  })
  @IsBoolean()
  productAdded: boolean;

  @ApiProperty({
    description: 'Audience target configured (optional)',
    example: false,
  })
  @IsBoolean()
  targetConfigured: boolean;

  @ApiProperty({
    description: 'Data committed to Dataverse',
    example: false,
  })
  @IsBoolean()
  committed: boolean;
}

/**
 * DTO for product orchestrator progress response
 */
export class ProductProgressDto {
  @ApiProperty({
    description: 'Session identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'Current session state',
    enum: ProductState,
    example: ProductState.PRODUCT_ADDED,
  })
  @IsEnum(ProductState)
  state: ProductState;

  @ApiProperty({
    description: 'Progress steps completion status',
    type: ProductProgressSteps,
  })
  steps: ProductProgressSteps;

  @ApiProperty({
    description: 'Validation errors (if any)',
    type: [String],
    example: [],
  })
  @IsArray()
  @IsString({ each: true })
  errors: string[];

  @ApiProperty({
    description: 'Whether session can be committed',
    example: true,
  })
  @IsBoolean()
  canCommit: boolean;

  @ApiProperty({
    description: 'Session expiration timestamp',
    example: '2026-01-16T14:30:00.000Z',
  })
  expiresAt: Date;
}

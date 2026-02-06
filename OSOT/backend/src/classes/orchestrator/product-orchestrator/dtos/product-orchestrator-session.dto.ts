import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsString } from 'class-validator';
import { ProductState } from '../enums/product-state.enum';

/**
 * DTO for product orchestrator session response
 */
export class ProductOrchestratorSessionDto {
  @ApiProperty({
    description: 'Session identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'Current session state',
    enum: ProductState,
    example: ProductState.INITIATED,
  })
  @IsEnum(ProductState)
  state: ProductState;

  @ApiProperty({
    description: 'Session expiration timestamp',
    example: '2026-01-16T14:30:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Operation ID for tracking',
    example: 'create-product-session-1705415400000',
  })
  @IsString()
  operationId: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO for product orchestrator response after commit
 */
export class ProductOrchestratorResponseDto {
  @ApiProperty({
    description: 'Whether the operation was successful',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Product GUID (if successful)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  productGuid?: string;

  @ApiProperty({
    description: 'Audience target GUID (if successful)',
    example: '234e5678-f89b-12d3-a456-426614174111',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  targetGuid?: string;

  @ApiProperty({
    description: 'Product code (if successful)',
    example: 'osot-prd-000001',
    required: false,
  })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiProperty({
    description: 'Error messages (if failed)',
    type: [String],
    example: ['Product code already exists'],
    required: false,
  })
  @IsOptional()
  errors?: string[];

  @ApiProperty({
    description: 'Operation ID for tracking',
    example: 'commit-product-1705415400000',
  })
  @IsString()
  operationId: string;
}

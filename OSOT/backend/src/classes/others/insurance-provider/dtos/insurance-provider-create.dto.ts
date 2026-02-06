/**
 * Create Insurance Provider DTO
 *
 * Data Transfer Object for creating a new Insurance Provider.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { InsuranceProviderBasicDto } from './insurance-provider-basic.dto';

export class CreateInsuranceProviderDto extends InsuranceProviderBasicDto {
  @ApiProperty({
    description: 'Organization GUID (required). Multi-tenant isolation.',
    example: 'org-guid-123',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty({ message: 'Organization GUID is required' })
  @IsUUID('4', { message: 'Organization GUID must be a valid UUID v4' })
  organizationGuid: string;
}

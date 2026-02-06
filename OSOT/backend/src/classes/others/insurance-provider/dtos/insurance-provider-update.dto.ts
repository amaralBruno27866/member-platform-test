/**
 * Update Insurance Provider DTO
 *
 * Data Transfer Object for updating an existing Insurance Provider.
 * All fields are optional - only provided fields will be updated.
 */

import { PartialType } from '@nestjs/swagger';
import { InsuranceProviderBasicDto } from './insurance-provider-basic.dto';

export class UpdateInsuranceProviderDto extends PartialType(
  InsuranceProviderBasicDto,
) {}

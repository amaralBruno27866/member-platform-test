import { ProductInternal } from '../../../others/product/interfaces/product-internal.interface';
import { AudienceTargetInternal } from '../../../others/audience-target/interfaces/audience-target-internal.interface';
import { CreateProductDto } from '../../../others/product/dtos/create-product.dto';
import { CreateAudienceTargetDto } from '../../../others/audience-target/dtos/audience-target-create.dto';

/**
 * Entity Mappers for Product Orchestrator
 * Simplified mappers without service injection
 */

/**
 * Map CreateProductDto to ProductInternal (partial)
 * Simplified version for orchestrator use
 */
export function mapProductDtoToInternal(
  dto: CreateProductDto,
): Partial<ProductInternal> {
  // Return the DTO as-is, it will be converted by ProductCrudService
  // The service already has the mapper injected
  return dto as unknown as Partial<ProductInternal>;
}

/**
 * Map CreateAudienceTargetDto to AudienceTargetInternal (partial)
 * Uses static mapper from AudienceTargetMapper
 */
export function mapTargetDtoToInternal(
  dto: CreateAudienceTargetDto,
): Partial<AudienceTargetInternal> {
  // Return the DTO as-is, it will be converted by AudienceTargetCrudService
  // The service already has the mapper
  return dto as unknown as Partial<AudienceTargetInternal>;
}

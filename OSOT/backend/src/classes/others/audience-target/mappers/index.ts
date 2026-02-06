/**
 * Audience Target Mappers Module
 *
 * Central export point for all audience target data transformations
 *
 * KEY EXPORTS:
 * - AudienceTargetMapper: Main mapper class with all transformation methods
 * - EnrichedCreateAudienceTargetDto: Type for controller-enriched DTOs
 * - ResponseAudienceTargetDto: Response DTO re-exported for convenience
 */

export {
  AudienceTargetMapper,
  EnrichedCreateAudienceTargetDto,
  AudienceTargetResponseDto,
} from './audience-target.mapper';

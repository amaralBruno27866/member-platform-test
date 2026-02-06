/**
 * Organization DTOs - Barrel Export
 *
 * Exports all DTO types for Organization entity:
 * - Basic DTO (base class with common fields)
 * - Create DTO (for creating new organizations with slug)
 * - Update DTO (for updating existing organizations, excludes slug)
 * - Response DTOs (for API responses - full and public)
 * - Query DTO (for list/filter operations)
 */

// Base DTO with common validation
export { OrganizationBasicDto } from './organization-basic.dto';

// Create DTO with slug validation
export { CreateOrganizationDto } from './organization-create.dto';

// Update DTO (partial updates, excludes slug)
export { UpdateOrganizationDto } from './organization-update.dto';

// Response DTOs (for API responses)
export {
  OrganizationResponseDto,
  OrganizationPublicResponseDto,
} from './organization-response.dto';

// Query DTO (for list/filter operations)
export { ListOrganizationsQueryDto } from './list-organizations.query.dto';

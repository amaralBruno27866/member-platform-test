/**
 * Organization Interfaces - Barrel Export
 *
 * Exports all interface types for Organization entity:
 * - Internal interfaces (TypeScript native types)
 * - Dataverse interfaces (raw API types)
 * - Repository interface (data access contract)
 */

// Internal interfaces (TypeScript native types)
export type {
  OrganizationInternal,
  CreateOrganizationInternal,
  UpdateOrganizationInternal,
  OrganizationBasicInternal,
  OrganizationPublicInternal,
} from './organization-internal.interface';

// Dataverse interfaces (raw API types)
export type {
  OrganizationDataverse,
  CreateOrganizationDataverse,
  UpdateOrganizationDataverse,
  OrganizationBasicDataverse,
  OrganizationPublicDataverse,
} from './organization-dataverse.interface';

// Repository interface (data access contract)
export type {
  IOrganizationRepository,
  OrganizationQueryOptions,
} from './organization-repository.interface';

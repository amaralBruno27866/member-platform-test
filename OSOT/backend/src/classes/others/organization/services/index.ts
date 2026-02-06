/**
 * Organization Services
 *
 * Barrel export for all organization service classes.
 *
 * SERVICE ARCHITECTURE:
 * - OrganizationCrudService: Write operations (Create, Update, Delete) with permissions
 * - OrganizationLookupService: Read operations (authenticated and public)
 * - OrganizationBusinessRulesService: Business validation and rules logic
 *
 * @file index.ts
 * @module OrganizationModule
 * @layer Services
 */

export { OrganizationCrudService } from './organization-crud.service';
export { OrganizationLookupService } from './organization-lookup.service';
export { OrganizationBusinessRulesService } from './organization-business-rules.service';

// Export service interfaces/types
export type {
  SlugValidationResult,
  StatusTransitionResult,
  DeletionEligibilityResult,
  ContactValidationResult,
  UrlValidationResult,
} from './organization-business-rules.service';

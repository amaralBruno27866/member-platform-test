/**
 * Organization Validators
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - class-validator: Uses ValidatorConstraint for custom validation logic
 * - constants: Uses ORGANIZATION_VALIDATION_MESSAGES, RESERVED_SLUGS
 * - DataverseService: For slug uniqueness validation (async)
 *
 * VALIDATOR TYPES:
 * - ReservedSlugValidator: Validates slug is not a reserved keyword
 * - UniqueSlugValidator: Validates slug uniqueness in Dataverse (async)
 * - OrganizationIdValidator: Validates business ID format
 *
 * USAGE:
 * - Applied via @Validate decorator in DTOs
 * - ReservedSlugValidator: Synchronous, checks against RESERVED_SLUGS array
 * - UniqueSlugValidator: Asynchronous, queries Dataverse for existing slug
 *
 * NOTE: Slug format validation (^[a-z0-9-]+$) is handled by @Matches(SLUG_PATTERN)
 * decorator directly in the DTO, so no custom validator needed for that.
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import {
  isReservedSlug,
  ORGANIZATION_VALIDATION_MESSAGES,
} from '../constants/organization-validation.constant';

/**
 * Validator for Reserved Slugs
 * Validates that slug is not a reserved system keyword
 * Reserved slugs: admin, api, login, register, etc.
 *
 * Usage:
 * @Validate(ReservedSlugValidator)
 * osot_slug: string;
 */
@ValidatorConstraint({ name: 'reservedSlug', async: false })
export class ReservedSlugValidator implements ValidatorConstraintInterface {
  validate(slug: string): boolean {
    if (!slug) return true; // Empty check handled by @IsNotEmpty

    // Check if slug is in reserved list
    return !isReservedSlug(slug);
  }

  defaultMessage(): string {
    return ORGANIZATION_VALIDATION_MESSAGES.slugReserved;
  }
}

/**
 * Validator for Slug Uniqueness
 * Validates that slug is unique across all organizations in Dataverse
 *
 * ASYNC VALIDATOR: Queries Dataverse to check if slug already exists
 *
 * Usage:
 * @Validate(UniqueSlugValidator)
 * osot_slug: string;
 *
 * Note: This validator requires DataverseService to be injected.
 * For now, it's a placeholder. Actual implementation will be added
 * when the repository layer is complete.
 *
 * TODO: Inject OrganizationRepository to check slug uniqueness
 */
@Injectable()
@ValidatorConstraint({ name: 'uniqueSlug', async: true })
export class UniqueSlugValidator implements ValidatorConstraintInterface {
  // TODO: Inject repository when available
  // constructor(
  //   @Inject(ORGANIZATION_REPOSITORY)
  //   private readonly organizationRepository: IOrganizationRepository,
  // ) {}

  validate(slug: string, _args?: ValidationArguments): Promise<boolean> {
    if (!slug) return Promise.resolve(true); // Empty check handled by @IsNotEmpty

    // TODO: Query Dataverse to check if slug exists
    // For now, always return true (skip uniqueness check)
    // This will be implemented when repository layer is ready
    //
    // const isUnique = await this.organizationRepository.isSlugUnique(slug);
    // return isUnique;

    return Promise.resolve(true); // Placeholder - always valid for now
  }

  defaultMessage(): string {
    return ORGANIZATION_VALIDATION_MESSAGES.slugUnique;
  }
}

/**
 * Validator for Organization Business ID (Autonumber format)
 * Validates osot-org-0000001 format
 *
 * Pattern: osot-org- followed by 7 digits
 */
@ValidatorConstraint({ name: 'organizationId', async: false })
export class OrganizationIdValidator implements ValidatorConstraintInterface {
  private readonly ORGANIZATION_ID_PATTERN = /^osot-org-\d{7}$/;

  validate(organizationId: string): boolean {
    if (!organizationId) return true; // Optional for creation, required for updates

    return this.ORGANIZATION_ID_PATTERN.test(organizationId);
  }

  defaultMessage(): string {
    return 'Organization ID must follow format: osot-org-0000001 (osot-org followed by 7 digits)';
  }
}

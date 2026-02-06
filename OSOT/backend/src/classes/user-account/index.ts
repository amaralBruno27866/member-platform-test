// User Account module central export file
// Centralizes all user-account-related exports

// ========================================
// MODULES - NestJS Module Configuration
// ========================================
export { AccountModule } from './account/modules/account.module';
export { AddressModule } from './address/modules/address.module';
export { AffiliateModule } from './affiliate/modules/affiliate.module';
export { ContactModule } from './contact/modules/contact.module';
export { IdentityModule } from './identity/modules/identity.module';
export { ManagementModule } from './management/modules/management.module';
export { OtEducationModule } from './ot-education/modules/ot-education.module';
export { OtaEducationModule } from './ota-education/modules/ota-education.module';

// ========================================
// ACCOUNT DOMAIN - Specific exports to avoid conflicts
// ========================================
export * from './account/controllers/account-public.controller';
export * from './account/controllers/account-private.controller';
export * from './account/services/account-business-rules.service';
export * from './account/services/account-crud.service';
export * from './account/services/account-lookup.service';
export * from './account/repositories/account.repository';
export * from './account/events/account.events';
export * from './account/dtos/account-basic.dto';
export * from './account/dtos/create-account.dto';
export * from './account/dtos/update-account.dto';
export * from './account/dtos/account-response.dto';
export * from './account/dtos/account-registration.dto';
export * from './account/dtos/list-accounts.query.dto';
export * from './account/interfaces/account-dataverse.interface';
export * from './account/interfaces/account-internal.interface';
export * from './account/interfaces/account-repository.interface';
export * from './account/validators/account.validators';
export * from './account/validators/password.validator';
export * from './account/constants/account.constants';
export * from './account/rules/account-business-rules';
export * from './account/utils/account.helpers';

// Account Mappers with unique aliases
export {
  mapCreateDtoToInternal as AccountMapCreateDtoToInternal,
  mapDataverseToInternal as AccountMapDataverseToInternal,
  mapInternalToResponseDto as AccountMapInternalToResponseDto,
  mapUpdateDtoToInternal as AccountMapUpdateDtoToInternal,
} from './account/mappers/account.mapper';

// ========================================
// ADDRESS DOMAIN - All exports (no conflicts)
// ========================================
export * from './address/constants/address.constants';
export * from './address/interfaces/address-dataverse.interface';
export * from './address/interfaces/address-internal.interface';
export * from './address/interfaces/address-repository.interface';
export * from './address/validators/address.validators';
export * from './address/validators/postal-code.validator';
export * from './address/dtos/address-basic.dto';
export * from './address/dtos/address-create.dto';
export * from './address/dtos/address-update.dto';
export * from './address/dtos/address-response.dto';
export * from './address/dtos/address-registration.dto';
export * from './address/dtos/list-addresses.query.dto';
export * from './address/repositories/address.repository';
export * from './address/events/address.events';
export * from './address/mappers/address.mapper';
export * from './address/utils/address-formatter.util';
export * from './address/utils/address-sanitizer.util';
export * from './address/rules/address-business-rules';
export * from './address/services/address-crud.service';
export * from './address/services/address-lookup.service';
export * from './address/services/address-business-rules.service';
export * from './address/controllers/address-public.controller';
export * from './address/controllers/address-private.controller';
export * from './address/orchestrator';

// ========================================
// AFFILIATE DOMAIN - Specific exports to avoid conflicts
// ========================================
export * from './affiliate/constants/affiliate.constants';
export * from './affiliate/interfaces/affiliate-internal.interface';
export * from './affiliate/interfaces/affiliate-dataverse.interface';
export * from './affiliate/interfaces/affiliate-repository.interface';
export * from './affiliate/dtos/affiliate-basic.dto';
export * from './affiliate/dtos/affiliate-registration.dto';
export * from './affiliate/dtos/affiliate-response.dto';
export * from './affiliate/dtos/create-affiliate.dto';
export * from './affiliate/dtos/update-affiliate.dto';
export * from './affiliate/dtos/list-affiliates.query.dto';
export * from './affiliate/utils/affiliate-business-logic.util';
export * from './affiliate/utils/affiliate-helpers.util';
export * from './affiliate/services/affiliate-business-rule.service';
export * from './affiliate/services/affiliate-crud.service';
export * from './affiliate/services/affiliate-lookup.service';
export * from './affiliate/controllers/affiliate-public.controller';
export * from './affiliate/controllers/affiliate-private.controller';
export * from './affiliate/repositories/affiliate.repository';
export * from './affiliate/events/affiliate.events';
// Affiliate validators (specific to avoid AccountDeclarationValidator conflict)
export {
  AffiliateNameValidator,
  AffiliateEmailValidator,
  AffiliateWebsiteValidator,
  AffiliateAreaValidator,
  RepresentativeFirstNameValidator,
  RepresentativeLastNameValidator,
  RepresentativeJobTitleValidator,
} from './affiliate/validators/affiliate.validators';
export * from './affiliate/orchestrator';

// Affiliate Mappers with unique aliases
export { mapInternalToDataverse as AffiliateMapInternalToDataverse } from './affiliate/mappers/affiliate.mapper';

// ========================================
// CONTACT DOMAIN - Specific exports to avoid conflicts
// ========================================
export * from './contact/constants/contact.constants';
export * from './contact/interfaces/contact-dataverse.interface';
export * from './contact/interfaces/contact-internal.interface';
export * from './contact/dtos/contact-basic.dto';
export * from './contact/dtos/create-contact.dto';
export * from './contact/dtos/update-contact.dto';
export * from './contact/dtos/contact-response.dto';
export * from './contact/dtos/list-contacts.query.dto';
export * from './contact/dtos/contact-registration.dto';
export * from './contact/utils/contact-formatter.util';
export * from './contact/utils/contact-sanitizer.util';
export * from './contact/utils/contact-business-logic.util';
export * from './contact/utils/strip-internal-fields.util';
export * from './contact/services/contact-crud.service';
export * from './contact/services/contact-business-rule.service';
export * from './contact/services/contact-lookup.service';
export * from './contact/controllers/contact-private.controller';
export * from './contact/controllers/contact-public.controller';
export * from './contact/repositories/contact.repository';
export * from './contact/events/contact.events';
export * from './contact/orchestrator';
export * from './contact/validators/contact.validators';
export * from './contact/validators/url.validator';

// Contact Mappers with unique aliases and specific exports
export {
  mapDataverseToContactInternal as ContactMapDataverseToInternal,
  mapDataverseToContactResponse as ContactMapDataverseToResponse,
  mapDataverseArrayToContactResponse as ContactMapDataverseArrayToResponse,
  mapCreateDtoToDataverse as ContactMapCreateDtoToDataverse,
  mapUpdateDtoToDataverse as ContactMapUpdateDtoToDataverse,
  extractAccountIdFromBinding as ContactExtractAccountIdFromBinding,
  createSocialMediaSummary as ContactCreateSocialMediaSummary,
  createCommunicationSummary as ContactCreateCommunicationSummary,
} from './contact/mappers/contact.mapper';

// ========================================
// IDENTITY DOMAIN - Specific exports to avoid conflicts
// ========================================
export * from './identity/constants/identity.constants';
export * from './identity/interfaces/identity-internal.interface';
export * from './identity/interfaces/identity-dataverse.interface';
export * from './identity/dtos/identity-basic.dto';
export * from './identity/dtos/identity-create.dto';
export * from './identity/dtos/identity-update.dto';
export * from './identity/dtos/identity-response.dto';
export * from './identity/dtos/identity-list.dto';
export * from './identity/dtos/identity-registration.dto';
export * from './identity/dtos/create-identity-for-account.dto';
export * from './identity/utils/identity-formatter.util';
export * from './identity/utils/identity-sanitizer.util';
export * from './identity/utils/identity-business-logic.util';
export * from './identity/utils/strip-internal-fields.util';
export * from './identity/services/identity-crud.service';
export * from './identity/services/identity-business-rule.service';
export * from './identity/services/identity-lookup.service';
export * from './identity/controllers/identity-private.controller';
export * from './identity/controllers/identity-public.controller';
export * from './identity/repositories/identity.repository';
export * from './identity/events/identity.events';
export * from './identity/validators/identity.validators';
export * from './identity/orchestrator';

// Identity Mappers (all available exports)
export * from './identity/mappers/identity.mapper';

// ========================================
// MANAGEMENT DOMAIN - Specific exports to avoid conflicts
// ========================================
export * from './management/constants/management.constants';
export * from './management/interfaces/management-internal.interface';
export * from './management/interfaces/management-dataverse.interface';
export * from './management/interfaces/management-repository.interface';
export * from './management/dtos';
export * from './management/validators/management.validators';
export * from './management/services';
export * from './management/repositories/management.repository';
export * from './management/events/management.events';
export * from './management/controllers/management-private.controller';
export * from './management/controllers/management-public.controller';

// Management Mappers with unique aliases
export {
  mapCreateDtoToInternal as ManagementMapCreateDtoToInternal,
  mapDataverseToInternal as ManagementMapDataverseToInternal,
  mapInternalToResponseDto as ManagementMapInternalToResponseDto,
  mapUpdateDtoToInternal as ManagementMapUpdateDtoToInternal,
} from './management/mappers/management.mapper';

// ========================================
// OT EDUCATION DOMAIN - Specific exports to avoid conflicts
// ========================================
export * from './ot-education/constants/ot-education.constants';
export * from './ot-education/interfaces/ot-education-dataverse.interface';
export * from './ot-education/interfaces/ot-education-internal.interface';
export * from './ot-education/interfaces/ot-education-repository.interface';
export * from './ot-education/validators/ot-education.validators';
export * from './ot-education/dtos/ot-education-basic.dto';
export * from './ot-education/dtos/create-ot-education.dto';
export * from './ot-education/dtos/update-ot-education.dto';
export * from './ot-education/dtos/ot-education-response.dto';
export * from './ot-education/dtos/ot-education-registration.dto';
export * from './ot-education/dtos/list-ot-education.query.dto';
export * from './ot-education/repositories/ot-education.repository';
export * from './ot-education/events/ot-education.events';
export * from './ot-education/services/ot-education-business-rule.service';
export * from './ot-education/services/ot-education-crud.service';
export * from './ot-education/services/ot-education-lookup.service';
export * from './ot-education/controllers/ot-education-public.controller';
export * from './ot-education/controllers/ot-education-private.controller';
export * from './ot-education/controllers/ot-education-scheduler.controller';
export * from './ot-education/utils/ot-education-business-logic.util';
export * from './ot-education/schedulers/ot-education-category.scheduler';

// OT Education Mappers with unique aliases
export {
  mapCreateDtoToInternal as OtEducationMapCreateDtoToInternal,
  mapDataverseToInternal as OtEducationMapDataverseToInternal,
  mapUpdateDtoToInternal as OtEducationMapUpdateDtoToInternal,
  calculateCompletenessScore as OtEducationCalculateCompletenessScore,
  extractSearchableText as OtEducationExtractSearchableText,
  mapInternalToResponse as OtEducationMapInternalToResponse,
} from './ot-education/mappers/ot-education.mapper';

// ========================================
// OTA EDUCATION DOMAIN - Specific exports to avoid conflicts
// ========================================
export * from './ota-education/constants/ota-education.constants';
export * from './ota-education/interfaces/ota-education-dataverse.interface';
export * from './ota-education/interfaces/ota-education-internal.interface';
export * from './ota-education/interfaces/ota-education-repository.interface';
export * from './ota-education/validators/ota-education.validators';
export * from './ota-education/dtos/ota-education-basic.dto';
export * from './ota-education/dtos/create-ota-education.dto';
export * from './ota-education/dtos/update-ota-education.dto';
export * from './ota-education/dtos/ota-education-response.dto';
export * from './ota-education/dtos/ota-education-registration.dto';
export * from './ota-education/dtos/list-ota-education.query.dto';
export * from './ota-education/repositories/ota-education.repository';
export * from './ota-education/events/ota-education.events';
export * from './ota-education/services/ota-education-business-rule.service';
export * from './ota-education/services/ota-education-crud.service';
export * from './ota-education/services/ota-education-lookup.service';
export * from './ota-education/controllers/ota-education-public.controller';
export * from './ota-education/controllers/ota-education-private.controller';
export * from './ota-education/orchestrator';
export * from './ota-education/orchestrator/services/ota-education-session.service';
export * from './ota-education/utils/ota-education-business-logic.util';

// OTA Education Mappers with unique aliases
export {
  mapCreateDtoToInternal as OtaEducationMapCreateDtoToInternal,
  mapDataverseToInternal as OtaEducationMapDataverseToInternal,
  mapUpdateDtoToInternal as OtaEducationMapUpdateDtoToInternal,
  calculateCompletenessScore as OtaEducationCalculateCompletenessScore,
  extractSearchableText as OtaEducationExtractSearchableText,
  mapInternalToResponse as OtaEducationMapInternalToResponse,
} from './ota-education/mappers/ota-education.mapper';

// OTA Education Types and Enums
export type {
  OtaEducationRegistrationSession,
  OtaEducationStageRequest,
  OtaEducationStageResponse,
  OtaEducationWorkflowResult,
  OtaEducationValidationResult,
  OtaEducationCreationResult,
  OtaEducationLinkingResult,
  OtaEducationOrchestrator,
  OtaEducationValidationService,
  OtaEducationSessionManager,
} from './ota-education/index';

// OTA Education Enums (exported from index)
export {
  OtaEducationRegistrationStatus,
  OtaEducationWorkflowStep,
  OtaEducationWorkflowAction,
} from './ota-education/index';

// Contact module central export file
// Centralizes all exports for easy importing from other modules

// Constants
export * from './constants/contact.constants';

// Interfaces
export * from './interfaces/contact-dataverse.interface';
export * from './interfaces/contact-internal.interface';

// DTOs
export { ContactBasicDto } from './dtos/contact-basic.dto';
export { CreateContactDto } from './dtos/create-contact.dto';
export { UpdateContactDto } from './dtos/update-contact.dto';
export { ContactResponseDto } from './dtos/contact-response.dto';
export { ListContactsQueryDto } from './dtos/list-contacts.query.dto';
export { ContactRegistrationDto } from './dtos/contact-registration.dto';

// Utilities (Step 2A - Anticipatory)
export * from './utils/contact-formatter.util';
export * from './utils/contact-sanitizer.util';
export * from './utils/contact-business-logic.util';
export * from './utils/strip-internal-fields.util';

// Services (Step 2B - Implementation)
export { ContactCrudService } from './services/contact-crud.service';
export { ContactBusinessRuleService } from './services/contact-business-rule.service';
export { ContactLookupService } from './services/contact-lookup.service';

// Controllers
export { ContactPrivateController } from './controllers/contact-private.controller';
export { ContactPublicController } from './controllers/contact-public.controller';

// Repositories
export {
  ContactRepository,
  DataverseContactRepository,
  CONTACT_REPOSITORY,
} from './repositories/contact.repository';

// Mappers
export {
  mapDataverseToContactInternal,
  mapDataverseToContactResponse,
  mapDataverseArrayToContactResponse,
  mapCreateDtoToDataverse,
  mapUpdateDtoToDataverse,
  extractAccountIdFromBinding,
  createSocialMediaSummary,
  createCommunicationSummary,
} from './mappers/contact.mapper';

// Events
export { ContactEventsService } from './events/contact.events';

// Module
export { ContactModule } from './modules/contact.module';

// Orchestrator (Workflow Management)
export * from './orchestrator';

// Validators
export * from './validators/contact.validators';
export * from './validators/url.validator';

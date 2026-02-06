/**
 * Address Module - Main Export Point (SIMPLIFIED)
 *
 * PHILOSOPHY: Simplicity, Robustness, Practicality
 * Building from scratch with only the essentials for OSOT.
 */

// Essential Constants
export * from './constants/address.constants';

// Essential Interfaces
export * from './interfaces/address-dataverse.interface';
export * from './interfaces/address-internal.interface';
export * from './interfaces/address-repository.interface';

// Essential Validators (consolidated from validators/index.ts)
export {
  AddressUserBusinessIdValidator,
  AddressLine1Validator,
  AddressLine2Validator,
  OtherCityValidator,
  OtherProvinceStateValidator,
  ODataAccountBindingValidator,
  CityEnumValidator,
  ProvinceEnumValidator,
  CountryEnumValidator,
  AddressTypeEnumValidator,
  AddressPreferenceEnumValidator,
  AccessModifierEnumValidator,
  PrivilegeEnumValidator,
} from './validators/address.validators';

// Specialized postal code validator
export { PostalCodeValidator } from './validators/postal-code.validator';

// Essential DTOs (following Contact pattern with OData binding)
export { AddressBasicDto } from './dtos/address-basic.dto';
export { CreateAddressDto } from './dtos/address-create.dto';
export { UpdateAddressDto } from './dtos/address-update.dto';
export { AddressResponseDto } from './dtos/address-response.dto';
export { AddressRegistrationDto } from './dtos/address-registration.dto';
export { ListAddressesQueryDto } from './dtos/list-addresses.query.dto';

// Essential Repositories (data access layer)
export {
  DataverseAddressRepository,
  ADDRESS_REPOSITORY,
} from './repositories/address.repository';

// Essential Events (event sourcing and audit)
export type {
  AddressCreatedEvent,
  AddressUpdatedEvent,
  AddressDeletedEvent,
  AddressBulkEvent,
  AddressValidationEvent,
  AddressPostalCodeEvent,
  AddressLocationEvent,
  AddressTypeEvent,
} from './events/address.events';
export { AddressEventsService } from './events/address.events';

// Essential Mappers (data transformation layer)
export { AddressMapper } from './mappers/address.mapper';

// Essential Utils (utility functions for address handling)
export { AddressFormatter } from './utils/address-formatter.util';
export { AddressDataSanitizer } from './utils/address-sanitizer.util';

// Business Rules (pure validation logic)
export { AddressBusinessRules } from './rules/address-business-rules';

// Essential Services (business logic layer)
export { AddressCrudService } from './services/address-crud.service';
export { AddressLookupService } from './services/address-lookup.service';
export { AddressBusinessRulesService } from './services/address-business-rules.service';

// Essential Controllers (HTTP request handling layer)
export { AddressPublicController } from './controllers/address-public.controller';
export { AddressPrivateController } from './controllers/address-private.controller';

// Essential Module (dependency injection and configuration)
export { AddressModule } from './modules/address.module';

// Orchestrator Specifications (contracts and interfaces for future implementation)
export * from './orchestrator';

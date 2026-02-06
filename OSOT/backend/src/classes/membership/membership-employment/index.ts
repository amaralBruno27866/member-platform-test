// Membership Employment Module Exports
// Centralized exports for easy importing across the application

// Enums (local to this module)
export * from './enums/benefits.enum';
export * from './enums/employment-status.enum';
export * from './enums/funding.enum';
export * from './enums/hourly-earnings.enum';
export * from './enums/practice-years.enum';
export * from './enums/role-descriptor.enum';
export * from './enums/work-hours.enum';

// Constants
export * from './constants/membership-employment.constants';

// Interfaces
export * from './interfaces/membership-employment-internal.interface';
export * from './interfaces/membership-employment-dataverse.interface';
export * from './interfaces/membership-employment-repository.interface';

// Validators
export * from './validators';

// DTOs
export * from './dtos';

// Mappers
export * from './mappers';

// Repositories
export * from './repositories/membership-employment.repository';

// Events
export {
  MembershipEmploymentEventsService,
  MembershipEmploymentCreatedEvent,
  MembershipEmploymentUpdatedEvent,
  MembershipEmploymentDeletedEvent,
  MembershipEmploymentAccountAffiliateConflictEvent,
  MembershipEmploymentUserYearDuplicateEvent,
} from './events/membership-employment.events';

// Services
export { MembershipEmploymentCrudService } from './services/membership-employment-crud.service';
export { MembershipEmploymentLookupService } from './services/membership-employment-lookup.service';
export { MembershipEmploymentBusinessRulesService } from './services/membership-employment-business-rules.service';

// Utils
export { UserGuidResolverUtil } from './utils/user-guid-resolver.util';

// Controllers
export { MembershipEmploymentPrivateController } from './controllers/membership-employment-private.controller';

// Module
export { MembershipEmploymentModule } from './modules/membership-employment.module';

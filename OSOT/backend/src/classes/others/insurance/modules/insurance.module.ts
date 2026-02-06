/**
 * Insurance Module
 *
 * This module provides the complete Insurance entity implementation including:
 * - Insurance certificate CRUD operations
 * - Multi-step validation and business rules
 * - Event-driven architecture for order integration
 * - Scheduled expiration management (when membership year changes)
 * - Integration with Microsoft Dataverse
 *
 * ARCHITECTURE:
 * - Snapshot-based design (immutable 21 fields at creation)
 * - Only status, endorsements, access control can be updated
 * - Soft delete (CANCELLED status) for audit compliance
 * - Organization-level multi-tenancy
 *
 * WORKFLOW:
 * 1. Order created with insurance products
 * 2. OrderCreatedEvent emitted
 * 3. Insurance listeners validate and create Insurance records
 * 4. Scheduler periodically expires insurances on year transitions
 *
 * FEATURES:
 * - Professional insurance as prerequisite (enforced at order level)
 * - One insurance per type per academic year
 * - Automatic expiration on membership year change
 * - Comprehensive audit trail
 * - Rate-limited Dataverse access
 *
 * @module InsuranceModule
 */

import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// Repository
import { DataverseInsuranceRepository } from '../repositories/dataverse-insurance.repository';

// Services
import { InsuranceMapper } from '../mappers/insurance.mapper';
import { InsuranceCrudService } from '../services/insurance-crud.service';
import { InsuranceLookupService } from '../services/insurance-lookup.service';
import { InsuranceBusinessRuleService } from '../services/insurance-business-rules.service';
import { InsuranceActivationService } from '../services/insurance-activation.service';
import { InsuranceReportService } from '../services/insurance-report.service';
import { InsuranceReportEmailService } from '../services/insurance-report-email.service';
import { InsuranceApprovalService } from '../services/insurance-approval.service';

// Events
import { InsuranceEventsService } from '../events/insurance-events.service';

// Schedulers
import { InsuranceExpirationScheduler } from '../schedulers/insurance-expiration.scheduler';
import { InsuranceReportScheduler } from '../schedulers/insurance-report.scheduler';

// Controllers
import { InsurancePrivateController } from '../controllers/insurance-private.controller';

// External dependencies
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { OrderModule } from '../../order/modules/order.module';
import { OrderProductModule } from '../../order-product/modules/order-product.module';
import { MembershipSettingsModule } from '../../../membership/membership-settings/modules/membership-settings.module';
import { MembershipCategoryModule } from '../../../membership/membership-category/modules/membership-category.module';
import { AccountModule } from '../../../user-account/account/modules/account.module';
import { OrganizationModule } from '../../organization/modules/organization.module';
import { EmailService } from '../../../../emails/email.service';

/**
 * Insurance Module
 *
 * Manages insurance certificates with multi-tenant support and event-driven workflows.
 *
 * **Access Control:**
 * - CREATE: Owner, Main privileges
 * - READ: Owner, Admin, Main privileges
 * - UPDATE: Admin, Main privileges
 * - DELETE: Main privilege only
 *
 * **Snapshot Pattern:**
 * 21 immutable fields captured at creation:
 * - Account data (name, address, credentials)
 * - Address details (billing/mailing)
 * - Insurance details (type, limit, price)
 * - Coverage details (effective, expiry dates)
 * - Endorsement fields
 *
 * **Status Lifecycle:**
 * DRAFT → PENDING → ACTIVE → EXPIRED → CANCELLED (or ACTIVE → CANCELLED direct)
 *
 * **Business Rules:**
 * 1. Professional insurance required before other types
 * 2. One insurance per type per academic year
 * 3. Automatic expiration on membership year change
 * 4. Active membership required for purchase
 * 5. Declaration must be true
 * 6. Professional has risk questions; others don't
 *
 * **Event Integration:**
 * - OrderCreatedEvent → Validate & create Insurance records
 * - MembershipYearChangedEvent → (Future) Trigger expiration
 * - InsuranceCreatedEvent → Audit trail
 *
 * **Scheduler Tasks:**
 * - Daily: Check for year transitions
 * - Annual: January 1st backup check
 * - Manual: Admin trigger for bulk operations
 *
 * @example
 * // Import in controllers or orchestrators
 * @Module({
 *   imports: [InsuranceModule],
 *   // Use InsuranceCrudService, InsuranceLookupService, etc.
 * })
 * export class OtherModule {}
 */
@Module({
  imports: [
    // Enable @Cron decorators in schedulers
    ScheduleModule.forRoot(),
    // Dataverse integration for repository
    DataverseModule,
    // Order integration for validation (circular dependency)
    forwardRef(() => OrderModule),
    OrderProductModule,
    // Membership integration for expiration scheduler
    MembershipSettingsModule,
    MembershipCategoryModule,
    // Account integration for expiration scheduler
    AccountModule,
    // Organization integration for report service
    OrganizationModule,
  ],
  controllers: [
    // HTTP endpoints
    InsurancePrivateController,
  ],
  providers: [
    // Repository implementation
    {
      provide: 'INSURANCE_REPOSITORY',
      useClass: DataverseInsuranceRepository,
    },
    // Mapper
    InsuranceMapper,
    // Services
    InsuranceCrudService,
    InsuranceLookupService,
    InsuranceBusinessRuleService,
    InsuranceActivationService,
    InsuranceEventsService,
    InsuranceReportService,
    InsuranceReportEmailService,
    InsuranceApprovalService,
    EmailService,
    // Schedulers
    InsuranceExpirationScheduler,
    InsuranceReportScheduler,
  ],
  exports: [
    // Export services for use in other modules (e.g., orchestrators)
    InsuranceCrudService,
    InsuranceLookupService,
    InsuranceBusinessRuleService,
    InsuranceActivationService,
    InsuranceEventsService,
    InsuranceReportService,
    InsuranceReportEmailService,
    InsuranceApprovalService,
    InsuranceExpirationScheduler,
    InsuranceReportScheduler,
  ],
})
export class InsuranceModule {}

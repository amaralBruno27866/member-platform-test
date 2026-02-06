/**
 * Management Services Index
 *
 * Centralized export point for all Management domain services following enterprise patterns.
 *
 * SERVICES OVERVIEW:
 * - ManagementCrudService: Complete CRUD operations with business rule integration
 * - ManagementLookupService: Advanced queries, analytics, and performance-optimized searches
 * - ManagementBusinessRuleService: Centralized validation and business rule enforcement
 * - ManagementAuditService: Comprehensive audit trails and compliance reporting
 * - ManagementEventService: Business workflow events and system integration
 *
 * ENTERPRISE FEATURES:
 * - Repository Pattern: Clean data access abstraction
 * - Structured Logging: Operation tracking with unique IDs and PII redaction
 * - Security-First Design: Role-based access control with comprehensive audit
 * - Audit & Compliance: Complete lifecycle tracking with regulatory compliance
 * - Business Intelligence: Analytics and reporting capabilities
 */

// Core CRUD Operations
export { ManagementCrudService } from './management-crud.service';

// Advanced Lookup and Analytics
export { ManagementLookupService } from './management-lookup.service';

// Business Rule Validation and Enforcement
export { ManagementBusinessRuleService } from './management-business-rule.service';

// Audit Trails and Compliance
export { ManagementAuditService } from './management-audit.service';

// Business Workflow Events and System Integration
export { ManagementEventService } from '../events/management.events';

// Re-export for module usage
export * from './management-crud.service';
export * from './management-lookup.service';
export * from './management-business-rule.service';
export * from './management-audit.service';
export * from '../events/management.events';

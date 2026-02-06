// Classes module central export file
// Centralizes all class-related exports for the application

// ========================================
// CORE MODULES - Direct Imports (Conflict-Free)
// ========================================

// Login Module - Simple, no conflicts
export * from './login/index';

// User Account Module - Already structured with unique aliases
export * from './user-account/index';

// ========================================
// MEMBERSHIP MODULES - Individual Module Exports
// ========================================

// Membership Category Module
export { MembershipCategoryModule } from './membership/membership-category/modules/membership-category.module';

// Membership Settings Module
export { MembershipSettingsModule } from './membership/membership-settings/modules/membership-settings.module';

// ========================================
// ORCHESTRATOR MODULES
// ========================================

// Account Orchestrator - Core Service Only
export { AccountOrchestratorService } from './orchestrator/account-orchestrator/services/account-orchestrator.service';
export { AccountOrchestratorPublicController } from './orchestrator/account-orchestrator/controllers/account-orchestrator-public.controller';

// ========================================
// NAMESPACE EXPORTS - For Complex Domain Access
// ========================================

// Re-export entire domains as namespaces when detailed access is needed
import * as MembershipCategoryExports from './membership/membership-category/index';
import * as MembershipSettingsExports from './membership/membership-settings/index';
import * as OrchestratorExports from './orchestrator/index';

export const MembershipCategory = MembershipCategoryExports;
export const MembershipSettings = MembershipSettingsExports;
export const Orchestrator = OrchestratorExports;

// Password Recovery (não implementado ainda)
// export * from './password-recovery/index';

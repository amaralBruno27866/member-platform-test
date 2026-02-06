// Affiliate Orchestrator Specifications - Central Exports
// Esta pasta contém especificações para futura implementação

// Main Orchestrator Interface
export {
  AffiliateOrchestrator,
  AffiliateOrchestratorConfig,
} from './interfaces/orchestrator-contracts.interface';

// Session Management DTOs
export {
  AffiliateRegistrationSessionDto,
  StageAffiliateRegistrationDto,
  AffiliateRegistrationStatus,
  AffiliateProgressState,
  AffiliateOrganizationData,
} from './dto/registration-session.dto';

// Workflow Result DTOs
export {
  BaseAffiliateWorkflowResult,
  AffiliateRegistrationStageResultDto,
  AffiliateEmailVerificationResultDto,
  AffiliateApprovalResultDto,
  AffiliateAccountCreationResultDto,
  AffiliateRegistrationStatusResultDto,
} from './dto/workflow-results.dto';

// Demo Service for Implementation Reference
export { AffiliateSessionService } from './services/affiliate-session.service';

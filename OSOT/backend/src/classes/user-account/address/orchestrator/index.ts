/**
 * ADDRESS ORCHESTRATOR SPECIFICATIONS
 *
 * Central export point for all orchestrator integration contracts and specifications.
 * These define how the future AddressOrchestrator should integrate with Address services.
 */

// Session Management DTOs
export * from './dto/address-session.dto';
export * from './dto/address-workflow-results.dto';

// Interface Contracts (main orchestrator interface)
export { AddressOrchestrator } from './interfaces/address-orchestrator-contracts.interface';

// Demo Services (examples only)
export * from './services/address-session.service';

import { OrchestratorValidationErrorType } from '../enums/orchestrator-validation-error-type.enum';
import { IValidationResult } from '../interfaces/orchestrator.interfaces';

/**
 * DTO for comprehensive validation results from the orchestrator validation service.
 * Contains results from all validation layers and provides detailed feedback.
 */
export class OrchestratorValidationResultDto implements IValidationResult {
  /**
   * Overall validation status
   */
  isValid: boolean;

  /**
   * Combined list of all validation errors
   */
  errors: string[];

  /**
   * Combined list of all validation warnings
   */
  warnings: string[];

  /**
   * Primary error type if validation failed
   */
  errorType?: OrchestratorValidationErrorType;

  /**
   * Detailed results from entity-level validation
   */
  entityValidation?: IValidationResult;

  /**
   * Detailed results from cross-entity validation
   */
  crossEntityValidation?: IValidationResult;

  /**
   * Detailed results from business rules validation
   */
  businessRulesValidation?: IValidationResult;

  /**
   * Email of the existing account (when duplicate is detected)
   */
  existingAccountEmail?: string;

  /**
   * Timestamp when validation was performed
   */
  validatedAt?: Date;

  constructor() {
    this.isValid = false;
    this.errors = [];
    this.warnings = [];
    this.validatedAt = new Date();
  }

  /**
   * Get validation summary for logging or display
   */
  getSummary(): string {
    return `Validation ${this.isValid ? 'passed' : 'failed'} - ${this.errors.length} errors, ${this.warnings.length} warnings`;
  }

  /**
   * Check if validation has specific error type
   */
  hasErrorType(errorType: OrchestratorValidationErrorType): boolean {
    return this.errorType === errorType;
  }

  /**
   * Get errors from specific validation layer
   */
  getErrorsByLayer(
    layer: 'entity' | 'crossEntity' | 'businessRules',
  ): string[] {
    switch (layer) {
      case 'entity':
        return this.entityValidation?.errors || [];
      case 'crossEntity':
        return this.crossEntityValidation?.errors || [];
      case 'businessRules':
        return this.businessRulesValidation?.errors || [];
      default:
        return [];
    }
  }

  /**
   * Check if any validation layer has warnings
   */
  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }

  /**
   * Check if validation failed due to system errors
   */
  hasSystemError(): boolean {
    return this.errorType === OrchestratorValidationErrorType.SYSTEM_ERROR;
  }
}

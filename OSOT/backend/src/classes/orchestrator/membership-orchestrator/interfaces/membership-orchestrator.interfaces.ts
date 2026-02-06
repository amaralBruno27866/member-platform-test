/**
 * Membership Orchestrator Interfaces
 *
 * TypeScript interfaces defining contracts for the membership orchestrator system.
 * These interfaces establish the structure for services, workflows, validation,
 * pricing, payment, and product integration components.
 *
 * COMPLEXITY NOTE:
 * Membership orchestrator is more complex than account orchestrator because it includes:
 * - Pricing calculation and validation
 * - Payment processing integration
 * - Product/Insurance selection and validation
 * - Multi-phase approval (admin + financial)
 * - Category-specific workflow rules
 */

import { MembershipCategoryCreateDto } from '../../../membership/membership-category/dtos/membership-category-create.dto';
import { CreateMembershipEmploymentDto } from '../../../membership/membership-employment/dtos/membership-employment-create.dto';
import { CreateMembershipPracticesDto } from '../../../membership/membership-practices/dtos/membership-practices-create.dto';
import { CreateMembershipPreferenceDto } from '../../../membership/membership-preferences/dtos/membership-preference-create.dto';
import { CreateMembershipSettingsDto } from '../../../membership/membership-settings/dtos/membership-settings-create.dto';

// Type imports from constants
import {
  MembershipEntityType,
  MembershipStateType,
  PaymentMethodType,
  PaymentStateType,
  InsuranceType,
} from '../constants/membership-orchestrator.constants';

// ========================================
// VALIDATION INTERFACES
// ========================================

/**
 * Interface for validation results in membership context
 */
export interface IMembershipValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  errorType?: string;
  affectedFields?: string[];
  metadata?: Record<string, any>;
}

/**
 * Validation context for membership operations
 */
export interface IMembershipValidationContext {
  sessionId: string;
  accountId: string;
  organizationId: string; // Organization GUID (from JWT) - NEW for multi-tenant
  membershipYear: string;
  currentStep: MembershipEntityType;
  membershipData: ICompleteMembershipRegistration;
  existingProgress?: IMembershipProgress;
  metadata?: Record<string, any>;
}

// ========================================
// CORE DATA INTERFACES
// ========================================

/**
 * Complete membership registration data
 * Aggregates all entity DTOs required for membership registration
 */
export interface ICompleteMembershipRegistration {
  // Account reference (from account orchestrator)
  accountId: string;
  organizationId: string; // Organization GUID (from JWT) - NEW for multi-tenant
  membershipYear: string;

  // Core membership entities
  category: MembershipCategoryCreateDto;
  employment: CreateMembershipEmploymentDto;
  practices: CreateMembershipPracticesDto;
  preferences?: CreateMembershipPreferenceDto;
  settings?: CreateMembershipSettingsDto;

  // Product/Insurance selection
  insuranceSelection?: IInsuranceSelection;

  // Payment information
  paymentInfo?: IPaymentInformation;
}

/**
 * Insurance selection data (wrapper for multiple insurance selections)
 */
export interface IInsuranceSelection {
  selections: IInsuranceSelectionItem[];
}

/**
 * Single insurance selection item
 */
export interface IInsuranceSelectionItem {
  insuranceType: number; // Integer enum (1-4)
  productGuid: string;
  declaration: boolean;
  questions?: IInsuranceQuestions;
}

/**
 * High-risk questions (Professional insurance only)
 */
export interface IInsuranceQuestions {
  question1?: IQuestionAnswer;
  question2?: IQuestionAnswer;
  question3?: IQuestionAnswer;
}

/**
 * Question answer structure
 */
export interface IQuestionAnswer {
  answered: boolean;
  explanation?: string;
}

/**
 * Payment information
 */
export interface IPaymentInformation {
  method: PaymentMethodType;
  amount: number;
  currency: string;
  paymentIntentId?: string;
  transactionId?: string;
  billingAddress?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
}

/**
 * Pricing breakdown interface
 */
export interface IPricingBreakdown {
  basePrice: number;
  insurancePrice: number;
  subtotal: number;
  discounts: {
    type: string;
    amount: number;
    reason: string;
  }[];
  taxes: {
    type: string;
    rate: number;
    amount: number;
  }[];
  total: number;
  currency: string;
  calculatedAt: string;
}

/**
 * Membership session stored in Redis
 */
export interface IMembershipSession {
  sessionId: string;
  status: MembershipStateType;
  accountId: string;
  organizationId: string; // Organization GUID (from JWT) - NEW for multi-tenant
  membershipYear: string;
  membershipData: ICompleteMembershipRegistration;
  progress: IMembershipProgress;
  pricing?: IPricingBreakdown;
  payment?: {
    status: PaymentStateType;
    method?: PaymentMethodType;
    transactionId?: string;
    paymentIntentId?: string;
    paidAt?: string;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    paymentDeadline?: string;
  };
  metadata: {
    retryCount: number;
    lastError?: any;
    adminApprovalRequired: boolean;
    financialVerificationRequired: boolean;
  };
}

/**
 * Membership progress tracking
 */
export interface IMembershipProgress {
  percentage: number;
  currentStep: string;
  completedEntities: MembershipEntityType[];
  failedEntities: MembershipEntityType[];
  pendingEntities: MembershipEntityType[];
  entityDetails: Record<
    MembershipEntityType,
    {
      status: 'pending' | 'creating' | 'completed' | 'failed';
      entityId?: string;
      error?: string;
      createdAt?: string;
      retryCount?: number;
    }
  >;
}

// ========================================
// RESPONSE INTERFACES
// ========================================

/**
 * Standard membership orchestrator response
 */
export interface IMembershipOrchestratorResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  status?: MembershipStateType;
  progress?: IMembershipProgress;
  pricing?: IPricingBreakdown;
  payment?: {
    status: PaymentStateType;
    amount: number;
    paymentUrl?: string;
  };
  timestamps?: {
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
  };
  nextSteps?: string[];
  error?: {
    code: string;
    message: string;
    timestamp: string;
    recoverable?: boolean;
  };
  data?: any;
}

/**
 * Membership initiation response
 */
export interface IMembershipInitiationResponse {
  sessionId: string;
  status: MembershipStateType;
  pricing: IPricingBreakdown;
  expiresAt: string;
  message: string;
  nextSteps: string[];
  paymentRequired: boolean;
  approvalRequired: boolean;
}

/**
 * Membership status response
 */
export interface IMembershipStatusResponse {
  session: IMembershipSession;
  progress: IMembershipProgress;
  message: string;
  nextSteps: string[];
  canRetry: boolean;
  requiresAction: boolean;
}

// ========================================
// CORE ORCHESTRATOR INTERFACE
// ========================================

/**
 * Main membership orchestrator service interface
 * Coordinates the complete membership registration workflow
 */
export interface IMembershipOrchestrator {
  /**
   * Initiate a new membership registration workflow
   * @param membershipData Complete membership registration data
   * @returns Orchestrator response with session and pricing information
   */
  initiateMembershipRegistration(
    membershipData: ICompleteMembershipRegistration,
  ): Promise<IMembershipOrchestratorResponse>;

  /**
   * Calculate membership pricing
   * @param sessionId Session identifier
   * @returns Pricing breakdown
   */
  calculatePricing(sessionId: string): Promise<IMembershipOrchestratorResponse>;

  /**
   * Process payment for membership
   * @param sessionId Session identifier
   * @param paymentInfo Payment information
   * @returns Payment processing result
   */
  processPayment(
    sessionId: string,
    paymentInfo: IPaymentInformation,
  ): Promise<IMembershipOrchestratorResponse>;

  /**
   * Verify payment status
   * @param sessionId Session identifier
   * @returns Payment verification result
   */
  verifyPayment(sessionId: string): Promise<IMembershipOrchestratorResponse>;

  /**
   * Execute entity creation after payment
   * @param sessionId Session identifier
   * @returns Entity creation result
   */
  executeEntityCreation(
    sessionId: string,
  ): Promise<IMembershipOrchestratorResponse>;

  /**
   * Get current status of a membership session
   * @param sessionId Session identifier
   * @returns Current session status and progress
   */
  getMembershipStatus(
    sessionId: string,
  ): Promise<IMembershipOrchestratorResponse>;

  /**
   * Process admin approval decision
   * @param sessionId Session identifier
   * @param approved Whether membership is approved
   * @param adminEmail Admin who made the decision
   * @param reason Optional reason for the decision
   * @returns Approval processing result
   */
  processAdminApproval(
    sessionId: string,
    approved: boolean,
    adminEmail: string,
    reason?: string,
  ): Promise<IMembershipOrchestratorResponse>;

  /**
   * Retry failed entity creation
   * @param sessionId Session identifier
   * @param entityType Optional specific entity to retry
   * @returns Retry result
   */
  retryEntityCreation(
    sessionId: string,
    entityType?: MembershipEntityType,
  ): Promise<IMembershipOrchestratorResponse>;

  /**
   * Cancel membership registration
   * @param sessionId Session identifier
   * @param reason Cancellation reason
   * @returns Cancellation result
   */
  cancelMembershipRegistration(
    sessionId: string,
    reason: string,
  ): Promise<IMembershipOrchestratorResponse>;
}

// ========================================
// PRICING SERVICE INTERFACE
// ========================================

/**
 * Pricing service interface
 * Handles membership pricing calculations
 */
export interface IMembershipPricingService {
  /**
   * Calculate total membership price including insurance and taxes
   * @param context Pricing context
   * @returns Pricing breakdown
   */
  calculateTotalPrice(context: {
    category: number;
    insuranceType?: InsuranceType;
    membershipYear: string;
    discountCodes?: string[];
  }): Promise<IPricingBreakdown>;

  /**
   * Get base price for category
   * @param category Membership category
   * @param membershipYear Membership year
   * @returns Base price
   */
  getBasePriceForCategory(
    category: number,
    membershipYear: string,
  ): Promise<number>;

  /**
   * Calculate insurance price
   * @param insuranceType Insurance type
   * @param category Membership category
   * @returns Insurance price
   */
  calculateInsurancePrice(
    insuranceType: InsuranceType,
    category: number,
  ): Promise<number>;

  /**
   * Apply discounts
   * @param basePrice Base price before discounts
   * @param category Membership category
   * @param discountCodes Optional discount codes
   * @returns Discounts applied
   */
  applyDiscounts(
    basePrice: number,
    category: number,
    discountCodes?: string[],
  ): Promise<{ type: string; amount: number; reason: string }[]>;

  /**
   * Calculate taxes
   * @param subtotal Subtotal after discounts
   * @param province Province for tax calculation
   * @returns Taxes breakdown
   */
  calculateTaxes(
    subtotal: number,
    province?: string,
  ): Promise<{ type: string; rate: number; amount: number }[]>;

  /**
   * Validate pricing calculation
   * @param pricing Pricing breakdown to validate
   * @returns Validation result
   */
  validatePricing(pricing: IPricingBreakdown): Promise<{
    valid: boolean;
    errors: string[];
  }>;
}

// ========================================
// PAYMENT SERVICE INTERFACE
// ========================================

/**
 * Payment service interface
 * Handles payment processing integration
 */
export interface IMembershipPaymentService {
  /**
   * Create payment intent
   * @param sessionId Session identifier
   * @param amount Payment amount
   * @returns Payment intent details
   */
  createPaymentIntent(
    sessionId: string,
    amount: number,
  ): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    paymentUrl: string;
  }>;

  /**
   * Process payment
   * @param paymentIntentId Payment intent identifier
   * @param paymentMethod Payment method details
   * @returns Payment result
   */
  processPayment(
    paymentIntentId: string,
    paymentMethod: PaymentMethodType,
  ): Promise<{
    success: boolean;
    transactionId: string;
    status: PaymentStateType;
  }>;

  /**
   * Verify payment status
   * @param transactionId Transaction identifier
   * @returns Payment status
   */
  verifyPaymentStatus(transactionId: string): Promise<{
    status: PaymentStateType;
    verified: boolean;
    paidAt?: string;
  }>;

  /**
   * Refund payment
   * @param transactionId Transaction identifier
   * @param reason Refund reason
   * @returns Refund result
   */
  refundPayment(
    transactionId: string,
    reason: string,
  ): Promise<{
    success: boolean;
    refundId: string;
  }>;
}

// ========================================
// PRODUCT/INSURANCE SERVICE INTERFACE
// ========================================

/**
 * Product insurance service interface
 * Handles insurance product selection and validation
 */
export interface IMembershipProductService {
  /**
   * Get available insurance products for category
   * @param category Membership category
   * @returns Available insurance products
   */
  getAvailableInsuranceProducts(category: number): Promise<{
    products: {
      id: string;
      type: InsuranceType;
      name: string;
      description: string;
      price: number;
      mandatory: boolean;
    }[];
  }>;

  /**
   * Validate insurance selection
   * @param category Membership category
   * @param insuranceType Selected insurance type
   * @returns Validation result
   */
  validateInsuranceSelection(
    category: number,
    insuranceType: InsuranceType,
  ): Promise<{
    valid: boolean;
    reason?: string;
    mandatory: boolean;
  }>;

  /**
   * Get insurance details
   * @param productId Product identifier
   * @returns Insurance product details
   */
  getInsuranceDetails(productId: string): Promise<{
    id: string;
    type: InsuranceType;
    name: string;
    description: string;
    price: number;
    coverage: string;
    terms: string;
  }>;
}

// ========================================
// WORKFLOW MANAGER INTERFACE
// ========================================

/**
 * Membership workflow manager interface
 * Manages the step-by-step membership registration process
 */
export interface IMembershipWorkflowManager {
  /**
   * Get workflow execution plan
   * @param membershipData Membership data to analyze
   * @returns Execution plan with entity order and dependencies
   */
  getExecutionPlan(membershipData: ICompleteMembershipRegistration): Promise<{
    entityOrder: MembershipEntityType[];
    requiredEntities: MembershipEntityType[];
    optionalEntities: MembershipEntityType[];
    estimatedDuration: number;
  }>;

  /**
   * Execute next step in workflow
   * @param sessionId Session identifier
   * @returns Step execution result
   */
  executeNextStep(sessionId: string): Promise<{
    success: boolean;
    completedStep: MembershipEntityType;
    nextStep?: MembershipEntityType;
    progress: IMembershipProgress;
  }>;

  /**
   * Validate workflow prerequisites
   * @param sessionId Session identifier
   * @param targetStep Target step to validate
   * @returns Validation result
   */
  validatePrerequisites(
    sessionId: string,
    targetStep: MembershipEntityType,
  ): Promise<{
    valid: boolean;
    missingRequirements: string[];
    canProceed: boolean;
  }>;

  /**
   * Handle workflow failure
   * @param sessionId Session identifier
   * @param failedStep Failed step
   * @param error Error details
   * @returns Failure handling result
   */
  handleFailure(
    sessionId: string,
    failedStep: MembershipEntityType,
    error: Error,
  ): Promise<{
    handled: boolean;
    canRetry: boolean;
    nextAction: 'retry' | 'skip' | 'abort';
  }>;
}

// ========================================
// VALIDATION INTERFACE
// ========================================

/**
 * Membership orchestrator validator interface
 * Handles business rule validation and cross-entity validation
 */
export interface IMembershipOrchestratorValidator {
  /**
   * Validate complete membership registration data
   * @param data Membership registration data to validate
   * @returns Validation result with detailed errors
   */
  validateMembershipData(
    data: ICompleteMembershipRegistration,
  ): Promise<IMembershipValidationResult>;

  /**
   * Validate business rules for specific entity
   * @param context Validation context
   * @param entityType Entity type to validate
   * @returns Business rule validation result
   */
  validateBusinessRules(
    context: IMembershipValidationContext,
    entityType: MembershipEntityType,
  ): Promise<IMembershipValidationResult>;

  /**
   * Validate category eligibility
   * @param accountId Account identifier
   * @param category Membership category
   * @returns Eligibility validation result
   */
  validateCategoryEligibility(
    accountId: string,
    category: number,
  ): Promise<IMembershipValidationResult>;

  /**
   * Validate insurance requirements
   * @param category Membership category
   * @param insuranceSelection Insurance selection (optional)
   * @returns Insurance validation result
   */
  validateInsuranceRequirements(
    category: number,
    insuranceSelection?: IInsuranceSelection,
  ): Promise<IMembershipValidationResult>;

  /**
   * Validate payment requirements
   * @param category Membership category
   * @param pricing Pricing breakdown
   * @returns Payment validation result
   */
  validatePaymentRequirements(
    category: number,
    pricing: IPricingBreakdown,
  ): Promise<IMembershipValidationResult>;

  /**
   * Validate session state for operation
   * @param sessionId Session identifier
   * @param operation Operation to validate
   * @returns Session validation result
   */
  validateSessionState(
    sessionId: string,
    operation:
      | 'payment'
      | 'entity_create'
      | 'admin_approve'
      | 'retry'
      | 'cancel',
  ): Promise<{
    valid: boolean;
    reason?: string;
    allowedOperations: string[];
  }>;
}

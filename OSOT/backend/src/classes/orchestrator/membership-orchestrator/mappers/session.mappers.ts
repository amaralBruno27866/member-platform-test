/**
 * Session Mappers
 *
 * Data transformation utilities for session management in the Membership Orchestrator.
 * Handles session creation, status updates, and workflow state transitions.
 */

import {
  CompleteMembershipRegistrationDto,
  MembershipSessionDto,
  MembershipStateType,
} from '../index';
import { MembershipProgressMapper } from './index';

// ========================================
// SESSION MAPPING
// ========================================

/**
 * Maps membership registration data to session objects and handles session lifecycle
 */
export class MembershipSessionMapper {
  /**
   * Create initial session from registration data
   */
  static toInitialSession(
    sessionId: string,
    registrationData: CompleteMembershipRegistrationDto,
    expiresAt: Date,
    paymentDeadline?: Date,
  ): MembershipSessionDto {
    const now = new Date().toISOString();

    return {
      sessionId,
      status: 'initiated' as MembershipStateType,
      accountId: registrationData.accountId,
      organizationId: registrationData.organizationId,
      membershipYear: registrationData.membershipYear,
      membershipData: registrationData,
      progress: MembershipProgressMapper.toInitialProgress(
        registrationData.accountId,
      ),
      adminApprovalRequired: false,
      financialVerificationRequired: false,
      createdAt: now,
      updatedAt: now,
      expiresAt: expiresAt.toISOString(),
      paymentDeadline: paymentDeadline?.toISOString(),
      retryCount: 0,
      emailsSent: [],
    };
  }

  /**
   * Update session status
   */
  static updateStatus(
    session: MembershipSessionDto,
    newStatus: MembershipStateType,
    additionalData?: Partial<MembershipSessionDto>,
  ): MembershipSessionDto {
    return {
      ...session,
      ...additionalData,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add pricing information to session
   */
  static withPricing(
    session: MembershipSessionDto,
    pricing: {
      basePrice: number;
      insurancePrice: number;
      discounts: Array<{ type: string; amount: number; reason: string }>;
      taxes: Array<{ type: string; rate: number; amount: number }>;
      total: number;
    },
  ): MembershipSessionDto {
    return {
      ...session,
      status: 'pricing_calculated' as MembershipStateType,
      progress: {
        ...session.progress,
        pricing: {
          basePrice: pricing.basePrice,
          insurancePrice: pricing.insurancePrice,
          subtotal: pricing.basePrice + pricing.insurancePrice,
          discounts: pricing.discounts,
          taxes: pricing.taxes,
          total: pricing.total,
          currency: 'CAD',
          calculatedAt: new Date().toISOString(),
        },
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add payment information to session
   */
  static withPayment(
    session: MembershipSessionDto,
    paymentData: {
      paymentIntentId: string;
      amount: number;
      status:
        | 'pending'
        | 'processing'
        | 'completed'
        | 'failed'
        | 'refunded'
        | 'cancelled';
    },
  ): MembershipSessionDto {
    const now = new Date().toISOString();
    return {
      ...session,
      status: 'payment_processing' as MembershipStateType,
      paymentTransactionId: paymentData.paymentIntentId,
      progress: {
        ...session.progress,
        payment: {
          status: paymentData.status,
          paymentIntentId: paymentData.paymentIntentId,
        },
      },
      updatedAt: now,
    };
  }

  /**
   * Mark payment as completed
   */
  static markPaymentCompleted(
    session: MembershipSessionDto,
    transactionId: string,
  ): MembershipSessionDto {
    const now = new Date().toISOString();
    return {
      ...session,
      status: 'payment_completed' as MembershipStateType,
      paymentTransactionId: transactionId,
      progress: {
        ...session.progress,
        payment: session.progress.payment
          ? {
              ...session.progress.payment,
              status: 'completed',
              transactionId,
              paidAt: now,
            }
          : undefined,
      },
      updatedAt: now,
    };
  }

  /**
   * Mark payment as failed
   */
  static markPaymentFailed(
    session: MembershipSessionDto,
    reason: string,
  ): MembershipSessionDto {
    return {
      ...session,
      status: 'payment_failed' as MembershipStateType,
      progress: {
        ...session.progress,
        payment: session.progress.payment
          ? {
              ...session.progress.payment,
              status: 'failed',
            }
          : undefined,
      },
      lastError: {
        message: `Payment failed: ${reason}`,
        code: 'PAYMENT_FAILED',
        timestamp: new Date().toISOString(),
        recoverable: true,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add insurance information to session
   */
  static withInsurance(
    session: MembershipSessionDto,
    insuranceData: {
      productId: string;
      policyNumber?: string;
    },
  ): MembershipSessionDto {
    return {
      ...session,
      insuranceProductId: insuranceData.productId,
      insurancePolicyNumber: insuranceData.policyNumber,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add admin approval request to session
   */
  static withAdminApprovalRequest(
    session: MembershipSessionDto,
    requestedBy: string,
  ): MembershipSessionDto {
    const now = new Date().toISOString();
    return {
      ...session,
      status: 'pending_admin_approval' as MembershipStateType,
      adminApproval: {
        comments: `Requested by ${requestedBy} at ${now}`,
      },
      updatedAt: now,
    };
  }

  /**
   * Process admin approval decision
   */
  static withAdminDecision(
    session: MembershipSessionDto,
    approved: boolean,
    adminEmail: string,
    reason?: string,
  ): MembershipSessionDto {
    const now = new Date().toISOString();
    return {
      ...session,
      status: approved
        ? ('approved' as MembershipStateType)
        : ('rejected' as MembershipStateType),
      adminApproval: session.adminApproval
        ? {
            ...session.adminApproval,
            approvedBy: approved ? adminEmail : undefined,
            approvedAt: approved ? now : undefined,
            rejectedBy: !approved ? adminEmail : undefined,
            rejectedAt: !approved ? now : undefined,
            reason,
          }
        : undefined,
      updatedAt: now,
    };
  }

  /**
   * Add financial verification request
   */
  static withFinancialVerification(
    session: MembershipSessionDto,
  ): MembershipSessionDto {
    const now = new Date().toISOString();
    return {
      ...session,
      status: 'pending_financial_verification' as MembershipStateType,
      financialVerification: {
        verificationNotes: `Verification requested at ${now}`,
      },
      updatedAt: now,
    };
  }

  /**
   * Process financial verification
   */
  static withFinancialDecision(
    session: MembershipSessionDto,
    verified: boolean,
    verifiedBy: string,
  ): MembershipSessionDto {
    const now = new Date().toISOString();
    return {
      ...session,
      financialVerification: session.financialVerification
        ? {
            ...session.financialVerification,
            verifiedBy,
            verifiedAt: now,
            paymentReference: verified ? 'VERIFIED' : undefined,
          }
        : undefined,
      updatedAt: now,
    };
  }

  /**
   * Mark session as cancelled
   */
  static markCancelled(
    session: MembershipSessionDto,
    reason: string,
    cancelledBy?: 'user' | 'admin' | 'system',
  ): MembershipSessionDto {
    const now = new Date().toISOString();
    return {
      ...session,
      status: 'cancelled' as MembershipStateType,
      cancellation: {
        cancelledBy: cancelledBy || 'user',
        cancelledAt: now,
        reason,
        refundRequested: false,
        refundProcessed: false,
      },
      updatedAt: now,
    };
  }

  /**
   * Add error to session
   */
  static withError(
    session: MembershipSessionDto,
    error: {
      message: string;
      code: string;
      entity?: string;
      details?: any;
    },
  ): MembershipSessionDto {
    return {
      ...session,
      status: 'failed' as MembershipStateType,
      lastError: {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        recoverable: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error.details,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Increment retry count
   */
  static incrementRetry(session: MembershipSessionDto): MembershipSessionDto {
    return {
      ...session,
      retryCount: (session.retryCount || 0) + 1,
      status: 'retry_pending' as MembershipStateType,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add email tracking to session
   */
  static withEmailSent(
    session: MembershipSessionDto,
    emailData: {
      type: string;
      recipient: string;
      status: 'sent' | 'failed' | 'bounced';
    },
  ): MembershipSessionDto {
    return {
      ...session,
      emailsSent: [
        ...(session.emailsSent || []),
        {
          ...emailData,
          sentAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add audit information to session
   */
  static withAuditInfo(
    session: MembershipSessionDto,
    auditData: {
      userAgent?: string;
    },
  ): MembershipSessionDto {
    return {
      ...session,
      userAgent: auditData.userAgent,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Mark session as completed
   */
  static markCompleted(session: MembershipSessionDto): MembershipSessionDto {
    return {
      ...session,
      status: 'completed' as MembershipStateType,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Check if session is expired
   */
  static isExpired(session: MembershipSessionDto): boolean {
    return new Date(session.expiresAt) < new Date();
  }

  /**
   * Check if payment deadline has passed
   */
  static isPaymentExpired(session: MembershipSessionDto): boolean {
    if (!session.paymentDeadline) {
      return false;
    }
    return new Date(session.paymentDeadline) < new Date();
  }
}

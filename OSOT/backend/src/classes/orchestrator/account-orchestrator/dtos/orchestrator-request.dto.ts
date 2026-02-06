/**
 * DTO for orchestrator registration requests.
 * Contains all data needed to initiate a complete user registration workflow.
 */
export class OrchestratorRequestDto {
  /**
   * Account creation data
   */
  accountData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    [key: string]: any;
  };

  /**
   * Address creation data
   */
  addressData?: {
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    street?: string;
    [key: string]: any;
  };

  /**
   * Contact creation data
   */
  contactData?: {
    email?: string;
    phone?: string;
    alternativePhone?: string;
    [key: string]: any;
  };

  /**
   * Identity creation data
   */
  identityData?: {
    firstName?: string;
    lastName?: string;
    documentType?: string;
    documentNumber?: string;
    birthDate?: string | Date;
    [key: string]: any;
  };

  /**
   * Education creation data
   */
  educationData?: {
    level?: string;
    institution?: string;
    course?: string;
    [key: string]: any;
  };

  /**
   * Management creation data
   */
  managementData?: {
    position?: string;
    department?: string;
    startDate?: string | Date;
    [key: string]: any;
  };

  /**
   * Additional metadata for the registration
   */
  metadata?: {
    source?: string;
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    [key: string]: any;
  };
}

# Contact Module Integration Contracts

## Overview

This document defines **exactly how** the future Registration Orchestrator should integrate with the Contact module. The Contact module provides a complete set of services that handle all contact-related business logic, multi-channel validation, and communication management, while the orchestrator focuses on workflow coordination, session management, and cross-module integration.

## Architecture Pattern: Service Provider + Orchestrator

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRATION ORCHESTRATOR                    │
│                        (To be built)                            │
├─────────────────────────────────────────────────────────────────┤
│ Responsibilities:                                               │
│ • Redis session management                                      │
│ • Multi-channel contact verification workflows                  │
│ • Communication preference coordination                         │
│ • Cross-module integration (Account → Address → Contact)        │
│ • Contact validation orchestration                              │
│ • Error recovery and cleanup                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ consumes services from
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONTACT MODULE                             │
│                   (Already implemented)                         │
├─────────────────────────────────────────────────────────────────┤
│ Services Available:                                             │
│ ✅ ContactCrudService           - CRUD operations               │
│ ✅ ContactBusinessRuleService   - Validation & business logic   │
│ ✅ ContactLookupService         - Data queries & searches       │
│ ✅ ContactEventsService         - Event emission & audit        │
│ ✅ ContactRepository            - Data access abstraction       │
│ ✅ ContactMapper                - Type-safe transformations     │
│ ✅ ContactOrchestrator          - Workflow coordination         │
└─────────────────────────────────────────────────────────────────┘
```

## Service Integration Guide

### 1. ContactCrudService Integration

**Purpose**: Handle all contact CRUD operations with full business logic

```typescript
// In your orchestrator service
class RegistrationOrchestratorService {
  constructor(
    private readonly contactCrudService: ContactCrudService,
    // ... other dependencies
  ) {}

  async createContactForAccount(
    accountGuid: string,
    contactData: CreateContactDto,
    sessionId: string,
  ): Promise<ContactResponseDto> {
    try {
      // The service handles all validation, business rules, and persistence
      const contact = await this.contactCrudService.create(
        contactData,
        'system', // Role for orchestrator operations
      );

      // Log to session management
      await this.updateSessionStep(sessionId, 'contact_created', {
        contactId: contact.contactId,
        channels: this.extractChannels(contact),
      });

      return contact;
    } catch (error) {
      await this.handleContactCreationError(sessionId, error);
      throw error;
    }
  }
}
```

**Available Operations**:

```typescript
ContactCrudService {
  // Core CRUD operations
  create(dto: CreateContactDto, actorRole: string): Promise<ContactResponseDto>
  update(contactId: string, dto: UpdateContactDto, actorRole: string): Promise<ContactResponseDto>
  findOne(contactId: string, role: string): Promise<ContactResponseDto>
  findAll(query: ListContactsQueryDto, role: string): Promise<ContactResponseDto[]>
  delete(contactId: string, actorRole: string): Promise<void>

  // Contact-specific operations
  validateContact(contactData: Partial<CreateContactDto>): Promise<ValidationResult>
  checkDuplicates(contactData: CreateContactDto): Promise<DuplicationCheckResult>
}
```

### 2. ContactBusinessRuleService Integration

**Purpose**: Handle advanced contact validation and business rule application

```typescript
class RegistrationOrchestratorService {
  async validateContactData(
    contactData: Partial<CreateContactDto>,
    sessionId: string,
  ): Promise<ContactValidationResult> {
    // Multi-channel validation
    const phoneValidation =
      await this.contactBusinessRuleService.validatePhoneNumber(
        contactData.mobilePhone,
      );

    const emailValidation = await this.contactBusinessRuleService.validateEmail(
      contactData.primaryEmail,
    );

    const socialValidation =
      await this.contactBusinessRuleService.validateSocialMedia(
        contactData.socialMedia,
      );

    // Business rule validation
    const businessRules =
      await this.contactBusinessRuleService.applyBusinessRules(contactData);

    // Update session with validation results
    await this.updateSessionStep(sessionId, 'contact_validated', {
      phoneValid: phoneValidation.isValid,
      emailValid: emailValidation.isValid,
      socialValid: socialValidation.isValid,
      businessRulesPass: businessRules.isValid,
    });

    return {
      isValid:
        phoneValidation.isValid &&
        emailValidation.isValid &&
        socialValidation.isValid &&
        businessRules.isValid,
      details: {
        phone: phoneValidation,
        email: emailValidation,
        social: socialValidation,
        businessRules: businessRules,
      },
    };
  }
}
```

**Available Validation Operations**:

```typescript
ContactBusinessRuleService {
  // Channel-specific validation
  validatePhoneNumber(phone: string): Promise<PhoneValidationResult>
  validateEmail(email: string): Promise<EmailValidationResult>
  validateSocialMedia(handles: SocialMediaHandle[]): Promise<SocialValidationResult>

  // Data normalization
  normalizeContactData(data: CreateContactDto): Promise<NormalizedContactData>
  formatPhoneNumber(phone: string, format: PhoneFormat): string
  standardizeEmail(email: string): string

  // Business rule validation
  applyBusinessRules(contact: CreateContactDto): Promise<BusinessRuleResult>
  checkDuplicates(contact: CreateContactDto): Promise<DuplicationResult>
  validateCommunicationPreferences(prefs: CommunicationPreferences): ValidationResult
}
```

### 3. ContactLookupService Integration

**Purpose**: Handle specialized contact queries and searches

```typescript
class RegistrationOrchestratorService {
  async checkExistingContacts(
    contactData: CreateContactDto,
    sessionId: string,
  ): Promise<DuplicateAnalysis> {
    // Check for existing contacts by various channels
    const emailMatches = await this.contactLookupService.findByEmail(
      contactData.primaryEmail,
    );

    const phoneMatches = await this.contactLookupService.findByPhone(
      contactData.mobilePhone,
    );

    const nameMatches = await this.contactLookupService.searchByName(
      contactData.firstName,
      contactData.lastName,
    );

    // Update session with duplicate analysis
    await this.updateSessionStep(sessionId, 'duplicates_checked', {
      emailDuplicates: emailMatches.length,
      phoneDuplicates: phoneMatches.length,
      nameDuplicates: nameMatches.length,
    });

    return {
      hasDuplicates: emailMatches.length > 0 || phoneMatches.length > 0,
      duplicateContacts: [...emailMatches, ...phoneMatches, ...nameMatches],
      conflictResolution: this.generateConflictResolution(
        emailMatches,
        phoneMatches,
      ),
    };
  }
}
```

**Available Lookup Operations**:

```typescript
ContactLookupService {
  // Channel-based lookups
  findByEmail(email: string): Promise<ContactResponseDto[]>
  findByPhone(phone: string): Promise<ContactResponseDto[]>
  findBySocialMedia(platform: string, handle: string): Promise<ContactResponseDto[]>

  // Search operations
  searchByName(firstName: string, lastName?: string): Promise<ContactResponseDto[]>
  searchContacts(criteria: ContactSearchCriteria): Promise<ContactResponseDto[]>
  advancedSearch(query: AdvancedSearchQuery): Promise<ContactResponseDto[]>

  // Statistics and analytics
  getContactStatistics(accountId?: string): Promise<ContactStats>
  getCommunicationInsights(contactId: string): Promise<CommunicationInsights>
}
```

### 4. ContactOrchestrator Integration

**Purpose**: Use the built-in orchestrator for complex contact workflows

```typescript
class RegistrationOrchestratorService {
  constructor(
    private readonly contactOrchestrator: IContactOrchestrator,
    // ... other dependencies
  ) {}

  async processContactRegistration(
    accountGuid: string,
    contactData: CreateContactDto,
    mainSessionId: string,
  ): Promise<ContactWorkflowResult> {
    // Create contact session
    const contactSession = await this.contactOrchestrator.createSession({
      ...contactData,
      accountGuid,
    });

    // Link to main registration session
    await this.linkSessions(mainSessionId, contactSession.sessionId, 'contact');

    try {
      // Stage contact data
      const stagingResult =
        await this.contactOrchestrator.stageContact(contactData);

      // Validate contact
      const validationResult = await this.contactOrchestrator.validateContact(
        contactSession.sessionId,
      );

      if (!validationResult.success) {
        await this.handleValidationFailure(
          mainSessionId,
          validationResult.errors,
        );
        return { success: false, errors: validationResult.errors };
      }

      // Persist contact
      const persistenceResult = await this.contactOrchestrator.persistContact(
        contactSession.sessionId,
      );

      // Update main session
      await this.updateMainSession(mainSessionId, 'contact_completed', {
        contactId: persistenceResult.contactId,
        sessionId: contactSession.sessionId,
      });

      return persistenceResult;
    } catch (error) {
      await this.handleContactError(
        mainSessionId,
        contactSession.sessionId,
        error,
      );
      throw error;
    } finally {
      // Clean up contact session
      await this.contactOrchestrator.clearSession(contactSession.sessionId);
    }
  }
}
```

## Contact Orchestrator Interface

### Core Contract

```typescript
export interface IContactOrchestrator {
  // Session Management
  createSession(data: Partial<CreateContactDto>): Promise<ContactSessionDto>;
  getSession(sessionId: string): Promise<ContactSessionDto | null>;
  updateSession(
    sessionId: string,
    data: Partial<CreateContactDto>,
  ): Promise<ContactSessionDto>;
  clearSession(sessionId: string): Promise<void>;

  // Workflow Operations
  stageContact(data: Partial<CreateContactDto>): Promise<ContactSessionDto>;
  validateContact(sessionId: string): Promise<ContactWorkflowResultDto>;
  persistContact(sessionId: string): Promise<ContactWorkflowResultDto>;

  // Status Management
  getWorkflowStatus(sessionId: string): Promise<ContactWorkflowResultDto>;
  markStepComplete(sessionId: string, step: string): Promise<void>;
}
```

### Session DTOs

**ContactSessionDto**:

```typescript
export class ContactSessionDto {
  sessionId: string;
  accountGuid?: string;
  status:
    | 'staging'
    | 'validating'
    | 'validated'
    | 'persisting'
    | 'completed'
    | 'failed';

  // Contact data being processed
  contactData: {
    firstName?: string;
    lastName?: string;
    primaryEmail?: string;
    mobilePhone?: string;
    socialMedia?: SocialMediaHandle[];
    communicationPreferences?: CommunicationPreferences;
  };

  // Validation results
  validationResults?: {
    phoneValidation?: PhoneValidationResult;
    emailValidation?: EmailValidationResult;
    socialValidation?: SocialValidationResult;
    businessRulesValidation?: BusinessRuleResult;
    duplicateCheck?: DuplicationResult;
  };

  // Workflow tracking
  completedSteps: string[];
  currentStep?: string;
  errors?: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

**ContactWorkflowResultDto**:

```typescript
export class ContactWorkflowResultDto {
  success: boolean;
  contactId?: string;
  sessionId: string;

  // Detailed results
  stagingResult?: ContactStagingResult;
  validationResult?: ContactValidationResult;
  persistenceResult?: ContactPersistenceResult;

  // Error handling
  errors?: string[];
  warnings?: string[];

  // Analytics
  processTime: number;
  validationMetrics: {
    phoneValidationTime: number;
    emailValidationTime: number;
    socialValidationTime: number;
    duplicateCheckTime: number;
  };

  // Audit trail
  operationLog: {
    timestamp: Date;
    operation: string;
    status: 'success' | 'failure' | 'warning';
    details?: any;
  }[];
}
```

## Integration Patterns

### 1. Cross-Module Coordination

**Account → Contact Relationship**:

```typescript
class RegistrationOrchestratorService {
  async createFullUserProfile(
    registrationData: FullRegistrationDto,
    sessionId: string,
  ): Promise<RegistrationResult> {
    // 1. Create account first
    const account = await this.accountOrchestrator.persistAccount(sessionId);

    // 2. Create contact linked to account
    const contactData = this.mapRegistrationToContact(
      registrationData,
      account.accountId,
    );
    const contact = await this.processContactRegistration(
      account.accountId,
      contactData,
      sessionId,
    );

    // 3. Link contact to account
    await this.linkContactToAccount(account.accountId, contact.contactId);

    return {
      account,
      contact,
      sessionId,
    };
  }
}
```

### 2. Event-Driven Integration

**Contact Lifecycle Events**:

```typescript
class RegistrationOrchestratorService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    // ... other dependencies
  ) {}

  async handleContactEvents(): Promise<void> {
    // Listen to contact events
    this.eventEmitter.on(
      'contact.created',
      async (event: ContactCreatedEvent) => {
        await this.handleContactCreated(event);
      },
    );

    this.eventEmitter.on(
      'contact.validated',
      async (event: ContactValidatedEvent) => {
        await this.handleContactValidated(event);
      },
    );

    this.eventEmitter.on(
      'contact.communication.attempted',
      async (event: CommunicationAttemptEvent) => {
        await this.handleCommunicationAttempt(event);
      },
    );
  }

  private async handleContactCreated(
    event: ContactCreatedEvent,
  ): Promise<void> {
    // Update main registration session
    await this.updateSessionStep(event.sessionId, 'contact_created', {
      contactId: event.contactId,
      channels: event.communicationChannels,
    });

    // Trigger welcome communications
    await this.triggerWelcomeCommunications(event.contactId);
  }
}
```

## Error Handling and Recovery

### 1. Contact-Specific Error Handling

```typescript
class ContactErrorHandler {
  async handleContactValidationError(
    sessionId: string,
    error: ContactValidationError,
  ): Promise<void> {
    const errorType = this.classifyContactError(error);

    switch (errorType) {
      case 'INVALID_PHONE':
        await this.handlePhoneValidationError(sessionId, error);
        break;
      case 'INVALID_EMAIL':
        await this.handleEmailValidationError(sessionId, error);
        break;
      case 'DUPLICATE_CONTACT':
        await this.handleDuplicateContactError(sessionId, error);
        break;
      case 'SOCIAL_MEDIA_ERROR':
        await this.handleSocialMediaError(sessionId, error);
        break;
      default:
        await this.handleGenericContactError(sessionId, error);
    }
  }
}
```

### 2. Recovery Strategies

```typescript
class ContactRecoveryService {
  async recoverFromContactFailure(
    sessionId: string,
    failureReason: ContactFailureReason,
  ): Promise<ContactRecoveryResult> {
    const session = await this.contactOrchestrator.getSession(sessionId);

    switch (failureReason) {
      case 'VALIDATION_FAILED':
        return await this.retryWithCorrectedData(session);
      case 'PERSISTENCE_FAILED':
        return await this.retryPersistence(session);
      case 'DUPLICATE_DETECTED':
        return await this.offerDuplicateMerge(session);
      default:
        return await this.fullContactRecovery(session);
    }
  }
}
```

## Testing Integration

### 1. Service Integration Tests

```typescript
describe('Contact Orchestrator Integration', () => {
  let orchestrator: RegistrationOrchestratorService;
  let contactModule: TestingModule;

  beforeEach(async () => {
    contactModule = await Test.createTestingModule({
      imports: [ContactModule],
      providers: [
        RegistrationOrchestratorService,
        // Mock external dependencies
      ],
    }).compile();

    orchestrator = contactModule.get<RegistrationOrchestratorService>(
      RegistrationOrchestratorService,
    );
  });

  it('should create contact with full validation', async () => {
    const contactData = createValidContactDto();
    const result = await orchestrator.processContactRegistration(
      'test-account-id',
      contactData,
      'test-session-id',
    );

    expect(result.success).toBe(true);
    expect(result.contactId).toBeDefined();
    expect(result.validationResult.phoneValidation.isValid).toBe(true);
  });
});
```

## Performance Considerations

### 1. Contact-Specific Optimizations

- **Validation Caching**: Cache validation results for common phone/email patterns
- **Duplicate Detection**: Efficient duplicate checking with indexed searches
- **Social Media**: Rate-limited social media validation to avoid API limits
- **Batch Processing**: Support for bulk contact operations

### 2. Monitoring and Metrics

```typescript
ContactMetricsService {
  // Validation metrics
  trackPhoneValidationSuccess(phone: string, isValid: boolean): void
  trackEmailValidationTime(email: string, duration: number): void
  trackSocialValidationRate(platform: string, successRate: number): void

  // Operation metrics
  trackContactCreationTime(duration: number): void
  trackDuplicateDetectionRate(rate: number): void
  trackCommunicationDelivery(channel: string, success: boolean): void
}
```

## Conclusion

The Contact Module provides a **comprehensive service layer** that handles all aspects of contact management, from multi-channel validation to complex duplicate detection. The orchestrator should focus on **workflow coordination** while leveraging these robust services for all contact-related business logic.

This integration pattern ensures:

- **Separation of Concerns**: Clear boundaries between orchestration and business logic
- **Reusability**: Contact services can be used by other modules
- **Testability**: Each component can be tested independently
- **Scalability**: Services can be optimized and scaled independently
- **Maintainability**: Changes to contact logic are isolated in the Contact module

The Contact module is **production-ready** and provides all necessary contracts for seamless orchestrator integration.

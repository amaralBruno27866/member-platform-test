# Identity Module Integration Contracts

## Overview

This document defines **exactly how** the future Registration Orchestrator should integrate with the Identity module. The Identity module provides a complete set of services that handle all identity-related business logic, User Business ID validation, multi-language support, and cultural identity management, while the orchestrator focuses on workflow coordination, session management, and cross-module integration.

## Architecture Pattern: Service Provider + Orchestrator

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRATION ORCHESTRATOR                    │
│                        (To be built)                            │
├─────────────────────────────────────────────────────────────────┤
│ Responsibilities:                                               │
│ • Redis session management                                      │
│ • Multi-step identity validation workflows                      │
│ • Language preference coordination                              │
│ • Cross-module integration (Account → Address → Contact → ID)   │
│ • Identity validation orchestration                             │
│ • Error recovery and cleanup                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ consumes services from
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      IDENTITY MODULE                            │
│                   (Already implemented)                         │
├─────────────────────────────────────────────────────────────────┤
│ Services Available:                                             │
│ ✅ IdentityCrudService           - CRUD operations              │
│ ✅ IdentityBusinessRuleService   - Validation & business logic  │
│ ✅ IdentityLookupService         - Data queries & searches      │
│ ✅ IdentityEventService          - Event emission & audit       │
│ ✅ IdentityRepository            - Data access abstraction      │
│ ✅ IdentityMapper                - Type-safe transformations    │
│ ✅ IdentityOrchestrator          - Workflow coordination        │
└─────────────────────────────────────────────────────────────────┘
```

## Service Integration Guide

### 1. IdentityCrudService Integration

**Purpose**: Handle all identity CRUD operations with full business logic

```typescript
// In your orchestrator service
class RegistrationOrchestratorService {
  constructor(
    private readonly identityCrudService: IdentityCrudService,
    private readonly redisService: RedisService,
  ) {}

  async createIdentity(
    sessionId: string,
    identityData: IdentityCreateDto,
  ): Promise<IdentityResponseDto> {
    try {
      // Let the Identity module handle all business logic
      const result = await this.identityCrudService.create(identityData);

      // Update session with created identity
      await this.redisService.setSessionData(
        sessionId,
        'identityId',
        result.identityId,
      );

      return result;
    } catch (error) {
      // Handle orchestrator-level errors (session cleanup, etc.)
      await this.cleanupFailedIdentityCreation(sessionId);
      throw error;
    }
  }
}
```

**Key Methods Available**:

- `create(dto: IdentityCreateDto)`: Creates identity with full validation
- `findByUserBusinessId(businessId: string)`: Finds by unique business ID
- `findByAccountId(accountId: string)`: Finds identities linked to account
- `update(id: string, dto: IdentityUpdateDto)`: Updates with business rules
- `delete(id: string)`: Soft delete with audit trail
- `getDataCompletenessAssessment(id: string)`: Analyzes identity completeness

### 2. IdentityBusinessRuleService Integration

**Purpose**: Validate identity data before persistence operations

```typescript
async validateIdentityForRegistration(
  sessionId: string,
  identityData: IdentityCreateDto,
  accountId: string
): Promise<ValidationResult> {
  // Use the business rule service for comprehensive validation
  const validation = await this.identityBusinessRuleService.validateForCreation(
    identityData,
    accountId
  );

  if (!validation.isValid) {
    // Store validation errors in session for user feedback
    await this.redisService.setSessionData(sessionId, 'identityValidationErrors', validation.errors);
    return validation;
  }

  // Validate cultural consistency
  const culturalValidation = await this.identityBusinessRuleService.validateCulturalConsistency(
    identityData as any // Cast needed for internal validation
  );

  return {
    isValid: validation.isValid && culturalValidation.isValid,
    errors: [...validation.errors, ...culturalValidation.errors],
    culturalSensitivityPassed: culturalValidation.isValid
  };
}
```

**Available Validation Methods**:

- `validateForCreation(dto, accountId)`: Complete creation validation
- `validateUserBusinessIdUniqueness(businessId)`: Check ID uniqueness
- `validateCulturalConsistency(identity)`: Cultural field validation
- `validateLanguagePreferences(languages)`: Multi-language validation
- `meetsMinimumRequirements(identity)`: Basic requirements check

### 3. IdentityLookupService Integration

**Purpose**: Query and search identity data efficiently

```typescript
async findExistingIdentityForUser(
  sessionId: string,
  searchCriteria: IdentitySearchCriteria
): Promise<IdentityResponseDto[]> {
  // Use specialized lookup methods
  const results = await this.identityLookupService.searchIdentities(searchCriteria);

  // Cache results in session for later reference
  if (results.length > 0) {
    await this.redisService.setSessionData(sessionId, 'potentialDuplicateIdentities', results);
  }

  return results;
}

async checkUserBusinessIdAvailability(
  sessionId: string,
  userBusinessId: string
): Promise<UserBusinessIdAvailability> {
  const existing = await this.identityLookupService.findByUserBusinessId(userBusinessId);

  const availability = {
    isAvailable: !existing,
    suggestions: existing ? await this.generateAlternativeIds(userBusinessId) : []
  };

  // Store in session for user reference
  await this.redisService.setSessionData(sessionId, 'userBusinessIdCheck', availability);

  return availability;
}
```

**Available Query Methods**:

- `findByUserBusinessId(businessId)`: Find by unique identifier
- `findByLanguage(language)`: Find identities by language preference
- `findByRace(race)`: Find identities by racial identity
- `findIncompleteIdentities()`: Find identities missing required data
- `searchIdentities(criteria)`: Advanced multi-field search
- `getIdentityStatistics()`: Identity analytics and demographics

## Orchestrator-Specific Integration Patterns

### 1. Session-Based Identity Staging

**Pattern**: Stage identity data in Redis before persistence

```typescript
interface IdentitySessionData {
  // Staged identity data
  stagedIdentity?: IdentityCreateDto;

  // Validation state
  validationResults?: ValidationResult;
  culturalConsistencyResults?: CulturalValidationResult;

  // User Business ID state
  userBusinessIdAvailability?: UserBusinessIdAvailability;
  alternativeIds?: string[];

  // Workflow state
  identityCreationStep?: 'staged' | 'validated' | 'persisted' | 'completed';
  identityId?: string;

  // Error tracking
  validationErrors?: string[];
  businessRuleViolations?: string[];
}

class IdentityOrchestrationService {
  async stageIdentityData(
    sessionId: string,
    data: IdentityCreateDto,
  ): Promise<void> {
    const sessionData: IdentitySessionData = {
      stagedIdentity: data,
      identityCreationStep: 'staged',
      validationResults: undefined,
    };

    await this.redisService.setSessionData(sessionId, 'identity', sessionData);
  }

  async validateStagedIdentity(
    sessionId: string,
    accountId: string,
  ): Promise<ValidationResult> {
    const sessionData =
      await this.redisService.getSessionData<IdentitySessionData>(
        sessionId,
        'identity',
      );

    if (!sessionData?.stagedIdentity) {
      throw new Error('No staged identity data found');
    }

    const validation =
      await this.identityBusinessRuleService.validateForCreation(
        sessionData.stagedIdentity,
        accountId,
      );

    // Update session with validation results
    sessionData.validationResults = validation;
    sessionData.identityCreationStep = 'validated';
    await this.redisService.setSessionData(sessionId, 'identity', sessionData);

    return validation;
  }
}
```

### 2. Multi-Language Identity Support

**Pattern**: Coordinate multi-language identity preferences

```typescript
async processMultiLanguageIdentity(
  sessionId: string,
  languagePreferences: Language[]
): Promise<LanguageProcessingResult> {

  // Validate language selections
  const languageValidation = await this.identityBusinessRuleService.validateLanguagePreferences(
    languagePreferences
  );

  if (!languageValidation.isValid) {
    return {
      status: 'language_validation_failed',
      errors: languageValidation.errors,
      suggestions: languageValidation.suggestions
    };
  }

  // Store language analysis in session
  const languageSessionData = {
    preferences: languagePreferences,
    validationPassed: true
  };

  await this.redisService.setSessionData(sessionId, 'languageAnalysis', languageSessionData);

  return {
    status: 'language_analysis_complete',
    supportedLanguages: languagePreferences
  };
}
```

````

## Error Handling and Recovery Patterns

### 1. Identity Creation Failure Recovery

```typescript
async handleIdentityCreationFailure(
  sessionId: string,
  error: IdentityCreationError,
  identityData: IdentityCreateDto
): Promise<ErrorRecoveryResult> {

  switch (error.type) {
    case 'DUPLICATE_USER_BUSINESS_ID':
      // Generate alternative IDs and store in session
      const alternatives = await this.generateUserBusinessIdAlternatives(identityData.osot_user_business_id);
      await this.redisService.setSessionData(sessionId, 'userBusinessIdAlternatives', alternatives);

      return {
        recoveryAction: 'provide_alternatives',
        alternatives: alternatives,
        userMessage: 'The chosen User Business ID is already taken. Please select from these alternatives.'
      };

    case 'CULTURAL_CONSISTENCY_VIOLATION':
      // Provide cultural consistency guidance
      const culturalGuidance = await this.generateCulturalConsistencyGuidance(identityData);

      return {
        recoveryAction: 'provide_cultural_guidance',
        guidance: culturalGuidance,
        userMessage: 'Please review your cultural identity information for consistency.'
      };

    case 'LANGUAGE_VALIDATION_FAILED':
      // Provide language selection guidance
      const languageGuidance = await this.generateLanguageSelectionGuidance(identityData);

      return {
        recoveryAction: 'provide_language_guidance',
        guidance: languageGuidance,
        userMessage: 'Please review your language preferences.'
      };

    default:
      // Generic error recovery
      await this.cleanupFailedIdentitySession(sessionId);
      return {
        recoveryAction: 'restart_identity_creation',
        userMessage: 'An error occurred during identity creation. Please try again.'
      };
  }
}
````

### 2. Session Cleanup Patterns

```typescript
async cleanupIdentitySession(sessionId: string): Promise<void> {
  const keysToClean = [
    'identity',
    'identityValidationErrors',
    'userBusinessIdCheck',
    'culturalConsistencyResults',
    'languageAnalysis',
    'potentialDuplicateIdentities',
    'userBusinessIdAlternatives'
  ];

  for (const key of keysToClean) {
    await this.redisService.deleteSessionData(sessionId, key);
  }
}

async handleSessionTimeout(sessionId: string): Promise<void> {
  // Check if identity was partially created
  const sessionData = await this.redisService.getSessionData<IdentitySessionData>(sessionId, 'identity');

  if (sessionData?.identityId && sessionData.identityCreationStep !== 'completed') {
    // Mark identity as incomplete for later cleanup
    await this.identityCrudService.markAsIncomplete(sessionData.identityId);
  }

  // Clean up all session data
  await this.cleanupIdentitySession(sessionId);
}
```

## Event Integration Patterns

### 1. Identity Event Handling

```typescript
async handleIdentityEvents(sessionId: string): Promise<void> {
  // Subscribe to identity events for this session
  this.identityEventService.on('IdentityCreated', async (event: IdentityCreatedEvent) => {
    if (event.sessionId === sessionId) {
      await this.onIdentityCreated(sessionId, event);
    }
  });

  this.identityEventService.on('CulturalIdentityValidated', async (event: CulturalIdentityValidatedEvent) => {
    if (event.sessionId === sessionId) {
      await this.onCulturalIdentityValidated(sessionId, event);
    }
  });
}

private async onIdentityCreated(sessionId: string, event: IdentityCreatedEvent): Promise<void> {
  // Update session with created identity information
  await this.redisService.setSessionData(sessionId, 'completedIdentityId', event.identityId);

  // Trigger next step in registration workflow
  await this.triggerNextRegistrationStep(sessionId, 'identity_completed');
}
```

## Testing Integration Patterns

### 1. Orchestrator Integration Testing

```typescript
describe('Identity Orchestrator Integration', () => {
  let orchestrator: RegistrationOrchestratorService;
  let identityModule: IdentityModule;
  let redisService: RedisService;

  beforeEach(async () => {
    // Set up test module with Identity module
    const module = await Test.createTestingModule({
      imports: [IdentityModule],
      providers: [
        RegistrationOrchestratorService,
        {
          provide: RedisService,
          useValue: createMockRedisService(),
        },
      ],
    }).compile();

    orchestrator = module.get<RegistrationOrchestratorService>(
      RegistrationOrchestratorService,
    );
    identityModule = module.get<IdentityModule>(IdentityModule);
  });

  it('should successfully orchestrate identity creation workflow', async () => {
    const sessionId = 'test-session-123';
    const identityData: IdentityCreateDto = {
      osot_user_business_id: 'test-user-001',
      osot_language: [Language.ENGLISH, Language.FRENCH],
      // ... other fields
    };

    // Test the full workflow
    await orchestrator.stageIdentityData(sessionId, identityData);
    const validation = await orchestrator.validateStagedIdentity(
      sessionId,
      'account-123',
    );
    expect(validation.isValid).toBe(true);

    const result = await orchestrator.createIdentity(sessionId, identityData);
    expect(result.identityId).toBeDefined();
  });
});
```

## Summary

The Identity module provides a **complete, production-ready service layer** that handles all identity management complexity. The Registration Orchestrator should focus on:

1. **Session Management**: Redis-based workflow state management
2. **Error Recovery**: Handling failures and providing user feedback
3. **Cross-Module Integration**: Coordinating with Account, Address, and Contact modules
4. **Workflow Orchestration**: Managing multi-step registration processes

The Identity module handles:

- ✅ All business logic and validation
- ✅ User Business ID uniqueness and format validation
- ✅ Multi-language preference support
- ✅ Cultural consistency validation
- ✅ Data persistence and audit trails
- ✅ Event emission and lifecycle management
- ✅ Error handling and detailed feedback

This separation of concerns ensures maintainable, testable, and scalable identity management within the broader registration system.

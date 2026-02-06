# Membership Settings - Modules Layer

This directory contains the NestJS module configuration for the membership settings module, providing dependency injection setup and service orchestration.

## Architecture Overview

The modules layer follows **NestJS module pattern** with comprehensive dependency injection:

1. **Main Module** - Complete module configuration with all dependencies
2. **Service Registration** - All services registered as providers
3. **Controller Registration** - Public and private controllers configured
4. **Repository Integration** - Repository pattern with dependency injection token

## Module Files

### `membership-settings.module.ts`

- **Purpose**: NestJS module configuration for complete membership settings functionality
- **Usage**: Import into app module or feature modules for membership settings capabilities
- **Features**: Full dependency injection, repository pattern, controller routing
- **Dependencies**: DataverseModule for external integration

## Design Philosophy

### Dependency Injection Architecture

- **Service Layer Integration**: All three services (business rules, CRUD, lookup) registered
- **Repository Pattern**: Repository injection token for clean abstraction
- **Controller Registration**: Both public and private controllers configured
- **Mapper Integration**: Mapper service available for dependency injection

### Module Encapsulation

- **Complete Functionality**: Module provides all membership settings capabilities
- **Clean Exports**: Essential services exported for potential external use
- **Dependency Management**: Clear separation of internal and external dependencies
- **Testing Support**: Module structure supports easy unit and integration testing

## Module Configuration

### Imports

```typescript
imports: [
  DataverseModule, // External Dataverse integration
],
```

### Controllers

```typescript
controllers: [
  MembershipSettingsPublicController,  // Public API endpoints
  MembershipSettingsPrivateController, // Private CRUD endpoints
],
```

### Providers

```typescript
providers: [
  // Business logic services
  MembershipSettingsBusinessRulesService,
  MembershipSettingsCrudService,
  MembershipSettingsLookupService,

  // Repository with injection token
  {
    provide: MEMBERSHIP_SETTINGS_REPOSITORY,
    useClass: DataverseMembershipSettingsRepository,
  },

  // Data transformation
  MembershipSettingsMapper,
],
```

### Exports

```typescript
exports: [
  // Services for external module usage
  MembershipSettingsBusinessRulesService,
  MembershipSettingsCrudService,
  MembershipSettingsLookupService,
  MEMBERSHIP_SETTINGS_REPOSITORY,
  MembershipSettingsMapper,
],
```

## Integration Points

### With App Module

```typescript
// In app.module.ts
@Module({
  imports: [
    // Other modules...
    MembershipSettingsModule,
  ],
  // ...
})
export class AppModule {}
```

### With Feature Modules

```typescript
// In other feature modules that need membership settings
@Module({
  imports: [MembershipSettingsModule],
  providers: [
    // Can inject membership settings services
    SomeOtherService,
  ],
})
export class SomeFeatureModule {}
```

### Service Injection Example

```typescript
// In another service
@Injectable()
export class SomeOtherService {
  constructor(
    private readonly membershipLookupService: MembershipSettingsLookupService,
  ) {}

  async getActiveFees() {
    return this.membershipLookupService.getActiveSettings();
  }
}
```

## Repository Pattern Integration

### Injection Token Usage

```typescript
// Repository injection in services
constructor(
  @Inject(MEMBERSHIP_SETTINGS_REPOSITORY)
  private readonly repository: MembershipSettingsRepositoryInterface,
) {}
```

### Repository Provider Configuration

```typescript
// Module provider setup
{
  provide: MEMBERSHIP_SETTINGS_REPOSITORY,
  useClass: DataverseMembershipSettingsRepository,
}
```

### Testing Support

```typescript
// In test files
const module: TestingModule = await Test.createTestingModule({
  imports: [MembershipSettingsModule],
  providers: [
    // Override repository for testing
    {
      provide: MEMBERSHIP_SETTINGS_REPOSITORY,
      useClass: MockMembershipSettingsRepository,
    },
  ],
}).compile();
```

## API Route Configuration

### Public Routes

```typescript
// Automatically configured through MembershipSettingsPublicController
GET /public/membership-settings/active
GET /public/membership-settings/active/category/:category
```

### Private Routes

```typescript
// Automatically configured through MembershipSettingsPrivateController
POST   /private/membership-settings
GET    /private/membership-settings
GET    /private/membership-settings/:id
PATCH  /private/membership-settings/:id
DELETE /private/membership-settings/:id
```

## Module Dependencies

### External Dependencies

- **DataverseModule**: Required for external system integration
- **Common Enums**: Privilege, Category, MembershipYear, AccountStatus
- **Common Services**: Error handling and validation utilities

### Internal Dependencies

- **All Layer Dependencies**: Constants, validators, DTOs, interfaces, mappers, repositories, services, controllers, events
- **Complete Integration**: All layers properly wired through dependency injection

## Usage Examples

### Basic Module Import

```typescript
// Import in app module
import { MembershipSettingsModule } from './classes/membership/membership-settings/modules/membership-settings.module';

@Module({
  imports: [
    // ... other modules
    MembershipSettingsModule,
  ],
})
export class AppModule {}
```

### Service Usage in Controllers

```typescript
// Automatic injection in controllers
@Controller('some-other-endpoint')
export class SomeController {
  constructor(
    private readonly membershipLookupService: MembershipSettingsLookupService,
  ) {}

  @Get('fees')
  async getFees() {
    return this.membershipLookupService.getActiveSettings();
  }
}
```

### Testing Module Setup

```typescript
// In test files
describe('MembershipSettingsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [MembershipSettingsModule],
    }).compile();
  });

  it('should provide all services', () => {
    expect(module.get(MembershipSettingsBusinessRulesService)).toBeDefined();
    expect(module.get(MembershipSettingsCrudService)).toBeDefined();
    expect(module.get(MembershipSettingsLookupService)).toBeDefined();
  });
});
```

## Quality Standards

### Code Quality

- ESLint compliant module configuration
- Comprehensive TypeScript type coverage for all providers
- Clear documentation for module usage and integration patterns
- Consistent naming conventions following NestJS standards

### Dependency Management

- Clean separation of internal and external dependencies
- Proper use of injection tokens for repository pattern
- Export strategy that enables external module integration
- Testing-friendly configuration with easy mocking support

### Integration Standards

- Standard NestJS module pattern compliance
- Proper controller route configuration
- Service layer integration following dependency injection best practices
- Repository pattern implementation with clean abstractions

## Next Steps

After completing the modules layer, the following enhancements can be implemented:

1. **Event Handlers** - Implement specific event handlers for audit and notification
2. **Testing Suite** - Comprehensive unit and integration tests
3. **Performance Optimization** - Caching and query optimization
4. **Documentation** - API documentation and integration guides

The module provides a complete, production-ready foundation for membership settings management within the OSOT system.

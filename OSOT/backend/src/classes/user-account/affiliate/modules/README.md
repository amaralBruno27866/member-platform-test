# Affiliate Modules

## Purpose

Contains NestJS modules that bundle controllers, services, and providers for the affiliate domain. Modules define the public API (exports) and dependency graph for related affiliate components.

## Implemented Modules

### AffiliateModule (`affiliate.module.ts`)

**Purpose**: Main module for complete affiliate functionality.

**Components**:

- **Controllers**: `AffiliatePublicController`, `AffiliatePrivateController`
- **Services**: `AffiliateBusinessRuleService`, `AffiliateCrudService`, `AffiliateLookupService`
- **Imports**: `DataverseModule`
- **Exports**: All affiliate services

**Integration Example**:

```typescript
@Module({
  imports: [AffiliateModule],
  // Affiliate services are now available for injection
})
export class AppModule {}
```

## Guidelines

- Keep modules composed around cohesive functionality
- Avoid circular imports by splitting shared utilities into separate modules
- Use the exported services for cross-module communication

## File Structure

```
modules/
├── affiliate.module.ts     # Complete affiliate functionality
└── README.md              # This documentation
```

## Implemented Modules

### 1. AffiliateModule (`affiliate.module.ts`)

**Purpose**: Main comprehensive module for complete affiliate functionality.

**Architecture**: Full-feature module with all services and controllers.

**Components**:

- **Controllers**: `AffiliatePublicController`, `AffiliatePrivateController`
- **Services**: All three affiliate services (Business Rule, CRUD, Lookup)
- **Imports**: `DataverseModule`
- **Exports**: All services for external consumption

**Use Cases**:

- Complete affiliate system integration
- Monolithic deployment scenarios
- Development and testing environments
- Applications requiring full affiliate functionality

**Integration Example**:

```typescript
@Module({
  imports: [AffiliateModule],
  // Now you can inject affiliate services anywhere in this module
})
export class AppModule {}
```

### 2. AffiliatePublicModule (`affiliate-public.module.ts`)

**Purpose**: Specialized module for unauthenticated affiliate operations.

**Architecture**: Minimal security-focused module for public endpoints.

**Components**:

- **Controllers**: `AffiliatePublicController` only
- **Services**: `AffiliateBusinessRuleService`, `AffiliateLookupService`
- **Imports**: `DataverseModule`
- **Exports**: Business Rule and Lookup services
- **Security**: PUBLIC security level, rate limiting preparation

**Endpoints Provided**:

- ✅ POST `/public/affiliates/validate/email` - Email availability validation
- ✅ GET `/public/affiliates/search/name` - Search by organization name
- ✅ GET `/public/affiliates/search/city/:city` - Search by city location
- ✅ GET `/public/affiliates/search/province/:province` - Search by province
- ✅ GET `/public/affiliates/search/area/:area` - Search by business area
- ✅ GET `/public/affiliates/active` - List active affiliates (public info)

**Use Cases**:

- Registration forms with email validation
- Public affiliate directory websites
- Marketing and SEO-friendly affiliate listings
- Geographic affiliate discovery for customers
- Microservice deployments (public API service)

**Integration Example**:

```typescript
@Module({
  imports: [AffiliatePublicModule],
  // Only public affiliate operations available
})
export class PublicApiModule {}
```

### 3. AffiliatePrivateModule (`affiliate-private.module.ts`)

**Purpose**: Specialized module for authenticated affiliate operations.

**Architecture**: Full-security module with privilege-based access control.

**Components**:

- **Controllers**: `AffiliatePrivateController` only
- **Services**: All three affiliate services (complete functionality)
- **Imports**: `DataverseModule`, Authentication modules (prepared)
- **Exports**: All services for external consumption
- **Security**: JWT authentication, privilege hierarchy (OWNER > ADMIN > MAIN)

**Endpoints Provided**:

- ✅ POST `/private/affiliates` - Create new affiliate with privilege checks
- ✅ GET `/private/affiliates/:id` - Get affiliate by ID with field filtering
- ✅ PUT `/private/affiliates/:id` - Update affiliate with validation
- ✅ DELETE `/private/affiliates/:id` - Delete affiliate (privilege required)
- ✅ GET `/private/affiliates` - List affiliates with pagination
- ✅ POST `/private/affiliates/:id/verify-password` - Password verification
- ✅ GET `/private/affiliates/search/email/:email` - Email-based lookup
- ✅ GET `/private/affiliates/search/advanced` - Advanced search with filters

**Use Cases**:

- Administrative dashboards and management interfaces
- Affiliate self-service portals with authentication
- Internal business applications
- Microservice deployments (private API service)
- Enterprise applications with role-based access

**Integration Example**:

```typescript
@Module({
  imports: [
    AffiliatePrivateModule,
    JwtModule.register({...}),
    PassportModule,
  ],
  // Full authenticated affiliate operations available
})
export class AdminModule {}
```

## Security Architecture

### Module Security Boundaries

| Module                 | Authentication | Authorization   | Security Level |
| ---------------------- | -------------- | --------------- | -------------- |
| AffiliateModule        | Mixed          | Mixed           | ALL            |
| AffiliatePublicModule  | None           | None            | PUBLIC         |
| AffiliatePrivateModule | JWT Required   | Privilege-based | AUTHENTICATED+ |

### Privilege Levels

```
OWNER (Level 3)
├── Full system access
├── Delete operations
├── User management
└── Administrative functions

ADMIN (Level 2)
├── Read/Write operations
├── User creation/updates
├── Business operations
└── No delete permissions

MAIN (Level 1)
├── Read-only access
├── Basic information viewing
└── Limited functionality
```

### Security Features by Module

**AffiliatePublicModule**:

- ✅ Rate limiting preparation
- ✅ Input validation and sanitization
- ✅ PUBLIC security level filtering
- ✅ No sensitive data exposure
- ✅ CORS-friendly for web integration

**AffiliatePrivateModule**:

- ✅ JWT authentication integration (prepared)
- ✅ Privilege-based route protection
- ✅ Field-level access control
- ✅ Operation-level privilege validation
- ✅ Comprehensive audit logging

## Deployment Strategies

### 1. Monolithic Deployment

Use `AffiliateModule` for complete functionality in a single application:

```typescript
@Module({
  imports: [AffiliateModule, DatabaseModule, AuthModule],
})
export class AppModule {}
```

### 2. Microservice Deployment

Split public and private functionality into separate services:

```typescript
// Public API Service
@Module({
  imports: [AffiliatePublicModule],
})
export class PublicApiModule {}

// Private API Service
@Module({
  imports: [AffiliatePrivateModule, AuthModule],
})
export class PrivateApiModule {}
```

### 3. Feature-Based Deployment

Import specific modules based on application requirements:

```typescript
// Customer-facing application
@Module({
  imports: [AffiliatePublicModule],
})
export class CustomerAppModule {}

// Admin application
@Module({
  imports: [AffiliatePrivateModule, AuthModule],
})
export class AdminAppModule {}
```

## Integration Patterns

### Service Injection

All modules export their services for external use:

```typescript
// In any module that imports AffiliateModule
constructor(
  private readonly businessRuleService: AffiliateBusinessRuleService,
  private readonly crudService: AffiliateCrudService,
  private readonly lookupService: AffiliateLookupService,
) {}
```

### Cross-Module Communication

```typescript
// Example: User module using affiliate services
@Injectable()
export class UserRegistrationService {
  constructor(
    private readonly affiliateBusinessRule: AffiliateBusinessRuleService,
  ) {}

  async validateEmailForRegistration(email: string): Promise<boolean> {
    return this.affiliateBusinessRule.validateEmailUniqueness(email);
  }
}
```

### Authentication Integration

```typescript
// When authentication is implemented
@Module({
  imports: [
    AffiliatePrivateModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [JwtStrategy],
})
export class AuthenticatedAffiliateModule {}
```

## Error Handling

All modules implement structured error handling:

```typescript
// Common error patterns across all modules
try {
  const result = await this.affiliateService.operation();
  return result;
} catch (error) {
  if (error instanceof BadRequestException) {
    throw error; // Re-throw validation errors
  }
  throw new InternalServerErrorException('Operation failed');
}
```

## Performance Considerations

### Module Loading

- **Lazy Loading**: Modules can be loaded on-demand for better performance
- **Tree Shaking**: Unused modules are automatically excluded from builds
- **Service Caching**: Services are singletons within module scope

### Resource Optimization

```typescript
// Optimal imports for specific use cases
import { AffiliatePublicModule } from './affiliate-public.module'; // Lightweight
import { AffiliatePrivateModule } from './affiliate-private.module'; // Full-featured
import { AffiliateModule } from './affiliate.module'; // Complete solution
```

## Testing Strategies

### Unit Testing

```typescript
// Testing individual modules
describe('AffiliatePublicModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AffiliatePublicModule],
    }).compile();
  });

  it('should provide public services', () => {
    expect(module.get(AffiliateBusinessRuleService)).toBeDefined();
    expect(module.get(AffiliateLookupService)).toBeDefined();
  });
});
```

### Integration Testing

```typescript
// Testing module interactions
describe('Affiliate Module Integration', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AffiliateModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should handle public endpoints', () => {
    return request(app.getHttpServer())
      .post('/public/affiliates/validate/email')
      .send({ email: 'test@example.com' })
      .expect(200);
  });
});
```

## Guidelines

### Module Design Principles

- **Single Responsibility**: Each module has a clear, focused purpose
- **Dependency Injection**: Clean separation of concerns through DI
- **Security Boundaries**: Clear authentication and authorization boundaries
- **Export Strategy**: Well-defined public APIs for external consumption
- **Import Minimization**: Only import what's necessary for functionality

### Best Practices

- ✅ Use specific modules (`AffiliatePublicModule`/`AffiliatePrivateModule`) for targeted functionality
- ✅ Import `AffiliateModule` only when complete functionality is needed
- ✅ Leverage module exports for clean cross-module service injection
- ✅ Follow security boundaries strictly (public vs private operations)
- ✅ Implement proper error handling and logging in all modules
- ✅ Use TypeScript interfaces for clean module contracts

### Common Patterns

```typescript
// Good: Specific module for specific use case
@Module({
  imports: [AffiliatePublicModule], // Only public functionality
})
export class PublicWebsiteModule {}

// Good: Complete module for full functionality
@Module({
  imports: [AffiliateModule], // All functionality
})
export class ComprehensiveAppModule {}

// Avoid: Mixing specific modules unnecessarily
@Module({
  imports: [
    AffiliatePublicModule,
    AffiliatePrivateModule, // Redundant if using complete module
  ],
})
export class RedundantModule {} // Consider AffiliateModule instead
```

## File Structure

```
modules/
├── affiliate.module.ts                # Complete affiliate functionality (80+ lines)
├── affiliate-public.module.ts         # Public endpoints only (85+ lines)
├── affiliate-private.module.ts        # Private/authenticated endpoints (95+ lines)
└── README.md                         # This comprehensive documentation
```

## Dependencies

```typescript
// External Dependencies
import { DataverseModule } from '../../../../integrations/dataverse.module';

// Authentication Dependencies (when implemented)
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Internal Dependencies
import { AffiliateBusinessRuleService } from '../services/affiliate-business-rule.service';
import { AffiliateCrudService } from '../services/affiliate-crud.service';
import { AffiliateLookupService } from '../services/affiliate-lookup.service';
import { AffiliatePublicController } from '../controllers/affiliate-public.controller';
import { AffiliatePrivateController } from '../controllers/affiliate-private.controller';
```

---

_These modules follow NestJS best practices and enterprise patterns, providing flexible deployment options with clean security boundaries and comprehensive functionality._

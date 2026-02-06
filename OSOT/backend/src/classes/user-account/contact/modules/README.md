# Contact Modules

## Purpose

Contains NestJS modules that implement the contact domain using modern architecture patterns. The Contact module bundles controllers, services, repositories, and providers to create a cohesive contact management system with public/private API separation and comprehensive business features.

## Module Structure

### ContactModule (`contact.module.ts`)

The main module implementing complete contact management functionality with dependency injection and clean architecture:

#### **Controllers**

- **ContactPublicController**: Registration workflow routes for contact staging and validation (no auth)
- **ContactPrivateController**: Authenticated user contact management and admin operations (JWT required)

#### **Services**

- **ContactCrudService**: CRUD operations using repository pattern and events
- **ContactLookupService**: Professional networking, social media, and business ID queries
- **ContactBusinessRuleService**: Business rule validation and social media normalization
- **ContactEventsService**: Event-driven architecture for contact lifecycle

#### **Repository Pattern**

- **DataverseContactRepository**: Clean abstraction for Dataverse contact data access
- **CONTACT_REPOSITORY**: Dependency injection token for repository interface

#### **External Dependencies**

- **DataverseService**: Integration with Microsoft Dataverse backend

## Architecture Patterns Implemented

### **Dependency Injection**

```typescript
{
  provide: CONTACT_REPOSITORY,
  useClass: DataverseContactRepository,
}
```

### **Service Layer Architecture**

- **CRUD Operations**: Core data management with business logic
- **Lookup Services**: Professional networking and social media queries
- **Business Rules**: Validation, normalization, and compliance
- **Event Management**: Lifecycle events for integration and auditing

### **Public/Private API Pattern**

- **Public Routes**: `/public/contacts/*` for registration workflows
- **Private Routes**: `/contacts/*` for authenticated user operations
- **Role-Based Access**: Permission system with field filtering

### **Repository Pattern**

- **Clean Data Access**: Abstract data layer with repository interface
- **Testability**: Easy mocking and unit testing capabilities
- **Flexibility**: Pluggable implementations (currently Dataverse-based)

## Contact Management Features

### **Professional Networking**

- Business ID uniqueness validation and management
- Job title analytics and autocomplete functionality
- Professional contact organization and categorization

### **Social Media Integration**

- Multi-platform support (Facebook, Instagram, TikTok, LinkedIn)
- URL validation and normalization using centralized utilities
- Social media profile management and analytics

### **Registration Workflow**

- Contact staging during user registration process
- Validation workflow coordination with business rules
- Seamless integration with account creation orchestrator

### **Advanced Analytics**

- Personal contact summaries and statistics
- Administrative analytics and system-wide reporting
- Contact engagement and social media adoption metrics

## Module Exports

The Contact module exports services for use in other modules and orchestrators:

```typescript
exports: [
  ContactCrudService, // For account orchestrators
  ContactLookupService, // For search and analytics
  ContactBusinessRuleService, // For validation workflows
  ContactEventsService, // For event-driven integrations
  CONTACT_REPOSITORY, // For testing and extensions
];
```

## Integration Points

### **Account Module Integration**

- Automatic OData binding to account entities
- User context extraction from JWT tokens
- Role-based permission enforcement

### **Registration Orchestrator**

- Contact staging and validation services
- Workflow state management and tracking
- Seamless data persistence after account creation

### **Dataverse Integration**

- Microsoft Dataverse backend connectivity
- Entity relationship management
- Data transformation and mapping

## Development Guidelines

### **Module Best Practices**

- Keep modules composed around cohesive functionality
- Avoid circular imports by proper dependency management
- Export services that other modules need to consume
- Maintain clear separation between public and private functionality

### **Dependency Management**

- Use dependency injection for all external dependencies
- Implement repository pattern for data access abstraction
- Delegate business logic to appropriate service layers
- Maintain loose coupling between architectural layers

### **Testing Strategy**

- Mock repository implementations for unit testing
- Test service integrations with proper dependency injection
- Validate module composition and export functionality
- Ensure proper controller registration and route handling

## Security Considerations

### **Authentication Strategy**

- JWT-based authentication for private routes
- Public routes for registration and utility functions
- User context validation and business ID verification

### **Permission System**

- Role-based access control (owner/admin/main)
- Field-level filtering based on user permissions
- Data isolation and ownership validation

### **Data Protection**

- Input sanitization through DTO validation
- Business rule enforcement for data integrity
- Event-driven audit trail for compliance

## Performance Optimization

### **Caching Strategy**

- Service-level caching for frequently accessed data
- Repository-level query optimization
- Event-driven cache invalidation

### **Scalability Features**

- Stateless service design for horizontal scaling
- Repository abstraction for database flexibility
- Event-driven architecture for loose coupling

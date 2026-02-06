Tests

Purpose

Houses unit and integration tests for the contact domain. Tests ensure correctness of services, repositories, mappers, controllers, and validation logic for contact-related operations.

Examples

- contact.service.spec.ts -> tests ContactCrudService behavior and validation logic
- contact.repository.spec.ts -> integration tests against test Dataverse or in-memory store
- contact-business-rule.service.spec.ts -> tests multi-channel validation and business rules
- contact-lookup.service.spec.ts -> tests search functionality and duplicate detection

Guidelines

- Prefer small, fast unit tests for business logic and a few integration tests for critical paths.
- Mock external services (Dataverse, Redis, validation APIs) in unit tests.
- Include comprehensive tests for contact-specific features like phone/email validation and duplicate detection.

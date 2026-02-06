Tests

Purpose

Houses unit and integration tests for the address domain. Tests ensure correctness of services, repositories, mappers, controllers, and validation logic for address-related operations.

Examples

- address.service.spec.ts -> tests AddressCrudService behavior and validation logic
- address.repository.spec.ts -> integration tests against test Dataverse or in-memory store
- address-business-rule.service.spec.ts -> tests postal code validation and normalization
- address-lookup.service.spec.ts -> tests geographic searches and address formatting

Guidelines

- Prefer small, fast unit tests for business logic and a few integration tests for critical paths.
- Mock external services (Dataverse, Redis, geographic APIs) in unit tests.
- Include comprehensive tests for address-specific features like postal code validation and normalization.

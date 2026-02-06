# Tests

## Purpose

Houses unit and integration tests for the identity domain. Tests ensure correctness of services, repositories, mappers and controllers.

## Examples

- identity.service.spec.ts -> tests IdentityService behavior
- identity.repository.spec.ts -> integration tests against a test database or in-memory store
- identity-validation.spec.ts -> tests custom validators for SIN, government IDs

## Guidelines

- Prefer small, fast unit tests for business logic and a few integration tests for critical paths.
- Mock external services (Dataverse, Redis) in unit tests.

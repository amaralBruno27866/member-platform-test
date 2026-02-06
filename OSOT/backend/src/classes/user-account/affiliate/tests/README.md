Tests

Purpose

Houses unit and integration tests for the account domain. Tests ensure correctness of services, repositories, mappers and controllers.

Examples

- account.service.spec.ts -> tests AccountService behavior
- account.repository.spec.ts -> integration tests against a test database or in-memory store

Guidelines

- Prefer small, fast unit tests for business logic and a few integration tests for critical paths.
- Mock external services (Dataverse, Redis) in unit tests.

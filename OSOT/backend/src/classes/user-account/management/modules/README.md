Modules

Purpose

Contains NestJS modules that bundle controllers, services, and providers for the account domain. Modules define the public API (exports) and dependency graph for related pieces.

Examples

- AccountModule that imports DatabaseModule and provides AccountService and AccountController.

Notes

- Keep modules composed around cohesive functionality.
- Avoid circular imports by splitting shared utilities into separate modules.

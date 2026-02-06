# Dataverse Integration Overview

This document consolidates the current Dataverse integration present in the repository, explains how the connection is made, and proposes a reusable generic repository model to connect the API to any Dataverse table.

## Table of Contents

- Overview
- Current implementation (components)
  - `DataverseService`
  - `DataverseModule`
  - Usage pattern in domain services (example: `TableAccountService`)
  - `dataverse-app.helper.ts`
  - Environment configuration
- Contract and flow
- How to connect to any Dataverse table (current pattern)
- Proposed generic model: `DataverseRepository`
  - Contract
  - Methods
  - Table metadata

  NOTE (recent analysis): Since this document was first written I inspected more files across the codebase (registration orchestrator, registration-process services, many `table-*` services and the Redis wrapper). The findings below reflect the updated state and a prioritized action plan.
  - Example usage

- Security, risks and improvements

  Recent observation: Many domain services construct OData strings and call `dataverseService.request(...)` directly. There isn't a centralized repository layer in use and there is no global token cache. Redis is already used in the project for session/temporary data and is a natural place for a cross-instance token cache.
  - Token caching
  - Rate limiting & retry behavior
  - OData injection

  Notes: the `DataverseRepository` should be introduced incrementally. The lowest-risk first step is to add token caching (below) and expose a thin repository that delegates to `DataverseService` while adding safe OData builders and helpers.
  - Ownership & permissions
  - GUID vs business id
  - Error handling & telemetry

  Recent analysis details:
  - I scanned the codebase for other token caches or repository abstractions. `getAccessToken` is only implemented in `src/integrations/dataverse.service.ts`. No other file implements a token cache. Calls to `dataverseService.getCredentialsByApp(...)` are widespread and many services call `dataverseService.request` directly. This confirms that a token cache must be added either inside `DataverseService` or immediately upstream (e.g., in `DataverseRepository`) to get immediate benefit.
  - Tests and CI

- Implementation checklist
- Next steps

  Recent analysis details:
  - Many services in `src/classes/*/` and `src/registration-process/*` build OData `$filter` strings manually. A small FilterBuilder (or typed helper) will remove duplicated code and centralize encoding/escaping rules.

## Overview

The application centralizes Dataverse calls in a service (`DataverseService`) that: obtains OAuth2 tokens from Azure AD (client credentials flow), builds requests to the Dataverse Web API (v9.2), and performs HTTP calls including simple retry logic. Domain services (for example `TableAccountService`) decide which Dataverse app credentials to use via `dataverse-app.helper.ts` and call `DataverseService.request(...)` with OData endpoints.

Recent analysis details:

- The registration orchestrator and many registration services rely on the Dataverse responses to drive the flow; improving error translation and structured telemetry will make retries, alerts, and support easier.

- [ ] Add `src/integrations/dataverse.repository.ts` with the methods above (create/get/update/delete/list/listAll/rawRequest).
- [ ] Implement token cache (Redis-backed) and locking in `DataverseService` or `DataverseRepository.getToken`.
- [ ] Implement safe OData filter builder and query helper and export it with the repository.
- [ ] Add or enhance retry logic to handle 429 (`Retry-After`) and 401 (invalidate token and retry once).
- [ ] Replace direct `dataverseService.request` calls in domain services with `DataverseRepository` (refactor in phases; start with registration flows and account services).
- [ ] Add unit tests for token cache, repository helpers, and common flows; update CI test suites.
- [ ] Add integration/smoke harness (mock Dataverse) for end-to-end registration persistence tests.
- [ ] Update project docs and README with new patterns and migration steps.

Priority (quick wins):

- Implement token cache in `DataverseService` (small change, immediate benefit) — HIGH
- Add 401/429 handling in `DataverseService.request` — HIGH
- Create a minimal `DataverseRepository` wrapper with `findByBusinessId` and `create`, and migrate `account-registration` and the orchestrator to use it — MEDIUM
- Implement FilterBuilder and migrate OData `$filter` construction — MEDIUM
- Gradually migrate other services — LOW
- Obtain OAuth2 client_credentials tokens from Azure AD (v2 endpoint)
- Perform generic HTTP requests to Dataverse Web API

Immediate next steps I recommend (pick one):

- A) Implement a Redis-backed token cache in `DataverseService` (fast, low-risk). I will: inject `RedisService`, implement cache+lock, add unit tests, and update `DataverseService.request` to invalidate on 401 and to respect `Retry-After` 429 responses.

- B) Implement a minimal `DataverseRepository` that uses `DataverseService` for transport, provides `create` and `findByBusinessId` pragmatically, and migrate `account-registration` and `registration-orchestrator` to use it (PoC migration).

- C) Do A + B together (full approach): implement token cache first, then create repository and migrate a few services — recommended if you want a single PR that addresses both performance and maintainability.

If you want me to implement, tell me which option (A, B, or C) and I will start: I will create the necessary files, add unit tests, and run the test suite for the changed modules. I will report progress after each logical step.

- `getCredentialsByApp(app)` — returns credentials for `main`, `owner`, `admin`, `login`
- `getAccessToken(credentials?)` — POST to `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`
- `request(method, endpoint, data, credentials, appContext?)` — performs API call to `${dataverseUrl}/api/data/v9.2/${endpoint}`
- Error handling:
  - On token problems throws HttpException(401)
  - On request failures throws HttpException(502)

### `DataverseModule` (src/integrations/dataverse.module.ts)

- Registers `HttpModule` and provides `DataverseService` for injection across the app.

### Usage pattern in domain services (example: `TableAccountService`)

- Domain services use `getAppForOperation(operation, userRole)` to choose an app context.
- Call `dataverseService.getCredentialsByApp(app)` to get credential set.
- Build OData endpoint strings (e.g. `osot_table_accounts?$filter=osot_email eq 'x'&$select=...`).
- Use `dataverseService.request('GET'|'POST'|'PATCH'|'DELETE', endpoint, payload, credentials)`.
- Resolve business id -> GUID when needed (`findGuidByBusinessId` pattern).

### `dataverse-app.helper.ts`

- Encapsulates mapping operation+role -> app context:
  - `getAppForOperation(operation, userRole)` returns one of `'main'|'owner'|'admin'|'login'`.
  - `canCreate/canRead/canWrite/canDelete` helpers for permission checks.

### Environment configuration (.env)

- Required values used by `DataverseService`:
  - `DYNAMICS_URL` (Dataverse base URL)
  - `MAIN_TENANT_ID` (tenant id)
  - Client ids and secrets: `MAIN_CLIENT_ID`, `MAIN_CLIENT_SECRET`, `OWNER_CLIENT_ID`, `OWNER_CLIENT_SECRET`, `ADMIN_CLIENT_ID`, `ADMIN_CLIENT_SECRET`, `LOGIN_CLIENT_ID`, `LOGIN_CLIENT_SECRET`, `LOGIN_TENANT_ID`.

## Contract and flow (high level)

1. Domain layer chooses app context (based on operation + user role) using `getAppForOperation`.
2. Domain layer reads credentials `dataverseService.getCredentialsByApp(app)`.
3. Domain layer composes OData endpoint string (table name, $filter, $select, paging).
4. `DataverseService.request` obtains an access token (client_credentials) using `getAccessToken` if needed.
5. `DataverseService` calls Dataverse API and returns `response.data`.
6. Domain layer maps/filters Dataverse response to DTOs/interfaces and enforces business rules.

## How to connect to any Dataverse table (current pattern)

Example: find a record by business id

- Table metadata (implicit): table name `osot_table_accounts`, business field `osot_account_id`, guid field `osot_table_accountid`.
- Endpoint built: `osot_table_accounts?$filter=osot_account_id eq 'osot-000001'&$select=osot_table_accountid`.
- Call: `dataverseService.request('GET', endpoint, undefined, credentials)`.
- If found, return `value[0].osot_table_accountid`.

Create record

- Build payload with allowed fields (DTO validated by Nest class-validators).
- Call: `dataverseService.request('POST', 'osot_table_accounts', payload, credentials)`.
- Dataverse `Prefer: return=representation` returns created entity (DataverseService already sets prefer for POST).

Update record by guid

- Call: `dataverseService.request('PATCH', 'osot_table_accounts(<guid>)', payload, credentials)`.

Delete by guid

- Call: `dataverseService.request('DELETE', 'osot_table_accounts(<guid>)', undefined, credentials)`.

## Proposed generic model: `DataverseRepository`

Goal: centralize OData query building, GUID/business id mapping, paging, and common CRUD patterns behind a small API so domain services don't rebuild endpoints each time.

### Contract

- `DataverseRepository` will be a class that depends on `DataverseService` and exposes typed generic methods for CRUD and list operations.
- Table metadata object (per table) shape:
  ```ts
  type TableMeta = {
    name: string; // logical name e.g. 'osot_table_accounts'
    businessField: string; // e.g. 'osot_account_id'
    guidField: string; // e.g. 'osot_table_accountid'
    defaultSelect?: string[];
    ownership?: 'user' | 'team' | 'org';
  };
  ```

### Methods (suggested)

- `create<T>(meta: TableMeta, payload: Partial<T>, options?) => Promise<T>`
- `findByBusinessId<T>(meta: TableMeta, businessId: string, options?) => Promise<T | null>`
- `findOneById<T>(meta: TableMeta, guid: string, options?) => Promise<T | null>`
- `updateById(meta, guid, payload, options?) => Promise<void>`
- `deleteById(meta, guid, options?) => Promise<void>`
- `list<T>(meta, queryOptions) => Promise<{ value: T[], nextLink?: string }>`
- `listAll<T>(meta, queryOptions) => Promise<T[]>` (automatically page through all results)
- `rawRequest(method, endpoint, data, options?) => passthrough to DataverseService.request`

Options may include `credentials` (DataverseCredentials) or `appContext` (string) or `selectFields` override.

### Implementation details (recommendations)

- Build helper to assemble safe OData queries (escape/encode filter values).
- Return typed results but keep raw shape available when needed.
- Implement token caching in `DataverseService.getAccessToken` or `DataverseRepository` layer to avoid requesting token per call.
- Implement a small helper to resolve business id -> guid using a reusable path in repository.

### Example usage in `TableAccountService` (pseudo)

```ts
const ACCOUNT_TABLE = {
  name: 'osot_table_accounts',
  businessField: 'osot_account_id',
  guidField: 'osot_table_accountid',
  defaultSelect: [ "osot_first_name", "osot_last_name", "osot_email", ... ]
}

// create
const created = await dataverseRepository.create(ACCOUNT_TABLE, payload, { credentials });

// find by businessId
const account = await dataverseRepository.findByBusinessId(ACCOUNT_TABLE, 'osot-000001', { credentials });

// update
await dataverseRepository.updateById(ACCOUNT_TABLE, guid, payload, { credentials });

// delete
await dataverseRepository.deleteById(ACCOUNT_TABLE, guid, { credentials });

// list all (with paging)
const all = await dataverseRepository.listAll(ACCOUNT_TABLE, { select: ACCOUNT_TABLE.defaultSelect, credentials });
```

## Security, risks and improvements

1. Token caching
   - Problem: currently `getAccessToken` requests a token each time it is called. That creates high token request volume and may hit rate limits.
   - Fix: cache token per credential set keyed by `clientId|tenantId|scope` with expiry based on `expires_in`.

2. Rate limiting & retry behavior
   - `DataverseService` has a basic retry for 5xx and network errors. Improve handling of 429 (respect `Retry-After`) and 401 (re-obtain token in case of expiry) and implement exponential backoff with jitter.

3. OData injection
   - Building `$filter` strings with unsanitized values is risky. Implement a sanitizer/validator and encode values (use `'${value.replace("'","''")}'` style escaping for Dataverse) and validate types.

4. Ownership & permission enforcement
   - Keep validation at domain layer (as currently). Consider attaching `allowedRoles` metadata to table meta for extra guard rails.

5. GUID vs business id
   - Always prefer GUID for update/delete/get by id operations. Provide helper `resolveGuid(meta, businessId)` in the repository.

6. Error mapping & telemetry
   - Map Dataverse response error codes to HTTP exceptions: 404->NotFound, 409->Conflict, 400->BadRequest.
   - Add requestId correlation (if available) and structured logs.

7. Tests
   - Add unit tests for `DataverseService` (mock HttpService) and `DataverseRepository` behavior (mock DataverseService).

8. Secrets management
   - Move client secrets out of `.env` into a secrets manager for production.

## Implementation checklist

- [ ] Add `src/integrations/dataverse.repository.ts` with the methods above.
- [ ] Implement token cache in `DataverseService`.
- [ ] Implement safe OData filter builder and query helper.
- [ ] Replace direct `dataverseService.request` calls in domain services with `DataverseRepository` (refactor in steps).
- [ ] Add unit tests and update CI.
- [ ] Document new usage pattern in README.

## Next steps

- Implement the `DataverseRepository` with token caching and basic methods.
- Add minimal unit tests for the repository.
- Refactor `TableAccountService` to use the repository as a demonstration.

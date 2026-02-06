# Membership Settings — Read-Only Design

This document describes the read-only design and cache contract for the
`osot_table_membership_settings` table, the service that reads it
(`TableMembershipSettingsService`) and how other parts of the API should
consume it.

## Why read-only?

- The canonical source for membership settings is Dataverse (CRM). The API
  must not allow modifications to the source-of-truth configuration.
- A read-only service reduces accidental writes, simplifies permissions,
  and centralizes caching and mapping logic.

## Service responsibilities

- Retrieve membership-settings from Dataverse and normalize its fields.
- Cache results in Redis for performance and availability.
- Provide helper methods used by other services:
  - getAll(): returns the full normalized list.
  - getByYear(year): returns the normalized entry for a specific year.
  - getActiveForYear(year?): returns the entry only when the year's status
    is ACTIVE (or the status is missing, see tolerances below).
  - refresh(): force refresh the cache from Dataverse.

## Cache contract

Keys used (Redis):

- osot:membership_settings:all
  - Stores the full array (JSON string) of normalized items.
- osot:membership_settings:year:{year}
  - Stores a single JSON object for quick retrieval by year.

## TTL configuration

- Environment variable: MEMBERSHIP_SETTINGS_TTL_SECONDS
- Default fallback: 300 seconds (5 minutes)

## Behavior and fallbacks

- getAll() attempts to read the `osot:membership_settings:all` key first.
  If parsing fails, it refetches Dataverse and overwrites the cache.
- If Dataverse is unavailable and the cache is missing/invalid, callers
  receive HttpException(503).
- getByYear() first tries the per-year key. On miss it falls back to
  getAll() and searches in memory. The per-year key is a convenience
  optimization — the canonical data is still the full array.
- getActiveForYear(year?) returns the record only when
  `osot_membership_year_status === AccountStatus.ACTIVE`.
  If the status is null/undefined, the service treats the record as usable
  (a backward-compatible tolerance to cope with missing data).

## Mapping and normalization

- The service normalizes input from Dataverse to the internal
  `TableMembershipSettingsInterface`:
  - Numeric fields may arrive as strings; the service coerces them to
    numbers when appropriate.
  - Missing optional fields are mapped to `undefined`.
  - `osot_membership_fee` becomes a number with fallback 0.
  - Date fields remain ISO strings when present, else empty string or
    undefined depending on the field.

## Usage recommendations

- Prefer calling `getActiveForYear()` for flows that should only operate on
  active years.
- For admin tools or bulk jobs that need the whole dataset, use `getAll()`.
- Avoid exposing public endpoints that mutate membership settings. If an
  internal admin endpoint is added to call `refresh()`, protect it with
  appropriate RBAC/guards and audit logging.

## Testing notes

- Unit tests should mock `DataverseService` and `RedisService`. Test cases:
  - Cache hit returns parsed/mapped objects.
  - Cache miss + Dataverse OK returns mapped array and writes cache.
  - Dataverse down + cache present returns cached value.
  - getActiveForYear() returns undefined when status != ACTIVE.

## Security and exposure

- Keep this service injectable only; do not expose CRUD endpoints.
- If a refresh endpoint is required, restrict it to admin roles and log
  the actor.

## Appendix: keys & examples

- Full key: `osot:membership_settings:all` -> JSON string: [{...}, {...}]
- Year key: `osot:membership_settings:year:2025` -> JSON string: {...}

## Contact

If you need adjustments to the mapping rules or TTL defaults, please open
an issue and tag the backend team.

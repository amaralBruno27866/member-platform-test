# Error handling

Centralized error handling for the application.

Files

- `error-codes.ts` — enum of error codes used across the app.
- `error-messages.ts` — maps codes to publicMessage and optional logMessage template.
- `app-error.ts` — `AppError` class used by services to throw structured errors.
- `error.factory.ts` — small helper to create `AppError` instances.
- `http-exception.filter.ts` — Nest global filter that maps `AppError` and other exceptions to HTTP responses and logs details.

Usage

- Throw `new AppError(ErrorCodes.ACCOUNT_NOT_FOUND, 'optional technical message', { id }, 404)` from services.
- Register `HttpExceptionFilter` globally (in `main.ts` or module providers) so all errors are formatted consistently.
- Keep user-facing messages in `error-messages.ts`. Update map as new codes are added.

Registering the filter (example in `main.ts`):

```ts
import { HttpExceptionFilter } from './common/errors/http-exception.filter';
app.useGlobalFilters(new HttpExceptionFilter());
```

Throwing an error from a service:

```ts
import { createAppError } from './common/errors/error.factory';
import { ErrorCodes } from './common/errors/error-codes';

throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, { id: accountId }, 404);
```

Security note

- Public messages should be safe for non-technical users. Place detailed technical information only in logs.

# API Conventions & OpenAPI

- Base path: `/api/v1`.
- OpenAPI spec: `/v3/api-docs`. Swagger UI: `/swagger-ui.html`.
- Auth: Bearer JWT (`Authorization: Bearer <accessToken>`). Configured in
  `OpenApiConfig` so "Authorize" works directly in Swagger UI.

## Current endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/v1/auth/login` | public | Step 1: username/password → MFA challenge |
| `POST /api/v1/auth/mfa/verify` | public (requires `mfaToken`) | Step 2: MFA code → access/refresh tokens |
| `POST /api/v1/auth/refresh` | public (requires `refreshToken`) | Refresh token pair |
| `GET /api/v1/auth/me` | `ACCESS` token | Current user profile + roles |
| `GET/PUT /api/v1/admin/integrations/email` | `ROLE_ADMIN` | Email gateway config (see [integrations.md](integrations.md)) |
| `POST /api/v1/admin/integrations/email/test` | `ROLE_ADMIN` | Send test email |
| `GET/PUT /api/v1/admin/integrations/sms` | `ROLE_ADMIN` | SMS gateway config |
| `POST /api/v1/admin/integrations/sms/test` | `ROLE_ADMIN` | Send test SMS |

## Conventions for new endpoints

- **DTOs, not entities.** Define request/response `record`s under a
  `dto/` subpackage per domain. Never expose JPA entities (avoids leaking
  internal fields, lazy-loading issues, and lets the API evolve
  independently of the schema).
- **Validation** via `jakarta.validation` annotations (`@NotBlank`,
  `@Email`, etc.) on request DTOs with `@Valid` on controller parameters.
  `GlobalExceptionHandler` turns `MethodArgumentNotValidException` into a
  `400` with a readable message.
- **Errors** are JSON: `{ timestamp, status, error, message }`. Add new
  domain exceptions and a corresponding `@ExceptionHandler` in
  `GlobalExceptionHandler` (see `IntegrationNotConfiguredException` → `409`
  for an example), rather than letting exceptions bubble up as opaque
  responses.
- **Security**: annotate controllers/methods with `@PreAuthorize("hasRole('...')")`
  per [auth-and-rbac.md](auth-and-rbac.md). Public endpoints must be added
  explicitly to `SecurityConfig.PUBLIC_ENDPOINTS`.
- **Documentation**: prefer self-documenting names/types; add `@Schema`
  descriptions or short javadoc on DTOs/fields where the meaning, units, or
  constraints aren't obvious from the name alone (e.g. TTL units, enum
  semantics) — springdoc surfaces these in Swagger UI.

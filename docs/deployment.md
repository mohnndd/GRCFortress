# Deployment & Configuration

GRC Fortress is configured entirely through environment variables layered
over `backend/src/main/resources/application.yml` defaults (which are
**development-only** and insecure by default — every secret below must be
overridden for any shared/production deployment).

## Required environment variables (production)

| Variable | Purpose | Dev default |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection | `localhost`/`5432`/`GRCFortress`/`postgres`/`postgres` |
| `JWT_SECRET` | HMAC signing key for access/refresh/MFA JWTs | insecure dev key — **must change** |
| `JWT_ACCESS_TTL_MINUTES`, `JWT_REFRESH_TTL_DAYS`, `JWT_MFA_TTL_MINUTES` | Token lifetimes | 30 / 7 / 5 |
| `DEFAULT_ADMIN_PASSWORD` | Initial `admin` account password (rotate after first login) | `admin@123` |
| `MFA_BYPASS_ENABLED` | **Must be `false` in production** — disables the `123456` MFA bypass | `true` |
| `MFA_BYPASS_CODE` | Only relevant if bypass is enabled (dev only) | `123456` |
| `ENCRYPTION_KEY` | Base64 256-bit AES key encrypting integration credentials at rest (`integration_settings.secrets`) — generate with `openssl rand -base64 32` | insecure dev key — **must change** |

See [SECURITY.md](../SECURITY.md) for the security rationale behind each of
these.

## GitHub repository secrets

For CI/CD (and to avoid committing credentials), the following are stored as
GitHub Actions repository secrets on this repo:

- `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` — local/dev database credentials.

Add deployment-specific secrets (`JWT_SECRET`, `ENCRYPTION_KEY`,
`DEFAULT_ADMIN_PASSWORD`, etc.) the same way for any environment where CI
needs to provision or test against a real instance — never hardcode them in
workflow files or `application.yml`.

## Per-deployment admin-configurable settings

Some configuration is intentionally **not** environment-variable based,
because it's set by the customer's own admin at runtime via the UI/API:

- Email/SMS gateway credentials — [integrations.md](integrations.md).
- (Planned) Identity provider / AD connection — [iam-integration.md](iam-integration.md).

These are stored encrypted in the database (via `ENCRYPTION_KEY` above), not
in environment variables, so they survive redeploys and can be changed
without ops involvement.

## Before production: paginate all grid/list views

Only `AuditTrailPage` (`GET /api/v1/audit-trail`) is paginated today — it
accepts `page`/`size`/filters and returns a page-shaped response. Every
other list/grid view that fetches from the backend currently calls a
`listX()` endpoint that returns the *entire* table as a plain array with no
`page`/`size` params:

- Policies (`listPolicies`), Procedures (`listProcedures`), Departments
  (`listDepartments`), Observations (`listObservations`), Reported issues
  (`listReportedItems`), Admin user management (`listUsers`).

A few pages (Circulars, Risk register, Decision register, Contracts repo,
SLA configuration, Terms & conditions) currently render hardcoded local
mock data rather than calling a backend list endpoint at all — when those
are wired up to real APIs, build them paginated from the start rather than
adding pagination as a follow-up.

Before going to production, go through every grid/list view above and: add
`page`/`size` (and any filter) params to the backend endpoint following the
`AuditTrailController`/`AuditTrailPageResponse` pattern, and update the
corresponding frontend page to request and render pages instead of the full
table. Unpaginated "load everything" endpoints are a correctness issue, not
just a performance one, once a table has enough rows that the UI silently
truncates or the request times out.

## Running locally

```bash
# Backend (from backend/)
./mvnw spring-boot:run

# Frontend (from frontend/)
npm install
npm run dev
```

Requires a local PostgreSQL with a `GRCFortress` database (see
[database.md](database.md)) and Java 21.

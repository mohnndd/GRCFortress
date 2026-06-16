# GRC Fortress

An open-source Governance, Risk & Compliance (GRC) platform built for
organizations in the Kingdom of Saudi Arabia (KSA), designed to withstand
SAMA audit requirements.

## Tech stack

- **Frontend**: React + Vite (TypeScript)
- **Backend**: Spring Boot 3.5 (Java 21, Maven)
- **Database**: PostgreSQL

## Planned scope

- Policy management with version control and approval cycles
- Procedures and standards repository
- Approval workflows
- Committee and board governance tracking
- Delegation of authority management
- Decision registers
- Attestation and acknowledgment (policy read confirmations)
- Incident management
- Audit trail and role-based access control (RBAC) throughout
- Open API specification (OpenAPI/Swagger) for all endpoints
- Pluggable integration with customer Active Directory / IAM (LDAP, SAML, OIDC)

## Current status

This repo currently contains the foundational authentication module:

- Username/password login with a second-factor (MFA) verification step
- JWT-based access/refresh tokens
- RBAC roles: `ADMIN`, `COMPLIANCE_OFFICER`, `AUDITOR`, `REVIEWER`, `EMPLOYEE`
- Audit log of authentication events
- Default `admin` account seeded on first run
- Admin-configurable email/SMS gateway integrations (no code changes needed
  per deployment)

See [SECURITY.md](SECURITY.md) for important security configuration that
must be reviewed before any production deployment.

## Documentation

See the [`docs/`](docs/README.md) folder for architecture, conventions, and
guides for extending or customizing this project for your organization
(including connecting your own AD/IAM and notification gateways) — start
there before making changes, especially if you're an AI agent picking up
this codebase for the first time.

## Getting started

### Prerequisites

- Java 21
- Node.js 18+
- PostgreSQL 14+ (a local database named `GRCFortress` with a `postgres`/`postgres` user is expected by default)

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

The API starts on `http://localhost:8080`. Swagger UI is available at
`http://localhost:8080/swagger-ui.html`.

Default admin credentials: `admin` / `admin@123` (MFA bypass code: `123456` —
see [SECURITY.md](SECURITY.md)).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app starts on `http://localhost:5173` (or the next available port) and
points to the backend at `http://localhost:8080` by default (configurable
via `VITE_API_BASE_URL`, see `.env.example`).

## Configuration

Key environment variables (backend):

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / `5432` / `GRCFortress` | PostgreSQL connection |
| `DB_USERNAME` / `DB_PASSWORD` | `postgres` / `postgres` | PostgreSQL credentials |
| `JWT_SECRET` | dev default | HMAC signing key for JWTs — **must** be overridden in production |
| `MFA_BYPASS_ENABLED` | `true` | Enables the static MFA bypass code (dev only) |
| `MFA_BYPASS_CODE` | `123456` | Static MFA bypass code |
| `DEFAULT_ADMIN_PASSWORD` | `admin@123` | Password for the seeded `admin` account |

## License

Apache License 2.0

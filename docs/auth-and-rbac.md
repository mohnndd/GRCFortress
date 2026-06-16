# Authentication, MFA, RBAC & Audit Trail

## Login flow (two-step, stateless JWT)

1. `POST /api/v1/auth/login` with `{ username, password }`.
   - On success, returns `{ mfaRequired: true, mfaToken, tokens: null }`.
   - `mfaToken` is a short-lived JWT of type `MFA_PENDING` (see
     `TokenType`), used only to prove the password step succeeded.
   - An `AuditLog` entry is written: `LOGIN_SUCCESS` or `LOGIN_FAILURE`.

2. `POST /api/v1/auth/mfa/verify` with `{ mfaToken, code }`.
   - If `grcfortress.mfa.bypass-enabled=true` (default in dev), the code
     `grcfortress.mfa.bypass-code` (default `123456`) is always accepted —
     **this MUST be disabled in production**, see [SECURITY.md](../SECURITY.md).
   - On success, returns `{ accessToken, refreshToken, tokenType: "Bearer" }`.
   - Audit events: `MFA_CHALLENGE_ISSUED`, `MFA_VERIFICATION_SUCCESS` /
     `MFA_VERIFICATION_FAILURE`.

3. `POST /api/v1/auth/refresh` with `{ refreshToken }` → new access/refresh
   token pair. Audit event: `TOKEN_REFRESH`.

4. `GET /api/v1/auth/me` → current user info (requires `ACCESS` token).

Tokens are signed HMAC JWTs (`jjwt`), configured via `JwtProperties`
(`grcfortress.jwt.*`): `secret`, `access-token-ttl-minutes`,
`refresh-token-ttl-days`, `mfa-token-ttl-minutes`. `JwtAuthenticationFilter`
only accepts `ACCESS`-type tokens for populating the security context — an
`MFA_PENDING` or `REFRESH` token cannot be used to call protected endpoints.

## Roles (RBAC)

Seeded in `V1__init_schema.sql` (`roles` table), assigned via `user_roles`:

| Role | Intended use |
|---|---|
| `ADMIN` | Full system administration, including integration settings (`/api/v1/admin/**`), user/role management. |
| `COMPLIANCE_OFFICER` | Owns policy/procedure lifecycle, approval workflows, attestations. |
| `AUDITOR` | Read-only access to audit trails, decision registers, evidence for SAMA audits. |
| `REVIEWER` | Participates in approval workflows (committee/board review steps). |
| `EMPLOYEE` | Baseline role — views published policies, completes attestations, raises incidents. |

Spring Security authorities are `ROLE_<NAME>` (e.g. `ROLE_ADMIN`). Secure
new endpoints with `@PreAuthorize("hasRole('ADMIN')")` etc. — method
security is enabled via `@EnableMethodSecurity` in `SecurityConfig`.

When adding a new module, **add new roles only if genuinely needed** — prefer
composing the existing five. If a new role is required, add it via a Flyway
migration (`INSERT INTO roles ...`) and document it here.

## Audit trail

`com.grcfortress.common.audit`:

- `AuditLog` — entity persisted to the `audit_log` table: actor, event type,
  outcome, timestamp, metadata.
- `AuditEventType` — enum of event types (extend this for new
  security-relevant actions, e.g. `POLICY_APPROVED`, `INCIDENT_CREATED`).
- `AuditOutcome` — `SUCCESS` / `FAILURE`.
- `AuditService` — call this from service-layer code for any action that a
  SAMA auditor would expect to see logged: authentication events,
  permission changes, policy approvals/rejections, attestation completions,
  incident status changes, integration configuration changes, etc.

`SpringSecurityAuditorAware` (bean name `auditorAware`) feeds
`@CreatedBy`/`@LastModifiedBy` on every `AuditableEntity` from the
authenticated username (or `"system"` for unauthenticated/background
operations).

## Default admin account

Seeded by `DataSeeder` (`CommandLineRunner`) using `DefaultAdminProperties`
(`grcfortress.security.default-admin.*`): username `admin`, password
`admin@123` (override via `DEFAULT_ADMIN_PASSWORD`), email
`admin@grcfortress.local`. **Rotate this password immediately in any real
deployment** — see [SECURITY.md](../SECURITY.md).

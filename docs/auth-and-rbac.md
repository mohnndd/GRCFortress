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
   token pair. Audit event: `TOKEN_REFRESH`. Refresh tokens are single-use:
   the old token's `jti` is revoked (added to the `revoked_token` denylist)
   as part of issuing the new pair, see "Refresh-token revocation" below.

4. `POST /api/v1/auth/logout` with `{ refreshToken }` → revokes that refresh
   token so it can no longer be exchanged. Audit event: `LOGOUT`.

5. `GET /api/v1/auth/me` → current user info (requires `ACCESS` token).

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

### Tamper-evidence (immutability)

`audit_log` is append-only at the database level (`V13__audit_log_immutability.sql`):
a trigger rejects `UPDATE`/`DELETE` against the table outright, for any role
— including the application's own DB user — so deleting or editing an entry
requires dropping the trigger, which is itself an auditable DBA action
outside the application.

On top of that, every row is hash-chained: `AuditLog.entryHash` is a SHA-256
hash of the row's own content plus the previous row's `entryHash`
(`AuditLog.computeHash`). Altering a past row (e.g. via a restored backup)
breaks the chain for every row written after it. `AuditService.verifyChain()`
walks the table and recomputes each hash to detect this, exposed at
`GET /api/v1/audit-trail/integrity` (`ADMIN`/`AUDITOR`/`COMPLIANCE_OFFICER`).
Rows written before this migration have no hash — the chain can only attest
to entries from the upgrade point forward, which is inherent to retrofitting
a hash chain onto pre-existing data.

`AuditService.record()` is `synchronized` to keep the chain strictly
ordered; this assumes a single application instance. A multi-instance
deployment would need the chain link enforced in the database itself (e.g.
an advisory lock) instead of in the JVM.

## Refresh-token revocation

Tokens are stateless JWTs, so invalidating one before it expires needs a
server-side denylist: `revoked_token` (`jti` unique, `expires_at`). Every JWT
now carries a `jti` claim (`JwtService.buildToken`). Two things populate the
denylist:

- `POST /api/v1/auth/logout` — revokes the refresh token the client sends.
- `POST /api/v1/auth/refresh` — rotates on every use: the refresh token just
  spent is revoked as part of issuing the new pair, so a captured/replayed
  refresh token only works once.

`AuthService.refresh()` rejects a token whose `jti` is already in
`revoked_token` with "Refresh token has been revoked". `RevokedTokenCleanupTask`
runs daily (`@Scheduled`, 03:00) and deletes rows past their `expires_at`, so
the table doesn't grow unbounded — once a token would have expired anyway,
there's nothing left to deny.

Access tokens are short-lived and are not checked against the denylist on
every request (that would turn a stateless JWT check into a DB hit per
request); only the longer-lived refresh token is revocable. A user who needs
an access token invalidated immediately should be disabled or have their
account locked via the admin endpoints, which `AuthService.refresh()` and
`AuthService.login()` both check.

## Account lockout

`AuthService.login()` increments `User.failedLoginAttempts` on every bad
password and locks the account (`accountLocked = true`) once
`grcfortress.security.lockout.max-failed-attempts` (default `3`, env
`ACCOUNT_LOCKOUT_MAX_ATTEMPTS`) is reached. Locked accounts can only be
unlocked by an admin (`POST /api/v1/admin/users/{id}/unlock`, see below) —
there is no auto-unlock timer by design. Audit events: `ACCOUNT_LOCKED`,
`ACCOUNT_UNLOCKED`.

## Admin user management & forced password change

`UserAdminController` (`/api/v1/admin/users`, `ADMIN` only):

- `GET /` — list users.
- `POST /` — create a user with a server-generated temporary password.
- `POST /{id}/reset-password` — generate a new temporary password.
- `POST /{id}/unlock` — clear `accountLocked`/`failedLoginAttempts`.

Generated passwords are **never** returned in the API response or logged —
they're emailed directly to the user's address via `NotificationService`. If
the email integration isn't configured, the whole operation is rolled back
(no orphaned account with an unreachable password). Both flows set
`User.mustChangePassword = true`; the frontend redirects the user to
`/change-password` on next login until they call
`POST /api/v1/auth/change-password` (audit event `PASSWORD_CHANGED`).

## Default admin account

Seeded by `DataSeeder` (`CommandLineRunner`) using `DefaultAdminProperties`
(`grcfortress.security.default-admin.*`): username `admin`, password
`admin@123` (override via `DEFAULT_ADMIN_PASSWORD`), email
`admin@grcfortress.local`. **Rotate this password immediately in any real
deployment** — see [SECURITY.md](../SECURITY.md).

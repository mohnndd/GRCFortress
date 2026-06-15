# Customer Active Directory / IAM Integration

GRC Fortress is designed so each customer deployment can be connected to its
own identity provider — **this is not yet implemented**, but the
authentication layer is structured to make it straightforward. This page
describes the intended approach for an AI agent (or engineer) implementing
it for a specific customer.

## Current state

- `CustomUserDetailsService` loads users from the local `users`/`roles`
  tables and is the only identity source today.
- Passwords are BCrypt-hashed locally (`User.passwordHash`).
- JWTs are issued by GRC Fortress itself after local password + MFA checks.

## Recommended integration points (per-customer, configurable)

Do **not** hardcode a specific customer's AD/IdP into the codebase. Instead:

1. **Add an `auth_provider` configuration**, analogous to
   `integration_settings` (see [integrations.md](integrations.md)): an
   admin-configurable row describing which identity provider is active
   (`LOCAL`, `LDAP`, `SAML`, `OIDC`) and its connection details
   (non-secret config in JSON, secrets encrypted via `EncryptionService`).

2. **LDAP / Active Directory** — use Spring Security's
   `LdapAuthenticationProvider` / `spring-security-ldap`, configured from the
   stored `auth_provider` settings (server URL, base DN, user search filter,
   bind credentials). On successful LDAP bind, provision/update a local
   `User` row (so audit trails, roles, and attestations still reference a
   stable local user id) and map AD group membership to GRC Fortress roles
   via an admin-configurable mapping table.

3. **OIDC / SAML (SSO)** — use `spring-boot-starter-oauth2-client` /
   `spring-security-saml2-service-provider`, with the identity provider's
   metadata/issuer URL, client id/secret stored as an `auth_provider` row.
   After SSO login, issue GRC Fortress's own short-lived JWTs (as today) so
   the rest of the API stays provider-agnostic — don't pass through
   third-party tokens to downstream endpoints.

4. **Keep the local-account path working.** `LOCAL` should remain the
   default/fallback so the system is usable before an organization has
   configured their IdP, and so the seeded `admin` account always works for
   break-glass access.

5. **Role mapping must be admin-configurable**, not hardcoded — e.g. a table
   mapping AD group DNs / OIDC claim values to GRC Fortress role names
   (`ADMIN`, `COMPLIANCE_OFFICER`, etc., see
   [auth-and-rbac.md](auth-and-rbac.md)).

6. **Audit everything**: provider configuration changes, SSO login
   success/failure, and role-mapping changes all go through `AuditService`
   (see [auth-and-rbac.md](auth-and-rbac.md)).

## What an AI agent customizing this for a specific company should do

- Add the new `auth_provider` table via a Flyway migration.
- Add a `com.grcfortress.auth.provider` package with the chosen
  provider implementation, following the existing gateway-style pluggable
  pattern from [integrations.md](integrations.md).
- Add admin API endpoints under `/api/v1/admin/auth-providers` (mirroring
  `IntegrationAdminController`), `ROLE_ADMIN` only.
- Do not remove or weaken the local-account + MFA path — additive only.

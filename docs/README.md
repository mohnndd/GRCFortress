# GRC Fortress — Documentation

This `docs/` folder is the entry point for engineers (human or AI agents)
who need to understand, extend, or adapt GRC Fortress for a specific
organization. Read [architecture.md](architecture.md) first, then the page
relevant to the change you're making.

| Doc | Use it when you need to... |
|---|---|
| [architecture.md](architecture.md) | Understand the overall system design, module layout, and conventions before making any change. |
| [auth-and-rbac.md](auth-and-rbac.md) | Work on login, MFA, JWT, sessions, roles/permissions, or audit logging. |
| [integrations.md](integrations.md) | Add a new email/SMS provider, or wire up an organization's SMTP/Twilio/etc. credentials. |
| [iam-integration.md](iam-integration.md) | Connect GRC Fortress to a customer's Active Directory / IdP (SAML, OIDC, LDAP). |
| [database.md](database.md) | Add or change database schema (Flyway migrations), or understand existing tables. |
| [api.md](api.md) | Add a new REST endpoint, or understand the OpenAPI/Swagger setup. |
| [frontend.md](frontend.md) | Work on the React frontend (routing, auth state, API client, styling). |
| [deployment.md](deployment.md) | Configure environment variables, secrets, and deploy to a new environment. |
| [roadmap.md](roadmap.md) | Understand what GRC modules exist vs. are planned, and where new modules should go. |

## Ground rules for contributors (human and AI)

1. **This is multi-tenant-by-deployment, not multi-tenant-by-database.** Each
   customer organization runs its own instance with its own database. Do not
   hardcode organization-specific values (names, domains, branding, IAM
   endpoints) into code — use the integration settings pattern described in
   [integrations.md](integrations.md) and [iam-integration.md](iam-integration.md).
2. **Every endpoint must be documented via OpenAPI.** springdoc generates this
   automatically from controllers/DTOs — use clear types and `@Schema`/
   javadoc where the meaning isn't obvious. See [api.md](api.md).
3. **Every security-relevant action must go through `AuditService`.** SAMA
   audits depend on a complete, tamper-evident audit trail. See
   [auth-and-rbac.md](auth-and-rbac.md).
4. **Secrets never live in code or plain config.** Use environment variables
   for deployment-level secrets (DB credentials, JWT signing key, encryption
   key) and the encrypted `integration_settings` table for admin-configurable
   per-deployment credentials (SMTP/SMS). See [deployment.md](deployment.md)
   and [integrations.md](integrations.md).
5. **The MFA bypass code (`123456`) is a development convenience only.** It is
   gated by `grcfortress.mfa.bypass-enabled` and MUST be `false` in any
   production/SAMA-audited deployment. See [SECURITY.md](../SECURITY.md).
6. **New GRC modules follow the existing package-per-domain structure**
   (`com.grcfortress.<domain>`) with `AuditableEntity`, a repository, a
   service, a controller under `/api/v1/...`, and DTOs. See
   [architecture.md](architecture.md) and [roadmap.md](roadmap.md).

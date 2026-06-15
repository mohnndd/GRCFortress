# Security Notes

GRC Fortress is designed to be deployable in environments subject to SAMA
(Saudi Central Bank) audit requirements. The following items are **critical**
before any production or audited deployment:

## 1. MFA bypass code

For initial setup and local development, `grcfortress.mfa.bypass-enabled=true`
allows the static code `12346` to satisfy the MFA challenge
(`grcfortress.mfa.bypass-code`).

**This MUST be disabled before production / SAMA-audited deployment**:

```yaml
grcfortress:
  mfa:
    bypass-enabled: false
```

or via environment variable `MFA_BYPASS_ENABLED=false`.

## 2. Default administrator account

A default `admin` account (password `admin@123`) is seeded on first startup
so the system is usable out of the box. Rotate this password immediately
after first login, or override it before first startup via:

```
DEFAULT_ADMIN_PASSWORD=<strong-password>
```

## 3. JWT signing secret

The `grcfortress.jwt.secret` shipped in `application.yml` is a development
default. Set a unique, high-entropy secret via the `JWT_SECRET` environment
variable for every deployment.

## 4. Audit trail

All authentication events (login, MFA challenge/verification, token refresh)
are recorded in the `audit_log` table, and all entity changes record
`created_by` / `updated_by` / timestamps via JPA auditing. Do not disable
these mechanisms in any audited environment.

## 5. Identity provider integration

For production deployments, integrate with the customer's Active Directory /
IAM (LDAP, SAML, or OIDC) rather than relying on local accounts and the MFA
bypass.

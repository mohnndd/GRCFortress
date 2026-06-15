# Database & Migrations

- **Engine**: PostgreSQL (developed/tested against Postgres 18, but targets
  any recent Postgres).
- **Local dev DB name**: `GRCFortress` (case-sensitive — created with quoted
  identifier).
- **Schema management**: Flyway, `backend/src/main/resources/db/migration/`,
  files named `V<n>__<description>.sql`. Hibernate is `ddl-auto: validate` —
  **the entity model must always match a migration**, never the reverse.

## Existing migrations

- **`V1__init_schema.sql`** — `roles`, `users`, `user_roles`, `audit_log`.
  Seeds the five roles (`ADMIN`, `COMPLIANCE_OFFICER`, `AUDITOR`,
  `REVIEWER`, `EMPLOYEE`).
- **`V2__integration_settings.sql`** — `integration_settings` (admin email/
  SMS gateway config, see [integrations.md](integrations.md)).

## Adding a migration

1. Create `V<next-number>__<short_description>.sql`.
2. Write plain SQL DDL (and seed `INSERT`s if needed) — no Flyway
   placeholders/Java callbacks unless there's a strong reason.
3. Add/update the corresponding JPA entity (extend `AuditableEntity` for new
   business tables — gives `created_at`/`created_by`/`updated_at`/
   `updated_by` for free, but the migration must still define those columns).
4. Run `./mvnw spring-boot:run` (or the test suite) once locally — Flyway
   applies the migration automatically on startup against the configured
   datasource, and Hibernate validation will fail loudly if the entity and
   schema disagree.

## Conventions

- Primary keys: `BIGSERIAL` / `Long` with `GenerationType.IDENTITY`.
- Timestamps: `TIMESTAMP` (UTC, see `hibernate.jdbc.time_zone: UTC`).
- Flexible/variable structured data (e.g. integration config): `JSONB` +
  `@JdbcTypeCode(SqlTypes.JSON)` on a `Map<String, String>` field.
- Encrypted secrets at rest: `TEXT` column storing a base64 AES-GCM blob
  (see `EncryptionService`), not `JSONB` — it's an opaque ciphertext, not
  queryable JSON.
- Audit columns (`created_at`, `created_by`, `updated_at`, `updated_by`) on
  every business table that represents something a SAMA auditor might care
  about (policies, approvals, attestations, incidents, etc.).

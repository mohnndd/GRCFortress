# Architecture

## High-level overview

GRC Fortress is a monorepo with two applications and one database:

```
GRC Fortress/
├── backend/    Spring Boot 3.5 (Java 21, Maven) REST API
├── frontend/   React + Vite (TypeScript) SPA
└── docs/       This documentation set
```

- **Backend** exposes a stateless JWT-secured REST API under `/api/v1/**`,
  with OpenAPI/Swagger UI at `/swagger-ui.html`.
- **Frontend** is a Vite SPA that talks to the backend over HTTP (axios),
  storing JWTs in `localStorage` and tracking auth state via React Context.
- **Database** is PostgreSQL, managed entirely through Flyway migrations
  (`backend/src/main/resources/db/migration/V*.sql`). Hibernate runs in
  `ddl-auto: validate` mode — **schema changes must be made via a new Flyway
  migration**, never by letting Hibernate auto-generate DDL.

## Backend package layout

Each domain area is its own top-level package under `com.grcfortress`:

```
com.grcfortress
├── GrcFortressApplication.java   # @SpringBootApplication, registers @ConfigurationProperties
├── auth/                          # login, MFA, JWT issuing/parsing, security DTOs
├── user/                          # User, Role entities + repositories
├── integration/                   # admin-configurable email/SMS gateways
│   ├── gateway/                   # pluggable provider implementations
│   └── dto/
├── common/
│   ├── AuditableEntity.java       # created/updated at/by, via JPA auditing
│   ├── SpringSecurityAuditorAware.java
│   ├── audit/                     # AuditLog entity + AuditService (security event trail)
│   └── crypto/                    # EncryptionService (AES-256-GCM for secrets at rest)
└── config/                        # SecurityConfig, OpenApiConfig, DataSeeder, *Properties classes
```

**Convention for new GRC modules** (policies, procedures, approvals,
committees, delegation of authority, decision registers, attestations,
incidents — see [roadmap.md](roadmap.md)):

1. New package `com.grcfortress.<domain>` (e.g. `com.grcfortress.policy`).
2. Entities extend `AuditableEntity` (gives `createdAt`/`createdBy`/
   `updatedAt`/`updatedBy` automatically via JPA auditing).
3. `XxxRepository extends JpaRepository<Xxx, Long>`.
4. `XxxService` holds business logic, including any `AuditService` calls for
   security/compliance-relevant actions (create/approve/reject/publish/etc.).
5. `XxxController` under `/api/v1/<domain>`, with request/response DTOs in a
   `dto/` subpackage — never expose JPA entities directly over the API.
6. A new Flyway migration `V<n>__<description>.sql` for any new tables.
7. Secure endpoints with `@PreAuthorize` using the roles in
   [auth-and-rbac.md](auth-and-rbac.md) (e.g. policy approval should require
   `COMPLIANCE_OFFICER` or `ADMIN`).

## Frontend layout

```
frontend/src/
├── api/          # axios client + per-domain API modules (authApi.ts, ...)
├── auth/          # AuthContext (auth state), ProtectedRoute
├── pages/         # one folder per page/feature (LoginPage, DashboardPage, ...)
├── components/    # shared UI components
└── App.tsx        # route definitions
```

New features should add an `api/<domain>Api.ts` module mirroring the backend
controller, a `pages/<Feature>/` folder, and a route + nav entry in
`App.tsx`.

## Configuration & properties

All tunables are exposed as `@ConfigurationProperties` classes under
`com.grcfortress.config` / `com.grcfortress.auth`, bound from
`application.yml` and overridable via environment variables (see
[deployment.md](deployment.md)). Do not read `application.yml` values
directly via `@Value` scattered across the codebase — add a field to the
relevant properties class instead.

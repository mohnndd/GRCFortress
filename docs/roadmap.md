# Roadmap / Module Status

GRC Fortress's full intended scope, and what exists today. When picking up
work on a module below, follow the conventions in
[architecture.md](architecture.md) (package layout, `AuditableEntity`,
audit logging, RBAC, DTOs, OpenAPI, Flyway migration).

## Implemented

- **Authentication & MFA** — login, MFA verification (with dev bypass),
  JWT access/refresh tokens. See [auth-and-rbac.md](auth-and-rbac.md).
- **RBAC** — five roles seeded (`ADMIN`, `COMPLIANCE_OFFICER`, `AUDITOR`,
  `REVIEWER`, `EMPLOYEE`).
- **Audit trail (security events)** — `audit_log` table + `AuditService` for
  login/MFA/token events. Extend `AuditEventType` for new domain events.
- **Admin-configurable email/SMS integrations** — see
  [integrations.md](integrations.md).

## Planned (not yet started)

Each of these is a distinct domain package (`com.grcfortress.<domain>`)
following the standard module pattern:

- **Policy management** — versioned policies with an approval cycle
  (draft → review → approved → published, with version history). Likely
  needs `policy`, `policy_version`, `policy_approval` tables.
- **Procedures and standards repository** — similar lifecycle to policies,
  possibly sharing a common "document" abstraction with policies.
- **Approval workflows** — a reusable workflow/approval-step engine, used by
  policies, procedures, and other modules requiring multi-step sign-off.
  Consider designing this as a shared `com.grcfortress.workflow` module that
  other domains depend on, rather than duplicating approval logic per
  module.
- **Committee and board governance tracking** — committees, members,
  meetings, agendas, minutes/resolutions.
- **Delegation of authority management** — who can approve what, up to what
  limits, with effective date ranges; likely ties into the approval
  workflow engine and RBAC.
- **Decision registers** — log of formal decisions (by committees/boards/
  individuals), linked to supporting documents and audit trail.
- **Attestation and acknowledgment** — track which employees have read/
  acknowledged which policy versions; reminder notifications via
  `NotificationService` (see [integrations.md](integrations.md)).
- **Incident management** — incident intake, classification, assignment,
  resolution tracking, and reporting; likely the module with the most
  SAMA-relevant audit trail requirements.

## Cross-cutting, not yet started

- **Customer AD/IAM integration** — see [iam-integration.md](iam-integration.md).
- **Reporting/dashboards** across modules (e.g. compliance posture, overdue
  attestations, open incidents) — likely a `com.grcfortress.reporting`
  module aggregating read-only views once enough domain modules exist.

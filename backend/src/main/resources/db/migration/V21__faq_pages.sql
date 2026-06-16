CREATE TABLE faq_pages (
    id           BIGSERIAL    PRIMARY KEY,
    slug         VARCHAR(100) NOT NULL UNIQUE,
    title        VARCHAR(200) NOT NULL,
    content      TEXT         NOT NULL DEFAULT '',
    sort_order   INT          NOT NULL DEFAULT 0,
    is_published BOOLEAN      NOT NULL DEFAULT true,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT now(),
    created_by   VARCHAR(64),
    updated_by   VARCHAR(64)
);

-- Seed: default "About GRC Fortress" page
INSERT INTO faq_pages (slug, title, content, sort_order, is_published, created_by) VALUES (
  'about',
  'About GRC Fortress',
  '## About GRC Fortress

GRC Fortress is a comprehensive Governance, Risk, and Compliance management platform built for regulated financial institutions.

### Key Features

**Policy Management**
Create, version, and route policies and procedures through configurable multi-stakeholder approval workflows. Track every change with a full audit trail.

**Risk Register**
Maintain a live risk register aligned to SAMA/ISO 31000 domains. Score risks on a 5×5 matrix with multi-dimensional impact (Financial, Operational, Regulatory, Reputational). Track treatment plans and review schedules.

**Incident Management**
Log and classify incidents (P1/P2/P3), track progress updates, manage regulatory notification obligations, and run root cause analysis (RCA) workflows.

**Observations**
Raise compliance observations, link them to circulars or regulations, route through resolution workflows, and attach supporting evidence.

**Delegation of Authority**
Users can temporarily delegate their approval authority to colleagues — maintaining compliance even during absences.

**Regulatory Circulars**
Maintain a library of regulatory circulars and link them directly to observations or policy documents for traceability.

**SLA Tracking**
Configure business-day SLAs for each approval process and monitor live bottlenecks across active approval steps.

**Audit Trail**
Every user action is logged with timestamps and user identity. Immutable, searchable, exportable.

### Compliance Alignment

GRC Fortress is designed with the following frameworks in mind:
- SAMA Cyber Security Framework (CSF)
- SAMA Operational Risk Management Guidelines
- ISO 31000 Risk Management
- ISO 27001 Information Security
- NDMO Data Governance Framework',
  0,
  true,
  'system'
);

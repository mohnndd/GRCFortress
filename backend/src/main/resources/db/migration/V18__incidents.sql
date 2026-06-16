CREATE TABLE incidents (
    id                      BIGSERIAL PRIMARY KEY,
    incident_number         VARCHAR(20)  NOT NULL UNIQUE,
    title                   VARCHAR(200) NOT NULL,
    description             TEXT,
    priority                VARCHAR(10)  NOT NULL DEFAULT 'P3'
                                CHECK (priority IN ('P1','P2','P3')),
    status                  VARCHAR(30)  NOT NULL DEFAULT 'OPEN'
                                CHECK (status IN ('OPEN','IN_PROGRESS','CONTAINED','CLOSED','CANCELLED')),
    department_id           BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    reported_by             VARCHAR(64)  NOT NULL,
    assigned_to             VARCHAR(64),
    detected_at             TIMESTAMP,
    resolved_at             TIMESTAMP,
    -- Regulatory notification fields
    requires_regulatory_notification  BOOLEAN NOT NULL DEFAULT false,
    regulatory_body                   VARCHAR(200),
    notified_at                       TIMESTAMP,
    notification_attachment_path      VARCHAR(500),
    notification_attachment_name      VARCHAR(255),
    -- RCA fields (set by admin post-closure)
    rca_required            BOOLEAN NOT NULL DEFAULT false,
    rca_completed           BOOLEAN NOT NULL DEFAULT false,
    rca_summary             TEXT,
    rca_opens_observation   BOOLEAN NOT NULL DEFAULT false,
    linked_observation_id   BIGINT REFERENCES observations(id) ON DELETE SET NULL,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by              VARCHAR(64),
    updated_by              VARCHAR(64)
);

CREATE TABLE incident_updates (
    id            BIGSERIAL PRIMARY KEY,
    incident_id   BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    author        VARCHAR(64) NOT NULL,
    content       TEXT NOT NULL,
    new_status    VARCHAR(30),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_status   ON incidents(status);
CREATE INDEX idx_incidents_priority ON incidents(priority);
CREATE INDEX idx_incident_updates_incident ON incident_updates(incident_id);

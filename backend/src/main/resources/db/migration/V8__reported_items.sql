CREATE TABLE reported_items (
    id                  BIGSERIAL PRIMARY KEY,
    report_type         VARCHAR(32)   NOT NULL,
    title               VARCHAR(255)  NOT NULL,
    description         VARCHAR(4000) NOT NULL,
    status              VARCHAR(32)   NOT NULL,
    reporter_username   VARCHAR(64)   NOT NULL,
    attachment_file_name VARCHAR(500),
    attachment_file_path VARCHAR(1000),
    attachment_file_type VARCHAR(20),
    attachment_file_size_bytes BIGINT,
    created_at          TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP     NOT NULL DEFAULT now(),
    created_by          VARCHAR(64),
    updated_by          VARCHAR(64)
);

CREATE INDEX idx_reported_items_reporter ON reported_items(reporter_username);
CREATE INDEX idx_reported_items_status ON reported_items(status);
CREATE INDEX idx_reported_items_updated_at ON reported_items(updated_at);

CREATE TABLE reported_item_messages (
    id              BIGSERIAL PRIMARY KEY,
    reported_item_id BIGINT       NOT NULL REFERENCES reported_items(id) ON DELETE CASCADE,
    author_username VARCHAR(64)   NOT NULL,
    message         VARCHAR(4000) NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE INDEX idx_reported_item_messages_item ON reported_item_messages(reported_item_id);

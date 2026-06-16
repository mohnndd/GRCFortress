-- Discriminator column so policies and procedures share the same tables
ALTER TABLE policies
    ADD COLUMN document_type VARCHAR(20) NOT NULL DEFAULT 'POLICY',
    ADD COLUMN workflow_file_name VARCHAR(500),
    ADD COLUMN workflow_file_path VARCHAR(1000),
    ADD COLUMN sla_file_name VARCHAR(500),
    ADD COLUMN sla_file_path VARCHAR(1000);

CREATE INDEX idx_policies_document_type ON policies(document_type);

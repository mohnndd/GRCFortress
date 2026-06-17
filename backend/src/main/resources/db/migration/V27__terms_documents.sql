CREATE TABLE terms_documents (
    id              BIGSERIAL PRIMARY KEY,
    document_number VARCHAR(50)  NOT NULL UNIQUE,
    title           VARCHAR(300) NOT NULL,
    product         VARCHAR(200) NOT NULL,
    owner           VARCHAR(200) NOT NULL,
    description     TEXT,
    status          VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
    version         VARCHAR(20)  NOT NULL DEFAULT '1.0',
    next_review     DATE,
    attachment_path VARCHAR(500),
    attachment_name VARCHAR(255),
    uuid            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      VARCHAR(64),
    updated_by      VARCHAR(64)
);

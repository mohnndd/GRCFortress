ALTER TABLE observations
    ADD COLUMN linked_circular_id BIGINT REFERENCES circulars(id) ON DELETE SET NULL;

CREATE INDEX idx_observations_circular ON observations(linked_circular_id);

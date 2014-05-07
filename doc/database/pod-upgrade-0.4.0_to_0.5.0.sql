ALTER TABLE pod_group ADD COLUMN personnal_group BOOLEAN;

CREATE TABLE pod_group_node (
    group_id INTEGER NOT NULL,
    node_id INTEGER NOT NULL,
    rights INTEGER,
    CONSTRAINT pod_group_node_pkey PRIMARY KEY (group_id, node_id),
    CONSTRAINT pod_group_node_group_id_fkey FOREIGN KEY (group_id)
    REFERENCES pod_group (group_id) MATCH SIMPLE
    ON UPDATE CASCADE ON DELETE CASCADE
);

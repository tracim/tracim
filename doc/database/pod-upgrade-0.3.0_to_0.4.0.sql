ALTER TABLE pod_nodes_history ADD COLUMN is_shared boolean NOT NULL DEFAULT False;
ALTER TABLE pod_nodes_history ADD COLUMN is_public boolean NOT NULL DEFAULT False;
ALTER TABLE pod_nodes_history ADD COLUMN public_url_key character varying(1024);

-- create view
CREATE OR REPLACE VIEW pod_nodes AS
    SELECT DISTINCT ON (node_id) node_id, parent_id, node_order, node_type, created_at, updated_at, 
        data_label, data_content, data_datetime, node_status, data_reminder_datetime, 
        data_file_name, data_file_content, data_file_mime_type, parent_tree_path, 
        node_depth, owner_id, is_shared, is_public, public_url_key
    FROM pod_nodes_history
    ORDER BY node_id, updated_at DESC;



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

CREATE OR REPLACE RULE pod_insert_new_node AS ON INSERT
TO pod_nodes
DO INSTEAD INSERT INTO pod_nodes_history (node_id, parent_id, node_order, node_type, created_at, updated_at, 
       data_label, data_content, data_datetime, node_status, data_reminder_datetime, 
       data_file_name, data_file_content, data_file_mime_type, parent_tree_path, 
       node_depth, owner_id, version_id, is_shared, is_public, public_url_key) VALUES (nextval('pod_nodes__node_id__sequence'), NEW.parent_id, NEW.node_order, NEW.node_type, NEW.created_at, NEW.updated_at, NEW.data_label, NEW.data_content, NEW.data_datetime, NEW.node_status, NEW.data_reminder_datetime, NEW.data_file_name, NEW.data_file_content, NEW.data_file_mime_type, NEW.parent_tree_path, NEW.node_depth, NEW.owner_id, nextval('pod_nodes_version_id_sequence'), NEW.is_shared, NEW.is_public, NEW.public_url_key)
RETURNING node_id, parent_id, node_order, node_type, created_at, updated_at, 
       data_label, data_content, data_datetime, node_status, data_reminder_datetime, 
       data_file_name, data_file_content, data_file_mime_type, parent_tree_path, 
       node_depth, owner_id, is_shared, is_public, public_url_key;

CREATE OR REPLACE FUNCTION pod_update_node() RETURNS trigger AS $$
BEGIN
INSERT INTO pod_nodes_history (node_id, parent_id, node_order, node_type, created_at, updated_at, 
       data_label, data_content, data_datetime, node_status, data_reminder_datetime, 
       data_file_name, data_file_content, data_file_mime_type, parent_tree_path, 
       node_depth, owner_id, version_id, is_shared, is_public, public_url_key) VALUES (NEW.node_id, NEW.parent_id, NEW.node_order, NEW.node_type, NEW.created_at, NEW.updated_at, NEW.data_label, NEW.data_content, NEW.data_datetime, NEW.node_status, NEW.data_reminder_datetime, NEW.data_file_name, NEW.data_file_content, NEW.data_file_mime_type, NEW.parent_tree_path, NEW.node_depth, NEW.owner_id, nextval('pod_nodes_version_id_sequence'), NEW.is_shared, NEW.is_public, NEW.public_url_key);
return new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pod_update_node_tg INSTEAD OF UPDATE ON pod_nodes FOR EACH ROW EXECUTE PROCEDURE pod_update_node();

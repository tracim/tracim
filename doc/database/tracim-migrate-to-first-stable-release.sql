ALTER TABLE pod_user ADD COLUMN is_active boolean;
UPDATE pod_user SET is_active=true;
ALTER TABLE pod_user ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE pod_user ALTER COLUMN is_active SET DEFAULT true;

-- Table: pod_workspaces

-- DROP TABLE pod_workspaces;

CREATE TABLE pod_workspaces
(
  workspace_id integer NOT NULL,
  data_label character varying(1024),
  data_comment text,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  is_deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT pk__workspace__workspace_id PRIMARY KEY (workspace_id )
)
WITH (
  OIDS=FALSE
);
ALTER TABLE pod_workspaces
  OWNER TO poduser;

-- Trigger: pod_workspaces__on_insert_set_created_at on pod_workspaces

-- DROP TRIGGER pod_workspaces__on_insert_set_created_at ON pod_workspaces;

CREATE TRIGGER pod_workspaces__on_insert_set_created_at
  BEFORE INSERT
  ON pod_workspaces
  FOR EACH ROW
  EXECUTE PROCEDURE set_created_at();

-- Trigger: pod_workspaces__on_update_set_updated_at on pod_workspaces

-- DROP TRIGGER pod_workspaces__on_update_set_updated_at ON pod_workspaces;

CREATE TRIGGER pod_workspaces__on_update_set_updated_at
  BEFORE UPDATE
  ON pod_workspaces
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

CREATE SEQUENCE pod_workspaces__workspace_id__sequence
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 11
  CACHE 1;
ALTER TABLE pod_workspaces__workspace_id__sequence
  OWNER TO poduser;


INSERT INTO pod_workspaces(workspace_id, data_label, data_comment) VALUES (1, 'All (old) content', 'This workspace contain all content which have been created before adding workspace features');


-- Table: pod_user_workspace

-- DROP TABLE pod_user_workspace;

CREATE TABLE pod_user_workspace
(
  user_id integer NOT NULL,
  workspace_id integer NOT NULL,
  role integer,
  CONSTRAINT pk__pod_user_workspace__user_id__workspace_id PRIMARY KEY (user_id , workspace_id ),
  CONSTRAINT fk__pod_user_workspace__user_id FOREIGN KEY (user_id)
      REFERENCES pod_user (user_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk__pod_user_workspace__workspace_id FOREIGN KEY (workspace_id)
      REFERENCES pod_workspaces (workspace_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);
ALTER TABLE pod_user_workspace
  OWNER TO poduser;


INSERT INTO pod_user_workspace(user_id, workspace_id, role) SELECT user_id, 1, 8 FROM pod_user;



-- ADD Workspace id to all nodes
ALTER TABLE pod_nodes_history ADD COLUMN workspace_id integer;

ALTER TABLE pod_nodes_history ADD COLUMN is_deleted boolean;
UPDATE pod_nodes_history SET is_deleted=false;
ALTER TABLE pod_nodes_history ALTER COLUMN is_deleted SET NOT NULL;
ALTER TABLE pod_nodes_history ALTER COLUMN is_deleted SET DEFAULT false;

ALTER TABLE pod_nodes_history ADD COLUMN is_archived boolean;
UPDATE pod_nodes_history SET is_archived=false;
ALTER TABLE pod_nodes_history ALTER COLUMN is_archived SET NOT NULL;
ALTER TABLE pod_nodes_history ALTER COLUMN is_archived SET DEFAULT false;

-- Trigger: pod_update_node_tg on pod_nodes

DROP TRIGGER pod_update_node_tg ON pod_nodes;

CREATE TRIGGER pod_update_node_tg
  INSTEAD OF UPDATE
  ON pod_nodes
  FOR EACH ROW
  EXECUTE PROCEDURE pod_update_node();

-- View: pod_nodes

-- DROP VIEW pod_nodes;

CREATE OR REPLACE VIEW pod_nodes AS 
 SELECT DISTINCT ON (pod_nodes_history.node_id) pod_nodes_history.node_id, pod_nodes_history.parent_id, pod_nodes_history.node_order, pod_nodes_history.node_type, pod_nodes_history.created_at, pod_nodes_history.updated_at, pod_nodes_history.data_label, pod_nodes_history.data_content, pod_nodes_history.data_datetime, pod_nodes_history.node_status, pod_nodes_history.data_reminder_datetime, pod_nodes_history.data_file_name, pod_nodes_history.data_file_content, pod_nodes_history.data_file_mime_type, pod_nodes_history.parent_tree_path, pod_nodes_history.node_depth, pod_nodes_history.owner_id, pod_nodes_history.is_shared, pod_nodes_history.is_public, pod_nodes_history.public_url_key, pod_nodes_history.workspace_id, pod_nodes_history.is_deleted, pod_nodes_history.is_archived
   FROM pod_nodes_history
  ORDER BY pod_nodes_history.node_id, pod_nodes_history.updated_at DESC, pod_nodes_history.created_at DESC;
  
  
ALTER TABLE pod_nodes
  OWNER TO poduser;


-- Rule: pod_insert_new_node ON pod_nodes

-- DROP RULE pod_insert_new_node ON pod_nodes;

CREATE OR REPLACE RULE pod_insert_new_node AS
    ON INSERT TO pod_nodes DO INSTEAD  INSERT INTO pod_nodes_history (node_id, parent_id, node_order, node_type, created_at, updated_at, data_label, data_content, data_datetime, node_status, data_reminder_datetime, data_file_name, data_file_content, data_file_mime_type, parent_tree_path, node_depth, owner_id, version_id, is_shared, is_public, public_url_key, workspace_id, is_deleted, is_archived) 
  VALUES (nextval('pod_nodes__node_id__sequence'::regclass), new.parent_id, new.node_order, new.node_type, new.created_at, new.updated_at, new.data_label, new.data_content, new.data_datetime, new.node_status, new.data_reminder_datetime, new.data_file_name, new.data_file_content, new.data_file_mime_type, new.parent_tree_path, new.node_depth, new.owner_id, nextval('pod_nodes_version_id_sequence'::regclass), new.is_shared, new.is_public, new.public_url_key, new.workspace_id, new.is_deleted, new.is_archived)
  RETURNING pod_nodes_history.node_id, pod_nodes_history.parent_id, pod_nodes_history.node_order, pod_nodes_history.node_type, pod_nodes_history.created_at, pod_nodes_history.updated_at, pod_nodes_history.data_label, pod_nodes_history.data_content, pod_nodes_history.data_datetime, pod_nodes_history.node_status, pod_nodes_history.data_reminder_datetime, pod_nodes_history.data_file_name, pod_nodes_history.data_file_content, pod_nodes_history.data_file_mime_type, pod_nodes_history.parent_tree_path, pod_nodes_history.node_depth, pod_nodes_history.owner_id, pod_nodes_history.is_shared, pod_nodes_history.is_public, pod_nodes_history.public_url_key, pod_nodes_history.workspace_id, pod_nodes_history.is_deleted, pod_nodes_history.is_archived;

-- Trigger: pod_update_node_tg on pod_nodes

-- DROP TRIGGER pod_update_node_tg ON pod_nodes;

DROP TRIGGER pod_update_node_tg
CREATE TRIGGER pod_update_node_tg
  INSTEAD OF UPDATE
  ON pod_nodes
  FOR EACH ROW
  EXECUTE PROCEDURE pod_update_node();

CREATE OR REPLACE FUNCTION pod_update_node()
  RETURNS trigger AS
$BODY$
BEGIN
INSERT INTO pod_nodes_history (node_id, parent_id, node_order, node_type, created_at, updated_at, 
       data_label, data_content, data_datetime, node_status, data_reminder_datetime, 
       data_file_name, data_file_content, data_file_mime_type, parent_tree_path, 
       node_depth, owner_id, version_id, is_shared, is_public, public_url_key, workspace_id, is_deleted, is_archived) VALUES (NEW.node_id, NEW.parent_id, NEW.node_order, NEW.node_type, NEW.created_at, NEW.updated_at, NEW.data_label, NEW.data_content, NEW.data_datetime, NEW.node_status, NEW.data_reminder_datetime, NEW.data_file_name, NEW.data_file_content, NEW.data_file_mime_type, NEW.parent_tree_path, NEW.node_depth, NEW.owner_id, nextval('pod_nodes_version_id_sequence'), NEW.is_shared, NEW.is_public, NEW.public_url_key, NEW.workspace_id, NEW.is_deleted, NEW.is_archived);
return new;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION pod_update_node()
  OWNER TO poduser;


UPDATE pod_nodes_history SET workspace_id=1;

-- alter data type to folder for each data containing children

UPDATE pod_nodes_history SET node_type='folder' WHERE node_id IN (
SELECT parent_id FROM pod_nodes WHERE node_type='data' GROUP BY parent_id ORDER BY parent_id)

UPDATE pod_nodes_history SET node_type='folder' WHERE parent_id IS NULL;


-- alter default data nodes to "page nodes"
update pod_nodes_history set node_type='page' where node_type='data'
update pod_nodes_history set node_type='page' where node_type='contact'
update pod_nodes_history set node_type='comment' where node_type='event'


update pod_nodes_history set node_status='open' where node_status in ('new', 'inprogress', 'standby')
update pod_nodes_history set node_status='closed-validated' where node_status in ('done', 'information')

update pod_nodes_history set node_status='closed-validated', is_deleted=true where node_status in ('deleted')
update pod_nodes_history set node_status='closed-validated', is_archived=true where node_status in ('closed')



-- Add column "properties"
-- ALTER TABLE pod_nodes_history DROP COLUMN properties;
ALTER TABLE pod_nodes_history ADD COLUMN properties text;
COMMENT ON COLUMN pod_nodes_history.properties IS 'This column contain properties specific to a given node_type. these properties are json encoded (so there is no structure "a priori")';

ALTER TABLE pod_nodes_history ADD COLUMN last_action character varying(32);

-- Add the properties column to pod_nodes view
-- DROP VIEW pod_nodes;
CREATE OR REPLACE VIEW pod_nodes AS 
 SELECT DISTINCT ON (pod_nodes_history.node_id) pod_nodes_history.node_id, pod_nodes_history.parent_id, pod_nodes_history.node_order, pod_nodes_history.node_type, pod_nodes_history.created_at, pod_nodes_history.updated_at, pod_nodes_history.data_label, pod_nodes_history.data_content, pod_nodes_history.data_datetime, pod_nodes_history.node_status, pod_nodes_history.data_reminder_datetime, pod_nodes_history.data_file_name, pod_nodes_history.data_file_content, pod_nodes_history.data_file_mime_type, pod_nodes_history.parent_tree_path, pod_nodes_history.node_depth, pod_nodes_history.owner_id, pod_nodes_history.is_shared, pod_nodes_history.is_public, pod_nodes_history.public_url_key, pod_nodes_history.workspace_id, pod_nodes_history.is_deleted, pod_nodes_history.is_archived, pod_nodes_history.properties, pod_nodes_history.last_action
   FROM pod_nodes_history
  ORDER BY pod_nodes_history.node_id, pod_nodes_history.updated_at DESC, pod_nodes_history.created_at DESC;

CREATE OR REPLACE RULE pod_insert_new_node AS
    ON INSERT TO pod_nodes DO INSTEAD  INSERT INTO pod_nodes_history (node_id, parent_id, node_order, node_type, created_at, updated_at, data_label, data_content, data_datetime, node_status, data_reminder_datetime, data_file_name, data_file_content, data_file_mime_type, parent_tree_path, node_depth, owner_id, version_id, is_shared, is_public, public_url_key, workspace_id, is_deleted, is_archived, properties, last_action) 
  VALUES (nextval('pod_nodes__node_id__sequence'::regclass), new.parent_id, new.node_order, new.node_type, new.created_at, new.updated_at, new.data_label, new.data_content, new.data_datetime, new.node_status, new.data_reminder_datetime, new.data_file_name, new.data_file_content, new.data_file_mime_type, new.parent_tree_path, new.node_depth, new.owner_id, nextval('pod_nodes_version_id_sequence'::regclass), new.is_shared, new.is_public, new.public_url_key, new.workspace_id, new.is_deleted, new.is_archived, new.properties, new.last_action)
  RETURNING pod_nodes_history.node_id, pod_nodes_history.parent_id, pod_nodes_history.node_order, pod_nodes_history.node_type, pod_nodes_history.created_at, pod_nodes_history.updated_at, pod_nodes_history.data_label, pod_nodes_history.data_content, pod_nodes_history.data_datetime, pod_nodes_history.node_status, pod_nodes_history.data_reminder_datetime, pod_nodes_history.data_file_name, pod_nodes_history.data_file_content, pod_nodes_history.data_file_mime_type, pod_nodes_history.parent_tree_path, pod_nodes_history.node_depth, pod_nodes_history.owner_id, pod_nodes_history.is_shared, pod_nodes_history.is_public, pod_nodes_history.public_url_key, pod_nodes_history.workspace_id, pod_nodes_history.is_deleted, pod_nodes_history.is_archived, pod_nodes_history.properties, pod_nodes_history.last_action;

DROP TRIGGER pod_update_node_tg ON pod_nodes;
CREATE TRIGGER pod_update_node_tg
  INSTEAD OF UPDATE
  ON pod_nodes
  FOR EACH ROW
  EXECUTE PROCEDURE pod_update_node();

-- DROP FUNCTION pod_update_node();
CREATE OR REPLACE FUNCTION pod_update_node()
  RETURNS trigger AS
$BODY$
BEGIN
INSERT INTO pod_nodes_history (node_id, parent_id, node_order, node_type, created_at, updated_at, 
       data_label, data_content, data_datetime, node_status, data_reminder_datetime, 
       data_file_name, data_file_content, data_file_mime_type, parent_tree_path, 
       node_depth, owner_id, version_id, is_shared, is_public, public_url_key, workspace_id, is_deleted, is_archived, properties, last_action) VALUES (NEW.node_id, NEW.parent_id, NEW.node_order, NEW.node_type, NEW.created_at, NEW.updated_at, NEW.data_label, NEW.data_content, NEW.data_datetime, NEW.node_status, NEW.data_reminder_datetime, NEW.data_file_name, NEW.data_file_content, NEW.data_file_mime_type, NEW.parent_tree_path, NEW.node_depth, NEW.owner_id, nextval('pod_nodes_version_id_sequence'), NEW.is_shared, NEW.is_public, NEW.public_url_key, NEW.workspace_id, NEW.is_deleted, NEW.is_archived, NEW.properties, NEW.last_action);
return new;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;


ALTER TABLE pod_group DROP COLUMN personnal_group;
DELETE FROM pod_user_group;
DELETE FROM pod_group;
INSERT INTO pod_group(group_id, group_name, display_name, created) VALUES
(1, 'users', 'Users', NOW()),
(2, 'managers', 'Global Managers', NOW()),
(3, 'administrators', 'Administrators', NOW());

-- Add all users in all group
INSERT INTO pod_user_group(user_id, group_id) SELECT user_id, 1 FROM pod_user;
INSERT INTO pod_user_group(user_id, group_id) SELECT user_id, 2 FROM pod_user;
INSERT INTO pod_user_group(user_id, group_id) SELECT user_id, 3 FROM pod_user;

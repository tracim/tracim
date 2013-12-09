
--
-- Remove useless status
--
UPDATE pod_nodes SET node_status='information' WHERE node_status='immortal';
UPDATE pod_nodes SET node_status='inprogress' WHERE node_status='actiontodo';
UPDATE pod_nodes SET node_status='inprogress' WHERE node_status='hot';
UPDATE pod_nodes SET node_status='actiontodo' WHERE node_status='actiontodo';
UPDATE pod_nodes SET node_status='closed' WHERE node_status='archived';


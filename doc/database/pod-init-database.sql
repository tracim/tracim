--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: pod_update_node(); Type: FUNCTION; Schema: public; Owner: pod_intranet
--

CREATE FUNCTION pod_update_node() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
INSERT INTO pod_nodes_history (node_id, parent_id, node_order, node_type, created_at, updated_at, 
       data_label, data_content, data_datetime, node_status, data_reminder_datetime, 
       data_file_name, data_file_content, data_file_mime_type, parent_tree_path, 
       node_depth, owner_id, version_id, is_shared, is_public, public_url_key) VALUES (NEW.node_id, NEW.parent_id, NEW.node_order, NEW.node_type, NEW.created_at, NEW.updated_at, NEW.data_label, NEW.data_content, NEW.data_datetime, NEW.node_status, NEW.data_reminder_datetime, NEW.data_file_name, NEW.data_file_content, NEW.data_file_mime_type, NEW.parent_tree_path, NEW.node_depth, NEW.owner_id, nextval('pod_nodes_version_id_sequence'), NEW.is_shared, NEW.is_public, NEW.public_url_key);
return new;
END;
$$;


--
-- Name: set_created_at(); Type: FUNCTION; Schema: public; Owner: pod_intranet
--

CREATE FUNCTION set_created_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.created_at = CURRENT_TIMESTAMP;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: pod_intranet
--

CREATE FUNCTION set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: migrate_version; Type: TABLE; Schema: public; Owner: pod_intranet; Tablespace: 
--

CREATE TABLE migrate_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: pod_group; Type: TABLE; Schema: public; Owner: pod_intranet; Tablespace: 
--

CREATE TABLE pod_group (
    group_id integer NOT NULL,
    group_name character varying(16) NOT NULL,
    display_name character varying(255),
    created timestamp without time zone,
    personnal_group boolean
);


--
-- Name: pod_group_group_id_seq; Type: SEQUENCE; Schema: public; Owner: pod_intranet
--

CREATE SEQUENCE pod_group_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pod_group_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pod_intranet
--

ALTER SEQUENCE pod_group_group_id_seq OWNED BY pod_group.group_id;


--
-- Name: pod_group_node; Type: TABLE; Schema: public; Owner: pod_intranet; Tablespace: 
--

CREATE TABLE pod_group_node (
    group_id integer NOT NULL,
    node_id integer NOT NULL,
    rights integer
);


--
-- Name: pod_group_permission; Type: TABLE; Schema: public; Owner: pod_intranet; Tablespace: 
--

CREATE TABLE pod_group_permission (
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);



--
-- Name: pod_nodes_version_id_sequence; Type: SEQUENCE; Schema: public; Owner: pod_intranet
--

CREATE SEQUENCE pod_nodes_version_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pod_nodes_history; Type: TABLE; Schema: public; Owner: pod_intranet; Tablespace: 
--

CREATE TABLE pod_nodes_history (
    node_id integer NOT NULL,
    parent_id integer,
    node_order integer DEFAULT 1,
    node_type character varying(16) DEFAULT 'data'::character varying NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    data_label character varying(1024),
    data_content text DEFAULT ''::text NOT NULL,
    data_datetime timestamp without time zone,
    node_status character varying(16) DEFAULT 'new'::character varying,
    data_reminder_datetime timestamp without time zone,
    data_file_name character varying(255),
    data_file_content bytea,
    data_file_mime_type character varying(255),
    parent_tree_path character varying(255),
    node_depth integer DEFAULT 0 NOT NULL,
    owner_id integer,
    version_id integer DEFAULT nextval('pod_nodes_version_id_sequence'::regclass) NOT NULL,
    is_shared boolean DEFAULT false NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    public_url_key character varying(1024)
);


--
-- Name: pod_nodes; Type: VIEW; Schema: public; Owner: pod_intranet
--

CREATE VIEW pod_nodes AS
    SELECT DISTINCT ON (pod_nodes_history.node_id) pod_nodes_history.node_id, pod_nodes_history.parent_id, pod_nodes_history.node_order, pod_nodes_history.node_type, pod_nodes_history.created_at, pod_nodes_history.updated_at, pod_nodes_history.data_label, pod_nodes_history.data_content, pod_nodes_history.data_datetime, pod_nodes_history.node_status, pod_nodes_history.data_reminder_datetime, pod_nodes_history.data_file_name, pod_nodes_history.data_file_content, pod_nodes_history.data_file_mime_type, pod_nodes_history.parent_tree_path, pod_nodes_history.node_depth, pod_nodes_history.owner_id, pod_nodes_history.is_shared, pod_nodes_history.is_public, pod_nodes_history.public_url_key FROM pod_nodes_history ORDER BY pod_nodes_history.node_id, pod_nodes_history.updated_at DESC;


--
-- Name: pod_nodes__node_id__sequence; Type: SEQUENCE; Schema: public; Owner: pod_intranet
--

CREATE SEQUENCE pod_nodes__node_id__sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pod_nodes__node_id__sequence; Type: SEQUENCE OWNED BY; Schema: public; Owner: pod_intranet
--

ALTER SEQUENCE pod_nodes__node_id__sequence OWNED BY pod_nodes_history.node_id;


--
-- Name: pod_permission; Type: TABLE; Schema: public; Owner: pod_intranet; Tablespace: 
--

CREATE TABLE pod_permission (
    permission_id integer NOT NULL,
    permission_name character varying(63) NOT NULL,
    description character varying(255)
);


--
-- Name: pod_permission_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: pod_intranet
--

CREATE SEQUENCE pod_permission_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pod_permission_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pod_intranet
--

ALTER SEQUENCE pod_permission_permission_id_seq OWNED BY pod_permission.permission_id;


--
-- Name: pod_user; Type: TABLE; Schema: public; Owner: pod_intranet; Tablespace: 
--

CREATE TABLE pod_user (
    user_id integer NOT NULL,
    email_address character varying(255) NOT NULL,
    display_name character varying(255),
    password character varying(128),
    created timestamp without time zone
);


--
-- Name: pod_user_group; Type: TABLE; Schema: public; Owner: pod_intranet; Tablespace: 
--

CREATE TABLE pod_user_group (
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


--
-- Name: pod_user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: pod_intranet
--

CREATE SEQUENCE pod_user_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pod_user_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pod_intranet
--

ALTER SEQUENCE pod_user_user_id_seq OWNED BY pod_user.user_id;


--
-- Name: group_id; Type: DEFAULT; Schema: public; Owner: pod_intranet
--

ALTER TABLE ONLY pod_group ALTER COLUMN group_id SET DEFAULT nextval('pod_group_group_id_seq'::regclass);


--
-- Name: node_id; Type: DEFAULT; Schema: public; Owner: pod_intranet
--

ALTER TABLE ONLY pod_nodes_history ALTER COLUMN node_id SET DEFAULT nextval('pod_nodes__node_id__sequence'::regclass);


--
-- Name: permission_id; Type: DEFAULT; Schema: public; Owner: pod_intranet
--

ALTER TABLE ONLY pod_permission ALTER COLUMN permission_id SET DEFAULT nextval('pod_permission_permission_id_seq'::regclass);


--
-- Name: user_id; Type: DEFAULT; Schema: public; Owner: pod_intranet
--

ALTER TABLE ONLY pod_user ALTER COLUMN user_id SET DEFAULT nextval('pod_user_user_id_seq'::regclass);


--
-- Data for Name: migrate_version; Type: TABLE DATA; Schema: public; Owner: pod_intranet
--

COPY migrate_version (version_num) FROM stdin;
\.


--
-- Data for Name: pod_group; Type: TABLE DATA; Schema: public; Owner: pod_intranet
--

COPY pod_group (group_id, group_name, display_name, created, personnal_group) FROM stdin;
1	managers	Managers	\N	f
3	admin	Admin	\N	f
-1	user_1	\N	2014-06-11 10:55:36.163634	t
2	user	All Users	\N	f
\.


--
-- Name: pod_group_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pod_intranet
--

SELECT pg_catalog.setval('pod_group_group_id_seq', 1, false);


--
-- Data for Name: pod_group_permission; Type: TABLE DATA; Schema: public; Owner: pod_intranet
--

COPY pod_group_permission (group_id, permission_id) FROM stdin;
\.

--
-- Name: pod_nodes__node_id__sequence; Type: SEQUENCE SET; Schema: public; Owner: pod_intranet
--

SELECT pg_catalog.setval('pod_nodes__node_id__sequence', 25, true);

--
-- Name: pod_nodes_version_id_sequence; Type: SEQUENCE SET; Schema: public; Owner: pod_intranet
--

SELECT pg_catalog.setval('pod_nodes_version_id_sequence', 41, true);


--
-- Data for Name: pod_permission; Type: TABLE DATA; Schema: public; Owner: pod_intranet
--

COPY pod_permission (permission_id, permission_name, description) FROM stdin;
\.


--
-- Name: pod_permission_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pod_intranet
--

SELECT pg_catalog.setval('pod_permission_permission_id_seq', 1, false);


--
-- Data for Name: pod_user; Type: TABLE DATA; Schema: public; Owner: pod_intranet
--

COPY pod_user (user_id, email_address, display_name, password, created) FROM stdin;
1	admin@localhost	Admin	b0c2243d8052ebc30e446d557b3249ed143e0ba6922ec49d9c53f3c1a533ae25b5dc4ec00d6cc3dd9fc9c74107e9914b3ace56ba8ded846bda9c140c0d6f721e	2014-06-11 10:55:36.15707
\.


--
-- Data for Name: pod_user_group; Type: TABLE DATA; Schema: public; Owner: pod_intranet
--

COPY pod_user_group (user_id, group_id) FROM stdin;
1	2
1	-1
\.


--
-- Name: pod_user_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pod_intranet
--

SELECT pg_catalog.setval('pod_user_user_id_seq', 1, true);


--
-- Name: pod_group_group_name_key; Type: CONSTRAINT; Schema: public; Owner: pod_intranet; Tablespace: 
--

ALTER TABLE ONLY pod_group
    ADD CONSTRAINT pod_group_group_name_key UNIQUE (group_name);


--
-- Name: pod_group_node_pkey; Type: CONSTRAINT; Schema: public; Owner: pod_intranet; Tablespace: 
--

ALTER TABLE ONLY pod_group_node
    ADD CONSTRAINT pod_group_node_pkey PRIMARY KEY (group_id, node_id);


--
-- Name: pod_group_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: pod_intranet; Tablespace: 
--

ALTER TABLE ONLY pod_group_permission
    ADD CONSTRAINT pod_group_permission_pkey PRIMARY KEY (group_id, permission_id);


--
-- Name: pod_group_pkey; Type: CONSTRAINT; Schema: public; Owner: pod_intranet; Tablespace: 
--

ALTER TABLE ONLY pod_group
    ADD CONSTRAINT pod_group_pkey PRIMARY KEY (group_id);


--
-- Name: pod_nodes_history_pkey; Type: CONSTRAINT; Schema: public; Owner: pod_intranet; Tablespace: 
--

ALTER TABLE ONLY pod_nodes_history
    ADD CONSTRAINT pod_nodes_history_pkey PRIMARY KEY (version_id);


--
-- Name: pod_permission_permission_name_key; Type: CONSTRAINT; Schema: public; Owner: pod_intranet; Tablespace: 
--

ALTER TABLE ONLY pod_permission
    ADD CONSTRAINT pod_permission_permission_name_key UNIQUE (permission_name);


--
-- Name: pod_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: pod_intranet; Tablespace: 
--

ALTER TABLE ONLY pod_permission
    ADD CONSTRAINT pod_permission_pkey PRIMARY KEY (permission_id);


--
-- Name: pod_user_email_address_key; Type: CONSTRAINT; Schema: public; Owner: pod_intranet; Tablespace: 
--

ALTER TABLE ONLY pod_user
    ADD CONSTRAINT pod_user_email_address_key UNIQUE (email_address);


--
-- Name: pod_user_group_pkey; Type: CONSTRAINT; Schema: public; Owner: pod_intranet; Tablespace: 
--

ALTER TABLE ONLY pod_user_group
    ADD CONSTRAINT pod_user_group_pkey PRIMARY KEY (user_id, group_id);


--
-- Name: pod_user_pkey; Type: CONSTRAINT; Schema: public; Owner: pod_intranet; Tablespace: 
--

ALTER TABLE ONLY pod_user
    ADD CONSTRAINT pod_user_pkey PRIMARY KEY (user_id);


--
-- Name: fki_pod_nodes__owner_id_fk; Type: INDEX; Schema: public; Owner: pod_intranet; Tablespace: 
--

CREATE INDEX fki_pod_nodes__owner_id_fk ON pod_nodes_history USING btree (owner_id);


--
-- Name: fki_pod_nodes__parent_id_fk; Type: INDEX; Schema: public; Owner: pod_intranet; Tablespace: 
--

CREATE INDEX fki_pod_nodes__parent_id_fk ON pod_nodes_history USING btree (parent_id);


--
-- Name: idx_pod_nodes__parent_tree_path; Type: INDEX; Schema: public; Owner: pod_intranet; Tablespace: 
--

CREATE INDEX idx_pod_nodes__parent_tree_path ON pod_nodes_history USING btree (parent_tree_path);


--
-- Name: pod_insert_new_node; Type: RULE; Schema: public; Owner: pod_intranet
--

CREATE RULE pod_insert_new_node AS ON INSERT TO pod_nodes DO INSTEAD INSERT INTO pod_nodes_history (node_id, parent_id, node_order, node_type, created_at, updated_at, data_label, data_content, data_datetime, node_status, data_reminder_datetime, data_file_name, data_file_content, data_file_mime_type, parent_tree_path, node_depth, owner_id, version_id, is_shared, is_public, public_url_key) VALUES (nextval('pod_nodes__node_id__sequence'::regclass), new.parent_id, new.node_order, new.node_type, new.created_at, new.updated_at, new.data_label, new.data_content, new.data_datetime, new.node_status, new.data_reminder_datetime, new.data_file_name, new.data_file_content, new.data_file_mime_type, new.parent_tree_path, new.node_depth, new.owner_id, nextval('pod_nodes_version_id_sequence'::regclass), new.is_shared, new.is_public, new.public_url_key) RETURNING pod_nodes_history.node_id, pod_nodes_history.parent_id, pod_nodes_history.node_order, pod_nodes_history.node_type, pod_nodes_history.created_at, pod_nodes_history.updated_at, pod_nodes_history.data_label, pod_nodes_history.data_content, pod_nodes_history.data_datetime, pod_nodes_history.node_status, pod_nodes_history.data_reminder_datetime, pod_nodes_history.data_file_name, pod_nodes_history.data_file_content, pod_nodes_history.data_file_mime_type, pod_nodes_history.parent_tree_path, pod_nodes_history.node_depth, pod_nodes_history.owner_id, pod_nodes_history.is_shared, pod_nodes_history.is_public, pod_nodes_history.public_url_key;


--
-- Name: pod_nodes__on_insert_set_created_at; Type: TRIGGER; Schema: public; Owner: pod_intranet
--

CREATE TRIGGER pod_nodes__on_insert_set_created_at BEFORE INSERT ON pod_nodes_history FOR EACH ROW EXECUTE PROCEDURE set_created_at();


--
-- Name: pod_nodes__on_update_set_updated_at; Type: TRIGGER; Schema: public; Owner: pod_intranet
--

CREATE TRIGGER pod_nodes__on_update_set_updated_at BEFORE UPDATE ON pod_nodes_history FOR EACH ROW EXECUTE PROCEDURE set_updated_at();


--
-- Name: pod_update_node_tg; Type: TRIGGER; Schema: public; Owner: pod_intranet
--

CREATE TRIGGER pod_update_node_tg INSTEAD OF UPDATE ON pod_nodes FOR EACH ROW EXECUTE PROCEDURE pod_update_node();


--
-- Name: pod_group_node_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pod_intranet
--

ALTER TABLE ONLY pod_group_node
    ADD CONSTRAINT pod_group_node_group_id_fkey FOREIGN KEY (group_id) REFERENCES pod_group(group_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pod_group_permission_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pod_intranet
--

ALTER TABLE ONLY pod_group_permission
    ADD CONSTRAINT pod_group_permission_group_id_fkey FOREIGN KEY (group_id) REFERENCES pod_group(group_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pod_group_permission_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pod_intranet
--

ALTER TABLE ONLY pod_group_permission
    ADD CONSTRAINT pod_group_permission_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES pod_permission(permission_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pod_nodes__owner_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: pod_intranet
--

ALTER TABLE ONLY pod_nodes_history
    ADD CONSTRAINT pod_nodes__owner_id_fk FOREIGN KEY (owner_id) REFERENCES pod_user(user_id);


--
-- Name: pod_user_group_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pod_intranet
--

ALTER TABLE ONLY pod_user_group
    ADD CONSTRAINT pod_user_group_group_id_fkey FOREIGN KEY (group_id) REFERENCES pod_group(group_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pod_user_group_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pod_intranet
--

ALTER TABLE ONLY pod_user_group
    ADD CONSTRAINT pod_user_group_user_id_fkey FOREIGN KEY (user_id) REFERENCES pod_user(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


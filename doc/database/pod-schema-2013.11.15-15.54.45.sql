--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

CREATE FUNCTION set_created_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.created_at = CURRENT_TIMESTAMP;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_created_at() OWNER TO pod_master;

CREATE FUNCTION set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO pod_master;

SET default_tablespace = '';

SET default_with_oids = false;

CREATE TABLE migrate_version (
    version_num character varying(32) NOT NULL
);

ALTER TABLE public.migrate_version OWNER TO pod_master;

CREATE TABLE pod_node_status (
    status_type character varying(16) NOT NULL,
    status_id character varying(16) NOT NULL,
    status_label character varying(256),
    hexa_color_foreground character(7),
    hexa_color_background character(7)
);

ALTER TABLE public.pod_node_status OWNER TO pod_master;

CREATE TABLE pod_nodes (
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
    owner_id integer
);


ALTER TABLE public.pod_nodes OWNER TO pod_master;

CREATE SEQUENCE pod_nodes__node_id__sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pod_nodes__node_id__sequence OWNER TO pod_master;

ALTER SEQUENCE pod_nodes__node_id__sequence OWNED BY pod_nodes.node_id;


CREATE TABLE pod_group (
    group_id integer NOT NULL,
    group_name character varying(16) NOT NULL,
    display_name character varying(255),
    created timestamp without time zone
);


ALTER TABLE public.pod_group OWNER TO pod_master;

CREATE SEQUENCE pod_group_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pod_group_group_id_seq OWNER TO pod_master;

ALTER SEQUENCE pod_group_group_id_seq OWNED BY pod_group.group_id;


CREATE TABLE pod_group_permission (
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.pod_group_permission OWNER TO pod_master;

CREATE TABLE pod_permission (
    permission_id integer NOT NULL,
    permission_name character varying(63) NOT NULL,
    description character varying(255)
);


ALTER TABLE public.pod_permission OWNER TO pod_master;

CREATE SEQUENCE pod_permission_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pod_permission_permission_id_seq OWNER TO pod_master;

ALTER SEQUENCE pod_permission_permission_id_seq OWNED BY pod_permission.permission_id;


CREATE TABLE pod_user (
    user_id integer NOT NULL,
    email_address character varying(255) NOT NULL,
    display_name character varying(255),
    password character varying(128),
    created timestamp without time zone
);


ALTER TABLE public.pod_user OWNER TO pod_master;

CREATE TABLE pod_user_group (
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.pod_user_group OWNER TO pod_master;

CREATE SEQUENCE pod_user_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pod_user_user_id_seq OWNER TO pod_master;

ALTER SEQUENCE pod_user_user_id_seq OWNED BY pod_user.user_id;


ALTER TABLE ONLY pod_nodes ALTER COLUMN node_id SET DEFAULT nextval('pod_nodes__node_id__sequence'::regclass);

ALTER TABLE ONLY pod_group ALTER COLUMN group_id SET DEFAULT nextval('pod_group_group_id_seq'::regclass);


ALTER TABLE ONLY pod_permission ALTER COLUMN permission_id SET DEFAULT nextval('pod_permission_permission_id_seq'::regclass);


ALTER TABLE ONLY pod_user ALTER COLUMN user_id SET DEFAULT nextval('pod_user_user_id_seq'::regclass);

ALTER TABLE ONLY pod_node_status
    ADD CONSTRAINT pod_node_status__pk PRIMARY KEY (status_id);

ALTER TABLE ONLY pod_nodes
    ADD CONSTRAINT pod_nodes_pk PRIMARY KEY (node_id);


ALTER TABLE ONLY pod_group
    ADD CONSTRAINT pod_group_group_name_key UNIQUE (group_name);


ALTER TABLE ONLY pod_group_permission
    ADD CONSTRAINT pod_group_permission_pkey PRIMARY KEY (group_id, permission_id);


ALTER TABLE ONLY pod_group
    ADD CONSTRAINT pod_group_pkey PRIMARY KEY (group_id);


ALTER TABLE ONLY pod_permission
    ADD CONSTRAINT pod_permission_permission_name_key UNIQUE (permission_name);


ALTER TABLE ONLY pod_permission
    ADD CONSTRAINT pod_permission_pkey PRIMARY KEY (permission_id);


ALTER TABLE ONLY pod_user
    ADD CONSTRAINT pod_user_email_address_key UNIQUE (email_address);


ALTER TABLE ONLY pod_user_group
    ADD CONSTRAINT pod_user_group_pkey PRIMARY KEY (user_id, group_id);


ALTER TABLE ONLY pod_user
    ADD CONSTRAINT pod_user_pkey PRIMARY KEY (user_id);


CREATE INDEX fki_pod_nodes__owner_id_fk ON pod_nodes USING btree (owner_id);


CREATE INDEX fki_pod_nodes__parent_id_fk ON pod_nodes USING btree (parent_id);


CREATE INDEX idx_pod_nodes__parent_tree_path ON pod_nodes USING btree (parent_tree_path);


CREATE TRIGGER pod_nodes__on_insert_set_created_at BEFORE INSERT ON pod_nodes FOR EACH ROW EXECUTE PROCEDURE set_created_at();


CREATE TRIGGER pod_nodes__on_update_set_updated_at BEFORE UPDATE ON pod_nodes FOR EACH ROW EXECUTE PROCEDURE set_updated_at();


ALTER TABLE ONLY pod_nodes
    ADD CONSTRAINT pod_nodes__owner_id_fk FOREIGN KEY (owner_id) REFERENCES pod_user(user_id);


ALTER TABLE ONLY pod_nodes
    ADD CONSTRAINT pod_nodes__parent_id_fk FOREIGN KEY (parent_id) REFERENCES pod_nodes(node_id);


ALTER TABLE ONLY pod_group_permission
    ADD CONSTRAINT pod_group_permission_group_id_fkey FOREIGN KEY (group_id) REFERENCES pod_group(group_id) ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY pod_group_permission
    ADD CONSTRAINT pod_group_permission_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES pod_permission(permission_id) ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY pod_user_group
    ADD CONSTRAINT pod_user_group_group_id_fkey FOREIGN KEY (group_id) REFERENCES pod_group(group_id) ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE ONLY pod_user_group
    ADD CONSTRAINT pod_user_group_user_id_fkey FOREIGN KEY (user_id) REFERENCES pod_user(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


"""add GUEST profile enum

Revision ID: 239b49c55627
Revises: 38d2725ca92f
Create Date: 2025-06-11 09:41:09.231101

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "239b49c55627"
down_revision = "38d2725ca92f"


def upgrade():
    if op.get_context().dialect.name == "postgresql":
        op.execute("COMMIT;")
        op.execute("ALTER TYPE profile ADD VALUE 'GUEST' BEFORE 'USER'")

    else:
        op.execute(
            """
            CREATE TABLE "users_temporary_migration_process" (
            "created"	DATETIME,
            "user_id"	INTEGER NOT NULL,
            "external_id"	VARCHAR(1024),
            "email"	VARCHAR(255),
            "username"	VARCHAR(255),
            "display_name"	VARCHAR(255),
            "password"	VARCHAR(128),
            "is_active"	BOOLEAN NOT NULL,
            "imported_from"	VARCHAR(32),
            "timezone"	VARCHAR(32) NOT NULL DEFAULT '',
            "auth_type"	VARCHAR(8) NOT NULL DEFAULT 'INTERNAL',
            "lang"	VARCHAR(6),
            "auth_token"	VARCHAR(255),
            "auth_token_created"	DATETIME,
            "reset_password_token_hash"	VARCHAR(255),
            "reset_password_token_created"	DATETIME,
            "allowed_space"	BIGINT NOT NULL DEFAULT '0',
            "profile"	VARCHAR(12) NOT NULL DEFAULT 'NOBODY',
            "is_avatar_default"	BOOLEAN NOT NULL,
            "avatar"	TEXT,
            "cropped_avatar"	TEXT,
            "cover"	TEXT,
            "cropped_cover"	TEXT,
            "creation_author_id"	INTEGER,
            "creation_type"	VARCHAR(10),
            "connection_status"	VARCHAR(7) NOT NULL,
            "is_deleted"	BOOLEAN NOT NULL,
            CONSTRAINT "uq__users__email" UNIQUE("email"),
            CONSTRAINT "uq__users__external_id" UNIQUE("external_id"),
            CONSTRAINT "pk_users" PRIMARY KEY("user_id"),
            CONSTRAINT "uq__users__username" UNIQUE("username"),
            CONSTRAINT "fk_users_creation_author_id_users" FOREIGN KEY("creation_author_id") REFERENCES "users"("user_id") ON DELETE SET NULL,
            CONSTRAINT "ck_users_username_email" CHECK(NOT ("email" IS NULL AND "username" IS NULL)),
            CHECK("is_active" IN (0, 1)),
            CONSTRAINT "authtype" CHECK("auth_type" IN ('INTERNAL', 'LDAP', 'SAML', 'UNKNOWN', 'REMOTE')),
            CONSTRAINT "profile" CHECK("profile" IN ('NOBODY', 'GUEST', 'USER', 'TRUSTED_USER', 'ADMIN')),
            CHECK("is_avatar_default" IN (0, 1)),
            CONSTRAINT "usercreationtype" CHECK("creation_type" IN ('ADMIN', 'INVITATION', 'REGISTER', 'CLI')),
            CONSTRAINT "userconnectionstatus" CHECK("connection_status" IN ('ONLINE', 'OFFLINE')),
            CHECK("is_deleted" IN (0, 1))
        );"""
        )
        op.execute("INSERT INTO users_temporary_migration_process SELECT * FROM users;")
        op.execute("DROP TABLE users;")
        op.execute("ALTER TABLE users_temporary_migration_process RENAME TO users;")


def downgrade():
    op.execute("UPDATE users SET profile = 'USER' WHERE profile = 'GUEST';")

    if op.get_context().dialect.name == "postgresql":
        op.execute("ALTER TABLE users ALTER COLUMN profile DROP DEFAULT")

        op.execute("CREATE TYPE profile_new AS ENUM ('NOBODY', 'USER', 'TRUSTED_USER', 'ADMIN')")
        op.execute(
            "ALTER TABLE users ALTER COLUMN profile TYPE profile_new USING profile::text::profile_new"
        )
        op.execute("DROP TYPE profile")
        op.execute("ALTER TYPE profile_new RENAME TO profile")

        op.execute("ALTER TABLE users ALTER COLUMN profile SET DEFAULT 'NOBODY'")

    else:
        op.execute(
            """
            CREATE TABLE "users_temporary_migration_process" (
            "created"	DATETIME,
            "user_id"	INTEGER NOT NULL,
            "external_id"	VARCHAR(1024),
            "email"	VARCHAR(255),
            "username"	VARCHAR(255),
            "display_name"	VARCHAR(255),
            "password"	VARCHAR(128),
            "is_active"	BOOLEAN NOT NULL,
            "imported_from"	VARCHAR(32),
            "timezone"	VARCHAR(32) NOT NULL DEFAULT '',
            "auth_type"	VARCHAR(8) NOT NULL DEFAULT 'INTERNAL',
            "lang"	VARCHAR(6),
            "auth_token"	VARCHAR(255),
            "auth_token_created"	DATETIME,
            "reset_password_token_hash"	VARCHAR(255),
            "reset_password_token_created"	DATETIME,
            "allowed_space"	BIGINT NOT NULL DEFAULT '0',
            "profile"	VARCHAR(12) NOT NULL DEFAULT 'NOBODY',
            "is_avatar_default"	BOOLEAN NOT NULL,
            "avatar"	TEXT,
            "cropped_avatar"	TEXT,
            "cover"	TEXT,
            "cropped_cover"	TEXT,
            "creation_author_id"	INTEGER,
            "creation_type"	VARCHAR(10),
            "connection_status"	VARCHAR(7) NOT NULL,
            "is_deleted"	BOOLEAN NOT NULL,
            CONSTRAINT "uq__users__email" UNIQUE("email"),
            CONSTRAINT "uq__users__external_id" UNIQUE("external_id"),
            CONSTRAINT "pk_users" PRIMARY KEY("user_id"),
            CONSTRAINT "uq__users__username" UNIQUE("username"),
            CONSTRAINT "fk_users_creation_author_id_users" FOREIGN KEY("creation_author_id") REFERENCES "users"("user_id") ON DELETE SET NULL,
            CONSTRAINT "ck_users_username_email" CHECK(NOT ("email" IS NULL AND "username" IS NULL)),
            CHECK("is_active" IN (0, 1)),
            CONSTRAINT "authtype" CHECK("auth_type" IN ('INTERNAL', 'LDAP', 'SAML', 'UNKNOWN', 'REMOTE')),
            CONSTRAINT "profile" CHECK("profile" IN ('NOBODY', 'USER', 'TRUSTED_USER', 'ADMIN')),
            CHECK("is_avatar_default" IN (0, 1)),
            CONSTRAINT "usercreationtype" CHECK("creation_type" IN ('ADMIN', 'INVITATION', 'REGISTER', 'CLI')),
            CONSTRAINT "userconnectionstatus" CHECK("connection_status" IN ('ONLINE', 'OFFLINE')),
            CHECK("is_deleted" IN (0, 1))
        );"""
        )

        op.execute("INSERT INTO users_temporary_migration_process SELECT * FROM users;")
        op.execute("DROP TABLE users;")
        op.execute("ALTER TABLE users_temporary_migration_process RENAME TO users;")

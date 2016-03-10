"""delete_content_view

Revision ID: da12239d9da0
Revises: b73e57760b36
Create Date: 2016-03-04 15:59:05.828757

"""

# revision identifiers, used by Alembic.
revision = 'da12239d9da0'
down_revision = 'b73e57760b36'

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


def set_field_where_null(field_name, value="''"):
    op.execute("UPDATE content_revisions SET %s = %s WHERE %s IS NULL" % (field_name, value, field_name))


def set_field_to_null_where_empty_string(field_name):
    op.execute("UPDATE content_revisions SET %s = NULL WHERE %s = ''" % (field_name, field_name))

fields_names_to_empty_string = ('file_mimetype', 'file_name', 'label', 'properties',
                                'revision_type', 'status', 'description', 'label')


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###

    # Drop triggers
    op.execute("DROP TRIGGER trg__contents__on_insert__set_created ON content_revisions")
    op.execute("DROP TRIGGER trg__contents__on_update__set_updated ON content_revisions")
    op.execute("DROP TRIGGER trg__contents__on_update On contents")
    op.execute("DROP TRIGGER trg__workspaces__on_insert__set_created ON workspaces")
    op.execute("DROP TRIGGER trg__workspaces__on_update__set_updated ON workspaces")
    op.execute("DROP VIEW contents")

    # Set empty string on future non null fields
    for field_name in fields_names_to_empty_string:
        set_field_where_null(field_name)

    op.create_table('content',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.PrimaryKeyConstraint('id', name=op.f('pk__content'))
                    )

    # Create contents and reinit auto increment
    op.execute("INSERT INTO content (id) SELECT DISTINCT(content_id) FROM content_revisions;")
    op.execute("select setval('content_id_seq', (select max(id)+1 from content), false)")

    op.alter_column('content_revisions', 'created',
                    existing_type=postgresql.TIMESTAMP(),
                    nullable=False,
                    server_default=sa.func.now())
    op.alter_column('content_revisions', 'file_mimetype',
                    existing_type=sa.VARCHAR(length=255),
                    nullable=False,
                    server_default='')
    op.alter_column('content_revisions', 'file_name',
                    existing_type=sa.VARCHAR(length=255),
                    nullable=False,
                    server_default='')
    op.alter_column('content_revisions', 'label',
                    existing_type=sa.VARCHAR(length=1024),
                    nullable=False,
                    server_default='')
    op.alter_column('content_revisions', 'properties',
                    existing_type=sa.TEXT(),
                    nullable=False,
                    server_default='')
    op.alter_column('content_revisions', 'revision_type',
                    existing_type=sa.VARCHAR(length=32),
                    nullable=False,
                    server_default='')
    op.alter_column('content_revisions', 'status',
                    existing_type=sa.VARCHAR(length=32),
                    nullable=False,
                    existing_server_default=sa.text("'new'::character varying"),
                    server_default='')
    op.alter_column('content_revisions', 'updated',
                    existing_type=postgresql.TIMESTAMP(),
                    nullable=False,
                    server_default=sa.func.now())
    op.create_foreign_key(op.f('fk__content_revisions__content_id__content'), 'content_revisions', 'content',
                          ['content_id'], ['id'])
    op.create_foreign_key(op.f('fk__content_revisions__workspace_id__workspaces'), 'content_revisions', 'workspaces',
                          ['workspace_id'], ['workspace_id'])
    op.create_foreign_key(op.f('fk__content_revisions__parent_id__content'), 'content_revisions', 'content',
                          ['parent_id'], ['id'])
    op.alter_column('user_workspace', 'role',
                    existing_type=sa.INTEGER(),
                    nullable=False)
    op.drop_constraint('fk__user_workspace__user_id', 'user_workspace', type_='foreignkey')
    op.drop_constraint('fk__user_workspace__workspace_id', 'user_workspace', type_='foreignkey')
    op.create_foreign_key(op.f('fk__user_workspace__user_id__users'), 'user_workspace', 'users', ['user_id'],
                          ['user_id'])
    op.create_foreign_key(op.f('fk__user_workspace__workspace_id__workspaces'), 'user_workspace', 'workspaces',
                          ['workspace_id'], ['workspace_id'])
    op.alter_column('workspaces', 'created',
                    existing_type=postgresql.TIMESTAMP(),
                    nullable=False,
                    server_default=sa.func.now())
    op.alter_column('workspaces', 'description',
                    existing_type=sa.TEXT(),
                    nullable=False,
                    server_default='')
    op.alter_column('workspaces', 'label',
                    existing_type=sa.VARCHAR(length=1024),
                    nullable=False,
                    server_default='')
    op.alter_column('workspaces', 'updated',
                    existing_type=postgresql.TIMESTAMP(),
                    nullable=False,
                    server_default=sa.func.now())
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('workspaces', 'updated',
                    existing_type=postgresql.TIMESTAMP(),
                    nullable=True)
    op.alter_column('workspaces', 'label',
                    existing_type=sa.VARCHAR(length=1024),
                    nullable=True)
    op.alter_column('workspaces', 'description',
                    existing_type=sa.TEXT(),
                    nullable=True)
    op.alter_column('workspaces', 'created',
                    existing_type=postgresql.TIMESTAMP(),
                    nullable=True)
    op.drop_constraint(op.f('fk__user_workspace__workspace_id__workspaces'), 'user_workspace', type_='foreignkey')
    op.drop_constraint(op.f('fk__user_workspace__user_id__users'), 'user_workspace', type_='foreignkey')
    op.create_foreign_key('fk__user_workspace__workspace_id', 'user_workspace', 'workspaces', ['workspace_id'],
                          ['workspace_id'], onupdate='CASCADE', ondelete='CASCADE')
    op.create_foreign_key('fk__user_workspace__user_id', 'user_workspace', 'users', ['user_id'], ['user_id'],
                          onupdate='CASCADE', ondelete='CASCADE')
    op.alter_column('user_workspace', 'role',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    op.drop_constraint(op.f('fk__content_revisions__parent_id__content'), 'content_revisions', type_='foreignkey')
    op.drop_constraint(op.f('fk__content_revisions__workspace_id__workspaces'), 'content_revisions', type_='foreignkey')
    op.drop_constraint(op.f('fk__content_revisions__content_id__content'), 'content_revisions', type_='foreignkey')
    op.alter_column('content_revisions', 'updated',
                    existing_type=postgresql.TIMESTAMP(),
                    nullable=True)
    op.alter_column('content_revisions', 'status',
                    existing_type=sa.VARCHAR(length=32),
                    nullable=True,
                    existing_server_default=sa.text("'new'::character varying"))
    op.alter_column('content_revisions', 'revision_type',
                    existing_type=sa.VARCHAR(length=32),
                    nullable=True)
    op.alter_column('content_revisions', 'properties',
                    existing_type=sa.TEXT(),
                    nullable=True)
    op.alter_column('content_revisions', 'label',
                    existing_type=sa.VARCHAR(length=1024),
                    nullable=True)
    op.alter_column('content_revisions', 'file_name',
                    existing_type=sa.VARCHAR(length=255),
                    nullable=True)
    op.alter_column('content_revisions', 'file_mimetype',
                    existing_type=sa.VARCHAR(length=255),
                    nullable=True)
    op.alter_column('content_revisions', 'created',
                    existing_type=postgresql.TIMESTAMP(),
                    nullable=True)
    op.drop_table('content')

    for field_name in fields_names_to_empty_string:
        set_field_to_null_where_empty_string(field_name)

    op.execute("""
CREATE VIEW contents AS
    SELECT DISTINCT ON (content_revisions.content_id) content_revisions.content_id, content_revisions.parent_id, content_revisions.type, content_revisions.created, content_revisions.updated, content_revisions.label, content_revisions.description, content_revisions.status, content_revisions.file_name, content_revisions.file_content, content_revisions.file_mimetype, content_revisions.owner_id, content_revisions.workspace_id, content_revisions.is_deleted, content_revisions.is_archived, content_revisions.properties, content_revisions.revision_type FROM content_revisions ORDER BY content_revisions.content_id, content_revisions.updated DESC, content_revisions.created DESC;


CREATE TRIGGER trg__contents__on_insert__set_created BEFORE INSERT ON content_revisions FOR EACH ROW EXECUTE PROCEDURE set_created();
CREATE TRIGGER trg__contents__on_update__set_updated BEFORE UPDATE ON content_revisions FOR EACH ROW EXECUTE PROCEDURE set_updated();
CREATE TRIGGER trg__contents__on_update INSTEAD OF UPDATE ON contents FOR EACH ROW EXECUTE PROCEDURE update_node();
CREATE TRIGGER trg__workspaces__on_insert__set_created BEFORE INSERT ON workspaces FOR EACH ROW EXECUTE PROCEDURE set_created();
CREATE TRIGGER trg__workspaces__on_update__set_updated BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE PROCEDURE set_updated();
""")
    ### end Alembic commands ###

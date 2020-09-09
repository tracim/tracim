"""add cascade to events

Revision ID: 41449c86b94b
Revises: d6ce2c95006f
Create Date: 2020-09-09 14:53:54.360557

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "41449c86b94b"
down_revision = "d6ce2c95006f"


def upgrade():
    with op.batch_alter_table("messages") as batch_op:
        batch_op.drop_constraint("fk_messages_event_id_events", type_="foreignkey")
        batch_op.create_foreign_key(
            batch_op.f("fk_messages_event_id_events"),
            referent_table="events",
            local_cols=["event_id"],
            remote_cols=["event_id"],
            ondelete="CASCADE",
        )


def downgrade():
    with op.batch_alter_table("messages") as batch_op:
        batch_op.drop_constraint("fk_messages_event_id_events", type_="foreignkey")
        batch_op.create_foreign_key(
            batch_op.f("fk_messages_event_id_events"),
            referent_table="events",
            local_cols=["event_id"],
            remote_cols=["event_id"],
        )

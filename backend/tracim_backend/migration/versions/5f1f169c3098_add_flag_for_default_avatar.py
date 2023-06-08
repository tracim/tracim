"""add flag for default avatar

Revision ID: 5f1f169c3098
Revises: b7aa3b477519
Create Date: 2023-01-31 17:10:19.090365

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "5f1f169c3098"
down_revision = "b7aa3b477519"


def upgrade():
    with op.batch_alter_table("users") as bop:
        bop.add_column(
            sa.Column(
                "is_avatar_default",
                sa.Boolean(),
                nullable=False,
                default=True,
                server_default=sa.sql.expression.literal(True),
            )
        )
    connection = op.get_bind()
    connection.execute("UPDATE users SET is_avatar_default=(avatar = '' OR avatar IS NULL)")


def downgrade():
    with op.batch_alter_table("users") as bop:
        bop.drop_column("is_avatar_default")

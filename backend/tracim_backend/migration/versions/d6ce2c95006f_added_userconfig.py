"""added_userconfig

Revision ID: d6ce2c95006f
Revises: fb2ae8c604ac
Create Date: 2020-07-29 19:31:48.953180

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import Column
from sqlalchemy import MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from sqlalchemy.types import Integer

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq__%(table_name)s__%(column_0_name)s",  # Unique constrains
    # for ck contraint.
    # "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)

DeclarativeBase = declarative_base(metadata=metadata)

# revision identifiers, used by Alembic.
revision = "d6ce2c95006f"
down_revision = "fb2ae8c604ac"


class TemporaryUser(DeclarativeBase):
    __tablename__ = "users"
    user_id = Column(
        Integer, sa.Sequence("seq__users__user_id"), autoincrement=True, primary_key=True
    )


class TemporaryUserConfig(DeclarativeBase):
    __tablename__ = "user_configs"
    user_id = sa.Column(sa.Integer, sa.Sequence("seq__users__user_id"), primary_key=True)
    fields = sa.Column(sa.JSON, default={})


def upgrade():
    op.create_table(
        "user_configs",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("fields", sa.JSON(), nullable=False, default={}),
        sa.PrimaryKeyConstraint("user_id", name=op.f("pk_userconfig")),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.user_id"],
            name=op.f("fk_userconfig_user_id_users"),
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
    )

    connection = op.get_bind()
    session = Session(bind=connection)

    users = session.query(TemporaryUser).all()

    for user in users:
        session.add(TemporaryUserConfig(user_id=user.user_id))

    session.commit()


def downgrade():
    op.drop_table("user_configs")

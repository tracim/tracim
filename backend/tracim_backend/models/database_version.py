"""
Database version table handled by alembic
"""
from sqlalchemy import Column
from sqlalchemy import Unicode

from tracim_backend.models.meta import DeclarativeBase


class MigrateVersion(DeclarativeBase):
    __tablename__ = "migrate_version"
    version_num = Column(Unicode(32), unique=False, nullable=False, primary_key=True)

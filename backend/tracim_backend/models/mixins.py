from datetime import datetime

import sqlalchemy
from sqlalchemy import Boolean
from sqlalchemy import Column
from sqlalchemy import DateTime
from sqlalchemy.ext.declarative import declared_attr


class CreationDateMixin:
    @declared_attr
    def created(cls):
        #  Default value datetime.utcnow,
        # see: http://stackoverflow.com/a/13370382/801924 (or http://pastebin.com/VLyWktUn)
        return Column("created", DateTime, unique=False, nullable=False, default=datetime.utcnow)


class UpdateDateMixin:
    @declared_attr
    def updated(cls):
        #  Default value datetime.utcnow,
        # see: http://stackoverflow.com/a/13370382/801924 (or http://pastebin.com/VLyWktUn)
        return Column("updated", DateTime, unique=False, nullable=False, default=datetime.utcnow)


class TrashableMixin:
    @declared_attr
    def is_deleted(cls):
        return Column(
            "is_deleted",
            Boolean,
            unique=False,
            nullable=False,
            default=sqlalchemy.sql.expression.literal(False),
        )

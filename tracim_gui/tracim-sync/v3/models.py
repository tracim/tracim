# coding: utf-8

import os

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy.orm import backref
from sqlalchemy.orm import relationship
from sqlalchemy import UniqueConstraint

from db import BaseModel


class ContentModel(BaseModel):

    __tablename__ = 'content'

    id = Column('id', Integer, primary_key=True)
    remote_id = Column('remote_id', Integer, nullable=False)
    revision_id = Column('revision_id', Integer, unique=True, nullable=False)
    content_type = Column('content_type', String, default='', nullable=False)
    relative_path = Column('absolute_path', String, default='', nullable=False)

    filename = Column('filename', String, default='', nullable=False)
    instance_label = Column(
        'instance_label', String, default='', nullable=False
    )
    workspace_label = Column(
        'workspace_label', String, default='', nullable=False
    )

    workspace_id = Column('workspace_id', Integer, nullable=False)
    parent_id = Column('parent_id', Integer, nullable=True)
    children = relationship(
        "ContentModel",
        backref=backref('parent', remote_side=[id])
    )

    UniqueConstraint(remote_id, instance_label)

    def set_relative_path(self):
        self.absolute_path = self._get_absolute_path()
        for child in self.children:
            child.set_absolute_path()

    def _get_relative_path(self):
        if self.parent:
            return os.path.join(
                self.parent.relative_path, self.filename
            )
        return os.path.join(
            self.instance_label,
            self.workspace_label,
            self.filename
        )

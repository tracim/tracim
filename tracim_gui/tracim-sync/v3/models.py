# coding: utf-8

import os

from sqlalchemy import Boolean
from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Enum
from sqlalchemy import ForeignKey
from sqlalchemy.orm import backref
from sqlalchemy.orm import relationship
from sqlalchemy import UniqueConstraint
from sqlalchemy import event

from db import BaseModel
from config import ConfigParser

import enum

class Flag(enum.Enum):
    NEW = 'new'
    MOVED = 'moved'
    CHANGED = 'changed'
    DELETED = 'deleted'
    SYNCED = 'synced'


class ContentModel(BaseModel):

    __tablename__ = 'content'

    id = Column('id', Integer, primary_key=True, autoincrement=True)
    remote_id = Column('remote_id', Integer, nullable=False)
    revision_id = Column('revision_id', Integer, unique=True, nullable=False)
    content_type = Column('content_type', String, default='', nullable=False)
    relative_path = Column('relative_path', String, default='', nullable=False)

    filename = Column('filename', String, default='', nullable=False)
    instance_label = Column(
        'instance_label', String, default='', nullable=False
    )
    workspace_label = Column(
        'workspace_label', String, default='', nullable=False
    )

    workspace_id = Column('workspace_id', Integer, nullable=False)
    parent_id = Column(
        'parent_id', Integer, ForeignKey('content.remote_id'), default=0
    )
    children = relationship(
        "ContentModel",
        backref=backref('parent', remote_side=[remote_id])
    )
    flag = Column('flag', Enum(Flag), default=Flag.NEW)

    UniqueConstraint(remote_id, instance_label)

    def set_relative_path(self):
        self.relative_path = self._get_relative_path()
        for child in self.children:
            child.set_relative_path()

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

    def get_url(self):
        config = ConfigParser().load_config_from_file()
        return os.path.join(
            config.get_instance(self.instance_label)['url'],
            'api/v2/workspaces',
            self.workspace_id,
            self.content_type,
            self.remote_id
        )

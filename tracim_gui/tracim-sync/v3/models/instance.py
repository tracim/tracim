# coding: utf-8

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy.orm import relationship

from models.db import BaseModel


class InstanceModel(BaseModel):

    __tablename__ = 'instance'

    id = Column('id', Integer, primary_key=True)
    label = Column('label', String, default='', nullable=False)
    workspaces = relationship('WorkspaceModel', back_populates="instance")

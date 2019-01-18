# coding: utf-8

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy.orm import relationship

from models.db import BaseModel


class WorkspaceModel(BaseModel):

    __tablename__ = 'workspace'

    id = Column('id', Integer, primary_key=True)
    label = Column('label', String, default='', nullable=False)
    instance = relationship("InstanceModel", back_populates="workspaces")
    contents = relationship('ContentModel', back_populates="workspace")

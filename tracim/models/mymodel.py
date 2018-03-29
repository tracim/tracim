# -*- coding: utf-8 -*-
from sqlalchemy import (
    Column,
    Index,
    Integer,
    Text,
)

from .meta import DeclarativeBase

# TODO - G.M - 28-03-2018 - [Cleanup] Remove this example Model


class MyModel(DeclarativeBase):
    __tablename__ = 'models'
    id = Column(Integer, primary_key=True)
    name = Column(Text)
    value = Column(Integer)


Index('my_index', MyModel.name, unique=True, mysql_length=255)

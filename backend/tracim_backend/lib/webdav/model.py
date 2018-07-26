#coding: utf8

from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy.types import Unicode, UnicodeText, Float

from wsgidav.compat import to_unicode


class Lock(object):
    __tablename__ = 'my_locks'

    token = Column(UnicodeText, primary_key=True, unique=True, nullable=False)
    depth = Column(Unicode(32), unique=False, nullable=False, default=to_unicode('infinity'))
    root = Column(UnicodeText, unique=False, nullable=False)
    type = Column(Unicode(32), unique=False, nullable=False, default=to_unicode('write'))
    scope = Column(Unicode(32), unique=False, nullable=False, default=to_unicode('exclusive'))
    owner = Column(UnicodeText, unique=False, nullable=False)
    expire = Column(Float, unique=False, nullable=False)
    principal = Column(Unicode(255), ForeignKey('my_users.display_name', ondelete="CASCADE"))
    timeout = Column(Float, unique=False, nullable=False)


class Url2Token(object):
    __tablename__ = 'my_url2token'

    token = Column(UnicodeText, primary_key=True, unique=True, nullable=False)
    path = Column(UnicodeText, primary_key=True, unique=False, nullable=False)

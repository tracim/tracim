# -*- coding: utf-8 -*-
"""
Auth* related model.

This is where the models used by the authentication stack are defined.

It's perfectly fine to re-use this definition in the pboard application,
though.

"""
import os
from datetime import datetime
from hashlib import sha256
from sqlalchemy.sql.functions import session_user

__all__ = ['User', 'Group', 'Permission']

from sqlalchemy import Table, ForeignKey, Column
from sqlalchemy.types import Unicode, Integer, DateTime, Boolean
from sqlalchemy.orm import relation, relationship, synonym

from pboard.model import DeclarativeBase, metadata, DBSession

# This is the association table for the many-to-many relationship between
# groups and permissions.
group_permission_table = Table('pod_group_permission', metadata,
    Column('group_id', Integer, ForeignKey('pod_group.group_id',
        onupdate="CASCADE", ondelete="CASCADE"), primary_key=True),
    Column('permission_id', Integer, ForeignKey('pod_permission.permission_id',
        onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)
)

# This is the association table for the many-to-many relationship between
# groups and members - this is, the memberships.
user_group_table = Table('pod_user_group', metadata,
    Column('user_id', Integer, ForeignKey('pod_user.user_id',
        onupdate="CASCADE", ondelete="CASCADE"), primary_key=True),
    Column('group_id', Integer, ForeignKey('pod_group.group_id',
        onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)
)




class Rights(DeclarativeBase):

    READ_ACCESS = 1
    WRITE_ACCESS = 2

    __tablename__ = 'pod_group_node'

    group_id = Column(Integer, ForeignKey('pod_group.group_id'), primary_key=True)
    node_id = Column(Integer, ForeignKey('pod_nodes.node_id'), primary_key=True)
    rights = Column(Integer)

    def hasReadAccess(self):
        return self.rights & Rights.READ_ACCESS

    def hasWriteAccess(self):
        return self.rights & Rights.WRITE_ACCESS



class Group(DeclarativeBase):

    __tablename__ = 'pod_group'

    group_id = Column(Integer, autoincrement=True, primary_key=True)
    group_name = Column(Unicode(16), unique=True, nullable=False)
    display_name = Column(Unicode(255))
    created = Column(DateTime, default=datetime.now)
    personnal_group = Column(Boolean)

    users = relationship('User', secondary=user_group_table, backref='groups')

    _lRights = relationship('Rights', backref='_oGroup', cascade = "all, delete-orphan")



    def __repr__(self):
        return '<Group: name=%s>' % repr(self.group_name)

    def __unicode__(self):
        return self.group_name

    @classmethod
    def by_group_name(cls, group_name):
        """Return the user object whose email address is ``email``."""
        return DBSession.query(cls).filter_by(group_name=group_name).first()

    def getDisplayName(self) -> str:
        if self.group_id<0:
            # FIXME - D.A. - 2014-05-19 - MAKE THIS CODE CLEANER,
            try:
                return self.users[0].getDisplayName()
            except:
                print('ERROR GROUP =>', self.group_id)


        return self.display_name

    @property
    def rights(self):
        return self._lRights

    def hasSomeAccess(self, poNode):
        for loRight in self._lRights:
            if loRight.node_id == poNode.node_id and loRight.rights>0:
                return True
        return False



class User(DeclarativeBase):
    """
    User definition.

    This is the user definition used by :mod:`repoze.who`, which requires at
    least the ``email_address`` column.

    """
    __tablename__ = 'pod_user'

    user_id = Column(Integer, autoincrement=True, primary_key=True)
    email_address = Column(Unicode(255), unique=True, nullable=False)
    display_name = Column(Unicode(255))
    _password = Column('password', Unicode(128))
    created = Column(DateTime, default=datetime.now)

    def __repr__(self):
        return '<User: email=%s, display=%s>' % (
                repr(self.email_address), repr(self.display_name))

    def __unicode__(self):
        return self.display_name or self.email_address

    @property
    def permissions(self):
        """Return a set with all permissions granted to the user."""
        perms = set()
        for g in self.groups:
            perms = perms | set(g.permissions)
        return perms

    @classmethod
    def by_email_address(cls, email):
        """Return the user object whose email address is ``email``."""
        return DBSession.query(cls).filter_by(email_address=email).first()

    @classmethod
    def by_user_name(cls, username):
        """Return the user object whose user name is ``username``."""
        return DBSession.query(cls).filter_by(email_address=username).first()

    @classmethod
    def _hash_password(cls, password):
        salt = sha256()
        salt.update(os.urandom(60))
        salt = salt.hexdigest()

        hash = sha256()
        # Make sure password is a str because we cannot hash unicode objects
        hash.update((password + salt).encode('utf-8'))
        hash = hash.hexdigest()

        password = salt + hash

        # Make sure the hashed password is a unicode object at the end of the
        # process because SQLAlchemy _wants_ unicode objects for Unicode cols
        # FIXME - D.A. - 2013-11-20 - The following line has been removed since using python3. Is this normal ?!
        # password = password.decode('utf-8')

        return password

    def _set_password(self, password):
        """Hash ``password`` on the fly and store its hashed version."""
        self._password = self._hash_password(password)

    def _get_password(self):
        """Return the hashed version of the password."""
        return self._password

    password = synonym('_password', descriptor=property(_get_password,
                                                        _set_password))

    def validate_password(self, password):
        """
        Check the password against existing credentials.

        :param password: the password that was provided by the user to
            try and authenticate. This is the clear text version that we will
            need to match against the hashed one in the database.
        :type password: unicode object.
        :return: Whether the password is valid.
        :rtype: bool

        """
        hash = sha256()
        hash.update((password + self.password[:64]).encode('utf-8'))
        return self.password[64:] == hash.hexdigest()

    def getDisplayName(self):
        if self.display_name!=None and self.display_name!='':
            return self.display_name
        else:
            return self.email_address


class Permission(DeclarativeBase):
    """
    Permission definition.

    Only the ``permission_name`` column is required.

    """

    __tablename__ = 'pod_permission'


    permission_id = Column(Integer, autoincrement=True, primary_key=True)
    permission_name = Column(Unicode(63), unique=True, nullable=False)
    description = Column(Unicode(255))

    groups = relation(Group, secondary=group_permission_table,
                      backref='permissions')

    def __repr__(self):
        return '<Permission: name=%s>' % repr(self.permission_name)

    def __unicode__(self):
        return self.permission_name

# -*- coding: utf-8 -*-
"""
Auth* related model.

This is where the models used by the authentication stack are defined.

It's perfectly fine to re-use this definition in the tracim application,
though.

"""
import uuid

import os
from datetime import datetime
import time
from hashlib import sha256
from slugify import slugify
from sqlalchemy.ext.hybrid import hybrid_property
from tg.i18n import lazy_ugettext as l_

__all__ = ['User', 'Group', 'Permission']

from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Sequence
from sqlalchemy import Table

from sqlalchemy.types import Unicode
from sqlalchemy.types import Integer
from sqlalchemy.types import DateTime
from sqlalchemy.types import Boolean
from sqlalchemy.orm import relation, relationship, synonym
from tg import request
from tracim.model import DeclarativeBase, metadata, DBSession

# This is the association table for the many-to-many relationship between
# groups and permissions.
group_permission_table = Table('group_permission', metadata,
    Column('group_id', Integer, ForeignKey('groups.group_id',
        onupdate="CASCADE", ondelete="CASCADE"), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.permission_id',
        onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)
)

# This is the association table for the many-to-many relationship between
# groups and members - this is, the memberships.
user_group_table = Table('user_group', metadata,
    Column('user_id', Integer, ForeignKey('users.user_id',
        onupdate="CASCADE", ondelete="CASCADE"), primary_key=True),
    Column('group_id', Integer, ForeignKey('groups.group_id',
        onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)
)

class Group(DeclarativeBase):

    TIM_NOBODY = 0
    TIM_USER = 1
    TIM_MANAGER = 2
    TIM_ADMIN = 3

    TIM_NOBODY_GROUPNAME = 'nobody'
    TIM_USER_GROUPNAME = 'users'
    TIM_MANAGER_GROUPNAME = 'managers'
    TIM_ADMIN_GROUPNAME = 'administrators'

    __tablename__ = 'groups'

    group_id = Column(Integer, Sequence('seq__groups__group_id'), autoincrement=True, primary_key=True)
    group_name = Column(Unicode(16), unique=True, nullable=False)
    display_name = Column(Unicode(255))
    created = Column(DateTime, default=datetime.now)

    users = relationship('User', secondary=user_group_table, backref='groups')

    def __repr__(self):
        return '<Group: name=%s>' % repr(self.group_name)

    def __unicode__(self):
        return self.group_name

    @classmethod
    def by_group_name(cls, group_name):
        """Return the user object whose email address is ``email``."""
        return DBSession.query(cls).filter_by(group_name=group_name).first()



class Profile(object):
    """ This model is the "max" group associated to a given user
    """

    _NAME = [Group.TIM_NOBODY_GROUPNAME,
             Group.TIM_USER_GROUPNAME,
             Group.TIM_MANAGER_GROUPNAME,
             Group.TIM_ADMIN_GROUPNAME]

    _LABEL = [l_('Nobody'),
              l_('Users'),
              l_('Global managers'),
              l_('Administrators')]

    def __init__(self, profile_id):
        assert isinstance(profile_id, int)
        self.id = profile_id
        self.name = Profile._NAME[profile_id]
        self.label = Profile._LABEL[profile_id]



class User(DeclarativeBase):
    """
    User definition.

    This is the user definition used by :mod:`repoze.who`, which requires at
    least the ``email`` column.

    """
    __tablename__ = 'users'

    user_id = Column(Integer, Sequence('seq__users__user_id'), autoincrement=True, primary_key=True)
    email = Column(Unicode(255), unique=True, nullable=False)
    display_name = Column(Unicode(255))
    _password = Column('password', Unicode(128))
    created = Column(DateTime, default=datetime.now)
    is_active = Column(Boolean, default=True, nullable=False)
    imported_from = Column(Unicode(32), nullable=True)
    auth_token = Column(Unicode(255))
    auth_token_created = Column(DateTime)

    @hybrid_property
    def email_address(self):
        return self.email

    def __repr__(self):
        return '<User: email=%s, display=%s>' % (
                repr(self.email), repr(self.display_name))

    def __unicode__(self):
        return self.display_name or self.email

    @property
    def permissions(self):
        """Return a set with all permissions granted to the user."""
        perms = set()
        for g in self.groups:
            perms = perms | set(g.permissions)
        return perms

    @property
    def profile(self) -> Profile:
        profile_id = 0
        if len(self.groups)>0:
            profile_id = max(group.group_id for group in self.groups)
        return Profile(profile_id)

    @property
    def calendar_url(self) -> str:
        # TODO - 20160531 - Bastien: Cyclic import if import in top of file
        from tracim.lib.calendar import CalendarManager
        calendar_manager = CalendarManager(None)

        return calendar_manager.get_user_calendar_url(self.user_id)

    @classmethod
    def by_email_address(cls, email):
        """Return the user object whose email address is ``email``."""
        return DBSession.query(cls).filter_by(email=email).first()

    @classmethod
    def by_user_name(cls, username):
        """Return the user object whose user name is ``username``."""
        return DBSession.query(cls).filter_by(email=username).first()

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
        if not self.password:
            return False
        hash = sha256()
        hash.update((password + self.password[:64]).encode('utf-8'))
        return self.password[64:] == hash.hexdigest()

    def get_display_name(self, remove_email_part=False):
        """
        :param remove_email_part: If True and display name based on email,
         remove @xxx.xxx part of email in returned value
        :return: display name based on user name or email.
        """
        if self.display_name!=None and self.display_name!='':
            return self.display_name
        else:
            if remove_email_part:
                at_pos = self.email.index('@')
                return self.email[0:at_pos]
            return self.email

    def get_role(self, workspace: 'Workspace') -> int:
        for role in self.roles:
            if role.workspace == workspace:
                return role.role

        from tracim.model.data import UserRoleInWorkspace
        return UserRoleInWorkspace.NOT_APPLICABLE

    def ensure_auth_token(self) -> None:
        """
        Create auth_token if None, regenerate auth_token if too much old.
        auth_token validity is set in
        :return:
        """
        from tracim.config.app_cfg import CFG
        validity_seconds = CFG.get_instance().USER_AUTH_TOKEN_VALIDITY

        if not self.auth_token or not self.auth_token_created:
            self.auth_token = uuid.uuid4()
            self.auth_token_created = datetime.utcnow()
            DBSession.flush()
            return

        now_seconds = time.mktime(datetime.utcnow().timetuple())
        auth_token_seconds = time.mktime(self.auth_token_created.timetuple())
        difference = now_seconds - auth_token_seconds

        if difference > validity_seconds:
            self.auth_token = uuid.uuid4()
            self.auth_token_created = datetime.utcnow()
            DBSession.flush()


class Permission(DeclarativeBase):
    """
    Permission definition.

    Only the ``permission_name`` column is required.

    """

    __tablename__ = 'permissions'


    permission_id = Column(Integer, Sequence('seq__permissions__permission_id'), autoincrement=True, primary_key=True)
    permission_name = Column(Unicode(63), unique=True, nullable=False)
    description = Column(Unicode(255))

    groups = relation(Group, secondary=group_permission_table,
                      backref='permissions')

    def __repr__(self):
        return '<Permission: name=%s>' % repr(self.permission_name)

    def __unicode__(self):
        return self.permission_name


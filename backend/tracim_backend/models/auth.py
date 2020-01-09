# -*- coding: utf-8 -*-
"""
Auth* related model.

This is where the models used by the authentication stack are defined.

It's perfectly fine to re-use this definition in the tracim application,
though.
"""
from datetime import datetime
import enum
from hashlib import sha256
import os
import time
import typing
from typing import TYPE_CHECKING
import uuid

import sqlalchemy
from sqlalchemy import BigInteger
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Sequence
from sqlalchemy import Table
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relation
from sqlalchemy.orm import relationship
from sqlalchemy.orm import synonym
from sqlalchemy.types import Boolean
from sqlalchemy.types import DateTime
from sqlalchemy.types import Enum
from sqlalchemy.types import Integer
from sqlalchemy.types import Unicode

from tracim_backend.exceptions import ExpiredResetPasswordToken
from tracim_backend.exceptions import ProfileDoesNotExist
from tracim_backend.exceptions import UnvalidResetPasswordToken
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.models.meta import metadata

if TYPE_CHECKING:
    from tracim_backend.models.data import Workspace
    from tracim_backend.models.data import UserRoleInWorkspace
__all__ = ["User", "Group", "Permission"]

# This is the association table for the many-to-many relationship between
# groups and permissions.
group_permission_table = Table(
    "group_permission",
    metadata,
    Column(
        "group_id",
        Integer,
        ForeignKey("groups.group_id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "permission_id",
        Integer,
        ForeignKey("permissions.permission_id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    ),
)

# This is the association table for the many-to-many relationship between
# groups and members - this is, the memberships.
user_group_table = Table(
    "user_group",
    metadata,
    Column(
        "user_id",
        Integer,
        ForeignKey("users.user_id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "group_id",
        Integer,
        ForeignKey("groups.group_id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class AuthType(enum.Enum):
    INTERNAL = "internal"
    LDAP = "ldap"
    UNKNOWN = "unknown"
    REMOTE = "remote"


class Profile(enum.Enum):
    """This model is the "max" group associated to a given user."""

    NOBODY = (0, "nobody")
    USER = (1, "users")
    TRUSTED_USER = (2, "trusted-users")
    ADMIN = (3, "administrators")

    def __init__(self, profile_id: int, slug: str):
        self.id = profile_id
        self.slug = slug

    @classmethod
    def get_all_valid_slugs(cls, include_nobody: bool = False):
        if include_nobody:
            return [item.slug for item in list(cls)]
        return [item.slug for item in list(cls) if item.id > 0]

    @classmethod
    def get_profile_from_id(cls, id: int):
        profiles = [item for item in list(cls) if item.id == id]
        if len(profiles) != 1:
            raise ProfileDoesNotExist()
        return profiles[0]

    @classmethod
    def get_profile_from_slug(cls, slug: str):
        profiles = [item for item in list(cls) if item.slug == slug]
        if len(profiles) != 1:
            raise ProfileDoesNotExist()
        return profiles[0]


class Group(DeclarativeBase):

    # TODO - G.M - 2019-10-08 - remove use of this legacy code
    # (needed for retrocompat)
    TIM_USER = Profile.USER.id
    TIM_MANAGER = Profile.TRUSTED_USER.id
    TIM_ADMIN = Profile.ADMIN.id

    TIM_USER_GROUPNAME = "users"
    TIM_MANAGER_GROUPNAME = "trusted-users"
    TIM_ADMIN_GROUPNAME = "administrators"

    __tablename__ = "groups"

    group_id = Column(
        Integer, Sequence("seq__groups__group_id"), autoincrement=True, primary_key=True
    )
    group_name = Column(Unicode(16), unique=True, nullable=False)
    display_name = Column(Unicode(255))
    created = Column(DateTime, default=datetime.utcnow)
    users = relationship("User", secondary=user_group_table, backref="groups")

    def __repr__(self):
        return "<Group: name=%s>" % repr(self.group_name)

    def __unicode__(self):
        return self.group_name

    @classmethod
    def by_group_name(cls, group_name, dbsession):
        """Return the user object whose email address is ``email``."""
        return dbsession.query(cls).filter_by(group_name=group_name).first()


class User(DeclarativeBase):
    """
    User definition.

    This is the user definition used by :mod:`repoze.who`, which requires at
    least the ``email`` column.
    """

    MIN_PASSWORD_LENGTH = 6
    MAX_PASSWORD_LENGTH = 512
    MAX_HASHED_PASSWORD_LENGTH = 128
    MIN_PUBLIC_NAME_LENGTH = 3
    MAX_PUBLIC_NAME_LENGTH = 255
    MIN_EMAIL_LENGTH = 3
    MAX_EMAIL_LENGTH = 255
    MAX_IMPORTED_FROM_LENGTH = 32
    MAX_TIMEZONE_LENGTH = 32
    MIN_LANG_LENGTH = 2
    MAX_LANG_LENGTH = 3
    MAX_AUTH_TOKEN_LENGTH = 255
    MAX_RESET_PASSWORD_TOKEN_HASH_LENGTH = 255
    DEFAULT_ALLOWED_SPACE = 0

    __tablename__ = "users"
    # INFO - G.M - 2018-10-24 - force table to use utf8 instead of
    # utf8bm4 for mysql only in order to avoid max length of key issue with
    # long varchar in utf8bm4 column. This issue is related to email
    # field and is uniqueness. As far we search, there is to be no way to apply
    # mysql specific (which is ignored by other database)
    #  collation only on email field.
    __table_args__ = {"mysql_charset": "utf8", "mysql_collate": "utf8_general_ci"}

    user_id = Column(Integer, Sequence("seq__users__user_id"), autoincrement=True, primary_key=True)
    email = Column(Unicode(MAX_EMAIL_LENGTH), unique=True, nullable=False)
    display_name = Column(Unicode(MAX_PUBLIC_NAME_LENGTH))
    _password = Column("password", Unicode(MAX_HASHED_PASSWORD_LENGTH), nullable=True)
    created = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False,
        server_default=sqlalchemy.sql.expression.literal(False),
    )
    imported_from = Column(Unicode(MAX_IMPORTED_FROM_LENGTH), nullable=True)
    # timezone as tz database format
    timezone = Column(Unicode(MAX_TIMEZONE_LENGTH), nullable=False, server_default="")
    # lang in iso639 format
    auth_type = Column(Enum(AuthType), nullable=False, server_default=AuthType.INTERNAL.name)
    lang = Column(Unicode(MAX_LANG_LENGTH), nullable=True, default=None)
    # TODO - G.M - 04-04-2018 - [auth] Check if this is already needed
    # with new auth system
    # TODO - G.M - 2018-08-22 - Think about hash instead of direct token
    auth_token = Column(Unicode(MAX_AUTH_TOKEN_LENGTH))
    auth_token_created = Column(DateTime)
    reset_password_token_hash = Column(
        Unicode(MAX_RESET_PASSWORD_TOKEN_HASH_LENGTH), nullable=True, default=None
    )
    reset_password_token_created = Column(DateTime, nullable=True, default=None)
    allowed_space = Column(BigInteger, nullable=False, server_default=str(DEFAULT_ALLOWED_SPACE))

    @hybrid_property
    def email_address(self):
        return self.email

    def __repr__(self):
        return "<User: email=%s, display=%s>" % (repr(self.email), repr(self.display_name))

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
        if len(self.groups) > 0:
            profile_id = max(group.group_id for group in self.groups)
        return Profile.get_profile_from_id(profile_id)

    @classmethod
    def by_email_address(cls, email, dbsession):
        """Return the user object whose email address is ``email``."""
        return dbsession.query(cls).filter_by(email=email).first()

    @classmethod
    def by_user_name(cls, username, dbsession):
        """Return the user object whose user name is ``username``."""
        return dbsession.query(cls).filter_by(email=username).first()

    def _set_password(self, cleartext_password: typing.Optional[str]) -> None:
        """
        Set ciphertext password from cleartext password.

        Hash cleartext password on the fly,
        Store its ciphertext version,
        """
        if cleartext_password is None:
            self._password = None
        else:
            self._password = self._hash(cleartext_password)

    def _get_password(self) -> str:
        """Return the hashed version of the password."""
        return self._password

    password = synonym("_password", descriptor=property(_get_password, _set_password))

    def validate_password(self, cleartext_password: typing.Optional[str]) -> bool:
        """
        Check the password against existing credentials.

        :param cleartext_password: the password that was provided by the user
            to try and authenticate. This is the clear text version that we
            will need to match against the hashed one in the database.
        :type cleartext_password: unicode object.
        :return: Whether the password is valid.
        :rtype: bool
        """

        if not self.password:
            return False
        return self._validate_hash(self.password, cleartext_password)

    def get_display_name(self, remove_email_part: bool = False) -> str:
        """
        Get a name to display from corresponding member or email.

        :param remove_email_part: If True and display name based on email,
            remove @xxx.xxx part of email in returned value
        :return: display name based on user name or email.
        """
        if self.display_name:
            return self.display_name
        else:
            if remove_email_part:
                at_pos = self.email.index("@")
                return self.email[0:at_pos]
            return self.email

    def get_role(self, workspace: "Workspace") -> int:
        for role in self.roles:
            if role.workspace == workspace:
                return role.role

        return UserRoleInWorkspace.NOT_APPLICABLE

    def get_active_roles(self) -> ["UserRoleInWorkspace"]:
        """
        :return: list of roles of the user for all not-deleted workspaces
        """
        roles = []
        for role in self.roles:
            if not role.workspace.is_deleted:
                roles.append(role)
        return roles

    # Tokens ###

    def reset_tokens(self):
        self._generate_auth_token()
        # disable reset_password token
        self.reset_password_token_hash = None
        self.reset_password_token_created = None

    # Reset Password Tokens #
    def generate_reset_password_token(self) -> str:
        (
            reset_password_token,
            self.reset_password_token_created,
            self.reset_password_token_hash,
        ) = self._generate_token(create_hash=True)
        return reset_password_token

    def validate_reset_password_token(self, token, validity_seconds) -> bool:
        if not self.reset_password_token_created:
            raise UnvalidResetPasswordToken(
                "reset password token is unvalid due to unknown creation date"
            )
        if not self._validate_date(self.reset_password_token_created, validity_seconds):
            raise ExpiredResetPasswordToken("reset password token has expired")
        if not self._validate_hash(self.reset_password_token_hash, token):
            raise UnvalidResetPasswordToken("reset password token is unvalid")
        return True

    # Auth Token #
    # TODO - G.M - 04-04-2018 - [auth] Check if this is already needed
    # with new auth system

    def _generate_auth_token(self) -> str:
        self.auth_token, self.auth_token_created, _ = self._generate_token()
        return self.auth_token

    # TODO - G.M - 2018-08-23 - Should we store hash instead of direct stored
    # auth token ?
    def validate_auth_token(self, token, validity_seconds) -> bool:
        return self.ensure_auth_token(validity_seconds) == token

    def ensure_auth_token(self, validity_seconds) -> str:
        """
        Create auth_token if None, regenerate auth_token if too much old.
        auth_token validity is set in
        :return: actual valid auth token
        """

        if not self.auth_token or not self.auth_token_created:
            self._generate_auth_token()
            return self.auth_token

        if not self._validate_date(self.auth_token_created, validity_seconds):
            self._generate_auth_token()

        return self.auth_token

    # Utils functions #

    @classmethod
    def _hash(cls, cleartext_password_or_token: str) -> str:
        salt = sha256()
        salt.update(os.urandom(60))
        salt = salt.hexdigest()

        hashed = sha256()
        # Make sure password is a str because we cannot hash unicode objects
        hashed.update((cleartext_password_or_token + salt).encode("utf-8"))
        hashed = hashed.hexdigest()

        ciphertext_password = salt + hashed

        # Make sure the hashed password is a unicode object at the end of the
        # process because SQLAlchemy _wants_ unicode objects for Unicode cols
        # FIXME - D.A. - 2013-11-20 - The following line has been removed since using python3. Is this normal ?!
        # password = password.decode('utf-8')

        return ciphertext_password

    @classmethod
    def _validate_hash(cls, hashed: str, cleartext_password_or_token: str) -> bool:
        result = False
        if hashed:
            new_hash = sha256()
            new_hash.update((cleartext_password_or_token + hashed[:64]).encode("utf-8"))
            result = hashed[64:] == new_hash.hexdigest()
        return result

    @classmethod
    def _generate_token(
        cls, create_hash=False
    ) -> typing.Union[str, datetime, typing.Optional[str]]:
        token = str(uuid.uuid4().hex)
        creation_datetime = datetime.utcnow()
        hashed_token = None
        if create_hash:
            hashed_token = cls._hash(token)
        return token, creation_datetime, hashed_token

    @classmethod
    def _validate_date(cls, date: datetime, validity_seconds: int) -> bool:
        if not date:
            return False
        now_seconds = time.mktime(datetime.utcnow().timetuple())
        auth_token_seconds = time.mktime(date.timetuple())
        difference = now_seconds - auth_token_seconds

        if difference > validity_seconds:
            return False
        return True


class Permission(DeclarativeBase):
    """
    Permission definition.

    Only the ``permission_name`` column is required.

    """

    __tablename__ = "permissions"

    permission_id = Column(
        Integer, Sequence("seq__permissions__permission_id"), autoincrement=True, primary_key=True
    )
    permission_name = Column(Unicode(63), unique=True, nullable=False)
    description = Column(Unicode(255))

    groups = relation(Group, secondary=group_permission_table, backref="permissions")

    def __repr__(self):
        return "<Permission: name=%s>" % repr(self.permission_name)

    def __unicode__(self):
        return self.permission_name

import enum
from hashlib import sha256
import os
import typing

import sqlalchemy
from sqlalchemy import Boolean
from sqlalchemy import Column
from sqlalchemy import DateTime
from sqlalchemy import Enum
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import Sequence
from sqlalchemy import Unicode
from sqlalchemy.orm import relationship
from sqlalchemy.orm import synonym

from tracim_backend.models.auth import User
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.models.mixins import CreationDateMixin


class ContentShareType(enum.Enum):
    EMAIL = "email"
    PUBLIC_LINK = "public-link"


class ContentShare(CreationDateMixin, DeclarativeBase):

    MIN_PASSWORD_LENGTH = 6
    MAX_PASSWORD_LENGTH = 512
    MIN_EMAIL_LENGTH = 3
    MAX_EMAIL_LENGTH = 255
    MAX_SHARE_TOKEN_LENGTH = 255
    MAX_GROUP_SHARE_ID_LENGTH = 255
    MAX_HASHED_PASSWORD_LENGTH = 128

    __tablename__ = "content_shares"

    share_id = Column(
        Integer, Sequence("seq__content_shares__share_id"), autoincrement=True, primary_key=True
    )
    content_id = Column(Integer, ForeignKey("content.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    email = Column(Unicode(MAX_EMAIL_LENGTH), nullable=False)
    share_token = Column(Unicode(MAX_SHARE_TOKEN_LENGTH), nullable=False)
    share_group_uuid = Column(Unicode(MAX_GROUP_SHARE_ID_LENGTH), nullable=False)
    type = Column(Enum(ContentShareType), nullable=False)
    _password = Column("password", Unicode(MAX_HASHED_PASSWORD_LENGTH), nullable=True)
    enabled = Column(
        Boolean,
        unique=False,
        nullable=False,
        default=True,
        server_default=sqlalchemy.sql.expression.literal(True),
    )
    disabled = Column(DateTime, unique=False, nullable=True, default=None)
    author = relationship("User", remote_side=[User.user_id])

    @classmethod
    def _hash(cls, cleartext_password_or_token: str) -> str:
        """ Hash method to create hash from string """
        salt = sha256()
        salt.update(os.urandom(60))
        salt = salt.hexdigest()

        hashed = sha256()
        # Make sure password is a str because we cannot hash unicode objects
        hashed.update((cleartext_password_or_token + salt).encode("utf-8"))
        hashed = hashed.hexdigest()

        ciphertext_password = salt + hashed
        return ciphertext_password

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

    @classmethod
    def _validate_hash(cls, hashed: str, cleartext_password_or_token: str) -> bool:
        result = False
        if hashed:
            new_hash = sha256()
            new_hash.update((cleartext_password_or_token + hashed[:64]).encode("utf-8"))
            result = hashed[64:] == new_hash.hexdigest()
        return result

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

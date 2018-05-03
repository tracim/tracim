# coding=utf-8
import typing
from datetime import datetime

from sqlalchemy.orm import Session
from tracim import CFG
from tracim.models import User
from tracim.models.auth import Profile


class LoginCredentials(object):
    """
    Login credentials model for login
    """

    def __init__(self, email: str, password: str):
        self.email = email
        self.password = password


class UserInContext(object):
    """
    Interface to get User data and User data related to context.
    """

    def __init__(self, user: User, dbsession: Session, config: CFG):
        self.user = user
        self.dbsession = dbsession
        self.config = config

    # Default

    @property
    def email(self) -> str:
        return self.user.email

    @property
    def user_id(self) -> int:
        return self.user.user_id

    @property
    def display_name(self) -> str:
        return self.user.display_name

    @property
    def created(self) -> datetime:
        return self.user.created

    @property
    def is_active(self) -> bool:
        return self.user.is_active

    @property
    def timezone(self) -> str:
        return self.user.timezone

    @property
    def profile(self) -> Profile:
        return self.user.profile

    # Context related

    @property
    def calendar_url(self) -> typing.Optional[str]:
        # TODO - G-M - 20-04-2018 - [Calendar] Replace calendar code to get
        # url calendar url.
        #
        # from tracim.lib.calendar import CalendarManager
        # calendar_manager = CalendarManager(None)
        # return calendar_manager.get_workspace_calendar_url(self.workspace_id)
        return None

    @property
    def avatar_url(self) -> typing.Optional[str]:
        # TODO - G-M - 20-04-2018 - [Avatar] Add user avatar feature
        return None

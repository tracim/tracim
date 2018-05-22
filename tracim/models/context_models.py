# coding=utf-8
import typing
from datetime import datetime

from slugify import slugify
from sqlalchemy.orm import Session
from tracim import CFG
from tracim.models import User
from tracim.models.auth import Profile
from tracim.models.data import Workspace
from tracim.models.workspace_menu_entries import default_workspace_menu_entry, \
    WorkspaceMenuEntry


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


class WorkspaceInContext(object):
    """
    Interface to get Workspace data and Workspace data related to context.
    """

    def __init__(self, workspace: Workspace, dbsession: Session, config: CFG):
        self.workspace = workspace
        self.dbsession = dbsession
        self.config = config

    @property
    def workspace_id(self) -> int:
        """
        numeric id of the workspace.
        """
        return self.workspace.workspace_id

    @property
    def id(self) -> int:
        """
        alias of workspace_id
        """
        return self.workspace_id

    @property
    def label(self) -> str:
        """
        get workspace label
        """
        return self.workspace.label

    @property
    def description(self) -> str:
        """
        get workspace description
        """
        return self.workspace.description

    @property
    def slug(self) -> str:
        """
        get workspace slug
        """
        return slugify(self.workspace.label)

    @property
    def sidebar_entries(self) -> typing.List[WorkspaceMenuEntry]:
        """
        get sidebar entries, those depends on activated apps.
        """
        # TODO - G.M - 22-05-2018 - Rework on this in
        # order to not use hardcoded list
        # list should be able to change (depending on activated/disabled
        # apps)
        return default_workspace_menu_entry(self.workspace)

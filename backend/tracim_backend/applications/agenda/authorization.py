# coding: utf-8

from pyramid.events import NewResponse

from tracim_backend.applications.agenda.utils.determiner import CaldavAuthorizationDeterminer
from tracim_backend.applications.agenda.utils.utils import DavAuthorization
from tracim_backend.error import ErrorCode
from tracim_backend.exceptions import CaldavNotAuthenticated
from tracim_backend.exceptions import CaldavNotAuthorized
from tracim_backend.exceptions import NotAuthenticated
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import UserGivenIsNotTheSameAsAuthenticated
from tracim_backend.exceptions import WorkspaceAgendaDisabledException
from tracim_backend.exceptions import WorkspaceNotFound
from tracim_backend.lib.utils.authorization import AndAuthorizationChecker
from tracim_backend.lib.utils.authorization import AuthorizationChecker
from tracim_backend.lib.utils.authorization import CandidateIsCurrentUserChecker
from tracim_backend.lib.utils.authorization import is_content_manager
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.lib.utils.request import TracimRequest


def add_www_authenticate_header_for_caldav(config):
    config.add_subscriber(add_www_authenticate_header_for_caldav_to_response, NewResponse)


def add_www_authenticate_header_for_caldav_to_response(event: NewResponse) -> None:
    """
    Add WWW-Authenticate header to response in case of CALDAV_NOT_AUTHENTICATED
    error.
    """
    request = event.request
    response = event.response
    if (
        request.exception
        and hasattr(request.exception, "error_code")
        and request.exception.error_code == ErrorCode.CALDAV_NOT_AUTHENTICATED
    ):
        response.headerlist.append(("WWW-Authenticate", 'Basic realm="Tracim credentials"'))


class CanAccessWorkspaceRootAgendaChecker(AuthorizationChecker):
    """
    Check current user have write access on current workspace:
        - in reading: must be reader
        - in writing or manager actions: must be content_manager
    """

    def __init__(self) -> None:
        self.caldav_auth_determiner = CaldavAuthorizationDeterminer()

    def check(self, tracim_context: "TracimRequest") -> bool:
        """
        :param tracim_context: Must be a TracimRequest because this checker only
        work in pyramid http request context.
        :return: true or raise Exception according to right.
        """
        # TODO - G.M - 2019-04-11 - place calendar activation outside of right context
        # see https://github.com/tracim/tracim/issues/1593
        if not tracim_context.current_workspace.agenda_enabled:
            raise WorkspaceAgendaDisabledException()
        if (
            self.caldav_auth_determiner.determine_requested_mode(tracim_context)
            == DavAuthorization.MANAGER
        ):
            raise CaldavNotAuthorized()
        if (
            self.caldav_auth_determiner.determine_requested_mode(tracim_context)
            == DavAuthorization.WRITE
        ):
            is_content_manager.check(tracim_context)
        elif (
            self.caldav_auth_determiner.determine_requested_mode(tracim_context)
            == DavAuthorization.READ
        ):
            is_reader.check(tracim_context)

        return True


class CanAccessWorkspaceEventAgendaChecker(AuthorizationChecker):
    """
    Check current user have write access on current workspace:
        - in reading: must be reader
        - in contribution: must be contributor
        - in managment action: must be content_manager
    """

    def __init__(self) -> None:
        self.caldav_auth_determiner = CaldavAuthorizationDeterminer()

    def check(self, tracim_context: "TracimRequest") -> bool:
        """
        :param tracim_context: Must be a TracimRequest because this checker only
        work in pyramid http request context.
        :return: true or raise Exception according to right.
        """
        # TODO - G.M - 2019-04-11 - place calendar activation outside of right context
        # see https://github.com/tracim/tracim/issues/1593
        if not tracim_context.current_workspace.agenda_enabled:
            raise WorkspaceAgendaDisabledException()
        if (
            self.caldav_auth_determiner.determine_requested_mode(tracim_context)
            == DavAuthorization.MANAGER
        ):
            is_content_manager.check(tracim_context)
        elif (
            self.caldav_auth_determiner.determine_requested_mode(tracim_context)
            == DavAuthorization.WRITE
        ):
            is_contributor.check(tracim_context)
        elif (
            self.caldav_auth_determiner.determine_requested_mode(tracim_context)
            == DavAuthorization.READ
        ):
            is_reader.check(tracim_context)

        return True


class CanAccessUserRootAgendaChecker(AuthorizationChecker):
    def __init__(self) -> None:
        self.caldav_auth_determiner = CaldavAuthorizationDeterminer()

    def check(self, tracim_context: "TracimRequest") -> bool:
        """
        :param tracim_context: Must be a TracimRequest because this checker only
        work in pyramid http request context.
        :return: true or raise Exception according to right.
        """
        if (
            self.caldav_auth_determiner.determine_requested_mode(tracim_context)
            == DavAuthorization.MANAGER
        ):
            raise CaldavNotAuthorized()
        return True


class CaldavChecker(AuthorizationChecker):
    """
    Wrapper for NotAuthenticated case
    """

    def __init__(self, checker: AuthorizationChecker) -> None:
        self.checker = checker

    def check(self, tracim_context: TracimContext) -> bool:
        try:
            return self.checker.check(tracim_context)
        except NotAuthenticated as exc:
            raise CaldavNotAuthenticated() from exc
        except (UserGivenIsNotTheSameAsAuthenticated, UserDoesNotExist, WorkspaceNotFound) as exc:
            raise CaldavNotAuthorized() from exc


can_access_workspace_root_agenda = CaldavChecker(CanAccessWorkspaceRootAgendaChecker())
can_access_workspace_event_agenda = CaldavChecker(CanAccessWorkspaceEventAgendaChecker())
can_access_user_agenda_event = CaldavChecker(CandidateIsCurrentUserChecker())
can_access_user_root_agenda = CaldavChecker(
    AndAuthorizationChecker(CandidateIsCurrentUserChecker(), CanAccessUserRootAgendaChecker())
)
can_access_to_agenda_list = CaldavChecker(is_user)

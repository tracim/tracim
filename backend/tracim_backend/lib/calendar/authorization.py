# coding: utf-8

from pyramid.events import NewResponse

from tracim_backend.error import ErrorCode
from tracim_backend.exceptions import CaldavNotAuthenticated
from tracim_backend.exceptions import CaldavNotAuthorized
from tracim_backend.exceptions import NotAuthenticated
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import UserGivenIsNotTheSameAsAuthenticated
from tracim_backend.exceptions import WorkspaceCalendarDisabled
from tracim_backend.exceptions import WorkspaceNotFound
from tracim_backend.lib.calendar.determiner import \
    CaldavAuthorizationDeterminer
from tracim_backend.lib.calendar.utils import DavAuthorization
from tracim_backend.lib.utils.authorization import AuthorizationChecker
from tracim_backend.lib.utils.authorization import SameUserChecker
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.lib.utils.request import TracimRequest


def add_www_authenticate_header_for_caldav(config):
    config.add_subscriber(
        add_www_authenticate_header_for_caldav_to_response,
        NewResponse
    )


def add_www_authenticate_header_for_caldav_to_response(event):
    """
    Add WWW-Authenticate header to response in case of CALDAV_NOT_AUTHENTICATED
    error.
    """
    request = event.request
    response = event.response
    if request.exception and \
        hasattr(request.exception, 'error_code') and \
        request.exception.error_code == ErrorCode.CALDAV_NOT_AUTHENTICATED:
        response.headerlist.append(
            ('WWW-Authenticate', 'Basic realm="Tracim credentials"')
        )


class CanAccessWorkspaceCalendarChecker(AuthorizationChecker):
    """
    Check current user have write access on current workspace:
        - in reading: must be reader
        - in writing: must be contributor
    """
    def __init__(self) -> None:
        self._authorization = CaldavAuthorizationDeterminer()

    def check(
            self,
            tracim_context: "TracimRequest"
    ) -> bool:
        """
        :param tracim_context: Must be a TracimRequest because this checker only
        work in pyramid http request context.
        :return: bool
        """
        if not tracim_context.current_workspace.calendar_enabled:
            raise WorkspaceCalendarDisabled()
        if self._authorization.determine_requested_mode(tracim_context) == \
                DavAuthorization.WRITE:
            is_contributor.check(tracim_context)
        else:
            is_reader.check(tracim_context)

        return True


class CaldavChecker(AuthorizationChecker):
    """
    Wrapper for NotAuthenticated case
    """
    def __init__(self, checker) -> None:
        self.checker = checker

    def check(
        self,
        tracim_context: TracimContext
    ):
        try:
            return self.checker.check(tracim_context)
        except NotAuthenticated as exc:
            raise CaldavNotAuthenticated() from exc
        except (UserGivenIsNotTheSameAsAuthenticated, UserDoesNotExist, WorkspaceNotFound) as exc:
            raise CaldavNotAuthorized() from exc


can_access_workspace_calendar = CaldavChecker(
    CanAccessWorkspaceCalendarChecker()
)
can_access_user_calendar = CaldavChecker(SameUserChecker())
can_access_to_calendar_list = CaldavChecker(is_user)

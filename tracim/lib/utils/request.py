from contextlib import contextmanager

from pyramid.decorator import reify
from pyramid.request import Request

from tracim.models import User
from tracim.models.data import Workspace
from tracim.lib.utils.auth import get_safe_user
from tracim.lib.utils.auth import get_workspace


class TracimRequest(Request):
    def __init__(
            self,
            environ,
            charset=None,
            unicode_errors=None,
            decode_param_names=None,
            **kw
    ):
        super().__init__(
            environ,
            charset,
            unicode_errors,
            decode_param_names,
            **kw
        )
        self._current_workspace = None  # type: Workspace
        self._current_user = None  # type: User

    @property
    def current_workspace(self) -> Workspace:
        if self._current_workspace is None:
            self.current_workspace = get_workspace(self.current_user, self)
        return self._current_workspace

    @current_workspace.setter
    def current_workspace(self, workspace: Workspace) -> None:
        assert self._current_workspace is None
        self._current_workspace = workspace

    @property
    def current_user(self) -> User:
        if self._current_user is None:
            self.current_user = get_safe_user(self)
        return self._current_user

    @current_user.setter
    def current_user(self, user: User) -> None:
        assert self._current_user is None
        self._current_user = user

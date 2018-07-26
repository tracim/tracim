# -*- coding: utf-8 -*-
from pyramid.request import Request
from sqlalchemy.orm.exc import NoResultFound

from tracim.exceptions import NotAuthenticated
from tracim.exceptions import UserNotActive
from tracim.exceptions import ContentNotFound
from tracim.exceptions import InvalidUserId
from tracim.exceptions import InvalidWorkspaceId
from tracim.exceptions import InvalidContentId
from tracim.exceptions import InvalidCommentId
from tracim.exceptions import ContentNotFoundInTracimRequest
from tracim.exceptions import WorkspaceNotFoundInTracimRequest
from tracim.exceptions import UserNotFoundInTracimRequest
from tracim.exceptions import UserDoesNotExist
from tracim.exceptions import WorkspaceNotFound
from tracim.exceptions import ImmutableAttribute
from tracim.models.contents import ContentTypeLegacy as ContentType
from tracim.lib.core.content import ContentApi
from tracim.lib.core.user import UserApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.lib.utils.authorization import JSONDecodeError

from tracim.models import User
from tracim.models.data import Workspace
from tracim.models.data import Content


class TracimRequest(Request):
    """
    Request with tracim specific params/methods
    """
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
        # Current comment, found in request path
        self._current_comment = None  # type: Content

        # Current content, found in request path
        self._current_content = None  # type: Content

        # Current workspace, found in request path
        self._current_workspace = None  # type: Workspace

        # Candidate workspace found in request body
        self._candidate_workspace = None  # type: Workspace

        # Authenticated user
        self._current_user = None  # type: User

        # User found from request headers, content, distinct from authenticated
        # user
        self._candidate_user = None  # type: User

        # INFO - G.M - 18-05-2018 - Close db at the end of the request
        self.add_finished_callback(self._cleanup)

    @property
    def current_workspace(self) -> Workspace:
        """
        Get current workspace of the request according to authentification and
        request headers (to retrieve workspace). Setted by default value the
        first time if not configured.
        :return: Workspace of the request
        """
        if self._current_workspace is None:
            self._current_workspace = self._get_current_workspace(self.current_user, self)   # nopep8
        return self._current_workspace

    @current_workspace.setter
    def current_workspace(self, workspace: Workspace) -> None:
        """
        Setting current_workspace
        :param workspace:
        :return:
        """
        if self._current_workspace is not None:
            raise ImmutableAttribute(
                "Can't modify already setted current_workspace"
            )
        self._current_workspace = workspace

    @property
    def current_user(self) -> User:
        """
        Get user from authentication mecanism.
        """
        if self._current_user is None:
            self.current_user = self._get_auth_safe_user(self)
        return self._current_user

    @current_user.setter
    def current_user(self, user: User) -> None:
        if self._current_user is not None:
            raise ImmutableAttribute(
                "Can't modify already setted current_user"
            )
        self._current_user = user

    @property
    def current_content(self) -> Content:
        """
        Get current  content from path
        """
        if self._current_content is None:
            self._current_content = self._get_current_content(
                self.current_user,
                self.current_workspace,
                self
                )
        return self._current_content

    @current_content.setter
    def current_content(self, content: Content) -> None:
        if self._current_content is not None:
            raise ImmutableAttribute(
                "Can't modify already setted current_content"
            )
        self._current_content = content

    @property
    def current_comment(self) -> Content:
        """
        Get current comment from path
        """
        if self._current_comment is None:
            self._current_comment = self._get_current_comment(
                self.current_user,
                self.current_workspace,
                self.current_content,
                self
                )
        return self._current_comment

    @current_comment.setter
    def current_comment(self, content: Content) -> None:
        if self._current_comment is not None:
            raise ImmutableAttribute(
                "Can't modify already setted current_content"
            )
        self._current_comment = content
    # TODO - G.M - 24-05-2018 - Find a better naming for this ?

    @property
    def candidate_user(self) -> User:
        """
        Get user from headers/body request. This user is not
        the one found by authentication mecanism. This user
        can help user to know about who one page is about in
        a similar way as current_workspace.
        """
        if self._candidate_user is None:
            self.candidate_user = self._get_candidate_user(self)
        return self._candidate_user

    @property
    def candidate_workspace(self) -> Workspace:
        """
        Get workspace from headers/body request. This workspace is not
        the one found from path. Its the one from json body.
        """
        if self._candidate_workspace is None:
            self._candidate_workspace = self._get_candidate_workspace(
                self.current_user,
                self
            )
        return self._candidate_workspace

    def _cleanup(self, request: 'TracimRequest') -> None:
        """
        Close dbsession at the end of the request in order to avoid exception
        about not properly closed session or "object created in another thread"
        issue
        see https://github.com/tracim/tracim_backend/issues/62
        :param request: same as self, request
        :return: nothing.
        """
        self._current_user = None
        self._current_workspace = None
        self.dbsession.close()

    @candidate_user.setter
    def candidate_user(self, user: User) -> None:
        if self._candidate_user is not None:
            raise ImmutableAttribute(
                "Can't modify already setted candidate_user"
            )
        self._candidate_user = user

    ###
    # Utils for TracimRequest
    ###
    def _get_current_comment(
            self,
            user: User,
            workspace: Workspace,
            content: Content,
            request: 'TracimRequest'
    ) -> Content:
        """
        Get current content from request
        :param user: User who want to check the workspace
        :param workspace: Workspace of the content
        :param content: comment is related to this content
        :param request: pyramid request
        :return: current content
        """
        comment_id = ''
        try:
            if 'comment_id' in request.matchdict:
                comment_id_str = request.matchdict['content_id']
                if not isinstance(comment_id_str, str) or not comment_id_str.isdecimal():  # nopep8
                    raise InvalidCommentId('comment_id is not a correct integer')  # nopep8
                comment_id = int(request.matchdict['comment_id'])
            if not comment_id:
                raise ContentNotFoundInTracimRequest('No comment_id property found in request')  # nopep8
            api = ContentApi(
                current_user=user,
                session=request.dbsession,
                config=request.registry.settings['CFG']
            )
            comment = api.get_one(
                comment_id,
                content_type=ContentType.Comment,
                workspace=workspace,
                parent=content,
            )
        except NoResultFound as exc:
            raise ContentNotFound(
                'Comment {} does not exist '
                'or is not visible for this user'.format(comment_id)
            ) from exc
        return comment

    def _get_current_content(
            self,
            user: User,
            workspace: Workspace,
            request: 'TracimRequest'
    ) -> Content:
        """
        Get current content from request
        :param user: User who want to check the workspace
        :param workspace: Workspace of the content
        :param request: pyramid request
        :return: current content
        """
        content_id = ''
        try:
            if 'content_id' in request.matchdict:
                content_id_str = request.matchdict['content_id']
                if not isinstance(content_id_str, str) or not content_id_str.isdecimal():  # nopep8
                    raise InvalidContentId('content_id is not a correct integer')  # nopep8
                content_id = int(request.matchdict['content_id'])
            if not content_id:
                raise ContentNotFoundInTracimRequest('No content_id property found in request')  # nopep8
            api = ContentApi(
                current_user=user,
                session=request.dbsession,
                config=request.registry.settings['CFG']
            )
            content = api.get_one(content_id=content_id, workspace=workspace, content_type=ContentType.Any)  # nopep8
        except NoResultFound as exc:
            raise ContentNotFound(
                'Content {} does not exist '
                'or is not visible for this user'.format(content_id)
            ) from exc
        return content

    def _get_candidate_user(
            self,
            request: 'TracimRequest',
    ) -> User:
        """
        Get candidate user
        :param request: pyramid request
        :return: user found from header/body
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(None, session=request.dbsession, config=app_config)
        login = ''
        try:
            login = None
            if 'user_id' in request.matchdict:
                user_id_str = request.matchdict['user_id']
                if not isinstance(user_id_str, str) or not user_id_str.isdecimal():
                    raise InvalidUserId('user_id is not a correct integer')  # nopep8
                login = int(request.matchdict['user_id'])
            if not login:
                raise UserNotFoundInTracimRequest('You request a candidate user but the context not permit to found one')  # nopep8
            user = uapi.get_one(login)
        except UserNotFoundInTracimRequest as exc:
            raise UserDoesNotExist('User {} not found'.format(login)) from exc
        return user

    def _get_auth_safe_user(
            self,
            request: 'TracimRequest',
    ) -> User:
        """
        Get current pyramid authenticated user from request
        :param request: pyramid request
        :return: current authenticated user
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(None, session=request.dbsession, config=app_config)
        login = ''
        try:
            login = request.authenticated_userid
            if not login:
                raise UserNotFoundInTracimRequest('You request a current user but the context not permit to found one')  # nopep8
            user = uapi.get_one_by_email(login)
            if not user.is_active:
                raise UserNotActive('User {} is not active'.format(login))
        except (UserDoesNotExist, UserNotFoundInTracimRequest) as exc:
            raise NotAuthenticated('User {} not found'.format(login)) from exc
        return user

    def _get_current_workspace(
            self,
            user: User,
            request: 'TracimRequest'
    ) -> Workspace:
        """
        Get current workspace from request
        :param user: User who want to check the workspace
        :param request: pyramid request
        :return: current workspace
        """
        workspace_id = ''
        try:
            if 'workspace_id' in request.matchdict:
                workspace_id_str = request.matchdict['workspace_id']
                if not isinstance(workspace_id_str, str) or not workspace_id_str.isdecimal():  # nopep8
                    raise InvalidWorkspaceId('workspace_id is not a correct integer')  # nopep8
                workspace_id = int(request.matchdict['workspace_id'])
            if not workspace_id:
                raise WorkspaceNotFoundInTracimRequest('No workspace_id property found in request')  # nopep8
            wapi = WorkspaceApi(
                current_user=user,
                session=request.dbsession,
                config=request.registry.settings['CFG']
            )
            workspace = wapi.get_one(workspace_id)
        except NoResultFound as exc:
            raise WorkspaceNotFound(
                'Workspace {} does not exist '
                'or is not visible for this user'.format(workspace_id)
            ) from exc
        return workspace

    def _get_candidate_workspace(
            self,
            user: User,
            request: 'TracimRequest'
    ) -> Workspace:
        """
        Get current workspace from request
        :param user: User who want to check the workspace
        :param request: pyramid request
        :return: current workspace
        """
        workspace_id = ''
        try:
            if 'new_workspace_id' in request.json_body:
                workspace_id = request.json_body['new_workspace_id']
                if not isinstance(workspace_id, int):
                    if workspace_id.isdecimal():
                        workspace_id = int(workspace_id)
                    else:
                        raise InvalidWorkspaceId('workspace_id is not a correct integer')  # nopep8
            if not workspace_id:
                raise WorkspaceNotFoundInTracimRequest('No new_workspace_id property found in body')  # nopep8
            wapi = WorkspaceApi(
                current_user=user,
                session=request.dbsession,
                config=request.registry.settings['CFG']
            )
            workspace = wapi.get_one(workspace_id)
        except JSONDecodeError as exc:
            raise WorkspaceNotFound('Invalid JSON content') from exc
        except NoResultFound as exc:
            raise WorkspaceNotFound(
                'Workspace {} does not exist '
                'or is not visible for this user'.format(workspace_id)
            ) from exc
        return workspace

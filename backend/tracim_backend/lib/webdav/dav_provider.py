# coding: utf8
from collections import deque
from os.path import dirname
import typing

from pluggy import PluginManager
from wsgidav.dav_provider import DAVProvider
from wsgidav.lock_manager import LockManager

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import NotAuthenticated
from tracim_backend.exceptions import WorkspaceNotFound
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.lib.utils.utils import normpath
from tracim_backend.lib.utils.utils import webdav_convert_file_name_to_bdd
from tracim_backend.lib.webdav import resources
from tracim_backend.lib.webdav.lock_storage import LockStorage
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import Workspace
from tracim_backend.models.tracim_session import TracimSession


class WebdavPath(object):
    def __init__(self, path: str, current_user: User, session: TracimSession, app_config: CFG):
        self.path = path
        self.workspace_api = WorkspaceApi(
            current_user=current_user, session=session, config=app_config
        )
        self.content_api = ContentApi(current_user=current_user, session=session, config=app_config)
        path_parts = path.split("/")
        self.workspaces = deque()
        self.contents = deque()
        if path and path != "/" and len(path_parts) >= 2:
            root_workspace_filemanager_filename = webdav_convert_file_name_to_bdd(path_parts[1])
            try:
                root_workspace = self.workspace_api.get_one_by_filemanager_filename(
                    root_workspace_filemanager_filename
                )
            except WorkspaceNotFound:
                root_workspace = None
            self.workspaces.append(root_workspace)
            # INFO - G.M - 2020-10-07 - Get all workspace tree + content_tree
            if root_workspace:
                search_sub_workspace = True
                for path_part in path_parts[1:]:
                    section = webdav_convert_file_name_to_bdd(path_part)
                    if search_sub_workspace:
                        try:
                            workspace = self.workspace_api.get_one_by_filemanager_filename(
                                section, parent=self.workspaces[-1]
                            )
                            self.workspaces.append(workspace)
                            continue
                        except WorkspaceNotFound:
                            search_sub_workspace = False
                            pass
                    try:
                        content = self.content_api.get_one_by_filename(
                            filename=section,
                            workspace=self.workspaces[-1],
                            parent=self.contents[-1] if self.contents else None,
                        )
                    except ContentNotFound:
                        content = None
                    self.contents.append(content)

    @property
    def current_workspace(self) -> typing.Optional[Workspace]:
        try:
            return self.workspaces[-1]
        except IndexError:
            return None

    @property
    def current_content(self) -> typing.Optional[Content]:
        try:
            return self.contents[-1]
        except IndexError:
            return None

    @property
    def current_parent_content(self) -> typing.Optional[Content]:
        try:
            return self.contents[-2]
        except IndexError:
            return None

    @property
    def exists(self):
        # root
        if self.path == "/":
            return True
        # workspace root
        if self.contents == deque() and self.current_workspace:
            return True
        # content
        if self.current_content:
            return True


class WebdavTracimContext(TracimContext):
    def __init__(
        self, environ: typing.Dict[str, typing.Any], app_config: CFG, plugin_manager: PluginManager,
    ):
        super().__init__()
        self.environ = environ
        self._candidate_parent_content = None
        self._app_config = app_config
        self._session = None
        self._plugin_manager = plugin_manager

    def set_path(self, path: str):
        self.processed_path = WebdavPath(
            path=path,
            current_user=self.current_user,
            session=self.dbsession,
            app_config=self.app_config,
        )

    @property
    def root_path(self) -> str:
        return self.environ["http_authenticator.realm"]

    @property
    def dbsession(self) -> TracimSession:
        assert self._session
        return self._session

    @dbsession.setter
    def dbsession(self, session: TracimSession) -> None:
        self._session = session

    @property
    def app_config(self) -> CFG:
        return self._app_config

    @property
    def plugin_manager(self) -> PluginManager:
        return self._plugin_manager

    @property
    def current_user(self):
        """
        Current authenticated user if exist
        """
        if not self._current_user:
            self.set_user(self._get_user(self._get_current_webdav_username))
        return self._current_user

    def _get_user(self, get_webdav_username: typing.Callable):
        login = get_webdav_username()
        uapi = UserApi(None, show_deleted=True, session=self.dbsession, config=self.app_config)
        return uapi.get_one_by_login(login)

    def _get_current_webdav_username(self) -> str:
        if not self.environ.get("http_authenticator.username"):
            raise NotAuthenticated("User not found")
        return self.environ["http_authenticator.username"]

    @property
    def current_workspace(self):
        """
        Workspace of current ressources used if exist, for example,
        if you are editing content 21 in workspace 3,
        current_workspace will be 3.
        """
        return self.processed_path.current_workspace

    @property
    def current_content(self):
        """
        Current content if exist, if you are editing content 21, current content
        will be content 21.
        """
        return self.processed_path.current_content

    def set_destpath(self, destpath: str):
        self.processed_destpath = WebdavPath(
            path=destpath,
            current_user=self.current_user,
            session=self.dbsession,
            app_config=self.app_config,
        )

    @property
    def candidate_parent_content(self) -> Content:
        return self.processed_destpath.current_parent_content

    @property
    def candidate_workspace(self) -> Workspace:
        return self.processed_destpath.current_workspace

    @property
    def path_exist(self) -> bool:
        return self.processed_path.exists


class Provider(DAVProvider):
    """
    This class' role is to provide to wsgidav _DAVResource. Wsgidav will then use them to execute action and send
    informations to the client
    """

    def __init__(
        self, app_config: CFG, manage_locks=True,
    ):
        super(Provider, self).__init__()

        if manage_locks:
            self.lockManager = LockManager(LockStorage())

        self.app_config = app_config

    #########################################################
    # Everything override from DAVProvider
    def getResourceInst(self, path: str, environ: dict):
        """
        Called by wsgidav whenever a request is called to get the _DAVResource corresponding to the path
        """
        tracim_context = environ["tracim_context"]
        path = normpath(path)
        tracim_context.set_path(path)
        if not self.exists(path, environ):
            return None
        root_path = tracim_context.root_path

        # If the requested path is the root, then we return a RootResource resource
        if path == root_path:
            return resources.RootResource(path=path, environ=environ, tracim_context=tracim_context)

        try:
            workspace = tracim_context.current_workspace
        except WorkspaceNotFound:
            workspace = None

        # If the request path is in the form root/name, then we return a WorkspaceResource resource
        parent_path = dirname(path)
        if parent_path == root_path:
            if not workspace:
                return None
            return resources.WorkspaceResource(
                path=path,
                environ=environ,
                workspace=workspace,
                tracim_context=tracim_context,
                label=workspace.filemanager_filename,
            )

        try:
            content = tracim_context.current_content
        except ContentNotFound:
            content = None

        # And if we're still going, the client is asking for a standard Folder/File/Page/Thread so we check the type7
        # and return the corresponding resource

        if content is None:
            return None
        if content.type == content_type_list.Folder.slug:
            return resources.FolderResource(
                path=path,
                environ=environ,
                workspace=content.workspace,
                content=content,
                tracim_context=tracim_context,
            )
        elif content.type == content_type_list.File.slug:
            return resources.FileResource(
                path=path, environ=environ, content=content, tracim_context=tracim_context,
            )
        else:
            return resources.OtherFileResource(
                path=path, environ=environ, content=content, tracim_context=tracim_context,
            )

    def exists(self, path, environ) -> bool:
        """
        Called by wsgidav to check if a certain path is linked to a _DAVResource
        """
        path = normpath(path)
        tracim_context = environ["tracim_context"]
        tracim_context.set_path(path)
        return tracim_context.path_exist

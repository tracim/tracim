# coding: utf8
from os.path import basename
from os.path import dirname
import typing

from pluggy import PluginManager
from sqlalchemy.orm.exc import NoResultFound
from wsgidav.dav_provider import DAVProvider
from wsgidav.lock_manager import LockManager

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import NotAuthenticated
from tracim_backend.exceptions import WorkspaceNotFound
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.content import ContentRevisionRO
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.lib.utils.utils import normpath
from tracim_backend.lib.utils.utils import webdav_convert_file_name_to_bdd
from tracim_backend.lib.webdav import resources
from tracim_backend.lib.webdav.lock_storage import LockStorage
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.data import Workspace
from tracim_backend.models.tracim_session import TracimSession


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
        self.path = path

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
        return self._generate_if_none(
            self._current_workspace, self._get_workspace, self._get_current_workspace_label,
        )

    def _get_workspace(self, workspace_id_fetcher):
        workspace_id = workspace_id_fetcher()
        wapi = WorkspaceApi(
            current_user=self.current_user,
            session=self.dbsession,
            config=self.app_config,
            show_deleted=True,
        )
        return wapi.get_one_by_label(workspace_id)

    def _get_current_workspace_label(self) -> str:
        return webdav_convert_file_name_to_bdd(self.path.split("/")[1])

    @property
    def current_content(self):
        """
        Current content if exist, if you are editing content 21, current content
        will be content 21.
        """
        return self._generate_if_none(
            self._current_content, self._get_content, self._get_content_path
        )

    def _get_content(self, content_path_fetcher):
        content_path = content_path_fetcher()

        splited_local_path = content_path.strip("/").split("/")
        workspace_name = webdav_convert_file_name_to_bdd(splited_local_path[0])
        wapi = WorkspaceApi(
            current_user=self.current_user, session=self.dbsession, config=self.app_config,
        )
        workspace = wapi.get_one_by_label(workspace_name)
        parents = []
        if len(splited_local_path) > 2:
            parent_string = splited_local_path[1:-1]
            parents = [webdav_convert_file_name_to_bdd(x) for x in parent_string]

        content_api = ContentApi(
            config=self.app_config, current_user=self.current_user, session=self.dbsession,
        )
        return content_api.get_one_by_filename_and_parent_labels(
            content_label=webdav_convert_file_name_to_bdd(basename(content_path)),
            content_parent_labels=parents,
            workspace=workspace,
        )

    def _get_content_path(self):
        return normpath(self.path)

    def _get_candidate_parent_content_path(self):
        return normpath(dirname(self._destpath))

    def set_destpath(self, destpath: str):
        self._destpath = destpath

    def _get_candidate_workspace_path(self):
        return webdav_convert_file_name_to_bdd(self._destpath.split("/")[1])

    @property
    def candidate_parent_content(self) -> Content:
        return self._generate_if_none(
            self._candidate_parent_content,
            self._get_content,
            self._get_candidate_parent_content_path,
        )

    @property
    def candidate_workspace(self) -> Workspace:
        return self._generate_if_none(
            self._candidate_workspace, self._get_workspace, self._get_candidate_workspace_path,
        )


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
        user = tracim_context.current_user
        session = tracim_context.dbsession
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
                label=workspace.label,
            )

        # And now we'll work on the path to establish which type or resource is requested

        ContentApi(
            current_user=user,
            session=session,
            config=self.app_config,
            show_archived=False,
            show_deleted=False,
            namespaces_filter=[ContentNamespaces.CONTENT],
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
        root_path = environ["http_authenticator.realm"]
        parent_path = dirname(path)
        user = tracim_context.current_user
        session = tracim_context.dbsession
        if path == root_path:
            return True

        try:
            workspace = tracim_context.current_workspace
        except WorkspaceNotFound:
            workspace = None

        if parent_path == root_path or workspace is None:
            return workspace is not None

        ContentApi(
            current_user=user,
            session=session,
            config=self.app_config,
            show_archived=False,
            show_deleted=False,
            namespaces_filter=[ContentNamespaces.CONTENT],
        )

        try:
            content = tracim_context.current_content
        except ContentNotFound:
            content = None

        return content is not None

    def get_content_from_revision(self, revision: ContentRevisionRO, api: ContentApi) -> Content:
        try:
            return api.get_one(revision.content_id, content_type_list.Any_SLUG)
        except NoResultFound:
            return None

# coding: utf8
import functools
import re
import typing
from os.path import basename
from os.path import dirname

from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import NoResultFound
from wsgidav.dav_error import HTTP_FORBIDDEN
from wsgidav.dav_error import DAVError
from wsgidav.dav_provider import DAVProvider
from wsgidav.lock_manager import LockManager

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import NotAuthenticated
from tracim_backend.exceptions import TracimException
from tracim_backend.exceptions import UserNotFoundInTracimRequest
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
from tracim_backend.lib.webdav.utils import HistoryType
from tracim_backend.lib.webdav.utils import SpecialFolderExtension
from tracim_backend.models.data import Content
from tracim_backend.models.data import Workspace


class WebdavTracimContext(TracimContext):

    def __init__(self, environ: typing.Dict[str, typing.Any], app_config: CFG, session: Session):
        super().__init__()
        self.environ = environ
        self._candidate_parent_content = None
        self._app_config = app_config
        self._session  = session

    def set_path(self, path: str):
        self.path = path

    @property
    def root_path(self) -> str:
        return self.environ['http_authenticator.realm']

    @property
    def dbsession(self) -> Session:
        return self._session

    @property
    def app_config(self) -> CFG:
       return self._app_config

    @property
    def current_user(self):
        """
        Current authenticated user if exist
        """
        return self._generate_if_none(
            self._current_user,
            self._get_user,
            self._get_current_user_email
        )

    def _get_user(self, user_email: typing.Callable):
        user_email = user_email()
        uapi = UserApi(
            None,
            show_deleted=True,
            session=self.dbsession,
            config=self.app_config
        )
        return uapi.get_one_by_email(user_email)

    def _get_current_user_email(self) -> str:
        try:
            if not self.environ['http_authenticator.username']:
                raise UserNotFoundInTracimRequest(
                    'You request a current user '
                    'but the context not permit to found one'
                )
        except UserNotFoundInTracimRequest as exc:
            raise NotAuthenticated('User not found') from exc
        return self.environ['http_authenticator.username']


    @property
    def current_workspace(self):
        """
        Workspace of current ressources used if exist, for example,
        if you are editing content 21 in workspace 3,
        current_workspace will be 3.
        """
        return self._generate_if_none(
            self._current_workspace,
            self._get_workspace,
            self._get_current_workspace_label
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
        return webdav_convert_file_name_to_bdd(self.path.split('/')[1])

    @property
    def current_content(self):
        """
        Current content if exist, if you are editing content 21, current content
        will be content 21.
        """
        return self._generate_if_none(
            self._current_content,
            self._get_content,
            self._get_content_path
        )

    def _get_content(self, content_path_fetcher):
        path = content_path_fetcher()
        content_path = self.reduce_path(path)
        splited_local_path = content_path.strip('/').split('/')
        workspace_name = webdav_convert_file_name_to_bdd(splited_local_path[0])
        wapi = WorkspaceApi(
            current_user=self.current_user,
            session=self.dbsession,
            config=self.app_config,
        )
        workspace = wapi.get_one_by_label(workspace_name)
        parents = []
        if len(splited_local_path) > 2:
            parent_string = splited_local_path[1:-1]
            parents = [webdav_convert_file_name_to_bdd(x) for x in parent_string]

        content_api = ContentApi(
            config=self.app_config,
            current_user=self.current_user,
            session=self.dbsession
        )
        return content_api.get_one_by_filename_and_parent_labels(
            content_label=webdav_convert_file_name_to_bdd(basename(path)),
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
        return webdav_convert_file_name_to_bdd(self._destpath.split('/')[1])

    @property
    def candidate_parent_content(self) -> Content:
        return self._generate_if_none(
            self._candidate_parent_content,
            self._get_content,
            self._get_candidate_parent_content_path
        )

    @property
    def candidate_workspace(self) -> Workspace:
        return self._generate_if_none(
            self._candidate_workspace,
            self._get_workspace,
            self._get_candidate_workspace_path
        )

    def reduce_path(self, path: str) -> str:
        """
        As we use the given path to request the database

        ex: if the path is /a/b/.deleted/c/.archived, we're trying to get the archived content of the 'c' resource,
        we need to keep the path /a/b/c

        ex: if the path is /a/b/.history/my_file, we're trying to get the history of the file my_file, thus we need
        the path /a/b/my_file

        ex: if the path is /a/b/.history/my_file/(1985 - edition) my_old_name, we're looking for,
        thus we remove all useless information
        """
        path = re.sub(r'/\.archived', r'', path)
        path = re.sub(r'/\.deleted', r'', path)
        path = re.sub(r'/\.history/[^/]+/(\d+)-.+', r'/\1', path)
        path = re.sub(r'/\.history/([^/]+)', r'/\1', path)
        path = re.sub(r'/\.history', r'', path)

        return path


class Provider(DAVProvider):
    """
    This class' role is to provide to wsgidav _DAVResource. Wsgidav will then use them to execute action and send
    informations to the client
    """

    def __init__(
            self,
            app_config: CFG,
            show_history=True,
            show_deleted=True,
            show_archived=True,
            manage_locks=True,
    ):
        super(Provider, self).__init__()

        if manage_locks:
            self.lockManager = LockManager(LockStorage())

        self.app_config = app_config
        self._show_archive = show_archived
        self._show_delete = show_deleted
        self._show_history = show_history

    def show_history(self):
        return self._show_history

    def show_delete(self):
        return self._show_delete

    def show_archive(self):
        return self._show_archive

    #########################################################
    # Everything override from DAVProvider
    def getResourceInst(self, path: str, environ: dict):
        """
        Called by wsgidav whenever a request is called to get the _DAVResource corresponding to the path
        """
        tracim_context = environ['tracim_context']
        tracim_context.set_path(path)
        user = tracim_context.current_user
        session = tracim_context.dbsession
        if not self.exists(path, environ):
            return None
        path = normpath(path)
        root_path = tracim_context.root_path

        # If the requested path is the root, then we return a RootResource resource
        if path == root_path:
            return resources.RootResource(
                path=path,
                environ=environ,
                tracim_context=tracim_context
            )

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
                tracim_context=tracim_context
            )

        # And now we'll work on the path to establish which type or resource is requested

        content_api = ContentApi(
            current_user=user,
            session=session,
            config=self.app_config,
            show_archived=False,  # self._show_archive,
            show_deleted=False,  # self._show_delete
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
                path=path,
                environ=environ,
                content=content,
                tracim_context=tracim_context,
            )
        else:
            return resources.OtherFileResource(
                path=path,
                environ=environ,
                content=content,
                tracim_context=tracim_context,
            )

    def exists(self, path, environ) -> bool:
        """
        Called by wsgidav to check if a certain path is linked to a _DAVResource
        """

        tracim_context = environ['tracim_context']
        tracim_context.set_path(path)
        path = normpath(path)
        working_path = tracim_context.reduce_path(path)
        root_path = environ['http_authenticator.realm']
        parent_path = dirname(working_path)
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

        # TODO bastien: Arnaud avait mis a True, verif le comportement
        # lorsque l'on explore les dossiers archive et deleted
        content_api = ContentApi(
            current_user=user,
            session=session,
            config=self.app_config,
            show_archived=False,
            show_deleted=False
        )

        revision_id = re.search(r'/\.history/[^/]+/\((\d+) - [a-zA-Z]+\) ([^/].+)$', path)

        is_archived = self.is_path_archive(path)

        is_deleted = self.is_path_delete(path)

        if revision_id:
            revision_id = revision_id.group(1)
            content = content_api.get_one_revision(revision_id)
        else:
            try:
                content = tracim_context.current_content
            except ContentNotFound:
                content = None

        return content is not None \
            and content.is_deleted == is_deleted \
            and content.is_archived == is_archived

    def is_path_archive(self, path):
        """
        This function will check if a given path is linked to a file that's archived or not. We're checking if the
        given path end with one of these string :

        ex:
            - /a/b/.archived/my_file
            - /a/b/.archived/.history/my_file
            - /a/b/.archived/.history/my_file/(3615 - edition) my_file
        """

        return re.search(
            r'/\.archived/(\.history/)?(?!\.history)[^/]*(/\.)?(history|deleted|archived)?$',
            path
        ) is not None

    def is_path_delete(self, path):
        """
        This function will check if a given path is linked to a file that's deleted or not. We're checking if the
        given path end with one of these string :

        ex:
            - /a/b/.deleted/my_file
            - /a/b/.deleted/.history/my_file
            - /a/b/.deleted/.history/my_file/(3615 - edition) my_file
        """

        return re.search(
            r'/\.deleted/(\.history/)?(?!\.history)[^/]*(/\.)?(history|deleted|archived)?$',
            path
        ) is not None

    def get_content_from_revision(self, revision: ContentRevisionRO, api: ContentApi) -> Content:
        try:
            return api.get_one(revision.content_id, content_type_list.Any_SLUG)
        except NoResultFound:
            return None

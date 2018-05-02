# coding: utf8

import re
from os.path import basename, dirname

from sqlalchemy.orm.exc import NoResultFound

from tracim import CFG
from tracim.lib.webdav.utils import transform_to_bdd, HistoryType, \
    SpecialFolderExtension

from wsgidav.dav_provider import DAVProvider
from wsgidav.lock_manager import LockManager


from tracim.lib.webdav.lock_storage import LockStorage
from tracim.lib.core.content import ContentApi
from tracim.lib.core.content import ContentRevisionRO
from tracim.lib.core.workspace import WorkspaceApi
from tracim.lib.webdav import resources
from tracim.lib.webdav.utils import normpath
from tracim.models.data import ContentType, Content, Workspace


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
        user = environ['tracim_user']
        session = environ['tracim_dbsession']
        if not self.exists(path, environ):
            return None
        path = normpath(path)
        root_path = environ['http_authenticator.realm']

        # If the requested path is the root, then we return a RootResource resource
        if path == root_path:
            return resources.RootResource(path, environ, user=user, session=session)

        workspace_api = WorkspaceApi(current_user=user, session=session)
        workspace = self.get_workspace_from_path(path, workspace_api)

        # If the request path is in the form root/name, then we return a WorkspaceResource resource
        parent_path = dirname(path)
        if parent_path == root_path:
            if not workspace:
                return None
            return resources.WorkspaceResource(
                path=path,
                environ=environ,
                workspace=workspace,
                user=user,
                session=session,
            )

        # And now we'll work on the path to establish which type or resource is requested

        content_api = ContentApi(
            current_user=user,
            session=session,
            config=self.app_config,
            show_archived=False,  # self._show_archive,
            show_deleted=False,  # self._show_delete
        )

        content = self.get_content_from_path(
            path=path,
            content_api=content_api,
            workspace=workspace
        )


        # Easy cases : path either end with /.deleted, /.archived or /.history, then we return corresponding resources
        if path.endswith(SpecialFolderExtension.Archived) and self._show_archive:
            return resources.ArchivedFolderResource(path, environ, workspace, content)

        if path.endswith(SpecialFolderExtension.Deleted) and self._show_delete:
            return resources.DeletedFolderResource(path, environ, workspace, content)

        if path.endswith(SpecialFolderExtension.History) and self._show_history:
            is_deleted_folder = re.search(r'/\.deleted/\.history$', path) is not None
            is_archived_folder = re.search(r'/\.archived/\.history$', path) is not None

            type = HistoryType.Deleted if is_deleted_folder \
                else HistoryType.Archived if is_archived_folder \
                else HistoryType.Standard

            return resources.HistoryFolderResource(path, environ, workspace, content, type)

        # Now that's more complicated, we're trying to find out if the path end with /.history/file_name
        is_history_file_folder = re.search(r'/\.history/([^/]+)$', path) is not None

        if is_history_file_folder and self._show_history:
            return resources.HistoryFileFolderResource(
                path=path,
                environ=environ,
                content=content
            )

        # And here next step :
        is_history_file = re.search(r'/\.history/[^/]+/\((\d+) - [a-zA-Z]+\) .+', path) is not None

        if self._show_history and is_history_file:

            revision_id = re.search(r'/\.history/[^/]+/\((\d+) - [a-zA-Z]+\) ([^/].+)$', path).group(1)

            content_revision = content_api.get_one_revision(revision_id)
            content = self.get_content_from_revision(content_revision, content_api)

            if content.type == ContentType.File:
                return resources.HistoryFileResource(path, environ, content, content_revision)
            else:
                return resources.HistoryOtherFile(path, environ, content, content_revision)

        # And if we're still going, the client is asking for a standard Folder/File/Page/Thread so we check the type7
        # and return the corresponding resource

        if content is None:
            return None
        if content.type == ContentType.Folder:
            return resources.FolderResource(
                path=path,
                environ=environ,
                workspace=content.workspace,
                content=content,
                session=session,
                user=user,
            )
        elif content.type == ContentType.File:
            return resources.FileResource(
                path=path,
                environ=environ,
                content=content,
                session=session,
                user=user
            )
        else:
            return resources.OtherFileResource(
                path=path,
                environ=environ,
                content=content,
                session=session,
                user=user,
            )

    def exists(self, path, environ) -> bool:
        """
        Called by wsgidav to check if a certain path is linked to a _DAVResource
        """

        path = normpath(path)
        working_path = self.reduce_path(path)
        root_path = environ['http_authenticator.realm']
        parent_path = dirname(working_path)
        user = environ['tracim_user']
        session = environ['tracim_dbsession']
        if path == root_path:
            return True

        workspace = self.get_workspace_from_path(
            path,
            WorkspaceApi(current_user=user, session=session)
        )

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
            content = self.get_content_from_path(working_path, content_api, workspace)

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

    def get_content_from_path(self, path, content_api: ContentApi, workspace: Workspace) -> Content:
        """
        Called whenever we want to get the Content item from the database for a given path
        """
        path = self.reduce_path(path)
        parent_path = dirname(path)

        relative_parents_path = parent_path[len(workspace.label)+1:]
        parents = relative_parents_path.split('/')

        try:
            parents.remove('')
        except ValueError:
            pass
        parents = [transform_to_bdd(x) for x in parents]

        try:
            return content_api.get_one_by_label_and_parent_labels(
                content_label=transform_to_bdd(basename(path)),
                content_parent_labels=parents,
                workspace=workspace,
            )
        except NoResultFound:
            return None

    def get_content_from_revision(self, revision: ContentRevisionRO, api: ContentApi) -> Content:
        try:
            return api.get_one(revision.content_id, ContentType.Any)
        except NoResultFound:
            return None

    def get_parent_from_path(self, path, api: ContentApi, workspace) -> Content:
        return self.get_content_from_path(dirname(path), api, workspace)

    def get_workspace_from_path(self, path: str, api: WorkspaceApi) -> Workspace:
        try:
            return api.get_one_by_label(transform_to_bdd(path.split('/')[1]))
        except NoResultFound:
            return None

# coding: utf8

from tracim.lib.webdav import HistoryType
from tracim.lib.webdav.lock_storage import LockStorage

import re
from os.path import basename, dirname, normpath
from tracim.lib.content import ContentApi
from tracim.lib.webdav import sql_resources
from tracim.lib.user import UserApi
from tracim.lib.workspace import WorkspaceApi
from wsgidav import util
from wsgidav.dav_provider import DAVProvider
from wsgidav.lock_manager import LockManager
from tracim.model.data import ContentType

from tracim.lib.content import ContentRevisionRO
######################################

__docformat__ = "reStructuredText"
_logger = util.getModuleLogger(__name__)


def wsgi_decode(s):
    return s.encode('latin1').decode()

def wsgi_encode(s):
    if isinstance(s, bytes):
        return s.decode('latin1')
    return s.encode().decode('latin1')




# ============================================================
# PostgreSQLProvider
# ============================================================
class Provider(DAVProvider):
    def __init__(self, show_history=True, show_deleted=True, show_archived=True, manage_locks=True):
        super(Provider, self).__init__()

        if manage_locks:
            self.lockManager = LockManager(LockStorage())

        self._show_archive = show_archived
        self._show_delete = show_deleted
        self._show_history = show_history

    def show_history(self):
        return self._show_history

    def show_delete(self):
        return self._show_delete

    def show_archive(self):
        return self._show_archive

    def __repr__(self):
        return 'Provider'

    #########################################################
    # Everything override from DAVProvider
    def getResourceInst(self, path, environ):
        #if not self.exists(path, environ):
        #    return None
        if not self.exists(path, environ):
            return None

        uapi = UserApi(None)
        environ['user'] = uapi.get_one_by_email(environ['http_authenticator.username'])

        norm_path = normpath(path)
        norm_path = self.transform_to_display(norm_path)

        root_path = environ['http_authenticator.realm']
        parent_path = dirname(norm_path)

        workspace_api = WorkspaceApi(environ['user'])
        content_api = ContentApi(
            environ['user'],
            show_archived=self._show_archive,
            show_deleted=self._show_delete
        )

        # case we're requesting the root racine of webdav
        if path == root_path:
            return sql_resources.Root(path, environ)
        # case we're at the root racine of a workspace
        elif parent_path == root_path:
            return sql_resources.Workspace(
                path=norm_path,
                environ=environ,
                workspace=self.get_workspace_from_path(
                    norm_path,
                    workspace_api
                )
            )

        content = self.get_content_from_path(
            path=norm_path,
            content_api=content_api,
            workspace_api=workspace_api
        )

        # is archive
        is_archived_folder = re.search(r'/\.archived$', norm_path) is not None

        if self._show_archive and is_archived_folder:
            return sql_resources.ArchivedFolder(
                path=norm_path,
                environ=environ,
                content=content,
                workspace=self.get_workspace_from_path(norm_path, workspace_api)
            )

        # is delete
        is_deleted_folder = re.search(r'/\.deleted$', norm_path) is not None

        if self._show_delete and is_deleted_folder:
            return sql_resources.DeletedFolder(
                path=norm_path,
                environ=environ,
                content=content,
                workspace=self.get_workspace_from_path(norm_path, workspace_api)
            )

        # is history
        is_history_folder = re.search(r'/\.history$', norm_path) is not None

        if self._show_history and is_history_folder:
            is_deleted_folder = re.search(r'/\.deleted/\.history$', norm_path) is not None
            is_archived_folder = re.search(r'/\.archived/\.history$', norm_path) is not None

            type = HistoryType.Deleted if is_deleted_folder \
                else HistoryType.Archived if is_archived_folder \
                else HistoryType.Standard

            return sql_resources.HistoryFolder(
                path=norm_path,
                environ=environ,
                content=content,
                type=type,
                workspace=self.get_workspace_from_path(norm_path, workspace_api)
            )

        # is history
        is_history_file_folder = re.search(r'/\.history/([^/]+)$', norm_path) is not None

        if self._show_history and is_history_file_folder:
            return sql_resources.HistoryFileFolder(
                path=norm_path,
                environ=environ,
                content=content
            )

        # is history
        is_history_file = re.search(r'/\.history/[^/]+/(\d+)-.+', norm_path) is not None

        if self._show_history and is_history_file:
            content_revision = content_api.get_one_revision(re.search(r'/\.history/[^/]+/(\d+)-.+', norm_path).group(1))
            content = self.get_content_from_revision(content_revision, content_api)

            if content.type == ContentType.File:
                return sql_resources.HistoryFile(path, environ, content, content_revision)
            else:
                return sql_resources.HistoryOtherFile(path, environ, content, content_revision)

        # other
        if content is None:
            return None
        if content.type == ContentType.Folder:
            return sql_resources.Folder(path, environ, content, content.workspace)
        elif content.type == ContentType.File:
            return sql_resources.File(path, environ, content)
        elif content.type in [ContentType.Page, ContentType.Thread]:
            return sql_resources.OtherFile(path, environ, content)
        else:
            return None

    def exists(self, path, environ):
        uapi = UserApi(None)
        environ['user'] = uapi.get_one_by_email(environ['http_authenticator.username'])

        norm_path = normpath(path)
        parent_path = dirname(norm_path)
        root_path = environ['http_authenticator.realm']

        workspace_api = WorkspaceApi(environ['user'])
        content_api = ContentApi(
            current_user=environ['user'],
            show_archived=True,
            show_deleted=True
        )

        if path == root_path:
            return True
        elif parent_path == root_path:
            return self.get_workspace_from_path(
                    norm_path,
                    workspace_api
                ) is not None

        is_archived = re.search(r'/\.archived/(\.history/)?(?!\.history)[^/]*(/\.)?(history|deleted|archived)?$', norm_path) is not None

        is_deleted = re.search(r'/\.deleted/(\.history/)?(?!\.history)[^/]*(/\.)?(history|deleted|archived)?$', norm_path) is not None

        revision_id = re.search(r'/\.history/[^/]+/(\d+)-([^/].+)$', norm_path)

        blbl = self.reduce_path(norm_path)
        if dirname(blbl) == '/':
            return self.get_workspace_from_path(norm_path, workspace_api) is not None

        if revision_id:
            revision_id = revision_id.group(1)
            content = content_api.get_one_revision(revision_id)
        else:
            content = self.get_content_from_path(norm_path, content_api, workspace_api)

        return content is not None \
            and content.is_deleted == is_deleted \
            and content.is_archived == is_archived

    def reduce_path(self, path):
        path = re.sub(r'/\.archived', r'', path)
        path = re.sub(r'/\.deleted', r'', path)
        path = re.sub(r'/\.history/[^/]+/(\d+)-.+', r'/\1', path)
        path = re.sub(r'/\.history/([^/]+)', r'/\1', path)
        path = re.sub(r'/\.history', r'', path)

        return path

    def get_content_from_path(self, path, content_api: ContentApi, workspace_api: WorkspaceApi):
        path = self.reduce_path(path)

        workspace = self.get_workspace_from_path(path, workspace_api)

        try:
            if basename(dirname(path)) == workspace.label:
                return content_api.get_one_by_label_and_parent(
                    self.transform_to_bdd(basename(path)),
                    workspace=workspace
                )
            else:
                parent = self.get_parent_from_path(path, content_api, workspace_api)
                if parent is not None:
                    return content_api.get_one_by_label_and_parent(self.transform_to_bdd(basename(path)), content_parent=parent)
                return None
        except:
            return None

    def get_content_from_revision(self, revision: ContentRevisionRO, api:ContentApi):
        try:
            return api.get_one(revision.content_id, ContentType.Any)
        except:
            return None

    def get_parent_from_path(self, path, api: ContentApi, workspace_api: WorkspaceApi):

        return self.get_content_from_path(dirname(path), api, workspace_api)

    def get_workspace_from_path(self, path: str, api: WorkspaceApi):
        assert path.startswith('/')

        try:
            return api.get_one_by_label(self.transform_to_bdd(path.split('/')[1]))
        except:
            return None

    def transform_to_display(self, string):
        _TO_DISPLAY = {
            # '/':'⁄',
            '\\': '⧹',
            ':': '∶',
            '*': '∗',
            '?': 'ʔ',
            '"': 'ʺ',
            '<': '❮',
            '>': '❯',
            '|': '∣'
        }

        for key, value in _TO_DISPLAY.items():
            string = string.replace(key, value)

        return string

    def transform_to_bdd(self, string):
        _TO_BDD = {
            # '⁄': '/',
            '⧹': '\\',
            '∶': ':',
            '∗': '*',
            'ʔ': '?',
            'ʺ': '"',
            '❮': '<',
            '❯': '>',
            '∣': '|'
        }

        for key, value in _TO_BDD.items():
            string = string.replace(key, value)

        return string


"""

{'wsgidav.dump_request_body': False,
 'wsgi.run_once': False,
 'wsgi.multiprocess': False,
 'wsgi.multithread': True,
 'QUERY_STRING': '',
 'REQUEST_URI': b'/nouveau/',
 'wsgidav.dump_response_body': False,
 'SERVER_PROTOCOL': 'HTTP/1.1',
 'REMOTE_ADDR': '127.0.0.1',
 'wsgidav.verbose': 1,
 'wsgi.version': (1, 0),
 'wsgidav.config': {
     'middleware_stack':[],
                       'propsmanager': None,
                       'add_header_MS_Author_Via': True,
                       'acceptbasic': True,
                       'user_mapping': {},
                       'enable_loggers': [],
                       'locksmanager': True,
                       'mount_path': None,
                       'catchall': False,
                       'unquote_path_info': False,
                       'provider_mapping': {'': Provider},
                       'port': 3030,
                       'Provider': [],
                       'verbose': 1,
                       'SQLDomainController': [],
                       'domaincontroller': [],
     'acceptdigest': True,
     'dir_browser': {
         'ms_sharepoint_urls': False,
         'ms_mount': False,
         'davmount': False,
         'enable': True,
         'ms_sharepoint_plugin': True,
         'response_trailer': ''
     },
     'defaultdigest': True,
     'host': '0.0.0.0',
     'ext_servers': ['cherrypy-bundled', 'wsgidav']
 },
 'http_authenticator.realm': '/',
 'HTTP_AUTHORIZATION': 'Digest username="admin@admin.admin",
 realm="/", nonce="=",
 uri="/nouveau/",
 algorithm=MD5,
 response="9c78c484263409b3385ead95ea7bf65b", '
 'cnonce="MHgyMzNkZjkwOjQ4OTU6MTQ2OTc3OTI1NQ==", nc=00000471, qop=auth',
 'HTTP_ACCEPT_ENCODING': 'gzip, deflate',
 'HTTP_USER_AGENT': 'gvfs/1.22.2', 'wsgidav.debug_break': False,
 'HTTP_CONNECTION': 'Keep-Alive', 'SERVER_PORT': '3030', 'CONTENT_LENGTH': '235', 'HTTP_HOST': '127.0.0.1:3030', 'REQUEST_METHOD': 'PROPFIND', 'HTTP_APPLY_TO_REDIRECT_REF': 'T', 'SERVER_NAME': 'WsgiDAV/3.0.0pre1 CherryPy/3.2.4 Python/3.4.2', 'wsgi.errors': <_io.TextIOWrapper name='<stderr>' mode='w' encoding='UTF-8'>, 'wsgi.url_scheme': 'http', 'user': <User: email='admin@admin.admin', display='Global manager'>, 'HTTP_ACCEPT_LANGUAGE': 'en-us, en;q=0.9', 'ACTUAL_SERVER_PROTOCOL': 'HTTP/1.1', 'REMOTE_PORT': '48375', 'CONTENT_TYPE': 'application/xml', 'SCRIPT_NAME': '', 'wsgi.input': <wsgidav.server.cherrypy.wsgiserver.wsgiserver3.KnownLengthRFile object at 0x7fbc8410ce48>, 'wsgidav.username': 'admin@admin.admin', 'http_authenticator.username': 'admin@admin.admin', 'wsgidav.provider': Provider, 'PATH_INFO': '/nouveau/', 'HTTP_DEPTH': '1', 'SERVER_SOFTWARE': 'WsgiDAV/3.0.0pre1 CherryPy/3.2.4 Python/3.4.2 Server'}
"""
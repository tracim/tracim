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
    def __init__(self, manage_lock=True):
        super(Provider, self).__init__()

        if manage_lock:
            self.lockManager = LockManager(LockStorage())

    def __repr__(self):
        return 'Provider'

    #########################################################
    # Everything override from DAVProvider
    def getResourceInst(self, path, environ):

        working_path = path

        if not self.exists(path, environ):
            return None

        if path == "/":
            return sql_resources.Root(path, environ)

        norm_path = normpath(working_path)

        user = UserApi(None).get_one_by_email(environ['http_authenticator.username'])
        workspace_api = WorkspaceApi(user)

        if dirname(norm_path) == "/":
            workspace = self.get_workspace_from_path(norm_path, workspace_api)
            return sql_resources.Workspace(path, environ, workspace)


        api = ContentApi(user, show_archived=True, show_deleted=True)

        working_path = self.reduce_path(path)

        content = self.get_content_from_path(working_path, api, workspace_api)

        # is archive
        is_archived_folder = re.search(r'/\.archived$', norm_path) is not None

        if is_archived_folder:
            return sql_resources.ArchivedFolder(path, environ, content)

        # is delete
        is_deleted_folder = re.search(r'/\.deleted$', norm_path) is not None

        if is_deleted_folder:
            return sql_resources.DeletedFolder(path, environ, content)

        # is history
        is_history_folder = re.search(r'/\.history$', norm_path) is not None

        if is_history_folder:
            is_deleted_folder = re.search(r'/\.deleted/\.history$', norm_path) is not None
            is_archived_folder = re.search(r'/\.archived/\.history$', norm_path) is not None

            type = HistoryType.Deleted if is_deleted_folder \
                else HistoryType.Archived if is_archived_folder \
                else HistoryType.Standard

            return sql_resources.HistoryFolder(path, environ, content, type)

        # is history
        is_history_file_folder = re.search(r'/\.history/([^/]+)$', norm_path) is not None

        if is_history_file_folder:
            return sql_resources.HistoryFileFolder(path, environ, content)

        # is history
        is_history_file = re.search(r'/\.history/[^/]+/(\d+)-.+', norm_path) is not None

        if is_history_file:
            content = api.get_one_revision2(re.search(r'/\.history/[^/]+/(\d+)-.+', norm_path).group(1))
            content_revision = self.get_content_from_revision(re.search(r'/\.history/[^/]+/(\d+)-.+', norm_path).group(1), api)

            if content.type == ContentType.File:
                return sql_resources.HistoryFile(path, environ, content, content_revision)
            else:
                return sql_resources.HistoryOtherFile(path, environ, content, content_revision)

        # other
        if content.type == ContentType.Folder:
            return sql_resources.Folder(path, environ, content)

        if content.type == ContentType.File:
            return sql_resources.File(path, environ, content, False)
        else:
            return sql_resources.OtherFile(path, environ, content)

    def exists(self, path, environ):
        path = normpath(path)
        if path == "/":
            return True
        elif dirname(path) == "/":
            return self.get_workspace_from_path(
                path,
                WorkspaceApi(UserApi(None).get_one_by_email(environ['http_authenticator.username']))
            ) is not None

        api = ContentApi(
            current_user=UserApi(None).get_one_by_email(environ['http_authenticator.username']),
            show_archived=True,
            show_deleted=True
        )
        wapi = WorkspaceApi(UserApi(None).get_one_by_email(environ['http_authenticator.username']))

        norm_path = normpath(path)

        is_archived = re.search(r'/\.archived/(\.history/)?(?!\.history)[^/]*(/\.)?(history|deleted|archived)?$', norm_path) is not None

        is_deleted = re.search(r'/\.deleted/(\.history/)?(?!\.history)[^/]*(/\.)?(history|deleted|archived)?$', norm_path) is not None

        revision_id = re.search(r'/\.history/[^/]+/(\d+)-([^/].+)$', norm_path)

        if revision_id:
            revision_id = revision_id.group(1)
            return self.get_content_from_revision(revision_id, api) is not None

        working_path = self.reduce_path(path)

        content = self.get_content_from_path(working_path, api, wapi)

        return content is not None \
            and content.is_deleted == is_deleted \
            and content.is_archived == is_archived \
            and (revision_id is None or content.revision_id == revision_id)

    def reduce_path(self, path):
        path = re.sub(r'/\.archived', r'', path)
        path = re.sub(r'/\.deleted', r'', path)
        path = re.sub(r'/\.history/[^/]+/(\d+)-.+', r'/\1', path)
        path = re.sub(r'/\.history/([^/]+)', r'/\1', path)
        path = re.sub(r'/\.history', r'', path)

        return path

    def get_content_from_path(self, path, api: ContentApi, workspace_api: WorkspaceApi):
        path = normpath(path)
        workspace = self.get_workspace_from_path(path, workspace_api)

        if basename(dirname(path)) == workspace.label:
            return api.get_one_by_label_and_parent(basename(path), workspace=workspace)
        else:
            parent = self.get_parent_from_path(path, api, workspace_api)
            if parent is not None:
                return api.get_one_by_label_and_parent(basename(path), content_parent=parent)
            return None

    def get_content_from_revision(self, revision_id: int, api:ContentApi):
        return api.get_one_revision(revision_id)

    def get_parent_from_path(self, path, api: ContentApi, workspace_api: WorkspaceApi):
        return self.get_content_from_path(dirname(path), api, workspace_api)

    def get_workspace_from_path(self, path: str, api: WorkspaceApi):
        assert path.startswith('/')

        return api.get_one_by_label(path.split('/')[1])

    #########################################################
    # Everything that transform path
    '''
    def from_id_to_name(self, path):
        path_ret = ''

        for item_id in path.split('/'):
            if item_id == '':
                pass
            elif path_ret == '':
                path_ret += '/' + self.get_workspace({'workspace_id': item_id}).label
            else:
                path_ret += '/' + self.get_item({'id': item_id}).item_name

        return path_ret

    def from_name_to_id(self, path):
        if path == '/':
            return '/'
        path_ret = ""
        last_id = None
        workspace_id = None

        for item_name in path.split("/"):
            if item_name == '':
                pass
            elif path_ret == '':
                workspace = self.get_workspace({'label': item_name})
                if workspace is None:
                    return None

                workspace_id = workspace.workspace_id
                path_ret += '/' + str(workspace_id)
            else:
                item = self.get_item(
                    {
                        'parent_id': last_id,
                        'item_name': item_name,
                        'workspace_id': workspace_id,
                        'child_revision_id': None
                    }
                )

                if item is None:
                    return None

                last_id = item.id
                path_ret += '/' + str(last_id)

        return path_ret

    #########################################################
    # Everything that check things (lol) ...
    def has_right(self, username, workspace_id, expected=0):
        ret = self.session.query(UserRoleInWorkspace.role).filter(
            UserRoleInWorkspace.workspace_id == workspace_id,
            User.user_id == UserRoleInWorkspace.user_id,
            User.display_name == username
        ).one_or_none()

        return ret is not None and role[ret.role] >= expected

    def exist_revision(self, item_name, item_id):
        return self.get_item({'id': item_id, 'item_name': item_name}) is not None

    @staticmethod
    def is_history(path):
        return normpath(path).endswith('.history')

    #########################################################
    # Everything that goes with "delete"
    def delete_item(self, element):
        self.session.delete(element)
        self.session.commit()

    #########################################################
    # Everything that goes with "add"
    def add_item(self, item_name, item_type, workspace_id, parent_id=None, parent_revision_id=None,
                 child_revision_id=None, item_content=None, created=None, updated=None):

        item = ItemRevision(
            item_name=to_unicode(item_name),
            item_type=to_unicode(item_type),
            item_content=item_content,
            workspace_id=workspace_id,
            parent_id=parent_id,
            created=created,
            updated=updated,
            parent_revision_id=parent_revision_id,
            child_revision_id=child_revision_id
        )

        self.session.add(item)
        self.session.commit()

        return item

    def add_workspace(self, environ, label):
        workspace = Workspace(label=label)

        self.session.add(workspace)

        user = self.get_user_with_name(environ['http_authenticator.username'])

        user_workspace = UserRoleInWorkspace(
            role='WORKSPACE_MANAGER',
            workspace_id=workspace.workspace_id,
            user_id=user.user_id
        )

        self.session.add(user_workspace)
        self.session.commit()

        return workspace

    #########################################################
    # Everything that goes with "set"
    def set_workspace_label(self, workspace, label):
        workspace.label = label
        self.session.commit()

    #########################################################
    # Everything that goes with "get"
    def get_all_revisions_from_item(self, item, only_id=False):
        ret = []
        current_item = item
        while current_item is not None:
            if only_id:
                ret.insert(0,current_item.id)
            else:
                ret.insert(0,current_item)

            current_item = self.get_item(
                {
                    'child_revision_id': current_item.id
                }
            )

        return ret

    def get_item(self, keys_dict):
        query = self.session.query(ItemRevision)

        for key, value in keys_dict.items():
            query = query.filter(getattr(ItemRevision, key) == value)
        return query.first()

    def get_item_children(self, item_id):
        items_result = self.session.query(ItemRevision.id).filter(
            ItemRevision.parent_id == item_id,
            ItemRevision.child_revision_id.is_(None)
        )

        ret_id = []
        for item in items_result:
            ret_id.append(item.id)

        return ret_id

    def get_workspace_id_from_path(self, path):
        return int(self.get_id_from_path('/' + path.split('/')[1]))

    def get_workspace_children_id(self, workspace):
        items_result = self.session.query(ItemRevision.id).filter(
            ItemRevision.parent_id.is_(None),
            ItemRevision.workspace_id == workspace.workspace_id
        )

        ret = []
        for item in items_result:
            ret.append(item.id)

        return ret

    # on workspaces
    def get_workspace(self, keys_dict):
        query = self.session.query(Workspace)

        for key, value in keys_dict.items():
            query = query.filter(getattr(Workspace, key) == value)
        return query.one_or_none()

    def get_all_workspaces(self, only_name=False):
        retlist = []
        for workspace in self.session.query(Workspace).all():
            if only_name:
                retlist.append(workspace.label)
            else:
                retlist.append(workspace)

        return retlist

    # on users
    def get_user_with_name(self, username):
        return self.session.query(User).filter(
            User.display_name == username
        ).one_or_none()

    # on path
    def get_id_from_path(self, path):
        path_id = self.from_name_to_id(path)

        if path_id == '/':
            return None
        else:
            return int(basename(path_id))

    def get_parent_id_from_path(self, path):
        return self.get_id_from_path(dirname(path))

    #########################################################
    # Everything that goes with "move"
    def move_item(self, item, destpath):
        path = normpath(destpath)

        if dirname(dirname(path)) == '/':
            new_parent = None
        else:
            new_parent = self.get_parent_id_from_path(path)

        item.parent_id = new_parent
        item.workspace_id = self.get_workspace_id_from_path(path)
        item.item_name = basename(path)
        self.session.commit()

    def move_all_revisions(self, item, destpath):
        path = normpath(destpath)
        new_parent = self.get_parent_id_from_path(path)
        new_workspace = self.get_workspace_id_from_path(destpath)

        items = self.get_all_revisions_from_item(item)

        for current_item in items:
            current_item.parent_id = new_parent
            current_item.workspace_id = new_workspace

        new_name = basename(normpath(destpath))

        new_item = self.add_item(
            item_name=new_name,
            item_type=item.item_type,
            workspace_id=item.workspace_id,
            parent_id=item.parent_id,
            parent_revision_id=item.id,
            child_revision_id=None,
            item_content=item.item_content,
            created=item.created,
            updated=datetime.now()
        )

        item.child_revision_id = new_item.id

        self.session.commit()

    #########################################################
    # Everything that goes with "copy"
    def copy_item(self, item, destpath):
        path = normpath(destpath)

        new_parent = self.get_parent_id_from_path(path)
        new_workspace = self.get_workspace_id_from_path(path)
        items = self.get_all_revisions_from_item(item)

        first = True
        last_item = None

        for current_item in items:
            new_item = self.add_item(
                item_name=current_item.item_name,
                item_type=current_item.item_type,
                workspace_id=new_workspace,
                parent_id=new_parent,
                parent_revision_id=None,
                child_revision_id=None,
                item_content=current_item.item_content,
                created=current_item.created,
                updated=current_item.updated
            )

            if not first:
                last_item.child_revision_id = new_item.id
                new_item.parent_revision_id = last_item.id

            first = False
            last_item = new_item

        new_name = basename(destpath)
        
        new_item = self.add_item(
            item_name=new_name,
            item_type=item.item_type,
            workspace_id=new_workspace,
            parent_id=new_parent,
            parent_revision_id=last_item.id,
            child_revision_id=None,
            item_content=item.item_content,
            created=datetime.now(),
            updated=datetime.now()
        )

        last_item.child_revision_id = new_item.id

        self.session.commit()'''

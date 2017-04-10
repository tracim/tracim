# -*- coding: utf-8 -*-

import tg
from tg import tmpl_context
from tg.i18n import ugettext as _
from tg.predicates import not_anonymous

from tracim.config.app_cfg import CFG

from tracim.controllers import TIMRestController
from tracim.controllers.content import UserWorkspaceFolderRestController

from tracim.lib.helpers import convert_id_into_instances
from tracim.lib.content import ContentApi
from tracim.lib.utils import str_as_bool
from tracim.lib.workspace import WorkspaceApi

from tracim.model.data import NodeTreeItem
from tracim.model.data import Content
from tracim.model.data import ContentType
from tracim.model.data import Workspace

from tracim.model.serializers import Context, CTX, DictLikeClass


class UserWorkspaceRestController(TIMRestController):

    allow_only = not_anonymous()

    folders = UserWorkspaceFolderRestController()

    @property
    def _base_url(self):
        return '/dashboard/workspaces'

    @classmethod
    def current_item_id_key_in_context(cls) -> str:
        return 'workspace_id'


    @tg.expose()
    def get_all(self, *args, **kw):
        tg.redirect(tg.url('/home'))

    @tg.expose()
    def mark_read(self, workspace_id, **kwargs):

        user = tmpl_context.current_user
        workspace_api = WorkspaceApi(user)
        workspace = workspace_api.get_one(workspace_id)

        content_api = ContentApi(user)
        content_api.mark_read__workspace(workspace)

        tg.redirect('/workspaces/{}'.format(workspace_id))
        return DictLikeClass(fake_api=fake_api)

    @tg.expose('tracim.templates.workspace.getone')
    def get_one(self, workspace_id, **kwargs):
        """
        :param workspace_id: Displayed workspace id
        :param kwargs:
          * show_deleted: bool: Display deleted contents or hide them if False
          * show_archived: bool: Display archived contents or hide them
            if False
        """
        show_deleted = str_as_bool(kwargs.get('show_deleted', False))
        show_archived = str_as_bool(kwargs.get('show_archived', ''))
        user = tmpl_context.current_user

        workspace_api = WorkspaceApi(user)
        workspace = workspace_api.get_one(workspace_id)

        unread_contents = ContentApi(user).get_last_unread(None,
                                                           ContentType.Any,
                                                           workspace=workspace)
        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        current_user_content.roles.sort(key=lambda role: role.workspace.name)



        dictified_current_user = Context(CTX.CURRENT_USER).toDict(user)
        dictified_folders = self.folders.get_all_fake(workspace).result
        fake_api = DictLikeClass(
            last_unread=Context(CTX.CONTENT_LIST).toDict(unread_contents,
                                                         'contents',
                                                         'nb'),
            current_user=dictified_current_user,
            current_workspace_folders=dictified_folders,
            current_user_workspace_role=workspace.get_user_role(user)
        )

        fake_api.sub_items = Context(CTX.FOLDER_CONTENT_LIST).toDict(
            # TODO BS 20161209: Is the correct way to grab folders? No use API?
            workspace.get_valid_children(
                ContentApi.DISPLAYABLE_CONTENTS,
                show_deleted=show_deleted,
                show_archived=show_archived,
            )
        )

        dictified_workspace = Context(CTX.WORKSPACE).toDict(workspace, 'workspace')
        webdav_url = CFG.get_instance().WSGIDAV_CLIENT_BASE_URL

        return DictLikeClass(
            result=dictified_workspace,
            fake_api=fake_api,
            webdav_url=webdav_url,
            show_deleted=show_deleted,
            show_archived=show_archived,
        )

    @tg.expose('json')
    def treeview_root(self, id='#',
                      current_id=None,
                      all_workspaces=True,
                      folder_allowed_content_types='',
                      ignore_id=None,
                      ignore_workspace_id=None):
        all_workspaces = bool(int(all_workspaces))

        # ignore_workspace_id is a string like 3,12,78,15
        ignored_ids = [int(id) for id in ignore_workspace_id.split(',')] if ignore_workspace_id else None

        if not current_id:
            # Default case is to return list of workspaces
            api = WorkspaceApi(tmpl_context.current_user)
            workspaces = api.get_all_for_user(tmpl_context.current_user,
                                              ignored_ids)
            dictified_workspaces = Context(CTX.MENU_API).toDict(workspaces, 'd')
            return dictified_workspaces

        allowed_content_types = ContentType.allowed_types_from_str(folder_allowed_content_types)
        ignored_item_ids = [int(ignore_id)] if ignore_id else []

        # Now complex case: we must return a structured tree
        # including the selected node, all parents (and their siblings)
        workspace, content = convert_id_into_instances(current_id)

        # The following step allow to select the parent folder when content itself is not visible in the treeview
        if content and content.type!=ContentType.Folder and CFG.CST.TREEVIEW_ALL!=CFG.get_instance().WEBSITE_TREEVIEW_CONTENT:
            content = content.parent if content.parent else None

        # This is the init of the recursive-like build of the tree
        content_parent = content
        tree_items = []

        # The first step allow to load child of selected item
        # (for example, when you select a folder in the windows explorer,
        # then the selected folder is expanded by default)
        content_api = ContentApi(tmpl_context.current_user)
        child_folders = content_api.get_child_folders(content_parent, workspace, allowed_content_types, ignored_item_ids)

        if len(child_folders)>0:
            first_child = child_folders[0]
            content_parent, tree_items = self._build_sibling_list_of_tree_items(workspace, first_child, tree_items, False, allowed_content_types, ignored_item_ids)

        content_parent, tree_items = self._build_sibling_list_of_tree_items(workspace, content_parent, tree_items, True, allowed_content_types, ignored_item_ids)
        while content_parent:
            # Do the same for the parent level
            content_parent, tree_items = self._build_sibling_list_of_tree_items(workspace, content_parent, tree_items)
        # Now, we have a tree_items list that is the root folders list,
        # so we now have to put it as a child of a list of workspaces
        should_select_workspace = not content

        full_tree = self._build_sibling_list_of_workspaces(workspace, tree_items, should_select_workspace, all_workspaces)

        return Context(CTX.MENU_API_BUILD_FROM_TREE_ITEM).toDict(full_tree, 'd')

    def _build_sibling_list_of_workspaces(self, workspace: Workspace, child_contents: [NodeTreeItem], select_active_workspace = False, all_workspaces = True) -> [NodeTreeItem]:

        root_items = []
        api = WorkspaceApi(tmpl_context.current_user)
        workspaces = api.get_all_for_user(tmpl_context.current_user)

        if not all_workspaces:
            # Show only current workspace - this is used for "move item" screen
            # which must not allow to move from a workspace to another
            item = NodeTreeItem(workspace, child_contents)
            item.is_selected = select_active_workspace
            root_items.append(item)
        else:
            for workspace_cursor in workspaces:
                item = None
                if workspace_cursor==workspace:
                    item = NodeTreeItem(workspace_cursor, child_contents)
                else:
                    item = NodeTreeItem(workspace_cursor, [])

                item.is_selected = select_active_workspace and workspace_cursor==workspace

                root_items.append(item)

        return root_items


    def _build_sibling_list_of_tree_items(self,
                                          workspace: Workspace,
                                          content: Content,
                                          children: [NodeTreeItem],
                                          select_active_node = False,
                                          allowed_content_types: list = [],
                                          ignored_item_ids: list = []) -> (Content, [NodeTreeItem]):
        api = ContentApi(tmpl_context.current_user)
        tree_items = []

        parent = content.parent if content else None

        viewable_content_types = self._get_treeviewable_content_types_or_none()
        child_contents = api.get_child_folders(parent, workspace, allowed_content_types, ignored_item_ids, viewable_content_types)
        for child in child_contents:
            children_to_add = children if child==content else []
            if child==content and select_active_node:
                # The item is the requested node, so we select it
                is_selected = True
            elif content not in child_contents and select_active_node and child==content:
                # The item is not present in the list, so we select its parent node
                is_selected = True
            else:
                is_selected = False

            new_item = NodeTreeItem(child, children_to_add, is_selected)
            tree_items.append(new_item)

        # This allow to show contents and folders group by type
        tree_items = ContentApi.sort_tree_items(tree_items)

        return parent, tree_items


    @tg.expose('json')
    def treeview_children(self, id='#',
                          ignore_id=None,
                          allowed_content_types = None):
        """
        id must be "#" or something like "workspace_3__document_8"
        """
        if id=='#':
            return self.treeview_root()

        ignore_item_ids = [int(ignore_id)] if ignore_id else []
        workspace, content = convert_id_into_instances(id)

        viewable_content_types = []
        if allowed_content_types:
            viewable_content_types = allowed_content_types.split(',')
        else:
            viewable_content_types = self._get_treeviewable_content_types_or_none()
        contents = ContentApi(tmpl_context.current_user).get_child_folders(content, workspace, [], ignore_item_ids, viewable_content_types)
        # This allow to show contents and folders group by type
        sorted_contents = ContentApi.sort_content(contents)

        dictified_contents = Context(CTX.MENU_API).toDict(sorted_contents, 'd')
        return dictified_contents

    def _get_treeviewable_content_types_or_none(self):
        if CFG.get_instance().WEBSITE_TREEVIEW_CONTENT==CFG.CST.TREEVIEW_ALL:
            return ContentType.Any
        return None # None means "workspaces and folders"

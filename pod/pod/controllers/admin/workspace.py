# -*- coding: utf-8 -*-

import tg
from tg import tmpl_context
from tg.i18n import ugettext as _

from pod.controllers import PodRestController
from pod.controllers import PodRestPathContextSetup


from pod.lib import CST
from pod.lib.base import BaseController
from pod.lib.user import UserApi
from pod.lib.userworkspace import RoleApi
from pod.lib.content import ContentApi
from pod.lib.workspace import WorkspaceApi

from pod.model.data import NodeTreeItem
from pod.model.data import PBNode
from pod.model.data import PBNodeType
from pod.model.data import Workspace
from pod.model.data import UserRoleInWorkspace

from pod.model.serializers import Context, CTX, DictLikeClass

from pod.controllers.content import UserWorkspaceFolderRestController




class RoleInWorkspaceRestController(PodRestController, BaseController):

    def _before(self, *args, **kw):
        """
        Instantiate the current workspace in tg.tmpl_context
        :param args:
        :param kw:
        :return:
        """
        super(self.__class__, self)._before(args, kw)

        workspace_api = WorkspaceApi(tg.tmpl_context.current_user)
        workspace_id = tg.request.controller_state.routing_args.get('workspace_id')
        workspace = workspace_api.get_one(workspace_id)
        tg.tmpl_context.workspace_id = workspace_id
        tg.tmpl_context.workspace = workspace

    @property
    def _base_url(self):
        return '/admin/workspaces/{}/roles'.format(tg.tmpl_context.workspace_id)

    @tg.expose()
    def get_one(self, user_id):
        pass


    def put(self, *args, **kw):
        pass

    @tg.expose()
    def get_delete(self, user_id):
        """
        Shortcut to post_delete for convenience only.
        This allow to put a link that allow to delete a user
        (instead of generating a POST or DELETE http query
        """
        return self.post_delete(user_id)

    @tg.expose()
    def post_delete(self, user_id):
        user_id = int(user_id)

        role_api = RoleApi(tg.tmpl_context.current_user)
        role = role_api.get_one(user_id, tg.tmpl_context.workspace_id)

        username = role.user.get_display_name()
        undo_url = self.url(user_id, 'undelete', dict(old_role=role.role))

        role_api.delete_one(user_id, tg.tmpl_context.workspace_id, True)

        tg.flash(_('User {} removed. You can <a href="{}">restore it</a>'.format(username, undo_url)))
        tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))

    @tg.expose()
    def undelete(self, user_id, old_role):
        user_id = int(user_id)
        role_id = int(old_role)
        self._add_user_with_role(user_id, role_id, _('User {} restored in workspace {} as {}'))
        tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))

    @tg.expose()
    def post(self, user_id, role_id):
        user_id = int(user_id)
        role_id = int(role_id)
        self._add_user_with_role(user_id, role_id, _('User {} added to workspace {} as {}'))
        tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))

    def _add_user_with_role(self, user_id: int, role_id: int, flash_msg_template)-> UserRoleInWorkspace:
        user_api = UserApi(tg.tmpl_context.current_user)
        user = user_api.get_one(user_id)

        role_api = RoleApi(tg.tmpl_context.current_user)
        role = role_api.create_one(user, tg.tmpl_context.workspace, role_id)

        print('THE ROLE=', role.role)
        print(role.role_as_label())

        tg.flash(flash_msg_template.format(
            role.user.get_display_name(),
            tg.tmpl_context.workspace.data_label,
            role.role_as_label()))

        tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))


    @tg.expose()
    def change(self, user_id, new_role):
        # FIXME CHECK RIGHTS
        new_role_id = int(new_role)
        role_api = RoleApi(tg.tmpl_context.current_user)
        role = role_api.get_one(user_id, tg.tmpl_context.workspace_id)

        if new_role_id not in role_api.ALL_ROLE_VALUES:
            tg.flash(_('Unknown role'))
            tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))
            return

        if new_role_id==role.role:
            tg.flash(_('No change found.'), 'error')
            tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))
            return

        role.role = new_role_id
        role_api.save(role)
        tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))


class WorkspaceRestController(PodRestController, BaseController):
    """
     CRUD Controller allowing to manage Workspaces

     Reminder: a workspace is a group of users with associated rights
     responsible / advanced contributor. / contributor / reader
    """

    @property
    def _base_url(self):
        return '/admin/workspaces'

    @classmethod
    def current_item_key_in_context(cls):
        return 'workspace_id'

    @tg.expose('pod.templates.workspace_get_all')
    def get_all(self, *args, **kw):

        user = tmpl_context.current_user
        workspace_api_controller = WorkspaceApi(user)

        workspaces = workspace_api_controller.get_all()

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        fake_api = Context(CTX.ADMIN_WORKSPACE).toDict({'current_user': current_user_content})

        dictified_workspaces = Context(CTX.ADMIN_WORKSPACES).toDict(workspaces, 'workspaces', 'workspace_nb')
        return DictLikeClass(result = dictified_workspaces, fake_api=fake_api)

    @tg.expose('pod.templates.workspace_get_one')
    def get_one(self, workspace_id):
        user = tmpl_context.current_user
        workspace_api_controller = WorkspaceApi(user)
        role_api = RoleApi(tg.tmpl_context.current_user)
        user_api = UserApi(tg.tmpl_context.current_user)

        workspace = workspace_api_controller.get_one(workspace_id)
        role_list = role_api.get_roles_for_select_field()
        user_list = user_api.get_all()

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)

        dictified_workspace = Context(CTX.ADMIN_WORKSPACE).toDict(workspace, 'workspace')
        fake_api_content = DictLikeClass(role_types=role_list, users=user_list, current_user=current_user_content)
        fake_api = Context(CTX.ADMIN_WORKSPACE).toDict(fake_api_content)

        return dict(result = dictified_workspace, fake_api = fake_api)

    @tg.expose()
    def post(self, name, description):
        # FIXME - Check user profile
        user = tmpl_context.current_user
        workspace_api_controller = WorkspaceApi(user)

        workspace = workspace_api_controller.create_workspace(name, description)

        tg.flash(_('{} workspace created.'.format(workspace.data_label)))
        print('URL IS ', self.url())
        exit()
        tg.redirect(self.url())
        return

    @tg.expose('pod.templates.workspace_edit')
    def edit(self, id):
        user = tmpl_context.current_user
        workspace_api_controller = WorkspaceApi(user)

        workspace = workspace_api_controller.get_one(id)

        dictified_workspace = Context(CTX.ADMIN_WORKSPACE).toDict(workspace, 'workspace')
        return DictLikeClass(result = dictified_workspace)

    @tg.expose('pod.templates.workspace_edit')
    def put(self, id, name, description):
        user = tmpl_context.current_user
        workspace_api_controller = WorkspaceApi(user)

        workspace = workspace_api_controller.get_one(id)
        workspace.data_label = name
        workspace.data_comment = description
        workspace_api_controller.save(workspace)

        tg.flash(_('{} workspace updated.'.format(workspace.data_label)))
        tg.redirect(self.url(workspace.workspace_id))
        return


    @tg.expose()
    def get_delete(self, workspace_id):
        """
        Shortcut to post_delete for convenience only.
        This allow to put a link that allow to delete a user
        (instead of generating a POST or DELETE http query
        """
        return self.post_delete(workspace_id)

    @tg.expose()
    def post_delete(self, workspace_id):
        workspace_id = int(workspace_id)

        api = WorkspaceApi(tg.tmpl_context.current_user)
        workspace = api.get_one(workspace_id)
        api.delete_one(workspace_id)

        workspace_label = workspace.data_label
        undo_url = self.url(workspace_id, self.restore.__name__)

        tg.flash(_('{} workspace deleted. In case of error, you can <a class="alert-link" href="{}">restore it</a>.'.format(workspace_label, undo_url)), 'info', no_escape=True)
        tg.redirect(self.url())

    @tg.expose()
    def restore(self, workspace_id):
        workspace_id = int(workspace_id)

        api = WorkspaceApi(tg.tmpl_context.current_user)
        workspace = api.restore_one(workspace_id, True)

        workspace_label = workspace.data_label
        undo_url = self.url(workspace_id, 'delete')

        tg.flash(_('{} workspace restored.').format(workspace_label))
        tg.redirect(self.url())

    roles = RoleInWorkspaceRestController()

class UserWorkspaceRestController(PodRestController):

    folders = UserWorkspaceFolderRestController()

    @property
    def _base_url(self):
        return '/dashboard/workspaces'


    @tg.expose('pod.templates.user_workspace_get_all')
    def get_all(self, *args, **kw):
        user = tmpl_context.current_user

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        current_user_content.roles.sort(key=lambda role: role.workspace.name)

        workspace_api = WorkspaceApi(user)
        workspaces = workspace_api.get_all_for_user(user)
        fake_api = Context(CTX.CURRENT_USER).toDict({'current_user': current_user_content})
        dictified_workspaces = Context(CTX.ADMIN_WORKSPACES).toDict(workspaces, 'workspaces', 'workspace_nb')

        return DictLikeClass(result = dictified_workspaces, fake_api=fake_api)

    @tg.expose('pod.templates.user_workspace_get_one')
    def get_one(self, workspace_id):
        user = tmpl_context.current_user

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        current_user_content.roles.sort(key=lambda role: role.workspace.name)

        workspace_api = WorkspaceApi(user)
        workspace = workspace_api.get_one(workspace_id)

        dictified_current_user = Context(CTX.CURRENT_USER).toDict(user)
        dictified_folders = self.folders.get_all_fake(workspace).result
        fake_api = DictLikeClass(current_user = dictified_current_user, current_workspace_folders = dictified_folders)
        dictified_workspace = Context(CTX.WORKSPACE).toDict(workspace, 'workspace')

        return DictLikeClass(result = dictified_workspace, fake_api=fake_api)



    @tg.expose('json')
    def treeview_root(self, id='#', current_id=None):

        if not current_id:
            # Default case is to return list of workspaces
            api = WorkspaceApi(tmpl_context.current_user)
            workspaces = api.get_all_for_user(tmpl_context.current_user)
            dictified_workspaces = Context(CTX.MENU_API).toDict(workspaces, 'd')
            return dictified_workspaces


        # Now complex case: we must return a structured tree
        # including the selected node, all parents (and their siblings)
        workspace, content = self._convert_id_into_instances(current_id)

        # This is the init of the recursive-like build of the tree
        content_parent = content
        tree_items = []

        # The first step allow to load child of selected item
        # (for example, when you select a folder in the windows explorer,
        # then the selected folder is expanded by default)
        content_api = ContentApi(tmpl_context.current_user)
        child_folders = content_api.get_child_folders(content_parent, workspace)
        if len(child_folders)>0:
            first_child = child_folders[0]
            content_parent, tree_items = self._build_sibling_list_of_tree_items(workspace, first_child, tree_items)

        content_parent, tree_items = self._build_sibling_list_of_tree_items(workspace, content_parent, tree_items, True)
        while content_parent:
            # Do the same for the parent level
            content_parent, tree_items = self._build_sibling_list_of_tree_items(workspace, content_parent, tree_items)
        # Now, we have a tree_items list that is the root folders list,
        # so we now have to put it as a child of a list of workspaces
        should_select_workspace = not content
        full_tree = self._build_sibling_list_of_workspaces(workspace, tree_items, should_select_workspace)

        return Context(CTX.MENU_API_BUILD_FROM_TREE_ITEM).toDict(full_tree, 'd')


    def _build_sibling_list_of_workspaces(self, workspace: Workspace, child_contents: [NodeTreeItem], select_active_workspace = False) -> [NodeTreeItem]:
        root_items = []
        api = WorkspaceApi(tmpl_context.current_user)
        workspaces = api.get_all_for_user(tmpl_context.current_user)
        for workspace_cursor in workspaces:
            item = None
            if workspace_cursor==workspace:
                item = NodeTreeItem(workspace_cursor, child_contents)
            else:
                item = NodeTreeItem(workspace_cursor, [])

            item.is_selected = select_active_workspace and workspace_cursor==workspace

            root_items.append(item)

        return root_items

    def _build_sibling_list_of_tree_items(self, workspace: Workspace, content: PBNode, children: [NodeTreeItem], select_active_node = False) -> (PBNode, [NodeTreeItem]):
        api = ContentApi(tmpl_context.current_user)
        tree_items = []

        parent = content.parent if content else None
        for child in api.get_child_folders(parent, workspace):
            children_to_add = children if child==content else []
            is_selected = True if select_active_node and child==content else False
            new_item = NodeTreeItem(child, children_to_add, is_selected)
            tree_items.append(new_item)


        return parent, tree_items

    def _convert_id_into_instances(self, id: str) -> (Workspace, PBNode):
        """
        convert an id like 'workspace_<workspace_id>|content_<content_id>'
        into two objects: the given workspace instance and the given content instance
        """

        if id=='#':
            return None, None

        workspace_str, content_str = id.split(CST.TREEVIEW_MENU.ITEM_SEPARATOR)
        workspace = None
        content = None

        try:
            workspace_data = workspace_str.split(CST.TREEVIEW_MENU.ID_SEPARATOR)
            workspace_id = workspace_data[1]
            workspace = WorkspaceApi(tmpl_context.current_user).get_one(workspace_id)
        except:
            workspace = None

        try:
            content_data = content_str.split(CST.TREEVIEW_MENU.ID_SEPARATOR)
            content_id = int(content_data[1])
            content = ContentApi(tmpl_context.current_user).get_one(content_id, PBNodeType.Folder)
        except IndexError as e:
            content = None

        return workspace, content


    @tg.expose('json')
    def treeview_children(self, id='#'):
        """
        id must be "#" or something like "workspace_3__document_8"
        """
        if id=='#':
            return self.treeview_root()

        workspace, content = self._convert_id_into_instances(id)
        contents = ContentApi(tmpl_context.current_user).get_child_folders(content, workspace)

        dictified_contents = Context(CTX.MENU_API).toDict(contents, 'd')
        return dictified_contents


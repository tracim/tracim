# -*- coding: utf-8 -*-

import tg
from tg import tmpl_context
from tg.i18n import ugettext as _

from tracim.controllers import TIMRestController
from tracim.controllers import TIMRestPathContextSetup


from tracim.lib import CST
from tracim.lib.base import BaseController
from tracim.lib.user import UserApi
from tracim.lib.userworkspace import RoleApi
from tracim.lib.content import ContentApi
from tracim.lib.workspace import WorkspaceApi

from tracim.model.auth import Group
from tracim.model.data import NodeTreeItem
from tracim.model.data import Content
from tracim.model.data import ContentType
from tracim.model.data import Workspace
from tracim.model.data import UserRoleInWorkspace

from tracim.model.serializers import Context, CTX, DictLikeClass

from tracim.controllers.content import UserWorkspaceFolderRestController




class RoleInWorkspaceRestController(TIMRestController, BaseController):

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

        if tmpl_context.current_user.profile.id<Group.TIM_ADMIN and tmpl_context.current_user.user_id==user_id:
            tg.flash(_('You can\'t remove yourself from this workgroup'), CST.STATUS_ERROR)
            tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))

        role_api.delete_one(user_id, tg.tmpl_context.workspace_id, True)
        tg.flash(_('User {} removed. You can <a class="alert-link" href="{}">restore it</a>').format(username, undo_url), CST.STATUS_OK, no_escape=True)
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

        tg.flash(flash_msg_template.format(
            role.user.get_display_name(),
            tg.tmpl_context.workspace.label,
            role.role_as_label()), CST.STATUS_OK)

        tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))


    @tg.expose()
    def change(self, user_id, new_role):
        # FIXME CHECK RIGHTS
        user_id = int(user_id)
        new_role_id = int(new_role)
        role_api = RoleApi(tg.tmpl_context.current_user)
        role = role_api.get_one(user_id, tg.tmpl_context.workspace_id)

        if tmpl_context.current_user.profile.id<Group.TIM_ADMIN and tmpl_context.current_user.user_id==user_id:
            tg.flash(_('You can\'t change your own role'), CST.STATUS_ERROR)
            tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))

        if new_role_id not in role_api.ALL_ROLE_VALUES:
            tg.flash(_('Unknown role'), CST.STATUS_ERROR)
            tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))
            return

        if new_role_id==role.role:
            tg.flash(_('No change found.'), CST.STATUS_ERROR)
            tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))
            return

        role.role = new_role_id
        role_api.save(role)
        tg.redirect(self.parent_controller.url(tg.tmpl_context.workspace_id))


class WorkspaceRestController(TIMRestController, BaseController):
    """
     CRUD Controller allowing to manage Workspaces

     Reminder: a workspace is a group of users with associated rights
     responsible / advanced contributor. / contributor / reader
    """

    @property
    def _base_url(self):
        return '/admin/workspaces'

    @classmethod
    def current_item_id_key_in_context(cls):
        return 'workspace_id'

    @tg.expose('tracim.templates.workspace_get_all')
    def get_all(self, *args, **kw):

        user = tmpl_context.current_user
        workspace_api_controller = WorkspaceApi(user)

        workspaces = workspace_api_controller.get_all()

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        fake_api = Context(CTX.ADMIN_WORKSPACE).toDict({'current_user': current_user_content})

        dictified_workspaces = Context(CTX.ADMIN_WORKSPACES).toDict(workspaces, 'workspaces', 'workspace_nb')
        return DictLikeClass(result = dictified_workspaces, fake_api=fake_api)

    @tg.expose('tracim.templates.workspace_get_one')
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

        tg.flash(_('{} workspace created.').format(workspace.label), CST.STATUS_OK)
        tg.redirect(self.url())
        return

    @tg.expose('tracim.templates.workspace_edit')
    def edit(self, id):
        user = tmpl_context.current_user
        workspace_api_controller = WorkspaceApi(user)

        workspace = workspace_api_controller.get_one(id)

        dictified_workspace = Context(CTX.ADMIN_WORKSPACE).toDict(workspace, 'workspace')
        return DictLikeClass(result = dictified_workspace)

    @tg.expose('tracim.templates.workspace_edit')
    def put(self, id, name, description):
        user = tmpl_context.current_user
        workspace_api_controller = WorkspaceApi(user)

        workspace = workspace_api_controller.get_one(id)
        workspace.label = name
        workspace.description = description
        workspace_api_controller.save(workspace)

        tg.flash(_('{} workspace updated.').format(workspace.label), CST.STATUS_OK)
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

        workspace_label = workspace.label
        undo_url = self.url(workspace_id, self.restore.__name__)

        tg.flash(_('{} workspace deleted. In case of error, you can <a class="alert-link" href="{}">restore it</a>.').format(workspace_label, undo_url), CST.STATUS_OK, no_escape=True)
        tg.redirect(self.url())

    @tg.expose()
    def restore(self, workspace_id):
        workspace_id = int(workspace_id)

        api = WorkspaceApi(tg.tmpl_context.current_user)
        workspace = api.restore_one(workspace_id, True)

        workspace_label = workspace.label
        undo_url = self.url(workspace_id, 'delete')

        tg.flash(_('{} workspace restored.').format(workspace_label), CST.STATUS_OK)
        tg.redirect(self.url())

    roles = RoleInWorkspaceRestController()


# -*- coding: utf-8 -*-

from pod import model  as pm

from sprox.tablebase import TableBase
from sprox.formbase import EditableForm, AddRecordForm
from sprox.fillerbase import TableFiller, EditFormFiller
from tw2 import forms as tw2f
import tg

from sprox.widgets import PropertyMultipleSelectField
from sprox._compat import unicode_text

from formencode import Schema
from formencode.validators import FieldsMatch

from pod.lib.dbapi import PODStaticController
from pod.lib.userworkspace import UserRoleInWorkspaceApi
from pod.lib.workspace import WorkspaceApi

from pod.model.serializers import CTX, Context, DictLikeClass


class UserRoleInWorkspace(tg.RestController):
    """

    def __before__(self, *args, **kw):
        workspace_id = tg.request.url.split('/')[-3]
        # pylons.c.movie = DBSession.query(Movie).get(movie_id)

    @tg.expose()
    def get_all(self):
        return "agaga"
    """


    def _before(self, *args, **kw):
        """
        Instantiate the current workspace in tg.tmpl_context
        :param args:
        :param kw:
        :return:
        """
        workspace_id = tg.request.controller_state.routing_args.get('workspace_id')
        user = PODStaticController.getCurrentUser()
        workspace_api_controller = UserRoleInWorkspaceApi(user)
        workspace = workspace_api_controller.get_one(workspace_id)
        tg.tmpl_context.workspace_id = workspace_id
        tg.tmpl_context.workspace = workspace

        tg.tmpl_context.current_user = user

    @tg.expose()
    def get_one(self, user_id):
        pass


    def put(self, user_id, new_role):
        # FIXME CHECK RIGHTS
        user_workspace_api_controller = UserRoleInWorkspaceApi(tg.tmpl_context.current_user)

        role = user_workspace_api_controller.get_one(user_id, tg.tmpl_context.workspace_id)
        if new_role in user_workspace_api_controller.ALL_ROLE_VALUES:
            role.role = new_role

        user_workspace_api_controller.save(role)


class WorkspacesController(tg.RestController):
    """
     CRUD Controller allowing to manage Workspaces

     Reminder: a workspace is a group of users with associated rights
     responsible / advanced contributor. / contributor / reader
    """

    @tg.expose('pod.templates.workspace_get_all')
    def get_all(self, *args, **kw):
        user = PODStaticController.getCurrentUser()
        workspace_api_controller = WorkspaceApi(user)

        workspaces = workspace_api_controller.get_all()

        dictified_workspaces = Context(CTX.WORKSPACES).toDict(workspaces, 'workspaces', 'workspace_nb')
        return DictLikeClass(result = dictified_workspaces)

    @tg.expose('pod.templates.workspace_get_one')
    def get_one(self, workspace_id):
        user = PODStaticController.getCurrentUser()
        workspace_api_controller = WorkspaceApi(user)

        workspace = workspace_api_controller.get_one(workspace_id)

        dictified_workspace = Context(CTX.WORKSPACE).toDict(workspace, 'workspace')
        return DictLikeClass(result = dictified_workspace)

    @tg.expose()
    def post(self, name, description):
        # FIXME - Check user profile
        user = PODStaticController.getCurrentUser()
        workspace_api_controller = WorkspaceApi(user)

        workspace = workspace_api_controller.create_workspace()
        workspace.data_label = name
        workspace.data_comment = description
        workspace_api_controller.save(workspace)

        tg.redirect(tg.url('/workspaces'))
        return

    @tg.expose('pod.templates.workspace_edit')
    def edit(self, id):
        user = PODStaticController.getCurrentUser()
        workspace_api_controller = WorkspaceApi(user)

        workspace = workspace_api_controller.get_one(id)

        dictified_workspace = Context(CTX.WORKSPACE).toDict(workspace, 'workspace')
        return DictLikeClass(result = dictified_workspace)

    @tg.expose('pod.templates.workspace_edit')
    def put(self, id, name, description):
        user = PODStaticController.getCurrentUser()
        workspace_api_controller = WorkspaceApi(user)

        workspace = workspace_api_controller.get_one(id)
        workspace.data_label = name
        workspace.data_comment = description
        workspace_api_controller.save(workspace)

        tg.redirect(tg.url('/workspaces/{}'.format(workspace.workspace_id)))
        return

    @tg.expose('pod.templates.workspace_get_one')
    def user_role(self, workspace_id, other_id, another):
        user = PODStaticController.getCurrentUser()
        workspace_api_controller = WorkspaceApi(user)

        workspace = workspace_api_controller.get_one(workspace_id)

        dictified_workspace = Context(CTX.WORKSPACE).toDict(workspace, 'workspace')
        return DictLikeClass(result = dictified_workspace)

    users = UserRoleInWorkspace()
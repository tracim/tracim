# -*- coding: utf-8 -*-

__author__ = 'damien'

import os
from datetime import datetime
from hashlib import sha256

from sqlalchemy import Table, ForeignKey, Column
from sqlalchemy.types import Unicode, Integer, DateTime, Text
from sqlalchemy.orm import relation, synonym, contains_eager
from sqlalchemy.orm import joinedload_all
import sqlalchemy.orm as sqlao
import sqlalchemy as sqla

import tg

from tracim.lib.userworkspace import RoleApi
from tracim.model.auth import Group
from tracim.model.auth import User
from tracim.model.data import Workspace
from tracim.model.data import UserRoleInWorkspace

from tracim.model import auth as pbma
from tracim.model import DBSession


class WorkspaceApi(object):

    def __init__(self, current_user: User):
        self._user = current_user

    def _base_query(self):
        if self._user.profile.id>=Group.TIM_ADMIN:
            return DBSession.query(Workspace).filter(Workspace.is_deleted==False)

        return DBSession.query(Workspace).\
            join(Workspace.roles).\
            filter(UserRoleInWorkspace.user_id==self._user.user_id).\
            filter(Workspace.is_deleted==False)

    def create_workspace(self, label: str, description: str='', save_now:bool=False) -> Workspace:
        workspace = Workspace()
        workspace.label = label
        workspace.description = description

        # By default, we force the current user to be the workspace manager
        # And to receive email notifications
        role = RoleApi(self._user).create_one(self._user, workspace,
                                              UserRoleInWorkspace.WORKSPACE_MANAGER,
                                              with_notif=True)

        DBSession.add(workspace)
        DBSession.add(role)

        if save_now:
            DBSession.flush()

        return workspace

    def get_one(self, id):
        return self._base_query().filter(Workspace.workspace_id==id).one()

    """
    def get_one_for_current_user(self, id):
        return self._base_query().filter(Workspace.workspace_id==id).\
            session.query(ZKContact).filter(ZKContact.groups.any(ZKGroup.id.in_([1,2,3])))
            filter(sqla.).one()
    """

    def get_all(self):
        return self._base_query().all()

    def get_all_for_user(self, user: User, ignored_ids=None):
        workspaces = []

        for role in user.roles:
            if not role.workspace.is_deleted:
                if not ignored_ids:
                    workspaces.append(role.workspace)
                elif role.workspace.workspace_id not in ignored_ids:
                        workspaces.append(role.workspace)
                else:
                    pass  # do not return workspace

        workspaces.sort(key=lambda workspace: workspace.label.lower())
        return workspaces

    def disable_notifications(self, user: User, workspace: Workspace):
        for role in user.roles:
            if role.workspace==workspace:
                role.do_notify = False

    def enable_notifications(self, user: User, workspace: Workspace):
        for role in user.roles:
            if role.workspace==workspace:
                role.do_notify = True

    def get_notifiable_roles(self, workspace: Workspace) -> [UserRoleInWorkspace]:
        roles = []
        for role in workspace.roles:
            if role.do_notify==True and role.user!=self._user:
                roles.append(role)
        return roles

    def save(self, workspace: Workspace):
        DBSession.flush()

    def delete_one(self, workspace_id, flush=True):
        workspace = self.get_one(workspace_id)
        workspace.is_deleted = True

        if flush:
            DBSession.flush()

    def restore_one(self, workspace_id, flush=True):
        workspace = DBSession.query(Workspace).filter(Workspace.is_deleted==True).filter(Workspace.workspace_id==workspace_id).one()
        workspace.is_deleted = False

        if flush:
            DBSession.flush()

        return workspace


class UnsafeWorkspaceApi(WorkspaceApi):
    def _base_query(self):
        return DBSession.query(Workspace).filter(Workspace.is_deleted==False)

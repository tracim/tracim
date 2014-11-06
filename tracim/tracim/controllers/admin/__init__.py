# -*- coding: utf-8 -*-

from tg.predicates import in_any_group

from tracim.controllers import StandardController
from tracim.controllers.admin.workspace import WorkspaceRestController
from tracim.controllers.admin.user import UserRestController

from tracim.model.auth import Group


class AdminController(StandardController):

    allow_only = in_any_group(Group.TIM_MANAGER_GROUPNAME, Group.TIM_ADMIN_GROUPNAME)

    # FIXME - Check rights
    workspaces = WorkspaceRestController()
    users = UserRestController()
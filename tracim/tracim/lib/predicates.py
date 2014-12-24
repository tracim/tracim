# -*- coding: utf-8 -*-

from tg import abort
from tg import request
from tg import tmpl_context
from tg.i18n import lazy_ugettext as l_
from tg.i18n import ugettext as _
from tg.predicates import Predicate

from tracim.model.data import ContentType
from tracim.lib.base import logger
from tracim.lib.content import ContentApi

from tracim.model.data import UserRoleInWorkspace


FORBIDDEN_MSG = l_('You are not authorized to access this resource')

class WorkspaceRelatedPredicate(Predicate):
    def __init__(self, **kwargs):
        super(WorkspaceRelatedPredicate, self).__init__(**kwargs)
        self.message = FORBIDDEN_MSG

    def minimal_role_level(self) -> int:
        """
        This method must be implemented in child classes. It defines the role of the user in the given workspace
        :return: required level associated to the predicate
        """
        raise NotImplementedError


    def evaluate(self, environ, credentials):
        # Comment next line if you want to activate the debug controller
        try:
            current_user = tmpl_context.current_user
            workspace = tmpl_context.workspace
            if workspace.get_user_role(current_user)>= self.minimal_role_level():
                return
        except Exception as e:
            logger.warning(self, 'Exception catched: {}'.format(e.__str__))
            self.unmet()
        self.unmet()


class current_user_is_reader(WorkspaceRelatedPredicate):
    def minimal_role_level(self):
        return UserRoleInWorkspace.READER


class current_user_is_contributor(WorkspaceRelatedPredicate):
    def minimal_role_level(self):
        return UserRoleInWorkspace.CONTRIBUTOR


class current_user_is_content_manager(WorkspaceRelatedPredicate):
    def minimal_role_level(self):
        return UserRoleInWorkspace.CONTENT_MANAGER


class current_user_is_workspace_manager(WorkspaceRelatedPredicate):
    def minimal_role_level(self):
        return UserRoleInWorkspace.WORKSPACE_MANAGER

def require_current_user_is_owner(item_id: int):
    current_user = tmpl_context.current_user
    item = ContentApi(current_user, True, True).get_one(item_id, ContentType.Any)

    if item.owner_id!=current_user.user_id:
        abort(403, _('You\'re not allowed to access this resource'))

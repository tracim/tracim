# -*- coding: utf-8 -*-

__author__ = 'damien'

from tracim.model.auth import Group, User
from sqlalchemy.orm import Query

from tracim.model import DBSession

class GroupApi(object):

    def __init__(self, current_user: User):
        self._user = current_user

    def _base_query(self) -> Query:
        return DBSession.query(Group)

    def get_one(self, group_id) -> Group:
        return self._base_query().filter(Group.group_id==group_id).one()

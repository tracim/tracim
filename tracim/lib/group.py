# -*- coding: utf-8 -*-

__author__ = 'damien'

from tracim.models.auth import Group, User
from sqlalchemy.orm import Query
from sqlalchemy.orm import Session


class GroupApi(object):

    def __init__(self, session: Session, current_user: User):
        self._user = current_user
        self._session = session

    def _base_query(self) -> Query:
        return self._session.query(Group)

    def get_one(self, group_id) -> Group:
        return self._base_query().filter(Group.group_id == group_id).one()

    def get_one_with_name(self, group_name) -> Group:
        return self._base_query().filter(Group.group_name == group_name).one()

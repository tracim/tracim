# -*- coding: utf-8 -*-
import typing

from tracim import CFG

__author__ = 'damien'

from tracim.models.auth import Group, User
from sqlalchemy.orm import Query
from sqlalchemy.orm import Session


class GroupApi(object):

    def __init__(
            self,
            session: Session,
            current_user: typing.Optional[User],
            config: CFG
    ):
        self._user = current_user
        self._session = session
        self._config = config

    def _base_query(self) -> Query:
        return self._session.query(Group)

    def get_one(self, group_id) -> Group:
        return self._base_query().filter(Group.group_id == group_id).one()

    def get_one_with_name(self, group_name) -> Group:
        return self._base_query().filter(Group.group_name == group_name).one()

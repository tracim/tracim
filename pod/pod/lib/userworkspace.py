# -*- coding: utf-8 -*-

__author__ = 'damien'

import os
from datetime import datetime
from hashlib import sha256

from sqlalchemy import Table, ForeignKey, Column
from sqlalchemy.types import Unicode, Integer, DateTime, Text
from sqlalchemy.orm import relation, synonym
from sqlalchemy.orm import joinedload_all
import sqlalchemy.orm as sqlao
import sqlalchemy as sqla

import tg

from pod.model.auth import User
from pod.model.data import Workspace
from pod.model.data import UserRoleInWorkspace

from pod.model import auth as pbma
from pod.model import DBSession


class WorkspaceApiController(object):

    def __init__(self, current_user: User):
        self._user = current_user

    def create_workspace(self, save_now=False):
        workspace = Workspace()
        DBSession.add(workspace)
        if save_now:
            DBSession.flush()

        return workspace

    def get_one(self, id):
        return DBSession.query(Workspace).filter(Workspace.workspace_id==id).one()

    def get_all(self):
        return DBSession.query(Workspace).all()

    def save(self, workspace: Workspace):
        DBSession.flush()
        # DBSession.save(workspace)

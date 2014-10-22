# -*- coding: utf-8 -*-

__author__ = 'damien'

import tg

from pod.model.auth import User

from pod.model import auth as pbma
from pod.model import DBSession
import pod.model.data as pmd
# import DIRTY_GroupRightsOnNode, DIRTY_UserDedicatedGroupRightOnNodeSqlQuery, DIRTY_RealGroupRightOnNodeSqlQuery, PBNode

class UserApi(object):

    def __init__(self, current_user: User):
        self._user = current_user

    def get_all(self):
        return DBSession.query(User).all()

    def _base_query(self):
        return DBSession.query(User).filter(User.is_deleted==False)

    def get_one_by_email(self, email_address: str):
        return self._base_query().filter(User.email_address==email_address).one()

    def create_user(self, save_now=False) -> User:
        user = User()
        DBSession.add(user)
        if save_now:
            DBSession.flush()

    def save(self, user: User):
        DBSession.flush()

class UserStaticApi(object):

  @classmethod
  def get_current_user(cls):
    loCurrentUser = pbma.User.by_email_address(tg.request.identity['repoze.who.userid'])
    return loCurrentUser

  @classmethod
  def getUserByEmailAddress(cls, psEmailAddress):
    loUser = pbma.User.by_email_address(psEmailAddress)
    return loUser

  @classmethod
  def createNewUser(cls, real_name, email_address, password, groups):
    loUser = pbma.User()
    new_user = pbma.User()
    new_user.email_address = email_address
    new_user.display_name  = real_name if real_name!='' else email_address
    new_user.password      = password

    public_group = cls.getGroupById(pbma.Group.POD_USER)
    public_group.users.append(new_user)

    DBSession.add(new_user)
    DBSession.flush()
    DBSession.refresh(new_user)

    user_dedicated_group = cls.createGroup()
    user_dedicated_group.group_id = 0-new_user.user_id # group id of a given user is the opposite of the user id
    user_dedicated_group.group_name = 'user_%d' % new_user.user_id
    user_dedicated_group.personnal_group = True
    user_dedicated_group.users.append(new_user)

    for group_id in groups:
        selected_group = cls.getGroupById(group_id)
        selected_group.users.append(new_user)

    DBSession.flush()

    return new_user

  @classmethod
  def updateUser(cls, user_id, real_name, email, group_ids):

      group_ids = list(map(int, group_ids))
      group_ids.append(pbma.Group.POD_USER)
      print('new group ids:', group_ids)
      user_to_update = DBSession.query(pbma.User).filter(pbma.User.user_id==user_id).one()
      user_to_update.display_name = real_name
      user_to_update.email_address = email

      merged_new_groups = []

      for group in user_to_update.groups:
          if group.group_id==pbma.Group.POD_ADMIN:
              print('adding group (3)', group.group_id)
              merged_new_groups.append(group)

          elif group.group_id==pbma.Group.POD_USER:
              print('adding group (2)', group.group_id)
              merged_new_groups.append(group)

          elif group.group_id in group_ids:
              print('adding group', group.group_id)
              merged_new_groups.append(group)

          else:
              print('remove group', group.group_id)
              user_to_update.groups.remove(group)

      for group_id in group_ids:
          group = cls.getGroupById(group_id)

          if group not in merged_new_groups:
              merged_new_groups.append(group)

      user_to_update.groups = merged_new_groups

      for group in merged_new_groups:
          print("group => ", group.group_id)
      DBSession.flush()

  @classmethod
  def deleteUser(cls, user_id):
      user_to_delete = DBSession.query(pbma.User).filter(pbma.User.user_id==user_id).one()
      user_dedicated_group = DBSession.query(pbma.Group).filter(pbma.Group.group_id==-user_id).one()
      DBSession.delete(user_to_delete)
      DBSession.delete(user_dedicated_group)
      DBSession.flush()

  @classmethod
  def getGroup(cls, psGroupName):
    loGroup = pbma.Group.by_group_name(psGroupName)
    return loGroup

  @classmethod
  def getGroupById(cls, group_id):
    return DBSession.query(pbma.Group).filter(pbma.Group.group_id==group_id).one()

  @classmethod
  def createGroup(cls):
    loGroup = pbma.Group()
    return loGroup

  @classmethod
  def getGroups(cls):
    loGroups = pbma.Group.real_groups_first()
    return loGroups

  @classmethod
  def getRealGroupRightsOnNode(cls, piNodeId: int) -> pmd.DIRTY_GroupRightsOnNode:

    groupRightsOnNodeCustomSelect = DBSession\
        .query(pmd.DIRTY_GroupRightsOnNode)\
        .from_statement(pmd.DIRTY_RealGroupRightOnNodeSqlQuery)\
        .params(node_id=piNodeId)\
        .all()

    return groupRightsOnNodeCustomSelect

  @classmethod
  def getUserDedicatedGroupRightsOnNode(cls, node: pmd.PBNode) -> pmd.DIRTY_GroupRightsOnNode:

    group_rights_on_node = []
    if node:
        group_rights_on_node = DBSession\
            .query(pmd.DIRTY_GroupRightsOnNode)\
            .from_statement(pmd.DIRTY_UserDedicatedGroupRightOnNodeSqlQuery)\
            .params(node_id=node.node_id)\
            .all()

    return group_rights_on_node

  @classmethod
  def DIRTY_get_rights_on_node(self, user_id, node_id):
      rights = DBSession\
              .execute("""select max(rights) as rights
                      from pod_user_group
                      natural join pod_group_node
                      where node_id=:node_id
                      and user_id=:user_id""", {"node_id":node_id, "user_id":user_id})\
              .fetchone()
      r = pmd.DIRTY_GroupRightsOnNode()
      r.rights = rights[0]
      return r





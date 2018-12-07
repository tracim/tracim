# -*- coding: utf-8 -*-
from tracim_backend.models.auth import User
from tracim_backend.models.data import UserRoleInWorkspace


CALENDAR_PERMISSION_READ = 'r'
CALENDAR_PERMISSION_WRITE = 'w'


class Calendar(object):
    def __init__(self, related_object, path):
        self._related_object = related_object
        self._path = path

    @property
    def related_object(self):
        return self._related_object

    def user_can_read(self, user: User) -> bool:
        raise NotImplementedError()

    def user_can_write(self, user: User) -> bool:
        raise NotImplementedError()


class UserCalendar(Calendar):
    def user_can_write(self, user: User) -> bool:
        return self._related_object.user_id == user.user_id

    def user_can_read(self, user: User) -> bool:
        return self._related_object.user_id == user.user_id


class WorkspaceCalendar(Calendar):
    _workspace_rights = {
        UserRoleInWorkspace.NOT_APPLICABLE:
            [],
        UserRoleInWorkspace.READER:
            [CALENDAR_PERMISSION_READ],
        UserRoleInWorkspace.CONTRIBUTOR:
            [CALENDAR_PERMISSION_READ, CALENDAR_PERMISSION_WRITE],
        UserRoleInWorkspace.CONTENT_MANAGER:
            [CALENDAR_PERMISSION_READ, CALENDAR_PERMISSION_WRITE],
        UserRoleInWorkspace.WORKSPACE_MANAGER:
            [CALENDAR_PERMISSION_READ, CALENDAR_PERMISSION_WRITE],
    }

    def user_can_write(self, user: User) -> bool:
        role = user.get_role(self._related_object)
        return CALENDAR_PERMISSION_WRITE in self._workspace_rights[role]

    def user_can_read(self, user: User) -> bool:
        role = user.get_role(self._related_object)
        return CALENDAR_PERMISSION_READ in self._workspace_rights[role]

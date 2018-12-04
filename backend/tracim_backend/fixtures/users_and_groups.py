# -*- coding: utf-8 -*-
from tracim_backend.models.auth import User
from tracim_backend.models.auth import Group
from tracim_backend.fixtures import Fixture
from tracim_backend.lib.core.user import UserApi


class Base(Fixture):
    require = []

    def insert(self):
        u = User()
        u.display_name = 'Global manager'
        u.email = 'admin@admin.admin'
        u.password = 'admin@admin.admin'
        self._session.add(u)
        uapi = UserApi(
            session=self._session,
            config=self._config,
            current_user=u)
        uapi.execute_created_user_actions(u)

        g1 = Group()
        g1.group_id = 1
        g1.group_name = 'users'
        g1.display_name = 'Users'
        g1.users.append(u)
        self._session.add(g1)

        g2 = Group()
        g2.group_id = 2
        g2.group_name = 'trusted-users'
        g2.display_name = 'Trusted Users'
        g2.users.append(u)
        self._session.add(g2)

        g3 = Group()
        g3.group_id = 3
        g3.group_name = 'administrators'
        g3.display_name = 'Administrators'
        g3.users.append(u)
        self._session.add(g3)


class Test(Fixture):
    require = [Base, ]

    def insert(self):
        g2 = self._session.query(Group).\
            filter(Group.group_name == 'trusted-users').one()

        lawrence = User()
        lawrence.display_name = 'Lawrence L.'
        lawrence.email = 'lawrence-not-real-email@fsf.local'
        lawrence.password = 'foobarbaz'
        self._session.add(lawrence)
        g2.users.append(lawrence)

        bob = User()
        bob.display_name = 'Bob i.'
        bob.email = 'bob@fsf.local'
        bob.password = 'foobarbaz'
        self._session.add(bob)
        g2.users.append(bob)

        g1 = self._session.query(Group).\
            filter(Group.group_name == 'users').one()
        reader = User()
        reader.display_name = 'John Reader'
        reader.email = 'john-the-reader@reader.local'
        reader.password = 'read'
        self._session.add(reader)
        g1.users.append(reader)

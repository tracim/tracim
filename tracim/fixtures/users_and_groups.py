# -*- coding: utf-8 -*-
from tracim import models
from tracim.fixtures import Fixture
from tracim.lib.core.user import UserApi


class Base(Fixture):
    require = []

    def insert(self):
        u = models.User()
        u.display_name = 'Global manager'
        u.email = 'admin@admin.admin'
        u.password = 'admin@admin.admin'
        self._session.add(u)
        uapi = UserApi(
            session=self._session,
            config=self._config,
            current_user=u)
        uapi.execute_created_user_actions(u)

        g1 = models.Group()
        g1.group_id = 1
        g1.group_name = 'users'
        g1.display_name = 'Users'
        g1.users.append(u)
        self._session.add(g1)

        g2 = models.Group()
        g2.group_id = 2
        g2.group_name = 'managers'
        g2.display_name = 'Global Managers'
        g2.users.append(u)
        self._session.add(g2)

        g3 = models.Group()
        g3.group_id = 3
        g3.group_name = 'administrators'
        g3.display_name = 'Administrators'
        g3.users.append(u)
        self._session.add(g3)


class Test(Fixture):
    require = [Base, ]

    def insert(self):
        g2 = self._session.query(models.Group).\
            filter(models.Group.group_name == 'managers').one()

        lawrence = models.User()
        lawrence.display_name = 'Lawrence L.'
        lawrence.email = 'lawrence-not-real-email@fsf.local'
        lawrence.password = 'foobarbaz'
        self._session.add(lawrence)
        g2.users.append(lawrence)

        bob = models.User()
        bob.display_name = 'Bob i.'
        bob.email = 'bob@fsf.local'
        bob.password = 'foobarbaz'
        self._session.add(bob)
        g2.users.append(bob)

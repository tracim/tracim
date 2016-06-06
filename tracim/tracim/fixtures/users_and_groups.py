# -*- coding: utf-8 -*-
from tracim import model
from tracim.fixtures import Fixture


class Base(Fixture):
    require = []

    def insert(self):
        u = model.User()
        u.display_name = 'Global manager'
        u.email = 'admin@admin.admin'
        u.password = 'admin@admin.admin'
        self._session.add(u)

        g1 = model.Group()
        g1.group_id = 1
        g1.group_name = 'users'
        g1.display_name = 'Users'
        g1.users.append(u)
        self._session.add(g1)

        g2 = model.Group()
        g2.group_id = 2
        g2.group_name = 'managers'
        g2.display_name = 'Global Managers'
        g2.users.append(u)
        self._session.add(g2)

        g3 = model.Group()
        g3.group_id = 3
        g3.group_name = 'administrators'
        g3.display_name = 'Administrators'
        g3.users.append(u)
        self._session.add(g3)


class Test(Fixture):
    require = [Base, ]

    def insert(self):
        g2 = self._session.query(model.Group).filter(model.Group.group_name == 'managers').one()

        lawrence = model.User()
        lawrence.display_name = 'Lawrence L.'
        lawrence.email = 'lawrence-not-real-email@fsf.local'
        lawrence.password = 'foobarbaz'
        self._session.add(lawrence)
        g2.users.append(lawrence)

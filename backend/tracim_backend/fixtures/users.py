# -*- coding: utf-8 -*-
from tracim_backend.fixtures import Fixture
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User


class Base(Fixture):
    require = []

    def insert(self):
        u = User()
        u.display_name = "Global manager"
        u.email = "admin@admin.admin"
        u.password = "admin@admin.admin"
        u.profile = Profile.ADMIN
        self._session.add(u)


class Test(Fixture):
    require = [Base]

    def insert(self):

        lawrence = User()
        lawrence.display_name = "Lawrence L."
        lawrence.email = "lawrence-not-real-email@fsf.local"
        lawrence.password = "foobarbaz"
        lawrence.profile = Profile.TRUSTED_USER
        self._session.add(lawrence)

        bob = User()
        bob.display_name = "Bob i."
        bob.email = "bob@fsf.local"
        bob.password = "foobarbaz"
        bob.profile = Profile.TRUSTED_USER
        self._session.add(bob)

        reader = User()
        reader.display_name = "John Reader"
        reader.email = "john-the-reader@reader.local"
        reader.password = "read"
        reader.profile = Profile.USER
        self._session.add(reader)

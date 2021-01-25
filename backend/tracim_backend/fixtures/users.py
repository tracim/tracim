# -*- coding: utf-8 -*-
from tracim_backend.fixtures import Fixture
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.user_custom_properties import UserCustomProperties
from tracim_backend.models.userconfig import UserConfig


class Base(Fixture):
    require = []

    def insert(self):
        u = User()
        u.display_name = "Global manager"
        u.username = "TheAdmin"
        u.email = "admin@admin.admin"
        u.password = "admin@admin.admin"
        u.profile = Profile.ADMIN
        u.config = UserConfig()
        u.custom_properties = UserCustomProperties()
        self._session.add(u)


class Test(Fixture):
    require = [Base]

    def insert(self):

        lawrence = User()
        lawrence.display_name = "Lawrence L."
        lawrence.email = "lawrence-not-real-email@fsf.local"
        lawrence.password = "foobarbaz"
        lawrence.profile = Profile.TRUSTED_USER
        lawrence.config = UserConfig()
        lawrence.custom_properties = UserCustomProperties()
        self._session.add(lawrence)

        bob = User()
        bob.display_name = "Bob i."
        bob.username = "TheBobi"
        bob.email = "bob@fsf.local"
        bob.password = "foobarbaz"
        bob.profile = Profile.TRUSTED_USER
        bob.config = UserConfig()
        bob.custom_properties = UserCustomProperties()
        self._session.add(bob)

        reader = User()
        reader.display_name = "John Reader"
        reader.email = "john-the-reader@reader.local"
        reader.password = "read"
        reader.profile = Profile.USER
        reader.config = UserConfig()
        reader.custom_properties = UserCustomProperties()
        self._session.add(reader)

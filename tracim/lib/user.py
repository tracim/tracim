# -*- coding: utf-8 -*-
import threading

import transaction
import typing as typing

from tracim.models.auth import User

# TODO - G.M -28-03-2018 - [CurrentUser] Check if "current user" stuff is always needed for tracimv2
# CURRENT_USER_WEB = 'WEB'
# CURRENT_USER_WSGIDAV = 'WSGIDAV'


class UserApi(object):

    def __init__(self, current_user: User, session, config):
        self._session = session
        self._user = current_user
        self._config = config

    def get_all(self):
        return self._session.query(User).order_by(User.display_name).all()

    def _base_query(self):
        return self._session.query(User)

    def get_one(self, user_id: int):
        return self._base_query().filter(User.user_id==user_id).one()

    def get_one_by_email(self, email: str):
        return self._base_query().filter(User.email==email).one()

    def get_one_by_id(self, id: int) -> User:
        return self._base_query().filter(User.user_id==id).one()

    def update(
            self,
            user: User,
            name: str=None,
            email: str=None,
            do_save=True,
            timezone: str='',
    ):
        if name is not None:
            user.display_name = name

        if email is not None:
            user.email = email

        user.timezone = timezone

        if do_save:
            self.save(user)

        if email and self._user and user.user_id==self._user.user_id:
            pass
            # this is required for the _session to keep on being up-to-date
            # TODO - G.M - 28-03-2018 - [CurrentUser] Check for pyramid equivalent
            # tg.request.identity['repoze.who.userid'] = email
            # tg.auth_force_login(email)

    def user_with_email_exists(self, email: str):
        try:
            self.get_one_by_email(email)
            return True
        except:
            return False

    def create_user(self, email=None, groups=[], save_now=False) -> User:
        user = User()

        if email:
            user.email = email

        for group in groups:
            user.groups.append(group)

        self._session.add(user)

        if save_now:
            self._session.flush()

        return user

    def save(self, user: User):
        self._session.flush()

    def execute_created_user_actions(self, created_user: User) -> None:
        """
        Execute actions when user just been created
        :return:
        """
        # NOTE: Cyclic import
        # TODO - G.M - 28-03-2018 - [Calendar] Reenable Calendar stuff
        #from tracim.lib.calendar import CalendarManager
        #from tracim.model.organisational import UserCalendar

        created_user.ensure_auth_token(dbsession=self._session, validity_seconds=self._config.USER_AUTH_TOKEN_VALIDITY)

        # Ensure database is up-to-date
        self._session.flush()
        transaction.commit()

        # TODO - G.M - 28-03-2018 - [Calendar] Reenable Calendar stuff
        # calendar_manager = CalendarManager(created_user)
        # calendar_manager.create_then_remove_fake_event(
        #     calendar_class=UserCalendar,
        #     related_object_id=created_user.user_id,
        # )


# TODO - G.M - 28-03-2018 - [CurrentUser] Check for pyramid equivalent
# class CurrentUserGetterInterface(object):
#     def get_current_user(self) -> typing.Union[None, User]:
#         raise NotImplementedError()
#
#
# class BaseCurrentUserGetter(CurrentUserGetterInterface):
#     def __init__(self) -> None:
#         self.api = UserApi(None)


# class WebCurrentUserGetter(BaseCurrentUserGetter):
#     def get_current_user(self) -> typing.Union[None, User]:
#         # HACK - D.A. - 2015-09-02
#         # In tests, the tg.request.identity may not be set
#         # (this is a buggy case, but for now this is how the software is;)
#         if tg.request is not None:
#             if hasattr(tg.request, 'identity'):
#                 if tg.request.identity is not None:
#                     return self.api.get_one_by_email(
#                         tg.request.identity['repoze.who.userid'],
#                     )
#
#         return None

# TODO - G.M - 28-03-2018 - [Webdav] Reenable Webdav stuff
# class WsgidavCurrentUserGetter(BaseCurrentUserGetter):
#     def get_current_user(self) -> typing.Union[None, User]:
#         if hasattr(cherrypy.request, 'current_user_email'):
#             return self.api.get_one_by_email(
#                 cherrypy.request.current_user_email,
#             )
#
#         return None


# class CurrentUserGetterApi(object):
#     thread_local = threading.local()
#     matches = {
#         CURRENT_USER_WEB: WebCurrentUserGetter,
#         CURRENT_USER_WSGIDAV: WsgidavCurrentUserGetter,
#     }
#     default = CURRENT_USER_WEB
#
#     @classmethod
#     def get_current_user(cls) -> User:
#         try:
#             return cls.thread_local.getter.get_current_user()
#         except AttributeError:
#             return cls.factory(cls.default).get_current_user()
#
#     @classmethod
#     def set_thread_local_getter(cls, name) -> None:
#         if not hasattr(cls.thread_local, 'getter'):
#             cls.thread_local.getter = cls.factory(name)
#
#     @classmethod
#     def factory(cls, name: str) -> CurrentUserGetterInterface:
#         return cls.matches[name]()

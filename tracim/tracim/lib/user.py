# -*- coding: utf-8 -*-
import transaction

import tg

from tracim.model.auth import User

from tracim.model import auth as pbma
from tracim.model import DBSession

__author__ = 'damien'


class UserApi(object):

    def __init__(self, current_user: User):
        self._user = current_user

    def get_all(self):
        return DBSession.query(User).order_by(User.display_name).all()

    def _base_query(self):
        return DBSession.query(User)

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

        if self._user and user.user_id==self._user.user_id:
            # this is required for the session to keep on being up-to-date
            tg.request.identity['repoze.who.userid'] = email
            tg.auth_force_login(email)

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

        DBSession.add(user)

        if save_now:
            DBSession.flush()

        return user

    def save(self, user: User):
        DBSession.flush()

    def execute_created_user_actions(self, created_user: User) -> None:
        """
        Execute actions when user just been created
        :return:
        """
        # NOTE: Cyclic import
        from tracim.lib.calendar import CalendarManager
        from tracim.model.organisational import UserCalendar

        created_user.ensure_auth_token()

        # Ensure database is up-to-date
        DBSession.flush()
        transaction.commit()

        calendar_manager = CalendarManager(created_user)
        calendar_manager.create_then_remove_fake_event(
            calendar_class=UserCalendar,
            related_object_id=created_user.user_id,
        )


class UserStaticApi(object):

    @classmethod
    def get_current_user(cls) -> User:
        # HACK - D.A. - 2015-09-02
        # In tests, the tg.request.identity may not be set
        # (this is a buggy case, but for now this is how the software is;)
        if tg.request != None:
            if hasattr(tg.request, 'identity'):
                if tg.request.identity != None:
                    return cls._get_user(tg.request.identity['repoze.who.userid'])

        return None

    @classmethod
    def _get_user(cls, email) -> User:
        """
        Do not use directly in your code.
        :param email:
        :return:
        """
        return pbma.User.by_email_address(email)
# -*- coding: utf-8 -*-
import threading
from smtplib import SMTPException

import transaction
import typing as typing

from tracim.exceptions import NotificationNotSend
from tracim.lib.mail_notifier.notifier import get_email_manager
from tracim.models.auth import User


class UserApi(object):

    def __init__(self, current_user: typing.Optional[User], session, config):
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
            password: str=None,
            timezone: str='',
            do_save=True,
    ):
        if name is not None:
            user.display_name = name

        if email is not None:
            user.email = email

        if password is not None:
            user.password = password

        user.timezone = timezone

        if do_save:
            self.save(user)

    def user_with_email_exists(self, email: str):
        try:
            self.get_one_by_email(email)
            return True
        # TODO - G.M - 09-04-2018 - Better exception
        except:
            return False

    def create_user(
        self,
        email: str = None,
        password: str = None,
        name: str = None,
        timezone: str = '',
        groups=[],
        do_save: bool=True,
        do_notify: bool=True,
    ) -> User:
        new_user = self.create_minimal_user(email, groups, save_now=False)
        self.update(
            user=new_user,
            name=name,
            email=email,
            password=password,
            timezone=timezone,
            do_save=False,
        )
        if do_notify:
            try:
                email_manager = get_email_manager(self._config, self._session)
                email_manager.notify_created_account(
                    new_user,
                    password=password
                )
            except SMTPException as e:
                raise NotificationNotSend()
        if do_save:
            self.save(new_user)
        return new_user

    def create_minimal_user(
            self,
            email=None,
            groups=[],
            save_now=False
    ) -> User:
        """Previous create_user method"""
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

        # TODO - G.M - 04-04-2018 - [auth]
        # Check if this is already needed with
        # new auth system
        created_user.ensure_auth_token(
            session=self._session,
            validity_seconds=self._config.USER_AUTH_TOKEN_VALIDITY
        )

        # Ensure database is up-to-date
        self._session.flush()
        transaction.commit()

        # TODO - G.M - 28-03-2018 - [Calendar] Reenable Calendar stuff
        # calendar_manager = CalendarManager(created_user)
        # calendar_manager.create_then_remove_fake_event(
        #     calendar_class=UserCalendar,
        #     related_object_id=created_user.user_id,
        # )

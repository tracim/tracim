# -*- coding: utf-8 -*-
import threading

import transaction
import typing as typing

from sqlalchemy.orm import Session

from tracim import CFG
from tracim.models.auth import User
from tracim.models.auth import Group
from sqlalchemy.orm.exc import NoResultFound
from tracim.exceptions import WrongUserPassword, UserNotExist
from tracim.exceptions import AuthenticationFailed
from tracim.models.context_models import UserInContext


class UserApi(object):

    def __init__(
            self,
            current_user: typing.Optional[User],
            session: Session,
            config: CFG,
    ) -> None:
        self._session = session
        self._user = current_user
        self._config = config

    def _base_query(self):
        return self._session.query(User)

    def get_user_with_context(self, user: User) -> UserInContext:
        """
        Return UserInContext object from User
        """
        user = UserInContext(
            user=user,
            dbsession=self._session,
            config=self._config,
        )
        return user

    # Getters

    def get_one(self, user_id: int) -> User:
        """
        Get one user by user id
        """
        try:
            user = self._base_query().filter(User.user_id == user_id).one()
        except NoResultFound:
            raise UserNotExist()
        return user

    def get_one_by_email(self, email: str) -> User:
        """
        Get one user by email
        :param email: Email of the user
        :return: one user
        """
        try:
            user = self._base_query().filter(User.email == email).one()
        except NoResultFound:
            raise UserNotExist()
        return user

    # FIXME - G.M - 24-04-2018 - Duplicate method with get_one.
    def get_one_by_id(self, id: int) -> User:
        return self.get_one(user_id=id)

    def get_current_user(self) -> User:
        """
        Get current_user
        """
        if not self._user:
            raise UserNotExist()
        return self._user

    def get_all(self) -> typing.Iterable[User]:
        return self._session.query(User).order_by(User.display_name).all()

    # Check methods

    def user_with_email_exists(self, email: str) -> bool:
        try:
            self.get_one_by_email(email)
            return True
        # TODO - G.M - 09-04-2018 - Better exception
        except:
            return False

    def authenticate_user(self, email: str, password: str) -> User:
        """
        Authenticate user with email and password, raise AuthenticationFailed
        if uncorrect.
        :param email: email of the user
        :param password: cleartext password of the user
        :return: User who was authenticated.
        """
        try:
            user = self.get_one_by_email(email)
            if user.validate_password(password):
                return user
            else:
                raise WrongUserPassword()
        except (WrongUserPassword, NoResultFound, UserNotExist):
            raise AuthenticationFailed()

    # Actions

    def update(
            self,
            user: User,
            name: str=None,
            email: str=None,
            do_save=True,
            timezone: str='',
    ) -> None:
        if name is not None:
            user.display_name = name

        if email is not None:
            user.email = email

        user.timezone = timezone

        if do_save:
            self.save(user)

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

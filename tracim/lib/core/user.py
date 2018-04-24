# -*- coding: utf-8 -*-
import threading

import transaction
import typing as typing

from tracim.models.auth import User
from sqlalchemy.orm.exc import NoResultFound
from tracim.exceptions import BadUserPassword
from tracim.exceptions import AuthenticationFailed
from tracim.models.context_models import UserInContext


class UserApi(object):

    def __init__(self, current_user: typing.Optional[User], session, config):
        self._session = session
        self._user = current_user
        self._config = config

    def _base_query(self):
        return self._session.query(User)

    def _get_correct_user_type(
            self,
            user: User,
            in_context: bool,
    ) -> typing.Union[User, UserInContext]:
        """
        Choose user type object depending on in_context bool.
        :param user:
        :param in_context:
        :return: user as User or UserInContext if in_context is True
        """
        if in_context:
            user = UserInContext(
                user=user,
                dbsession=self._session,
                config=self._config,
            )
        return user

    # Getters

    def get_one(
            self,
            user_id: int,
            in_context: bool=False,
    ) -> typing.Union[UserInContext, User]:
        """
        Get one user by user id
        :param user_id:
        :param in_context: Return User or UserInContext Object
        :return: one user
        """
        user = self._base_query().filter(User.user_id == user_id).one()
        return self._get_correct_user_type(user, in_context)

    def get_one_by_email(
            self,
            email: str,
            in_context: bool=False,
    ) -> User:
        """
        Get one user by email
        :param email: Email of the user
        :param in_context: Return User or UserInContext Object
        :return: one user
        """
        user = self._base_query().filter(User.email == email).one()
        return self._get_correct_user_type(user, in_context)

    # FIXME - G.M - 24-04-2018 - Duplicate method with get_one.
    def get_one_by_id(self, id: int, in_context=False) -> User:
        return self.get_one(user_id=id, in_context=in_context)

    def get_current(self, in_context: bool=False):
        """
        Get current_user
        :param in_context:
        :return:
        """
        return self._get_correct_user_type(self._user, in_context)

    def get_all(self) -> typing.Iterable[User]:
        return self._session.query(User).order_by(User.display_name).all()

    # Check methods

    def user_with_email_exists(self, email: str):
        try:
            self.get_one_by_email(email)
            return True
        # TODO - G.M - 09-04-2018 - Better exception
        except:
            return False

    def authenticate_user(self, email, password, in_context=False) -> User:
        """
        Authenticate user with email and password, raise AuthenticationFailed
        if uncorrect.
        :param email: email of the user
        :param password: cleartext password of the user
        :param in_context:
        :return: User who was authenticated.
        """
        try:
            user = self.get_one_by_email(email)
            if user.validate_password(password):
                return self._get_correct_user_type(user, in_context=in_context)
            else:
                raise BadUserPassword()
        except (BadUserPassword, NoResultFound):
            raise AuthenticationFailed

    # Actions

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

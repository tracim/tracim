# -*- coding: utf-8 -*-
from smtplib import SMTPException

import transaction
import typing as typing
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import NoResultFound

from tracim import CFG
from tracim.models.auth import User
from tracim.models.auth import Group
from tracim.exceptions import NoUserSetted
from tracim.exceptions import PasswordDoNotMatch
from tracim.exceptions import EmailValidationFailed
from tracim.exceptions import UserDoesNotExist
from tracim.exceptions import WrongUserPassword
from tracim.exceptions import AuthenticationFailed
from tracim.exceptions import NotificationNotSend
from tracim.exceptions import UserNotActive
from tracim.models.context_models import UserInContext
from tracim.lib.mail_notifier.notifier import get_email_manager
from tracim.models.context_models import TypeUser


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
        except NoResultFound as exc:
            raise UserDoesNotExist('User "{}" not found in database'.format(user_id)) from exc  # nopep8
        return user

    def get_one_by_email(self, email: str) -> User:
        """
        Get one user by email
        :param email: Email of the user
        :return: one user
        """
        try:
            user = self._base_query().filter(User.email == email).one()
        except NoResultFound as exc:
            raise UserDoesNotExist('User "{}" not found in database'.format(email)) from exc  # nopep8
        return user

    def get_one_by_public_name(self, public_name: str) -> User:
        """
        Get one user by public_name
        """
        try:
            user = self._base_query().filter(User.display_name == public_name).one()
        except NoResultFound as exc:
            raise UserDoesNotExist('User "{}" not found in database'.format(public_name)) from exc  # nopep8
        return user
    # FIXME - G.M - 24-04-2018 - Duplicate method with get_one.

    def get_one_by_id(self, id: int) -> User:
        return self.get_one(user_id=id)

    def get_current_user(self) -> User:
        """
        Get current_user
        """
        if not self._user:
            raise UserDoesNotExist('There is no current user')
        return self._user

    def get_all(self) -> typing.Iterable[User]:
        return self._session.query(User).order_by(User.display_name).all()

    def find(
            self,
            user_id: int=None,
            email: str=None,
            public_name: str=None
    ) -> typing.Tuple[TypeUser, User]:
        """
        Find existing user from all theses params.
        Check is made in this order: user_id, email, public_name
        If no user found raise UserDoesNotExist exception
        """
        user = None

        if user_id:
            try:
                user = self.get_one(user_id)
                return TypeUser.USER_ID, user
            except UserDoesNotExist:
                pass
        if email:
            try:
                user = self.get_one_by_email(email)
                return TypeUser.EMAIL, user
            except UserDoesNotExist:
                pass
        if public_name:
            try:
                user = self.get_one_by_public_name(public_name)
                return TypeUser.PUBLIC_NAME, user
            except UserDoesNotExist:
                pass

        raise UserDoesNotExist('User not found with any of given params.')

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
            if not user.is_active:
                raise UserNotActive('User "{}" is not active'.format(email))
            if user.validate_password(password):
                return user
            else:
                raise WrongUserPassword('User "{}" password is incorrect'.format(email))  # nopep8
        except (WrongUserPassword, UserDoesNotExist) as exc:
            raise AuthenticationFailed('User "{}" authentication failed'.format(email)) from exc  # nopep8

    # Actions
    def set_password(
            self,
            user: User,
            loggedin_user_password: str,
            new_password: str,
            new_password2: str,
            do_save: bool=True
    ):
        """
        Set User password if loggedin user password is correct
        and both new_password are the same.
        :param user: User who need password changed
        :param loggedin_user_password: cleartext password of logged user (not
        same as user)
        :param new_password: new password for user
        :param new_password2: should be same as new_password
        :param do_save: should we save new user password ?
        :return:
        """
        if not self._user:
            raise NoUserSetted('Current User should be set in UserApi to use this method')  # nopep8
        if not self._user.validate_password(loggedin_user_password):  # nopep8
            raise WrongUserPassword(
                'Wrong password for authenticated user {}'. format(self._user.user_id)  # nopep8
            )
        if new_password != new_password2:
            raise PasswordDoNotMatch('Passwords given are different')

        self.update(
            user=user,
            password=new_password,
            do_save=do_save,
        )
        if do_save:
            # TODO - G.M - 2018-07-24 - Check why commit is needed here
            transaction.commit()
        return user

    def set_email(
            self,
            user: User,
            loggedin_user_password: str,
            email: str,
            do_save: bool = True
    ):
        """
        Set email address of user if loggedin user password is correct
        :param user: User who need email changed
        :param loggedin_user_password: cleartext password of logged user (not
        same as user)
        :param email:
        :param do_save:
        :return:
        """
        if not self._user:
            raise NoUserSetted('Current User should be set in UserApi to use this method')  # nopep8
        if not self._user.validate_password(loggedin_user_password):  # nopep8
            raise WrongUserPassword(
                'Wrong password for authenticated user {}'. format(self._user.user_id)  # nopep8
            )
        self.update(
            user=user,
            email=email,
            do_save=do_save,
        )
        return user

    def _check_email(self, email: str) -> bool:
        # TODO - G.M - 2018-07-05 - find a better way to check email
        if not email:
            return False
        email = email.split('@')
        if len(email) != 2:
            return False
        return True

    def update(
            self,
            user: User,
            name: str=None,
            email: str=None,
            password: str=None,
            timezone: str=None,
            groups: typing.Optional[typing.List[Group]]=None,
            do_save=True,
    ) -> User:
        if name is not None:
            user.display_name = name

        if email is not None:
            email_exist = self._check_email(email)
            if not email_exist:
                raise EmailValidationFailed('Email given form {} is uncorrect'.format(email))  # nopep8
            user.email = email

        if password is not None:
            user.password = password

        if timezone is not None:
            user.timezone = timezone

        if groups is not None:
            # INFO - G.M - 2018-07-18 - Delete old groups
            for group in user.groups:
                if group not in groups:
                    user.groups.remove(group)
            # INFO - G.M - 2018-07-18 - add new groups
            for group in groups:
                if group not in user.groups:
                    user.groups.append(group)

        if do_save:
            self.save(user)

        return user

    def create_user(
        self,
        email,
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
            email,
            groups=[],
            save_now=False
    ) -> User:
        """Previous create_user method"""
        user = User()

        email_exist = self._check_email(email)
        if not email_exist:
            raise EmailValidationFailed('Email given form {} is uncorrect'.format(email))  # nopep8
        user.email = email
        user.display_name = email.split('@')[0]

        for group in groups:
            user.groups.append(group)

        self._session.add(user)

        if save_now:
            self._session.flush()

        return user

    def enable(self, user: User, do_save=False):
        user.is_active = True
        if do_save:
            self.save(user)

    def disable(self, user:User, do_save=False):
        user.is_active = False
        if do_save:
            self.save(user)

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

# -*- coding: utf-8 -*-
import datetime
import typing as typing
from smtplib import SMTPException
from smtplib import SMTPRecipientsRefused

import transaction
from sqlalchemy import func
from sqlalchemy import or_
from sqlalchemy.orm import Query
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import NoResultFound

from tracim_backend.app_models.validator import TracimValidator
from tracim_backend.app_models.validator import user_email_validator
from tracim_backend.app_models.validator import user_lang_validator
from tracim_backend.app_models.validator import user_password_validator
from tracim_backend.app_models.validator import user_public_name_validator
from tracim_backend.app_models.validator import user_timezone_validator
from tracim_backend.config import CFG
from tracim_backend.exceptions import AuthenticationFailed
from tracim_backend.exceptions import EmailAlreadyExistInDb
from tracim_backend.exceptions import EmailValidationFailed
from tracim_backend.exceptions import \
    ExternalAuthUserEmailModificationDisallowed
from tracim_backend.exceptions import \
    ExternalAuthUserPasswordModificationDisallowed
from tracim_backend.exceptions import GroupDoesNotExist
from tracim_backend.exceptions import MissingLDAPConnector
from tracim_backend.exceptions import \
    NotificationDisabledCantCreateUserWithInvitation  # nopep8
from tracim_backend.exceptions import NotificationDisabledCantResetPassword
from tracim_backend.exceptions import NotificationSendingFailed
from tracim_backend.exceptions import NoUserSetted
from tracim_backend.exceptions import PasswordDoNotMatch
from tracim_backend.exceptions import RemoteUserAuthDisabled
from tracim_backend.exceptions import TooShortAutocompleteString
from tracim_backend.exceptions import TracimValidationFailed
from tracim_backend.exceptions import UnknownAuthType
from tracim_backend.exceptions import UnvalidResetPasswordToken
from tracim_backend.exceptions import UserAuthenticatedIsDeleted
from tracim_backend.exceptions import UserAuthenticatedIsNotActive
from tracim_backend.exceptions import UserAuthTypeDisabled
from tracim_backend.exceptions import UserCantChangeIsOwnProfile
from tracim_backend.exceptions import UserCantDeleteHimself
from tracim_backend.exceptions import UserCantDisableHimself
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import WrongAuthTypeForUser
from tracim_backend.exceptions import WrongLDAPCredentials
from tracim_backend.exceptions import WrongUserPassword
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.mail_notifier.notifier import get_email_manager
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Group
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import TypeUser
from tracim_backend.models.context_models import UserInContext
from tracim_backend.models.data import UserRoleInWorkspace


class UserApi(object):

    def __init__(
            self,
            current_user: typing.Optional[User],
            session: Session,
            config: CFG,
            show_deleted: bool = False,
            show_deactivated: bool = True,
    ) -> None:
        self._session = session
        self._user = current_user
        self._config = config
        self._show_deleted = show_deleted
        self._show_deactivated = show_deactivated

    def _base_query(self):
        query = self._session.query(User)
        if not self._show_deleted:
            query = query.filter(User.is_deleted == False)
        if not self._show_deactivated:
            query = query.filter(User.is_active == True)
        return query

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

    def _get_all_query(self) -> Query:
        return self._session.query(User).order_by(func.lower(User.display_name))

    def get_all(self) -> typing.Iterable[User]:
        return self._get_all_query().all()

    def get_known_user(
            self,
            acp: str,
            exclude_user_ids: typing.List[int] = None,
            exclude_workspace_ids: typing.List[int] = None,
    ) -> typing.Iterable[User]:
        """
        Return list of know user by current UserApi user.
        :param acp: autocomplete filter by name/email
        :param exclude_user_ids: user id to exclude from result
        :param exclude_workspace_ids: workspace user to exclude from result
        :return: List of found users
        """
        if len(acp) < 2:
            raise TooShortAutocompleteString(
                '"{acp}" is a too short string, acp string need to have more than one character'.format(acp=acp)  # nopep8
            )
        exclude_workspace_ids = exclude_workspace_ids or []  # DFV
        exclude_user_ids = exclude_user_ids or []  # DFV
        if exclude_workspace_ids:
            user_ids_in_workspaces_tuples = self._session\
                .query(UserRoleInWorkspace.user_id)\
                .distinct(UserRoleInWorkspace.user_id) \
                .filter(UserRoleInWorkspace.workspace_id.in_(exclude_workspace_ids))\
                .all()
            user_ids_in_workspaces = [item[0] for item in user_ids_in_workspaces_tuples]
            exclude_user_ids.extend(user_ids_in_workspaces)
        query = self._base_query().order_by(User.display_name)
        query = query.filter(or_(User.display_name.ilike('%{}%'.format(acp)), User.email.ilike('%{}%'.format(acp))))  # nopep8
        # INFO - G.M - 2018-07-27 - if user is set and is simple user, we
        # should show only user in same workspace as user
        if self._user and self._user.profile.id <= Group.TIM_USER:
            user_workspaces_id_query = self._session.\
                query(UserRoleInWorkspace.workspace_id).\
                distinct(UserRoleInWorkspace.workspace_id).\
                filter(UserRoleInWorkspace.user_id == self._user.user_id)
            users_in_workspaces = self._session.\
                query(UserRoleInWorkspace.user_id).\
                distinct(UserRoleInWorkspace.user_id).\
                filter(UserRoleInWorkspace.workspace_id.in_(user_workspaces_id_query.subquery())).subquery()  # nopep8
            query = query.filter(User.user_id.in_(users_in_workspaces))
        if exclude_user_ids:
            query = query.filter(~User.user_id.in_(exclude_user_ids))
        return query.all()

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

    def _ldap_authenticate(
            self,
            user: typing.Optional[User],
            email: str,
            password: str,
            ldap_connector: 'Connector'
    ) -> User:
        """
        Authenticate with ldap, return authenticated user or raise Exception
        like WrongAuthTypeForUser, WrongLDAPCredentials, UserDoesNotExist
        or UserAuthenticatedIsNotActive
        :param user: user to check,, can be none if user not found, will try
         to create new user if none but ldap auth succeed
        :param email: email of the user
        :param password: cleartext password of the user
        :param ldap_connector: ldap connector, enable ldap auth if provided
        """
        auth_type = AuthType.LDAP

        # INFO - G.M - 2018-11-22 - Do not authenticate user with auth_type
        # different from LDAP
        if user and user.auth_type not in [auth_type, AuthType.UNKNOWN]:
                raise WrongAuthTypeForUser(
                    'User "{}" auth_type is {} not {}'.format(
                        email,
                        user.auth_type.value,
                        auth_type.value
                    )
                )

        # INFO - G.M - 2018-11-22 - LDAP Auth
        data = ldap_connector.authenticate(
            email,
            password
        )
        if not data:
            raise WrongLDAPCredentials('LDAP credentials are not correct')
        ldap_data = data[1]

        # INFO - G.M - 2018-11-22 - Create new user
        if not user:
            groups = None
            # TODO - G.M - 2018-12-05 - [ldap_profile]
            # support for profile attribute disabled
            # Should be reenabled later probably with a better code
            # if self._config.LDAP_PROFILE_ATTR:
            #     ldap_profile = ldap_data[self._config.LDAP_PROFILE_ATTR][0]
            #     try:
            #         gapi = GroupApi(
            #             current_user=self._user,  # User
            #             session=self._session,
            #             config=self._config,
            #         )
            #         groups = [gapi.get_one_with_name(ldap_profile)] # nopep8
            #     except GroupDoesNotExist:
            #         logger.warning(self,
            #             'Profile {} does not exist, create ldap user'
            #             'with default profile.'.format(
            #                 ldap_profile
            #             )
            #         )
            name = None
            if self._config.LDAP_NAME_ATTR:
                name = ldap_data[self._config.LDAP_NAME_ATTR][0]
            # INFO - G.M - 2018-11-08 - Create new user from ldap credentials
            self.create_user(
                email=email,
                name=name,
                groups=groups,
                auth_type=AuthType.LDAP,
                do_save=True,
                do_notify=False
            )
            transaction.commit()
            # INFO - G.M - 2018-11-08 - get new created user
            user = self.get_one_by_email(email)

        if user.is_deleted:
            raise UserDoesNotExist('This user has been deleted')  # nopep8

        if not user.is_active:
            raise UserAuthenticatedIsNotActive('This user is not activated')  # nopep8

        if user.auth_type == AuthType.UNKNOWN :
            user.auth_type = auth_type
        return user

    def _internal_db_authenticate(self, user: typing.Optional[User], email: str, password: str) -> User:
        """
        Authenticate with internal db, return authenticated user
        or raise Exception like WrongAuthTypeForUser, UserDoesNotExist,
        WrongUserPassword or UserAuthenticatedIsNotActive
        :param user: user to check, can be none if user not found, will raise
        UserDoesNotExist exception if none
        :param password: cleartext password of the user
        :param ldap_connector: ldap connector, enable ldap auth if provided
        """
        auth_type = AuthType.INTERNAL

        if not user:
            raise UserDoesNotExist('User {} not found in database'.format(email)) # nopep8

        if user.auth_type not in [auth_type, AuthType.UNKNOWN]:
            raise WrongAuthTypeForUser(
                'User "{}" auth_type is {} not {}'.format(
                    email,
                    user.auth_type.value,
                    auth_type.value
                )
            )
        if not user.validate_password(password):
            raise WrongUserPassword('User "{}" password is incorrect'.format(email))  # nopep8

        if user.is_deleted:
            raise UserDoesNotExist('This user has been deleted')  # nopep8

        if not user.is_active:
            raise UserAuthenticatedIsNotActive('This user is not activated')  # nopep8

        if user.auth_type == AuthType.UNKNOWN :
            user.auth_type = auth_type
        return user

    def _remote_user_authenticate(
        self,
        user: User,
        email: str,
    ) -> User:
        """
        Authenticate with remote_auth, return authenticated user
        or raise Exception like WrongAuthTypeForUser,
        UserDoesNotExist or UserAuthenticatedIsNotActive
        :param user: user to check, can be none if user not found, will try
         to create new user if none
        :param email: email of the user
        """
        auth_type = AuthType.REMOTE

        # INFO - G.M - 2018-12-12 - Do not authenticate user with auth_type
        # different from REMOTE
        if user and user.auth_type not in [auth_type, AuthType.UNKNOWN]:
                raise WrongAuthTypeForUser(
                    'User "{}" auth_type is {} not {}'.format(
                        email,
                        user.auth_type.value,
                        auth_type.value
                    )
                )

        # INFO - G.M - 2018-12-12 - Create new user
        if not user:
            groups = None
            self.create_user(
                email=email,
                groups=groups,
                auth_type=AuthType.REMOTE,
                do_save=True,
                do_notify=False
            )
            transaction.commit()
            # INFO - G.M - 2018-12-02 - get new created user
            user = self.get_one_by_email(email)

        if user.is_deleted:
            raise UserDoesNotExist('This user has been deleted')  # nopep8

        if not user.is_active:
            raise UserAuthenticatedIsNotActive('This user is not activated')  # nopep8

        if user.auth_type == AuthType.UNKNOWN :
            user.auth_type = auth_type
        return user

    def remote_authenticate(
            self,
            email: str
    ) -> User:
        """
        Remote Authenticate user with email (no password check),
        raise AuthenticationFailed if uncorrect.
        raise RemoteUserAuthDisabled if auth remote header is not set
        """
        try:
            if not self._config.REMOTE_USER_HEADER:
                raise RemoteUserAuthDisabled('Remote User Auth mecanism disabled')
            return self._remote_authenticate(
                email
            )
        except AuthenticationFailed as exc:
            raise exc
        except WrongAuthTypeForUser as exc:
            raise AuthenticationFailed(
                'Auth mecanism for this user is not activated'
            ) from exc

    def _remote_authenticate(
        self,
        email: str
    ):
        """
        Authenticate user with email given using remote mecanism,
        raise AuthenticationFailed if uncorrect.
        :param email: email of the user
        :return: User who was authenticated.
        """
        # get existing user
        try:
            user = self.get_one_by_email(email)
        except UserDoesNotExist:
            user = None
        # try auth
        try:
            return self._remote_user_authenticate(user, email)
        except (
            UserDoesNotExist,
            UserAuthenticatedIsDeleted,
            UserAuthenticatedIsNotActive,
            TracimValidationFailed,
        ) as exc:
            raise AuthenticationFailed('User "{}" authentication failed'.format(email)) from exc  # nopep8

    def authenticate(
            self,
            email: str,
            password: str,
            ldap_connector: 'Connector' = None,
    ) -> User:
        """
        Authenticate user with email and password, raise AuthenticationFailed
        if uncorrect. try all auth available in order and raise issue of
        last auth if all auth failed.
        :param email: email of the user
        :param password: cleartext password of the user
        :param ldap_connector: ldap connector, enable ldap auth if provided
        :return: User who was authenticated.
        """
        user_auth_type_not_available = AuthenticationFailed('Auth mecanism for this user is not activated')
        for auth_type in self._config.AUTH_TYPES:
            try:
                return self._authenticate(
                    email,
                    password,
                    ldap_connector,
                    auth_type=auth_type
                )
            except AuthenticationFailed as exc:
                raise exc
            except WrongAuthTypeForUser:
                pass

        raise user_auth_type_not_available

    def _authenticate(
            self,
            email: str,
            password: str,
            ldap_connector: 'Connector' = None,
            auth_type: AuthType = AuthType.INTERNAL,
    ) -> User:
        """
        Authenticate user with email and password, raise AuthenticationFailed
        if uncorrect. check only one auth
        :param email: email of the user
        :param password: cleartext password of the user
        :param ldap_connector: ldap connector, enable ldap auth if provided
        :param auth_type: auth type to test.
        :return: User who was authenticated.
        """
        # get existing user
        try:
            user = self.get_one_by_email(email)
        except UserDoesNotExist:
            user = None
        # try auth
        try:
            if auth_type == AuthType.LDAP:
                if ldap_connector:
                    return self._ldap_authenticate(user, email, password, ldap_connector)
                raise MissingLDAPConnector()
            elif auth_type == AuthType.INTERNAL:
                return self._internal_db_authenticate(user, email, password)
            else:
                raise UnknownAuthType()
        except (
            WrongUserPassword,
            WrongLDAPCredentials,
            UserDoesNotExist,
            UserAuthenticatedIsDeleted,
            UserAuthenticatedIsNotActive,
            TracimValidationFailed,
        ) as exc:
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
        Set User password if logged-in user password is correct
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

        self._check_password_modification_allowed(self._user)
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
            self.save(user)
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

        self._check_email_modification_allowed(user)

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

    def set_password_reset_token(
            self,
            user: User,
            new_password: str,
            new_password2: str,
            reset_token: str,
            do_save: bool = False,
    ):
        self._check_user_auth_validity(user)
        self._check_password_modification_allowed(user)
        self.validate_reset_password_token(user, reset_token)
        if new_password != new_password2:
            raise PasswordDoNotMatch('Passwords given are different')

        self.update(
            user=user,
            password=new_password,
            do_save=do_save,
        )
        user.reset_tokens()
        if do_save:
            self.save(user)
        return user

    def _check_email(self, email: str) -> bool:
        """
        Check if email is completely ok to be used in user db table
        """
        is_email_correct = self._check_email_correctness(email)
        if not is_email_correct:
            raise EmailValidationFailed(
                'Email given form {} is uncorrect'.format(email))  # nopep8
        email_already_exist_in_db = self.check_email_already_in_db(email)
        if email_already_exist_in_db:
            raise EmailAlreadyExistInDb(
                'Email given {} already exist, please choose something else'.format(email)  # nopep8
            )
        return True

    def check_email_already_in_db(self, email: str) -> bool:
        """
        Verify if given email does not already exist in db
        """
        return self._session.query(User.email).filter(User.email==email).count() != 0  # nopep8

    def _check_email_correctness(self, email: str) -> bool:
        """
           Verify if given email is correct:
           - check format
           - futur active check for email ? (dns based ?)
           """
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
            lang: str=None,
            auth_type: AuthType = None,
            groups: typing.Optional[typing.List[Group]]=None,
            do_save=True,
    ) -> User:
        validator = TracimValidator()
        validator.add_validator('name', name, user_public_name_validator)
        validator.add_validator('password', password, user_password_validator)
        validator.add_validator('email', email, user_email_validator)
        validator.add_validator('timezone', timezone, user_timezone_validator)
        validator.add_validator('lang', lang, user_lang_validator)
        validator.validate_all()

        if name is not None:
            user.display_name = name

        if auth_type is not None:
            if auth_type not in [AuthType.UNKNOWN, AuthType.REMOTE] and not auth_type in self._config.AUTH_TYPES:
                raise UserAuthTypeDisabled(
                    'Can\'t update user "{}" auth_type with unavailable value "{}".'.format(
                        user.email,
                        auth_type
                    )
                )
            user.auth_type = auth_type

        if email is not None and email != user.email:
            self._check_email_modification_allowed(user)
            self._check_email(email)
            user.email = email

        if password is not None:
            self._check_password_modification_allowed(user)
            user.password = password

        if timezone is not None:
            user.timezone = timezone

        if lang is not None:
            user.lang = lang

        if groups is not None:
            if self._user and self._user == user:
                raise UserCantChangeIsOwnProfile(
                    "User {} can't change is own profile".format(user.user_id)
                )
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

    def _check_password_modification_allowed(self, user: User) -> bool:
        if user.auth_type and user.auth_type not in [AuthType.INTERNAL, AuthType.UNKNOWN]:
            raise ExternalAuthUserPasswordModificationDisallowed(
                'user {} is link to external auth {},'
                'password modification disallowed'.format(
                    user.email,
                    user.auth_type,
                )
            )
        return True

    def _check_email_modification_allowed(self, user: User) -> bool:
        if user.auth_type and user.auth_type not in [AuthType.INTERNAL, AuthType.UNKNOWN]:
            raise ExternalAuthUserEmailModificationDisallowed(
                'user {} is link to external auth {},'
                'email modification disallowed'.format(
                    user.email,
                    user.auth_type,
                )
            )
        return True

    def create_user(
        self,
        email,
        password: str = None,
        name: str = None,
        timezone: str = '',
        lang: str= None,
        auth_type: AuthType = AuthType.UNKNOWN,
        groups=[],
        do_save: bool=True,
        do_notify: bool=True,
    ) -> User:
        if do_notify and not self._config.EMAIL_NOTIFICATION_ACTIVATED:
            raise NotificationDisabledCantCreateUserWithInvitation(
                "Can't create user with invitation mail because "
                "notification are disabled."
            )
        new_user = self.create_minimal_user(email, groups, save_now=False)
        self.update(
            user=new_user,
            name=name,
            email=email,
            auth_type=auth_type,
            password=password,
            timezone=timezone,
            lang=lang,
            do_save=False,
        )
        if do_notify:
            try:
                email_manager = get_email_manager(self._config, self._session)
                email_manager.notify_created_account(
                    new_user,
                    password=password
                )
            # FIXME - G.M - 2018-11-02 - hack: accept bad recipient user creation
            # this should be fixed to find a solution to allow "fake" email but
            # also have clear error case for valid mail.
            except SMTPRecipientsRefused as exc:
                logger.warning(
                    self,
                    "Account created for {email} but SMTP server refuse to send notification".format(  # nopep8
                        email=email
                    )
                )
            except SMTPException as exc:
                raise NotificationSendingFailed(
                    "Notification for new created account can't be send "
                    "(SMTP error), new account creation aborted"
                ) from exc
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
        validator = TracimValidator()
        validator.add_validator('email', email, user_email_validator)
        validator.validate_all()
        self._check_email(email)
        user = User()
        user.email = email
        # TODO - G.M - 2018-11-29 - Check if this default_value can be
        # incorrect according to user_public_name_validator
        user.display_name = email.split('@')[0]
        user.created = datetime.datetime.utcnow()
        if not groups:
            gapi = GroupApi(
                current_user=self._user,  # User
                session=self._session,
                config=self._config,
            )
            groups = [gapi.get_one(Group.TIM_USER)]
        for group in groups:
            user.groups.append(group)

        self._session.add(user)

        if save_now:
            self._session.flush()

        return user

    def reset_password_notification(self, user: User, do_save: bool=False) -> str:  # nopep8
        """
        Reset password notification
        :param user: User who want is password resetted
        :param do_save: save update ?
        :return: reset_password_token
        """
        self._check_user_auth_validity(user)
        self._check_password_modification_allowed(user)
        if not self._config.EMAIL_NOTIFICATION_ACTIVATED:
            raise NotificationDisabledCantResetPassword("cant reset password with notification disabled")  # nopep8
        token = user.generate_reset_password_token()
        try:
            email_manager = get_email_manager(self._config, self._session)
            email_manager.notify_reset_password(user, token)
        except SMTPException as exc:
            raise NotificationSendingFailed("SMTP error, can't send notification") from exc
        if do_save:
            self.save(user)
        return token

    def validate_reset_password_token(self, user: User, token: str) -> bool:
        self._check_user_auth_validity(user)
        self._check_password_modification_allowed(user)
        return user.validate_reset_password_token(
            token=token,
            validity_seconds=self._config.USER_RESET_PASSWORD_TOKEN_VALIDITY,
        )

    def enable(self, user: User, do_save=False):
        user.is_active = True
        if do_save:
            self.save(user)

    def disable(self, user: User, do_save=False):
        if self._user and self._user == user:
            raise UserCantDisableHimself(
                "User {} can't disable himself".format(user.user_id)
            )

        user.is_active = False
        if do_save:
            self.save(user)

    def delete(self, user: User, do_save=False):
        if self._user and self._user == user:
            raise UserCantDeleteHimself(
                "User {} can't delete himself".format(user.user_id)
            )
        user.is_deleted = True
        if do_save:
            self.save(user)

    def undelete(self, user: User, do_save=False):
        user.is_deleted = False
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

    def _check_user_auth_validity(self, user:User) -> None:
        if not self._user_can_authenticate(user):
            raise UserAuthTypeDisabled('user {} auth type {} is disabled'.format(user.email, user.auth_type.value))

    def _user_can_authenticate(self, user: User) -> bool:
        return user.auth_type and user.auth_type in self._config.AUTH_TYPES

    def allowed_to_invite_new_user(self, email: str) -> bool:
        # INFO - G.M - 2018-10-25 - disallow account creation if no
        # email provided or email_notification disabled.
        if not email:
            return False
        if not self._config.EMAIL_NOTIFICATION_ACTIVATED and self._config.NEW_USER_INVITATION_DO_NOTIFY:
            return False
        # INFO - G.M - 2018-10-25 - do not allow all profile to invite new user
        gapi = GroupApi(self._session, self._user, self._config)
        invite_minimal_profile = gapi.get_one_with_name(group_name=self._config.NEW_USER_INVITATION_MINIMAL_PROFILE)  # nopep8

        if not self._user.profile.id >= invite_minimal_profile.group_id:
            return False

        return True

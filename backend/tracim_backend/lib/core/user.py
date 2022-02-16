# -*- coding: utf-8 -*-
import datetime
import io
import os
import re
from smtplib import SMTPException
from smtplib import SMTPRecipientsRefused
import typing as typing

from depot.io.utils import FileIntent
from hapic.data import HapicFile
from marshmallow import ValidationError
from pyramid_ldap3 import Connector
from sqlakeyset import Page
from sqlakeyset import get_page
import sqlalchemy
from sqlalchemy import and_
from sqlalchemy import func
from sqlalchemy import or_
from sqlalchemy.orm import Query
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql.expression import cast
import transaction

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.app_models.email_validators import TracimEmailValidator
from tracim_backend.app_models.validator import TracimValidator
from tracim_backend.app_models.validator import user_email_validator
from tracim_backend.app_models.validator import user_lang_validator
from tracim_backend.app_models.validator import user_password_validator
from tracim_backend.app_models.validator import user_public_name_validator
from tracim_backend.app_models.validator import user_timezone_validator
from tracim_backend.app_models.validator import user_username_validator
from tracim_backend.config import CFG
from tracim_backend.exceptions import AuthenticationFailed
from tracim_backend.exceptions import CannotUseBothIncludeAndExcludeWorkspaceUsers
from tracim_backend.exceptions import EmailAlreadyExists
from tracim_backend.exceptions import EmailOrUsernameRequired
from tracim_backend.exceptions import EmailRequired
from tracim_backend.exceptions import EmailTemplateError
from tracim_backend.exceptions import EmailValidationFailed
from tracim_backend.exceptions import ExternalAuthUserEmailModificationDisallowed
from tracim_backend.exceptions import ExternalAuthUserPasswordModificationDisallowed
from tracim_backend.exceptions import InvalidUsernameFormat
from tracim_backend.exceptions import MissingEmailCantResetPassword
from tracim_backend.exceptions import MissingLDAPConnector
from tracim_backend.exceptions import NotFound
from tracim_backend.exceptions import NotificationDisabledCantCreateUserWithInvitation
from tracim_backend.exceptions import NotificationDisabledCantResetPassword
from tracim_backend.exceptions import NotificationSendingFailed
from tracim_backend.exceptions import NoUserSetted
from tracim_backend.exceptions import PasswordDoNotMatch
from tracim_backend.exceptions import RemoteUserAuthDisabled
from tracim_backend.exceptions import ReservedUsernameError
from tracim_backend.exceptions import TooManyOnlineUsersError
from tracim_backend.exceptions import TooShortAutocompleteString
from tracim_backend.exceptions import TracimValidationFailed
from tracim_backend.exceptions import UnknownAuthType
from tracim_backend.exceptions import UserAuthenticatedIsDeleted
from tracim_backend.exceptions import UserAuthenticatedIsNotActive
from tracim_backend.exceptions import UserAuthTypeDisabled
from tracim_backend.exceptions import UserCantChangeIsOwnProfile
from tracim_backend.exceptions import UserCantDeleteHimself
from tracim_backend.exceptions import UserCantDisableHimself
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import UserFollowAlreadyDefined
from tracim_backend.exceptions import UserImageNotFound
from tracim_backend.exceptions import UsernameAlreadyExists
from tracim_backend.exceptions import WrongAuthTypeForUser
from tracim_backend.exceptions import WrongLDAPCredentials
from tracim_backend.exceptions import WrongUserPassword
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.storage import StorageLib
from tracim_backend.lib.mail_notifier.notifier import get_email_manager
from tracim_backend.lib.utils.image_process import ImageRatio
from tracim_backend.lib.utils.image_process import ImageSize
from tracim_backend.lib.utils.image_process import crop_image
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.utils import DEFAULT_NB_ITEM_PAGINATION
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.auth import UserConnectionStatus
from tracim_backend.models.auth import UserCreationType
from tracim_backend.models.context_models import AboutUser
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import UserInContext
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.mention import ALL__GROUP_MENTIONS
from tracim_backend.models.social import UserFollower
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.models.user_custom_properties import UserCustomProperties
from tracim_backend.models.userconfig import UserConfig

KNOWN_MEMBERS_ITEMS_LIMIT = 5
KNOWN_CONTENT_ITEMS_DEFAULT_LIMIT = 15
AVATAR_RATIO = ImageRatio(1, 1)
COVER_RATIO = ImageRatio(35, 4)
DEFAULT_AVATAR_SIZE = ImageSize(100, 100)
DEFAULT_COVER_SIZE = ImageSize(1300, 150)
# INFO - G.M - 2022-02-16 - Allow all alphanumeric characters for latin and arabic characters
# and - and _ characters,
# This need to be updated synchronously to frontend verification.
USERNAME_VALIDITY_PATTERN = re.compile("^[a-zA-Z0-9\\-_\u0621-\u064A\u0660-\u0669]+$")


class UserApi(object):
    def __init__(
        self,
        current_user: typing.Optional[User],
        session: TracimSession,
        config: CFG,
        show_deleted: bool = False,
        show_deactivated: bool = True,
    ) -> None:
        session.assert_event_mechanism()
        self._session = session
        self._user = current_user
        self._config = config
        self._show_deleted = show_deleted
        self._show_deactivated = show_deactivated

    def _apply_base_filters(self, query):
        if not self._show_deleted:
            query = query.filter(User.is_deleted == False)  # noqa: E711
        if not self._show_deactivated:
            query = query.filter(User.is_active == True)  # noqa: E711
        return query

    def base_query(self):
        return self._apply_base_filters(self._session.query(User))

    def get_user_with_context(self, user: User) -> UserInContext:
        """
        Return UserInContext object from User
        """
        return UserInContext(user=user, dbsession=self._session, config=self._config)

    # Getters

    def get_one(self, user_id: int) -> User:
        """
        Get one user by user id
        """
        try:
            user = self.base_query().filter(User.user_id == user_id).one()
        except NoResultFound as exc:
            raise UserDoesNotExist('User "{}" not found in database'.format(user_id)) from exc
        return user

    def get_one_by_login(self, login: str) -> User:
        """Return the user identified by the given login.
        User's email is searched if the login is an email
        User's username is searched in other cases
        """
        if "@" in login:
            return self.get_one_by_email(login)
        return self.get_one_by_username(login)

    def get_one_by_token(self, token: str) -> User:
        try:
            user = self.base_query().filter(User.auth_token == token).one()
        except NoResultFound as exc:
            raise UserDoesNotExist("User with given token not found in database") from exc
        return user

    def get_one_by_email(self, email: typing.Optional[str]) -> User:
        """
        Get one user by email
        :param email: Email of the user
        :return: one user
        """
        if not email:
            raise UserDoesNotExist("User not found : no email provided")
        try:
            user = self.base_query().filter(User.email == email.lower()).one()
        except NoResultFound as exc:
            raise UserDoesNotExist('User "{}" not found in database'.format(email)) from exc
        return user

    def get_one_by_username(self, username: str) -> User:
        """
        Get one user by username
        :param username: username of the user
        :return: one user
        """
        try:
            user = self.base_query().filter(User.username == username).one()
        except NoResultFound as exc:
            raise UserDoesNotExist(
                'User for username "{}" not found in database'.format(username)
            ) from exc
        return user

    def get_current_user(self) -> User:
        """
        Get current_user
        """
        if not self._user:
            raise UserDoesNotExist("There is no current user")
        return self._user

    def _get_all_query(self) -> Query:
        return self.base_query().order_by(func.lower(User.display_name))

    def get_all(self) -> typing.List[User]:
        return self._get_all_query().all()

    def get_user_ids_from_profile(self, profile: Profile) -> typing.Iterable[int]:
        query = self._apply_base_filters(self._session.query(User.user_id))
        return [res[0] for res in query.filter(User.profile == profile)]

    def get_members_of_workspaces(self, workspace_ids: typing.List[int]) -> typing.List[int]:
        user_ids_in_workspaces_tuples = (
            self._session.query(UserRoleInWorkspace.user_id)
            .distinct(UserRoleInWorkspace.user_id)
            .filter(UserRoleInWorkspace.workspace_id.in_(workspace_ids))
            .all()
        )
        return [item[0] for item in user_ids_in_workspaces_tuples]

    def get_known_users(
        self,
        acp: str,
        exclude_user_ids: typing.List[int] = None,
        exclude_workspace_ids: typing.List[int] = None,
        include_workspace_ids: typing.List[int] = None,
        limit: int = 0,
        filter_results: bool = True,
    ) -> typing.List[User]:
        """
        Return list of known users by current UserApi user.
        :param acp: autocomplete filter by name/email
        :param exclude_user_ids: user id to exclude from result
        :param exclude_workspace_ids: workspace user to exclude from result
        :param include_workspace_ids: only include users from these workspaces
        :limit: maximum number of users to return. This value will be capped to
                KNOWN_MEMBERS_ITEMS_LIMIT if requesting users from workspaces that
                the requester is not part of.
        :filter_results: If true, do filter result according to user workspace if user is provided
        :return: List of found users
        """

        nb_elems = KNOWN_MEMBERS_ITEMS_LIMIT

        # RJ - 2020-09-14-NOTE
        # This is a bit convoluted. Keep in mind that we want to allow:
        #  - listing a number of members greater than KNOWN_MEMBERS_ITEMS_LIMIT
        #  - autocomplete less than 2 characters
        # only if the requesting user is in each and every included workspace.
        # Otherwise, we don't want to allow that.
        # By default, we return a maximum of KNOWN_MEMBERS_ITEMS_LIMIT members (when limit is not set),
        # This method is too complex and needs to be split.
        # See https://github.com/tracim/tracim/issues/3635

        user_in_every_included_workspaces = False  # type: bool
        include_user_ids = None  # type: typing.Optional[typing.Set[int]]

        if include_workspace_ids:
            user_in_every_included_workspaces = True

            include_user_ids = set()
            for workspace_id in include_workspace_ids:
                user_ids = self.get_members_of_workspaces([workspace_id])
                include_user_ids.update(user_ids)
                if user_in_every_included_workspaces:
                    user_in_every_included_workspaces = self._user.user_id in user_ids

            if user_in_every_included_workspaces and limit:
                nb_elems = limit
        elif include_workspace_ids:
            include_user_ids = set(self.get_members_of_workspaces(include_workspace_ids))

        if not user_in_every_included_workspaces and len(acp) < 2:
            raise TooShortAutocompleteString(
                'String "{acp}" is too short, the acp string needs to have more than one character, or you need to be in every workspace you include.'.format(
                    acp=acp
                )
            )

        if exclude_workspace_ids:
            if include_workspace_ids:
                raise CannotUseBothIncludeAndExcludeWorkspaceUsers(
                    "Parameters exclude_workspace_ids and include_workspace_ids cannot be both used at the same time"
                )

            user_ids_in_workspaces = self.get_members_of_workspaces(exclude_workspace_ids)
            exclude_user_ids = (exclude_user_ids or []) + user_ids_in_workspaces

        query = self.base_query().order_by(User.display_name)
        query = query.filter(
            or_(
                User.display_name.ilike("%{}%".format(acp)),
                User.email.ilike("%{}%".format(acp)),
                User.username.ilike("%{}%".format(acp)),
            )
        )

        assert not (filter_results and not self._user)
        # INFO - G.M - 2021-01-28 - Warning! Rule access here should be consistent
        # with "knows_candidate_user" checker.
        # A user "knows" another user when either of the following condition is true:
        #  - filter of users is disabled
        #  - User is trusted-user (or more)
        #  - users have at least one common space
        if filter_results and self._user and self._user.profile.id <= Profile.USER.id:
            users_in_workspaces = self._get_user_ids_in_same_workspace(self._user.user_id)
            query = query.filter(User.user_id.in_(users_in_workspaces))

        if exclude_user_ids:
            query = query.filter(~User.user_id.in_(exclude_user_ids))

        if include_user_ids:
            query = query.filter(User.user_id.in_(include_user_ids))

        query = query.limit(nb_elems)
        return query.all()

    def get_known_user_ids(self, user_id: int) -> typing.List[int]:
        if (
            self._config.KNOWN_MEMBERS__FILTER
            and self._user
            and self._user.profile.id <= Profile.USER.id
        ):
            return [r[0] for r in self.get_users_ids_in_same_workpaces(user_id)]
        return [r[0] for r in self._session.query(User.user_id).all()]

    def get_all_known_users(self, user_id: int) -> typing.List[User]:
        if (
            self._config.KNOWN_MEMBERS__FILTER
            and self._user
            and self._user.profile.id <= Profile.USER.id
        ):
            query = self._apply_base_filters(self._session.query(User))
            users_in_workspaces = self._get_user_ids_in_same_workspace(user_id=user_id)
            query = query.filter(User.user_id.in_(users_in_workspaces))
            return query.all()
        return self.get_all()

    def get_known_contents_in_context(
        self, acp: typing.Optional[str] = None, limit: typing.Optional[int] = None
    ) -> typing.List[ContentInContext]:
        """
        Return list of known contents by current UserApi user.
        :param acp: autocomplete filter by content id / content label
        :limit: maximum number of contents to return.
            - 0 for no limit
            - None for the default limit (KNOWN_CONTENT_ITEMS_DEFAULT_LIMIT)
        :return: List of found contents
        """

        if limit is None:
            limit = KNOWN_CONTENT_ITEMS_DEFAULT_LIMIT

        content_api = ContentApi(
            session=self._session, current_user=self._user, config=self._config,
        )

        query = content_api.get_base_query(workspaces=self.get_user_workspaces())
        query = query.filter(Content.type != content_type_list.Comment.slug)

        if acp:
            query = query.filter(
                or_(
                    cast(Content.content_id, sqlalchemy.String).ilike("%{}%".format(acp)),
                    Content.label.ilike("%{}%".format(acp)),
                )
            )
            query.order_by(Content.content_id)

        if limit:
            query = query.limit(limit)

        contents = query.all()
        return [content_api.get_content_in_context(content) for content in contents]

    def get_reserved_usernames(self) -> typing.Tuple[str, ...]:
        return ALL__GROUP_MENTIONS

    def get_user_workspaces_query(self, user_id: int) -> Query:
        return self._session.query(UserRoleInWorkspace.workspace_id).filter(
            UserRoleInWorkspace.user_id == user_id
        )

    def get_user_workspaces(self) -> typing.List[Workspace]:
        return self.get_user_workspaces_query(self._user.user_id).all()

    def _get_user_ids_in_same_workspace(self, user_id: int):
        user_workspaces_id_query = self.get_user_workspaces_query(user_id)
        users_in_workspaces = (
            self._session.query(UserRoleInWorkspace.user_id)
            .distinct(UserRoleInWorkspace.user_id)
            .filter(UserRoleInWorkspace.workspace_id.in_(user_workspaces_id_query.subquery()))
            .subquery()
        )
        return users_in_workspaces

    def get_users_ids_in_same_workpaces(self, user_id: int):
        query = self._apply_base_filters(self._session.query(User.user_id))
        users_in_workspaces = self._get_user_ids_in_same_workspace(user_id=user_id)
        query = query.filter(User.user_id.in_(users_in_workspaces))
        result = query.all()
        return [item[0] for item in result]

    # Check methods
    def user_with_email_exists(self, email: str) -> bool:
        try:
            self.get_one_by_email(email)
            return True
        except UserDoesNotExist:
            return False

    def _ldap_authenticate(
        self, user: typing.Optional[User], login: str, password: str, ldap_connector: "Connector"
    ) -> User:
        """
        Authenticate with ldap, return authenticated user or raise Exception
        like WrongAuthTypeForUser, WrongLDAPCredentials, UserDoesNotExist
        or UserAuthenticatedIsNotActive
        :param user: user to check,, can be none if user not found, will try
         to create new user if none but ldap auth succeed
        :param login: login of the user
        :param password: cleartext password of the user
        :param ldap_connector: ldap connector, enable ldap auth if provided
        """
        auth_type = AuthType.LDAP

        # INFO - G.M - 2018-11-22 - Do no_t authenticate user with auth_type
        # different from LDAP
        if user and user.auth_type not in [auth_type, AuthType.UNKNOWN]:
            raise WrongAuthTypeForUser(
                'User "{}" auth_type is {} not {}'.format(
                    login, user.auth_type.value, auth_type.value
                )
            )

        # INFO - G.M - 2018-11-22 - LDAP Auth
        data = ldap_connector.authenticate(login, password)
        if not data:
            raise WrongLDAPCredentials("LDAP credentials are not correct")
        ldap_data = data[1]

        # INFO - G.M - 2018-11-22 - Create new user
        if not user:
            profile = None
            # TODO - G.M - 2018-12-05 - [ldap_profile]
            # support for profile attribute disabled
            # Should be reenabled later probably with a better code
            # if self._config.LDAP_PROFILE_ATTR:
            #     ldap_profile = ldap_data[self._config.LDAP_PROFILE_ATTR][0]
            #     try:
            #         profile = Profile.get_one_by_slug(ldap_profile)
            #     except ProfileDoesNotExist:
            #         logger.warning(self,
            #             'Profile {} does not exist, create ldap user'
            #             'with default profile.'.format(
            #                 ldap_profile
            #             )
            #         )
            name = None
            if self._config.LDAP_NAME_ATTRIBUTE:
                name = ldap_data[self._config.LDAP_NAME_ATTRIBUTE][0]
            # INFO - G.M - 2018-11-08 - Create new user from ldap credentials
            use_email = False
            if "@" in login:
                use_email = True
            user = self.create_user(
                email=login if use_email else None,
                username=login if not use_email else None,
                name=name,
                profile=profile,
                auth_type=AuthType.LDAP,
                do_save=True,
                do_notify=False,
            )
            transaction.commit()
            # INFO - G.M - 2018-11-08 - get new created user
            user = self.get_one_by_login(login)

        if user.is_deleted:
            raise UserDoesNotExist("This user has been deleted")

        if not user.is_active:
            raise UserAuthenticatedIsNotActive("This user is not activated")

        if user.auth_type == AuthType.UNKNOWN:
            user.auth_type = auth_type
        return user

    def _internal_db_authenticate(
        self, user: typing.Optional[User], login: str, password: str
    ) -> User:
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
            raise UserDoesNotExist("User {} not found in database".format(login))

        if user.auth_type not in [auth_type, AuthType.UNKNOWN]:
            raise WrongAuthTypeForUser(
                'User "{}" auth_type is {} not {}'.format(
                    login, user.auth_type.value, auth_type.value
                )
            )
        if not user.validate_password(password):
            raise WrongUserPassword('User "{}" password is incorrect'.format(login))

        if user.is_deleted:
            raise UserDoesNotExist("This user has been deleted")

        if not user.is_active:
            raise UserAuthenticatedIsNotActive("This user is not activated")

        if user.auth_type == AuthType.UNKNOWN:
            user.auth_type = auth_type
        return user

    def _remote_user_authenticate(self, user: typing.Optional[User], login: str) -> User:
        """
        Authenticate with remote_auth, return authenticated user
        or raise Exception like WrongAuthTypeForUser,
        UserDoesNotExist or UserAuthenticatedIsNotActive
        :param user: user to check, can be none if user not found, will try
         to create new user if none
        :param login: email of the user
        """
        auth_type = AuthType.REMOTE

        # INFO - G.M - 2018-12-12 - Do not authenticate user with auth_type
        # different from REMOTE
        if user and user.auth_type not in [auth_type, AuthType.UNKNOWN]:
            raise WrongAuthTypeForUser(
                'User "{}" auth_type is {} not {}'.format(
                    login, user.auth_type.value, auth_type.value
                )
            )

        # INFO - G.M - 2018-12-12 - Create new user
        if not user:
            profile = None
            use_email = False
            if "@" in login:
                use_email = True
            user = self.create_user(
                email=login if use_email else None,
                username=login if not use_email else None,
                profile=profile,
                auth_type=AuthType.REMOTE,
                do_save=True,
                do_notify=False,
            )
            transaction.commit()
            # INFO - G.M - 2018-12-02 - get new created user
            user = self.get_one_by_login(login)

        if user.is_deleted:
            raise UserDoesNotExist("This user has been deleted")

        if not user.is_active:
            raise UserAuthenticatedIsNotActive("This user is not activated")

        if user.auth_type == AuthType.UNKNOWN:
            user.auth_type = auth_type
        return user

    def remote_authenticate(self, login: str) -> User:
        """
        Remote Authenticate user with email (no password check),
        raise AuthenticationFailed if uncorrect.
        raise RemoteUserAuthDisabled if auth remote header is not set
        """
        try:
            if not self._config.REMOTE_USER_HEADER:
                raise RemoteUserAuthDisabled("Remote User Auth mechanism disabled")
            return self._remote_authenticate(login)
        except AuthenticationFailed as exc:
            raise exc
        except WrongAuthTypeForUser as exc:
            raise AuthenticationFailed("Auth mechanism for this user is not activated") from exc

    def _remote_authenticate(self, login: str):
        """
        Authenticate user with login given using remote mechanism,
        raise AuthenticationFailed if uncorrect.
        :param login: login of the user
        :return: User who was authenticated.
        """
        # get existing user
        user = None
        if login:
            try:
                user = self.get_one_by_login(login)
            except UserDoesNotExist:
                pass
        # try auth
        try:
            return self._remote_user_authenticate(user, login)
        except (
            UserDoesNotExist,
            UserAuthenticatedIsDeleted,
            UserAuthenticatedIsNotActive,
            TracimValidationFailed,
            EmailRequired,
        ) as exc:
            raise AuthenticationFailed('User "{}" authentication failed'.format(login)) from exc

    def authenticate(self, password: str, login: str, ldap_connector: "Connector" = None) -> User:
        """
        Authenticate user with email/username and password, raise AuthenticationFailed
        if incorrect. try all auth available in order and raise issue of
        last auth if all auth failed.
        :param login: login or username of the user
        :param password: cleartext password of the user
        :param ldap_connector: ldap connector, enable ldap auth if provided
        :return: User who was authenticated.
        """
        for auth_type in self._config.AUTH_TYPES:
            try:
                return self._authenticate(
                    login=login,
                    password=password,
                    ldap_connector=ldap_connector,
                    auth_type=auth_type,
                )
            except AuthenticationFailed as exc:
                raise exc
            except WrongAuthTypeForUser:
                pass

        raise AuthenticationFailed("Auth mechanism for this user is not activated")

    def _authenticate(
        self,
        password: str,
        login: str,
        ldap_connector: "Connector" = None,
        auth_type: AuthType = AuthType.INTERNAL,
    ) -> User:
        """
        Authenticate user with email/username and password, raise AuthenticationFailed
        if incorrect. check only one auth
        :param login: login of the user
        :param password: cleartext password of the user
        :param ldap_connector: ldap connector, enable ldap auth if provided
        :param auth_type: auth type to test.
        :return: User who was authenticated.
        """
        user = None
        try:
            user = self.get_one_by_login(login)
        except UserDoesNotExist:
            pass
        try:
            if auth_type == AuthType.LDAP:
                if ldap_connector:
                    return self._ldap_authenticate(user, login, password, ldap_connector)
                raise MissingLDAPConnector()
            elif auth_type == AuthType.INTERNAL:
                return self._internal_db_authenticate(user, login, password)
            else:
                raise UnknownAuthType()
        except (
            EmailRequired,
            WrongUserPassword,
            WrongLDAPCredentials,
            UserDoesNotExist,
            UserAuthenticatedIsDeleted,
            UserAuthenticatedIsNotActive,
            TracimValidationFailed,
        ) as exc:
            raise AuthenticationFailed('User "{}" authentication failed'.format(login)) from exc

    # Actions
    def set_password(
        self,
        user: User,
        loggedin_user_password: str,
        new_password: str,
        new_password2: str,
        do_save: bool = True,
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
            raise NoUserSetted("Current User should be set in UserApi to use this method")

        self._check_password_modification_allowed(self._user)
        if not self._user.validate_password(loggedin_user_password):
            raise WrongUserPassword(
                "Wrong password for authenticated user {}".format(self._user.user_id)
            )
        if new_password != new_password2:
            raise PasswordDoNotMatch("Passwords given are different")

        self.update(user=user, password=new_password, do_save=do_save)
        if do_save:
            # TODO - G.M - 2018-07-24 - Check why commit is needed here
            self.save(user)
        return user

    def set_email(
        self, user: User, loggedin_user_password: str, email: str, do_save: bool = True
    ) -> User:
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
            raise NoUserSetted("Current User should be set in UserApi to use this method")

        self._check_email_modification_allowed(user)

        if not self._user.validate_password(loggedin_user_password):
            raise WrongUserPassword(
                "Wrong password for authenticated user {}".format(self._user.user_id)
            )
        self.update(user=user, email=email, do_save=do_save)
        return user

    def set_username(
        self, user: User, loggedin_user_password: str, username: str, do_save: bool = True
    ) -> User:
        """
        Set username of user if loggedin user password is correct
        :param user: User who need email changed
        :param loggedin_user_password: cleartext password of logged user (not
        same as user)
        :param username: new username
        :param do_save: if True, flush database session
        :return:
        """
        if not self._user:
            raise NoUserSetted("Current User should be set in UserApi to use this method")

        if not self._user.validate_password(loggedin_user_password):
            raise WrongUserPassword(
                "Wrong password for authenticated user {}".format(self._user.user_id)
            )
        self.update(user=user, username=username, do_save=do_save)
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
            raise PasswordDoNotMatch("Passwords given are different")

        self.update(user=user, password=new_password, do_save=do_save)
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
            raise EmailValidationFailed("Email given form {} is uncorrect".format(email))
        EMAIL_ALREADY_EXISTS = self.check_email_already_in_db(email)
        if EMAIL_ALREADY_EXISTS:
            raise EmailAlreadyExists(
                "Email given {} already exist, please choose something else".format(email)
            )
        return True

    def check_username(self, username: str) -> None:
        """Check given username.

        Raise:
            - InvalidUsernameFormat if username does not match the required format
            - UsernameAlreadyExists if username is already used by another user
            - ReservedUsernameError if username is reserved (group mentions)
        """
        if not self._check_username_correctness(username):
            raise InvalidUsernameFormat("Username '{}' is not correct".format(username))

        if self.check_username_already_in_db(username):
            raise UsernameAlreadyExists(
                "Username given '{}' already exist, please choose something else".format(username)
            )
        if username in self.get_reserved_usernames():
            raise ReservedUsernameError("'{}' is a reserved username".format(username))

    def check_email_already_in_db(self, email: str) -> bool:
        """
        Verify if given email does already exist in db
        """
        return self._session.query(User.email).filter(User.email == email).count() != 0

    def check_username_already_in_db(self, username: str) -> bool:
        """
        Verify if given username already used in db
        """
        return self._session.query(User.username).filter(User.username == username).count() != 0

    def _check_email_correctness(self, email: str) -> bool:
        """
        Verify if given email is correct:
        - check format
        - futur active check for email ? (dns based ?)
        """
        try:
            TracimEmailValidator()(email)
            return True
        except ValidationError:
            return False

    def _check_username_correctness(self, username: str) -> bool:
        if len(username) < User.MIN_USERNAME_LENGTH or len(username) > User.MAX_USERNAME_LENGTH:
            return False
        return bool(USERNAME_VALIDITY_PATTERN.match(username))

    def update(
        self,
        user: User,
        name: str = None,
        email: str = None,
        password: str = None,
        timezone: str = None,
        lang: str = None,
        auth_type: AuthType = None,
        profile: typing.Optional[Profile] = None,
        allowed_space: typing.Optional[int] = None,
        username: str = None,
        do_save=True,
    ) -> User:
        """Update given user instance with given parameters"""
        validator = TracimValidator()
        validator.add_validator("name", name, user_public_name_validator)
        validator.add_validator("password", password, user_password_validator)
        validator.add_validator("email", email, user_email_validator)
        validator.add_validator("username", name, user_username_validator)
        validator.add_validator("timezone", timezone, user_timezone_validator)
        validator.add_validator("lang", lang, user_lang_validator)
        validator.validate_all()

        if name is not None:
            user.display_name = name

        if auth_type is not None:
            if (
                auth_type not in [AuthType.UNKNOWN, AuthType.REMOTE]
                and auth_type not in self._config.AUTH_TYPES
            ):
                raise UserAuthTypeDisabled(
                    'Can\'t update user "{}" auth_type with unavailable value "{}".'.format(
                        user.login, auth_type
                    )
                )
            user.auth_type = auth_type

        if email is not None:
            lowercase_email = email.lower()
            if lowercase_email != user.email:
                self._check_email_modification_allowed(user)
                self._check_email(lowercase_email)
                user.email = lowercase_email

        if username is not None:
            if username != user.username:
                self.check_username(username)
                user.username = username

        if password is not None:
            self._check_password_modification_allowed(user)
            user.password = password

        if timezone is not None:
            user.timezone = timezone

        if lang is not None:
            user.lang = lang

        if profile is not None:
            if self._user and self._user == user:
                raise UserCantChangeIsOwnProfile(
                    "User {} can't change is own profile".format(user.user_id)
                )
            user.profile = profile

        if allowed_space is not None:
            user.allowed_space = allowed_space

        if do_save:
            self.save(user)

        return user

    def _check_password_modification_allowed(self, user: User) -> bool:
        if user.auth_type and user.auth_type not in [AuthType.INTERNAL, AuthType.UNKNOWN]:
            raise ExternalAuthUserPasswordModificationDisallowed(
                "user {} is link to external auth {},"
                "password modification disallowed".format(user.login, user.auth_type)
            )
        return True

    def _check_email_modification_allowed(self, user: User) -> bool:
        if user.auth_type and user.auth_type not in [AuthType.INTERNAL, AuthType.UNKNOWN]:
            raise ExternalAuthUserEmailModificationDisallowed(
                "user {} is link to external auth {},"
                "email modification disallowed".format(user.login, user.auth_type)
            )
        return True

    def create_user(
        self,
        email: typing.Optional[str] = None,
        username: typing.Optional[str] = None,
        password: typing.Optional[str] = None,
        name: typing.Optional[str] = None,
        timezone: str = "",
        lang: typing.Optional[str] = None,
        auth_type: AuthType = AuthType.UNKNOWN,
        profile: typing.Optional[Profile] = None,
        allowed_space: typing.Optional[int] = None,
        creation_type: typing.Optional[UserCreationType] = None,
        creation_author: typing.Optional[User] = None,
        do_save: bool = True,
        do_notify: bool = True,
    ) -> User:
        if do_notify and not self._config.EMAIL__NOTIFICATION__ACTIVATED:
            raise NotificationDisabledCantCreateUserWithInvitation(
                "Can't create user with invitation mail because " "notification are disabled."
            )
        new_user = self.create_minimal_user(email, username, profile, save_now=False)
        if allowed_space is None:
            allowed_space = self._config.LIMITATION__USER_DEFAULT_ALLOWED_SPACE
        self.update(
            user=new_user,
            name=name,
            username=username,
            email=email,
            auth_type=auth_type,
            password=password,
            timezone=timezone,
            allowed_space=allowed_space,
            lang=lang,
            do_save=False,
        )
        new_user.creation_type = creation_type
        if creation_type == UserCreationType.REGISTER and not creation_author:
            new_user.creation_author = new_user
        else:
            new_user.creation_author = creation_author
        # TODO - G.M - 04-04-2018 - [auth]
        # Check if this is already needed with
        # new auth system
        new_user.ensure_auth_token(validity_seconds=self._config.USER__AUTH_TOKEN__VALIDITY)
        # NOTE BS 20200428: #2829: Email no longer required for User
        if do_notify and new_user.email:
            try:
                email_manager = get_email_manager(self._config, self._session)
                email_manager.notify_created_account(
                    new_user, password=password, origin_user=self._user
                )
            # FIXME - G.M - 2018-11-02 - hack: accept bad recipient user creation
            # this should be fixed to find a solution to allow "fake" email but
            # also have clear error case for valid mail.
            except SMTPRecipientsRefused:
                logger.warning(
                    self,
                    "Account created for {email} but SMTP server refuse to send notification".format(
                        email=email
                    ),
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
        email: typing.Optional[str] = None,
        username: typing.Optional[str] = None,
        profile: typing.Optional[Profile] = None,
        save_now=False,
    ) -> User:
        """Previous create_user method"""
        if not email:
            if self._config.EMAIL__REQUIRED:
                raise EmailRequired("Email is required to create an user")
            if not username:
                raise EmailOrUsernameRequired("Email or username is required to create an user")
        lowercase_email = email.lower() if email is not None else None
        validator = TracimValidator()
        validator.add_validator("email", lowercase_email, user_email_validator)
        validator.validate_all()
        if lowercase_email is not None:
            self._check_email(lowercase_email)
        if username is not None:
            self.check_username(username)
        user = User()
        user.email = lowercase_email
        user.username = username
        # TODO - G.M - 2018-11-29 - Check if this default_value can be
        # incorrect according to user_public_name_validator
        user.display_name = email.split("@")[0] if email else username
        user.created = datetime.datetime.utcnow()
        if not profile:
            profile = Profile.get_profile_from_slug(self._config.USER__DEFAULT_PROFILE)
        user.profile = profile

        if save_now:
            self.save(user)

        return user

    def reset_password_notification(self, user: User, do_save: bool = False) -> str:
        """
        Reset password notification
        :param user: The user for which the password is reset
        :param do_save: should we save the update?
        :return: reset_password_token
        """
        self._check_user_auth_validity(user)
        self._check_password_modification_allowed(user)

        if not user.email:
            raise MissingEmailCantResetPassword("Can't reset password without an email address")

        if not self._config.EMAIL__NOTIFICATION__ACTIVATED:
            raise NotificationDisabledCantResetPassword(
                "Can't reset password with notification disabled"
            )

        token = user.generate_reset_password_token()
        try:
            email_manager = get_email_manager(self._config, self._session)
            email_manager.notify_reset_password(user, token)
        except SMTPException as exc:
            raise NotificationSendingFailed("SMTP error, can't send notification") from exc
        except EmailTemplateError as exc:
            raise exc

        if do_save:
            self.save(user)
        return token

    def validate_reset_password_token(self, user: User, token: str) -> bool:
        self._check_user_auth_validity(user)
        self._check_password_modification_allowed(user)
        return user.validate_reset_password_token(
            token=token, validity_seconds=self._config.USER__RESET_PASSWORD__TOKEN_LIFETIME
        )

    def enable(self, user: User, do_save=False):
        user.is_active = True
        if do_save:
            self.save(user)

    def disable(self, user: User, do_save=False):
        if self._user and self._user == user:
            raise UserCantDisableHimself("User {} can't disable himself".format(user.user_id))

        user.is_active = False
        if do_save:
            self.save(user)

    def delete(self, user: User, do_save=False):
        if self._user and self._user == user:
            raise UserCantDeleteHimself("User {} can't delete himself".format(user.user_id))
        user.is_deleted = True
        if do_save:
            self.save(user)

    def undelete(self, user: User, do_save=False):
        user.is_deleted = False
        if do_save:
            self.save(user)

    def save(self, user: User):
        is_new_user = not user.user_id

        self._session.add(user)

        if is_new_user:
            self._session.add(UserConfig(user=user))
            self._session.add(UserCustomProperties(user=user))

        self._session.flush()

    def _check_user_auth_validity(self, user: User) -> None:
        if not self._user_can_authenticate(user):
            raise UserAuthTypeDisabled(
                "user {} auth type {} is disabled".format(user.login, user.auth_type.value)
            )

    def _user_can_authenticate(self, user: User) -> bool:
        valid_auth_types = list(self._config.AUTH_TYPES)
        # INFO - G.M - 2019-01-29 - we need to add Unknown as config doesn't
        # list it for some reason and as unknown is a valid auth method.
        # this fix issue 1359 :
        # https://github.com/tracim/tracim/issues/1359
        valid_auth_types.append(AuthType.UNKNOWN)
        return user.auth_type and user.auth_type in valid_auth_types

    def allowed_to_invite_new_user(self, email: str) -> bool:
        # INFO - G.M - 2018-10-25 - disallow account creation if no
        # email provided or email_notification disabled.
        if not email:
            return False
        if (
            not self._config.EMAIL__NOTIFICATION__ACTIVATED
            and self._config.NEW_USER__INVITATION__DO_NOTIFY
        ):
            return False
        # INFO - G.M - 2018-10-25 - do not allow all profile to invite new user
        invite_minimal_profile = Profile.get_profile_from_slug(
            self._config.NEW_USER__INVITATION__MINIMAL_PROFILE
        )

        if not self._user.profile.id >= invite_minimal_profile.id:
            return False

        return True

    def create_follower(
        self,
        follower_id: int,
        leader_id: int,
        created_date: typing.Optional[datetime.datetime] = None,
        do_save: bool = True,
    ) -> UserFollower:
        # NOTE BS 20201229: sqlalchemy raise database specific error. In addition, error is
        # raised at commit, so after view execution (so we can't catch it with hapic view
        # decorators). So check if row exist before try to insert.
        if (
            self._session.query(UserFollower)
            .filter(
                and_(UserFollower.leader_id == leader_id, UserFollower.follower_id == follower_id)
            )
            .count()
        ):
            raise UserFollowAlreadyDefined("User follow already defined")

        user_follower = UserFollower(
            follower_id=follower_id, leader_id=leader_id, created_date=created_date
        )
        self._session.add(user_follower)

        if do_save:
            self._session.flush()

        return user_follower

    def delete_follower(self, follower_id: int, leader_id: int) -> None:
        try:
            user_follow = (
                self._session.query(UserFollower)
                .filter(
                    and_(
                        UserFollower.leader_id == leader_id, UserFollower.follower_id == follower_id
                    )
                )
                .one()
            )
            self._session.delete(user_follow)
        except NoResultFound:
            raise NotFound("User following does not exist")

    def get_paginated_leaders_for_user(
        self,
        user_id: int,
        count: typing.Optional[int] = DEFAULT_NB_ITEM_PAGINATION,
        page_token: typing.Optional[int] = None,
        filter_leader_id: typing.Optional[int] = None,
    ) -> Page:
        query = (
            self._session.query(UserFollower.leader_id.label("user_id"))
            .filter(UserFollower.follower_id == user_id)
            .order_by(UserFollower.leader_id)
        )
        if filter_leader_id is not None:
            query = query.filter(UserFollower.leader_id == filter_leader_id)
        return get_page(query, per_page=count, page=page_token or False)

    def get_paginated_followers_for_leader(
        self,
        user_id: int,
        count: typing.Optional[int] = DEFAULT_NB_ITEM_PAGINATION,
        page_token: typing.Optional[int] = None,
        filter_user_id: typing.Optional[int] = None,
    ) -> Page:
        query = (
            self._session.query(UserFollower.follower_id.label("user_id"))
            .filter(UserFollower.leader_id == user_id)
            .order_by(UserFollower.follower_id)
        )
        if filter_user_id is not None:
            query = query.filter(UserFollower.follower_id == filter_user_id)
        return get_page(query, per_page=count, page=page_token or False)

    def get_followers_count(self, leader_id: int) -> int:
        return self._session.query(UserFollower).filter(UserFollower.leader_id == leader_id).count()

    def get_leaders_count(self, user_id: int) -> int:
        return self._session.query(UserFollower).filter(UserFollower.follower_id == user_id).count()

    def get_about_user(self, user_id: int) -> AboutUser:
        """
        Return general user informations.
        """
        followers_count = self.get_followers_count(user_id)
        leaders_count = self.get_leaders_count(user_id)
        user = self.get_one(user_id)

        content_revisions_infos = ContentApi(
            self._session, self._user, self._config
        ).get_authored_content_revisions_infos(user_id)

        return AboutUser(
            user_id=user.user_id,
            public_name=user.public_name,
            username=user.username,
            followers_count=followers_count,
            leaders_count=leaders_count,
            created=user.created,
            authored_content_revisions_count=content_revisions_infos.count,
            authored_content_revisions_space_count=content_revisions_infos.space_count,
            has_avatar=user.has_avatar,
            has_cover=user.has_cover,
        )

    def get_avatar(
        self, user_id: int, filename: str, default_filename: str, force_download: bool = False,
    ) -> HapicFile:
        user = self.get_one(user_id)
        if not user.avatar:
            raise UserImageNotFound("avatar of user {} not found".format(user_id))
        return StorageLib(self._config).get_raw_file(
            depot_file=user.avatar,
            filename=filename,
            default_filename=default_filename,
            force_download=force_download,
        )

    def get_avatar_preview(
        self,
        user_id: int,
        filename: str,
        default_filename: str,
        width: int = None,
        height: int = None,
        force_download: bool = False,
    ) -> HapicFile:
        user = self.get_one(user_id)
        if not user.cropped_avatar:
            raise UserImageNotFound("cropped version of user {} avatar not found".format(user_id))
        _, original_file_extension = os.path.splitext(user.cropped_avatar.filename)
        return StorageLib(self._config).get_jpeg_preview(
            depot_file=user.cropped_avatar,
            filename=filename,
            default_filename=default_filename,
            width=width,
            height=height,
            original_file_extension=original_file_extension,
            force_download=force_download,
            page_number=1,
        )

    def set_avatar(
        self, user_id: int, new_filename: str, new_mimetype: str, new_content: typing.BinaryIO
    ) -> None:
        user = self.get_one(user_id)

        self._session.add(user)
        (user.avatar, user.cropped_avatar) = self._crop_and_prepare_depot_storage(
            new_filename, new_mimetype, new_content.read(), "avatar", AVATAR_RATIO
        )
        self._session.flush()

    def get_cover(
        self, user_id: int, filename: str, default_filename: str, force_download: bool = False,
    ) -> HapicFile:
        user = self.get_one(user_id)
        if not user.cover:
            raise UserImageNotFound("cover of user {} not found".format(user_id))
        return StorageLib(self._config).get_raw_file(
            depot_file=user.cover,
            filename=filename,
            default_filename=default_filename,
            force_download=force_download,
        )

    def get_cover_preview(
        self,
        user_id: int,
        filename: str,
        default_filename: str,
        width: int = None,
        height: int = None,
        force_download: bool = False,
    ) -> HapicFile:
        user = self.get_one(user_id)
        if not user.cropped_cover:
            raise UserImageNotFound("cropped version of user {} cover not found".format(user_id))
        _, original_file_extension = os.path.splitext(user.cropped_cover.filename)
        return StorageLib(self._config).get_jpeg_preview(
            depot_file=user.cropped_cover,
            filename=filename,
            default_filename=default_filename,
            width=width,
            height=height,
            original_file_extension=original_file_extension,
            force_download=force_download,
            page_number=1,
        )

    def set_cover(
        self, user_id: int, new_filename: str, new_mimetype: str, new_content: typing.BinaryIO
    ) -> None:
        user = self.get_one(user_id)
        (user.cover, user.cropped_cover) = self._crop_and_prepare_depot_storage(
            new_filename, new_mimetype, new_content.read(), "cover", COVER_RATIO
        )
        self._session.add(user)
        self._session.flush()

    def _crop_and_prepare_depot_storage(
        self,
        filename: str,
        mimetype: str,
        content: bytes,
        cropped_basename: str,
        crop_ratio: ImageRatio,
    ) -> typing.Tuple[FileIntent, FileIntent]:
        """
        Prepare depot storage of an image file: original + cropped image.
        The cropped image is stored as a PNG file.
        @return tuple with FileIntent objects for original, cropped images
        """
        label, extension = os.path.splitext(filename)
        original = FileIntent(content, filename, mimetype)
        with io.BytesIO() as cropped_io:
            # FIXME - G.M - 2021-01-21 - should we catch error here,
            # what happened if pillow failed ?
            crop_image(io.BytesIO(content), cropped_io, ratio=crop_ratio, format="png")
            cropped = FileIntent(
                cropped_io.getvalue(), "{}.png".format(cropped_basename), "image/png"
            )
        return (original, cropped)

    def get_online_user_count(self, exclude_current_user: bool = True) -> int:
        """Return the number of online users.

        By default, exclude the current user from the count.
        """
        query = self._session.query(User.user_id).filter(
            User.connection_status == UserConnectionStatus.ONLINE
        )
        if exclude_current_user:
            query = query.filter(User.user_id != self._user.user_id)
        return query.count()

    def check_maximum_online_users(self) -> None:
        online_user_count = self.get_online_user_count(exclude_current_user=True)
        if (
            self._config.LIMITATION__MAXIMUM_ONLINE_USERS
            and online_user_count >= self._config.LIMITATION__MAXIMUM_ONLINE_USERS
        ):
            raise TooManyOnlineUsersError(
                "Too many users online ({}/{})".format(
                    online_user_count, self._config.LIMITATION__MAXIMUM_ONLINE_USERS
                )
            )

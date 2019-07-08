import typing

from sqlalchemy.orm import Session
from wsgidav import util as wsgidav_util
from wsgidav.dav_provider import _DAVResource

from tracim_backend import CFG
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.webdav import Provider
from tracim_backend.lib.webdav.dav_provider import WebdavTracimContext
from tracim_backend.models.auth import User


class ContentApiFactory(object):
    def __init__(self, session: Session, app_config: CFG, admin_user: User):
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(
        self,
        current_user: typing.Optional[User] = None,
        show_active: bool = True,
        show_deleted: bool = False,
        show_archived: bool = False,
    ) -> ContentApi:
        return ContentApi(
            session=self.session,
            config=self.app_config,
            current_user=current_user or self.admin_user,
            show_active=show_active,
            show_deleted=show_deleted,
            show_archived=show_archived,
        )


class WorkspaceApiFactory(object):
    def __init__(self, session: Session, app_config: CFG, admin_user: User):
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(
        self, current_user: typing.Optional[User] = None, show_deleted: bool = False
    ) -> WorkspaceApi:
        return WorkspaceApi(
            session=self.session,
            config=self.app_config,
            show_deleted=show_deleted,
            current_user=current_user or self.admin_user,
        )


class GroupApiFactory(object):
    def __init__(self, session: Session, app_config: CFG, admin_user: User):
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(self, current_user: typing.Optional[User] = None) -> GroupApi:
        return GroupApi(
            session=self.session,
            config=self.app_config,
            current_user=current_user or self.admin_user,
        )


class UserApiFactory(object):
    def __init__(self, session: Session, app_config: CFG, admin_user: User):
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(self, current_user: typing.Optional[User] = None) -> UserApi:
        return UserApi(
            session=self.session,
            config=self.app_config,
            current_user=current_user or self.admin_user,
        )


class RoleApiFactory(object):
    def __init__(self, session: Session, app_config: CFG, admin_user: User):
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(self, current_user: typing.Optional[User] = None) -> RoleApi:
        return RoleApi(
            session=self.session,
            config=self.app_config,
            current_user=current_user or self.admin_user,
        )


class WedavEnvironFactory(object):
    def __init__(self, provider: Provider, session: Session, app_config: CFG, admin_user: User):
        self.provider = provider
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(self, user: typing.Optional[User] = None) -> typing.Dict[str, typing.Any]:

        environ = {
            "http_authenticator.username": user.email_address,
            "http_authenticator.realm": "/",
            "wsgidav.provider": self.provider,
            "tracim_user": user,
        }
        tracim_context = WebdavTracimContext(
            app_config=self.app_config, session=self.session, environ=environ
        )
        environ["tracim_context"] = tracim_context
        return environ


class ApplicationApiFactory(object):
    def __init__(self, app_list):
        self.app_list = app_list

    def get(self):
        return ApplicationApi(self.app_list)


def webdav_put_new_test_file_helper(
    provider: Provider, environ: typing.Dict[str, typing.Any], file_path: str, file_content: bytes
) -> _DAVResource:
    # This part id a reproduction of
    # wsgidav.request_server.RequestServer#doPUT

    # Grab parent folder where create file
    parentRes = provider.getResourceInst(wsgidav_util.getUriParent(file_path), environ)
    assert parentRes, "we should found folder for {0}".format(file_path)

    new_resource = parentRes.createEmptyResource(wsgidav_util.getUriName(file_path))
    write_object = new_resource.beginWrite(contentType="application/octet-stream")
    write_object.write(file_content)
    write_object.close()
    new_resource.endWrite(withErrors=False)

    # Now file should exist
    return provider.getResourceInst(file_path, environ)

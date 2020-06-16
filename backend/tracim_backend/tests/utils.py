from io import BytesIO
import multiprocessing
import os
import subprocess
import typing
from typing import Any
from typing import Optional

from PIL import Image
import plaster
import requests
from requests import Response
from sqlalchemy.orm import Session
from sqlalchemy.orm.session import sessionmaker
import transaction
from waitress import serve
from wsgidav import util as wsgidav_util
from wsgidav.dav_provider import _DAVResource

from tracim_backend import CFG
from tracim_backend import CaldavAppFactory
from tracim_backend.applications.share.lib import ShareLib
from tracim_backend.applications.upload_permissions.lib import UploadPermissionLib
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.plugins import create_plugin_manager
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.search.elasticsearch_search.elasticsearch_search import ESSearchApi
from tracim_backend.lib.webdav import Provider
from tracim_backend.lib.webdav.dav_provider import WebdavTracimContext
from tracim_backend.models.auth import User
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.event import Event
from tracim_backend.models.setup_models import get_tm_session
from tracim_backend.models.tracim_session import TracimSession


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
        namespace_filter: typing.Optional[typing.List[ContentNamespaces]] = None,
    ) -> ContentApi:
        return ContentApi(
            session=self.session,
            config=self.app_config,
            current_user=current_user or self.admin_user,
            show_active=show_active,
            show_deleted=show_deleted,
            show_archived=show_archived,
            namespaces_filter=namespace_filter,
        )


class ShareLibFactory(object):
    def __init__(self, session: Session, app_config: CFG, admin_user: User):
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(self, current_user: typing.Optional[User] = None) -> ShareLib:
        return ShareLib(
            session=self.session,
            config=self.app_config,
            current_user=current_user or self.admin_user,
        )


class UploadPermissionLibFactory(object):
    def __init__(self, session: Session, app_config: CFG, admin_user: User):
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(self, current_user: typing.Optional[User] = None) -> UploadPermissionLib:
        return UploadPermissionLib(
            session=self.session,
            config=self.app_config,
            current_user=current_user or self.admin_user,
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
        self.plugin_manager = create_plugin_manager()

    def get(self, user: typing.Optional[User] = None) -> typing.Dict[str, typing.Any]:

        environ = {
            "http_authenticator.username": user.email_address,
            "http_authenticator.realm": "/",
            "wsgidav.provider": self.provider,
            "tracim_user": user,
        }
        tracim_context = WebdavTracimContext(
            app_config=self.app_config, environ=environ, plugin_manager=self.plugin_manager
        )
        tracim_context.dbsession = self.session
        environ["tracim_context"] = tracim_context
        return environ


class ApplicationApiFactory(object):
    def __init__(self, app_list):
        self.app_list = app_list

    def get(self) -> ApplicationApi:
        return ApplicationApi(self.app_list)


def webdav_put_new_test_file_helper(
    provider: Provider, environ: typing.Dict[str, typing.Any], file_path: str, file_content: bytes
) -> _DAVResource:
    # This part id a reproduction of
    # wsgidav.request_server.RequestServer#doPUT

    # INFO - G.M - 2019-07-11 - set content_length to correct value according to file_content
    environ["CONTENT_LENGTH"] = len(file_content)

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


class MailHogHelper(object):

    MAILHOG_BASE_URL = "http://127.0.0.1:8025"
    MAILHOG_MESSAGES_ENDPOINT = "/api/v1/messages"

    def cleanup_mailhog(self) -> Response:
        return requests.delete("{}{}".format(self.MAILHOG_BASE_URL, self.MAILHOG_MESSAGES_ENDPOINT))

    def get_mailhog_mails(self) -> typing.List[typing.Any]:
        return requests.get(
            "{}{}".format(self.MAILHOG_BASE_URL, self.MAILHOG_MESSAGES_ENDPOINT)
        ).json()

    elastic_search_api = None


class ElasticSearchHelper(object):
    def __init__(self, app_config, session):
        self.elastic_search_api = ESSearchApi(config=app_config, current_user=None, session=session)
        self.elastic_search_api.create_index()

    def refresh_elasticsearch(self) -> None:
        self.elastic_search_api.refresh_index()

    def delete_index(self) -> None:
        self.elastic_search_api.delete_index()


class RadicaleServerHelper(object):
    def __init__(self, config_uri, config_section):
        settings = plaster.get_settings(config_uri, config_section)
        settings["here"] = os.path.dirname(os.path.abspath(TEST_CONFIG_FILE_PATH))
        app_factory = CaldavAppFactory(**settings)
        app = app_factory.get_wsgi_app()
        self.radicale_server = multiprocessing.Process(
            target=serve, kwargs={"app": app, "listen": "localhost:5232"}
        )
        self.radicale_server.daemon = True
        self.radicale_server.start()

    def stop_radicale_server(self):
        if self.radicale_server:
            self.radicale_server.terminate()


class EventHelper(object):
    def __init__(self, db_session: TracimSession) -> None:
        self._session = db_session

    def last_events(self, count: int) -> typing.List[Event]:
        events = self._session.query(Event).order_by(Event.event_id.desc()).limit(count).all()
        return sorted(events, key=lambda e: e.event_id)

    @property
    def last_event(self) -> typing.Optional[Event]:
        return self._session.query(Event).order_by(Event.event_id.desc()).limit(1).one()


class DockerCompose:
    command = [
        "docker-compose",
        "-f",
        os.path.join(os.path.dirname(__file__), "..", "..", "docker-compose.yml"),
    ]

    def up(self, *names: str, env: dict = None) -> None:
        self.execute("up", "-d", *names, env=env)

    def down(self) -> None:
        self.execute("down")

    def execute(self, *arguments: str, env: dict = None) -> None:
        subprocess.run(self.command + list(arguments), env=env, check=True)


def eq_(a: Any, b: Any, msg: Optional[str] = None) -> None:
    # TODO - G.M - 05-04-2018 - Remove this when all old nose code is removed
    assert a == b, msg or "%r != %r" % (a, b)


def set_html_document_slug_to_legacy(session_factory: sessionmaker) -> None:
    """
    Simple function to help some functional test. This modify "html-documents"
    type content in database to legacy "page" slug.
    :param session_factory: session factory of the test
    :return: Nothing.
    """
    dbsession = get_tm_session(session_factory, transaction.manager)
    content_query = (
        dbsession.query(ContentRevisionRO)
        .filter(ContentRevisionRO.type == "page")
        .filter(ContentRevisionRO.content_id == 6)
    )
    assert content_query.count() == 0
    html_documents_query = dbsession.query(ContentRevisionRO).filter(
        ContentRevisionRO.type == "html-document"
    )
    html_documents_query.update({ContentRevisionRO.type: "page"})
    transaction.commit()
    assert content_query.count() > 0


def create_1000px_png_test_image() -> None:
    file = BytesIO()
    image = Image.new("RGBA", size=(1000, 1000), color=(0, 0, 0))
    image.save(file, "png")
    file.name = "test_image.png"
    file.seek(0)
    return file


TEST_CONFIG_FILE_PATH = os.environ.get("TEST_CONFIG_FILE_PATH")
TEST_PUSHPIN_FILE_PATH = os.environ.get("TEST_PUSHPIN_FILE_PATH")

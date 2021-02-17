import contextlib
import importlib
from io import BytesIO
import multiprocessing
import os
import sys
import typing
from typing import Any
from typing import Optional
from unittest import mock

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
from tracim_backend.lib.core.event import EventPublisher
from tracim_backend.lib.core.plugins import create_plugin_manager
from tracim_backend.lib.core.plugins import init_plugin_manager
from tracim_backend.lib.core.subscription import SubscriptionLib
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.search.elasticsearch_search.elasticsearch_search import ESSearchApi
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.lib.webdav import TracimDavProvider
from tracim_backend.lib.webdav.dav_provider import WebdavTracimContext
from tracim_backend.models.auth import User
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.event import Event
from tracim_backend.models.event import Message
from tracim_backend.models.setup_models import create_dbsession_for_context
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


class SubscriptionLibFactory(object):
    def __init__(self, session: Session, app_config: CFG, admin_user: User):
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(self, current_user: typing.Optional[User] = None) -> SubscriptionLib:
        return SubscriptionLib(
            session=self.session,
            config=self.app_config,
            current_user=current_user or self.admin_user,
        )


class WedavEnvironFactory(object):
    def __init__(
        self, provider: TracimDavProvider, session: Session, app_config: CFG, admin_user: User
    ):
        self.provider = provider
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user
        self.plugin_manager = create_plugin_manager()

    def get(self, user: typing.Optional[User] = None) -> typing.Dict[str, typing.Any]:

        environ = {
            "http_authenticator.username": user.email_address if user else None,
            "http_authenticator.realm": "/",
            "wsgidav.provider": self.provider,
            "tracim_user": user,
        }
        tracim_context = WebdavTracimContext(
            app_config=self.app_config, environ=environ, plugin_manager=self.plugin_manager,
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
    provider: TracimDavProvider,
    environ: typing.Dict[str, typing.Any],
    file_path: str,
    file_content: bytes,
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
        self.delete_indices()
        self.elastic_search_api.create_indices()

    def refresh_elasticsearch(self) -> None:
        self.elastic_search_api.refresh_indices()

    def delete_indices(self) -> None:
        self.elastic_search_api.delete_indices()


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


class MessageHelper(object):
    def __init__(self, db_session: TracimSession) -> None:
        self._session = db_session

    def last_user_workspace_messages(
        self, count: int, workspace_id: int, user_id: int
    ) -> typing.List[Event]:
        messages = (
            self._session.query(Message)
            .join(Event)
            .filter(
                Event.fields[Event.WORKSPACE_FIELD]["workspace_id"].as_integer().in_([workspace_id])
            )
            .filter(Message.receiver_id == user_id)
            .order_by(Message.event_id.desc())
            .limit(count)
            .all()
        )
        return sorted(messages, key=lambda e: e.event_id)


class TracimTestContext(TracimContext):
    def __init__(
        self, app_config: CFG, session_factory, user: typing.Optional[User] = None,
    ) -> None:
        super().__init__()
        self._app_config = app_config
        self._plugin_manager = init_plugin_manager(app_config)
        # mock event publishing to avoid requiring a working
        # pushpin instance for every test
        EventPublisher._publish_pending_events_of_context = mock.Mock()
        self._dbsession = create_dbsession_for_context(session_factory, transaction.manager, self)
        self._dbsession.set_context(self)
        self._current_user = user

    @property
    def dbsession(self):
        return self._dbsession

    @property
    def plugin_manager(self):
        return self._plugin_manager

    @property
    def current_user(self):
        return self._current_user

    @property
    def app_config(self):
        return self._app_config


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


def create_1000px_png_test_image() -> BytesIO:
    file = BytesIO()
    image = Image.new("RGBA", size=(1000, 1000), color=(0, 0, 0))
    image.save(file, "png")
    file.name = "test_image.png"
    file.seek(0)
    return file


def create_png_test_image(width: int, height: int) -> BytesIO:
    file = BytesIO()
    image = Image.new("RGBA", size=(width, height), color=(255, 255, 255))
    image.save(file, "png")
    file.name = "test_image.png"
    file.seek(0)
    return file


TEST_CONFIG_FILE_PATH = os.environ.get("TEST_CONFIG_FILE_PATH")


@contextlib.contextmanager
def tracim_plugin_loader(plugin_name, pluggy_manager, plugin_root_folder):
    sys.path.append(plugin_root_folder)
    plugin_module = importlib.import_module(plugin_name)
    sys.path.remove(plugin_root_folder)
    plugins = pluggy_manager.get_plugins()
    plugin_module.register_tracim_plugin(pluggy_manager)
    loaded_plugins = [p for p in pluggy_manager.get_plugins() if p not in plugins]
    yield None
    for p in loaded_plugins:
        pluggy_manager.unregister(p)

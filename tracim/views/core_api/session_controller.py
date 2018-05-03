# coding=utf-8
from pyramid.config import Configurator
from sqlalchemy.orm.exc import NoResultFound

from tracim.lib.core.content import ContentApi
from tracim.lib.core.group import GroupApi
from tracim.lib.core.userworkspace import RoleApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.models import Group
from tracim.models.data import ContentType

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


from tracim import TracimRequest
from tracim.extensions import hapic
from tracim.lib.core.user import UserApi
from tracim.models.context_models import UserInContext
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import UserSchema
from tracim.views.core_api.schemas import NoContentSchema
from tracim.views.core_api.schemas import LoginOutputHeaders
from tracim.views.core_api.schemas import BasicAuthSchema
from tracim.exceptions import NotAuthentificated
from tracim.exceptions import LoginFailed


class SessionController(Controller):

    @hapic.with_api_doc()
    @hapic.input_headers(LoginOutputHeaders())
    @hapic.input_body(BasicAuthSchema())
    @hapic.handle_exception(LoginFailed, http_code=HTTPStatus.BAD_REQUEST)
    # TODO - G.M - 17-04-2018 - fix output header ?
    # @hapic.output_headers()
    @hapic.output_body(
        NoContentSchema(),
        default_http_code=HTTPStatus.NO_CONTENT
    )
    def login(self, context, request: TracimRequest, hapic_data=None):
        """
        Logs user into the system
        """
        email = request.json_body['email']
        password = request.json_body['password']
        app_config = request.registry.settings['CFG']
        try:
            uapi = UserApi(
                None,
                session=request.dbsession,
                config=app_config,
            )
            user = uapi.get_one_by_email(email)
            valid_password = user.validate_password(password)
            if not valid_password:
                # Bad password
                raise LoginFailed('Bad Credentials')
        except NoResultFound:
            # User does not exist
            raise LoginFailed('Bad Credentials')
        return

    @hapic.with_api_doc()
    @hapic.output_body(
        NoContentSchema(),
        default_http_code=HTTPStatus.NO_CONTENT
    )
    def logout(self, context, request: TracimRequest, hapic_data=None):
        """
        Logs out current logged in user session
        """

        return

    @hapic.with_api_doc()
    @hapic.handle_exception(
        NotAuthentificated,
        http_code=HTTPStatus.UNAUTHORIZED
    )
    @hapic.output_body(
        UserSchema(),
    )
    def whoami(self, context, request: TracimRequest, hapic_data=None):
        """
        Return current logged in user or 401
        """
        app_config = request.registry.settings['CFG']
        return UserInContext(
            user=request.current_user,
            dbsession=request.dbsession,
            config=app_config,
        )

    @hapic.with_api_doc()
    @hapic.output_body(
        UserSchema(),
    )
    def create_user(self, context, request: TracimRequest, hapic_data=None):
        """
        Return current logged in user or 401
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            None,
            session=request.dbsession,
            config=app_config,
        )
        group_api = GroupApi(current_user=None, session=request.dbsession)
        groups = [group_api.get_one(Group.TIM_USER),
                  group_api.get_one(Group.TIM_MANAGER),
                  group_api.get_one(Group.TIM_ADMIN)]
        user = uapi.create_user(
            email='dev.tracim.testuser@algoo.fr',
            password='toto',
            name='toto',
            groups=groups,
            timezone="lapin",
            do_save=True,
            do_notify=True,
        )
        wapi = WorkspaceApi(
            current_user=user,
            session=request.dbsession,
        )
        workspace = wapi.get_one_by_label('w1')
        rapi = RoleApi(
            session=request.dbsession,
            current_user=user,
        )
        rapi.create_one(
            user=user,
            workspace=workspace,
            role_level=8,
            with_notif=True,
            flush=True,
        )
        return UserInContext(
            user=user,
            dbsession=request.dbsession,
            config=app_config,
        )

    @hapic.with_api_doc()
    @hapic.handle_exception(
        NotAuthentificated,
        http_code=HTTPStatus.UNAUTHORIZED
    )
    @hapic.output_body(
        NoContentSchema()
    )
    def add_content(self, context, request: TracimRequest, hapic_data=None):
        """
        Return current logged in user or 401
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        workspace = WorkspaceApi(
            current_user=request.current_user,
            session=request.dbsession
        ).get_one_by_label('w1')
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        item = api.create(
            ContentType.Folder,
            workspace,
            None,
            'parent',
            do_save=True,
        )
        item2 = api.create(
            ContentType.File,
            workspace,
            item,
            'file1',
            do_save=True,
            do_notify=True,
        )
        return

    def bind(self, configurator: Configurator):

        # Login
        configurator.add_route('login', '/sessions/login', request_method='POST')  # nopep8
        configurator.add_view(self.login, route_name='login')
        # Logout
        configurator.add_route('logout', '/sessions/logout', request_method='POST')  # nopep8
        configurator.add_view(self.logout, route_name='logout')
        configurator.add_route('logout_get', '/sessions/logout', request_method='GET')  # nopep8
        configurator.add_view(self.logout, route_name='logout_get')
        # Whoami
        configurator.add_route('whoami', '/sessions/whoami', request_method='GET')  # nopep8
        configurator.add_view(self.whoami, route_name='whoami',)

        configurator.add_route('create_user_test', '/create_user', request_method='POST')  # nopep8
        configurator.add_view(self.create_user, route_name='create_user_test',)

        configurator.add_route('add_content', '/add_content', request_method='POST')  # nopep8
        configurator.add_view(self.add_content, route_name='add_content',)
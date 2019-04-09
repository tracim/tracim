from pyramid.config import Configurator

from tracim_backend.extensions import hapic
from tracim_backend.lib.calendar.calendar import CalendarApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import has_personal_access
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.views.calendar_api.schemas import CalendarFilterQuerySchema
from tracim_backend.views.calendar_api.schemas import CalendarSchema
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import UserIdPathSchema
from tracim_backend.views.core_api.user_controller import \
    SWAGGER_TAG__USER_ENDPOINTS

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

SWAGGER_TAG__CALENDAR_SECTION = 'Calendar'
SWAGGER_TAG__USER_CALENDAR_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__USER_ENDPOINTS,
    SWAGGER_TAG__CALENDAR_SECTION
)


class CalendarController(Controller):

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CALENDAR_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_query(CalendarFilterQuerySchema())
    @hapic.output_body(CalendarSchema(many=True))
    def user_calendars(self, context, request: TracimRequest, hapic_data=None):
        app_config = request.registry.settings['CFG']  # type: CFG
        calendar_api = CalendarApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        return calendar_api.get_user_calendars(
            request.candidate_user,
            workspaces_ids_filter=hapic_data.query.workspace_ids,
            calendar_types_filter = hapic_data.query.calendar_types
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CALENDAR_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_query(CalendarFilterQuerySchema())
    @hapic.output_body(CalendarSchema(many=True))
    def account_calendars(self, context, request: TracimRequest, hapic_data=None):
        app_config = request.registry.settings['CFG']  # type: CFG
        calendar_api = CalendarApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        return calendar_api.get_user_calendars(
            request.current_user,
            workspaces_ids_filter=hapic_data.query.workspace_ids,
            calendar_types_filter=hapic_data.query.calendar_types
        )

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # INFO - G.M - 2019-04-01 - user calendar
        configurator.add_route('user_calendars',
                               '/users/{user_id:\d+}/calendar',
                               request_method='GET')
        configurator.add_view(self.user_calendars, route_name='user_calendars')

        # INFO - G.M - 2019-04-01 - own user calendar
        configurator.add_route('account_calendars',
                               '/users/me/calendar',
                               request_method='GET')
        configurator.add_view(self.account_calendars, route_name='account_calendars')

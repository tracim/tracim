from pyramid.config import Configurator

from tracim_backend.applications.agenda.lib import AgendaApi
from tracim_backend.applications.agenda.schemas import AgendaFilterQuerySchema
from tracim_backend.applications.agenda.schemas import AgendaSchema
from tracim_backend.applications.agenda.schemas import PreFilledAgendaEventSchema
from tracim_backend.config import CFG
from tracim_backend.extensions import hapic
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import has_personal_access
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import UserIdPathSchema
from tracim_backend.views.core_api.user_controller import SWAGGER_TAG__USER_ENDPOINTS

SWAGGER_TAG__AGENDA_SECTION = "Agenda"
SWAGGER_TAG__USER_AGENDA_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__USER_ENDPOINTS, SWAGGER_TAG__AGENDA_SECTION
)


class AgendaController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_AGENDA_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_query(AgendaFilterQuerySchema())
    @hapic.output_body(AgendaSchema(many=True))
    def user_agendas(self, context, request: TracimRequest, hapic_data=None):
        app_config = request.registry.settings["CFG"]  # type: CFG
        agenda_api = AgendaApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        return agenda_api.get_user_agendas(
            request.candidate_user,
            workspaces_ids_filter=hapic_data.query.workspace_ids,
            agenda_types_filter=hapic_data.query.agenda_types,
            resource_types_filter=hapic_data.query.resource_types,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_AGENDA_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_query(AgendaFilterQuerySchema())
    @hapic.output_body(AgendaSchema(many=True))
    def account_agendas(self, context, request: TracimRequest, hapic_data=None):
        app_config = request.registry.settings["CFG"]  # type : CFG
        agenda_api = AgendaApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        return agenda_api.get_user_agendas(
            request.current_user,
            workspaces_ids_filter=hapic_data.query.workspace_ids,
            agenda_types_filter=hapic_data.query.agenda_types,
            resource_types_filter=hapic_data.query.resource_types,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__AGENDA_SECTION])
    @check_right(is_user)
    @hapic.output_body(PreFilledAgendaEventSchema())
    def pre_filled_agenda_event(self, context, request: TracimRequest, hapic_data=None):
        app_config = request.registry.settings["CFG"]  # type : CFG
        return {"description": app_config.CALDAV__PRE_FILLED_EVENT__DESCRIPTION}

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # INFO - G.M - 2019-04-01 - user agenda
        configurator.add_route(
            "user_agendas", "/users/{user_id:\d+}/agenda", request_method="GET"
        )  # noqa: W605
        configurator.add_view(self.user_agendas, route_name="user_agendas")

        # INFO - G.M - 2019-04-01 - own user agenda
        configurator.add_route("account_agendas", "/users/me/agenda", request_method="GET")
        configurator.add_view(self.account_agendas, route_name="account_agendas")

        # pre-filled agenda event
        configurator.add_route(
            "pre_filled_agenda_event", "/system/pre-filled-agenda-event", request_method="GET",
        )
        configurator.add_view(self.pre_filled_agenda_event, route_name="pre_filled_agenda_event")

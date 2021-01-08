# coding=utf-8
import typing

from hapic.data import HapicData
from pyramid.config import Configurator

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.extensions import app_list
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.core.system import SystemApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import get_timezones_list
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import AboutSchema
from tracim_backend.views.core_api.schemas import ApplicationSchema
from tracim_backend.views.core_api.schemas import ConfigSchema
from tracim_backend.views.core_api.schemas import ContentTypeSchema
from tracim_backend.views.core_api.schemas import ErrorCodeSchema
from tracim_backend.views.core_api.schemas import GetUsernameAvailability
from tracim_backend.views.core_api.schemas import ReservedUsernamesSchema
from tracim_backend.views.core_api.schemas import TimezoneSchema
from tracim_backend.views.core_api.schemas import UserCustomPropertiesSchema
from tracim_backend.views.core_api.schemas import UserCustomPropertiesUiSchema
from tracim_backend.views.core_api.schemas import UsernameAvailability
from tracim_backend.views.core_api.schemas import WorkspaceAccessTypeSchema

SWAGGER_TAG_SYSTEM_ENDPOINTS = "System"


class SystemController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @check_right(is_user)
    @hapic.output_body(ApplicationSchema(many=True))
    def applications(self, context, request: TracimRequest, hapic_data=None):
        """
        Get list of alls applications installed in this tracim instance.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        app_api = ApplicationApi(app_list=app_list)
        applications_in_context = [
            app_api.get_application_in_context(app, app_config) for app in app_api.get_all()
        ]
        return applications_in_context

    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @check_right(is_user)
    @hapic.output_body(ContentTypeSchema(many=True))
    def content_types(self, context, request: TracimRequest, hapic_data=None):
        """
        Get list of alls content types availables in this tracim instance.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        content_types_slugs = content_type_list.endpoint_allowed_types_slug()
        content_types = [content_type_list.get_one_by_slug(slug) for slug in content_types_slugs]
        content_types_in_context = [
            content_type_list.get_content_type_in_context(content_type, app_config)
            for content_type in content_types
        ]
        return content_types_in_context

    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @check_right(is_user)
    @hapic.output_body(WorkspaceAccessTypeSchema())
    def workspace_access_types(self, context, request: TracimRequest, hapic_data=None):
        """
        Get List of allowed workspace access types
        """
        return {
            "items": [
                access_type.value
                for access_type in request.app_config.WORKSPACE__ALLOWED_ACCESS_TYPES
            ]
        }

    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @check_right(is_user)
    @hapic.output_body(TimezoneSchema(many=True))
    def timezones_list(self, context, request: TracimRequest, hapic_data=None):
        """
        Get List of timezones
        """
        return get_timezones_list()

    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_query(GetUsernameAvailability())
    @hapic.output_body(UsernameAvailability())
    def username_availability(self, context, request: TracimRequest, hapic_data: HapicData) -> dict:
        """
        Return availability for each given username
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        system_api = SystemApi(app_config, request.dbsession)
        return {
            "username": hapic_data.query["username"],
            "available": system_api.get_username_availability(hapic_data.query["username"]),
        }

    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @check_right(is_user)
    @hapic.output_body(ReservedUsernamesSchema())
    def reserved_usernames(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.Dict[str, typing.List[str]]:
        """Return the list of reserved usernames (used for group mentions)."""
        app_config = request.registry.settings["CFG"]  # type: CFG
        system_api = SystemApi(app_config, request.dbsession)
        return {"items": system_api.get_reserved_usernames()}

    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @check_right(is_user)
    @hapic.output_body(AboutSchema())
    def about(self, context, request: TracimRequest, hapic_data=None):
        """
        Returns information about current tracim instance.
        This is the equivalent of classical "help > about" menu in classical software.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        system_api = SystemApi(app_config, request.dbsession)
        return system_api.get_about()

    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @hapic.output_body(ConfigSchema())
    def config(self, context, request: TracimRequest, hapic_data=None):
        """
        Returns configuration information required for frontend.
        At the moment it only returns if email notifications are activated.
        """
        # FIXME - G.M - 2018-12-14 - [config_unauthenticated] #1270
        # do not allow unauthenticated user to
        # get all config info
        app_config = request.registry.settings["CFG"]  # type: CFG
        system_api = SystemApi(app_config, request.dbsession)
        return system_api.get_config()

    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @check_right(is_user)
    @hapic.output_body(UserCustomPropertiesSchema())
    def user_custom_properties_schema(self, context, request: TracimRequest, hapic_data=None):
        """
        Returns user custom properties JSONSchema
        """
        system_api = SystemApi(request.app_config, request.dbsession)
        return system_api.get_user_custom_properties_schema()

    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @check_right(is_user)
    @hapic.output_body(UserCustomPropertiesUiSchema())
    def custom_user_properties_ui_schema(self, context, request: TracimRequest, hapic_data=None):
        """
        Returns user custom properties JSONSchema
        """
        system_api = SystemApi(request.app_config, request.dbsession)
        return system_api.get_user_custom_properties_ui_schema()

    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @hapic.output_body(ErrorCodeSchema(many=True))
    def error_codes(self, context, request: TracimRequest, hapic_data=None):
        app_config = request.registry.settings["CFG"]  # type: CFG
        system_api = SystemApi(app_config, request.dbsession)
        return system_api.get_error_codes()

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # About
        configurator.add_route("about", "/system/about", request_method="GET")
        configurator.add_view(self.about, route_name="about")

        # Config
        configurator.add_route("config", "/system/config", request_method="GET")
        configurator.add_view(self.config, route_name="config")

        # Errors codes
        configurator.add_route("error_codes", "/system/error_codes", request_method="GET")
        configurator.add_view(self.error_codes, route_name="error_codes")

        # Applications
        configurator.add_route("applications", "/system/applications", request_method="GET")
        configurator.add_view(self.applications, route_name="applications")

        # Content_types
        configurator.add_route("content_types", "/system/content_types", request_method="GET")
        configurator.add_view(self.content_types, route_name="content_types")

        # Allowed Workspace access types
        configurator.add_route(
            "workspace_access_type", "/system/workspace_access_types", request_method="GET"
        )
        configurator.add_view(self.workspace_access_types, route_name="workspace_access_type")

        # Timezones
        configurator.add_route("timezones_list", "/system/timezones", request_method="GET")
        configurator.add_view(self.timezones_list, route_name="timezones_list")

        # username availability
        configurator.add_route(
            "username_availability", "/system/username-availability", request_method="GET"
        )
        configurator.add_view(self.username_availability, route_name="username_availability")

        # user custom-properties schema
        configurator.add_route(
            "user_custom_properties_schema",
            "/system/user-custom-properties-schema",
            request_method="GET",
        )
        configurator.add_view(
            self.user_custom_properties_schema, route_name="user_custom_properties_schema"
        )
        configurator.add_route(
            "user_custom_properties_ui_schema",
            "/system/user-custom-properties-ui-schema",
            request_method="GET",
        )
        configurator.add_view(
            self.custom_user_properties_ui_schema, route_name="user_custom_properties_ui_schema"
        )

        # reserved usernames
        configurator.add_route(
            "reserved_usernames", "/system/reserved-usernames", request_method="GET"
        )
        configurator.add_view(self.reserved_usernames, route_name="reserved_usernames")

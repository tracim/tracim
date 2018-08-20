# coding=utf-8
from pyramid.config import Configurator
from tracim_backend.exceptions import NotAuthenticated
from tracim_backend.exceptions import InsufficientUserProfile
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.utils.authorization import require_profile
from tracim_backend.models import Group
from tracim_backend.app_models.contents import CONTENT_TYPES

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.extensions import hapic
from tracim_backend.extensions import app_list
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import ApplicationSchema
from tracim_backend.views.core_api.schemas import ContentTypeSchema

SWAGGER_TAG_SYSTEM_ENDPOINTS = 'System'


class SystemController(Controller):

    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.output_body(ApplicationSchema(many=True),)
    def applications(self, context, request: TracimRequest, hapic_data=None):
        """
        Get list of alls applications installed in this tracim instance.
        """
        app_config = request.registry.settings['CFG']
        app_api = ApplicationApi(
            app_list=app_list,
        )
        return app_api.get_all()

    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.output_body(ContentTypeSchema(many=True),)
    def content_types(self, context, request: TracimRequest, hapic_data=None):
        """
        Get list of alls content types availables in this tracim instance.
        """
        content_types_slugs = CONTENT_TYPES.endpoint_allowed_types_slug()
        content_types = [CONTENT_TYPES.get_one_by_slug(slug) for slug in content_types_slugs]
        return content_types

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # Applications
        configurator.add_route('applications', '/system/applications', request_method='GET')  # nopep8
        configurator.add_view(self.applications, route_name='applications')

        # Content_types
        configurator.add_route('content_types', '/system/content_types', request_method='GET')  # nopep8
        configurator.add_view(self.content_types, route_name='content_types')



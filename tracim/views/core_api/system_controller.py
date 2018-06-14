# coding=utf-8
from pyramid.config import Configurator

from tracim.exceptions import NotAuthenticated, InsufficientUserProfile
from tracim.lib.utils.authorization import require_profile
from tracim.models import Group
from tracim.models.applications import applications

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import TracimRequest
from tracim.extensions import hapic
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import ApplicationSchema


class SystemController(Controller):

    @hapic.with_api_doc()
    @hapic.handle_exception(NotAuthenticated, HTTPStatus.UNAUTHORIZED)
    @hapic.handle_exception(InsufficientUserProfile, HTTPStatus.FORBIDDEN)
    @require_profile(Group.TIM_USER)
    @hapic.output_body(ApplicationSchema(many=True),)
    def applications(self, context, request: TracimRequest, hapic_data=None):
        """
        Get list of alls applications installed in this tracim instance.
        """
        return applications

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # Applications
        configurator.add_route('applications', '/system/applications', request_method='GET')  # nopep8
        configurator.add_view(self.applications, route_name='applications')


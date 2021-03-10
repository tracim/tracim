# coding=utf-8

import typing

from pyramid.config import Configurator

from tracim_backend.exceptions import ReactionAlreadyExistError
from tracim_backend.exceptions import UserNotMemberOfWorkspace
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.reaction import ReactionLib
from tracim_backend.lib.utils.authorization import can_delete_reaction
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.reaction import Reaction
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import ReactionPathSchema
from tracim_backend.views.core_api.schemas import ReactionSchema
from tracim_backend.views.core_api.schemas import SetReactionSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


SWAGGER_TAG__CONTENT_REACTION_SECTION = "Reactions"
SWAGGER_TAG__CONTENT_REACTION_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__CONTENT_REACTION_SECTION
)
CONTENT_TYPE_TEXT_HTML = "text/html"


class ReactionController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_REACTION_ENDPOINTS])
    @check_right(is_reader)
    @hapic.input_path(ReactionPathSchema())
    @hapic.output_body(ReactionSchema())
    def content_reaction(self, context, request: TracimRequest, hapic_data=None) -> Reaction:
        """
        Get one reaction related to a content
        """
        reaction_lib = ReactionLib(session=request.dbsession)
        return reaction_lib.get_one(
            content_id=request.current_content.content_id, reaction_id=hapic_data.path.reaction_id
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_REACTION_ENDPOINTS])
    @check_right(is_reader)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(ReactionSchema(many=True))
    def content_reactions(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[Reaction]:
        """
        Get all reactions related to a content in asc order (first is the oldest)
        """
        reaction_lib = ReactionLib(session=request.dbsession)
        return reaction_lib.get_all(content_id=request.current_content.content_id,)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_REACTION_ENDPOINTS])
    @hapic.handle_exception(UserNotMemberOfWorkspace, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ReactionAlreadyExistError, HTTPStatus.BAD_REQUEST)
    @check_right(is_contributor)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(SetReactionSchema())
    @hapic.output_body(ReactionSchema())
    def add_reaction(self, context, request: TracimRequest, hapic_data=None) -> Reaction:
        """
        Add new reaction
        """
        reaction_lib = ReactionLib(session=request.dbsession)
        return reaction_lib.create(
            request.current_user,
            request.current_content,
            value=hapic_data.body.value,
            do_save=True,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_REACTION_ENDPOINTS])
    @check_right(can_delete_reaction)
    @hapic.input_path(ReactionPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def delete_reaction(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Delete comment
        """
        reaction_lib = ReactionLib(session=request.dbsession)
        reaction = reaction_lib.get_one(
            content_id=request.current_content.content_id, reaction_id=hapic_data.path.reaction_id,
        )
        reaction_lib.delete(
            reaction=reaction, do_save=True,
        )

    def bind(self, configurator: Configurator):
        # Get reactions
        configurator.add_route(
            "content_reactions",
            "/workspaces/{workspace_id}/contents/{content_id}/reactions",
            request_method="GET",
        )
        configurator.add_view(self.content_reactions, route_name="content_reactions")

        configurator.add_route(
            "content_reaction",
            "/workspaces/{workspace_id}/contents/{content_id}/reactions/{reaction_id}",
            request_method="GET",
        )
        configurator.add_view(self.content_reaction, route_name="content_reaction")

        # Add reaction
        configurator.add_route(
            "add_reaction",
            "/workspaces/{workspace_id}/contents/{content_id}/reactions",
            request_method="POST",
        )
        configurator.add_view(self.add_reaction, route_name="add_reaction")

        # delete reaction
        configurator.add_route(
            "delete_reaction",
            "/workspaces/{workspace_id}/contents/{content_id}/reactions/{reaction_id}",
            request_method="DELETE",
        )
        configurator.add_view(self.delete_reaction, route_name="delete_reaction")

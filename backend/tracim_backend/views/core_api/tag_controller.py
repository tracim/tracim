# coding=utf-8

import typing

from pyramid.config import Configurator

from tracim_backend.exceptions import TagAlreadyExistsError
from tracim_backend.exceptions import TagNotFound
from tracim_backend.exceptions import UserNotMemberOfWorkspace
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.tag import TagLib
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.tag import Tag
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import ContentTagPathSchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import SetTagByNameSchema
from tracim_backend.views.core_api.schemas import TagPathSchema
from tracim_backend.views.core_api.schemas import TagSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


SWAGGER_TAG__TAG_SECTION = "Tags"
SWAGGER_TAG__TAG_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__TAG_SECTION
)


class TagController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__TAG_ENDPOINTS])
    @check_right(is_reader)
    @hapic.handle_exception(TagNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.input_path(TagPathSchema())
    @hapic.output_body(TagSchema())
    def get_tag(self, context, request: TracimRequest, hapic_data=None) -> Tag:
        """
        Get one tag
        """
        tag_lib = TagLib(session=request.dbsession)
        return tag_lib.get_one(tag_id=hapic_data.path.tag_id)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__TAG_ENDPOINTS])
    @check_right(is_reader)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(TagSchema(many=True))
    def get_content_tags(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[Tag]:
        """
        Get all tags related to a content
        """
        tag_lib = TagLib(session=request.dbsession)
        return tag_lib.get_all(content_id=request.current_content.content_id)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__TAG_ENDPOINTS])
    @check_right(is_reader)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(TagSchema(many=True))
    def get_workspace_tags(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[Tag]:
        """
        Get all tags of a workspace
        """
        tag_lib = TagLib(session=request.dbsession)
        return tag_lib.get_all(workspace_id=request.current_workspace.workspace_id)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__TAG_ENDPOINTS])
    @hapic.handle_exception(UserNotMemberOfWorkspace, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(TagAlreadyExistsError, HTTPStatus.BAD_REQUEST)
    @check_right(is_contributor)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(SetTagByNameSchema())
    @hapic.output_body(TagSchema())
    def add_content_tag_by_name(self, context, request: TracimRequest, hapic_data=None) -> Tag:
        """
        Add new tag to content
        """
        tag_lib = TagLib(session=request.dbsession)
        return tag_lib.add_tag_to_content(
            user=request.current_user,
            content=request.current_content,
            tag_name=hapic_data.body.tag_name,
            do_save=True,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__TAG_ENDPOINTS])
    @hapic.handle_exception(UserNotMemberOfWorkspace, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(TagAlreadyExistsError, HTTPStatus.BAD_REQUEST)
    @check_right(is_contributor)
    @hapic.input_path(ContentTagPathSchema())
    @hapic.output_body(TagSchema())
    def add_content_tag_by_id(self, context, request: TracimRequest, hapic_data=None) -> Tag:
        """
        Add new tag to content
        """
        tag_lib = TagLib(session=request.dbsession)
        return tag_lib.add_tag_to_content(
            user=request.current_user,
            content=request.current_content,
            tag_id=hapic_data.path.tag_id,
            do_save=True,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__TAG_ENDPOINTS])
    @hapic.handle_exception(UserNotMemberOfWorkspace, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(TagAlreadyExistsError, HTTPStatus.BAD_REQUEST)
    @check_right(is_contributor)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_body(SetTagByNameSchema())
    @hapic.output_body(TagSchema())
    def add_workspace_tag(self, context, request: TracimRequest, hapic_data=None) -> Tag:
        """
        Add new tag to a workspace
        """
        tag_lib = TagLib(session=request.dbsession)
        return tag_lib.add(
            user=request.current_user,
            workspace=request.current_workspace,
            tag_name=hapic_data.body.tag_name,
            do_save=True,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__TAG_ENDPOINTS])
    @check_right(is_contributor)
    @hapic.input_path(TagPathSchema())
    @hapic.handle_exception(TagNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def delete_workspace_tag(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Delete a tag associated to a content
        """
        tag_lib = TagLib(session=request.dbsession)
        tag = tag_lib.get_one(tag_id=hapic_data.path.tag_id)
        tag_lib.delete(tag=tag, do_save=True)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__TAG_ENDPOINTS])
    @check_right(is_contributor)
    @hapic.input_path(ContentTagPathSchema())
    @hapic.handle_exception(TagNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def delete_content_tag(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Delete a tag associated to a content
        """
        tag_lib = TagLib(session=request.dbsession)
        tag_lib.delete_from_content(
            content=request.current_content, tag_id=hapic_data.path.tag_id, do_save=True
        )

    def bind(self, configurator: Configurator):
        # Get tags
        configurator.add_route(
            "get_workspace_tags", "/workspaces/{workspace_id}/tags", request_method="GET"
        )
        configurator.add_view(self.get_workspace_tags, route_name="get_workspace_tags")

        # Get tags of a content
        configurator.add_route(
            "get_content_tags",
            "/workspaces/{workspace_id}/contents/{content_id}/tags",
            request_method="GET",
        )
        configurator.add_view(self.get_content_tags, route_name="get_content_tags")

        # Get a tag
        configurator.add_route(
            "get_tag", "/workspaces/{workspace_id}/tags/{tag_id}", request_method="GET",
        )
        configurator.add_view(self.get_tag, route_name="get_tag")

        # Add a tag to a workspace
        configurator.add_route(
            "add_workspace_tag", "/workspaces/{workspace_id}/tags", request_method="POST",
        )
        configurator.add_view(self.add_workspace_tag, route_name="add_workspace_tag")

        # Add a tag to a content
        configurator.add_route(
            "add_content_tag_by_name",
            "/workspaces/{workspace_id}/contents/{content_id}/tags",
            request_method="POST",
        )
        configurator.add_view(self.add_content_tag_by_name, route_name="add_content_tag_by_name")

        # Put a tag to a content
        configurator.add_route(
            "add_content_tag_by_id",
            "/workspaces/{workspace_id}/contents/{content_id}/tags/{tag_id}",
            request_method="PUT",
        )
        configurator.add_view(self.add_content_tag_by_id, route_name="add_content_tag_by_id")

        # delete a tag from a workspace
        configurator.add_route(
            "delete_workspace_tag",
            "/workspaces/{workspace_id}/tags/{tag_id}",
            request_method="DELETE",
        )
        configurator.add_view(self.delete_workspace_tag, route_name="delete_workspace_tag")

        # delete a tag from a content
        configurator.add_route(
            "delete_content_tag",
            "/workspaces/{workspace_id}/contents/{content_id}/tags/{tag_id}",
            request_method="DELETE",
        )
        configurator.add_view(self.delete_content_tag, route_name="delete_content_tag")

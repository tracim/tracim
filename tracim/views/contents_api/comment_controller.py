# coding=utf-8
import transaction
from pyramid.config import Configurator

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import TracimRequest
from tracim.extensions import hapic
from tracim.lib.core.content import ContentApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.lib.utils.authorization import require_workspace_role
from tracim.lib.utils.authorization import require_comment_ownership_or_role
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import CommentSchema
from tracim.views.core_api.schemas import CommentsPathSchema
from tracim.views.core_api.schemas import SetCommentSchema
from tracim.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim.views.core_api.schemas import NoContentSchema
from tracim.exceptions import WorkspaceNotFound, EmptyRawContentNotAllowed
from tracim.exceptions import InsufficientUserRoleInWorkspace
from tracim.exceptions import NotAuthenticated
from tracim.exceptions import AuthenticationFailed
from tracim.models.contents import ContentTypeLegacy as ContentType
from tracim.models.revision_protection import new_revision
from tracim.models.data import UserRoleInWorkspace

COMMENT_ENDPOINTS_TAG = 'Comments'


class CommentController(Controller):

    @hapic.with_api_doc(tags=[COMMENT_ENDPOINTS_TAG])
    @require_workspace_role(UserRoleInWorkspace.READER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(CommentSchema(many=True))
    def content_comments(self, context, request: TracimRequest, hapic_data=None):
        """
        Get all comments related to a content in asc order (first is the oldest)
        """

        # login = hapic_data.body
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(
            hapic_data.path.content_id,
            content_type=ContentType.Any
        )
        comments = content.get_comments()
        comments.sort(key=lambda comment: comment.created)
        return [api.get_content_in_context(comment)
                for comment in comments
        ]

    @hapic.with_api_doc(tags=[COMMENT_ENDPOINTS_TAG])
    @hapic.handle_exception(EmptyRawContentNotAllowed, HTTPStatus.BAD_REQUEST)
    @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(SetCommentSchema())
    @hapic.output_body(CommentSchema())
    def add_comment(self, context, request: TracimRequest, hapic_data=None):
        """
        Add new comment
        """
        # login = hapic_data.body
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(
            hapic_data.path.content_id,
            content_type=ContentType.Any
        )
        comment = api.create_comment(
            content.workspace,
            content,
            hapic_data.body.raw_content,
            do_save=True,
        )
        return api.get_content_in_context(comment)

    @hapic.with_api_doc(tags=[COMMENT_ENDPOINTS_TAG])
    @require_comment_ownership_or_role(
        minimal_required_role_for_anyone=UserRoleInWorkspace.WORKSPACE_MANAGER,
        minimal_required_role_for_owner=UserRoleInWorkspace.CONTRIBUTOR,
    )
    @hapic.input_path(CommentsPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def delete_comment(self, context, request: TracimRequest, hapic_data=None):
        """
        Delete comment
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        wapi = WorkspaceApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        workspace = wapi.get_one(hapic_data.path.workspace_id)
        parent = api.get_one(
            hapic_data.path.content_id,
            content_type=ContentType.Any,
            workspace=workspace
        )
        comment = api.get_one(
            hapic_data.path.comment_id,
            content_type=ContentType.Comment,
            workspace=workspace,
            parent=parent,
        )
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=comment
        ):
            api.delete(comment)
        return

    def bind(self, configurator: Configurator):
        # Get comments
        configurator.add_route(
            'content_comments',
            '/workspaces/{workspace_id}/contents/{content_id}/comments',
            request_method='GET'
        )
        configurator.add_view(self.content_comments, route_name='content_comments')

        # Add comments
        configurator.add_route(
            'add_comment',
            '/workspaces/{workspace_id}/contents/{content_id}/comments',
            request_method='POST'
        )  # nopep8
        configurator.add_view(self.add_comment, route_name='add_comment')

        # delete comments
        configurator.add_route(
            'delete_comment',
            '/workspaces/{workspace_id}/contents/{content_id}/comments/{comment_id}',  # nopep8
            request_method='DELETE'
        )
        configurator.add_view(self.delete_comment, route_name='delete_comment')

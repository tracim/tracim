# coding=utf-8
import typing

import transaction
from pyramid.config import Configurator

from tracim_backend.app_models.contents import THREAD_TYPE
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.exceptions import ContentFilenameAlreadyUsedInFolder
from tracim_backend.exceptions import EmptyLabelNotAllowed
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import require_content_types
from tracim_backend.lib.utils.authorization import require_workspace_role
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import RevisionInContext
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import SetContentStatusSchema
from tracim_backend.views.core_api.schemas import TextBasedContentModifySchema
from tracim_backend.views.core_api.schemas import TextBasedContentSchema
from tracim_backend.views.core_api.schemas import TextBasedRevisionSchema
from tracim_backend.views.core_api.schemas import \
    WorkspaceAndContentIdPathSchema
from tracim_backend.views.swagger_generic_section import \
    SWAGGER_TAG__CONTENT_ENDPOINTS

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


SWAGGER_TAG__CONTENT_THREAD_SECTION = 'Threads'
SWAGGER_TAG__CONTENT_THREAD_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS,
    SWAGGER_TAG__CONTENT_THREAD_SECTION
)


class ThreadController(Controller):

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_THREAD_ENDPOINTS])
    @require_workspace_role(UserRoleInWorkspace.READER)
    @require_content_types([THREAD_TYPE])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(TextBasedContentSchema())
    def get_thread(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:  # nopep8
        """
        Get thread content
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(
            hapic_data.path.content_id,
            content_type=content_type_list.Any_SLUG
        )
        return api.get_content_in_context(content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_THREAD_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ContentFilenameAlreadyUsedInFolder, HTTPStatus.BAD_REQUEST)
    @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    @require_content_types([THREAD_TYPE])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(TextBasedContentModifySchema())
    @hapic.output_body(TextBasedContentSchema())
    def update_thread(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:  # nopep8
        """
        update thread
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(
            hapic_data.path.content_id,
            content_type=content_type_list.Any_SLUG
        )
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.update_content(
                item=content,
                new_label=hapic_data.body.label,
                new_content=hapic_data.body.raw_content,

            )
            api.save(content)
        return api.get_content_in_context(content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_THREAD_ENDPOINTS])
    @require_workspace_role(UserRoleInWorkspace.READER)
    @require_content_types([THREAD_TYPE])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(TextBasedRevisionSchema(many=True))
    def get_thread_revisions(
            self,
            context,
            request: TracimRequest,
            hapic_data=None
    ) -> typing.List[RevisionInContext]:
        """
        get thread revisions
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(
            hapic_data.path.content_id,
            content_type=content_type_list.Any_SLUG
        )
        revisions = content.revisions
        return [
            api.get_revision_in_context(revision)
            for revision in revisions
        ]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_THREAD_ENDPOINTS])
    @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    @require_content_types([THREAD_TYPE])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(SetContentStatusSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_thread_status(self, context, request: TracimRequest, hapic_data=None) -> None:  # nopep8
        """
        set thread status
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(
            hapic_data.path.content_id,
            content_type=content_type_list.Any_SLUG
        )
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.set_status(
                content,
                hapic_data.body.status,
            )
            api.save(content)
        return

    def bind(self, configurator: Configurator) -> None:
        # Get thread
        configurator.add_route(
            'thread',
            '/workspaces/{workspace_id}/threads/{content_id}',
            request_method='GET'
        )
        configurator.add_view(self.get_thread, route_name='thread')  # nopep8

        # update thread
        configurator.add_route(
            'update_thread',
            '/workspaces/{workspace_id}/threads/{content_id}',
            request_method='PUT'
        )  # nopep8
        configurator.add_view(self.update_thread, route_name='update_thread')  # nopep8

        # get thread revisions
        configurator.add_route(
            'thread_revisions',
            '/workspaces/{workspace_id}/threads/{content_id}/revisions',  # nopep8
            request_method='GET'
        )
        configurator.add_view(self.get_thread_revisions, route_name='thread_revisions')  # nopep8

        # get thread revisions
        configurator.add_route(
            'set_thread_status',
            '/workspaces/{workspace_id}/threads/{content_id}/status',  # nopep8
            request_method='PUT'
        )
        configurator.add_view(self.set_thread_status, route_name='set_thread_status')  # nopep8

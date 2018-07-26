# coding=utf-8
import typing

import transaction
from pyramid.config import Configurator

from tracim.models.data import UserRoleInWorkspace

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import TracimRequest
from tracim.extensions import hapic
from tracim.lib.core.content import ContentApi
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import TextBasedContentSchema
from tracim.views.core_api.schemas import TextBasedRevisionSchema
from tracim.views.core_api.schemas import TextBasedContentModifySchema
from tracim.views.core_api.schemas import SetContentStatusSchema
from tracim.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim.views.core_api.schemas import NoContentSchema
from tracim.lib.utils.authorization import require_content_types
from tracim.lib.utils.authorization import require_workspace_role
from tracim.exceptions import EmptyLabelNotAllowed
from tracim.models.context_models import ContentInContext
from tracim.models.context_models import RevisionInContext
from tracim.models.contents import ContentTypeLegacy as ContentType
from tracim.models.contents import html_documents_type
from tracim.models.revision_protection import new_revision

HTML_DOCUMENT_ENDPOINTS_TAG = 'HTML documents'


class HTMLDocumentController(Controller):

    @hapic.with_api_doc(tags=[HTML_DOCUMENT_ENDPOINTS_TAG])
    @require_workspace_role(UserRoleInWorkspace.READER)
    @require_content_types([html_documents_type])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(TextBasedContentSchema())
    def get_html_document(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:  # nopep8
        """
        Get html document content
        """
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
        return api.get_content_in_context(content)

    @hapic.with_api_doc(tags=[HTML_DOCUMENT_ENDPOINTS_TAG])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    @require_content_types([html_documents_type])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(TextBasedContentModifySchema())
    @hapic.output_body(TextBasedContentSchema())
    def update_html_document(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:  # nopep8
        """
        update_html_document
        """
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

    @hapic.with_api_doc(tags=[HTML_DOCUMENT_ENDPOINTS_TAG])
    @require_workspace_role(UserRoleInWorkspace.READER)
    @require_content_types([html_documents_type])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(TextBasedRevisionSchema(many=True))
    def get_html_document_revisions(
            self,
            context,
            request: TracimRequest,
            hapic_data=None
    ) -> typing.List[RevisionInContext]:
        """
        get html_document revisions
        """
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
        revisions = content.revisions
        return [
            api.get_revision_in_context(revision)
            for revision in revisions
        ]

    @hapic.with_api_doc(tags=[HTML_DOCUMENT_ENDPOINTS_TAG])
    @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    @require_content_types([html_documents_type])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(SetContentStatusSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_html_document_status(
            self,
            context,
            request: TracimRequest,
            hapic_data=None
    ) -> None:
        """
        set html_document status
        """
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
        # Get html-document
        configurator.add_route(
            'html_document',
            '/workspaces/{workspace_id}/html-documents/{content_id}',
            request_method='GET'
        )
        configurator.add_view(self.get_html_document, route_name='html_document')  # nopep8

        # update html-document
        configurator.add_route(
            'update_html_document',
            '/workspaces/{workspace_id}/html-documents/{content_id}',
            request_method='PUT'
        )  # nopep8
        configurator.add_view(self.update_html_document, route_name='update_html_document')  # nopep8

        # get html document revisions
        configurator.add_route(
            'html_document_revisions',
            '/workspaces/{workspace_id}/html-documents/{content_id}/revisions',  # nopep8
            request_method='GET'
        )
        configurator.add_view(self.get_html_document_revisions, route_name='html_document_revisions')  # nopep8

        # get html document revisions
        configurator.add_route(
            'set_html_document_status',
            '/workspaces/{workspace_id}/html-documents/{content_id}/status',  # nopep8
            request_method='PUT'
        )
        configurator.add_view(self.set_html_document_status, route_name='set_html_document_status')  # nopep8

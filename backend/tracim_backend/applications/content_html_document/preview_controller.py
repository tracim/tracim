from pyramid.config import Configurator

from tracim_backend import TracimRequest
from tracim_backend import hapic
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.applications.content_html_document.controller import (
    SWAGGER_TAG__CONTENT_HTML_DOCUMENT_ENDPOINTS,
)
from tracim_backend.applications.content_html_document.controller import is_html_document_content
from tracim_backend.config import CFG
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import FilePathSchema
from tracim_backend.views.core_api.schemas import FileQuerySchema
from tracim_backend.views.core_api.schemas import FileRevisionPathSchema


class HTMLDocumentPreviewController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_HTML_DOCUMENT_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_html_document_content)
    @hapic.input_query(FileQuerySchema())
    @hapic.input_path(FilePathSchema())
    @hapic.output_file([])
    def full_pdf_preview(self, context, request: TracimRequest, hapic_data=None):
        """
        Obtain a full pdf preview (all page) of last revision of content.
        Good pratice for filename is filename is `{label}.pdf`.
        Default filename value is 'raw' (without file extension) or nothing.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(hapic_data.path.content_id, content_type=content_type_list.Any_SLUG)
        default_filename = "{label}.pdf".format(label=content.label)
        result = api.get_full_pdf_preview_from_html_raw_content(
            revision=content.revision,
            filename=hapic_data.path.filename,
            default_filename=default_filename,
            force_download=hapic_data.query.force_download,
        )
        return result

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_HTML_DOCUMENT_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_html_document_content)
    @hapic.input_path(FileRevisionPathSchema())
    @hapic.input_query(FileQuerySchema())
    @hapic.output_file([])
    def full_pdf_revision_preview(self, context, request: TracimRequest, hapic_data=None):
        """
        Obtain full pdf preview of a specific revision of content.
        Good pratice for filename is filename is `{label}_r{revision_id}.pdf`.
        Default filename value is 'raw' (without file extension) or nothing.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(hapic_data.path.content_id, content_type=content_type_list.Any_SLUG)
        revision = api.get_one_revision(revision_id=hapic_data.path.revision_id, content=content)
        default_filename = "{label}_r{revision_id}.pdf".format(
            revision_id=revision.revision_id, label=revision.label
        )
        return api.get_full_pdf_preview_from_html_raw_content(
            revision=revision,
            filename=hapic_data.path.filename,
            default_filename=default_filename,
            force_download=hapic_data.query.force_download,
        )

    def bind(self, configurator: Configurator) -> None:
        # get full pdf preview
        configurator.add_route(
            "full_pdf_preview_note",
            "/workspaces/{workspace_id}/html-documents/{content_id}/preview/pdf/full/{filename:[^/]*}",
            request_method="GET",
        )
        configurator.add_view(self.full_pdf_preview, route_name="full_pdf_preview_note")

        # get full pdf preview for revision
        configurator.add_route(
            "full_pdf_revision_preview_note",
            "/workspaces/{workspace_id}/html-documents/{content_id}/revisions/{revision_id}/preview/pdf/full/{filename:[^/]*}",
            request_method="GET",
        )
        configurator.add_view(
            self.full_pdf_revision_preview, route_name="full_pdf_revision_preview_note"
        )

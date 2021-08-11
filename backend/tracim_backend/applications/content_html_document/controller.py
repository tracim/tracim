# coding=utf-8
from io import BytesIO
import typing

from hapic.data import HapicFile
from pyramid.config import Configurator
import transaction

from tracim_backend.app_models.contents import HTML_DOCUMENTS_TYPE
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentFilenameAlreadyUsedInFolder
from tracim_backend.exceptions import ContentStatusException
from tracim_backend.exceptions import EmptyLabelNotAllowed
from tracim_backend.exceptions import UserNotMemberOfWorkspace
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.translate.providers import TranslationLib
from tracim_backend.lib.translate.translator import InvalidParametersForTranslationService
from tracim_backend.lib.translate.translator import TranslationServiceException
from tracim_backend.lib.utils.authorization import ContentTypeChecker
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.authorization import is_translation_service_enabled
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import PaginatedObject
from tracim_backend.models.context_models import RevisionInContext
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import BaseOptionalPaginatedQuerySchema
from tracim_backend.views.core_api.schemas import ContentModifySchema
from tracim_backend.views.core_api.schemas import ContentSchema
from tracim_backend.views.core_api.schemas import FilePathSchema
from tracim_backend.views.core_api.schemas import FileQuerySchema
from tracim_backend.views.core_api.schemas import FileRevisionPathSchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import RevisionPageSchema
from tracim_backend.views.core_api.schemas import RevisionSchema
from tracim_backend.views.core_api.schemas import SetContentStatusSchema
from tracim_backend.views.core_api.schemas import TranslationQuerySchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentRevisionIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


SWAGGER_TAG__CONTENT_HTML_DOCUMENT_SECTION = "HTML documents"
SWAGGER_TAG__CONTENT_HTML_DOCUMENT_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__CONTENT_HTML_DOCUMENT_SECTION
)
is_html_document_content = ContentTypeChecker([HTML_DOCUMENTS_TYPE])
CONTENT_TYPE_TEXT_HTML = "text/html"


class HTMLDocumentController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_HTML_DOCUMENT_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_html_document_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(ContentSchema())
    def get_html_document(
        self, context, request: TracimRequest, hapic_data=None
    ) -> ContentInContext:
        """
        Get html document content
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
        return api.get_content_in_context(content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_HTML_DOCUMENT_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_html_document_content)
    @hapic.input_query(FileQuerySchema())
    @hapic.input_path(FilePathSchema())
    @hapic.output_file([])
    def get_html_document_preview(
        self, context, request: TracimRequest, hapic_data=None
    ) -> HapicFile:
        """
           Download preview of html document
           Good pratice for filename is filename is `{label}{file_extension}` or `{filename}`.
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
        file = BytesIO(content.raw_content.encode("utf-8"))
        byte_size = len(file.getvalue())
        filename = hapic_data.path.filename
        # INFO - G.M - 2019-08-08 - use given filename in all case but none or
        # "raw", where filename returned will be original file one.
        if not filename or filename == "raw":
            filename = content.file_name
        return HapicFile(
            file_object=file,
            mimetype=CONTENT_TYPE_TEXT_HTML,
            filename=filename,
            as_attachment=hapic_data.query.force_download,
            content_length=byte_size,
            last_modified=content.updated,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_HTML_DOCUMENT_ENDPOINTS])
    @hapic.handle_exception(TranslationServiceException, HTTPStatus.BAD_GATEWAY)
    @hapic.handle_exception(InvalidParametersForTranslationService, HTTPStatus.BAD_REQUEST)
    @check_right(is_reader)
    @check_right(is_translation_service_enabled)
    @hapic.input_path(FilePathSchema())
    @hapic.input_query(TranslationQuerySchema())
    @hapic.output_file([])
    def get_html_document_translation(self, context, request: TracimRequest, hapic_data=None):
        """
        Translate a html-document
        """
        translation_lib = TranslationLib(
            config=request.app_config, current_user=request.current_user, session=request.dbsession
        )
        content_id = hapic_data.path.content_id
        return translation_lib.translate_raw_content(
            content_id=content_id,
            source_language_code=hapic_data.query.source_language_code,
            target_language_code=hapic_data.query.target_language_code,
            force_download=hapic_data.query.force_download,
            mimetype=CONTENT_TYPE_TEXT_HTML,
            filename=hapic_data.path.filename,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_HTML_DOCUMENT_ENDPOINTS])
    @hapic.handle_exception(TranslationServiceException, HTTPStatus.BAD_GATEWAY)
    @hapic.handle_exception(InvalidParametersForTranslationService, HTTPStatus.BAD_REQUEST)
    @check_right(is_reader)
    @check_right(is_translation_service_enabled)
    @hapic.input_path(FileRevisionPathSchema())
    @hapic.input_query(TranslationQuerySchema())
    @hapic.output_file([])
    def get_html_document_revision_translation(
        self, context, request: TracimRequest, hapic_data=None
    ):
        """
        Translate a html-document
        """
        translation_lib = TranslationLib(
            config=request.app_config, current_user=request.current_user, session=request.dbsession
        )
        content_id = hapic_data.path.content_id
        return translation_lib.translate_raw_content(
            content_id=content_id,
            revision_id=hapic_data.path.revision_id,
            source_language_code=hapic_data.query.source_language_code,
            target_language_code=hapic_data.query.target_language_code,
            force_download=hapic_data.query.force_download,
            mimetype=CONTENT_TYPE_TEXT_HTML,
            filename=hapic_data.path.filename,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_HTML_DOCUMENT_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ContentFilenameAlreadyUsedInFolder, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UserNotMemberOfWorkspace, HTTPStatus.BAD_REQUEST)
    @check_right(is_contributor)
    @check_right(is_html_document_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(ContentModifySchema())
    @hapic.output_body(ContentSchema())
    def update_html_document(
        self, context, request: TracimRequest, hapic_data=None
    ) -> ContentInContext:
        """
        update_html_document
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
        with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
            api.update_content(
                item=content,
                new_label=hapic_data.body.label,
                new_raw_content=hapic_data.body.raw_content,
                new_description=hapic_data.body.description,
            )
            api.save(content)
        return api.get_content_in_context(content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_HTML_DOCUMENT_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_html_document_content)
    @hapic.input_path(WorkspaceAndContentRevisionIdPathSchema())
    @hapic.output_body(RevisionSchema())
    def get_html_document_revision(
        self, context, request: TracimRequest, hapic_data=None
    ) -> RevisionInContext:
        """
        get one html_document revision
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
        return api.get_revision_in_context(revision)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_HTML_DOCUMENT_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_html_document_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_query(BaseOptionalPaginatedQuerySchema())
    @hapic.output_body(RevisionPageSchema())
    def get_html_document_revisions(
        self, context, request: TracimRequest, hapic_data=None
    ) -> PaginatedObject:
        """
        get html_document revisions
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
        revisions_page = content.get_revisions(
            page_token=hapic_data.query["page_token"], count=hapic_data.query["count"]
        )
        revisions = [api.get_revision_in_context(revision) for revision in revisions_page]
        return PaginatedObject(revisions_page, revisions)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_HTML_DOCUMENT_ENDPOINTS])
    @check_right(is_contributor)
    @check_right(is_html_document_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(SetContentStatusSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    @hapic.handle_exception(ContentStatusException, HTTPStatus.BAD_REQUEST)
    def set_html_document_status(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        set html_document status
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
        if content.status == request.json_body.get("status"):
            raise ContentStatusException(
                "Content id {} already have status {}".format(content.content_id, content.status)
            )
        with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
            api.set_status(content, hapic_data.body.status)
            api.save(content)
        return

    def bind(self, configurator: Configurator) -> None:
        # Get html-document
        configurator.add_route(
            "html_document",
            "/workspaces/{workspace_id}/html-documents/{content_id}",
            request_method="GET",
        )
        configurator.add_view(self.get_html_document, route_name="html_document")

        # get html-document preview
        configurator.add_route(
            "preview_html",
            "/workspaces/{workspace_id}/html-documents/{content_id}/preview/html/{filename:[^/]*}",
            request_method="GET",
        )
        configurator.add_view(self.get_html_document_preview, route_name="preview_html")

        # update html-document
        configurator.add_route(
            "update_html_document",
            "/workspaces/{workspace_id}/html-documents/{content_id}",
            request_method="PUT",
        )
        configurator.add_view(self.update_html_document, route_name="update_html_document")

        # get one html document revision
        configurator.add_route(
            "html_document_revision",
            "/workspaces/{workspace_id}/html-documents/{content_id}/revisions/{revision_id}",
            request_method="GET",
        )
        configurator.add_view(self.get_html_document_revision, route_name="html_document_revision")

        # get html document revisions
        configurator.add_route(
            "html_document_revisions",
            "/workspaces/{workspace_id}/html-documents/{content_id}/revisions",
            request_method="GET",
        )
        configurator.add_view(
            self.get_html_document_revisions, route_name="html_document_revisions"
        )

        # get html document revisions
        configurator.add_route(
            "set_html_document_status",
            "/workspaces/{workspace_id}/html-documents/{content_id}/status",
            request_method="PUT",
        )
        configurator.add_view(self.set_html_document_status, route_name="set_html_document_status")

        # get content translation
        configurator.add_route(
            "html_document_translation",
            "/workspaces/{workspace_id}/html-documents/{content_id}/translated/{filename:[^/]*}",
            request_method="GET",
        )
        configurator.add_view(
            self.get_html_document_translation, route_name="html_document_translation"
        )
        # get revision translation
        configurator.add_route(
            "html_document_revision_translation",
            "/workspaces/{workspace_id}/html-documents/{content_id}/revisions/{revision_id}/translated/{filename:[^/]*}",
            request_method="GET",
        )
        configurator.add_view(
            self.get_html_document_revision_translation,
            route_name="html_document_revision_translation",
        )

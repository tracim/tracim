# coding=utf-8
from http import HTTPStatus
from io import BytesIO

from hapic.data import HapicFile
from pyramid.config import Configurator
import transaction

from tracim_backend.app_models.contents import THREAD_TYPE
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentFilenameAlreadyUsedInFolder
from tracim_backend.exceptions import ContentStatusException
from tracim_backend.exceptions import EmptyLabelNotAllowed
from tracim_backend.exceptions import UnavailablePreview
from tracim_backend.exceptions import UserNotMemberOfWorkspace
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import ContentTypeChecker
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import PaginatedObject
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import ContentModifySchema
from tracim_backend.views.core_api.schemas import ContentRevisionsPageQuerySchema
from tracim_backend.views.core_api.schemas import ContentSchema
from tracim_backend.views.core_api.schemas import FilePathSchema
from tracim_backend.views.core_api.schemas import FileQuerySchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import RevisionPageSchema
from tracim_backend.views.core_api.schemas import SetContentStatusSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

SWAGGER_TAG__CONTENT_THREAD_SECTION = "Threads"
SWAGGER_TAG__CONTENT_THREAD_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__CONTENT_THREAD_SECTION
)
is_thread_content = ContentTypeChecker([THREAD_TYPE])
CONTENT_TYPE_TEXT_HTML = "text/html"


class ThreadController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_THREAD_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_thread_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(ContentSchema())
    def get_thread(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:
        """
        Get thread content
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_THREAD_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_thread_content)
    @hapic.handle_exception(UnavailablePreview, HTTPStatus.BAD_REQUEST)
    @hapic.input_query(FileQuerySchema())
    @hapic.input_path(FilePathSchema())
    @hapic.output_file([])
    def get_thread_preview(self, context, request: TracimRequest, hapic_data=None) -> HapicFile:
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
        first_comment = content.get_first_comment()
        if not first_comment:
            raise UnavailablePreview(
                'No preview available for thread of content id "{}"'.format(content.content_id)
            )
        file = BytesIO(first_comment.raw_content.encode("utf-8"))
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
            last_modified=first_comment.updated,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_THREAD_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ContentFilenameAlreadyUsedInFolder, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UserNotMemberOfWorkspace, HTTPStatus.BAD_REQUEST)
    @check_right(is_contributor)
    @check_right(is_thread_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(ContentModifySchema())
    @hapic.output_body(ContentSchema())
    def update_thread(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:
        """
        update thread
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_THREAD_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_thread_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_query(ContentRevisionsPageQuerySchema())
    @hapic.output_body(RevisionPageSchema())
    def get_thread_revisions(
        self, context, request: TracimRequest, hapic_data=None
    ) -> PaginatedObject:
        """
        get thread revisions
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
            page_token=hapic_data.query["page_token"],
            count=hapic_data.query["count"],
            sort_order=hapic_data.query["sort"],
        )
        revisions = [
            api.get_revision_in_context(revision, number) for revision, number in revisions_page
        ]
        return PaginatedObject(revisions_page, revisions)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_THREAD_ENDPOINTS])
    @check_right(is_contributor)
    @check_right(is_thread_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(SetContentStatusSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    @hapic.handle_exception(ContentStatusException, HTTPStatus.BAD_REQUEST)
    def set_thread_status(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        set thread status
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
        # Get thread
        configurator.add_route(
            "thread", "/workspaces/{workspace_id}/threads/{content_id}", request_method="GET"
        )
        configurator.add_view(self.get_thread, route_name="thread")

        # get thread preview
        configurator.add_route(
            "preview_thread",
            "/workspaces/{workspace_id}/threads/{content_id}/preview/html/{filename:[^/]*}",
            request_method="GET",
        )
        configurator.add_view(self.get_thread_preview, route_name="preview_thread")

        # update thread
        configurator.add_route(
            "update_thread", "/workspaces/{workspace_id}/threads/{content_id}", request_method="PUT"
        )
        configurator.add_view(self.update_thread, route_name="update_thread")

        # get thread revisions
        configurator.add_route(
            "thread_revisions",
            "/workspaces/{workspace_id}/threads/{content_id}/revisions",
            request_method="GET",
        )
        configurator.add_view(self.get_thread_revisions, route_name="thread_revisions")

        # get thread revisions
        configurator.add_route(
            "set_thread_status",
            "/workspaces/{workspace_id}/threads/{content_id}/status",
            request_method="PUT",
        )
        configurator.add_view(self.set_thread_status, route_name="set_thread_status")

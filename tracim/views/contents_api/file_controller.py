# coding=utf-8
import typing

import transaction
from pyramid.config import Configurator

from tracim.exceptions import EmptyLabelNotAllowed
from tracim.models.data import UserRoleInWorkspace

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import TracimRequest
from tracim.extensions import hapic
from tracim.lib.core.content import ContentApi
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import FileContentSchema
from tracim.views.core_api.schemas import FileRevisionSchema
from tracim.views.core_api.schemas import SetContentStatusSchema
from tracim.views.core_api.schemas import FileContentModifySchema
from tracim.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim.views.core_api.schemas import NoContentSchema
from tracim.lib.utils.authorization import require_content_types
from tracim.lib.utils.authorization import require_workspace_role
from tracim.models.context_models import ContentInContext
from tracim.models.context_models import RevisionInContext
from tracim.models.contents import ContentTypeLegacy as ContentType
from tracim.models.contents import file_type
from tracim.models.revision_protection import new_revision

FILE_ENDPOINTS_TAG = 'Files'


class FileController(Controller):

    # # File data
    # @hapic.with_api_doc(tags=[FILE_ENDPOINTS_TAG])
    # @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    # @require_content_types([file_type])
    # @hapic.input_path(WorkspaceAndContentIdPathSchema())
    # #@hapic.input_files()
    # @hapic.output_file([])
    # def upload_file(self, context, request: TracimRequest, hapic_data=None):
    #     # TODO - G.M - 2018-07-05 - Do this endpoint
    #     app_config = request.registry.settings['CFG']
    #     api = ContentApi(
    #         current_user=request.current_user,
    #         session=request.dbsession,
    #         config=app_config,
    #     )
    #     content = api.get_one(
    #         hapic_data.path.content_id,
    #         content_type=ContentType.Any
    #     )
    #     file = request.POST['files']
    #     api.update_file_data(
    #         content,
    #         new_filename=file.filename,
    #         new_mimetype=file.type,
    #         new_content=file.file,
    #     )
    #     return content.depot_file
    #
    # @hapic.with_api_doc(tags=[FILE_ENDPOINTS_TAG])
    # @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    # @require_content_types([file_type])
    # @hapic.input_path(WorkspaceAndContentIdPathSchema())
    # @hapic.output_file([])
    # def download_file(self, context, request: TracimRequest, hapic_data=None):
    #     # TODO - G.M - 2018-07-05 - Do this endpoint
    #     app_config = request.registry.settings['CFG']
    #     api = ContentApi(
    #         current_user=request.current_user,
    #         session=request.dbsession,
    #         config=app_config,
    #     )
    #     content = api.get_one(
    #         hapic_data.path.content_id,
    #         content_type=ContentType.Any
    #     )
    #     return content.depot_file

    # Previews
    # def get_file_preview(self):
    #     # TODO - G.M - 2018-07-05 - Do this endpoint
    #     pass
    
    # File infos
    @hapic.with_api_doc(tags=[FILE_ENDPOINTS_TAG])
    @require_workspace_role(UserRoleInWorkspace.READER)
    @require_content_types([file_type])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(FileContentSchema())
    def get_file_infos(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:  # nopep8
        """
        Get thread content
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

    @hapic.with_api_doc(tags=[FILE_ENDPOINTS_TAG])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    @require_content_types([file_type])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(FileContentModifySchema())
    @hapic.output_body(FileContentSchema())
    def update_file_info(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:  # nopep8
        """
        update thread
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

    @hapic.with_api_doc(tags=[FILE_ENDPOINTS_TAG])
    @require_workspace_role(UserRoleInWorkspace.READER)
    @require_content_types([file_type])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(FileRevisionSchema(many=True))
    def get_file_revisions(
            self,
            context,
            request: TracimRequest,
            hapic_data=None
    ) -> typing.List[RevisionInContext]:
        """
        get file revisions
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

    @hapic.with_api_doc(tags=[FILE_ENDPOINTS_TAG])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    @require_content_types([file_type])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(SetContentStatusSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_file_status(self, context, request: TracimRequest, hapic_data=None) -> None:  # nopep8
        """
        set file status
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
        # Get file info
        configurator.add_route(
            'file_info',
            '/workspaces/{workspace_id}/files/{content_id}',
            request_method='GET'
        )
        configurator.add_view(self.get_file_infos, route_name='file_info')  # nopep8

        # update file
        configurator.add_route(
            'update_file_info',
            '/workspaces/{workspace_id}/files/{content_id}',
            request_method='PUT'
        )  # nopep8
        configurator.add_view(self.update_file_info, route_name='update_file_info')  # nopep8

        # # upload new file data
        # configurator.add_route(
        #     'upload_file',
        #     '/workspaces/{workspace_id}/files/{content_id}/file_data',  # nopep8
        #     request_method='PUT'
        # )
        # configurator.add_view(self.upload_file, route_name='upload_file')  # nopep8
        #
        # # download file data
        # configurator.add_route(
        #     'download_file',
        #     '/workspaces/{workspace_id}/files/{content_id}/file_data',  # nopep8
        #     request_method='GET'
        # )
        # configurator.add_view(self.download_file, route_name='download_file')  # nopep8
        # get file revisions
        configurator.add_route(
            'file_revisions',
            '/workspaces/{workspace_id}/files/{content_id}/revisions',  # nopep8
            request_method='GET'
        )
        configurator.add_view(self.get_file_revisions, route_name='file_revisions')  # nopep8

        # get file revisions
        configurator.add_route(
            'set_file_status',
            '/workspaces/{workspace_id}/files/{content_id}/status',  # nopep8
            request_method='PUT'
        )
        configurator.add_view(self.set_file_status, route_name='set_file_status')  # nopep8

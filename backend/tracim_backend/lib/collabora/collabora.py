import typing
import urllib
import urllib.parse

from defusedxml import ElementTree
import requests
from sqlalchemy.orm import Session

from tracim_backend import BASE_API_V2
from tracim_backend import CFG
from tracim_backend.lib.collabora.models import CollaboraEditableFileInfo
from tracim_backend.lib.collabora.models import CollaboraFileType
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import Workspace
from tracim_backend.views.collaborative_document_edition_api.wopi_api.wopi_controller import (
    WOPI_FILES,
)

COLLABORA_ACTION_EDIT = "edit"


class CollaboraApi(object):
    def __init__(self, current_user: typing.Optional[User], session: Session, config: CFG) -> None:
        self._session = session
        self._user = current_user
        self._config = config

    def discover(self) -> typing.List[CollaboraFileType]:
        response = requests.get(self._config.COLLABORA__BASE_URL + "/hosting/discovery")
        root = ElementTree.fromstring(response.text)
        supported_collabora_file = []  # type: typing.List[CollaboraFileType]
        for xml_app in root.findall("net-zone/app"):
            mimetype = xml_app.get("name")
            # INFO - G.M - 2019-07-17 - this list return also a non mimetype type,
            # we should not add him.
            if mimetype == "Capabilities":
                continue
            for xml_action in xml_app:
                extension = xml_action.get("ext")
                url_source = xml_action.get("urlsrc")
                associated_action = xml_action.get("name")
                supported_collabora_file.append(
                    CollaboraFileType(
                        mimetype=mimetype,
                        extension=extension,
                        associated_action=associated_action,
                        url_source=url_source,
                    )
                )
        return supported_collabora_file

    def _get_collabora_content_file_type(
        self, content: Content
    ) -> typing.Optional[CollaboraFileType]:
        for collabora_file_type in self.discover():
            if collabora_file_type.mimetype == content.file_mimetype:
                return collabora_file_type
        return None

    def _get_wopi_src(self, workspace: Workspace, content: Content) -> str:
        return "{backend_base_url}{api_base}{path}".format(
            backend_base_url=self._config.COLLABORA__BACKEND__BASE_URL,
            api_base=BASE_API_V2,
            path=WOPI_FILES.format(
                workspace_id=workspace.workspace_id, content_id=content.content_id
            ),
        )

    def _get_wopi_full_url(self, workspace: Workspace, content: Content) -> typing.Optional[str]:
        collabora_content_file_type = self._get_collabora_content_file_type(content)
        if not collabora_content_file_type:
            return None
        wopi_src = self._get_wopi_src(workspace, content)
        return "{collabora_content_file_type.url_source}{wopisrc_param}".format(
            collabora_content_file_type=collabora_content_file_type,
            wopisrc_param=urllib.parse.urlencode({"WOPISrc": wopi_src}),
        )

    def _is_collabora_editable(self, content) -> bool:
        collabora_content_file_type = self._get_collabora_content_file_type(content)
        return (
            collabora_content_file_type is not None
            and collabora_content_file_type.extension
            not in self._config.COLLABORA__EXTENSION_BLACKLIST
            and collabora_content_file_type.associated_action == COLLABORA_ACTION_EDIT
        )

    def edit_file_info(
        self, content: Content, workspace: Workspace, access_token: str
    ) -> CollaboraEditableFileInfo:
        return CollaboraEditableFileInfo(
            access_token=access_token,
            is_collabora_editable=self._is_collabora_editable(content),
            url_source=self._get_wopi_full_url(workspace=workspace, content=content),
            content_id=content.content_id,
            workspace_id=workspace.workspace_id,
        )

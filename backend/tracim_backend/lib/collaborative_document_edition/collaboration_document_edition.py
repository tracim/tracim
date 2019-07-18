import mimetypes
import os
from os.path import isfile
from os.path import join
import typing

from defusedxml import ElementTree
import requests
from sqlalchemy.orm import Session

from tracim_backend import CFG
from tracim_backend.exceptions import FileTemplateNotAvailable
from tracim_backend.exceptions import NotAFileError
from tracim_backend.exceptions import NotReadableFile
from tracim_backend.lib.collaborative_document_edition.models import CollaboraFileType
from tracim_backend.lib.collaborative_document_edition.models import (
    CollaborativeDocumentEditionToken,
)
from tracim_backend.lib.collaborative_document_edition.models import FileTemplate
from tracim_backend.lib.collaborative_document_edition.models import FileTemplateCategory
from tracim_backend.lib.collaborative_document_edition.models import FileTemplateInfo
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.utils import is_dir_exist
from tracim_backend.lib.utils.utils import is_dir_readable
from tracim_backend.lib.utils.utils import is_file_exist
from tracim_backend.lib.utils.utils import is_file_readable
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content


class CollaborativeDocumentEditionApi(object):
    def __init__(self, current_user: typing.Optional[User], session: Session, config: CFG) -> None:
        self._session = session
        self._user = current_user
        self._config = config

    def discover(self) -> typing.List[CollaboraFileType]:
        response = requests.get(
            self._config.COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL + "/hosting/discovery"
        )
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

    def get_template_info(self) -> FileTemplateInfo:
        all_template_category = [cat.value for cat in FileTemplateCategory]
        return FileTemplateInfo(
            categories=all_template_category, file_templates=self._get_template_list()
        )

    def _has_template_extension(self, template_name: str, extension_list: typing.List[str]):
        for extension in extension_list:
            if template_name.endswith(extension):
                return True
        return False

    def _get_template_list(self) -> typing.List[FileTemplate]:
        template_list = []
        try:
            is_dir_exist(self._config.FILE_TEMPLATE_DIR)
            is_dir_readable(self._config.FILE_TEMPLATE_DIR)
        except (NotADirectoryError) as exc:
            raise FileTemplateNotAvailable from exc
        for filename in os.listdir(self._config.FILE_TEMPLATE_DIR):
            if not isfile(join(self._config.FILE_TEMPLATE_DIR, filename)):
                continue
            if self._has_template_extension(filename, [".ods"]):
                template_list.append(FileTemplate(filename, category=FileTemplateCategory.calc))
            elif self._has_template_extension(filename, [".odp"]):
                template_list.append(FileTemplate(filename, category=FileTemplateCategory.pres))
            elif self._has_template_extension(filename, [".odt"]):
                template_list.append(FileTemplate(filename, category=FileTemplateCategory.text))
            else:
                template_list.append(FileTemplate(filename, category=FileTemplateCategory.text))
        return template_list

    def _get_file_template_path(self, template_filename) -> str:
        template_path = "{}/{}".format(self._config.FILE_TEMPLATE_DIR, template_filename)
        try:
            is_dir_exist(self._config.FILE_TEMPLATE_DIR)
            is_dir_readable(self._config.FILE_TEMPLATE_DIR)
            is_file_exist(template_path)
            is_file_readable(template_path)
        except (NotADirectoryError, NotAFileError, NotReadableFile) as exc:
            raise FileTemplateNotAvailable from exc
        return template_path

    def check_template_available(self, template_filename) -> None:
        self._get_file_template_path(template_filename)

    def update_from_template(self, content: Content, template_filename: str) -> Content:
        template_path = self._get_file_template_path(template_filename)
        new_mimetype = mimetypes.guess_type(template_path)[0]
        api = ContentApi(config=self._config, session=self._session, current_user=self._user)
        with open(self._get_file_template_path(template_filename), "rb") as file:
            api.update_file_data(
                content, new_filename=content.file_name, new_mimetype=new_mimetype, new_content=file
            )
        return content

    def get_token(self, access_token: str) -> CollaborativeDocumentEditionToken:
        return CollaborativeDocumentEditionToken(access_token=access_token)

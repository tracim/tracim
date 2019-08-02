from abc import ABC
import mimetypes
import os
from os.path import isfile
from os.path import join
import typing

from sqlalchemy.orm import Session

from tracim_backend import CFG
from tracim_backend.exceptions import FileTemplateNotAvailable
from tracim_backend.exceptions import NotAFileError
from tracim_backend.exceptions import NotReadableFile
from tracim_backend.lib.collaborative_document_edition.models import (
    CollaborativeDocumentEditionConfig,
)
from tracim_backend.lib.collaborative_document_edition.models import (
    CollaborativeDocumentEditionFileType,
)
from tracim_backend.lib.collaborative_document_edition.models import (
    CollaborativeDocumentEditionToken,
)
from tracim_backend.lib.collaborative_document_edition.models import FileTemplateList
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.utils import is_dir_exist
from tracim_backend.lib.utils.utils import is_dir_readable
from tracim_backend.lib.utils.utils import is_file_exist
from tracim_backend.lib.utils.utils import is_file_readable
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content


class CollaborativeDocumentEditionApi(ABC):
    def __init__(self, current_user: typing.Optional[User], session: Session, config: CFG) -> None:
        self._session = session
        self._user = current_user
        self._config = config

    def get_supported_file_types(self) -> typing.List[CollaborativeDocumentEditionFileType]:
        """
        Get list of supported file type for collaborative editions
        """
        raise NotImplementedError()

    def get_config(self) -> CollaborativeDocumentEditionConfig:
        return CollaborativeDocumentEditionConfig(
            software=self._config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE,
            supported_file_types=self.get_supported_file_types(),
        )

    def get_file_template_list(self) -> FileTemplateList:
        return FileTemplateList(file_templates=self._get_template_list())

    def _get_template_list(self) -> typing.List[str]:
        """
        return list of templates names as string like "text.odt"
        """
        template_list = []
        try:
            is_dir_exist(self._config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR)
            is_dir_readable(self._config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR)
        except (NotADirectoryError) as exc:
            raise FileTemplateNotAvailable from exc
        for filename in os.listdir(self._config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR):
            if not isfile(
                join(self._config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR, filename)
            ):
                continue
            template_list.append(filename)
        return template_list

    def _get_file_template_path(self, template_filename: str) -> str:
        template_path = "{}/{}".format(
            self._config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR, template_filename
        )
        try:
            is_dir_exist(self._config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR)
            is_dir_readable(self._config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR)
            is_file_exist(template_path)
            is_file_readable(template_path)
        except (NotADirectoryError, NotAFileError, NotReadableFile) as exc:
            raise FileTemplateNotAvailable from exc
        return template_path

    def check_template_available(self, template_filename: str) -> None:
        """
        check  if template is available by trying to get it, will raise
        some exception if it fail
        """
        self._get_file_template_path(template_filename)

    def update_content_from_template(self, content: Content, template_filename: str) -> Content:
        template_path = self._get_file_template_path(template_filename)
        new_mimetype = mimetypes.guess_type(template_path)[0]
        api = ContentApi(config=self._config, session=self._session, current_user=self._user)
        with open(self._get_file_template_path(template_filename), "rb") as file:
            api.update_file_data(
                content, new_filename=content.file_name, new_mimetype=new_mimetype, new_content=file
            )
        return content

    def get_token(self, access_token: str) -> CollaborativeDocumentEditionToken:
        """
        Return serializable object containing token information.
        """
        return CollaborativeDocumentEditionToken(access_token=access_token)

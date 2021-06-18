from abc import ABC
from abc import abstractmethod
import mimetypes
import os
from os.path import isfile
from os.path import join
import typing

from sqlalchemy.orm import Session

from tracim_backend import CFG
from tracim_backend.applications.collaborative_document_edition.models import (
    CollaborativeDocumentEditionConfig,
)
from tracim_backend.applications.collaborative_document_edition.models import (
    CollaborativeDocumentEditionFileType,
)
from tracim_backend.applications.collaborative_document_edition.models import (
    CollaborativeDocumentEditionToken,
)
from tracim_backend.applications.collaborative_document_edition.models import FileTemplateList
from tracim_backend.exceptions import FileTemplateNotAvailable
from tracim_backend.exceptions import NotAFileError
from tracim_backend.exceptions import NotReadableFile
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.utils import is_dir_exist
from tracim_backend.lib.utils.utils import is_dir_readable
from tracim_backend.lib.utils.utils import is_file_exist
from tracim_backend.lib.utils.utils import is_file_readable
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content


class CollaborativeDocumentEditionLib(ABC):
    """
    Manager providing methods to support Collaborative Document Edition.
    This contain all non-WOPI methods needed to support of Collaborative Document Edition
    This is abstract as real Lib should be directly related to a specific software like
    Collabora/LibreOfficeOnline.
    """

    def __init__(
        self,
        config: CFG,
        current_user: typing.Optional[User] = None,
        session: typing.Optional[Session] = None,
    ) -> None:
        self._session = session
        self._user = current_user
        self._config = config

    def get_supported_file_types(self) -> typing.List[CollaborativeDocumentEditionFileType]:
        """
        Get list of supported file type for collaborative editions.
        The list is obtained by calling _get_supported_file_types() then filtering it with
        the config setting COLLABORATIVE_DOCUMENT_EDITION__ENABLED_EXTENSIONS.
        """
        file_types = self._get_supported_file_types()
        enabled_extensions = self._config.COLLABORATIVE_DOCUMENT_EDITION__ENABLED_EXTENSIONS
        if not enabled_extensions:
            return file_types
        return [file_type for file_type in file_types if file_type.extension in enabled_extensions]

    @abstractmethod
    def _get_supported_file_types(self) -> typing.List[CollaborativeDocumentEditionFileType]:
        """
        Get list of supported file type for collaborative editions
        """
        pass

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
        try:
            is_dir_exist(self._config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR)
            is_dir_readable(self._config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR)
        except (NotADirectoryError) as exc:
            raise FileTemplateNotAvailable from exc

        template_filenames = [
            entry
            for entry in os.listdir(self._config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR)
            if isfile(join(self._config.COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR, entry))
        ]

        if not self._config.COLLABORATIVE_DOCUMENT_EDITION__ENABLED_EXTENSIONS:
            return template_filenames

        return [
            filename
            for filename in template_filenames
            if os.path.splitext(filename)[1][1:]
            in self._config.COLLABORATIVE_DOCUMENT_EDITION__ENABLED_EXTENSIONS
        ]

    def _get_file_template_path(self, template_filename: str) -> str:
        template_path = os.path.join(
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
        assert self._session
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

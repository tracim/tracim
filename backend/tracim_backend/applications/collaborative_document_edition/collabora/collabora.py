import typing

from defusedxml import ElementTree
import requests

from tracim_backend.applications.collaborative_document_edition.lib import (
    CollaborativeDocumentEditionLib,
)
from tracim_backend.applications.collaborative_document_edition.models import (
    CollaborativeDocumentEditionFileType,
)


class CollaboraCollaborativeDocumentEditionLib(CollaborativeDocumentEditionLib):
    """
    Collabora implementation of Collaborative Document Edition.
    """

    def _get_supported_file_types(self) -> typing.List[CollaborativeDocumentEditionFileType]:
        """
        Get list of supported file type for collaborative editions
        """
        response = requests.get(
            self._config.COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL + "/hosting/discovery",
            timeout=2,
        )
        root = ElementTree.fromstring(response.text)
        supported_collabora_file = []  # type: typing.List[CollaborativeDocumentEditionFileType]
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
                    CollaborativeDocumentEditionFileType(
                        mimetype=mimetype,
                        extension=extension,
                        associated_action=associated_action,
                        url_source=url_source,
                    )
                )
        return supported_collabora_file

import typing

from defusedxml import ElementTree
import requests
from sqlalchemy.orm import Session

from tracim_backend import CFG
from tracim_backend.lib.collabora.models import CollaboraFileType
from tracim_backend.lib.collabora.models import CollaborativeDocumentEditionToken
from tracim_backend.models.auth import User

COLLABORA_ACTION_EDIT = "edit"


class CollaboraApi(object):
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

    def get_token(self, access_token: str) -> CollaborativeDocumentEditionToken:
        return CollaborativeDocumentEditionToken(access_token=access_token)

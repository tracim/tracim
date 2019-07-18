import typing

from sqlalchemy.orm import Session

from tracim_backend.config import CFG
from tracim_backend.exceptions import NoValidCollaborativeDocumentEditionSoftware
from tracim_backend.lib.collaborative_document_edition.data import COLLABORA_DOCUMENT_EDITION_SLUG
from tracim_backend.models.auth import User
from tracim_backend.views.collaborative_document_edition_api.collabora_controller import (
    CollaboraController,
)


class CollaborativeDocumentEditionFactory(object):
    """
    Factory to get correct objects related to search engine activated
    """

    @classmethod
    def get_collaborative_document_edition_controller(cls, config: "CFG"):
        assert config.COLLABORATIVE_DOCUMENT_EDITION__ACTIVATED
        if config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE == COLLABORA_DOCUMENT_EDITION_SLUG:
            # TODO - G.M - 2019-05-22 - fix circular import
            return CollaboraController()
        else:
            raise NoValidCollaborativeDocumentEditionSoftware(
                "Can't provide search controller "
                ' because search engine provided "{}"'
                " is not valid".format(config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE)
            )

    @classmethod
    def get_collaborative_document_edition_lib(
        cls, session: Session, current_user: typing.Optional[User], config: "CFG"
    ):

        if config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE == COLLABORA_DOCUMENT_EDITION_SLUG:
            # TODO - G.M - 2019-05-22 - fix circular import
            from tracim_backend.lib.collaborative_document_edition.collabora import (
                CollaboraCollaborativeDocumentEditionApi,
            )

            return CollaboraCollaborativeDocumentEditionApi(
                config=config, session=session, current_user=current_user
            )
        else:
            raise NoValidCollaborativeDocumentEditionSoftware(
                "Can't provide search controller "
                ' because search engine provided "{}"'
                " is not valid".format(config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE)
            )

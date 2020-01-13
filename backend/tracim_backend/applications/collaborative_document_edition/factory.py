import typing

from sqlalchemy.orm import Session

from tracim_backend.applications.collaborative_document_edition.data import (
    COLLABORA_DOCUMENT_EDITION_SLUG,
)
from tracim_backend.applications.collaborative_document_edition.lib import (
    CollaborativeDocumentEditionLib,
)
from tracim_backend.config import CFG
from tracim_backend.exceptions import NoValidCollaborativeDocumentEditionSoftware
from tracim_backend.models.auth import User
from tracim_backend.views.controllers import Controller


class CollaborativeDocumentEditionFactory(object):
    """
    Factory to get correct objects related to collaborative software
    """

    @classmethod
    def get_controller(cls, config: "CFG") -> Controller:
        from tracim_backend.applications.collaborative_document_edition.collabora.controller import (
            CollaboraController,
        )

        if config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE == COLLABORA_DOCUMENT_EDITION_SLUG:
            # TODO - G.M - 2019-05-22 - fix circular import
            return CollaboraController()
        else:
            raise NoValidCollaborativeDocumentEditionSoftware(
                "Can't provide collaborative document edition controller "
                ' because collaborative document edition software provided "{}"'
                " is not valid".format(config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE)
            )

    @classmethod
    def get_lib(
        cls, session: Session, current_user: typing.Optional[User], config: "CFG"
    ) -> CollaborativeDocumentEditionLib:

        if config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE == COLLABORA_DOCUMENT_EDITION_SLUG:
            # TODO - G.M - 2019-05-22 - fix circular import
            from tracim_backend.applications.collaborative_document_edition.collabora.collabora import (
                CollaboraCollaborativeDocumentEditionLib,
            )

            return CollaboraCollaborativeDocumentEditionLib(
                config=config, session=session, current_user=current_user
            )
        else:
            raise NoValidCollaborativeDocumentEditionSoftware(
                "Can't provide collaborative document edition lib "
                ' because collaborative document edition software provided "{}"'
                " is not valid".format(config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE)
            )

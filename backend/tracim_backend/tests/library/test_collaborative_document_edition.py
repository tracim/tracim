import typing

import pytest

from tracim_backend import CFG
from tracim_backend.applications.collaborative_document_edition.lib import (
    CollaborativeDocumentEditionLib,
)
from tracim_backend.applications.collaborative_document_edition.models import (
    CollaborativeDocumentEditionFileType,
)
from tracim_backend.models.auth import User
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.tests.fixtures import *  # noqa: F403,F40

foo_file_type = CollaborativeDocumentEditionFileType(
    mimetype="application/x-foo",
    extension="foo",
    associated_action="open",
    url_source="http://localhost:1234",
)

bar_file_type = CollaborativeDocumentEditionFileType(
    mimetype="application/x-bar",
    extension="bar",
    associated_action="open",
    url_source="http://localhost:1234",
)


class CollaborativeDocumentEditionLibForTest(CollaborativeDocumentEditionLib):
    def __init__(
        self,
        config: CFG,
        current_user: typing.Optional[User] = None,
        session: typing.Optional[TracimSession] = None,
    ):
        super().__init__(config=config, current_user=current_user, session=session)

    def _get_supported_file_types(self) -> typing.List[CollaborativeDocumentEditionFileType]:
        return [foo_file_type, bar_file_type]


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "collabora_test"}], indirect=True)
class TestCollaborativeDocumentEdition(object):
    @pytest.mark.parametrize(
        "enabled_extensions,expected_supported_file_types",
        [("", [foo_file_type, bar_file_type]), ("bar", [bar_file_type])],
    )
    def test_api__collaborative_document_edition_supported_file_types__ok_200__nominal_cases(
        self,
        admin_user: User,
        session: TracimSession,
        app_config: CFG,
        enabled_extensions: typing.List[str],
        expected_supported_file_types: typing.List[CollaborativeDocumentEditionFileType],
    ):
        app_config.COLLABORATIVE_DOCUMENT_EDITION__ENABLED_EXTENSIONS = enabled_extensions
        collaborative_document_edition_api = CollaborativeDocumentEditionLibForTest(
            current_user=admin_user, session=session, config=app_config
        )
        assert (
            collaborative_document_edition_api.get_supported_file_types()
            == expected_supported_file_types
        )

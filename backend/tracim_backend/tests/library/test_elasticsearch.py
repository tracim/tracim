import typing
from unittest.mock import MagicMock
from unittest.mock import PropertyMock
from unittest.mock import patch

import elasticsearch_dsl as es_dsl
import pytest

from tracim_backend.lib.search.elasticsearch_search.elasticsearch_search import ESContentIndexer
from tracim_backend.lib.search.elasticsearch_search.elasticsearch_search import ESUserIndexer
from tracim_backend.lib.search.elasticsearch_search.elasticsearch_search import ESWorkspaceIndexer
from tracim_backend.lib.search.elasticsearch_search.es_models import HtmlText
from tracim_backend.lib.search.elasticsearch_search.es_models import JsonSchemaDict
from tracim_backend.lib.search.elasticsearch_search.es_models import SimpleText
from tracim_backend.lib.search.elasticsearch_search.es_models import get_es_field_from_json_schema
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


def html_document() -> Content:
    return Content(label="A content", type="html-document")


def content_with_parent(content_type: str, parent_type: str) -> Content:
    parent = Content(type=parent_type)
    content = Content(type=content_type)
    content.parent = parent
    return content


def a_user() -> User:
    return User(user_id=42, display_name="Bob the sponge")


def a_workspace() -> Workspace:
    return Workspace(workspace_id=42, label="Friends of Bob")


ContentIndexerWithApiMock = typing.Tuple[ESContentIndexer, MagicMock, MagicMock]


@pytest.fixture
def content_indexer_with_api_mock() -> typing.Iterator[ContentIndexerWithApiMock]:
    """Create an ESContentIndexer instance with mocked ESSearchApi and ContentApi.

    Return a (ESContentIndexer, ESSearchApi.index_content_mock, ContentApi_mock) tuple.
    """
    with patch(
        "tracim_backend.lib.search.elasticsearch_search.elasticsearch_search.ESSearchApi.index_content"
    ) as index_content_mock, patch(
        "tracim_backend.lib.search.elasticsearch_search.elasticsearch_search.ContentApi"
    ) as content_api_class_mock:
        content_api_mock = MagicMock()
        content_api_class_mock.return_value = content_api_mock
        yield (ESContentIndexer(), index_content_mock, content_api_mock)


@pytest.fixture
def user_indexer_with_api_mock() -> typing.Iterator[ContentIndexerWithApiMock]:
    """Create an ESUserIndexer instance with mocked ESSearchApi and RoleApi.

    Return a (ESUserIndexer, ESSearchApi.index_user_mock, RoleApi_mock) tuple.
    """
    with patch(
        "tracim_backend.lib.search.elasticsearch_search.elasticsearch_search.ESSearchApi.index_user"
    ) as index_user_mock, patch(
        "tracim_backend.lib.search.elasticsearch_search.elasticsearch_search.RoleApi"
    ) as role_api_class_mock:
        role_api_mock = MagicMock()
        role_api_class_mock.return_value = role_api_mock
        yield (ESUserIndexer(), index_user_mock, role_api_mock)


@pytest.fixture
def workspace_indexer_with_api_mock() -> typing.Iterator[ContentIndexerWithApiMock]:
    """Create an ESUserIndexer instance with mocked ESSearchApi and RoleApi.

    Return a (ESWorkspaceIndexer, ESSearchApi.index_workspace_mock, RoleApi_mock) tuple.
    """
    with patch(
        "tracim_backend.lib.search.elasticsearch_search.elasticsearch_search.ESSearchApi.index_workspace"
    ) as index_workspace_mock, patch(
        "tracim_backend.lib.search.elasticsearch_search.elasticsearch_search.RoleApi"
    ) as role_api_class_mock:
        role_api_mock = MagicMock()
        role_api_class_mock.return_value = role_api_mock
        yield (ESWorkspaceIndexer(), index_workspace_mock, role_api_mock)


@pytest.mark.parametrize("config_section", [{"name": "test_elasticsearch_search"}], indirect=True)
class TestElasticSearchContentIndexer:
    @pytest.mark.parametrize(
        "content,indexed_content_is_parent",
        [
            (html_document(), False),
            (content_with_parent("html-document", "folder"), False),
            (content_with_parent("comment", "html-document"), True),
        ],
    )
    def test_unit__on_content_created__ok__nominal_cases(
        self,
        test_context: TracimContext,
        content_indexer_with_api_mock: ContentIndexerWithApiMock,
        content: Content,
        indexed_content_is_parent: bool,
    ) -> None:
        (indexer, index_content_mock, _) = content_indexer_with_api_mock
        indexer.on_content_created(content, test_context)
        index_content_mock.assert_called_once_with(
            content if not indexed_content_is_parent else content.parent
        )

    @pytest.mark.parametrize(
        "content,indexed_content_is_parent",
        [
            (html_document(), False),
            (content_with_parent("html-document", "folder"), False),
            (content_with_parent("comment", "html-document"), True),
        ],
    )
    def test_unit__on_content_modified__ok__simple_content(
        self,
        test_context: TracimContext,
        content_indexer_with_api_mock: ContentIndexerWithApiMock,
        content: Content,
        indexed_content_is_parent: bool,
    ) -> None:
        (indexer, index_content_mock, _) = content_indexer_with_api_mock
        indexer.on_content_modified(content, test_context)
        index_content_mock.assert_called_once_with(
            content if not indexed_content_is_parent else content.parent
        )

    @pytest.mark.parametrize("content_type, indexed_count", [("comment", 1), ("file", 2)])
    def test_unit__on_content_modified__ok__content_with_child(
        self,
        test_context: TracimContext,
        content_indexer_with_api_mock: ContentIndexerWithApiMock,
        content_type: str,
        indexed_count: int,
    ) -> None:
        (indexer, index_content_mock, _) = content_indexer_with_api_mock
        with patch.object(
            Content, "recursive_children", new_callable=PropertyMock
        ) as recursive_children_mock:
            recursive_children_mock.return_value = [Content(type=content_type)]
            content = html_document()
            indexer.on_content_modified(content, test_context)
        assert index_content_mock.call_count == indexed_count

    @pytest.mark.parametrize(
        "workspace, indexed_count", [(Workspace(label="A workspace"), 1), (Workspace(), 0)]
    )
    def test_unit__on_workspace_modified__ok__nominal_cases(
        self,
        test_context: TracimContext,
        content_indexer_with_api_mock: ContentIndexerWithApiMock,
        workspace: Workspace,
        indexed_count: int,
    ) -> None:
        (indexer, index_content_mock, content_api_mock) = content_indexer_with_api_mock
        content_api_mock.get_all_query.return_value = [html_document()]
        indexer.on_workspace_modified(workspace, test_context)
        assert index_content_mock.call_count == indexed_count

    @pytest.mark.parametrize(
        "user, indexed_count", [(User(display_name="An user"), 1), (User(), 0)]
    )
    def test_unit__on_user_modified__ok__nominal_cases(
        self,
        test_context: TracimContext,
        content_indexer_with_api_mock: ContentIndexerWithApiMock,
        user: User,
        indexed_count: int,
    ) -> None:
        (indexer, index_content_mock, content_api_mock) = content_indexer_with_api_mock
        content_api_mock.get_all_query.return_value = [html_document()]
        indexer.on_user_modified(user, test_context)
        assert index_content_mock.call_count == indexed_count


@pytest.mark.parametrize("config_section", [{"name": "test_elasticsearch_search"}], indirect=True)
class TestElasticSearchUserIndexer:
    @pytest.mark.parametrize(
        "event_hook, event_parameter",
        [
            (ESUserIndexer.on_user_created, a_user()),
            (ESUserIndexer.on_user_modified, a_user()),
            (ESUserIndexer.on_content_created, Content(owner=a_user())),
            (ESUserIndexer.on_content_modified, Content(owner=a_user())),
            (
                ESUserIndexer.on_user_role_in_workspace_created,
                UserRoleInWorkspace(user=a_user(), workspace=Workspace()),
            ),
            (
                ESUserIndexer.on_user_role_in_workspace_modified,
                UserRoleInWorkspace(user=a_user(), workspace=Workspace()),
            ),
            (
                ESUserIndexer.on_user_role_in_workspace_deleted,
                UserRoleInWorkspace(user=a_user(), workspace=Workspace()),
            ),
        ],
    )
    def test_unit__hook_impls__ok__nominal_case(
        self,
        test_context: TracimContext,
        user_indexer_with_api_mock: ContentIndexerWithApiMock,
        event_hook: typing.Callable,
        event_parameter: typing.Any,
    ) -> None:
        (indexer, index_user_mock, _) = user_indexer_with_api_mock
        event_hook(indexer, event_parameter, test_context)
        assert index_user_mock.call_count == 1
        assert index_user_mock.call_args[0][0].user_id == a_user().user_id


@pytest.mark.parametrize("config_section", [{"name": "test_elasticsearch_search"}], indirect=True)
class TestElasticSearchWorkspaceIndexer:
    @pytest.mark.parametrize(
        "event_hook, event_parameter",
        [
            (ESWorkspaceIndexer.on_workspace_created, a_workspace()),
            (ESWorkspaceIndexer.on_workspace_modified, a_workspace()),
            (
                ESWorkspaceIndexer.on_user_role_in_workspace_created,
                UserRoleInWorkspace(user=a_user(), workspace=a_workspace()),
            ),
            (
                ESWorkspaceIndexer.on_user_role_in_workspace_modified,
                UserRoleInWorkspace(user=a_user(), workspace=a_workspace()),
            ),
            (
                ESWorkspaceIndexer.on_user_role_in_workspace_deleted,
                UserRoleInWorkspace(user=a_user(), workspace=a_workspace()),
            ),
        ],
    )
    def test_unit__hook_impls__ok__nominal_case(
        self,
        test_context: TracimContext,
        workspace_indexer_with_api_mock: ContentIndexerWithApiMock,
        event_hook: typing.Callable,
        event_parameter: typing.Any,
    ) -> None:
        (indexer, index_workspace_mock, _) = workspace_indexer_with_api_mock
        event_hook(indexer, event_parameter, test_context)
        assert index_workspace_mock.called_once == 1
        assert index_workspace_mock.call_args[0][0].workspace_id == a_workspace().workspace_id


class TestUtils:
    @pytest.mark.parametrize(
        "schema,expected_field",
        [
            (
                {"type": "object", "properties": {"foo": {"type": "string"}}},
                es_dsl.Object(properties={"foo": SimpleText()}),
            ),
            (
                {"type": "object", "properties": {"foo": {"type": "number"}}},
                es_dsl.Object(properties={"foo": es_dsl.field.Float()}),
            ),
            (
                {"type": "object", "properties": {"foo": {"type": "string", "format": "html"}}},
                es_dsl.Object(properties={"foo": HtmlText()}),
            ),
            (
                {
                    "type": "object",
                    "properties": {"foo": {"type": "array", "items": {"type": "string"}}},
                },
                es_dsl.Object(properties={"foo": SimpleText(multi=True)}),
            ),
        ],
    )
    def test_unit__get_es_field_from_json_schema__ok__nominal_cases(
        self, schema: JsonSchemaDict, expected_field: es_dsl.Field
    ) -> None:
        field = get_es_field_from_json_schema(schema)
        assert expected_field == field

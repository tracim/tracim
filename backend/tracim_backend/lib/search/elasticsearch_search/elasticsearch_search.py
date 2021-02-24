from datetime import datetime
import typing

from elasticsearch import Elasticsearch
from elasticsearch import NotFoundError
from elasticsearch import RequestError
from elasticsearch.client import IngestClient
from elasticsearch_dsl import Document
from elasticsearch_dsl import Search
from elasticsearch_dsl.response.aggs import Bucket
import pluggy
from sqlalchemy import inspect
from sqlalchemy.orm import Session

# from tracim_backend.lib.search.models import UserSearchResponse
from tracim_backend import CFG
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.search.elasticsearch_search.es_models import EXACT_FIELD
from tracim_backend.lib.search.elasticsearch_search.es_models import DigestComments
from tracim_backend.lib.search.elasticsearch_search.es_models import DigestContent
from tracim_backend.lib.search.elasticsearch_search.es_models import DigestUser
from tracim_backend.lib.search.elasticsearch_search.es_models import DigestWorkspace
from tracim_backend.lib.search.elasticsearch_search.es_models import IndexedContent
from tracim_backend.lib.search.elasticsearch_search.es_models import IndexedWorkspace
from tracim_backend.lib.search.elasticsearch_search.es_models import create_indexed_user_class
from tracim_backend.lib.search.elasticsearch_search.models import ESContentSearchResponse
from tracim_backend.lib.search.elasticsearch_search.models import FacetCount
from tracim_backend.lib.search.elasticsearch_search.models import UserSearchResponse
from tracim_backend.lib.search.elasticsearch_search.models import WorkspaceSearchResponse
from tracim_backend.lib.search.models import ContentSearchField
from tracim_backend.lib.search.models import ContentSearchResponse
from tracim_backend.lib.search.models import UserSearchField
from tracim_backend.lib.search.models import WorkspaceSearchField
from tracim_backend.lib.search.search import SearchApi
from tracim_backend.lib.search.search_factory import ELASTICSEARCH__SEARCH_ENGINE_SLUG
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import UserInContext
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.views.search_api.schemas import AdvancedContentSearchQuery

FILE_PIPELINE_ID = "attachment"
FILE_PIPELINE_SOURCE_FIELD = "b64_file"
FILE_PIPELINE_DESTINATION_FIELD = "file_data"
FILE_PIPELINE_LANGS = ["en", "fr", "pt", "de"]

DEFAULT_CONTENT_SEARCH_FIELDS = list(ContentSearchField)
DEFAULT_USER_SEARCH_FIELDS = list(UserSearchField)
DEFAULT_WORKSPACE_SEARCH_FIELDS = list(WorkspaceSearchField)

T = typing.TypeVar("T")


def name_starts_with_any_prefix(name: str, name_prefixes: typing.Iterable[str]) -> bool:
    return any(name.startswith(n) for n in name_prefixes)


class IndexParameters:
    def __init__(
        self,
        alias: str,
        document_class: typing.Type[Document],
        index_name_template: str,
        indexer: object,
    ) -> None:
        self.alias = alias
        self.document_class = document_class
        self.index_name_template = index_name_template
        self.indexer = indexer


class ESSearchApi(SearchApi):
    """
    Search using ElasticSearch:
    - need indexing content first
    - allow pagination and filtering by content_type, deleted, archived
    - support ranking
    - search in content file for html-doc and thread
    - search in content file for file if ingest mode activated
    """

    def __init__(self, session: Session, current_user: typing.Optional[User], config: CFG) -> None:
        super().__init__(session, current_user, config)
        assert config.SEARCH__ENGINE == ELASTICSEARCH__SEARCH_ENGINE_SLUG
        # TODO - G.M - 2019-05-31 - we support only one elasticsearch server case here in config,
        # check how to support more complex case.
        self.es = Elasticsearch(
            hosts=[
                (
                    {
                        "host": self._config.SEARCH__ELASTICSEARCH__HOST,
                        "port": self._config.SEARCH__ELASTICSEARCH__PORT,
                    }
                )
            ]
        )
        self.IndexedUser = create_indexed_user_class(config)

    def create_indices(self) -> None:
        # INFO - G.M - 2019-05-15 - alias migration mechanism to allow easily updateable index.
        # from https://github.com/elastic/elasticsearch-dsl-py/blob/master/examples/alias_migration.py
        # Configure index with our indexing preferences
        logger.info(self, "Creating ES indices...")
        if self._config.SEARCH__ELASTICSEARCH__USE_INGEST:
            self._create_ingest_pipeline()

        indices_parameters = self._get_indices_parameters()
        for parameters in indices_parameters:
            self.create_template(parameters)
            index_name = self._get_index_name(parameters)
            try:
                self.es.indices.create(index=index_name)
            except RequestError:
                # Ignoring error if the index already exists
                pass
            else:
                self.set_alias(parameters, index_name)

        logger.info(self, "ES indices are ready")

    def create_template(self, parameters: IndexParameters) -> None:
        """Create an index template based on the given model."""
        index_template = parameters.document_class._index.as_template(
            parameters.alias, self._get_index_pattern(parameters)
        )
        # upload the template into elasticsearch
        # potentially overriding the one already there
        index_template.save(using=self.es)

    def set_alias(self, parameters: IndexParameters, index_name: str) -> None:
        """Ensure that the alias of the given parameters does point to the given index."""
        self.es.indices.update_aliases(
            body={
                "actions": [
                    {
                        "remove": {
                            "alias": parameters.alias,
                            "index": self._get_index_pattern(parameters),
                        }
                    },
                    {"add": {"alias": parameters.alias, "index": index_name}},
                ]
            }
        )

    def refresh_indices(self) -> None:
        """
        refresh indices to obtain up to date information instead of relying on
        periodical refresh, useful for automated tests.
        see https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-refresh.html
        """
        for parameters in self._get_indices_parameters():
            self.es.indices.refresh(parameters.alias)

    def delete_indices(self) -> None:

        # TODO - G.M - 2019-05-31 - This code delete all index related to pattern, check if possible
        # to be more specific here.
        for parameters in self._get_indices_parameters():
            index_pattern = self._get_index_pattern(parameters)
            logger.info(self, "deleting indices whose name matches {}".format(index_pattern))
            self.es.indices.delete(index_pattern, allow_no_indices=True)
            self.es.indices.delete(parameters.alias, ignore_unavailable=True)
            try:
                self.es.indices.delete_template(parameters.alias)
            except NotFoundError:
                # Ignore error when no matching alias exists
                pass

    def migrate_indices(self) -> None:
        """
        Upgrade function that creates new indices for the data and re-index
        the previous copy of the data into the new indices.

        Note that while this function is running the application can still perform
        any and all searches without any loss of functionality. It should, however,
        not perform any writes at this time as those might be lost.
        """
        # INFO - G.M - 2019-05-15 - alias migration mechanism to allow easily updatable index.
        # from https://github.com/elastic/elasticsearch-dsl-py/blob/master/examples/alias_migration.py
        # construct a new index name by appending current timestamp
        for parameters in self._get_indices_parameters():
            new_index_name = self._get_index_name(parameters)

            logger.info(self, 'Creating new index "{}"'.format(new_index_name))
            # create new index, it will use the settings from the template
            self.es.indices.create(index=new_index_name)

            logger.info(
                self, 'reindex data from "{}" to "{}"'.format(parameters.alias, new_index_name)
            )
            # move data from current alias to the new index
            self.es.reindex(
                body={"source": {"index": parameters.alias}, "dest": {"index": new_index_name}},
                request_timeout=3600,
            )
            # refresh the index to make the changes visible
            self.es.indices.refresh(index=new_index_name)

            logger.info(
                self,
                'Setting alias "{}" to point on index "{}"'.format(
                    parameters.alias, new_index_name
                ),
            )
            # move the alias to point to the newly created index
            self.set_alias(parameters, new_index_name)

    def index_content(self, content: Content) -> None:
        """
        Index/update a content into elastic_search engine
        """
        content_in_context = ContentInContext(content, config=self._config, dbsession=self._session)
        logger.info(self, "Indexing content {}".format(content_in_context.content_id))
        author = DigestUser(
            user_id=content_in_context.author.user_id,
            public_name=content_in_context.author.public_name,
            has_avatar=content_in_context.author.has_avatar,
            has_cover=content_in_context.author.has_cover,
        )
        last_modifier = DigestUser(
            user_id=content_in_context.last_modifier.user_id,
            public_name=content_in_context.last_modifier.public_name,
            has_avatar=content_in_context.last_modifier.has_avatar,
            has_cover=content_in_context.last_modifier.has_cover,
        )
        workspace = DigestWorkspace(
            workspace_id=content_in_context.workspace.workspace_id,
            label=content_in_context.workspace.label,
        )
        path = [
            DigestContent(
                content_id=component.content_id,
                label=component.label,
                slug=component.slug,
                content_type=component.content_type,
            )
            for component in content_in_context.content_path
        ]
        comments = [
            DigestComments(
                content_id=comment.content_id,
                parent_id=comment.parent_id,
                content_type=comment.content_type,
                raw_content=comment.raw_content,
            )
            for comment in content_in_context.comments
        ]

        indexed_content = IndexedContent(
            content_namespace=content_in_context.content_namespace,
            content_id=content_in_context.content_id,
            current_revision_id=content_in_context.current_revision_id,
            current_revision_type=content_in_context.current_revision_type,
            slug=content_in_context.slug,
            parent_id=content_in_context.parent_id,
            workspace_id=content_in_context.workspace_id,
            workspace=workspace,
            label=content_in_context.label,
            content_type=content_in_context.content_type,
            sub_content_types=content_in_context.sub_content_types,
            status=content_in_context.status,
            is_archived=content_in_context.is_archived,
            is_deleted=content_in_context.is_deleted,
            is_editable=content_in_context.is_editable,
            is_active=content_in_context.is_active,
            show_in_ui=content_in_context.show_in_ui,
            file_extension=content_in_context.file_extension,
            filename=content_in_context.filename,
            modified=content_in_context.modified,
            created=content_in_context.created,
            active_shares=content_in_context.actives_shares,
            path=path,
            comments=comments,
            comment_count=len(comments),
            author=author,
            last_modifier=last_modifier,
            archived_through_parent_id=content_in_context.archived_through_parent_id,
            deleted_through_parent_id=content_in_context.deleted_through_parent_id,
            raw_content=content_in_context.raw_content,
            content_size=content_in_context.size,
        )
        indexed_content.meta.id = content_in_context.content_id
        content_index_alias = self._get_index_parameters(IndexedContent).alias
        pipeline_id = None  # type: typing.Optional[str]
        if self._should_index_depot_file(content_in_context):
            indexed_content.b64_file = content_in_context.get_b64_file()
            pipeline_id = FILE_PIPELINE_ID
        indexed_content.save(
            using=self.es,
            pipeline=pipeline_id,
            index=content_index_alias,
            request_timeout=self._config.SEARCH__ELASTICSEARCH__REQUEST_TIMEOUT,
        )

    def index_contents(self, contents: typing.Iterable[Content]) -> None:
        """Index the given contents."""
        for content in contents:
            self.index_content(content)

    def index_user(self, user: User) -> None:
        """Index the given user in the appropriate index."""
        user_in_context = UserInContext(user, dbsession=self._session, config=self._config)

        rapi = RoleApi(config=self._config, session=self._session, current_user=None)
        workspace_ids = rapi.get_user_workspaces_ids(user.user_id)
        capi = ContentApi(config=self._config, session=self._session, current_user=None)
        try:
            newest_authored_content_date = capi.get_newest_authored_content(
                user_in_context.user_id
            ).created
        except ContentNotFound:
            newest_authored_content_date = None

        indexed_user = self.IndexedUser(
            user_id=user_in_context.user_id,
            public_name=user_in_context.public_name,
            username=user_in_context.username,
            is_deleted=user_in_context.is_deleted,
            is_active=user_in_context.is_active,
            has_avatar=user_in_context.has_avatar,
            has_cover=user_in_context.has_cover,
            workspace_ids=workspace_ids,
            custom_properties=user.custom_properties.fields,
            newest_authored_content_date=newest_authored_content_date,
        )
        indexed_user.meta.id = user.user_id
        user_index_alias = self._get_index_parameters(self.IndexedUser).alias
        indexed_user.save(
            using=self.es,
            index=user_index_alias,
            request_timeout=self._config.SEARCH__ELASTICSEARCH__REQUEST_TIMEOUT,
        )

    def delete_user(self, user: User) -> None:
        """Delete the given user from the corresponding ES index."""
        user_index_alias = self._get_index_parameters(self.IndexedUser).alias
        self.es.delete(user_index_alias, user.user_id)

    def index_workspace(self, workspace: Workspace) -> None:
        """Index the given worspace in the appropriate ES index."""
        rapi = RoleApi(config=self._config, session=self._session, current_user=None)
        capi = ContentApi(config=self._config, session=self._session, current_user=None)
        member_ids = rapi.get_workspace_member_ids(workspace.workspace_id)
        indexed_workspace = IndexedWorkspace(
            access_type=workspace.access_type.value,
            workspace_id=workspace.workspace_id,
            label=workspace.label,
            description=workspace.description,
            owner_id=workspace.owner_id,
            member_ids=member_ids,
            member_count=len(member_ids),
            content_count=capi.get_all_query(workspace=workspace).count(),
        )
        indexed_workspace.meta.id = workspace.workspace_id
        workspace_index_alias = self._get_index_parameters(IndexedWorkspace).alias
        indexed_workspace.save(
            using=self.es,
            index=workspace_index_alias,
            request_timeout=self._config.SEARCH__ELASTICSEARCH__REQUEST_TIMEOUT,
        )

    def delete_workspace(self, workspace: Workspace) -> None:
        """Delete the given workspace from the corresponding ES index."""
        workspace_index_alias = self._get_index_parameters(IndexedWorkspace).alias
        self.es.delete(workspace_index_alias, workspace.workspace_id)

    def register_plugins(self, plugin_manager: pluggy.PluginManager) -> None:
        for parameters in self._get_indices_parameters():
            plugin_manager.register(parameters.indexer)

    def _should_index_depot_file(self, content: ContentInContext) -> bool:
        if not self._config.SEARCH__ELASTICSEARCH__USE_INGEST:
            logger.debug(
                self,
                'Skip binary indexation of content "{}" will be not indexed: ingest mode disabled'.format(
                    content.content_id
                ),
            )
            return False

        if not content.content.depot_file or content.size is None:
            logger.debug(
                self,
                'Skip binary indexation of content "{}":  invalid file format'.format(
                    content.content_id
                ),
            )
            return False

        # INFO - G.M - 2019-06-24 - check mimetype validity
        if (
            self._config.SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_WHITELIST
            and content.mimetype
            not in self._config.SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_WHITELIST
        ):
            logger.debug(
                self,
                'Skip binary indexation of content "{}": mimetype "{}" not whitelisted'.format(
                    content.content_id, content.mimetype
                ),
            )
            return False

        # INFO - G.M - 2019-06-24 - check mimetype validity
        if (
            self._config.SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_BLACKLIST
            and content.mimetype in self._config.SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_BLACKLIST
        ):
            logger.debug(
                self,
                'Skip binary indexation of content "{}": mimetype "{}" blacklisted'.format(
                    content.content_id, content.mimetype
                ),
            )
            return False

        if content.size == 0:
            logger.debug(
                self,
                'Skip binary indexation of content "{}":  empty file'.format(content.content_id),
            )
            return False

        # INFO - G.M - 2019-06-24 - check content size
        if content.size > self._config.SEARCH__ELASTICSEARCH__INGEST__SIZE_LIMIT:
            logger.debug(
                self,
                'Skip binary indexation of content "{}": binary is "{}" bytes, max allowed size for indexation is ({})'.format(
                    content.content_id,
                    content.size,
                    self._config.SEARCH__ELASTICSEARCH__INGEST__SIZE_LIMIT,
                ),
            )
            return False

        return True

    @classmethod
    def create_es_datetime_range(
        cls, range_from: typing.Optional[datetime], range_to: typing.Optional[datetime]
    ) -> typing.Dict[str, str]:
        range_ = {}

        if range_from:
            range_.update({"gte": range_from.isoformat()})

        if range_to:
            range_.update({"lte": range_to.isoformat()})

        return range_

    def search_content(
        self, search_parameters: AdvancedContentSearchQuery
    ) -> ContentSearchResponse:
        """
        Search content into elastic search server:
        - do no show archived/deleted content by default
        - filter content found according to workspace of current_user
        """

        if not search_parameters.search_string:
            return ContentSearchResponse()
        filtered_workspace_ids = self._get_user_workspaces_id(min_role=UserRoleInWorkspace.READER)
        es_search_fields = []
        search_fields = search_parameters.search_fields or DEFAULT_CONTENT_SEARCH_FIELDS

        # INFO - G.M - 2019-05-31 - "^5" means x5 boost on field, this will reorder result and
        # change score according to this boost. label is the most important, content is
        # important too, content of comment is less important. filename and file_extension is
        # only useful to allow matching "png" or "nameofmycontent.png".

        if ContentSearchField.LABEL in search_fields:
            # TODO - G.M - 2021-02-08 -  we may want to split exact and not exact search to allow
            # doing exact search efficiently.
            es_search_fields.extend(
                [
                    "label.{}^8".format(EXACT_FIELD),
                    "label^5",
                    "filename.{}".format(EXACT_FIELD),
                    "filename",
                    "file_extension",
                ]
            )

        if ContentSearchField.RAW_CONTENT in search_fields:
            es_search_fields.extend(
                [
                    "raw_content.{}^3".format(EXACT_FIELD),
                    "raw_content^3",
                    "{}.content^3".format(FILE_PIPELINE_DESTINATION_FIELD),
                    "{}.title^4".format(FILE_PIPELINE_DESTINATION_FIELD),
                    "{}.author".format(FILE_PIPELINE_DESTINATION_FIELD),
                    "{}.keywords".format(FILE_PIPELINE_DESTINATION_FIELD),
                ]
            )

            for lang in FILE_PIPELINE_LANGS:
                es_search_fields.append(
                    "{}.content_{}^3".format(FILE_PIPELINE_DESTINATION_FIELD, lang)
                )

        if ContentSearchField.COMMENTS in search_fields:
            es_search_fields.extend(
                ["comments.raw_content.{}".format(EXACT_FIELD), "comments.raw_content"]
            )

        if ContentSearchField.DESCRIPTION in search_fields:
            es_search_fields.append("description^3")

        search = Search(
            using=self.es,
            doc_type=IndexedContent,
            index=self._get_index_parameters(IndexedContent).alias,
        ).query(
            "simple_query_string", query=search_parameters.search_string, fields=es_search_fields,
        )

        # INFO - G.M - 2019-05-14 - do not show deleted or archived content by default
        if not search_parameters.show_active:
            search = search.exclude("term", is_active=True)

        if not search_parameters.show_deleted:
            search = search.exclude("term", is_deleted=True)
            search = search.filter("term", deleted_through_parent_id=0)

        if not search_parameters.show_archived:
            search = search.exclude("term", is_archived=True)
            search = search.filter("term", archived_through_parent_id=0)

        search = search.response_class(ESContentSearchResponse)
        # INFO - G.M - 2019-05-21 - remove some unneeded fields from results.
        # As they are useful only for searching.
        search = search.source(
            exclude=[
                "raw_content",
                FILE_PIPELINE_DESTINATION_FIELD,
                "{}.*".format(FILE_PIPELINE_DESTINATION_FIELD),
                "deleted_through_parent_id",
                "archived_through_parent_id",
                "is_active",
            ]
        )
        # INFO - G.M - 2019-05-16 - None is different than empty list here, None mean we can
        # return all workspaces content, empty list mean return nothing.

        if search_parameters.size is not None:
            search = search.extra(size=search_parameters.size)

        if search_parameters.page_nb:
            search = search.extra(
                from_=self.offset_from_pagination(search_parameters.size, search_parameters.page_nb)
            )

        if filtered_workspace_ids is not None:
            search = search.filter("terms", workspace_id=filtered_workspace_ids)

        if search_parameters.content_types:
            search = search.filter("terms", content_type=search_parameters.content_types)

        if search_parameters.workspace_names:
            search = search.filter(
                "terms", workspace__label__exact=search_parameters.workspace_names
            )

        if search_parameters.author__public_names:
            search = search.filter(
                "terms", author__public_name__exact=search_parameters.author__public_names
            )

        if search_parameters.last_modifier__public_names:
            search = search.filter(
                "terms",
                last_modifier__public_name__exact=search_parameters.last_modifier__public_names,
            )

        if search_parameters.file_extensions:
            search = search.filter("terms", file_extension__exact=search_parameters.file_extensions)

        if search_parameters.statuses:
            search = search.filter("terms", status=search_parameters.statuses)

        created_range = self.create_es_datetime_range(
            search_parameters.created_from, search_parameters.created_to
        )

        if created_range:
            search = search.filter("range", created=created_range)

        modified_range = self.create_es_datetime_range(
            search_parameters.modified_from, search_parameters.modified_to
        )

        if modified_range:
            search = search.filter("range", modified=modified_range)

        search.aggs.bucket("content_types", "terms", field="content_type")
        search.aggs.bucket(
            "workspace_names", "terms", field="workspace.label.{}".format(EXACT_FIELD)
        )
        search.aggs.bucket(
            "author__public_names", "terms", field="author.public_name.{}".format(EXACT_FIELD)
        )
        search.aggs.bucket(
            "last_modifier__public_names",
            "terms",
            field="last_modifier.public_name.{}".format(EXACT_FIELD),
        )
        search.aggs.bucket(
            "file_extensions", "terms", field="file_extension.{}".format(EXACT_FIELD)
        )
        search.aggs.bucket("statuses", "terms", field="status")
        search.aggs.metric("created_from", "min", field="created")
        search.aggs.metric("created_to", "max", field="created")
        search.aggs.metric("modified_from", "min", field="modified")
        search.aggs.metric("modified_to", "max", field="modified")

        res = search.execute()
        return res

    def search_user(
        self,
        search_string: str,
        search_fields: typing.List[UserSearchField] = DEFAULT_USER_SEARCH_FIELDS,
        workspace_ids: typing.Optional[typing.List[int]] = None,
        newest_authored_content_date_from: typing.Optional[datetime] = None,
        newest_authored_content_date_to: typing.Optional[datetime] = None,
        show_deleted: bool = False,
        show_active: bool = True,
        page_nb: int = 0,
        size: int = 10,
    ) -> UserSearchResponse:
        search = Search(
            using=self.es,
            doc_type=self.IndexedUser,
            index=self._get_index_parameters(self.IndexedUser).alias,
        )
        fields = [
            "public_name.{}^5".format(EXACT_FIELD),
            "username.{}^5".format(EXACT_FIELD),
            "public_name^3",
            "username^3",
            "custom_properties",
        ]

        search_fields = search_fields or DEFAULT_USER_SEARCH_FIELDS
        fields = [field for field in fields if name_starts_with_any_prefix(field, search_fields)]
        search = search.query("simple_query_string", query=search_string, fields=fields)
        known_user_ids = UserApi(
            current_user=None, session=self._session, config=self._config
        ).get_known_user_ids(self._user.user_id)
        search = search.filter("terms", user_id=known_user_ids)
        if not show_active:
            search = search.exclude("term", is_active=True)
        if not show_deleted:
            search = search.exclude("term", is_deleted=True)
        if workspace_ids:
            search = search.filter("terms", workspace_ids=workspace_ids)
        newest_authored_content_date_range = self.create_es_datetime_range(
            newest_authored_content_date_from, newest_authored_content_date_to
        )
        if newest_authored_content_date_range:
            search = search.filter(
                "range", newest_authored_content_date=newest_authored_content_date_range
            )

        if size:
            search = search.extra(size=size)
        if page_nb:
            search = search.extra(from_=self.offset_from_pagination(size, page_nb))

        search.aggs.bucket("workspace_ids", "terms", field="workspace_ids")
        search.aggs.metric(
            "newest_authored_content_date_from", "min", field="newest_authored_content_date",
        )
        search.aggs.metric(
            "newest_authored_content_date_to", "max", field="newest_authored_content_date",
        )
        response = search.execute()
        known_workspaces = self._get_workspaces_known_to_user()
        facets = {
            "workspaces": self._create_filtered_facets(
                "workspace_id", response.aggregations.workspace_ids.buckets, known_workspaces
            )
        }
        return UserSearchResponse(
            hits=response["hits"],
            facets=facets,
            newest_authored_content_date_from=response.aggregations.newest_authored_content_date_from,
            newest_authored_content_date_to=response.aggregations.newest_authored_content_date_to,
        )

    def search_workspace(
        self,
        search_string: str,
        search_fields: typing.Optional[
            typing.List[WorkspaceSearchField]
        ] = DEFAULT_WORKSPACE_SEARCH_FIELDS,
        member_ids: typing.Optional[typing.List[int]] = None,
        show_deleted: bool = False,
        page_nb: int = 0,
        size: int = 10,
    ) -> WorkspaceSearchResponse:
        search = Search(
            using=self.es,
            doc_type=IndexedWorkspace,
            index=self._get_index_parameters(IndexedWorkspace).alias,
        )

        fields = [
            "label.{}^5".format(EXACT_FIELD),
            "label^3",
            "description^3",
        ]
        search_fields = search_fields or DEFAULT_WORKSPACE_SEARCH_FIELDS
        fields = [field for field in fields if name_starts_with_any_prefix(field, search_fields)]

        known_workspace_ids = [ws.workspace_id for ws in self._get_workspaces_known_to_user()]
        search = search.query("simple_query_string", query=search_string, fields=fields)
        search = search.filter("terms", workspace_id=known_workspace_ids)
        if member_ids:
            search = search.filter("terms", member_ids=member_ids)
        if not show_deleted:
            search = search.exclude("term", is_deleted=True)
        if size:
            search = search.extra(size=size)
        if page_nb:
            search = search.extra(from_=self.offset_from_pagination(size, page_nb))
        search.aggs.bucket("member_ids", "terms", field="member_ids")
        response = search.execute()
        known_users = UserApi(
            current_user=None, session=self._session, config=self._config
        ).get_all_known_users(self._user.user_id)
        facets = {
            "members": self._create_filtered_facets(
                "user_id", response.aggregations.member_ids.buckets, known_users
            )
        }

        return WorkspaceSearchResponse(response["hits"], facets)

    @staticmethod
    def _create_filtered_facets(
        attr_name: str, buckets: typing.List[Bucket], items: typing.List[T]
    ) -> typing.List[FacetCount]:
        """Filter the given ES aggregation buckets and create facets from the result.

        Only keep buckets whose key equals an item's attr_name.
        """
        facets = []
        for bucket in buckets:
            try:
                item = next(i for i in items if getattr(i, attr_name) == bucket.key)
                facets.append(FacetCount(value=item, count=bucket.doc_count))
            except StopIteration:
                pass
        return facets

    @staticmethod
    def _get_index_name(parameters: IndexParameters) -> str:
        return parameters.index_name_template.format(
            date=datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
        )

    @staticmethod
    def _get_index_pattern(parameters: IndexParameters) -> str:
        return parameters.index_name_template.format(date="*")

    def _get_indices_parameters(self) -> typing.List[IndexParameters]:
        prefix = self._config.SEARCH__ELASTICSEARCH__INDEX_ALIAS_PREFIX
        template = self._config.SEARCH__ELASTICSEARCH__INDEX_PATTERN_TEMPLATE

        return [
            IndexParameters(
                alias=prefix + "-content",
                index_name_template=template.format(index_alias=prefix + "-content", date="{date}"),
                document_class=IndexedContent,
                indexer=ESContentIndexer(),
            ),
            IndexParameters(
                alias=prefix + "-user",
                index_name_template=template.format(index_alias=prefix + "-user", date="{date}"),
                document_class=self.IndexedUser,
                indexer=ESUserIndexer(),
            ),
            IndexParameters(
                alias=prefix + "-workspace",
                index_name_template=template.format(
                    index_alias=prefix + "-workspace", date="{date}"
                ),
                document_class=IndexedWorkspace,
                indexer=ESWorkspaceIndexer(),
            ),
        ]

    def _get_index_parameters(self, document_class: typing.Type[Document]) -> IndexParameters:
        return next(
            parameters
            for parameters in self._get_indices_parameters()
            if parameters.document_class == document_class
        )

    @classmethod
    def test_lang(cls, lang):
        return "ctx.{source}.language == '{lang}'".format(
            source=FILE_PIPELINE_DESTINATION_FIELD, lang=lang
        )

    def _create_ingest_pipeline(self) -> None:
        """
        Create ingest pipeline to allow extract file content and use them for search.
        """
        p = IngestClient(self.es)

        processors = [
            {
                "attachment": {
                    "field": FILE_PIPELINE_SOURCE_FIELD,
                    "target_field": FILE_PIPELINE_DESTINATION_FIELD,
                }
            },
            {"remove": {"field": FILE_PIPELINE_SOURCE_FIELD}},
        ]

        for lang in FILE_PIPELINE_LANGS:
            processors.append(
                {
                    "set": {
                        "if": self.test_lang(lang),
                        "field": "{source}.content_{lang}".format(
                            source=FILE_PIPELINE_DESTINATION_FIELD, lang=lang
                        ),
                        "value": "{{" + "{}.content".format(FILE_PIPELINE_DESTINATION_FIELD) + "}}",
                    }
                }
            )

        processors.append(
            {
                "remove": {
                    "if": " || ".join(self.test_lang(lang) for lang in FILE_PIPELINE_LANGS),
                    "field": "{}.content".format(FILE_PIPELINE_DESTINATION_FIELD),
                }
            }
        )

        p.put_pipeline(
            id=FILE_PIPELINE_ID,
            body={"description": "Extract attachment information", "processors": processors},
        )

    def _get_workspaces_known_to_user(self) -> typing.List[Workspace]:
        wapi = WorkspaceApi(current_user=None, session=self._session, config=self._config)
        return wapi.get_all_accessible_by_user(self._user) + wapi.get_all_for_user(self._user)


class ESContentIndexer:
    """Listen for events from database and trigger re-indexing of contents when needed."""

    # content types which won't be indexed directly. Instead their main content will be indexed
    # when they are created/modified.
    EXCLUDED_CONTENT_TYPES = (content_type_list.Comment.slug,)

    @hookimpl
    def on_content_created(self, content: Content, context: TracimContext) -> None:
        """Index the given content"""
        content = self._get_main_content(content)
        try:
            search_api = ESSearchApi(
                session=context.dbsession, config=context.app_config, current_user=None
            )
            search_api.index_content(content)
        except Exception:
            logger.exception(
                self, "Exception while indexing created content {}".format(content.content_id)
            )

    @hookimpl
    def on_content_modified(self, content: Content, context: TracimContext) -> None:
        """Index the given content and its children.

        Children are indexed only if the content has changes influencing their index."""
        content = self._get_main_content(content)
        search_api = ESSearchApi(
            session=context.dbsession, config=context.app_config, current_user=None
        )
        try:
            search_api.index_content(content)
            if self._should_reindex_children(content.current_revision):
                search_api.index_contents(
                    self._filter_excluded_content_types(content.recursive_children)
                )

        except Exception:
            logger.exception(
                self, "Exception while indexing modified content {}".format(content.content_id)
            )

    @hookimpl
    def on_workspace_modified(self, workspace: Workspace, context: TracimContext) -> None:
        """Index the contents of the given workspace

        Contents are indexed only if the workspace has changes influencing their index."""
        if not self._should_reindex_children(workspace):
            return
        search_api = ESSearchApi(
            session=context.dbsession, config=context.app_config, current_user=None
        )
        content_api = ContentApi(
            session=context.dbsession,
            current_user=None,
            config=context.app_config,
            show_deleted=True,
            show_archived=True,
        )
        try:
            search_api.index_contents(
                self._filter_excluded_content_types(content_api.get_all_query(workspace=workspace))
            )
        except Exception:
            logger.exception(
                self,
                "Exception while indexing modified contents of workspace {}".format(
                    workspace.workspace_id
                ),
            )

    @hookimpl
    def on_user_modified(self, user: User, context: TracimContext) -> None:
        """Index contents whose author/last_modifier is the given user.

        'author' is the author/owner of a content's first revision.
        """
        if not inspect(user).attrs.display_name.history.has_changes():
            return
        search_api = ESSearchApi(
            session=context.dbsession, config=context.app_config, current_user=None
        )
        content_api = ContentApi(
            session=context.dbsession,
            current_user=None,
            config=context.app_config,
            show_deleted=True,
            show_archived=True,
        )
        try:
            search_api.index_contents(content_api.get_all_query(user=user))
        except Exception:
            logger.exception(
                self,
                "Exception while indexing contents authored/modified by user {}".format(
                    user.user_id
                ),
            )

    @classmethod
    def _get_main_content(cls, content: Content) -> Content:
        """Find the first ancestor which has a type to be indexed."""
        while content and content.type in cls.EXCLUDED_CONTENT_TYPES:
            content = content.parent
        assert content, "Got a sub-content without main content!"
        return content

    @classmethod
    def _should_reindex_children(cls, obj: typing.Union[ContentRevisionRO, Workspace]) -> bool:
        """Changes on a content/workspace only have effect on their children if:
        - their 'label' has changed
        - their 'is_deleted' state has changed
        - (for contents) their 'is_archived' state has changed
        """
        attribute_state = inspect(obj).attrs
        return (
            attribute_state.label.history.has_changes()
            or attribute_state.is_deleted.history.has_changes()
            or (isinstance(obj, Content) and attribute_state.is_archived.history.has_changes())
        )

    @classmethod
    def _filter_excluded_content_types(
        cls, contents: typing.Iterable[Content]
    ) -> typing.Generator[Content, None, None]:
        """Generate the contents which should be indexed directly."""
        for content in contents:
            if content.type not in cls.EXCLUDED_CONTENT_TYPES:
                yield content


class ESUserIndexer:
    """Listen for events from database and trigger re-indexing of users when needed."""

    @hookimpl
    def on_user_created(self, user: User, context: TracimContext) -> None:
        self._index_user(user, context)

    @hookimpl
    def on_user_modified(self, user: User, context: TracimContext) -> None:
        self._index_user(user, context)

    @hookimpl
    def on_user_deleted(self, user: User, context: TracimContext) -> None:
        search_api = ESSearchApi(
            session=context.dbsession, config=context.app_config, current_user=None
        )
        try:
            search_api.delete_user(user)
        except Exception:
            logger.exception(self, "Exception while deleting indexed user {}".format(user.user_id))

    @hookimpl
    def on_content_created(self, content: Content, context: TracimContext) -> None:
        self._index_user(content.current_revision.owner, context)

    @hookimpl
    def on_content_modified(self, content: Content, context: TracimContext) -> None:
        self._index_user(content.current_revision.owner, context)

    @hookimpl
    def on_user_role_in_workspace_created(
        self, role: UserRoleInWorkspace, context: TracimContext,
    ) -> None:
        self._index_user(role.user, context)

    @hookimpl
    def on_user_role_in_workspace_modified(
        self, role: UserRoleInWorkspace, context: TracimContext,
    ) -> None:
        self._index_user(role.user, context)

    @hookimpl
    def on_user_role_in_workspace_deleted(
        self, role: UserRoleInWorkspace, context: TracimContext,
    ) -> None:
        self._index_user(role.user, context)

    def _index_user(self, user: User, context: TracimContext) -> None:
        search_api = ESSearchApi(
            session=context.dbsession, config=context.app_config, current_user=None
        )
        try:
            search_api.index_user(user)
        except Exception:
            logger.exception(self, "Exception while indexing user {}".format(user.user_id))


class ESWorkspaceIndexer:
    """Listen for events from database and trigger re-indexing of workspaces when needed."""

    @hookimpl
    def on_workspace_created(self, workspace: Workspace, context: TracimContext) -> None:
        self._index_workspace(workspace, context)

    @hookimpl
    def on_workspace_modified(self, workspace: Workspace, context: TracimContext) -> None:
        self._index_workspace(workspace, context)

    @hookimpl
    def on_workspace_deleted(self, workspace: Workspace, context: TracimContext) -> None:
        search_api = ESSearchApi(
            session=context.dbsession, config=context.app_config, current_user=None
        )
        try:
            search_api.delete_workspace(workspace)
        except Exception:
            msg = "Exception while deleting indexed workspace {}".format(workspace.workspace_id)
            logger.exception(self, msg)

    @hookimpl
    def on_user_role_in_workspace_created(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        self._index_workspace(role.workspace, context)

    @hookimpl
    def on_user_role_in_workspace_modified(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        self._index_workspace(role.workspace, context)

    @hookimpl
    def on_user_role_in_workspace_deleted(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        self._index_workspace(role.workspace, context)

    def _index_workspace(self, workspace: Workspace, context: TracimContext) -> None:
        search_api = ESSearchApi(
            session=context.dbsession, config=context.app_config, current_user=None
        )
        try:
            search_api.index_workspace(workspace)
        except Exception:
            msg = "Exception while indexing workspace {}".format(workspace.workspace_id)
            logger.exception(self, msg)

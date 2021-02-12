from datetime import datetime
import typing

from elasticsearch import Elasticsearch
from elasticsearch import RequestError
from elasticsearch.client import IngestClient
from elasticsearch_dsl import Document
from elasticsearch_dsl import Search
from sqlalchemy.orm import Session

from tracim_backend import CFG
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.lib.search.elasticsearch_search.es_models import DigestComments
from tracim_backend.lib.search.elasticsearch_search.es_models import DigestContent
from tracim_backend.lib.search.elasticsearch_search.es_models import DigestUser
from tracim_backend.lib.search.elasticsearch_search.es_models import DigestWorkspace
from tracim_backend.lib.search.elasticsearch_search.es_models import IndexedContent
from tracim_backend.lib.search.elasticsearch_search.es_models import IndexedUser
from tracim_backend.lib.search.elasticsearch_search.es_models import IndexedWorkspace
from tracim_backend.lib.search.elasticsearch_search.models import ESContentSearchResponse
from tracim_backend.lib.search.models import ContentSearchResponse
from tracim_backend.lib.search.models import EmptyContentSearchResponse
from tracim_backend.lib.search.search import SearchApi
from tracim_backend.lib.search.search_factory import ELASTICSEARCH__SEARCH_ENGINE_SLUG
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.views.search_api.schema import SearchFilterQuerySchema


class AdvancedSearchParameters:
    def __init__(
        self,
        workspace_names: typing.Optional[typing.List[str]] = None,
        author_public_names: typing.Optional[typing.List[str]] = None,
        last_modifier_public_names: typing.Optional[typing.List[str]] = None,
        file_extensions: typing.Optional[typing.List[str]] = None,
        search_fields: typing.Optional[typing.List[str]] = (
            "label",
            "raw_content",
            "comments",
            "description",
        ),
        statuses: typing.Optional[typing.List[str]] = None,
        created_from: typing.Optional[datetime] = None,
        created_to: typing.Optional[datetime] = None,
        updated_from: typing.Optional[datetime] = None,
        updated_to: typing.Optional[datetime] = None,
    ):
        self.workspace_names = workspace_names
        self.author_public_names = author_public_names
        self.last_modifier_public_names = last_modifier_public_names
        self.file_extensions = file_extensions
        self.search_fields = search_fields
        self.statuses = statuses
        self.created_from = created_from
        self.created_to = created_to
        self.updated_from = updated_from
        self.updated_to = updated_to


class IndexParameters:
    def __init__(
        self, alias: str, document_class: typing.Type[Document], index_name_template: str
    ) -> None:
        self.alias = alias
        self.document_class = document_class
        self.index_name_template = index_name_template


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
        refresh index to obtain up to date information instead of relying on
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
            self.es.indices.delete_template(parameters.alias)

    def migrate_indices(self) -> None:
        """
        Upgrade function that creates a new index for the data and re-index
        the previous copy of the data into the new index.

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

    def index_content(self, content: ContentInContext) -> None:
        """
        Index/update a content into elastic_search engine
        """
        if content.content_type == content_type_list.Comment.slug:
            content = content.parent
            # INFO - G.M - 2019-05-20 - we currently do not support comment without parent
            assert content
        logger.info(self, "Indexing content {}".format(content.content_id))
        author = DigestUser(user_id=content.author.user_id, public_name=content.author.public_name)
        last_modifier = DigestUser(
            user_id=content.last_modifier.user_id, public_name=content.last_modifier.public_name
        )
        workspace = DigestWorkspace(
            workspace_id=content.workspace.workspace_id, label=content.workspace.label
        )
        parents = []
        parent = None
        if content.parent:
            parent = DigestContent(
                content_id=content.parent.content_id,
                parent_id=content.parent.parent_id,
                label=content.parent.label,
                slug=content.parent.slug,
                content_type=content.parent.content_type,
            )
            for parent_ in content.parents:
                digest_parent = DigestContent(
                    content_id=parent_.content_id,
                    parent_id=parent_.parent_id,
                    label=parent_.label,
                    slug=parent_.slug,
                    content_type=parent_.content_type,
                )
                parents.append(digest_parent)
        comments = []
        for comment in content.comments:
            digest_comment = DigestComments(
                content_id=comment.content_id,
                parent_id=comment.parent_id,
                content_type=comment.content_type,
                raw_content=comment.raw_content,
            )
            comments.append(digest_comment)
        indexed_content = IndexedContent(
            content_id=content.content_id,
            label=content.label,
            slug=content.slug,
            status=content.status,
            workspace_id=content.workspace_id,
            workspace=workspace,
            parent_id=content.parent_id or None,
            parent=parent,
            parents=parents or None,
            author=author,
            comments=comments or None,
            last_modifier=last_modifier,
            content_type=content.content_type,
            sub_content_types=content.sub_content_types,
            is_deleted=content.is_deleted,
            deleted_through_parent_id=content.deleted_through_parent_id,
            is_archived=content.is_archived,
            archived_through_parent_id=content.archived_through_parent_id,
            is_editable=content.is_editable,
            is_active=content.is_active,
            show_in_ui=content.show_in_ui,
            file_extension=content.file_extension,
            filename=content.filename,
            modified=content.modified,
            created=content.created,
            raw_content=content.raw_content,
            current_revision_id=content.current_revision_id,
        )
        indexed_content.meta.id = content.content_id
        content_index_alias = self._get_index_parameters(IndexedContent).alias
        if self._can_index_content(content):
            file_ = content.get_b64_file()
            if file_:
                indexed_content.b64_file = file_
                indexed_content.save(
                    using=self.es,
                    pipeline="attachment",
                    index=content_index_alias,
                    request_timeout=self._config.SEARCH__ELASTICSEARCH__REQUEST_TIMEOUT,
                )
                return
            logger.debug(
                self,
                'Skip binary content file of content "{}": no binary content'.format(
                    content.content_id
                ),
            )
        indexed_content.save(
            using=self.es,
            index=content_index_alias,
            request_timeout=self._config.SEARCH__ELASTICSEARCH__REQUEST_TIMEOUT,
        )

    def _can_index_content(self, content: ContentInContext) -> bool:
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
    def create_es_range(cls, range_from, range_to):
        # simple date/number facet (no histogram)
        if range_from and range_to:
            return {"gte": range_from, "lte": range_to}

        if range_from:
            return {"gte", range_from}

        if range_to:
            return {"lte", range_to}

        return None

    def search_content(
        self,
        simple_parameters: SearchFilterQuerySchema,
        advanced_parameters: typing.Optional[AdvancedSearchParameters] = None,
    ) -> ContentSearchResponse:
        """
        Search content into elastic search server:
        - do no show archived/deleted content by default
        - filter content found according to workspace of current_user
        """
        if not simple_parameters.search_string:
            return EmptyContentSearchResponse()
        filtered_workspace_ids = self._get_user_workspaces_id(min_role=UserRoleInWorkspace.READER)
        # INFO - G.M - 2019-05-31 - search using simple_query_string, which means user-friendly
        # syntax to match complex case,
        # see https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-simple-query-string-query.html
        es_search_fields = []

        if advanced_parameters:
            if "label" in advanced_parameters.search_fields:
                # TODO : we may want to split exact and not exact search to allow doing exact search efficiently.
                es_search_fields.extend(
                    ["label.exact^8", "label^5", "filename.exact", "filename", "file_extension"]
                )
            if "raw_content" in advanced_parameters.search_fields:
                es_search_fields.extend(
                    [
                        "raw_content.exact^3",
                        "raw_content^3",
                        "file_data.content^3",
                        "file_data.title^4",
                        "file_data.author",
                        "file_data.keywords",
                    ]
                )
            if "comments" in advanced_parameters.search_fields:
                es_search_fields.extend(["comments.raw_content.exact", "comments.raw_content"])

        search = Search(
            using=self.es,
            doc_type=IndexedContent,
            index=self._get_index_parameters(IndexedContent).alias,
        ).query(
            "simple_query_string",
            query=simple_parameters.search_string,
            # INFO - G.M - 2019-05-31 - "^5" means x5 boost on field, this will reorder result and
            # change score according to this boost. label is the most important, content is
            # important too, content of comment is less important. filename and file_extension is
            # only useful to allow matching "png" or "nameofmycontent.png".
            fields=es_search_fields,
        )

        # INFO - G.M - 2019-05-14 - do not show deleted or archived content by default
        if not simple_parameters.show_active:
            search = search.exclude("term", is_active=True)

        if not simple_parameters.show_deleted:
            search = search.exclude("term", is_deleted=True)
            search = search.filter("term", deleted_through_parent_id=0)

        if not simple_parameters.show_archived:
            search = search.exclude("term", is_archived=True)
            search = search.filter("term", archived_through_parent_id=0)

        search = search.response_class(ESContentSearchResponse)
        # INFO - G.M - 2019-05-21 - remove raw content of content of result in elasticsearch
        # result, because we do not need them and for performance reasons.
        search = search.source(exclude=["raw_content", "*.raw_content", "file_data.*", "file"])
        # INFO - G.M - 2019-05-16 - None is different than empty list here, None mean we can
        # return all workspaces content, empty list mean return nothing.

        if simple_parameters.size:
            search = search.extra(size=simple_parameters.size)

        if simple_parameters.page_nb:
            search = search.extra(
                from_=self.offset_from_pagination(simple_parameters.size, simple_parameters.page_nb)
            )

        if simple_parameters.filtered_workspace_ids is not None:
            search = search.filter("terms", workspace_id=filtered_workspace_ids)

        # Simple Facets:
        # TODO: do refactor to simplify the code
        if simple_parameters.content_types:
            search = search.filter("terms", content_type=simple_parameters.content_types)
        search.aggs.bucket("content_types", "terms", field="content_type")

        if advanced_parameters:
            if advanced_parameters.workspace_names:
                search = search.filter(
                    "terms", workspace__label__exact=advanced_parameters.workspace_names
                )
            search.aggs.bucket("workspace_names", "terms", field="workspace.label.exact")

            if advanced_parameters.author_public_names:
                search = search.filter(
                    "terms", author__public_name__exact=advanced_parameters.author_public_names
                )

            search.aggs.bucket("author__public_names", "terms", field="author.public_name.exact")
            if advanced_parameters.last_modifier_public_names:
                search = search.filter(
                    "terms",
                    last_modifier_public_names__exact=advanced_parameters.last_modifier_public_names,
                )
            search.aggs.bucket(
                "last_modifier__public_names", "terms", field="last_modifier.public_name.exact"
            )

            if advanced_parameters.file_extensions:
                search = search.filter("terms", file_extension=advanced_parameters.file_extensions)
            search.aggs.bucket("file_extensions", "terms", field="file_extension.exact")

            if advanced_parameters.statuses:
                search = search.filter("terms", status=advanced_parameters.statuses)
            search.aggs.bucket("statuses", "terms", field="status")

            created_range = self.create_es_range(
                advanced_parameters.created_from, advanced_parameters.created_to
            )

            if created_range:
                search = search.filter("range", created=created_range)

            modified_range = self.create_es_range(
                advanced_parameters.modified_from, advanced_parameters.modified_to
            )

            if modified_range:
                search = search.filter("range", modified=modified_range)

        # possible to use aggregate histogram with just one bucket here?
        search.aggs.metric("created_from", "min", field="created")
        search.aggs.metric("created_to", "max", field="created")
        search.aggs.metric("modified_from", "min", field="modified")
        search.aggs.metric("modified_to", "max", field="modified")

        res = search.execute()
        return res

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
            ),
            IndexParameters(
                alias=prefix + "-user",
                index_name_template=template.format(index_alias=prefix + "-user", date="{date}"),
                document_class=IndexedUser,
            ),
            IndexParameters(
                alias=prefix + "-workspace",
                index_name_template=template.format(
                    index_alias=prefix + "-workspace", date="{date}"
                ),
                document_class=IndexedWorkspace,
            ),
        ]

    def _get_index_parameters(self, document_class: typing.Type[Document]) -> IndexParameters:
        return next(
            parameters
            for parameters in self._get_indices_parameters()
            if parameters.document_class == document_class
        )

    def _create_ingest_pipeline(self) -> None:
        """
        Create ingest pipeline to allow extract file content and use them for search.
        """
        p = IngestClient(self.es)
        # TODO - G.M - 2019-05-31 - check if possible to set specific analyzer for
        # attachment content parameters. Goal :
        # allow ngram or lang specific indexing for "in file search"
        p.put_pipeline(
            id="attachment",
            body={
                "description": "Extract attachment information",
                "processors": [
                    {"attachment": {"field": "b64_file", "target_field": "file_data"}},
                    {"remove": {"field": "b64_file"}},
                ],
            },
        )

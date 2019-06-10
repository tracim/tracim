from abc import ABC
from abc import abstractmethod
from datetime import datetime
import typing

from elasticsearch import Elasticsearch
from elasticsearch.client import IngestClient
from elasticsearch_dsl import Search
from sqlalchemy.orm import Session

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.lib.core.content import SEARCH_DEFAULT_RESULT_NB
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.search.models import ContentSearchResponse
from tracim_backend.lib.search.models import EmptyContentSearchResponse
from tracim_backend.lib.search.models import ESContentSearchResponse
from tracim_backend.lib.search.models import SimpleContentSearchResponse
from tracim_backend.lib.search.search_factory import ELASTICSEARCH__SEARCH_ENGINE_SLUG
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.data import UserRoleInWorkspace


class SearchApi(ABC):
    def __init__(self, session: Session, current_user: typing.Optional[User], config: CFG) -> None:
        self._user = current_user
        self._session = session
        self._config = config

    @abstractmethod
    def create_index(self) -> None:
        pass

    @abstractmethod
    def migrate_index(self, move_data=True, update_alias=True) -> None:
        pass

    @abstractmethod
    def delete_index(self) -> None:
        pass

    @abstractmethod
    def index_content(self, content: ContentInContext):
        pass

    def index_all_content(self) -> None:
        """
        Index/update all content in current index of ElasticSearch
        """
        content_api = ContentApi(
            session=self._session,
            config=self._config,
            current_user=self._user,
            show_archived=True,
            show_active=True,
            show_deleted=True,
        )
        contents = content_api.get_all()
        for content in contents:
            content_in_context = ContentInContext(
                content, config=self._config, dbsession=self._session
            )
            self.index_content(content_in_context)

    def _get_user_workspaces_id(self, min_role: int) -> typing.Optional[typing.List[int]]:
        """
        Get user workspace list or None if no user set
        """
        if self._user:
            rapi = RoleApi(config=self._config, session=self._session, current_user=self._user)
            return rapi.get_user_workspaces_ids(self._user.user_id, min_role)
        return None

    def offset_from_pagination(self, size: int, page_nb: int) -> int:
        """
        Simple method to get an offset value from size and page_nb value
        """
        assert page_nb > 0
        return (page_nb - 1) * size


class SimpleSearchApi(SearchApi):
    """
    Simple search using sql:
    - Do not index anything.
    - allow pagination and filtering by content_type, deleted, archived
    - limited feature (no ranking, no search into content, etc...)
    """

    def create_index(self):
        pass

    def migrate_index(self, move_data=True, update_alias=True):
        pass

    def delete_index(self):
        pass

    def index_content(self, content: ContentInContext):
        pass

    def search_content(
        self,
        search_string: str,
        size: typing.Optional[int] = SEARCH_DEFAULT_RESULT_NB,
        page_nb: typing.Optional[int] = 1,
        content_types: typing.Optional[typing.List[str]] = None,
        show_deleted: bool = False,
        show_archived: bool = False,
        show_active: bool = True,
    ) -> ContentSearchResponse:
        """
        Search content with sql
        - do no show archived/deleted content by default
        - filter content found according to workspace of current_user
        """
        if not search_string:
            return EmptyContentSearchResponse()
        content_api = ContentApi(
            session=self._session,
            current_user=self._user,
            config=self._config,
            show_deleted=show_deleted,
            show_archived=show_archived,
            show_active=show_active,
        )
        total_hits = 0
        keywords = content_api.get_keywords(search_string)
        offset = self.offset_from_pagination(size, page_nb)
        content_list, total_hits = content_api.search(
            keywords=keywords, size=size, offset=offset, content_types=content_types
        )
        content_in_context_list = []
        for content in content_list:
            content_in_context_list.append(content_api.get_content_in_context(content))
        return SimpleContentSearchResponse(content_in_context_list, total_hits)


class ESSearchApi(SearchApi):
    """
    Search using ElasticSearch :
    - need indexing content first
    - allow pagination and filtering by content_type, deleted, archived
    - support ranking
    - search in content file for html-doc and thread
    - search in content file for file if ingest mode activated
    """

    def __init__(self, session: Session, current_user: typing.Optional[User], config: CFG) -> None:
        super().__init__(session, current_user, config)
        assert config.SEARCH__ENABLED
        assert config.SEARCH__ENGINE == ELASTICSEARCH__SEARCH_ENGINE_SLUG
        # TODO - G.M - 2019-05-31 - we do support only "one elasticsearch server case here in config,
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

    def create_index(self) -> None:
        """
        Create the index template in elasticsearch specifying the mappings and any
        settings to be used. This can be run at any time, ideally at every new code
        deploy
        """
        # FIXME BS 2019-06-10: Load ES model only when ES search (see #1892)
        from tracim_backend.lib.search.es_models import INDEX_DOCUMENTS_ALIAS
        from tracim_backend.lib.search.es_models import INDEX_DOCUMENTS_PATTERN
        from tracim_backend.lib.search.es_models import IndexedContent

        # INFO - G.M - 2019-05-15 - alias migration mecanism to allow easily updatable index.
        # from https://github.com/elastic/elasticsearch-dsl-py/blob/master/examples/alias_migration.py
        # Configure index with our indexing preferences
        logger.info(self, "Create index settings ...")
        if self._config.SEARCH__ELASTICSEARCH__USE_INGEST:
            self._create_ingest_pipeline()
        # create an index template
        index_template = IndexedContent._index.as_template(
            INDEX_DOCUMENTS_ALIAS, INDEX_DOCUMENTS_PATTERN
        )
        # upload the template into elasticsearch
        # potentially overriding the one already there
        index_template.save(using=self.es)

        # create the first index if it doesn't exist
        if not IndexedContent._index.exists(using=self.es):
            self.migrate_index(move_data=False)

        logger.info(self, "ES index is ready")

    def refresh_index(self) -> None:
        """
        refresh index to obtain up to odate information instead of relying on
        periodically refresh, usefull for automated tests
        see https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-refresh.html
        """
        # FIXME BS 2019-06-10: Load ES model only when ES search (see #1892)
        from tracim_backend.lib.search.es_models import INDEX_DOCUMENTS_ALIAS

        self.es.indices.refresh(INDEX_DOCUMENTS_ALIAS)

    def delete_index(self) -> None:
        # FIXME BS 2019-06-10: Load ES model only when ES search (see #1892)
        from tracim_backend.lib.search.es_models import INDEX_DOCUMENTS_ALIAS
        from tracim_backend.lib.search.es_models import INDEX_DOCUMENTS_PATTERN

        # TODO - G.M - 2019-05-31 - This code delete all index related to pattern, check if possible
        # to be more specific here.
        logger.info(self, "delete index with pattern {}".format(INDEX_DOCUMENTS_PATTERN))
        self.es.indices.delete(INDEX_DOCUMENTS_PATTERN, allow_no_indices=True)
        self.es.indices.delete_template(INDEX_DOCUMENTS_ALIAS)

    def migrate_index(self, move_data=True, update_alias=True) -> None:
        """
        Upgrade function that creates a new index for the data. Optionally it also can
        (and by default will) reindex previous copy of the data into the new index
        (specify ``move_data=False`` to skip this step) and update the alias to
        point to the latest index (set ``update_alias=False`` to skip).
        Note that while this function is running the application can still perform
        any and all searches without any loss of functionality. It should, however,
        not perform any writes at this time as those might be lost.
        """
        # FIXME BS 2019-06-10: Load ES model only when ES search (see #1892)
        from tracim_backend.lib.search.es_models import INDEX_DOCUMENTS_ALIAS
        from tracim_backend.lib.search.es_models import INDEX_DOCUMENTS_PATTERN
        from tracim_backend.lib.search.es_models import INDEX_DOCUMENTS_PATTERN_TEMPLATE

        # INFO - G.M - 2019-05-15 - alias migration mecanism to allow easily updatable index.
        # from https://github.com/elastic/elasticsearch-dsl-py/blob/master/examples/alias_migration.py
        # construct a new index name by appending current timestamp
        next_index = INDEX_DOCUMENTS_PATTERN_TEMPLATE.replace(
            "{index_alias}", INDEX_DOCUMENTS_ALIAS
        ).replace("{date}", datetime.now().strftime("%Y%m%d%H%M%S%f"))

        logger.info(self, 'create new index "{}"'.format(next_index))
        # create new index, it will use the settings from the template
        self.es.indices.create(index=next_index)

        if move_data:
            logger.info(
                self, 'reindex data from "{}" to "{}"'.format(INDEX_DOCUMENTS_ALIAS, next_index)
            )
            # move data from current alias to the new index
            self.es.reindex(
                body={"source": {"index": INDEX_DOCUMENTS_ALIAS}, "dest": {"index": next_index}},
                request_timeout=3600,
            )
            # refresh the index to make the changes visible
            self.es.indices.refresh(index=next_index)

        if update_alias:
            logger.info(
                self,
                'set alias "{}" to point on index "{}"'.format(INDEX_DOCUMENTS_ALIAS, next_index),
            )
            # repoint the alias to point to the newly created index
            self.es.indices.update_aliases(
                body={
                    "actions": [
                        {
                            "remove": {
                                "alias": INDEX_DOCUMENTS_ALIAS,
                                "index": INDEX_DOCUMENTS_PATTERN,
                            }
                        },
                        {"add": {"alias": INDEX_DOCUMENTS_ALIAS, "index": next_index}},
                    ]
                }
            )

    def index_content(self, content: ContentInContext) -> None:
        """
        Index/update a content into elastic_search engine
        """
        # FIXME BS 2019-06-10: Load ES model only when ES search (see #1892)
        from tracim_backend.lib.search.es_models import DigestComments
        from tracim_backend.lib.search.es_models import DigestContent
        from tracim_backend.lib.search.es_models import DigestUser
        from tracim_backend.lib.search.es_models import DigestWorkspace
        from tracim_backend.lib.search.es_models import IndexedContent

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
        if self._config.SEARCH__ELASTICSEARCH__USE_INGEST:
            if (
                not self._config.SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_WHITELIST
                or content.mimetype
                in self._config.SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_WHITELIST
            ):
                file_ = content.get_b64_file()
                if file_:
                    indexed_content.file = file_
                    indexed_content.save(using=self.es, pipeline="attachment")
                    return
        indexed_content.save(using=self.es)

    def search_content(
        self,
        search_string: str,
        size: typing.Optional[int],
        page_nb: typing.Optional[int],
        content_types: typing.Optional[typing.List[str]] = None,
        show_deleted: bool = False,
        show_archived: bool = False,
        show_active: bool = True,
    ) -> ContentSearchResponse:
        """
        Search content into elastic search server:
        - do no show archived/deleted content by default
        - filter content found according to workspace of current_user
        """
        # FIXME BS 2019-06-10: Load ES model only when ES search (see #1892)
        from tracim_backend.lib.search.es_models import IndexedContent

        if not search_string:
            return EmptyContentSearchResponse()
        filtered_workspace_ids = self._get_user_workspaces_id(min_role=UserRoleInWorkspace.READER)
        # INFO - G.M - 2019-05-31 - search using simple_query_string, which mean user-friendly
        # syntax to match complex case,
        # see https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-simple-query-string-query.html
        search = Search(using=self.es, doc_type=IndexedContent).query(
            "simple_query_string",
            query=search_string,
            # INFO - G.M - 2019-05-31 - "^5" means x5 boost on field, this will reorder result and
            # change score according to this boost. label is the most important, content is
            # important too, content of comment is less important. filename and file_extension is
            # only useful to allow matching "png" or "nameofmycontent.png".
            fields=[
                "label^5",
                "filename",
                "file_extension",
                "raw_content^3",
                "comments.raw_content",
                "attachment.content^3",
            ],
        )
        # INFO - G.M - 2019-05-14 - do not show deleted or archived content by default
        if not show_active:
            search = search.exclude("term", is_active=True)
        if not show_deleted:
            search = search.exclude("term", is_deleted=True)
            search = search.filter("term", deleted_through_parent_id=0)
        if not show_archived:
            search = search.exclude("term", is_archived=True)
            search = search.filter("term", archived_through_parent_id=0)
        search = search.response_class(ESContentSearchResponse)
        # INFO - G.M - 2019-05-21 - remove raw content of content of result in elasticsearch
        # result, because we do not need them and for performance reasons.
        search = search.source(exclude=["raw_content", "*.raw_content", "attachment.*", "file"])
        # INFO - G.M - 2019-05-16 - None is different than empty list here, None mean we can
        # return all workspaces content, empty list mean return nothing.
        if size:
            search = search.extra(size=size)
        if page_nb:
            search = search.extra(from_=self.offset_from_pagination(size, page_nb))
        if filtered_workspace_ids is not None:
            search = search.filter("terms", workspace_id=filtered_workspace_ids)
        if content_types:
            search = search.filter("terms", content_type=content_types)
        res = search.execute()
        return res

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
                "processors": [{"attachment": {"field": "file"}}],
            },
        )

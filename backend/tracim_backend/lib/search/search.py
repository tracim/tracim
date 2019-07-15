from abc import ABC
from abc import abstractmethod
from datetime import datetime
import re
import typing

from elasticsearch import Elasticsearch
from elasticsearch.client import IngestClient
from elasticsearch_dsl import Index
from elasticsearch_dsl import Search
from sqlalchemy import desc
from sqlalchemy import or_
from sqlalchemy.orm import Query
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
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
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace

SEARCH_SEPARATORS = ",| "
SEARCH_DEFAULT_RESULT_NB = 10


class IndexedContentsResults(object):
    def __init__(
        self, content_ids_to_index: typing.List[int], errored_indexed_content_ids: typing.List[int]
    ) -> None:
        self.content_ids_to_index = content_ids_to_index
        self.errored_indexed_contents_ids = errored_indexed_content_ids

    def get_nb_index_errors(self) -> int:
        """
        nb of content where indexation failed
        """
        return len(self.errored_indexed_contents_ids)

    def get_nb_content_correctly_indexed(self) -> int:
        """
        nb of contents where indexation success
        """
        return self.get_nb_contents_to_index() - self.get_nb_index_errors()

    def get_nb_contents_to_index(self) -> int:
        """
        Total of content to index
        """
        return len(self.content_ids_to_index)


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

    def index_all_content(self) -> IndexedContentsResults:
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
        content_ids_to_index = []  # type: typing.List[int]
        errored_indexed_contents_ids = []  # type: typing.List[int]
        for content in contents:
            content_in_context = ContentInContext(
                content, config=self._config, dbsession=self._session
            )
            content_ids_to_index.append(content_in_context.content_id)
            try:
                self.index_content(content_in_context)
            except ConnectionError as exc:
                logger.error(
                    self,
                    "connexion error issue with elasticsearch during indexing of content {}".format(
                        content_in_context.content_id
                    ),
                )
                logger.exception(self, exc)
                errored_indexed_contents_ids.append(content_in_context.content_id)
            except Exception as exc:
                logger.error(
                    self,
                    "something goes wrong during indexing of content {}".format(
                        content_in_context.content_id
                    ),
                )
                logger.exception(self, exc)
                errored_indexed_contents_ids.append(content_in_context.content_id)
        return IndexedContentsResults(content_ids_to_index, errored_indexed_contents_ids)

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

    def get_keywords(self, search_string, search_string_separators=None) -> typing.List[str]:
        """
        :param search_string: a list of coma-separated keywords
        :return: a list of str (each keyword = 1 entry
        """

        search_string_separators = search_string_separators or SEARCH_SEPARATORS

        keywords = []
        if search_string:
            keywords = [
                keyword.strip() for keyword in re.split(search_string_separators, search_string)
            ]

        return keywords

    def search(
        self,
        content_api: ContentApi,
        keywords: typing.List[str],
        size: typing.Optional[int] = SEARCH_DEFAULT_RESULT_NB,
        offset: typing.Optional[int] = None,
        content_types: typing.Optional[typing.List[str]] = None,
    ) -> SimpleContentSearchResponse:
        query = self._search_query(
            keywords=keywords, content_types=content_types, content_api=content_api
        )
        results = []
        current_offset = 0
        parsed_content_ids = []
        for content in query:
            if len(results) >= size:
                break
            if not content_api._show_deleted:
                if content_api.get_deleted_parent_id(content):
                    continue
            if not content_api._show_archived:
                if content_api.get_archived_parent_id(content):
                    continue
            if content.type == content_type_list.Comment.slug:
                # INFO - G.M - 2019-06-13 -  filter by content_types of parent for comment
                # if correct content_type, content is parent.
                if content.parent.type in content_types:
                    content = content.parent
                else:
                    continue
            if content.content_id in parsed_content_ids:
                # INFO - G.M - 2019-06-13 - avoid duplication of same content in result list
                continue
            if current_offset >= offset:
                results.append(content)
            parsed_content_ids.append(content.content_id)
            current_offset += 1

        content_in_context_list = []
        for content in results:
            content_in_context_list.append(content_api.get_content_in_context(content))
        return SimpleContentSearchResponse(
            content_list=content_in_context_list, total_hits=current_offset
        )

    def _search_query(
        self,
        keywords: typing.List[str],
        content_api: ContentApi,
        content_types: typing.Optional[typing.List[str]] = None,
    ) -> Query:
        """
        :return: a sorted list of Content items
        """

        if len(keywords) <= 0:
            return []

        filter_group_label = list(
            Content.label.ilike("%{}%".format(keyword)) for keyword in keywords
        )
        filter_group_filename = list(
            Content.file_name.ilike("%{}%".format(keyword)) for keyword in keywords
        )
        filter_group_description = list(
            Content.description.ilike("%{}%".format(keyword)) for keyword in keywords
        )
        title_keyworded_items = (
            content_api.get_base_query(None)
            .filter(or_(*(filter_group_label + filter_group_filename + filter_group_description)))
            .options(joinedload("children_revisions"))
            .options(joinedload("parent"))
            .order_by(desc(Content.updated), desc(Content.revision_id), desc(Content.content_id))
        )

        # INFO - G.M - 2019-06-13 - we add comment to content_types checked
        if content_types:
            searched_content_types = set(content_types + [content_type_list.Comment.slug])
            title_keyworded_items = title_keyworded_items.filter(
                Content.type.in_(searched_content_types)
            )

        return title_keyworded_items

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
        keywords = self.get_keywords(search_string)
        offset = self.offset_from_pagination(size, page_nb)
        return self.search(
            keywords=keywords,
            size=size,
            offset=offset,
            content_types=content_types,
            content_api=content_api,
        )


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
        self.index_document_pattern = config.SEARCH__ELASTICSEARCH__INDEX_PATTERN_TEMPLATE.format(
            date="*", index_alias=config.SEARCH__ELASTICSEARCH__INDEX_ALIAS
        )
        self.index_document_pattern_template = config.SEARCH__ELASTICSEARCH__INDEX_PATTERN_TEMPLATE
        self.index_document_alias = config.SEARCH__ELASTICSEARCH__INDEX_ALIAS

    def create_index(self) -> None:
        """
        Create the index template in elasticsearch specifying the mappings and any
        settings to be used. This can be run at any time, ideally at every new code
        deploy
        """
        # FIXME BS 2019-06-10: Load ES model only when ES search (see #1892)
        from tracim_backend.lib.search.es_models import IndexedContent

        # INFO - G.M - 2019-05-15 - alias migration mecanism to allow easily updatable index.
        # from https://github.com/elastic/elasticsearch-dsl-py/blob/master/examples/alias_migration.py
        # Configure index with our indexing preferences
        logger.info(self, "Create index settings ...")
        if self._config.SEARCH__ELASTICSEARCH__USE_INGEST:
            self._create_ingest_pipeline()
        # create an index template
        index_template = IndexedContent._index.as_template(
            self.index_document_alias, self.index_document_pattern
        )
        # upload the template into elasticsearch
        # potentially overriding the one already there
        index_template.save(using=self.es)

        # create the first index if it doesn't exist
        current_index = Index(self.index_document_alias)
        if not current_index.exists(using=self.es):
            self.migrate_index(move_data=False)

        logger.info(self, "ES index is ready")

    def refresh_index(self) -> None:
        """
        refresh index to obtain up to odate information instead of relying on
        periodically refresh, usefull for automated tests
        see https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-refresh.html
        """

        self.es.indices.refresh(self.index_document_alias)

    def delete_index(self) -> None:

        # TODO - G.M - 2019-05-31 - This code delete all index related to pattern, check if possible
        # to be more specific here.
        logger.info(self, "delete index with pattern {}".format(self.index_document_pattern))
        self.es.indices.delete(self.index_document_pattern, allow_no_indices=True)
        self.es.indices.delete_template(self.index_document_alias)

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
        # INFO - G.M - 2019-05-15 - alias migration mecanism to allow easily updatable index.
        # from https://github.com/elastic/elasticsearch-dsl-py/blob/master/examples/alias_migration.py
        # construct a new index name by appending current timestamp
        next_index = self.index_document_pattern_template.replace(
            "{index_alias}", self.index_document_alias
        ).replace("{date}", datetime.now().strftime("%Y%m%d%H%M%S%f"))

        logger.info(self, 'create new index "{}"'.format(next_index))
        # create new index, it will use the settings from the template
        self.es.indices.create(index=next_index)

        if move_data:
            logger.info(
                self, 'reindex data from "{}" to "{}"'.format(self.index_document_alias, next_index)
            )
            # move data from current alias to the new index
            self.es.reindex(
                body={
                    "source": {"index": self.index_document_alias},
                    "dest": {"index": next_index},
                },
                request_timeout=3600,
            )
            # refresh the index to make the changes visible
            self.es.indices.refresh(index=next_index)

        if update_alias:
            logger.info(
                self,
                'set alias "{}" to point on index "{}"'.format(
                    self.index_document_alias, next_index
                ),
            )
            # repoint the alias to point to the newly created index
            self.es.indices.update_aliases(
                body={
                    "actions": [
                        {
                            "remove": {
                                "alias": self.index_document_alias,
                                "index": self.index_document_pattern,
                            }
                        },
                        {"add": {"alias": self.index_document_alias, "index": next_index}},
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
        if self._can_index_content(content):
            file_ = content.get_b64_file()
            if file_:
                indexed_content.b64_file = file_
                indexed_content.save(
                    using=self.es,
                    pipeline="attachment",
                    index=self.index_document_alias,
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
            index=self.index_document_alias,
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
        search = Search(
            using=self.es, doc_type=IndexedContent, index=self.index_document_alias
        ).query(
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
                "file_data.content^3",
                "file_data.title^4",
                "file_data.author",
                "file_data.keywords",
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
        search = search.source(exclude=["raw_content", "*.raw_content", "file_data.*", "file"])
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
                "processors": [
                    {"attachment": {"field": "b64_file", "target_field": "file_data"}},
                    {"remove": {"field": "b64_file"}},
                ],
            },
        )

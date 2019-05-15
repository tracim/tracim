import typing

from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from sqlalchemy.orm import Session

from tracim_backend.config import CFG
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.search.es_models import INDEX_DOCUMENTS
from tracim_backend.lib.search.es_models import IndexedContent
from tracim_backend.lib.search.models import ContentSearchResponse
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import ContentInContext


class SearchApi(object):
    def __init__(self, session: Session, current_user: typing.Optional[User], config: CFG):
        assert config.SEARCH__ENABLED
        self._user = current_user
        self._session = session
        self._config = config
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

    def update_index(self):
        # Configure index with our indexing preferences
        logger.info(self, "Create and/or update index settings ...")
        # TODO - G.M - 2019-05-14 - Recheck this part, it's unclear that close, reopen is
        # a normal strategy to update index. Check if possible to do this better.
        index = IndexedContent._index
        if index.exists(using=self.es):
            index.close(using=self.es)
        IndexedContent.init(using=self.es)
        index.open(using=self.es)

        logger.info(self, "ES index is ready")

    def index_content(self, content: ContentInContext):
        logger.info(self, "Indexing content {}".format(content.content_id))
        indexed_content = IndexedContent(
            content_id=content.content_id,
            workspace_id=content.workspace_id,
            parent_id=content.parent_id,
            label=content.label,
            slug=content.slug,
            status=content.status,
            content_type=content.content_type,
            sub_content_types=content.sub_content_types,
            is_deleted=content.is_deleted,
            is_archived=content.is_archived,
            is_editable=content.is_editable,
            show_in_ui=content.show_in_ui,
            file_extension=content.file_extension,
            filename=content.filename,
            modified=content.modified,
            created=content.created,
            raw_content=content.raw_content,
        )
        indexed_content.meta.id = content.content_id
        indexed_content.save(using=self.es)

    def index_all_content(self):
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

    def search_content(self, search_string: str):
        # Add wildcard at end of each word (only at end for performances)
        search_string = " ".join(map(lambda w: w + "*", search_string.split(" ")))
        print("search for: {}".format(search_string))
        if search_string:
            search = Search(using=self.es, index=INDEX_DOCUMENTS).query(
                "query_string", query=search_string, fields=["title", "raw_content"]
            )
        else:
            search = Search(using=self.es, index=INDEX_DOCUMENTS).query("match_all")
        # INFO - G.M - 2019-05-14 - do not show deleted or archived content by default
        search = search.exclude("term", is_deleted=True).exclude("term", is_archived=True)
        search = search.response_class(ContentSearchResponse)
        res = search.execute()
        return res

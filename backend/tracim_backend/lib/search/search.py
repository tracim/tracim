from datetime import datetime
import typing

from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from sqlalchemy.orm import Session

from tracim_backend.config import CFG
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.search.es_models import INDEX_DOCUMENTS_ALIAS
from tracim_backend.lib.search.es_models import INDEX_DOCUMENTS_PATTERN
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

    def create_index_template(self):
        """
        Create the index template in elasticsearch specifying the mappings and any
        settings to be used. This can be run at any time, ideally at every new code
        deploy
        """
        # INFO - G.M - 2019-05-15 - alias migration mecanism to allow easily updatable index.
        # from https://github.com/elastic/elasticsearch-dsl-py/blob/master/examples/alias_migration.py
        # Configure index with our indexing preferences
        logger.info(self, "Create index settings ...")
        # create an index template
        index_template = IndexedContent._index.as_template(
            INDEX_DOCUMENTS_ALIAS, INDEX_DOCUMENTS_PATTERN
        )
        # upload the template into elasticsearch
        # potentially overriding the one already there
        index_template.save(using=self.es)

        # create the first index if it doesn't exist
        if not IndexedContent._index.exists(using=self.es):
            self.migrate(move_data=False)

        logger.info(self, "ES index is ready")

    def migrate(self, move_data=True, update_alias=True):
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
        next_index = INDEX_DOCUMENTS_PATTERN.replace("*", datetime.now().strftime("%Y%m%d%H%M%S%f"))

        print('create new index "{}"'.format(next_index))
        # create new index, it will use the settings from the template
        self.es.indices.create(index=next_index)

        if move_data:
            print('reindex data from "{}" to "{}"'.format(INDEX_DOCUMENTS_ALIAS, next_index))
            # move data from current alias to the new index
            self.es.reindex(
                body={"source": {"index": INDEX_DOCUMENTS_ALIAS}, "dest": {"index": next_index}},
                request_timeout=3600,
            )
            # refresh the index to make the changes visible
            self.es.indices.refresh(index=next_index)

        if update_alias:
            print('set alias "{}" to point on index "{}"'.format(INDEX_DOCUMENTS_ALIAS, next_index))
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

    def _get_user_workspaces_id(self, min_role: int) -> typing.List[int]:
        if self._user:
            rapi = RoleApi(config=self._config, session=self._session, current_user=self._user)
            return rapi.get_user_workspaces_ids(self._user.user_id, min_role)
        return None

    def search_content(self, search_string: str) -> ContentSearchResponse:
        filtered_workspace_ids = self._get_user_workspaces_id(min_role=UserRoleInWorkspace.READER)
        # Add wildcard at end of each word (only at end for performances)
        search_string = " ".join(map(lambda w: w + "*", search_string.split(" ")))
        if search_string:
            search = Search(using=self.es, index=INDEX_DOCUMENTS_ALIAS).query(
                "query_string", query=search_string, fields=["title", "raw_content"]
            )
        else:
            search = Search(using=self.es, index=INDEX_DOCUMENTS_ALIAS).query("match_all")
        # INFO - G.M - 2019-05-14 - do not show deleted or archived content by default
        search = search.exclude("term", is_deleted=True).exclude("term", is_archived=True)
        search = search.response_class(ContentSearchResponse)
        if filtered_workspace_ids is not None:
            search = search.filter("terms", workspace_id=filtered_workspace_ids)
        res = search.execute()
        return res

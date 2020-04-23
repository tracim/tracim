import re
import typing

from sqlalchemy import desc
from sqlalchemy import or_
from sqlalchemy.orm import Query
from sqlalchemy.orm import joinedload

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.search.models import ContentSearchResponse
from tracim_backend.lib.search.models import EmptyContentSearchResponse
from tracim_backend.lib.search.search import SearchApi
from tracim_backend.lib.search.simple_search.models import SimpleContentSearchResponse
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.data import Content

SEARCH_SEPARATORS = ",| "
SEARCH_DEFAULT_RESULT_NB = 10


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
            .order_by(
                desc(Content.updated), desc(Content.cached_revision_id), desc(Content.content_id)
            )
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

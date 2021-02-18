from datetime import datetime
import typing

from dateutil.parser import parse
from elasticsearch_dsl import Search
from elasticsearch_dsl.response import Response

from tracim_backend.lib.search.models import ContentSearchResponse
from tracim_backend.lib.search.models import FacetCount
from tracim_backend.lib.search.models import SearchedContent
from tracim_backend.lib.search.models import SearchedDigestComment
from tracim_backend.lib.search.models import SearchedDigestContent
from tracim_backend.lib.search.models import SearchedDigestUser
from tracim_backend.lib.search.models import SearchedDigestWorkspace
from tracim_backend.lib.search.models import SimpleFacets


def facet_count(aggregations: dict, field: str) -> typing.List[FacetCount]:
    """
    Builds a FacetCount object from an elasticsearch bucket aggregation result
    """

    facet = []
    for bucket in aggregations[field]["buckets"]:
        facet.append(FacetCount(value=bucket["key"], count=bucket["doc_count"]))
    return facet


def date_from_aggregation(aggregations: typing.Dict[str, typing.Any], field: str) -> datetime:
    try:
        return parse(aggregations[field]["value_as_string"])
    except KeyError:
        return None


class ESContentSearchResponse(ContentSearchResponse):
    """
    Response of search using LibSearch
    This is both an seriable content and a Custom Response object
    for elasticsearch search
    """

    def __init__(self, search: Search, response: Response) -> None:
        self._response = response
        self._search = search
        total_hits = self._response["hits"]["total"]["value"]
        is_total_hit_accurate = self._response["hits"]["total"]["relation"] == "eq"
        contents = []
        for hit in response["hits"]["hits"]:
            source = hit["_source"]
            try:
                comments = [
                    SearchedDigestComment(
                        content_id=comment["content_id"], parent_id=comment.get("parent_id")
                    )
                    for comment in source["comments"]
                ]
            except KeyError:
                comments = []
            path = [SearchedDigestContent(**component) for component in source["path"]]

            dict_workspace = source["workspace"]
            workspace = SearchedDigestWorkspace(
                workspace_id=dict_workspace["workspace_id"], label=dict_workspace["label"]
            )
            dict_last_modifier = source["last_modifier"]
            last_modifier = SearchedDigestUser(**dict_last_modifier)
            dict_author = source["author"]
            author = SearchedDigestUser(**dict_author)
            source.update(
                dict(
                    workspace=workspace,
                    author=author,
                    last_modifier=last_modifier,
                    comments=comments,
                    modified=parse(source["modified"]),
                    created=parse(source["created"]),
                    score=hit["_score"],
                    path=path,
                )
            )
            content = SearchedContent(**source)
            contents.append(content)

        aggregations = response["aggregations"]

        simple_facets = SimpleFacets(
            workspace_names=facet_count(aggregations, "workspace_names"),
            author__public_names=facet_count(aggregations, "author__public_names"),
            last_modifier__public_names=facet_count(aggregations, "last_modifier__public_names"),
            file_extensions=facet_count(aggregations, "file_extensions"),
            statuses=facet_count(aggregations, "statuses"),
            content_types=facet_count(aggregations, "content_types"),
            created_from=date_from_aggregation(aggregations, "created_from"),
            created_to=date_from_aggregation(aggregations, "created_to"),
            modified_from=date_from_aggregation(aggregations, "modified_from"),
            modified_to=date_from_aggregation(aggregations, "modified_to"),
        )

        super().__init__(
            contents=contents,
            total_hits=total_hits,
            is_total_hits_accurate=is_total_hit_accurate,
            simple_facets=simple_facets,
        )


class SearchedUser:
    def __init__(
        self,
        user_id: int,
        public_name: str,
        username: str,
        has_avatar: bool,
        has_cover: bool,
        newest_authored_content_date: datetime,
    ) -> None:
        self.user_id = user_id
        self.public_name = public_name
        self.username = username
        self.has_avatar = has_avatar
        self.has_cover = has_cover
        self.newest_authored_content_date = newest_authored_content_date


class DateRange:
    def __init__(self, from_: datetime, to: datetime) -> None:
        self.from_ = from_
        self.to = to


class UserSearchResponse:
    def __init__(
        self,
        hits: typing.Dict[str, typing.Any],
        facets: typing.Dict[str, typing.List[FacetCount]],
        search_fields: typing.List[str],
        newest_authored_content_date_from: datetime,
        newest_authored_content_date_to: datetime,
    ) -> None:
        self.users = [self._create_searched_user(hit) for hit in hits["hits"]]
        self.total_hits = hits["total"]["value"]
        self.is_total_hits_accurate = hits["total"]["relation"] == "eq"
        self.facets = facets
        self.newest_authored_content_range = DateRange(
            newest_authored_content_date_from, newest_authored_content_date_to
        )
        self.search_fields = search_fields

    @staticmethod
    def _create_searched_user(hit) -> SearchedUser:
        source = hit["_source"]
        try:
            username = source["username"]
        except KeyError:
            username = None
        try:
            newest_authored_content_date = source["newest_authored_content_date"]
        except KeyError:
            newest_authored_content_date = None
        return SearchedUser(
            user_id=source["user_id"],
            public_name=source["public_name"],
            username=username,
            has_avatar=source["has_avatar"],
            has_cover=source["has_cover"],
            newest_authored_content_date=newest_authored_content_date,
        )


class SearchedWorkspace:
    def __init__(
        self, workspace_id: int, label: str, access_type: str, member_count: int, content_count: int
    ) -> None:
        self.workspace_id = workspace_id
        self.label = label
        self.access_type = access_type
        self.member_count = member_count
        self.content_count = content_count


class WorkspaceSearchResponse:
    def __init__(
        self, hits: typing.Dict[str, typing.Any], member_facets: typing.List[FacetCount]
    ) -> None:
        self.users = [
            SearchedWorkspace(
                workspace_id=hit["_source"]["workspace_id"],
                label=hit["_source"]["label"],
                access_type=hit["_source"]["access_type"],
                member_count=hit["_source"]["member_count"],
                content_count=hit["_source"]["content_count"],
            )
            for hit in hits["hits"]
        ]
        self.total_hits = hits["total"]["value"]
        self.is_total_hits_accurate = hits["total"]["relation"] == "eq"
        self.simple_facets = {"members": member_facets}

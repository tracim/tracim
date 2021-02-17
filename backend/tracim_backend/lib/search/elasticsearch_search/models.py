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
        last_authored_content_revision_date: datetime,
    ) -> None:
        self.user_id = user_id
        self.public_name = public_name
        self.username = username
        self.has_avatar = has_avatar
        self.has_cover = has_cover
        self.last_authored_content_revision_date = last_authored_content_revision_date


class UserSearchResponse:
    def __init__(
        self,
        hits: typing.Dict[str, typing.Any],
        workspace_facets: typing.List[FacetCount],
        search_fields: typing.List[str],
        last_authored_content_revision_dates,
    ) -> None:
        self.users = [
            SearchedUser(
                user_id=user_dict["user_id"],
                public_name=user_dict["public_name"],
                username=user_dict["username"],
                has_avatar=user_dict["has_avatar"],
                has_cover=user_dict["has_cover"],
                last_authored_content_revision_date=user_dict[
                    "last_authored_content_revision_date"
                ],
            )
            for user_dict in hits["hits"]
        ]
        self.total_hits = hits["total"]["value"]
        self.is_total_hit_accurate = hits["total"]["relation"] == "eq"
        self.simple_facets = {"workspaces": workspace_facets}
        self.range_facets = {
            "last_authored_content_revision_dates": last_authored_content_revision_dates
        }
        self.search_fields = search_fields


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
                workspace_id=workspace_dict["workspace_id"],
                label=workspace_dict["label"],
                access_type=workspace_dict["access_type"],
                member_count=workspace_dict["member_count"],
                content_count=workspace_dict["content_count"],
            )
            for workspace_dict in hits["hits"]
        ]
        self.total_hits = hits["total"]["value"]
        self.is_total_hit_accurate = hits["total"]["relation"] == "eq"
        self.simple_facets = {"members": member_facets}

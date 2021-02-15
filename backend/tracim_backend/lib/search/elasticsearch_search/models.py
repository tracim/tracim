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
from tracim_backend.lib.search.models import SearchedWorkspace
from tracim_backend.lib.search.models import SimpleFacets


def facet_count(aggregations: dict, field: str) -> typing.List[FacetCount]:
    """
    Builds a FacetCount object from an elasticsearch bucket aggregation result
    """

    facet: typing.List[FacetCount] = []
    for bucket in aggregations[field]["buckets"]:
        facet.append(FacetCount(key=bucket["key"], count=bucket["doc_count"]))
    return facet


class ESContentSearchResponse(ContentSearchResponse):
    """
    Response of search using LibSearch
    This is both an seriable content and a Custom Response object
    for elasticsearch search
    """

    def __init__(self, search: Search, response: Response) -> None:
        # debug result here is the good idea
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
            workspace = SearchedWorkspace(
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
            created_from=parse(aggregations["created_from"]["value_as_string"]),
            created_to=parse(aggregations["created_to"]["value_as_string"]),
            modified_from=parse(aggregations["modified_from"]["value_as_string"]),
            modified_to=parse(aggregations["modified_to"]["value_as_string"]),
        )

        super().__init__(
            contents=contents,
            total_hits=total_hits,
            is_total_hits_accurate=is_total_hit_accurate,
            simple_facets=simple_facets,
        )

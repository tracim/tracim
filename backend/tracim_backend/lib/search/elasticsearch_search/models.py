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
            parent = None
            if source.get("parent"):
                dict_content = source["parent"]
                parent = SearchedDigestContent(
                    content_id=dict_content["content_id"],
                    parent_id=dict_content.get("parent_id"),
                    label=dict_content["label"],
                    slug=dict_content["slug"],
                    content_type=dict_content["content_type"],
                )
            parents = []
            if source.get("parents"):
                for parent in source["parents"]:
                    dict_content = parent
                    parent = SearchedDigestContent(
                        content_id=dict_content["content_id"],
                        parent_id=dict_content.get("parent_id"),
                        label=dict_content["label"],
                        slug=dict_content["slug"],
                        content_type=dict_content["content_type"],
                    )
                    parents.append(parent)
            comments = []
            if source.get("comments"):
                for comment in source["comments"]:
                    comment = SearchedDigestComment(
                        content_id=comment["content_id"], parent_id=comment.get("parent_id")
                    )
                    comments.append(comment)

            dict_workspace = source["workspace"]
            workspace = SearchedWorkspace(
                workspace_id=dict_workspace["workspace_id"], label=dict_workspace["label"]
            )
            dict_last_modifier = source["last_modifier"]
            last_modifier = SearchedDigestUser(
                user_id=dict_last_modifier["user_id"], public_name=dict_last_modifier["public_name"]
            )
            dict_author = source["author"]
            author = SearchedDigestUser(
                user_id=dict_author["user_id"], public_name=dict_author["public_name"]
            )
            content = SearchedContent(
                content_id=source["content_id"],
                label=source["label"],
                slug=source["slug"],
                status=source["status"],
                content_type=source["content_type"],
                workspace=workspace,
                workspace_id=source["workspace_id"],
                parent=parent,
                parent_id=source.get("parent_id"),
                parents=parents,
                comments=comments,
                author=author,
                last_modifier=last_modifier,
                sub_content_types=source["sub_content_types"],
                is_archived=source["is_archived"],
                is_deleted=source["is_deleted"],
                is_editable=source["is_editable"],
                is_active=source["is_active"],
                show_in_ui=source["show_in_ui"],
                file_extension=source["file_extension"],
                filename=source["filename"],
                modified=parse(source["modified"]),
                created=parse(source["created"]),
                score=hit["_score"],
                current_revision_id=source["current_revision_id"],
            )
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

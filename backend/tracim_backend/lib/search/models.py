from abc import ABC
from datetime import datetime
import typing

from dateutil.parser import parse
from elasticsearch_dsl import Search
from elasticsearch_dsl.response import Response

from tracim_backend.models.context_models import ContentInContext


class ContentSearchResponse(ABC):
    def __init__(
        self,
        contents: typing.List["SearchedContent"],
        total_hits: int = 0,
        is_total_hits_accurate=True,
    ):
        self.contents = contents
        self.total_hits = total_hits
        self.is_total_hits_accurate = is_total_hits_accurate


class EmptyContentSearchResponse(ContentSearchResponse):
    def __init__(self):
        super().__init__(contents=[], total_hits=0)


class SimpleContentSearchResponse(ContentSearchResponse):

    DEFAULT_SCORE = 1

    def __init__(self, content_list: typing.List[ContentInContext], total_hits: int):
        contents = []
        for content in content_list:
            parent = None
            parents = []
            if content.parent:
                parent = SearchedDigestContent(
                    content_id=content.parent.content_id,
                    parent_id=content.parent.parent_id,
                    label=content.parent.label,
                    slug=content.parent.slug,
                    content_type=content.parent.content_type,
                )
                for parent_ in content.parents:
                    digest_parent = SearchedDigestContent(
                        content_id=parent_.content_id,
                        parent_id=parent_.parent_id,
                        label=parent_.label,
                        slug=parent_.slug,
                        content_type=parent_.content_type,
                    )
                    parents.append(digest_parent)
            comments = []
            for comment in content.comments:
                digest_comment = SearchedDigestComment(
                    content_id=comment.content_id, parent_id=comment.parent_id
                )
                comments.append(digest_comment)

            workspace = SearchedWorkspace(
                workspace_id=content.workspace.workspace_id, label=content.workspace.label
            )
            last_modifier = SearchedDigestUser(
                user_id=content.last_modifier.user_id, public_name=content.last_modifier.public_name
            )
            author = SearchedDigestUser(
                user_id=content.author.user_id, public_name=content.author.public_name
            )
            content = SearchedContent(
                content_id=content.content_id,
                label=content.label,
                slug=content.slug,
                status=content.status,
                content_type=content.content_type,
                workspace=workspace,
                workspace_id=content.workspace_id,
                parent=parent,
                parent_id=content.parent_id,
                parents=parents,
                comments=comments,
                author=author,
                last_modifier=last_modifier,
                sub_content_types=content.sub_content_types,
                is_archived=content.is_archived,
                is_deleted=content.is_deleted,
                is_editable=content.is_editable,
                is_active=content.is_active,
                show_in_ui=content.show_in_ui,
                file_extension=content.file_extension,
                filename=content.filename,
                modified=content.modified,
                created=content.created,
                score=self.DEFAULT_SCORE,
                current_revision_id=content.current_revision_id,
            )
            contents.append(content)
        super().__init__(contents=contents, total_hits=total_hits, is_total_hits_accurate=False)


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
        super().__init__(
            contents=contents, total_hits=total_hits, is_total_hits_accurate=is_total_hit_accurate
        )


class SearchedDigestUser(object):
    def __init__(self, user_id: int, public_name: str) -> None:
        self.user_id = user_id
        self.public_name = public_name


class SearchedWorkspace(object):
    def __init__(self, workspace_id: int, label: str) -> None:
        self.workspace_id = workspace_id
        self.label = label


class SearchedDigestContent(object):
    def __init__(
        self, content_id: int, parent_id: int, label: str, slug: str, content_type: str
    ) -> None:
        self.content_id = content_id
        self.parent_id = parent_id
        self.label = label
        self.slug = slug
        self.content_type = content_type


class SearchedDigestComment(object):
    def __init__(self, content_id: int, parent_id: int) -> None:
        self.content_id = content_id
        self.parent_id = parent_id


class SearchedContent(object):
    """
    Content-Like object return by LibSearch.
    This class does not contain any logic, it's just needed to
    store data.
    """

    def __init__(
        self,
        content_id: int,
        label: str,
        slug: str,
        status: str,
        content_type: str,
        workspace: SearchedWorkspace,
        parent: SearchedDigestContent,
        parents: typing.List[SearchedDigestContent],
        comments: typing.List[SearchedDigestComment],
        author: SearchedDigestUser,
        last_modifier: SearchedDigestUser,
        sub_content_types: typing.List[str],
        is_archived: bool,
        is_deleted: bool,
        is_editable: bool,
        is_active: bool,
        show_in_ui: bool,
        file_extension: str,
        filename: str,
        modified: datetime,
        created: datetime,
        score: float,
        current_revision_id: int,
        workspace_id: int,
        parent_id: int,
    ) -> None:
        self.current_revision_id = current_revision_id
        self.content_id = content_id
        self.label = label
        self.slug = slug
        self.status = status
        self.content_type = content_type
        self.workspace = workspace
        self.parent = parent
        self.parent_id = parent_id
        self.workspace_id = workspace_id
        self.parents = parents
        self.comments = comments
        self.author = author
        self.last_modifier = last_modifier

        self.sub_content_types = sub_content_types
        self.is_archived = is_archived
        self.is_deleted = is_deleted
        self.is_editable = is_editable
        self.is_active = is_active
        self.show_in_ui = show_in_ui
        self.file_extension = file_extension
        self.filename = filename
        self.modified = modified
        self.created = created

        self.score = score

from datetime import datetime
import typing

from dateutil.parser import parse
from elasticsearch_dsl import Search
from elasticsearch_dsl.response import Response


class ContentSearchResponse(object):
    """
    Response of search using LibSearch
    This is both an seriable content and a Custom Response object
    for elasticsearch search
    """

    def __init__(self, search: Search, response: Response) -> None:
        self._response = response
        self._search = search
        self.contents = []
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
                        content_id=comment["content_id"],
                        parent_id=comment.get("parent_id"),
                        raw_content=comment["raw_content"],
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
                show_in_ui=source["show_in_ui"],
                file_extension=source["file_extension"],
                filename=source["filename"],
                modified=parse(source["modified"]),
                created=parse(source["created"]),
                raw_content=source["raw_content"],
                score=hit["_score"],
                current_revision_id=source["current_revision_id"],
            )
            self.contents.append(content)


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
    def __init__(self, content_id: int, parent_id: int, raw_content: str) -> None:
        self.content_id = content_id
        self.parent_id = parent_id
        self.raw_content = raw_content


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
        show_in_ui: bool,
        file_extension: str,
        filename: str,
        modified: datetime,
        created: datetime,
        raw_content: str,
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
        self.show_in_ui = show_in_ui
        self.file_extension = file_extension
        self.filename = filename
        self.modified = modified
        self.created = created

        self.raw_content = raw_content
        self.score = score

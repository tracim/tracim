import typing

from sqlalchemy import and_
from sqlalchemy.orm import Query
from sqlalchemy.orm.exc import NoResultFound

from tracim_backend.exceptions import TagAlreadyExistsError
from tracim_backend.exceptions import TagNotFound
from tracim_backend.models.data import Content
from tracim_backend.models.data import User
from tracim_backend.models.data import Workspace
from tracim_backend.models.tag import Tag
from tracim_backend.models.tag import TagOnContent
from tracim_backend.models.tracim_session import TracimSession


class TagLib:
    def __init__(self, session: TracimSession) -> None:
        self._session = session

    def _base_query(self):
        return self._session.query(Tag)

    def base_filter(
        self,
        query: Query,
        tag_id: typing.Optional[int] = None,
        content_id: typing.Optional[int] = None,
        workspace_id: typing.Optional[int] = None,
        tag_name: typing.Optional[str] = None,
    ) -> Query:
        """
        :return: a Query object, filtered query but without fetching the object.
        """
        if tag_id:
            query = query.filter(Tag.tag_id == tag_id)
        if content_id:
            query = query.join(TagOnContent, Tag.tag_id == TagOnContent.tag_id).filter(
                TagOnContent.content_id == content_id
            )
        if workspace_id:
            query = query.filter(Tag.workspace_id == workspace_id)
        if tag_name:
            query = query.filter(Tag.tag_name == tag_name)
        return query

    def get_one(
        self,
        tag_id: typing.Optional[int] = None,
        tag_name: typing.Optional[int] = None,
        workspace_id: typing.Optional[int] = None,
        content_id: typing.Optional[int] = None,
    ) -> Tag:
        try:
            tag = self.base_filter(
                self._base_query(),
                tag_id=tag_id,
                tag_name=tag_name,
                workspace_id=workspace_id,
                content_id=content_id,
            ).one()
        except NoResultFound:
            raise TagNotFound("Tag #{tag_id} was not found.".format(tag_id=tag_id))
        return tag

    def get_all(
        self, workspace_id: typing.Optional[int] = None, content_id: typing.Optional[int] = None,
    ) -> typing.List[Tag]:
        query = self.base_filter(
            self._base_query(), workspace_id=workspace_id, content_id=content_id
        )
        query = query.order_by(Tag.tag_id)
        return query.all()

    def get_content_tag(self, content: Content, tag: str) -> typing.Optional[TagOnContent]:
        query = self._session.query(TagOnContent).filter(
            and_(TagOnContent.tag == tag, TagOnContent.content == content)
        )

        try:
            return query.one()
        except NoResultFound:
            return None

    def add_tag_to_content(
        self,
        user: User,
        content: Content,
        tag_name: typing.Optional[str] = None,
        tag_id: typing.Optional[int] = None,
        do_save=True,
    ) -> Tag:
        try:
            tag = self.get_one(workspace_id=content.workspace_id, tag_name=tag_name, tag_id=tag_id)
            content_tag = self.get_content_tag(content=content, tag=tag)

            if content_tag:
                raise TagAlreadyExistsError(
                    "Tag {tag_name} on content {content_id} already exists.".format(
                        content_id=content.content_id, tag_name=tag_name
                    )
                )

        except TagNotFound:
            tag = self.add(
                user=user, workspace=content.workspace, tag_name=tag_name, do_save=do_save
            )

        tag_content = TagOnContent(author=user, tag=tag, content=content)
        self._session.add(tag_content)
        if do_save:
            self._session.flush()
        return tag

    def add(self, user: User, workspace: Workspace, tag_name: str, do_save: bool):
        tag = Tag(author=user, workspace=workspace, tag_name=tag_name)
        self._session.add(tag)
        if do_save:
            self._session.flush()
        return tag

    def delete_from_content(self, content: Content, tag_id: int, do_save: bool) -> None:
        tag = self.get_one(workspace_id=content.workspace_id, tag_id=tag_id)
        content_tag = self.get_content_tag(content=content, tag=tag)
        self._session.delete(content_tag)
        if do_save:
            self._session.flush()

    def delete(self, tag: Tag, do_save: bool) -> None:
        self._session.delete(tag)
        if do_save:
            self._session.flush()

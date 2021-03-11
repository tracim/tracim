import typing

from sqlalchemy.orm import Query
from sqlalchemy.orm.exc import NoResultFound

from tracim_backend.exceptions import ReactionAlreadyExistError
from tracim_backend.exceptions import ReactionNotFound
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.reaction import Reaction
from tracim_backend.models.tracim_session import TracimSession


class ReactionLib:
    def __init__(self, session: TracimSession,) -> None:
        self._session = session
        pass

    def _base_query(self):
        return self._session.query(Reaction)

    def base_filter(
        self,
        query: Query,
        reaction_id: typing.Optional[int] = None,
        content_id: typing.Optional[int] = None,
        user_id: typing.Optional[int] = None,
        value: typing.Optional[str] = None,
    ) -> Query:
        """
        :return: a Query object, filtered query but without fetching the object.
        """
        if reaction_id:
            query.filter(Reaction.reaction_id == reaction_id)
        if content_id:
            query = query.filter(Reaction.content_id == content_id)
        if user_id:
            query = query.filter(Reaction.author_id == user_id)
        if value:
            query = query.filter(Reaction.value == value)
        return query

    def get_one(self, reaction_id: int, content_id: typing.Optional[int] = None) -> Reaction:
        try:
            reaction = self.base_filter(
                self._base_query(), reaction_id=reaction_id, content_id=content_id
            ).one()
        except NoResultFound:
            raise ReactionNotFound(
                "Reaction of id {reaction_id} was not found.".format(reaction_id=reaction_id)
            )
        return reaction

    def get_all(
        self, content_id: typing.Optional[int] = None, user_id: typing.Optional[int] = None
    ) -> typing.List[Reaction]:
        query = self.base_filter(self._base_query(), content_id=content_id, user_id=user_id)
        query = query.order_by(Reaction.reaction_id)
        return query.all()

    def create(self, user: User, content: Content, value: str, do_save: bool) -> Reaction:
        query = self.base_filter(
            query=self._base_query(),
            user_id=user.user_id,
            content_id=content.content_id,
            value=value,
        )
        if query.count() > 0:
            raise ReactionAlreadyExistError(
                "Reaction of user {user_id} "
                "on content {content_id} with value: {value} already exist.".format(
                    user_id=user.user_id, content_id=content.content_id, value=value
                )
            )
        reaction = Reaction(author=user, content=content, value=value)
        self._session.add(reaction)
        if do_save:
            self._session.flush()
        return reaction

    def delete(self, reaction: Reaction, do_save: bool) -> None:
        self._session.delete(reaction)
        if do_save:
            self._session.flush()

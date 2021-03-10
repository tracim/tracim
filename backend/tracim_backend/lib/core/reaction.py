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

    def _get_one_rsc(self, user_id: int, content_id: int, value: str) -> Query:
        """
        :param user_id:
        :param workspace_id:
        :return: a Query object, filtered query but without fetching the object.
        """
        return (
            self._base_query()
            .filter(Reaction.author_id == user_id)
            .filter(Reaction.content_id == content_id)
            .filter(Reaction.value == value)
        )

    def get_one(self, user_id: int, content_id: int, value: str) -> Reaction:
        try:
            reaction = self._get_one_rsc(user_id, content_id, value).one()
        except NoResultFound:
            raise ReactionNotFound(
                "Reaction of user {user_id} "
                "on content {content_id} with value: {value} was not found.".format(
                    user_id=user_id, content_id=content_id, value=value
                )
            )
        return reaction

    def get_all(
        self, content_id: typing.Optional[int] = None, user_id: typing.Optional[int] = None
    ) -> typing.List[Reaction]:
        query = self._base_query()
        if content_id:
            query = query.filter(Reaction.content_id == content_id)
        if user_id:
            query = query.filter(Reaction.author_id == user_id)
        return query.all()

    def create(self, user: User, content: Content, value: str, do_save: bool) -> Reaction:
        query = self._get_one_rsc(user.user_id, content.content_id, value)
        if query.count() > 0:
            raise ReactionAlreadyExistError(
                "Reaction of user {user_id} "
                "on content {content_id} with value: {value} already exist.".format(
                    user_id=user.user_id, content_id=content.content_id, value=value
                )
            )
        reaction = Reaction(user.user_id, content.content_id, value)
        self._session.add(reaction)
        if do_save:
            self._session.flush()
        return reaction

    def delete(self, reaction: Reaction, do_save: bool) -> None:
        self._session.delete(reaction)
        if do_save:
            self._session.flush()

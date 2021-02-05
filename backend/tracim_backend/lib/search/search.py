from abc import ABC
from abc import abstractmethod
import typing

from sqlalchemy.orm import Session

from tracim_backend.config import CFG
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import ContentInContext


class IndexedContentsResults(object):
    def __init__(
        self, content_ids_to_index: typing.List[int], errored_indexed_content_ids: typing.List[int]
    ) -> None:
        self.content_ids_to_index = content_ids_to_index
        self.errored_indexed_contents_ids = errored_indexed_content_ids

    def get_nb_index_errors(self) -> int:
        """
        nb of content where indexation failed
        """
        return len(self.errored_indexed_contents_ids)

    def get_nb_content_correctly_indexed(self) -> int:
        """
        nb of contents where indexation success
        """
        return self.get_nb_contents_to_index() - self.get_nb_index_errors()

    def get_nb_contents_to_index(self) -> int:
        """
        Total of content to index
        """
        return len(self.content_ids_to_index)


class SearchApi(ABC):
    def __init__(self, session: Session, current_user: typing.Optional[User], config: CFG) -> None:
        self._user = current_user
        self._session = session
        self._config = config

    @abstractmethod
    def create_indices(self) -> None:
        pass

    @abstractmethod
    def migrate_indices(self) -> None:
        pass

    @abstractmethod
    def delete_indices(self) -> None:
        pass

    @abstractmethod
    def index_content(self, content: ContentInContext):
        pass

    def index_all_content(self) -> IndexedContentsResults:
        """
        Index/update all content in current index of ElasticSearch
        """
        content_api = ContentApi(
            session=self._session,
            config=self._config,
            current_user=self._user,
            show_archived=True,
            show_active=True,
            show_deleted=True,
        )
        contents = content_api.get_all()
        content_ids_to_index = []  # type: typing.List[int]
        errored_indexed_contents_ids = []  # type: typing.List[int]
        for content in contents:
            content_in_context = ContentInContext(
                content, config=self._config, dbsession=self._session
            )
            content_ids_to_index.append(content_in_context.content_id)
            try:
                self.index_content(content_in_context)
            except ConnectionError as exc:
                logger.error(
                    self,
                    "connexion error issue with elasticsearch during indexing of content {}".format(
                        content_in_context.content_id
                    ),
                )
                logger.exception(self, exc)
                errored_indexed_contents_ids.append(content_in_context.content_id)
            except Exception as exc:
                logger.error(
                    self,
                    "something goes wrong during indexing of content {}".format(
                        content_in_context.content_id
                    ),
                )
                logger.exception(self, exc)
                errored_indexed_contents_ids.append(content_in_context.content_id)
        return IndexedContentsResults(content_ids_to_index, errored_indexed_contents_ids)

    def _get_user_workspaces_id(self, min_role: int) -> typing.Optional[typing.List[int]]:
        """
        Get user workspace list or None if no user set
        """
        if self._user:
            rapi = RoleApi(config=self._config, session=self._session, current_user=self._user)
            return rapi.get_user_workspaces_ids(self._user.user_id, min_role)
        return None

    def offset_from_pagination(self, size: int, page_nb: int) -> int:
        """
        Simple method to get an offset value from size and page_nb value
        """
        assert page_nb > 0
        return (page_nb - 1) * size

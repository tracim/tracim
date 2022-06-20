from sqlalchemy.orm import Session

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.applications.content_todo.models import Todo
from tracim_backend.config import CFG
from tracim_backend.models.auth import User


class TodoInContext(object):
    """
    Interface to get Todo data and related content

    """

    def __init__(self, todo: Todo, dbsession: Session, config: CFG, user: User,) -> None:
        self.todo = todo
        self.dbsession = dbsession
        self.config = config
        self._user = user

    @property
    def todo_id(self) -> int:
        """
        Todo id
        :return: todo id as integer
        """
        return self.todo.todo_id

    @property
    def parent_id(self) -> int:
        """
        Todo parent id
        :return: todo parent id as integer
        """
        return self.todo.content_id

    @property
    def assignee_id(self) -> int:
        """
        Todo assignee id
        :return: todo assignee id as integer
        """
        return self.todo.assignee_id
    
    @property
    def owner_id(self) -> int:
        """
        Todo owner id
        :return: todo owner id as integer
        """
        from tracim_backend.lib.core.content import ContentApi

        content_api = ContentApi(
            current_user=self._user, session=self.dbsession, config=self.config,
        )
        owner_id = content_api.get_one(
            self.todo.content_id, content_type=content_type_list.Todo.slug,
        ).first_revision.owner_id

        return owner_id

    @property
    def status(self) -> str:
        """
        Todo status
        :return: todo status as string
        """
        from tracim_backend.lib.core.content import ContentApi

        content_api = ContentApi(
            current_user=self._user, session=self.dbsession, config=self.config,
        )
        status = content_api.get_one(
            self.todo.content_id, content_type=content_type_list.Todo.slug,
        ).status

        return status

    @property
    def raw_content(self) -> str:
        """
        Todo raw content
        :return: todo raw content as string
        """
        from tracim_backend.lib.core.content import ContentApi

        content_api = ContentApi(
            current_user=self._user, session=self.dbsession, config=self.config,
        )
        raw_content = content_api.get_one(
            self.todo.content_id, content_type=content_type_list.Todo.slug,
        ).raw_content

        return raw_content


class TodoPath(object):
    """
    Paths parameters for todo: workspace id, content id, todo id
    """

    def __init__(self, workspace_id: int, content_id: int, todo_id: int) -> None:
        self.content_id = content_id
        self.workspace_id = workspace_id
        self.todo_id = todo_id

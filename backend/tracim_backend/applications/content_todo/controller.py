# coding=utf-8
from http import HTTPStatus
import typing

from pyramid.config import Configurator
import transaction

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.applications.content_todo.schema import SetTodoSchema
from tracim_backend.applications.content_todo.schema import TodoPathSchema
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import ParentNotFound
from tracim_backend.exceptions import TodoNotFound
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import UserNotMemberOfWorkspace
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.utils.authorization import can_delete_todo
from tracim_backend.lib.utils.authorization import can_edit_todo
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import SetContentStatusSchema
from tracim_backend.views.core_api.schemas import ToDoSchema
from tracim_backend.views.core_api.schemas import UserIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

SWAGGER_TAG__CONTENT_TODO_SECTION = "Todos"
SWAGGER_TAG__CONTENT_TODO_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__CONTENT_TODO_SECTION
)


class TodoController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_TODO_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(ToDoSchema(many=True))
    def get_user_todos(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[ContentInContext]:
        """
        Get every todo related to a user
        user_id: user is that we want to fetch the todos
        """

        app_config = request.registry.settings["CFG"]

        content_api = ContentApi(
            current_user=request.current_user, session=request.dbsession, config=app_config,
        )

        todos = content_api.get_all_query(
            content_type_slug=content_type_list.Todo.slug, assignee_id=hapic_data.path["user_id"]
        )

        todos_in_context = []
        for todo in todos:
            todos_in_context.append(content_api.get_content_in_context(todo))

        return todos_in_context

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_TODO_ENDPOINTS])
    @hapic.handle_exception(UserNotMemberOfWorkspace, HTTPStatus.BAD_REQUEST)
    @check_right(is_reader)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(ToDoSchema(many=True))
    def get_todos(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[ContentInContext]:
        """
        Get all todos related to a content in asc order (first is the oldest)
        content_id: content id that have todos
        """

        app_config = request.registry.settings["CFG"]

        content_api = ContentApi(
            current_user=request.current_user, session=request.dbsession, config=app_config,
        )

        todos = content_api.get_all(
            parent_ids=[hapic_data.path.content_id], content_type=content_type_list.Todo.slug
        )

        todos_in_context = []
        for todo in todos:
            todos_in_context.append(content_api.get_content_in_context(todo))

        return todos_in_context

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_TODO_ENDPOINTS])
    @hapic.handle_exception(UserNotMemberOfWorkspace, HTTPStatus.BAD_REQUEST)
    @check_right(is_reader)
    @hapic.input_path(TodoPathSchema())
    @hapic.output_body(ToDoSchema())
    def get_todo(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:
        """
        Get a todo
        """

        app_config = request.registry.settings["CFG"]

        content_api = ContentApi(
            current_user=request.current_user, session=request.dbsession, config=app_config,
        )

        todo = content_api.get_one(
            content_id=hapic_data.path.todo_id, content_type=content_type_list.Todo.slug
        )
        todo_in_context = content_api.get_content_in_context(todo)

        return todo_in_context

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_TODO_ENDPOINTS])
    @hapic.handle_exception(UserNotMemberOfWorkspace, HTTPStatus.BAD_REQUEST)
    @check_right(is_contributor)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(SetTodoSchema())
    @hapic.output_body(ToDoSchema())
    def create_todo(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:
        """
        Create a todo
        """
        app_config = request.registry.settings["CFG"]

        content_api = ContentApi(
            current_user=request.current_user, session=request.dbsession, config=app_config,
        )
        user_api = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config,
        )

        parent = None  # type: typing.Optional['Content']
        try:
            parent = content_api.get_one(
                content_id=request.current_content.content_id,
                content_type=content_type_list.Any_SLUG,
            )
        except ContentNotFound as exc:
            raise ParentNotFound(
                "Parent with content_id {} not found".format(request.current_content.content_id)
            ) from exc

        assignee = None  # type: typing.Optional['User']
        if hapic_data.body["assignee_id"]:
            try:
                assignee = user_api.get_one(user_id=hapic_data.body["assignee_id"])
            except UserDoesNotExist as exc:
                raise UserDoesNotExist(
                    "User with user_id {} not member of workspace".format(
                        hapic_data.body["assignee_id"]
                    )
                ) from exc

        todo = content_api.create_todo(
            parent=parent, raw_content=hapic_data.body["raw_content"], assignee=assignee,
        )

        todo_in_context = content_api.get_content_in_context(todo)

        return todo_in_context

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_TODO_ENDPOINTS])
    @hapic.handle_exception(UserNotMemberOfWorkspace, HTTPStatus.BAD_REQUEST)
    @check_right(can_edit_todo)
    @hapic.input_path(TodoPathSchema())
    @hapic.input_body(SetContentStatusSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def edit_todo(self, context, request: TracimRequest, hapic_data=None):
        """
        Edit existing todo
        """
        app_config = request.registry.settings["CFG"]

        content_api = ContentApi(
            current_user=request.current_user, session=request.dbsession, config=app_config,
        )

        todo_content = content_api.get_one(
            content_id=hapic_data.path.todo_id, content_type=content_type_list.Todo.slug
        )

        with new_revision(session=request.dbsession, tm=transaction.manager, content=todo_content):
            content_api.set_status(todo_content, hapic_data.body.status)
            content_api.save(todo_content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_TODO_ENDPOINTS])
    @hapic.handle_exception(UserNotMemberOfWorkspace, HTTPStatus.BAD_REQUEST)
    @check_right(can_delete_todo)
    @hapic.input_path(TodoPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def delete_todo(self, context, request: TracimRequest, hapic_data=None):
        """
        Delete a todo
        """
        app_config = request.registry.settings["CFG"]

        content_api = ContentApi(
            current_user=request.current_user, session=request.dbsession, config=app_config,
        )

        try:
            todo_content = content_api.get_one(
                content_id=hapic_data.path.todo_id, content_type=content_type_list.Todo.slug
            )
        except ContentNotFound as exc:
            raise TodoNotFound(
                "Todo with content_id {} not found".format(request.current_content.content_id)
            ) from exc

        with new_revision(session=request.dbsession, tm=transaction.manager, content=todo_content):
            content_api.delete(todo_content)

    def bind(self, configurator: Configurator):
        # Get every todo of a user
        configurator.add_route(
            "user_todos", "/users/{user_id}/todos", request_method="GET",
        )
        configurator.add_view(self.get_user_todos, route_name="user_todos")

        # Get every todo of a content
        configurator.add_route(
            "todos", "/workspaces/{workspace_id}/contents/{content_id}/todos", request_method="GET",
        )
        configurator.add_view(self.get_todos, route_name="todos")

        # Get a todo of a content
        configurator.add_route(
            "todo",
            "/workspaces/{workspace_id}/contents/{content_id}/todos/{todo_id}",
            request_method="GET",
        )
        configurator.add_view(self.get_todo, route_name="todo")

        # Add new todo to a content
        configurator.add_route(
            "create_todo",
            "/workspaces/{workspace_id}/contents/{content_id}/todos",
            request_method="POST",
        )
        configurator.add_view(self.create_todo, route_name="create_todo")

        # Edit todo
        configurator.add_route(
            "edit_todo",
            "/workspaces/{workspace_id}/contents/{content_id}/todos/{todo_id}",
            request_method="PUT",
        )
        configurator.add_view(self.edit_todo, route_name="edit_todo")

        # Delete todo
        configurator.add_route(
            "delete_todo",
            "/workspaces/{workspace_id}/contents/{content_id}/todos/{todo_id}",
            request_method="DELETE",
        )
        configurator.add_view(self.delete_todo, route_name="delete_todo")

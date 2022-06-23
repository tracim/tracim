import typing

import marshmallow
from marshmallow import post_load

from tracim_backend.app_models.validator import content_status_validator
from tracim_backend.app_models.validator import strictly_positive_int_validator
from tracim_backend.applications.content_todo.models_in_context import TodoPath
from tracim_backend.views.core_api.schemas import StrippedString
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema


class TodoIdSchema(marshmallow.Schema):
    todo_id = marshmallow.fields.Integer(example=42, description="Id of the todo",)


class TodoSchema(TodoIdSchema):
    parent_id = marshmallow.fields.Integer(
        example=42, description="Id of the parent content of the todo", allow_none=True,
    )
    assignee_id = marshmallow.fields.Integer(
        example=42,
        description="Id of the user who is assigned to the todo",
        validate=strictly_positive_int_validator,
        allow_none=False,
        required=True,
    )
    owner_id = marshmallow.fields.Integer(
        example=42,
        description="Id of the user who created the todo",
        validate=strictly_positive_int_validator,
        allow_none=False,
        required=True,
    )
    status = StrippedString(
        example="open",
        validate=content_status_validator,
        description="Status of the todo",
        allow_none=False,
        required=True,
    )


class TodoSchemaWithContent(TodoSchema):
    raw_content = StrippedString(
        example="This is a todo",
        description="Raw content of the todo",
        allow_none=False,
        required=True,
    )


class SetTodoSchema(marshmallow.Schema):
    raw_content = StrippedString(
        example="This is a todo",
        description="Raw content of the todo",
        allow_none=False,
        required=True,
    )
    assignee_id = marshmallow.fields.Integer(
        example=42,
        description="Id of the user who is assigned to the todo",
        validate=strictly_positive_int_validator,
        allow_none=False,
        required=True,
    )


class TodoIdPathSchema(TodoIdSchema):
    todo_id = marshmallow.fields.Integer(example=42, description="Id of the todo")


class TodoPathSchema(WorkspaceAndContentIdPathSchema, TodoIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]):
        return TodoPath(**data)

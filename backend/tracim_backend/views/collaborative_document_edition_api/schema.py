import typing

import marshmallow
from marshmallow import post_load

from tracim_backend.app_models.validator import positive_int_validator
from tracim_backend.views.core_api.schemas import StrippedString


class CollaborativeDocumentEditionTokenSchema(marshmallow.Schema):
    access_token = marshmallow.fields.String(
        required=True,
        description="The access token which should be sent to collabora online and "
        "which uniquely identifies the user",
    )


class FileCreateFromTemplate(object):
    """
    Create From Template model
    """

    def __init__(self, template: str, filename: str, parent_id: int) -> None:
        self.template = template
        self.filename = filename
        self.parent_id = parent_id


class FileTemplateSchema(marshmallow.Schema):
    template_name = StrippedString(
        example="default.odt", description="template name you can use", required=True
    )
    category = StrippedString(example="calc", description="category of the template", required=True)


class FileTemplateInfoSchema(marshmallow.Schema):
    file_templates = marshmallow.fields.List(StrippedString)


class FileCreateFromTemplateSchema(marshmallow.Schema):
    template = StrippedString(
        example="default.odt",
        description="The template of the file you want to create",
        required=True,
    )
    filename = StrippedString(
        required=True, example="test.odt", description="The file name, as saved in the workspace"
    )
    parent_id = marshmallow.fields.Int(
        example=42,
        description="id of the new parent content id.",
        default=None,
        allow_none=True,
        validate=positive_int_validator,
    )

    @post_load
    def file_create_from_template(self, data: typing.Dict[str, typing.Any]) -> object:
        return FileCreateFromTemplate(**data)

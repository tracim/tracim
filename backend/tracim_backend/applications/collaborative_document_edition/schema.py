import marshmallow
from marshmallow import post_load
import typing
from typing import Optional

from tracim_backend.app_models.validator import positive_int_validator
from tracim_backend.views.core_api.schemas import StrippedString


class CollaborativeDocumentEditionTokenSchema(marshmallow.Schema):
    access_token = marshmallow.fields.String(
        required=True,
        metadata={
            "description": "The access token which should be sent to collabora online and "
            "which uniquely identifies the user"
        },
    )


class FileCreateFromTemplate(object):
    """
    Create From Template model
    """

    def __init__(
        self,
        template: str,
        filename: str,
        parent_id: Optional[int] = None,
        template_id: Optional[int] = None,
    ) -> None:
        self.template = template
        self.filename = filename
        self.parent_id = parent_id
        self.template_id = template_id


class FileTemplateSchema(marshmallow.Schema):
    template_name = StrippedString(
        metadata={"example": "default.odt", "description": "template name you can use"},
        required=True,
    )
    category = StrippedString(
        metadata={"example": "calc", "description": "category of the template"}, required=True
    )


class FileTemplateInfoSchema(marshmallow.Schema):
    file_templates = marshmallow.fields.List(StrippedString)


class FileCreateFromTemplateSchema(marshmallow.Schema):
    template = StrippedString(
        metadata={
            "example": "default.odt",
            "description": "The template of the file you want to create",
        },
        required=True,
    )
    filename = StrippedString(
        required=True,
        metadata={"example": "test.odt", "description": "The file name, as saved in the workspace"},
    )
    parent_id = marshmallow.fields.Int(
        metadata={"example": 42, "description": "id of the new parent content id."},
        dump_default=None,
        allow_none=True,
        validate=positive_int_validator,
    )
    template_id = marshmallow.fields.Int(
        metadata={
            "example": 1,
            "description": "The id of the template you want to create"
            " the id must be a content id of a file marked as a template",
        },
        dump_default=None,
        allow_none=True,
        validate=positive_int_validator,
    )

    @post_load
    def file_create_from_template(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return FileCreateFromTemplate(**data)

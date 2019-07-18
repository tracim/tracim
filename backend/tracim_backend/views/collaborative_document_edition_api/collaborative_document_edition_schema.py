import typing

import marshmallow
from marshmallow import post_load

from tracim_backend.app_models.validator import positive_int_validator
from tracim_backend.views.core_api.schemas import StrippedString


class CollaborativeDocumentEditionToken(marshmallow.Schema):
    access_token = marshmallow.fields.String(
        required=True,
        description="The access token which should be sent to collabora online and "
        "which uniquely identifies the user",
    )


class CollaboraDiscoverySchema(marshmallow.Schema):
    mimetype = marshmallow.fields.String(
        example="application/vnd.oasis.opendocument.text",
        required=True,
        description="Collabora Online file mimetype",
    )
    extension = marshmallow.fields.String(
        example="odt", required=True, description="Collabora Online file extensions"
    )
    associated_action = marshmallow.fields.String(
        example="edit", required=True, description="Collabora Online action allowed"
    )
    url_source = marshmallow.fields.URL(
        required=True,
        description="URL of the collabora online editor for this type of file",
        example="http://localhost:9980/loleaflet/305832f/loleaflet.html",
    )


class FileCreateFromTemplate(object):
    """
    Create From Template model
    """

    def __init__(self, template: str, filename: str, parent_id: int):
        self.template = template
        self.filename = filename
        self.parent_id = parent_id


class FileTemplateSchema(marshmallow.Schema):
    template_name = StrippedString(
        example="default.odt", description="template name you can use", required=True
    )
    category = StrippedString(example="calc", description="category of the template", required=True)


class FileTemplateInfoSchema(marshmallow.Schema):
    categories = marshmallow.fields.List(
        StrippedString(example="calc"), description="categories of file template available."
    )
    file_templates = marshmallow.fields.Nested(FileTemplateSchema, many=True)


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

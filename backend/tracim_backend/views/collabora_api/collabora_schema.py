import marshmallow

from tracim_backend.app_models.validator import strictly_positive_int_validator


class CollaboraEditFileSchema(marshmallow.Schema):
    is_collabora_editable = marshmallow.fields.Boolean(
        required=True, description="Is this content editable by collabora ?"
    )
    url_source = marshmallow.fields.URL(
        allow_none=True,
        required=True,
        description="URL of the collabora online editor",
        example="http://localhost:9980/loleaflet/305832f/loleaflet.html?WOPISrc="
        "http://172.16.20.7:6543/api/v2/workspaces/1/wopi/files/1",
    )
    access_token = marshmallow.fields.String(
        required=True,
        description="The access token which should be sent to collabora online and "
        "which uniquely identifies the user",
    )
    content_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    workspace_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)


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

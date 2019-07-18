import marshmallow


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

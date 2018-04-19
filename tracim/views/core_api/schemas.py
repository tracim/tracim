# coding=utf-8
import marshmallow


class ProfileSchema(marshmallow.Schema):
    id = marshmallow.fields.Int(dump_only=True)
    slug = marshmallow.fields.String(attribute='name')


class UserSchema(marshmallow.Schema):
    user_id = marshmallow.fields.Int(dump_only=True)
    email = marshmallow.fields.Email(required=True)
    display_name = marshmallow.fields.String()
    created = marshmallow.fields.DateTime(format='iso8601')
    is_active = marshmallow.fields.Bool()
    # TODO - G.M - 17-04-2018 - Restrict timezone values
    timezone = marshmallow.fields.String()
    # TODO - G.M - 17-04-2018 - check this, relative url allowed ?
    caldav_url = marshmallow.fields.Url(
        allow_none=True,
        default=None,
        relative=True,
        attribute='calendar_url'
    )
    avatar_url = marshmallow.fields.Url(allow_none=True, default=None)
    profile = marshmallow.fields.Nested(
        ProfileSchema,
        many=False,
    )


class BasicAuthSchema(marshmallow.Schema):
    email = marshmallow.fields.Email(required=True)
    password = marshmallow.fields.String(required=True, load_only=True)


class LoginOutputHeaders(marshmallow.Schema):
    expire_after = marshmallow.fields.String()


class OkResponse(marshmallow.Schema):
    message = marshmallow.fields.String(required=True)

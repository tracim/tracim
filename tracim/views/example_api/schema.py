# -*- coding: utf-8 -*-
# TODO - G.M - 10-04-2018 - [cleanup][tempExample] - Drop this file
import marshmallow


class NoContentSchema(marshmallow.Schema):
    pass


class AboutResponseSchema(marshmallow.Schema):
    version = marshmallow.fields.String(required=True,)
    datetime = marshmallow.fields.DateTime(required=True)


class UserPathSchema(marshmallow.Schema):
    id = marshmallow.fields.Int(
        required=True,
        validate=marshmallow.validate.Range(min=1),
    )


class UserSchema(marshmallow.Schema):
    id = marshmallow.fields.Int(required=True)
    username = marshmallow.fields.String(
        required=True,
        validate=marshmallow.validate.Regexp(regex='[\w-]+'),
    )
    email_address = marshmallow.fields.Email(required=True)
    first_name = marshmallow.fields.String(required=True)
    last_name = marshmallow.fields.String(required=True)
    display_name = marshmallow.fields.String(required=True)
    company = marshmallow.fields.String(required=True)


class PaginationSchema(marshmallow.Schema):
    first_id = marshmallow.fields.Int(required=True)
    last_id = marshmallow.fields.Int(required=True)
    current_id = marshmallow.fields.Int(required=True)


class ListsUserSchema(marshmallow.Schema):
    item_nb = marshmallow.fields.Int(
        required=True,
        validate=marshmallow.validate.Range(min=0)
    )
    items = marshmallow.fields.Nested(
        UserSchema,
        many=True,
        only=['id', 'username', 'display_name', 'company']
    )
    # TODO - G.M - 2017-12-05 - Fix nested schema import into doc !
    # Can't add doc for nested Schema properly
    # When schema item isn't added through their own method
    # Ex : Pagination Schema doesn't work here but UserSchema is ok.
    pagination = marshmallow.fields.Nested(
        PaginationSchema
    )

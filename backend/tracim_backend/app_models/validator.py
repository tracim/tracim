from marshmallow.validate import OneOf
from tracim_backend.app_models.contents import CONTENT_TYPES

# TODO - G.M - 2018-08-08 - [GlobalVar] Refactor Global var
# of tracim_backend, Be careful ALL_CONTENT_TYPES_VALIDATOR is a global_var !

ALL_CONTENT_TYPES_VALIDATOR = OneOf(choices=[])


def update_validators():
    ALL_CONTENT_TYPES_VALIDATOR.choices = CONTENT_TYPES.endpoint_allowed_types_slug()  # nopep8

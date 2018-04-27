from hapic.error import DefaultErrorBuilder


class ErrorSchema(DefaultErrorBuilder):
    """
    This class is both a builder and a Marshmallow Schema, His named is used for
    swagger ui error schema. That's why we call it ErrorSchema To have
    a nice naming in swagger ui.
    """
    pass

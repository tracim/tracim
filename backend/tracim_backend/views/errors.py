from hapic.error import DefaultErrorBuilder
from hapic.processor.main import ProcessValidationError
from tracim_backend.error import GENERIC_SCHEMA_VALIDATION_ERROR


class ErrorSchema(DefaultErrorBuilder):
    """
    This class is both a builder and a Marshmallow Schema, His named is used for
    swagger ui error schema. That's why we call it ErrorSchema To have
    a nice naming in swagger ui.
    """
    def build_from_exception(
        self,
        exception: Exception,
        include_traceback: bool = False,
    ) -> dict:
        error_dict = DefaultErrorBuilder.build_from_exception(
            self,
            exception,
            include_traceback
        )
        code = getattr(exception, 'error_code', None)
        error_dict['code'] = code
        return error_dict

    def build_from_validation_error(
        self,
        error: ProcessValidationError,
    ) -> dict:
        error_dict = DefaultErrorBuilder.build_from_validation_error(self, error)  # nopep8
        error_dict['code'] = GENERIC_SCHEMA_VALIDATION_ERROR
        return error_dict

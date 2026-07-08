from hapic import MarshmallowProcessor
from hapic.exception import OutputValidationException
from hapic.exception import ValidationException
from hapic.processor.main import ProcessValidationError
import typing


class TracimProcessor(MarshmallowProcessor):
    """
    Patched hapic processor that returns an error when dump data is not correct.
    See https://github.com/algoo/hapic/issues/211 for more info.

    In Tracim 2026.07.00 for Debian 13 we have raiser marshmallow to its v3
    In marshmallow 2, schema.dump() returned a (data, errors) namedtuple, so errors
    had to be checked explicitly.
    In marshmallow 3, dump() simply serializes without
    raising, so the round-trip load() validation that was used here is no longer needed
    (and breaks on dump_only fields in nested schemas).
    """

    def dump(self, data: typing.Any) -> typing.Any:
        clean_data = self.clean_data(data)
        try:
            return self.schema.dump(clean_data)
        except Exception as e:
            raise ValidationException("Error when dumping: {}".format(str(e)))

    def dump_output(self, output_data: typing.Any) -> typing.Union[typing.Dict, typing.List]:
        clean_data = self.clean_data(output_data)
        try:
            return self.schema.dump(clean_data)
        except Exception as e:
            raise OutputValidationException("Error when validate input: {}".format(str(e)))

    def get_output_validation_error(self, data_to_validate: typing.Any) -> ProcessValidationError:
        clean_data = self.clean_data(data_to_validate)
        errors = {}
        try:
            self.schema.dump(clean_data)
        except Exception as e:
            errors = {"_schema": [str(e)]}
        return ProcessValidationError(message="Validation error of output data", details=errors)

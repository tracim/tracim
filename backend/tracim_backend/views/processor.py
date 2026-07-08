from hapic import MarshmallowProcessor
from hapic.exception import OutputValidationException
from hapic.exception import ValidationException
from hapic.processor.main import ProcessValidationError
from marshmallow import EXCLUDE
from marshmallow import ValidationError as MarshmallowValidationError
import typing


class TracimProcessor(MarshmallowProcessor):
    """
    Patched hapic processor that returns an error when dump data is not correct.
    See https://github.com/algoo/hapic/issues/211 for more info.
    """

    def _dump_and_validate(self, data: typing.Any) -> typing.Dict:
        """Serialize data and round-trip validate the result."""
        dump_data = self.schema.dump(data)
        # unknown=EXCLUDE: dump_only fields appear in dump_data but are not
        # loadable in marshmallow 3, so they must be excluded rather than raised.
        self.schema.load(dump_data, unknown=EXCLUDE)
        return dump_data

    def dump(self, data: typing.Any) -> typing.Any:
        clean_data = self.clean_data(data)
        try:
            return self._dump_and_validate(clean_data)
        except MarshmallowValidationError as e:
            raise ValidationException("Error when dumping: {}".format(str(e.messages)))

    def dump_output(self, output_data: typing.Any) -> typing.Union[typing.Dict, typing.List]:
        clean_data = self.clean_data(output_data)
        try:
            return self._dump_and_validate(clean_data)
        except MarshmallowValidationError as e:
            raise OutputValidationException("Error when validate input: {}".format(str(e.messages)))

    def get_output_validation_error(self, data_to_validate: typing.Any) -> ProcessValidationError:
        clean_data = self.clean_data(data_to_validate)
        errors = {}
        try:
            self._dump_and_validate(clean_data)
        except MarshmallowValidationError as e:
            errors = e.messages
        return ProcessValidationError(message="Validation error of output data", details=errors)

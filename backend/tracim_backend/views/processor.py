import typing

from hapic import MarshmallowProcessor
from hapic.exception import OutputValidationException
from hapic.exception import ValidationException
from hapic.processor.main import ProcessValidationError


class TracimProcessor(MarshmallowProcessor):
    """
    Patched hapic processor that returns an error when dump data is not correct.
    See https://github.com/algoo/hapic/issues/211 for more info.
    """

    def dump(self, data: typing.Any) -> typing.Any:
        """
        Use schema to validate given data and return dumped data.
        If validation fail, raise InputValidationException
        :param data: data to validate and dump
        :return: dumped data
        """
        clean_data = self.clean_data(data)
        dump = self.schema.dump(clean_data)
        dump_data = dump.data
        errors = dump.errors
        if not errors:
            # Re-validate with dumped data
            errors = self.schema.load(dump_data).errors
        if errors:
            raise ValidationException("Error when dumping: {}".format(str(errors)))

        return dump_data

    def dump_output(self, output_data: typing.Any) -> typing.Union[typing.Dict, typing.List]:
        """
        Dump output data and raise OutputValidationException if validation error
        :param output_data: output data to validate
        :return: given data
        """
        clean_data = self.clean_data(output_data)
        dump = self.schema.dump(clean_data)
        dump_data = dump.data
        errors = dump.errors
        if not errors:
            # Re-validate with dumped data
            errors = self.schema.load(dump_data).errors
        if errors:
            raise OutputValidationException("Error when validate input: {}".format(str(errors)))

        return dump_data

    def get_output_validation_error(self, data_to_validate: typing.Any) -> ProcessValidationError:
        """
        Return ProcessValidationError for given output data
        :param data_to_validate: output data to use
        :return: ProcessValidationError instance for given output data
        """
        clean_data = self.clean_data(data_to_validate)
        dump = self.schema.dump(clean_data)
        dump_data = dump.data
        errors = dump.errors
        if not errors:
            # Re-validate with dumped data
            errors = self.schema.load(dump_data).errors
        return ProcessValidationError(message="Validation error of output data", details=errors)

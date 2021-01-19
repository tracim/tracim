from contextlib import contextmanager
from datetime import datetime
import os
import tempfile

from depot.io.interfaces import StoredFile
from depot.manager import DepotManager
import filelock
from hapic.data import HapicFile

from tracim_backend import CFG
from tracim_backend.config import DepotFileStorageType


class DepotLib:
    """
    Helper class to handle more easily usage with depot stored file
    """

    def __init__(
        self,
        app_config: CFG,
    ) -> None:
        self.app_config = app_config
        self.uploaded_file_depot = DepotManager.get(
            app_config.UPLOADED_FILES__STORAGE__STORAGE_NAME
        )

    def get_raw_file(
        self,
        depot_file,
        filename: str,
        default_filename: str,
        force_download: bool = None,
        last_modified: datetime = None,
    ) -> HapicFile:
        file = self.uploaded_file_depot.get(
            depot_file
        )
        filename = filename
        # INFO - G.M - 2019-08-08 - use given filename in all case but none or
        # "raw", where filename returned will be a custom one.
        if not filename or filename == "raw":
            filename = default_filename
        return HapicFile(
            file_object=file,
            mimetype=file.content_type,
            filename=filename,
            as_attachment=force_download,
            content_length=file.content_length,
            last_modified=last_modified or None
        )

    @contextmanager
    def get_filepath(
        self,
        depot_file,
        file_extension: str = '',
        temporary_prefix: str = "tracim-undefined",
    ):
        depot_stored_file = self.uploaded_file_depot.get(depot_file)  # type: StoredFile
        if (
            self.app_config.UPLOADED_FILES__STORAGE__STORAGE_TYPE
            == DepotFileStorageType.LOCAL.slug
        ):
            return self._get_valid_content_filepath_legacy(depot_stored_file)
        else:
            return self._get_valid_content_filepath(
                depot_stored_file,
                file_extension=file_extension,
                prefix=temporary_prefix
            )

    def _get_valid_content_filepath(
        self,
        depot_stored_file: StoredFile,
        prefix: str = "tracim-undefined",
        file_extension: str = ""
    ):
        """
        Generic way to get content filepath for all depot backend.
        :param depot_stored_file: content as depot StoredFile
        :param file_extension: extension of the file we expect
        :return: content filepath
        """

        file_label = "{prefix}-{file_id}".format(
            prefix=prefix,
            file_id=depot_stored_file.file_id
        )
        base_path = "{temp_dir}/{file_label}".format(
            temp_dir=tempfile.gettempdir(), file_label=file_label,
        )

        file_path = "{base_path}{file_extension}".format(
            base_path=base_path, file_extension=file_extension,
        )

        lockfile_path = "{base_path}{file_extension}".format(
            base_path=base_path, file_extension=".lock",
        )
        # FIXME - G.M - 2020-01-05 - This will create a lockfile for
        # each depot file we do need (each content revision)
        # This file will NOT be removed at the end on Linux (FileLock use flock):
        # see  https://stackoverflow.com/questions/17708885/flock-removing-locked-file-without-race-condition
        # some investigation needs to be conducted to see if another solution is possible avoiding creating
        # too many files. See https://github.com/tracim/tracim/issues/4014
        with filelock.FileLock(lockfile_path):
            try:
                # HACK - G.M - 2020-01-05 - This mechanism is inefficient because it
                # generates a temporary file each time
                # Improvements need to be made in preview_generator itself
                # to handle more properly these issues.
                # We do rely on consistent path based on gettemdir(),
                # normally /tmp to give consistent path, this is a quick fix which does
                # not need any change in preview-generator.
                # note: this base path is configurable through an envirnoment var according
                # to the Python doc:
                # https://docs.python.org/3/library/tempfile.html#tempfile.gettempdir
                with open(file_path, "wb",) as tmp:
                    tmp.write(depot_stored_file.read())
                    yield file_path
            finally:
                try:
                    os.unlink(file_path)
                except FileNotFoundError:
                    pass

    def _get_valid_content_filepath_legacy(
        self, depot_stored_file: StoredFile
    ):
        """
        Legacy way to get content filepath, only work for local file backend of depot
        ("depot.io.local.LocalFileStorage", aka "local" in tracim config),
        we keep it for now as this mecanism is the only that currently work with preview_generator
        cache mecanism.
        :param depot_stored_file: content as depot StoredFile
        :return: content filepath
        """
        yield depot_stored_file._file_path  # type: str

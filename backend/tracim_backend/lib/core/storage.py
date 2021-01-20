from contextlib import contextmanager
from datetime import datetime
import os
import tempfile

from depot.fields.upload import UploadedFile
from depot.io.interfaces import StoredFile
from depot.manager import DepotManager
import filelock
from hapic.data import HapicFile
from preview_generator.exception import UnavailablePreviewType
from preview_generator.exception import UnsupportedMimeType
from preview_generator.manager import PreviewManager

from tracim_backend import CFG
from tracim_backend.config import DepotFileStorageType
from tracim_backend.exceptions import CannotGetDepotFileDepotCorrupted
from tracim_backend.exceptions import PageOfPreviewNotFound
from tracim_backend.exceptions import PreviewGeneratorPassthroughError
from tracim_backend.exceptions import TracimUnavailablePreviewType
from tracim_backend.exceptions import UnavailablePreview
from tracim_backend.lib.utils.logger import logger

TEMPORARY_PREFIX = "tracim-revision-content"


class StorageLib:
    """
    Helper class to handle more easily usage with depot stored file
    """

    def __init__(self, app_config: CFG,) -> None:
        self.app_config = app_config
        self.uploaded_file_depot = DepotManager.get(
            app_config.UPLOADED_FILES__STORAGE__STORAGE_NAME
        )
        self.preview_manager = PreviewManager(app_config.PREVIEW_CACHE_DIR, create_folder=True)

    def _get_depot_file(self, depot_file) -> StoredFile:
        try:
            return self.uploaded_file_depot.get(depot_file)
        except IOError as exc:
            logger.warning(
                self, "Unable to get content filepath, depot is corrupted", exc_info=True
            )
            raise CannotGetDepotFileDepotCorrupted(
                "depot file {} is not accessible, depot seems corrupted".format(depot_file.file_id)
            ) from exc

    def get_raw_file(
        self,
        depot_file: UploadedFile,
        filename: str,
        default_filename: str,
        force_download: bool = None,
        last_modified: datetime = None,
    ) -> HapicFile:
        file = self._get_depot_file(depot_file)
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
            last_modified=last_modified or None,
        )

    def get_filepath(
        self,
        depot_file: UploadedFile,
        file_extension: str = "",
        temporary_prefix: str = TEMPORARY_PREFIX,
    ):
        depot_stored_file = self._get_depot_file(depot_file)  # type: StoredFile
        if self.app_config.UPLOADED_FILES__STORAGE__STORAGE_TYPE == DepotFileStorageType.LOCAL.slug:
            yield from self._get_valid_content_filepath_legacy(depot_stored_file)
        else:
            yield from self._get_valid_content_filepath(
                depot_stored_file, file_extension=file_extension, prefix=temporary_prefix
            )

    @contextmanager
    def preview_generator_filepath_context(
        self, depot_file: UploadedFile, original_file_extension: str
    ):
        """

        :param depot_file:
        :param original_file_extension:
        :return:
        """
        try:
            yield from self.get_filepath(
                depot_file, file_extension=original_file_extension,
            )
        except UnavailablePreviewType as exc:
            raise TracimUnavailablePreviewType(
                "this kind of preview is not available for this file"
            ) from exc
        except UnsupportedMimeType as exc:
            raise UnavailablePreview("No Preview available for this type of file") from exc
        except CannotGetDepotFileDepotCorrupted as exc:
            raise UnavailablePreview(
                "No Preview available, original file seems no available"
            ) from exc
        except PreviewGeneratorPassthroughError as exc:
            # passthrough as this exception is already supported with
            # specific error code.
            raise exc
        except Exception as exc:
            logger.warning(self, "Unknown Preview_Generator Exception Occured", exc_info=True)
            raise UnavailablePreview("No preview available") from exc

    def get_jpeg_preview(
        self,
        depot_file: UploadedFile,
        page_number: int,
        filename: str,
        default_filename: str,
        original_file_extension: str = "",
        width: int = None,
        height: int = None,
        force_download: bool = None,
        last_modified: datetime = None,
    ) -> HapicFile:
        with self.preview_generator_filepath_context(
            depot_file=depot_file, original_file_extension=original_file_extension
        ) as file_path:
            preview_page_number = self.page_number_validator(
                preview_generator_page_number=page_number,
                depot_file=depot_file,
                file_path=file_path,
                original_file_extension=original_file_extension,
            )
            jpg_preview_path = self.preview_manager.get_jpeg_preview(
                file_path,
                page=preview_page_number,
                width=width,
                height=height,
                file_ext=original_file_extension,
            )
        # INFO - G.M - 2019-08-08 - use given filename in all case but none or
        # "raw", where filename returned will a custom one.
        if not filename or filename == "raw":
            filename = default_filename
        return HapicFile(
            file_path=jpg_preview_path,
            filename=filename,
            as_attachment=force_download,
            last_modified=last_modified,
        )

    def get_one_page_pdf_preview(
        self,
        depot_file: UploadedFile,
        page_number: int,
        filename: str,
        default_filename: str,
        original_file_extension: str = "",
        force_download: bool = None,
        last_modified: datetime = None,
    ):
        with self.preview_generator_filepath_context(
            depot_file=depot_file, original_file_extension=original_file_extension
        ) as file_path:
            preview_page_number = self.page_number_validator(
                preview_generator_page_number=page_number,
                depot_file=depot_file,
                file_path=file_path,
                original_file_extension=original_file_extension,
            )
            pdf_preview_path = self.preview_manager.get_pdf_preview(
                file_path, page=preview_page_number, file_ext=original_file_extension
            )
        # INFO - G.M - 2019-08-08 - use given filename in all case but none or
        # "raw", where filename returned will a custom one.
        if not filename or filename == "raw":
            filename = default_filename
        return HapicFile(
            file_path=pdf_preview_path,
            filename=filename,
            as_attachment=force_download,
            last_modified=last_modified,
        )

    def get_full_pdf_preview(
        self,
        depot_file: UploadedFile,
        filename: str,
        default_filename: str,
        original_file_extension: str = "",
        force_download: bool = None,
        last_modified: datetime = None,
    ):
        with self.preview_generator_filepath_context(
            depot_file=depot_file, original_file_extension=original_file_extension
        ) as file_path:
            pdf_preview_path = self.preview_manager.get_pdf_preview(
                file_path, file_ext=original_file_extension
            )
        # INFO - G.M - 2019-08-08 - use given filename in all case but none or
        # "raw", where filename returned will a custom one.
        if not filename or filename == "raw":
            filename = default_filename
        return HapicFile(
            file_path=pdf_preview_path,
            filename=filename,
            as_attachment=force_download,
            last_modified=last_modified,
        )

    def _preview_manager_page_format(self, page_number: int) -> int:
        """
        Convert page real number of page(begin at 1) to preview_manager page
        format(begin at 0)
        """
        return page_number - 1

    def page_number_validator(
        self,
        preview_generator_page_number: int,
        file_path: str,
        original_file_extension: str,
        depot_file: UploadedFile,
    ):

        preview_generator_page_number = self._preview_manager_page_format(
            preview_generator_page_number
        )
        if preview_generator_page_number >= self.preview_manager.get_page_nb(
            file_path, file_ext=original_file_extension
        ):
            raise PageOfPreviewNotFound(
                "page {page_number} of depot_file {file_id} does not exist".format(
                    page_number=preview_generator_page_number, file_id=depot_file.file_id
                )
            )
        return preview_generator_page_number

    def _get_valid_content_filepath(
        self,
        depot_stored_file: StoredFile,
        prefix: str = "tracim-undefined",
        file_extension: str = "",
    ):
        """
        Generic way to get content filepath for all depot backend.
        :param depot_stored_file: content as depot StoredFile
        :param file_extension: extension of the file we expect
        :return: content filepath
        """

        file_label = "{prefix}-{file_id}".format(prefix=prefix, file_id=depot_stored_file.file_id)
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

    def _get_valid_content_filepath_legacy(self, depot_stored_file: StoredFile):
        """
        Legacy way to get content filepath, only work for local file backend of depot
        ("depot.io.local.LocalFileStorage", aka "local" in tracim config),
        we keep it for now as this mecanism is the only that currently work with preview_generator
        cache mecanism.
        :param depot_stored_file: content as depot StoredFile
        :return: content filepath
        """
        yield depot_stored_file._file_path

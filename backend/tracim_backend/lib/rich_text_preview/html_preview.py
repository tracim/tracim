import tempfile
import typing

from hapic.data import HapicFile
import pypandoc

from tracim_backend.config import CFG


class RichTextPreviewLib:
    def __init__(self, app_config: CFG) -> None:
        self.app_config = app_config

    def get_full_pdf_preview(
        self,
        content: str,
        filename: str,
        default_filename: str,
        force_download: bool,
        last_modified,
        metadata: typing.Dict[str, typing.Any],
    ):

        with tempfile.NamedTemporaryFile(
            "w+b", prefix="preview-generator-", suffix=".pdf", delete=False
        ) as pdf_preview_path:
            metadata_args = []
            for key, value in metadata.items():
                metadata_args.append("--metadata")
                metadata_args.append("{key}:{value}".format(key=key, value=value))
            pypandoc.convert_text(
                content,
                outputfile=pdf_preview_path.name,
                to="html",
                format="html",
                extra_args=[
                    "-s",
                    "--pdf-engine=weasyprint",
                    "-c",
                    "{}".format(self.app_config.RICH_TEXT_PREVIEW__CSS_PATH),
                    "--toc",
                    "--template",
                    "{}".format(self.app_config.RICH_TEXT_PREVIEW__TEMPLATE_PATH),
                    *metadata_args,
                ],
            )
            if not filename or filename == "raw":
                filename = default_filename
            return HapicFile(
                file_path=pdf_preview_path.name,
                filename=filename,
                as_attachment=force_download,
                last_modified=last_modified,
            )

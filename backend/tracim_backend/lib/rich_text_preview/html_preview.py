import datetime
from hapic.data import HapicFile
import pypandoc
import tempfile
import typing
from weasyprint import CSS
from weasyprint import HTML

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
        last_modified: datetime.datetime,
        metadata: typing.Dict[str, typing.Any],
    ) -> HapicFile:
        with tempfile.NamedTemporaryFile(
            "w+b", prefix="tracim-notes-preview-", suffix=".pdf", delete=False
        ) as pdf_preview_path:
            with tempfile.NamedTemporaryFile(
                "w+b",
                prefix="tracim-notes-preview-",
                suffix=".html",
            ) as html_preview_path:
                metadata_args = []
                for key, value in metadata.items():
                    metadata_args.append("--metadata")
                    metadata_args.append("{key}:{value}".format(key=key, value=value))
                pypandoc.convert_text(
                    content,
                    outputfile=html_preview_path.name,
                    to="html",
                    format="html",
                    extra_args=[
                        "--standalone",
                        "--toc",
                        "--toc-depth=3",
                        "--number-sections",
                        "--template",
                        "{}".format(self.app_config.RICH_TEXT_PREVIEW__TEMPLATE_PATH),
                        *metadata_args,
                    ],
                )
                HTML(html_preview_path).write_pdf(
                    pdf_preview_path,
                    stylesheets=[
                        CSS(self.app_config.RICH_TEXT_PREVIEW__CSS_PATH),
                    ],
                    # INFO - CH - 2024-11-14 - presentational_hints=True allow weasyprint to keep
                    # the html attribute width and height added by TinyMCE when we resize the
                    # images
                    # presentational_hints=True,
                )

            if not filename or filename == "raw":
                filename = default_filename
            return HapicFile(
                file_path=pdf_preview_path.name,
                filename=filename,
                as_attachment=force_download,
                last_modified=last_modified,
            )

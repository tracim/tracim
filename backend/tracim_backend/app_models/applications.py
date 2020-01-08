# coding=utf-8
import typing

from tracim_backend.app_models.contents import ContentType
from tracim_backend.models.roles import WorkspaceRoles

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG  # noqa: F401
    from tracim_backend.app_models.contents import ContentStatus  # noqa: F401
    from tracim_backend.lib.utils.app import TracimApplication


class TracimApplicationInContext(object):
    """
    Application class with data needed for frontend
    """

    def __init__(self, app_config: "CFG", app: "TracimApplication") -> None:
        self.app = app
        self.app_config = app_config

    @property
    def label(self) -> str:
        return self.app.label

    @property
    def slug(self) -> str:
        return self.app.slug

    @property
    def fa_icon(self) -> str:
        return self.app.fa_icon

    @property
    def hexcolor(self) -> str:
        return self._get_hexcolor_or_default(self.app.slug, self.app_config)

    @property
    def is_active(self) -> int:
        return self.app.is_active

    @property
    def config(self) -> typing.Dict:
        return self.app.config

    @property
    def main_route(self) -> str:
        return self.app.main_route

    @property
    def content_types(self) -> typing.List[ContentType]:
        return self.app.content_types

    # TODO - G.M - 2018-08-07 - Refactor slug coherence issue like this one.
    # we probably should not have 2 kind of slug
    @property
    def minislug(self) -> str:
        return self.slug.replace("contents/", "")

    def add_content_type(
        self,
        label: str,
        slug: str,
        creation_label: str,
        available_statuses: typing.List["ContentStatus"],
        slug_alias: typing.List[str] = None,
        allow_sub_content: bool = False,
        file_extension: typing.Optional[str] = None,
        minimal_role_content_creation: WorkspaceRoles = WorkspaceRoles.CONTRIBUTOR,
    ) -> None:
        content_type = ContentType(
            slug=slug,
            fa_icon=self.fa_icon,
            label=label,
            hexcolor=self.hexcolor,
            creation_label=creation_label,
            available_statuses=available_statuses,
            slug_alias=slug_alias,
            allow_sub_content=allow_sub_content,
            file_extension=file_extension,
            minimal_role_content_creation=minimal_role_content_creation,
        )
        self.content_types.append(content_type)

    def _get_hexcolor_or_default(self, slug: str, app_config: "CFG") -> str:
        assert app_config.APPS_COLORS
        assert "primary" in app_config.APPS_COLORS
        if slug in app_config.APPS_COLORS:
            return app_config.APPS_COLORS[slug]
        return app_config.APPS_COLORS["primary"]

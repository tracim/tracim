# coding=utf-8
import typing

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG
    from tracim_backend.lib.utils.app import TracimApplication
    from tracim_backend.lib.utils.app import TracimContentType  # noqa F401


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
    def is_active(self) -> bool:
        return self.app.is_active

    @property
    def config(self) -> typing.Dict:
        return self.app.config

    @property
    def main_route(self) -> str:
        return self.app.main_route

    @property
    def content_types(self) -> typing.List["TracimContentType"]:
        return self.app.content_types

    # TODO - G.M - 2018-08-07 - Refactor slug coherence issue like this one.
    # we probably should not have 2 kind of slug
    @property
    def minislug(self) -> str:
        return self.slug.replace("contents/", "")

    def _get_hexcolor_or_default(self, slug: str, app_config: "CFG") -> str:
        assert app_config.APPS_COLORS
        assert "primary" in app_config.APPS_COLORS
        if slug in app_config.APPS_COLORS:
            return app_config.APPS_COLORS[slug]
        return app_config.APPS_COLORS["primary"]

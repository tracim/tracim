# coding=utf-8
import typing

from tracim_backend.app_models.contents import ContentType
from tracim_backend.models.roles import WorkspaceRoles

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG
    from tracim_backend.app_models.contents import ContentStatus


class Application(object):
    """
    Application class with data needed for frontend
    """
    def __init__(
            self,
            label: str,
            slug: str,
            fa_icon: str,
            is_active: bool,
            config: typing.Dict[str, str],
            main_route: str,
            app_config: 'CFG',
    ) -> None:
        """
        @param label: public label of application
        @param slug: identifier of application
        @param fa_icon: font awesome icon class
        @param is_active: True if application enable, False if inactive
        @param config: a dict with eventual application config
        @param main_route: the route of the frontend "home" screen of
        the application. For exemple, if you have an application
        called "calendar", the main route will be something
        like /workspace/{wid}/calendar.
        """
        self.label = label
        self.slug = slug
        self.fa_icon = fa_icon
        self.hexcolor = self._get_hexcolor_or_default(slug, app_config)
        self.is_active = is_active
        self.config = config
        self.main_route = main_route
        self.content_types = []

    # TODO - G.M - 2018-08-07 - Refactor slug coherence issue like this one.
    # we probably should not have 2 kind of slug
    @property
    def minislug(self):
        return self.slug.replace('contents/', '')

    def add_content_type(
            self,
            label: str,
            slug: str,
            creation_label: str,
            available_statuses: typing.List['ContentStatus'],
            slug_alias: typing.List[str] = None,
            allow_sub_content: bool = False,
            file_extension: typing.Optional[str] = None,
            minimal_role_content_creation: WorkspaceRoles = WorkspaceRoles.CONTRIBUTOR,
    ):
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

    def _get_hexcolor_or_default(self, slug: str, app_config: 'CFG') -> str:
        assert app_config.APPS_COLORS
        assert 'primary' in app_config.APPS_COLORS
        if slug in app_config.APPS_COLORS:
            return app_config.APPS_COLORS[slug]
        return app_config.APPS_COLORS['primary']

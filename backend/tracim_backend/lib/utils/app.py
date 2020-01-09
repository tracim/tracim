from abc import ABC
import typing

from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.applications import TracimApplicationInContext
from tracim_backend.models.roles import WorkspaceRoles

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG  # noqa:F401
    from tracim_backend.app_models.contents import ContentStatus  # noqa:F401


class TracimContentType(ABC):
    def __init__(
        self,
        slug: str,
        fa_icon: str,
        label: str,
        creation_label: str,
        available_statuses: typing.List["ContentStatus"],
        app: "TracimApplication" = None,
        slug_alias: typing.List[str] = None,
        allow_sub_content: bool = False,
        file_extension: typing.Optional[str] = None,
        minimal_role_content_creation: WorkspaceRoles = WorkspaceRoles.CONTRIBUTOR,
    ) -> None:
        self.slug = slug
        self.fa_icon = fa_icon
        self.label = label
        self.creation_label = creation_label
        self.available_statuses = available_statuses
        self.slug_alias = slug_alias
        self.allow_sub_content = allow_sub_content
        self.file_extension = file_extension
        self.minimal_role_content_creation = minimal_role_content_creation
        self.app = app


class TracimApplication(ABC):
    def __init__(
        self,
        label: str,
        slug: str,
        fa_icon: str,
        is_active: bool,
        config: typing.Dict[str, str],
        main_route: str,
    ) -> None:
        self.label = label
        self.slug = slug
        self.fa_icon = fa_icon
        self.is_active = is_active
        self.config = config
        self.main_route = main_route
        self.content_types = []  # typing.List[ContentType]

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
        content_type = TracimContentType(
            slug=slug,
            fa_icon=self.fa_icon,
            label=label,
            creation_label=creation_label,
            available_statuses=available_statuses,
            slug_alias=slug_alias,
            allow_sub_content=allow_sub_content,
            file_extension=file_extension,
            minimal_role_content_creation=minimal_role_content_creation,
            app=self,
        )
        self.content_types.append(content_type)

    def load_content_types(self):
        """load app content type"""
        raise NotImplementedError()

    def get_application_in_context(self, app_config: "CFG") -> TracimApplicationInContext:
        """ Create Tracim application in context for frontend"""
        raise NotImplementedError()

    def load_config(self, app_config: "CFG") -> None:
        """
        Allow to load specific config parameter, example:
        >>> app_config.TEST__EXAMPLE_CONFIG_PARAMETER = app_config.get_raw_config("test.example_config_parameter")
        """
        raise NotImplementedError()

    def check_config(self, app_config: "CFG") -> None:
        """
        Check app specific config consistency, example:
        >>> app_config.check_mandatory_param("TEST__EXAMPLE_CONFIG_PARAMETER", app_config.TEST__EXAMPLE_CONFIG_PARAMETER)
        """
        raise NotImplementedError()

    def import_controllers(
        self,
        configurator: Configurator,
        app_config: "CFG",
        route_prefix: str,
        context: PyramidContext,
    ) -> None:
        """
        Allow to import Controller and other stuff in Tracim web context
        """
        raise NotImplementedError()

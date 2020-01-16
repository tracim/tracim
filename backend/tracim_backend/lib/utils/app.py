from abc import ABC
import typing

from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.models.roles import WorkspaceRoles

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG  # noqa:F401
    from tracim_backend.app_models.contents import ContentStatus, content_status_list  # noqa:F401


class TracimContentType(ABC):
    def __init__(
        self,
        slug: str,
        fa_icon: str,
        label: str,
        creation_label: str,
        available_statuses: typing.List["ContentStatus"],
        app: "TracimApplication" = None,
        slug_aliases: typing.List[str] = None,
        allow_sub_content: bool = False,
        file_extension: typing.Optional[str] = None,
        minimal_role_content_creation: WorkspaceRoles = WorkspaceRoles.CONTRIBUTOR,
    ) -> None:
        self.slug = slug
        self.fa_icon = fa_icon
        self.label = label
        self.creation_label = creation_label
        self.available_statuses = available_statuses
        self.slug_alias = slug_aliases
        self.allow_sub_content = allow_sub_content
        self.file_extension = file_extension
        self.minimal_role_content_creation = minimal_role_content_creation
        self.app = app


class TracimApplication(ABC):
    """
    Specification for Tracim Application

    Create a subclass of this application to create a new application and load it into tracim.
    Default tracim app are loaded by importing "tracim_backend/applications/<application_name>/application.py"
    and running local create_app() method which return a TracimApplication.
    you need to implements all the methods of TracimApplication, to make application work correctly.

    Use "pass" if you don't want to put anything in one of the required method. example:
    >>> def load_config(self, app_config: "CFG") -> None:
    >>>    pass

    If you want more examples, check "tracim_backend/applications/<application_name>/application.py" files.
    """

    def __init__(
        self, label: str, slug: str, fa_icon: str, config: typing.Dict[str, str], main_route: str
    ) -> None:
        self.label = label
        self.slug = slug
        self.fa_icon = fa_icon
        self.config = config
        self.main_route = main_route
        self.content_types = []  # typing.List[ContentType]
        self.is_active = False

    def load_content_types(self) -> None:
        """
        load app content type, by adding TracimContentType object
        into app.content_types list
        example:
        >>> content_type = TracimContentType(
        >>>     slug='html-document',
        >>>     fa_icon=self.fa_icon,
        >>>     label="Text Document",
        >>>     creation_label="Write a document",
        >>>     available_statuses=content_status_list.get_all(),
        >>>     slug_aliases=["page"],
        >>>     allow_sub_content=False,
        >>>     file_extension=".document.html",
        >>>     minimal_role_content_creation=WorkspaceRoles.CONTRIBUTOR,
        >>>     app=self,
        >>> )
        >>> self.content_types.append(content_type)
        "allow_sub_content" should be true for folder like type.
        "minimal_role_content_creation" set minimal role required to create this kind of file
        """
        raise NotImplementedError()

    def load_config(self, app_config: "CFG") -> None:
        """
        Allow to load specific config parameter,
        example:
        >>> app_config.TEST__EXAMPLE_CONFIG_PARAMETER = app_config.get_raw_config("test.example_config_parameter")
        """
        raise NotImplementedError()

    def check_config(self, app_config: "CFG") -> None:
        """
        Check app specific config consistency.
        This should raise ConfigurationError exception if config loaded in "load_config" method is inconsistent.

        - you can use conditional with app_config parameter to make check only in some specific case.
        - you can use app_config.check_mandatory_param to make parameter required (empty value not
        allowed). Be careful, if you set a default value, it will be used by default, default value need
         also to be Falsy (False, "", None or []) to raise Exception about parameter required. This
         will raise ConfigurationError.
        example:
        >>> if app_config.COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE == COLLABORA_DOCUMENT_EDITION_SLUG:
        >>>     app_config.check_mandatory_param(
        >>>        "COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL",
        >>>        app_config.COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL,
        >>>        when_str="if collabora feature is activated",
        >>>    )
        - you can use also app_config.check_directory_path_param to check
        if directory provided is correct, writable or/and readable. This
         will raise ConfigurationError.
        example:
        >>> app_config.check_directory_path_param(
        >>>    "CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER",
        >>>    app_config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
        >>>    writable=True,
        >>>    readable=True,
        >>>)
        - you can add other check like this :
        >>> if not os.path.exists(app_config.COLOR__CONFIG_FILE_PATH):
        >>>    raise ConfigurationError(
        >>>        "ERROR: {config_value} file does not exist. "
        >>>        'please create it or set "{config_name}"'
        >>>        "with a correct value".format(
        >>>          config_name="COLOR__CONFIG_FILE_PATH",
        >>>          config_value=app_config.COLOR__CONFIG_FILE_PATH
        >>>        )
        >>>    )
        """
        raise NotImplementedError()

    def load_controllers(
        self,
        configurator: Configurator,
        app_config: "CFG",
        route_prefix: str,
        context: PyramidContext,
    ) -> None:
        """
        Allow to import Controller and other stuff in Tracim web context.

        To import controller in tracim web app (pyramid) you need to use configurator.include on bind
        method of a Controller object.
        route_prefix should be by default BASE_API_V2 ("/api/v2/")
        example:
        >>> from tracim_backend.applications.content_html_document.controller import (
        >>>     HTMLDocumentController,
        >>> )
        >>> html_document_controller = HTMLDocumentController()
        >>> configurator.include(html_document_controller.bind, route_prefix=BASE_API_V2)
        # you can also check Controller object documentation or pyramid configurator doc:
        # https://docs.pylonsproject.org/projects/pyramid/en/latest/api/config.html

        # It's also the best place to add new globally web handled exception (handled by hapic):
        >>> context.handle_exception(CaldavNotAuthorized, HTTPStatus.FORBIDDEN)
        >>> context.handle_exception(CaldavNotAuthenticated, HTTPStatus.UNAUTHORIZED)
        # whenever you raise CaldavNotAuthenticated exception in a view, it will raise
        # HTTPStatus.UNAUTHORIZED -> HTTP code 401.
        """
        raise NotImplementedError()

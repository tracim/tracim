from abc import ABC

from pyramid.config import Configurator


class Controller(ABC):
    """
    Specification for Tracim Web Controller.

    Here you can add a new controller which had few http endpoint.
    Endpoint are handled by Pyramid Framework and Hapic framework:
    - https://docs.pylonsproject.org/projects/pyramid/en/latest/api/config.html
    - https://github.com/algoo/hapic

    to limit access to endpoint, you can use "check_right" decorator and some of
    the default decorator available in "tracim_backend.lib.utils.authorization" like
    "is_user". Those decorator will check current request context and check if right
    is ok or not, it will return specific exception.
     For example, "is_user" will raise "InsufficientUserProfile"

    Example of simple controller:
    >>> class MyController(Controller):
    ...    @hapic.with_api_doc(tags=[SWAGGER_TAG_SYSTEM_ENDPOINTS])
    ...    @check_right(is_user)
    ...    @hapic.output_body(AboutSchema())
    ...    def about(self, context, request: TracimRequest, hapic_data=None,request=None):
    ...        app_config = request.registry.settings["CFG"]  # type: CFG
    ...        system_api = SystemApi(app_config)
    ...        return system_api.get_about()
    ...
    ...    def bind(self, configurator: Configurator) -> None:
    ...        configurator.add_route("about", "/system/about", request_method="GET")
    ...        configurator.add_view(self.about, route_name="about")
    ... # doctest: +SKIP
    """

    def bind(self, configurator: Configurator) -> None:
        """
        Method to add endpoints to configurator.

        :param configurator: pyramid Configurator
        :return: Nothing
        """
        raise NotImplementedError()

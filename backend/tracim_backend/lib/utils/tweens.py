import re
import typing

from pyramid.registry import Registry
from pyramid.request import Request
from pyramid.response import Response

from tracim_backend.lib.utils.logger import logger

PROFILER_TWEEN__PATH__KEY = "profiler_tween.path"

Handler = typing.Callable[[Request], Response]


def profiler_tween_factory(handler: Handler, registry: Registry) -> Handler:
    """Factory for a pyramid tween allowing to profile a request using pyinstrument.

    Useful to profile request in a production (docker/uwsgi) environment as pyramid
    debug_toolbar is not functional in such an environment.

    Activate it by:
      - installing pyinstrument (pip install pyinstrument)
      - setting pyramid.tweens in development.ini [app:tracim_web] section:

            pyramid.tweens = tracim_backend.lib.utils.tweens.profiler_tween_factory pyramid_tm.tm_tween_factory pyramid.tweens.excview_tween_factor

        The order and other tweens are important.
        (see https://docs.pylonsproject.org/projects/pyramid/en/2.0-branch/narr/hooks.html#explicit-tween-ordering).
      - setting the profiled path with:

            profiler_tween.path = <method>:<path>

        Both <method> and <path> are written with a regex, for example:

            profiler_tween.path = (POST|GET):\/api\/workspaces\/\d+\/files  # noqa: W605

        would match both POST and GET methods for the given path.
        As the path is a regex, the slashes in the path must be escaped.
    The real request's timing (e.g. as measured by a client) is changed as the call to profiler.output_text() can be slow.
    """
    if not registry.settings.get(PROFILER_TWEEN__PATH__KEY):
        return handler

    # NOTE SGD 2022-03-24 - importing here to avoid requiring pyinstrument as a tracim dependency
    import pyinstrument

    def profiler_tween(request: Request) -> Response:
        request_match = f"{request.method}:{request.path}"
        if not re.match(registry.settings[PROFILER_TWEEN__PATH__KEY], request_match):
            return handler(request)
        with pyinstrument.Profiler() as profiler:
            response = handler(request)

        logger.debug(logger, profiler.output_text())
        return response

    return profiler_tween

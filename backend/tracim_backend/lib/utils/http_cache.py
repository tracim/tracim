from pyramid.events import INewResponse

from tracim_backend.views import BASE_API


def default_to_cache_control_no_store(event: INewResponse) -> None:
    request = event.request
    if not request.path.startswith(BASE_API):
        return
    response = event.response
    if "Cache-Control" not in response.headers:
        response.headers["Cache-Control"] = "no-store"

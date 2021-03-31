from typing import Optional

from webpreview import web_preview

from tracim_backend.config import CFG


class URLPreview:
    def __init__(self, title: Optional[str], description: Optional[str], image: Optional[str]):
        self.title = title
        self.description = description
        self.image = image


class URLPreviewLib(object):
    def __init__(self, config: CFG,) -> None:
        self.app_config = config

    def get_preview(self, url: str) -> URLPreview:
        title, description, image = web_preview(
            url, timeout=self.app_config.URL_PREVIEW__FETCH_TIMEOUT
        )
        return URLPreview(title=title, description=description, image=image)

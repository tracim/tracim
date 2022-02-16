from typing import Optional
from urllib.parse import urljoin
from urllib.parse import urlparse

import requests
from requests import Response
from requests.exceptions import InvalidURL
from webpreview import WebpreviewException
from webpreview import web_preview

from tracim_backend.config import CFG
from tracim_backend.exceptions import UnavailableURLPreview

MAX_CONTENT_LENGTH_FOR_URL_PREVIEW = 1048576  # 1Mo

# NOTE - SG - 2021-04-16: uncomment those lines to debug the request headers/response
# import http.client
# import logging
# requests_log = logging.getLogger("urllib3")
# requests_log.setLevel(logging.DEBUG)
# requests_log.propagate = True
# httpclient_logger = logging.getLogger("http.client")
# httpclient_logger.setLevel(logging.DEBUG)


# def httpclient_logging_patch(level=logging.DEBUG):
#    """Enable HTTPConnection debug logging to the logging framework"""

#    def httpclient_log(*args):
#        httpclient_logger.log(level, " ".join(args))

#    # mask the print() built-in in the http.client module to use
#    # logging instead
#    http.client.print = httpclient_log
#    # enable debugging
#    http.client.HTTPConnection.debuglevel = 1
# httpclient_logging_patch()


class URLPreview:
    def __init__(self, title: Optional[str], description: Optional[str], image: Optional[str]):
        self.title = title
        self.description = description
        self.image = image


def get_filename_from_response(response: Response):
    # TODO - G.M - 2022-02-16 - use content-disposition header if exist isntead
    # of url path.
    # this is tricky as we need to decode it if utf-8 encoded.
    return urlparse(response.url).path.rsplit("/", 1)[-1]


class URLPreviewLib(object):
    def __init__(self, config: CFG,) -> None:
        self.app_config = config

    def get_preview(self, url: str) -> URLPreview:
        with requests.get(
            url,
            timeout=self.app_config.URL_PREVIEW__FETCH_TIMEOUT,
            stream=True,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; Tracim bot; +https://www.tracim.fr)",
                "Accept": "image/*,text/html",
                # INFO - SG - 2021-04-16 - Needed to bypass google and youtube cookie consent banner
                # See https://github.com/tracim/tracim/issues/4470
                "Cookie": "CONSENT=PENDING+999",
            },
        ) as r:
            content_type = r.headers.get("content-type")
            content_length = r.headers.get("content-length")
            title = get_filename_from_response(r)
            description = content_type
            image_url = None
            if not content_type:
                pass
            elif content_type.startswith("text/html"):
                try:
                    title, description, image_url = web_preview(
                        url,
                        timeout=self.app_config.URL_PREVIEW__FETCH_TIMEOUT,
                        headers={
                            "User-Agent": "Mozilla/5.0 (compatible; Tracim bot; +https://www.tracim.fr)",
                            "Accept": "text/html",
                            # INFO - SG - 2021-04-16 - Needed to bypass google and youtube cookie consent banner
                            # See https://github.com/tracim/tracim/issues/4470
                            "Cookie": "CONSENT=PENDING+999",
                        },
                    )
                except (WebpreviewException, InvalidURL) as exc:
                    raise UnavailableURLPreview(
                        'Can\'t generate URL preview for "{}"'.format(url)
                    ) from exc
                image_url = urljoin(url, image_url) if image_url else None
            if not content_length:
                pass
            elif int(content_length) > MAX_CONTENT_LENGTH_FOR_URL_PREVIEW:
                pass
            elif content_type and content_type.startswith("image/"):
                description = content_type
                image_url = url
            else:
                pass
        return URLPreview(title=title, description=description, image=image_url)

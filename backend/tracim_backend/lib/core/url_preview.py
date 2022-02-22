from typing import Optional
from urllib.parse import urljoin
from urllib.parse import urlparse

from requests.exceptions import InvalidURL
from webpreview import LengthLimitedResponse
from webpreview import WebpreviewException
from webpreview import do_request
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


class URLPreviewResponse(LengthLimitedResponse):
    def __init__(self, response: LengthLimitedResponse) -> None:
        self.__setstate__(response.__getstate__())
        self.content_length_limit = response.content_length_limit
        self.origin_url = response.origin_url

    @property
    def is_html(self) -> bool:
        return self.headers.get("content-type").startswith("text/html")

    @property
    def is_image(self) -> bool:
        return self.headers.get("content-type").startswith("image")

    @property
    def filename(self) -> str:
        # TODO - G.M - 2022-02-16 - use content-disposition header if exist instead
        # of url path.
        # this is tricky as we need to decode it if utf-8 encoded.
        return urlparse(self.url).path.rsplit("/", 1)[-1]

    @property
    def mimetype(self) -> str:
        return self.headers.get("content-type")


class URLPreviewLib(object):
    def __init__(self, config: CFG,) -> None:
        self.app_config = config

    def get_preview(self, url: str) -> URLPreview:
        try:
            response = URLPreviewResponse(
                do_request(
                    url,
                    timeout=self.app_config.URL_PREVIEW__FETCH_TIMEOUT,
                    headers={
                        "User-Agent": "Mozilla/5.0 (compatible; Tracim bot; +https://www.tracim.fr)",
                        "Accept": "image/*,text/html;q=0.8",
                        # INFO - SG - 2021-04-16 - Needed to bypass google and youtube cookie consent banner
                        # See https://github.com/tracim/tracim/issues/4470
                        "Cookie": "CONSENT=PENDING+999",
                    },
                    content_length_limit=MAX_CONTENT_LENGTH_FOR_URL_PREVIEW,
                )
            )
            # INFO - GM - 2022-02-22 - Default case: preview from html metadata
            if response.is_html:
                title, description, image_url = web_preview(url=url, content=response.text_content)
            # INFO - GM - 2022-02-22 - Small image case: preview is image itself
            elif response.is_image and response.allowed_content_length:
                title = response.filename
                description = response.mimetype
                image_url = url
            # INFO - GM - 2022-02-22 - others case: return only few informations
            else:
                title = response.filename
                description = response.mimetype
                image_url = None
        except (WebpreviewException, InvalidURL) as exc:
            raise UnavailableURLPreview('Can\'t generate URL preview for "{}"'.format(url)) from exc
        image_url = urljoin(url, image_url) if image_url else None
        # HACK - GM - 2022-02-22 - waiting for frontend fix to allow empty description or title ?
        description = description or "EMPTY"
        title = title or "EMPTY"
        return URLPreview(title=title, description=description, image=image_url)

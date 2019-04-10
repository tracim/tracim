# coding: utf-8
import copy
import typing
from urllib.parse import urljoin

import requests
from pyramid.response import Response as PyramidResponse
from requests import Response as RequestsResponse
from tracim_backend.lib.utils.request import TracimRequest

HOP_BY_HOP_HEADER_HTTP = (
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
)

DEFAULT_RESPONSE_HEADER_TO_DROP = HOP_BY_HOP_HEADER_HTTP + (
    # FIXME - G.M - 2019-03-08 - for unknown reason content_length and
    # content-encoding
    # differ between radicale_header and proxy response.
    # This make pyramid raise exception, to force renew creation of
    # content_length, we can disable content_length header and
    # content-encoding header
    'content-length',
    'content-encoding'
)
DEFAULT_REQUEST_HEADER_TO_DROP = HOP_BY_HOP_HEADER_HTTP + (
    'authorization',
)

class Proxy(object):
    def __init__(
        self,
        base_address: str,
        default_request_headers_to_drop: typing.List[str] = DEFAULT_REQUEST_HEADER_TO_DROP,
        default_response_headers_to_drop: typing.List[str] = DEFAULT_RESPONSE_HEADER_TO_DROP,
        auth: typing.Optional[tuple] = None
    ) -> None:
        self._base_address = base_address
        self.default_request_headers_to_drop = default_request_headers_to_drop
        self.default_response_headers_to_drop = default_response_headers_to_drop
        self.auth = auth

    def _get_behind_response(
            self,
            method: str,
            headers: dict,
            data: dict,
            url: str,
            auth: typing.Optional[tuple],
    ) -> RequestsResponse:
        return requests.request(
            method=method,
            # FIXME BS 2018-11-29: Exclude some headers (like basic auth)
            headers=headers,
            data=data,
            url=url,
            auth=auth,
        )

    def _generate_proxy_response(self, status, headers: dict, body):
        return PyramidResponse(
            status=status,
            headers=headers,
            body=body,
        )
    def _add_extra_headers(self, headers: dict, extra_headers: dict):
        extra_headers = copy.deepcopy(extra_headers)
        new_headers = copy.deepcopy(headers)
        new_headers.update(extra_headers)
        return new_headers

    def _drop_request_headers(self, headers: dict) -> dict:
        new_headers = {}
        for header_name, header_value in dict(headers).items():
            if header_name.lower() in self.default_request_headers_to_drop:
                continue
            new_headers[header_name] = header_value
        return new_headers

    def _drop_response_headers(self, headers: dict) -> dict:
        new_headers = {}
        for header_name, header_value in dict(headers).items():
            if header_name.lower() in self.default_response_headers_to_drop:
                continue
            new_headers[header_name] = header_value
        return new_headers

    def get_response_for_request(
        self,
        request: TracimRequest,
        path: str,
        extra_request_headers: typing.Optional[dict]=None,
        extra_response_headers: typing.Optional[dict]=None,
    ) -> PyramidResponse:
        # INFO - G.M - 2019-03-08 - Prepare behind request
        request_headers = dict(request.headers)
        extra_request_headers = extra_request_headers or {}
        request_headers = self._drop_request_headers(request_headers)
        if extra_request_headers:
            request_headers = self._add_extra_headers(request_headers, extra_request_headers)
        behind_url = urljoin(self._base_address, path)


        behind_response = self._get_behind_response(
            method=request.method,
            headers=request_headers,
            data=request.body,
            url=behind_url,
            auth=self.auth,
        )

        # INFO - G.M - 2019-03-08 - Prepare proxy response
        response_headers = dict(behind_response.headers)
        response_headers = self._drop_response_headers(response_headers)
        if extra_response_headers:
            response_headers = self._add_extra_headers(request_headers, extra_response_headers)

        return self._generate_proxy_response(
            status=behind_response.status_code,
            headers=response_headers,
            body=behind_response.content
        )

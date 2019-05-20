from tracim_backend.lib.proxy.proxy import Proxy


class TestProxy(object):
    def test_add_extra_headers__ok__empty_extra_headers(self):
        proxy = Proxy("http://localhost:8080")
        headers = {
            "Authorization": "Basic dGVzdEB0ZXN0LnRlc3Q6dGVzdEB0ZXN0LnRlc3Q=",
            "Content-Length": "0",
            "Host": "localhost:80",
        }
        new_headers = proxy._add_extra_headers(headers=headers, extra_headers={})
        assert headers == new_headers

    def test_add_extra_headers__ok__with_extra_headers(self):
        proxy = Proxy("http://localhost:8080")
        headers = {
            "Authorization": "Basic dGVzdEB0ZXN0LnRlc3Q6dGVzdEB0ZXN0LnRlc3Q=",
            "Content-Length": "0",
            "Host": "localhost:80",
        }
        extra_header = {"Remote-User": "admin@admin.admin"}
        new_headers = proxy._add_extra_headers(headers=headers, extra_headers=extra_header)
        assert new_headers != headers
        assert new_headers != extra_header
        assert new_headers == {
            "Authorization": "Basic dGVzdEB0ZXN0LnRlc3Q6dGVzdEB0ZXN0LnRlc3Q=",
            "Content-Length": "0",
            "Host": "localhost:80",
            "Remote-User": "admin@admin.admin",
        }

    def test_drop_request_headers__ok__nominal_case(self):
        proxy = Proxy("http://localhost:8080", default_request_headers_to_drop=("connection"))

        headers = {
            "Authorization": "Basic dGVzdEB0ZXN0LnRlc3Q6dGVzdEB0ZXN0LnRlc3Q=",
            "Content-Length": "0",
            "Host": "localhost:80",
            "Content-Encoding": "gzip",
            "Connection": "keep-alive",
        }
        new_headers = proxy._drop_request_headers(headers=headers)
        assert new_headers == {
            "Authorization": "Basic dGVzdEB0ZXN0LnRlc3Q6dGVzdEB0ZXN0LnRlc3Q=",
            "Content-Length": "0",
            "Host": "localhost:80",
            "Content-Encoding": "gzip",
        }

    def test_drop_response_headers__ok__nominal_case(self):
        proxy = Proxy("http://localhost:8080", default_response_headers_to_drop=("connection"))
        headers = {
            "Authorization": "Basic dGVzdEB0ZXN0LnRlc3Q6dGVzdEB0ZXN0LnRlc3Q=",
            "Content-Length": "0",
            "Host": "localhost:80",
            "Content-Encoding": "gzip",
            "Connection": "keep-alive",
        }
        new_headers = proxy._drop_response_headers(headers=headers)
        assert new_headers == {
            "Authorization": "Basic dGVzdEB0ZXN0LnRlc3Q6dGVzdEB0ZXN0LnRlc3Q=",
            "Host": "localhost:80",
            "Content-Length": "0",
            "Content-Encoding": "gzip",
        }

    def test_get_response_for_request__ok_nominal_case(self):
        proxy = Proxy("http://localhost:8080")

        def mocked_generate_proxy_response(status, headers, body):
            response = FakeResponse()
            response.headers = headers
            response.status_code = status
            response.body = body
            return response

        def mocked_get_behind_response(method, headers, data, url, auth):
            return FakeResponse()

        class FakeResponse(object):
            def __init__(self):
                self.headers = {
                    "Authorization": "Basic dGVzdEB0ZXN0LnRlc3Q6dGVzdEB0ZXN0LnRlc3Q=",
                    "Content-Length": "0",
                    "Host": "localhost:80",
                    "Content-Encoding": "gzip",
                    "Connection": "keep-alive",
                }
                self.body = b"Nothing"
                self.content = self.body
                self.status_code = 200

        class FakeRequest(object):
            def __init__(self):
                self.headers = {
                    "Authorization": "Basic dGVzdEB0ZXN0LnRlc3Q6dGVzdEB0ZXN0LnRlc3Q=",
                    "Content-Length": "0",
                    "Host": "localhost:80",
                    "Content-Encoding": "gzip",
                    "Connection": "keep-alive",
                }
                self.body = b"Nothing"
                self.method = "GET"
                self.auth = None

        proxy._generate_proxy_response = mocked_generate_proxy_response
        proxy._get_behind_response = mocked_get_behind_response

        response = proxy.get_response_for_request(
            request=FakeRequest(),
            path="/endpoint",
            extra_request_headers={},
            extra_response_headers={"extra_header": "extra_header"},
        )
        test_fake_response = FakeResponse()
        assert isinstance(response, FakeResponse)
        assert response.body == test_fake_response.body
        assert response.headers != test_fake_response.headers
        assert response.headers.get("extra_header") == "extra_header"
        assert response.status_code == test_fake_response.status_code

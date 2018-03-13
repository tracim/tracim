from wsgidav.http_authenticator import HTTPAuthenticator
from wsgidav import util

_logger = util.getModuleLogger(__name__, True)


class TracimHTTPAuthenticator(HTTPAuthenticator):
    def computeDigestResponse(
            self,
            username,
            realm,
            password,
            method,
            uri,
            nonce,
            cnonce,
            qop,
            nc
    ):
        """
        Override standard computeDigestResponse : as user password is already
        hashed in database, we need to use left_digest_response_hash
        to have correctly hashed digest_response.
        """

        # TODO - G.M - 13-03-2018 Check if environ is useful
        # for get_left_digest_response. If true, find a solution
        # to obtain it here without recopy-paste whole authDigestAuthRequest
        # method.
        left_digest_response_hash = self._domaincontroller.get_left_digest_response_hash(realm, username, None)  # nopep8
        if left_digest_response_hash:
            return self.tracim_compute_digest_response(
                left_digest_response_hash=left_digest_response_hash,
                method=method,
                uri=uri,
                nonce=nonce,
                cnonce=cnonce,
                qop=qop,
                nc=nc,
            )
        else:
            return None

    def tracim_compute_digest_response(
            self,
            left_digest_response_hash,
            method,
            uri,
            nonce,
            cnonce,
            qop,
            nc
    ):
        # TODO : Rename A to something more correct
        A = "{method}:{uri}".format(method=method, uri=uri)
        if qop:
            right_digest_response_hash = "{nonce}:{nc}:{cnonce}:{qop}:{A}".format(  # nopep8
                nonce=nonce,
                nc=nc,
                cnonce=cnonce,
                qop=qop,
                method=method,
                uri=uri,
                A=self.md5h(A),
            )
        else:
            right_digest_response_hash = "{nonce}:{A}".format(
                nonce=nonce,
                A=self.md5h(A),
            )
        digestresp = self.md5kd(
            left_digest_response_hash,
            right_digest_response_hash,
        )

        return digestresp

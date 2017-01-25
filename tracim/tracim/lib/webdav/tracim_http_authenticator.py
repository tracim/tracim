import os
import re

from wsgidav.http_authenticator import HTTPAuthenticator
from wsgidav import util
import cherrypy

from tracim.lib.user import CurrentUserGetterApi
from tracim.lib.user import CURRENT_USER_WSGIDAV

_logger = util.getModuleLogger(__name__, True)
HOTFIX_WINXP_AcceptRootShareLogin = True


class TracimHTTPAuthenticator(HTTPAuthenticator):
    def __init__(self, application, config):
        super(TracimHTTPAuthenticator, self).__init__(application, config)
        self._headerfixparser = re.compile(r'([\w]+)=("[^"]*,[^"]*"),')

    def authDigestAuthRequest(self, environ, start_response):
        realmname = self._domaincontroller.getDomainRealm(environ["PATH_INFO"], environ)

        isinvalidreq = False

        authheaderdict = dict([])
        authheaders = environ["HTTP_AUTHORIZATION"] + ","
        if not authheaders.lower().strip().startswith("digest"):
            isinvalidreq = True
            # Hotfix for Windows file manager and OSX Finder:
        # Some clients don't urlencode paths in auth header, so uri value may
        # contain commas, which break the usual regex headerparser. Example:
        # Digest username="user",realm="/",uri="a,b.txt",nc=00000001, ...
        # -> [..., ('uri', '"a'), ('nc', '00000001'), ...]
        # Override any such values with carefully extracted ones.
        authheaderlist = self._headerparser.findall(authheaders)
        authheaderfixlist = self._headerfixparser.findall(authheaders)
        if authheaderfixlist:
            _logger.info("Fixing authheader comma-parsing: extend %s with %s" \
                         % (authheaderlist, authheaderfixlist))
            authheaderlist += authheaderfixlist
        for authheader in authheaderlist:
            authheaderkey = authheader[0]
            authheadervalue = authheader[1].strip().strip("\"")
            authheaderdict[authheaderkey] = authheadervalue

        _logger.debug("authDigestAuthRequest: %s" % environ["HTTP_AUTHORIZATION"])
        _logger.debug("  -> %s" % authheaderdict)

        if "username" in authheaderdict:
            req_username = authheaderdict["username"]
            req_username_org = req_username
            # Hotfix for Windows XP:
            #   net use W: http://127.0.0.1/dav /USER:DOMAIN\tester tester
            # will send the name with double backslashes ('DOMAIN\\tester')
            # but send the digest for the simple name ('DOMAIN\tester').
            if r"\\" in req_username:
                req_username = req_username.replace("\\\\", "\\")
                _logger.info("Fixing Windows name with double backslash: '%s' --> '%s'" % (req_username_org, req_username))

            if not self._domaincontroller.isRealmUser(realmname, req_username, environ):
                isinvalidreq = True
        else:
            isinvalidreq = True

            # TODO: Chun added this comments, but code was commented out
            # Do not do realm checking - a hotfix for WinXP using some other realm's
            # auth details for this realm - if user/password match

        if 'realm' in authheaderdict:
            if authheaderdict["realm"].upper() != realmname.upper():
                if HOTFIX_WINXP_AcceptRootShareLogin:
                    # Hotfix: also accept '/'
                    if authheaderdict["realm"].upper() != "/":
                        isinvalidreq = True
                else:
                    isinvalidreq = True

        if "algorithm" in authheaderdict:
            if authheaderdict["algorithm"].upper() != "MD5":
                isinvalidreq = True  # only MD5 supported

        if "uri" in authheaderdict:
            req_uri = authheaderdict["uri"]

        if "nonce" in authheaderdict:
            req_nonce = authheaderdict["nonce"]
        else:
            isinvalidreq = True

        req_hasqop = False
        if "qop" in authheaderdict:
            req_hasqop = True
            req_qop = authheaderdict["qop"]
            if req_qop.lower() != "auth":
                isinvalidreq = True  # only auth supported, auth-int not supported
        else:
            req_qop = None

        if "cnonce" in authheaderdict:
            req_cnonce = authheaderdict["cnonce"]
        else:
            req_cnonce = None
            if req_hasqop:
                isinvalidreq = True

        if "nc" in authheaderdict:  # is read but nonce-count checking not implemented
            req_nc = authheaderdict["nc"]
        else:
            req_nc = None
            if req_hasqop:
                isinvalidreq = True

        if "response" in authheaderdict:
            req_response = authheaderdict["response"]
        else:
            isinvalidreq = True

        if not isinvalidreq:
            left_digest_response_hash = self._domaincontroller.get_left_digest_response_hash(realmname, req_username, environ)

            req_method = environ["REQUEST_METHOD"]

            required_digest = self.tracim_compute_digest_response(left_digest_response_hash, req_method, req_uri, req_nonce,
                                                         req_cnonce, req_qop, req_nc)

            if required_digest != req_response:
                _logger.warning("computeDigestResponse('%s', '%s', ...): %s != %s" % (
                realmname, req_username, required_digest, req_response))
                isinvalidreq = True
            else:
                _logger.debug("digest succeeded for realm '%s', user '%s'" % (realmname, req_username))
            pass

        if isinvalidreq:
            _logger.warning("Authentication failed for user '%s', realm '%s'" % (req_username, realmname))
            return self.sendDigestAuthResponse(environ, start_response)

        environ["http_authenticator.realm"] = realmname
        environ["http_authenticator.username"] = req_username

        # Set request current user email to be able to recognise him later
        cherrypy.request.current_user_email = req_username
        CurrentUserGetterApi.set_thread_local_getter(CURRENT_USER_WSGIDAV)

        return self._application(environ, start_response)

    def tracim_compute_digest_response(self, left_digest_response_hash, method, uri, nonce, cnonce, qop, nc):
        # A1 : username:realm:password
        A2 = method + ":" + uri
        if qop:
            digestresp = self.md5kd(left_digest_response_hash, nonce + ":" + nc + ":" + cnonce + ":" + qop + ":" + self.md5h(A2))
        else:
            digestresp = self.md5kd(left_digest_response_hash, nonce + ":" + self.md5h(A2))
            # print(A1, A2)
        # print(digestresp)
        return digestresp

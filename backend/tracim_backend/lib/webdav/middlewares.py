from datetime import datetime
import ldap3
import os
from pyramid.registry import Registry
from pyramid.threadlocal import get_current_registry
from pyramid_ldap3 import ConnectionManager
from pyramid_ldap3 import Connector
from pyramid_ldap3 import _LDAPQuery
import sys
import threading
import time
import transaction
from wsgidav import util
from wsgidav.mw.base_mw import BaseMiddleware
from xml.etree import ElementTree
import yaml

from tracim_backend.config import CFG
from tracim_backend.lib.core.plugins import init_plugin_manager
from tracim_backend.lib.webdav.dav_provider import WebdavTracimContext
from tracim_backend.models.auth import AuthType
from tracim_backend.models.setup_models import create_dbsession_for_context
from tracim_backend.models.setup_models import get_engine
from tracim_backend.models.setup_models import get_session_factory


class TracimWsgiDavDebugFilter(BaseMiddleware):
    """
    COPY PASTE OF wsgidav.debug_filter.WsgiDavDebugFilter
    WITH ADD OF DUMP RESPONSE & REQUEST
    """

    def __init__(self, wsgidav_app, next_app, config):
        super().__init__(wsgidav_app, next_app, config)
        self._config = config
        #        self.out = sys.stderr
        self.out = sys.stdout
        self.passedLitmus = {}
        # These methods boost verbose=2 to verbose=3
        self.debug_methods = config.get("debug_methods", [])
        # Litmus tests containing these string boost verbose=2 to verbose=3
        self.debug_litmus = config.get("debug_litmus", [])
        # Exit server, as soon as this litmus test has finished
        self.break_after_litmus = [
            #                                   "locks: 15",
        ]

        self.last_request_time = "__NOT_SET__"

        # We disable request content dump for moment
        # if self._config.get('dump_requests'):
        #     # Monkey patching
        #     old_parseXmlBody = util.parseXmlBody
        #     def new_parseXmlBody(environ, allowEmpty=False):
        #         xml = old_parseXmlBody(environ, allowEmpty)
        #         self._dump_request(environ, xml)
        #         return xml
        #     util.parseXmlBody = new_parseXmlBody

    def __call__(self, environ, start_response):
        """"""
        verbose = self._config.get("verbose", 2)
        self.last_request_time = "{0}_{1}".format(
            datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S"),
            int(round(time.time() * 1000)),
        )

        method = environ["REQUEST_METHOD"]

        debugBreak = False
        dumpRequest = False
        dumpResponse = False

        if verbose >= 3 or self._config.get("dump_requests"):
            dumpRequest = dumpResponse = True

        # Process URL commands
        if "dump_storage" in environ.get("QUERY_STRING"):
            dav = environ.get("wsgidav.provider")
            if dav.lockManager:
                dav.lockManager._dump()
            if dav.propManager:
                dav.propManager._dump()

        # Turn on max. debugging for selected litmus tests
        litmusTag = environ.get("HTTP_X_LITMUS", environ.get("HTTP_X_LITMUS_SECOND"))
        if litmusTag and verbose >= 2:
            print("----\nRunning litmus test '%s'..." % litmusTag, file=self.out)
            for litmusSubstring in self.debug_litmus:
                if litmusSubstring in litmusTag:
                    verbose = 3
                    debugBreak = True
                    dumpRequest = True
                    dumpResponse = True
                    break
            for litmusSubstring in self.break_after_litmus:
                if litmusSubstring in self.passedLitmus and litmusSubstring not in litmusTag:
                    print(" *** break after litmus %s" % litmusTag, file=self.out)
                    sys.exit(-1)
                if litmusSubstring in litmusTag:
                    self.passedLitmus[litmusSubstring] = True

        # Turn on max. debugging for selected request methods
        if verbose >= 2 and method in self.debug_methods:
            verbose = 3
            debugBreak = True
            dumpRequest = True
            dumpResponse = True

        # Set debug options to environment
        environ["wsgidav.verbose"] = verbose
        #        environ["wsgidav.debug_methods"] = self.debug_methods
        environ["wsgidav.debug_break"] = debugBreak
        environ["wsgidav.dump_request_body"] = dumpRequest
        environ["wsgidav.dump_response_body"] = dumpResponse

        # Dump request headers
        if dumpRequest:
            print(
                "<%s> --- %s Request ---" % (threading.current_thread().ident, method),
                file=self.out,
            )
            for k, v in environ.items():
                if k == k.upper():
                    print("%20s: '%s'" % (k, v), file=self.out)
            print("\n", file=self.out)
            self._dump_request(environ, xml=None)

        # Intercept start_response
        #
        sub_app_start_response = util.SubAppStartResponse()

        nbytes = 0
        first_yield = True
        app_iter = self.next_app(environ, sub_app_start_response)

        for v in app_iter:
            # Start response (the first time)
            if first_yield:
                # Success!
                start_response(
                    sub_app_start_response.status,
                    sub_app_start_response.response_headers,
                    sub_app_start_response.exc_info,
                )

            # Dump response headers
            if first_yield and dumpResponse:
                print(
                    "<%s> --- %s Response(%s): ---"
                    % (
                        threading.currentThread().ident,
                        method,
                        sub_app_start_response.status,
                    ),
                    file=self.out,
                )
                headersdict = dict(sub_app_start_response.response_headers)
                for envitem in headersdict.keys():
                    print("%s: %s" % (envitem, repr(headersdict[envitem])), file=self.out)
                print("", file=self.out)

            # Check, if response is a binary string, otherwise we probably have
            # calculated a wrong content-length
            assert isinstance(v, (bytes, bytearray)), v

            # Dump response body
            drb = environ.get("wsgidav.dump_response_body")
            if isinstance(drb, (str, bytes, bytearray)):
                # Middleware provided a formatted body representation
                print(drb, file=self.out)
            elif drb is True:
                # Else dump what we get, (except for long GET responses)
                if method == "GET":
                    if first_yield:
                        print(v[:50], "...", file=self.out)
                elif len(v) > 0:
                    print(v, file=self.out)

            if dumpResponse:
                self._dump_response(sub_app_start_response, drb)

            drb = environ["wsgidav.dump_response_body"] = None

            nbytes += len(v)
            first_yield = False
            yield v
        if hasattr(app_iter, "close"):
            app_iter.close()

        # Start response (if it hasn't been done yet)
        if first_yield:
            start_response(
                # Success!
                sub_app_start_response.status,
                sub_app_start_response.response_headers,
                sub_app_start_response.exc_info,
            )

        if dumpResponse:
            print(
                "\n<%s> --- End of %s Response (%i bytes) ---"
                % (threading.currentThread().ident, method, nbytes),
                file=self.out,
            )
        return

    def _dump_response(self, sub_app_start_response, drb):
        dump_to_path = self._config.get("dump_requests_path", "/tmp/wsgidav_dumps")
        os.makedirs(dump_to_path, exist_ok=True)
        dump_file = "{0}/{1}_RESPONSE_{2}.yml".format(
            dump_to_path, self.last_request_time, sub_app_start_response.status[0:3]
        )
        with open(dump_file, "w+") as f:
            dump_content = dict()
            headers = {}
            for header_tuple in sub_app_start_response.response_headers:
                headers[header_tuple[0]] = header_tuple[1]
            dump_content["headers"] = headers
            if isinstance(drb, str):
                dump_content["content"] = drb.replace("PROPFIND XML response body:\n", "")

            f.write(yaml.dump(dump_content, default_flow_style=False))

    def _dump_request(self, environ, xml):
        dump_to_path = self._config.get("dump_requests_path", "/tmp/wsgidav_dumps")
        os.makedirs(dump_to_path, exist_ok=True)
        dump_file = "{0}/{1}_REQUEST_{2}.yml".format(
            dump_to_path, self.last_request_time, environ["REQUEST_METHOD"]
        )
        with open(dump_file, "w+") as f:
            dump_content = dict()
            dump_content["path"] = environ.get("PATH_INFO", "")
            dump_content["Authorization"] = environ.get("HTTP_AUTHORIZATION", "")
            if xml:
                dump_content["content"] = ElementTree.tostring(xml, "utf-8")

            f.write(yaml.dump(dump_content, default_flow_style=False))


class TracimEnv(BaseMiddleware):
    def __init__(self, application, next_app, config):
        super().__init__(application, next_app, config)
        self.settings = config["tracim_settings"]
        self.app_config = CFG(self.settings)
        self.app_config.configure_filedepot()
        self.plugin_manager = init_plugin_manager(self.app_config)
        self.engine = get_engine(self.app_config)
        self.session_factory = get_session_factory(self.engine)

    def __call__(self, environ, start_response):
        # TODO - G.M - 18-05-2018 - This code should not create trouble
        # with thread and database, this should be verify.
        # see https://github.com/tracim/tracim_backend/issues/62
        registry = get_current_registry()
        registry.ldap_connector = None
        if AuthType.LDAP in self.app_config.AUTH_TYPES:
            registry = self.setup_ldap(registry, self.app_config)
        environ["tracim_registry"] = registry
        tracim_context = WebdavTracimContext(environ, self.app_config, self.plugin_manager)
        session = create_dbsession_for_context(
            self.session_factory, transaction.manager, tracim_context
        )
        tracim_context.dbsession = session
        environ["tracim_context"] = tracim_context
        try:
            for chunk in self.next_app(environ, start_response):
                yield chunk
            transaction.commit()
        except Exception:
            transaction.abort()
            raise
        finally:
            # NOTE SGD 2020-06-30: avoid circular reference between environment dict and context.
            # This ensures the context will be deleted as soon as this function is exited
            if tracim_context in environ.keys():
                del environ["tracim_context"]
            tracim_context.cleanup()

    def setup_ldap(self, registry: Registry, app_config: CFG):
        manager = ConnectionManager(
            uri=app_config.LDAP_URL,
            bind=app_config.LDAP_BIND_DN if not app_config.LDAP_BIND_ANONYMOUS else "",
            passwd=app_config.LDAP_BIND_PASS if not app_config.LDAP_BIND_ANONYMOUS else "",
            tls=app_config.LDAP_TLS,
            use_pool=app_config.LDAP_USE_POOL,
            pool_size=app_config.LDAP_POOL_SIZE,
            pool_lifetime=app_config.LDAP_POOL_LIFETIME,
            get_info=app_config.LDAP_GET_INFO,
        )
        registry.ldap_login_query = _LDAPQuery(
            base_dn=app_config.LDAP_USER_BASE_DN,
            filter_tmpl=app_config.LDAP_USER_FILTER,
            scope=ldap3.LEVEL,
            attributes=ldap3.ALL_ATTRIBUTES,
            cache_period=0,
        )
        registry.ldap_connector = Connector(registry, manager)
        return registry

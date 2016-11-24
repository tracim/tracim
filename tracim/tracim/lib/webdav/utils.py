# -*- coding: utf-8 -*-
from xml.etree import ElementTree

import os
import sys
import threading
import time
from datetime import datetime

import yaml
from wsgidav import util
from wsgidav import compat
from wsgidav.middleware import BaseMiddleware


def transform_to_display(string: str) -> str:
    """
    As characters that Windows does not support may have been inserted
    through Tracim in names, before displaying information we update path
    so that all these forbidden characters are replaced with similar
    shape character that are allowed so that the user isn't trouble and
    isn't limited in his naming choice
    """
    _TO_DISPLAY = {
        '/': '⧸',
        '\\': '⧹',
        ':': '∶',
        '*': '∗',
        '?': 'ʔ',
        '"': 'ʺ',
        '<': '❮',
        '>': '❯',
        '|': '∣'
    }

    for key, value in _TO_DISPLAY.items():
        string = string.replace(key, value)

    return string


def transform_to_bdd(string: str) -> str:
    """
    Called before sending request to the database to recover the right names
    """
    _TO_BDD = {
        '⧸': '/',
        '⧹': '\\',
        '∶': ':',
        '∗': '*',
        'ʔ': '?',
        'ʺ': '"',
        '❮': '<',
        '❯': '>',
        '∣': '|'
    }

    for key, value in _TO_BDD.items():
        string = string.replace(key, value)

    return string


class TracimWsgiDavDebugFilter(BaseMiddleware):
    """
    COPY PASTE OF wsgidav.debug_filter.WsgiDavDebugFilter
    WITH ADD OF DUMP RESPONSE & REQUEST
    """
    def __init__(self, application, config):
        self._application = application
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

        if self._config.get('dump_requests'):
            # Monkey patching
            old_parseXmlBody = util.parseXmlBody
            def new_parseXmlBody(environ, allowEmpty=False):
                xml = old_parseXmlBody(environ, allowEmpty)
                self._dump_request(environ, xml)
                return xml
            util.parseXmlBody = new_parseXmlBody

    def __call__(self, environ, start_response):
        """"""
        #        srvcfg = environ["wsgidav.config"]
        verbose = self._config.get("verbose", 2)

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
        litmusTag = environ.get("HTTP_X_LITMUS",
                                environ.get("HTTP_X_LITMUS_SECOND"))
        if litmusTag and verbose >= 2:
            print("----\nRunning litmus test '%s'..." % litmusTag,
                  file=self.out)
            for litmusSubstring in self.debug_litmus:
                if litmusSubstring in litmusTag:
                    verbose = 3
                    debugBreak = True
                    dumpRequest = True
                    dumpResponse = True
                    break
            for litmusSubstring in self.break_after_litmus:
                if litmusSubstring in self.passedLitmus and litmusSubstring not in litmusTag:
                    print(" *** break after litmus %s" % litmusTag,
                          file=self.out)
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
            print("<%s> --- %s Request ---" % (
            threading.currentThread().ident, method), file=self.out)
            for k, v in environ.items():
                if k == k.upper():
                    print("%20s: '%s'" % (k, v), file=self.out)
            print("\n", file=self.out)

        # Intercept start_response
        #
        sub_app_start_response = util.SubAppStartResponse()

        nbytes = 0
        first_yield = True
        app_iter = self._application(environ, sub_app_start_response)

        for v in app_iter:
            # Start response (the first time)
            if first_yield:
                # Success!
                start_response(sub_app_start_response.status,
                               sub_app_start_response.response_headers,
                               sub_app_start_response.exc_info)

            # Dump response headers
            if first_yield and dumpResponse:
                print("<%s> --- %s Response(%s): ---" % (
                threading.currentThread().ident,
                method,
                sub_app_start_response.status),
                      file=self.out)
                headersdict = dict(sub_app_start_response.response_headers)
                for envitem in headersdict.keys():
                    print("%s: %s" % (envitem, repr(headersdict[envitem])),
                          file=self.out)
                print("", file=self.out)

            # Check, if response is a binary string, otherwise we probably have
            # calculated a wrong content-length
            assert compat.is_bytes(v), v

            # Dump response body
            drb = environ.get("wsgidav.dump_response_body")
            if compat.is_basestring(drb):
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
            # Success!
            start_response(sub_app_start_response.status,
                           sub_app_start_response.response_headers,
                           sub_app_start_response.exc_info)

        if dumpResponse:
            print("\n<%s> --- End of %s Response (%i bytes) ---" % (
            threading.currentThread().ident, method, nbytes), file=self.out)
        return

    def _dump_response(self, sub_app_start_response, drb):
        dump_to_path = self._config.get(
            'dump_requests_path',
            '/tmp/wsgidav_dumps',
        )
        os.makedirs(dump_to_path, exist_ok=True)
        dump_file = '{0}/{1}_RESPONSE_{2}.yml'.format(
            dump_to_path,
            '{0}_{1}'.format(
                datetime.utcnow().strftime('%Y-%m-%d_%H-%M-%S'),
                int(round(time.time() * 1000)),
            ),
            sub_app_start_response.status[0:3],
        )
        with open(dump_file, 'w+') as f:
            dump_content = dict()
            if isinstance(drb, str):
                dump_content['content'] = drb.replace('PROPFIND XML response body:\n', '')

            f.write(yaml.dump(dump_content, default_flow_style=False))

    def _dump_request(self, environ, xml):
        dump_to_path = self._config.get(
            'dump_requests_path',
            '/tmp/wsgidav_dumps',
        )
        os.makedirs(dump_to_path, exist_ok=True)
        dump_file = '{0}/{1}_REQUEST_{2}.yml'.format(
            dump_to_path,
            '{0}_{1}'.format(
                datetime.utcnow().strftime('%Y-%m-%d_%H-%M-%S'),
                int(round(time.time() * 1000)),
            ),
            environ['REQUEST_METHOD'],
        )
        with open(dump_file, 'w+') as f:
            dump_content = dict()
            dump_content['path'] = environ['PATH_INFO']
            dump_content['Authorization'] = environ['HTTP_AUTHORIZATION']
            if xml:
                dump_content['content'] = ElementTree.tostring(xml, 'utf-8')

            f.write(yaml.dump(dump_content, default_flow_style=False))

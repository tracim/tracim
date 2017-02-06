import threading
import collections
from configparser import DuplicateSectionError

from wsgiref.simple_server import make_server

from radicale import Application as RadicaleApplication
from radicale import HTTPServer as BaseRadicaleHTTPServer
from radicale import HTTPSServer as BaseRadicaleHTTPSServer
from radicale import RequestHandler as RadicaleRequestHandler
from radicale import config as radicale_config
from rq import Connection as RQConnection
from rq import Worker as BaseRQWorker
from redis import Redis
from rq.dummy import do_nothing
from rq.worker import StopRequested

from tracim.lib.base import logger
from tracim.lib.exceptions import AlreadyRunningDaemon

from tracim.lib.utils import get_rq_queue


class DaemonsManager(object):
    def __init__(self):
        self._running_daemons = {}

    def run(self, name: str, daemon_class: object, **kwargs) -> None:
        """
        Start a daemon with given daemon class.
        :param name: Name of runned daemon. It's not possible to start two
        daemon with same name. In the opposite case, raise
        tracim.lib.exceptions.AlreadyRunningDaemon
        :param daemon_class: Daemon class to use for daemon instance.
        :param kwargs: Other kwargs will be given to daemon class
        instantiation.
        """
        if name in self._running_daemons:
            raise AlreadyRunningDaemon(
                'Daemon with name "{0}" already running'.format(name)
            )

        logger.info(self, 'Starting daemon with name "{0}" and class "{1}" ...'
                          .format(name, daemon_class))
        daemon = daemon_class(name=name, kwargs=kwargs, daemon=True)
        daemon.start()
        self._running_daemons[name] = daemon

    def stop(self, name: str) -> None:
        """
        Stop daemon with his name and wait for him.
        Where name is given name when daemon started
        with run method.
        :param name:
        """
        if name in self._running_daemons:
            logger.info(self, 'Stopping daemon with name "{0}" ...'
                              .format(name))
            self._running_daemons[name].stop()
            self._running_daemons[name].join()
            del self._running_daemons[name]
            logger.info(self, 'Stopping daemon with name "{0}": OK'
                              .format(name))

    def stop_all(self) -> None:
        """
        Stop all started daemons and wait for them.
        """
        logger.info(self, 'Stopping all daemons')
        for name, daemon in self._running_daemons.items():
            logger.info(self, 'Stopping daemon "{0}" ...'.format(name))
            daemon.stop()

        for name, daemon in self._running_daemons.items():
            logger.info(
                self,
                'Stopping daemon "{0}" waiting confirmation'.format(name),
            )
            daemon.join()
            logger.info(self, 'Stopping daemon "{0}" OK'.format(name))

        self._running_daemons = {}

    def execute_in_thread(self, thread_name, callback):
        self._running_daemons[thread_name].append_thread_callback(callback)


class TracimSocketServerMixin(object):
    """
    Mixin to use with socketserver.BaseServer who add _after_serve_actions
    method executed after end of server execution.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._daemon_execute_callbacks = []

    def append_thread_callback(self, callback: collections.Callable) -> None:
        """
        Add callback to self._daemon_execute_callbacks. See service_actions
        function to their usages.
        :param callback: callback to execute in daemon
        """
        self._daemon_execute_callbacks.append(callback)

    def serve_forever(self, *args, **kwargs):
        super().serve_forever(*args, **kwargs)
        # After serving (in case of stop) do following:
        self._after_serve_actions()

    def _after_serve_actions(self):
        """
        Override (and call super if needed) to execute actions when server
        finish it's job.
        """
        pass

    def service_actions(self):
        if len(self._daemon_execute_callbacks):
            try:
                while True:
                    self._daemon_execute_callbacks.pop()()
            except IndexError:
                pass  # Finished to iter


class Daemon(threading.Thread):
    """
    Thread who contains daemon. You must implement start and stop methods to
    manage daemon life correctly.
    """
    def run(self) -> None:
        """
        Place here code who have to be executed in Daemon.
        """
        raise NotImplementedError()

    def stop(self) -> None:
        """
        Place here code who stop your daemon
        """
        raise NotImplementedError()

    def append_thread_callback(self, callback: collections.Callable) -> None:
        """
        Place here the logic who permit to execute a callback in your daemon.
        To get an exemple of that, take a look at
        socketserver.BaseServer#service_actions  and how we use it in
        tracim.lib.daemons.TracimSocketServerMixin#service_actions .
        :param callback: callback to execute in your thread.
        """
        raise NotImplementedError()


class MailSenderDaemon(Daemon):
    # NOTE: use *args and **kwargs because parent __init__ use strange
    # * parameter
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.worker = None  # type: RQWorker

    def append_thread_callback(self, callback: collections.Callable) -> None:
        logger.warning('MailSenderDaemon not implement append_thread_callback')
        pass

    def stop(self) -> None:
        # When _stop_requested at False, tracim.lib.daemons.RQWorker
        # will raise StopRequested exception in worker thread after receive a
        # job.
        self.worker._stop_requested = True
        queue = get_rq_queue('mail_sender')
        queue.enqueue(do_nothing)

    def run(self) -> None:
        from tracim.config.app_cfg import CFG
        cfg = CFG.get_instance()

        with RQConnection(Redis(
            host=cfg.EMAIL_SENDER_REDIS_HOST,
            port=cfg.EMAIL_SENDER_REDIS_PORT,
            db=cfg.EMAIL_SENDER_REDIS_DB,
        )):
            self.worker = RQWorker(['mail_sender'])
            self.worker.work()


class RQWorker(BaseRQWorker):
    def _install_signal_handlers(self):
        # RQ Worker is designed to work in main thread
        # So we have to disable these signals (we implement server stop in
        # MailSenderDaemon.stop method).
        pass

    def dequeue_job_and_maintain_ttl(self, timeout):
        # RQ Worker is designed to work in main thread, so we add behaviour
        # here: if _stop_requested has been set to True, raise the standard way
        # StopRequested exception to stop worker.
        if self._stop_requested:
            raise StopRequested()
        return super().dequeue_job_and_maintain_ttl(timeout)


class RadicaleHTTPSServer(TracimSocketServerMixin, BaseRadicaleHTTPSServer):
    pass


class RadicaleHTTPServer(TracimSocketServerMixin, BaseRadicaleHTTPServer):
    pass


class RadicaleDaemon(Daemon):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._prepare_config()
        self._server = None

    def run(self):
        """
        To see origin radical server start method, refer to
        radicale.__main__.run
        """
        self._server = self._get_server()
        self._server.serve_forever()

    def stop(self):
        self._server.shutdown()

    def _prepare_config(self):
        from tracim.config.app_cfg import CFG
        cfg = CFG.get_instance()

        tracim_auth = 'tracim.lib.radicale.auth'
        tracim_rights = 'tracim.lib.radicale.rights'
        tracim_storage = 'tracim.lib.radicale.storage'
        fs_path = cfg.RADICALE_SERVER_FILE_SYSTEM_FOLDER
        allow_origin = cfg.RADICALE_SERVER_ALLOW_ORIGIN
        realm_message = cfg.RADICALE_SERVER_REALM_MESSAGE

        radicale_config.set('auth', 'type', 'custom')
        radicale_config.set('auth', 'custom_handler', tracim_auth)

        radicale_config.set('rights', 'type', 'custom')
        radicale_config.set('rights', 'custom_handler', tracim_rights)

        radicale_config.set('storage', 'type', 'custom')
        radicale_config.set('storage', 'custom_handler', tracim_storage)
        radicale_config.set('storage', 'filesystem_folder', fs_path)

        radicale_config.set('server', 'realm', realm_message)
        radicale_config.set(
            'server',
            'base_prefix',
            cfg.RADICALE_CLIENT_BASE_URL_PREFIX,
        )

        try:
            radicale_config.add_section('headers')
        except DuplicateSectionError:
            pass  # It is not a problem, we just want it exist

        if allow_origin:
            radicale_config.set(
                'headers',
                'Access-Control-Allow-Origin',
                allow_origin,
            )

        # Radicale is not 100% CALDAV Compliant, we force some Allow-Methods
        radicale_config.set(
            'headers',
            'Access-Control-Allow-Methods',
            'DELETE, HEAD, GET, MKCALENDAR, MKCOL, MOVE, OPTIONS, PROPFIND, '
            'PROPPATCH, PUT, REPORT',
        )

        # Radicale is not 100% CALDAV Compliant, we force some Allow-Headers
        radicale_config.set(
            'headers',
            'Access-Control-Allow-Headers',
            'X-Requested-With,X-Auth-Token,Content-Type,Content-Length,'
            'X-Client,Authorization,depth,Prefer,If-None-Match,If-Match',
        )

    def _get_server(self):
        from tracim.config.app_cfg import CFG
        cfg = CFG.get_instance()
        return make_server(
            cfg.RADICALE_SERVER_HOST,
            cfg.RADICALE_SERVER_PORT,
            RadicaleApplication(),
            RadicaleHTTPSServer if cfg.RADICALE_SERVER_SSL else RadicaleHTTPServer,
            RadicaleRequestHandler
        )

    def append_thread_callback(self, callback: collections.Callable) -> None:
        """
        Give the callback to running server through
        tracim.lib.daemons.TracimSocketServerMixin#append_thread_callback
        :param callback: callback to execute in daemon
        """
        self._server.append_thread_callback(callback)


# TODO : webdav deamon, make it clean !

import sys, os
from wsgidav.wsgidav_app import DEFAULT_CONFIG
from wsgidav.xml_tools import useLxml
from wsgidav.wsgidav_app import WsgiDAVApp
from wsgidav._version import __version__

from tracim.lib.webdav.sql_dav_provider import Provider
from tracim.lib.webdav.sql_domain_controller import TracimDomainController

from inspect import isfunction
import traceback

from wsgidav.server.cherrypy import wsgiserver
from wsgidav.server.cherrypy.wsgiserver.wsgiserver3 import CherryPyWSGIServer

DEFAULT_CONFIG_FILE = "wsgidav.conf"
PYTHON_VERSION = "%s.%s.%s" % (sys.version_info[0], sys.version_info[1], sys.version_info[2])


class WsgiDavDaemon(Daemon):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.config = self._initConfig()
        self._server = None

    def _initConfig(self):
        """Setup configuration dictionary from default, command line and configuration file."""
        from tg import config as tg_config

        # Set config defaults
        config = DEFAULT_CONFIG.copy()
        temp_verbose = config["verbose"]

        # Configuration file overrides defaults
        default_config_file = os.path.abspath(DEFAULT_CONFIG_FILE)
        config_file = tg_config.get('wsgidav.config_path', default_config_file)
        fileConf = self._readConfigFile(config_file, temp_verbose)
        config.update(fileConf)

        if not useLxml and config["verbose"] >= 1:
            print(
                "WARNING: Could not import lxml: using xml instead (slower). Consider installing lxml from http://codespeak.net/lxml/.")
        from wsgidav.dir_browser import WsgiDavDirBrowser
        from tracim.lib.webdav.tracim_http_authenticator import TracimHTTPAuthenticator
        from wsgidav.error_printer import ErrorPrinter
        from tracim.lib.webdav.utils import TracimWsgiDavDebugFilter

        config['middleware_stack'] = [
            WsgiDavDirBrowser,
            TracimHTTPAuthenticator,
            ErrorPrinter,
            TracimWsgiDavDebugFilter,
        ]

        config['provider_mapping'] = {
            config['root_path']: Provider(
                # TODO: Test to Re enabme archived and deleted
                show_archived=False,  # config['show_archived'],
                show_deleted=False,  # config['show_deleted'],
                show_history=False,  # config['show_history'],
                manage_locks=config['manager_locks']
            )
        }

        config['domaincontroller'] = TracimDomainController(presetdomain=None, presetserver=None)

        return config

    def _readConfigFile(self, config_file, verbose):
        """Read configuration file options into a dictionary."""

        if not os.path.exists(config_file):
            raise RuntimeError("Couldn't open configuration file '%s'." % config_file)

        try:
            import imp
            conf = {}
            configmodule = imp.load_source("configuration_module", config_file)

            for k, v in vars(configmodule).items():
                if k.startswith("__"):
                    continue
                elif isfunction(v):
                    continue
                conf[k] = v
        except Exception as e:
            exceptioninfo = traceback.format_exception_only(sys.exc_type, sys.exc_value)  # @UndefinedVariable
            exceptiontext = ""
            for einfo in exceptioninfo:
                exceptiontext += einfo + "\n"

            print("Failed to read configuration file: " + config_file + "\nDue to " + exceptiontext, file=sys.stderr)
            raise

        return conf

    def run(self):
        app = WsgiDAVApp(self.config)

        # Try running WsgiDAV inside the following external servers:
        self._runCherryPy(app, self.config)

    def _runCherryPy(self, app, config):
        version = "WsgiDAV/%s %s Python/%s" % (
            __version__,
            wsgiserver.CherryPyWSGIServer.version,
            PYTHON_VERSION
        )

        wsgiserver.CherryPyWSGIServer.version = version

        protocol = "http"

        if config["verbose"] >= 1:
            print("Running %s" % version)
            print("Listening on %s://%s:%s ..." % (protocol, config["host"], config["port"]))
        self._server = CherryPyWSGIServer(
            (config["host"], config["port"]),
            app,
            server_name=version,
        )

        self._server.start()

    def stop(self):
        self._server.stop()

    def append_thread_callback(self, callback: collections.Callable) -> None:
        """
        Place here the logic who permit to execute a callback in your daemon.
        To get an exemple of that, take a look at
        socketserver.BaseServer#service_actions  and how we use it in
        tracim.lib.daemons.TracimSocketServerMixin#service_actions .
        :param callback: callback to execute in your thread.
        """
        raise NotImplementedError()

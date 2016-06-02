import threading
from wsgiref.simple_server import make_server

import signal
from radicale import Application as RadicaleApplication
from radicale import HTTPServer as RadicaleHTTPServer
from radicale import HTTPSServer as RadicaleHTTPSServer
from radicale import RequestHandler as RadicaleRequestHandler
from radicale import config as radicale_config
from tg import TGApp

from tracim.lib.exceptions import AlreadyRunningDaemon


class DaemonsManager(object):
    def __init__(self, app: TGApp):
        self._app = app
        self._daemons = {}

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
        if name in self._daemons:
            raise AlreadyRunningDaemon(
                'Daemon with name "{0}" already running'.format(name)
            )

        kwargs['app'] = self._app
        shutdown_program = threading.Event()
        # SIGTERM and SIGINT (aka KeyboardInterrupt) should just mark this for
        # shutdown
        signal.signal(signal.SIGTERM, lambda *_: shutdown_program.set())
        signal.signal(signal.SIGINT, lambda *_: shutdown_program.set())

        try:
            threading.Thread(target=daemon_class.start, kwargs=kwargs).start()
            self._daemons[name] = daemon_class
        finally:
            shutdown_program.set()


class Daemon(object):
    _name = NotImplemented

    def __init__(self, app: TGApp):
        self._app = app

    @classmethod
    def start(cls, **kwargs):
        return cls(**kwargs)

    @classmethod
    def kill(cls):
        raise NotImplementedError()

    @property
    def name(self):
        return self._name


class RadicaleDaemon(Daemon):
    _name = 'tracim-radicale-server'

    @classmethod
    def kill(cls):
        pass  # TODO

    def __init__(self, app: TGApp):
        """
        To see origin radical server start method, refer to
        radicale.__main__.run
        """
        super().__init__(app)
        self._prepare_config()
        server = self._get_server()
        server.serve_forever()

    def _prepare_config(self):
        tracim_auth = 'tracim.lib.radicale.auth'
        tracim_rights = 'tracim.lib.radicale.rights'
        tracim_storage = 'tracim.lib.radicale.storage'

        radicale_config.set('auth', 'type', 'custom')
        radicale_config.set('auth', 'custom_handler', tracim_auth)

        radicale_config.set('rights', 'type', 'custom')
        radicale_config.set('rights', 'custom_handler', tracim_rights)

        radicale_config.set('storage', 'type', 'custom')
        radicale_config.set('storage', 'custom_handler', tracim_storage)

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

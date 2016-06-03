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
        signal.signal(signal.SIGTERM, lambda *_: self.stop_all())
        signal.signal(signal.SIGINT, lambda *_: self.stop_all())

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

        daemon = daemon_class(name=name, kwargs=kwargs, daemon=True)
        daemon.start()
        self._daemons[name] = daemon

    def stop(self, name: str) -> None:
        """
        Stop daemon with his name and wait for him.
        Where name is given name when daemon started
        with run method. If daemon name unknow, raise IndexError.
        :param name:
        """
        self._daemons[name].stop()
        self._daemons[name].join()

    def stop_all(self) -> None:
        """
        Stop all started daemons and w<ait for them.
        """
        for daemon_name in self._daemons:
            self._daemons[daemon_name].stop()
        for daemon_name in self._daemons:
            self._daemons[daemon_name].join()


class Daemon(threading.Thread):
    """
    Thread who contains daemon. You must implement start and stop methods to
    manage daemon life correctly.
    """
    def run(self):
        raise NotImplementedError()

    def stop(self):
        raise NotImplementedError()


class RadicaleDaemon(Daemon):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._prepare_config()
        self._server = self._get_server()

    def run(self):
        """
        To see origin radical server start method, refer to
        radicale.__main__.run
        """
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

        radicale_config.set('auth', 'type', 'custom')
        radicale_config.set('auth', 'custom_handler', tracim_auth)

        radicale_config.set('rights', 'type', 'custom')
        radicale_config.set('rights', 'custom_handler', tracim_rights)

        radicale_config.set('storage', 'type', 'custom')
        radicale_config.set('storage', 'custom_handler', tracim_storage)
        radicale_config.set('storage', 'filesystem_folder', fs_path)

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

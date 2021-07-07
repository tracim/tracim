import re
import time
import typing

import pluggy
import tnetstring
import transaction
import zmq

from tracim_backend.config import CFG
from tracim_backend.lib.core.plugins import init_plugin_manager
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import User
from tracim_backend.models.auth import UserConnectionStatus
from tracim_backend.models.setup_models import create_dbsession_for_context
from tracim_backend.models.setup_models import get_engine
from tracim_backend.models.setup_models import get_session_factory
from tracim_backend.models.tracim_session import TracimSession

# INFO - RJ-2020-07-06 Relevant pushpin documentation: https://pushpin.org/docs/advanced/#stats-socket


class CustomTracimContext(TracimContext):
    def __init__(self, config: CFG) -> None:
        super().__init__()
        self._app_config = config
        self._plugin_manager = init_plugin_manager(config)

    @property
    def app_config(self) -> CFG:
        return self._app_config

    @property
    def current_user(self) -> None:
        return None

    @property
    def dbsession(self) -> TracimSession:
        return self._session

    @property
    def plugin_manager(self) -> pluggy.PluginManager:
        return self._plugin_manager


class UserConnectionStateMonitor:
    def __init__(self, config: CFG):
        self.config = config
        self.session_factory = get_session_factory(get_engine(config))
        self.pending_offline_users = {}

    def set_user_connection_status(
        self, user_id: typing.Optional[int], status: UserConnectionStatus
    ) -> None:
        logger.debug(
            self, "Setting connection status of user {} to {}".format(user_id or "*", status)
        )
        try:
            del self.pending_offline_users[user_id]
        except KeyError:
            pass

        context = CustomTracimContext(self.config)
        session = create_dbsession_for_context(self.session_factory, transaction.manager, context)

        context._session = session

        uapi = UserApi(session=session, current_user=None, config=self.config)
        query = uapi.base_query()

        if user_id:
            query = query.filter(User.user_id == user_id)

        query.update({User.connection_status: status})
        transaction.commit()

    def add_to_pending_offline_users(self, user_id: int) -> None:
        logger.debug(self, "User {} left".format(user_id))
        self.pending_offline_users[user_id] = time.monotonic()

    def handle_pending_offline_users(self, online_timeout: int):
        if not self.pending_offline_users:
            return

        current_time = time.monotonic()
        for (user_id, last_seen_time) in list(self.pending_offline_users.items()):
            if last_seen_time and last_seen_time + online_timeout <= current_time:
                del self.pending_offline_users[user_id]
                self.set_user_connection_status(user_id, UserConnectionStatus.OFFLINE)

    def run(self) -> None:
        # We assume everybody is offline when starting the daemon. This is true when starting a
        # Tracim instance, at worst Pushpin will send events to the daemon for online users so we
        # will rapidly notice online users
        self.set_user_connection_status(user_id=None, status=UserConnectionStatus.OFFLINE)

        online_timeout = self.config.USER__ONLINE_TIMEOUT

        # Connection to pushpin using ZMQ
        ctx = zmq.Context()
        sock = ctx.socket(zmq.SUB)
        sock.connect(self.config.LIVE_MESSAGES__STATS_ZMQ_URI)
        logger.info(self, "Connected to " + self.config.LIVE_MESSAGES__STATS_ZMQ_URI)
        sock.setsockopt(zmq.SUBSCRIBE, b"")

        # We use a poller, so we can have a timeout when reading messages
        poller = zmq.Poller()
        poller.register(sock, zmq.POLLIN)

        while True:
            # Let's wait messages for online_timeout seconds
            evts = poller.poll(online_timeout * 1000)

            # When a message is received, or after the timeout, we mark as offline users that should
            # be marked as offline
            self.handle_pending_offline_users(online_timeout)

            if not evts:
                # No message was received
                continue

            # We parse messages the way given by the Pushpin documentation (see the info message at
            # the top of this file)
            m_raw = sock.recv()
            mtype, mdata = m_raw.split(b" ", 1)
            if mdata[0] != ord("T"):
                logger.warning(self, "Unsupported format ", mdata[0])
                continue

            m = tnetstring.loads(mdata[1:])

            # Let's check that the message is about a user channel
            channel_name = m.get(b"channel", None)
            if not channel_name:
                continue

            # If so, let's get the user id
            match = re.match("^user_([\\d]+)$", channel_name.decode())

            if not match:
                logger.debug(self, "Channel {} is not a live message channel")
                continue

            user_id = int(match.group(1))

            if m.get(b"unavailable", False) or m.get(b"subscribers", 0) == 0:
                # The user just disconnected, we will mark them as online after a delay
                self.add_to_pending_offline_users(user_id)
            else:
                # The user is online
                self.set_user_connection_status(user_id, UserConnectionStatus.ONLINE)

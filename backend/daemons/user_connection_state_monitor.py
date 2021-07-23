# coding=utf-8
# Runner for daemon
from tracim_backend.lib.user_connection_state_monitor.daemon import UserConnectionStateMonitorDaemon
from tracim_backend.lib.utils.daemon import initialize_config_from_environment

app_config = initialize_config_from_environment()
daemon = UserConnectionStateMonitorDaemon(app_config, burst=False)
daemon.run()

# Install backend

## Compatibility

### OS

OS compatibility (tested with Python >= 3.9.2):

- Debian:
  - Buster (10)
  - Bullseye (11)
- Ubuntu:
  - Bionic (18.04)
  - Focal (20.04)

Older versions of Debian (8, 9) and Ubuntu (16.04) should work as long as a python version >= 3.9 is used.

### Database engines

- SQLite 3.22(2018-01-22)+ with JSON1 extension
- PostgreSQL 9.6+

## Installation

Use the automated script that will install dependencies and generate default configuration files:
```bash
./setup_default_backend.sh
```

For a manual installation, follow the [manual setup documentation](/docs/development/backend/setup/manual_setup.md).

## Running Tracim

You can run Tracim WSGI apps with many WSGI servers. We provide examples to run them with:

- uWSGI using backend/wsgi/* scripts
- The pserve command of pyramid which only relies on development.ini pastedeploy config

We advise using uWSGI for production and pserve for development.
For pserve usage documentation, see [manual setup documentation](/docs/development/backend/setup/manual_setup.md).

### Run Tracim with uWSGI command line

Set tracim_conf_file path:
```bash
export TRACIM_CONF_PATH="$(pwd)/development.ini"
```

Start pyramid webserver:
```bash
uwsgi \
  -d /tmp/tracim_web.log \
  --http-socket :6543 \
  --plugin python3 \
  --wsgi-file wsgi/web.py -H env \
  --pidfile /tmp/tracim_web.pid
```

(Optional, webdav) Start webdav wsgidav server:
```bash
uwsgi \
  -d /tmp/tracim_webdav.log \
  --http-socket :3030 \
  --plugin python3 \
  --wsgi-file wsgi/webdav.py -H env \
  --pidfile /tmp/tracim_webdav.pid
```

(Optional, agenda) Start caldav radicale server (used behind pyramid webserver for auth):
```bash
uwsgi \
  -d /tmp/tracim_caldav.log \
  --http-socket localhost:5232 \
  --plugin python3 \
  --wsgi-file wsgi/caldav.py \
  -H env \
  --pidfile /tmp/tracim_caldav.pid
```

#### Stop services

pyramid webserver:
```bash
uwsgi --stop /tmp/tracim_web.pid
```
webdav wsgidav server:
```bash
uwsgi --stop /tmp/tracim_webdav.pid
```
caldav radicale server:
```bash
uwsgi --stop /tmp/tracim_caldav.pid
```

### Run Tracim with uWSGI configuration file

#### Pyramid webserver
Create and edit a configuration file `/etc/uwsgi/apps-available/tracim_web.ini`.
You can use a different path.
```ini
[uwsgi]
plugins = python3
chdir = <PATH>/tracim/backend/
module = wsgi.web:application
home = <PATH>/tracim/backend/env/
workers = 4
threads = 4
env = TRACIM_CONF_PATH=<PATH>/tracim/backend/development.ini
```
Replace <PATH> with the correct absolute path.

Run:
```bash
uwsgi --ini /etc/uwsgi/apps-available/tracim_web.ini --http-socket :6543
```

#### WebDAV
Create and edit a configuration file `/etc/uwsgi/apps-available/tracim_webdav.ini`.
You can use a different path.
```ini
[uwsgi]
plugins = python3
chdir = <PATH>/tracim/backend/
module = wsgi.webdav:application
home = <PATH>/tracim/backend/env/
threads = 8
env = TRACIM_CONF_PATH=<PATH>/tracim/backend/development.ini
```
Replace <PATH> with the correct absolute path.

Run:
```bash
uwsgi --ini /etc/uwsgi/apps-available/tracim_webdav.ini.ini --http-socket :3030
```

#### CalDAV
Create and edit a configuration file `/etc/uwsgi/apps-available/tracim_caldav.ini`.
You can use a different path.
```ini
[uwsgi]
plugins = python3
chdir = <PATH>/tracim/backend/
module = wsgi.caldav:application
home = <PATH>/tracim/backend/env/
threads = 8
env = TRACIM_CONF_PATH=<PATH>/tracim/backend/development.ini
```
Replace <PATH> with the correct absolute path.

Run:
```bash
uwsgi --ini /etc/uwsgi/apps-available/tracim_caldav.ini --http-socket localhost:5232
```

## Running the Tracim Backend Daemons

Features such as async email notification and email reply system require additional daemons to work.

### Manually

#### Start Daemons

Set tracim_conf_file path
```bash
export TRACIM_CONF_PATH="$(pwd)/development.ini"
```

Email notifier (if async email notification is enabled)
```bash
python3 daemons/mail_notifier.py &
```
Email fetcher (if email reply is enabled)
```bash
python3 daemons/mail_fetcher.py &
```
User online/offline status monitoring
```bash
python3 daemons/user_connection_state_monitor.py &
```
RQ worker for live messages
```bash
rq worker -q -w tracim_backend.lib.rq.worker.DatabaseWorker event elasticsearch_indexer &
```

### Using Supervisor

#### Install

```bash
sudo apt install supervisor
```

#### Setup

Create and edit a configuration file `supervisord.conf`:

```ini
[supervisord]

; email notifier (if async jobs processing is enabled)
[program:tracim_mail_notifier]
directory=<PATH>/tracim/backend/
command=<PATH>/tracim/backend/env/bin/python <PATH>/tracim/backend/daemons/mail_notifier.py
stdout_logfile =/tmp/mail_notifier.log
redirect_stderr=true
autostart=true
autorestart=true
environment=TRACIM_CONF_PATH=<PATH>/tracim/backend/development.ini

; email fetcher (if email reply is enabled)
[program:tracim_mail_fetcher]
directory=<PATH>/tracim/backend/
command=<PATH>/tracim/backend/env/bin/python <PATH>/tracim/backend/daemons/mail_fetcher.py
stdout_logfile =/tmp/mail_fetcher.log
redirect_stderr=true
autostart=true
autorestart=true
environment=TRACIM_CONF_PATH=<PATH>/tracim/backend/development.ini

; user connection status monitor (online / offline0)
[program:tracim_user_connection_state_monitor]
directory=<PATH>/tracim/backend/
command=python3 <PATH>/tracim/backend/daemons/user_connection_state_monitor.py
stdout_logfile=/var/tracim/logs/user_connection_state_monitor.log
redirect_stderr=true
autostart=true
autorestart=false
environment=TRACIM_CONF_PATH=/etc/tracim/development.ini

; RQ worker (if async jobs processing is enabled)
[program:rq_database_worker]
directory=<PATH>/tracim/backend/
command=rq worker -q -w tracim_backend.lib.rq.worker.DatabaseWorker event elasticsearch_indexer
stdout_logfile =/tmp/rq_database_worker.log
redirect_stderr=true
autostart=true
autorestart=true
environment=TRACIM_CONF_PATH=<PATH>/tracim/backend/development.ini
```
Replace <PATH> with the correct absolute path.

A complete example of such a configuration is available in
[tools_docker/Debian_Uwsgi/supervisord_tracim.conf](/tools_docker/Debian_Uwsgi/supervisord_tracim.conf).

Run:
```bash
supervisord
```
`supervisord.conf` should be provided, see [supervisord.conf default_paths](http://supervisord.org/configuration.html).

## Troubleshooting

Ensure your shell has a UTF-8 locale.
```bash
echo $LANG
```
should return a string ending with `.UTF-8`.

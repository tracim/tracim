# The Tracim Backend

<!--
TODO - CH - 2024-12-18 - This file should be refactored.
It includes info related to administration and development
-->

Backend source code of Tracim, using Pyramid Framework.

## Installation

### Quick install

See [getting started](/docs/development/getting_started.md)

### Supported database engines

<!-- Remove the one that we don't support -->
- SQLite 3.22(2018-01-22)+ with JSON1 extension
- PostgreSQL 9.6+
<!-- - MySQL 8.0.1+  -->
<!-- - MariaDB 10.3+  -->

## Configuration

Create configuration file for a development environment:

    cp development.ini.sample development.ini

The provided default configuration is suitable for local-test. If you need to run Tracim
over network, see [configuration file documentation](/docs/administration/installation/settings_main_topics.md).

You need to create the branding folder containing customizable ui elements. Starting with the provided sample is a good way:

    cp -r ../frontend/dist/assets/branding.sample ../frontend/dist/assets/branding

You should also create requested folder for running Tracim:

    mkdir sessions_data sessions_lock depot previews radicale_storage

Initialize the database using [tracimcli](/docs/administration/exploitation/cli/cli.md) tool. Be careful, if you use Tracim
with `Redis`, you want to have the `Redis` service running.

    tracimcli db init

Optional functionalities are available through official plugins, please [read their documentation](official_plugins/README.md) to discover their functionalities and how to activate them.

## Deployment

You can run Tracim WSGI apps with many WSGI servers. We provide examples to run them with:

- uWSGI using wsgi/* script.
- The pserve command of pyramid which only rely on development.ini pastedeploy config.

### With uWSGI: great for production

#### Install uWSGI

On Debian:

    sudo apt install uwsgi uwsgi-plugin-python3

Or with PIP:

    sudo pip3 install uwsgi

#### All in terminal way

Run all web services with UWSGI:

    ## UWSGI SERVICES
    # set tracim_conf_file path
    export TRACIM_CONF_PATH="$(pwd)/development.ini"
    # pyramid webserver
    uwsgi -d /tmp/tracim_web.log --http-socket :6543 --plugin python3 --wsgi-file wsgi/web.py -H env --pidfile /tmp/tracim_web.pid
    # webdav wsgidav server
    uwsgi -d /tmp/tracim_webdav.log --http-socket :3030 --plugin python3 --wsgi-file wsgi/webdav.py -H env --pidfile /tmp/tracim_webdav.pid
    # caldav radicale server (used behind pyramid webserver for auth)
    uwsgi -d /tmp/tracim_caldav.log --http-socket localhost:5232 --plugin python3 --wsgi-file wsgi/caldav.py -H env --pidfile /tmp/tracim_caldav.pid

To stop them:

    # pyramid webserver
    uwsgi --stop /tmp/tracim_web.pid
    # webdav wsgidav server
    uwsgi --stop /tmp/tracim_webdav.pid
    # caldav radicale server
    uwsgi --stop /tmp/tracim_caldav.pid

#### With uWSGI ini script file ####

You can also preset uWSGI config for Tracim by creating this kind of .ini file:

    # You need to replace <PATH> with correct absolute path
    [uwsgi]
    plugins = python3
    chdir = <PATH>/tracim/backend/
    module = wsgi.web:application
    home = <PATH>/tracim/backend/env/
    workers = 4
    threads = 4
    env = TRACIM_CONF_PATH=<PATH>/tracim/backend/development.ini

For WebDAV:

    # You need to replace <PATH> with correct absolute path
    [uwsgi]
    plugins = python3
    chdir = <PATH>/tracim/backend/
    module = wsgi.webdav:application
    home = <PATH>/tracim/backend/env/
    threads = 8
    env = TRACIM_CONF_PATH=<PATH>/tracim/backend/development.ini

For CalDAV:

    # You need to replace <PATH> with correct absolute path
    [uwsgi]
    plugins = python3
    chdir = <PATH>/tracim/backend/
    module = wsgi.caldav:application
    home = <PATH>/tracim/backend/env/
    threads = 8
    env = TRACIM_CONF_PATH=<PATH>/tracim/backend/development.ini

You can then run the process this way:

    # You need to replace <WSGI_CONF_WEB> with correct path
    uwsgi --ini <WSGI_CONF_WEB>.ini --http-socket :6543
    # You need to replace <WSGI_CONF_WEBDAV> with correct path
    uwsgi --ini <WSGI_CONF_WEBDAV>.ini --http-socket :3030
    # You need to replace <WSGI_CONF_CALDAV> with correct path
    uwsgi --ini <WSGI_CONF_CALDAV>.ini --http-socket localhost:5232

### With Pserve: legacy way, useful for debug and dev

This method relies on development.ini configuration. default web server used is _Waitress_
in`development.ini.sample`

⚠️ By default, python warning are disabled. To enable warning please set
`PYTHONWARNINGS` env var, for example `export PYTHONWARNINGS=default` .

Run the Tracim backend web API (doesn't include live messages):

    pserve development.ini

Run the WsgiDAV server:

    tracimcli webdav start

Run the CalDAV server:

    tracimcli caldav start

## Running the Tracim Backend Daemons

Features such as async email notification and email reply system require additional daemons to work.

### Manually

#### Start Daemons

    # set tracim_conf_file path
    export TRACIM_CONF_PATH="$(pwd)/development.ini"
    ## DAEMONS SERVICES
    # email notifier (if async email notification is enabled)
    python3 daemons/mail_notifier.py &
    # email fetcher (if email reply is enabled)
    python3 daemons/mail_fetcher.py &
    # user online/offline status monitoring
    python3 daemons/user_connection_state_monitor.py &
    # RQ worker for live messages
    rq worker -q -w tracim_backend.lib.rq.worker.DatabaseWorker event elasticsearch_indexer &

### Using Supervisor

#### Install Supervisor

    sudo apt install supervisor

#### Setting up `supervisord.conf`

Example of `supervisord.conf`:

    [supervisord]
    ; You need to replace <PATH> with correct absolute path

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

A complete example of such a configuration is available in `tools_docker/Debian_Uwsgi/supervisord_tracim.conf`.

Run with (supervisord.conf should be provided, see [supervisord.conf default_paths](http://supervisord.org/configuration.html):

    supervisord

## Lint the code

Install the required tool, `flake8` and its dependencies:

    pip install -r requirements-devtool.txt

Then run flake8:

    flake8

## The Tracim API

Tracim_backend gives access to a REST API in _/api_.
This API is auto-documented with [Hapic](https://github.com/algoo/hapic).
The specification is accessible when you run Tracim, go to _/api/doc_ .

For example, with the default configuration:

    # run Tracim
    pserve development.ini
    # launch your favorite web-browser
    firefox http://localhost:7999/api/doc/

## Roles, Profile and Access Rights

In Tracim, only some users can access to some information, this is also true in
the Tracim REST API. you can check the [roles documentation](/docs/overview/roles.md) to check
what a specific user can do.

## Other Documentation

Detailed documentation on several topics is available in the [docs/development/](/docs/) directory.

Frontend
========

This folder is the frontend part of Tracim.

## Build the app

### Production

Its installation and building are respectively handled by [install_frontend_dependencies.sh](/install_frontend_dependencies.sh) and [build_full_frontend.sh](/build_full_frontend.sh).

See [README.md](/docs/development/build.md).


### Development

#### Rebuild the app

    ./build_frontend.sh

This shell script accept `-d` to bypass obfuscation and minification to help debugging.

#### Start the development server

    yarn run servdev

The development server uses webpack-dev-server with hot module reloading.

It uses a proxy for the api and pushpin so that there is nothing more to configure.

## Linting and translation
Before pushing changes to this folder, you must:

see [docs/development/before_push.md](/docs/development/before_push.md)

## Other available yarn scripts

see [docs/development/yarn_scripts.md](/docs/development/advanced/yarn_scripts.md)

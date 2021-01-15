# The Tracim Backend

Backend source code of Tracim, using Pyramid Framework.

## Installation

### Distribution dependencies

On Debian Stretch (9) with sudo:

    sudo apt update && sudo apt install \
    ghostscript \
    git \
    imagemagick \
    libfile-mimeinfo-perl \
    libjpeg-dev \
    libldap2-dev \
    libmagickwand-dev \
    libpq-dev \
    libsasl2-dev \
    poppler-utils \
    python3 \
    python3-dev \
    python3-pip \
    python3-venv \
    qpdf \
    ufraw-batch \
    ffmpeg \
    zlib1g-dev \
    exiftool

For better preview support:

    sudo apt install libreoffice # most office documents file and text format
    sudo apt install inkscape # for .svg files.

### Supported database engines

- SQLite 3.22(2018-01-22)+ with JSON1 extension
- PostgreSQL 9.6+
- MySQL 8.0.1+
- MariaDB 10.3+

### Get the source

get source from github:

    git clone https://github.com/tracim/tracim.git

go to *backend* subdirectory:

    cd backend

### Setup Python Virtualenv

Create a Python virtual environment:

    python3 -m venv env

Activate it in your terminal session (**all Tracim command execution must be executed under this virtual environment**):

    source env/bin/activate

Install packaging tools:

    pip install -r requirements-build.txt

(Optional) Install strict supported version of dependencies with requirement.txt:

    pip install -r requirements.txt

Install the project in editable mode with its develop requirements:

    pip install -r requirements-test.txt
    pip install -e "."

If you want to use PostgreSQL, MySQL or MariaDB database engine instead of
the default one (SQLite bundled with python), you need to install the python driver for those databases
that are supported by SQLAlchemy.

For PostgreSQL and MariaDB/MySQL, those are shortcuts to install Tracim with test and
specific driver.

For PostgreSQL:

    pip install -r requirements-db-postgres.txt

For MySQL/MariaDB:

    pip install -r requirements-db-mysql.txt

If you want to store files on s3, you need to install the S3 driver:

    pip install -r requirements-storage-s3.txt


## Configuration

Create [configuration file](doc/setting.md) for a development environment:

    cp development.ini.sample development.ini

The provided default configuration is suitable for local-test. If you need to run Tracim
over network, see [configuration file documentation](doc/setting.md).

You need to create a color.json file at root of Tracim:

    cp ../color.json.sample ../color.json

You should also create requested folder for running Tracim:

    mkdir sessions_data sessions_lock depot previews radicale_storage

Initialize the database using [tracimcli](doc/cli.md) tool

    tracimcli db init

Stamp current version of database to last (useful for migration):

    alembic -c development.ini stamp head

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
in` development.ini.sample`

:warning: By default, python warning are disabled. To enable warning please set
`PYTHONWARNINGS` env var, for example `export PYTHONWARNINGS=default` .

Run the Tracim backend web API (doesn't include live messages):

    pserve development.ini

Run the WsgiDAV server:

    tracimcli webdav start

Run the CalDAV server:

    tracimcli caldav start


## Running the Tracim Backend Daemons

Features such as async email notification and email reply system need additional daemons to work.

### Manually

#### Start Daemons

    # set tracim_conf_file path
    export TRACIM_CONF_PATH="$(pwd)/development.ini"
    ## DAEMONS SERVICES
    # email notifier (if async email notification is enabled)
    python3 daemons/mail_notifier.py &
    # email fetcher (if email reply is enabled)
    python3 daemons/mail_fetcher.py &
    # RQ worker for live messages
    rq worker -q -w tracim_backend.lib.rq.worker.DatabaseWorker event &

#### Stop Daemons

    # email notifier
    killall python3 daemons/mail_notifier.py
    # email fetcher
    killall python3 daemons/mail_fetcher.py
    # RQ worker
    killall rq

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

    ; RQ worker (if async jobs processing is enabled)
    [program:rq_database_worker]
    directory=<PATH>/tracim/backend/
    command=rq worker -q -w tracim_backend.lib.rq.worker.DatabaseWorker event
    stdout_logfile =/tmp/rq_database_worker.log
    redirect_stderr=true
    autostart=true
    autorestart=true
    environment=TRACIM_CONF_PATH=<PATH>/tracim/backend/development.ini

Run with (supervisord.conf should be provided, see [supervisord.conf default_paths](http://supervisord.org/configuration.html):

    supervisord


## Running Pushpin Service

For a working Tracim instance, you need to setup pushpin as proxy for tracim web service.

See [main readme](../README.md)  section _Install and run pushpin for UI updates_

## Lint the code

Install the required tool, `flake8` and its dependencies:

    pip install -r requirements-devtool.txt

Then run flake8:

    flake8

## Run Tests

First setup the needed tools and directories (only needed once):

    # from backend directory
    python3 ./setup_dev_env.py
    ./create_test_storage_dir.sh
    # several external services (mail/databases/…) are started through a docker compose file
    # please install it by following their instructions:
    # - https://docs.docker.com/engine/install/
    # - https://docs.docker.com/compose/install/
    # On Debian systems the following lines are enough
    sudo apt install docker.io docker-compose
    # add the current user to docker group, you'll need to use a new login shell for this change to be taken into account
    sudo usermod -a -G docker $USER

Running tests can be done with:

    docker-compose up -d
    pytest
    docker-compose down


By default the tests will be executed with the `sqlite` database, this can be changed using the `--database` argument of pytest:

    pytest --database=postgresql

Possible databases are `sqlite`, `postgresql`, `mysql` and `mariadb`.
It is possible to specify several databases or even `all`:

    # Needs the pytest-forked plugin (pip install pytest-forked)
    # as some test fixtures do modify static variables.
    pytest --forked --database=sqlite --database=postgresql
    # Run tests on all databases
    pytest --forked --database=all

### Docker-compose test file

The [docker-compose.yml](docker-compose.yml) file lists the services needed for testing the Tracim backend. Default environment variables used by the containers are written in the [.env](.env) file next to `docker-compose.yml`.

### About Pytest Tests Config

For running tests, Tracim tests need config to be set:
- specific config for specific tests is
available in TEST_CONFIG_FILE_PATH (by default: "./tests_configs.ini" in backend folder).
- For more general config, pytest rely on dotenv .env file (by default ".test.env" in backend folder)
- If you want to change general config like paths used or database, you should better use env var
instead of modifying "TEST_CONFIG_FILE_PATH" file or ".test.env".

for example, if you want to use another database, you can do this:

    export TRACIM_SQLALCHEMY__URL=sqlite:////tmp/mydatabase
    python3 ./setup_dev_env.py
    pytest

Order of usage is (from less to more important, last is used if set):
- specific TEST_CONFIG_FILE_PATH config (different for each test)
- default env var setting in .test.env
- env var set by user

## The Tracim API

Tracim_backend gives access to a REST API in */api*.
This API is auto-documented with [Hapic](https://github.com/algoo/hapic).
The specification is accessible when you run Tracim, go to */api/doc* .

For example, with the default configuration:

    # run Tracim
    pserve development.ini
    # launch your favorite web-browser
    firefox http://localhost:7999/api/doc/

## Roles, Profile and Access Rights

In Tracim, only some users can access to some information, this is also true in
the Tracim REST API. you can check the [roles documentation](doc/roles.md) to check
what a specific user can do.

## Known Issues

see [here](doc/known_issues.md)

## Other Documentation

Detailed documentation on several topics is available in the [doc](doc) directory.

[![Build Status](https://travis-ci.org/tracim/tracim_backend.svg?branch=master)](https://travis-ci.org/tracim/tracim_backend)
[![Coverage Status](https://coveralls.io/repos/github/tracim/tracim_backend/badge.svg?branch=master)](https://coveralls.io/github/tracim/tracim_backend?branch=master)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/tracim/tracim_backend/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/tracim/tracim_backend/?branch=master)

tracim_backend
==============

This code is Work in progress. Not usable at all for production.

Backend source code of tracim v2, using Pyramid Framework.

Installation
---------------

### Distribution dependencies ###

on Debian Stretch (9) with sudo:

    sudo apt update
    sudo apt install git
    sudo apt install python3 python3-venv python3-dev python3-pip
    sudo apt install redis-server

### Get the source ###

get source from github:

    git clone https://github.com/tracim/tracim_backend.git

go to *tracim_backend* directory:

    cd tracim_backend

### Setup Python Virtualenv ###

Create a Python virtual environment:

    python3 -m venv env

Activate it in your terminal session (**all tracim command execution must be executed under this virtual environment**):

    source env/bin/activate

Upgrade packaging tools:

    pip install --upgrade pip setuptools

Install the project in editable mode with its testing requirements :

    pip install -e ".[testing]"

If you want to use postgresql, mysql or other databases
than the default one: sqlite, you need to install python driver for those databases
that are supported by sqlalchemy.

For postgreSQL and mySQL, those are shortcuts to install Tracim with test and
specific driver.

For PostgreSQL:

    pip install -e ".[testing,postgresql]"

For mySQL:

    pip install -e ".[testing,mysql]"

### Configure Tracim_backend ###

Create [configuration file](doc/setting.md) for a development environment:

    cp development.ini.sample development.ini

Initialize the database using [tracimcli](doc/cli.md) tool

    tracimcli db init

create wsgidav configuration file for webdav:

    cp wsgidav.conf.sample wsgidav.conf

## Run Tracim_backend ##

### With Uwsgi ###

Run all services with uwsgi

    # install uwsgi with pip ( unneeded if you already have uwsgi with python3 plugin enabled)
    sudo pip3 install uwsgi
    # set tracim_conf_file path
    export TRACIM_CONF_PATH="$(pwd)/development.ini"
    export TRACIM_WEBDAV_CONF_PATH="$(pwd)/wsgidav.conf"
    # pyramid webserver
    uwsgi -d /tmp/tracim_web.log --http-socket :6543 --wsgi-file wsgi/web.py -H env --pidfile /tmp/tracim_web.pid
    # webdav wsgidav server
    uwsgi -d /tmp/tracim_webdav.log --http-socket :3030 --wsgi-file wsgi/webdav.py -H env --pidfile /tmp/tracim_webdav.pid

to stop them:

    # pyramid webserver
    uwsgi --stop /tmp/tracim_web.pid
    # webdav wsgidav server
    uwsgi --stop /tmp/tracim_webdav.pid

### With Waitress (legacy way, usefull for debug) ###

run tracim_backend web api:

    pserve developement.ini

run wsgidav server:

    tracimcli webdav start

## Run Tests and others checks ##

Before running some functional test related to email, you need a local working *MailHog*
see here : https://github.com/mailhog/MailHog

You can run it this way with docker :

    docker pull mailhog/mailhog
    docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

Run your project's tests:

    pytest

### Lints and others checks ###

Run mypy checks:

    mypy --ignore-missing-imports --disallow-untyped-defs tracim

Run pep8 checks:

    pep8 tracim

Tracim API
----------

Tracim_backend give access to a REST API in */api/v2*.
This API is auto-documented with [Hapic](https://github.com/algoo/hapic).
The specification is accessible when you run Tracim, go to */api/v2/doc* .

For example, with default config:

    # run tracim
    pserve development.ini
    # launch your favorite web-browser
    firefox http://localhost:6543/api/v2/doc/

CI
---

* Code quality: https://scrutinizer-ci.com/g/tracim/tracim_backend/
* Test validation: https://travis-ci.org/tracim/tracim_backend
* Code coverage: https://coveralls.io/github/tracim/tracim_backend

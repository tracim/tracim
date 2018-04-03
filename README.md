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

TODO

### Setup Python Virtualenv ###

Go to *tracim* subdirectory:

    cd tracim

Create a Python virtual environment:

    python3 -m venv env

Activate it in your terminal session (**all tracim command execution must be executed under this virtual environment**):

    source env/bin/activate

Upgrade packaging tools:

    pip install --upgrade pip setuptools

Install the project in editable mode with its testing requirements:

    pip install -e ".[testing]"

### Configure Tracim_backend ###

Create configuration files for a development environment:

    cp development.ini.base development.ini

Initialize the database.

    initialize_tracim_db development.ini

### Run Tracim_backend ###

Run your project:

    pserve development.ini

### Run Tests and others checks ###

Run your project's tests:

    pytest

Run mypy checks:

    mypy --ignore-missing-imports --disallow-untyped-defs tracim

Run pep8 checks:

    pep8 tracim

CI
---

* Code quality: https://scrutinizer-ci.com/g/tracim/tracim_backend/
* Test validation: https://travis-ci.org/tracim/tracim_backend
* Code coverage: https://coveralls.io/github/tracim/tracim_backend

tracim_backend
==============

This code is Work in progress. Not usable at all for production.

Backend source code of tracim v2, using Pyramid Framework.

Getting Started
---------------

- Change directory into your newly created project.

    cd tracim

- Create a Python virtual environment.

    python3 -m venv env

- Upgrade packaging tools.

    env/bin/pip install --upgrade pip setuptools

- Install the project in editable mode with its testing requirements.

    env/bin/pip install -e ".[testing]"

- Configure the database.

    env/bin/initialize_tracim_db development.ini

- Run your project's tests.

    env/bin/pytest

- Run your project.

    env/bin/pserve development.ini


CI
---

* Code quality: https://scrutinizer-ci.com/g/tracim/tracim_backend/
* Test validation: https://travis-ci.org/tracim/tracim_backend
* Code coverage: https://coveralls.io/github/tracim/tracim_backend

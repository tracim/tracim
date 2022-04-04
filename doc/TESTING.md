# Tests

To test [Tracim](https://www.algoo.fr/fr/tracim), you first need to be able to build the backend and the frontend.<br>
See [how to build](./BUILD.md).

## Table of contents
1. [Backend](#backend)
    1. [Prerequisites](#prerequisites)
    2. [Tests](#tests-with-pytest)
    3. [Configuration test](#configuration-test)
    4. [Docker-compose test](#docker-compose-test-file)
2. [Frontend](#fronted)
    1. [Prerequisites](#prerequisites-1)
    1. [Unit tests](#unit-tests)
    2. [Functional tests](#functional-tests)

## Backend

In `backend` directory.

### Prerequisites

You need to setup tools and directories (only needed once):

    python3 ./setup_dev_env.py
    ./create_test_storage_dir.sh

You will need docker-compose to run the backend tests.
For Debian-based systems, you can install it with:

    sudo apt install docker.io docker-compose

See [installation instructions](https://docs.docker.com/compose/install/) if you are not using Debian-based systems.

Finally, add the current user to docker group, you'll need to use a new login shell for this change to be taken into account

    sudo usermod -a -G docker $USER

To test every databases, you will need the pytest-forked plugin.

    pip install pytest-forked

### Configuration test

To run backend tests, you need a configuration:
- A specific configuration for specific tests is
available in `TEST_CONFIG_FILE_PATH` (by default: `./tests_configs.ini` in backend folder).
- For a more general configuration, pytest rely on dotenv `.env` file (by default `.test.env` in backend folder)
- If you want to change general configuration like paths or database used, you should use environment variables instead of modifying `TEST_CONFIG_FILE_PATH` file or `.test.env`.

For example, if you want to use another database:

    export TRACIM_SQLALCHEMY__URL=sqlite:/tmp/mydatabase
    python3 ./setup_dev_env.py
    pytest

Order of usage is (from less to more important, last is used if set):
- specific TEST_CONFIG_FILE_PATH config (different for each test)
- default env var setting in .test.env
- env var set by user

### Tests with pytest

Run tests with the following commands:

    docker-compose up -d
    pytest
    docker-compose down


By default the tests will be executed with the `sqlite` database, this can be changed using the `--database` argument of pytest:

    pytest --database=postgresql

Possible databases are `sqlite`, `postgresql`, `mysql` and `mariadb`.
It is possible to specify several databases or even `all`:

    pytest --forked --database=sqlite --database=postgresql

Run tests on all databases.

    pytest --forked --database=all

### Docker-compose test file

The [docker-compose.yml](../backend/docker-compose.yml) file lists the services needed for testing the Tracim backend.
<!-- Default environment variables used by the containers are written in the [.env](../backend/.env) file next to `docker-compose.yml`. -->

## Frontend

### Prerequisites

To do the functional tests, you need to have Cypress installed.<br>
To install Cypress and its dependencies, run:

    ./setup_functionnal_tests.sh

This script uses sudo, make sure it is installed and configured.
Alternatively, under root:

    ./setup_functionnal_tests.sh root

If you need to run Cypress with an external server of Tracim, modify "baseurl" in cypress.json ([more details here](https://docs.cypress.io/guides/references/configuration.html#Options)).


### Unit tests

To run every unit tests:

    ./run_frontend_unit_test.sh

You can also test a specific frontend application by doing:

    yarn run test

For example, to test the `agenda` frontend application:

    cd frontend_app_agenda
    yarn run test

### Functional tests

To run every functional tests:

    ./run_dev_backend.sh cypress run

You can also run cypress with a graphical interface:

    ./run_dev_backend.sh cypress open

For more advanced usage, refer to the [cypress documentation](https://docs.cypress.io/guides/guides/getting-started-guide.html).

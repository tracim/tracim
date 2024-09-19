# Tests

To test [Tracim](https://www.tracim.fr), you first need to be able to
build the backend and the frontend.
See [how to build](/docs/development/build.md).

## Table of contents

- [Tests](#tests)
  - [Table of contents](#table-of-contents)
  - [Backend](#backend)
    - [Prerequisites](#prerequisites)
    - [Configuration test](#configuration-test)
    - [Tests with pytest](#tests-with-pytest)
    - [Docker compose test file](#docker-compose-test-file)
  - [Frontend](#frontend)
    - [Prerequisites](#prerequisites-1)
    - [Unit tests](#unit-tests)
    - [Functional tests](#functional-tests)

## Backend

In `backend` directory.

### Prerequisites

You need to setup tools and directories (only needed once):

```bash
python3 ./setup_dev_env.py
./create_test_storage_dir.sh
```

You will need docker compose to run the backend tests.
For Debian-based systems, you can install it with:

```bash
sudo apt install docker.io docker-compose-plugin
```

See [installation instructions](https://docs.docker.com/compose/install/) if you are not using Debian-based systems.

Finally, add the current user to docker group, you'll need to use a new login shell for this change to be taken into account

```bash
sudo usermod -a -G docker $USER
```

To test every databases, you will need the pytest-forked plugin.

```bash
pip install pytest-forked
```

### Configuration test

To run backend tests, you need several configurations:

- A specific configuration for specific tests is
available in `TEST_CONFIG_FILE_PATH` (by default: `./tests_configs.ini` in backend folder).
- For a more general configuration, pytest rely on dotenv `.env` file (by default `.test.env` in backend folder)
- If you want to change general configuration like paths or database used, you should use environment variables instead of modifying `TEST_CONFIG_FILE_PATH` file or `.test.env`.

For example, if you want to use another database:

```bash
export TRACIM_SQLALCHEMY__URL=sqlite:/tmp/mydatabase
python3 ./setup_dev_env.py
pytest
```

Order of usage is (from less to more important, last is used if set):

- specific TEST_CONFIG_FILE_PATH config (different for each test)
- default env var setting in .test.env
- env var set by user

### Tests with pytest

Run tests with the following commands:

```bash
docker compose up -d
pytest
docker compose down
```

By default the tests will be executed with the `sqlite` database, this can be changed using the `--database` argument of pytest:

```bash
pytest --database=postgresql
```

Possible databases are `sqlite`, `postgresql`, `mysql` and `mariadb`.
It is possible to specify several databases or even `all`:

```bash
pytest --forked --database=sqlite --database=postgresql
```

Run tests on all databases.

```bash
pytest --forked --database=all
```

### Docker compose test file

The [docker-compose.yml](/backend/docker-compose.yml) file lists the services needed for testing the Tracim backend.
<!-- Default environment variables used by the containers are written in the [.env](/backend/.env) file next to `docker-compose.yml`. -->

## Frontend

### Prerequisites

To do the functional tests, you need to have Cypress installed.  
To install Cypress and its dependencies, run:

```bash
./setup_functionnal_tests.sh
```

This script uses sudo, make sure it is installed and configured.
Alternatively, under root:

```bash
./setup_functionnal_tests.sh root
```

If you need to run Cypress with an external server of Tracim, modify "baseurl" in cypress.json ([more details here](https://docs.cypress.io/guides/references/configuration.html#Options)).

### Unit tests

To run every unit tests:

```bash
./run_frontend_unit_test.sh
```

You can also test a specific frontend application by doing:

```bash
yarn run test
```

For example, to test the `agenda` frontend application:

```bash
cd frontend_app_agenda
yarn run test
```

### Functional tests

To run every functional tests:

```bash
./run_dev_backend.sh cypress run
```

You can also run cypress with a graphical interface:

```bash
./run_dev_backend.sh cypress open
```

For more advanced usage, refer to the [cypress documentation](https://docs.cypress.io/guides/guides/getting-started-guide.html).

## Backend
### Load test

Script to test load available [here](/backend/load_tests/)

```shell
pip install locust
```

```sheel
locust --headless --users 50 --spawn-rate 1 --host http://localhost:7999 -t 2min --html report.html
```

# Working in backend

## Backend setup

### Setup automatically

```bash
./setup_default_backend.sh
```
It uses the default configuration file: `/backend/development.ini`.  
Installation includes: node, system dependencies, python packages, database, required folder, mail templates and
dev certificates

This script uses sudo, make sure it is installed and configured.
Alternatively, you can use it under root:

```bash
./setup_default_backend.sh root
```

#### Script explanation

For each missing configuration file, this script will generate them from the default configuration.  
If the default SQLite database is missing, the script will generate it.

This script may also be used to update:
- scripts generated during installation
- the database model
- system packages
- Python dependencies

#### Script options

- `IGNORE_FULL_PREVIEW_GENERATOR`: skip the installation of preview generator
- `IGNORE_APT_INSTALL`: skip the installation of the dependencies with apt-get
- `DONT_GENERATE_PYENV`: don't generate the python virtual env directory

Usage:
```bash
<option name>=1 ./setup_default_backend.sh
```

Example:
```bash
IGNORE_FULL_PREVIEW_GENERATOR=1 ./setup_default_backend.sh
```

### Setup manually

See [manual_setup](/docs/development/backend/setup/manual_setup.md).

## Run development server

```bash
./run_dev_backend.sh
```
Server is accessible at [localhost:7999](http://localhost:7999).
To update the backend, restart the server: `./run_dev_backend.sh`

### VirtualEnv

The script `setup_default_backend.sh` create a virtual env which is used by `run_dev_backend.sh`.

Manually activate the virtual env:
```bash
source env/bin/activate
```

Create a custom virtual env:
```bash
python3 -m venv new_env
```

## Lint the code

Install the required tool, `flake8` and its dependencies:
```bash
pip install -r requirements-devtool.txt
```

Run flake8:
```bash
flake8
```

### CLI

Activate the virtual env (see above) and see dedicated
documentation [here](/docs/administration/exploitation/cli.md)

## API documentation

Tracim_backend gives access to a REST API in _/api_.  
This API is auto-documented with [Hapic](https://github.com/algoo/hapic).  
The specification is accessible when you run Tracim, go to _/api/doc_.

Using the default configuration:
```bash
# Run Tracim
pserve development.ini
# Access the api doc using your favorite web-browser
firefox http://localhost:7999/api/doc/
```

## Roles, Profile and Access Rights

In Tracim, only some users can access to some information.  
This is also true in the Tracim REST API. You can check the [role documentation](/docs/overview/roles.md) to
check what a specific user can do.

## Other Documentation

Detailed documentation on several topics is available in the [docs/development/](/docs/development/) directory.

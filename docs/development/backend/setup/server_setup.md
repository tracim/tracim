# The Tracim Backend

Backend source code of Tracim, using Pyramid Framework.

## Installation

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

### Script explanation

For each missing configuration file, this script will generate them from the default configuration.  
If the default SQLite database is missing, the script will generate it.

This script may also be used to update:
- scripts generated during installation
- the database model
- system packages
- Python dependencies

### Script options

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

For more information about the configuration files, see:
- configuration file template: [development.ini.sample](/backend/development.ini.sample)
- configuration doc: [backend setting documentation](/docs/administration/installation/settings_main_topics.md)

### Deployment or manual installation

See [docs/administration/installation/install_backend.md](/docs/administration/installation/install_backend.md).

## Configuration

Create a configuration file for a development environment:
```bash
cp development.ini.sample development.ini
```

The provided default configuration is suitable for local-test. If you need to run Tracim
over the network, see [configuration file documentation](/docs/administration/installation/settings_main_topics.md).

Create the branding folder containing customizable ui elements from the default branding folder:
```bash
cp -r ../frontend/dist/assets/branding.sample ../frontend/dist/assets/branding
```
You can customize it later.

Create the requested folder:
```bash
mkdir sessions_data sessions_lock depot previews radicale_storage
```

Initialize the database using the [tracimcli](/docs/administration/exploitation/cli.md) tool. Be careful, if you use
Tracim with `Redis`, you need to have the `Redis` service running.
```bash
tracimcli db init
```

Optional functionalities are available through official plugins.
See [official plugins documentations](/docs/administration/configuration/plugins/Official_Backend_Plugins.md).

### Run Tracim for development

It uses pserve and Waitress.

⚠️ By default, python warnings are disabled. To enable warning please set `PYTHONWARNINGS` env var:
```bash
export PYTHONWARNINGS=default
```

Run Tracim backend web API (doesn't include live messages):
```bash
pserve development.ini
```
Run WsgiDAV server:
```bash
tracimcli webdav start
```
Run CalDAV server:
```bash
tracimcli caldav start
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

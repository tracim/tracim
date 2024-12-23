# Working in backend

## Table of contents

- [Working in backend](#working-in-backend)
  - [Table of contents](#table-of-contents)
  - [Compatibility](#compatibility)
  - [Backend](#backend-build)
    - [Option 1: Automated script](#option-1-automated-script)
      - [Script explanation](#script-explanation)
      - [Script options](#script-options)
    - [Option 2: Manually](#option-2-manually)
      - [Dependencies](#dependencies)
    - [VirtualEnv](#virtualenv)
    - [CLI](#cli)
    - [Others](#others)
  - [Run development server](#run-development-server)

## Compatibility

OS compatibility (tested with Python >= 3.9.2):

- Debian:
  - Buster (10)
  - Bullseye (11)
- Ubuntu:
  - Bionic (18.04)
  - Focal (20.04)

Older versions of Debian (8, 9) and Ubuntu (16.04) should work as long as a python version >= 3.9 is used.

## Backend build

To install the backend, you have two options:

### Option 1: Automated script

Ensure your shell has an UTF-8 locale.

```bash
echo $LANG
```

should return a string like `en_EN.UTF-8`.

Run the script:

```bash
./setup_default_backend.sh
```

This script runs the backend with a simple default configuration: `development.ini` configuration file. It uses the default config file, sqlite database, etc.

This script uses sudo, make sure it is installed and configured.
Alternatively, you can use it under root:

```bash
./setup_default_backend.sh root
```

#### Script explanation

For each missing configuration file, this script will generate them from the default configuration.
If the default SQLite database is missing, the script will generate it.
This script may also be used for updates. To update a script generated by the [Tracim](https://www.tracim.fr) installation, update the source code with git pull and rerun the same script to update the database model, the system and Python dependencies.

#### Script options

In some case, you may want to not install some dependencies.  
For example, if you are using arm64:

```bash
IGNORE_FULL_PREVIEW_GENERATOR=1 ./setup_default_backend.sh
```

Here is the list of every option:

- `IGNORE_FULL_PREVIEW_GENERATOR`: ignore the installation of the full preview generator.
- `IGNORE_APT_INSTALL`: ignore the installation of the dependencies with apt-get.
- `DONT_GENERATE_PYENV`: don't generate the `.pyenv` directory.

<!-- To check -->
For more information about configuring the backend, see [Backend README](/docs/development/README.md).
For more information about the configuration files, see [development.ini.sample](/backend/development.ini.sample) and the [backend setting documentation](/docs/administration/installation/settings_main_topics.md).

### Option 2: Manually

See the [Backend README](/docs/development/README.md).

#### Dependencies

To install the backend, you need to install the following dependencies:

```bash
sudo apt update
xargs sudo apt install < system_packages/debian/build_backend_packages.list
xargs sudo apt install < system_packages/debian/run_backend_packages.list
```

Additionally, you can install the preview dependencies for a better preview support (LibreOffice, Inkscape, FFmpeg,...):

```bash
sudo apt install system_packages/debian/optional_preview_packages.list
```

### VirtualEnv

The script `setup_default_backend.sh` create a virtual env.
To create a custom virtual env:
```bash
python3 -m venv env
```

Then activate it in your terminal session:

```bash
source env/bin/activate
```

### CLI

In development, activate the virtual env (see above) and see dedicated
documentation [here](/docs/administration/exploitation/cli.md)

### Others

Install packaging tools:

```bash
pip install -r requirements-build.txt
```

(Optional) Install strict supported version of dependencies with requirement.txt:

```bash
pip install -r requirements.txt
```

(Optional) Install all preview builders to be able to generate preview for most file formats:

```bash
pip install -r requirements-full-preview-generator.txt
```

Install the project in editable mode with its develop requirements:

```bash
pip install -r requirements-test.txt
pip install -e "."
```

If you want to use PostgreSQL, database engine instead of the default one (SQLite bundled with
python), you need to install the python driver for those databases that are supported by SQLAlchemy.

For PostgreSQL, those are shortcuts to install Tracim with test and specific driver.

For PostgreSQL:

```bash
pip install -r requirements-db-postgres.txt
```

If you want to store files on s3, you need to install the S3 driver:

```bash
pip install -r requirements-storage-s3.txt
```

## Run development server

To run the development server, accessible at [localhost:7999](http://localhost:7999), you have to run the script:

```bash
./run_dev_backend.sh
```
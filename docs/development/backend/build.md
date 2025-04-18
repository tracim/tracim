# Working in backend

## Table of contents

- [Working in backend](#working-in-backend)
  - [Table of contents](#table-of-contents)
  - [Backend](#backend-setup)
    - [Option 1: Setup automatically](#option-1-setup-automatically)
    - [Option 2: Setup manually](#option-2-setup-manually)
      - [Dependencies](#dependencies)
    - [VirtualEnv](#virtualenv)
    - [CLI](#cli)
    - [Others](#others)
  - [Run development server](#run-development-server)

## Backend setup

### Option 1: Setup automatically

See [backend install documentation](/docs/administration/installation/install_backend.md).

### Option 2: Setup manually

See [Backend advanced server setup](/docs/development/backend/setup/server_setup.md).

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

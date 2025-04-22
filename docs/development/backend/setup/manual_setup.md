# Backend manual setup

## Dependencies

```bash
sudo apt update
xargs sudo apt install < system_packages/debian/build_backend_packages.list
xargs sudo apt install < system_packages/debian/run_backend_packages.list
```

Additionally, you can install the preview dependencies for a better preview support (LibreOffice, Inkscape, FFmpeg,...):

```bash
sudo apt install system_packages/debian/optional_preview_packages.list
```

Install packaging tools:
```bash
pip install -r requirements-build.txt
```

(Optional) Install strict supported versions of dependencies with requirement.txt:
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

If you want to use the PostgreSQL database engine instead of the default one (SQLite bundled with
python), you need to install the python driver for those databases that are supported by SQLAlchemy.

For PostgreSQL, those are shortcuts to install Tracim with test and specific driver:
```bash
pip install -r requirements-db-postgres.txt
```

If you want to store files on s3, you need to install the S3 driver:
```bash
pip install -r requirements-storage-s3.txt
```

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

Create the required folder:
```bash
mkdir sessions_data sessions_lock depot previews radicale_storage
```

Initialize the database using the [tracimcli](/docs/administration/exploitation/cli.md) tool. Be careful, if you use
Tracim with `Redis`, you need to have the `Redis` service running.
```bash
tracimcli db init
```

Optional functionalities are available through official plugins.
See [official plugins documentations](/docs/administration/configuration/plugins/official_backend_plugins.md).

For more information about the configuration files, see:
- configuration file template: [development.ini.sample](/backend/development.ini.sample)
- configuration doc: [backend setting documentation](/docs/administration/installation/settings_main_topics.md)

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

### Next

Follow setup for [live messages](/docs/development/backend/setup/live_message_setup.md)

# Install Tracim backend

## Compatibility

OS compatibility (tested with Python >= 3.9.2):

- Debian:
  - Buster (10)
  - Bullseye (11)
- Ubuntu:
  - Bionic (18.04)
  - Focal (20.04)

Older versions of Debian (8, 9) and Ubuntu (16.04) should work as long as a python version >= 3.9 is used.

## Automated script installation

Ensure your shell has an UTF-8 locale.
```bash
echo $LANG
```
should return a string ending with `.UTF-8`.

Install backend:
```bash
./setup_default_backend.sh
```
It uses the default configuration file: `development.ini`.  
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

- `IGNORE_FULL_PREVIEW_GENERATOR`: skip the installation of preview generator.
- `IGNORE_APT_INSTALL`: skip the installation of the dependencies with apt-get.
- `DONT_GENERATE_PYENV`: don't generate the python virtual env directory.

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

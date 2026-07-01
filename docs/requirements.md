# Tracim Compatibility

## Python & OS versions

Tracim is compatible with Python >= 3.9.2 and Python < 3.12.

> [!IMPORTANT]
> We recommend running on Debian 13 with Python 3.11.
> Other OS and Python versions can work but with no guarantee.

Compatible OS versions:

| OS Family | OS Name  | OS version | APT Python version |
|-----------|----------|------------|--------------------|
| Debian    | Bullseye | 11         | ✅ 3.9              |
| Debian    | Bookworm | 12         | ✅ 3.11             |
| Ubuntu    | Jammy    | 22.04      | ✅ 3.10             |

OS versions where a compatible Python version must be installed manually (e.g. using [PyEnv](https://github.com/pyenv/pyenv)):

| OS Family | OS Name | OS version | APT Python version |
|-----------|---------|------------|--------------------|
| Debian    | Jessie  | 8          | ⬇️ 3.4             |
| Debian    | Stretch | 9          | ⬇️ 3.5             |
| Debian    | Buster  | 10         | ⬇️ 3.7             |
| Debian    | Trixie  | 13         | ⬆️ 3.13            |
| Ubuntu    | Xenial  | 16.04      | ⬇️ 3.5             |
| Ubuntu    | Bionic  | 18.04      | ⬇️ 3.6             |
| Ubuntu    | Focal   | 20.04      | ⬇️ 3.8             |
| Ubuntu    | Noble   | 24.04      | ⬆️ 3.12            |


## Database engines

- SQLite 3.22(2018-01-22)+ with JSON1 extension
- PostgreSQL 9.6+

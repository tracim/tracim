# Handling the Database

Note: This documentation is potentially deprecated

_Note: This page helps you setting up a **development** environment for `Tracim` and its ORM `SQLAlchemy` with `PostgreSQL`. To set up a **production** environment, changing default database name, database user name and moreover its password is mandatory._

## PostgreSQL

If you want to use `PostgreSQL` as database engine:

```bash
sudo apt install postgresql-server-dev-all postgresql postgresql-client
```

### Minimalist introduction to PostgreSQL

#### Driver

Tracim uses the `psycopg2` driver between the `SQLAlchemy` ORM and the `PostgreSQL` RDBMS. Run the following command to install the right version:

```bash
pip install -r install/requirements.postgresql.txt
```

#### Allowing local connections on PostgreSQL

Debian `PostgreSQL` stores connections authorization in `/etc/postgresql/9.1/main/pg_hba.conf`. Edit this file and check that connection from `127.0.0.1` are allowed using user/password. You should find the following line in the file:

```conf
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
```

If you changed the file, reload `PostgreSQL`:

```bash
service postgresql reload
```

#### Creating a user and associated database

Create user and database:

```bash
sudo --user=postgres psql \
  --command="CREATE USER tracimuser WITH PASSWORD 'tracimpassword';" \
  --command="CREATE DATABASE tracimdb OWNER tracimuser;"
```

Test the database access:

```bash
psql --username=tracimuser --password --host=localhost --dbname=tracimdb \
  --command="SELECT NOW();"
```

Success output:

```bash
              now
-------------------------------
2017-08-25 15:46:41.105865+02
(1 ligne)
```

Failure output:

```bash
psql: FATAL:  password authentication failed for user "tracimuser"
FATAL:  password authentication failed for user "tracimuser"
```

In this case, delete the user and database and start over:

```bash
sudo --user=postgres psql \
  --command="DROP DATABASE tracimdb;" \
  --command="DROP USER tracimuser;"
```

```bash
[//]: # (The following lines are only necessary to fix permissions on an existing database:)
[//]: # (    sudo --user=postgres psql \)
[//]: # (         --dbname=tracimdb \)
[//]: # (         --command="GRANT ALL PRIVILEGES ON DATABASE tracimdb TO tracimuser;" \)
[//]: # (         --command="GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tracimuser;")
```

## SQLAlchemy settings

In file `backend/development.ini`, search the lines corresponding to the `SQLAlchemy` database url parameter `sqlalchemy.url`. `SQLite` is the default active database and others should be commented.

If you are willing to choose `PostgreSQL`, comment the `sqlalchemy.url` line corresponding to `SQLite` and uncomment the one of your choice.

For instance, with `PostgreSQL`, this should give you:

```ini
sqlalchemy.url = postgresql://tracimuser:tracimpassword@127.0.0.1:5432/tracimdb?client_encoding=utf8
# sqlalchemy.url = sqlite:///tracimdb.sqlite
```

Proceed as above for the file `backend/tests_configs.ini`, except that you need to reproduce these steps three times for each of the following entries:

- [app:main]
- [app:ldap]
- [app:radicale]

Again with `PostgreSQL`, this should give you:

```ini
sqlalchemy.url = postgresql://tracimuser:tracimpassword@127.0.0.1:5432/tracimdb_test?client_encoding=utf8
# sqlalchemy.url = sqlite:///tracimdb_test.sqlite
```

_Note: Do not copy the lines from the file `backend/development.ini` to the file `backend/tests_configs.ini`, the database names are not the same._

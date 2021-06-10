# Handling the Database #

Note: This documentation is potentially deprecated (made for Tracim v1)

*Note: This page helps you setting up a **development** environment for `Tracim` and its ORM `SQLAlchemy` with `PostgreSQL` and `MySQL`. To set up a **production** environment, changing default database name, database user name and moreover its password is mandatory.*

## PostgreSQL ##

If you want to use `PostgreSQL` as database engine:

    sudo apt install postgresql-server-dev-all postgresql postgresql-client

### Minimalist introduction to PostgreSQL ###

#### Driver ####

Tracim uses the `psycopg2` driver between the `SQLAlchemy` ORM and the `PostgreSQL` RDBMS. Run the following command to install the right version:

    pip install -r install/requirements.postgresql.txt

#### Allowing local connections on PostgreSQL ####

Debian `PostgreSQL` stores connections authorization in `/etc/postgresql/9.1/main/pg_hba.conf`. Edit this file and check that connection from `127.0.0.1` are allowed using user/password. You should find the following line in the file:

    # IPv4 local connections:
    host    all             all             127.0.0.1/32            md5

If you changed the file, reload `PostgreSQL`:

    service postgresql reload

#### Creating a user and associated database ####

Create user and database:

    sudo --user=postgres psql \
         --command="CREATE USER tracimuser WITH PASSWORD 'tracimpassword';" \
         --command="CREATE DATABASE tracimdb OWNER tracimuser;"

Test the database access:

    psql --username=tracimuser --password --host=localhost --dbname=tracimdb \
         --command="SELECT NOW();"

Success output:

                  now
    -------------------------------
    2017-08-25 15:46:41.105865+02
    (1 ligne)

Failure output:

    psql: FATAL:  password authentication failed for user "tracimuser"
    FATAL:  password authentication failed for user "tracimuser"

In this case, delete the user and database and start over:

    sudo --user=postgres psql \
         --command="DROP DATABASE tracimdb;" \
         --command="DROP USER tracimuser;"

[//]: # (The following lines are only necessary to fix permissions on an existing database:)
[//]: # (    sudo --user=postgres psql \)
[//]: # (         --dbname=tracimdb \)
[//]: # (         --command="GRANT ALL PRIVILEGES ON DATABASE tracimdb TO tracimuser;" \)
[//]: # (         --command="GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tracimuser;")

## Mariadb 10.3+ or Mysql 8.0.1+ ##

:warning: Newest version of Tracim (3.0+) doesn't support anymore old mariadb and mysql version. You need at least
mariadb 10.3 or mysql 8.0.1 (We need database that are able to support recursive CTE query).

:warning: newest version of debian doesn't provide up to date mysql version, you should add official apt repository:
https://dev.mysql.com/doc/mysql-apt-repo-quick-guide/en/

:warning: Tracim requires proper support for UFT-8 to work properly. On MySQL and MariaDB, this means you hould be using `utf8mb4`. For the collation we suggest using `utf8mb4_0900_ai_ci` on MySQL 8.0.1+ and `utf8mb4_unicode_520_ci` on MariaDB 10.3+.
as they are the most up-to-date Unicode collation algorithms available.

If you need to upgrade to tracim 3.7+ on mysql/mariadb, please use [utf8mb4 migration command line](cli.md) (section "Migrate Mysql/Mariadb database to utf8mb4").
if you want to use MariaDB as database engine

    sudo apt install mariadb-server

or for mysql:

    sudo apt install mysql-server

### Minimalist introduction to MariaDB ###

#### Driver ####

Tracim uses the `PyMySQL` driver between the `SQLAlchemy` ORM and the `MariaDB` RDBMS. Run the following command to install the right version:

    pip install -r install/requirements.mysql.txt

#### Create database ####

Connect to `MariaDB` with root user (password has been set at "Installation" -> "Dependencies" chapter, when installing package)

    mysql -u root -p

Create a database with following command:

    CREATE DATABASE tracimdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;

Create a user with following command:

    CREATE USER 'tracimuser'@'localhost' IDENTIFIED BY 'tracimpassword';

And allow him to manipulate created database with following command:

    GRANT ALL PRIVILEGES ON tracimdb . * TO 'tracimuser'@'localhost';

Then flush privileges:

    FLUSH PRIVILEGES;

You can now quit `MariaDB` prompt:

    \q

## SQLAlchemy settings ##

In file `backend/development.ini`, search the lines corresponding to the `SQLAlchemy` database url parameter `sqlalchemy.url`. `SQLite` is the default active database and others should be commented.

If you are willing to choose `PostgreSQL` or `MariaDB`, comment the `sqlalchemy.url` line corresponding to `SQLite` and uncomment the one of your choice.

For instance, with `PostgreSQL`, this should give you:

    sqlalchemy.url = postgresql://tracimuser:tracimpassword@127.0.0.1:5432/tracimdb?client_encoding=utf8
    # sqlalchemy.url = mysql+pymysql://tracimuser:tracimpassword@127.0.0.1/tracimdb
    # sqlalchemy.url = sqlite:///tracimdb.sqlite

Proceed as above for the file `backend/tests_configs.ini`, except that you need to reproduce these steps three times for each of the following entries:

- [app:main]
- [app:ldap]
- [app:radicale]

Again with `PostgreSQL`, this should give you:

    sqlalchemy.url = postgresql://tracimuser:tracimpassword@127.0.0.1:5432/tracimdb_test?client_encoding=utf8
    # sqlalchemy.url = mysql+pymysql://tracimuser:tracimpassword@127.0.0.1/tracimdb_test
    # sqlalchemy.url = sqlite:///tracimdb_test.sqlite

*Note: Do not copy the lines from the file `backend/development.ini` to the file `backend/tests_configs.ini`, the database names are not the same.*

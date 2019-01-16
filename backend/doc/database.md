# This documentation is potentially deprecated (made for tracim_v1)

# Database #

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

## MySQL ##

Or if you want to use `MySQL` as database engine

    sudo apt install mysql-server

### Minimalist introduction to MySQL ###

#### Driver ####

Tracim uses the `PyMySQL` driver between the `SQLAlchemy` ORM and the `MySQL` RDBMS. Run the following command to install the right version:

    pip install -r install/requirements.mysql.txt

#### Create database ####

Connect to `MySQL` with root user (password has been set at "Installation" -> "Dependencies" chapter, when installing package)

    mysql -u root -p

Create a database with following command:

    CREATE DATABASE tracimdb CHARACTER SET = utf8;

Create a user with following command:

    CREATE USER 'tracimuser'@'localhost' IDENTIFIED BY 'tracimpassword';

And allow him to manipulate created database with following command:

    GRANT ALL PRIVILEGES ON tracimdb . * TO 'tracimuser'@'localhost';

Then flush privileges:

    FLUSH PRIVILEGES;

You can now quit `MySQL` prompt:

    \q

## SQLAlchemy settings ##

In the file `tracim/development.ini`, search the lines corresponding to the `SQLAlchemy` database url parameter `sqlalchemy.url`. `SQLite` is the default active database and others should be commented.

If you're willing to choose `PostgreSQL` or `MySQL`, comment the `sqlalchemy.url` line corresponding to `SQLite` and uncomment the one of your choice.

For example with `PostgreSQL`, this should gives you:

    sqlalchemy.url = postgresql://tracimuser:tracimpassword@127.0.0.1:5432/tracimdb?client_encoding=utf8
    # sqlalchemy.url = mysql+pymysql://tracimuser:tracimpassword@127.0.0.1/tracimdb
    # sqlalchemy.url = sqlite:///tracimdb.sqlite

Proceed as above for the file `tracim/tests.ini`, except that you need to reproduce these steps three times for each of the following entries:

- [app:main]
- [app:ldap]
- [app:radicale]

Again with `PostgreSQL`, this should gives you:

    sqlalchemy.url = postgresql://tracimuser:tracimpassword@127.0.0.1:5432/tracimdb_test?client_encoding=utf8
    # sqlalchemy.url = mysql+pymysql://tracimuser:tracimpassword@127.0.0.1/tracimdb_test
    # sqlalchemy.url = sqlite:///tracimdb_test.sqlite

*Note: Do not copy the lines from the file `tracim/development.ini` to the file `tracim/tests.ini`, the database names aren't the same.*

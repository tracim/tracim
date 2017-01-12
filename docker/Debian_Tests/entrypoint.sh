#!/usr/bin/env bash

#
# ENVIRONMENT VARIABLES ARE:
#
# * TEST_DATABASE_ENGINE (values: postgresql, mysql, sqlite)
# * CHECKOUT (values: a commit or branch name)
# * PULL (values: 0 or 1)
# * FETCH (values: 0 or 1)
#

# Default values
FETCH=${FETCH:=1}
PULL=${PULL:=1}

# If PULL is set, change repository HEAD
if [ "$FETCH" = 1 ]; then
    cd /tracim && git fetch origin
fi


# If PULL is set, change repository HEAD
if [ "$PULL" = 1 ]; then
    cd /tracim && git pull origin master
fi

# If CHECKOUT is set, change repository HEAD
if [ -n "$CHECKOUT" ]; then
    cd /tracim && git checkout ${CHECKOUT}
    echo "CHECKOUT set to $CHECKOUT"
fi

# Ensure TEST_DATABASE_ENGINE is set
if ! [ -n "$TEST_DATABASE_ENGINE" ]; then
    echo "You must set TEST_DATABASE_ENGINE environment variable"
    exit 1
fi

# Ensure TEST_DATABASE_ENGINE value
case "$TEST_DATABASE_ENGINE" in
    postgresql|mysql|sqlite) ;;
    *) echo "TEST_DATABASE_ENGINE environment variable must be one of these: \
postgresql, mysql, sqlite" ; exit 1 ;;
esac

# Prepare config files
cp /tracim/tracim/development.ini.base /tracim/tracim/development.ini
cp /tracim/tracim/wsgidav.conf.sample /tracim/tracim/wsgidav.conf

# PostgreSQL case
if [ "$TEST_DATABASE_ENGINE" = postgresql ] ; then
    service postgresql start
    su - postgres -s /bin/bash -c "psql -c \"CREATE DATABASE tracim;\""
    su - postgres -s /bin/bash -c "psql -c \"ALTER USER postgres WITH PASSWORD 'dummy';\""
    sed -i "s/\(sqlalchemy.url *= *\).*/\sqlalchemy.url = postgresql:\/\/postgres:dummy@127.0.0.1:5432\/tracim?client_encoding=utf8/" /tracim/tracim/test.ini
    sed -i "s/\(sqlalchemy.url *= *\).*/\sqlalchemy.url = postgresql:\/\/postgres:dummy@127.0.0.1:5432\/tracim?client_encoding=utf8/" /tracim/tracim/development.ini
fi

# MySQL case
if [ "$TEST_DATABASE_ENGINE" = mysql ] ; then
    service mysql start
    mysql -e 'CREATE DATABASE tracim;'
    sed -i "s/\(sqlalchemy.url *= *\).*/\sqlalchemy.url = mysql+oursql:\/\/root@localhost\/tracim/" /tracim/tracim/test.ini
    sed -i "s/\(sqlalchemy.url *= *\).*/\sqlalchemy.url = mysql+oursql:\/\/root@localhost\/tracim/" /tracim/tracim/development.ini
fi

# SQLite case
if [ "$TEST_DATABASE_ENGINE" = sqlite ] ; then
    sed -i "s/\(sqlalchemy.url *= *\).*/\sqlalchemy.url = sqlite:\/\/\/tracim.sqlite/" /tracim/tracim/test.ini
    sed -i "s/\(sqlalchemy.url *= *\).*/\sqlalchemy.url = sqlite:\/\/\/tracim.sqlite/" /tracim/tracim/development.ini
fi

# Run tests
cd /tracim/tracim && nosetests -c /tracim/tracim/test.ini -v

#!/usr/bin/env bash

#
# ENVIRONMENT VARIABLES ARE:
#
# * DATABASE_TYPE (values: postgresql, mysql, sqlite)
# * CHECKOUT (values: a commit or branch name)
#

# If CHECKOUT is set, change repository HEAD
if [ -n "$CHECKOUT" ]; then
    cd /tracim && git checkout ${CHECKOUT}
    echo "CHECKOUT set to $CHECKOUT"
fi

# Ensure DATABASE_TYPE is set
if ! [ -n "$DATABASE_TYPE" ]; then
    echo "You must set DATABASE_TYPE environment variable"
    exit 1
fi

# Ensure DATABASE_TYPE value
case "$DATABASE_TYPE" in
    postgresql|mysql|sqlite) ;;
    *) echo "DATABASE_TYPE environment variable must be one of these: \
postgresql, mysql, sqlite" ; exit 1 ;;
esac

# Prepare config files
cp /tracim/tracim/development.ini.base /tracim/tracim/development.ini
cp /tracim/tracim/wsgidav.conf.sample /tracim/tracim/wsgidav.conf

# PostgreSQL case
if [ "$DATABASE_TYPE" = postgresql ] ; then
    service postgresql start
    su - postgres -s /bin/bash -c "psql -c \"CREATE DATABASE tracim;\""
    su - postgres -s /bin/bash -c "psql -c \"ALTER USER postgres WITH PASSWORD 'dummy';\""
    sed -i "s/\(sqlalchemy.url *= *\).*/\sqlalchemy.url = postgresql:\/\/postgres:dummy@127.0.0.1:5432\/tracim?client_encoding=utf8/" /tracim/tracim/test.ini
    sed -i "s/\(sqlalchemy.url *= *\).*/\sqlalchemy.url = postgresql:\/\/postgres:dummy@127.0.0.1:5432\/tracim?client_encoding=utf8/" /tracim/tracim/development.ini
fi

# MySQL case
if [ "$DATABASE_TYPE" = mysql ] ; then
    service mysql start
    mysql -e 'CREATE DATABASE tracim;'
    sed -i "s/\(sqlalchemy.url *= *\).*/\sqlalchemy.url = mysql+oursql:\/\/root@localhost\/tracim/" /tracim/tracim/test.ini
    sed -i "s/\(sqlalchemy.url *= *\).*/\sqlalchemy.url = mysql+oursql:\/\/root@localhost\/tracim/" /tracim/tracim/development.ini
fi

# SQLite case
if [ "$DATABASE_TYPE" = sqlite ] ; then
    sed -i "s/\(sqlalchemy.url *= *\).*/\sqlalchemy.url = sqlite:\/\/\/tracim.sqlite/" /tracim/tracim/test.ini
    sed -i "s/\(sqlalchemy.url *= *\).*/\sqlalchemy.url = sqlite:\/\/\/tracim.sqlite/" /tracim/tracim/development.ini
fi

# Run tests
cd /tracim/tracim && nosetests -c /tracim/tracim/test.ini -v

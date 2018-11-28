#!/usr/bin/env bash

# Default values
CONFIG_FILE_IS_NEW=0
export PYTHON_EGG_CACHE=/tmp 
set -e

# Check environment variables
/bin/bash /tracim/check_env_vars.sh
if [ ! "$?" = 0 ]; then
    exit 1
fi

# Execute common tasks
/bin/bash /tracim/common.sh
if [ ! "$?" = 0 ]; then
    exit 1
fi

case "$DATABASE_TYPE" in
  mysql)
    # Ensure DATABASE_PORT is set
    if ! [ -n "$DATABASE_PORT" ]; then
        DATABASE_PORT=3306
    fi
    # Check if database must be init
    TEST_TABLE=$(mysql --host="$DATABASE_HOST" --user="$DATABASE_USER" --password="$DATABASE_PASSWORD" --database="$DATABASE_NAME" -s -N --execute="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DATABASE_NAME' AND table_name = 'content';")
    if [ ${TEST_TABLE} = 0 ] ; then
        INIT_DATABASE=true
    fi
    ;;
  postgresql)
    DATABASE_SUFFIX="?client_encoding=utf8"
    # Ensure DATABASE_PORT is set
    if ! [ -n "$DATABASE_PORT" ]; then
        DATABASE_PORT=5432
    fi
    # Check if database must be init
    TEST_TABLE=$(PGPASSWORD="$DATABASE_PASSWORD" psql -U ${DATABASE_USER} -h ${DATABASE_HOST} -d ${DATABASE_NAME} -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content' );")
    if [ $TEST_TABLE = f ] ; then
        INIT_DATABASE=true
    fi
    ;;
  sqlite)
    # Check if database must be init
    if [ ! -f /var/tracim/tracim.sqlite ]; then
        INIT_DATABASE=true
    fi
    ;;
esac

# Initialize database if needed
if [ "$INIT_DATABASE" = true ] ; then
    cd /tracim/backend/
    tracimcli db init
    alembic -c development.ini stamp head
fi

mkdir -p /var/run/uwsgi/app/tracim/
chown www-data:www-data -R /var/run/uwsgi
chown www-data:www-data -R /var/tracim

service redis-server start  # async email sending
service apache2 start
uwsgi --ini /tracim/uwsgi.ini --http-socket :6543 --plugin python3 --uid www-data --gid www-data

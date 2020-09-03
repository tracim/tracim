#!/usr/bin/env bash

# Default values
CONFIG_FILE_IS_NEW=0
export PYTHON_EGG_CACHE=/tmp
set -e

# Check environment variables
/bin/bash /tracim/tools_docker/Debian_Uwsgi/check_env_vars.sh
if [ ! "$?" = 0 ]; then
    exit 1
fi

# Execute common tasks
/bin/bash /tracim/tools_docker/Debian_Uwsgi/common.sh
if [ ! "$?" = 0 ]; then
    exit 1
fi

# Create file with all docker variable about TRACIM parameter
printenv |grep TRACIM > /var/tracim/data/tracim_env_variables || true

# Add variable for using xvfb with uwsgi
echo "DISPLAY=:99.0" >> /var/tracim/data/tracim_env_variables

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
    if [ ! -f /var/tracim/data/tracim.sqlite ]; then
        INIT_DATABASE=true
    fi
    ;;
esac

# Initialize database if needed
if [ "$INIT_DATABASE" = true ] ; then
    cd /tracim/backend/
    tracimcli db init -c /etc/tracim/development.ini
    alembic -c /etc/tracim/development.ini stamp head
else
    cd /tracim/backend/
    alembic -c /etc/tracim/development.ini upgrade head
fi

chown www-data:www-data -R /var/tracim

# activate apache modules
a2enmod proxy proxy_http proxy_ajp rewrite deflate headers proxy_html dav_fs dav expires proxy_uwsgi

# Activate or deactivate webdav
if [ "$START_WEBDAV" = "1" ]; then
    if [ ! -L /etc/uwsgi/apps-enabled/tracim_webdav.ini ]; then
        ln -s /etc/uwsgi/apps-available/tracim_webdav.ini /etc/uwsgi/apps-enabled/tracim_webdav.ini
    fi
    sed -i "s|^webdav.ui.enabled = .*|webdav.ui.enabled = True|g" /etc/tracim/development.ini
    sed -i "s|^\s*# Define START_WEBDAV|    Define START_WEBDAV|g" /etc/tracim/apache2.conf
else
    rm -f /etc/uwsgi/apps-enabled/tracim_webdav.ini
    sed -i "s|^webdav.ui.enabled = .*|webdav.ui.enabled = False|g" /etc/tracim/development.ini
    sed -i "s|^\s*Define START_WEBDAV|    # Define START_WEBDAV|g" /etc/tracim/apache2.conf
fi

# Activate or deactivate caldav
if [ "$START_CALDAV" = "1" ]; then
    if [ ! -L /etc/uwsgi/apps-enabled/tracim_caldav.ini ]; then
        ln -s /etc/uwsgi/apps-available/tracim_caldav.ini /etc/uwsgi/apps-enabled/tracim_caldav.ini
    fi
    DEFAULT_APP_LIST="$DEFAULT_APP_LIST,agenda"
    sed -i "s|^\s*# Define START_CALDAV|    Define START_CALDAV|g" /etc/tracim/apache2.conf
else
    rm -f /etc/uwsgi/apps-enabled/tracim_caldav.ini
    sed -i "s|^\s*Define START_CALDAV|    # Define START_CALDAV|g" /etc/tracim/apache2.conf
fi

# INFO - G.M - 2020-01-28 - enable collaborative_document_edition app as default app
# to work properly other config parameter should be setted correctly and external server for document
# edition like collabora should be started.
if [ "$ENABLE_COLLABORATIVE_DOCUMENT_EDITION" = "1" ]; then
    DEFAULT_APP_LIST="$DEFAULT_APP_LIST,collaborative_document_edition"
fi
# INFO - G.M - 2020-01-28 - replace app.enabled in config file
sed -i "s|^app.enabled = .*|app.enabled = $DEFAULT_APP_LIST|g" /etc/tracim/development.ini
sed -i "s|^;\s*app.enabled = .*|app.enabled = $DEFAULT_APP_LIST|g" /etc/tracim/development.ini
# TODO PA 2019-06-19 Rework the index-create part according to https://github.com/tracim/tracim/issues/1961
# Make sure index is created in case of Elastic Search based search. (the command does nothing in case of simple search)
cd /tracim/backend/
tracimcli search index-create -c /etc/tracim/development.ini


# starting services
service pushpin start # tracim live messages (TLMs) sending
service zurl start # tracim live messages (TLMs) sending
service redis-server start  # async jobs (for mails and TLMs)
service apache2 restart

supervisord -c /tracim/tools_docker/Debian_Uwsgi/supervisord_tracim.conf
# Activate daemon for reply by email
if [ "$REPLY_BY_EMAIL" = "1" ];then
    supervisorctl start tracim_mail_fetcher
fi

# Start tracim
set +e
service uwsgi restart
set -e
if [ "$START_CALDAV" = "1" ]; then
    cd /tracim/backend/
    tracimcli caldav sync -c /etc/tracim/development.ini
fi
tail -f /var/tracim/logs/tracim_web.log

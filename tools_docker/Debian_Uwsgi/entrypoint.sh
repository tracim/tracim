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

mkdir -p /var/run/uwsgi/app/
chown www-data:www-data -R /var/run/uwsgi
chown www-data:www-data -R /var/tracim
chmod +x /tracim/backend/daemons/mail_fetcher.py
chmod +x /tracim/backend/daemons/mail_notifier.py

# activate apache mods
a2enmod proxy proxy_http proxy_ajp rewrite deflate headers proxy_html dav_fs dav

# starting services
service redis-server start  # async email sending
service apache2 restart
supervisord -c /tracim/tools_docker/Debian_Uwsgi/supervisord_tracim.conf

# Activate daemon for reply by email
if [ "$REPLY_BY_EMAIL" = "1" ];then
    supervisorctl start tracim_mail_fetcher
fi

# Activate daemon for sending email in async
if [ "$EMAIL_MODE_ASYNC" = "1" ];then
    supervisorctl start tracim_mail_notifier
fi

# Start tracim with webdav or not
if [ "$START_WEBDAV" = "1" ]; then
    set +e
    service uwsgi restart
    set -e
    tail -f /var/log/dpkg.log
else
    rm -f /etc/uwsgi/apps-enabled/tracim_webdav.ini
    set +e
    service uwsgi restart
    set -e
    tail -f /var/log/dpkg.log
fi

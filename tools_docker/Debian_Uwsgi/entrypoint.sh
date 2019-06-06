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
supervisord -c /tracim/tools_docker/Debian_Uwsgi/supervisord_tracim.conf

# Start daemon for async email
supervisorctl start tracim_mail_notifier

# Activate daemon for reply by email
if [ "$REPLY_BY_EMAIL" = "1" ];then
    supervisorctl start tracim_mail_fetcher
fi

# Activate or deactivate webdav
if [ "$START_WEBDAV" = "1" ]; then
    if [ ! -L /etc/uwsgi/apps-enabled/tracim_webdav.ini ]; then
        ln -s /etc/uwsgi/apps-available/tracim_webdav.ini /etc/uwsgi/apps-enabled/tracim_webdav.ini
    fi
    sed -i "s|webdav.ui.enabled = .*|webdav.ui.enabled = True|g" /etc/tracim/development.ini
    sed -i "s|^\s*#ProxyPass /webdav http://127.0.0.1:3030/webdav|    ProxyPass /webdav http://127.0.0.1:3030/webdav|g" /etc/tracim/apache2.conf
    sed -i "s|^\s*#ProxyPassReverse /webdav http://127.0.0.1:3030/webdav|    ProxyPassReverse /webdav http://127.0.0.1:3030/webdav|g" /etc/tracim/apache2.conf
else
    rm -f /etc/uwsgi/apps-enabled/tracim_webdav.ini
    sed -i "s|webdav.ui.enabled = .*|webdav.ui.enabled = False|g" /etc/tracim/development.ini
    sed -i "s|^\s*ProxyPass /webdav http://127.0.0.1:3030/webdav|    #ProxyPass /webdav http://127.0.0.1:3030/webdav|g" /etc/tracim/apache2.conf
    sed -i "s|^\s*ProxyPassReverse /webdav http://127.0.0.1:3030/webdav|    #ProxyPassReverse /webdav http://127.0.0.1:3030/webdav|g" /etc/tracim/apache2.conf
fi

# Activate or deactivate caldav
if [ "$START_CALDAV" = "1" ]; then
    if [ ! -L /etc/uwsgi/apps-enabled/tracim_caldav.ini ]; then
        ln -s /etc/uwsgi/apps-available/tracim_caldav.ini /etc/uwsgi/apps-enabled/tracim_caldav.ini
    fi
    sed -i "s|caldav.enabled = .*|caldav.enabled = True|g" /etc/tracim/development.ini
    sed -i "s|^\s*#ProxyPass /agenda http://127.0.0.1:8080/agenda|    ProxyPass /agenda http://127.0.0.1:8080/agenda|g" /etc/tracim/apache2.conf
    sed -i "s|^\s*#ProxyPassReverse /agenda http://127.0.0.1:8080/agenda|    ProxyPassReverse /agenda http://127.0.0.1:8080/agenda|g" /etc/tracim/apache2.conf
else
    rm -f /etc/uwsgi/apps-enabled/tracim_caldav.ini
    sed -i "s|caldav.enabled = .*|caldav.enabled = False|g" /etc/tracim/development.ini
    sed -i "s|^\s*ProxyPass /agenda http://127.0.0.1:8080/agenda|    #ProxyPass /agenda http://127.0.0.1:8080/agenda|g" /etc/tracim/apache2.conf
    sed -i "s|^\s*ProxyPassReverse /agenda http://127.0.0.1:8080/agenda|    #ProxyPassReverse /agenda http://127.0.0.1:8080/agenda|g" /etc/tracim/apache2.conf
fi

# Reload apache config
service apache2 restart

# Start tracim
set +e
service uwsgi restart
set -e
if [ "$START_CALDAV" = "1" ]; then
    cd /tracim/backend/
    tracimcli caldav sync -c /etc/tracim/development.ini
fi
tail -f /var/log/dpkg.log

#!/usr/bin/env bash
docker_script_dir=$(realpath $(dirname "$0"))

# Default values
export PYTHON_EGG_CACHE=/tmp
set -e

YELLOW='\033[1;33m'
BROWN='\033[0;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

TRACIM_USER='www-data'

function log {
    if [ "$DEBUG" = "1" ]; then
        echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${BROWN} $ $1${NC}"
    fi
}

function loggood {
    if [ "$DEBUG" = "1" ]; then
        echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${GREEN} $ $1${NC}"
    fi
}

function logerror {
    echo -e "\n${RED}[$(date +'%H:%M:%S')]${RED} $ $1${NC}"
    exit 1
}

function as_user {
    su $TRACIM_USER -s "/bin/bash" -c "$1"
}
function tracimcli_as_user {
    if [ "$DEBUG" = "1" ]; then
      debug_string='-d'
    else
      debug_string=''
    fi
    as_user "tracimcli $1 $debug_string -c /etc/tracim/development.ini"
}
function alembic_as_user {
    as_user "alembic -c /etc/tracim/development.ini $1"
}



# Check database environment variables
log "Checking of database environment variables"
/bin/bash "$docker_script_dir/check_env_vars.sh"
if [ ! "$?" = 0 ]; then
    logerror "invalid env var"
    exit 1
fi
loggood "check of database environment variables: success"

# Execute common tasks
/bin/bash "$docker_script_dir/common.sh"
if [ ! "$?" = 0 ]; then
    exit 1
fi

# Create file with all docker variable about TRACIM parameter
# This is needed as uWSGI doesn't get the environment defined here (it is started by service).
printenv |grep TRACIM > /var/tracim/data/tracim_env_variables || true
# Add variable for using xvfb with uwsgi
echo "DISPLAY=:99.0" >> /var/tracim/data/tracim_env_variables

log "Ensuring www-data is the owner of /var/tracim files"
find /var/tracim/ ! -user www-data ! -group www-data -exec chown www-data:www-data {} \;
loggood "Ensuring www-data is the owner of /var/tracim files: success"

log "Checking database"
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
loggood "checking of database success"
# Initialize database if needed
if [ "$INIT_DATABASE" = true ] ; then
    log "Initialise Database"
    cd /tracim/backend/
    tracimcli_as_user "db init"
    loggood "Database initialisation success"
else
    log "Update database"
    cd /tracim/backend/
    alembic_as_user "upgrade head"
fi
loggood "database ready"

# activate apache modules
a2enmod proxy proxy_http proxy_ajp rewrite deflate headers proxy_html dav_fs dav expires proxy_uwsgi

# Activate or deactivate webdav
if [ "$START_WEBDAV" = "1" ]; then
    log "Creating configuration and enabling webdav"
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
    log "Creating configuration enabling caldav"
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
    log "Activation of collaborative_document_edition"
    DEFAULT_APP_LIST="$DEFAULT_APP_LIST,collaborative_document_edition"
fi
# INFO - G.M - 2020-01-28 - replace app.enabled in config file
sed -i "s|^app.enabled = .*|app.enabled = $DEFAULT_APP_LIST|g" /etc/tracim/development.ini
sed -i "s|^;\s*app.enabled = .*|app.enabled = $DEFAULT_APP_LIST|g" /etc/tracim/development.ini
# TODO PA 2019-06-19 Rework the index-create part according to https://github.com/tracim/tracim/issues/1961
# Make sure index is created in case of Elastic Search based search. (the command does nothing in case of simple search)
cd /tracim/backend/
tracimcli_as_user "search index-create"

log "Start all services"
# starting services
service pushpin start # tracim live messages (TLMs) sending
service zurl start # tracim live messages (TLMs) sending
service redis-server start  # async jobs (for mails and TLMs)
service apache2 restart
log "Run supervisord"
supervisord -c "$docker_script_dir/supervisord_tracim.conf"
# Activate daemon for reply by email
if [ "$REPLY_BY_EMAIL" = "1" ];then
    log "Starting mail fetcher"
    supervisorctl start tracim_mail_fetcher
fi
# Start tracim
log "start uwsgi"
set +e
service uwsgi restart
set -e
if [ "$START_CALDAV" = "1" ]; then
    log "Synchronizing caldav accounts"
    cd /tracim/backend/
    tracimcli_as_user "caldav sync"
fi
log "Tracim ready to use"
tail -f /var/tracim/logs/tracim_web.log

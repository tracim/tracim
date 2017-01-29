#!/usr/bin/env bash

# TODO: generate cookie secret (if not yet done)
# TODO: run uwsgi as other user
# TODO: Gestion des migrations
# TODO: Verbosite des logs ?

#
# ENVIRONMENT VARIABLES ARE:
#
# * DATABASE_TYPE (values: postgresql, mysql, sqlite)
# * DATABASE_USER
# * DATABASE_PASSWORD
# * DATABASE_HOST
# * DATABASE_PORT
# * DATABASE_NAME
# * PULL
#

# Default values
# TODO: Voir avec Damien si c'est le comportement souhaité
PULL=${PULL:=1}

# Check environment variables
/tracim/check_env_vars.sh
if [ ! "$?" = 0 ]; then
    exit 1
fi

# If PULL is set, change repository HEAD
if [ "$PULL" = 1 ]; then
    echo "Upgrade Tracim code"
    cd /tracim && git pull origin master
fi

# Create config.ini file if no exist
if [ ! -f /etc/tracim/config.ini ]; then
    cp /tracim/tracim/development.ini.base /etc/tracim/config.ini
fi
ln -sf /etc/tracim/config.ini /tracim/tracim/config.ini

# Create wsgidav.conf file if no exist
if [ ! -f /etc/tracim/wsgidav.conf ]; then
    cp /tracim/tracim/wsgidav.conf.sample /etc/tracim/wsgidav.conf
fi
ln -sf /etc/tracim/wsgidav.conf /tracim/tracim/wsgidav.conf

# MySQL case
if [ "$DATABASE_TYPE" = mysql ] ; then
    # Ensure DATABASE_PORT is set
    if ! [ -n "$DATABASE_PORT" ]; then
        DATABASE_PORT=3306
    fi
    # engine is mysql+oursql
    DATABASE_TYPE=mysql+oursql

    # Check if database must be init
    TEST_TABLE=$(mysql --host="$DATABASE_HOST" --user="$DATABASE_USER" --password="$DATABASE_USER" --database="$DATABASE_NAME" -s -N --execute="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DATABASE_NAME' AND table_name = 'content';")
    if [ ${TEST_TABLE} = 0 ] ; then
        INIT_DATABASE=true
    fi
fi

# PostgreSQL case
if [ "$DATABASE_TYPE" = postgresql ] ; then
    # Ensure DATABASE_PORT is set
    if ! [ -n "$DATABASE_PORT" ]; then
        DATABASE_PORT=5432
    fi
    DATABASE_SUFFIX="?client_encoding=utf8"

    # Check if database must be init
    TEST_TABLE=$(PGPASSWORD="$DATABASE_PASSWORD" psql -U ${DATABASE_USER} -h ${TEST_TABLE} -d ${DATABASE_NAME} -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content' );")
    if [ ${TEST_TABLE} = f ] ; then
        INIT_DATABASE=true
    fi
fi

# SQLite case
if [ "$DATABASE_TYPE" = sqlite ] ; then
    if [ ! -f /var/tracim/tracim.db ]; then
        INIT_DATABASE=true
    fi
fi

# Update radicale file system folder config
sed -i "s/\(# radicale.server.filesystem.folder *= *\).*/radicale.server.filesystem.folder = \/var\/tracim\/radicale/" /etc/tracim/config.ini

# Update sqlalchemy.url config
if ! [ "$DATABASE_TYPE" = sqlite ] ; then
    sed -i "s/\(sqlalchemy.url *= *\).*/\\sqlalchemy.url = $DATABASE_TYPE:\/\/$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT\/$DATABASE_NAME$DATABASE_SUFFIX/" /etc/tracim/config.ini
else
    sed -i "s/\(sqlalchemy.url *= *\).*/\\sqlalchemy.url = sqlite:\/\/\/\/var\/tracim\/tracim.db/" /etc/tracim/config.ini
fi

# Start redis server (for async email sending if configured)
service redis-server start

# Initialize database if needed
if [ "$INIT_DATABASE" = true ] ; then
    cd /tracim/tracim/ && gearbox setup-app -c config.ini
fi

# Upgrade database
if [ "$PULL" = 1 ]; then
    echo "Upgrade Tracim database if required"
    cd /tracim/tracim/ && gearbox migrate upgrade
fi

service nginx start

ln -sf /var/log/uwsgi/app/tracim.log /var/tracim/logs/uwsgi.log
ln -sf /var/log/nginx/access.log /var/tracim/logs/nginx-access.log
ln -sf /var/log/nginx/error.log /var/tracim/logs/nginx-error.log
mkdir -p /var/run/uwsgi/app/tracim/
chown www-data:www-data -R /var/run/uwsgi
chown www-data:www-data -R /var/tracim

uwsgi -i /etc/uwsgi/apps-available/tracim.ini --uid www-data --gid www-data

#!/usr/bin/env bash

# TODO: Données de postgreSQL dans un volume
# TODO: Mettre des variable d'environn pour la config
# TODO: Supporter le changement des variables d'environnement ? (actuellement utilisé pour générer le .ini)
# TODO: Fichiers de config link ls -s dans un dossier pour VOLUME
# TODO: README QQCH pour les ports ? 80, 3060 et 5333
# TODO: generate cookie secrent (if not yet done)
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
#

# Check environment variables
/tracim/check_env_vars.sh

# Create config.ini file if no exist
if [ ! -f /etc/tracim/config.ini ]; then
    cp /tracim/tracim/development.ini.base /etc/tracim/config.ini
fi
ln -s /etc/tracim/config.ini /tracim/tracim/config.ini

# Create wsgidav.conf file if no exist
if [ ! -f /etc/tracim/wsgidav.conf ]; then
    cp /tracim/tracim/wsgidav.conf.sample /etc/tracim/wsgidav.conf
fi
ln -s /etc/tracim/wsgidav.conf /tracim/tracim/wsgidav.conf

# Create uwsgi file if no exist
if [ ! -f /etc/tracim/uwsgi.ini ]; then
    cp /tracim/tracim/uwsgi.ini.template /etc/tracim/uwsgi.ini
fi

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
    if [ ! -f /var/lib/tracim/tracim.db ]; then
        INIT_DATABASE=true
    fi
fi

# Update sqlalchemy.url
if ! [ "$DATABASE_TYPE" = sqlite ] ; then
    sed -i "s/\(sqlalchemy.url *= *\).*/\\sqlalchemy.url = $DATABASE_TYPE:\/\/$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT\/$DATABASE_NAME$DATABASE_SUFFIX/" /etc/tracim/config.ini
else
    sed -i "s/\(sqlalchemy.url *= *\).*/\\sqlalchemy.url = sqlite:\/\/\/\/var\/lib\/tracim\/tracim.db/" /etc/tracim/config.ini
fi

# Initialize database if needed
if [ "$INIT_DATABASE" = true ] ; then
    cd /tracim/tracim/ && gearbox setup-app -c config.ini
fi

# Start with uwsgi
uwsgi --http-socket 0.0.0.0:80 /etc/tracim/uwsgi.ini

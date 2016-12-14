#!/usr/bin/env bash

# TODO: Données de postgreSQL dans un volume
# TODO: Mettre des variable d'environn pour la config
# TODO: Supporter le changement des variables d'environnement ? (actuellement utilisé pour générer le .ini)
# TODO: Fichiers de config link ls -s dans un dossier pour VOLUME
# TODO: README QQCH pour les ports ? 80, 3060 et 5333
# TODO: generate cookie secrent (if not yet done)

# Start PostgreSQL
service postgresql start

# Init database if needed
if ! [ "$( su - postgres -s /bin/bash -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='tracim'\"" )" = '1' ]; then
    su - postgres -s /bin/bash -c "psql -c \"CREATE DATABASE tracim;\""
    su - postgres -s /bin/bash -c "psql -c \"CREATE USER tracim WITH PASSWORD 'tracim';\""
    su - postgres -s /bin/bash -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE tracim TO tracim;\""
fi

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
    cp /tracim/tracim/uwsgi.ini /etc/tracim/uwsgi.ini
fi

# Update config with ENV
# TODO Manage other ENV vars
sed -i "s/\(sqlalchemy.url *= *\).*/\1postgresql:\/\/tracim:tracim@127.0.0.1:5432\/tracim?client_encoding=utf8/" /etc/tracim/config.ini

# Start with uwsgi
uwsgi --http-socket 0.0.0.0:80 /etc/tracim/uwsgi.ini

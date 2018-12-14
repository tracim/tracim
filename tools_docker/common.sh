#!/usr/bin/env bash

# Create tracim conf file if none exists
if [ ! -f /etc/tracim/production.ini ]; then
    CONFIG_FILE_IS_NEW=1
    KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-32} | head -n 1)
    SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-32} | head -n 1)
    cp /tracim/backend/development.ini.sample /etc/tracim/production.ini
    sed -i "s|basic_setup.api_key =.*|basic_setup.api_key = $KEY|g" /etc/tracim/production.ini
    sed -i "s|basic_setup.session_secret = change_this_value_please\!|basic_setup.session_secret = $SECRET|g" /etc/tracim/production.ini
    sed -i "s|basic_setup.website_base_url = .*|basic_setup.website_base_url = http://localhost:8080|g" /etc/tracim/production.ini
    sed -i "s|basic_setup.listen = .*|basic_setup.listen = 127.0.0.1:8080|g" /etc/tracim/production.ini
    sed -i "s|basic_setup.depot_storage_dir = .*|basic_setup.depot_storage_dir = \/var\/tracim\/depot|g" /etc/tracim/production.ini
    sed -i "s|basic_setup.sessions_data_root_dir = .*|basic_setup.sessions_data_root_dir = \/var\/tracim|g" /etc/tracim/production.ini
    case "$DATABASE_TYPE" in
      mysql)
        sed -i "s|basic_setup.sqlalchemy_url = .*|basic_setup.sqlalchemy_url = $DATABASE_TYPE+pymysql:\/\/$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT\/$DATABASE_NAME$DATABASE_SUFFIX|g" /etc/tracim/production.ini ;;
      postgresql)
        sed -i "s|basic_setup.sqlalchemy_url = .*|basic_setup.sqlalchemy_url = $DATABASE_TYPE:\/\/$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT\/$DATABASE_NAME$DATABASE_SUFFIX|g" /etc/tracim/production.ini ;;
      sqlite)
        sed -i "s|basic_setup.sqlalchemy_url = .*|basic_setup.sqlalchemy_url = sqlite:\/\/\/\/var\/tracim\/tracim.sqlite|g" /etc/tracim/production.ini ;;
    esac
fi
if [ ! -L /tracim/backend/development.ini ]; then
    ln -sf /etc/tracim/production.ini /tracim/backend/development.ini
fi

# Create apache conf file if none exists
if [ ! -f /etc/tracim/apache2.conf ]; then
    cp /tracim/apache2.conf /etc/tracim/apache2.conf
fi
if [ ! -L /etc/apache2/sites-available/tracim.conf ]; then
    ln -s /etc/tracim/apache2.conf /etc/apache2/sites-available/tracim.conf
fi
if [ ! -L /etc/apache2/sites-enabled/tracim.conf ]; then
    ln -s /etc/apache2/sites-available/tracim.conf /etc/apache2/sites-enabled/tracim.conf
fi

# Create uwsgi conf file if none exists
if [ ! -f /etc/tracim/uwsgi.ini ]; then
    cp /tracim/uwsgi.ini /etc/tracim/uwsgi.ini
fi
if [ ! -L /etc/uwsgi/apps-available/tracim.ini ]; then
    ln -s /etc/tracim/uwsgi.ini /etc/uwsgi/apps-available/tracim.ini
fi
if [ ! -L /etc/uwsgi/apps-enabled/tracim.ini ]; then
    ln -s /etc/uwsgi/apps-available/tracim.ini /etc/uwsgi/apps-enabled/tracim.ini
fi

# Create color.json file if no exist
if [ ! -f /etc/tracim/color.json ]; then
    cp /tracim/color.json.sample /etc/tracim/color.json
fi
if [ ! -L /tracim/color.json ]; then
    ln -s /etc/tracim/color.json /tracim/color.json
fi

# Create logs and assets directories
if [ ! -d /var/tracim/logs ]; then
    mkdir /var/tracim/logs -p
    touch /var/tracim/logs/uwsgi.log
    touch /var/tracim/logs/apache2-access.log
    touch /var/tracim/logs/apache2-error.log
    chown root:www-data -R /var/tracim/logs
    chmod 775 -R /var/tracim/logs
fi

if [ ! -f /var/tracim/assets ]; then
    mkdir /var/tracim/assets -p
fi

if [ ! -L /var/log/uwsgi/app/tracim.log ]; then
    ln -sf /var/tracim/logs/uwsgi.log /var/log/uwsgi/app/tracim.log
fi
if [ ! -L /var/log/apache2/access.log ]; then
    ln -sf /var/tracim/logs/apache2-access.log /var/log/apache2/access.log
fi
if [ ! -L /var/log/apache2/error.log ]; then
  ln -sf /var/tracim/logs/apache2-error.log /var/log/apache2/error.log
fi

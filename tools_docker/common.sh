#!/usr/bin/env bash

# Create tracim conf file if none exists
if [ ! -f /etc/tracim/config.ini ]; then
    CONFIG_FILE_IS_NEW=1
    cp /tracim/backend/development.ini.sample /etc/tracim/config.ini
    sed -i "s|listen = .*|listen = 127.0.0.1:6543|g" /etc/tracim/config.ini
    sed -i "s/\(depot_storage_dir *= *\).*/depot_storage_dir = \/var\/tracim\/depot/" /etc/tracim/config.ini
    sed -i "s|\(session.data_dir *= *\).*|session.data_dir = \/var\/tracim\/session.data\/|g" /etc/tracim/config.ini
    sed -i "s|\(session.lock_dir *= *\).*|session.lock_dir = \/var\/tracim\/session.lock\/|g" /etc/tracim/config.ini
    case "$DATABASE_TYPE" in
      mysql)
        sed -i "s/\(^sqlalchemy.url *= *\).*/\\sqlalchemy.url = $DATABASE_TYPE+pymysql:\/\/$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT\/$DATABASE_NAME$DATABASE_SUFFIX/" /etc/tracim/config.ini ;;
      postgresql)
        sed -i "s/\(^sqlalchemy.url *= *\).*/\\sqlalchemy.url = $DATABASE_TYPE:\/\/$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT\/$DATABASE_NAME$DATABASE_SUFFIX/" /etc/tracim/config.ini ;;
      sqlite)
        sed -i "s/\(^sqlalchemy.url *= *\).*/\\sqlalchemy.url = sqlite:\/\/\/\/var\/tracim\/tracim.sqlite/" /etc/tracim/config.ini ;;
    esac
fi
if [ ! -L /tracim/backend/development.ini ]; then
    ln -sf /etc/tracim/config.ini /tracim/backend/development.ini
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

# Create wsgidav.conf file if no exist
if [ ! -f /etc/tracim/wsgidav.conf ]; then
    cp /tracim/backend/wsgidav.conf.sample /etc/tracim/wsgidav.conf
fi
if [ ! -L /tracim/backend/wsgidav.conf ]; then
    ln -s /etc/tracim/wsgidav.conf /tracim/backend/wsgidav.conf
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

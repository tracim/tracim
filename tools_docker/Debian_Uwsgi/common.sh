#!/usr/bin/env bash

# Create tracim conf file if none exists
if [ ! -f /etc/tracim/development.ini ]; then
    CONFIG_FILE_IS_NEW=1
    KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-32} | head -n 1)
    SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-32} | head -n 1)
    cp /tracim/backend/development.ini.sample /etc/tracim/development.ini
    sed -i "s|basic_setup.api_key =.*|basic_setup.api_key = $KEY|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.session_secret = change_this_value_please\!|basic_setup.session_secret = $SECRET|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.website_base_url = .*|basic_setup.website_base_url = http://localhost:8080|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.listen = .*|basic_setup.listen = 127.0.0.1:8080|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.depot_storage_dir = .*|basic_setup.depot_storage_dir = \/var\/tracim\/depot|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.sessions_data_root_dir = .*|basic_setup.sessions_data_root_dir = \/var\/tracim|g" /etc/tracim/development.ini
    sed -i "s|webdav.listen = .*|webdav.listen = 0.0.0.0:3030|g" /etc/tracim/development.ini
    sed -i "s|;webdav.root_path = /|webdav.root_path = /webdav|g" /etc/tracim/development.ini
    case "$DATABASE_TYPE" in
      mysql)
        sed -i "s|basic_setup.sqlalchemy_url = .*|basic_setup.sqlalchemy_url = $DATABASE_TYPE+pymysql:\/\/$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT\/$DATABASE_NAME$DATABASE_SUFFIX|g" /etc/tracim/development.ini ;;
      postgresql)
        sed -i "s|basic_setup.sqlalchemy_url = .*|basic_setup.sqlalchemy_url = $DATABASE_TYPE:\/\/$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT\/$DATABASE_NAME$DATABASE_SUFFIX|g" /etc/tracim/development.ini ;;
      sqlite)
        sed -i "s|basic_setup.sqlalchemy_url = .*|basic_setup.sqlalchemy_url = sqlite:\/\/\/\/var\/tracim\/tracim.sqlite|g" /etc/tracim/development.ini ;;
    esac
fi
if [ ! -L /tracim/backend/development.ini ]; then
    ln -sf /etc/tracim/development.ini /tracim/backend/development.ini
fi

# Create apache conf file if none exists
if [ ! -f /etc/tracim/apache2.conf ]; then
    cp /tracim/apache2.conf.sample /etc/tracim/apache2.conf
fi
if [ ! -L /etc/apache2/sites-available/tracim.conf ]; then
    ln -s /etc/tracim/apache2.conf /etc/apache2/sites-available/tracim.conf
fi
if [ ! -L /etc/apache2/sites-enabled/tracim.conf ]; then
    ln -s /etc/apache2/sites-available/tracim.conf /etc/apache2/sites-enabled/tracim.conf
fi

# Create uwsgi conf file if none exists
if [ ! -f /etc/tracim/uwsgi.ini ]; then
    cp /tracim/uwsgi.ini.sample /etc/tracim/uwsgi.ini
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

# Create service
# UWSI
if [ ! -f /etc/systemd/system/tracim_uwsgi.service ]; then
    cp /tracim/tools_docker/Debian_Uwsgi/new_service.service.sample /etc/systemd/system/tracim_uwsgi.service
    sed -i "s|Description=|Description=tracim_uwsgi service|g" /etc/systemd/system/tracim_uwsgi.service
    sed -i "s|ExecStart=|ExecStart=/usr/bin/uwsgi --ini /tracim/uwsgi.ini --http-socket :8080 --plugin python3 --uid www-data --gid www-data|g" /etc/systemd/system/tracim_uwsgi.service
fi

# Webdav
if [ ! -f /etc/systemd/system/tracim_webdav.service ]; then
    cp /tracim/tools_docker/Debian_Uwsgi/new_service.service.sample /etc/systemd/system/tracim_webdav.service
    sed -i "s|Description=|Description=tracim_webdav service|g" /etc/systemd/system/tracim_webdav.service
    sed -i "s|ExecStart=|ExecStart=/usr/bin/uwsgi --ini /tracim/webdav.ini --http-socket :3030|g" /etc/systemd/system/tracim_webdav.service
fi
# Webdav config
if [ "$WEBDAV" = "start" ]; then
    cp /tracim/uwsgi.ini.sample /etc/tracim/webdav.ini
    ln -s /etc/tracim/webdav.ini /tracim/webdav.ini
    sed -i "s|module = wsgi.web:application|module = wsgi.webdav:application|g" /etc/tracim/webdav.ini
fi
if [ "$WEBDAV" = "start" ]; then
    sed -i "s|#<Directory "/">|<Directory "/">|g" /etc/tracim/apache2.conf
    sed -i "s|#    Require all granted|    Require all granted|g" /etc/tracim/apache2.conf
    sed -i "s|#    Dav On|    Dav On|g" /etc/tracim/apache2.conf
    sed -i "s|#</Directory>|</Directory>|g" /etc/tracim/apache2.conf
    sed -i "s|#ProxyPass /webdav http://127.0.0.1:3030/webdav|ProxyPass /webdav http://127.0.0.1:3030/webdav|g" /etc/tracim/apache2.conf
    sed -i "s|#ProxyPassReverse /webdav http://127.0.0.1:3030/webdav|ProxyPassReverse /webdav http://127.0.0.1:3030/webdav|g" /etc/tracim/apache2.conf
fi

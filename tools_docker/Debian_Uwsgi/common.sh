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
    sed -i "s|basic_setup.depot_storage_dir = .*|basic_setup.depot_storage_dir = /var/tracim/data/depot|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.preview_cache_dir = .*|basic_setup.preview_cache_dir = /var/tracim/data/preview|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.sessions_data_root_dir = .*|basic_setup.sessions_data_root_dir = /var/tracim/data|g" /etc/tracim/development.ini
    sed -i "s|webdav.listen = .*|webdav.listen = 127.0.0.1:3030|g" /etc/tracim/development.ini
    sed -i "s|;webdav.root_path = /|webdav.root_path = /webdav|g" /etc/tracim/development.ini
    sed -i "s|; wsgidav.client.base_url = .*|wsgidav.client.base_url = 127.0.0.1:3030|g" /etc/tracim/development.ini
    case "$DATABASE_TYPE" in
      mysql)
        sed -i "s|basic_setup.sqlalchemy_url = .*|basic_setup.sqlalchemy_url = $DATABASE_TYPE+pymysql://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME$DATABASE_SUFFIX|g" /etc/tracim/development.ini ;;
      postgresql)
        sed -i "s|basic_setup.sqlalchemy_url = .*|basic_setup.sqlalchemy_url = $DATABASE_TYPE://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME$DATABASE_SUFFIX|g" /etc/tracim/development.ini ;;
      sqlite)
        sed -i "s|basic_setup.sqlalchemy_url = .*|basic_setup.sqlalchemy_url = sqlite:////var/tracim/data/tracim.sqlite|g" /etc/tracim/development.ini ;;
    esac
fi

# Create apache conf file if none exists
if [ ! -f /etc/tracim/apache2.conf ]; then
    cp /tracim/tools_docker/Debian_Uwsgi/apache2.conf.sample /etc/tracim/apache2.conf
fi
if [ ! -L /etc/apache2/sites-available/tracim.conf ]; then
    ln -s /etc/tracim/apache2.conf /etc/apache2/sites-available/tracim.conf
fi
if [ ! -L /etc/apache2/sites-enabled/tracim.conf ]; then
    ln -s /etc/apache2/sites-available/tracim.conf /etc/apache2/sites-enabled/tracim.conf
fi

# Create uwsgi conf file if none exists
if [ ! -f /etc/tracim/tracim_web.ini ]; then
    cp /tracim/tools_docker/Debian_Uwsgi/uwsgi.ini.sample /etc/tracim/tracim_web.ini
fi
if [ ! -L /etc/uwsgi/apps-available/tracim_web.ini ]; then
    ln -s /etc/tracim/tracim_web.ini /etc/uwsgi/apps-available/tracim_web.ini
fi
if [ ! -L /etc/uwsgi/apps-enabled/tracim_web.ini ]; then
    ln -s /etc/uwsgi/apps-available/tracim_web.ini /etc/uwsgi/apps-enabled/tracim_web.ini
fi

# Create color.json file if no exist
if [ ! -f /etc/tracim/color.json ]; then
    cp /tracim/color.json.sample /etc/tracim/color.json
fi
if [ ! -L /tracim/color.json ]; then
    ln -s /etc/tracim/color.json /tracim/color.json
fi

# Create logo.png file if no exist
if [ ! -f /etc/tracim/logo.png ]; then
    cp /tracim/frontend/dist/assets/images/logo-tracim.png.default /etc/tracim/logo.png
fi
if [ ! -L /tracim/frontend/dist/assets/images/logo-tracim.png ]; then
    ln -s /etc/tracim/logo.png /tracim/frontend/dist/assets/images/logo-tracim.png
fi

# Create logs, folder and assets directories
if [ ! -d /var/tracim/logs ]; then
    mkdir /var/tracim/logs -p
    touch /var/tracim/logs/tracim_web.log
    touch /var/tracim/logs/tracim_webdav.log
    touch /var/tracim/logs/apache2-access.log
    touch /var/tracim/logs/apache2-error.log
    chown root:www-data -R /var/tracim/logs
    chmod 775 -R /var/tracim/logs
fi
if [ ! -L /var/log/uwsgi/app/tracim_web.log ]; then
    ln -sf /var/tracim/logs/tracim_web.log /var/log/uwsgi/app/tracim_web.log
fi
if [ ! -L /var/log/uwsgi/app/tracim_webdav.log ]; then
    ln -sf /var/tracim/logs/tracim_webdav.log /var/log/uwsgi/app/tracim_webdav.log
fi
if [ ! -L /var/log/apache2/tracim-access.log ]; then
    ln -sf /var/tracim/logs/apache2-access.log /var/log/apache2/tracim-access.log
fi
if [ ! -L /var/log/apache2/tracim-error.log ]; then
  ln -sf /var/tracim/logs/apache2-error.log /var/log/apache2/tracim-error.log
fi
# Create folder and assets directories
if [ ! -d /var/tracim/data ]; then
    mkdir /var/tracim/data -p
fi
if [ ! -f /var/tracim/assets ]; then
    mkdir /var/tracim/assets -p
fi

# Create Webdav file/config if not exist
if [ "$START_WEBDAV" = "1" ]; then
    if [ ! -f /etc/tracim/tracim_webdav.ini ];then
        cp /tracim/tools_docker/Debian_Uwsgi/uwsgi.ini.sample /etc/tracim/tracim_webdav.ini
        sed -i "s|module = .*|module = wsgi.webdav:application|g" /etc/tracim/tracim_webdav.ini
        sed -i "s|http-socket = .*|http-socket = :3030|g" /etc/tracim/tracim_webdav.ini
        sed -i "s|logto = .*|logto = /var/tracim/logs/tracim_webdav.log|g" /etc/tracim/tracim_webdav.ini
    fi
    if [ ! -L /etc/uwsgi/apps-available/tracim_webdav.ini ]; then
        ln -s /etc/tracim/tracim_webdav.ini /etc/uwsgi/apps-available/tracim_webdav.ini
    fi
    if [ ! -L /etc/uwsgi/apps-enabled/tracim_webdav.ini ]; then
        ln -s /etc/uwsgi/apps-available/tracim_webdav.ini /etc/uwsgi/apps-enabled/tracim_webdav.ini
    fi
    sed -i "s|#<Directory \"/\">|<Directory \"/\">|g" /etc/tracim/apache2.conf
    sed -i "s|#    Require all granted|    Require all granted|g" /etc/tracim/apache2.conf
    sed -i "s|#    Dav On|    Dav On|g" /etc/tracim/apache2.conf
    sed -i "s|#</Directory>|</Directory>|g" /etc/tracim/apache2.conf
    sed -i "s|#ProxyPass /webdav http://127.0.0.1:3030/webdav|ProxyPass /webdav http://127.0.0.1:3030/webdav|g" /etc/tracim/apache2.conf
    sed -i "s|#ProxyPassReverse /webdav http://127.0.0.1:3030/webdav|ProxyPassReverse /webdav http://127.0.0.1:3030/webdav|g" /etc/tracim/apache2.conf
fi

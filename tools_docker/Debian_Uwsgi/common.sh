#!/usr/bin/env bash

# Create tracim conf file if none exists
if [ ! -f /etc/tracim/development.ini ]; then
    CONFIG_FILE_IS_NEW=1
    KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-32} | head -n 1)
    SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-32} | head -n 1)
    cp /tracim/backend/development.ini.sample /etc/tracim/development.ini
    sed -i "s|basic_setup.website_base_url = .*|basic_setup.website_base_url = http://localhost:8080|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.depot_storage_dir = .*|basic_setup.depot_storage_dir = /var/tracim/data/depot|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.caldav_storage_dir = .*|basic_setup.caldav_storage_dir = /var/tracim/data/radicale_storage|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.preview_cache_dir = .*|basic_setup.preview_cache_dir = /var/tracim/data/preview|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.sessions_data_root_dir = .*|basic_setup.sessions_data_root_dir = /var/tracim/data|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.file_template_dir = .*|basic_setup.file_template_dir = /tracim/backend/tracim_backend/templates/open_documents" /etc/tracim/development.ini
    sed -i "s|basic_setup.api_key =.*|basic_setup.api_key = $KEY|g" /etc/tracim/development.ini
    sed -i "s|basic_setup.session_secret = change_this_value_please\!|basic_setup.session_secret = $SECRET|g" /etc/tracim/development.ini
    sed -i "s|email.template_dir = .*|email.template_dir = /tracim/backend/tracim_backend/templates/mail|g" /etc/tracim/development.ini
    sed -i "s|email.reply.lockfile_path = .*|email.reply.lockfile_path = /var/tracim/data/email_fetcher.lock|g" /etc/tracim/development.ini
    sed -i "s|;webdav.root_path = /|webdav.root_path = /webdav|g" /etc/tracim/development.ini
    sed -i "s|webdav.base_url = .*|webdav.base_url = http://localhost:8080|g" /etc/tracim/development.ini
    sed -i "s|email.processing_mode = sync|email.processing_mode = async|g" /etc/tracim/development.ini
    sed -i "s|; email.async.redis.host = .*|email.async.redis.host = localhost|g" /etc/tracim/development.ini
    sed -i "s|; email.async.redis.port = .*|email.async.redis.port = 6379|g" /etc/tracim/development.ini
    sed -i "s|; email.async.redis.db = .*|email.async.redis.db = 0|g" /etc/tracim/development.ini
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
    touch /var/tracim/logs/tracim_caldav.log
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
if [ ! -L /var/log/uwsgi/app/tracim_caldav.log ]; then
    ln -sf /var/tracim/logs/tracim_caldav.log /var/log/uwsgi/app/tracim_caldav.log
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
# Create required folder
if [ ! -d /var/tracim/data/sessions_data ]; then
    mkdir /var/tracim/data/sessions_data
fi
if [ ! -d /var/tracim/data/sessions_lock ]; then
    mkdir /var/tracim/data/sessions_lock
fi
if [ ! -d /var/tracim/data/depot ]; then
    mkdir /var/tracim/data/depot
fi
if [ ! -d /var/tracim/data/preview ]; then
    mkdir /var/tracim/data/preview
fi
if [ ! -d /var/tracim/data/radicale_storage ]; then
    mkdir /var/tracim/data/radicale_storage
fi

# Create Webdav file/config if not exist and activate it
if [ "$START_WEBDAV" = "1" ]; then
    if [ ! -f /etc/tracim/tracim_webdav.ini ];then
        cp /tracim/tools_docker/Debian_Uwsgi/uwsgi.ini.sample /etc/tracim/tracim_webdav.ini
        sed -i "s|module = .*|module = wsgi.webdav:application|g" /etc/tracim/tracim_webdav.ini
        sed -i "s|http-socket = .*|http-socket = :3030|g" /etc/tracim/tracim_webdav.ini
        sed -i "s|#workers = .*|workers = 1|g" /etc/tracim/tracim_webdav.ini
        sed -i "s|logto = .*|logto = /var/tracim/logs/tracim_webdav.log|g" /etc/tracim/tracim_webdav.ini
    fi
    if [ ! -L /etc/uwsgi/apps-available/tracim_webdav.ini ]; then
        ln -s /etc/tracim/tracim_webdav.ini /etc/uwsgi/apps-available/tracim_webdav.ini
    fi
fi

# Create Caldav file/config if not exist
if [ "$START_CALDAV" = "1" ]; then
    if [ ! -f /etc/tracim/tracim_caldav.ini ];then
        cp /tracim/tools_docker/Debian_Uwsgi/uwsgi.ini.sample /etc/tracim/tracim_caldav.ini
        sed -i "s|module = .*|module = wsgi.caldav:application|g" /etc/tracim/tracim_caldav.ini
        sed -i "s|http-socket = .*|http-socket = localhost:5232|g" /etc/tracim/tracim_caldav.ini
        sed -i "s|#threads = .*|threads = 8|g" /etc/tracim/tracim_caldav.ini
        sed -i "s|logto = .*|logto = /var/tracim/logs/tracim_caldav.log|g" /etc/tracim/tracim_caldav.ini
    fi
    if [ ! -L /etc/uwsgi/apps-available/tracim_caldav.ini ]; then
        ln -s /etc/tracim/tracim_caldav.ini /etc/uwsgi/apps-available/tracim_caldav.ini
    fi
fi

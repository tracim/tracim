#!/usr/bin/env bash

TRACIM_USER='www-data'
function create_log_symlink() {
    destination=$1
    symlink=$2
    if [ ! -L "$symlink" ]; then
        ln -sf "$destination" "$symlink"
    fi
}
function create_dir() {
    if [ ! -d "$1" ]; then
        mkdir "$1" -p
    fi
}
# address on which tracim web is accessible within docker
# on port 8080 as uwsgi listens here by default.
tracim_web_internal_listen="localhost:8080"

# Create tracim conf file if none exists
if [ ! -f /etc/tracim/development.ini ]; then
    CONFIG_FILE_IS_NEW=1
    KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-32} | head -n 1)
    SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-32} | head -n 1)
    cp /tracim/backend/development.ini.sample /etc/tracim/development.ini
    sed -i "s|^basic_setup.website_base_url = .*|basic_setup.website_base_url = http://${tracim_web_internal_listen}|g" /etc/tracim/development.ini
    sed -i "s|^basic_setup.uploaded_files_storage_path = .*|basic_setup.uploaded_files_storage_path = /var/tracim/data/depot|g" /etc/tracim/development.ini
    sed -i "s|^basic_setup.caldav_storage_dir = .*|basic_setup.caldav_storage_dir = /var/tracim/data/radicale_storage|g" /etc/tracim/development.ini
    sed -i "s|^basic_setup.preview_cache_dir = .*|basic_setup.preview_cache_dir = /var/tracim/data/preview|g" /etc/tracim/development.ini
    sed -i "s|^basic_setup.sessions_data_root_dir = .*|basic_setup.sessions_data_root_dir = /var/tracim/data|g" /etc/tracim/development.ini
    sed -i "s|^basic_setup.api_key =.*|basic_setup.api_key = $KEY|g" /etc/tracim/development.ini
    sed -i "s|^session.type = .*|session.type = ext:redis|g" /etc/tracim/development.ini
    sed -i "s|^session.url =.*|session.url = redis://localhost:6379/0|g" /etc/tracim/development.ini
    sed -i "s|^basic_setup.session_secret = change_this_value_please\!|basic_setup.session_secret = $SECRET|g" /etc/tracim/development.ini
    sed -i "s|^; email.notification.content_update.template.html = .*|email.notification.content_update.template.html = %(email.template_dir)s/content_update_body_html.mak|g" /etc/tracim/development.ini
    sed -i "s|^; email.notification.created_account.template.html = .*|email.notification.created_account.template.html = %(email.template_dir)s/created_account_body_html.mak|g" /etc/tracim/development.ini
    sed -i "s|^; email.notification.reset_password_request.template.html = .*|email.notification.reset_password_request.template.html = %(email.template_dir)s/reset_password_body_html.mak|g" /etc/tracim/development.ini
    sed -i "s|^; email.notification.share_content_to_emitter.template.html = .*|email.notification.share_content_to_emitter.template.html = %(email.template_dir)s/shared_content_to_emitter_body_html.mak|g" /etc/tracim/development.ini
    sed -i "s|^; email.notification.share_content_to_receiver.template.html = .*|email.notification.share_content_to_receiver.template.html = %(email.template_dir)s/shared_content_to_receiver_body_html.mak|g" /etc/tracim/development.ini
    sed -i "s|^; email.notification.upload_permission_to_emitter.template.html = .*|email.notification.upload_permission_to_emitter.template.html = %(email.template_dir)s/upload_permission_to_emitter_body_html.mak|g" /etc/tracim/development.ini
    sed -i "s|^; email.notification.upload_permission_to_receiver.template.html = .*|email.notification.upload_permission_to_receiver.template.html = %(email.template_dir)s/upload_permission_to_receiver_body_html.mak|g" /etc/tracim/development.ini
    sed -i "s|^; email.notification.new_upload_event.template.html = .*|email.notification.new_upload_event.template.html = %(email.template_dir)s/new_upload_event_body_html.mak|g" /etc/tracim/development.ini
    sed -i "s|^; email.template_dir =.*|email.template_dir = /tracim/backend/tracim_backend/templates/mail|g" /etc/tracim/development.ini
    sed -i "s|^; email.reply.lockfile_path = .*|email.reply.lockfile_path = /var/tracim/data/email_fetcher.lock|g" /etc/tracim/development.ini
    sed -i "s|^; webdav.base_url = .*|webdav.base_url = http://${tracim_web_internal_listen}|g" /etc/tracim/development.ini
    sed -i "s|^; webdav.ui.enabled = .*|webdav.ui.enabled = True|g" /etc/tracim/development.ini
    sed -i "s|^; webdav.root_path = /|webdav.root_path = /webdav|g" /etc/tracim/development.ini
    sed -i "s|^; jobs.processing_mode = sync|jobs.processing_mode = async|g" /etc/tracim/development.ini
    sed -i "s|^; jobs.async.redis.host = .*|jobs.async.redis.host = localhost|g" /etc/tracim/development.ini
    sed -i "s|^; jobs.async.redis.port = .*|jobs.async.redis.port = 6379|g" /etc/tracim/development.ini
    sed -i "s|^; jobs.async.redis.db = .*|jobs.async.redis.db = 0|g" /etc/tracim/development.ini
    sed -i "s|^; plugin.folder_path = .*|plugin.folder_path = /etc/tracim/plugins|g" /etc/tracim/development.ini
    sed -i "s|^; user.custom_properties.json_schema_file_path = .*|user.custom_properties.json_schema_file_path = /tracim/backend/tracim_backend/templates/user_custom_properties/default/schema.json|g" /etc/tracim/development.ini
    sed -i "s|^; user.custom_properties.ui_schema_file_path = .*|user.custom_properties.ui_schema_file_path = /tracim/backend/tracim_backend/templates/user_custom_properties/default/ui.json|g" /etc/tracim/development.ini
    sed -i "s|^; user.custom_properties.translations_dir_path = .*|user.custom_properties.translations_dir_path = /tracim/backend/tracim_backend/templates/user_custom_properties/default/locale|g" /etc/tracim/development.ini
    sed -i "s|^; frontend.custom_toolbox_folder_path =.*|frontend.custom_toolbox_folder_path = /etc/tracim/custom_toolbox|g" /etc/tracim/development.ini
    sed -i "s|^; collaborative_document_edition.file_template_dir = .*|collaborative_document_edition.file_template_dir = /tracim/backend/tracim_backend/templates/open_documents|g" /etc/tracim/development.ini
    case "$DATABASE_TYPE" in
      mysql)
        sed -i "s|^basic_setup.sqlalchemy_url = .*|basic_setup.sqlalchemy_url = $DATABASE_TYPE+pymysql://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME$DATABASE_SUFFIX|g" /etc/tracim/development.ini ;;
      postgresql)
        sed -i "s|^basic_setup.sqlalchemy_url = .*|basic_setup.sqlalchemy_url = $DATABASE_TYPE://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME$DATABASE_SUFFIX|g" /etc/tracim/development.ini ;;
      sqlite)
        sed -i "s|^basic_setup.sqlalchemy_url = .*|basic_setup.sqlalchemy_url = sqlite:////var/tracim/data/tracim.sqlite|g" /etc/tracim/development.ini ;;
    esac
fi

# Create apache conf file if none exists
if [ ! -f /etc/tracim/apache2.conf ]; then
    cp "$DOCKER_SCRIPT_DIR/apache2.conf.sample" /etc/tracim/apache2.conf
fi
if [ ! -L /etc/apache2/sites-available/tracim.conf ]; then
    ln -s /etc/tracim/apache2.conf /etc/apache2/sites-available/tracim.conf
fi
if [ ! -L /etc/apache2/sites-enabled/tracim.conf ]; then
    ln -s /etc/apache2/sites-available/tracim.conf /etc/apache2/sites-enabled/tracim.conf
fi

# Create uwsgi conf file if none exists
if [ ! -f /etc/tracim/tracim_web.ini ]; then
    cp "$DOCKER_SCRIPT_DIR/uwsgi.ini.sample" /etc/tracim/tracim_web.ini
    sed -i "s|^#workers = .*|workers = 4|g" /etc/tracim/tracim_web.ini
    sed -i "s|^#threads = .*|threads = 4|g" /etc/tracim/tracim_web.ini
    sed -i "s|^#socket = :8081|socket = :8081|g" /etc/tracim/tracim_web.ini
fi
if [ ! -L /etc/uwsgi/apps-available/tracim_web.ini ]; then
    ln -s /etc/tracim/tracim_web.ini /etc/uwsgi/apps-available/tracim_web.ini
fi
if [ ! -L /etc/uwsgi/apps-enabled/tracim_web.ini ]; then
    ln -s /etc/uwsgi/apps-available/tracim_web.ini /etc/uwsgi/apps-enabled/tracim_web.ini
fi

# Create pushpin route file
echo "* ${tracim_web_internal_listen}" > /etc/pushpin/routes

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

# Create and link branding directory if it does not exist
if [ ! -e /etc/tracim/branding ]; then
    cp -r /tracim/frontend/dist/assets/branding.sample /etc/tracim/branding
fi
if [ ! -L /tracim/frontend/dist/assets/branding ]; then
    ln -s /etc/tracim/branding /tracim/frontend/dist/assets/branding
fi

# Create folder for plugins (backend) and custom_toolbox (frontend)
if [ ! -d /etc/tracim/plugins ]; then
    mkdir /etc/tracim/plugins -p
fi
if [ ! -d /etc/tracim/custom_toolbox ]; then
    mkdir /etc/tracim/custom_toolbox -p
fi

# Create folder and logs file
if [ ! -d /var/tracim/logs ]; then
    mkdir /var/tracim/logs -p
    mkdir /var/tracim/logs/redis -p
    mkdir /var/tracim/logs/pushpin -p
    touch /var/tracim/logs/tracim_web.log
    touch /var/tracim/logs/tracim_webdav.log
    touch /var/tracim/logs/tracim_caldav.log
    touch /var/tracim/logs/apache2-access.log
    touch /var/tracim/logs/apache2-error.log
    touch /var/tracim/logs/mail_notifier.log
    touch /var/tracim/logs/rq_worker.log
    touch /var/tracim/logs/supervisord.log
    touch /var/tracim/logs/redis/redis-server.log
    touch /var/tracim/logs/pushpin/access_7999.log
    touch /var/tracim/logs/pushpin/error_7999.log
    touch /var/tracim/logs/pushpin/m2adapter.log
    touch /var/tracim/logs/pushpin/mongrel2_7999.log
    touch /var/tracim/logs/pushpin/pushpin-handler.log
    touch /var/tracim/logs/pushpin/pushpin-proxy.log
    touch /var/tracim/logs/zurl.log
    chown www-data:www-data -R /var/tracim/logs
    chmod 775 -R /var/tracim/logs
fi

# Create log folder for Pushpin (necessary when migrate from Tracim < 3.0.0 )
if [ ! -d /var/tracim/logs/redis ]; then
    mkdir /var/tracim/logs/redis -p
    touch /var/tracim/logs/redis/redis-server.log
    chown www-data:www-data -R /var/tracim/logs/redis
    chmod 775 -R /var/tracim/logs/redis
fi
# Create log folder for Redis (necessary when migrate from Tracim < 3.0.0 )
if [ ! -d /var/tracim/logs/pushpin ]; then
    mkdir /var/tracim/logs/pushpin -p
    touch /var/tracim/logs/pushpin/access_7999.log
    touch /var/tracim/logs/pushpin/error_7999.log
    touch /var/tracim/logs/pushpin/m2adapter.log
    touch /var/tracim/logs/pushpin/mongrel2_7999.log
    touch /var/tracim/logs/pushpin/pushpin-handler.log
    touch /var/tracim/logs/pushpin/pushpin-proxy.log
    chown www-data:www-data -R /var/tracim/logs/pushpin
    chmod 775 -R /var/tracim/logs/pushpin
fi
# Create Zurl log (necessary when migrate from Tracim < 3.0.0 )
if [ ! -f /var/tracim/logs/zurl.log ];then
    touch /var/tracim/logs/zurl.log
    chown www-data:www-data /var/tracim/logs/zurl.log
    chmod 775 /var/tracim/logs/zurl.log
fi

# Create symbollic link to easy find log in container folder
# create_symlink_if_not_exist
create_log_symlink /var/tracim/logs/tracim_web.log /var/log/uwsgi/app/tracim_web.log
create_log_symlink /var/tracim/logs/tracim_webdav.log /var/log/uwsgi/app/tracim_webdav.log
create_log_symlink /var/tracim/logs/tracim_caldav.log /var/log/uwsgi/app/tracim_caldav.log
create_log_symlink /var/tracim/logs/apache2-access.log /var/log/apache2/tracim-access.log
create_log_symlink /var/tracim/logs/apache2-error.log /var/log/apache2/tracim-error.log
create_log_symlink /var/tracim/logs/redis/redis-server.log /var/log/redis-server.log
create_log_symlink var/tracim/logs/pushpin/access_7999.log /var/log/access_7999.log
create_log_symlink /var/tracim/logs/pushpin/error_7999.log /var/log/error_7999.log
create_log_symlink /var/tracim/logs/pushpin/m2adapter.log /var/log/m2adapter.log
create_log_symlink /var/tracim/logs/pushpin/mongrel2_7999.log /var/log/mongrel2_7999.log
create_log_symlink /var/tracim/logs/pushpin/pushpin-handler.log /var/log/pushpin-handler.log
create_log_symlink /var/tracim/logs/pushpin/pushpin-proxy.log /var/log/pushpin-proxy.log
create_log_symlink /var/tracim/logs/zurl.log /var/log/zurl.log

# Modify default log path for Pushpin, Redis, Zurl (since Tracim 3.0.0)
sed -i "s|^logdir=.*|logdir=/var/tracim/logs/pushpin/|g" /etc/pushpin/pushpin.conf
sed -i "s|^logfile.*|logfile /var/tracim/logs/redis/redis-server.log|g" /etc/redis/redis.conf
sed -i "s|^DAEMON_ARGS=.*|DAEMON_ARGS=\"--config=/etc/zurl.conf --logfile=/var/tracim/logs/zurl.log\" # Arguments to run the daemon with|g" /etc/init.d/zurl

# Add user Pushpin, Redis, Zurl in www-data group for logging (since Tracim 3.0.0)
adduser redis www-data
adduser pushpin www-data
adduser zurl www-data

# Create uWSGi app folder and set right
if [ ! -d /var/run/uwsgi/app ]; then
    mkdir /var/run/uwsgi/app -p
    chown www-data:www-data -R /var/run/uwsgi
fi

# Create Tracim required folder
create_dir /var/tracim/data
create_dir /var/tracim/assets
create_dir /var/tracim/data/sessions_data
create_dir /var/tracim/data/sessions_lock
create_dir /var/tracim/data/depot
create_dir /var/tracim/data/preview
create_dir /var/tracim/data/radicale_storage

# Create Webdav file/config if not exist and activate it
if [ "$START_WEBDAV" = "1" ]; then
    if [ ! -f /etc/tracim/tracim_webdav.ini ];then
        cp "$DOCKER_SCRIPT_DIR/uwsgi.ini.sample" /etc/tracim/tracim_webdav.ini
        sed -i "s|^module = .*|module = wsgi.webdav:application|g" /etc/tracim/tracim_webdav.ini
        sed -i "s|^http-socket = .*|http-socket = :3030|g" /etc/tracim/tracim_webdav.ini
        sed -i "s|^#workers = .*|workers = 1|g" /etc/tracim/tracim_webdav.ini
        sed -i "s|^logto = .*|logto = /var/tracim/logs/tracim_webdav.log|g" /etc/tracim/tracim_webdav.ini
    fi
    if [ ! -L /etc/uwsgi/apps-available/tracim_webdav.ini ]; then
        ln -s /etc/tracim/tracim_webdav.ini /etc/uwsgi/apps-available/tracim_webdav.ini
    fi
fi

# Create Caldav file/config if not exist
if [ "$START_CALDAV" = "1" ]; then
    if [ ! -f /etc/tracim/tracim_caldav.ini ]; then
        cp "$DOCKER_SCRIPT_DIR/uwsgi.ini.sample" /etc/tracim/tracim_caldav.ini
        sed -i "s|^module = .*|module = wsgi.caldav:application|g" /etc/tracim/tracim_caldav.ini
        sed -i "s|^http-socket = .*|http-socket = localhost:5232|g" /etc/tracim/tracim_caldav.ini
        sed -i "s|^#threads = .*|threads = 8|g" /etc/tracim/tracim_caldav.ini
        sed -i "s|^logto = .*|logto = /var/tracim/logs/tracim_caldav.log|g" /etc/tracim/tracim_caldav.ini
    fi
    if [ ! -L /etc/uwsgi/apps-available/tracim_caldav.ini ]; then
        ln -s /etc/tracim/tracim_caldav.ini /etc/uwsgi/apps-available/tracim_caldav.ini
    fi
fi

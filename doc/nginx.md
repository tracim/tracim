# Running Tracim through nginx #

### Installation ###

Install `nginx` http server and `uWSGI` app server:

    sudo apt install nginx uwsgi uwsgi-plugin-python3

### Configuration ###

In the following documentation, please replace:

- `[tracim_path]` by  your tracim installation path,
- `[your_user]` by your user.

Set the `APP_CONFIG` variable of the `tracim/app.wsgi` file to match your tracim installation path:

    # -*- coding: utf-8 -*-

    APP_CONFIG = "[tracim_path]/tracim/development.ini"

    #Setup logging
    # import logging
    # logging.config.fileConfig(APP_CONFIG)

    #Load the application
    from paste.deploy import loadapp
    application = loadapp('config:%s' % APP_CONFIG)
    application.debug = False

Create the file named `/etc/uwsgi/apps-available/tracim_uwsgi.ini` containing:

    [uwsgi]
    plugins = python3
    chdir = [tracim]/tracim
    home = [tracim]/tg2env
    wsgi-file = app.wsgi
    callable = application
    # socket = /var/run/uwsgi/app/tracim/socket
    socket = :8001
    enable-threads = true
    uid = [your_user]
    gid = [your_user]

Create a file named `/etc/nginx/sites-available/tracim_nginx.conf` containing:

    server {
        listen      8080;
        server_name tracim;
        charset     utf-8;

        client_max_body_size 75M;

        location /caldav {
            proxy_pass http://127.0.0.1:10000;
            proxy_set_header Host $http_host;
        }

        location /webdav {
            proxy_pass http://127.0.0.1:3031;
            proxy_set_header Host $http_host;
        }

        location /favicon.ico {
            alias [tracim_path]/tracim/tracim/public/favicon.ico;
        }

        location /assets {
            root [tracim_path]/tracim/tracim/public/assets;
            try_files $uri @default_assets;
        }

        location @default_assets {
            root [tracim_path]/tracim/tracim/public/;
        }

        location / {
            # uwsgi_pass  unix:/var/run/uwsgi/app/tracim/socket;
            uwsgi_pass  127.0.0.1:8001;
            include uwsgi_params;
            uwsgi_param  SCRIPT_NAME  '';
        }
    }

Enable this site configuration file:

    sudo ln -s /etc/nginx/sites-available/tracim_nginx.conf /etc/nginx/sites-enabled/

Reload `nginx` configuration:

    sudo systemctl reload nginx.service

Run uWSGI, by example with the following command:

    uwsgi --ini /etc/uwsgi/apps-available/tracim_uwsgi.ini

Tracim should be available in your browser at `127.0.0.1:8080`.

## Documentation Links ##

[uWSGI](http://uwsgi-docs.readthedocs.io/en/latest/tutorials/Django_and_nginx.html)

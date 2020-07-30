# Using Apache as a Proxy for Tracim #

### Installation ###

Install Tracim first.
Install the Apache server and uWSGI:

    sudo apt install apache2 libapache2-mod-wsgi-py3 uwsgi uwsgi-plugin-python3

### Configuration ###

Create a file named `/etc/apache2/sites-available/tracim.conf` containing:

    <VirtualHost *:80>
        ServerName [domain_name]

        Alias "/assets" "[TRACIM_PATH]/frontend/dist/assets"
        Alias "/favicon.ico" "[TRACIM_PATH]/frontend/dist/assets/favicon.ico"
        <Directory "[TRACIM_PATH]/frontend/dist/assets">
            Require all granted
        </Directory>

        Alias "/app" "[TRACIM_PATH]/frontend/dist/app"
        <Directory "[TRACIM_PATH]/frontend/dist/app">
            Require all granted
        </Directory>

        <Directory "/">
            Require all granted
            Dav On
        </Directory>
        SetEnv proxy-sendcl

        # Proxying Webdav
        <Location /webdav>
            # Setting Destination header from https to http in proxy
            # is needed for working move/copy in webdav
            RequestHeader edit Destination ^https http early
            # Preserving host is needed for working move/copy in webdav
            ProxyPreserveHost On
            ProxyPass http://127.0.0.1:3030/webdav
            ProxyPassReverse http://127.0.0.1:3030/webdav
        </Location>

        # Proxying Caldav
        ProxyPass /agenda http://127.0.0.1:5232/agenda
        ProxyPassReverse /agenda http://127.0.0.1:5232/agenda

        # Proxying Frontend
        ProxyPass /ui http://127.0.0.1:6543/ui
        ProxyPassReverse /ui http://127.0.0.1:6543/ui

        # Proxying Tracim Live Message to Pushpin
        ProxyPassMatch ^/api/users/([0-9]+/live_messages)$ http://127.0.0.1:7999/api/users/$1
        ProxyPassReverse ^/api/users/([0-9]+/live_messages)$ http://127.0.0.1:7999/api/users/$1

        # Proxying Backend API
        ProxyPass /api http://127.0.0.1:6543/api
        ProxyPassReverse /api http://127.0.0.1:6543/api

        # Proxying Plugin assets
        ProxyPass /custom_toolbox-assets http://127.0.0.1:6543/custom_toolbox-assets
        ProxyPassReverse /custom_toolbox-assets http://127.0.0.1:6543/custom_toolbox-assets

        ProxyPassMatch ^/$ http://localhost:6543
        ProxyPassReverse ^/$ http://127.0.0.1:6543

        CustomLog /var/log/apache2/apache2-tracim-access.log combined
        ErrorLog /var/log/apache2/apache2-tracim-error.log

    </VirtualHost>

You need to replace `[domain_name]` by your domain and [TRACIM_PATH] by your path of Tracim installation.

You need also to make changes in [TRACIM_PATH]/backend/development.ini on line `basic_setup.website_base_url =  http://localhost:7999`:
  - replace `localhost` by your domain
  - replace `7999` by `80` (if you don't want to use port 80, you need to change listen port also in apache configuration)

If you want to used browser cache policy, an exemple is visible [here](https://github.com/tracim/tracim/blob/develop/tools_docker/Debian_Uwsgi/apache2.conf.sample).
:warning: This line `RequestHeader edit "If-None-Match" '^"((.*)-(gzip|br))"$' '"$1", "$2"'` is make to solved apache2 issue visible [here](https://bz.apache.org/bugzilla/show_bug.cgi?id=45023#c26)
In this case you need also to make sure you used cache token feature available in development.ini

Enable this configuration file:

    sudo ln -s /etc/apache2/sites-available/tracim.conf /etc/apache2/sites-enabled/tracim.conf

#### Allow guest downloads from direct URLs produced before Tracim v3 (the old API path is `/api/v2/`)

example:
- old url (Tracim < 3.x): `http://localhost/api/v2/public/guest-download/.....`
- new url (Tracim ≥ 3.x): `http://localhost/api/public/guest-download/.....`

You just need to add this in your apache2 configuration to make sure old direct link working correctly:
~~~
    # Proxy old api path for direct guest download link
    ProxyPass /api/v2/public/guest-download http://127.0.0.1:8080/api/public/guest-download
~~~

#### Configuring uWSGI for the Tracim Server

Create the file named `/etc/uwsgi/apps-available/tracim.ini` containing:

    [uwsgi]
    plugins = python3
    chdir = [TRACIM_PATH]/backend/
    module = wsgi.web:application
    env = TRACIM_CONF_PATH=[TRACIM_PATH]/backend/development.ini
    virtualenv = [TRACIM_PATH]/backend/env
    http-socket = :6543
    socket-timeout = 360
    #workers = 4
    #threads = 4
    logto = /var/log/uwsgi/uwsgi_tracim.log

Replace `[TRACIM_PATH]` by the path of your Tracim configuration file.

Enable this configuration file:

    sudo ln -s /etc/uwsgi/apps-available/tracim.ini /etc/uwsgi/apps-enabled/tracim.ini

#### Configuring uWSGI for the Tracim CalDAV App

Create the file named `/etc/uwsgi/apps-available/tracim_caldav.ini` containing:

    [uwsgi]
    plugins = python3
    chdir = [TRACIM_PATH]/backend/
    module = wsgi.caldav:application
    env = TRACIM_CONF_PATH=[TRACIM_PATH]/backend/development.ini
    virtualenv = [TRACIM_PATH]/backend/env
    http-socket = :5232
    socket-timeout = 360
    threads = 8
    logto = /var/log/uwsgi/uwsgi_tracim_caldav.log

Replace `[TRACIM_PATH]` by your path of tracim configuration file

Enable this configuration file:

    sudo ln -s /etc/uwsgi/apps-available/tracim_caldav.ini /etc/uwsgi/apps-enabled/tracim_caldav.ini

Restart `uwsgi` configuration:

    sudo systemctl restart uwsgi.service

Load needed proxy modules:

    sudo a2enmod proxy proxy_http proxy_ajp rewrite deflate headers proxy_html dav_fs dav

Restart `Apache` configuration:

    sudo systemctl restart apache2.service

**Important**
In case you have some permission problem, check if `www-data` can access to folder of tracim.

## Documentation Links ##

* [Apache](https://httpd.apache.org/docs/2.4/)

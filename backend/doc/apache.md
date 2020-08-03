# Using Apache as a Proxy for Tracim #

### Installation ###

Install Tracim first.
Install the Apache server and uWSGI:

    sudo apt install apache2 libapache2-mod-proxy-uwsgi uwsgi uwsgi-plugin-python3

Activate the proxy_uwsgi module:

    sudo a2enmod proxy_uwsgi

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

        SetEnv proxy-sendcl

        # Main tracim paths proxyied to tracim_web with uwsgi protocol
        <Location /ui>
            ProxyPass uwsgi://localhost:6544/
            ProxyPassReverse uwsgi://localhost:6544/
        </Location>
        <Location /api>
            ProxyPass uwsgi://localhost:6544/
            ProxyPassReverse uwsgi://localhost:6544/
        </Location>
        <Location /custom_toolbox-assets>
            ProxyPass uwsgi://localhost:6544/
            ProxyPassReverse uwsgi://localhost:6544/
        </Location>
        <Location />
            ProxyPass uwsgi://localhost:6544/
            ProxyPassReverse uwsgi://localhost:6544/
        </Location>

        # Proxying Caldav
        <Location /agenda>
            ProxyPass uwsgi://localhost:6544/
            ProxyPassReverse uwsgi://localhost:6544/
        </Location>

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

         # Proxying Tracim Live Message to Pushpin
        <LocationMatch ^/api/users/[0-9]+/live_messages$>
            ProxyPassMatch http://127.0.0.1:7999/
        </LocationMatch>


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

#### Configuring uWSGI for the Tracim Server

Create the file named `/etc/uwsgi/apps-available/tracim.ini` containing:

    [uwsgi]
    plugins = python3
    chdir = [TRACIM_PATH]/backend/
    module = wsgi.web:application
    env = TRACIM_CONF_PATH=[TRACIM_PATH]/backend/development.ini
    virtualenv = [TRACIM_PATH]/backend/env
    socket = :6544
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

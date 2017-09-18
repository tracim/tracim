# Running Tracim through Apache #

### Installation ###

Install `Apache` server and its [`WSGI` module](https://github.com/GrahamDumpleton/mod_wsgi):

    sudo apt install apache2 libapache2-mod-wsgi-py3

### Configuration ###

In `tracim/development.ini`, edit the base URL prefix of radicale client line from:

    # radicale.client.base_url.prefix = /

To:

    radicale.client.base_url.prefix = /caldav

Create a file named `/etc/apache2/sites-available/tracim.conf` containing:

    <VirtualHost *:80>
        ServerName tracim

        ProxyPreserveHost On
        ProxyRequests Off

        ProxyPass "/caldav" "http://127.0.0.1"
        ProxyPassReverse "/caldav" "http://127.0.0.1"

        # ProxyPass "/webdav" "http://127.0.0.1"
        # ProxyPassReverse "/webdav" "http://127.0.0.1"

        WSGIDaemonProcess tracim user=www-data group=www-data threads=4 python-home=/var/www/tracim/tg2env python-path=/var/www/tracim/tracim lang='C.UTF-8' locale='C.UTF-8'
        WSGIProcessGroup tracim
        WSGIScriptAlias / /var/www/tracim/tracim/app.wsgi process-group=tracim
        <Directory "/var/www/tracim/tracim">
            <Files "app.wsgi">
                Require all granted
            </Files>
        </Directory>

        # Serve static files directly
        Alias /assets          /var/www/tracim/tracim/tracim/public/assets
        Alias /_caldavzap      /var/www/tracim/tracim/tracim/public/_caldavzap
        Alias /favicon.ico     /var/www/tracim/tracim/tracim/public/favicon.ico
        <Directory "/var/www/tracim/tracim/tracim/public">
            Require all granted
        </Directory>
    </VirtualHost>

Load needed proxy modules and enable this site configuration file:

    sudo a2enmod proxy proxy_http
    sudo a2ensite tracim.conf

Reload `Apache` configuration:

    sudo systemctl reload apache2.service

## Documentation Links ##

[TurboGears](http://turbogears.readthedocs.io/en/tg2.3.7/cookbook/deploy/mod_wsgi.html)

[mod_wsgi](http://modwsgi.readthedocs.io/en/develop/index.html)

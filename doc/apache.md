# Running Tracim through Apache #

### Installation ###

Install `Apache` server and its [`WSGI` module](https://github.com/GrahamDumpleton/mod_wsgi):

    sudo apt install apache2 libapache2-mod-wsgi-py3

Load `Apache` http proxy module:

    sudo a2enmod proxy
    sudo a2enmod proxy_http

### Configuration ###

Create a file named `/etc/apache2/sites-available/tracim.conf` containing:

    <VirtualHost *:80>
        ServerName tracim.mycompany.com

        WSGIDaemonProcess tracim.mycompany.com user=www-data group=www-data threads=4 python-home=/var/www/tracim/tg2env python-path=/var/www/tracim/tracim lang='C.UTF-8' locale='C.UTF-8'
        WSGIProcessGroup tracim.mycompany.com

        WSGIScriptAlias / /var/www/tracim/tracim/app.wsgi process-group=tracim.mycompany.com

        <Directory "/var/www/tracim/tracim">
            <Files "app.wsgi">
                Require all granted
            </Files>
        </Directory>

        #Serve static files directly without TurboGears
        Alias /assets          /var/www/tracim/tracim/tracim/public/assets
        Alias /_caldavzap      /var/www/tracim/tracim/tracim/public/_caldavzap
        # Alias /calendar_config /var/www/tracim/tracim/tracim/public/ ?????????
        Alias /favicon.ico     /var/www/tracim/tracim/tracim/public/favicon.ico

        CustomLog ${APACHE_LOG_DIR}/tracim_access_log combined
        ErrorLog ${APACHE_LOG_DIR}/tracim_error_log
        LogLevel info
    </VirtualHost>

Enable this site configuration file:

    sudo a2ensite tracim.conf

Reload `Apache` configuration:

    sudo systemctl reload apache2.service

## Documentation Links ##

[TurboGears](http://turbogears.readthedocs.io/en/tg2.3.7/cookbook/deploy/mod_wsgi.html)

[mod_wsgi](http://modwsgi.readthedocs.io/en/develop/index.html)

# Running Tracim through Apache #

## Tracim WSGI application script ##

Copy a `WSGI` application script:

    cp tracim/app.wsgi tracim/productionapp.wsgi

Edit this last's `APP_CONFIG` variable to match your environment:

    APP_CONFIG = "/var/www/tracim/tracim/production.ini"

## Apache WSGI ##

### Installation ###

Install `Apache` server and its [`WSGI` module](https://github.com/GrahamDumpleton/mod_wsgi):

    sudo apt install apache2 libapache2-mod-wsgi-py3

### Configuration ###

Create a file named `/etc/apache2/sites-available/tracim.conf` containing:

    <VirtualHost *:80>
        ServerAdmin webmaster@tracim.mycompany.com
        ServerName localhost/tracim

        WSGIProcessGroup localhost/tracim
        WSGIDaemonProcess localhost/tracim user=www-data group=www-data threads=4 python-path=/home/algooapy/Documents/dev/py/tracim/tg2env/lib/python3.5/site-packages
        # WSGIScriptAlias / /var/www/tracim/tracim/productionapp.wsgi
        WSGIScriptAlias /tracim /var/www/tracim/tracim/app.wsgi
        <Directory "/var/www/tracim/tracim">
            <Files "app.wsgi">
                Require all granted
            </Files>
        </Directory>

        #Serve static files directly without TurboGears
        Alias /assets      /var/www/tracim/tracim/tracim/public/assets
        Alias /favicon.ico /var/www/tracim/tracim/tracim/public/favicon.ico

        CustomLog ${APACHE_LOG_DIR}/tracim_access_log combined
        ErrorLog ${APACHE_LOG_DIR}/tracim_error_log
        LogLevel debug
    </VirtualHost>

Enable this site configuration file:

    sudo a2ensite tracim.conf

Reload `Apache` configuration:

    sudo systemctl reload apache2.service

## Documentation Links ##

[TurboGears](http://turbogears.readthedocs.io/en/tg2.3.7/cookbook/deploy/mod_wsgi.html)

[mod_wsgi](http://modwsgi.readthedocs.io/en/develop/index.html)

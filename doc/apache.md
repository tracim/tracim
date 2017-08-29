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

Create a file named `/etc/apache2/sites-available/tracim.conf` with the following content:

    <VirtualHost *:80>
        ServerAdmin webmaster@tracim.mycompany.com
        ServerName tracim.mycompany.com

        WSGIProcessGroup tracim
        WSGIDaemonProcess tracim user=www-data group=adm threads=4 python-path=/opt/traciminstall/tg2env/lib/python3.5/site-packages
        WSGIScriptAlias / /opt/traciminstall/tracim/productionapp.wsgi

        #Serve static files directly without TurboGears
        Alias /assets     /opt/traciminstall/tracim/tracim/public/assets
        Alias /favicon.ico /opt/traciminstall/tracim/tracim/public/favicon.ico

        CustomLog /var/log/apache2/demotracim-access.log combined
        ErrorLog /var/log/apache2/demotracim-error.log
        LogLevel debug
    </VirtualHost>

## Documentation Links ##

[TurboGears](http://turbogears.readthedocs.io/en/tg2.3.7/cookbook/deploy/mod_wsgi.html)
[mod_wsgi](http://modwsgi.readthedocs.io/en/develop/index.html)

# Running Tracim through Apache WSGI #

## Installation ##

Install `Apache` `HTTP` server and its `WSGI` module:

    sudo apt install apache2 libapache2-mod-wsgi-py3

## Configuration ##

Example of `Apache` `WSGI` configuration. This configuration refers to
`productionapp.wsgi` which is a copy of the file `app.wsgi` available in the
repo. (this file has to be updated to match with your environment and
installation)

    <VirtualHost *:80>
        ServerAdmin webmaster@tracim.mycompany.com
        ServerName tracim.mycompany.com

        WSGIProcessGroup tracim
        WSGIDaemonProcess tracim user=www-data group=adm threads=4 python-path=/opt/traciminstall/tg2env/lib/python3.2/site-packages
        WSGIScriptAlias / /opt/traciminstall/tracim/productionapp.wsgi

        #Serve static files directly without TurboGears
        Alias /assets     /opt/traciminstall/tracim/tracim/public/assets
        Alias /favicon.ico /opt/traciminstall/tracim/tracim/public/favicon.ico

        CustomLog /var/log/apache2/demotracim-access.log combined
        ErrorLog /var/log/apache2/demotracim-error.log
        LogLevel debug
    </VirtualHost>

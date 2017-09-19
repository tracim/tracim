# Running Tracim through Apache #

### Installation ###

Install `Apache` server and its [`WSGI` module](https://github.com/GrahamDumpleton/mod_wsgi):

    sudo apt install apache2 libapache2-mod-wsgi-py3

### Configuration ###

Create a file named `/etc/apache2/sites-available/tracim.conf` containing:

    Listen 8080

    <VirtualHost *:8080>
        ServerName tracim

        # Serve Tracim through WSGI
        WSGIDaemonProcess tracim user=[your_user] group=[your_user] threads=4 python-home=[tracim_path]/tg2env python-path=[tracim_path]/tracim lang='C.UTF-8' locale='C.UTF-8'
        WSGIProcessGroup tracim
        WSGIScriptAlias / [tracim_path]/tracim/app.wsgi process-group=tracim
        <Directory "[tracim_path]/tracim">
            <Files "app.wsgi">
                Require all granted
            </Files>
        </Directory>

        # Serve static files directly
        Alias /assets          [tracim_path]/tracim/tracim/public/assets
        Alias /_caldavzap      [tracim_path]/tracim/tracim/public/_caldavzap
        Alias /favicon.ico     [tracim_path]/tracim/tracim/public/favicon.ico
        <Directory "[tracim_path]/tracim/tracim/public">
            Require all granted
        </Directory>
    </VirtualHost>

Replace `[tracim_path]` and `[your_user]` by your tracim installation path and your user.

Load needed proxy modules and enable this site configuration file:

    sudo a2enmod proxy proxy_http
    sudo a2ensite tracim.conf

Reload `Apache` configuration:

    sudo systemctl reload apache2.service

## Documentation Links ##

[TurboGears](http://turbogears.readthedocs.io/en/tg2.3.7/cookbook/deploy/mod_wsgi.html)

[mod_wsgi](http://modwsgi.readthedocs.io/en/develop/index.html)

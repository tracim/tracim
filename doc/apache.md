# Running Tracim through Apache #

### Installation ###

Install `tracim` first.
Install `Apache` server and uwsgi  its [`WSGI` module](https://github.com/GrahamDumpleton/mod_wsgi):

    sudo apt install apache2 libapache2-mod-wsgi-py3 uwsgi uwsgi-plugin-python3

### Configuration ###

Create a file named `/etc/apache2/sites-available/tracim.conf` containing:

    Listen 80

    <VirtualHost *:80>
        ServerName tracim

    <Directory "/">
        Require all granted
        Dav On
    </Directory>
    ProxyPreserveHost On 
    CustomLog /var/log/apache2/algoo-access.log combined
    ErrorLog /var/log/apache2/algoo-error.log
    <Location "/webdav">
        # Dav On
    </Location>

    # RemoteIPHeader X-Forwarded-For
    ProxyPass /webdav http://127.0.0.1:3030/webdav
    ProxyPassReverse /webdav http://127.0.0.1:3030/webdav
    ProxyPass / http://127.0.0.1:8080/
    ProxyPassReverse / http://127.0.0.1:8080/

    </VirtualHost>

Enable this configuration file:

    sudo ln -s /etc/apache2/sites-available/tracim.conf /etc/apache2/sites-enabled/

Check if you just have `tracim.conf` in `/etc/apache2/sites-enabled`, if not, remove other file.


Create the file named `/etc/uwsgi/apps-available/tracim.ini` containing:

    [uwsgi]
    plugins = python3
    chdir = [tracim_path]/tracim
    home = [tracim_path]/tg2env
    wsgi-file = app.wsgi
    callable = application
    http-socket = 0.0.0.0:8080
    enable-threads = true
    env = PYTHON_EGG_CACHE=/tmp

Replace [tracim_path] by your path of tracim

Enable this configuration file:

    sudo ln -s /etc/uwsgi/apps-available/tracim.ini /etc/uwsgi/apps-enabled/


Create file `tracim.log` in `/var/log/uwsgi/app/`

Set the `APP_CONFIG` variable of the `[tracim_path]/tracim/app.wsgi` file to match your tracim installation path:

    # -*- coding: utf-8 -*-

    APP_CONFIG = "[tracim_path]/tracim/development.ini" 
    #(in file: replace /var/www/tracim by your [tracim_path] )

    #Setup logging
    # import logging
    # logging.config.fileConfig(APP_CONFIG)

    #Load the application
    from paste.deploy import loadapp
    application = loadapp('config:%s' % APP_CONFIG)
    application.debug = False


Add `webdav` at `root_path` in the `[tracim_path]/tracim/wsgidav.conf`:

    ################################################################################
    # Sample WsgiDAV configuration file
    #
    # 1. Rename this file to `wsgidav.conf`
    # 2. Adjust settings as appropriate
    # 3. Run tracim as you always do :)
    #
    ################################################################################
    
    ################################################################################
    # SERVER OPTIONS
    #===============================================================================
    
    # host  = "localhost"
    # host  = "192.168.0.1"
    host  = "0.0.0.0"
    
    port = 3030
    
    show_history = True
    show_deleted = True
    show_archived = True
    
    manager_locks = True
    
    root_path = ''
    
    #===============================================================================
    # Lock Manager
    #
    # Example: Use PERSISTENT shelve based lock manager
    #from wsgidav.lock_storage import LockStorageShelve
    #locksmanager = LockStorageShelve("wsgidav-locks.shelve")



Open `[tracim_path]/tracim/development.ini` and make some change:


    In [server:main] modify IP:
    `host = 127.0.0.1` by `host = 0.0.0.0`

    For Radical (CalDav server):
    Uncomment `# radicale.server.host = 0.0.0.0`
    Uncomment `# radicale.server.allow_origin = *`
    Uncomment `# radicale.client.base_url.host = http://127.0.0.1:5232`
    and modifiy IP `# radicale.client.base_url.host = http://127.0.0.1:5232`to `radicale.client.base_url.host = http://[Your_server_IP]:5232`
    
    For WSGIDAV
    Uncomment `# wsgidav.client.base_url = 127.0.0.1:<WSGIDAV_PORT>`
    and modify IP and PORT `# wsgidav.client.base_url = 127.0.0.1:<WSGIDAV_PORT>` to `wsgidav.client.base_url = [Your_server_IP]/webdav`


Restart `uwsgi` configuration:

    sudo systemctl restart uwsgi.service

Load needed proxy modules and enable this site configuration file:

    sudo a2enmod dav_fs dav proxy proxy_http
    sudo a2ensite tracim.conf

Restart `Apache` configuration:

    sudo systemctl restart apache2.service
    
**Important**
In case you have some permission problem, check if `www-data` can access to folder of tracim.

## Documentation Links ##

* [Apache](https://httpd.apache.org/docs/2.4/fr/)
* [TurboGears](http://turbogears.readthedocs.io/en/tg2.3.7/cookbook/deploy/mod_wsgi.html)
* [mod_wsgi](http://modwsgi.readthedocs.io/en/develop/index.html)

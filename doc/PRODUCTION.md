# Running Tracim for production

[Tracim](https://www.algoo.fr/fr/tracim) is composed of multiples services, some are web wsgi applications and others are daemons (servers not web-related to do some task like sending email).

You should install pushpin, see [their installation procedure](https://pushpin.org/docs/install/) for your OS. We recommend to use pushpin version 1.30 as this version has been extensively tested and is in use in our official docker image.

You need to configure pushpin to proxy tracim (by default tracim web run on port 6543):

    echo "* localhost:6543" | sudo tee /etc/pushpin/routes

Then you need to restart your pushpin service:

    sudo systemctl restart pushpin

Tracim WSGI apps with pastedeploy (config in [development.ini](../backend/development.ini.sample)):

    cd backend/
    source env/bin/activate

    # running web server
    pserve development.ini

You can run other WSGI services with pastedeploy using the `tracimcli` command:

    # running webdav server
    tracimcli webdav start

    # running caldav server (for agendas)
    tracimcli caldav start
    tracimcli caldav sync  # sync Tracim data with radicale caldav server

You can run some Tracim daemons too if you want those features:

    # set tracim_conf_file path
    export TRACIM_CONF_PATH="$(pwd)/development.ini"

    ## DAEMONS SERVICES
    # email notifier (if async email notification is enabled)
    python3 daemons/mail_notifier.py &

    # email fetcher (if email reply is enabled)
    python3 daemons/mail_fetcher.py &

You can now head to (if pushpin is correctly configured and use default port 7999)
[http://localhost:7999](http://localhost:7999) and login with the admin account:

 - user: `admin@admin.admin`
 - password: `admin@admin.admin`

:warning: If this does not work, you can try to access [http://localhost:6543](http://localhost:6543). If it works, the issue is related to the configuration of pushpin.

The full documentation about running the Tracim services with uWSGI and supervisor is available in the [Backend README](../backend/README.md), sections `Running Tracim Backend Daemon`
and `Running Tracim Backend WSGI APP`.

## Upkeep

When the default "file" storage is used for session files you need to regularly remove old sessions files as they aren't removed automatically when the session expires (either of old age or when a user logs out). Other session storage (e.g. redis) do not have this behavior.
Please read the [session documentation](../backend/doc/setting.md#User_sessions_in_Tracim) for more information and recommended ways to remove the unused session files.

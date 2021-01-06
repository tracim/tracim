# Setting up Tracim

## Parameters Names

Most settings in Tracim are configurable using both the INI configuration file and environment variables.

### Tracim fully supported variables:

You can set those parameters in INI configuration file (see `config_file_name`) or
environnement variable (see `env_var_name`).

The priority order is (from less to more priority):
- default values
- configuration file
- environnement variables

<!--- Maintainer: use tracimcli dev parameters list --template "| {env_var_name: <74}| {config_file_name: <63}| {config_name: <67}|"  with all apps enabled to update this list properly --->

In most of the cases you'll want to serve Tracim behind an HTTP reverse-proxy to add TLS/caching support.
You can configure Tracim's external URL with the `website.base_url` parameter, for example:

    website.base_url = https://mysuperdomainame.ndd

## Serve Tracim frontend from another URL

To serve Tracim frontend code from another domain you'll need to:

- explicitly set the backend base url with `api.base_url`
- override allowed origins for CORS.

For example:

     api.base_url = https://backend.mysuperservername.ndd
     cors.access-control-allowed-origin = https://mysuperservername.ndd

## Authentication in Tracim

Tracim comes with several authentication methods:

- internal database
- LDAP
- Special authentifications mechanisms like Api-Key
- REMOTE AUTH, like Apache Auth, later explained in the documentation.

You can chose valid auth_source and order them by priority with `auth_types` parameters in the INI configuration file.

For instance:

- `auth_types = internal`
- `auth_types = internal,ldap`

The last one will check the internal user database first. Then, if the auth fails, it will also try to authenticate the user using LDAP.

The authentication is done with a login, which is either the user's email address or the username. For authentication methods which don't provide a way to distinguish between the two, a login with "@" will be considered as an email address and a login without as a username.

:warning: If you use LDAP or the Remote Auth method, the automatic creation of a username-only user (without "@") can fail if:
`email.required=True`, which means every user should have an email address set. To solve this case, either:
- set `email.required` to `False`, or
- create the user with both an username and an email address and then authenticate using the LDAP/Remote Auth.


### LDAP Authentication

LDAP authentication requires setting some extra parameters.

Example of the LDAP config working with
[rroemhild/docker-test-openldap](https://github.com/rroemhild/docker-test-openldap):

```
auth_types=ldap
ldap_url = ldap://localhost:389
ldap_bind_dn = cn=admin,dc=planetexpress,dc=com
ldap_bind_pass = GoodNewsEveryone
ldap_user_base_dn = ou=people,dc=planetexpress,dc=com
ldap_login_attribute = mail
ldap_name_attribute = givenName
ldap_tls = False
```

:heavy_exclamation_mark: When logging in Tracim, if a valid LDAP user doesn't
exist in Tracim, it will be created as a standard user.

### Special Authentication Mecanisms

Thoses special authentication mechanisms are not linked to `auth_types` in the configuration.

#### API-Key Authentification

:heavy_exclamation_mark: Unlike other authentication mechanism, this mechanism is not built
for normal user authentication.
It is aimed at administrators or daemons (e.g. an email reply daemon).
This authentication mechanism is the only one that bypasses the authentication mechanism check (user are linked to
one specific mechanism and can't connect with another one).
As a consequence, you can impersonate any user linked to any authentication mechanisms.

API key is an authentication mechanism of Tracim which allows user with a key to have a superadmin right on the Tracim API.
This allow user with the key to act as anyone and to do anything possible with the right of these people.

It relies on 2 HTTP headers:

- `Tracim-Api-Key` : Tracim api key, as marked in config in `api.key`
- `Tracim-Api-Login` : User's login (either an email or a username), in order to act as the given user

If `api.key` is empty, the API key authentication will be disabled.

#### Remote Auth Authentification (e.g. apache authentication)

It is possible to connect to Tracim using remote authentification (e.g. the Apache authentication method).
The idea is that the webserver authenticates the user and then pass the login of the authenticated user through uWSGI environment variables or an HTTP header.

:heavy_exclamation_mark: When logging in Tracim, if a valid remote user doesn't
exist in Tracim, it will be created as a standard user.

To do this, you need to properly configure your webserver in order to do
authentication and to correctly pass the uWSGI environment variable or the HTTP header.

In Tracim, you just need to change value of `remote_user_header` in the INI configuration
file. The value should be an CGI-like environment variable name, so the `Remote-User` HTTP header
becomes `HTTP-REMOTE-USER`.

:warning: You should be very careful using this feature with the HTTP header, your
webserver should be properly configured to prevent someone from setting a custom
remote user header. You should also make sure that, if you use the web server as a proxy,
no one can bypass this proxy and access Tracim in a way that lets
them authenticate as anyone without password.

#### Example of remote_user with basic auth using apache as http proxy

In the Tracim INI configuration file:
```
  auth_remote_user_header = HTTP_X_REMOTE_USER
```

Apache virtual host configuration (Tracim should be listening on port 6543, pushpin on 7999):


```
Listen 6544
<VirtualHost *:6544>
    ServerAdmin webmaster@localhost
    ServerName localhost

    <Location "/">
      AuthType Basic
      AuthName "Restricted Content"
      AuthUserFile /etc/apache2/password
      Require valid-user
    </Location>

    RequestHeader set X-Remote-User expr=%{REMOTE_USER}
    # SSL
    # RequestHeader set X-Remote-User %{REMOTE_USER}s

    ProxyPreserveHost On
    ProxyPassMatch ^/api/users/([0-9]+/live_messages)$ http://127.0.0.1:7999/api/users/$1
    ProxyPassReverse ^/api/users/([0-9]+/live_messages)$ http://127.0.0.1:7999/api/users/$1

    ProxyPass / http://127.0.0.1:6543/
    ProxyPassReverse / http://127.0.0.1:6543/
</VirtualHost>
```

## User sessions in Tracim

Authenticated users have a server-stored session which is identified by an HTTP Cookie.
A session stores:

- the numerical id of the user
- the session's creation datetime
- the session's last-access datetime.

Sessions are implemented with [Beaker](https://beaker.readthedocs.io/en/latest/configuration.html) and can be stored in several back-ends: files (the default), redis, mongodb, memcached, sql databases…
Tracim is actively used and tested with 2 session back-ends: files and redis.

The recommended session back-end for production is redis as it avoids having to manage deletion of expired session files. For other session back-ends, please read [beaker documentation](https://beaker.readthedocs.io/en/latest/configuration.html) for more information.

:warning: If you change the session configuration, it's safer to delete the existing sessions in order to force users to log again (and use a cookie with the changed options).

### File storage configuration (default)

    basic_setup.sessions_data_root_dir = an_existing_session_path
    session.type = file
    session.data_dir = %(basic_setup.sessions_data_root_dir)s/sessions_data

When this back-end is used, the session's file are [not deleted automatically](https://beaker.readthedocs.io/en/latest/sessions.html#removing-expired-old-sessions).
To avoid keeping expired session files you should run :

    find . -type f -mtime +10 -print -exec rm {} \;

regularly (for example by using a cron job), which will delete file which have not been modified since 10 days.
You should use this command in both session data and session lock dirs.

#### delete all existing sessions (file storage)

```shell
# note: <session.data_dir> refers to the absolute path given by the config parameter `session.data_dir`.
rm -r <session.data_dir>/*
```


### Redis storage configuration

First you need a functional [redis](https://redis.io) server.
Then you'll need to set those parameters for redis backend:

    # session dir is only used for lock files with redis
    basic_setup.sessions_data_root_dir = an_existing_session_path
    session.type = ext:redis
    session.url = redis://localhost:6379/0


#### delete the existing sessions (redis storage)

```shell
# note: <session.url> refers to the value of the config parameter `session.url` (redis url)
redis-cli -u <session.url> keys 'beaker_cache:*' | xargs redis-cli -u <session.url> del
```

### Other session parameters

    session.lock_dir = %(basic_setup.sessions_data_root_dir)s/sessions_lock
    session.key = session_key
    session.secret = %(basic_setup.session_secret)s
    session.save_accessed_time = True
    session.cookie_expires = 604800
    session.timeout = 604800
    session.cookie_on_exception = True
    session.httponly = True
    # only if you are using HTTPS:
    # session.secure = True


## Enabling the Mail Notification Feature

To enable mail notification, the smallest config is:

    email.notification.activated = True
    # from header of mail, need to be a valid adress
    email.notification.from.email = test_user+{user_id}@supersmtpserver.ndd
    # reply to header of mail, need to be a valid address
    email.notification.reply_to.email = test_user+{content_id}@supersmtpserver.ndd
    # references header of mail, similar to mail, used to have threaded mail
    # but do not need to be a valid email address
    email.notification.references.email = test_user+{content_id}@supersmtpserver.ndd
    jobs.processing_mode = sync
    email.notification.smtp.server = supersmtpserver.ndd
    email.notification.smtp.port = 1025
    email.notification.smtp.user = test_user
    email.notification.smtp.password = just_a_password
    # active implicit ssl if you are using implicit smtp with encryption port like 465
    # by default, tracim will try to use explicit smtp encryption using starttls, and unencrypted
    # connection as fallback.
    email.notification.smtp.use_implicit_ssl = false

Don't forget to set `website.base_url` and `website.title` for the frontend, as some features use them to
link the frontend in emails.

:warning: It is necessary to check if your SMTP configuration is working correctly before using Tracim.
In the next release we will include a quick solution to test if your STMP configuration works properly.

### Configuring Invitations in Spaces

You can set the behaviour of the invitation feature depending on how you use Tracim.

You can choose if you enabled or disabled email notification
for new invitation.
- Enabling it allow user to receive mail with autogenerated internal auth password.
- Disabling it allow to create user without password, **only account with
external auth mechanism can connect to these user**.


Enabling it is nice if you use Tracim mostly with internal authentication.
However, if you rely mostly on external authentication, disabling it is better.

Configure how to handle invitation of non-existent users in Tracim with these parameters:

| email.notification.activated | new_user.invitation.do_notify | behaviour                                                         |
| ---------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| True                         | True                          | create **account with autogenerated password** send by **email**. |
| True                         | False                         | create **account without password** and do not send email         |
| False                        | True                          | **account invitation disabled**                                   |
| False                        | False                         | create **account without password** and do not send email         |

### Enabling the Reply by Email Feature

To enable the reply by email feature you first need to activate the API key authentication mechanism (see section Activating API Key Authentification), then set values for those parameters:

    # Email reply configuration
    email.reply.activated = True
    email.reply.imap.server = superimapserver.ndd
    email.reply.imap.port = 993
    email.reply.imap.user = imap_user
    email.reply.imap.password = imap_password
    email.reply.imap.folder = INBOX
    email.reply.imap.use_ssl = true
    email.reply.imap.use_idle = true

don't forget to start mail_fetcher daemon, documentation here /backend/README.md and chapter "Run daemons according to your config"


## Listening port (for pserve only)

Default configuration is to listen on port 6534.
If you want to adapt this to your environment, edit the `.ini` file and setup the port you want:

    [server:main]
    ...
    listen = localhost:6543

To allow other computers to access to this website, listen to "*" instead of localhost:

    [server:main]
    ...
    listen = *:6534

## Database Path

To configure a database, you need to provide a valid sqlalchemy url:

for sqlite, a valid value is something like this:

    sqlalchemy.url = sqlite:///%(here)s/tracim.sqlite

to know more about this, see [sqlalchemy documentation](http://docs.sqlalchemy.org/en/latest/core/engines.html).

Be careful, while SQLAlchemy supports many kind of Database, support from Tracim is **not** guaranteed.
Tracim officially supports SQLite, PostgreSQL and MySQL.



## Debugging and Log

### Debugging parameters


For debugging, you can uncomment these 2 lines in '/backend/development.ini' to
enable the Pyramid debugging toolbar.
If you use it, you can seen one red button on right of the Tracim web interface.

    ~~~
    #pyramid.includes =
    #    pyramid_debugtoolbar
    ~~~

You can add this line to enable the Pyramid debugging mode for almost everything:

    ~~~
    pyramid.debug_all = true
    ~~~


Hapic debug mode: this line is needed to get more explicit JSON errors.
The traceback of raised errors will be send through JSON. You can uncomment it by removing the hash sign:

   ~~~
   # debug = True
   ~~~


    pyramid.reload_templates = true

### Prod/Debug Configuration Example ###


To enable simple debug configuration:

    [app:tracim_web]
    ...
    pyramid.reload_templates = true
    pyramid.debug_all = true
    pyramid.includes =
        pyramid_debugtoolbar

    [DEFAULT]
    ...
    debug = True


Production configuration (no reload, no debugtoolbar):

    [app:tracim_web]
    ...
    pyramid.reload_templates = false
    pyramid.debug_authorization = false
    pyramid.debug_notfound = false
    pyramid.debug_routematch = false

    [DEFAULT]
    ...
    debug = False

You can, of course, also set level of one of the different logger
to have more/less log about something.

    [logger_sqlalchemy]
    ...
    level = INFO

## Customize the main Tracim colors

You can change the default colors used in Tracim by editing the `color.json` file which you can find at the root of the Tracim directory. See [color.json.sample](../../color.json.sample) for the default configuration file.

## Configure indexing and search to use Elasticsearch (Tracim v2.3+)

First, you need an Elasticsearch server. An easy way to have one with docker can be (don't use this for production):

    docker run -d -p 9200:9200 -p 9300:9300 -v esdata:/usr/share/elasticsearch -v esconfig:/usr/share/elasticsearch/config -e "discovery.type=single-node" -e "cluster.routing.allocation.disk.threshold_enabled=false" elasticsearch:7.0.0

You then need to setup the configuration file:

    search.engine = elasticsearch
    search.elasticsearch.host = localhost
    search.elasticsearch.port = 9200
    search.elasticsearch.index_alias = tracim_contents

Your Elasticsearch server needs to be running. You can then set up the index with:

    tracimcli search index-create

You can (re)sync data with:

    tracimcli search index-populate

You can delete the index using:

    tracimcli search index-drop

If there is an update of Tracim, use this one to migrate the index (experimental, prefer delete, init, index mechanism):

    tracimcli search index-upgrade-experimental

Your data are correctly indexed now, you can go to the Tracim UI and use the search mechanism.

## Collaborative Edition Online (Tracim v2.4+)

### Collaborative Edition Server

In Tracim v2.4, Collaborative Edition Online does support CollaboraOnline/LibreOfficeOnline.

It is tested with CollaboraOnline (professional version of Collabora), with [Collabora CODE](https://hub.docker.com/r/collabora/code) and with [LibreofficeOnline](https://hub.docker.com/r/libreoffice/online). More information about CollaboraOnline [here](https://www.collaboraoffice.com/)
We do not support other collaborative edition online service for now but we do support the WOPI protocol, making support for WOPI-compatible software easy.

**To set up a `Collabora CODE` server using docker for testing purpose ([image](https://hub.docker.com/r/collabora/code)):**

note: you should replace <DOT_ESCAPED_DOMAIN_OF_TRACIM_API> with real value like `domain=tracim\\.mysuperdomain\\.com`):


    sudo docker run -d -t -p 9980:9980 -e "domain=<DOT_ESCAPED_DOMAIN_OF_TRACIM_API>" -e "SLEEPFORDEBUGGER=0" -e "extra_params=--o:ssl.enable=false" --cap-add MKNOD --restart always collabora/code:4.2.6.2

:warning: Tracim is tested with version 4.0.5.2. Use the latest version at your own risk.


**To set up a `LibreOfficeOnline` server(rolling release, unstable :warning:) using docker ([image](https://hub.docker.com/r/libreoffice/online)):**


    sudo docker run -d -t -p 9980:9980 -e "domain=<DOT_ESCAPED_DOMAIN_OF_TRACIM_API>" -e "SLEEPFORDEBUGGER=0" -e "extra_params=--o:ssl.enable=false" --cap-add MKNOD --restart always libreoffice/online:master


:information_source: All the information to set up a `Collabora CODE/ LibreofficelOnline` server can be found on the [official documentation](https://www.collaboraoffice.com/code/docker/)

:warning: Be really careful about configuring the domain parameter. As written at the [official documentation](https://www.collaboraoffice.com/code/docker/), dots should be escaped (e.g. `domain=.*\\.mysuperdomain\\.com`).

:information_source: You can configure Collabora administration username/password too:

    -e "username=admin" -e "password=S3cRet"

The administration interface is available at `https://<collabora_host>/loleaflet/dist/admin/admin.html`.

With a Collabora host, `<collabora_host>` may look like `collaboradomain.ndd` or `localhost:9980`

:information_source: To avoid using automatic SSL/TLS encryption in Collabora, you should disable it:

    -e "extra_params=--o:ssl.enable=false"


### Configuring Tracim in `development.ini`

To enable online edition on Tracim and allow communication with your edition software.

First you need to enable the edition on the API:

    collaborative_document_edition.activated = True
    collaborative_document_edition.software = collabora`

Then you need to indicate the ip adress of the server for the protocol `WOPI`:

    collaborative_document_edition.collabora.base_url = <collabora_base_url>

with collabora_base_url can be value like `http://localhost:9980` or `http://mycollaboraserver.ndd`


Then you can set up default office document templates files, these templates will be the one used to create an empty document using Tracim online app.

Basic templates are provided by default with Tracim:

    basic_setup.file_template_dir = %(here)s/tracim_backend/templates/open_documents

But you can change the default directory to use your templates files:

    collaborative_document_edition.file_template_dir =  PATH_TO_YOUR_TEMPLATE_DIRECTORY

Filenames of the templates inside the directory are not relevant. Only their extensions matter and need to match the software's default extensions.
For instance, `CODE` edits `Libre Office` files, so extensions will be `odt`, `odp`, `ods`.

After all these changes in the configuration, you should restart all  process (web, webdav, etc...).

## Security settings

### Content Security Policy

By default Tracim setups a [Content-Security-Policy header](https://www.w3.org/TR/CSP2/) which will disable all external scripts and styles.
The content of the header can be tuned with the `content_security_policy.*` settings:

- `content_security_policy.enabled = False` will entirely disable the header. Use only if you have a good reason to do that
- `content_security_policy.report_uri = https://areport.uri` can be used to setup an uri that browser will use to report violations as described in the [W3C documentation](https://www.w3.org/TR/CSP2/#directive-report-uri)
- `content_security_policy.report_only = True` can be used to only report violations without enforcing them.
- `content_security_policy.additional_directives` is added to the header and can be used to override/finely tune the default Tracim values.

## Uploaded files storage

Tracim stores the files uploaded by its users in a local directory by default.
This directory is configurable through the `basic_setup.uploaded_files_storage_path` parameter.

Tracim can also be configured to use a Amazon S3 compatible storage back-end by setting those parameters:
```
  basic_setup.uploaded_files_storage_type = s3
  uploaded_files.storage.s3.access_key_id =
  uploaded_files.storage.s3.secret_access_key =
  ; Use this parameter to specify an alternative S3 storage back-end
  # uploaded_files.storage.s3.endpoint_url = https://my_s3_storage.mydomain.tld
```

If you want to use your own S3 compatible back-end we recommend [minio](https://min.io) as we have tested its usage with Tracim.

You can find an example docker compose file for storing files in minio [here](../../tools_docker/docker-compose-minio.yml)

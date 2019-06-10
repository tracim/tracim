# Settings #

## Parameters names

Most setting in Tracim are configurable by both config ini file and env var.

### Tracim 2.2 fully supported var:

You can set those params in ini config file (see `config_file_name`) or
environnement variable (see `env_var_name`).

Priority order is (from less to most priority):
- default value
- configuration file
- environnement variable

 | <config_name> | <env_var_name> | <config_file_name> |
 |-------------------|--------------------|----------------------------|
 | SQLALCHEMY__URL | TRACIM_SQLALCHEMY__URL | sqlalchemy.url |
 | DEFAULT_LANG | TRACIM_DEFAULT_LANG | default_lang |
 | COLOR__CONFIG_FILE_PATH | TRACIM_COLOR__CONFIG_FILE_PATH | color.config_file_path |
 | APP__ENABLED | TRACIM_APP__ENABLED | app.enabled |
 | DEPOT_STORAGE_DIR | TRACIM_DEPOT_STORAGE_DIR | depot_storage_dir |
 | DEPOT_STORAGE_NAME | TRACIM_DEPOT_STORAGE_NAME | depot_storage_name |
 | PREVIEW_CACHE_DIR | TRACIM_PREVIEW_CACHE_DIR | preview_cache_dir |
 | AUTH_TYPES | TRACIM_AUTH_TYPES | auth_types |
 | REMOTE_USER_HEADER | TRACIM_REMOTE_USER_HEADER | remote_user_header |
 | API__KEY | TRACIM_API__KEY | api.key |
 | SESSION__REISSUE_TIME | TRACIM_SESSION__REISSUE_TIME | session.reissue_time |
 | SESSION__DATA_DIR | TRACIM_SESSION__DATA_DIR | session.data_dir |
 | SESSION__LOCK_DIR | TRACIM_SESSION__LOCK_DIR | session.lock_dir |
 | WEBSITE__TITLE | TRACIM_WEBSITE__TITLE | website.title |
 | WEBSITE__BASE_URL | TRACIM_WEBSITE__BASE_URL | website.base_url |
 | API__BASE_URL | TRACIM_API__BASE_URL | api.base_url |
 | CORS__ACCESS_CONTROL_ALLOWED_ORIGIN | TRACIM_CORS__ACCESS_CONTROL_ALLOWED_ORIGIN | cors.access-control-allowed-origin |
 | WEBSITE__SERVER_NAME | TRACIM_WEBSITE__SERVER_NAME | website.server_name |
 | WEBSITE__SERVER_NAME | TRACIM_WEBSITE__SERVER_NAME | website.server_name |
 | USER__AUTH_TOKEN__VALIDITY | TRACIM_USER__AUTH_TOKEN__VALIDITY | user.auth_token.validity |
 | USER__RESET_PASSWORD__VALIDITY | TRACIM_USER__RESET_PASSWORD__VALIDITY | user.reset_password.validity |
 | USER__RESET_PASSWORD__TOKEN_LIFETIME | TRACIM_USER__RESET_PASSWORD__TOKEN_LIFETIME | user.reset_password.token_lifetime |
 | DEBUG | TRACIM_DEBUG | debug |
 | PREVIEW__JPG__RESTRICTED_DIMS | TRACIM_PREVIEW__JPG__RESTRICTED_DIMS | preview.jpg.restricted_dims |
 | PREVIEW__JPG__ALLOWED_DIMS | TRACIM_PREVIEW__JPG__ALLOWED_DIMS | preview.jpg.allowed_dims |
 | FRONTEND__SERVE | TRACIM_FRONTEND__SERVE | frontend.serve |
 | BACKEND__I18N_FOLDER_PATH | TRACIM_BACKEND__I18N_FOLDER_PATH | backend.i18n_folder_path |
 | FRONTEND__DIST_FOLDER_PATH | TRACIM_FRONTEND__DIST_FOLDER_PATH | frontend.dist_folder_path |
 | EMAIL__NOTIFICATION__ENABLED_ON_INVITATION | TRACIM_EMAIL__NOTIFICATION__ENABLED_ON_INVITATION | email.notification.enabled_on_invitation |
 | EMAIL__NOTIFICATION__FROM__EMAIL | TRACIM_EMAIL__NOTIFICATION__FROM__EMAIL | email.notification.from.email |
 | EMAIL__NOTIFICATION__FROM | TRACIM_EMAIL__NOTIFICATION__FROM | email.notification.from |
 | EMAIL__NOTIFICATION__FROM | TRACIM_EMAIL__NOTIFICATION__FROM | email.notification.from |
 | EMAIL__NOTIFICATION__FROM__DEFAULT_LABEL | TRACIM_EMAIL__NOTIFICATION__FROM__DEFAULT_LABEL | email.notification.from.default_label |
 | EMAIL__NOTIFICATION__REPLY_TO__EMAIL | TRACIM_EMAIL__NOTIFICATION__REPLY_TO__EMAIL | email.notification.reply_to.email |
 | EMAIL__NOTIFICATION__REFERENCES__EMAIL | TRACIM_EMAIL__NOTIFICATION__REFERENCES__EMAIL | email.notification.references.email |
 | EMAIL__NOTIFICATION__CONTENT_UPDATE__TEMPLATE__HTML | TRACIM_EMAIL__NOTIFICATION__CONTENT_UPDATE__TEMPLATE__HTML | email.notification.content_update.template.html |
 | EMAIL__NOTIFICATION__CONTENT_UPDATE__SUBJECT | TRACIM_EMAIL__NOTIFICATION__CONTENT_UPDATE__SUBJECT | email.notification.content_update.subject |
 | EMAIL__NOTIFICATION__CREATED_ACCOUNT__TEMPLATE__HTML | TRACIM_EMAIL__NOTIFICATION__CREATED_ACCOUNT__TEMPLATE__HTML | email.notification.created_account.template.html |
 | EMAIL__NOTIFICATION__CREATED_ACCOUNT__SUBJECT | TRACIM_EMAIL__NOTIFICATION__CREATED_ACCOUNT__SUBJECT | email.notification.created_account.subject |
 | EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__TEMPLATE__HTML | TRACIM_EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__TEMPLATE__HTML | email.notification.reset_password_request.template.html |
 | EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__SUBJECT | TRACIM_EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__SUBJECT | email.notification.reset_password_request.subject |
 | EMAIL__NOTIFICATION__ACTIVATED | TRACIM_EMAIL__NOTIFICATION__ACTIVATED | email.notification.activated |
 | EMAIL__NOTIFICATION__SMTP__SERVER | TRACIM_EMAIL__NOTIFICATION__SMTP__SERVER | email.notification.smtp.server |
 | EMAIL__NOTIFICATION__SMTP__PORT | TRACIM_EMAIL__NOTIFICATION__SMTP__PORT | email.notification.smtp.port |
 | EMAIL__NOTIFICATION__SMTP__USER | TRACIM_EMAIL__NOTIFICATION__SMTP__USER | email.notification.smtp.user |
 | EMAIL__NOTIFICATION__SMTP__PASSWORD | TRACIM_EMAIL__NOTIFICATION__SMTP__PASSWORD | email.notification.smtp.password |
 | EMAIL__REPLY__ACTIVATED | TRACIM_EMAIL__REPLY__ACTIVATED | email.reply.activated |
 | EMAIL__REPLY__IMAP__SERVER | TRACIM_EMAIL__REPLY__IMAP__SERVER | email.reply.imap.server |
 | EMAIL__REPLY__IMAP__PORT | TRACIM_EMAIL__REPLY__IMAP__PORT | email.reply.imap.port |
 | EMAIL__REPLY__IMAP__USER | TRACIM_EMAIL__REPLY__IMAP__USER | email.reply.imap.user |
 | EMAIL__REPLY__IMAP__PASSWORD | TRACIM_EMAIL__REPLY__IMAP__PASSWORD | email.reply.imap.password |
 | EMAIL__REPLY__IMAP__FOLDER | TRACIM_EMAIL__REPLY__IMAP__FOLDER | email.reply.imap.folder |
 | EMAIL__REPLY__CHECK__HEARTBEAT | TRACIM_EMAIL__REPLY__CHECK__HEARTBEAT | email.reply.check.heartbeat |
 | EMAIL__REPLY__IMAP__USE_SSL | TRACIM_EMAIL__REPLY__IMAP__USE_SSL | email.reply.imap.use_ssl |
 | EMAIL__REPLY__IMAP__USE_IDLE | TRACIM_EMAIL__REPLY__IMAP__USE_IDLE | email.reply.imap.use_idle |
 | EMAIL__REPLY__CONNECTION__MAX_LIFETIME | TRACIM_EMAIL__REPLY__CONNECTION__MAX_LIFETIME | email.reply.connection.max_lifetime |
 | EMAIL__REPLY__USE_HTML_PARSING | TRACIM_EMAIL__REPLY__USE_HTML_PARSING | email.reply.use_html_parsing |
 | EMAIL__REPLY__USE_TXT_PARSING | TRACIM_EMAIL__REPLY__USE_TXT_PARSING | email.reply.use_txt_parsing |
 | EMAIL__REPLY__LOCKFILE_PATH | TRACIM_EMAIL__REPLY__LOCKFILE_PATH | email.reply.lockfile_path |
 | EMAIL__PROCESSING_MODE | TRACIM_EMAIL__PROCESSING_MODE | email.processing_mode |
 | EMAIL__ASYNC__REDIS__HOST | TRACIM_EMAIL__ASYNC__REDIS__HOST | email.async.redis.host |
 | EMAIL__ASYNC__REDIS__PORT | TRACIM_EMAIL__ASYNC__REDIS__PORT | email.async.redis.port |
 | EMAIL__ASYNC__REDIS__DB | TRACIM_EMAIL__ASYNC__REDIS__DB | email.async.redis.db |
 | NEW_USER__INVITATION__DO_NOTIFY | TRACIM_NEW_USER__INVITATION__DO_NOTIFY | new_user.invitation.do_notify |
 | NEW_USER__INVITATION__MINIMAL_PROFILE | TRACIM_NEW_USER__INVITATION__MINIMAL_PROFILE | new_user.invitation.minimal_profile |
 | LDAP_URL | TRACIM_LDAP_URL | ldap_url |
 | LDAP_BASE_URL | TRACIM_LDAP_BASE_URL | ldap_base_url |
 | LDAP_BIND_DN | TRACIM_LDAP_BIND_DN | ldap_bind_dn |
 | LDAP_BIND_PASS | TRACIM_LDAP_BIND_PASS | ldap_bind_pass |
 | LDAP_TLS | TRACIM_LDAP_TLS | ldap_tls |
 | LDAP_USER_BASE_DN | TRACIM_LDAP_USER_BASE_DN | ldap_user_base_dn |
 | LDAP_LOGIN_ATTRIBUTE | TRACIM_LDAP_LOGIN_ATTRIBUTE | ldap_login_attribute |
 | LDAP_NAME_ATTRIBUTE | TRACIM_LDAP_NAME_ATTRIBUTE | ldap_name_attribute |
 | WEBDAV__UI__ENABLED | TRACIM_WEBDAV__UI__ENABLED | webdav.ui.enabled |
 | WEBDAV__BASE_URL | TRACIM_WEBDAV__BASE_URL | webdav.base_url |
 | WEBDAV__VERBOSE__LEVEL | TRACIM_WEBDAV__VERBOSE__LEVEL | webdav.verbose.level |
 | WEBDAV__ROOT_PATH | TRACIM_WEBDAV__ROOT_PATH | webdav.root_path |
 | WEBDAV__BLOCK_SIZE | TRACIM_WEBDAV__BLOCK_SIZE | webdav.block_size |
 | WEBDAV__DIR_BROWSER__ENABLED | TRACIM_WEBDAV__DIR_BROWSER__ENABLED | webdav.dir_browser.enabled |
 | WEBDAV__DIR_BROWSER__FOOTER | TRACIM_WEBDAV__DIR_BROWSER__FOOTER | webdav.dir_browser.footer |
 | CALDAV__ENABLED | TRACIM_CALDAV__ENABLED | caldav.enabled |
 | CALDAV__RADICALE_PROXY__BASE_URL | TRACIM_CALDAV__RADICALE_PROXY__BASE_URL | caldav.radicale_proxy.base_url |

### Currently config-file only params:

Those params are only configurable through config file now:
- all not global config (all config not setted in `[DEFAULT]` sections, sections not supported included: `[alembic]`, `[app:*]`, `[server:*]`, `[loggers]`)
- Sqlalchemy parameters `sqalchemy.*` not listed as supported.
- Beaker sessions parameters `sessions.*` not listed as supported.
- Caldav radicale parameters  `caldav.radicale.*` not listed as supported.
- easy config variable shortcut (`basic_setup.*`, `advanced_setup`).
- Pyramid config (`pyramid.*`)

## Tracim `.ini` config file #

The default config file is `development.ini`, a template is available in the repo: [development.ini.sample](../development.ini.sample).

The file includes documentation which should be enough in most cases.

## Configure URL for tracim access - simple case ##

To have a working tracim instance, you need to explicitly define where backend and frontend are.
If backend serve frontend or if you do not need frontend at all, you can just set:

    website.base_url = http://mysuperdomainame.ndd
    # website.server_name = mysuperdomainename.ndd

or (non-default http port):

    website.base_url = http://mysuperdomainame.ndd:8080
    # website.server_name = mysuperdomainename.ndd

or (for https):

    website.base_url = https://mysuperdomainame.ndd
    # website.server_name = mysuperdomainename.ndd

you also need to NOT set website.server_name and api.base_url

## Configure URL for tracim access - complex case ##

If the `website.base_url` trick is not enough for your own configuration, you can:
- Explicitly set backend base url different from frontend url with `api.base_url`
- Override allowed access control allowed origin for cors.

with this configuration, i allowed cors to work with 2 different server with 2 different port
that may be needed if frontend is in another computer distinct from backend.
you can add how many server you want separated by ','

     cors.access-control-allowed-origin = http://mysuperservername.ndd:6543,http://myotherservername.ndd:8090


## Authentication in Tracim

Tracim comes with several types of authentication:

- internal database
- ldap
- special auth mecanism like Api-Key
- REMOTE AUTH like Apache Auth later explained in the documentation.

You can chose valid auth_source and order them by priority with `auth_types` params in conf ini file

Example:

`auth_types = internal`

or:

`auth_types = internal,ldap`

This one will check user internal database in a first check, then if the auth fails, it will also try to authenticate the user based on LDAP data.

### LDAP Authentication

LDAP authentication require some extra parameters, you need to set them all correctly
to have a working ldap authentication system.

example of the ldap config working with
https://github.com/rroemhild/docker-test-openldap :

```
auth_types=ldap
ldap_url = ldap://localhost:389
ldap_base_dn = dc=planetexpress,dc=com
ldap_bind_dn = cn=admin,dc=planetexpress,dc=com
ldap_bind_pass = GoodNewsEveryone
ldap_user_base_dn = ou=people,dc=planetexpress,dc=com
ldap_login_attribute = mail
ldap_name_attribute = givenName
ldap_tls = False
```

:heavy_exclamation_mark: At connection in tracim, if a valid ldap user doesn't
exist in tracim, it will be created as standard user.

## Special auth mecanisms

Thoses special auth mecanism are not linked to `auth_types` in config.

### API-Key Authentification

:heavy_exclamation_mark: Unlike other mecanism of auth, this mecanism is not build
for normal user auth but for administrators or daemon like email reply daemon. This
auth mecanism is the only one that bypass auth mecanism check (user are linked 
one specific mecanism and can't connect with an other one), so 
you can impersonate any user linked to any auth mecanisms.

API key is a auth mecanism of tracim which allow user with the key to have
a superadmin right on tracim api, this allow user with the key to act as anyone
and to do anything possible with the right of theses persons.

It rely on 2 HTTP headers:

- `Tracim-Api-Key` : Tracim api key, as marked in config in `api.key`
- `Tracim-Api-Login` : User email login, in order to act as the user given

If you let `api.key` with empty value, API key auth will be disabled.

### Remote Auth Authentification (eg apache authentication)

It is possible to connect to tracim using remote auth authentification like
apache auth for apache.
The idea is that webserver authenticate user and then pass by uwsgi env var or
http header email user of the authenticated user.

:heavy_exclamation_mark: At connection in tracim, if a valid remote user doesn't
exist in tracim, it will be created as standard user

to do this, you need to configure properly your webserver in order to do
authentication and to pass correctly uwsgi env var or http header.

in tracim, you just need to change value of `remote_user_header` in ini conf
file. Value should be a env var in CGI like style, so  `Remote-User` http header
become  `HTTP-REMOTE-USER`.

:warning: You should be very carefull using this feature with http header, your
webserver should be configured properly to not allow someone to set custom
remote user header. You should also be sure if you use the webserver as proxy
that no one could bypass this proxy and access to tracim in a way that allow
them to authenticate as anyone without password.

#### Example of remote_user with basic auth using apache as http proxy

in tracim ini conf file :

`
   auth_
   remote_user_header = HTTP_X_REMOTE_USER
`

apache_virtualhost (tracim should be listening on port 6543):


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
    ProxyPass / http://127.0.0.1:6543/
    ProxyPassReverse / http://127.0.0.1:6543/
</VirtualHost>
```

## Activating Mail Notification feature ##

to activate mail notification, smallest config is this:

    email.notification.activated = True
    # from header of mail, need to be a valid adress
    email.notification.from.email = test_user+{user_id}@supersmtpserver.ndd
    # reply to header of mail, need to be a valid address
    email.notification.reply_to.email = test_user+{content_id}@supersmtpserver.ndd
    # references header of mail, similar to mail, used to have threaded mail
    # but do not need to be a valid email address
    email.notification.references.email = test_user+{content_id}@supersmtpserver.ndd
    email.processing_mode = async
    email.notification.smtp.server = supersmtpserver.ndd
    email.notification.smtp.port = 1025
    email.notification.smtp.user = test_user
    email.notification.smtp.password = just_a_password

don't forgot to set website.base_url and website.title for frontend, as some feature use this to return
link to frontend in email.

## Invitation in workspace configuration ##

You can set behaviour of invitation feature depending of how you use tracim.

You can choose if you enabled or disabled email notification
for new invitation.
- Enabling it allow user to receive mail with autogenerated internal auth password.
- Disabling it allow to create user without password, **only account with
external auth mecanism can connect to these user**.


Enabling is nice if you use tracim mostly with internal auth whereas if
you rely mostly on external auth, disabling it is better.

invitation of non-existent user in tracim behaviour according to config:
email.notification.activated = False

| email.notification.activated | new_user.invitation.do_notify | behaviour                                                |
|------------------------------|---------------------------------|----------------------------------------------------------|
| True                         | True                            | create **account with autogenerated password** send by **email**. |
| True                         | False                           | create **account without password** and do not send email
| False                        | True                            | **account invitation disabled**
| False                        | False                           | create **account without password** and do not send email

## Activating reply by email feature ##

to activate reply by email feature,
you first need to activate api key auth mecansim (see Activating API key authentification section),
without this, email_reply feature can't work correctly.

to activate reply by email, smallest config is this:

    # Email reply configuration
    email.reply.activated = True
    email.reply.imap.server = superimapserver.ndd
    email.reply.imap.port = 993
    email.reply.imap.user = imap_user
    email.reply.imap.password = imap_password
    email.reply.imap.folder = INBOX
    email.reply.imap.use_ssl = true
    email.reply.imap.use_idle = true

don't forgot to start mail_fetcher daemon, documentation here /backend/README.md and chapter "Run daemons according to your config"

## Listening port (for pserve only) ##

Default configuration is to listen on port 6534.
If you want to adapt this to your environment, edit the `.ini` file and setup the port you want:

    [server:main]
    ...
    listen = localhost:6543

To allow other computer to access to this website, listen to "*" instead of localhost:

    [server:main]
    ...
    listen = *:6534

## Database path ##

To configure a database, you need to provide a valid sqlalchemy url:

for sqlite, a valid value is something like this:

    sqlalchemy.url = sqlite:///%(here)s/tracim.sqlite

to know more about this, see [sqlalchemy documentation](http://docs.sqlalchemy.org/en/latest/core/engines.html).

Be carefull, if sqlalchemy support many kind of Database, Tracim support is **not** guarantee.
Tracim is officially supporting sqlite, postgresql and mysql.

## Debugging and Logs ##
### Debug params ###


For debugging you can uncomment this 2 lines in '/backend/development.ini' to
enable pyramid debugtoolbar.
If you use debugtoolbar, you can seen one red button on right of the Tracim web interface.

    ~~~
    #pyramid.includes =
    #    pyramid_debugtoolbar
    ~~~

you can add this line to active pyramid debug mode for almost anything:

    ~~~
    pyramid.debug_all = true
    ~~~


Hapic debug mode: this line is needed for more explicit json error,
raised error traceback will be send through json. you can uncomment it

   ~~~
   # debug = True
   ~~~

pyramid.reload_templates = true

### Prod/Debug configuration example ###


To enable simple debug conf:

    [app:tracim_web]
    ...
    pyramid.reload_templates = true
    pyramid.debug_all = true
    pyramid.includes =
        pyramid_debugtoolbar

    [DEFAULT]
    ...
    debug = True


production conf (no reload, no debugtoolbar):

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

# Color File #

You can change default color of apps by setting color.json file, by default,
placed at root of tracim dir, see [color.json.sample](../../color.json.sample)
for default config file.

# Search method using elastic_search (tracim 2.3+) #

First, you need an elastic_search server. An easy way to have one with docker can be (don't use for production):

`docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e "cluster.routing.allocation.disk.threshold_enabled=false" elasticsearch:7.0.0`

You then need to setup config file:

    search.enabled = True
    search.elasticsearch.host = localhost
    search.elasticsearch.port = 9200

You're elasticsearch server need to be running. You can then setup index with:

`tracimcli search init`

You can (re)sync data with:

`tracimcli search index`

you can delete index using:

`tracimcli search delete`

If there is an update of tracim, use this one to migrate index (experimental, prefer delete,init,index mecanism):

`tracimcli search upgrade`

Your data are correctly indexed now, you can go to tracim ui and use search mecanism.

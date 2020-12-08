# Setting up Tracim #

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

| <env_var_name>                                                            | <config_file_name>                                             | <config_name>                                                      |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| TRACIM_APP__ENABLED                                                       | app.enabled                                                    | APP__ENABLED                                                       |
| TRACIM_SQLALCHEMY__URL                                                    | sqlalchemy.url                                                 | SQLALCHEMY__URL                                                    |
| TRACIM_DEFAULT_LANG                                                       | default_lang                                                   | DEFAULT_LANG                                                       |
| TRACIM_COLOR__CONFIG_FILE_PATH                                            | color.config_file_path                                         | COLOR__CONFIG_FILE_PATH                                            |
| TRACIM_DEPOT_STORAGE_DIR                                                  | depot_storage_dir                                              | DEPOT_STORAGE_DIR                                                  |
| TRACIM_DEPOT_STORAGE_NAME                                                 | depot_storage_name                                             | DEPOT_STORAGE_NAME                                                 |
| TRACIM_PREVIEW_CACHE_DIR                                                  | preview_cache_dir                                              | PREVIEW_CACHE_DIR                                                  |
| TRACIM_AUTH_TYPES                                                         | auth_types                                                     | AUTH_TYPES                                                         |
| TRACIM_REMOTE_USER_HEADER                                                 | remote_user_header                                             | REMOTE_USER_HEADER                                                 |
| TRACIM_API__KEY                                                           | api.key                                                        | API__KEY                                                           |
| TRACIM_SESSION__TYPE                                                      | session.type                                                   | SESSION__TYPE                                                      |
| TRACIM_SESSION__URL                                                       | session.url                                                    | SESSION__URL                                                       |
| TRACIM_SESSION__DATA_DIR                                                  | session.data_dir                                               | SESSION__DATA_DIR                                                  |
| TRACIM_SESSION__LOCK_DIR                                                  | session.lock_dir                                               | SESSION__LOCK_DIR                                                  |
| TRACIM_SESSION__HTTPONLY                                                  | session.httponly                                               | SESSION__HTTPONLY                                                  |
| TRACIM_SESSION__SECURE                                                    | session.secure                                                 | SESSION__SECURE                                                    |
| TRACIM_WEBSITE__TITLE                                                     | website.title                                                  | WEBSITE__TITLE                                                     |
| TRACIM_WEB__NOTIFICATIONS__EXCLUDED                                       | web.notifications.excluded                                     | WEB__NOTIFICATIONS__EXCLUDED                                       |
| TRACIM_WEBSITE__BASE_URL                                                  | website.base_url                                               | WEBSITE__BASE_URL                                                  |
| TRACIM_API__BASE_URL                                                      | api.base_url                                                   | API__BASE_URL                                                      |
| TRACIM_CORS__ACCESS_CONTROL_ALLOWED_ORIGIN                                | cors.access-control-allowed-origin                             | CORS__ACCESS_CONTROL_ALLOWED_ORIGIN                                |
| TRACIM_DEFAULT_ANONYMIZED_USER_DISPLAY_NAME                               | default_anonymized_user_display_name                           | DEFAULT_ANONYMIZED_USER_DISPLAY_NAME                               |
| TRACIM_USER__AUTH_TOKEN__VALIDITY                                         | user.auth_token.validity                                       | USER__AUTH_TOKEN__VALIDITY                                         |
| TRACIM_USER__RESET_PASSWORD__TOKEN_LIFETIME                               | user.reset_password.token_lifetime                             | USER__RESET_PASSWORD__TOKEN_LIFETIME                               |
| TRACIM_USER__DEFAULT_PROFILE                                              | user.default_profile                                           | USER__DEFAULT_PROFILE                                              |
| TRACIM_WORKSPACE__ALLOWED_ACCESS_TYPES                                    | workspace.allowed_access_types                                 | WORKSPACE__ALLOWED_ACCESS_TYPES                                    |
| TRACIM_KNOWN_MEMBERS__FILTER                                              | known_members.filter                                           | KNOWN_MEMBERS__FILTER                                              |
| TRACIM_DEBUG                                                              | debug                                                          | DEBUG                                                              |
| TRACIM_BUILD_VERSION                                                      | build_version                                                  | BUILD_VERSION                                                      |
| TRACIM_PREVIEW__JPG__RESTRICTED_DIMS                                      | preview.jpg.restricted_dims                                    | PREVIEW__JPG__RESTRICTED_DIMS                                      |
| TRACIM_PREVIEW__JPG__ALLOWED_DIMS                                         | preview.jpg.allowed_dims                                       | PREVIEW__JPG__ALLOWED_DIMS                                         |
| TRACIM_FRONTEND__SERVE                                                    | frontend.serve                                                 | FRONTEND__SERVE                                                    |
| TRACIM_FRONTEND__CACHE_TOKEN                                              | frontend.cache_token                                           | FRONTEND__CACHE_TOKEN                                              |
| TRACIM_BACKEND__I18N_FOLDER_PATH                                          | backend.i18n_folder_path                                       | BACKEND__I18N_FOLDER_PATH                                          |
| TRACIM_FRONTEND__DIST_FOLDER_PATH                                         | frontend.dist_folder_path                                      | FRONTEND__DIST_FOLDER_PATH                                         |
| TRACIM_PLUGIN__FOLDER_PATH                                                | plugin.folder_path                                             | PLUGIN__FOLDER_PATH                                                |
| TRACIM_FRONTEND__CUSTOM_TOOLBOX_FOLDER_PATH                               | frontend.custom_toolbox_folder_path                            | FRONTEND__CUSTOM_TOOLBOX_FOLDER_PATH                               |
| TRACIM_LIMITATION__SHAREDSPACE_PER_USER                                   | limitation.sharedspace_per_user                                | LIMITATION__SHAREDSPACE_PER_USER                                   |
| TRACIM_LIMITATION__CONTENT_LENGTH_FILE_SIZE                               | limitation.content_length_file_size                            | LIMITATION__CONTENT_LENGTH_FILE_SIZE                               |
| TRACIM_LIMITATION__WORKSPACE_SIZE                                         | limitation.workspace_size                                      | LIMITATION__WORKSPACE_SIZE                                         |
| TRACIM_LIMITATION__USER_DEFAULT_ALLOWED_SPACE                             | limitation.user_default_allowed_space                          | LIMITATION__USER_DEFAULT_ALLOWED_SPACE                             |
| TRACIM_JOBS__PROCESSING_MODE                                              | jobs.processing_mode                                           | JOBS__PROCESSING_MODE                                              |
| TRACIM_JOBS__ASYNC__REDIS__HOST                                           | jobs.async.redis.host                                          | JOBS__ASYNC__REDIS__HOST                                           |
| TRACIM_JOBS__ASYNC__REDIS__PORT                                           | jobs.async.redis.port                                          | JOBS__ASYNC__REDIS__PORT                                           |
| TRACIM_JOBS__ASYNC__REDIS__DB                                             | jobs.async.redis.db                                            | JOBS__ASYNC__REDIS__DB                                             |
| TRACIM_LIVE_MESSAGES__CONTROL_ZMQ_URI                                     | live_messages.control_zmq_uri                                  | LIVE_MESSAGES__CONTROL_ZMQ_URI                                     |
| TRACIM_LIVE_MESSAGES__BLOCKING_PUBLISH                                    | live_messages.blocking_publish                                 | LIVE_MESSAGES__BLOCKING_PUBLISH                                    |
| TRACIM_EMAIL__NOTIFICATION__ENABLED_ON_INVITATION                         | email.notification.enabled_on_invitation                       | EMAIL__NOTIFICATION__ENABLED_ON_INVITATION                         |
| TRACIM_EMAIL__NOTIFICATION__FROM__EMAIL                                   | email.notification.from.email                                  | EMAIL__NOTIFICATION__FROM__EMAIL                                   |
| TRACIM_EMAIL__NOTIFICATION__FROM__DEFAULT_LABEL                           | email.notification.from.default_label                          | EMAIL__NOTIFICATION__FROM__DEFAULT_LABEL                           |
| TRACIM_EMAIL__NOTIFICATION__REPLY_TO__EMAIL                               | email.notification.reply_to.email                              | EMAIL__NOTIFICATION__REPLY_TO__EMAIL                               |
| TRACIM_EMAIL__NOTIFICATION__REFERENCES__EMAIL                             | email.notification.references.email                            | EMAIL__NOTIFICATION__REFERENCES__EMAIL                             |
| TRACIM_EMAIL__NOTIFICATION__CONTENT_UPDATE__TEMPLATE__HTML                | email.notification.content_update.template.html                | EMAIL__NOTIFICATION__CONTENT_UPDATE__TEMPLATE__HTML                |
| TRACIM_EMAIL__NOTIFICATION__CONTENT_UPDATE__SUBJECT                       | email.notification.content_update.subject                      | EMAIL__NOTIFICATION__CONTENT_UPDATE__SUBJECT                       |
| TRACIM_EMAIL__NOTIFICATION__CREATED_ACCOUNT__TEMPLATE__HTML               | email.notification.created_account.template.html               | EMAIL__NOTIFICATION__CREATED_ACCOUNT__TEMPLATE__HTML               |
| TRACIM_EMAIL__NOTIFICATION__CREATED_ACCOUNT__SUBJECT                      | email.notification.created_account.subject                     | EMAIL__NOTIFICATION__CREATED_ACCOUNT__SUBJECT                      |
| TRACIM_EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__TEMPLATE__HTML        | email.notification.reset_password_request.template.html        | EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__TEMPLATE__HTML        |
| TRACIM_EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__SUBJECT               | email.notification.reset_password_request.subject              | EMAIL__NOTIFICATION__RESET_PASSWORD_REQUEST__SUBJECT               |
| TRACIM_EMAIL__NOTIFICATION__ACTIVATED                                     | email.notification.activated                                   | EMAIL__NOTIFICATION__ACTIVATED                                     |
| TRACIM_EMAIL__NOTIFICATION__SMTP__SERVER                                  | email.notification.smtp.server                                 | EMAIL__NOTIFICATION__SMTP__SERVER                                  |
| TRACIM_EMAIL__NOTIFICATION__SMTP__PORT                                    | email.notification.smtp.port                                   | EMAIL__NOTIFICATION__SMTP__PORT                                    |
| TRACIM_EMAIL__NOTIFICATION__SMTP__USER                                    | email.notification.smtp.user                                   | EMAIL__NOTIFICATION__SMTP__USER                                    |
| TRACIM_EMAIL__NOTIFICATION__SMTP__PASSWORD                                | email.notification.smtp.password                               | EMAIL__NOTIFICATION__SMTP__PASSWORD                                |
| TRACIM_EMAIL__NOTIFICATION__SMTP__USE_IMPLICIT_SSL                        | email.notification.smtp.use_implicit_ssl                       | EMAIL__NOTIFICATION__SMTP__USE_IMPLICIT_SSL                        |
| TRACIM_EMAIL__REPLY__ACTIVATED                                            | email.reply.activated                                          | EMAIL__REPLY__ACTIVATED                                            |
| TRACIM_EMAIL__REPLY__IMAP__SERVER                                         | email.reply.imap.server                                        | EMAIL__REPLY__IMAP__SERVER                                         |
| TRACIM_EMAIL__REPLY__IMAP__PORT                                           | email.reply.imap.port                                          | EMAIL__REPLY__IMAP__PORT                                           |
| TRACIM_EMAIL__REPLY__IMAP__USER                                           | email.reply.imap.user                                          | EMAIL__REPLY__IMAP__USER                                           |
| TRACIM_EMAIL__REPLY__IMAP__PASSWORD                                       | email.reply.imap.password                                      | EMAIL__REPLY__IMAP__PASSWORD                                       |
| TRACIM_EMAIL__REPLY__IMAP__FOLDER                                         | email.reply.imap.folder                                        | EMAIL__REPLY__IMAP__FOLDER                                         |
| TRACIM_EMAIL__REPLY__CHECK__HEARTBEAT                                     | email.reply.check.heartbeat                                    | EMAIL__REPLY__CHECK__HEARTBEAT                                     |
| TRACIM_EMAIL__REPLY__IMAP__USE_SSL                                        | email.reply.imap.use_ssl                                       | EMAIL__REPLY__IMAP__USE_SSL                                        |
| TRACIM_EMAIL__REPLY__IMAP__USE_IDLE                                       | email.reply.imap.use_idle                                      | EMAIL__REPLY__IMAP__USE_IDLE                                       |
| TRACIM_EMAIL__REPLY__CONNECTION__MAX_LIFETIME                             | email.reply.connection.max_lifetime                            | EMAIL__REPLY__CONNECTION__MAX_LIFETIME                             |
| TRACIM_EMAIL__REPLY__USE_HTML_PARSING                                     | email.reply.use_html_parsing                                   | EMAIL__REPLY__USE_HTML_PARSING                                     |
| TRACIM_EMAIL__REPLY__USE_TXT_PARSING                                      | email.reply.use_txt_parsing                                    | EMAIL__REPLY__USE_TXT_PARSING                                      |
| TRACIM_EMAIL__REPLY__LOCKFILE_PATH                                        | email.reply.lockfile_path                                      | EMAIL__REPLY__LOCKFILE_PATH                                        |
| TRACIM_NEW_USER__INVITATION__DO_NOTIFY                                    | new_user.invitation.do_notify                                  | NEW_USER__INVITATION__DO_NOTIFY                                    |
| TRACIM_NEW_USER__INVITATION__MINIMAL_PROFILE                              | new_user.invitation.minimal_profile                            | NEW_USER__INVITATION__MINIMAL_PROFILE                              |
| TRACIM_EMAIL__REQUIRED                                                    | email.required                                                 | EMAIL__REQUIRED                                                    |
| TRACIM_LDAP_URL                                                           | ldap_url                                                       | LDAP_URL                                                           |
| TRACIM_LDAP_BIND_DN                                                       | ldap_bind_dn                                                   | LDAP_BIND_DN                                                       |
| TRACIM_LDAP_BIND_PASS                                                     | ldap_bind_pass                                                 | LDAP_BIND_PASS                                                     |
| TRACIM_LDAP_TLS                                                           | ldap_tls                                                       | LDAP_TLS                                                           |
| TRACIM_LDAP_USER_BASE_DN                                                  | ldap_user_base_dn                                              | LDAP_USER_BASE_DN                                                  |
| TRACIM_LDAP_LOGIN_ATTRIBUTE                                               | ldap_login_attribute                                           | LDAP_LOGIN_ATTRIBUTE                                               |
| TRACIM_LDAP_NAME_ATTRIBUTE                                                | ldap_name_attribute                                            | LDAP_NAME_ATTRIBUTE                                                |
| TRACIM_WEBDAV__UI__ENABLED                                                | webdav.ui.enabled                                              | WEBDAV__UI__ENABLED                                                |
| TRACIM_WEBDAV__BASE_URL                                                   | webdav.base_url                                                | WEBDAV__BASE_URL                                                   |
| TRACIM_WEBDAV__VERBOSE__LEVEL                                             | webdav.verbose.level                                           | WEBDAV__VERBOSE__LEVEL                                             |
| TRACIM_WEBDAV__ROOT_PATH                                                  | webdav.root_path                                               | WEBDAV__ROOT_PATH                                                  |
| TRACIM_WEBDAV__BLOCK_SIZE                                                 | webdav.block_size                                              | WEBDAV__BLOCK_SIZE                                                 |
| TRACIM_WEBDAV__DIR_BROWSER__ENABLED                                       | webdav.dir_browser.enabled                                     | WEBDAV__DIR_BROWSER__ENABLED                                       |
| TRACIM_WEBDAV__DIR_BROWSER__FOOTER                                        | webdav.dir_browser.footer                                      | WEBDAV__DIR_BROWSER__FOOTER                                        |
| TRACIM_SEARCH__ENGINE                                                     | search.engine                                                  | SEARCH__ENGINE                                                     |
| TRACIM_SEARCH__ELASTICSEARCH__INDEX_ALIAS                                 | search.elasticsearch.index_alias                               | SEARCH__ELASTICSEARCH__INDEX_ALIAS                                 |
| TRACIM_SEARCH__ELASTICSEARCH__INDEX_PATTERN_TEMPLATE                      | search.elasticsearch.index_pattern_template                    | SEARCH__ELASTICSEARCH__INDEX_PATTERN_TEMPLATE                      |
| TRACIM_SEARCH__ELASTICSEARCH__USE_INGEST                                  | search.elasticsearch.use_ingest                                | SEARCH__ELASTICSEARCH__USE_INGEST                                  |
| TRACIM_SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_WHITELIST                  | search.elasticsearch.ingest.mimetype_whitelist                 | SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_WHITELIST                  |
| TRACIM_SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_BLACKLIST                  | search.elasticsearch.ingest.mimetype_blacklist                 | SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_BLACKLIST                  |
| TRACIM_SEARCH__ELASTICSEARCH__INGEST__SIZE_LIMIT                          | search.elasticsearch.ingest.size_limit                         | SEARCH__ELASTICSEARCH__INGEST__SIZE_LIMIT                          |
| TRACIM_SEARCH__ELASTICSEARCH__HOST                                        | search.elasticsearch.host                                      | SEARCH__ELASTICSEARCH__HOST                                        |
| TRACIM_SEARCH__ELASTICSEARCH__PORT                                        | search.elasticsearch.port                                      | SEARCH__ELASTICSEARCH__PORT                                        |
| TRACIM_SEARCH__ELASTICSEARCH__REQUEST_TIMEOUT                             | search.elasticsearch.request_timeout                           | SEARCH__ELASTICSEARCH__REQUEST_TIMEOUT                             |
| TRACIM_CALDAV__RADICALE_PROXY__BASE_URL                                   | caldav.radicale_proxy.base_url                                 | CALDAV__RADICALE_PROXY__BASE_URL                                   |
| TRACIM_CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER                       | caldav.radicale.storage.filesystem_folder                      | CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER                       |
| TRACIM_COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE                           | collaborative_document_edition.software                        | COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE                           |
| TRACIM_COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL                | collaborative_document_edition.collabora.base_url              | COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL                |
| TRACIM_COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR                  | collaborative_document_edition.file_template_dir               | COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR                  |
| TRACIM_EMAIL__NOTIFICATION__SHARE_CONTENT_TO_RECEIVER__TEMPLATE__HTML     | email.notification.share_content_to_receiver.template.html     | EMAIL__NOTIFICATION__SHARE_CONTENT_TO_RECEIVER__TEMPLATE__HTML     |
| TRACIM_EMAIL__NOTIFICATION__SHARE_CONTENT_TO_RECEIVER__SUBJECT            | email.notification.share_content_to_receiver.subject           | EMAIL__NOTIFICATION__SHARE_CONTENT_TO_RECEIVER__SUBJECT            |
| TRACIM_EMAIL__NOTIFICATION__SHARE_CONTENT_TO_EMITTER__TEMPLATE__HTML      | email.notification.share_content_to_emitter.template.html      | EMAIL__NOTIFICATION__SHARE_CONTENT_TO_EMITTER__TEMPLATE__HTML      |
| TRACIM_EMAIL__NOTIFICATION__SHARE_CONTENT_TO_EMITTER__SUBJECT             | email.notification.share_content_to_emitter.subject            | EMAIL__NOTIFICATION__SHARE_CONTENT_TO_EMITTER__SUBJECT             |
| TRACIM_EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_RECEIVER__TEMPLATE__HTML | email.notification.upload_permission_to_receiver.template.html | EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_RECEIVER__TEMPLATE__HTML |
| TRACIM_EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_RECEIVER__SUBJECT        | email.notification.upload_permission_to_receiver.subject       | EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_RECEIVER__SUBJECT        |
| TRACIM_EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_EMITTER__TEMPLATE__HTML  | email.notification.upload_permission_to_emitter.template.html  | EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_EMITTER__TEMPLATE__HTML  |
| TRACIM_EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_EMITTER__SUBJECT         | email.notification.upload_permission_to_emitter.subject        | EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_EMITTER__SUBJECT         |
| TRACIM_EMAIL__NOTIFICATION__NEW_UPLOAD_EVENT__TEMPLATE__HTML              | email.notification.new_upload_event.template.html              | EMAIL__NOTIFICATION__NEW_UPLOAD_EVENT__TEMPLATE__HTML              |
| TRACIM_EMAIL__NOTIFICATION__NEW_UPLOAD_EVENT__SUBJECT                     | email.notification.new_upload_event.subject                    | EMAIL__NOTIFICATION__NEW_UPLOAD_EVENT__SUBJECT                     |


### Parameters Only Working in the Configuration File

These parameters are currently only configurable through the configuration file:
- all not global config (all config not setted in `[DEFAULT]` sections, sections not supported included: `[alembic]`, `[app:*]`, `[server:*]`, `[loggers]`)
- Sqlalchemy parameters `sqalchemy.*` not listed as supported.
- Beaker sessions parameters `sessions.*` not listed as supported.
- Caldav radicale parameters  `caldav.radicale.*` not listed as supported.
- easy config variable shortcut (`basic_setup.*`, `advanced_setup`).
- Pyramid config (`pyramid.*`)

## Tracim `.ini` config file #

The default configuration file is `development.ini`. A documented template is available in the repo: [development.ini.sample](../development.ini.sample).

## Configure URL for Tracim Access - Simple Case ##

To have a working Tracim instance, you need to explicitly define where the backend and the frontend are.
If the backend serves the frontend or if you do not need the frontend at all, you can just set:

    website.base_url = http://mysuperdomainame.ndd

or (non-default HTTP port):

    website.base_url = http://mysuperdomainame.ndd:8080

or (for HTTPS):

    website.base_url = https://mysuperdomainame.ndd

You also need to NOT set `api.base_url`.

## Configure URL for Tracim Access - Complex Case ##

If the `website.base_url` trick is not enough for your own configuration, you can:
- Explicitly set the backend base url as different from the frontend URL with `api.base_url`
- Override allowed origins for CORS.

With this configuration, CORS can work with 2 different servers with 2 different ports.
This may be needed if the frontend and the backend are on different domains.
You can add as many servers as you want, separated by ','.

     cors.access-control-allowed-origin = http://mysuperservername.ndd:7999,http://myotherservername.ndd:8090

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

### Tracim session storage
Tracim uses a session by user, which work with cookie
This session store:

- the id of the user
- the session creation datetime
- the last-access to session datetime.

Sessions are implemented with [Beaker](https://beaker.readthedocs.io/en/latest/configuration.html) and can be stored in several back-ends: files (the default), redis, mongodb, memcached, sql databases…
Tracim is actively used and tested with 2 session back-ends: files and redis.

The recommended session back-end for production is redis as it avoids having to manage deletion of expired session files. If you choose to use the file back-end please read the "File back-end upkeep" section below.```

#### Configuration

A relevant configuration for file backend (default):

    # note: basic_setup.sessions_data_root_dir parameter should exist and be a real path
    session.type = file
    session.data_dir = %(basic_setup.sessions_data_root_dir)s/sessions_data

A relevant configuration for redis backend:

    session.type = ext:redis
    session.url = redis://localhost:6379/0

Generic configuration (needed for all backend):

    # note: basic_setup.sessions_data_root_dir parameter should exist and be a real path
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

for other beaker backends, read [beaker documentation](https://beaker.readthedocs.io/en/latest/configuration.html) for more information.

#### File back-end upkeep

When this back-end is used, the session's file are [not deleted automatically](https://beaker.readthedocs.io/en/latest/sessions.html#removing-expired-old-sessions).
 To avoid keeping expired session files you should run :

    find . -type f -mtime +10 -print -exec rm {} \;

regularly (for example by using a cron job), which will delete file which have not been modified since 10 days.
You should use this command in both session data and session lock dirs.


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

## Special Authentication Mecanisms

Thoses special authentication mechanisms are not linked to `auth_types` in the configuration.

### API-Key Authentification

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

### Remote Auth Authentification (eg apache authentication)

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

`
   auth_
   remote_user_header = HTTP_X_REMOTE_USER
`

apache_virtualhost (Tracim should be listening on port 6543, pushpin on 7999):


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

## Enabling the Mail Notification Feature ##

to enable mail notification, smallest config is this:

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

## Configuring Invitation in Workspace ##

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

## Enabling the Reply by Email Feature ##

To enable the reply by email feature,
you first need to activate the API key authentication mechanism (see section Activating API Key Authentification),

## Adapt Email Notification Feature

To use this feature, you need working email notifications (see section Enabling the Mail Notification Feature)

#### Multiple email address notification
For best support, it is better to use one email address per id, like:

    email.notification.from.email = test_user+{user_id}@supersmtpserver.ndd
    email.notification.reply_to.email = test_user+{content_id}@supersmtpserver.ndd
    email.notification.references.email = test_user+{content_id}@supersmtpserver.ndd

This configuration should work out of the box on some providers since they already support "+" subaddressing, and provide
the best compatibility.
As an alternative, you can also set a wildcard alias for your provided email, for example:

    tracim.content.{content_id}@supersmtpserver.ndd -> tracim.notification@supersmtpserver.ndd

with a configuration like that:

    email.notification.from.email = tracim.notification@supersmtpserver.ndd
    email.notification.reply_to.email = tracim.content.{content_id}@supersmtpserver.ndd
    email.notification.references.email = tracim.content.{content_id}@supersmtpserver.ndd

#### One email address notification

if you can't provide a wildcard and can't support subadressing and want a reply-to feature with only one named email address,
as a last resort, you can set the References Header.

However, be aware that support across email clients is not great.
Some email clients (like Sogo) do not properly return the References Header in mail replies, which breaks threading
behavior, and also breaks the reply-to feature.
Emails from these clients are retrieved but can't be correctly associated to one item.

You can do this with a configuration like that:

    email.notification.from.email = tracim.notification@supersmtpserver.ndd
    email.notification.reply_to.email = tracim.notification@supersmtpserver.ndd
    # References headers doesn't have to be a true email address.
    email.notification.references.email = tracim.content.{content_id}@supersmtpserver.ndd

### Install Email Feature

to activate reply by email, the smallest config is as follows:

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

To allow other computers to access to this website, listen to "*" instead of localhost:

    [server:main]
    ...
    listen = *:6534

## Database Path ##

To configure a database, you need to provide a valid sqlalchemy url:

for sqlite, a valid value is something like this:

    sqlalchemy.url = sqlite:///%(here)s/tracim.sqlite

to know more about this, see [sqlalchemy documentation](http://docs.sqlalchemy.org/en/latest/core/engines.html).

Be careful, while SQLAlchemy supports many kind of Database, support from Tracim is **not** guaranteed.
Tracim officially supports SQLite, PostgreSQL and MySQL.

## Debugging and Logs ##
### Debug params ###


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

# Color File #

You can change default color of apps by editing file `color.json `, by default,
placed at root of the Tracim directory. See [color.json.sample](../../color.json.sample)
for the default configuration file.

# Search Method Using Elasticsearch (Tracim v2.3+) #

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

# Collaborative Edition Online (Tracim v2.4+) #

## Collaborative Edition Server ##

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


## Configuring Tracim in `development.ini` ##

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

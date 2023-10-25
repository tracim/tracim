# Setting up Tracim

## Parameters Names

Most settings in Tracim are configurable using both the INI configuration file and environment variables.

### Tracim fully supported variables

You can set those parameters in INI configuration file (see `config_file_name`) or
environnement variable (see `env_var_name`).

The priority order is (from less to more priority):

- default values
- configuration file
- environment variables

In most of the cases you'll want to serve Tracim behind an HTTP reverse-proxy to add TLS/caching support.
You can configure Tracim's external URL with the `website.base_url` parameter, for example:

```ini
website.base_url = https://mysuperdomainame.ndd
```

## Serve Tracim frontend from another URL

To serve Tracim frontend code from another domain you'll need to:

- explicitly set the backend base url with `api.base_url`
- override allowed origins for CORS.

For example:

```ini
api.base_url = https://backend.mysuperservername.ndd
cors.access-control-allowed-origin = https://mysuperservername.ndd
```

## Authentication in Tracim

Tracim comes with several authentication methods:

- internal database
- LDAP
- SAML
- Special authentifications mechanisms like Api-Key
- REMOTE AUTH, like Apache Auth, later explained in the documentation.

You can chose valid auth_source and order them by priority with `auth_types` parameters in the INI configuration file.

For instance:

- `auth_types = internal`
- `auth_types = ldap,internal`

The last one will check the ldap user first. Then, if the auth fails, it will also try to authenticate the user using internal.

The authentication is done with a login, which is either the user's email address or the username. For authentication methods which don't provide a way to distinguish between the two, a login with "@" will be considered as an email address and a login without as a username.

⚠ If you use LDAP or the Remote Auth method, the automatic creation of a username-only user (without "@") can fail if:
`email.required=True`, which means every user should have an email address set. To solve this case, either:

- set `email.required` to `False`, or
- create the user with both an username and an email address and then authenticate using the LDAP/Remote Auth.

### LDAP Authentication

LDAP authentication requires setting some extra parameters.

Example of the LDAP config working with
[rroemhild/docker-test-openldap](https://github.com/rroemhild/docker-test-openldap):

```ini
auth_types = ldap,internal
ldap_url = ldap://localhost:10389
ldap_bind_anonymous = False
ldap_bind_dn = cn=admin,dc=planetexpress,dc=com
ldap_bind_pass = GoodNewsEveryone
ldap_user_base_dn = ou=people,dc=planetexpress,dc=com
ldap_mail_attribute = mail
ldap_username_attribute = givenName
ldap_name_attribute = displayName
ldap_tls = False
```

⚠ When logging in Tracim, if a valid LDAP user doesn't
exist in Tracim, it will be created as a standard user.

## Special Authentication Mechanism

Those special authentication mechanisms are not linked to `auth_types` in the configuration.

#### API-Key Authentification

⚠ Unlike other authentication mechanism, this mechanism is not built
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

⚠ When logging in Tracim, if a valid remote user doesn't
exist in Tracim, it will be created as a standard user.

To do this, you need to properly configure your webserver in order to do
authentication and to correctly pass the uWSGI environment variable or the HTTP header.

In Tracim, you just need to change value of `remote_user_header` in the INI configuration
file. The value should be an CGI-like environment variable name, so the `Remote-User` HTTP header
becomes `HTTP-REMOTE-USER`.

⚠ You should be very careful using this feature with the HTTP header, your
webserver should be properly configured to prevent someone from setting a custom
remote user header. You should also make sure that, if you use the web server as a proxy,
no one can bypass this proxy and access Tracim in a way that lets
them authenticate as anyone without password.

#### Example of remote_user with basic auth using apache as http proxy

In the Tracim INI configuration file:

```ini
auth_remote_user_header = HTTP_X_REMOTE_USER
```

Apache virtual host configuration (Tracim should be listening on port 6543, pushpin on 7999):

```xml
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

## SAML Authentication

SAML authentication relies on a different settings file.
The path of the settings file is provided to tracim through the `PYRAMID_SAML_PATH`

e.g.
```
PYRAMID_SAML_PATH=/etc/tracim/backend/settings_saml2.json
```

See below for details about the configuration format.

A sample configuration file can be found at `.../backend/settings_saml2.json`.

When SAML auth is activated, a list of configurated IdPs is displayed instead of the standard login form on the login page.
If other login methods are available, the login form can be found in the list as `Classic Login`.

The different SAML endpoints are

- **metadata**: `/saml/metadata`
- **sso**: `/saml/sso?target=<vorg.common_identifier of the IdP>`
- **acs**: `/saml/acs`
- **slo**: `/saml/slo/redirect` (for redirect based SLO)
- **slo**: `/saml/slo/post` (for post based SLO)

See [SSO Glossary](https://help.akana.com/content/current/cm/saml/08_glossary.htm) and 
[SLO Article](https://uit.stanford.edu/service/saml/logout) for more details about the employed terms

⚠ When logging in Tracim, if a valid user doesn't
exist in Tracim, it will be created as a standard user.

### Configuration Explanation

This file is a JSON file following [pysaml2's settings format](https://pysaml2.readthedocs.io/en/latest/howto/config.html).
Additional fields specific to tracim can be found in the `virtual_organization` field.

```json
{
    "entityid": "http://localhost:7999/saml/metadata",
    "metadata": {
        "local": [],
        "remote": [
            {
                "url": "https://samltest.id/saml/idp"
            },
            {
                "url": "https://idp.ssocircle.com"
            }
        ]
    },
    "service": {
        "sp": {
            "endpoints": {
                "assertion_consumer_service": [
                    [
                        "http://localhost:7999/saml/acs",
                        "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                    ]
                ],
                "single_logout_service": [
                    [
                        "http://localhost:7999/saml/slo/redirect",
                        "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                    ],
                    [
                        "http://localhost:7999/saml/slo/post",
                        "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                    ]
                ]
            },
            "allow_unsolicited": true,
            "authn_requests_signed": false,
            "logout_requests_signed": false,
            "want_assertions_signed": false,
            "want_response_signed": false,
            "name_id_format": "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
            "name_id_format_allow_create": true,
            "want_name_id": true
        }
    },
    "allow_unknown_attributes": true,
    "key_file": "<path_to_key>",
    "cert_file": "<path_to_cert>",
    "xmlsec_binary": "/usr/bin/xmlsec1",
    "metadata_cache_duration": {
        "default": 86400
    },
    "virtual_organization": {
        "https://samltest.id/saml/idp": {
            "common_identifier": "saml_test"
        },
        "https://idp.ssocircle.com": {
            "common_identifier": "sso_circle",
            "logo_url": "https://idp.ssocircle.com/logo.png",
            "displayed_name": "[Test] SSO Circle",
            "attribute_map": {
                "user_id": "${UserID}",
                "email": "${EmailAddress}",
                "display_name": "${FirstName} ${LastName}"
            }
        }
    }
}
```

- `entityid`: This is the Entity ID of the Service Provider (SP). It uniquely identifies your service.
- `metadata`: Metadata settings for the SAML configuration. local and remote are arrays for defining metadata sources. In this example, two remote identity providers (IdPs) are configured.
- `service`: Service-related settings for the SP.
  - `sp`: Service Provider-specific settings.
    - `endpoints`: Configuration for various endpoints, such as Assertion Consumer Service (ACS) and Single Logout Service (SLO).
      - `allow_unsolicited`: Whether unsolicited responses are allowed from the IdP.
      - `authn_requests_signed`: Specifies whether authentication requests should be signed.
    - `logout_requests_signed`: Specifies whether logout requests should be signed.
    - `want_assertions_signed`: Specifies whether the SP wants signed assertions.
    - `want_response_signed`: Specifies whether the SP wants signed responses.
    - `name_id_format`: The format for the NameID.
    - `name_id_format_allow_create`: Whether to allow the IdP to create a new NameID if it doesn't exist.
    - `want_name_id`: Whether the SP wants the NameID in the response.
    - `allow_unknown_attributes`: Allows processing of unknown attributes received from the IdP.
- key_file: Path to the key file used for signing.
- cert_file: Path to the certificate file used for signing.
- xmlsec_binary: Path to the xmlsec1 binary for XML security operations.
- metadata_cache_duration: Cache duration for remote metadata. In this example, the default cache duration is set to 86,400 seconds (1 day). 
- `virtual_organization`: Configuration for virtual organizations associated with IdPs. This is where you will define per-IdP settings. Each IdP is identified by its metadata URL.
  - `common_identifier`: A common identifier for the virtual organization associated with the IdP.
  - `logo_url`: URL to the organization's logo on the selection screen.
  - `displayed_name`: The displayed name of the organization on the selection screen.
  - `attribute_map`: Mapping of SAML attributes to specific names used within the SP.

Example: `user_id` maps to `${UserID}` received from the IdP.

## User sessions in Tracim

Authenticated users have a server-stored session which is identified by an HTTP Cookie.
A session stores:

- the numerical id of the user
- the session's creation datetime
- the session's last-access datetime.

Sessions are implemented with [Beaker](https://beaker.readthedocs.io/en/latest/configuration.html) and can be stored in several back-ends: files (the default), redis, mongodb, memcached, sql databases…
Tracim is actively used and tested with 2 session back-ends: files and redis.

The recommended session back-end for production is redis as it avoids having to manage deletion of expired session files. For other session back-ends, please read [beaker documentation](https://beaker.readthedocs.io/en/latest/configuration.html) for more information.

⚠ If you change the session configuration, it's safer to delete the existing sessions in order to force users to log again (and use a cookie with the changed options).

### File storage configuration (default)

```ini
basic_setup.sessions_data_root_dir = an_existing_session_path
session.type = file
session.data_dir = %(basic_setup.sessions_data_root_dir)s/sessions_data
```

When this back-end is used, the session's file are [not deleted automatically](https://beaker.readthedocs.io/en/latest/sessions.html#removing-expired-old-sessions).
To avoid keeping expired session files you should run:

```bash
find <session.data_dir> -type f -mtime +10 -print -exec rm {} \;
```

Regularly (for example by using a cron job), which will delete the sessions files which have not been modified since 10 days.
You should use this command in both session data and session lock dirs.

#### delete all existing sessions (file storage)

```bash
# note: <session.data_dir> refers to the absolute path given by the config parameter `session.data_dir`.
rm -r <session.data_dir>/*
```

### Redis storage configuration

First you need a functional [redis](https://redis.io) server.
Then you'll need to set those parameters for redis backend:

```ini
# session dir is only used for lock files with redis
basic_setup.sessions_data_root_dir = an_existing_session_path
session.type = ext:redis
session.url = redis://localhost:6379/0
```

#### delete the existing sessions (redis storage)

```bash
# note: <session.url> refers to the value of the config parameter `session.url` (redis url)
redis-cli -u <session.url> keys 'beaker_cache:*' | xargs redis-cli -u <session.url> del
```

### Other session parameters

```ini
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
```

## Enabling the Mail Notification Feature

To enable mail notification, the smallest config is:

```ini
email.notification.activated = True
# from header of mail, need to be a valid address
email.notification.from.email = test_user+{user_id}@smtpserver.ndd
# reply to header of mail, need to be a valid address
email.notification.reply_to.email = test_user+{content_id}@smtpserver.ndd
# references header of mail, similar to mail, used to have threaded mail
# but do not need to be a valid email address
email.notification.references.email = test_user+{content_id}@smtpserver.ndd
jobs.processing_mode = sync
email.notification.smtp.server = smtpserver.ndd
email.notification.smtp.port = 1025
email.notification.smtp.user = test_user
email.notification.smtp.password = just_a_password
# SMTP encryption method valid values are:
# - default: use smtp encryption using starttls, and unencrypted connection as fallback.
# - SMTPS: use encrypted connection directly on port like 465
# - unsecure: don't use encryption, use it with caution !
# default value: default
email.notification.smtp.encryption = default
```

Don't forget to set `website.base_url` and `website.title` for the frontend, as some features use them to
link the frontend in emails.

⚠ It is necessary to check if your SMTP configuration is working correctly before using Tracim. To do so,
we do provide this command:

```bash
tracimcli dev test smtp -r myemailadress@mydomain.local
```

This will send a test email to the provided email address (here: myemailadress@mydomain.local)
with the same parameters as tracim config.

If you have set `setting email.notification.activated` to True, you need to add the cron task that will send
the summary mail daily

```bash
echo "0 0 * * * tracimcli periodic send-summary-mails --since 24" > /etc/cron.d/cron_task_tracim_send_summary_mails
```

### Configuring Invitations in Spaces

You can set the behavior of the invitation feature depending on how you use Tracim.

You can choose if you enabled or disabled email notification
for new invitation.

- Enabling it allow user to receive mail with autogenerated internal auth password.
- Disabling it allow to create user without password, __only account with
external auth mechanism can connect to these user__.

Enabling it is nice if you use Tracim mostly with internal authentication.
However, if you rely mostly on external authentication, disabling it is better.

Configure how to handle invitation of non-existent users in Tracim with these parameters:

| email.notification.activated | new_user.invitation.do_notify | behavior                                                         |
| ---------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| True                         | True                          | create __account with autogenerated password__ send by __email__. |
| True                         | False                         | create __account without password__ and do not send email         |
| False                        | True                          | __account invitation disabled__                                   |
| False                        | False                         | create __account without password__ and do not send email         |

### Enabling the Reply by Email Feature

To enable the reply by email feature you first need to activate the API key authentication mechanism (see section Activating API Key Authentification), then set values for those parameters:

```ini
# Email reply configuration
email.reply.activated = True
email.reply.imap.server = imapserver.ndd
email.reply.imap.port = 993
email.reply.imap.user = imap_user
email.reply.imap.password = imap_password
email.reply.imap.folder = INBOX
email.reply.imap.use_ssl = true
email.reply.imap.use_idle = true
```

Don't forget to start mail_fetcher daemon, documentation here `/backend/README.md` and chapter "Run daemons according to your config"

## Listening port (for pserve only)

Default configuration is to listen on port 6534.
If you want to adapt this to your environment, edit the `.ini` file and setup the port you want:

```ini
[server:main]
...
listen = localhost:6543
```

To allow other computers to access to this website, listen to "*" instead of localhost:

```ini
[server:main]
...
listen = *:6534
```

## Database Path

To configure a database, you need to provide a valid sqlalchemy url:

for sqlite, a valid value is something like this:

```ini
sqlalchemy.url = sqlite:///%(here)s/tracim.sqlite
```

To know more about this, see [sqlalchemy documentation](http://docs.sqlalchemy.org/en/latest/core/engines.html).

Be careful, while SQLAlchemy supports many kind of Database, support from Tracim is __not__ guaranteed.
Tracim officially supports SQLite, PostgreSQL and MySQL.

## Debugging and Log

### Debugging parameters

For debugging, you can uncomment these 2 lines in '/backend/development.ini' to
enable the Pyramid debugging toolbar.
If you use it, you can seen one red button on right of the Tracim web interface.

```ini
#pyramid.includes =
#    pyramid_debugtoolbar
```

You can add this line to enable the Pyramid debugging mode for almost everything:

```ini
pyramid.debug_all = true
```

Hapic debug mode: this line is needed to get more explicit JSON errors.
The stacktrace of raised errors will be send through JSON. You can uncomment it by removing the hash sign:

```ini
# debug = True
```

```ini
pyramid.reload_templates = true
```

### Prod/Debug Configuration Example

To enable simple debug configuration:

```ini
[app:tracim_web]
...
pyramid.reload_templates = true
pyramid.debug_all = true
pyramid.includes =
    pyramid_debugtoolbar

[DEFAULT]
...
debug = True
```

Production configuration (no reload, no debugtoolbar):

```ini
[app:tracim_web]
...
pyramid.reload_templates = false
pyramid.debug_authorization = false
pyramid.debug_notfound = false
pyramid.debug_routematch = false

[DEFAULT]
...
debug = False
```

You can, of course, also set level of one of the different logger
to have more/less log about something.

```ini
[logger_sqlalchemy]
...
level = INFO
```

## Configure indexing and search to use Elasticsearch/Opensearch (Tracim v2.3+)

First, you need an Elasticsearch server. An easy way to have one with docker can be (don't use this for production):

```bash
# First build the elasticsearch-ingest image provided in tracim repository
cd tools_docker/elasticsearch_ingest
docker build -t elasticsearch-ingest .

# run the image
docker run -d -p 9200:9200 -p 9300:9300 -v esdata:/usr/share/elasticsearch -v esconfig:/usr/share/elasticsearch/config -e "discovery.type=single-node" -e "cluster.routing.allocation.disk.threshold_enabled=false" -e "ES_JAVA_OPTS=-Xms4g -Xmx4g" elasticsearch-ingest
```

Alternatively you can you Opensearch server instead:

```bash
# First build the opensearch-ingest image provided in tracim repository
cd tools_docker/opensearch_ingest
docker build -t opensearch-ingest .

# run the image
docker run -d -p 9200:9200 -p 9300:9300 -v osdata:/usr/share/opensearch -v osconfig:/usr/share/opensearch/config -e "discovery.type=single-node" -e "cluster.routing.allocation.disk.threshold_enabled=false" -e "DISABLE_INSTALL_DEMO_CONFIG=true" -e "DISABLE_SECURITY_PLUGIN=true" opensearch-ingest
```

You then need to setup the configuration file:

```ini
search.engine = elasticsearch
search.elasticsearch.host = localhost
search.elasticsearch.port = 9200
search.elasticsearch.index_alias_prefix = tracim
search.elasticsearch.use_ingest = True
```

Your Elasticsearch server needs to be running. You can then set up the index with:

```bash
tracimcli search index-create
```

You can (re)sync data with:

```bash
tracimcli search index-populate
```

You can delete the index using:

```bash
tracimcli search index-drop
```

If there is an update of Tracim, use this one to migrate the index (experimental, prefer delete, init, index mechanism):

```bash
tracimcli search index-upgrade-experimental
```

Your data are correctly indexed now, you can go to the Tracim UI and use the search mechanism.

## Collaborative Edition Online (Tracim v2.4+)

### Collaborative Edition Server

In Tracim v2.4, Collaborative Edition Online does support CollaboraOnline/LibreOfficeOnline.

It is tested with CollaboraOnline (professional version of Collabora), with [Collabora CODE](https://hub.docker.com/r/collabora/code) and with [LibreOfficeOnline](https://hub.docker.com/r/libreoffice/online). More information about CollaboraOnline [here](https://www.collaboraoffice.com/)
We do not support other collaborative edition online service for now but we do support the WOPI protocol, making support for WOPI-compatible software easy.

__To set up a `Collabora CODE` server using docker for testing purpose ([image](https://hub.docker.com/r/collabora/code)):__

note: you should replace <DOT_ESCAPED_DOMAIN_OF_TRACIM_API> with real value like `domain=tracim\\.mysuperdomain\\.com`):

```bash
sudo docker run -d -t -p 9980:9980 -e "domain=<DOT_ESCAPED_DOMAIN_OF_TRACIM_API>" -e "SLEEPFORDEBUGGER=0" -e "extra_params=--o:ssl.enable=false" --cap-add MKNOD --restart always collabora/code:4.2.6.2
```

⚠ Tracim is tested with version 4.0.5.2. Use the latest version at your own risk.

__To set up a `LibreOfficeOnline` server(rolling release, unstable ⚠️) using docker ([image](https://hub.docker.com/r/libreoffice/online)):__

```bash
sudo docker run -d -t -p 9980:9980 -e "domain=<DOT_ESCAPED_DOMAIN_OF_TRACIM_API>" -e "SLEEPFORDEBUGGER=0" -e "extra_params=--o:ssl.enable=false" --cap-add MKNOD --restart always libreoffice/online:master
```

ℹ️ All the information to set up a `Collabora CODE/ LibreofficelOnline` server can be found on the [official documentation](https://www.collaboraoffice.com/code/docker/)

⚠ Be really careful about configuring the domain parameter. As written at the [official documentation](https://www.collaboraoffice.com/code/docker/), dots should be escaped (e.g. `domain=.*\\.mysuperdomain\\.com`).

ℹ️ You can configure Collabora administration username/password too:

```bash
-e "username=admin" -e "password=S3cRet"
```

The administration interface is available at `https://<collabora_host>/loleaflet/dist/admin/admin.html`.

With a Collabora host, `<collabora_host>` may look like `collaboradomain.ndd` or `localhost:9980`

ℹ️ To avoid using automatic SSL/TLS encryption in Collabora, you should disable it:

```bash
-e "extra_params=--o:ssl.enable=false"
```

### Configuring Tracim in `development.ini`

To enable online edition on Tracim and allow communication with your edition software.

First you need to enable the edition on the API. To do that you have to add the application to app_enabled. For example:

Before:

```ini
app.enabled = contents/thread,contents/html-document,contents/folder,agenda
```

After:

```ini
app.enabled = contents/thread,contents/html-document,contents/folder,agenda,collaborative_document_edition
```

This application need contents/file application to work fully. You will have to add this application too. With our example:

Before:

```ini
app.enabled = contents/thread,contents/html-document,contents/folder,agenda,collaborative_document_edition
```

After:

```ini
app.enabled = contents/thread,contents/file,contents/html-document,contents/folder,agenda,collaborative_document_edition
```

Once the application enabled, you will have to specify which software you desire to use. So far Tracim only support Collabora.

```ini
collaborative_document_edition.software = collabora
```

Then you need to indicate the ip address of the server for the protocol `WOPI`:

```ini
collaborative_document_edition.collabora.base_url = <collabora_base_url>
```

with collabora_base_url can be value like `http://localhost:9980` or `http://mycollaboraserver.ndd`

Then you can set up default office document templates files, these templates will be the one used to create an empty document using Tracim online app.

Basic templates are provided by default with Tracim:

```ini
basic_setup.file_template_dir = %(here)s/tracim_backend/templates/open_documents
```

But you can change the default directory to use your templates files:

```ini
collaborative_document_edition.file_template_dir =  PATH_TO_YOUR_TEMPLATE_DIRECTORY
```

Filenames of the templates inside the directory are not relevant. Only their extensions matter and need to match the software's default extensions.
For instance, `CODE` edits `Libre Office` files, so extensions will be `odt`, `odp`, `ods`.

After all these changes in the configuration, you should restart every process (web, webdav, etc...).

## Call (Tracim v4.0+)

### Configuring Tracim in `development.ini`

To enable the call feature on Tracim.

First you need to enable the call feature:

```ini
call.enabled = True
```

#### Mandatory parameters

Then select a provider:

```ini
call.provider = jitsi_meet
```

Tracim is only supporting jitsi so far.

Once you have selected a provider you will have to select an url:

```ini
call.jitsi_meet.url = https://meet.jit.si
```

#### Facultative parameters

You can specify the time (in seconds) before the call is considered unanswered:

```ini
call.unanswered_timeout = 30
```

The default value is 30 seconds.

## User Custom Properties

It's possible to configure custom properties attached to user per instance, [read specific documentation
to know more about this feature](./user_custom_properties.md).

## Default agenda event description in the Frontend

It's possible to set a default agenda event description when creating an event in the agenda from Tracim.
Write the text you which to have as the default event description in a file and put its path in the corresponding parameter.
For instance:

```ini
agenda.pre_filled_event.description_file_path = %(here)s/tracim_backend/templates/pre-filled_agenda_event_description.txt
```

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

```ini
basic_setup.uploaded_files_storage_type = s3
uploaded_files.storage.s3.access_key_id =
uploaded_files.storage.s3.secret_access_key =
; Use this parameter to specify an alternative S3 storage back-end
# uploaded_files.storage.s3.endpoint_url = https://my_s3_storage.mydomain.tld
```

If you want to use your own S3 compatible back-end we recommend [minio](https://min.io) as we have tested its usage with Tracim.

You can find an example docker compose file for storing files in minio [here](../../tools_docker/docker-compose-minio.yml)

## Translation Feature

Tracim has a feature allowing translation of notes(html-documents) and comments through external translation service (only systran supported now)
To enable it in config file:

```ini
translation_service.enabled = True
translation_service.provider = systran
translation_service.systran.api_url = https://translate.systran.net/
translation_service.systran.api_key = your-systran-api-key
```

To avoid waiting too long for a translation request you can tune its timeout (in which case an error will be displayed):

```ini
# timeout is in seconds
translation_service.timeout = 5
```

## User Interface Customization

The user interface of Tracim can be customized. For instance, you can disable
the input that lets the user choose the parent space during space creation:

```ini
ui.spaces.creation.parent_space_choice.visible = False
```

By default, this parameter is set to `True`.

You can also defines the list of languages available to create code samples in the notes.

```ini
ui.notes.code_sample_languages = apacheconf:Apache Configuration,arduino:Arduino,aspnet:ASP.NET,bash:Bash,batch:Batch,bbcode:BBcode,c:C,clike:C-like,csharp:C#,cpp:C++,cobol:COBOL,css:CSS,css-extras:CSS Extras,csv:CSV,diff:Diff,django:Django/Jinja2,docker:Docker,erlang:Erlang,excel-formula:Excel Formula,fortran:Fortran,git:Git,haskell:Haskell,ignore:.ignore,ini:Ini,java:Java,javascript:JavaScript,jq:JQ,json:JSON,json5:JSON5,jsonp:JSONP,latex:LaTeX,lisp:Lisp,lua:Lua,makefile:Makefile,markdown:Markdown,markup:Markup,matlab:MATLAB,nginx:nginx,objectivec:Objective-C,ocaml:OCaml,pascal:Pascal,perl:Perl,php:PHP,phpdoc:PHPDoc,php-extras:PHP Extras,powershell:PowerShell,properties:.properties,python:Python,r:R,jsx:React JSX,tsx:React TSX,regex:Regex,ruby:Ruby,rust:Rust,sql:SQL,vbnet:VB.Net,vim:vim,visual-basic:Visual Basic,yaml:YAML,wiki:Wiki markup
```

## User online status and limitation

You may limit the number of online users on your instance. If the maximum is
reached, an error message will be shown to users opening a Tracim page.
By default, no limitation is enforced (value: 0).

```ini
limitation.maximum_online_users = 0
```

A customized message can be shown to the user using the following parameter:

```ini
limitation.maximum_online_users_message = We suggest you contact your manager to upgrade your offer:<br /><b>Leslie Doe</b>, <a href="tel:+336123456789">+336123456789</a>, <a href="mailto:leslie.doe@example.org">leslie.doe@example.org</a>
```

The delay in seconds after which a user is considered offline after closing the
last browser tab can be tweaked with the following setting.
NOTE: this setting is experimental and may be removed without notice in a
later version of Tracim.

```ini
user.online_timeout = 10
```

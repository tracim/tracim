# Tracim configuration parameters which can be given as an environment variable

Variables, as written in `Variable name in configuration file` column are explained in [tracim/backend/development.ini.sample](https://github.com/tracim/tracim/blob/master/backend/development.ini.sample).

⚠️ These are only Tracim environment variables. You can find more environment variables for docker start on the [tracim/docs/administration/installation/tracim_with_docker.md](https://github.com/tracim/tracim/blob/master/docs/administration/installation/tracim_with_docker.md) page ⚠️


The following table contains:
- `Environment variable name`: variables typically used in `docker-compose.yml`
- `Variable name in configuration file`: can be set directly in `development.ini`
- `Displayed configuration name`: visible when tracim starts

| Environment variable name                                                 | Variable name in configuration file                            | Displayed configuration name                                       |
|---------------------------------------------------------------------------|----------------------------------------------------------------|--------------------------------------------------------------------|
| TRACIM_APP__ENABLED                                                       | app.enabled                                                    | APP__ENABLED                                                       |
| TRACIM_SQLALCHEMY__URL                                                    | sqlalchemy.url                                                 | SQLALCHEMY__URL                                                    |
| TRACIM_DEFAULT_LANG                                                       | default_lang                                                   | DEFAULT_LANG                                                       |
| TRACIM_PREVIEW_CACHE_DIR                                                  | preview_cache_dir                                              | PREVIEW_CACHE_DIR                                                  |
| TRACIM_AUTH_TYPES                                                         | auth_types                                                     | AUTH_TYPES                                                         |
| TRACIM_USER__PROFILE__READ_ONLY_FIELDS__INTERNAL                          | user.profile.read_only_fields.internal                         | USER__PROFILE__READ_ONLY_FIELDS__INTERNAL                          |
| TRACIM_REMOTE_USER_HEADER                                                 | remote_user_header                                             | REMOTE_USER_HEADER                                                 |
| TRACIM_CONFIG__FILEPATH                                                   | config.filepath                                                | CONFIG__FILEPATH                                                   |
| TRACIM_API__KEY                                                           | api.key                                                        | API__KEY                                                           |
| TRACIM_SESSION__TYPE                                                      | session.type                                                   | SESSION__TYPE                                                      |
| TRACIM_SESSION__URL                                                       | session.url                                                    | SESSION__URL                                                       |
| TRACIM_SESSION__URLS                                                      | session.urls                                                   | SESSION__URLS                                                      |
| TRACIM_SESSION__DATA_DIR                                                  | session.data_dir                                               | SESSION__DATA_DIR                                                  |
| TRACIM_SESSION__LOCK_DIR                                                  | session.lock_dir                                               | SESSION__LOCK_DIR                                                  |
| TRACIM_SESSION__HTTPONLY                                                  | session.httponly                                               | SESSION__HTTPONLY                                                  |
| TRACIM_SESSION__SECURE                                                    | session.secure                                                 | SESSION__SECURE                                                    |
| TRACIM_SESSION__USERNAME                                                  | session.username                                               | SESSION__USERNAME                                                  |
| TRACIM_SESSION__PASSWORD                                                  | session.password                                               | SESSION__PASSWORD                                                  |
| TRACIM_WEBSITE__TITLE                                                     | website.title                                                  | WEBSITE__TITLE                                                     |
| TRACIM_WEBSITE__DESCRIPTION                                               | website.description                                            | WEBSITE__DESCRIPTION                                               |
| TRACIM_WEBSITE__USAGE_CONDITIONS                                          | website.usage_conditions                                       | WEBSITE__USAGE_CONDITIONS                                          |
| TRACIM_WEBSITE__WELCOME_PAGE                                              | website.welcome_page                                           | WEBSITE__WELCOME_PAGE                                              |
| TRACIM_WEBSITE__WELCOME_PAGE_STYLE                                        | website.welcome_page_style                                     | WEBSITE__WELCOME_PAGE_STYLE                                        |
| TRACIM_WEB__NOTIFICATIONS__EXCLUDED                                       | web.notifications.excluded                                     | WEB__NOTIFICATIONS__EXCLUDED                                       |
| TRACIM_WEBSITE__BASE_URL                                                  | website.base_url                                               | WEBSITE__BASE_URL                                                  |
| TRACIM_API__BASE_URL                                                      | api.base_url                                                   | API__BASE_URL                                                      |
| TRACIM_CORS__ACCESS_CONTROL_ALLOWED_ORIGIN                                | cors.access-control-allowed-origin                             | CORS__ACCESS_CONTROL_ALLOWED_ORIGIN                                |
| TRACIM_DEFAULT_ANONYMIZED_USER_DISPLAY_NAME                               | default_anonymized_user_display_name                           | DEFAULT_ANONYMIZED_USER_DISPLAY_NAME                               |
| TRACIM_USER__AUTH_TOKEN__VALIDITY                                         | user.auth_token.validity                                       | USER__AUTH_TOKEN__VALIDITY                                         |
| TRACIM_USER__RESET_PASSWORD__TOKEN_LIFETIME                               | user.reset_password.token_lifetime                             | USER__RESET_PASSWORD__TOKEN_LIFETIME                               |
| TRACIM_USER__DEFAULT_PROFILE                                              | user.default_profile                                           | USER__DEFAULT_PROFILE                                              |
| TRACIM_USER__SELF_REGISTRATION__ENABLED                                   | user.self_registration.enabled                                 | USER__SELF_REGISTRATION__ENABLED                                   |
| TRACIM_USER__ONLINE_TIMEOUT                                               | user.online_timeout                                            | USER__ONLINE_TIMEOUT                                               |
| TRACIM_USER__CUSTOM_PROPERTIES__JSON_SCHEMA_FILE_PATH                     | user.custom_properties.json_schema_file_path                   | USER__CUSTOM_PROPERTIES__JSON_SCHEMA_FILE_PATH                     |
| TRACIM_USER__CUSTOM_PROPERTIES__UI_SCHEMA_FILE_PATH                       | user.custom_properties.ui_schema_file_path                     | USER__CUSTOM_PROPERTIES__UI_SCHEMA_FILE_PATH                       |
| TRACIM_USER__CUSTOM_PROPERTIES__TRANSLATIONS_DIR_PATH                     | user.custom_properties.translations_dir_path                   | USER__CUSTOM_PROPERTIES__TRANSLATIONS_DIR_PATH                     |
| TRACIM_WORKSPACE__ALLOWED_ACCESS_TYPES                                    | workspace.allowed_access_types                                 | WORKSPACE__ALLOWED_ACCESS_TYPES                                    |
| TRACIM_WORKSPACE__JOIN__MAX_MESSAGES_HISTORY_COUNT                        | workspace.join.max_messages_history_count                      | WORKSPACE__JOIN__MAX_MESSAGES_HISTORY_COUNT                        |
| TRACIM_KNOWN_MEMBERS__FILTER                                              | known_members.filter                                           | KNOWN_MEMBERS__FILTER                                              |
| TRACIM_DEBUG                                                              | debug                                                          | DEBUG                                                              |
| TRACIM_BUILD_VERSION                                                      | build_version                                                  | BUILD_VERSION                                                      |
| TRACIM_PREVIEW__JPG__RESTRICTED_DIMS                                      | preview.jpg.restricted_dims                                    | PREVIEW__JPG__RESTRICTED_DIMS                                      |
| TRACIM_PREVIEW__JPG__ALLOWED_DIMS                                         | preview.jpg.allowed_dims                                       | PREVIEW__JPG__ALLOWED_DIMS                                         |
| TRACIM_FRONTEND__SERVE                                                    | frontend.serve                                                 | FRONTEND__SERVE                                                    |
| TRACIM_FRONTEND__CACHE_TOKEN                                              | frontend.cache_token                                           | FRONTEND__CACHE_TOKEN                                              |
| TRACIM_BACKEND__I18N_FOLDER_PATH                                          | backend.i18n_folder_path                                       | BACKEND__I18N_FOLDER_PATH                                          |
| TRACIM_FRONTEND__DIST_FOLDER_PATH                                         | frontend.dist_folder_path                                      | FRONTEND__DIST_FOLDER_PATH                                         |
| TRACIM_IFRAME__WHITELIST                                                  | iframe.whitelist                                               | IFRAME__WHITELIST                                                  |
| TRACIM_COLOR__CONFIG_FILE_PATH                                            | color.config_file_path                                         | COLOR__CONFIG_FILE_PATH                                            |
| TRACIM_APP_CUSTOM_ACTIONS__CONFIG_FILE                                    | app_custom_actions.config_file                                 | APP_CUSTOM_ACTIONS__CONFIG_FILE                                    |
| TRACIM_RICH_TEXT_PREVIEW__CSS_PATH                                        | rich_text_preview.css_path                                     | RICH_TEXT_PREVIEW__CSS_PATH                                        |
| TRACIM_RICH_TEXT_PREVIEW__TEMPLATE_PATH                                   | rich_text_preview.template_path                                | RICH_TEXT_PREVIEW__TEMPLATE_PATH                                   |
| TRACIM_PLUGIN__FOLDER_PATH                                                | plugin.folder_path                                             | PLUGIN__FOLDER_PATH                                                |
| TRACIM_FRONTEND__CUSTOM_TOOLBOX_FOLDER_PATH                               | frontend.custom_toolbox_folder_path                            | FRONTEND__CUSTOM_TOOLBOX_FOLDER_PATH                               |
| TRACIM_URL_PREVIEW__FETCH_TIMEOUT                                         | url_preview.fetch_timeout                                      | URL_PREVIEW__FETCH_TIMEOUT                                         |
| TRACIM_URL_PREVIEW__MAX_CONTENT_LENGTH                                    | url_preview.max_content_length                                 | URL_PREVIEW__MAX_CONTENT_LENGTH                                    |
| TRACIM_UI__SPACES__CREATION__PARENT_SPACE_CHOICE__VISIBLE                 | ui.spaces.creation.parent_space_choice.visible                 | UI__SPACES__CREATION__PARENT_SPACE_CHOICE__VISIBLE                 |
| TRACIM_PREVIEW__SKIPLIST                                                  | preview.skiplist                                               | PREVIEW__SKIPLIST                                                  |
| TRACIM_UI__NOTES__CODE_SAMPLE_LANGUAGES                                   | ui.notes.code_sample_languages                                 | UI__NOTES__CODE_SAMPLE_LANGUAGES                                   |
| TRACIM_DEPOT_STORAGE_DIR                                                  | depot_storage_dir                                              | DEPOT_STORAGE_DIR                                                  |
| TRACIM_DEPOT_STORAGE_NAME                                                 | depot_storage_name                                             | DEPOT_STORAGE_NAME                                                 |
| TRACIM_UPLOADED_FILES__STORAGE__STORAGE_NAME                              | uploaded_files.storage.storage_name                            | UPLOADED_FILES__STORAGE__STORAGE_NAME                              |
| TRACIM_UPLOADED_FILES__STORAGE__STORAGE_TYPE                              | uploaded_files.storage.storage_type                            | UPLOADED_FILES__STORAGE__STORAGE_TYPE                              |
| TRACIM_UPLOADED_FILES__STORAGE__LOCAL__STORAGE_PATH                       | uploaded_files.storage.local.storage_path                      | UPLOADED_FILES__STORAGE__LOCAL__STORAGE_PATH                       |
| TRACIM_UPLOADED_FILES__STORAGE__S3__ACCESS_KEY_ID                         | uploaded_files.storage.s3.access_key_id                        | UPLOADED_FILES__STORAGE__S3__ACCESS_KEY_ID                         |
| TRACIM_UPLOADED_FILES__STORAGE__S3__SECRET_ACCESS_KEY                     | uploaded_files.storage.s3.secret_access_key                    | UPLOADED_FILES__STORAGE__S3__SECRET_ACCESS_KEY                     |
| TRACIM_UPLOADED_FILES__STORAGE__S3__POLICY                                | uploaded_files.storage.s3.policy                               | UPLOADED_FILES__STORAGE__S3__POLICY                                |
| TRACIM_UPLOADED_FILES__STORAGE__S3__ENDPOINT_URL                          | uploaded_files.storage.s3.endpoint_url                         | UPLOADED_FILES__STORAGE__S3__ENDPOINT_URL                          |
| TRACIM_UPLOADED_FILES__STORAGE__S3__BUCKET                                | uploaded_files.storage.s3.bucket                               | UPLOADED_FILES__STORAGE__S3__BUCKET                                |
| TRACIM_UPLOADED_FILES__STORAGE__S3__REGION_NAME                           | uploaded_files.storage.s3.region_name                          | UPLOADED_FILES__STORAGE__S3__REGION_NAME                           |
| TRACIM_UPLOADED_FILES__STORAGE__S3__STORAGE_CLASS                         | uploaded_files.storage.s3.storage_class                        | UPLOADED_FILES__STORAGE__S3__STORAGE_CLASS                         |
| TRACIM_LIMITATION__SHAREDSPACE_PER_USER                                   | limitation.sharedspace_per_user                                | LIMITATION__SHAREDSPACE_PER_USER                                   |
| TRACIM_LIMITATION__CONTENT_LENGTH_FILE_SIZE                               | limitation.content_length_file_size                            | LIMITATION__CONTENT_LENGTH_FILE_SIZE                               |
| TRACIM_LIMITATION__WORKSPACE_SIZE                                         | limitation.workspace_size                                      | LIMITATION__WORKSPACE_SIZE                                         |
| TRACIM_LIMITATION__USER_DEFAULT_ALLOWED_SPACE                             | limitation.user_default_allowed_space                          | LIMITATION__USER_DEFAULT_ALLOWED_SPACE                             |
| TRACIM_LIMITATION__MAXIMUM_ONLINE_USERS                                   | limitation.maximum_online_users                                | LIMITATION__MAXIMUM_ONLINE_USERS                                   |
| TRACIM_LIMITATION__MAXIMUM_ONLINE_USERS_MESSAGE                           | limitation.maximum_online_users_message                        | LIMITATION__MAXIMUM_ONLINE_USERS_MESSAGE                           |
| TRACIM_JOBS__PROCESSING_MODE                                              | jobs.processing_mode                                           | JOBS__PROCESSING_MODE                                              |
| TRACIM_JOBS__ASYNC__REDIS__HOST                                           | jobs.async.redis.host                                          | JOBS__ASYNC__REDIS__HOST                                           |
| TRACIM_JOBS__ASYNC__REDIS__PORT                                           | jobs.async.redis.port                                          | JOBS__ASYNC__REDIS__PORT                                           |
| TRACIM_JOBS__ASYNC__REDIS__DB                                             | jobs.async.redis.db                                            | JOBS__ASYNC__REDIS__DB                                             |
| TRACIM_LIVE_MESSAGES__CONTROL_ZMQ_URI                                     | live_messages.control_zmq_uri                                  | LIVE_MESSAGES__CONTROL_ZMQ_URI                                     |
| TRACIM_LIVE_MESSAGES__PUSH_ZMQ_URI                                        | live_messages.push_zmq_uri                                     | LIVE_MESSAGES__PUSH_ZMQ_URI                                        |
| TRACIM_LIVE_MESSAGES__PUB_ZMQ_URI                                         | live_messages.pub_zmq_uri                                      | LIVE_MESSAGES__PUB_ZMQ_URI                                         |
| TRACIM_LIVE_MESSAGES__STATS_ZMQ_URI                                       | live_messages.stats_zmq_uri                                    | LIVE_MESSAGES__STATS_ZMQ_URI                                       |
| TRACIM_LIVE_MESSAGES__BLOCKING_PUBLISH                                    | live_messages.blocking_publish                                 | LIVE_MESSAGES__BLOCKING_PUBLISH                                    |
| TRACIM_EMAIL__NOTIFICATION__TYPE_ON_INVITATION                            | email.notification.type_on_invitation                          | EMAIL__NOTIFICATION__TYPE_ON_INVITATION                            |
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
| TRACIM_EMAIL__NOTIFICATION__SUMMARY__TEMPLATE__HTML                       | email.notification.summary.template.html                       | EMAIL__NOTIFICATION__SUMMARY__TEMPLATE__HTML                       |
| TRACIM_EMAIL__NOTIFICATION__ACTIVATED                                     | email.notification.activated                                   | EMAIL__NOTIFICATION__ACTIVATED                                     |
| TRACIM_EMAIL__NOTIFICATION__SMTP__SERVER                                  | email.notification.smtp.server                                 | EMAIL__NOTIFICATION__SMTP__SERVER                                  |
| TRACIM_EMAIL__NOTIFICATION__SMTP__PORT                                    | email.notification.smtp.port                                   | EMAIL__NOTIFICATION__SMTP__PORT                                    |
| TRACIM_EMAIL__NOTIFICATION__SMTP__USER                                    | email.notification.smtp.user                                   | EMAIL__NOTIFICATION__SMTP__USER                                    |
| TRACIM_EMAIL__NOTIFICATION__SMTP__PASSWORD                                | email.notification.smtp.password                               | EMAIL__NOTIFICATION__SMTP__PASSWORD                                |
| TRACIM_EMAIL__NOTIFICATION__SMTP__AUTHENTICATION                          | email.notification.smtp.authentication                         | EMAIL__NOTIFICATION__SMTP__AUTHENTICATION                          |
| TRACIM_EMAIL__NOTIFICATION__SMTP__USE_IMPLICIT_SSL                        | email.notification.smtp.use_implicit_ssl                       | EMAIL__NOTIFICATION__SMTP__USE_IMPLICIT_SSL                        |
| TRACIM_EMAIL__NOTIFICATION__SMTP__ENCRYPTION                              | email.notification.smtp.encryption                             | EMAIL__NOTIFICATION__SMTP__ENCRYPTION                              |
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
| TRACIM_LDAP_BIND_ANONYMOUS                                                | ldap_bind_anonymous                                            | LDAP_BIND_ANONYMOUS                                                |
| TRACIM_LDAP_TLS                                                           | ldap_tls                                                       | LDAP_TLS                                                           |
| TRACIM_LDAP_USER_BASE_DN                                                  | ldap_user_base_dn                                              | LDAP_USER_BASE_DN                                                  |
| TRACIM_LDAP_MAIL_ATTRIBUTE                                                | ldap_mail_attribute                                            | LDAP_MAIL_ATTRIBUTE                                                |
| TRACIM_LDAP_USERNAME_ATTRIBUTE                                            | ldap_username_attribute                                        | LDAP_USERNAME_ATTRIBUTE                                            |
| TRACIM_LDAP_NAME_ATTRIBUTE                                                | ldap_name_attribute                                            | LDAP_NAME_ATTRIBUTE                                                |
| TRACIM_WEBDAV__UI__ENABLED                                                | webdav.ui.enabled                                              | WEBDAV__UI__ENABLED                                                |
| TRACIM_WEBDAV__BASE_URL                                                   | webdav.base_url                                                | WEBDAV__BASE_URL                                                   |
| TRACIM_WEBDAV__VERBOSE__LEVEL                                             | webdav.verbose.level                                           | WEBDAV__VERBOSE__LEVEL                                             |
| TRACIM_WEBDAV__ROOT_PATH                                                  | webdav.root_path                                               | WEBDAV__ROOT_PATH                                                  |
| TRACIM_WEBDAV__BLOCK_SIZE                                                 | webdav.block_size                                              | WEBDAV__BLOCK_SIZE                                                 |
| TRACIM_WEBDAV__DIR_BROWSER__ENABLED                                       | webdav.dir_browser.enabled                                     | WEBDAV__DIR_BROWSER__ENABLED                                       |
| TRACIM_WEBDAV__DIR_BROWSER__FOOTER                                        | webdav.dir_browser.footer                                      | WEBDAV__DIR_BROWSER__FOOTER                                        |
| TRACIM_SEARCH__ENGINE                                                     | search.engine                                                  | SEARCH__ENGINE                                                     |
| TRACIM_SEARCH__ELASTICSEARCH__INDEX_ALIAS_PREFIX                          | search.elasticsearch.index_alias_prefix                        | SEARCH__ELASTICSEARCH__INDEX_ALIAS_PREFIX                          |
| TRACIM_SEARCH__ELASTICSEARCH__INDEX_PATTERN_TEMPLATE                      | search.elasticsearch.index_pattern_template                    | SEARCH__ELASTICSEARCH__INDEX_PATTERN_TEMPLATE                      |
| TRACIM_SEARCH__ELASTICSEARCH__USE_INGEST                                  | search.elasticsearch.use_ingest                                | SEARCH__ELASTICSEARCH__USE_INGEST                                  |
| TRACIM_SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_WHITELIST                  | search.elasticsearch.ingest.mimetype_whitelist                 | SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_WHITELIST                  |
| TRACIM_SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_BLACKLIST                  | search.elasticsearch.ingest.mimetype_blacklist                 | SEARCH__ELASTICSEARCH__INGEST__MIMETYPE_BLACKLIST                  |
| TRACIM_SEARCH__ELASTICSEARCH__INGEST__SIZE_LIMIT                          | search.elasticsearch.ingest.size_limit                         | SEARCH__ELASTICSEARCH__INGEST__SIZE_LIMIT                          |
| TRACIM_SEARCH__ELASTICSEARCH__HOST                                        | search.elasticsearch.host                                      | SEARCH__ELASTICSEARCH__HOST                                        |
| TRACIM_SEARCH__ELASTICSEARCH__PORT                                        | search.elasticsearch.port                                      | SEARCH__ELASTICSEARCH__PORT                                        |
| TRACIM_SEARCH__ELASTICSEARCH__REQUEST_TIMEOUT                             | search.elasticsearch.request_timeout                           | SEARCH__ELASTICSEARCH__REQUEST_TIMEOUT                             |
| TRACIM_SEARCH__ELASTICSEARCH__SSL__ACTIVATED                              | search.elasticsearch.ssl.activated                             | SEARCH__ELASTICSEARCH__SSL__ACTIVATED                              |
| TRACIM_SEARCH__ELASTICSEARCH__SSL__CA_CERTS                               | search.elasticsearch.ssl.ca_certs                              | SEARCH__ELASTICSEARCH__SSL__CA_CERTS                               |
| TRACIM_SEARCH__ELASTICSEARCH__BASIC_AUTH__USERNAME                        | search.elasticsearch.basic_auth.username                       | SEARCH__ELASTICSEARCH__BASIC_AUTH__USERNAME                        |
| TRACIM_SEARCH__ELASTICSEARCH__BASIC_AUTH__PASSWORD                        | search.elasticsearch.basic_auth.password                       | SEARCH__ELASTICSEARCH__BASIC_AUTH__PASSWORD                        |
| TRACIM_CONTENT_SECURITY_POLICY__ENABLED                                   | content_security_policy.enabled                                | CONTENT_SECURITY_POLICY__ENABLED                                   |
| TRACIM_CONTENT_SECURITY_POLICY__REPORT_URI                                | content_security_policy.report_uri                             | CONTENT_SECURITY_POLICY__REPORT_URI                                |
| TRACIM_CONTENT_SECURITY_POLICY__REPORT_ONLY                               | content_security_policy.report_only                            | CONTENT_SECURITY_POLICY__REPORT_ONLY                               |
| TRACIM_CONTENT_SECURITY_POLICY__ADDITIONAL_DIRECTIVES                     | content_security_policy.additional_directives                  | CONTENT_SECURITY_POLICY__ADDITIONAL_DIRECTIVES                     |
| TRACIM_TRANSLATION_SERVICE__ENABLED                                       | translation_service.enabled                                    | TRANSLATION_SERVICE__ENABLED                                       |
| TRACIM_TRANSLATION_SERVICE__TIMEOUT                                       | translation_service.timeout                                    | TRANSLATION_SERVICE__TIMEOUT                                       |
| TRACIM_TRANSLATION_SERVICE__PROVIDER                                      | translation_service.provider                                   | TRANSLATION_SERVICE__PROVIDER                                      |
| TRACIM_TRANSLATION_SERVICE__SYSTRAN__API_URL                              | translation_service.systran.api_url                            | TRANSLATION_SERVICE__SYSTRAN__API_URL                              |
| TRACIM_TRANSLATION_SERVICE__SYSTRAN__API_KEY                              | translation_service.systran.api_key                            | TRANSLATION_SERVICE__SYSTRAN__API_KEY                              |
| TRACIM_TRANSLATION_SERVICE__TARGET_LANGUAGES                              | translation_service.target_languages                           | TRANSLATION_SERVICE__TARGET_LANGUAGES                              |
| TRACIM_CALL__PROVIDER                                                     | call.provider                                                  | CALL__PROVIDER                                                     |
| TRACIM_CALL__ENABLED                                                      | call.enabled                                                   | CALL__ENABLED                                                      |
| TRACIM_CALL__JITSI_MEET__URL                                              | call.jitsi_meet.url                                            | CALL__JITSI_MEET__URL                                              |
| TRACIM_CALL__UNANSWERED_TIMEOUT                                           | call.unanswered_timeout                                        | CALL__UNANSWERED_TIMEOUT                                           |
| TRACIM_CALDAV__RADICALE_PROXY__BASE_URL                                   | caldav.radicale_proxy.base_url                                 | CALDAV__RADICALE_PROXY__BASE_URL                                   |
| TRACIM_CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER                       | caldav.radicale.storage.filesystem_folder                      | CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER                       |
| TRACIM_CALDAV__PRE_FILLED_EVENT__DESCRIPTION_FILE_PATH                    | caldav.pre_filled_event.description_file_path                  | CALDAV__PRE_FILLED_EVENT__DESCRIPTION_FILE_PATH                    |
| TRACIM_COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE                           | collaborative_document_edition.software                        | COLLABORATIVE_DOCUMENT_EDITION__SOFTWARE                           |
| TRACIM_COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL                | collaborative_document_edition.collabora.base_url              | COLLABORATIVE_DOCUMENT_EDITION__COLLABORA__BASE_URL                |
| TRACIM_COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR                  | collaborative_document_edition.file_template_dir               | COLLABORATIVE_DOCUMENT_EDITION__FILE_TEMPLATE_DIR                  |
| TRACIM_COLLABORATIVE_DOCUMENT_EDITION__ENABLED_EXTENSIONS                 | collaborative_document_edition.enabled_extensions              | COLLABORATIVE_DOCUMENT_EDITION__ENABLED_EXTENSIONS                 |
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


## How to generate the above table

This table is generated using:

```bash
tracimcli dev parameters list --template "| {env_var_name: <74}| {config_file_name: <63}| {config_name: <67}|"
```

⚠️ The generated list is based on your `development.ini` file. ⚠️

To update the list below you will need to:

- Activate all applications (`app.enabled` setting)
- Set `collaborative_document_edition.software` to `collabora`
- Give a value to `collaborative_document_edition.collabora.base_url`

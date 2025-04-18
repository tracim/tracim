```bash
.  
├── administration  
│   ├── configuration  
│   │   ├── customisation  
│   │   │   ├── branding.md  
│   │   │   └── user_custom_properties.md  
│   │   ├── plugins  
│   │   │   ├── hello_world_plugin.py  
│   │   │   ├── Official_Backend_Plugins.md  
│   │   │   └── plugins.md  
│   │   └── storage  
│   │       ├── minio-encryption.md  
│   │       └── webdav.md  
│   ├── exploitation  
│   │   ├── cli.md  
│   │   └── upgrade  
│   │       ├── how_to_migrate_database.md  
│   │       ├── how_to_migrate_file_storage.md  
│   │       └── migrate_from_v1.md  
│   └── installation  
│       ├── apache_and_uwsgi_configuration.md  
│       ├── BETA_testing_tracim_with_shibboleth_idp_in_docker.md  
│       ├── elasticsearch_docker_image_with_ingest_plugin.md  
│       ├── how_to_set_up_postgresql_database.md  
│       ├── install_backend.md  
│       ├── opensearch_docker_image_with_ingest_plugin.md  
│       ├── running_tracim_components_locally.md  
│       ├── settings_main_topics.md  
│       ├── tracim_with_docker.md  
│       └── using_environment_variables_instead_of_configuration_parameters.md  
├── api-integration  
│   ├── api.md  
│   └── tlm_event_socket.md  
├── DCO  
├── development  
│   ├── advanced  
│   │   ├── backend_server_setup.md  
│   │   ├── how_to_create_database_migration.md  
│   │   ├── live_message_server_setup.md  
│   │   ├── mentions.md  
│   │   ├── tables.png  
│   │   ├── tracim_tables.md  
│   │   └── yarn_scripts.md  
│   ├── backend_build.md  
│   ├── before_push.md  
│   ├── frontend_build.md  
│   ├── getting_started.md  
│   ├── i18n  
│   │   ├── i18n-backend.md  
│   │   └── i18n-frontend.md  
│   ├── setup  
│   │   └── devtools.md  
│   └── test  
│       ├── concourse.md  
│       ├── docker.md  
│       └── testing.md  
├── index.md  
├── licences  
│   ├── LICENSE_AGPLv3  
│   ├── LICENSE_CC_BY_SA  
│   ├── LICENSE_LGPLv3  
│   └── LICENSE_MIT  
├── logos  
│   ├── logo_browserstack.png  
│   ├── logo_tracim.png  
│   └── logo_weblate.png  
├── overview  
│   ├── known_issues.md  
│   └── roles.md  
└── README.md  
```

List generated with
```bash
indextmp="$(tail -7 index.md)" && echo '```bash' > index.md && tree --noreport | sed "s|$|  |g" >> index.md && echo '```' >> index.md && echo "$indextmp" >> index.md
```

There are two spaces at the end of each lines to force a linebreak in markdown.

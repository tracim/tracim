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
│   ├── backend  
│   │   ├── build.md  
│   │   ├── database  
│   │   │   ├── migrations.md  
│   │   │   ├── schema.md  
│   │   │   └── tables_diagram.png  
│   │   ├── features  
│   │   │   └── mentions.md  
│   │   └── setup  
│   │       ├── live_message_setup.md  
│   │       └── server_setup.md  
│   ├── frontend  
│   │   ├── build.md  
│   │   └── scripts.md  
│   ├── getting_started  
│   │   ├── before_push.md  
│   │   └── index.md  
│   ├── i18n  
│   │   ├── i18n-backend.md  
│   │   └── i18n-frontend.md  
│   ├── misc  
│   │   └── devtools.md  
│   └── test  
│       ├── backend_test.md  
│       ├── concourse.md  
│       ├── docker.md  
│       └── frontend_test.md  
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

There are two spaces at the end of each line to force a linebreak in Markdown.

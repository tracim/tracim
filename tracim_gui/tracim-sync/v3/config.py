# coding: utf8

from tracim_sync_exceptions import ConfigException



class Config(object):

    BASE_FOLDER = "/tmp/tracym-sync"
    DB_PATH = "/tmp/test.sqlite"
    INSTANCES = {
        "tracim": {
            "url": "http://localhost:6543",
            "login": "admin@admin.admin",
            "password": "admin@admin.admin",
            "webdav": {
                "url": "http://localhost:3030"
            },
            'excluded_workspaces': [],
            'excluded_folders': [],
        }
    }

    def get_instance(self, instance_label: str):
        return self.INSTANCES[instance_label]


class ConfigParser(object):

    def load_config_from_file(self, file_path=''):
        # TODO - load everything from a file config.yaml
        config = Config()
        self._check(config)
        return config

    def _check(self, config: Config):
        if not config.BASE_FOLDER:
            raise ConfigException(
                'Le dossier de syncronisation local n\'est pas configuré'
            )

        if not config.DB_PATH:
            raise ConfigException(
                'Le chemin vers la base de données n\'est pas configuré'
            )

        if not config.INSTANCES:
            raise ConfigException(
                'Il faut définir au moins une instance '
                'de tracim à synchroniser'
            )

        for instance_name, params in config.INSTANCES.items():
            if not params.get('url'):
                raise ConfigException(
                    'Une url doit etre défini pour l\'instance {}'
                    .format(instance_name)
                )

            token = not(params.get('token'))
            basic_auth = not (params.get('login') and params.get('password'))

            if not (token or basic_auth):
                raise ConfigException(
                    'Un token de connexion ou un login/password doit etre '
                    'défini pour l\'instance {}'.format(instance_name)
                )

            if not (params.get('webdav') and params.get('webdav').get('url')):
                raise ConfigException(
                    'Une url pour le serveur webdav doit etre'
                    'défini pour l\'instance {}'.format(instance_name)
                )

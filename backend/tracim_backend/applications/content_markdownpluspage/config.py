from tracim_backend import CFG
from tracim_backend.lib.utils.app import TracimAppConfig


class ContentMarkdownPlusPageAppConfig(TracimAppConfig):
    def load_config(self, app_config: CFG) -> CFG:
        return app_config

    def check_config(self, app_config: CFG) -> CFG:
        return app_config

from pyramid.config import Configurator


class Controller(object):
    def bind(self, configurator: Configurator):
        raise NotImplementedError()

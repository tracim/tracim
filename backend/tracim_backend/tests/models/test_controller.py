# coding=utf-8
from pyramid.config import Configurator
import pytest

from tracim_backend.views.controllers import Controller


class TestControllerModel(object):
    """
    Test for Controller object
    """

    def test_unit__bind__err__not_implemented(self):
        controller = Controller()
        configurator = Configurator()
        with pytest.raises(NotImplementedError):
            controller.bind(configurator)

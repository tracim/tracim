# -*- coding: utf-8 -*-
from babel.core import default_locale


def fake_translator(text: str):
    # TODO - G.M - 27-03-2018 - [i18n] Reconnect true internationalization
    return text


def get_locale():
    # TODO - G.M - 27-03-2018 - [i18n] Reconnect true internationalization
    return default_locale('LC_TIME')

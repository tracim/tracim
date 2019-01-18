# coding: utf-8


class ConnectionException(Exception):

    def __init__(self, message: str):
        self.message = message


class ConfigException(Exception):

    def __init__(self, message: str):
        self.message = message
